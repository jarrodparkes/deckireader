(() => {
  "use strict";

  const LANG_KEY = "deckireader_lang";
  const THEME_KEY = "deckireader_theme";
  const THEMES = ["system", "light", "dark"];
  const SUPPORTED_LANGS = ["en", "ja"];
  const GENRES = [
    "literary",
    "mystery",
    "sf",
    "fantasy",
    "essay",
    "nonfiction",
    "manga",
    "other"
  ];
  const GENRE_KEYS = {
    literary: "genreLiterary",
    mystery: "genreMystery",
    sf: "genreSf",
    fantasy: "genreFantasy",
    essay: "genreEssay",
    nonfiction: "genreNonfiction",
    manga: "genreManga",
    other: "genreOther"
  };
  const STATUS_KEYS = {
    reading: "statusReading",
    finished: "statusFinished",
    planned: "statusPlanned"
  };
  const STRINGS = window.DeckiReaderStrings;

  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  let currentLang = detectLang();
  let currentTheme = detectTheme();

  const $ = id => document.getElementById(id);

  function detectLang() {
    const saved = localStorage.getItem(LANG_KEY);
    if (SUPPORTED_LANGS.includes(saved)) return saved;
    return (navigator.language || "").toLowerCase().startsWith("ja") ? "ja" : "en";
  }

  function detectTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    return THEMES.includes(saved) ? saved : "system";
  }

  function applyTheme() {
    const dark = currentTheme === "dark" || (currentTheme === "system" && darkQuery.matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }

  function syncThemeUI() {
    document.querySelectorAll(".theme-switch [data-theme-choice]").forEach(btn => {
      btn.setAttribute(
        "aria-pressed",
        String(btn.getAttribute("data-theme-choice") === currentTheme)
      );
    });
  }

  function setTheme(theme) {
    if (!THEMES.includes(theme) || theme === currentTheme) return;
    currentTheme = theme;
    if (theme === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
    applyTheme();
    syncThemeUI();
  }

  function t(key, vars = {}) {
    return formatString(
      (STRINGS[currentLang] || STRINGS.en)[key] ?? STRINGS.en[key] ?? key,
      vars
    );
  }

  function formatString(text, vars = {}) {
    return String(text).replace(/\{(\w+)\}/g, (_, name) =>
      Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : `{${name}}`
    );
  }

  function applyI18n(root = document) {
    root.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const attrs = (el.getAttribute("data-i18n-attr") || "")
        .split(",")
        .map(name => name.trim())
        .filter(Boolean);
      const value = t(key);
      if (attrs.length) attrs.forEach(attr => el.setAttribute(attr, value));
      else el.textContent = value;
    });
  }

  function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang) || lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    applyTranslations();
  }

  function bookStatus(book) {
    if (book.finishedAt) return "finished";
    if (book.startedAt) return "reading";
    return "planned";
  }

  function clampDifficulty(value) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return 0;
    return Math.min(5, Math.max(1, n));
  }

  function parseBooks() {
    const raw = Array.isArray(window.DECKIREADER_BOOKS) ? window.DECKIREADER_BOOKS : [];
    return raw.map((book, index) => ({
      id: book.id || `book-${index}`,
      title: String(book.title || "").trim(),
      titleEn: String(book.titleEn || "").trim(),
      author: String(book.author || "").trim(),
      pages: Number.isFinite(Number(book.pages)) ? Math.max(0, Math.floor(Number(book.pages))) : null,
      difficulty: book.difficulty == null || book.difficulty === "" ? 0 : clampDifficulty(book.difficulty),
      genre: GENRES.includes(book.genre) ? book.genre : "other",
      startedAt: book.startedAt || null,
      finishedAt: book.finishedAt || null,
      notes: String(book.notes || "").trim()
    })).filter(book => book.title);
  }

  const books = parseBooks();

  function formatDate(iso) {
    if (!iso) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return iso;
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[ch]));
  }

  function dateValue(iso) {
    if (!iso) return 0;
    const t = Date.parse(`${iso}T00:00:00`);
    return Number.isNaN(t) ? 0 : t;
  }

  function yearFromIso(iso) {
    if (!iso) return null;
    const y = Number(String(iso).slice(0, 4));
    return Number.isInteger(y) && y >= 1000 && y <= 9999 ? y : null;
  }

  function activityYears(book) {
    const years = new Set();
    const start = yearFromIso(book.startedAt);
    const finish = yearFromIso(book.finishedAt);
    if (start) years.add(start);
    if (finish) years.add(finish);
    const spanEnd = finish || (start && !finish ? new Date().getFullYear() : null);
    if (start && spanEnd && spanEnd > start) {
      for (let y = start + 1; y <= spanEnd; y++) years.add(y);
    }
    return years;
  }

  function availableYears() {
    const years = new Set();
    books.forEach(book => activityYears(book).forEach(y => years.add(y)));
    return [...years].sort((a, b) => b - a);
  }

  function selectedYear() {
    return $("yearFilter").value || "all";
  }

  function bookMatchesYear(book, year = selectedYear()) {
    if (year === "all") return true;
    return activityYears(book).has(Number(year));
  }

  function yearScopedBooks() {
    return books.filter(book => bookMatchesYear(book));
  }

  function compareBooks(a, b, sort) {
    if (sort === "started") return dateValue(b.startedAt) - dateValue(a.startedAt);
    if (sort === "finished") return dateValue(b.finishedAt) - dateValue(a.finishedAt);
    if (sort === "title") return a.title.localeCompare(b.title, "ja");
    if (sort === "difficulty") return (b.difficulty || 0) - (a.difficulty || 0);
    const rank = { reading: 0, planned: 1, finished: 2 };
    const byStatus = rank[bookStatus(a)] - rank[bookStatus(b)];
    if (byStatus) return byStatus;
    return dateValue(b.startedAt || b.finishedAt) - dateValue(a.startedAt || a.finishedAt);
  }

  function filteredBooks() {
    const query = $("search").value.trim().toLowerCase();
    const status = $("statusFilter").value;
    const genre = $("genreFilter").value;
    const sort = $("sort").value;
    return books
      .filter(book => {
        if (!bookMatchesYear(book)) return false;
        if (status !== "all" && bookStatus(book) !== status) return false;
        if (genre !== "all" && book.genre !== genre) return false;
        if (!query) return true;
        const hay = [book.title, book.titleEn, book.author, book.notes].join(" ").toLowerCase();
        return hay.includes(query);
      })
      .slice()
      .sort((a, b) => compareBooks(a, b, sort));
  }

  function renderStats() {
    const year = selectedYear();
    const scoped = yearScopedBooks();
    const reading = scoped.filter(b => bookStatus(b) === "reading").length;
    const finished = scoped.filter(b => {
      if (bookStatus(b) !== "finished") return false;
      if (year === "all") return true;
      return yearFromIso(b.finishedAt) === Number(year);
    });
    const planned = scoped.filter(b => bookStatus(b) === "planned").length;
    const pages = finished.reduce((sum, book) => sum + (book.pages || 0), 0);
    $("statReading").textContent = String(reading);
    $("statFinished").textContent = String(finished.length);
    $("statPlanned").textContent = String(planned);
    $("statPages").textContent = String(pages);
  }

  function difficultyDots(level) {
    if (!level) return "";
    const dots = Array.from({ length: 5 }, (_, i) =>
      `<span class="${i < level ? "on" : ""}"></span>`
    ).join("");
    return `<span class="difficulty-dots" aria-hidden="true">${dots}</span>`;
  }

  function emptyCell() {
    return `<span class="cell-empty">—</span>`;
  }

  function renderBooks() {
    const list = filteredBooks();
    $("count").textContent = t(list.length === 1 ? "countOne" : "countMany", {
      count: list.length
    });
    const host = $("books");
    host.innerHTML = "";

    if (!books.length || !list.length) {
      const row = document.createElement("tr");
      row.innerHTML = `<td class="empty" colspan="8">${escapeHtml(
        books.length ? t("emptyBooks") : t("emptyShelf")
      )}</td>`;
      host.appendChild(row);
      return;
    }

    list.forEach(book => {
      const status = bookStatus(book);
      const row = document.createElement("tr");
      row.dataset.status = status;
      const title = book.titleEn
        ? `${escapeHtml(book.title)}<div class="book-title-en">${escapeHtml(book.titleEn)}</div>`
        : escapeHtml(book.title);
      const difficulty = book.difficulty
        ? `<span class="difficulty" title="${escapeHtml(t("difficulty", { level: book.difficulty }))}">${difficultyDots(book.difficulty)} <span class="difficulty-label">${escapeHtml(String(book.difficulty))}/5</span></span>`
        : emptyCell();
      row.innerHTML = `
        <td><span class="chip chip-status">${escapeHtml(t(STATUS_KEYS[status]))}</span></td>
        <td class="book-title">${title}</td>
        <td>${book.author ? escapeHtml(book.author) : emptyCell()}</td>
        <td>${escapeHtml(t(GENRE_KEYS[book.genre] || "genreOther"))}</td>
        <td class="num">${difficulty}</td>
        <td class="num">${book.pages != null ? escapeHtml(String(book.pages)) : emptyCell()}</td>
        <td class="date">${book.startedAt ? escapeHtml(formatDate(book.startedAt)) : emptyCell()}</td>
        <td class="date">${book.finishedAt ? escapeHtml(formatDate(book.finishedAt)) : emptyCell()}</td>
      `;
      host.appendChild(row);
    });
  }

  function populateYearFilter() {
    const select = $("yearFilter");
    const current = select.value || "all";
    select.innerHTML = "";
    const all = document.createElement("option");
    all.value = "all";
    all.setAttribute("data-i18n", "yearAll");
    all.textContent = t("yearAll");
    select.appendChild(all);
    availableYears().forEach(year => {
      const option = document.createElement("option");
      option.value = String(year);
      option.textContent = String(year);
      select.appendChild(option);
    });
    select.value = [...select.options].some(o => o.value === current) ? current : "all";
  }

  function populateGenreFilter() {
    const select = $("genreFilter");
    const current = select.value || "all";
    select.innerHTML = "";
    const all = document.createElement("option");
    all.value = "all";
    all.setAttribute("data-i18n", "genreAll");
    all.textContent = t("genreAll");
    select.appendChild(all);
    const used = new Set(books.map(b => b.genre));
    GENRES.filter(g => used.has(g)).forEach(genre => {
      const option = document.createElement("option");
      option.value = genre;
      option.setAttribute("data-i18n", GENRE_KEYS[genre]);
      option.textContent = t(GENRE_KEYS[genre]);
      select.appendChild(option);
    });
    select.value = [...select.options].some(o => o.value === current) ? current : "all";
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang === "ja" ? "ja" : "en";
    document.title = t("title");
    const langGroup = document.querySelector(".lang-switch");
    if (langGroup) langGroup.setAttribute("aria-label", t("langGroup"));
    const themeGroup = document.querySelector(".theme-switch");
    if (themeGroup) themeGroup.setAttribute("aria-label", t("themeGroup"));
    populateYearFilter();
    populateGenreFilter();
    applyI18n(document);
    document.querySelectorAll(".lang-switch [data-lang]").forEach(btn => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === currentLang));
    });
    syncThemeUI();
    renderStats();
    renderBooks();
  }

  function bindHelpTip(tipId, tooltipId) {
    const tip = $(tipId);
    if (!tip) return;
    tip.addEventListener("click", event => {
      event.preventDefault();
      const open = tip.getAttribute("aria-expanded") !== "true";
      tip.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", event => {
      if (!tip.contains(event.target) && !$(tooltipId)?.contains(event.target)) {
        tip.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") tip.setAttribute("aria-expanded", "false");
    });
  }

  document.querySelectorAll(".lang-switch [data-lang]").forEach(btn => {
    btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang")));
  });
  document.querySelectorAll(".theme-switch [data-theme-choice]").forEach(btn => {
    btn.addEventListener("click", () => setTheme(btn.getAttribute("data-theme-choice")));
  });
  darkQuery.addEventListener("change", () => {
    if (currentTheme === "system") applyTheme();
  });
  ["search", "statusFilter", "genreFilter", "sort"].forEach(id => {
    $(id).addEventListener("input", renderBooks);
    $(id).addEventListener("change", renderBooks);
  });
  $("yearFilter").addEventListener("change", () => {
    renderStats();
    renderBooks();
  });
  bindHelpTip("totalsHelpTip", "totalsHelp");
  bindHelpTip("difficultyHelpTip", "difficultyHelp");

  if (!Array.isArray(window.DECKIREADER_BOOKS)) {
    $("loadStatus").textContent = t("loadError");
    $("loadStatus").className = "status error";
  }

  applyTheme();
  applyTranslations();
})();

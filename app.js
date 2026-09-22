(() => {
  "use strict";

  const LANG_KEY = "deckireader_lang";
  const THEME_KEY = "deckireader_theme";
  const BUNDLED_JAPANESE_CSV = "data/japanese-books.csv";
  const THEMES = ["system", "light", "dark"];
  const SUPPORTED_LANGS = ["en", "ja"];
  const GENRES = [
    "literary",
    "mystery",
    "sf",
    "fantasy",
    "romance",
    "slice-of-life",
    "folk-tales",
    "essay",
    "nonfiction",
    "biography",
    "history",
    "science",
    "business",
    "self-help",
    "psychology",
    "design",
    "manga",
    "other"
  ];
  const GENRE_KEYS = {
    literary: "genreLiterary",
    mystery: "genreMystery",
    sf: "genreSf",
    fantasy: "genreFantasy",
    romance: "genreRomance",
    "slice-of-life": "genreSliceOfLife",
    "folk-tales": "genreFolkTales",
    essay: "genreEssay",
    nonfiction: "genreNonfiction",
    biography: "genreBiography",
    history: "genreHistory",
    science: "genreScience",
    business: "genreBusiness",
    "self-help": "genreSelfHelp",
    psychology: "genrePsychology",
    design: "genreDesign",
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

  let books = [];

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
        const hay = [
          book.title,
          book.titleEn,
          book.author,
          book.genre,
          book.notes,
          book.isbn10,
          book.isbn13
        ].join(" ").toLowerCase();
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

  function genreLabel(genre) {
    const key = GENRE_KEYS[genre];
    return key ? t(key) : genre;
  }

  const NOTES_TIP_ID = "bookNotes";
  const NOTES_TIP_GAP = 14;
  const NOTES_TIP_MARGIN = 12;
  const notesTip = document.createElement("div");
  notesTip.id = NOTES_TIP_ID;
  notesTip.className = "notes-tip";
  notesTip.setAttribute("role", "tooltip");
  notesTip.hidden = true;
  document.body.appendChild(notesTip);
  let notesRow = null;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), Math.max(min, max));
  }

  function positionNotes(point) {
    if (!notesRow) return;
    const row = notesRow.getBoundingClientRect();
    const tip = notesTip.getBoundingClientRect();
    const anchorX = point ? point.x : row.left;
    const anchorY = point ? point.y : row.bottom - NOTES_TIP_GAP;
    const left = clamp(
      anchorX + NOTES_TIP_GAP,
      NOTES_TIP_MARGIN,
      window.innerWidth - tip.width - NOTES_TIP_MARGIN
    );
    const below = anchorY + NOTES_TIP_GAP;
    const top =
      below + tip.height > window.innerHeight - NOTES_TIP_MARGIN
        ? Math.max(NOTES_TIP_MARGIN, anchorY - NOTES_TIP_GAP - tip.height)
        : below;
    notesTip.style.left = `${left}px`;
    notesTip.style.top = `${top}px`;
  }

  function showNotes(row, point) {
    const notes = row.dataset.notes;
    if (!notes) return;
    if (notesRow !== row) {
      notesTip.innerHTML = `<span class="notes-tip-label">${escapeHtml(
        t("notesLabel")
      )}</span>${escapeHtml(notes)}`;
      notesRow = row;
    }
    notesTip.hidden = false;
    positionNotes(point);
  }

  function hideNotes() {
    notesRow = null;
    notesTip.hidden = true;
  }

  function notesRowFrom(target) {
    const row = target instanceof Element ? target.closest("tr[data-notes]") : null;
    return row && row.parentElement === $("books") ? row : null;
  }

  function renderBooks() {
    hideNotes();
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
      if (book.notes) {
        row.dataset.notes = book.notes;
        row.tabIndex = 0;
        row.setAttribute("aria-describedby", NOTES_TIP_ID);
      }
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
        <td>${escapeHtml(genreLabel(book.genre))}</td>
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
    const known = GENRES.filter(genre => books.some(book => book.genre === genre));
    const custom = [...new Set(books.map(book => book.genre))]
      .filter(genre => !GENRES.includes(genre))
      .sort((a, b) => a.localeCompare(b));
    [...known, ...custom].forEach(genre => {
      const option = document.createElement("option");
      option.value = genre;
      if (GENRE_KEYS[genre]) option.setAttribute("data-i18n", GENRE_KEYS[genre]);
      option.textContent = genreLabel(genre);
      select.appendChild(option);
    });
    select.value = [...select.options].some(o => o.value === current) ? current : "all";
  }

  function setSourceStatus(message, type = "") {
    const status = $("sourceStatus");
    status.textContent = message;
    status.className = `status ${type}`.trim();
  }

  function loadCsvText(text, sourceName, statusKeys = {}) {
    try {
      const parsed = window.DeckiReaderCsv.parse(text);
      books = parsed;
      $("yearFilter").value = "all";
      $("statusFilter").value = "all";
      $("genreFilter").value = "all";
      $("search").value = "";
      populateYearFilter();
      populateGenreFilter();
      $("totalsCard").hidden = false;
      $("booksCard").hidden = false;
      renderStats();
      renderBooks();
      const oneKey = statusKeys.one || "loadSuccessOne";
      const manyKey = statusKeys.many || "loadSuccessMany";
      setSourceStatus(
        t(parsed.length === 1 ? oneKey : manyKey, {
          count: parsed.length,
          source: sourceName
        }),
        "success"
      );
    } catch (error) {
      setSourceStatus(error && error.message ? error.message : String(error), "error");
    }
  }

  function appAssetUrl(relativePath) {
    const { origin, pathname } = window.location;
    const last = pathname.split("/").pop();
    const dir =
      pathname.endsWith("/") || !String(last).includes(".")
        ? pathname.replace(/\/?$/, "/")
        : pathname.replace(/[^/]+$/, "");
    return new URL(relativePath, origin + dir).href;
  }

  async function fetchCsv(href) {
    const url = new URL(href, window.location.href);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error(t("urlHttpOnly"));
    }
    const response = await fetch(url.href);
    if (!response.ok) throw new Error(t("urlHttpError", { status: response.status }));
    return response.text();
  }

  function syncSourcePanel() {
    const selected = $("sourceType").value;
    ["paste", "file", "url"].forEach(source => {
      $(`${source}Panel`).hidden = source !== selected;
    });
    setSourceStatus("");
  }

  function updateFileName() {
    const file = $("csvFile").files && $("csvFile").files[0];
    $("fileName").textContent = file ? file.name : t("noFileChosen");
  }

  async function loadSelectedFile() {
    const file = $("csvFile").files && $("csvFile").files[0];
    if (!file) {
      setSourceStatus(t("fileRequired"), "error");
      return;
    }
    try {
      loadCsvText(await file.text(), file.name);
    } catch {
      setSourceStatus(t("fileReadError"), "error");
    }
  }

  async function loadCsvUrl() {
    const value = $("csvUrl").value.trim();
    if (!value) {
      setSourceStatus(t("urlRequired"), "error");
      return;
    }
    const button = $("loadUrl");
    button.disabled = true;
    setSourceStatus(t("urlLoading"));
    try {
      loadCsvText(await fetchCsv(value), new URL(value, window.location.href).href);
    } catch (error) {
      const message =
        error instanceof TypeError
          ? t("urlFetchError")
          : error && error.message
            ? error.message
            : String(error);
      setSourceStatus(message, "error");
    } finally {
      button.disabled = false;
    }
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
    updateFileName();
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
  $("sourceType").addEventListener("change", syncSourcePanel);
  $("loadPaste").addEventListener("click", () => {
    loadCsvText($("csvPaste").value, t("sourcePaste"));
  });
  $("chooseFile").addEventListener("click", () => $("csvFile").click());
  $("csvFile").addEventListener("change", updateFileName);
  $("loadFile").addEventListener("click", loadSelectedFile);
  $("loadUrl").addEventListener("click", loadCsvUrl);
  $("csvUrl").addEventListener("keydown", event => {
    if (event.key === "Enter") loadCsvUrl();
  });
  bindHelpTip("totalsHelpTip", "totalsHelp");
  bindHelpTip("difficultyHelpTip", "difficultyHelp");

  $("books").addEventListener("mousemove", event => {
    const row = notesRowFrom(event.target);
    if (row) showNotes(row, { x: event.clientX, y: event.clientY });
    else hideNotes();
  });
  $("books").addEventListener("mouseleave", hideNotes);
  $("books").addEventListener("focusin", event => {
    const row = notesRowFrom(event.target);
    if (row) showNotes(row);
  });
  $("books").addEventListener("focusout", event => {
    if (!notesRowFrom(event.relatedTarget)) hideNotes();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") hideNotes();
  });
  window.addEventListener("scroll", hideNotes, true);
  window.addEventListener("resize", hideNotes);

  (function bindLogoEasterEgg() {
    const logo = document.querySelector(".brand-logo");
    if (!logo) return;
    const CLICKS_TO_UNLOCK = 5;
    const CLICK_GAP_MS = 1500;
    let clicks = 0;
    let gapTimer = 0;
    let loading = false;

    logo.addEventListener("click", async () => {
      window.clearTimeout(gapTimer);
      clicks += 1;
      if (clicks < CLICKS_TO_UNLOCK) {
        gapTimer = window.setTimeout(() => {
          clicks = 0;
        }, CLICK_GAP_MS);
        return;
      }
      clicks = 0;
      if (loading) return;
      loading = true;
      setSourceStatus(t("easterEggLoading"));
      try {
        const href = appAssetUrl(BUNDLED_JAPANESE_CSV);
        loadCsvText(await fetchCsv(href), BUNDLED_JAPANESE_CSV, {
          one: "easterEggSuccessOne",
          many: "easterEggSuccessMany"
        });
      } catch (error) {
        const message =
          error instanceof TypeError
            ? t("easterEggError")
            : error && error.message
              ? error.message
              : t("easterEggError");
        setSourceStatus(message, "error");
      } finally {
        loading = false;
      }
    });
  })();

  applyTheme();
  applyTranslations();
  syncSourcePanel();
})();

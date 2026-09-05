(function (global) {
  "use strict";

  const COLUMNS = [
    "id",
    "title",
    "titleEn",
    "author",
    "pages",
    "difficulty",
    "genre",
    "startedAt",
    "finishedAt",
    "notes",
    "isbn10",
    "isbn13"
  ];
  const REQUIRED_COLUMNS = ["id", "title", "author"];
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  function csvError(message, code, lineNumber) {
    const error = new Error(message);
    error.code = code || "CSV_PARSE_ERROR";
    if (lineNumber != null) error.lineNumber = lineNumber;
    return error;
  }

  function parseRecords(text) {
    const input = String(text == null ? "" : text).replace(/^\uFEFF/, "");
    const records = [];
    let row = [];
    let field = "";
    let quoted = false;
    let line = 1;
    let rowLine = 1;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (quoted) {
        if (char === '"') {
          if (input[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            quoted = false;
          }
        } else {
          field += char;
          if (char === "\n") line++;
        }
        continue;
      }

      if (char === '"') {
        if (field) {
          throw csvError(`Line ${line}: unexpected quote in an unquoted field.`, "CSV_BAD_QUOTE", line);
        }
        quoted = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field.replace(/\r$/, ""));
        if (row.some(value => value.trim())) records.push({ values: row, line: rowLine });
        row = [];
        field = "";
        line++;
        rowLine = line;
      } else {
        field += char;
      }
    }

    if (quoted) {
      throw csvError(`Line ${rowLine}: unclosed quoted field.`, "CSV_BAD_QUOTE", rowLine);
    }
    row.push(field.replace(/\r$/, ""));
    if (row.some(value => value.trim())) records.push({ values: row, line: rowLine });
    return records;
  }

  function parseOptionalNumber(raw, name, line, { min, max } = {}) {
    const value = String(raw || "").trim();
    if (!value) return null;
    const number = Number(value);
    if (!Number.isInteger(number) || (min != null && number < min) || (max != null && number > max)) {
      const range = min != null && max != null ? ` from ${min} to ${max}` : min != null ? ` of at least ${min}` : "";
      throw csvError(`Line ${line}: ${name} must be a whole number${range}.`, "CSV_INVALID_NUMBER", line);
    }
    return number;
  }

  function parseOptionalDate(raw, name, line) {
    const value = String(raw || "").trim();
    if (!value) return null;
    if (!DATE_RE.test(value)) {
      throw csvError(`Line ${line}: ${name} must use YYYY-MM-DD.`, "CSV_INVALID_DATE", line);
    }
    const date = new Date(`${value}T12:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw csvError(`Line ${line}: ${name} is not a valid date.`, "CSV_INVALID_DATE", line);
    }
    return value;
  }

  function parseBookCsv(text) {
    if (!String(text == null ? "" : text).trim()) {
      throw csvError("Provide CSV data before loading.", "CSV_EMPTY");
    }

    const records = parseRecords(text);
    if (!records.length) throw csvError("No CSV rows were found.", "CSV_EMPTY");

    const headers = records[0].values.map(value => value.trim());
    const duplicates = headers.filter((header, index) => header && headers.indexOf(header) !== index);
    if (duplicates.length) {
      throw csvError(`Header contains duplicate column "${duplicates[0]}".`, "CSV_BAD_HEADER", records[0].line);
    }
    const unknown = headers.filter(header => header && !COLUMNS.includes(header));
    if (unknown.length) {
      throw csvError(`Unknown column "${unknown[0]}". Expand the CSV format panel in the app for supported columns.`, "CSV_BAD_HEADER", records[0].line);
    }
    const missing = REQUIRED_COLUMNS.filter(column => !headers.includes(column));
    if (missing.length) {
      throw csvError(`Missing required column${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`, "CSV_BAD_HEADER", records[0].line);
    }

    const seenIds = new Set();
    return records.slice(1).map(record => {
      if (record.values.length > headers.length) {
        throw csvError(`Line ${record.line}: too many fields.`, "CSV_BAD_ROW", record.line);
      }
      const values = {};
      headers.forEach((header, index) => {
        if (header) values[header] = String(record.values[index] || "").trim();
      });

      REQUIRED_COLUMNS.forEach(column => {
        if (!values[column]) {
          throw csvError(`Line ${record.line}: ${column} is required.`, "CSV_BAD_ROW", record.line);
        }
      });
      if (seenIds.has(values.id)) {
        throw csvError(`Line ${record.line}: duplicate id "${values.id}".`, "CSV_DUPLICATE_ID", record.line);
      }
      seenIds.add(values.id);

      const startedAt = parseOptionalDate(values.startedAt, "startedAt", record.line);
      const finishedAt = parseOptionalDate(values.finishedAt, "finishedAt", record.line);
      if (startedAt && finishedAt && finishedAt < startedAt) {
        throw csvError(`Line ${record.line}: finishedAt cannot be before startedAt.`, "CSV_INVALID_DATES", record.line);
      }

      return {
        id: values.id,
        title: values.title,
        titleEn: values.titleEn || "",
        author: values.author,
        pages: parseOptionalNumber(values.pages, "pages", record.line, { min: 1 }),
        difficulty: parseOptionalNumber(values.difficulty, "difficulty", record.line, { min: 1, max: 5 }),
        genre: values.genre || "other",
        startedAt,
        finishedAt,
        notes: values.notes || "",
        isbn10: values.isbn10 || "",
        isbn13: values.isbn13 || ""
      };
    });
  }

  global.DeckiReaderCsv = {
    COLUMNS: COLUMNS.slice(),
    REQUIRED_COLUMNS: REQUIRED_COLUMNS.slice(),
    parse: parseBookCsv
  };
})(window);

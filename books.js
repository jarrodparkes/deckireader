/**
 * DeckiReader book list — edit this file to add, update, or remove books.
 *
 * Required:
 *   id          Unique slug (used as the row key)
 *   title       Japanese title as printed
 *   author      Author name as you want it shown
 *
 * Optional:
 *   titleEn     English title
 *   pages       Total page count (number)
 *   difficulty  1–5 relative to your other Japanese books (1 easier, 5 denser)
 *   genre       literary | mystery | sf | fantasy | essay | nonfiction | manga | other
 *   startedAt   YYYY-MM-DD when you began, or omit / null if not started
 *   finishedAt  YYYY-MM-DD when you finished, or omit / null if still reading
 *   notes       Freeform (edition, why it was hard, where you left off, …)
 *   isbn10      ISBN-10 number
 *   isbn13      ISBN-13 number
 *
 * Status is derived: no startedAt → planned; started but no finishedAt → reading;
 * finishedAt set → finished.
 */
window.DECKIREADER_BOOKS = [
  {
    id: "miller-s-novel-1",
    title: "ミラーさん みんなの日本語初級シリーズ",
    titleEn: "Miller's Novel 1: Everyone's Japanese for Beginners Series",
    author: "横山悠太",
    pages: 147,
    difficulty: 2,
    genre: "literary",
    startedAt: "2026-09-05",
    finishedAt: null,
    notes: "I'm using this book to learn the basics of Japanese.",
    isbn10: "4883197557",
    isbn13: "978-4-88-319755-2",
  },
];

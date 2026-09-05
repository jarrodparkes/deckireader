# DeckiReader

Track the Japanese books you are reading.

DeckiReader is a single-page static site. The shelf lives in [`books.js`](./books.js); the page is only for browsing, filtering, and summarizing that list.

## Features

- Record **start** and **finish** dates (`YYYY-MM-DD`); status is derived (planned, reading, finished)
- Store **page count**, **genre**, optional **ISBN-10** / **ISBN-13**, and a personal **1–5 difficulty** relative to your other Japanese books
- Optional English title and freeform notes (notes are searchable; they are not shown in the table)
- Filter by **year** (from dates in `books.js`, plus all-time), status, genre, and search; sort by dates, title, or difficulty
- Switch the interface between **light** and **dark**, or follow your system appearance
- English and Japanese UI copy

## Setup

No build step. Host the folder as a static site (GitHub Pages works with the included `.nojekyll` file).

1. Open `index.html` in a modern browser, or serve the directory over HTTP.
2. Edit [`books.js`](./books.js) and refresh.

GitHub Pages: enable Pages on this repository (Deploy from branch → `main` or `master`, `/` root). The site is then available at `https://<user>.github.io/deckireader/` or a custom domain such as `https://jarrodparkes.com/deckireader/`.

## Usage

Add or change books in `books.js`. Each entry looks like:

```js
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
  isbn13: "978-4-88-319755-2"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Unique slug (table row key) |
| `title` | yes | Japanese title as printed |
| `author` | yes | Display name |
| `titleEn` | no | English title |
| `pages` | no | Total pages |
| `difficulty` | no | `1`–`5` vs your own shelf (`1` easier, `5` denser) |
| `genre` | no | `literary`, `mystery`, `sf`, `fantasy`, `essay`, `nonfiction`, `manga`, `other` |
| `startedAt` | no | `YYYY-MM-DD` when you began; omit or `null` if not started |
| `finishedAt` | no | `YYYY-MM-DD` when you finished; omit or `null` if still reading |
| `notes` | no | Edition, vocab, where you left off (search only; not a table column) |
| `isbn10` | no | ISBN-10 |
| `isbn13` | no | ISBN-13 |

A book is **planned** with no `startedAt`, **reading** with a start date and no finish date, and **finished** once `finishedAt` is set. The year filter uses those dates (including years a book was still in progress). **Pages read** in Totals counts pages from books finished in the selected year, or from every finished book when the year is all-time.

Styling matches [DeckiMasta](https://github.com/jarrodparkes/deckimasta) for now (duplicated CSS). Sharing a single theme later is a planned improvement.

## Requirements

- A modern browser with `localStorage` (for appearance and language preferences)

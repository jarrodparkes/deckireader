# DeckiReader

Track the Japanese books you are reading.

DeckiReader is a single-page static site. The shelf lives in [`books.js`](./books.js); the page is only for browsing, filtering, and summarizing that list.

## Features

- Record **start** and **finish** dates; status is derived (planned, reading, finished)
- Store **page count**, **genre**, and a personal **1–5 difficulty** relative to your other Japanese books
- Optional English title and freeform notes
- Filter by status, genre, and search; sort by dates, title, or difficulty
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
  id: "convenience-store-woman",
  title: "コンビニ人間",
  titleEn: "Convenience Store Woman",
  author: "村田沙耶香",
  pages: 161,
  difficulty: 2,
  genre: "literary",
  startedAt: "2026-08-12",
  finishedAt: null,
  notes: "Short chapters; everyday vocabulary."
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Unique slug |
| `title` | yes | Japanese title as printed |
| `author` | yes | Display name |
| `titleEn` | no | English title |
| `pages` | no | Total pages |
| `difficulty` | no | `1`–`5` vs your own shelf (`1` easier, `5` denser) |
| `genre` | no | `literary`, `mystery`, `sf`, `fantasy`, `essay`, `nonfiction`, `manga`, `other` |
| `startedAt` | no | `YYYY-MM-DD` |
| `finishedAt` | no | `YYYY-MM-DD` |
| `notes` | no | Edition, vocab, where you left off |

**Pages read** in the overview counts pages from books with a finish date.

Sample titles in `books.js` are placeholders — replace them with your own list.

Styling matches [DeckiMasta](https://github.com/jarrodparkes/deckimasta) for now (duplicated CSS). Sharing a single theme later is a planned improvement.

## Requirements

- A modern browser with `localStorage` (for appearance and language preferences)

# DeckíReader

Track the books you are reading from a simple CSV File.

DeckíReader is a private-by-default, single-page static site. It does not ship with a reading list or upload reading data to a server. Each visitor supplies their own CSV by pasting it, choosing a local file, or entering a public CSV URL.

## Features

- Load CSV by paste, local file upload, or public URL
- Record start and finish dates; status is derived as planned, reading, or finished
- Store page count, genre, ISBN-10 / ISBN-13, notes, and a personal 1–5 difficulty
- Filter by year, status, genre, and search
- Sort by dates, title, or difficulty
- Calculate finished-book and page totals for a selected year or all-time
- Switch between light, dark, and system appearance
- English and Japanese interface copy
- No build step or backend

## Use it

Open `index.html` in a modern browser or visit the hosted site, then choose one of the three sources:

1. **CSV Paste** — paste the complete CSV, including its header row.
2. **CSV File** — choose a `.csv` file from your device. Its contents stay in your browser.
3. **CSV URL** — enter a public HTTP(S) URL whose server allows cross-origin requests (CORS).

Loading another source replaces the current list. The list is not saved in browser storage, so the default state is empty again after a refresh. Appearance and interface-language preferences are saved locally.

CSV columns, quoting rules, and an example row are in the app: expand the format panel under **Setup**.

## Example data

- [`data/japanese-books.csv`](./data/japanese-books.csv) — Japanese reading-list example migrated from the original `books.js`
- [`data/english-books.csv`](./data/english-books.csv) — English books extracted from historical `layout: review` posts on jarrodparkes.com

The historical posts provide a title, author, and review date, but generally not a start date, page count, difficulty, or ISBN. Their review dates are represented as `finishedAt`; unsupported values remain blank.

## Run locally

There is no build step. You can open `index.html` directly for paste and file upload. URL loading is most reliable when the project is served over HTTP:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Host with GitHub Pages

1. Push the repository to GitHub.
2. In repository settings, enable **Pages**.
3. Choose **Deploy from a branch**, then the repository's default branch and `/` root.

The included `.nojekyll` file keeps GitHub Pages from applying Jekyll processing.

## Requirements

- A modern browser with `fetch`, `File.text`, and `localStorage`
- For CSV URLs, a host that permits browser CORS requests

## Styling

Styling currently matches [DeckiMasta](https://github.com/jarrodparkes/deckimasta) through duplicated CSS. Sharing a common theme remains a possible future improvement.

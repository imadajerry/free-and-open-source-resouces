# Learning Sources Hub

A static, searchable directory of free and freemium learning resources for programming, computer science, web development, AI, DevOps, and more.

## Features

- Search resources by title, description, category, or type
- Filter by category
- Light and dark theme toggle
- Mobile drawer navigation
- Static JSON-backed content, easy to edit

## Project Structure

- `index.html` - main page markup
- `styles.css` - site styling
- `script.js` - search, filter, theme, and navigation logic
- `resources.json` - resource data
- `platforms.json` - supplemental platform data
- `sources.md` - source notes and references

## Local Development

This is a static site, so you can open `index.html` directly in a browser. For the most reliable local experience, serve it with a simple HTTP server.

Example with Node.js:

```bash
npx serve .
```

Or with Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy to GitHub Pages

This repo includes a CLI deploy script using `gh-pages`.

1. Install dependencies:

```bash
npm install
```

2. Deploy:

```bash
npm run deploy
```

This publishes the site to the `gh-pages` branch.

## Updating Content

To add or edit resources, update `resources.json` and refresh the page. The UI reads directly from that file.

## Notes

- External links open in a new tab.
- The site is intended to work as a lightweight static GitHub Pages project.

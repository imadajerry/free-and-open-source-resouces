# Learning Sources Hub

A static learning hub with a home page, searchable resource directories, communities, and simple feedback forms.

## Features

- Home page with direct navigation to the data pages and forms
- Search resources or communities by title, description, category, or type
- Filter by category
- Light and dark theme toggle
- Mobile drawer navigation on the data pages
- Static JSON-backed content, easy to edit

## Project Structure

- `index.html` - home page markup
- `resources/index.html` - resources directory
- `platforms/index.html` - platforms directory
- `communities/index.html` - communities directory
- `styles.css` - site styling
- `script.js` - search, filter, theme, and navigation logic
- `resources.json` - resource data
- `platforms.json` - supplemental platform data
- `communities.json` - community data
- `sources.md` - source notes and references

## Local Development

This is a static site, so you can open `index.html` directly in a browser. For the most reliable local experience, serve it with a simple HTTP server. The directory pages are available at `resources/`, `platforms/`, and `communities/`.

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

To add or edit content, update the relevant JSON file and refresh the page. The UI reads directly from that file.

## Notes

- External links open in a new tab.
- The site is intended to work as a lightweight static GitHub Pages project.

# nickhu.info

The current portfolio site, ported from the published ChatGPT Sites version on 23 November 2026.

## Build

Node 24 recommended. `npm test` checks the static site, and `npm run build` produces the Netlify-ready `dist/` directory.

The project uses local static HTML, CSS and JavaScript. The build copies its 41 media assets from `assets/` if available, or mirrors them from the original ChatGPT Sites deployment for the initial import. The GitHub import workflow vendors the assets into this repository so subsequent builds are independent of ChatGPT Sites.

## Deploy

Netlify: run `npm run build` and publish `dist`. Canonical URL, sitemap and social previews refer to https://nickhu.info/.

Main source: `index.html`, `portfolio.css`, `project-browser.js`, `worksheet-stack.js`, `kurb-explorer.js`, `oil-surface.js`, `bot-gallery.js`, `asset-manifest.json`.

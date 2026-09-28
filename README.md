# nickhu.info

Nick Hu’s interactive terminal portfolio, built with React 19, TypeScript 7 and Vite 8.

## Development

Use Node.js 22.18+ (native TypeScript support for tests), preferably Node 24 LTS.

```sh
npm ci
npm run dev
```

The development server runs on port 8080. `npm run build` checks types and produces `dist/`. `npm run preview` serves the production build. `npm test` checks parsing, command completion and history boundaries.

## Deployment

Publish `dist/` using `npm run build`. This replaces the former Gatsby build and its `public/` output. Netlify settings are supplied in `netlify.toml`; update the output directory to `dist` on other hosts. No server runtime or environment variables are required.

## Content and interaction

Edit portfolio content and project links in `src/App.tsx`, presentation in `src/styles.css`, and command parsing in `src/terminal.ts`. Fonts are bundled locally; the page has no third-party font requests.

Commands: `about`, `work`, `stack`, `contact`, `help`, `version`, `theme green|amber|ice`, `clear`, `reset`. Original `bio`, `examples`, `background <color>` and `text <color>` commands are retained. Up/down recalls up to 100 commands and restores unfinished input. Tab completes an unambiguous command; Ctrl+L clears output. The last 50 responses are retained per session. No input is executed as code or HTML, persisted, or sent to a server.

The page keeps the original simple terminal layout, with clickable commands and links to public projects. Long replies open at the start; short replies keep the prompt in view. Command shortcuts do not focus the input, and initial focus is limited to devices with a fine pointer and hover. Tab-completed drafts survive history navigation; Shift+Tab keeps its normal navigation behavior. The `text` command changes all text colours, including links and hints, and `theme` or `reset` clears custom colours.

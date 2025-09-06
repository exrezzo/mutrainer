# mutranier

A super minimal TypeScript + esbuild static app, ready for GitHub Pages.

## Quick Start

```bash
# Install deps
npm install

# Start dev server (auto-reload)
npm run dev
# Open: http://localhost:8000 (esbuild prints exact URL)

# Production build
npm run build
# Output: dist/
```

## Deploy (GitHub Pages via Actions)
1. Replace `YOUR_GITHUB_USERNAME` in `package.json` `homepage` field with your actual GitHub username.
2. Commit & push to the `main` branch.
3. In the repo settings: Settings → Pages → Build and deployment → Source: GitHub Actions (if not already set).
4. The included workflow `.github/workflows/deploy.yml` will:
   - Install dependencies
   - Build the site into `dist/`
   - Upload & publish to GitHub Pages
5. Visit: `https://YOUR_GITHUB_USERNAME.github.io/mutranier` (or the URL shown in the workflow summary).

## What’s Inside
- `src/main.ts` – Tiny interactive demo + example exported function.
- `public/index.html` – Static shell (loads `assets/bundle.js`).
- `public/assets/styles.css` – Just some lightweight styling.
- `esbuild` – Bundles + minifies (fast, zero config here).
- `.nojekyll` (added during build) – Ensures GitHub Pages serves files untouched.

## Customizing
- Edit HTML: `public/index.html`
- Add images/fonts: place in `public/assets/` (they get copied to `dist/assets/`).
- Add more TS modules under `src/` and import them in `main.ts`.

## Relative Paths & Project Pages
Assets use relative paths (`assets/...`) so the app works from `/mutranier/` without needing a `<base>` tag or path rewriting.

If you later convert this to a user/organization page repo (`<user>.github.io`), everything will still work.

## Manual (No Actions) Alternative
If you prefer a `gh-pages` branch deploy:
```bash
npm run build
git subtree push --prefix dist origin gh-pages
```
Then set Pages source to the `gh-pages` branch root. (Not needed if using the provided Actions workflow.)

## License
MIT (add a LICENSE file if you need explicit licensing).

Enjoy! 🎯


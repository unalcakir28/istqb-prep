---
paths:
  - "package.json"
  - "vite.config.ts"
  - "playwright.config.ts"
  - "lighthouserc.json"
  - ".github/**"
---

# Build and CI

- **Node 22** is what CI pins (`node-version: 22`). `package.json` has no
  `engines` field, so nothing warns locally on another major.
- **`"resolutions": { "vite": "6.4.3" }` is never removed.** Vitest brings in its
  own Vite 7; with both type trees present at once, `typecheck` and `build` break.
- **If `GITHUB_ACTIONS` is set, Vite's `base` becomes `/istqb-prep/`.**
  `playwright.config.ts` deliberately clears this variable, otherwise `baseURL`
  won't hold. That trick does **not** work from inside a workflow: a step-level
  `env: GITHUB_ACTIONS: ""` does not reach the build, so the CI Lighthouse step
  passes `--base=/` on the command line instead. Its first run failed with
  `NO_FCP` — every asset 404'd and Lighthouse audited a blank page.
- **`deploy.yml` publishes to GitHub Pages on every push to `main`**, gated only
  on `validate:data` and `build` — not on tests. Deep links work because the job
  copies `dist/index.html` to `dist/404.html`; Pages has no SPA rewrite otherwise.

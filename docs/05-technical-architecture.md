# 05 — Technical Architecture

**Version:** 1.0 · **Date:** 19.09.2026
**Related ADRs:** [`0001-frontend-stack`](adr/0001-frontend-stack.md) · [`0002-data-layer-static-json`](adr/0002-data-layer-static-json.md) · [`0003-client-side-storage`](adr/0003-client-side-storage.md)

---

## 1. High level

```
┌───────────────────────── Browser ──────────────────────────┐
│                                                           │
│  React SPA (Vite build)                                   │
│  ├── UI layer     shadcn/ui + Tailwind v4                 │
│  ├── State        Zustand (session) + Dexie (persistent)  │
│  ├── Data access  contentClient (fetch + cache)           │
│  ├── Exam engine  blueprint → generation → scoring        │
│  ├── SRS engine   ts-fsrs                                 │
│  └── i18n         i18next (interface) + content language  │
│                                                           │
│  IndexedDB   attempts · responses · srsCards · bookmarks  │
│  Cache API   (PWA) question chunks, manifest              │
└────────────────────────────┬───────────────────────────────┘
                             │ static GET
                             ▼
              GitHub Pages (CDN, no server code)
              /index.html  /assets/*  /data/**.json
```

**No backend. No API. No database.** All computation happens client-side.

---

## 2. Technology choices

| Layer | Choice | Rationale |
|---|---|---|
| Build | **Vite 6** | Fastest DX, static output, `base` setting handles the GitHub Pages subpath cleanly |
| UI | **React 19 + TypeScript 5** | Ecosystem, type safety; a contract can be generated from the data model types |
| Styling | **Tailwind CSS v4** | Design tokens as CSS variables; dark mode comes free |
| Components | **shadcn/ui** (Radix-based) | Copied source code → no dependency bloat; accessibility ready via Radix |
| Routing | **React Router v7** (`createHashRouter` **or** the 404.html trick) | No server-side routing on GitHub Pages — see §6 |
| Session state | **Zustand** | Small, boilerplate-free; ideal for an exam session |
| Persistence | **Dexie 4 (IndexedDB)** | localStorage quota is insufficient; queryable; migration support |
| SRS | **ts-fsrs** | FSRS-5 implementation; the algorithm Anki uses |
| i18n | **i18next + react-i18next** | Interface language; content language is managed separately |
| Charts | **Recharts** (or hand-rolled SVG if lightweight enough) | Result breakdown and progress trend |
| PWA | **vite-plugin-pwa** (Workbox) | Phase 3; `StaleWhileRevalidate` for question chunks |
| Validation | **Ajv** + JSON Schema | Data validation in CI; in dev mode at runtime |
| Testing | **Vitest** + **Testing Library** + **Playwright** | Unit + component + end-to-end |
| Quality | ESLint + Prettier + `tsc --noEmit` | CI gate |

### Deliberately not used
- **Next.js** — we can't benefit from SSR/ISR (static export is already Vite's natural output); unnecessary complexity.
- **Redux / TanStack Query** — no server state; over-engineering.
- **A CMS** — content lives in Git; reviewed via PR, validated by CI. That's our quality gate.
- **AI-generated questions at runtime** — quality and copyright risk; see [`07-content-authoring-guide.md`](07-content-authoring-guide.md).

---

## 3. Folder structure

```
istqb-prep/
├── public/
│   └── data/                    # data/ copied here, or symlinked
├── data/                        # Source data (reviewed in Git)
├── schemas/                     # JSON Schema definitions
├── scripts/
│   ├── validate-data.ts         # CI validator
│   ├── build-index.ts           # Builds index.json from chunks
│   ├── fetch-glossary.ts        # ISTQB Glossary API → glossary/
│   └── stats.ts                 # Coverage report (questions per LO)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/
│   │   ├── Home.tsx
│   │   ├── ExamSetup.tsx
│   │   ├── ExamSession.tsx
│   │   ├── ExamResult.tsx
│   │   ├── Practice.tsx
│   │   ├── Review.tsx           # SRS
│   │   ├── Glossary.tsx
│   │   ├── Progress.tsx
│   │   └── Syllabus.tsx         # LO explorer
│   ├── features/
│   │   ├── exam/                # engine: generation, scoring, timer
│   │   ├── practice/
│   │   ├── srs/
│   │   ├── glossary/
│   │   └── progress/
│   ├── components/
│   │   ├── ui/                  # shadcn
│   │   ├── QuestionCard.tsx
│   │   ├── OptionList.tsx
│   │   ├── RationalePanel.tsx
│   │   ├── QuestionNavigator.tsx
│   │   ├── ExamTimer.tsx
│   │   ├── MediaRenderer/       # decision-table, state-transition, ...
│   │   ├── ScoreBar.tsx
│   │   └── LangToggle.tsx
│   ├── lib/
│   │   ├── content/             # contentClient, chunk cache
│   │   ├── db/                  # Dexie schema + migrations
│   │   ├── i18n/
│   │   └── utils/
│   ├── types/                   # Data model types (generated from schemas)
│   └── styles/
├── e2e/                         # Playwright
├── docs/
└── .github/workflows/
    ├── ci.yml                   # lint + tsc + test + validate:data
    └── deploy.yml               # GitHub Pages
```

---

## 4. Content access layer (`contentClient`)

Its sole responsibility: **"give me these question IDs"** — with the least possible network traffic.

```ts
interface ContentClient {
  getManifest(): Promise<Manifest>                      // once, cached
  getMeta(certId: string): Promise<CertMeta>
  getSyllabus(certId: string): Promise<Syllabus>
  getObjectives(certId: string): Promise<Objective[]>
  getBlueprint(certId: string): Promise<ExamBlueprint>
  getIndex(certId: string): Promise<QuestionIndex>      // lightweight, all questions
  getQuestions(certId: string, ids: string[]): Promise<Question[]>  // chunk-based
}
```

**`getQuestions` behavior:**
1. Look up which chunk each ID lives in, from `index.json`
2. The required chunks are **deduplicated** and fetched in parallel via `fetch`
3. Chunks are kept in memory (`Map`) and in the Cache API
4. A 40-question exam typically downloads 4–6 chunks (~250 KB), not the whole pool

**Cache invalidation:** the chunk cache is cleared when `manifest.dataVersion` changes.

---

## 5. Exam engine

```ts
// features/exam/generate.ts
export function generateExam(
  blueprint: ExamBlueprint,
  index: QuestionIndex,
  history: UserHistory,
  opts: { smartWeighting: boolean; excludeRecent: boolean }
): GeneratedExam   // { questionIds, warnings[] }

// features/exam/score.ts
export function scoreExam(exam, answers): ExamResult
// ExamResult: { score, passed, chapterBreakdown, objectiveBreakdown, perQuestion[] }
```

**Scoring rules (official):**
- Every question is **1 point**, **no** partial credit
- A `multi` question requires selecting all correct options and none of the wrong ones
- The pass threshold is `meta.exam.passPoints` (26) — never hardcoded
- Negative marking is **not applied**, and the UI does **not claim** "none" either

**Timer:** driven by a `Date.now()` diff, not `requestAnimationFrame` — so it doesn't drift when the tab is backgrounded. Written to IndexedDB every 5 seconds → the attempt survives even if the page is closed.

---

## 6. GitHub Pages deployment

### The path (`base`) problem
If the repo lives under `user.github.io/istqb-prep`, `vite.config.ts`:

```ts
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/istqb-prep/' : '/',
})
```
If a custom domain is acquired, this becomes `base: '/'`.

### SPA routing
GitHub Pages does no server-side rewriting. Two options:

| Option | Pro | Con |
|---|---|---|
| **A. HashRouter** (`/#/exam/123`) | Zero tricks, 100% reliable | Ugly URL, weak SEO |
| **B. `404.html` → copy of `index.html` + `history.replaceState`** | Clean URL, good SEO | A routing jump on first load |

> **Decision: B.** SEO matters to us — searches for "ISTQB practice exam" are our main organic traffic channel. After the build, `dist/index.html` is copied to `dist/404.html` and a small path-recovery script is added to `index.html`.

### `.nojekyll`
A `dist/.nojekyll` file is added; otherwise Jekyll ignores files starting with `_`.

### Workflow

```yaml
# .github/workflows/deploy.yml (summary)
on: { push: { branches: [main] } }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  build:
    steps:
      - checkout
      - setup-node (20)
      - yarn install --frozen-lockfile
      - yarn validate:data     # NO deploy if data is broken
      - yarn build
      - cp dist/index.html dist/404.html
      - touch dist/.nojekyll
      - upload-pages-artifact (dist)
  deploy:
    needs: build
    uses: actions/deploy-pages@v4
```

---

## 7. Performance budget

| Metric | Budget | How |
|---|---|---|
| JS bundle (gzip) | < 200 KB | Route-based `React.lazy`; Recharts only on the result screen |
| First data request | < 60 KB | Only `manifest` + `meta` + `index` (split further if the index grows) |
| Starting an exam | < 300 KB | 4–6 chunks |
| LCP (3G Fast) | < 1,5 s | Critical CSS inlined; font `display: swap` |
| Question transition | < 100 ms | Questions held in memory; no off-render work |
| Lighthouse | ≥ 95 (4 categories) | Measured in CI with `lhci` |

---

## 8. Test strategy

| Level | Tool | Scope |
|---|---|---|
| **Data** | Ajv + custom rules | §6 [`04-data-model.md`](04-data-model.md) — 13 checks |
| **Unit** | Vitest | Exam generation (the 8/6/4/11/9/2 and 8/24/8 distributions hold), scoring (exact match for multi-select), FSRS integration, timer drift |
| **Component** | Testing Library | QuestionCard keyboard interaction, answer preserved across a language switch, the rationale panel shows every option |
| **E2E** | Playwright | Full exam flow; auto-submit when time runs out; attempt recovery after a page reload; dark mode; TR/EN switching |
| **Accessibility** | `@axe-core/playwright` | Zero critical violations on every main route |
| **Visual** | Playwright snapshot | QuestionCard, result screen — light and dark theme |

> This is a **testing certification** project. Test discipline is part of the product itself here; the README will display a test-coverage badge.

---

## 9. Observability and privacy

- **Analytics:** A cookieless counter that collects no personal data (self-hosted Umami or GoatCounter). Page views and event counts only.
- **Never collected:** IP mapping, fingerprinting, user progress, answers.
- **Error reporting:** Sentry is **not used** (third party + privacy). Errors go to the console and an optional "report an error" flow.
- **Question error reports:** opens a pre-filled link to a GitHub Issue template (question ID + version + selected option). No server needed.

---

## 10. Accessibility requirements

- Radix primitives → focus trapping, ARIA roles ready out of the box
- Options use `role="radiogroup"` / `role="group"` + `aria-checked`
- Timer is `aria-live="polite"`, announces once a minute (not once a second — too noisy)
- Correct/incorrect is **never color alone**: icon + text (the Turkish locale string "Doğru" / "Yanlış" — "Correct" / "Incorrect")
- Contrast ≥ 4.5:1, in dark mode too
- `prefers-reduced-motion` is respected
- Full keyboard flow — see [`06-ui-ux-design.md`](06-ui-ux-design.md) §5

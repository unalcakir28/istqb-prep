# 05 — Technical Architecture

**Version:** 1.1 · **Date:** 21.09.2026
**Related ADRs:** [`0001-frontend-stack`](adr/0001-frontend-stack.md) · [`0002-data-layer-static-json`](adr/0002-data-layer-static-json.md) · [`0003-client-side-storage`](adr/0003-client-side-storage.md)

---

## 1. High level

```
┌───────────────────────── Browser ──────────────────────────┐
│                                                           │
│  React SPA (Vite build)                                   │
│  ├── UI layer     Tailwind v4 on native controls          │
│  ├── State        Zustand (session) + Dexie (persistent)  │
│  ├── Data access  contentClient (fetch + cache)           │
│  ├── Selection    scope → selection → scoring             │
│  ├── Session      one shell, three modes                  │
│  ├── SRS engine   ts-fsrs (Phase 3, not installed)        │
│  └── i18n         i18next (interface) + content language  │
│                                                           │
│  IndexedDB   attempts · responses · objectiveProgress     │
│              · srsCards · bookmarks · settings            │
│  Cache API   question and lesson chunks, manifest         │
└────────────────────────────┬───────────────────────────────┘
                             │ static GET
                             ▼
              GitHub Pages (CDN, no server code)
              /index.html  /assets/*  /data/**.json
```

**No backend. No API. No database.** All computation happens client-side.

---

## 2. Technology choices

The **In tree?** column is the honest one: `package.json` is the source of truth, and a choice recorded here is not the same as a dependency installed.

| Layer | Choice | In tree? | Rationale |
|---|---|---|---|
| Build | **Vite 6** | ✅ | Fastest DX, static output, `base` setting handles the GitHub Pages subpath cleanly |
| UI | **React 19 + TypeScript 5** | ✅ | Ecosystem, type safety; a contract can be generated from the data model types |
| Styling | **Tailwind CSS v4** | ✅ | Design tokens as CSS variables; dark mode comes free |
| Components | **shadcn/ui** (Radix-based) | ⬜ | Never needed so far: every control on screen is a native `<input>`, `<button>` or `<select>`, whose behaviour is already correct. The three dialogs (`ShortcutsOverlay`, `QuestionNavigator`, `SubmitConfirm`) use a shared `useDialogFocus` hook instead of a primitive. Revisit when something genuinely needs a combobox or a popover. |
| Routing | **React Router v7** (`createBrowserRouter` + the 404.html trick) | ✅ | No server-side routing on GitHub Pages — see §6 |
| Session state | **Zustand** | ✅ | Small, boilerplate-free; ideal for a session |
| Persistence | **Dexie 4 (IndexedDB)** | ✅ | localStorage quota is insufficient; queryable; migration support |
| SRS | **ts-fsrs** | ⬜ | Phase 3. FSRS-5 implementation; the algorithm Anki uses |
| i18n | **i18next + react-i18next** | ✅ | Interface language; content language is managed separately |
| Charts | hand-rolled SVG (`ScoreBar`) | ✅ | The result breakdown needed bars, not a charting library. Recharts stays on the table for the Phase 3 progress trend. |
| PWA | **vite-plugin-pwa** (Workbox) | ⬜ | Phase 3; `StaleWhileRevalidate` for question chunks |
| Validation | **Ajv** + JSON Schema | ✅ | Data validation in CI |
| Testing | **Vitest** + **Testing Library** + **Playwright** + **axe-core** | ✅ | Unit + component + end-to-end + accessibility |
| Quality | ESLint + Prettier + `tsc --noEmit` | ✅ | CI gate |

### Deliberately not used
- **Next.js** — we can't benefit from SSR/ISR (static export is already Vite's natural output); unnecessary complexity.
- **Redux / TanStack Query** — no server state; over-engineering.
- **A CMS** — content lives in Git; reviewed via PR, validated by CI. That's our quality gate.
- **AI-generated questions at runtime** — quality and copyright risk; see [`07-content-authoring-guide.md`](07-content-authoring-guide.md).

---

## 3. Folder structure

As it stands. Directories marked *planned* do not exist yet.

```
istqb-prep/
├── public/
│   └── data/                    # data/ copied here by scripts/sync-data.ts (generated)
├── data/                        # Source data (reviewed in Git) — questions/, lessons/, terms.json …
├── schemas/                     # JSON Schema definitions, incl. lesson + lessons-index
├── scripts/
│   ├── validate-data.ts         # CI validator — 23 numbered checks
│   ├── build-index.ts           # Builds questions/index.json, lessons/index.json, manifest counts
│   ├── check-i18n.ts            # TR/EN locale key parity — its own CI gate
│   ├── publish-questions.ts     # review -> published, the only path that records a reviewer
│   ├── stats.ts                 # Coverage report (questions per LO) -> docs/coverage.md
│   ├── sync-data.ts             # data/ -> public/data/
│   └── fetch-glossary.ts        # planned (F0-09): ISTQB Glossary API → glossary/
├── src/
│   ├── main.tsx
│   ├── App.tsx                  # the route table — the source of truth for paths
│   ├── routes/
│   │   ├── Home.tsx
│   │   ├── StudyChapters.tsx · StudyChapter.tsx · StudyObjective.tsx · StudySession.tsx
│   │   ├── PracticeSetup.tsx · PracticeSession.tsx
│   │   ├── ExamSetup.tsx · ExamSession.tsx
│   │   ├── ExamResult.tsx       # /sonuc/:attemptId — exam and practice
│   │   ├── Review.tsx           # /inceleme/:attemptId — reached from the result screen
│   │   ├── LegacyExamRedirect.tsx
│   │   ├── Sources.tsx · NotFound.tsx
│   │   ├── MyLists.tsx          # /listelerim — wrong / flagged / never right twice
│   │   ├── Glossary.tsx         # /sozluk — 97 bilingual terms
│   │   └── Progress.tsx         # planned (Phase 3)
│   ├── features/
│   │   ├── session/             # SessionRunner (the shell), sessionStore, routeForAttempt
│   │   ├── exam/                # selectQuestions, generateExam, scoreExam, examTimer, rng
│   │   └── srs/                 # planned (Phase 3)
│   ├── components/              # QuestionCard, OptionList, RationalePanel, QuestionNavigator,
│   │   │                        # ExamTimer, SubmitConfirm, ShortcutsOverlay, LessonCard,
│   │   │                        # ObjectiveStateBadge, ScoreBar, CitationChips, Layout,
│   │   │                        # BlueprintFigure (the home page's exam-shape figure),
│   │   │                        # MediaRenderer (question figures — every kind is text),
│   │   │                        # SegmentedControl (one single-select control, native
│   │   │                        #   radios, used by the language toggle, the review
│   │   │                        #   filter and the glossary chapter filter),
│   │   └──                      # ReportQuestionLink (F2-08) …
│   ├── lib/
│   │   ├── content/             # contentClient, chunk cache (questions and lessons)
│   │   ├── db/                  # db.ts (Dexie v3), migrations.ts, objectiveProgress.ts,
│   │   │                        # questionHistory.ts (the saved lists, derived)
│   │   ├── i18n/                # index.ts + locales/{tr,en}.json
│   │   ├── theme.ts · useAsyncData.ts · useDialogFocus.ts · bilingual.ts
│   │   ├── product.ts           # PRODUCT_NAME, REPO_URL — the name lives here, not in i18n
│   │   ├── useDocumentTitle.ts · useArrivalFocus.ts
│   ├── types/content.ts         # Data model types, hand-written against schemas/
│   ├── test/                    # Vitest setup + shared fixtures
│   └── styles/
├── e2e/                         # Playwright — labels.ts + exam/practice/study/a11y specs
├── docs/
└── .github/workflows/
    ├── ci.yml                   # lint → format → typecheck → test → validate:data → validate:i18n → build → e2e
    └── deploy.yml               # GitHub Pages
```

> Unit tests sit **next to the code they test** (`generateExam.test.ts`, `QuestionCard.test.tsx`), not in a mirrored tree. `src/test/` holds only the Vitest setup file and shared fixtures.

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
  getLessonIndex(certId: string): Promise<LessonIndex>
  getLessonChunk(certId: string, chunk: string): Promise<LessonChunk>
  getLesson(certId: string, objectiveCode: string): Promise<Lesson | null>  // null = not written yet
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
// features/exam/selectQuestions.ts — the one entry point, for all three modes
export function selectQuestions(options: {
  scope: AttemptScope;           // blueprint | chapter | objective | questions
  blueprint: ExamBlueprint;
  pool: QuestionIndexEntry[];    // published entries only
  seed: number;
  exclude?: ReadonlySet<string>;
}): SelectionResult              // { seed, questionIds, shortfalls }

// features/exam/generateExam.ts — the blueprint branch
export function generateExam(options: {
  blueprint: ExamBlueprint;
  pool: QuestionIndexEntry[];
  seed: number;
  exclude?: ReadonlySet<string>;
}): { seed: number; questionIds: string[]; shortfalls: GroupShortfall[] }

// features/exam/scoreExam.ts
export function scoreExam(questions: Question[], answers: AnswerMap, meta: CertMeta): ExamScore
// ExamScore: { points, totalPoints, percent, passPoints, passed,
//              correctCount, incorrectCount, unansweredCount,
//              byChapter, byObjective, byKLevel, outcomes[] }
```

There is no `warnings[]` and nothing throws: a short pool is reported as `shortfalls` and stated to the user before the session starts (rule 8). There is no `smartWeighting`; `preferUnseen` ranks seen questions last instead of excluding them.

**Scoring rules (official):**
- Every question is **1 point**, **no** partial credit
- A `multi` question requires selecting all correct options and none of the wrong ones
- The pass threshold is `meta.exam.passPoints` (26) — never hardcoded
- Negative marking is **not applied**, and the UI does **not claim** "none" either

**Timer:** the attempt stores an absolute `deadlineAt`, and the clock is a `Date.now()` diff against it — so it cannot drift while the tab is backgrounded and there is nothing periodic to persist. `deadlineAt` is `null` for study and practice, which is what "untimed" means; a separate boolean could contradict the timestamp. **Every answer is written to IndexedDB as it is made**, so a session survives a refresh or a close whether or not it is timed; if a write fails, the session says so rather than silently losing progress.

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
| **A. HashRouter** (`/#/sinav/123`) | Zero tricks, 100% reliable | Ugly URL, weak SEO |
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
      - setup-node (22)
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
| JS bundle (gzip) | < 200 KB | Route-based `React.lazy` (every route is lazy in `App.tsx`); no charting library |
| First data request | < 60 KB | Only `manifest` + `meta` + `index` (split further if the index grows) |
| Starting an exam | < 300 KB | 4–6 chunks |
| LCP (3G Fast) | < 1,5 s | Critical CSS inlined; font `display: swap` |
| Question transition | < 100 ms | Questions held in memory; no off-render work |
| Lighthouse | ≥ 95 (4 categories) | Measured in CI with `lhci` |

---

## 8. Test strategy

| Level | Tool | Scope |
|---|---|---|
| **Data** | Ajv + custom rules | §6 [`04-data-model.md`](04-data-model.md) — 23 numbered checks |
| **Unit** | Vitest | Selection (the 8/6/4/11/9/2 and 8/24/8 distributions hold across independent seeds; the scoped paths), scoring (exact match for multi-select), the timer, the Dexie v3 backfill, mastery, `routeForAttempt`, the session store |
| **Component** | Testing Library | `QuestionCard` heading level and option shape, `RationalePanel`'s verdict naming and per-option coverage, `LessonCard`'s missing-card placeholder |
| **E2E** | Playwright | All three modes end to end; auto-submit when time runs out; attempt recovery after a page reload; the legacy `/deneme` redirect; TR/EN switching |
| **Accessibility** | `@axe-core/playwright` + hand-written specs | Zero violations on every main route in both themes, **plus** the failures axe cannot see: focus destinations, accessible names, live-region behaviour |
| **Visual** | Playwright snapshot | Not set up |

Counts as of 22.09.2026: **124 unit tests in 17 files**, **end-to-end specs across 5 files** (`yarn e2e --list` is the count that does not go stale). Unit tests live beside the code they test.

> This is a **testing certification** project. Test discipline is part of the product itself here; the README will display a test-coverage badge.

---

## 9. Observability and privacy

- **Analytics:** A cookieless counter that collects no personal data (self-hosted Umami or GoatCounter). Page views and event counts only.
- **Never collected:** IP mapping, fingerprinting, user progress, answers.
- **Error reporting:** Sentry is **not used** (third party + privacy). Errors go to the console and an optional "report an error" flow.
- **Question error reports:** opens a pre-filled link to a GitHub Issue template (question ID + version + selected option). No server needed.

---

## 10. Accessibility requirements

- Focus trapping is hand-written, in one shared `useDialogFocus` hook — no Radix in the tree (see §2)
- Options are one NAMED group: `role="radiogroup"` (single) / `role="group"` (multi), `aria-labelledby` pointing at the stem **and** the select-count instruction
- Every screen change that is not a page load moves focus and names what happened there — `06-ui-ux-design.md` §4.2
- The visible timer is `aria-live="off"`; a separate sr-only polite region speaks once per remaining minute **only inside the final ten**, plus once at zero (`announcementMinute`) — not once a second, and not for the first fifty minutes either
- Correct/incorrect is **never color alone**: icon + text (the Turkish locale string "Doğru" / "Yanlış" — "Correct" / "Incorrect")
- Contrast ≥ 4.5:1, in dark mode too
- `prefers-reduced-motion` is respected
- Full keyboard flow — see [`06-ui-ux-design.md`](06-ui-ux-design.md) §5

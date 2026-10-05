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
│  ├── SRS engine   ts-fsrs (FSRS, wrong answers → deck)     │
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
| SRS | **ts-fsrs 5** | ✅ | The FSRS reference implementation in TypeScript; the algorithm Anki uses. Run on its default parameters (FSRS-6 weights, 90% target retention, 1 m / 10 m learning steps) with fuzz off, so the interval shown on a grade button is the one it applies. Only `src/features/srs/scheduler.ts` imports it |
| i18n | **i18next + react-i18next** | ✅ | Interface language; content language is managed separately |
| Charts | hand-rolled SVG (`ScoreBar`) and CSS bars | ✅ | The result breakdown, the repetition forecast and the progress trend needed bars, not a charting library. |
| PWA | hand-written: `build/pwa.ts` + `build/sw.template.js` | ✅ | F3-07. Three caching rules did not need Workbox or a new dependency; see §6 *Offline* for why data is network-first, not `StaleWhileRevalidate` |
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
│   ├── data/                    # data/ copied here by scripts/sync-data.ts (generated)
│   └── icons/                   # The web app manifest's icons (192, 512)
├── build/                       # Vite plugin for the PWA: web app manifest + service worker (F3-07)
├── data/                        # Source data (reviewed in Git) — questions/, lessons/, terms.json …
├── schemas/                     # JSON Schema definitions, incl. lesson + lessons-index
├── scripts/
│   ├── validate-data.ts         # CI validator — 24 live checks (#1–#26; #14, #23 retired)
│   ├── build-index.ts           # Builds questions/index.json, lessons/index.json, the manifest (certification list + counts)
│   ├── check-i18n.ts            # TR/EN locale key parity — its own CI gate
│   ├── publish-questions.ts     # review -> published, the only path that records a reviewer
│   ├── stats.ts                 # Coverage report (questions per LO) -> docs/coverage.md
│   ├── sync-data.ts             # data/ -> public/data/
│   └── fetch-glossary.ts        # ISTQB Glossary API -> data/<cert>/glossary/ (F0-09, yarn fetch:glossary)
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
│   │   ├── ExamProcess.tsx      # /sinav-sureci — taking the exam in Turkey, through TTB (F4-07)
│   │   ├── MyLists.tsx          # /listelerim — wrong / flagged / never right twice
│   │   ├── Glossary.tsx         # /sozluk — the active certification's terms (97 CTFL · 156 CT-AI)
│   │   ├── Repetition.tsx       # /tekrar — the SRS review screen
│   │   ├── Progress.tsx         # /ilerleme — readiness, streak, mock exams, per chapter
│   │   └── MyData.tsx           # /verilerim — download / load the progress file
│   ├── features/
│   │   ├── session/             # SessionRunner (the shell), sessionStore, routeForAttempt
│   │   ├── exam/                # selectQuestions, generateExam, scoreExam, examTimer, rng, optionOrder
│   │   ├── srs/                 # scheduler (the only ts-fsrs import), interval, queue
│   │   └── progress/            # examPoints, readiness, chapterProgress, streak (F3-05/F3-06)
│   ├── components/              # QuestionCard, OptionList, RationalePanel, QuestionNavigator,
│   │   │                        # ExamTimer, SubmitConfirm, ShortcutsOverlay, LessonCard,
│   │   │                        # ObjectiveStateBadge, ScoreBar, CitationChips, Layout,
│   │   │                        # BlueprintFigure (the home page's exam-shape figure),
│   │   │                        # MediaRenderer (question figures — every kind is text),
│   │   │                        # SegmentedControl (one single-select control, native
│   │   │                        #   radios, used by the language toggle, the review
│   │   │                        #   filter and the glossary chapter filter),
│   │   │                        # StorageWarning (every screen: storage does not open),
│   │   │                        # StorageSection (/verilerim: persistence, F3-12),
│   │   └──                      # ReportQuestionLink (F2-08) …
│   ├── lib/
│   │   ├── content/             # contentClient, chunk cache (questions and lessons)
│   │   ├── db/                  # db.ts (Dexie v3), migrations.ts, objectiveProgress.ts,
│   │   │                        # questionHistory.ts (the saved lists, derived),
│   │   │                        # srsCards.ts (the repetition deck), backup.ts (export/import)
│   │   ├── i18n/                # index.ts + locales/{tr,en}.json
│   │   ├── theme.ts · useAsyncData.ts · useDialogFocus.ts · bilingual.ts · isTextEntry.ts
│   │   ├── product.ts           # PRODUCT_NAME, REPO_URL — the name lives here, not in i18n
│   │   ├── useDocumentTitle.ts · useArrivalFocus.ts · certification.ts
│   │   ├── registerServiceWorker.ts  # registers build/pwa.ts's sw.js, production builds only
│   │   ├── storage.ts · useStorageStatus.ts  # does this browser keep the data (F3-12)
│   ├── types/content.ts         # Data model types, hand-written against schemas/
│   ├── test/                    # Vitest setup + shared fixtures
│   └── styles/
├── e2e/                         # Playwright — labels.ts, deck.ts + exam/practice/study/lists-and-glossary/repetition/my-data/storage/certification/progress/process/a11y specs
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

**Which certification (F4-01).** `getActiveCertification()` returns the candidate's pick from the home screen if it is still `active` in the manifest, else the first `active` one (`src/lib/certification.ts`, kept in localStorage like the theme). Every setup, study, list and glossary screen goes through it. A session, its result and its review never do: they load the content of their own `attempt.certId`, which is why check #25 holds the manifest `id`, its `path` and `meta.id` equal. IndexedDB needed no change — every progress row already carried `certId`, and the repetition deck is keyed by a question id that is unique across certifications (#25). The decision record: [`adr/0006-second-certification.md`](adr/0006-second-certification.md).

**Cache invalidation:** the Cache API cache is named after `manifest.dataVersion` (`istqb-prep-content:<version>`), and every other content cache is deleted when a new version is first seen. The version used to be compared only with the last one the current page load had seen — none, on a fresh load — so a release between two visits cleared nothing and a returning visitor kept the old pool. `dataVersion` itself is a hash of every content file, computed by `yarn build:index`, so it changes exactly when the content does; it used to be a date typed by hand, and it read `2026.09.19` through two later content releases.

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
- A question is worth its K-level's points from the blueprint's groups: 1 for every CTFL question, 2 for a CT-AI K3 question (`src/features/exam/points.ts`, check #24); **no** partial credit
- A `multi` question requires selecting all correct options and none of the wrong ones
- The pass threshold is `meta.exam.passPoints` (CTFL: 26) — never hardcoded
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

### Offline (F3-07)
`build/pwa.ts` emits `manifest.webmanifest` (name from `src/lib/product.ts`, icons from `public/icons/`) and `sw.js`, which is `build/sw.template.js` with the build's file list and a version hashed from those files' contents, so a change to any of them, `index.html` and the icons included, ships a new worker. `src/lib/registerServiceWorker.ts` registers it in production builds only, so the dev server and the E2E specs never run under a worker.

| Request | Rule | Why |
|---|---|---|
| The shell: `index.html` and every emitted script, style and icon | Cached on install (bypassing the HTTP cache), then cache-first | The worker's version covers their contents, so a cached copy is replaced whenever one changes; the app opens with no network |
| `data/manifest.json` | Network-first, the last copy only when offline | Offline, it names the `dataVersion` whose content `contentClient` cached |
| Anything else under `data/` | Not handled: straight to the network | The file names never change and `contentClient` already caches per `dataVersion`. A copy here would carry no version and, offline, would be stored as the new version's content. Stale-while-revalidate would do the same online |
| A page navigation | Network, whatever the status; the cached shell offline | GitHub Pages serves deep links as its 404 page, and that page is the app |

There is no `skipWaiting`: a new worker waits until every tab of the old one is closed, so a running tab keeps the shell its lazy chunks belong to. Offline, a screen opens if its content was loaded once online; one never visited shows the error notice.

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
| **Data** | Ajv + custom rules | §6 [`04-data-model.md`](04-data-model.md) — 24 live checks (#1–#26; #14, #23 retired) |
| **Unit** | Vitest | Selection (the 8/6/4/11/9/2 and 8/24/8 distributions hold across independent seeds; the scoped paths), scoring (exact match for multi-select), the timer, the Dexie v3 backfill, mastery, `routeForAttempt`, the session store, the FSRS scheduler (a card reloaded from its row schedules exactly as the library's own), the interval preview and the due queue, the progress file's validation and merge, the content cache across visits |
| **Component** | Testing Library | `QuestionCard` heading level and option shape, `RationalePanel`'s verdict naming and per-option coverage, `LessonCard`'s missing-card placeholder |
| **E2E** | Playwright | All three modes end to end; auto-submit when time runs out; attempt recovery after a page reload; the legacy `/deneme` redirect; TR/EN switching; a wrong answer reaching the repetition deck, and a rating storing the schedule its button showed; a progress file downloaded in one browser and loaded in another |
| **Accessibility** | `@axe-core/playwright` + hand-written specs | Zero violations on every main route in both themes, **plus** the failures axe cannot see: focus destinations, accessible names, live-region behaviour |
| **Visual** | Playwright snapshot | Not set up |

Counts as of 05.10.2026: **224 unit tests in 29 files**, **82 end-to-end specs across 11 files** (`yarn e2e --list` is the count that does not go stale). Unit tests live beside the code they test.

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

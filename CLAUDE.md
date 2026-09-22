# CLAUDE.md

This file is for Claude Code sessions working in this repo. Kept short; details live under `docs/`.

## Project

**ISTQB-PREP** — a **free, open-source, bilingual (TR/EN)** mock exam and study platform for ISTQB certification exam preparation. The product name matches the repo name (D-01).
**Priority: CTFL v4.0.1 (Foundation Level).** The architecture is designed to cover all levels, but content comes Foundation-first.

**Current status: working MVP, three modes.** Phase 0 and Phase 1 are closed and the first slice of Phase 2 has landed: 120 questions published (64/64 learning objectives covered), the exam engine generates from the official LO-group distribution, and **study**, **practice** and **exam** all run on one shared session shell. Exam and practice end on the shared result screen and its review pass; study keeps its result inside its own route, next to the objective it belongs to. The lesson files ship empty — writing the 64 explanation cards is Track C. See `TODO.md`.

## Read these first

| If you're going to... | Read first                                                           |
| --------------------- | -------------------------------------------------------------------- |
| Anything              | `docs/00-project-overview.md`                                        |
| Touch a data file     | `docs/04-data-model.md`                                              |
| Write code            | `docs/05-technical-architecture.md` + `docs/adr/`                    |
| Build UI              | `docs/06-ui-ux-design.md`                                            |
| **Write a question**  | `docs/07-content-authoring-guide.md` (mandatory)                     |
| Need ISTQB data       | `docs/03-istqb-reference.md` — **verified facts, don't re-research** |

## Inviolable rules

These are not up for debate; violating them collapses the project either legally or as an identity.

1. **Official ISTQB/TTB sample exam questions are never copied, translated, or "adapted."** Changing the numbers isn't adaptation, it's a derivative work. Every question is written from scratch from a learning objective (LO). → `docs/adr/0004-original-question-authoring.md`
   The `origin` field **has no** `official` value.
2. **A rationale is mandatory for every option** (`rationale.byOption`), in TR and EN. _"Wrong, because the correct answer is C"_ is not a rationale — every wrong option states **what it actually describes**. This is the product's main differentiator.
3. **Every question includes TR and EN.** If either is missing, it can't be published. → `docs/adr/0005-bilingualism.md`
4. **Every content item carries a `syllabusVersion`** and shows up as a badge in the UI. Outdated content is never deleted, it gets `status: "retired"`.
5. **Nothing unverified is asserted.** Example: negative marking doesn't appear in any official document → `negativeMarking: null`. Writing `false` would be wrong. The list of unverifiable items: `docs/03-istqb-reference.md §7`.
6. **No commercial use.** No ads, no subscriptions, no payments — ISTQB's _"for non-commercial use"_ condition is our copyright basis.
7. **No backend, no accounts, no data goes to a server.** All progress lives in IndexedDB.
8. **A mock exam is never silently generated incomplete.** If the pool is insufficient, the user is told explicitly.

## Verified constants (don't re-research)

CTFL v4.0.1 · 40 questions · 40 points · pass mark **26** (65%) · 60 min (**75 min** for non-native English speakers)
Every question is worth **exactly 1 point** — Foundation has NO multi-point K3 questions.
Questions with more than one correct answer ("HANGİ İKİSİ") **do exist**, still worth 1 point.

| Section   | 1   | 2   | 3   | 4   | 5   | 6   | Total  |
| --------- | --- | --- | --- | --- | --- | --- | ------ |
| Questions | 8   | 6   | 4   | 11  | 9   | 2   | **40** |
| LOs       | 14  | 10  | 8   | 14  | 16  | 2   | **64** |

Question K-distribution: **K1=8, K2=24, K3=8** · LO K-distribution: K1=14, K2=42, K3=8 (the two **differ**, don't mix them up)
K3 questions only appear in Sections 4 and 5. **There is no K4.**

These numbers live in `data/ctfl-v4.0.1/syllabus.json` and `meta.json`; they are **never hardcoded**, they're read from there.

## Commands

**Package manager: yarn** — don't use npm. Dependencies are pinned to exact versions (no `^`/`~`).
**Node 22** — that is what CI pins (`node-version: 22`). `package.json` has no `engines` field, so nothing warns you locally if you are on another major.

```bash
yarn dev                # Vite (predev: syncs data/ -> public/data/)
yarn validate:data      # JSON Schema (#1) + 19 consistency checks (#2-#20)  ← must be green on every PR
yarn validate:i18n      # src/lib/i18n/locales/*.json key parity (TR/EN), CI gate
yarn build:index        # builds questions/index.json, lessons/index.json + manifest counts from the chunks
yarn stats              # per-LO coverage → docs/coverage.md + README badges
yarn publish:questions  # review -> published; --reviewer is mandatory (the only path through)
yarn sync:data          # data/ -> public/data/ (needed when data/ changes while the dev server runs)
yarn test               # Vitest (unit) — 94 tests in 15 files
yarn e2e                # Playwright: 47 specs across 4 files — flow + axe accessibility (its own dev server, 5183)
yarn e2e:ui             # the same specs in Playwright's UI mode
yarn build              # tsc -b && vite build (CI gate)
yarn lint && yarn typecheck && yarn format
yarn format:write       # prettier --write (yarn format is check-only, it fails CI)
```

**After editing data, in order:** `yarn build:index && yarn validate:data`.

**CI gate, in order:** `lint → format → typecheck → test → validate:data → validate:i18n → build → e2e`. All eight must be green.

## Folder structure

```
data/       Content — indexed, chunked static JSON (NO single file)
schemas/    JSON Schema — CI gate
docs/       Project docs + adr/
scripts/    validate-data, check-i18n, build-index, stats, sync-data, publish-questions
src/        The app (Vite + React + TS)
e2e/        Playwright: flow + accessibility
```

Where things live inside `src/`:

```
features/session/  The three modes' shared machinery — SessionRunner (one shell
                   for study/practice/exam: load-and-resume, question card,
                   navigator, keyboard, announcements), sessionStore (Zustand,
                   was examStore), routeForAttempt (an attempt's own URL)
features/exam/     Selection and scoring — selectQuestions (one entry point,
                   three scopes: blueprint / chapter / objective), generateExam
                   (blueprint-driven, seeded, reproducible), scoreExam (exact
                   match, NO partial credit), examTimer (absolute Date.now()
                   deadline), rng
lib/content/       Static JSON access + a two-tier cache (Map + Cache API),
                   invalidated via dataVersion. Questions AND lessons.
lib/db/            Dexie/IndexedDB — the single place for persistence. db.ts
                   (schema v3), migrations.ts (the v3 backfill, extracted so it
                   is unit-testable), objectiveProgress.ts (study mastery)
lib/i18n/          UI language; question language is a separate concept (attempt.contentLang)
routes/            Screens · components/ shared UI · types/content.ts data types
```

Routes (`src/App.tsx` is the source of truth). The paths are Turkish, like the rest of the user-facing surface:

```
/                              Home — three mode cards, resume banner
/calisma                       Study: chapters
/calisma/:chapter              Study: that chapter's objectives
/calisma/lo/:loCode            Study: one objective — lesson card + start test
/calisma/lo/:loCode/:attemptId Study: the objective test AND its result, same route
/alistirma  ·  /alistirma/:attemptId   Practice setup · session
/sinav      ·  /sinav/:attemptId       Exam setup · session
/sonuc/:attemptId              Result   — exam and practice; study keeps its result in its own route
/inceleme/:attemptId           Review   — reached from the result screen
/kaynaklar                     Sources
/deneme  ·  /deneme/:attemptId Legacy redirect to /sinav — old bookmarks keep working
```

## Claude Code tooling (`.claude/`)

Two PreToolUse hooks **block** Edit/Write with exit 2. That is the design, not a bug:

- `guard-publish.sh` — setting a question's `status` field to `published` by hand is blocked. The only path is `yarn publish:questions --reviewer "<name>" --chunk <chunk>`, because that is the one place the reviewer gets recorded. Editing the question text itself is not blocked. **It only matches `data/*/questions/*.json`**, and `publish:questions` only walks that directory — so `data/*/lessons/` has no publishing gate yet. Check #18 still refuses a published lesson with an empty `meta.reviewedBy`, but nothing stops a hand-written reviewer. Track C needs that gate.
- `guard-generated.sh` — `questions/index.json`, `lessons/index.json`, `data/manifest.json`, `docs/coverage.md`, `public/data/*` and `yarn.lock` are outputs. Edit the source, then run `yarn build:index` (index, manifest), `yarn stats` (coverage.md), `yarn sync:data` (public/data) or `yarn add <pkg>@<exact-version>` (lockfile).

PostToolUse, each one scoped to the paths it cares about:

- `validate-data.sh` — on `data/*.json`: reruns `build:index`, `validate:data`, `sync:data` and `stats`. An error comes back to the session; `sync:data` and `stats` stay quiet because `public/data/`, `docs/coverage.md` and the README badges are generated and cannot be written by hand.
- `typecheck.sh` — on `src/**/*.ts(x)`: `yarn typecheck`, reported back on failure.
- `lint.sh` — on `src/**/*.ts(x)`: `yarn lint`. Types and formatting are already covered; this is here for the rules the compiler cannot see, `react-hooks/exhaustive-deps` above all.
- `i18n-parity.sh` — on `src/lib/i18n/locales/*.json`: `yarn validate:i18n`. i18next falls back to English for a missing Turkish key and the E2E specs read English labels, so nothing else turns red.
- `format.sh` — Prettier on the written file, always silent.

Agents: `question-writer` (writes new questions at status `review`), `question-verifier` (adversarial check before publishing), `syllabus-fact-checker` (checks a claim against the verified sources), `doc-drift-auditor` (checks whether a change made a documented count, path or behaviour false — no CI step does), `a11y-reviewer` (the accessibility failures axe cannot see: focus order, announcements, keyboard reachability).

Skills: `question-authoring` (rules for `data/*/questions/`, model-loaded) · `/pre-pr` (runs the CI gate locally) · `/new-questions` (stats → write → verify → publish chain). The last two are user-invocable only, because publishing has side effects.

`.mcp.json` is checked in: Playwright (pinned `@playwright/mcp@0.0.82`) and context7. context7 reads `CONTEXT7_API_KEY` from the environment and works unauthenticated without it.

`.superpowers/` is the **SDD scratch workspace** — the spec, the plan's ledger (`progress.md`), and one brief / review package / report per task. It is gitignored and prettier-ignored on purpose: it is a working record of how a branch was built, not a deliverable. The plan itself is checked in under `docs/superpowers/`. When a task's report and the tree disagree, the tree wins — see the two review-package pitfalls below for how a report comes to be wrong about its own diff.

## Conventions

- **Language:** Talk to the user in Turkish; everything written to a file is English.
- **The LO code `FL-x.y.z` is the primary key** — it stays in English even in the Turkish syllabus, it's language-independent.
- **Question IDs are `ctfl4-NNNN`**, never reused.
- **At most 40 questions per question chunk**; the filename never changes (CDN + PWA caching).
- **Turkish terminology:** `error/defect/failure` → **`insan hatası/hata/arıza`** (official TTB v4.0.1). The three are never all translated as "hata" — this distinction is asked directly on the exam. **`kusur` is not used**, it doesn't appear in the syllabus. The single source of truth is `data/ctfl-v4.0.1/terms.json` (97 terms, aligned from the official keyword lists); a readable table is in `docs/07-content-authoring-guide.md §5`.
- Emphasis words in question text are UPPERCASE: `EN İYİ`, `HARİÇ`, `DEĞİLDİR`, `HANGİ İKİSİ`.
- If `meta.reviewedBy` is empty, `status` **cannot be `published`** — for a question (schema) or a lesson (check #18).
- **One lesson per learning objective, keyed by `objective`.** Lesson chunks are `chNN.json`, one per chapter; TR and EN must carry the same number of `keyPoints` and `commonMistakes` (check #17). Paragraphs are plain text — there is no Markdown renderer.

## Pitfalls

Each of these bit once. Don't let it bite twice.

- **After editing `data/`**, run `yarn build:index && yarn validate:data`. If `data/` changes while the dev server is running, `public/data/` goes stale: `predev`/`prebuild` only sync at startup, use `yarn sync:data` after that. `validate-data.sh` does this for edits made from a session; an edit made by hand still needs the command.
- **`yarn test` (Vitest) must not collect files from `e2e/`.** The exclude in `vitest.config.ts` prevents this; remove it and Playwright's `test.beforeEach` blows up, and the command comes back red even if all 94 unit tests pass.
- **The E2E browser launches with the `en-US` locale**, set explicitly in `playwright.config.ts`. UI language is picked from `navigator.language`, so the specs select on English labels — read from `src/lib/i18n/locales/en.json` through `e2e/labels.ts`, never retyped in a spec. `ExamSetup` seeds the question language from the UI language too, so a test that cares about question language sets it explicitly instead of assuming the locale.
- **If `GITHUB_ACTIONS` is set, Vite's `base` becomes `/istqb-prep/`.** `playwright.config.ts` deliberately clears this variable, otherwise `baseURL` won't hold.
- **`"resolutions": { "vite": "6.4.3" }` is never removed.** Vitest brings in its own Vite 7; with both type trees present at once, `typecheck` and `build` break.
- **Options can be checkboxes, not radios.** In a multi-select ("HANGİ İKİSİ") question, `getByRole("radio")` never matches; look for both in tests.
- **An unfinished attempt resumes from the first unanswered question**, not from where you left off (`sessionStore.resumeAttempt` — the store moved from `features/exam/examStore.ts` to `features/session/sessionStore.ts`).
- **Never reference an option by letter inside the question text** ("option (c)..."). Check 15 flags this as an error: option positions get rebalanced, the letters change, and the reference in the prose goes stale.
- **An attempt has exactly one legal URL, and `routeForAttempt` decides it** from the stored `mode` and `scope`. `SessionRunner` redirects anything that arrives anywhere else, so a test that hardcodes a session URL silently lands somewhere else instead of failing where it was written. Navigate the way a user does, or derive the path.
- **Instant feedback locks the answer.** Once `revealedAt` is set, `sessionStore.select` refuses that question. A test that wants to keep changing answers must switch instant feedback off on the practice setup screen — study mode always has it on.
- **`git diff HEAD` does not show untracked files.** A review package built from it over a task that added new files reviews _nothing_ and looks like a clean, small diff. Use `git status --porcelain` to find the `??` entries and add them explicitly (`git diff --no-index /dev/null <file>`, or stage with `git add -N` first).
- **zsh does not word-split an unquoted variable.** `FILES="a.ts b.ts"; git diff HEAD -- $FILES` passes the single pathspec `a.ts b.ts`, which matches nothing — git exits 0 with an empty diff rather than erroring, so the mistake reads as "no changes". Use an array (`files=(a.ts b.ts); git diff HEAD -- $files`) or `"${(z)FILES}"`.

## Don't

- Add official questions to the pool (rule 1)
- Re-research the facts in `docs/03-istqb-reference.md` — they're verified and sourced
- Hardcode exam constants in code — read them from `meta.json`
- Add Next.js / Redux / TanStack Query — the reasoning is in `docs/adr/0001-frontend-stack.md` and `docs/05-technical-architecture.md` §2
- Generate questions with AI at runtime — quality and copyright risk (`docs/07-content-authoring-guide.md` §8)
- Add anything from the "deliberately deferred" list at the end of `docs/09-roadmap.md` without reopening the discussion first
- Ask an AI to "write an ISTQB sample exam question" — the model might reproduce an official one from memory

## Up next

`TODO.md` → the rest of **Phase 2**. Phase 0, Phase 1 and the three-mode slice of Phase 2 are closed — the blueprint has 29 LO groups, all 64 learning objectives are processed, the validator runs 20 numbered checks (#1 is the JSON Schema gate; 14 errors, 6 warnings). What's still open:

1. **F0-02** — Visually verify the ISTQB Glossary license in the browser; glossary definitions aren't copied verbatim until this is verified.
2. **Track C — the 64 lesson cards.** The schemas, the index, the four lesson checks and the whole study UI are live; `data/ctfl-v4.0.1/lessons/ch0*.json` all ship `"lessons": []`. Every objective currently renders the missing-card placeholder.
3. **Track D — deepen the pool.** `yarn validate:data` reports 116 warnings: 52 "this LO has fewer than 3 published questions" and 64 "this LO has no published lesson yet". Phase 2 targets 200 questions, Phase 3 targets 300, with ≥3 per LO.
4. **Track A — official-question handling** arrives as Dexie v4 and an extra `origin` value. Nothing about it is built; the extension point is the union in `src/types/content.ts`.
5. **The rest of Phase 2** — re-queue a wrong answer (F2-02), LO weakness analysis (F2-04), glossary (F2-05), side-by-side TR/EN (F2-06), error reporting (F2-08). `docs/09-roadmap.md`.

No open decisions remain — D-01…D-05 were closed on 19.09.2026 (`docs/00-project-overview.md §9`):
product name **ISTQB-PREP** (brand risk knowingly accepted — `10 §R-01b`; the name is never hardcoded in code) · no domain, `*.github.io` · content license **CC BY-SA 4.0** · community question PRs are closed in v1 (Phase 4) · **no** permission application will be filed with ISTQB/TTB (basis: original content + non-commercial use + source attribution).

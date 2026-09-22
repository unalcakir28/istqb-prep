# CLAUDE.md

This file is for Claude Code sessions working in this repo. Kept short; details live under `docs/`.

## Project

**ISTQB-PREP** — a **free, open-source, bilingual (TR/EN)** mock exam and study platform for ISTQB certification exam preparation. The product name matches the repo name (D-01).
**Priority: CTFL v4.0.1 (Foundation Level).** The architecture is designed to cover all levels, but content comes Foundation-first.

**Current status: working MVP, three modes, all 64 lesson cards written.** Phase 0 and Phase 1 are closed and most of Phase 2 has landed: the exam engine generates from the official LO-group distribution, and **study**, **practice** and **exam** all run on one shared session shell. Exam and practice end on the shared result screen and its review pass; study keeps its result inside its own route, next to the objective it belongs to. Track C is closed — all 64 explanation cards are written and published. Track D is closed too: the pool is 256 published questions, at least 4 for every one of the 64 objectives. See `TODO.md`.

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

CTFL v4.0.1 · 40 questions · 40 points · pass mark **26** (65%) · **60 min**
ISTQB grants +25% (75 min) to a candidate sitting in a language that is not their own. That is a property of the sitting, not of the paper, so the product does not offer it and `meta.json` no longer carries `extendedDurationMinutes` (D-06). The figure stays recorded in `docs/03-istqb-reference.md` and in `data/certifications.json`, which is the reference catalogue of every ISTQB exam rather than the exam we run.
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
yarn validate:data      # JSON Schema (#1) + 22 consistency checks (#2-#23)  ← must be green on every PR
yarn validate:i18n      # src/lib/i18n/locales/*.json key parity (TR/EN), CI gate
yarn build:index        # builds questions/index.json, lessons/index.json + manifest counts from the chunks
yarn stats              # per-LO coverage → docs/coverage.md + README badges
yarn publish:questions  # review -> published; --reviewer is mandatory (the only path through)
yarn publish:lessons    # the same script with --kind lessons; --reviewer is mandatory
yarn sync:data          # data/ -> public/data/ (needed when data/ changes while the dev server runs)
yarn test               # Vitest (unit)
yarn e2e                # Playwright: 57 specs across 5 files — flow + axe accessibility (its own dev server, 5183)
yarn e2e:ui             # the same specs in Playwright's UI mode
yarn build              # tsc -b && vite build (CI gate)
yarn lighthouse         # lhci autorun — asserts >=95 in all 4 categories; needs `yarn build` first
yarn lint && yarn typecheck && yarn format
yarn format:write       # prettier --write (yarn format is check-only, it fails CI)
```

**After editing data, in order:** `yarn build:index && yarn validate:data`.

**CI gate, in order:** `lint → format → typecheck → test → validate:data → validate:i18n → build → e2e → lighthouse`. All nine must be green.

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
                   four scopes: blueprint / chapter / objective / questions,
                   the last being an explicit id list), generateExam
                   (blueprint-driven, seeded, reproducible), scoreExam (exact
                   match, NO partial credit), examTimer (absolute Date.now()
                   deadline), rng
lib/content/       Static JSON access + a two-tier cache (Map + Cache API),
                   invalidated via dataVersion. Questions AND lessons.
lib/db/            Dexie/IndexedDB — the single place for persistence. db.ts
                   (schema v3), migrations.ts (the v3 backfill, extracted so it
                   is unit-testable), objectiveProgress.ts (study mastery),
                   questionHistory.ts (the saved lists, derived from the
                   answers already stored — nothing new is persisted)
lib/i18n/          UI language; question language is a separate concept (attempt.contentLang)
lib/bilingual.ts   TR+EN side by side — a display preference in localStorage,
                   deliberately NOT on the attempt: "both" is not a language
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
/listelerim                    My lists — wrong · flagged · never right twice in a row
/sozluk                        Glossary — 97 bilingual terms, no definitions (see F2-11)
/kaynaklar                     Sources
/deneme  ·  /deneme/:attemptId Legacy redirect to /sinav — old bookmarks keep working
```

## Claude Code tooling (`.claude/`)

Two PreToolUse hooks **block** Edit/Write with exit 2. That is the design, not a bug:

- `guard-publish.sh` — setting a `status` field to `published` by hand is blocked, for a question **and** for a lesson (F2-12). The only paths are `yarn publish:questions --reviewer "<name>" --chunk <chunk>` and `yarn publish:lessons --reviewer "<name>" --chunk <chunk>` (both take `--all`, `--except` and `--dry-run`), because that is the one place the reviewer gets recorded. Editing the text itself is not blocked. Both commands are the same script behind `--kind questions|lessons`.
- `guard-generated.sh` — `questions/index.json`, `lessons/index.json`, `data/manifest.json`, `docs/coverage.md`, `public/data/*` and `yarn.lock` are outputs. Edit the source, then run `yarn build:index` (index, manifest), `yarn stats` (coverage.md), `yarn sync:data` (public/data) or `yarn add <pkg>@<exact-version>` (lockfile).

PostToolUse, each one scoped to the paths it cares about:

- `validate-data.sh` — on `data/*.json`: reruns `build:index`, `validate:data`, `sync:data` and `stats`. An error comes back to the session; `sync:data` and `stats` stay quiet because `public/data/`, `docs/coverage.md` and the README badges are generated and cannot be written by hand.
- `typecheck.sh` — on `src/**/*.ts(x)`: `yarn typecheck`, reported back on failure.
- `lint.sh` — on `src/**/*.ts(x)`: `yarn lint`. Types and formatting are already covered; this is here for the rules the compiler cannot see, `react-hooks/exhaustive-deps` above all.
- `i18n-parity.sh` — on `src/lib/i18n/locales/*.json`: `yarn validate:i18n`. i18next falls back to English for a missing Turkish key and the E2E specs read English labels, so nothing else turns red.
- `format.sh` — Prettier on the written file, always silent.

Agents: `question-writer` (writes new questions at status `review`), `question-verifier` (adversarial check before publishing), `lesson-writer` / `lesson-verifier` (the same pair for lesson cards — C-02), `syllabus-fact-checker` (checks a claim against the verified sources), `doc-drift-auditor` (checks whether a change made a documented count, path or behaviour false — no CI step does), `a11y-reviewer` (the accessibility failures axe cannot see: focus order, announcements, keyboard reachability).

**All seven pin `model: sonnet` in their frontmatter.** That is not a preference restated — it is load-bearing. `CLAUDE_CODE_SUBAGENT_MODEL` does not reach the subagent in the desktop app: the sibling keys in the same `settings.json` `env` block do arrive (`echo $ANTHROPIC_BASE_URL` proves it), that one does not, and an agent with no `model:` therefore inherits the main thread's Opus instead of the configured default. Removing the line silently triples the cost of a fan-out. Override at the call site when a job genuinely needs more.

Skills: `question-authoring` (rules for `data/*/questions/`, model-loaded) · `/pre-pr` (runs the CI gate locally) · `/new-questions` (stats → write → verify → publish chain). The last two are user-invocable only, because publishing has side effects.

`.mcp.json` is checked in: Playwright (pinned `@playwright/mcp@0.0.82`) and context7. context7 reads `CONTEXT7_API_KEY` from the environment and works unauthenticated without it.

`.superpowers/` is the **SDD scratch workspace** — the spec, the plan's ledger (`progress.md`), and one brief / review package / report per task. It is gitignored and prettier-ignored on purpose: it is a working record of how a branch was built, not a deliverable. The plan itself is checked in under `docs/superpowers/`. When a task's report and the tree disagree, the tree wins — see the two review-package pitfalls below for how a report comes to be wrong about its own diff.

## Conventions

- **Language:** Talk to the user in Turkish; everything written to a file is English.
- **The LO code `FL-x.y.z` is the primary key** — it stays in English even in the Turkish syllabus, it's language-independent.
- **Question IDs are `ctfl4-NNNN`**, never reused.
- **At most 40 questions per question chunk**; the filename never changes (CDN + PWA caching).
- **Turkish terminology:** `error/defect/failure` → **`insan hatası/hata/arıza`** (official TTB v4.0.1). The three are never all translated as "hata" — this distinction is asked directly on the exam. **`kusur` is not used** for `defect` — it is in `trForbidden`. It is not absent from the syllabus, though: the TR syllabus writes _kusur maskelenmesi_ (§4.2.4) and _kusur ortaya çıkarmaya yönelik saldırılar_ (§4.4.1, fault attacks). Our content writes _hata maskelenmesi_ there, because `terms.json` is the authority — see the correction box in `docs/07-content-authoring-guide.md §5`. The single source of truth is `data/ctfl-v4.0.1/terms.json` (97 terms, aligned from the official keyword lists); a readable table is in `docs/07-content-authoring-guide.md §5`.
- Emphasis words in question text are UPPERCASE: `EN İYİ`, `HARİÇ`, `DEĞİLDİR`, `HANGİ İKİSİ`.
- If `meta.reviewedBy` is empty, `status` **cannot be `published`** — for a question (schema) or a lesson (check #18).
- **One lesson per learning objective, keyed by `objective`.** Lesson chunks are `chNN.json`, one per chapter; TR and EN must carry the same number of `keyPoints` and `commonMistakes` (check #17). Paragraphs are plain text — there is no Markdown renderer.

## Pitfalls

Each of these bit once. Don't let it bite twice.

- **IndexedDB has no boolean key type.** `objectiveProgress.mastered` is in the index string, but `db.objectiveProgress.where({ mastered: true })` matches nothing — Dexie silently returns an empty set rather than erroring. Filter in memory; there are 64 rows at most (`Home.tsx` `loadProgress`).
- **`@testing-library/user-event` is not installed.** Use `fireEvent` from `@testing-library/react`. Reaching for `userEvent` out of habit means proposing a new dependency, which needs asking first.
- **Run several writing subagents in parallel only when each owns its own file.** They all trigger the `validate-data.sh` PostToolUse hook, which rewrites the shared `questions/index.json` and `manifest.json`, so one agent can be shown another's half-written index. Give each a separate chunk file and a reserved id range, tell them an error naming another chapter is not theirs, and re-run `yarn build:index && yarn validate:data` centrally when they are all done.

- **After editing `data/`**, run `yarn build:index && yarn validate:data`. If `data/` changes while the dev server is running, `public/data/` goes stale: `predev`/`prebuild` only sync at startup, use `yarn sync:data` after that. `validate-data.sh` does this for edits made from a session; an edit made by hand still needs the command.
- **`yarn test` (Vitest) must not collect files from `e2e/`.** The exclude in `vitest.config.ts` prevents this; remove it and Playwright's `test.beforeEach` blows up, and the command comes back red even if all 124 unit tests pass.
- **The E2E browser launches with the `en-US` locale**, set explicitly in `playwright.config.ts`. UI language is picked from `navigator.language`, so the specs select on English labels — read from `src/lib/i18n/locales/en.json` through `e2e/labels.ts`, never retyped in a spec. `ExamSetup` seeds the question language from the UI language too, so a test that cares about question language sets it explicitly instead of assuming the locale.
- **If `GITHUB_ACTIONS` is set, Vite's `base` becomes `/istqb-prep/`.** `playwright.config.ts` deliberately clears this variable, otherwise `baseURL` won't hold.
- **`"resolutions": { "vite": "6.4.3" }` is never removed.** Vitest brings in its own Vite 7; with both type trees present at once, `typecheck` and `build` break.
- **Options can be checkboxes, not radios.** In a multi-select ("HANGİ İKİSİ") question, `getByRole("radio")` never matches; look for both in tests.
- **`shuffle` is applied to the question order and to nothing else.** Options render in the order they were authored, every time, for every candidate (`generateExam`, `selectQuestions`). Three checks now guard the three cues this creates, and each was added only after a human found what the previous ones missed: #14 counts how often each letter is the key, #22 measures whether the key is the longest option, #23 looks for a rotation in the keyed letters. `ch01-b` ran `a → c → b → d` and `ch04-b` ran `a → b → c → d` across thirteen consecutive questions, both with perfectly even counts. When writing a batch, vary the sequence, not just the totals. D-03 in `TODO.md` is the real fix — shuffling options per attempt makes all three checks unnecessary.
- **Check #13 and check #21 are two different sweeps.** #13 catches an untranslated **English** word in Turkish text; #21 catches a banned **Turkish** word (`term.trForbidden`). Neither covers the other, and #21 deliberately skips `kapsama`, `test durumu`, `teknik gözden geçirme` and `testware` because each is ordinary Turkish in another role. A term with no `trForbidden` list is invisible to both — `test uygulama` for _test implementation_ and `test yürütme` for _test execution_ shipped into published content that way.
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

`TODO.md` → the tail of **Phase 2**. Phase 0, Phase 1, Track C and most of Phase 2 are closed — the blueprint has 29 LO groups, all 64 learning objectives are processed, all 64 lesson cards are published, and the validator runs 23 numbered checks (#1 is the JSON Schema gate; 14 errors, 9 warnings). What's still open:

1. **Track D's D-03, D-04 and D-05** (the TODO items, not the decisions of the same number) — the three things Track D found but did not fix: options are never shuffled at runtime (which is what makes the whole answer-position class of defects possible), the published `-a` chunks have not been swept with checks #21-#23, and four published lesson cards diverge from the syllabus.
2. **F1-19 Lighthouse CI** — needs `@lhci/cli` as a dev dependency, so it is blocked on the user's approval, not on work.
3. **F2-11 term tooltip** — blocked on content: F0-02 verified the glossary's CC BY 4.0 licence on 22.09.2026, but no definition has been copied into `data/` yet and `terms.json` holds only EN/TR pairs. `/sozluk` is the interim answer.
4. **Track A — official-question handling** arrives as Dexie v4 and an extra `origin` value. Nothing about it is built; the extension point is the union in `src/types/content.ts`. **The four official sample exams are NOT reproduced** — each PDF says _"Bu örnek sınavın başka herhangi bir şekilde kullanılması, önce ISTQB®'nin yazılı onayı alınmadan yasaktır."_ `/kaynaklar` links to them instead, and the permission letters are drafted at `docs/permission-request/`.

No open decisions remain — D-01…D-05 were closed on 19.09.2026 and D-06 (no 75-minute option) on 22.09.2026 (`docs/00-project-overview.md §9`):
product name **ISTQB-PREP** (brand risk knowingly accepted — `10 §R-01b`; the name is never hardcoded in code) · no domain, `*.github.io` · content license **CC BY-SA 4.0** · community question PRs are closed in v1 (Phase 4) · **no** permission application will be filed with ISTQB/TTB (basis: original content + non-commercial use + source attribution).

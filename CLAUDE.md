# CLAUDE.md

This file is for Claude Code sessions working in this repo. It holds only what every session needs; detail that matters for certain files lives in `.claude/rules/`, and project detail lives under `docs/`.

## Project

**ISTQB-PREP** — a **free, open-source, bilingual (TR/EN)** mock exam and study platform for ISTQB certification exam preparation. The product name matches the repo name (D-01).
**Priority: CTFL v4.0.1 (Foundation Level).** The architecture is designed to cover all levels, but content comes Foundation-first.

**Status: working MVP.** Study, practice and exam run on one shared session shell. All 64 lesson cards are published and the pool holds 256 published questions, at least 4 per objective. What is open: `TODO.md`.

## Read these first

| If you're going to... | Read first                                                           |
| --------------------- | -------------------------------------------------------------------- |
| Anything              | `docs/00-project-overview.md`                                        |
| Touch a data file     | `docs/04-data-model.md`                                              |
| Write code            | `docs/05-technical-architecture.md` + `docs/adr/`                    |
| Build UI              | `docs/06-ui-ux-design.md`                                            |
| **Write a question**  | `docs/07-content-authoring-guide.md` (mandatory)                     |
| Need ISTQB data       | `docs/03-istqb-reference.md` — **verified facts, don't re-research** |

## Rule files

Planning such work before opening a matching file → read the rule file first.

| Rule file                         | Covers                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| `.claude/rules/content-data.md`   | `data/`, `schemas/` — keys, lessons, terminology, validator blind spots, parallel writers |
| `.claude/rules/app-code.md`       | `src/` — module map, routes, surprising runtime behaviour                                 |
| `.claude/rules/testing.md`        | Vitest and Playwright specs and their configs                                             |
| `.claude/rules/build-ci.md`       | `package.json`, Vite, Lighthouse, `.github/` workflows                                    |
| `.claude/rules/claude-tooling.md` | `.claude/` hooks and agents, `.mcp.json`                                                  |
| `.claude/rules/sdd-workspace.md`  | `.superpowers/` and review packages                                                       |

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
ISTQB grants +25% (75 min) to a candidate sitting in a language that is not their own. That is a property of the sitting, not of the paper, so the product does not offer it and `meta.json` does not carry `extendedDurationMinutes` (D-06). `data/certifications.json` still records it, because it is the reference catalogue of every ISTQB exam rather than the exam we run.
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

**Package manager: yarn** — don't use npm. Dependencies are pinned to exact versions (no `^`/`~`). **Node 22.**

```bash
yarn install --frozen-lockfile   # what CI runs; the lockfile is never edited by hand
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

**After editing data, in order:** `yarn build:index && yarn validate:data`. `predev`/`prebuild` sync `public/data/` only at startup; run `yarn sync:data` if `data/` changes while the dev server runs.

**Hooks block two hand edits by design** (exit 2): setting `status` to `published`, and writing a generated file. The block message names the command to run instead.

## Git and PRs

- **CI gate, in order:** `lint → format → typecheck → test → validate:data → validate:i18n → build → e2e → lighthouse`. All nine must be green. Run `/pre-pr` before opening or updating a PR.
- Before committing a change that touched `data/`, `scripts/`, `src/`, `.claude/` or the CI workflows, run the `doc-drift-auditor` agent — no CI step checks documented counts, paths or behaviour.

## Folder structure

```
data/       Content — indexed, chunked static JSON (NO single file)
schemas/    JSON Schema — CI gate
docs/       Project docs + adr/
scripts/    validate-data, check-i18n, build-index, stats, sync-data, publish-questions
src/        The app (Vite + React + TS) — module map and routes: .claude/rules/app-code.md
e2e/        Playwright: flow + accessibility
```

## Conventions

- **Language:** talk to the user in Turkish; everything written to a file is English.
- **Turkish terminology:** `error/defect/failure` → **`insan hatası/hata/arıza`**. The three are never all translated as "hata" — the exam asks this distinction directly. The single source of truth is `data/ctfl-v4.0.1/terms.json`.

## Don't

- Add official questions to the pool (rule 1)
- Reproduce the four official sample exams. Each PDF forbids any other use without ISTQB's _prior_ written approval, and none is filed under `docs/evidence/`; `/kaynaklar` links to them instead. Background: `docs/permission-request/README.md`.
- Re-research the facts in `docs/03-istqb-reference.md` — they're verified and sourced
- Hardcode exam constants in code — read them from `meta.json`
- Add Next.js / Redux / TanStack Query — the reasoning is in `docs/adr/0001-frontend-stack.md` and `docs/05-technical-architecture.md` §2
- Generate questions with AI at runtime — quality and copyright risk (`docs/07-content-authoring-guide.md` §8)
- Add anything from the "deliberately deferred" list at the end of `docs/09-roadmap.md` without reopening the discussion first
- Ask an AI to "write an ISTQB sample exam question" — the model might reproduce an official one from memory
- Reopen a closed decision (`docs/00-project-overview.md §9`): product name **ISTQB-PREP** (D-01) · `*.github.io`, no domain (D-02) · content license **CC BY-SA 4.0** (D-03) · no community question PRs in v1 (D-04) · no 75-minute option (D-06). D-05 ("no permission request") was reopened by **D-07** on 22.09.2026: letters went to ISTQB and TTB, and nothing usable has come back — `docs/permission-request/README.md`.

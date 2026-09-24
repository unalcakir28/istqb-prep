# TODO

Phase descriptions and dependencies: [`docs/09-roadmap.md`](docs/09-roadmap.md)
Estimates: single developer, ~10 hours/week.

Priority: **P0** blocks the next phase from starting · **P1** required within the phase · **P2** nice to have

---

## Phase 0 — Foundation and validation

### Decisions and legal

- [x] **F0-01** `P0` Product name decision (D-01) → **ISTQB-PREP**, same as the repo name. Brand risk knowingly accepted ([`08 §K-4`](docs/08-legal-and-copyright.md), [`10 §R-01b`](docs/10-risks-and-metrics.md))
- [x] **F0-17** `P1` The product name lives in `src/lib/product.ts` (`PRODUCT_NAME`, `REPO_URL`). `app.name` was deleted from both locales, `index.html` carries `%APP_NAME%` and a Vite `transformIndexHtml` plugin substitutes it at build time, and `e2e/labels.ts` re-exports the constant. A rename is one line
- [x] **F0-02** `P0` **Visually verified** 22.09.2026 — the rendered footer of `glossary.istqb.org` (glossary V4.8.1) reads _"Except where otherwise noted, content on this site is licensed under a Creative Commons Attribution 4.0 International license"_. Screenshot: `docs/evidence/istqb-glossary-licence-2026-09-22.png`; the two caveats (glossary version ≠ syllabus version, and "except where otherwise noted") are recorded in `docs/03-istqb-reference.md §7`
- [x] ~~**F0-03** Written permission email to ISTQB~~ — **canceled** (D-05: no application will be filed, basis K-1/K-2/K-3)
- [x] ~~**F0-04** Turkish content/collaboration email to TTB~~ — **canceled** (D-05)
- [x] **F0-15** `P2` Content license decision (D-03) → **CC BY-SA 4.0**
- [x] **F0-16** `P2` Domain name decision (D-02) → no domain purchased, `*.github.io` is enough

### Data skeleton

- [x] **F0-05** `P0` Official LO-group table extracted into `exam-blueprint.json` — **29 groups / 64 LOs / 40 questions**, sections 8/6/4/11/9/2, K 8/24/8. Source: _Exam Structures & Rules tables v1.19_, p. 4-5
- [x] **F0-06** `P0` `objectives.json` — **64 LOs**, TR+EN text copied verbatim from the official PDFs, K1=14/K2=42/K3=8
- [x] **F0-07** `P0` `syllabus.json` · `meta.json` · `manifest.json` — audited against the official source, zero discrepancies (titles, durations 1135 min, exam constants 40/26/60; the 75-minute extension was dropped from `meta.json` by D-06)
- [x] **F0-11** `P1` `certifications.json` — the full 28-row ISTQB certification table ([`03 §5`](docs/03-istqb-reference.md) seed data)
- [x] **F0-08** `P0` `schemas/` completed + `scripts/validate-data.ts` — **23 check numbers, 21 live** (#1 is JSON Schema conformance, #2-#23 are consistency checks; #14 and #23 were retired by D-03). #1-#9 and #15-#19 are errors, #10-#13 and #20-#22 are warnings. #16-#20 arrived with the lesson files. Three more were added on 22.09.2026, each after a human reader found by hand what the existing checks passed: #21 (a `trForbidden` word used in Turkish text — #13 only ever caught an untranslated ENGLISH word, never a banned Turkish one), #22 (the keyed option being the longest) and #23 (the keyed letters running a rotation in file order, which #14 passes because the letter counts are even)
- [x] **F0-12** `P1` `scripts/build-index.ts` — builds `questions/index.json`, `lessons/index.json` and the manifest counts from the chunks
- [x] **F0-13** `P1` `scripts/stats.ts` — per-LO coverage → `docs/coverage.md`
- [ ] **F0-09** `P1` `scripts/fetch-glossary.ts` — pull 215 terms from the Glossary API with the `used_in: Foundation v4.0` filter; match TR equivalents from the TTB syllabus, flag `trSource`
- [x] **F0-14** `P1` `data/ctfl-v4.0.1/terms.json` — **97 terms**, positionally aligned from the official EN/TR keyword lists. ⚠️ The first glossary in `docs/07 §5` was largely wrong and was replaced entirely

### Content

- [x] **F0-10** `P0` First questions written — the process was proven out (see F1-C1)

> **Phase 0 done:** `yarn validate:data` is green · blueprint sums to 40 · 20 questions conform to the schema

---

## Phase 1 — MVP: Mock exam

### Infrastructure

- [x] **F1-01** `P0` Vite 6 + React 19 + TS 5 + Tailwind v4; all versions fully pinned, yarn
- [x] **F1-01b** `P0` GitHub Pages deploy pipeline set up
- [x] **F1-01c** `P0` CI: ESLint + Prettier + `tsc --noEmit` + Vitest + `validate:data`
- [x] **F1-02** `P0` `contentClient` — index first, then only the needed chunks; memory + Cache API, invalidated via `dataVersion`
- [x] **F1-03** `P0` Dexie schema + recovery/discard helpers
- [x] **F1-04** `P0` i18next; UI language ≠ content language; TR/EN dictionaries match at 182 keys, checked by `yarn validate:i18n` in CI

### Exam engine

- [x] **F1-05** `P0` `generateExam` — blueprint-based, LO-group rule, seeded PRNG
- [x] **F1-05b** `P0` Distribution tested across 50 separate seeds: exactly 8/6/4/11/9/2 and K 8/24/8
- [x] **F1-05c** `P1` `shortfalls` + `previewCoverage` — an incomplete exam is never generated silently
- [x] **F1-06** `P0` `scoreExam` — exact match, no partial credit, pass mark from `meta`, section/LO/K breakdown
- [x] **F1-08** `P0` `ExamTimer` — absolute end time based on `Date.now()` (doesn't drift while the tab is backgrounded), hide/show, auto-submits when time runs out

### UI

- [x] **F1-07** `P0` `QuestionCard` + `OptionList` + `ContentLangToggle` — 65ch text width, 1–9 keyboard selection, the answer is preserved when the language changes
- [x] **F1-07b** `P0` Support for `multi` questions: checkbox + a **"HANGİ İKİSİ — 2 şık seçin"** heading
- [x] **F1-09** `P0` `QuestionNavigator` — a panel on desktop, a bottom sheet on mobile; empty/answered/flagged states
- [x] **F1-10** `P0` Exam session route + resuming an unfinished attempt (a banner on the home page, resumes from the first unanswered question)
- [x] **F1-11** `P0` Results screen: score + the 26/40 pass-mark line + section bars + weakest learning objectives
- [x] **F1-12** `P0` Review pass + `RationalePanel` — a rationale for every option + attribution chips (`FL-4.2.1` · `§4.2.1` · `K3` · `v4.0.1`)
- [x] **F1-13** `P0` Dark mode (token-based) + keyboard shortcuts + `?` overlay
- [x] **F1-14** `P1` `MediaRenderer` — `decision-table` and `table` render as a real `<table>` with column **and** row headers. The loose `media` schema (`headers: object`, `rows: array`) was tightened into a six-way `oneOf` and `Question.media` is a discriminated union instead of `unknown`. No question uses it yet — the renderer and the schema are ready for the ones that will
- [x] **F1-16** `P1` Home page — the first-visit "Where should I start?" prompt and the "Your status" block behind it both ship. The two are one branch: with no finished session and nothing mastered the page gives a direction, otherwise it gives three numbers (objectives learned, sessions finished, last score). `mastered` is counted in memory because IndexedDB has no boolean key type
- [x] **F1-17** `P1` Exam setup screen: live distribution preview, pool warning (including `excludeSeen`). The duration choice it originally shipped with was removed on 22.09.2026 — every mock exam is 60 minutes (D-06).

### Quality

- [x] **F1-15** `P1` E2E (Playwright): the full 40-question mock exam flow, resuming an unfinished attempt, the answer being preserved when the question language changes — `e2e/exam.spec.ts`. Practice and study have their own specs (`e2e/practice.spec.ts`, `e2e/study.spec.ts`), and my lists plus the glossary have `e2e/lists-and-glossary.spec.ts`; **57 specs across 5 files** under `yarn e2e`
- [x] **F1-18** `P1` `@axe-core/playwright` — 0 violations in light **and** dark theme on the home, exam setup, practice setup, sources, exam, study chapter list, chapter objective list and study objective screens, plus a revealed practice answer; alongside the hand-written specs for what axe cannot see (focus destinations, accessible names, live regions) — `e2e/a11y.spec.ts`
- [x] **F1-19** `P2` **Done 22.09.2026.** Lighthouse CI asserts ≥95 in all 4 categories. `@lhci/cli@0.15.1` was approved and added as a dev dependency; `lighthouserc.json` holds the thresholds, `yarn lighthouse` runs it, and the CI job runs it after the e2e step. First local run: performance 99, accessibility 100, best practices 100, SEO 100. The step builds with `--base=/`, because lhci serves the bundle from its own static server at `/` and vite's base would otherwise be `/istqb-prep/`. The first CI run failed with `NO_FCP`: a step-level `env: GITHUB_ACTIONS: ""` does not reach the build inside a GitHub Actions job, so the base stayed `/istqb-prep/` and every asset 404'd on a blank page

### Content and pages

- [x] **F1-C1** `P0` **120 questions** — all six sections written, passed independent verification, and published as `published` (64/64 LOs covered). Findings from the Section 4 verification pass applied: `ctfl4-0063`'s 3-value BVA rationale fixed (the boundary value is 500, not 498 a coverage item), `ctfl4-0064` and `ctfl4-0067` distractors and `ctfl4-0068` rewritten for K3, `ctfl4-0079`'s Turkish term ambiguity resolved
- [x] **F1-C2** `P1` Coverage badge in the README — `yarn stats` regenerates the region between the markers, so the numbers never silently go stale
- [x] **F1-C3** `P0` `/kaynaklar` — copyright notice, official links, disclaimer

> **Phase 1 done:** the MVP boundary in [`02 §3`](docs/02-product-requirements.md) has been met

---

## Phase 2 — Learning modes

### Delivered — the three-mode slice

- [x] **F2-00a** `P0` **Study mode** — `/calisma` → chapter → objective → lesson card → short objective test, with its result in the same route. `ObjectiveStateBadge` states progress in words, never by colour alone
- [x] **F2-00b** `P0` **`objectiveProgress` + Dexie v3** — per-objective mastery (≥3 answered **and** ≥80% on the last test), deliberately **losable**; the v3 backfill is extracted into `migrations.ts` so it is unit-testable
- [x] **F2-00c** `P0` **The lesson data layer** — `data/*/lessons/` (chunked per chapter, index built by `yarn build:index`), two schemas, four new validator checks (#16-#19) plus coverage warning #20, `contentClient.getLesson`, `LessonCard` with a placeholder for a card that does not exist yet. **The chunks ship empty — Track C writes the cards**
- [x] **F2-00d** `P0` **One shared session shell** — `SessionRunner` + `sessionStore` (was `examStore`); all three modes run on it, with `routeForAttempt` keeping an attempt at its own URL and `/deneme/:id` redirecting to `/sinav/:id` for old bookmarks
- [x] **F2-00e** `P0` **`selectQuestions`** — one selection entry point, three scopes (blueprint / chapter / objective), seeded, with shortfalls reported rather than thrown. `PracticeSetup` previews by calling it; `ExamSetup` previews through `previewCoverage` over the full published pool, because `exclude` reorders candidates rather than removing them and a filtered preview over-reports shortfalls
- [x] **F2-00f** `P1` **Accessibility remediation (15a/15b)** — the options are a named group; every focus-losing screen change now moves focus and names what happened (next question → the stem heading; reveal → the rationale panel, named after the verdict; study finish → the result heading); a multi-select displacement is announced; boundary buttons use `aria-disabled`; `QuestionCard` and `RationalePanel` take a `headingLevel`, so the review pass reads as 40 nested groups instead of 120 flat headings; `SubmitConfirm` is shared by all three modes
- [x] **F2-01** `P0` Practice mode: whole-syllabus / chapter / LO scope, **configurable length (10 · 20 · 40, default 10)**, inline instant feedback that can be switched off. _Delivered wider than specified — the fixed 10-question session became a choice._
- [x] **F2-03** `P0` ~~`/syllabus` syllabus explorer~~ — **absorbed into `/calisma`.** A filterable list of 64 objectives with a status column is the same screen as the study chapter/objective lists, one click further from the content. Per-objective accuracy is carried by `ObjectiveStateBadge`

### Still open

- [x] **F2-02** `P0` "Retry the N questions you got wrong" on the result screen. It starts a **new** practice attempt over the `questions` scope rather than re-queuing inside the scored one — re-queuing would make a question count twice and quietly change the score just reported. Unanswered questions are left out: a question nobody reached is not a wrong belief to correct
- [x] **F2-04** `P0` The weakest objectives on the result screen each carry a "Study this" link straight to `/calisma/lo/:code`. The row is not itself a link (code, text and score would collapse into one accessible name) and the link names the code, so 3 links do not all read "Study this"
- [x] **F2-05** `P1` `/sozluk` — all 97 terms, EN and TR side by side, one search box over both languages (Turkish-aware lowercasing, so dotted and dotless i both match), a chapter filter, an announced result count, and the `trSource` tag with the mapping method in the footer. It carries **no definitions**: those are the ISTQB Glossary's, and although F0-02 has now verified CC BY 4.0, nothing has been copied yet. The screen says so rather than looking incomplete. Where a term has a `trForbidden` word, that word is shown in red — a candidate who learned it from an older book needs to be told it is wrong
- [x] **F2-06** `P1` TR/EN side by side — a third state of the existing language control (TR · EN · TR+EN), in the session shell and on the review screen. **One radio group, two texts per choice:** the second language goes inside each option's own `<label>`, because two parallel groups would let a candidate tick a Turkish option and an English one and mean a single answer. The primary language stays whichever single one was last chosen, so no second control is needed to say which side is which; the preference is in localStorage (`src/lib/bilingual.ts`), not on the attempt — "both" is not a language
- [x] **F2-07** `P1` `/listelerim` — the three lists, each derived from the answers already in IndexedDB rather than from anything newly stored (`src/lib/db/questionHistory.ts`). "Wrong" and "flagged" read the latest answer only; "never right twice in a row" reads the whole history, and an unanswered attempt breaks a run exactly as a wrong one does. Each list hands its ids to the same `questions` scope F2-02 uses
- [x] **F2-08** `P1` `ReportQuestionLink` in the rationale panel — a pre-filled GitHub issue carrying the question id, its objectives, the syllabus ref and version, the reading language, what was selected and the keyed answer. It sits in the rationale rather than on the question card, because that is the only place a candidate can see the keyed answer and its reasoning, which is what tells them something is actually wrong
- [x] **F2-09** `P1` `MediaRenderer` — `state-transition` renders as the transition table it already is (not a diagram with a table hidden behind a toggle), `control-flow` and `code` as a real `<pre>`. The schema **requires** an `alt` for every kind whose natural form is a diagram, and the component renders it in full rather than hiding it in an attribute: a K3 question about a state machine is unanswerable without the machine
- [x] **F2-10** `P0` **Content: 200 questions** (≥2 per LO) — met and passed by Track D on 22.09.2026: 256 published, at least 4 per LO
- [ ] **F2-11** `P2` Definition on hover over a term (tooltip). **Still blocked on content, not on licence:** F0-02 is now verified (CC BY 4.0), but no definition has been copied into `data/` yet, and `terms.json` holds only EN/TR pairs. There is nothing to put in the tooltip until the definitions land. `/sozluk` (F2-05) is the interim answer
- [x] **F2-12** `P1` A publishing gate for lessons. `guard-publish.sh` matches `data/*/questions/*.json` only and `yarn publish:questions` walks only that directory, so a lesson's `status` can be set to `published` by hand with an invented `meta.reviewedBy`. **Closed 22.09.2026:** `guard-publish.sh` now matches `data/*/lessons/*.json` too and names the right command per path, and `scripts/publish-questions.ts` takes `--kind questions|lessons` through a `Collection` descriptor (`yarn publish:lessons`). Proven on all four branches — lesson+published → exit 2, question+published → exit 2, lesson+review → exit 0, unrelated path → exit 0. _Its sibling gap was already closed: `guard-generated.sh` also matches `*/lessons/index.json`_
- [x] **F2-13** `P2` Fixed. `useDialogFocus` gained an `options.initialFocus` selector and the sheet passes `[aria-current="true"]`, so `n` lands on the current question's cell on a narrow screen as it already did on desktop. Proven by running the new e2e spec against the reverted code (red) and then against the fix (green). The hook's `onClose` also moved into a ref updated in an effect, so the focus effect no longer re-runs on every render
- [x] **F2-14** `P2` Fixed by `resultRouteForAttempt` + `resultRedirectPathFor`, extracted alongside the existing `routeForAttempt` / `redirectPathFor` pair through a shared `redirectTo` — not a `mode` branch on the screen. Original report: `/sonuc/<study-attempt-id>`, hand-typed, rendered the study attempt ungraded and offered "New practice set" — a study test's result belongs in `/calisma/lo/:loCode/:id`, which shows it inline. Nothing is scored wrongly and no link in the app produces the URL, so only the label is off. `SessionRunner` already sends a misaddressed attempt home through `redirectPathFor`; `ExamResult` does not, because `routeForAttempt` maps an attempt to its **session** route and the result screen needs the result one. That is a small extension of the same function, not a `mode` branch on the screen. This is unfinished, not a deliberate limit

---

## Content and platform tracks

Each gets its own spec and plan; nothing above anticipates them beyond the extension points already built.

### Track A — official-question handling

- [ ] **A-01** `P1` Decide and document what "official" material may be referenced without being reproduced (rule 1 is not up for negotiation; this is about citation and linking, not copying)
- [ ] **A-02** `P1` Dexie **v4** + a widened `origin` union in `src/types/content.ts`, `schemas/question.schema.json` and the validator. The v3 backfill in `migrations.ts` is the pattern to follow

### Track C — the 64 lesson cards

- [x] **C-01** `P0` **All 64 cards written and published** (22.09.2026). Six writers, one chapter each; two adversarial review passes then found 7 terminology defects in chapters 1–2 (`doğrulama testi` for confirmation testing, `doğrulama` for validation, and the `kusur` root for defect), all fixed before publishing. Check #20 is at 0 — `yarn validate:data` went from 116 warnings to 52
- [x] **C-02** `P1` **Done 22.09.2026.** `.claude/agents/lesson-writer.md` and `.claude/agents/lesson-verifier.md`, mirroring the question pair: the writer produces cards at `status: "review"` with an empty `reviewedBy`, the verifier is read-only and reports BLOCKER/NOTE per objective, and neither can publish — `guard-publish.sh` covers lessons since F2-12. Both carry what the ad-hoc briefs had to be told each time: the TR/EN parity counts (#17), the `terms.json`-over-syllabus rule including `hata maskelenmesi`, the plain-text constraint (no Markdown renderer), and the requirement that a card make its objective's published questions answerable without keying any one of them

### Track D — 240 further original questions

- [x] **D-01** `P0` **Done 22.09.2026.** The pool is **256 published** (plus `ctfl4-0157`, retired as a duplicate of `ctfl4-0027`), up from 120, with **at least 4 published questions for every one of the 64 LOs**. Check #11 is at 0. Every `chNN-b` chunk went through `question-verifier`, then its findings, then `yarn publish:questions`; the last two objectives below target (FL-1.4.3, FL-2.1.2) got one written question each, `ctfl4-0256` and `ctfl4-0257`
- [x] **D-02** `P1` **Done 22.09.2026.** The answer-position balance (#14), rotation (#23), length cue (#22), English-leak (#13) and banned-Turkish (#21) sweeps were re-run after every batch, and #22 and #23 were written during this track because the first three sweeps could not see what a human reader found. All five are at 0 across the published pool
- [x] **D-03** `P1` **Done 24.09.2026. Options are shuffled per attempt, in every mode.** Every candidate used to see every question's options in authored order, and the ch01-b review found the consequence: 32 questions whose keyed letter ran a perfect `a → c → b → d` rotation passed check #14, because the counts were balanced and only the _sequence_ gave the game away. `src/features/exam/optionOrder.ts` now derives each question's order from the attempt's stored `seed` and the question id (FNV-1a → `createRng` → `shuffle`), one permutation for both languages, and `sessionStore` applies it wherever questions are loaded — so a resume, the result and `/inceleme` show the order the candidate saw, nothing new is persisted, no Dexie bump was needed, and pre-D-03 attempts get a stable order from their own seed (an attempt that was in progress when this shipped reorders once, then stays put). The row number, the 1-9 shortcut and the rationale panel's label follow displayed position; the rationale panel used to print the option id, which would now point at the wrong row. The GitHub issue body names options by authored id and lists the order they were shown in. Checks #14 and #23 were retired (numbers kept, execution removed): both measured the authored letter, which no longer reaches anyone. #22 stays. Two published summaries map "the other options" to answers by position with _respectively_ / _sırasıyla_ and are now wrong on most attempts: `ctfl4-0229` (Q2, Q3, Q4) and `ctfl4-0256` (test completion, design, implementation) — they need rewording, and check #15 does not catch the pattern
- [x] **D-05** `P1` **Done 24.09.2026.** All four cards fixed, each bumped to `revision: 2` with `meta.updatedAt: "2026-09-24"`. The repo holds no syllabus prose, so every fix was grounded in the objective's own published questions rather than in re-fetched syllabus text. (a) FL-5.3.1 (`ch05.json`): the TR paragraph's _arızalar arası ortalama süre_ (MTBF) is now _arızaya kadar geçen ortalama süre_, matching the EN card's _mean time to failure_ (MTTF); it was the only occurrence in the card. `ctfl4-0108`'s TR rationale carries the same MTBF gloss — that one is a question chunk and is tracked under D-04, not fixed here. (b) FL-5.1.6 (`ch05.json`): dropped the unverifiable parenthetical gloss of test isolation, _"(sistemin diğer unsurlarına bağımlılık derecesinin tersi)"_ / _"(the inverse of dependency on other parts of the system)"_, from the one paragraph in each language that carried it; the sentence still says granularity, isolation and execution time move with the layer, it just no longer asserts what isolation _is_. (c) FL-1.2.2 (`ch01.json`): replaced the "testing is a subset of quality assurance" claim — in the paragraph and its matching keyPoint, TR and EN — with "testing is an important form of quality control", the reading `ctfl4-0008`, `-0009`, `-0127` and `-0128` already teach. (d) FL-1.4.3 (`ch01.json`): moved _test data_ off test design's testware and onto test implementation's, in the paragraph and both matching keyPoints, TR and EN — design now produces _test data requirements_ and _test environment requirements_ (test verisi/test ortamı **gereksinimleri**), implementation produces the _test data_ itself, matching `ctfl4-0019`. `yarn build:index && yarn validate:data` ran clean afterward, 0 errors (1 pre-existing warning on `ch04-b.json` #12, unrelated to this fix and not touched)
- [x] **D-04** `P2` **Done 24.09.2026.** One `question-verifier` pass per `ch01-a`..`ch06-a` chunk, then a fixer per chunk, then two regression passes over every edited question. Every keyed answer, including every K3 recomputation, was confirmed correct; 50 published questions were revised (revision bumped, `updatedAt` 2026-09-24), none re-keyed. **Leakage:** `ctfl4-0056` no longer restates 0077's key, `0076`'s rationale no longer states 0201's keyed fact, `0090` and `0219` no longer carry each other's key, `0109` no longer paraphrases 0244's key; `0086`, `0087`, `0099` and `0114` were checked and cleared. `ctfl4-0257` duplicated `0027`'s option a and was rewritten twice: FL-2.1.2 has four practices and `0027`, `0155` and `0156` already key all four, so it now keys the syllabus's stated **purpose** of one practice. **Content:** `0108`'s TR rationale carried the same MTBF gloss as D-05(a); `0054`'s TR summary carried an authoring note with no EN counterpart; `0229` and `0256` mapped the other options by position ("respectively" / "sırasıyla"), which D-03's shuffle makes wrong and check #15 does not catch. **Length cue (#22):** the key was strictly the longest option in 72 (TR) / 83 (EN) of 256 published questions and is now at 42 / 52; `ch01-a` went from 13/14 of 24 to 0/1. The first fix round trimmed some options in one language only, which the regression pass caught and synced. Not done: the `-b` chunks were not swept for length, and `ch02-a`, `ch04-a` still have 6 and 7 cued questions each. The #12 warning on `ctfl4-0216` is deliberate (relabelled K2 by an earlier review)

---

## Phase 3 — Repetition, progress, offline

- [ ] **F3-01** `P0` `ts-fsrs` integration + a `srsCards` table; wrong answers go into the deck automatically
- [ ] **F3-02** `P0` Review screen: **Again / Hard / Good / Easy** + a **next-interval preview** on each button
- [ ] **F3-03** `P1` Blocking consecutive questions from the same LO (sibling burying)
- [ ] **F3-04** `P1` Due-date forecast chart + the count of due cards on the home screen
- [ ] **F3-05** `P1` Progress screen: score trend, per-section improvement, a **forgiving streak**
- [ ] **F3-06** `P1` **Readiness estimate** — based on the last 3 timed attempts ("2 of them passed the mark, you can schedule the exam")
- [ ] **F3-07** `P1` PWA: manifest, service worker, chunk caching (`StaleWhileRevalidate`), installability
- [ ] **F3-08** `P0` Progress **export/import** (JSON) — the mitigation for the risk of losing IndexedDB
- [ ] **F3-09** `P2` Graduated hints (nudge → hint → solution)
- [ ] **F3-10** `P0` **Content: 300 questions** (≥3 per LO)
- [ ] **F3-11** `P2` Move a question's SRS card to `relearning` when its `revision` increments
- [ ] **F3-12** `P2` Detecting private browsing / no persistence + warning the user

---

## Phase 4 — Scaling

- [ ] **F4-01** `P0` **CTFL-AT (Agile Tester)** — the second certification; the real test of the architecture (should require no code changes)
- [ ] **F4-02** `P1` CT-AI v2.0 (TTB has a Turkish syllabus for it)
- [ ] **F4-03** `P2` CT-PT (Performance Testing)
- [ ] **F4-04** `P2` CTAL-TA v4.0 — the first Advanced module → support for **multi-point questions** (the scoring engine expands)
- [ ] **F4-05** `P1` Community question contributions: PR template + an **originality declaration** + a review flow
- [ ] **F4-06** `P2` Per-question discussion (via GitHub Discussions, serverless)
- [ ] **F4-07** `P1` **Turkish process guide**: registration, online proctoring, results, retake rights (a gap identified in the market research)
- [ ] **F4-08** `P2` Global per-question accuracy rate — how, while preserving privacy? (needs research)

---

## Ongoing

- [ ] Quarterly review checklist ([`10 §4`](docs/10-risks-and-metrics.md))
- [ ] Triage question error reports weekly (closure < 7 days)
- [ ] Watch ISTQB announcements (a new syllabus version = R-03)
- [ ] Keep the coverage report up to date

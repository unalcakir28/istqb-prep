# TODO

Phase descriptions and dependencies: [`docs/09-roadmap.md`](docs/09-roadmap.md)
Estimates: single developer, ~10 hours/week.

Priority: **P0** blocks the next phase from starting · **P1** required within the phase · **P2** nice to have

---

## Phase 0 — Foundation and validation

### Decisions and legal

- [x] **F0-01** `P0` Product name decision (D-01) → **ISTQB-PREP**, same as the repo name. Brand risk knowingly accepted ([`08 §K-4`](docs/08-legal-and-copyright.md), [`10 §R-01b`](docs/10-risks-and-metrics.md))
- [ ] **F0-17** `P1` Make the product name readable from a single source (i18n/`meta`) — don't hardcode it; this is the mitigation for the D-01 risk, reducing a rename to a one-line change
- [ ] **F0-02** `P0` **Visually verify** the ISTQB Glossary license in the browser (is CC BY 4.0 in the footer?), put the screenshot under `docs/evidence/`
- [x] ~~**F0-03** Written permission email to ISTQB~~ — **canceled** (D-05: no application will be filed, basis K-1/K-2/K-3)
- [x] ~~**F0-04** Turkish content/collaboration email to TTB~~ — **canceled** (D-05)
- [x] **F0-15** `P2` Content license decision (D-03) → **CC BY-SA 4.0**
- [x] **F0-16** `P2` Domain name decision (D-02) → no domain purchased, `*.github.io` is enough

### Data skeleton

- [x] **F0-05** `P0` Official LO-group table extracted into `exam-blueprint.json` — **29 groups / 64 LOs / 40 questions**, sections 8/6/4/11/9/2, K 8/24/8. Source: _Exam Structures & Rules tables v1.19_, p. 4-5
- [x] **F0-06** `P0` `objectives.json` — **64 LOs**, TR+EN text copied verbatim from the official PDFs, K1=14/K2=42/K3=8
- [x] **F0-07** `P0` `syllabus.json` · `meta.json` · `manifest.json` — audited against the official source, zero discrepancies (titles, durations 1135 min, exam constants 40/26/60/75)
- [x] **F0-11** `P1` `certifications.json` — the full 28-row ISTQB certification table ([`03 §5`](docs/03-istqb-reference.md) seed data)
- [x] **F0-08** `P0` `schemas/` completed + `scripts/validate-data.ts` — **14 checks** (13 + option-position balance). 1-9 are errors, 10-14 are warnings
- [x] **F0-12** `P1` `scripts/build-index.ts` — builds `index.json` + manifest counts from the chunks
- [x] **F0-13** `P1` `scripts/stats.ts` — per-LO coverage → `docs/coverage.md`
- [ ] **F0-09** `P1` `scripts/fetch-glossary.ts` — pull 215 terms from the Glossary API with the `used_in: Foundation v4.0` filter; match TR equivalents from the TTB syllabus, flag `trSource`
- [x] **F0-14** `P1` `data/ctfl-v4.0.1/terms.json` — **97 terms**, positionally aligned from the official EN/TR keyword lists. ⚠️ The first glossary in `docs/07 §5` was largely wrong and was replaced entirely

### Content

- [x] **F0-10** `P0` First questions written — the process was proven out (see F1-C1)

> **Phase 0 done:** `npm run validate:data` is green · blueprint sums to 40 · 20 questions conform to the schema

---

## Phase 1 — MVP: Mock exam

### Infrastructure

- [x] **F1-01** `P0` Vite 6 + React 19 + TS 5 + Tailwind v4; all versions fully pinned, yarn
- [x] **F1-01b** `P0` GitHub Pages deploy pipeline set up
- [x] **F1-01c** `P0` CI: ESLint + Prettier + `tsc --noEmit` + Vitest + `validate:data`
- [x] **F1-02** `P0` `contentClient` — index first, then only the needed chunks; memory + Cache API, invalidated via `dataVersion`
- [x] **F1-03** `P0` Dexie schema + recovery/discard helpers
- [x] **F1-04** `P0` i18next; UI language ≠ content language; TR/EN dictionaries match at 104 keys

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
- [ ] **F1-14** `P1` `MediaRenderer`: `decision-table` and `table` (a real `<table>`, not an image)
- [ ] **F1-16** `P1` Home page — a "Where should I start?" prompt for first-time visitors (primary action is **Practice**, not Mock exam)
- [x] **F1-17** `P1` Exam setup screen: 75 min is the default with a Turkish UI, live distribution preview, pool warning (including `excludeSeen`)

### Quality

- [x] **F1-15** `P1` E2E (Playwright): the full 40-question mock exam flow, resuming an unfinished attempt, the answer being preserved when the question language changes — `e2e/exam.spec.ts`, `yarn e2e`
- [x] **F1-18** `P1` `@axe-core/playwright` — 0 violations on the home, setup, resources, and exam screens in light/dark theme; also verifies that an option can be selected by keyboard — `e2e/a11y.spec.ts`
- [ ] **F1-19** `P2` Lighthouse CI — ≥95 in all 4 categories

### Content and pages

- [x] **F1-C1** `P0` **120 questions** — all six sections written, passed independent verification, and published as `published` (64/64 LOs covered). Findings from the Section 4 verification pass applied: `ctfl4-0063`'s 3-value BVA rationale fixed (the boundary value is 500, not 498 a coverage item), `ctfl4-0064` and `ctfl4-0067` distractors and `ctfl4-0068` rewritten for K3, `ctfl4-0079`'s Turkish term ambiguity resolved
- [x] **F1-C2** `P1` Coverage badge in the README — `yarn stats` regenerates the region between the markers, so the numbers never silently go stale
- [x] **F1-C3** `P0` `/kaynaklar` — copyright notice, official links, disclaimer

> **Phase 1 done:** the MVP boundary in [`02 §3`](docs/02-product-requirements.md) has been met

---

## Phase 2 — Learning modes

- [ ] **F2-01** `P0` Practice mode: section/LO selection, a **fixed 10-question session**, inline instant feedback
- [ ] **F2-02** `P0` **Requeuing a wrong answer at the end of the same session** (the Duolingo pattern)
- [ ] **F2-03** `P0` `/syllabus` syllabus explorer — 64 LOs, filterable/sortable, a column for your own accuracy rate (the LeetCode pattern)
- [ ] **F2-04** `P0` LO weakness analysis + "Study →" deep links
- [ ] **F2-05** `P1` `/glossary` — simultaneous TR/EN search, a term card (EN+TR side by side), a **source tag** (`trSource`)
- [ ] **F2-06** `P1` TR/EN **side-by-side** view (two columns on wide screens, stacked on narrow ones, a single radio group)
- [ ] **F2-07** `P1` Lists: my mistakes · my flagged questions · **ones I've never gotten right twice in a row**
- [ ] **F2-08** `P1` Question error report → a pre-filled GitHub Issue (question ID, version, selected option, language)
- [ ] **F2-09** `P1` `MediaRenderer`: `state-transition` (with a text alternative), `control-flow`, `code`
- [ ] **F2-10** `P0` **Content: 200 questions** (≥2 per LO)
- [ ] **F2-11** `P2` Definition on hover over a term (tooltip)

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

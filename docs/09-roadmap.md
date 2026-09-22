# 09 — Roadmap

**Version:** 1.1 · **Date:** 21.09.2026

> Effort estimates assume **a single developer, ~10 hours/week**.
> Critical reality: **content production outweighs code.** Writing 120 questions takes about as long as writing the MVP app, and the two must run in parallel.

---

## Phase 0 — Foundation and validation (2 weeks · ~20 hours)

**Goal:** Close open questions before writing code; build the data skeleton.

| # | Task | Output |
|---|---|---|
| F0-01 | ~~Product name decision (D-01)~~ | ✅ **ISTQB-PREP** (brand risk accepted) |
| F0-02 | Visually verify the ISTQB Glossary license in a browser | Screenshot + decision |
| F0-03 | ~~Written permission email to ISTQB~~ | ❌ cancelled by D-05 |
| F0-04 | ~~Cooperation email to TTB~~ | ❌ cancelled by D-05 |
| F0-05 | **Extract the full official LO-group table into `exam-blueprint.json`** | Complete blueprint summing to 40 questions |
| F0-06 | `objectives.json` — 64 LOs, TR+EN text, K-levels | Verified data |
| F0-07 | `syllabus.json` + `meta.json` + `certifications.json` | Verified data |
| F0-08 | JSON Schema files + `validate-data` script | Validator running in CI |
| F0-09 | Pull the 215 CTFL terms from the Glossary API, map their TR equivalents from the TTB syllabus | `glossary/` |
| F0-10 | Write the first 20 questions (from Chapters 1 and 4) — format test | Sample data |

**Phase 0 is done when:** `yarn validate:data` is green; the blueprint sums to 40 questions and the 8/6/4/11/9/2 distribution; the 20 sample questions conform to the schema.

---

## Phase 1 — MVP: Mock exam (6 weeks · ~60 hours)

**Goal:** A candidate can take a mock exam under real rules without an account, and get an honest result.

### Code (≈35 hours)
| # | Task |
|---|---|
| F1-01 | Vite + React + TS + Tailwind v4 scaffold; GitHub Pages deploy pipeline (404.html + .nojekyll + base). shadcn/ui was never installed — every control on screen is a native element (`docs/05` §2) |
| F1-02 | `contentClient` — manifest/index/chunk loading, cache |
| F1-03 | Dexie schema + migration infrastructure |
| F1-04 | i18next setup; separation of interface language ≠ content language |
| F1-05 | `generateExam` — blueprint-based generation + distribution validation (unit tested) |
| F1-06 | `scoreExam` — exact match for multi-select, pass mark 26, chapter/LO breakdown (unit tested) |
| F1-07 | `QuestionCard` + `OptionList` + `LangToggle` |
| F1-08 | `ExamTimer` — the attempt stores an absolute `deadlineAt`, so nothing periodic is persisted and a reload recomputes the remaining time |
| F1-09 | `QuestionNavigator` (desktop panel / mobile bottom sheet) |
| F1-10 | Exam session route + recovery of an unfinished attempt |
| F1-11 | Results screen: pass line + chapter breakdown + ghost targets + 3 weakest LOs |
| F1-12 | Review tour + `RationalePanel` (rationale for every option + reference chips) |
| F1-13 | Dark mode + keyboard shortcuts + `?` overlay |
| F1-14 | `MediaRenderer`: `decision-table` and `table` (the rest in Phase 2) |
| F1-15 | E2E: full mock exam flow, time expiry, recovery after reload |

### Content (≈25 hours, parallel)
| # | Task |
|---|---|
| F1-C1 | **120 questions** — ≥1 per LO, weighted toward Chapters 4/5, TR+EN, fully rationalized |
| F1-C2 | Coverage report script + README badge |
| F1-C3 | `/resources`, privacy policy, disclaimer pages |

**Phase 1 is done when:** the MVP boundary in [`02-product-requirements.md §3`](02-product-requirements.md) is met; Lighthouse ≥95; 0 critical axe violations.

---

## Phase 2 — Learning modes (4 weeks · ~40 hours)

| # | Task |
|---|---|
| F2-01 | ✅ Practice mode: chapter/LO selection, **configurable** 10/20/40-question session, instant feedback |
| F2-02 | Re-queue a wrong answer at the end of the same session |
| F2-03 | ✅ Drill by LO — delivered as study mode (`/calisma`), which absorbs the separate `/syllabus` explorer |
| F2-04 | LO weakness analysis and "Study →" deep links |
| F2-05 | Glossary screen: TR/EN search, term card, source tag |
| F2-06 | TR/EN **side-by-side** view |
| F2-07 | My mistakes / flagged / never-gotten-right-twice lists |
| F2-08 | Question error reporting (pre-filled GitHub Issue) |
| F2-09 | `MediaRenderer`: `state-transition`, `control-flow`, `code` |
| F2-10 | **Content: grow to 200 questions** (≥2 per LO) |

---

## Phase 3 — Repetition, progress, offline (4 weeks · ~40 hours)

| # | Task |
|---|---|
| F3-01 | `ts-fsrs` integration; `srsCards` table |
| F3-02 | Repetition screen: Again/Hard/Good/Easy + next-interval preview |
| F3-03 | Block consecutive questions from the same LO (sibling burying) |
| F3-04 | Due-date forecast chart; due card count on the home screen |
| F3-05 | Progress screen: score trend, per-chapter progress, streak (forgiving) |
| F3-06 | **Readiness estimate** — based on the last 3 timed mock exams |
| F3-07 | PWA: manifest, service worker, chunk caching, installability |
| F3-08 | Progress export/import (JSON) |
| F3-09 | Graduated hints; definition on term hover (tooltip) |
| F3-10 | **Content: grow to 300 questions** (≥3 per LO) |

---

## Phase 4 — Scaling (open-ended)

| # | Task |
|---|---|
| F4-01 | **CTFL-AT (Agile Tester)** content — second certification, the real test of the architecture |
| F4-02 | CT-AI v2.0 (TTB has a Turkish syllabus for it) |
| F4-03 | CT-PT (Performance Testing) |
| F4-04 | CTAL-TA v4.0 — first Advanced module (multi-point questions → scoring engine expands) |
| F4-05 | Community question contributions: PR template, originality declaration, review flow |
| F4-06 | Per-question discussion (ExamTopics' most-loved feature — via GitHub Discussions, serverless) |
| F4-07 | Turkish process guide: registration, online proctoring, results, retake rights (a gap found in the market research) |
| F4-08 | Global accuracy rate per question (anonymous, aggregate — how to preserve privacy? → needs research) |

---

## Milestones

| Date (target) | Milestone |
|---|---|
| +2 weeks | **M0** — Data skeleton ready, blueprint validated |
| +8 weeks | **M1** — MVP live, 120 questions, first real user trial |
| +12 weeks | **M2** — Learning modes, 200 questions, glossary |
| +16 weeks | **M3** — SRS + PWA + 300 questions — *"the full product"* |
| +24 weeks | **M4** — Second certification (CTFL-AT) live |

---

## Phase dependencies

```
F0-05 (blueprint) ──► F1-05 (exam generation) ──► F1-11 (results) ──► F2-04 (LO analysis)
F0-06 (objectives) ─┘                                              │
F0-08 (schemas) ────► F1-C1 (content) ─────────────────────────────┘
F1-02 (contentClient) ─► F1-05
F1-03 (Dexie) ─────────► F1-10, F3-01
F2-10 (200 questions) ──► F3-01 (pool needed for SRS to be meaningful)
```

**Critical path:** F0-05 → F1-05 → F1-11 → launch. Exam generation can't be written until the blueprint is extracted.

---

## Deliberately deferred

| Feature | Why deferred |
|---|---|
| User accounts | Server = cost + privacy burden. Export is sufficient. |
| Leaderboard / social | Motivational mechanic with debatable learning value; requires a server. |
| AI question generation (runtime) | Quality and copyright risk; loses editorial control. |
| Video / long-form text lessons | **Still deferred.** Market is saturated (a course exists with 154k students); our wedge is practice, and a video library would compete with the courses head-on. |
| ~~Short per-objective explanation cards~~ | **In scope as of 21.09.2026** — no longer deferred. A card is a few plain-text paragraphs, key points and common mistakes, bound to one LO and to that LO's own questions. It extends the per-distractor rationale that is already the product's differentiator rather than competing with a course: the candidate reads the explanation and is tested on it in the same screen. Long-form lessons stay deferred; this is the short form only. Shipped as study mode (`/calisma`, `docs/06 §3.7`); the 64 cards themselves are Track C. |
| Mobile app store | PWA is sufficient; store maintenance burden + fees. |
| Payment / subscription | Non-commercial condition is our copyright basis. See [`08-legal-and-copyright.md`](08-legal-and-copyright.md) K-2. |

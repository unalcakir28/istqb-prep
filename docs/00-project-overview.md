# 00 — Project Overview

**Version:** 1.0 · **Date:** 19.09.2026 · **Status:** Awaiting approval

---

## 1. One-sentence definition

> For people preparing for the ISTQB exam: a free, open-source mock exam platform that stays faithful to the structure of the official syllabus, analyzes by learning objective, and can be studied side by side in Turkish and English.

## 2. Why this project?

Three facts are true at the same time:

1. **There is demand, and it's expensive.** The TTB CTFL exam fee is 5,950 ₺ + 20% VAT ≈ **7,140 ₺**. The failure rate at Foundation level is **25–30%**. So roughly one in every 3–4 candidates pays this fee a second time.
2. **There is no supply.** The total number of distinct questions circulating in Turkish is under ~700, and roughly half of that is republication of the same 160 official questions. There is no serious product to buy between free and the 30,000 ₺ accredited training course.
3. **The supply that exists can't be trusted.** The largest free pool in the international market doesn't state its syllabus version; the cheapest paid pool openly markets itself as "taken from real exam questions" (an ethics violation); a paid iOS app is still on the retired 2021 syllabus. Expert advice has reached the point of *"stay away from online tests."*

Together these three leave an empty space at the intersection of **trust + Turkish + accurate labeling**.

## 3. Goals

### Primary goal
Let a CTFL candidate study in **a single place, right up to exam day**, beyond the official PDFs: practice → mock exam → weak-spot detection → repetition.

### Measurable goals (first 6 months)

| Goal | Metric |
|---|---|
| Content | 300+ original, reviewed CTFL questions (TR + EN) |
| Coverage | ≥3 questions for **all** 64 learning objectives in CTFL v4.0.1 |
| Quality | A rationale + syllabus reference for every distractor in every question |
| Usage | 1,000+ monthly unique visitors, average session ≥8 min |
| Impact | ≥50 "I passed the exam" reports in the user survey |
| Cost | **0 ₺** monthly infrastructure cost |

## 4. Scope

### In scope (v1)
- CTFL v4.0.1 — Foundation Level (**priority**)
- Full mock exam simulation (40 questions / 60 min / pass mark 26, +25% time extension option)
- Practice mode by chapter and learning objective
- Spaced repetition (SRS) flashcard / term study
- ISTQB Glossary integration (TR–EN)
- Detailed result analysis and a "are you ready?" assessment
- TR/EN language switching — **per question**, not per account
- Dark mode, keyboard shortcuts, PWA/offline support

### Out of scope (v1)
- User accounts, login, server-side sync
- Payment, subscriptions, ads
- Video training content
- Forum / community discussion (to be evaluated in v2)
- Mobile app store distribution (PWA is sufficient)

### Later levels (architecture ready, content later)
CTFL-AT (Agile Tester) → CT-AI (AI Testing) → CT-PT (Performance) → CTAL-TA / CTAL-TM.
The data model is designed multi-certification from day one; it grows only by adding content. See [`04-data-model.md`](04-data-model.md).

## 5. Target users

Detailed personas: [`02-product-requirements.md`](02-product-requirements.md)

Roughly three groups:
- **Turkish developer/test professional about to sit the exam** (primary) — 2–4 week prep window, 40–60 hours of study.
- **Corporate team** — teams whose company requires the certification and who prepare together.
- **International candidate** (secondary) — English-speaking, looking for something free and trustworthy.

## 6. Positioning statement

> For Turkish-speaking test professionals preparing for the ISTQB exam:
> **ISTQB-PREP** is a free mock exam platform mapped one-to-one to the syllabus's learning objectives, explaining the rationale behind every option.
> Unlike the question pools on the market, it shows which syllabus version every question belongs to, tells you which learning objective you're weak in, and mirrors the real exam's official question distribution exactly.

## 7. Definition of success / failure

**Counts as success:** A user prepares using the platform, passes the exam, and says "I needed this in addition to the official PDFs."

**Counts as failure:** The question bank grows without quality controls; or the syllabus is updated and the content isn't, and the platform falls into the very "outdated version" trap it criticizes.

## 8. Core constraints

| Constraint | Consequence |
|---|---|
| **Copyright** — official questions can't be copied | All questions must be written from scratch. See [`08-legal-and-copyright.md`](08-legal-and-copyright.md) |
| **No backend** | All state lives client-side (IndexedDB). No leaderboard, no accounts, no sync. |
| **GitHub Pages** | Static files only. No SSR, no server-side routing → an SPA routing strategy is required. |
| **Single developer** | Scope discipline is essential; content production is the biggest bottleneck. |
| **Syllabus version** | Every piece of content must be version-tagged; a retirement policy must be written from day one. |

## 9. Decisions

All five open decisions were closed on **19.09.2026**. Reopening any of them requires a new justification.

| # | Decision | Outcome |
|---|---|---|
| D-01 | Product name / brand | ✅ **ISTQB-PREP** — same as the repo name, no separate brand created. It's the exact word a candidate who knows what they're looking for will search; it maximizes search visibility and immediate clarity. **In exchange, brand risk was knowingly accepted:** ISTQB® is a registered trademark, and `08 §K-4` lists this name as a risky example. Descriptive use ("preparation for the ISTQB exam") is defensible; use as a product name stands on weaker ground. The expected scenario is not a lawsuit but a warning letter + rename request; that's why the name is not hardcoded (`08 §K-4`). |
| D-02 | Register a domain? | ✅ **No** — `*.github.io` is enough. This preserves the "0 ₺ monthly infrastructure cost" goal; a domain can be added later via CNAME if the need arises. |
| D-03 | Content license | ✅ **CC BY-SA 4.0**. Rationale: `08 §K-6`. An NC restriction would discourage contribution; SA prevents the content from being absorbed into a closed product. |
| D-04 | Community question contributions in v1 | ✅ **No**. Editorial quality standards must be established first; question PRs open in Phase 4 (F4-05). Bug reports (F2-08) and code contributions are open from the start. |
| D-05 | Written permission request to ISTQB | ✅ **No, will not apply**. Asking for permission implies an assumption that permission is required. The legal basis already stands independently on original content (K-1) + non-commercial use (K-2) + attribution (K-3); these hold regardless of any application. In exchange, an official assurance and the possibility of TTB cooperation were knowingly given up. |

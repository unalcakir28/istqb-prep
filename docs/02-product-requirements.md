# 02 — Product Requirements (PRD)

**Version:** 1.0 · **Date:** 19.09.2026

---

## 1. Personas

### P1 — Emre, 28, Test Specialist (primary, 60%)
3 years of manual testing experience, at a software company in Ankara. His company wants the certification for promotion and is covering the exam fee — but only **once**. He can study 1–2 hours in the evenings, 3 weeks total.
- **Needs:** A mock exam that feels like the real thing and honestly tells him what score he's at.
- **Fear:** Failing and having to pay the fee out of pocket.
- **What he does today:** Read the syllabus PDF twice, solves English questions on TryQA, gets lost in the Turkish terminology.
- **Reason to abandon the product:** Noticing the questions aren't current.

### P2 — Zeynep, 24, New Graduate (25%)
Recent computer engineering graduate, wants to add the certification to her CV while job hunting. Testing terminology is completely foreign to her. Can't afford to pay.
- **Needs:** Not just testing, but **teaching**. A term glossary, chapter-by-chapter progression, hints.
- **Fear:** Not knowing where to start.
- **Reason to abandon the product:** Scoring 12/40 on the first mock exam and losing her confidence → **the first experience must be practice mode, not a mock exam.**

### P3 — Murat, 35, Senior Developer (10%)
His team is getting ISTQB certified, so he's going along with it. Very little time, wants to get it done in 1 week.
- **Needs:** To quickly find his weak spots. An answer to "where am I stuck?"
- **Values:** Keyboard shortcuts, dark mode, a fast flow, no unnecessary animation.

### P4 — International candidate (secondary, 5%)
An international candidate looking for a free, trustworthy resource, searching in English.
- **Needs:** Version guarantee + LO-based analysis. Doesn't need Turkish, but it doesn't hurt either.

---

## 2. User stories

### Epic A — Mock exam
| ID | Story | Priority |
|---|---|---|
| A-1 | As a user, I want to start a mock exam under real exam rules (40 questions, 60 min, pass mark 26) so I can rehearse exam day. | P0 |
| A-2 | Since my native language is Turkish, I want to be able to select the **75-minute** option. | P0 |
| A-3 | I want to be able to **flag** a question and come back to it later. | P0 |
| A-4 | I want to see unanswered/flagged questions via a **question navigator** before time runs out. | P0 |
| A-5 | The mock exam should be generated according to the official **LO-group distribution**, so it reflects the real exam's chapter weighting. | P0 |
| A-6 | When time runs out, the exam should submit automatically. | P0 |
| A-7 | I want to be able to resume a mock exam I left unfinished (even if I closed the page). | P1 |
| A-8 | I want a "generate from questions not seen before" option so I don't see the same questions again. | P1 |

### Epic B — Practice and learning
| ID | Story | Priority |
|---|---|---|
| B-1 | I want to pick a chapter and practice untimed, with instant feedback. | P0 |
| B-2 | After each answer, I want to see **why it's correct and why each wrong option is wrong**. | P0 |
| B-3 | In the rationale, I want to see the **syllabus section reference** (`§4.2.3`) and the **LO code**. | P0 |
| B-4 | I want to focus on a specific **learning objective** and work through that LO's questions. | P1 |
| B-5 | When I'm stuck, I want a graduated hint (nudge → hint → solution). | P2 |
| B-6 | I want to search TR/EN equivalents and definitions in the term glossary. | P1 |
| B-7 | I want to see a term's definition on hover within a question. | P2 |

### Epic C — Bilingualism
| ID | Story | Priority |
|---|---|---|
| C-1 | I want to be able to switch TR ↔ EN per question (like the real exam booklet). | P0 |
| C-2 | I want to be able to see the TR and EN text **side by side**. | P1 |
| C-3 | I want to be able to choose the interface language independently of the content language. | P1 |

### Epic D — Analysis and progress
| ID | Story | Priority |
|---|---|---|
| D-1 | I want to see the **26/40 pass line** and my score on the results screen. | P0 |
| D-2 | I want to see a **breakdown by chapter** and a target bar for each chapter based on its real exam weight. | P0 |
| D-3 | I want to see **my 3 weakest learning objectives** and start a drill on that LO with one click. | P0 |
| D-4 | I want a **question-by-question review tour** after the exam. | P0 |
| D-5 | I want an "are you ready?" assessment (generated from the last 3 timed mock exams). | P1 |
| D-6 | I want to see my score trend over time in a chart. | P1 |
| D-7 | I want a filter for "questions I've never gotten right twice in a row." | P1 |

### Epic E — Repetition (SRS)
| ID | Story | Priority |
|---|---|---|
| E-1 | Questions I get wrong should be automatically added to a repetition deck. | P1 |
| E-2 | After seeing the answer, I want to rate myself with **Again / Hard / Good / Easy** (a lucky guess ≠ a confident answer). | P1 |
| E-3 | I want to see the **next repetition interval** on each button. | P2 |
| E-4 | I want to see how many cards are due today on the home screen. | P1 |
| E-5 | Two questions from the same LO shouldn't appear back to back. | P2 |

### Epic F — Data ownership and trust
| ID | Story | Priority |
|---|---|---|
| F-1 | I want to use it without creating an account. | P0 |
| F-2 | I want to see which **syllabus version** each question belongs to. | P0 |
| F-3 | I want to be able to export/import my progress as JSON (for switching devices). | P1 |
| F-4 | I want to be able to study on a plane / without internet. | P1 |
| F-5 | I want to be able to report a faulty question with one click. | P1 |

---

## 3. Feature list and MVP scope

| Feature | MVP (Phase 1) | Phase 2 | Phase 3 |
|---|:--:|:--:|:--:|
| Full mock exam (40/60/26) | ✅ | | |
| LO-group-based exam generation | ✅ | | |
| 75-min extension option | ✅ | | |
| Question flagging + navigator | ✅ | | |
| Results screen + pass line + chapter breakdown | ✅ | | |
| Question-by-question review tour | ✅ | | |
| Per-distractor rationale + LO/§ reference | ✅ | | |
| TR/EN switching per question | ✅ | | |
| Dark mode | ✅ | | |
| Keyboard shortcuts | ✅ | | |
| Resume an in-progress exam | ✅ | | |
| Practice mode by chapter | | ✅ | |
| Drill by LO | | ✅ | |
| LO weakness analysis | | ✅ | |
| Term glossary (TR/EN, 215 CTFL terms) | | ✅ | |
| TR/EN side-by-side view | | ✅ | |
| My mistakes / flagged list | | ✅ | |
| Question error reporting | | ✅ | |
| SRS flashcards (FSRS) | | | ✅ |
| Readiness estimate ("are you ready?") | | | ✅ |
| Progress charts + streak | | | ✅ |
| PWA / offline | | | ✅ |
| Progress export/import | | | ✅ |
| Graduated hints | | | ✅ |
| Definition on term hover | | | ✅ |

### MVP's hard boundary
> **Phase 1 is considered done when:** A user can land on the site, without creating an account, solve a 40-question mock exam under real rules; see their chapter breakdown at the end; read why every option of every question is right or wrong; and do all of this in TR or EN. **At least 120 original questions live.**

---

## 4. Out of scope (v1)

- User accounts, email, login
- Server-side data, sync, leaderboard
- Payment, subscription, ads, analytics trackers (privacy-focused, cookie-free counter excepted)
- Video content
- Users adding questions (community PRs) — to be evaluated in Phase 4
- AI-generated questions (quality risk — see [`07-content-authoring-guide.md`](07-content-authoring-guide.md))
- Mobile app store distribution

---

## 5. Non-functional requirements

| Category | Requirement |
|---|---|
| **Performance** | First meaningful paint < 1.5 s (3G Fast). Question transition < 100 ms. Only the manifest + relevant question chunk is downloaded on first load (not the full pool). |
| **Bundle size** | JS bundle (gzip) < 200 KB. Per question chunk < 60 KB. |
| **Accessibility** | WCAG 2.1 AA. Full keyboard navigation. The exam must be solvable with a screen reader. Color never carries meaning alone (correct/incorrect also shown via icon + text). |
| **Responsiveness** | Works from 360 px up. Usable one-handed on mobile (full-width touch targets for options). |
| **Offline** | PWA from Phase 3 onward; visited question chunks are cached. |
| **Privacy** | No personal data ever reaches a server. All progress lives in IndexedDB. No cookies. |
| **i18n** | Interface and content languages are independent. Adding a new language requires no code change. |
| **Data integrity** | Every question is validated against a JSON Schema in CI; the build fails if an LO code isn't in the known LO list. |
| **Browser support** | Last 2 versions of Chrome/Edge/Firefox/Safari. No IE. |

---

## 6. Measurement and acceptance criteria

| Story | Acceptance criterion |
|---|---|
| A-1 | When the mock exam starts, the timer counts down from 60:00; it auto-submits at 0; the score is computed as `correct count / 40` and shows "PASSED" if ≥26. |
| A-5 | The chapter distribution of the generated 40 questions is **exactly** 8/6/4/11/9/2; the K-level distribution is 8/24/8. Verified by a unit test. |
| B-2 | Every question has non-empty text **for every option** in `rationale.byOption`; CI fails if any is missing. |
| C-1 | When the language is switched, the question, options, and rationale all change simultaneously; the user's given answer is preserved. |
| D-2 | The results screen shows a bar for each of the 6 chapters; behind each bar, the real exam weight is drawn as a ghost target. |
| F-2 | Every question card header shows the `v4.0.1` badge and the LO code. |

---

## 7. Risks (summary)

Full risk register: [`10-risks-and-metrics.md`](10-risks-and-metrics.md)

The three most critical:
1. **Content production bottleneck** — writing 300 quality questions takes longer than writing the app.
2. **Copyright** — copying official questions would end the project. See [`08-legal-and-copyright.md`](08-legal-and-copyright.md).
3. **Turkish terminology inconsistency** — a mistranslation leads us straight into the same trap we criticize.

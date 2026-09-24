# 06 — UI / UX Design

**Version:** 1.1 · **Date:** 21.09.2026

> Design philosophy: **The exam is a serious thing; the interface should act like it, without scaring the user off.**
> Reference patterns and why they were chosen: [`01-market-research.md §7`](01-market-research.md)

---

## 1. Design principles

1. **The question is the hero of the screen.** During the exam, nothing appears on screen except the question, the options, the timer, and the navigator.
2. **Honesty over motivation.** We never soften the score, and we always show the pass line. But we show what the user got right before we tell them what's missing.
3. **Every claim is sourced.** Every rationale carries a syllabus citation and an LO code. This is both an accuracy signal and a trust signal.
4. **Dark mode is first class.** The audience is developers; none of the competitors advertise dark mode.
5. **Full keyboard usability.** Murat (P3) should be able to solve all 40 questions without touching the mouse.
6. **Zero friction.** No account, no splash screen, no cookie banner. You can start solving the moment you land.
7. **One-handed on mobile.** Options are full-width touch targets; the primary action sits within thumb reach.

---

## 2. Design system

### Color (semantic tokens, Tailwind v4 CSS variables)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#FAFAF9` | `#0C0A09` | Page background |
| `--surface` | `#FFFFFF` | `#1C1917` | Card |
| `--surface-2` | `#F5F5F4` | `#292524` | Secondary surface |
| `--border` | `#E7E5E4` | `#292524` | Border |
| `--fg` | `#1C1917` | `#FAFAF9` | Main text |
| `--fg-muted` | `#57534E` | `#A8A29E` | Secondary text |
| `--accent` | `#0F766E` | `#2DD4BF` | Primary action, brand |
| `--correct` | `#15803D` | `#4ADE80` | Correct answer |
| `--incorrect` | `#B91C1C` | `#F87171` | Incorrect answer |
| `--flag` | `#B45309` | `#FBBF24` | Flagged question, time warning |
| `--info` | `#1D4ED8` | `#60A5FA` | Info, LO badge |

> **Color never carries meaning on its own.** Correct/incorrect is always shown with an icon plus text (WCAG 1.4.1).

### Typography

| Role | Font | Size / line |
|---|---|---|
| Question body | Inter (or system) | 17px / 1.6, **max 65ch** |
| Option text | Inter | 16px / 1.5 |
| Rationale | Inter | 15px / 1.6 |
| Code / table | JetBrains Mono | 14px |
| Heading | Inter SemiBold | 24–32px |
| Badge / meta | Inter Medium | 12px, letter spacing +0.02em |

> Turkish text runs ~15% longer than English. Every component is designed **against the Turkish text**; the English fits by default.

### Spacing and radius
A 4px-based scale (4/8/12/16/24/32/48). Card radius 12px, button 8px, badge 6px. Shadow kept to a minimum; separation is done with borders (shadow doesn't read in dark mode).

---

## 3. Screens

> The wireframes below mock the Turkish-language rendering of the interface — this is a bilingual app (`src/lib/i18n/locales/tr.json` / `en.json`), and Turkish is the primary market. Labels are translated into English here for readability; where a label matches a literal string from `tr.json`, the surrounding text says so.

### 3.0 Three modes, one route map

The product is organised around **three modes**, and the home screen names them in this order: **study** teaches, **practice** drills, **exam** measures. Study leads deliberately — a first-time visitor who opens with a cold mock exam scores around 12/40 and leaves (persona P2).

Route paths are Turkish, like the rest of the product's user-facing surface; the source of truth is [`../src/App.tsx`](../src/App.tsx).

| Route | Screen | Mode |
|---|---|---|
| `/` | Home — three mode cards, resume banner, coverage | — |
| `/calisma` | Chapter list, with per-chapter mastery counts | study |
| `/calisma/:chapter` | That chapter's learning objectives, each with a state badge | study |
| `/calisma/lo/:loCode` | One objective: the lesson card, then "start test" | study |
| `/calisma/lo/:loCode/:attemptId` | The objective test **and its result, in the same route** | study |
| `/alistirma` | Practice setup — scope, question count, instant feedback | practice |
| `/alistirma/:attemptId` | Practice session | practice |
| `/sinav` | Exam setup | exam |
| `/sinav/:attemptId` | Exam session | exam |
| `/sonuc/:attemptId` | Result screen | exam + practice (study keeps its result in its own route) |
| `/inceleme/:attemptId` | Review pass — reached from the result screen | exam + practice |
| `/listelerim` | My lists — wrong, flagged, never right twice in a row | — |
| `/sozluk` | Glossary — 97 bilingual terms, searched in both languages | — |
| `/kaynaklar` | Sources, copyright, disclaimer | — |
| `/deneme`, `/deneme/:attemptId` | **Legacy redirect** to `/sinav`. Bookmarks and in-progress attempts on the old exam path keep working. | — |

**An attempt can only be opened at its own mode's URL.** `routeForAttempt` derives the address from the stored attempt's `mode` and `scope`, and the shared session shell redirects anything that arrives at the wrong one — a practice attempt opened at `/sinav/:id` bounces to `/alistirma/:id` rather than mounting a timer over a null deadline.

### 3.1 Home page `/`

```
┌──────────────────────────────────────────────────────────────┐
│  ISTQB-PREP                          [TR|EN] [🌙]             │
├──────────────────────────────────────────────────────────────┤
│  ⚑ You have an unfinished session — 12 / 40 answered          │
│    [Continue]  [Discard]                                     │
│                                                              │
│  A free mock exam for        ┌─────────────────────────────┐ │
│  ISTQB Foundation Level      │ What the real exam asks     │ │
│                              │ 40 questions across 6 …     │ │
│  120 original questions      │                             │ │
│  written from the v4.0.1     │ 1 Fundamentals          8   │ │
│  syllabus. Every option      │ ▪▪▪▪▪▪▪▪                    │ │
│  carries a reason …          │ 2 Lifecycle             6   │ │
│                              │ ▪▪▪▪▪▪                      │ │
│                              │ 3 Static testing        4   │ │
│                              │ ▪▪▪▪                        │ │
│                              │ 4 Analysis and design  11   │ │
│                              │ ▪▪▪▪▪▪▪▪▪▪▪                 │ │
│                              │ 5 Managing              9   │ │
│                              │ ▪▪▪▪▪▪▪▪▪                   │ │
│                              │ 6 Tools                 2   │ │
│                              │ ▪▪                          │ │
│  CTFL v4.0.1                 │ 60 minutes  26 of 40 pass   │ │
│                              └─────────────────────────────┘ │
│                                                              │
│  Three ways to work                                          │
│  ┌──────────────────────────────┬─────────────────────────┐  │
│  │ Study                ← primary│ Time    No limit …      │  │
│  │ One learning objective at a   │ Answers As you choose … │  │
│  │ time: read its card, then …   │ Score   Per objective … │  │
│  │ [Start studying]              │                         │  │
│  ├──────────────────────────────┼─────────────────────────┤  │
│  │ Practice                      │ Time / Answers / Score  │  │
│  │ [Start practising]            │                         │  │
│  ├──────────────────────────────┼─────────────────────────┤  │
│  │ Mock exam                     │ Time / Answers / Score  │  │
│  │ [Start a mock exam]           │                         │  │
│  └──────────────────────────────┴─────────────────────────┘  │
│                                                              │
│  120 original questions in the pool, covering 64 of the 64   │
│  learning objectives.                                        │
│                                                              │
│  ⚑ Pool warning (only when the blueprint cannot be filled)    │
└──────────────────────────────────────────────────────────────┘
```

**The hero is the blueprint, not a headline.** The per-chapter weighting is the one fact that changes how a candidate spends their time — chapter 4 is eleven questions and chapter 6 is two — and the ragged right edge of `BlueprintFigure` states it faster than any sentence can. The forty cells are `aria-hidden`: they carry nothing the row's own text does not, and forty unlabelled squares would be forty stops for a screen reader. The cells' staggered load-in is the only page-load motion in the app, and `.blueprint-cell` drops the animation outright under `prefers-reduced-motion` — the base layer's rule collapses the duration but not the per-cell delay, so a `both` fill would otherwise hold the last cells invisible for half a second.

**Critical decision:** the primary action is **Study, not Mock Exam** — scoring 12/40 on the first try loses the user (Zeynep, P2). The mode cards are `<article>`s, not links: heading, body and action collapsing into one accessible name would cost a screen-reader user the only wording that tells them where the link goes. Study's card carried a warning that its lesson cards were unwritten until Track C closed on 22.09.2026; all 64 are now published and the warning is gone.

**Each mode states the same three facts**, as a real `<dl>`: is there a clock, when does the answer appear, how is it scored. They are the same three questions for every mode, and comparing them is the reason they are on this page.

There is no CTA in the hero. The mode cards immediately below are the page's actions, and a duplicate "Start studying" would give two links the same accessible name.

Every number on this screen is read from `meta.json`, `syllabus.json` and the question index. None of 40 / 26 / 60 is written in the code.

The coverage line has **no progress bar**. `objectivesTotal` is fixed at 64 by the syllabus and coverage is 64, so a bar would sit permanently full and read as decoration; the sentence carries both numbers.

**Above the hero, one of two blocks, never both (F1-16).** With no finished session and nothing mastered, "Where should I start?" points at study and offers "measure me first" as the alternative — an empty dashboard of zeros is worse than a direction. Otherwise "Your status": objectives learned, sessions finished, and the last score. The last score is **omitted** rather than shown as 0% before the first finished session, because a dash reads as a score of zero.

**Not built yet:** the streak, the weakest-objectives summary and the SRS due count are Phase 3 (F3-04, F3-05).

### 3.2 Exam setup `/sinav`

- Duration: there is no choice. Every mock exam runs for `meta.exam.durationMinutes`, which is 60. ISTQB grants +25% to a candidate sitting in a language that is not their own, but that is a property of the sitting rather than of the paper, and this product simulates the paper (D-06). The screen states the length in its summary line; it does not offer an alternative.
- Question language: `Turkish` / `English`. Seeded from the UI language, switchable per question during the exam without losing the answer.
- `Try to avoid questions I have already seen` — **on by default**. It ranks seen questions last rather than excluding them: running out is worse than repeating.
- A **live distribution preview**: how many questions per chapter, against the blueprint's own targets.
- If the pool is insufficient, a warning **right here**, before the exam starts (rule 8).

Side-by-side question language (F2-06) ships as a third state of the language control in the session and review screens rather than as a setup option, and the "ones I got wrong" set (F2-07) is started from `/listelerim` rather than from here — both are decisions a candidate makes with a question in front of them, not before one.

**Option order is not a setting.** Every attempt shuffles each question's options (D-03), seeded off the attempt so a resume and the review show the same order; there is no toggle to turn it off.

### 3.3 Exam session `/sinav/:attemptId`

The wireframe below mocks the Turkish interface verbatim: `Soru {{current}} / {{total}}` and `İşaretle` (Flag) are the literal `tr.json` strings, and the question stem is a genuine example of Turkish question content — none of it is translated.

```
┌───────────────────────────────────────────────────────────┐
│ ⏱ 47:12    Soru 12 / 40    [⚑ İşaretle]   [TR|EN]  [⊞]   │
├───────────────────────────────────────────────────────────┤
│  Bölüm 4 · FL-4.2.1 · K3 · v4.0.1                         │
│                                                           │
│  Bir sistem 1–100 arası tam sayı kabul ediyor.            │
│  Eşdeğerlik bölümlemesi kullanıldığında MİNİMUM kaç       │
│  test senaryosu gerekir?                                  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 1   ◯  2                                            │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ 2   ◉  3                                            │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ 3   ◯  4                                            │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │ 4   ◯  6                                            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  [← Önceki]                              [Sonraki →]      │
└───────────────────────────────────────────────────────────┘
```

(Translation of the mock, for reference: "Chapter 4 · FL-4.2.1 · K3 · v4.0.1" / "A system accepts integers from 1–100. When equivalence partitioning is used, what is the MINIMUM number of test scenarios required?" / options 2, 3, 4, 6 / "← Previous" / "Next →".)

Details:
- **The timer** sits calmly in the top right; **amber in the last 10 minutes**, red in the last minute, and announces via `aria-live`. There's a hide/show toggle (the countdown creates anxiety for some candidates).
- **Option numbers** (1–4) are visible → the keyboard shortcut becomes discoverable.
- In a `multi` question, options become checkboxes instead of radios, and the header reads **"HANGİ İKİSİ — 2 şık seçin"** ("WHICH TWO — select 2 options") — this is the real TTB booklet phrasing, kept verbatim for terminological accuracy.
- **Language switching is per-question** — the answer is kept, the timer doesn't stop.
- **The `⊞` question navigator** opens from the right: 40 boxes, colored blank / answered / flagged. On mobile it's a bottom sheet.
- **Zero feedback during the exam.** Correct/incorrect is never shown — exam mode is the one mode that starts with `instantFeedback: false`.
- **Finishing is confirmed.** `SubmitConfirm` is an `alertdialog` naming what the unanswered remainder costs; submitting is irreversible, so there is no way back into the session afterwards.

> The whole of this screen below the mode's own chrome is the **shared session shell** — see §4.2. Practice and study render the same shell with a different header and footer.

### 3.4 Result screen `/sonuc/:attemptId`

```
┌──────────────────────────────────────────────────────────────────────┐
│                      28 / 40                                         │
│                      ✔ PASSED                                        │
│  [██████████████████████│░░░░░░░░░░░]                                │
│   0                    26 (pass)                 40                  │
│                                                                      │
│  Time: 48:32 / 60:00   ·   Average 1:12 / question                   │
├──────────────────────────────────────────────────────────────────────┤
│  BY CHAPTER                                                          │
│  1 Fundamentals             ██████░░  6/8   ⌐ target 8               │
│  2 Testing Throughout SDLC  ████░░    4/6   ⌐ target 6               │
│  3 Static Testing           ████      4/4   ⌐ target 4               │
│  4 Analysis & Design        █████░░░░ 6/11  ⌐ target 11  ⚠           │
│  5 Test Management          ██████░   7/9   ⌐ target 9               │
│  6 Test Tools               █         1/2   ⌐ target 2               │
├──────────────────────────────────────────────────────────────────────┤
│  WEAKEST LEARNING OBJECTIVES                                         │
│  FL-4.2.3  Boundary value analysis     0/3  [Practice →]             │
│  FL-4.2.1  Equivalence partitioning    1/3  [Practice →]             │
│  FL-5.1.4  Test estimation techniques  1/2  [Practice →]             │
├──────────────────────────────────────────────────────────────────────┤
│  [Review question by question]   [Add my mistakes to the review deck]│
└──────────────────────────────────────────────────────────────────────┘
```

- The pass line is **always** drawn — whether the user passed or failed — for an attempt whose `scope.kind` is `blueprint`. That is the one thing the 26/40 mark describes, and practice shares this screen: on a scoped set the mark, the verdict and the pass/fail tone are all dropped and the bar ends at the questions asked, because 10 and 20 can never reach 26 and a perfect run would otherwise read as a failure. The discriminator is the scope, never the mode.
- Behind the chapter bars, **the real exam weight is shown as a ghost target** (the AWS Skill Builder pattern).
- If the user failed, the top block isn't accusatory: *"4 points short of 26. Focus on the 3 weakest objectives."*
- In Phase 3, a **readiness estimate**: *"2 of your last 3 timed attempts passed the bar — you can schedule the exam."*

### 3.5 Review pass `/inceleme/:attemptId`

For every question:
1. A `Question N of M` heading carrying the outcome badge (✓ / ✕ + text)
2. The question text, with **your answer** (red + ✕ if wrong) and **the correct answer** (green + ✓) marked on the option rows
3. **Summary rationale**, under the panel's own `Why?` title
4. **A "why" line for every option** — this is our main differentiator, never hidden, open by default
5. Citation chips: `FL-4.2.1` · `§4.2.1` · `K3` · `v4.0.1`

Each question is one **nested group of headings**, not three flat ones — see §4.3. A filter switches between all questions and the wrong ones only.

**Not built yet:** `[Add to review deck]` (F3-01) and `[Report an error in this question]` (F2-08).

### 3.6 Practice mode `/alistirma`

The scope is **chosen, not fixed**. The setup screen offers:

- **Scope:** the whole syllabus · a set of chapters · one learning objective
- **Question count:** 10 / 20 / 40, with **10 the default** (the Duolingo pattern — give the session a visible end). Choosing the whole syllabus at the blueprint's own count produces a real blueprint-distributed set rather than a flat random draw.
- **Instant feedback:** on by default, and switchable off. With it on, the rationale opens inline the moment the answer is complete (not a modal) and that answer locks; with it off nothing locks and the rationale waits for the review pass.
- **A live preview of how many questions the scope can actually produce**, computed by the same `selectQuestions` the session will run — so the preview cannot drift from the result. A shortfall is stated before the session starts (rule 8).
- Untimed. Finishing is manual and confirmed, through the same `SubmitConfirm` exam mode uses.

**Not built yet:** re-queuing a missed question at the end of the same session (F2-02), progressive hints (F3-09), and the "10 more from the same topic" follow-on.

### 3.7 Study mode `/calisma`

Three levels, each one a route, and the entry point for persona P2. This **absorbs the syllabus explorer** that earlier versions of this document specified as a separate `/syllabus` screen: a filterable list of 64 objectives with an accuracy column was the same screen, one click further from the content.

1. **`/calisma` — chapters.** The six syllabus chapters, each with its objective count and how many of them are mastered.
2. **`/calisma/:chapter` — objectives.** Every LO in the chapter as a row: code · K-level · text · an `ObjectiveStateBadge` reading `not started` / `in progress` / `mastered`. The badge is an icon **plus words**, never a coloured dot (WCAG 1.4.1).
3. **`/calisma/lo/:loCode` — one objective.** The lesson card (§3.10), then `Start test`. **Opening the card is itself progress** — the objective leaves "not started" on mount, even if the test is never taken. If the objective has fewer published questions than the mastery bar, the screen says so before the test starts.
4. **`/calisma/lo/:loCode/:attemptId` — the test, and its result in the same route.** Always untimed, always instant feedback: the point is to close the loop between the explanation and the question while the explanation is still in reach. At most 10 questions — a study-mode product choice, not an exam constant, so it does not come from `meta.json`. The result does not navigate away; the way back to the card and the way on to the next objective are both on it.

**Mastery is losable.** It reflects the most recent objective test, not a high-water mark: ≥3 questions answered for the objective across all sessions **and** ≥80% on the last test. A candidate who has forgotten a topic should see that. An attempt submitted with nothing answered writes nothing, so it cannot erase mastery already earned.

### 3.8 Review (SRS) `/review`

- **The number of cards due today** on the home screen
- Card flow: question → answer → rationale → **Again / Hard / Good / Easy**
- **The next interval** shown above each button (`Good → 4d`) — to build trust in the algorithm
- Two questions from the same LO never appear back to back
- Forecast chart: the load for the next 7 days

### 3.9 Glossary `/sozluk`

All 97 keyword pairs the two official syllabi publish in their own per-chapter keyword lists, aligned positionally rather than translated (`terms.json`, `source.method`).

- One search box over **both** languages at once. "regression" and "regresyon" find the same row, so a candidate who knows only one side can still get to the other.
- Turkish-aware lowercasing: `"I".toLowerCase()` is `"i"` by default but `"ı"` in Turkish, and the terms are full of dotted and dotless i.
- A chapter filter, as a radio group — one chapter at a time, not a set of independent toggles.
- The result count is in a polite live region, **debounced**. A count rewritten on every keystroke makes a screen reader talk over the user's own typing; the visible number still updates immediately.
- Where a term carries a `trForbidden` word, that word is shown in red. A candidate who learned *kusur* from an older book has to be told it is wrong — hiding it means they never find out.
- The footer carries `trSource` and the mapping method, because a bilingual term list is only worth anything if the reader can see it was measured rather than translated.

**No definitions.** Their licence is settled — the ISTQB Glossary footer was confirmed CC BY 4.0 in the browser on 22.09.2026 (F0-02, `docs/evidence/`) — but nothing has been copied yet, and the screen says so rather than looking unfinished. The term tooltip (F2-11) waits on the same content.

### 3.9b My lists `/listelerim`

Three lists, none of them stored: each is derived from the answers already in IndexedDB by `buildQuestionHistory`, so a list cannot drift from what actually happened.

- **Questions I got wrong** and **questions I flagged** read the LATEST answer only. Wrong in March and right in April is not a current mistake, and a flag cleared last session is cleared.
- **Never right twice in a row** reads the whole history. One hit after a run of misses is as likely to be a guess as knowledge, and an unanswered attempt breaks a run exactly as a wrong one does.
- Each list hands its ids straight to the `questions` scope, so "practise this list" is the same machinery as "retry the ones you missed" on the result screen, not a second path.

### 3.10 Lesson card (inside `/calisma/lo/:loCode`)

A short explanation of one learning objective, written from scratch: a title, a few plain-text paragraphs, **key points**, and **common mistakes**, closing with the same citation chips the rationale panel uses.

Content lands objective by objective (Track C), so `lesson` is nullable throughout: an objective with no card yet still has questions, still records mastery, and still belongs in the chapter list. A missing card renders **a short honest placeholder, not an error**.

Paragraphs are plain text, not Markdown — the project ships no Markdown renderer and this feature does not justify adding one.

---

## 4. Component spec

### 4.1 `QuestionCard`

```
┌─────────────────────────────────────────────────────────┐
│ Chapter 4 · FL-4.2.1 · K3 · v4.0.1            [⚑] [TR|EN]│  ← meta strip
├─────────────────────────────────────────────────────────┤
│ Question text (max 65ch)                                 │
│                                                          │
│ [optional media: decision table / state diagram]         │
├─────────────────────────────────────────────────────────┤
│ 1 ◯ Option A                   ← full-width click target │
│ 2 ◉ Option B                                             │
│ 3 ◯ Option C                                             │
│ 4 ◯ Option D                                             │
└─────────────────────────────────────────────────────────┘
```

**Side-by-side mode (F2-06)**: the second language sits beneath the first — the stem as a quieter aside under the heading, and each option's second text **inside that option's own `<label>`**. Not two columns of rows: two parallel radio groups would let a candidate tick a Turkish option and an English one and mean a single answer. One group, two texts per choice.

The primary language is still `contentLang`: it is what the heading is announced in and what the attempt records. "Both" is a state of the control, never of the content, so the preference lives in localStorage (`src/lib/bilingual.ts`) rather than on the attempt.

**After answering (practice/study/review)**: the selected option and the correct option are marked — colour, an icon **and** a word, all three (WCAG 1.4.1) — and a `RationalePanel` opens below it with a summary, a "why" line for every option, and citation chips.

**The options are one named group**, `role="radiogroup"` for single-select and `role="group"` for multi, named by the stem **and** the "select 2 options" instruction. Without the group a multi-select gives each checkbox its own name, so a screen-reader user gets no "1 of 4" and no way to learn that two answers are wanted.

### 4.2 `SessionRunner` — the shared session shell

All three modes render the same shell ([`../src/features/session/SessionRunner.tsx`](../src/features/session/SessionRunner.tsx)). It owns everything that is the same in every mode: loading and resuming the attempt, the question card, previous/next, the navigator, the live region, and the keyboard. A mode screen supplies only its own chrome through `header` and `footer`, and owns what is genuinely mode-specific — exam mode's timer and auto-submit, practice's and study's manual finish.

Two rules keep the shell honest:

- **The route is the single source of truth for which attempt is open.** If the store is cold — a reload, a crash, a link opened in a new tab — the attempt and every answer are read back from IndexedDB before anything renders. Nothing about a session lives only in memory.
- **One owner of the keyboard.** A mode's own shortcut is folded into the shell's handler (exam mode's `T` is the only one) rather than registered beside it, so the shell's dialogs can silence it. A mode that opens its own dialog passes `modalOpen`, or the user could answer and navigate from behind the modal and then confirm something it never described.

**What is announced, and how.** Revealing an answer and moving to the next question both replace most of the screen with no page load. Both are announced **by moving focus**, never by racing it: a focus event is given priority by NVDA and VoiceOver and flushes pending polite speech, so anything written to a live region in the same breath is dropped. What has to be heard is named onto the element that receives the focus instead.

| Event | Focus goes to | Which reads |
|---|---|---|
| Next / previous question | The stem heading | `Question 3 of 40 <stem>` — the counter is referenced, never duplicated in the DOM |
| The answer is revealed | The rationale panel | `Correct answer! Why?` — the verdict is part of the panel's accessible name |
| A multi-select pick displaces an older one | nothing moves | The polite live region, which is its **only** writer: "option 1 cleared" |

Prev/Next at a boundary carry `aria-disabled`, not `disabled`: a real `disabled` fires while the user is still pressing the button and throws focus to `<body>` at exactly the moment they want Submit, the very next tab stop.

### 4.3 Heading outline

Both `QuestionCard` and `RationalePanel` take a `headingLevel`, because the same components appear in two different outlines:

| | Session (`/sinav/:id`, `/alistirma/:id`, `/calisma/lo/:lo/:id`) | Review (`/inceleme/:id`) |
|---|---|---|
| `h1` | `Question 3 of 40` (the counter) | `Review` |
| `h2` | the stem · the navigator · `Why?` | `Question 3 of 40` + outcome badge |
| `h3` | `Summary` / `Per option` | the stem · `Why?` |
| `h4` | — | `Summary` / `Per option` |

In a session `RationalePanel` is rendered without a `headingLevel` (`SessionRunner.tsx:544`) and its default is `2` (`RationalePanel.tsx:70`, `:81`), so `Why?` is a sibling of the stem, not a child of it. The review pass passes `3` explicitly (`Review.tsx:166`, `:173`).

A 40-question review pass is **40 nested groups of three**, not 120 flat sibling headings. `RationalePanel`'s `Why?` title is a real heading rather than an `aria-label`, because focus lands on the panel the moment an answer is revealed, and a named region with nothing inside it announces only its own name.

### 4.4 `SubmitConfirm`

One `alertdialog` shared by every mode that can end a session by hand. Submitting writes `status: "submitted"`, after which the shell bounces the route to the result screen and there is no way back in — so the click is confirmed whether or not the session was timed. The copy is passed in: an exam and a practice session end differently and must say so. Only the cancel label is owned by the component, because standing down is the same act in every mode.

---

## 5. Keyboard shortcuts

Owned in one place — the shared session shell's key handler (§4.2) — and every one of them also has a visible control. The overlay opened with `?` documents the fast path; it never owns the only path.

| Key | Action | Notes |
|---|---|---|
| `1` – `9` | Select option (toggle in multi) | |
| `→` / `←` | Next / previous question | |
| `F` | Flag | |
| `L` | Switch question language (TR ↔ EN) | |
| `N` | Question navigator | On desktop it moves focus into the panel that is already on screen, onto the **current** question's cell — from question 30, cell 1 would leave 29 tab stops between the user and where they were. On narrow screens it opens the sheet. |
| `T` | Hide/show the timer | Exam mode only. The overlay omits the row where there is no clock, rather than advertising a key that does nothing. |
| `?` | Shortcut help | |
| `Esc` | Close panel/modal | |

While a dialog is open — the navigator sheet, the shortcuts overlay, or a mode's own confirm — **every shortcut stands down**, including `T`. Reading the help is exactly when a candidate presses the key the help documents.

Typing in a real text field is never swallowed; radios and checkboxes are the options themselves, so shortcuts stay live there.

**Not built:** `Enter`/`Space` as "answer / next" (native activation only), `R` to toggle the rationale (it is never collapsed), and the SRS grading keys (Phase 3).

---

## 6. Motion and feedback

- Transitions 150–200 ms, `ease-out`. Animation in the exam flow is **kept to a minimum** — perceived speed beats polish. Today that minimum is literal: colour transitions on interactive rows and nothing else.
- No confetti on a correct answer. The planned quiet acknowledgment (scale 1.0 → 1.02) is not implemented.
- **No shake/wobble** on a wrong answer — it feels punitive.
- `prefers-reduced-motion: reduce` → all transitions turn off.
- No sound (by default). Not even a library gets added for it.

---

## 7. Empty and error states

| State | What's shown |
|---|---|
| No attempt made yet | The three mode cards, with **study** as the primary action (F1-16's "Where should I start?" card is still open) |
| No lesson for an LO | The objective screen renders a short honest placeholder instead of the card — the questions and the test are still there |
| No question for an LO | The objective screen says so and `Start test` is disabled |
| Fewer questions than the mastery bar | Stated on the objective screen **before** the test starts: this test cannot mark the objective learned however well it goes |
| Pool insufficient (exam or practice) | An **explicit warning** on the setup screen, plus how many questions will be generated. Silently generating a short session is forbidden (rule 8). |
| Network error (chunk failed to load) | "Couldn't load questions" + retry; if offline, a suggestion to continue with the cached chunks |
| Answers cannot be written to IndexedDB | A banner inside the session: progress is not reaching disk and a reload will lose it |
| Attempt opened at another mode's URL | Redirected to the address `routeForAttempt` derives from the stored attempt |
| Data version changed | Silent update; an SRS card notice only if a specific question actually changed |
| Attempt left unfinished | A banner at the top of the home page: "You have an unfinished session — 12/40 answered — [Continue] [Discard]" |

---

## 8. Accessibility checklist

`yarn e2e` runs `@axe-core/playwright` over every main route in both themes, plus the specs for the failures axe cannot see — focus destinations, accessible names, live-region behaviour. Items below that axe cannot check are the ones those specs cover.

- [x] Every interactive element is reachable with `Tab`, focus ring visible
- [x] Option groups use `role="radiogroup"` / `role="group"` + `aria-labelledby` naming the stem **and** the select-count instruction
- [x] Correct/incorrect: color + icon + text (all three together) — on the option rows and on the objective state badge
- [x] Contrast ≥ 4.5:1 (text), ≥ 3:1 (UI component) — in both themes
- [x] Modal/sheet has a focus trap and closes with `Esc`; shortcuts stand down while one is open
- [x] Every screen change that is not a page load moves focus and says where: next question → the stem heading; reveal → the rationale panel, named after the verdict; study finish → the result heading; `/sonuc` and `/inceleme` → their own `<h1>` on arrival. `useArrivalFocus` gates that on the navigation type, so a cold open, a reload and the Back button all stay silent — a page load has nothing to announce, and moving focus to the `tabIndex={-1}` heading there would leave the skip link behind a Shift+Tab. Back is the accepted cost of that: `location.key` would have told arrival from Back but not from a reload, because the browser restores `history.state`
- [x] Boundary buttons use `aria-disabled`, so focus is never yanked out from under the user
- [x] The question is on the heading outline, and nests correctly in both the session and the review outline (§4.3)
- [ ] Page title updates on **every** route change — the session shell, the study result, `/sonuc` and `/inceleme` set it through `useDocumentTitle`. No other route sets one and no route clears one, so the setup, home, chapter and sources routes show the static title only until the first session and whatever was last set after that: "Back home" from `/sonuc` leaves "Result · ISTQB-PREP" on the home page. Closing this means every route declaring its own title, not a reset in `Layout` — a reset there would run after its children's effects on mount and clobber the title the route just set
- [x] `lang` attribute is set by content language (`lang="tr"` / `lang="en"`)
- [x] The visible timer is `aria-live="off"` (`ExamTimer.tsx:134`); a separate sr-only polite region announces the remaining minutes **once per minute inside the final ten**, plus once at zero (`announcementMinute`, `examTimer.ts:60-65`, gated on `WARNING_MS`). A region ticking every second is worse than silence
- [x] `prefers-reduced-motion` is supported
- [ ] Media components render as a real `<table>` (not an image) — F1-14
- [ ] A text alternative (transition list) is always available for the `state-transition` diagram — F2-09
- [ ] Each column separately `lang`-tagged in side-by-side mode — F2-06
- [ ] No horizontal scroll at 200% zoom — unverified
- [ ] `n` on a narrow screen lands on the current question's cell, not the sheet's Close button

---

## 9. Brand and tone

- **Tone:** Calm, technical, no forced cheerfulness. Few exclamation marks. Emoji only in place of an icon (🔥 streak, ⚑ flag).
- **Turkish language:** Informal second person, "sen" register ("Çözdün", "Zayıf olduğun hedefler"). Official ISTQB terms in the form the TTB syllabus uses, with the English in parentheses on first mention.
- **To avoid:** "Harika!", "Muhteşem!", gamification language, false urgency, claims in the style of "99% pass guarantee."
- **Logo/name:** **ISTQB-PREP** (D-01). A wordmark is enough; no illustration needed. The ISTQB logo, colors, or typography are **never used** — since the name is already close to the brand, the visual identity needs to be clearly distinct from ISTQB.

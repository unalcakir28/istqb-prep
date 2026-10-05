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
| `/` | Home — certification picker (when 2+ are active), three mode cards, resume banner, coverage | — |
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
| `/tekrar` | Repetition — the SRS deck's due cards, one at a time (§3.8) | — |
| `/ilerleme` | Progress — readiness estimate, streak, mock exams over time, first vs latest answers per chapter (§3.9c) | — |
| `/sozluk` | Glossary — the active certification's bilingual terms (97 CTFL · 156 CT-AI), searched in both languages | — |
| `/verilerim` | Your data — whether this browser keeps it, download a copy of the progress, load one (§3.11) | — |
| `/kaynaklar` | Sources, copyright, disclaimer | — |
| `/sinav-sureci` | Taking the exam in Turkey: registration, the proctored online exam, result, retake (F4-07) | — |
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
│  CTFL v4.0.1                 │ 60 minutes  26 of 40 points │ │
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

The coverage line has **no progress bar**. For CTFL, `objectivesTotal` is fixed at 64 by the syllabus and coverage is 64, so a bar would sit permanently full and read as decoration; the sentence carries both numbers.

**Above the hero, one of two blocks, never both (F1-16).** With no finished session and nothing mastered, "Where should I start?" points at study and offers "measure me first" as the alternative — an empty dashboard of zeros is worse than a direction. Inside it, above the two actions, sits the first-use notice ADR-0003 asks for (F3-12): progress is saved in this browser only, clearing the browser's data or closing a private window deletes it, and a link to `/verilerim` says how to keep a copy. Otherwise "Your status": objectives learned, sessions finished, and the last score. The last score is **omitted** rather than shown as 0% before the first finished session, because a dash reads as a score of zero.

**The certification picker (F4-01).** Once the manifest has two `active` certifications, the page opens with a "Certification" group of toggle buttons — acronym and version, with the full name under it — above everything else, the resume banner included: what the page shows depends on it. It is the interface-language control's pattern (`aria-pressed`), not a radio group, because a pick reloads the page and arrow keys that moved the selection would reload it on every press. The choice is kept in localStorage (`src/lib/certification.ts`); every screen that is not tied to an attempt reads it, and a session, its result and its review keep reading their own attempt's certification. The routes carry no certification, so every existing bookmark lands where it did. One exception follows a link: `/calisma/lo/:loCode` with another certification's objective switches to that certification rather than saying "not found". A pick loads the page again but keeps the current one on screen until the new one arrives, so the pressed button never unmounts and keeps focus; a status line under the picker then says "Now showing CT-AI v2.0 — Certified Tester AI Testing", because everything under it changed without focus moving. The pressed button carries a check mark and a heavier border, not only a colour. Because the routes do not say which certification is shown, the three screens that start a session — `/calisma`, `/alistirma`, `/sinav` — name it above their heading (`CertificationTag`).

**Points are said, not drawn.** For CTFL the caption ends "Each one is worth a single point." For a certification whose questions differ — CT-AI v2.0, where a K3 question is worth 2 — it says so ("a K2 question is worth 1 point and a K3 question is worth 2 points, 44 points in all"), read from the blueprint's groups. A cell is still one question: the paper has 40, whatever they are worth. The pass line under the figure is in points.

**The repetition link (F3-02).** "Your status" carries a link to `/tekrar` once the deck holds a card, with the due count in its own text ("Repeat 3 due questions"), accent-filled while something is due. Before the first wrong answer there is no link: it would lead to an empty screen. The count comes from the same `summarizeDeck` the review screen serves by, so the two numbers cannot disagree.

**Not on this page:** the streak and the per-chapter progress live on `/ilerleme` (§3.9c), and the 7-day forecast on the /tekrar done panel (§3.8). The weakest-objectives summary stays on the result screen (§3.4).

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
- Under a **timed mock exam**, the **readiness estimate** (F3-06, `ReadinessNote`): *"2 of your last 3 timed mock exams reached the pass mark — by this site's rule of thumb, you can book the exam."* With fewer than three it says how many more are needed. The rule's caveat is printed with it every time: it is this site's rule of thumb, and ISTQB publishes no way to predict a result (rule 5). An untimed blueprint attempt is not counted — the real paper has a clock.

### 3.5 Review pass `/inceleme/:attemptId`

For every question:
1. A `Question N of M` heading carrying the outcome badge (✓ / ✕ + text)
2. The question text, with **your answer** (red + ✕ if wrong) and **the correct answer** (green + ✓) marked on the option rows
3. **Summary rationale**, under the panel's own `Why?` title
4. **A "why" line for every option** — this is our main differentiator, never hidden, open by default
5. Citation chips: `FL-4.2.1` · `§4.2.1` · `K3` · `v4.0.1`

Each question is one **nested group of headings**, not three flat ones — see §4.3. A filter switches between all questions and the wrong ones only.

**Not built, deliberately:** an `[Add to review deck]` button. A question answered wrong joins the deck automatically when the session is submitted (F3-01), and a right answer is not evidence enough to add one. `[Report an error in this question]` (F2-08) and `[Discuss]` (F4-06, behind `DISCUSSIONS_ENABLED`, on since 05.10.2026) live in each question's rationale panel (§4.1).

### 3.6 Practice mode `/alistirma`

The scope is **chosen, not fixed**. The setup screen offers:

- **Scope:** the whole syllabus · a set of chapters · one learning objective
- **Question count:** 10 / 20 / 40, with **10 the default** (the Duolingo pattern — give the session a visible end). Choosing the whole syllabus at the blueprint's own count produces a real blueprint-distributed set rather than a flat random draw.
- **Instant feedback:** on by default, and switchable off. With it on, the rationale opens inline the moment the answer is complete (not a modal) and that answer locks; with it off nothing locks and the rationale waits for the review pass.
- **A live preview of how many questions the scope can actually produce**, computed by the same `selectQuestions` the session will run — so the preview cannot drift from the result. A shortfall is stated before the session starts (rule 8).
- Untimed. Finishing is manual and confirmed, through the same `SubmitConfirm` exam mode uses.

**The hint ladder (F3-09).** With instant feedback on — practice by default, study always, never a mock exam — a "Stuck?" box sits under each unrevealed question, one press per step (`HintLadder`):

1. **Give me a nudge** — what the question checks: its learning objective's code and text, in the question's language.
2. **Give me a hint** — the question's authored `hints` where it has them; otherwise one wrong option taken away and quoted (`features/session/hints.ts`). Its rationale is not shown: rationales are written to be read beside the key and many name it, so the ladder shows the option alone (D-07). It is always the first wrong option in the order shown, whatever has been picked: a hint that followed the picks would let a multi-select question be probed and answered without the last step's cost.
3. **Show the answer** — reveals the question through the same path a complete answer takes, so it locks. The cost is stated under the button and is its accessible description: the question counts as not answered correctly and goes to the repetition deck at the finish, even with no option picked; the result screen counts it as unanswered if nothing was picked and as wrong otherwise. Either way it is "not known": the deck and "retry the ones you missed" share one rule (`features/session/notKnown.ts`), and the wrong list applies the same one to the stored answers (`questionHistory.ts`). The rationale panel is named "Answer shown." rather than given a verdict.

No new content is written for it: the nudge and the hint are text the product already ships and reviewed. Each step moves focus to what it added; the last needs nothing, because the shell focuses the rationale panel on a reveal. How far up the ladder a question is lives in the session screen only — a hint changes no score, and the step that does is stored as the reveal it is. A mock exam has no ladder: a hint would change what the score measures. Practice with instant feedback off has none either: nothing is revealed before the review.

**Side by side (F3-14),** the ladder carries the second language the way the stem does: the objective, the authored hint, or the same option (matched by id, not position), each as a quieter aside under the reading language, marked with its own `lang` (`hintIn` in `features/session/hints.ts`). Where the second language has no hint of the same kind, nothing is shown for it rather than a mismatched one. The rationale panel is still in the reading language only.

**Not built yet:** the "10 more from the same topic" follow-on. Re-queuing a missed question inside the same session is not planned: F2-02 starts a new practice attempt instead.

### 3.7 Study mode `/calisma`

Three levels, each one a route, and the entry point for persona P2. This **absorbs the syllabus explorer** that earlier versions of this document specified as a separate `/syllabus` screen: a filterable list of 64 objectives with an accuracy column was the same screen, one click further from the content.

1. **`/calisma` — chapters.** The six syllabus chapters, each with its objective count and how many of them are mastered.
2. **`/calisma/:chapter` — objectives.** Every LO in the chapter as a row: code · K-level · text · an `ObjectiveStateBadge` reading `not started` / `in progress` / `mastered`. The badge is an icon **plus words**, never a coloured dot (WCAG 1.4.1).
3. **`/calisma/lo/:loCode` — one objective.** The lesson card (§3.10), then `Start test`. **Opening the card is itself progress** — the objective leaves "not started" on mount, even if the test is never taken. If the objective has fewer published questions than the mastery bar, the screen says so before the test starts.
4. **`/calisma/lo/:loCode/:attemptId` — the test, and its result in the same route.** Always untimed, always instant feedback: the point is to close the loop between the explanation and the question while the explanation is still in reach. The hint ladder (§3.6, F3-09) is there too. At most 10 questions — a study-mode product choice, not an exam constant, so it does not come from `meta.json`. The result does not navigate away; the way back to the card and the way on to the next objective are both on it.

**Mastery is losable.** It reflects the most recent objective test, not a high-water mark: ≥3 questions answered for the objective across all sessions **and** ≥80% on the last test. A candidate who has forgotten a topic should see that. An attempt submitted with nothing answered writes nothing, so it cannot erase mastery already earned.

### 3.8 Repetition (SRS) `/tekrar`

Built in F3-02. One due card at a time, the most overdue first.

- **How a card gets there:** a question answered wrong in study, practice or the exam (F3-01), or one whose answer was shown through the hint ladder before it was answered (F3-09, §3.6). Nothing else adds one; there is no manual "add to deck".
- Card flow: question → answer → rationale → **Again / Hard / Good / Easy**. The answer reveals on a complete selection, as in study mode, and focus moves to the rationale panel, which is named after the verdict.
- **The next interval is printed on each button** ("Good · in 4 days"), formatted by `Intl.NumberFormat` in the interface language — to build trust in the algorithm. The button's accessible name is its label plus that interval.
- **A wrong answer offers only "Again".** The self-rating exists because a right answer can be a guess; a wrong one is not a matter of confidence, and rating it "Easy" would send a question the candidate does not know weeks away.
- Each rating is written the moment it is given; leaving halfway loses nothing. After a rating focus moves to the next card's stem, or to the "nothing due" heading, which is described by the facts under it (how many were repeated, the deck size, when the next card is due).
- The screen keeps no attempt and writes no responses, so the saved lists, the home numbers and the exam history stay about the three modes.
- Options are shuffled per visit from a fresh seed (D-03), so a question that keeps returning does not keep its key in the same row.
- `1`–`9` select an option before the reveal. **No grading keys:** the same digit would select one moment and rate the next.
- A card whose question is no longer published is skipped, not shown, and stays in the deck.
- **A revised question comes back** (F3-11): when a question's `revision` moves past the one its card was scheduled against, a card in review returns to relearning, due now, and a card still being learned just comes due, on this screen and in the home count alike. The candidate's memory was of a text that has changed; no lapse is counted. A card stored before F3-11 has no revision: it adopts the current one and is not reset.

- **Two cards of the same LO are not served back to back** (F3-03, `spreadSiblings` in `features/srs/queue.ts`): the first one's rationale would answer the second. A sibling moves back, most overdue first otherwise. Two siblings meet only when no order can keep them apart (a deck of one LO, say) — a due card is moved, never held back.
- **The next 7 days, one row each** (F3-04, `DueForecast`): when nothing is due, the done panel shows how many questions come due today, tomorrow and on each following day, with a bar scaled to the busiest day. The bar is `aria-hidden`; the row's own words carry the count. Day names come from `Intl` in the interface language. A week with nothing in it shows no chart, only the "next one is due in" sentence.

### 3.9 Glossary `/sozluk`

For CTFL, all 97 keyword pairs the two official syllabi publish in their own per-chapter keyword lists, aligned positionally rather than translated (`terms.json`, `source.method`). For CT-AI, 156 terms: the v2.0 keyword lists plus the terms the content needed, with Turkish from the TTB v1.0 syllabus where it exists and editorial otherwise — each term records its `trSource`.

- One search box over **both** languages at once. "regression" and "regresyon" find the same row, so a candidate who knows only one side can still get to the other.
- Turkish-aware lowercasing: `"I".toLowerCase()` is `"i"` by default but `"ı"` in Turkish, and the terms are full of dotted and dotless i.
- A chapter filter, as a radio group — one chapter at a time, not a set of independent toggles.
- The result count is in a polite live region, **debounced**. A count rewritten on every keystroke makes a screen reader talk over the user's own typing; the visible number still updates immediately.
- Where a term carries a `trForbidden` word, that word is shown in red. A candidate who learned *kusur* from an older book has to be told it is wrong — hiding it means they never find out.
- The footer carries `trSource` and the mapping method, because a bilingual term list is only worth anything if the reader can see it was measured rather than translated.

**No definitions here.** The screen says its rows are translations, not definitions, and points to where the definitions are: the lesson cards (§3.10, F2-11).

### 3.9b My lists `/listelerim`

Three lists, none of them stored: each is derived from the answers already in IndexedDB by `buildQuestionHistory`, so a list cannot drift from what actually happened.

- **Questions I got wrong** and **questions I flagged** read the LATEST answer only. Wrong in March and right in April is not a current mistake, and a flag cleared last session is cleared.
- **Never right twice in a row** reads the whole history. One hit after a run of misses is as likely to be a guess as knowledge, and an unanswered attempt breaks a run exactly as a wrong one does.
- Each list hands its ids straight to the `questions` scope, so "practise this list" is the same machinery as "retry the ones you missed" on the result screen, not a second path.

### 3.9c Progress `/ilerleme`

F3-05 and F3-06. Four readings of what IndexedDB already holds for the picked certification; nothing new is stored (`features/progress/progress.ts`).

- **Readiness** first, because it is the question a candidate comes with: the same `ReadinessNote` as under a timed mock exam's result (§3.4) — the last 3 timed blueprint attempts, ready at 2 passes, with its caveat.
- **Streak** — active days in a row. A finished session (any mode) or a repetition makes a day active; one missed day between two active days does not break the run, and the run is still alive while only yesterday was missed (Duolingo's streak freeze, given for free). Repetition counts through each card's last review, so a day whose only reviews were later repeated drops out; no history table was added for it.
- **Mock exams** — the last 10 blueprint attempts, oldest first: date and time, a bar of the points with the pass line drawn over it (both on the paper's full scale, so a short exam's bar never crosses the line it did not reach), and "30 / 40 · passed" in words. The bar and the line are `aria-hidden`; an untimed attempt says so.
- **By chapter** — for every question answered at least once (a flagged or cleared one with no answer does not count): the share right the first time against the share whose latest answer is right. It is the learning, not the luck of one paper: the same replay of answers against keys as the saved lists (`buildQuestionHistory`).

Empty states say what each part waits for rather than showing zeros. The nav carries the page between Repetition and My lists; below `sm`, where the top nav is hidden, the footer links to it.

### 3.11 Your data `/verilerim`

Built in F3-08 and F3-12. The one mitigation for R-08: progress lives only in this browser, so a file the candidate keeps is the only copy that survives a cleared browser, and the only way to another device. Linked from the footer on every width, from the privacy section of `/kaynaklar`, from the home screen's first-use notice and from the storage-unavailable alert.

- **Download a copy** — one button; the file is `istqb-prep-progress-YYYY-MM-DD.json`. "Download started" and the file name are announced in a status region.
- **Focus never falls to the page.** Every step unmounts the control just used, so focus moves on: to the file's description once it is read (the version warning is part of that description), back to the file input after Cancel, and to the result line after a load. A repeated failure re-announces, because each message is keyed to the attempt that produced it.
- **Load a copy** — two steps on purpose, because it writes into this browser's progress: choose a file, read what it holds (when it was saved; how many sessions, answers, objective records and repetition cards), then confirm. The screen says before the button that nothing is deleted and the newer copy of a record wins.
- A file from another question version shows a warning and still loads. A file that is not a progress file, is damaged, or comes from a newer version of the site is refused with a reason, as an alert, and no load button appears.
- The result names what happened: new records, records updated from the file, and records kept from this browser because they were newer.
- **Does this browser keep your progress?** (F3-12) — the first section, answered from `src/lib/storage.ts`: storage does not open (nothing is saved, nothing to download); the browser has agreed to keep the data (`navigator.storage.persisted()`); it saves but has not promised to keep it; or it does not say. Only the third offers a button, "Ask the browser to keep my data", which calls `navigator.storage.persist()`. It never runs unasked, because Firefox answers it with a permission prompt. The browser's answer is announced in a status line; a grant removes the button, so focus moves to that line.
- **A private window is not detected.** No API reports one, and the heuristics change between browser versions; a guess shown as a fact would break rule 5. The texts say what a private window does to the data instead, and the candidate knows whether they are in one.

### 3.11b Taking the exam `/sinav-sureci`

F4-07, the gap the market research found: nobody explains, in Turkish, what happens between deciding to sit the exam and holding the certificate. One page, linked from the footer on every width.

- **Only what TTB or ISTQB states**, read on one date (docs/03 §9) and shown with that date in the intro. Each section ends with links to the pages it rests on, in the interface language where TTB has one. The intro carries the reading date and the sale price repeats it, because the shop's price changes.
- **Sections:** registration and payment · the online proctored exam (equipment, ID, what is forbidden) · the paper · result and certificate · retake, postpone, cancel · CT-AI (TTB still examines v1.0 until 21 October 2027, while this site teaches v2.0) · what could not be confirmed, with the address to ask instead of a guess.
- **Where ISTQB and TTB differ** (retake limit, extra time), the page states TTB's rule, because it is the one a candidate in Turkey meets, and quotes ISTQB beside it.

### 3.10 Lesson card (inside `/calisma/lo/:loCode`)

A short explanation of one learning objective, written from scratch: a title, a few plain-text paragraphs, **key points**, and **common mistakes**, closing with the same citation chips the rationale panel uses.

Content lands objective by objective (Track C), so `lesson` is nullable throughout: an objective with no card yet still has questions, still records mastery, and still belongs in the chapter list. A missing card renders **a short honest placeholder, not an error**.

Paragraphs are plain text, not Markdown — the project ships no Markdown renderer and this feature does not justify adding one.

**Glossary terms (F2-11).** The first time a card names an ISTQB Glossary term — in its paragraphs, key points or common mistakes — the words become a button with a dotted underline (`GlossaryTerm`). Pressing it opens the glossary's own English definition in place, right after the term, with "Source: ISTQB Glossary · CC BY 4.0" linking the term's page and the licence, as CC BY 4.0 asks. Escape closes it and returns focus to the term.

- **A disclosure, not a hover tooltip.** A tooltip cannot be opened on a touch screen, and one that stays open, can be hovered and can be dismissed (WCAG 1.4.13) is the kind of component the project would take from a library. A button that opens the text in place needs none of that, and a screen reader reads the definition next.
- **Only the first occurrence** of each term on the card is marked, so the card still reads as prose. `test`, `testing`, `tester`, `failed` and `passed` are never marked: every card uses them and their definitions explain nothing.
- **Matching** (`features/glossary/markTerms.ts`) is case-insensitive on the term as written: the glossary's English, or the Turkish from `terms.json`. English takes a plural `s`/`es`; Turkish takes any suffix, except on a verbal noun in `-ma`/`-me`: a one-word one (`sağlama`) is matched only as written, because `sağlamak`, `sağlaması` and `sağlamaya` are nearly always the verb "to ensure", and a longer one refuses only the infinitive (`gözden geçirmek`). Consonant softening is not undone, so such an occurrence stays plain. A hyphen is part of a word, and the longer of two terms starting at one place wins.
- **There is no Turkish definition.** A Turkish card marks the Turkish term and opens the English definition, saying it is the glossary's English definition and a Turkish definition has no verified source yet (docs/04 §3.10).
- **Only the chunks the card needs are fetched**; the glossary index is fetched beside the lesson. If the glossary fails to load, the card is shown unmarked rather than the screen failing.
- Not in sessions: in a test, a definition one press away would be a hint, and an unpriced one, unlike the hint ladder's (§3.6).

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

**After answering (practice/study/review)**: the selected option and the correct option are marked — colour, an icon **and** a word, all three (WCAG 1.4.1) — and a `RationalePanel` opens below it with a summary, a "why" line for every option, and citation chips. Beside the chips sit two links about the question: **Discuss** (F4-06), which opens the repository's GitHub Discussions searched for the question's id — shown only while `DISCUSSIONS_ENABLED` (`src/lib/product.ts`) says the repository has them, so it is never a 404 — and **Report a problem** (F2-08), a pre-filled issue. Both are links, not embeds — nothing reaches GitHub until the candidate follows one (rule 7) — and both appear only once the key is shown, because a thread about a question discusses its answer.

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
| The answer is revealed | The rationale panel | `Correct answer! Why?` / `Incorrect answer. Why?` / `Answer shown. Why?` (F3-09) — the verdict is part of the panel's accessible name |
| A hint step (nudge, hint) | The block that step added | Its text: the objective, or the hint |
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

In a session `RationalePanel` is rendered without a `headingLevel` (`SessionRunner.tsx`, and `Repetition.tsx` the same way) and its default is `2` (`RationalePanel.tsx:70`, `:81`), so `Why?` is a sibling of the stem, not a child of it. The review pass passes `3` explicitly (`Review.tsx:166`, `:173`).

A 40-question review pass is **40 nested groups of three**, not 120 flat sibling headings. `RationalePanel`'s `Why?` title is a real heading rather than an `aria-label`, because focus lands on the panel the moment an answer is revealed, and a named region with nothing inside it announces only its own name.

### 4.4 `SubmitConfirm`

One `alertdialog` shared by every mode that can end a session by hand. Submitting writes `status: "submitted"`, after which the shell bounces the route to the result screen and there is no way back in — so the click is confirmed whether or not the session was timed. The copy is passed in: an exam and a practice session end differently and must say so. Only the cancel label is owned by the component, because standing down is the same act in every mode.

---

## 5. Keyboard shortcuts

Owned in one place — the shared session shell's key handler (§4.2) — apart from `1`–`9` on `/tekrar` (§3.8), which has its own handler and no overlay. Every one of them also has a visible control. The overlay opened with `?` documents the fast path; it never owns the only path.

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

**Not built:** `Enter`/`Space` as "answer / next" (native activation only) and `R` to toggle the rationale (it is never collapsed). **Deliberately absent:** grading keys on `/tekrar` — `1`–`9` select an option before the reveal, and the same digit would rate the card a moment later.

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
| Network error (chunk failed to load) | "Something went wrong" + retry. Offline (F3-07), a screen whose content was loaded once online opens from the cache. One never visited says so instead (F3-13, `ErrorNotice`): "Not available offline yet" — the content was never opened on this device online — and it retries by itself when the browser reports the network back. Only screens that load content and offer a retry get this wording; a session or result that fails offline keeps the generic one, because an attempt that does not exist or storage that does not open is not the network's fault. The heading sits in a polite live region, so the change is heard. `navigator.onLine` explains a failure; it never skips a request |
| Answers cannot be written to IndexedDB | A banner inside the session: progress is not reaching disk and a reload will lose it |
| IndexedDB does not open at all (F3-12) | An alert at the top of the main area on every screen, sessions included: nothing is being saved and the app cannot run without it; allow site data or use a normal window. It links to `/verilerim`, which explains why, except on `/verilerim` itself |
| Attempt opened at another mode's URL | Redirected to the address `routeForAttempt` derives from the stored attempt |
| Data version changed | Silent update. A repetition card whose question was revised comes due again (F3-11); no separate notice |
| Attempt left unfinished | A banner at the top of the home page: "You have an unfinished session — 12/40 answered — [Continue] [Discard]" |

---

## 8. Accessibility checklist

`yarn e2e` runs `@axe-core/playwright` over every main route in both themes, plus the specs for the failures axe cannot see — focus destinations, accessible names, live-region behaviour. Items below that axe cannot check are the ones those specs cover.

- [x] Every interactive element is reachable with `Tab`, focus ring visible
- [x] Option groups use `role="radiogroup"` / `role="group"` + `aria-labelledby` naming the stem **and** the select-count instruction
- [x] Correct/incorrect: color + icon + text (all three together) — on the option rows and on the objective state badge
- [x] Contrast ≥ 4.5:1 (text), ≥ 3:1 (UI component) — in both themes
- [x] Modal/sheet has a focus trap and closes with `Esc`; shortcuts stand down while one is open
- [x] Every screen change that is not a page load moves focus and says where: next question → the stem heading; reveal → the rationale panel, named after the verdict; hint ladder step → the block it added (F3-09); study finish → the result heading; `/sonuc` and `/inceleme` → their own `<h1>` on arrival. `useArrivalFocus` gates that on the navigation type, so a cold open, a reload and the Back button all stay silent — a page load has nothing to announce, and moving focus to the `tabIndex={-1}` heading there would leave the skip link behind a Shift+Tab. Back is the accepted cost of that: `location.key` would have told arrival from Back but not from a reload, because the browser restores `history.state`
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

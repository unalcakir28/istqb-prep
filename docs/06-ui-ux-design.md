# 06 — UI / UX Design

**Version:** 1.0 · **Date:** 19.09.2026

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

### 3.1 Home page `/`

```
┌──────────────────────────────────────────────────────────────┐
│  ISTQB-PREP            [CTFL v4.0.1 ▾] [TR|EN] [🌙] [≡]       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Prepare for the ISTQB Foundation Level exam                 │
│  40 questions · 60 minutes · pass mark 26/40                 │
│                                                              │
│   ┌──────────────────────────┐  ┌──────────────────────────┐ │
│   │ ▶ Mock Exam              │  │ ✎ Practice               │ │
│   │ Full simulation with     │  │ Pick a chapter, untimed, │ │
│   │ real exam rules.         │  │ instant feedback.        │ │
│   └──────────────────────────┘  └──────────────────────────┘ │
│   ┌──────────────────────────┐  ┌──────────────────────────┐ │
│   │ ↻ Review (12 due)        │  │ 📖 Glossary               │ │
│   └──────────────────────────┘  └──────────────────────────┘ │
│                                                              │
│  ── Your Status ────────────────────────────                 │
│  Last attempt: 28/40 PASSED        🔥 4-day streak            │
│  [████████████████░░░░] 70% · pass mark 65%                  │
│  Weakest: FL-4.2.3 · FL-5.1.4 · FL-2.1.5  [Practice →]       │
│                                                              │
│  312 questions · 64/64 learning objectives covered · v4.0.1  │
└──────────────────────────────────────────────────────────────┘
```

**Critical decision:** a first-time user (Zeynep, P2) sees a **"Where should I start?"** card instead of the "Your Status" block, and the primary action is **Practice, not Mock Exam**. Scoring 12/40 on the first try loses the user.

### 3.2 Exam setup `/exam/setup`

- Duration: `60 min (standard)` · **`75 min (non-native English speaker)`** — in the Turkish interface, **75 comes pre-selected by default**
- Content language: `Turkish` / `English` / `Side by side`
- Question source: `Mixed (recommended)` · `Ones I haven't seen before` · `Ones I got wrong`
- Shuffle options: on/off
- A **live distribution preview** on the right: how many questions per chapter (8/6/4/11/9/2)
- If the pool is insufficient, a warning **right here**: *"Chapter 4 has 9 questions instead of 11. The exam will be generated with 38 questions."*

### 3.3 Exam session `/exam/:id`

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
- **Zero feedback during the exam.** Correct/incorrect is never shown.

### 3.4 Result screen `/exam/:id/result`

```
┌──────────────────────────────────────────────────────────────────────┐
│                      28 / 40                                         │
│                      ✔ PASSED                                        │
│  [██████████████████████│░░░░░░░░░░░]                                │
│   0                    26 (pass)                 40                  │
│                                                                      │
│  Time: 48:32 / 75:00   ·   Average 1:12 / question                   │
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

- The pass line is **always** drawn — whether the user passed or failed.
- Behind the chapter bars, **the real exam weight is shown as a ghost target** (the AWS Skill Builder pattern).
- If the user failed, the top block isn't accusatory: *"4 points short of 26. Focus on the 3 weakest objectives."*
- In Phase 3, a **readiness estimate**: *"2 of your last 3 timed attempts passed the bar — you can schedule the exam."*

### 3.5 Review pass `/exam/:id/review`

For every question:
1. The question text
2. **Your answer** (red + ✕ icon if wrong) and **the correct answer** (green + ✓)
3. **Summary rationale**
4. **A "why" line for every option** — this is our main differentiator, never hidden, open by default
5. Citation chips: `FL-4.2.1` · `§4.2.1` · `K3` · `v4.0.1`
6. `[Add to review deck]` · `[Report an error in this question]`

### 3.6 Practice mode `/practice`

- Chapter / LO / tag selection, then a **fixed 10-question session** (the Duolingo pattern — give it a visible end)
- Instant feedback: the rationale opens inline as soon as you answer (not a modal)
- **A missed question is re-queued to the end of the same session**
- Progressive hints: `Show hint` → `More` → `Show solution`
- A small summary at the end of the session + "10 more from the same topic"

### 3.7 Review (SRS) `/review`

- **The number of cards due today** on the home screen
- Card flow: question → answer → rationale → **Again / Hard / Good / Easy**
- **The next interval** shown above each button (`Good → 4d`) — to build trust in the algorithm
- Two questions from the same LO never appear back to back
- Forecast chart: the load for the next 7 days

### 3.8 Glossary `/glossary`

- Search (TR and EN at once), letter filter, chapter filter
- Term card: **EN term + TR term side by side**, definition, syllabus usage, source link
- ⚠️ The source of the Turkish definition is stated on every card (TTB syllabus / TTB glossary v3.7 / editorial translation)
- `Practice questions on this term →`

### 3.9 Syllabus explorer `/syllabus`

A tree view of the 64 learning objectives. Each LO row: code · K-level · TR/EN text · **your accuracy rate** · question count · `[Study]`.
The LeetCode problem-list pattern — filterable, sortable, with a status column.

---

## 4. Component spec — `QuestionCard`

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

**Side-by-side mode (`sideBySide`)**: two columns (TR | EN) on wide screens, stacked on narrow screens, with a thin divider between them. Option selection is tied to a single logical option — the two columns are the same radio group.

**After answering (practice/review)**: the selected option and the correct option are marked; a `RationalePanel` opens below it — a summary plus a "why" line for every option, plus citation chips.

---

## 5. Keyboard shortcuts

| Key | Action |
|---|---|
| `1` – `9` | Select option (toggle in multi) |
| `Enter` / `Space` | Answer / next |
| `→` / `←` | Next / previous question |
| `F` | Flag |
| `L` | Switch language (TR ↔ EN) |
| `N` | Open the question navigator |
| `T` | Hide/show the timer |
| `R` | Open/close the rationale (practice/review only) |
| `1`–`4` (SRS) | Again / Hard / Good / Easy |
| `?` | Shortcut help |
| `Esc` | Close panel/modal |

The overlay opened with `?` shows itself once automatically on the first visit, and never again after that.

---

## 6. Motion and feedback

- Transitions 150–200 ms, `ease-out`. Animation in the exam flow is **kept to a minimum** — perceived speed beats polish.
- A short, quiet acknowledgment on a correct answer (scale 1.0 → 1.02). No confetti.
- **No shake/wobble** on a wrong answer — it feels punitive.
- `prefers-reduced-motion: reduce` → all transitions turn off.
- No sound (by default). Not even a library gets added for it.

---

## 7. Empty and error states

| State | What's shown |
|---|---|
| No attempt made yet | A "Where should I start?" card + a 3-step suggestion (Practice → Mock exam → Weak objectives) |
| No question for an LO | In the syllabus explorer, a "No question for this objective yet — contribute one" link |
| Exam pool insufficient | An **explicit warning** on the setup screen, plus how many questions will be generated. Silently generating a short exam is forbidden. |
| Network error (chunk failed to load) | "Couldn't load questions" + retry; if offline, a suggestion to continue with the cached chunks |
| Data version changed | Silent update; an SRS card notice only if a specific question actually changed |
| Attempt left unfinished | A banner at the top of the home page: "You have an attempt with 47:12 remaining — [Continue] [Delete]" |

---

## 8. Accessibility checklist

- [ ] Every interactive element is reachable with `Tab`, focus ring visible
- [ ] Option groups use `role="radiogroup"` / `role="group"` + `aria-labelledby`
- [ ] The timer is `aria-live="polite"`, announces **once a minute**
- [ ] Correct/incorrect: color + icon + text (all three together)
- [ ] Contrast ≥ 4.5:1 (text), ≥ 3:1 (UI component) — in both themes
- [ ] Media components render as a real `<table>` (not an image)
- [ ] A text alternative (transition list) is always available for the `state-transition` diagram
- [ ] Modal/sheet has a focus trap and closes with `Esc`
- [ ] Page title updates on route change
- [ ] `lang` attribute is set by content language (`lang="tr"` / `lang="en"`) — each column separately in side-by-side mode
- [ ] `prefers-reduced-motion` is supported
- [ ] No horizontal scroll at 200% zoom

---

## 9. Brand and tone

- **Tone:** Calm, technical, no forced cheerfulness. Few exclamation marks. Emoji only in place of an icon (🔥 streak, ⚑ flag).
- **Turkish language:** Informal second person, "sen" register ("Çözdün", "Zayıf olduğun hedefler"). Official ISTQB terms in the form the TTB syllabus uses, with the English in parentheses on first mention.
- **To avoid:** "Harika!", "Muhteşem!", gamification language, false urgency, claims in the style of "99% pass guarantee."
- **Logo/name:** **ISTQB-PREP** (D-01). A wordmark is enough; no illustration needed. The ISTQB logo, colors, or typography are **never used** — since the name is already close to the brand, the visual identity needs to be clearly distinct from ISTQB.

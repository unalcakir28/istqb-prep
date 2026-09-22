# Three Modes — Study / Practice / Exam

**Status:** Approved · **Date:** 21.09.2026
**Scope:** Track B of a four-track programme (see §1.2). This spec covers the mode
architecture and the Study-mode skeleton. It does **not** cover official-question
ingestion, lesson content authoring, or the 240 new original questions.

---

## 1. Context

### 1.1 Problem

The app currently has exactly one way to answer questions: a timed, 40-question
mock exam generated from the official blueprint, with all feedback withheld until
submission. Three needs are unserved:

1. A learner meeting a topic for the first time has nowhere to read about it, and
   scoring 12/40 on a cold mock exam is the documented failure mode for persona P2
   (`docs/02-product-requirements.md:20`).
2. There is no untimed way to work through questions with the rationale visible at
   the moment of answering — the product's main differentiator (`rationale.byOption`)
   is only reachable after a full exam is submitted.
3. The exam simulation itself is fine and must not regress.

### 1.2 Track decomposition

The originating request bundles four independent pieces. They are sequenced, not
merged:

| Track | Content | Blocked by |
| ----- | ------- | ---------- |
| **A** | Official-question ingestion: `origin` union, schema change, source badge, import of the official sample exams | Source documents not yet supplied |
| **B** | **Three modes — this spec** | Nothing |
| **C** | Lesson content for 64 learning objectives | B's lesson schema |
| **D** | 240 additional original questions, each verified with evidence | Nothing (runs in parallel) |

B is specified first because A's storage shape (a source filter on a session) and
C's delivery surface (the Study-mode LO screen) are both determined by B's data
model.

### 1.3 Reopened decision

`docs/09-roadmap.md:147` lists *"Video / long-form text lessons"* under
**Deliberately deferred**, with the rationale *"Market is saturated… Our wedge is
practice."*

That entry is narrowed, not deleted. What this spec introduces is not a standalone
course: it is a short, per-objective explanatory card bound to the questions for
that same objective. The saturation argument applies to long-form lessons competing
with existing video courses; it does not apply to inline objective-level
explanation, which is an extension of the rationale differentiator the product
already leads with. The roadmap entry is amended accordingly (§8).

---

## 2. Mode taxonomy

One session engine. Mode is a field on the attempt, and every behavioural
difference is derived from data stored on that attempt — never from a lookup keyed
by mode name. A resumed attempt therefore keeps the rules it started with, even if
mode defaults change in a later release.

```ts
type AttemptMode = "study" | "practice" | "exam";
```

| Mode | Timed | Instant feedback | Question selection |
| ---- | ----- | ---------------- | ------------------ |
| `study` | No | Always on | One objective at a time |
| `practice` | No | User's choice at setup | Configurable scope |
| `exam` | Yes | Never | Official blueprint, 40 questions |

### 2.1 Routes

| Path | Screen | Notes |
| ---- | ------ | ----- |
| `/calisma` | Chapter list with mastery summary | New |
| `/calisma/:chapter` | Objectives in that chapter, each with mastery state | New |
| `/calisma/lo/:loCode` | Lesson card + "test this objective" | New |
| `/calisma/lo/:loCode/:attemptId` | Objective test session | New |
| `/alistirma` | Setup: scope, question count, feedback toggle | New |
| `/alistirma/:attemptId` | Practice session | New |
| `/sinav` | Exam setup (the existing `ExamSetup`) | Moved from `/deneme` |
| `/sinav/:attemptId` | Exam session (the existing `ExamSession`) | Moved from `/deneme/:attemptId` |
| `/sonuc/:attemptId` | Result | Shared by all three modes |
| `/inceleme/:attemptId` | Review | Shared by all three modes |
| `/kaynaklar` | Sources | Unchanged |

`/deneme` and `/deneme/:attemptId` redirect permanently to their `/sinav`
equivalents, preserving `:attemptId`. Users have bookmarked exam URLs and
in-progress attempts addressed by the old paths; breaking them is not acceptable.

Naming rationale: `deneme` currently addresses the timed mock exam, and in Turkish
"deneme sınavı" already means a timed simulation. Reusing that word for the untimed
mode would make the two modes indistinguishable in the UI. The three words
`Çalışma` / `Alıştırma` / `Sınav` are mutually unambiguous.

---

## 3. Data model

### 3.1 Dexie v2 → v3

The `attempts` table gains four fields:

```ts
mode: AttemptMode;          // indexed
deadlineAt: number | null;  // null means untimed
instantFeedback: boolean;   // chosen at setup, frozen onto the attempt
scope: AttemptScope;
```

`deadlineAt` becomes nullable rather than adding a separate `timed: boolean`. A
single source of truth cannot contradict itself; two fields can.

Index declaration:

```
attempts: "id, certId, status, mode, startedAt, [certId+status], [certId+mode+status]"
```

```ts
type AttemptScope =
  | { kind: "blueprint" }
  | { kind: "chapter"; chapters: number[]; count: number }
  | { kind: "objective"; objectives: string[]; count: number };
```

Study-mode attempts always use `{ kind: "objective", objectives: [loCode], count }`,
where `count` is every published question for that objective, capped at 10. The cap
keeps the session finite once Tracks A and D deepen the pool; the objective test is
a check, not an exhaustive drill. If fewer than 3 questions exist the session still
runs, and the shortfall is shown before it starts.

**Migration.** The v3 upgrade hook backfills every existing attempt with
`mode: "exam"`, `instantFeedback: false`, `scope: { kind: "blueprint" }`, and
leaves `deadlineAt` untouched. An attempt left `in-progress` under v2 must still
resume correctly under v3; this is covered by a unit test with a v2-shaped fixture,
not by inspection.

### 3.2 `responses`

One field added:

```ts
revealedAt?: number;
```

Once a response has been revealed, its options lock. Seeing the rationale and then
changing the answer would corrupt both the session score and the mastery signal.

### 3.3 New table `objectiveProgress`

```ts
{
  key: string;              // `${certId}:${objectiveCode}`
  certId: string;
  objectiveCode: string;
  cardReadAt?: number;
  attemptCount: number;
  lastScorePercent: number;
  mastered: boolean;
  updatedAt: number;
}
```

Index: `"key, certId, objectiveCode, mastered"`.

**Mastery rule:** an objective is `mastered` when `attemptCount` is at least 3
questions answered for that objective across all sessions **and**
`lastScorePercent` from the most recent objective test is ≥ 80. Both conditions are
evaluated on every objective-test submission, so mastery can also be lost.

### 3.4 Deliberately excluded

`sourceFilter` (all / official / original) is **not** added in this migration. The
`origin` field is currently the literal `"original"` (`src/types/content.ts:167`),
so the filter would have nothing to discriminate on. It arrives with Track A as
Dexie v4, together with the `origin` union and the schema change that makes it
meaningful.

### 3.5 Documentation drift to repair

`docs/04-data-model.md` §4 describes an IndexedDB schema that the code has diverged
from in 16 places — among them `answers` and `flagged` having moved from `attempts`
into `responses`, `score` having become `points`, `finishedAt` having become
`submittedAt`, and `settings` having become a generic key–value table. That section
is rewritten against the implemented schema as part of this work, then extended
with the v3 additions above.

---

## 4. Question selection

`generateExam` is not modified. Its blueprint distribution is verified across 50
independent seeds (`F1-05b`); generalising it would put that guarantee at risk for
no gain.

A sibling dispatcher is added:

```ts
selectQuestions(scope, pool, seed, exclude): {
  seed: number;
  questionIds: string[];
  shortfalls: GroupShortfall[];
}
```

- `kind: "blueprint"` delegates to the existing `generateExam` unchanged.
- `kind: "chapter"` and `kind: "objective"` go to a new `selectByScope`, which
  filters the pool to published questions matching the scope and the active
  `syllabusVersion`, applies the existing selection weighting, and takes `count`
  questions.

All three branches return the same shape, so the session engine has one contract.

Shortfalls are never silent. If the pool cannot satisfy the request, the session is
still created and the user is told exactly what is missing — inviolable rule 8.

---

## 5. Study mode and the `lessons` content type

### 5.1 Storage

Same manifest → index → chunk pattern as questions:

```
data/ctfl-v4.0.1/lessons/
  index.json        # objective code -> chunk
  ch01.json … ch06.json
```

### 5.2 Lesson record

```json
{
  "objective": "FL-1.4.3",
  "syllabusVersion": "4.0.1",
  "syllabusRef": "§1.4.3",
  "revision": 1,
  "status": "draft",
  "origin": "original",
  "i18n": {
    "tr": {
      "title": "...",
      "paragraphs": ["..."],
      "keyPoints": ["..."],
      "commonMistakes": ["..."]
    },
    "en": {
      "title": "...",
      "paragraphs": ["..."],
      "keyPoints": ["..."],
      "commonMistakes": ["..."]
    }
  },
  "meta": {
    "author": "",
    "reviewedBy": "",
    "createdAt": "",
    "updatedAt": ""
  }
}
```

`paragraphs` is an array of plain strings, not Markdown. The project has no
Markdown renderer, and adding one is a new dependency that this feature does not
justify. The structured shape is sufficient for the card layout and keeps the
content translatable field by field.

The same content rules as questions apply: both `tr` and `en` are required
(inviolable rule 3), `syllabusVersion` is required and surfaces as a badge
(rule 4), and `status: "published"` requires a non-empty `meta.reviewedBy`.

### 5.3 Degradation

Track B ships with zero lesson content and is still usable. An objective with no
published lesson renders a placeholder in the card area; the "test this objective"
action remains available. Track C fills the content in afterwards without further
code changes.

### 5.4 Validator

Four checks are added as errors:

- A lesson's `objective` exists in `objectives.json`.
- `i18n.tr` and `i18n.en` are both present and structurally parallel.
- `status: "published"` implies `meta.reviewedBy` is non-empty.
- `lessons/index.json` agrees with the chunk files.

One check is added as a warning: an objective has no published lesson.

This takes the validator from 15 numbered checks to 19. `CLAUDE.md` and
`docs/04-data-model.md` §6 both state the old count and are updated.

---

## 6. Session engine

### 6.1 Extraction

`src/routes/ExamSession.tsx` is currently 17.9 KB and owns question rendering,
navigation, answer persistence, the navigator panel, and keyboard shortcuts.
Layering three modes onto it directly would make it substantially worse.

The shared shell moves to `src/features/session/SessionRunner.tsx`. It reads its
behaviour from the attempt (`deadlineAt`, `instantFeedback`) rather than from a
mode string. The three route components become thin wrappers; `ExamSession` retains
only what is exam-specific — mounting the timer and the submit confirmation.

This is a targeted refactor in service of the feature, not general cleanup.

### 6.2 Prop rename

`QuestionCard` and `OptionList` take a `review` prop that gates whether
`question.correct` is passed down (`src/components/QuestionCard.tsx:76`). It is
renamed to `revealed`. "Review" is now a screen name, and the prop no longer means
that. Two call sites change.

`RationalePanel` is reused unchanged; its props (`question`, `lang`, `selected`)
already cover the instant-feedback case.

### 6.3 Instant-feedback flow

1. An option is selected and written to the store and IndexedDB.
2. If `instantFeedback` is on **and** the selection is complete — one option for
   `single`, `selectCount` options for `multi` — `revealedAt` is written.
3. Options lock; the selected and correct options are marked.
4. `RationalePanel` opens inline below the options. Not a modal
   (`docs/06-ui-ux-design.md:187`).
5. An `aria-live="polite"` region announces correct or incorrect.

---

## 7. Edge cases

| Condition | Behaviour |
| --------- | --------- |
| `deadlineAt` is `null` | `ExamTimer` is never mounted and `remainingMs` is never called; a guard enforces this |
| Attempt opened from the wrong mode's route | `attempt.mode` resolves the correct route; e.g. a `practice` attempt opened at `/sinav/:id` redirects to `/alistirma/:id` |
| `multi` question with instant feedback | Nothing is revealed until `selectCount` options are selected |
| Objective has no published questions | The test action is disabled and states why |
| Objective has no published lesson | Placeholder card; the test action still works |
| Pool cannot fill the requested scope | Shortfalls shown explicitly before the session starts |
| Setup submitted with an empty scope | Blocked at validation, with the reason shown |

---

## 8. Documentation updates

Audited with the `doc-drift-auditor` agent before the work is considered done:

- `docs/04-data-model.md` — §4 rewritten against the implemented schema, then
  extended with v3; §6 check count 15 → 19; the `lessons` type documented.
- `docs/06-ui-ux-design.md` — mode inventory, the three new screen groups, the
  route rename.
- `CLAUDE.md` — routes, folder structure, validator check count, the commands table
  if it changes.
- `docs/09-roadmap.md` — the **Deliberately deferred** entry amended per §1.3.
- `TODO.md` — Phase 2 items reconciled with what this spec actually delivers
  (F2-01 is superseded by the configurable-scope practice mode; F2-03's syllabus
  explorer is absorbed into `/calisma`).

---

## 9. Testing

### 9.1 Unit (Vitest)

- `selectByScope`: chapter scope, objective scope, shortfall reporting, and seed
  reproducibility.
- Dexie v2 → v3 migration, driven by a v2-shaped fixture: fields are backfilled and
  an `in-progress` attempt still resumes.
- Mastery rule at and around its thresholds.
- The null-`deadlineAt` guard.

The existing 50-seed `generateExam` distribution test is left untouched. It is the
regression proof that the blueprint path did not move.

### 9.2 End-to-end (Playwright)

Browser locale stays `en-US`; labels come from `e2e/labels.ts`, never retyped.

- Study loop: chapter → objective → test → mastery updates.
- Practice with instant feedback on: the rationale appears on answer and the
  options lock.
- Practice with instant feedback off: nothing is revealed until submission.
- `/deneme` and `/deneme/:attemptId` redirect correctly.
- `e2e/exam.spec.ts` passes unchanged.

### 9.3 Accessibility

`@axe-core/playwright` over `/calisma`, `/calisma/:chapter`, `/calisma/lo/:loCode`
and `/alistirma`, in both themes.

Then the `a11y-reviewer` agent for what axe cannot see: where focus lands when the
rationale opens, whether the announcement is actually read, and the radio versus
checkbox distinction on multi-select questions.

### 9.4 Gate

`lint → format → typecheck → test → validate:data → validate:i18n → build → e2e`,
all green, before the work is called done.

---

## 10. Out of scope

- Ingesting official questions, and the `origin` union that would support them
  (Track A).
- Writing the 64 lesson cards (Track C).
- Writing 240 additional questions (Track D).
- Spaced repetition, the glossary, and the progress screen — they stay where the
  roadmap has them.

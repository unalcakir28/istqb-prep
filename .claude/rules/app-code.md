---
paths:
  - "src/**"
---

# App code (`src/`)

## Where things live

```
features/session/  The three modes' shared machinery — SessionRunner (one shell
                   for study/practice/exam: load-and-resume, question card,
                   navigator, keyboard, announcements), sessionStore (Zustand,
                   was examStore), routeForAttempt (an attempt's own URL)
features/exam/     Selection and scoring — selectQuestions (one entry point,
                   four scopes: blueprint / chapter / objective / questions,
                   the last being an explicit id list), generateExam
                   (blueprint-driven, seeded, reproducible), scoreExam (exact
                   match, NO partial credit), examTimer (absolute Date.now()
                   deadline), rng
lib/content/       Static JSON access + a two-tier cache (Map + Cache API),
                   invalidated via dataVersion. Questions AND lessons.
lib/db/            Dexie/IndexedDB — the single place for persistence. db.ts
                   (schema v3), migrations.ts (the v3 backfill, extracted so it
                   is unit-testable), objectiveProgress.ts (study mastery),
                   questionHistory.ts (the saved lists, derived from the
                   answers already stored — nothing new is persisted)
lib/i18n/          UI language; question language is a separate concept (attempt.contentLang)
lib/bilingual.ts   TR+EN side by side — a display preference in localStorage,
                   deliberately NOT on the attempt: "both" is not a language
routes/            Screens · components/ shared UI · types/content.ts data types
```

## Routes

`src/App.tsx` is the source of truth. The paths are Turkish, like the rest of the
user-facing surface:

```
/                              Home — three mode cards, resume banner
/calisma                       Study: chapters
/calisma/:chapter              Study: that chapter's objectives
/calisma/lo/:loCode            Study: one objective — lesson card + start test
/calisma/lo/:loCode/:attemptId Study: the objective test AND its result, same route
/alistirma  ·  /alistirma/:attemptId   Practice setup · session
/sinav      ·  /sinav/:attemptId       Exam setup · session
/sonuc/:attemptId              Result   — exam and practice; study keeps its result in its own route
/inceleme/:attemptId           Review   — reached from the result screen
/listelerim                    My lists — wrong · flagged · never right twice in a row
/sozluk                        Glossary — 97 bilingual terms, no definitions (see F2-11)
/kaynaklar                     Sources
/deneme  ·  /deneme/:attemptId Legacy redirect to /sinav — old bookmarks keep working
```

## Behaviour that surprises

- **IndexedDB has no boolean key type.** `objectiveProgress.mastered` is in the
  index string, but `db.objectiveProgress.where({ mastered: true })` matches
  nothing — Dexie silently returns an empty set rather than erroring. Filter in
  memory; there are 64 rows at most (`Home.tsx` `loadProgress`).
- **An unfinished attempt resumes from the first unanswered question**, not from
  where you left off (`sessionStore.resumeAttempt`).
- **An attempt has exactly one legal URL, and `routeForAttempt` decides it** from
  the stored `mode` and `scope`. `SessionRunner` redirects anything that arrives
  anywhere else.
- **Instant feedback locks the answer.** Once `revealedAt` is set,
  `sessionStore.select` refuses that question. Study mode always has it on.
- **`shuffle` is applied to the question order and to nothing else.** Options
  render in authored order (`generateExam`, `selectQuestions`). Shuffling options
  per attempt is D-03 in `TODO.md`.

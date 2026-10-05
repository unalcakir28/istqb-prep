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
                   deadline), rng, optionOrder (per-attempt option shuffle),
                   points (what a question of each K-level is worth, read
                   from the blueprint's groups)
features/srs/      Spaced repetition — scheduler (the only ts-fsrs import:
                   card <-> row, grading, the interval preview, the rule
                   for what a wrong answer does to the deck, and reviseCard:
                   a revised question sends a review card back to
                   relearning and brings any other card due, F3-11), interval,
                   queue (what is due; the home count and /tekrar share it;
                   spreadSiblings keeps two cards of one LO apart;
                   forecastDue counts the next days for /tekrar)
features/glossary/ F2-11 — markTerms (which words of a lesson card are ISTQB
                   Glossary terms; first occurrence only), lessonGlossary
                   (the definitions one card needs)
features/progress/ What /ilerleme reads — examPoints, readiness (2 of the last
                   3 timed mock exams), chapterProgress, the forgiving streak
lib/content/       Static JSON access + a two-tier cache (Map + Cache API
                   named per dataVersion). Questions, lessons, glossary.
lib/db/            Dexie/IndexedDB — the single place for persistence. db.ts
                   (schema v3), migrations.ts (the v3 backfill, extracted so it
                   is unit-testable), objectiveProgress.ts (study mastery),
                   questionHistory.ts (the saved lists, derived from the
                   answers already stored — nothing new is persisted),
                   srsCards.ts (the repetition deck; loadRevisedDeck checks
                   it against the index first), backup.ts (the
                   progress file: export, validate, merge-import)
lib/i18n/          UI language; question language is a separate concept (attempt.contentLang)
lib/certification.ts  Which certification the screens show — the home
                   screen's pick, in localStorage (ADR-0006)
lib/registerServiceWorker.ts  Registers build/pwa.ts's sw.js, production
                   builds only (F3-07)
lib/storage.ts     Whether this browser keeps the data: IndexedDB opens,
                   persisted() or not; persist() from a button only. A
                   private window is NOT detected (F3-12)
lib/bilingual.ts   TR+EN side by side — a display preference in localStorage,
                   deliberately NOT on the attempt: "both" is not a language
routes/            Screens · components/ shared UI · types/content.ts data types
```

## Routes

`src/App.tsx` is the source of truth. The paths are Turkish, like the rest of the
user-facing surface:

```
/                              Home — certification picker, three mode cards, resume banner
/calisma                       Study: chapters
/calisma/:chapter              Study: that chapter's objectives
/calisma/lo/:loCode            Study: one objective — lesson card + start test
/calisma/lo/:loCode/:attemptId Study: the objective test AND its result, same route
/alistirma  ·  /alistirma/:attemptId   Practice setup · session
/sinav      ·  /sinav/:attemptId       Exam setup · session
/sonuc/:attemptId              Result   — exam and practice; study keeps its result in its own route
/inceleme/:attemptId           Review   — reached from the result screen
/listelerim                    My lists — wrong · flagged · never right twice in a row
/tekrar                        Repetition — the SRS deck's due cards, one at a time
/ilerleme                      Progress — readiness estimate, streak, mock exams, per chapter
/sozluk                        Glossary — the active certification's terms (97 CTFL · 156 CT-AI), no definitions (those open in lesson cards, F2-11)
/verilerim                     Your data — does this browser keep it (F3-12); download / load a progress file (F3-08)
/sinav-sureci                  Taking the exam in Turkey — TTB registration, proctoring, result, retake (F4-07)
/kaynaklar                     Sources
/deneme  ·  /deneme/:attemptId Legacy redirect to /sinav — old bookmarks keep working
```

## Behaviour that surprises

- **Two certifications, and the routes do not say which.** Screens not tied to
  an attempt read `contentClient.getActiveCertification()` — the home screen's
  pick. Screens tied to an attempt (session, result, review, study result)
  read the attempt's own `certId`, which doubles as the content path (check
  #25 holds them equal), and `resumeAttempt` sets the pick to the attempt's
  certification so links onward stay in it. A new screen that loads content
  must pick one of the two on purpose. `/calisma/lo/:loCode` switches to the objective's
  certification when the code belongs to the other one.
- **A question is worth its own `points`.** CT-AI K3 questions are worth 2;
  never count questions where points are meant (pass mark, totals).

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
- **Options are shuffled per attempt, and the order is derived, never stored.**
  `features/exam/optionOrder.ts` seeds the shuffle from `attempt.seed` + the
  question id; `sessionStore` applies it wherever questions enter the store, so
  resume, result and review show the order the candidate saw. Answers, `correct`,
  `rationale.byOption` and scoring use option ids; only the row number, the 1-9
  shortcut and the rationale panel label follow displayed position. The GitHub
  issue from `ReportQuestionLink` names authored ids.

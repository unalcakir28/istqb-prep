# data/

All content lives here as **indexed, chunked static JSON**.
Structure, schemas, and rules: [`../docs/04-data-model.md`](../docs/04-data-model.md)

```
manifest.json                  Root index — certifications, dataVersion
certifications.json            Exam parameters for all ISTQB certifications (28)  ✅
ctfl-v4.0.1/
  meta.json                    Exam mechanics + official source links           ✅
  syllabus.json                6 chapters, weights, K-level distributions       ✅
  objectives.json              64 learning objectives                           ✅
  exam-blueprint.json          Official LO-group → question distribution, 29 groups → 40 questions ✅
  terms.json                   97 TR/EN terms, the terminology source of truth  ✅
  questions/
    index.json                 Lightweight index (NO question text)  — generated ✅
    ch01-a.json … ch06-a.json  Question chunks, ≤40 each — 120 published         ✅
  lessons/
    index.json                 Lightweight lesson index              — generated ✅
    ch01.json … ch06.json      Lesson chunks, one card per LO    ⚠️ empty (Track C)
  glossary/                    Glossary terms            ⚠️ not created yet (F0-09)
  exams/                       Curated fixed exams       ⚠️ not created yet
```

`index.json` under `questions/` and `lessons/` is built by `yarn build:index`;
never edit either by hand.

## Rules

1. **At most 40 questions per chunk.** Once full, continue with `-b`, `-c`. **The filename never changes** (CDN + PWA cache).
2. **Questions are never deleted.** A removed question gets `status: "retired"`.
3. **Question IDs are never reused.**
4. Every question must include **both TR and EN**; `rationale.byOption` must be filled in **for every option**. CI fails if it isn't.
5. The `origin` field **has no `official` value** — official ISTQB/TTB questions are never copied. See [`../docs/08-legal-and-copyright.md`](../docs/08-legal-and-copyright.md).
6. If `meta.reviewedBy` is empty, `status` **cannot be `published`** — for a question or a lesson.
7. **Lessons live in `<cert>/lessons/`**, one card per learning objective, chunked by chapter. They follow the same origin rule: written from scratch, never adapted from the official text.

## Validation

```bash
yarn validate:data    # JSON Schema (#1) + 19 consistency checks (#2-#20)
yarn build:index      # build questions/index.json and lessons/index.json from the chunks
yarn stats            # per-LO coverage report → docs/coverage.md
```

# data/

All content lives here as **indexed, chunked static JSON**.
Structure, schemas, and rules: [`../docs/04-data-model.md`](../docs/04-data-model.md)

```
manifest.json                  Root index — certifications, dataVersion
certifications.json            Exam parameters for all ISTQB certifications (28)  ✅
ctfl-v4.0.1/
  meta.json                    Exam mechanics + official source links           ✅
  syllabus.json                6 chapters, weights, K-level distributions       ✅
  objectives.json              64 learning objectives                 ⚠️ 3/64 (F0-06)
  exam-blueprint.json          Official LO-group → question distribution ⚠️ partial (F0-05)
  questions/
    index.json                 Lightweight index (NO question text)            ✅
    ch01-a.json                Question chunk, ≤40 questions           ⚠️ 1 sample question
  glossary/                                                          ⚠️ empty (F0-09)
  exams/                       Curated fixed exams                              —
```

## Rules

1. **At most 40 questions per chunk.** Once full, continue with `-b`, `-c`. **The filename never changes** (CDN + PWA cache).
2. **Questions are never deleted.** A removed question gets `status: "retired"`.
3. **Question IDs are never reused.**
4. Every question must include **both TR and EN**; `rationale.byOption` must be filled in **for every option**. CI fails if it isn't.
5. The `origin` field **has no `official` value** — official ISTQB/TTB questions are never copied. See [`../docs/08-legal-and-copyright.md`](../docs/08-legal-and-copyright.md).
6. If `meta.reviewedBy` is empty, `status` **cannot be `published`**.

## Validation

```bash
yarn validate:data    # JSON Schema + 15 consistency checks
yarn build:index      # build questions/index.json from the chunks
yarn stats            # per-LO coverage report → docs/coverage.md
```

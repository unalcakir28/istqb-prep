# 04 — Data Model and Indexing Strategy

**Version:** 1.1 · **Date:** 21.09.2026
**Related ADR:** [`adr/0002-data-layer-static-json.md`](adr/0002-data-layer-static-json.md)

---

## 1. Design principles

1. **No single file.** As the question bank grows, a single JSON file stops being downloadable. Data is split into a **manifest → index → chunk** hierarchy.
2. **Index light, chunk heavy.** The index carries only the fields needed for filtering/selection (no question text). Exam generation works from the index; only the chunks containing the selected questions are downloaded.
3. **Language-independent identifiers.** LO codes like `FL-4.2.1` and question IDs never change in any language. The translation lives inside the `i18n` object — not in a separate file, because a question and its translation are reviewed together.
4. **Multi-certification from day one.** The root directory is split by certification version: `data/ctfl-v4.0.1/`, then `data/ctfl-at-v3.1/`, etc. The application code contains no certification-specific logic.
5. **Version integrity is a required field.** Every question carries the syllabus version it was written for. When a version is retired, those questions are filtered out, not deleted (archive + transparency).
6. **Content is versioned.** `manifest.json` carries a `dataVersion`; the client cache is invalidated with it.

---

## 2. Directory structure

```
data/
├── manifest.json                    # Root index — certifications, versions, data version
├── certifications.json              # Exam parameters for all ISTQB certifications (seed)
│
└── ctfl-v4.0.1/
    ├── meta.json                    # This certification's exam mechanics + source links
    ├── syllabus.json                # Chapters and sub-sections (TR/EN titles)
    ├── objectives.json              # 64 learning objectives (LO) — code, K-level, TR/EN text
    ├── exam-blueprint.json          # Official LO-group → question count distribution
    │
    ├── questions/
    │   ├── index.json               # Lightweight index: metadata for all questions
    │   ├── ch01-a.json              # Chapter 1, chunk a (≤40 questions)
    │   ├── ch01-b.json
    │   ├── ch02-a.json
    │   ├── ...
    │   └── ch06-a.json
    │
    ├── lessons/
    │   ├── index.json               # Lightweight index: one entry per lesson
    │   ├── ch01.json                # Chapter 1's explanation cards
    │   ├── ...
    │   └── ch06.json
    │
    ├── glossary/
    │   ├── index.json               # Term list (slug, tr, en) — for search
    │   ├── terms-a.json             # Definitions, alphabetic chunks
    │   └── ...
    │
    └── exams/
        ├── index.json               # Ready-made (curated) exam definitions
        └── mock-001.json            # Question ID list + order
```

> `terms.json` also sits at the certification root: the Turkish terminology mapping, aligned from the official keyword lists. It is the single source of truth for CI check #13.

### Chunking rule
- **Question chunk:** chapter-based, **at most 40 questions** per chunk (≈ 50–60 KB uncompressed).
- When a chunk fills up, it continues with `-b`, `-c`. **Questions are never removed from an existing chunk**; a removed question gets `status: "retired"`.
- The filename never changes → stable for browser caching and the PWA.

---

## 3. Schemas

JSON Schema files: [`../schemas/`](../schemas/)
In CI, every data file is validated against these schemas.

### 3.1 `manifest.json`

```json
{
  "dataVersion": "2026.09.19",
  "generatedAt": "2026-09-19T12:00:00Z",
  "certifications": [
    {
      "id": "ctfl-v4.0.1",
      "acronym": "CTFL",
      "syllabusVersion": "4.0.1",
      "status": "active",
      "path": "ctfl-v4.0.1",
      "languages": ["tr", "en"],
      "questionCount": 312,
      "coverage": { "objectivesTotal": 64, "objectivesCovered": 64, "minPerObjective": 3 }
    }
  ]
}
```

### 3.2 `meta.json` — exam mechanics

Source: [`03-istqb-reference.md §3`](03-istqb-reference.md)

```json
{
  "id": "ctfl-v4.0.1",
  "name": { "tr": "Sertifikalı Test Uzmanı Temel Seviye", "en": "Certified Tester Foundation Level" },
  "acronym": "CTFL",
  "stream": "core",
  "level": "foundation",
  "syllabusVersion": "4.0.1",
  "syllabusReleaseDate": "2024-09-15",
  "exam": {
    "questionCount": 40,
    "totalPoints": 40,
    "passPoints": 26,
    "passPercent": 65,
    "durationMinutes": 60,
    "pointsPerQuestion": 1,
    "negativeMarking": null,
    "questionKLevelDistribution": { "K1": 8, "K2": 24, "K3": 8 }
  },
  "sources": {
    "syllabusEn": "https://istqb.org/?sdm_process_download=1&download_id=3345",
    "syllabusTr": "https://www.turkishtestingboard.org/files/pdfs/ISTQB_CTFL_Syllabus-v4.0.1.pdf",
    "examRules": "https://istqb.org/?sdm_process_download=1&download_id=3829",
    "examTables": "https://istqb.org/?sdm_process_download=1&download_id=3832",
    "glossaryApi": "https://api.glossary.istqb.org/v1/terms"
  }
}
```

> `negativeMarking: null` is deliberate — writing `false` would mean making an unverified claim. The UI displays this as "not specified in the official documents."

### 3.3 `syllabus.json` — chapters

```json
{
  "chapters": [
    {
      "number": 1,
      "title": { "en": "Fundamentals of Testing", "tr": "Yazılım Testinin Temelleri" },
      "trainingMinutes": 180,
      "objectiveCount": 14,
      "objectiveKDistribution": { "K1": 3, "K2": 11, "K3": 0 },
      "examQuestions": 8,
      "examPoints": 8,
      "examKDistribution": { "K1": 2, "K2": 6, "K3": 0 },
      "sections": [
        { "id": "1.1", "title": { "en": "What is Testing?", "tr": "Test Nedir?" } }
      ]
    }
  ]
}
```

> **Note:** `objectiveKDistribution` (the K-level distribution of the learning objectives) and `examKDistribution` (the K-level distribution of the questions) **are different**, and the two are kept separate. See [`03-istqb-reference.md §2`](03-istqb-reference.md).

### 3.4 `objectives.json` — learning objectives

```json
{
  "objectives": [
    {
      "code": "FL-4.2.1",
      "chapter": 4,
      "section": "4.2",
      "kLevel": "K3",
      "text": {
        "en": "Use equivalence partitioning to derive test cases",
        "tr": "Test senaryoları türetmek için eşdeğerlik bölümlemesini kullanmak"
      },
      "keywords": ["equivalence partitioning", "eşdeğerlik bölümlemesi"]
    }
  ]
}
```

> `code` **is the primary key.** It is confirmed that it stays in English as `FL-x.y.z` in the Turkish syllabus too.

### 3.5 `exam-blueprint.json` — official question distribution

This file enables realistic exam generation that **no competitor on the market does**.

```json
{
  "syllabusVersion": "4.0.1",
  "source": "ISTQB Exam Structures & Rules tables v1.19 (2026-08-19)",
  "rule": "Bir grupta LO'dan çok soru varsa her LO'dan en az BİR soru gelir. Sorudan çok LO varsa her soru FARKLI bir LO'yu kapsar.",
  "groups": [
    { "id": "g1-1", "chapter": 1, "kLevel": "K1", "questions": 1, "objectives": ["FL-1.1.1", "FL-1.2.2"] },
    { "id": "g1-2", "chapter": 1, "kLevel": "K1", "questions": 1, "objectives": ["FL-1.5.2"] },
    { "id": "g1-3", "chapter": 1, "kLevel": "K2", "questions": 1,
      "objectives": ["FL-1.1.2", "FL-1.2.1", "FL-1.2.3", "FL-1.3.1", "FL-1.4.1", "FL-1.4.2"] },
    { "id": "g1-4", "chapter": 1, "kLevel": "K2", "questions": 3, "objectives": ["FL-1.4.3", "FL-1.4.4", "FL-1.4.5"] },
    { "id": "g1-5", "chapter": 1, "kLevel": "K2", "questions": 1, "objectives": ["FL-1.5.1", "FL-1.5.3"] },
    { "id": "g4-k3", "chapter": 4, "kLevel": "K3", "questions": 5,
      "objectives": ["FL-4.2.1", "FL-4.2.2", "FL-4.2.3", "FL-4.2.4", "FL-4.5.3"] },
    { "id": "g5-k3", "chapter": 5, "kLevel": "K3", "questions": 3,
      "objectives": ["FL-5.1.4", "FL-5.1.5", "FL-5.5.1"] },
    { "id": "g6-1", "chapter": 6, "kLevel": "K2", "questions": 1, "objectives": ["FL-6.1.1"] },
    { "id": "g6-2", "chapter": 6, "kLevel": "K1", "questions": 1, "objectives": ["FL-6.2.1"] }
  ]
}
```

> ⚠️ The groups above are **an example**; the full list will be extracted verbatim from the official table (TODO F0-05). The total question count must be 40, the chapter distribution 8/6/4/11/9/2, and the K distribution 8/24/8 — CI verifies this.

### 3.6 `questions/index.json` — lightweight index

**No question text.** Exam generation, filtering, and statistics all work from this file.

```json
{
  "dataVersion": "2026.09.19",
  "count": 312,
  "chunks": ["ch01-a", "ch01-b", "ch02-a", "ch03-a", "ch04-a", "ch04-b", "ch05-a", "ch06-a"],
  "questions": [
    {
      "id": "ctfl4-0001",
      "chunk": "ch01-a",
      "chapter": 1,
      "section": "1.4",
      "objectives": ["FL-1.4.3"],
      "kLevel": "K2",
      "type": "single",
      "selectCount": 1,
      "difficulty": 2,
      "hasMedia": false,
      "tags": ["seven-principles"],
      "languages": ["tr", "en"],
      "syllabusVersion": "4.0.1",
      "status": "published"
    }
  ]
}
```

~200 bytes per field → ~200 KB for 1,000 questions. Acceptable; if it exceeds 2,000 questions, the index gets split by chapter too (`index-ch01.json` …).

### 3.7 Question object — `questions/ch01-a.json`

```json
{
  "chunk": "ch01-a",
  "chapter": 1,
  "dataVersion": "2026.09.19",
  "questions": [
    {
      "id": "ctfl4-0001",
      "revision": 2,
      "syllabusVersion": "4.0.1",
      "chapter": 1,
      "section": "1.4",
      "syllabusRef": "§1.4.3",
      "objectives": ["FL-1.4.3"],
      "kLevel": "K2",
      "type": "single",
      "selectCount": 1,
      "points": 1,
      "difficulty": 2,
      "tags": ["seven-principles", "pesticide-paradox"],
      "origin": "original",
      "status": "published",
      "correct": ["c"],
      "media": null,
      "i18n": {
        "tr": {
          "stem": "Aynı test senaryolarının defalarca tekrar edilmesi zamanla yeni hata bulma kapasitesini yitirir. Bu durumu EN İYİ açıklayan test prensibi hangisidir?",
          "options": [
            { "id": "a", "text": "Test, hataların varlığını gösterir" },
            { "id": "b", "text": "Kusursuz test imkânsızdır" },
            { "id": "c", "text": "Testlerin etkisi zamanla azalır" },
            { "id": "d", "text": "Test, bağlama bağlıdır" }
          ],
          "rationale": {
            "summary": "Testlerin etkisi zamanla azalır (pesticide paradox) prensibi, aynı testlerin tekrarlanmasının yeni kusur bulma oranını düşürdüğünü söyler.",
            "byOption": {
              "a": "Yanlış. Bu prensip, testin kusur bulabileceğini ama yokluğunu kanıtlayamayacağını söyler; tekrarla ilgisi yoktur.",
              "b": "Yanlış. Bu prensip her kombinasyonun test edilemeyeceğini söyler; test etkinliğinin zamanla azalmasını açıklamaz.",
              "c": "Doğru. Aynı testlerin tekrarı yeni kusur bulma kapasitesini düşürür; testler gözden geçirilmeli ve çeşitlendirilmelidir.",
              "d": "Yanlış. Bu prensip test yaklaşımının bağlama göre değiştiğini söyler; tekrar etkisiyle ilgili değildir."
            }
          },
          "hints": ["Prensip, tarım ilacına karşı direnç kazanan böceklere benzetilir."]
        },
        "en": {
          "stem": "Repeating the same test cases over time reduces their ability to find new defects. Which testing principle BEST describes this?",
          "options": [
            { "id": "a", "text": "Testing shows the presence of defects" },
            { "id": "b", "text": "Exhaustive testing is impossible" },
            { "id": "c", "text": "Tests wear out" },
            { "id": "d", "text": "Testing is context dependent" }
          ],
          "rationale": {
            "summary": "The 'tests wear out' principle (pesticide paradox) states that repeating the same tests lowers the rate of finding new defects.",
            "byOption": {
              "a": "Incorrect. This principle states testing can show defects exist but cannot prove their absence; it is unrelated to repetition.",
              "b": "Incorrect. This principle states not every combination can be tested; it does not explain declining effectiveness over time.",
              "c": "Correct. Repeating identical tests reduces new-defect yield; tests must be reviewed and varied.",
              "d": "Incorrect. This principle states the approach depends on context, not on repetition effects."
            }
          },
          "hints": ["The principle is compared to insects becoming resistant to pesticide."]
        }
      },
      "meta": {
        "author": "unal",
        "reviewedBy": "—",
        "createdAt": "2026-09-19",
        "updatedAt": "2026-09-19"
      }
    }
  ]
}
```

#### Field dictionary

| Field | Type | Description |
|---|---|---|
| `id` | string | `ctfl4-NNNN`. Never reused. |
| `revision` | int | Increments every time the content changes. Used to tell, from SRS history, that the question has changed. |
| `syllabusVersion` | string | **Required.** Shown as a badge in the UI. |
| `objectives` | string[] | At least one LO code. If there is more than one, `kLevel` is the **highest** of them (§5.4.2). |
| `kLevel` | `K1`\|`K2`\|`K3` | The cognitive level the question targets. |
| `type` | `single`\|`multi` | `multi` → "HANGİ İKİSİ / Select TWO". |
| `selectCount` | int | How many options to select, for `multi`. |
| `points` | int | **Always 1** in Foundation. Varies in Advanced modules. |
| `difficulty` | 1–3 | Editorial estimate. For graduated difficulty in practice mode. |
| `origin` | `original`\|`adapted`\|`community` | **There is no `official` value** — official questions are never copied. See [`08-legal-and-copyright.md`](08-legal-and-copyright.md). |
| `status` | `draft`\|`review`\|`published`\|`retired` | Only `published` ones are served. |
| `correct` | string[] | Option IDs. Its length must match `selectCount` (CI check). |
| `media` | object\|null | Table / diagram. See §4. |
| `rationale.byOption` | object | **Required for every option.** CI fails if it's missing. |
| `hints` | string[] | Graduated hint. Optional. |

### 3.8 `media` — table and diagram

Critical: the single most common complaint about the cheap tools on the market is "critical diagrams are missing for questions." Diagrams are kept **as structured data, not as image files** → responsive, accessible, works in dark mode, and is translatable.

**Every kind is bilingual at the leaf**, and every kind whose natural form is a diagram **requires an `alt`**. That is not politeness: a K3 question about a state machine is unanswerable without the machine, so a candidate who cannot see a picture would simply be unable to sit the question. `MediaRenderer` renders the alternative in full rather than hiding it behind an attribute or a toggle.

```json
"media": {
  "kind": "decision-table",
  "caption": { "tr": "Karar tablosu", "en": "Decision table" },
  "headers": { "tr": ["Koşul", "K1", "K2", "K3"], "en": ["Condition", "R1", "R2", "R3"] },
  "rows": [
    { "tr": ["Üye mi?", "E", "E", "H"], "en": ["Member?", "Y", "Y", "N"] },
    { "tr": ["Tutar > 500", "E", "H", "-"], "en": ["Amount > 500", "Y", "N", "-"] }
  ]
}
```

```json
"media": {
  "kind": "state-transition",
  "caption": { "tr": "Durum modeli", "en": "State model" },
  "states": ["Taslak", "Onayda", "Yayında"],
  "transitions": [
    { "from": "Taslak", "event": "gönder", "to": "Onayda" },
    { "from": "Onayda", "event": "onayla", "to": "Yayında" }
  ],
  "alt": {
    "tr": "Taslak durumundan gönder olayıyla Onayda'ya, oradan onayla olayıyla Yayında'ya geçilir.",
    "en": "From Taslak, gönder goes to Onayda; from Onayda, onayla goes to Yayında."
  }
}
```

Supported kinds, each its own branch of a `oneOf` with `additionalProperties: false`:

| `kind` | Required beyond `kind` | Rendered as |
| --- | --- | --- |
| `decision-table`, `table` | `caption`, `headers`, `rows` | a real `<table>` with column **and** row headers |
| `state-transition` | `caption`, `states`, `transitions`, `alt` | the transition table it already is, plus the written alternative |
| `control-flow` | `caption`, `language`, `content`, `alt` | a `<pre>`, plus the written alternative — coverage questions turn on which paths exist, and that cannot be inferred from indentation by ear |
| `code` | `caption`, `language`, `content` | a `<pre>` |
| `image` | `caption`, `src`, `alt` | last resort; nothing in the pool uses it |

**No question in the pool carries `media` yet.** The schema and the renderer are in place for the ones that will.

### 3.9 Lessons — `lessons/`

The short explanation card study mode shows above an objective's test. One card per learning objective, chunked by chapter exactly like the questions, and written from scratch against the syllabus — the official text is never reproduced (rule 1 applies to lessons too).

Schemas: [`../schemas/lessons-index.schema.json`](../schemas/lessons-index.schema.json) and [`../schemas/lesson.schema.json`](../schemas/lesson.schema.json). Types: `Lesson`, `LessonContent`, `LessonChunk`, `LessonIndex` in `src/types/content.ts`.

```json
// lessons/index.json — no lesson text, only what the study screens filter on
{
  "dataVersion": "2026.09.19",
  // Must equal lessons.length — check #19 fails otherwise. The shipped file is
  // at 64: Track C closed on 22.09.2026 and every objective has a card.
  "count": 64,
  "chunks": ["ch01", "ch02", "ch03", "ch04", "ch05", "ch06"],
  "lessons": [
    {
      "objective": "FL-1.4.3",
      "chunk": "ch01",
      "chapter": 1,
      "languages": ["tr", "en"],
      "syllabusVersion": "4.0.1",
      "status": "published"
    }
  ]
}
```

```json
// lessons/ch01.json
{
  "chunk": "ch01",
  "chapter": 1,
  "dataVersion": "2026.09.19",
  "lessons": [
    {
      "objective": "FL-1.4.3",
      "syllabusVersion": "4.0.1",
      "syllabusRef": "§1.4.3",
      "revision": 1,
      "status": "published",
      "origin": "original",
      "i18n": {
        "tr": {
          "title": "Testlerin etkisi zamanla azalır",
          "paragraphs": ["..."],
          "keyPoints": ["..."],
          "commonMistakes": ["..."]
        },
        "en": {
          "title": "Tests wear out",
          "paragraphs": ["..."],
          "keyPoints": ["..."],
          "commonMistakes": ["..."]
        }
      },
      "meta": {
        "author": "unal",
        "reviewedBy": "—",
        "createdAt": "2026-09-21",
        "updatedAt": "2026-09-21"
      }
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `objective` | string | **The primary key.** One card per LO; the code must exist in `objectives.json` (CI check #16). |
| `syllabusVersion` | string | **Required**, same rule as a question's. |
| `syllabusRef` | string | The syllabus section the card explains. |
| `revision` | int | Increments on every content change. |
| `status` | `draft`\|`review`\|`published`\|`retired` | Only `published` cards are shown. |
| `origin` | `original` | **The only value.** A lesson is never adapted from the official text. |
| `i18n.<lang>.title` | string | The card's heading. |
| `i18n.<lang>.paragraphs` | string[] | Plain text, **not Markdown** — the project has no Markdown renderer and this feature does not justify adding one. |
| `i18n.<lang>.keyPoints` | string[] | The take-aways. TR and EN must be the same length (CI check #17). |
| `i18n.<lang>.commonMistakes` | string[] | What candidates get wrong here. Same parity rule. |
| `meta.reviewedBy` | string | Must be non-empty before `status` can be `published` (CI check #18). |

> **All 64 cards are written and published** (Track C, closed 22.09.2026). The nullable path is still real and still tested: `contentClient.getLesson` returns `null` for an objective with no **published** card, and `LessonCard` renders a placeholder rather than an error — which is what a card at `status: "review"` looks like while it is being written.

### 3.10 Glossary — `glossary/`

```json
// glossary/index.json
{ "terms": [ { "slug": "test-case", "tr": "test senaryosu", "en": "test case", "chunk": "terms-t" } ] }
```

```json
// glossary/terms-t.json
{
  "terms": [
    {
      "slug": "test-case",
      "en": { "term": "test case", "definition": "A set of preconditions, inputs, actions..." },
      "tr": { "term": "test senaryosu", "definition": "Bir ön koşullar, girdiler, eylemler... kümesi." },
      "usedIn": [{ "syllabus": "Foundation", "version": "v4.0" }],
      "source": "ISTQB Glossary",
      "sourceUrl": "https://glossary.istqb.org/en_US/term/test-case",
      "trSource": "TTB CTFL v4.0.1 TR müfredatı §1.x"
    }
  ]
}
```

> **Turkish definition rule:** the primary source is **TTB's v4.0.1 Turkish syllabus**. TTB's separate glossary (v3.7-based, 564 terms) is used only as a secondary source, and only **after verification**. Every Turkish term carries `trSource`, stating which document it came from.

---

## 4. Client-side (user) data — IndexedDB

No server; all progress lives on the device. The single source of truth for this section is [`../src/lib/db/db.ts`](../src/lib/db/db.ts) — six tables via Dexie, database name `istqb-prep`, schema at **version 3**.

```ts
attempts      // One session, in any of the three modes
  { id, certId, seed, questionIds[], status, mode, scope,
    instantFeedback, durationMinutes, contentLang,
    startedAt, deadlineAt, submittedAt?, autoSubmitted?,
    points?, totalPoints?, passed?, syllabusVersion, dataVersion }
  // `passed` is written only for a `blueprint` scope, so absent means "no
  // verdict", never "failed". `scoreExam` always compares against the
  // official pass mark (26), which is the right comparison for the exam and a
  // false one for a 10-question set — `isGraded(scope)` is the single
  // definition the result screen and the store both read.

responses     // One row per answered question — the answers do NOT live on the attempt
  { key, attemptId, questionId, selected[], flagged, revealedAt?, updatedAt }

objectiveProgress  // Study mode's per-objective mastery (v3)
  { key, certId, objectiveCode, cardReadAt?, attemptCount,
    lastScorePercent, mastered, updatedAt }

srsCards      // FSRS state — declared, not yet written to (Phase 3)
  { questionId, certId, due, stability, difficulty, reps, lapses, state, lastReviewedAt? }

bookmarks     // Bookmarked questions and notes — declared, not yet written to (Phase 2-3)
  { questionId, certId, createdAt, note? }

settings      // A generic key-value table, one row per setting
  { key, value }
```

**Notes that matter, because the obvious guess is wrong:**

- **Answers and flags are not on the attempt.** They live one row per question in `responses`, keyed `` `${attemptId}:${questionId}` `` (`responseKey`). `saveResponse` writes the whole row and never reads first — the read-then-write it replaced could lose a selection when the user answered and flagged the same question in the same tick.
- **`points`, not `score`.** `submittedAt`, not `finishedAt`. `durationMinutes`, not `durationSec`. There is no `extended` flag: the chosen duration is frozen onto the attempt as `durationMinutes`, read from `meta.json` at setup.
- **`deadlineAt` is nullable, and null means untimed.** Study and practice carry `null`; only exam mode sets one. A separate boolean could contradict the timestamp, so there isn't one.
- **`mode`, `scope` and `instantFeedback` are frozen at creation.** A resumed session reads them back rather than recomputing them from whatever the setup screen currently defaults to — resuming must not change the rules mid-session. `scope` is a discriminated union: `{ kind: "blueprint" }`, `{ kind: "chapter", chapters[], count }`, `{ kind: "objective", objectives[], count }`, or `{ kind: "questions", questionIds[], source }` — an explicit list rather than a rule, where `source` is `"wrong" | "flagged" | "shaky"`. That last one is what makes "retry the ones you missed" (F2-02) and the saved lists (F2-07) one feature instead of two: both hand `selectQuestions` a set of ids and let it report what the pool can still supply.
- **`revealedAt` is the lock.** Once the rationale has been shown, the answer is final: `sessionStore.select` refuses a revealed question, so instant feedback cannot be gamed.
- **Breakdowns are not stored.** `chapterBreakdown` / `objectiveBreakdown` are recomputed by `scoreExam` from the questions and the stored answers whenever a result is shown.

### Schema versions

| v | Change | Data migration |
|---|---|---|
| 1 | `attempts`, `responses`, `srsCards`, `bookmarks`, `settings` | — |
| 2 | Compound index `[certId+status]` on `attempts` — resumable-attempt lookup ran as a table scan without it | none |
| 3 | Three modes: `mode` index and `[certId+mode+status]` on `attempts`, new `objectiveProgress` table | `applyAttemptV3Defaults` |

`applyAttemptV3Defaults` ([`../src/lib/db/migrations.ts`](../src/lib/db/migrations.ts)) backfills every pre-v3 row with `mode: "exam"`, `instantFeedback: false`, `scope: { kind: "blueprint" }` — which is what every attempt written before v3 actually was. It uses `??=`, so it is safe to run twice. It lives outside the upgrade hook so it can be unit-tested: jsdom has no IndexedDB, so the hook itself is only exercised end to end.

### Mastery (`objectiveProgress`)

Written by [`../src/lib/db/objectiveProgress.ts`](../src/lib/db/objectiveProgress.ts). A row appears the moment an objective's card is opened (`markLessonRead`), which is why a missing row is exactly "not started" — there is no separate empty state to store.

`mastered` is `attemptCount >= MASTERY_MIN_ANSWERED (3)` **and** `lastScorePercent >= MASTERY_MIN_PERCENT (80)`. `attemptCount` accumulates across sessions; the score replaces the previous one, so **mastery is losable** — it reflects the most recent objective test, not a high-water mark. A submit with nothing answered writes nothing, so an empty attempt cannot erase mastery the candidate had already earned.

### When the data version changes
When `manifest.dataVersion` changes: the question cache is cleared, **user progress is preserved**. If a question's `revision` value has increased, that question's SRS card is set to `state: 'relearning'` (the content changed, so the old memory record is invalid). This is F3-11, not yet implemented.

### Export/import
All tables are exported as a single JSON file. On import, a `dataVersion` mismatch produces a warning but does not block the import. This is F3-08, not yet implemented.

---

## 5. Question selection

One entry point for all three modes: `selectQuestions` ([`../src/features/exam/selectQuestions.ts`](../src/features/exam/selectQuestions.ts)), which branches on the attempt's `scope` and returns the same shape either way — `{ seed, questionIds, shortfalls }`. The selection is **seeded and reproducible**: the same seed over the same pool yields the same exam.

```
INPUT:  scope, blueprint (LO groups), index.json pool (published only), seed, exclude
OUTPUT: question IDs + shortfalls

scope.kind === "blueprint"  → delegates to generateExam (below)
scope.kind === "chapter"    → the pool filtered to those chapters
scope.kind === "objective"  → the pool filtered to those LO codes
                              then: preferUnseen → take scope.count → shuffle
```

### `generateExam` — the blueprint path

```
For each blueprint group:
  a. From the index, take the published questions matching the group's
     chapter AND K-level AND at least one of its LOs.
  b. If group.questions > group.objectives.length:
       → at least one question from each LO, the rest filled from the pool
     else:
       → group.questions DIFFERENT LOs, one question from each
  c. Questions the user has already seen are ranked last (`preferUnseen`),
     never excluded outright — running out is worse than repeating.
Then SHUFFLE the combined list: official sample exams run in LO order, a real exam does not.
```

`preferUnseen`'s `exclude` set is built from **submitted** attempts only (`collectSeenQuestionIds`). Only the exam setup screen's "ones I haven't seen before" option passes one — it is on by default; practice and study always pass an empty set.

**Not implemented, deliberately not pretended:** there is no weighted "smart mode" (the `w *= 2.0 / 1.5 / 0.3` sketch this section used to carry), nor is there a toggle for option order.

**Options are shuffled per attempt (D-03), in every mode.** `withOptionOrder` (`src/features/exam/optionOrder.ts`) seeds `createRng` with an FNV-1a hash of the attempt's `seed` and the question id, shuffles the option ids once, and applies that one permutation to every language. The order is derived, not stored: `sessionStore` applies it wherever questions enter the store (`startSession`, `resumeAttempt`, and through it `loadSubmitted`), so a resumed session, the result screen and `/inceleme/:attemptId` show the order the candidate saw, and attempts written before D-03 get a stable order from their own seed with no schema change. Answers, `correct`, `rationale.byOption` and scoring are keyed by option id and never see a position. What the candidate sees follows position: the row number, the 1-9 shortcut and the rationale panel's label are all the displayed position. The pre-filled GitHub issue names options by their authored id and writes out the order they were shown in. Checks #14 (which letter is the key) and #23 (a rotation in the keyed letters) measured the authored letter, which no longer reaches a candidate, so both were retired; #22 (whether the key is the longest option) stays, because length survives the shuffle.

**Insufficient question count:** the selection never throws and never silently shrinks. Every group that fell short is reported in `shortfalls`, and the caller states it before the session starts: *"This exam contains 34 questions instead of 40 — there aren't enough questions for chapter 4 yet."* Rule 8. `PracticeSetup` previews by calling `selectQuestions` itself, so its preview is generation. `ExamSetup` previews through `previewCoverage`, which counts each blueprint group's candidates instead of running the selection — and it counts them over the **whole** published pool, with the seen set deliberately not applied, because `exclude` only reorders candidates and never removes one. Applying it would make the screen warn about shortfalls generation does not produce.

---

## 6. CI validations

Checks that run on every PR (`yarn validate:data`). The registry in [`../scripts/validate-data.ts`](../scripts/validate-data.ts) is the source of truth for the numbers and the severities; this table mirrors it.

| # | Check | Result |
|---|---|---|
| 1 | Do all JSON files conform to their JSON Schema? | ❌ build fails |
| 2 | Does every `objectives[]` code exist in `objectives.json`? | ❌ |
| 3 | Does the length of `correct[]` match `selectCount`? | ❌ |
| 4 | Does every ID in `correct[]` exist in `options`? | ❌ |
| 5 | Is `rationale.byOption` filled in for every option (TR and EN)? | ❌ |
| 6 | Does `i18n` contain both `tr` and `en`, with matching option counts? | ❌ |
| 7 | Are question IDs unique (across all chunks)? | ❌ |
| 8 | Is `index.json` consistent with the chunk files (count, chunk name, chapter)? | ❌ |
| 9 | Does `exam-blueprint.json` total 40 questions / 8-6-4-11-9-2 / K 8-24-8? | ❌ |
| 10 | Is there at least 1 published question for every LO? | ⚠️ warning |
| 11 | Is there at least 3 published questions for every LO? | ⚠️ warning |
| 12 | Does `kLevel` match the highest K-level among the question's LOs? | ⚠️ warning |
| 13 | Is there English-term leakage in the Turkish text (glossary check)? | ⚠️ warning |
| 14 | ~~Is the correct answer's option position balanced (a systematic "always a" bias)?~~ **Retired by D-03** — options are shuffled per attempt, so the authored letter never reaches a candidate. | — |
| 15 | Does the rationale/question text refer to an option by its letter (e.g. "(c) is incorrect")? | ❌ |
| 16 | Does every lesson's `objective` exist in `objectives.json`? | ❌ |
| 17 | Are the TR and EN lesson blocks parallel (equal `keyPoints` / `commonMistakes` counts)? | ❌ |
| 18 | Does a published lesson record `meta.reviewedBy`? | ❌ |
| 19 | Is `lessons/index.json` consistent with the lesson chunk files (objective, chunk, count)? | ❌ |
| 20 | Is there at least 1 published lesson for every LO? | ⚠️ warning |
| 21 | Does the Turkish text use a word from a term's `trForbidden` list (questions **and** lessons)? | ⚠️ warning |
| 22 | Are the keyed options the longest ones far more often than chance (a length cue)? Both languages, singles **and** multi-select. | ⚠️ warning |
| 23 | ~~Do the keyed letters run a rotation in file order (`a → b → c → d …`), per chunk?~~ **Retired by D-03**, for the same reason as #14. | — |

**21 live checks: 14 errors (#1–#9, #15–#19) and 7 warnings (#10–#13, #20–#22).** #14 and #23 are retired; their numbers are not reused, so every other check keeps its number. A warning prints and exits 0: content gaps must be visible without blocking CI.

#13 and #21 are the two halves of one problem and neither covers the other. #13
catches an untranslated **English** word sitting in Turkish text; #21 catches a
plausible-looking **Turkish** word that is not the syllabus's. #21 was added on
22.09.2026 after five of six review chunks turned up the same class of defect by
hand — `kusur` for *defect*, `test izleme` for *test monitoring*, `geçerleme`
for *validation* — including in content that had already been published.

#21 deliberately skips three kinds of match, because a check that cries wolf
gets ignored: a forbidden word that is some other term's correct `tr` (`hata` is
banned for *error* and *failure* and is the right word for *defect*), the
accepted loanword `testware`, and words that are ordinary Turkish in another
grammatical role — `kapsama` (the dative of `kapsam`), `test durumu` ("test
status"), `teknik gözden geçirme` (a real review type). Those still need a human
reader; the `question-verifier` and `lesson-verifier` agents are told to look.

---

## 7. Adding a new certification

1. Create the `data/<new-id>/` directory
2. Fill in `meta.json`, `syllabus.json`, `objectives.json`, `exam-blueprint.json`, `terms.json`
3. Add an entry to `manifest.json`
4. Add the question chunks, and the lesson chunks if there are any (they may ship empty)
5. Run `yarn build:index` — it writes `questions/index.json`, `lessons/index.json` and the manifest counts. A certification with no `lessons/` directory is fine; the index and the lesson checks are simply skipped.
6. **No code changes.** The application reads from the manifest.

Target order: `CTFL v4.0.1` → `CTFL-AT` → `CT-AI v2.0` → `CT-PT` → `CTAL-TA v4.0`

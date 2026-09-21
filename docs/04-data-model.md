# 04 — Data Model and Indexing Strategy

**Version:** 1.0 · **Date:** 19.09.2026
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
    ├── glossary/
    │   ├── index.json               # Term list (slug, tr, en) — for search
    │   ├── terms-a.json             # Definitions, alphabetic chunks
    │   └── ...
    │
    └── exams/
        ├── index.json               # Ready-made (curated) exam definitions
        └── mock-001.json            # Question ID list + order
```

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
    "extendedDurationMinutes": 75,
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

```json
"media": {
  "kind": "decision-table",
  "caption": { "tr": "Karar tablosu", "en": "Decision table" },
  "headers": { "tr": ["Koşul", "K1", "K2", "K3"], "en": ["Condition", "R1", "R2", "R3"] },
  "rows": [["Üye mi?", "E", "E", "H"], ["Tutar > 500", "E", "H", "-"]]
}
```

```json
"media": {
  "kind": "state-transition",
  "states": ["Taslak", "Onayda", "Yayında"],
  "transitions": [
    { "from": "Taslak", "to": "Onayda", "event": "gönder" },
    { "from": "Onayda", "to": "Yayında", "event": "onayla" }
  ]
}
```

Supported types: `decision-table` · `state-transition` · `control-flow` · `code` · `table` · `image` (last resort; `alt` text required).

### 3.9 Glossary — `glossary/`

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

No server; all progress lives on the device. 5 tables via Dexie:

```ts
attempts      // Exam attempt sessions
  { id, certId, mode, startedAt, finishedAt, durationSec, extended,
    questionIds[], answers: Record<qid, string[]>, flagged: qid[],
    score, passed, chapterBreakdown, objectiveBreakdown }

responses     // Every answer, per question (for analysis and SRS)
  { id, questionId, attemptId, answeredAt, given[], correct: bool,
    timeSpentMs, selfGrade?: 'again'|'hard'|'good'|'easy' }

srsCards      // FSRS state
  { questionId, due, stability, difficulty, reps, lapses, state, lastReview }

bookmarks     // Bookmarked questions and notes
  { questionId, note, createdAt }

settings      // Preferably a single row
  { uiLang, contentLang, sideBySide, theme, extendedTime, lastCertId, dataVersion }
```

### When the data version changes
When `manifest.dataVersion` changes: the question cache is cleared, **user progress is preserved**. If a question's `revision` value has increased, that question's SRS card is set to `state: 'relearning'` (the content changed, so the old memory record is invalid).

### Export/import
All tables are exported as a single JSON file: `istqb-prep-yedek-2026-09-19.json`. On import, a `dataVersion` mismatch produces a warning but does not block the import.

---

## 5. Exam generation algorithm

```
INPUT:  blueprint (LO groups), index.json, user history, options
OUTPUT: 40 question IDs

1. For each blueprint group:
   a. From the index, filter the questions that cover the group's LOs, with status=published and matching syllabusVersion.
   b. If group.questions > group.objectives.length:
        → pick AT LEAST one question from each LO, fill the rest randomly from the pool
      else:
        → pick group.questions DIFFERENT LOs, take one question from each
   c. Selection weight (if the "smart mode" option is on):
        w = 1
        w *= 2.0  if the user has never seen this question
        w *= 1.5  if the user is below 60% on this LO
        w *= 0.3  if this question was asked in the last 7 days
2. Combine into a total of 40 questions.
3. VALIDATE: chapter distribution = 8/6/4/11/9/2 and K distribution = 8/24/8. If not, throw an error.
4. SHUFFLE the questions (official sample exams are ordered by LO sequence; a real exam is not).
5. Also shuffle each question's options — but positional options like "all of the above" stay fixed.
```

**Insufficient question count:** if there aren't enough published questions for a group, the exam is still generated, but the user is told explicitly: *"This exam contains 34 questions instead of 40 — there aren't enough questions for chapter 4 yet."* Silently generating a shortfall is exactly the same calibration mistake we criticize.

---

## 6. CI validations

Checks that run on every PR (`yarn validate:data`):

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
| 14 | Is the correct answer's option position balanced (a systematic "always a" bias)? | ⚠️ warning |
| 15 | Does the rationale/question text refer to an option by its letter (e.g. "(c) is incorrect")? | ❌ |

---

## 7. Adding a new certification

1. Create the `data/<new-id>/` directory
2. Fill in `meta.json`, `syllabus.json`, `objectives.json`, `exam-blueprint.json`
3. Add an entry to `manifest.json`
4. Add the question chunks
5. **No code changes.** The application reads from the manifest.

Target order: `CTFL v4.0.1` → `CTFL-AT` → `CT-AI v2.0` → `CT-PT` → `CTAL-TA v4.0`

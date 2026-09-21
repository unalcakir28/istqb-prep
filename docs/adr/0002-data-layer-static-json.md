# ADR-0002 — Data layer: indexed, chunked static JSON

**Status:** Accepted · **Date:** 19.09.2026

## Context
The question bank starts at 120, will grow to 300+, and will eventually reach 1000+ questions once multiple certifications are added. There is no backend and no database; everything is served as static files. A user only sees 40 questions per attempt — but selecting from the pool requires metadata for every question.

## Options considered

| Option | Pro | Con |
|---|---|---|
| A single `questions.json` | Simple | ~3 MB at 1000 questions; downloaded on first load; unacceptable |
| One file per question | Most granular | 1000 HTTP requests; poor even with HTTP/2; inefficient CDN caching |
| **Manifest → index → chunk** | Small initial load; selective download; stable caching | Requires writing two-stage loading logic |
| SQLite (sql.js / WASM) | Real querying | ~1 MB WASM; over-engineering |
| External API/CMS | Management UI | Server cost + privacy + single point of failure; violates the project's core constraint |

## Decision
**Three-tier static JSON:**

```
manifest.json          → which certifications exist, dataVersion
<cert>/questions/index.json  → LIGHTWEIGHT metadata for all questions (no text)
<cert>/questions/ch0N-x.json → actual questions, per chapter, ≤40 questions per chunk
```

Exam generation is done **from the index**; only the chunks containing the selected questions are downloaded (typically 4–6 chunks ≈ 250 KB).

Detail: [`../04-data-model.md`](../04-data-model.md)

## Rationale
The index carries everything needed for exam generation and filtering (LO, K-level, chapter, difficulty, status) at ~200 bytes per question. At 1000 questions that's ~200 KB — acceptable, and downloaded once. Question texts and rationales (the real weight) are only fetched when needed.

Chunk filenames never change → CDN and PWA caching stay stable. When a question is retired it isn't deleted from the file, it gets `status: "retired"`.

## Consequences
- **+** Small initial load; fast exam start
- **+** Content is reviewable in Git; PR diffs are readable
- **+** Can be validated with JSON Schema in CI → a broken deploy can't ship with bad data
- **+** No CMS, database, or server
- **−** If the index exceeds 2000 questions it will need to be split itself (`index-ch01.json` …)
- **−** Content updates require a deploy (acceptable: content already has to go through review anyway)
- **−** Opening a new chunk once one fills up requires discipline (automated via script)

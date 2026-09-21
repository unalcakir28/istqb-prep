# ADR-0003 — Client-side storage: IndexedDB (Dexie), no account

**Status:** Accepted · **Date:** 19.09.2026

## Context
The user's exam history, per-question answers, SRS cards, and bookmarks must persist. There is no server, no account. Privacy is also a positioning factor: one competitor's free app shares device identifiers with third parties and doesn't let the user delete their data.

## Options considered

| Option | Pro | Con |
|---|---|---|
| `localStorage` | Simplest | ~5 MB quota; synchronous (blocks the main thread); not queryable; strings only |
| **IndexedDB (Dexie 4)** | Large quota; asynchronous; indexed queries; migration support | Raw API is ugly (Dexie solves this) |
| OPFS / File System Access | Very large data | Overkill; inconsistent browser support |
| Server + account | Cross-device sync | Cost, data-protection (KVKK/GDPR) burden, violates the privacy promise, single point of failure |

## Decision
**IndexedDB, via Dexie 4.** No account, no data goes to a server.

Tables: `attempts` · `responses` · `srsCards` · `bookmarks` · `settings`
Schema: [`../04-data-model.md §4`](../04-data-model.md)

The need to switch devices is covered by **JSON export/import** (F3-08).

## Rationale
The `responses` table holds every answer per question — for an active user working through a 300-question pool that's thousands of rows. SRS and filters like "questions I've never gotten right twice in a row" need indexed queries. `localStorage` satisfies none of this.

Not adding an account isn't a shortfall, it's a **product decision**: zero friction (start solving right away on open), zero privacy burden, zero infrastructure cost.

## Consequences
- **+** No server, no data-protection process, no cookie banner
- **+** Fast; ready for offline use (Phase 3 PWA)
- **+** "None of your data reaches us" is a verifiable claim (open source)
- **−** Progress is lost if browser data is cleared → export feature and a first-use notice are mandatory
- **−** No persistence in private/incognito tabs → the app detects this and warns
- **−** No automatic cross-device sync → manual export/import
- **−** Aggregate metrics like global accuracy per question can't be produced in v1 (a deliberate trade-off)

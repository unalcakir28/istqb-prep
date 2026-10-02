# ADR-0006 — A second certification: what is picked, and where it is kept

**Status:** Accepted · **Date:** 02.10.2026

## Context
F4-01 was meant to be the test of the multi-certification data model: add a second certification as content, with no code changes. The target moved from CTFL-AT to CT-AI v2.0 on 02.10.2026, because ISTQB is sunsetting CTFL-AT ([`../03-istqb-reference.md`](../03-istqb-reference.md) §8).

CT-AI v2.0 showed three gaps the data model had not been tested against:

1. **LO codes.** Every schema pinned the pattern to `FL-x.y.z`. CT-AI's are `AI-x.y.z`.
2. **Points.** Every CTFL question is worth 1 point. A CT-AI K3 question is worth 2, so 40 questions are worth 44 points and the pass mark is 29 points, not 29 questions. The scoring engine already summed `question.points`; nothing said where those points come from or held them to the total.
3. **Picking one.** `getActiveCertification()` returned the first `active` manifest entry. With two, the second could never be shown.

## Options considered for picking

| Option | Pro | Con |
|---|---|---|
| Certification in every route (`/ct-ai/sinav`, …) | A URL names everything; shareable | Every route, every link and every e2e spec changes; every existing bookmark breaks |
| **A stored choice, routes unchanged** | Nothing existing breaks; one module decides | A URL alone does not say which certification it shows |
| One site per certification | No switching at all | Two builds, two deployments, progress split across origins |

## Decision
**The candidate picks a certification on the home screen; the choice is kept in localStorage; the routes do not change.**

- `src/lib/certification.ts` holds the choice. `getActiveCertification()` returns it while it is still `active`, else the first `active` one. Every screen that is not tied to an attempt reads it.
- A session, its result and its review read **their own attempt's `certId`**, never the choice — switching never changes what an old attempt shows. Opening one also sets the choice to its certification, so the links they lead on to ("New exam", "Back to chapter") stay in it.
- A link that names an objective (`/calisma/lo/AI-6.1.5`) switches to that objective's certification: the LO prefix makes the owner unambiguous.
- The picker is shown only when two or more certifications are `active`. A certification is added as `draft` and becomes `active` in its `meta.json` when its pool can generate a full exam.

**Points come from the blueprint.** A group carries the tables' `pointsPerQuestion` (absent = 1). Check #24 requires one value per K-level, the groups to add up to `meta.exam.totalPoints` and each chapter's `examPoints`, and every question's `points` to equal its level's.

**The manifest is generated.** `yarn build:index` writes one entry per `data/<dir>/meta.json`, copying `id`, `acronym`, `syllabusVersion` and `status`; check #25 holds the manifest `id`, its `path` and `meta.id` equal, and question ids unique across certifications.

## Consequences
- IndexedDB needed no version bump: every progress row already carried `certId`, and `responses` are keyed through their attempt. The repetition deck is keyed by question id alone, which is why ids must be unique across certifications.
- localStorage is the place for it for the same reason as the theme: it must be known before anything async resolves, and it is a view of this browser, not progress. It is not in the progress file (F3-08).
- `yarn publish:questions` refuses to run without `--cert` once there are two certifications, because chunk names repeat.
- A shared URL does not carry the certification, except an objective's. That is the price of keeping every existing bookmark working.

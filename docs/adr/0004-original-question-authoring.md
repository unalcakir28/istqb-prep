# ADR-0004 — Original question authoring only

**Status:** Accepted · **Date:** 19.09.2026
**Related:** [`../08-legal-and-copyright.md`](../08-legal-and-copyright.md)

## Context
ISTQB and TTB have published 4 sample exams (A–D) + 26 additional questions = **186 questions** for CTFL v4.0.1, complete with answer key and per-option rationales. Using these directly would hand the project a ready-made, authoritative content pool overnight.

However, ISTQB's copyright clause explicitly enumerates the permitted uses: *the course of an accredited training provider* and *articles and books*. It then states:

> *"Any other use of this sample exam is prohibited without first obtaining the approval in writing of the ISTQB®."*

**A web app is not on that list.**

## Options considered

| Option | Assessment |
|---|---|
| Put the 186 official questions on the site | ❌ Not an "extract" — the whole document. A website isn't in the permitted-use list. Risk that could end the project. |
| "Adapt" official questions (change numbers/names) | ❌ A derivative work. Legally worse, ethically worse. |
| Show a few official questions as examples | ⚠️ Arguably defensible but ambiguous; not worth the risk for the gain |
| **Write every question from scratch, from LOs** | ✅ Legally clean; **and it's the product's core positioning** |
| Wait until permission arrives | ❌ Indefinite blocker |

## Decision
**Every question in the bank is authored from scratch.** Official ISTQB/TTB sample exam questions never enter the pool in any form (copy, translation, rephrasing, "adaptation").

In the data model, the `origin` field **has no `official` value**: only `original`, `adapted` (a scenario description taken from a public standard), `community`.

Official sample exams are **linked to** — never copied.

## Rationale
Beyond legal safety, this is the strongest positioning available in the market. Market research shows the category is bankrupt on trust:
- The largest free pool doesn't even state its syllabus version
- The cheapest paid pool markets itself as *"taken from real exam questions"*
- Expert advice has degenerated to *"stay away from online tests"*

In this environment, the statement **"none of our questions are taken from a real exam; every one is written from a syllabus learning objective, and each question states which objective it belongs to"** isn't an admission of a constraint — it's a commitment competitors can't make.

## Consequences
- **+** Legal risk is minimal; even if we move to a commercial model, the content is ours
- **+** Positioning: an anti-dump stance is a marketing advantage
- **+** LO and K-level tags are naturally correct (the question was written from the LO to begin with)
- **−** **The project's biggest risk originates here:** content production is on the critical path (R-02)
- **−** MVP ships with 120 questions, not 186 ready-made ones
- **−** AI use requires caution: a model can reproduce an official question from memory out of its training data → every question is manually checked against the official sets (R-13)

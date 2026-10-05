# ADR-0007 — Referencing official material without reproducing it

**Status:** Accepted · **Date:** 05.10.2026 · **Closes:** A-01

## Context
Rule 1 and [ADR-0004](0004-original-question-authoring.md) settle what never enters the question bank: an official ISTQB or TTB sample exam question, in any form. They do not say what the product **may** do with official material short of that. That gap keeps reopening the same small questions: may a rationale quote the syllabus, may a lesson card name a sample exam set, may a verifier's report cite an official question, may the glossary's definitions be copied?

The syllabi, the sample exams and the exam rules documents carry the same five-clause notice ([`../08-legal-and-copyright.md`](../08-legal-and-copyright.md) §1–§2). It permits *"extracts, for non-commercial use … if the source is acknowledged"* and prohibits *"any other use … without first obtaining the approval in writing of the ISTQB®"*. The ISTQB Glossary is the exception: CC BY 4.0 "except where otherwise noted" (§5). No written approval exists ([`../permission-request/README.md`](../permission-request/README.md)), so this record assumes none.

This decision is about **citation and linking**. It does not reopen rule 1, D-04 or D-07, and it adds no `official` value to `origin`.

## Decision

Three verbs, and what each may touch.

### Link — always allowed
- Any official document, at the publisher's own URL: syllabi, *Exam Structures & Rules*, *Exam Tables*, the sample exam pages, the glossary. Links live in each `meta.json` `sources` and `officialSampleExams`, and `/kaynaklar` renders them.
- A link goes to the publisher, never to a copy: no official document is hosted, mirrored or committed, `docs/evidence/` included. The local text extracts that writers and verifiers read stay in the git-ignored `.sources/`.

### Cite — allowed, with the source named
- **Identifiers and facts:** LO codes, section numbers (§4.2.1), chapter titles, K-levels, keyword lists, training times, the exam's counts, points, pass mark and duration. Facts are not the notice's subject; titles and codes are short extracts. They carry the attribution K-3 requires.
- **Short extracts of syllabus text:** an LO statement, a keyword's official Turkish rendering, or one sentence a rationale or lesson card needs. Each is short, attributed to the syllabus and version it came from, and quoted only where the exact words matter. Everything else in a rationale or lesson card is our own explanation of the syllabus, not its text.
- **Glossary definitions, verbatim:** under CC BY 4.0, with the source, the licence and a link to each term's page (F0-09, `data/<cert>/glossary/`). Shown in the UI only together with that attribution.
- **Sample exams, by name only:** the set (A–D), the publisher, the document version and the link. A screen may tell a candidate that the sets exist and recommend sitting them at the publisher's site.

### Reproduce — never, without ISTQB's written approval
- Any sample exam question, option, answer key or rationale, in any form: copied, translated, paraphrased, renumbered, "adapted", screenshotted or summarised.
- A pointer that ties our content to an official question ("like Sample Exam B, Q12"). It invites the derivative comparison rule 1 exists to avoid, and it tells a candidate where our question came from when it came from an objective.
- The syllabus as a whole, a whole chapter, or a translation of it; the TTB Turkish translations beyond the short extracts above.
- The ISTQB or TTB logo (K-4).

### Reading is not reproducing
A verifier may read the official sets to rule out an accidental match with a draft (R-13). What it finds is reported by our own item's id and the fact of the overlap, never by quoting the official question in a report, an issue, a commit or a PR.

## Consequences
- **+** One place answers "may we show this?"; [`../08-legal-and-copyright.md`](../08-legal-and-copyright.md) §3 keeps the legal reasoning and points here for the rule.
- **+** The glossary's definitions are usable today, because their licence is not the extract clause.
- **−** A candidate who wants the official questions leaves the site for them; that is the price of rule 1 and is already how `/kaynaklar` works.
- **−** "Short" is a judgement, not a number. The test is the notice's own word, *extract*: if the quoted text could stand in for reading the source, it is too long.
- If ISTQB's written approval ever arrives, it changes the **Reproduce** list only, through Track A, and only for what the approval names.

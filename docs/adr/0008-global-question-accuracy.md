# ADR-0008 — Global per-question accuracy: not collected

**Status:** Accepted · **Date:** 05.10.2026 · **Closes:** F4-08

## Context
The market research names a global accuracy rate per question as a feature candidates value ([`../01-market-research.md`](../01-market-research.md), the filterable list with "global accuracy"). The metrics plan wanted the same number for quality control: a question that 95% get right or 10% get right deserves a second look ([`../10-risks-and-metrics.md`](../10-risks-and-metrics.md) §2 had a target distribution of 30–85% until this decision). F4-08 asked how to get it while preserving privacy, with no decision taken yet.

Two constraints are already in force:

- **Rule 7:** no backend, no accounts, no data goes to a server; all progress lives in IndexedDB ([`0003-client-side-storage.md`](0003-client-side-storage.md)).
- **The metrics plan's own exclusion:** "Never collected: … user answers, progress data" ([`../10-risks-and-metrics.md`](../10-risks-and-metrics.md) §3).

A per-question accuracy rate is, by definition, an aggregate of user answers. Every way of producing it starts with answers leaving the device.

## Options considered

1. **A collecting endpoint** (an analytics service, a serverless function, a hosted database) receiving one "question X: right/wrong" event per answer. This is the usual way to get the number, and it is a server receiving answers. It breaks rule 7 and the exclusion in §3 directly. Making the events anonymous does not change that: the rule is about data leaving the device, not only about identity.
2. **The same endpoint with local differential privacy.** Each device would randomise its report (randomised response) before sending it, so no single report can be trusted and only the aggregate is meaningful. That protects the individual better, but it still needs the endpoint, so it breaks rule 7 in the same way. It also needs a large number of reports before the aggregate is usable, and a project of this size cannot promise that.
3. **User-initiated submission through GitHub.** The candidate would press a button to open a pre-filled issue or pull request carrying their own per-question tallies, the way the report link opens an issue (F2-08). Nothing leaves without the candidate's action, and the destination is public. But:
   - the sample is whoever chooses to submit, which is not representative;
   - nothing stops invented or repeated tallies;
   - a public file of someone's answers is more exposure than the number is worth;
   - aggregating issues into a dataset is a pipeline the project would have to build and maintain.

   This is the only option compatible with rule 7 as written. It produces a number that cannot carry the weight a "global accuracy" label puts on it.
4. **No global number.** The signals the project already has stand in for it: the adversarial verifier passes, the error reports through `ReportQuestionLink` (triaged weekly, `TODO.md` "Ongoing"), and each candidate's own accuracy, which `/listelerim` and `/ilerleme` already show from their own IndexedDB.

## Decision
**Option 4: the product does not collect or show a global per-question accuracy rate.**

- Options 1 and 2 are excluded by rule 7 and by §3's "never collected: user answers". Lifting either is a change to the project's identity, not a feature. It would need a new decision record that reopens ADR-0003, not an implementation.
- Option 3 is compatible but would publish a number that looks like a measurement and is not one. Under rule 5 the product does not assert what it has not verified, and a self-selected, unverifiable sample labelled "global accuracy" is that kind of assertion.
- The quality-control need behind the metric is met by the review signals above. A question that candidates find wrong reaches the maintainer as an error report, with what they selected attached.

## Consequences
- **+** Rule 7 holds without exception, and "none of your data reaches us" stays a claim anyone can verify in the source.
- **+** No pipeline, no abuse handling, no data to secure.
- **−** Candidates do not see how others did on a question. The market research counts this as a loss.
- **−** The metrics plan's accuracy-distribution row (§2) has no source. It is marked as not collected rather than left as a plan.
- **Revisit** only together with ADR-0003. Volume alone is not a reason to revisit, because no volume makes option 3's sample representative.

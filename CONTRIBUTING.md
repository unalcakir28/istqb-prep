# Contributing Guide

> **Question contributions are open** (F4-05, 05.10.2026). D-04 kept them closed until the editorial bar had settled; the flow below is that bar. Bug reports, suggestions, and code contributions are always open.

## Most valuable contribution: reporting a bad question

If you spot a wrong answer, a bad translation, an incorrect syllabus reference, or a weak rationale in a question, open a **Question Issue**. The "Report an error in this question" button on the site fills out the issue for you.

## Discussing a question

The **Discuss** link under a question's rationale opens this repository's Discussions, searched for the question's id (F4-06). It is shown once Discussions is turned on for the repository (`DISCUSSIONS_ENABLED` in `src/lib/product.ts`). Look for an existing thread first. When you start one, put the question id at the start of the title — `ctfl4-0042: why is B not right?` — so the next candidate's search finds it. A thread is a conversation, not a report: if the question itself is wrong, open a Question Issue instead.

Discussions about a question discuss its answer, so the link only appears once the answer is shown.

## Code contribution

```bash
yarn install --frozen-lockfile
yarn validate:data   # data validation
yarn dev
yarn test
yarn lint
```

Before opening a PR: `yarn lint && yarn test && yarn validate:data` must be green.

## Question contribution

Required reading: [`docs/07-content-authoring-guide.md`](docs/07-content-authoring-guide.md)

In short:

1. **No question may be copied, translated, or "adapted" from an official ISTQB/TTB sample exam.** Changing the numbers isn't adaptation, it's a derivative work.
2. Every question is written from scratch, starting from a **learning objective (LO)**.
3. **TR and EN are mandatory.** Turkish terms must follow the glossary in [`07 §5`](docs/07-content-authoring-guide.md) — especially the `error / defect / failure` → `insan hatası / hata / arıza` distinction.
4. **A rationale is required for every option.** "Wrong, because the correct answer is C" is not a rationale; you must state what each wrong option actually describes.
5. `syllabusRef`, `objectives[]`, and `kLevel` must be correct.
6. The entire quality-control checklist in §6 must be checked off.

### The record

- `id`: the next free id in that certification (`ctfl4-NNNN` for CTFL, `ctai-NNNN` for CT-AI). If another PR takes it first, the maintainer renumbers yours.
- `origin: "community"`, `status: "review"`, `meta.author`: your GitHub handle, `meta.reviewedBy: ""`.
- Run `yarn build:index && yarn validate:data` before you push; both must be green.

### What happens after you open the PR

1. A PR won't be reviewed until the originality declaration checkbox in the PR template is checked.
2. The maintainer verifies the question adversarially: the key is re-derived from the syllabus, every rationale is checked, and the question is compared with the official sample exams to rule out an accidental match.
3. Changes are requested in the PR. Once it is right, it is merged at `review` and published in a separate commit by the maintainer, who is recorded as `meta.reviewedBy`. You stay `meta.author`.

The full flow is in [`docs/07-content-authoring-guide.md` §9](docs/07-content-authoring-guide.md). By opening a content PR you agree that the question is published under **CC BY-SA 4.0**, the project's content licence.

## AI usage

AI can be used for drafts, translation suggestions, and language checks. **Unverified AI output cannot go to publication.** Asking an AI to "write an ISTQB sample exam question" is forbidden — the model might reproduce an official question from memory out of its training data. Details: [`07 §8`](docs/07-content-authoring-guide.md).

## Conduct

Be respectful, assume good faith, and direct criticism at the work, not the person.

# Contributing Guide

> **Note:** External question contributions are not accepted until Phase 4 (the editorial quality bar hasn't settled yet — see decision D-04). Bug reports, suggestions, and code contributions are always open.

## Most valuable contribution: reporting a bad question

If you spot a wrong answer, a bad translation, an incorrect syllabus reference, or a weak rationale in a question, open a **Question Issue**. The "Report an error in this question" button on the site fills out the issue for you.

## Code contribution

```bash
yarn install --frozen-lockfile
yarn validate:data   # data validation
yarn dev
yarn test
yarn lint
```

Before opening a PR: `yarn lint && yarn test && yarn validate:data` must be green.

## Question contribution (starting Phase 4)

Required reading: [`docs/07-content-authoring-guide.md`](docs/07-content-authoring-guide.md)

In short:

1. **No question may be copied, translated, or "adapted" from an official ISTQB/TTB sample exam.** Changing the numbers isn't adaptation, it's a derivative work.
2. Every question is written from scratch, starting from a **learning objective (LO)**.
3. **TR and EN are mandatory.** Turkish terms must follow the glossary in [`07 §5`](docs/07-content-authoring-guide.md) — especially the `error / defect / failure` → `insan hatası / hata / arıza` distinction.
4. **A rationale is required for every option.** "Wrong, because the correct answer is C" is not a rationale; you must state what each wrong option actually describes.
5. `syllabusRef`, `objectives[]`, and `kLevel` must be correct.
6. The entire quality-control checklist in §6 must be checked off.

A PR won't be reviewed until the originality declaration checkbox in the PR template is checked.

## AI usage

AI can be used for drafts, translation suggestions, and language checks. **Unverified AI output cannot go to publication.** Asking an AI to "write an ISTQB sample exam question" is forbidden — the model might reproduce an official question from memory out of its training data. Details: [`07 §8`](docs/07-content-authoring-guide.md).

## Conduct

Be respectful, assume good faith, and direct criticism at the work, not the person.

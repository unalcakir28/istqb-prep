---
name: pre-pr
description: Runs this repository's full CI gate locally, in the order CI runs it, and reports what is red. Use before opening or updating a pull request, and before asking for a review.
disable-model-invocation: true
---

# pre-pr

CI runs eight steps and stops at the first failure. Running them here, in the
same order, means a pull request is not opened on a build that was already red
locally.

## Run

Run the steps **in order** and stop at the first failure — a later step often
fails only because an earlier one did.

```bash
yarn lint
yarn format          # check-only; it does NOT write
yarn typecheck
yarn test
yarn build:index     # regenerate before validating, so the index is not stale
yarn validate:data
yarn validate:i18n
yarn build
yarn e2e
```

## Reading the results

- **`yarn format` fails.** It is `prettier --check`. Fix with `yarn format:write`,
  then rerun. Do not edit the files by hand to satisfy it.
- **`yarn validate:data` prints warnings but PASSES.** Expected. They are content
  gaps tracked in `TODO.md`, not blockers, and they come in two kinds: check #11
  ("not enough to generate exams without repetition") is a question gap, check
  #20 ("no published lesson yet") is a lesson gap waiting on Track C. Only
  `0 error(s)` matters. If the error count is not zero, the pull request is not
  ready.
- **`yarn validate:data` reports a stale index.** `yarn build:index` was not run
  after the last `data/` edit. Run it and validate again.
- **`yarn validate:i18n` fails.** A UI string exists in one language only.
  Both `src/lib/i18n/locales/en.json` and `tr.json` must carry every key —
  i18next falls back to English, so nothing else catches this.
- **`yarn e2e` fails.** The report is written to `playwright-report/`. The specs
  select on English labels on purpose (`e2e/labels.ts`); do not "fix" a spec by
  retyping a label into it.

## Before handing the work over

- `yarn stats` has run since the last `data/` change, so `docs/coverage.md` and
  the README badges agree with the content. The PostToolUse hook does this
  automatically; check `git status` for an unexpected diff in those files.
- No question's status was changed by hand. Publishing has exactly one path:
  `yarn publish:questions --reviewer "<name>" --chunk <chunk>`.
- The commit message and the pull request description are in English.

Report the result as: which steps passed, the first one that failed, and the
shortest decisive line from its output.

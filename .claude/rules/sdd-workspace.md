---
paths:
  - ".superpowers/**"
  - "docs/superpowers/**"
---

# SDD workspace (`.superpowers/`)

`.superpowers/` is the SDD scratch workspace — the spec, the plan's ledger
(`progress.md`), and one brief / review package / report per task. It is
gitignored and prettier-ignored on purpose: it is a working record of how a
branch was built, not a deliverable. The plan itself is checked in under
`docs/superpowers/`. When a task's report and the tree disagree, the tree wins.

Two ways a review package ends up wrong about its own diff:

- **`git diff HEAD` does not show untracked files.** A review package built from
  it over a task that added new files reviews _nothing_ and looks like a clean,
  small diff. Use `git status --porcelain` to find the `??` entries and add them
  explicitly (`git diff --no-index /dev/null <file>`, or stage with `git add -N`
  first).
- **zsh does not word-split an unquoted variable.** `FILES="a.ts b.ts"; git diff
HEAD -- $FILES` passes the single pathspec `a.ts b.ts`, which matches nothing —
  git exits 0 with an empty diff rather than erroring, so the mistake reads as
  "no changes". Use an array (`files=(a.ts b.ts); git diff HEAD -- $files`) or
  `"${(z)FILES}"`.

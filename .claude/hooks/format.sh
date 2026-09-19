#!/usr/bin/env bash
# PostToolUse hook: keep edited files Prettier-clean.
#
# `yarn format` is a CI gate, and it had drifted red across 13 files before
# this hook existed because nobody ran it between edits. Formatting each file
# as it is written keeps that debt at zero.
#
# `--ignore-unknown` skips extensions Prettier does not handle, and
# .prettierignore (data/, scripts/, docs/, schemas/) is respected automatically,
# so this is a no-op for the content files.
set -uo pipefail

payload=$(cat)
file_path=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')
[[ -z $file_path ]] && exit 0

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
[[ -f $file_path ]] || exit 0

# Formatting is a convenience, never a reason to interrupt the session:
# failures stay silent and the CI gate still catches real problems.
npx prettier --write --ignore-unknown "$file_path" >/dev/null 2>&1
exit 0

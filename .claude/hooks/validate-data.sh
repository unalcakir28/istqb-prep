#!/usr/bin/env bash
# PostToolUse hook: revalidate the content set whenever data/ is touched.
#
# The product here is the question bank, not the code, so a broken data set is
# a broken product. `yarn validate:data` runs 23 numbered checks, but it is
# easy to forget after an edit and the failure then stays silent for a while.
#
# Contract (verified against the Claude Code hooks reference):
#   - the hook payload arrives as JSON on stdin; the edited path is at
#     `tool_input.file_path`
#   - exit 2 sends stderr back to Claude, which is what makes a failure
#     actually get fixed instead of scrolling past
# `CLAUDE_FILE_PATHS` is NOT a documented variable, so it is not used.
set -uo pipefail

payload=$(cat)
file_path=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')
[[ -z $file_path ]] && exit 0

# Only content files matter. Editing a schema or a script is handled by the
# normal test run, not by this hook.
case $file_path in
  *data/*.json) ;;
  *) exit 0 ;;
esac

# The index and the manifest counters are generated, so rebuild them before
# validating — otherwise the validator reports a stale index rather than the
# real problem.
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0

if ! build_output=$(yarn build:index 2>&1); then
  printf 'build:index failed (after editing %s):\n%s\n' "$file_path" "$build_output" >&2
  exit 2
fi

if ! validate_output=$(yarn validate:data 2>&1); then
  printf 'validate:data reported an ERROR (after editing %s). Fix before publishing:\n%s\n' \
    "$file_path" "$validate_output" >&2
  exit 2
fi

# The dev server reads public/data/, not data/, and `predev` only syncs once at
# startup — so an edit made while it runs is invisible in the browser until the
# two are synced again. Doing it here is what keeps "validated" and "what the
# app actually serves" the same thing.
yarn sync:data >/dev/null 2>&1

# docs/coverage.md and the README badges are generated from the same content,
# and guard-generated.sh blocks editing them by hand — so if this hook does not
# regenerate them, nothing does and they silently disagree with data/.
# A stale report is not a reason to interrupt the session, so this stays quiet.
yarn stats >/dev/null 2>&1

exit 0

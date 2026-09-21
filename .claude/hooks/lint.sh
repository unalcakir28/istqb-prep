#!/usr/bin/env bash
# PostToolUse hook: lint the app after a source edit.
#
# `typecheck.sh` covers the types and `format.sh` covers the formatting, but
# neither of them runs ESLint — that only happened in CI. The rules that matter
# here are the ones the compiler cannot see: `react-hooks/exhaustive-deps` on a
# React 19 codebase, and `react-refresh/only-export-components`. A missing
# dependency type-checks cleanly and then behaves wrong at runtime.
#
# Contract (same as the other hooks here):
#   - the payload arrives as JSON on stdin; the edited path is at
#     `tool_input.file_path`
#   - exit 2 sends stderr back to Claude so the error gets fixed now
set -uo pipefail

payload=$(cat)
file_path=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')
[[ -z $file_path ]] && exit 0

# Only the app's own TypeScript. eslint.config.js deliberately ignores
# scripts/, data/, schemas/ and docs/, so running this on those paths would
# lint nothing and cost a few seconds each time.
case $file_path in
  *src/*.ts | *src/*.tsx) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0

if ! lint_output=$(yarn lint 2>&1); then
  printf 'ESLint failed (after editing %s):\n%s\n' "$file_path" "$lint_output" >&2
  exit 2
fi

exit 0

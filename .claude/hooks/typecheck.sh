#!/usr/bin/env bash
# PostToolUse hook: type-check the app after a source edit.
#
# `validate-data.sh` only covers data/*.json, so a TypeScript edit used to
# reach CI unchecked — `format.sh` runs, but nothing looks at the types. React
# 19 plus a strict tsconfig makes that an easy way to push a red build.
#
# Contract (same as the other hooks here):
#   - the payload arrives as JSON on stdin; the edited path is at
#     `tool_input.file_path`
#   - exit 2 sends stderr back to Claude so the error gets fixed now
set -uo pipefail

payload=$(cat)
file_path=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')
[[ -z $file_path ]] && exit 0

# Only the app's own TypeScript. Config files, e2e specs and scripts are
# covered by their own project references through `tsc -b`, and running on a
# .json or .md edit would just be slow for nothing.
case $file_path in
  *src/*.ts | *src/*.tsx) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0

if ! typecheck_output=$(yarn typecheck 2>&1); then
  printf 'typecheck failed (after editing %s):\n%s\n' "$file_path" "$typecheck_output" >&2
  exit 2
fi

exit 0

#!/usr/bin/env bash
# PostToolUse hook: the UI locales must stay key-for-key identical.
#
# i18next falls back to English for a missing Turkish key, and the E2E specs
# read their labels from en.json, so a half-translated UI stays green
# everywhere. Nothing else catches it — validate:data only looks at data/.
#
# Contract: payload as JSON on stdin, edited path at `tool_input.file_path`,
# exit 2 reports the failure back to Claude.
set -uo pipefail

payload=$(cat)
file_path=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')
[[ -z $file_path ]] && exit 0

case $file_path in
  *src/lib/i18n/locales/*.json) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0

if ! i18n_output=$(yarn validate:i18n 2>&1); then
  printf 'The UI locales disagree (after editing %s):\n%s\n' "$file_path" "$i18n_output" >&2
  exit 2
fi

exit 0

#!/usr/bin/env bash
# PreToolUse guard: generated files are outputs, not sources.
#
# These are tracked in git, which makes them look editable. They are not: the
# next `yarn build:index` or `yarn stats` overwrites them, and until it runs the
# data set quietly disagrees with itself.
set -uo pipefail

payload=$(cat)
file_path=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')
[[ -z $file_path ]] && exit 0

case $file_path in
  */questions/index.json|questions/index.json)
    producer="yarn build:index" ;;
  */lessons/index.json|lessons/index.json)
    producer="yarn build:index" ;;
  */data/manifest.json|data/manifest.json)
    producer="yarn build:index" ;;
  */docs/coverage.md|docs/coverage.md)
    producer="yarn stats" ;;
  */public/data/*|public/data/*)
    producer="yarn sync:data" ;;
  */yarn.lock|yarn.lock)
    producer="yarn add <pkg>@<exact-version> (versions are pinned, no ^ or ~)" ;;
  *)
    exit 0 ;;
esac

printf 'Blocked: %s is a generated file, it is not edited by hand.\n\nEdit its source instead, then run:\n\n    %s\n\nFor README badges and docs/coverage.md: yarn stats\n' \
  "$file_path" "$producer" >&2
exit 2

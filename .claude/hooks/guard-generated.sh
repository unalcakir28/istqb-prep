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
  */data/manifest.json|data/manifest.json)
    producer="yarn build:index" ;;
  */docs/kapsama.md|docs/kapsama.md)
    producer="yarn stats" ;;
  */public/data/*|public/data/*)
    producer="yarn sync:data" ;;
  *)
    exit 0 ;;
esac

printf 'Engellendi: %s uretilen bir dosya, elle duzenlenmez.\n\nKaynagini duzenle, sonra calistir:\n\n    %s\n\nREADME rozetleri ve docs/kapsama.md icin: yarn stats\n' \
  "$file_path" "$producer" >&2
exit 2

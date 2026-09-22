#!/usr/bin/env bash
# PreToolUse guard: publishing content is not a hand edit.
#
# The schema already rejects `published` with an empty `reviewedBy`, but a hand
# written `reviewedBy` satisfies the schema while inventing the one record that
# says who actually checked the item. `--reviewer` is the only path that
# records a real reviewer and a real date.
#
# Covers questions AND lessons: check #18 refuses a published lesson with an
# empty reviewer, but nothing stopped a hand-written one until F2-12.
#
# PreToolUse: exit 2 blocks the call and sends stderr back to Claude.
set -uo pipefail

payload=$(cat)
file_path=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')
[[ -z $file_path ]] && exit 0

case $file_path in
  *data/*/questions/*.json) command='yarn publish:questions --reviewer "<name>" --chunk <chunk>' ;;
  *data/*/lessons/*.json)   command='yarn publish:lessons   --reviewer "<name>" --chunk <chunk>' ;;
  *) exit 0 ;;
esac

# Look at everything the tool is about to write, whatever the field is called
# (Edit uses new_string, Write uses content), but never at the path itself.
written=$(printf '%s' "$payload" | jq -r '
  .tool_input | del(.file_path) | [.. | strings] | join("\n")
')

if printf '%s' "$written" | grep -qE '"status"[[:space:]]*:[[:space:]]*"published"'; then
  cat >&2 <<MSG
Blocked: a status cannot be set to "published" by hand.

The publishing gate has exactly one path, because that is the only place that
records the reviewer:

    $command

If the content still needs verification, run the matching verifier agent
first. Editing this file to fix the text is fine — the only thing blocked is
setting the status field to published.
MSG
  exit 2
fi

exit 0

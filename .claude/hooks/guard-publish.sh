#!/usr/bin/env bash
# PreToolUse guard: publishing a question is not a hand edit.
#
# The schema already rejects `published` with an empty `reviewedBy`, but a hand
# written `reviewedBy` satisfies the schema while inventing the one record that
# says who actually checked the question. `yarn publish:questions --reviewer`
# is the only path that records a real reviewer and a real date.
#
# PreToolUse: exit 2 blocks the call and sends stderr back to Claude.
set -uo pipefail

payload=$(cat)
file_path=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty')
[[ -z $file_path ]] && exit 0

case $file_path in
  *data/*/questions/*.json) ;;
  *) exit 0 ;;
esac

# Look at everything the tool is about to write, whatever the field is called
# (Edit uses new_string, Write uses content), but never at the path itself.
written=$(printf '%s' "$payload" | jq -r '
  .tool_input | del(.file_path) | [.. | strings] | join("\n")
')

if printf '%s' "$written" | grep -qE '"status"[[:space:]]*:[[:space:]]*"published"'; then
  cat >&2 <<'MSG'
Engellendi: soru durumu elle "published" yapilamaz.

Yayin kapisi tek yoldan gecer, cunku gozden gecireni kaydeden tek yer orasi:

    yarn publish:questions --reviewer "<ad>" --chunk <parca>

Once sorularin dogrulanmasi gerekiyorsa question-verifier ajanini calistir.
Soru metnini duzeltmek icin bu dosyayi duzenlemek serbest — engellenen sey
yalnizca status alanini published yapmak.
MSG
  exit 2
fi

exit 0

---
paths:
  - "data/**"
  - "schemas/**"
  - "scripts/validate-data.ts"
---

# Content data (`data/`)

Question rules (sources, rationales, terminology, publishing gate) live in the
`question-authoring` skill. This file holds what the skill does not cover:
lessons, the validator's blind spots, and running writers in parallel.

## Keys and files

- **The LO code `FL-x.y.z` is the primary key.** It stays in English even in the
  Turkish syllabus; it is language-independent.
- **One lesson per learning objective, keyed by `objective`.** Lesson chunks are
  `chNN.json`, one per chapter. TR and EN must carry the same number of
  `keyPoints` and `commonMistakes` (check #17). Paragraphs are plain text; there
  is no Markdown renderer.
- If `meta.reviewedBy` is empty, `status` **cannot be `published`** — for a
  question (schema) or a lesson (check #18).

## Turkish terminology

`error/defect/failure` → **`insan hatası/hata/arıza`** (official TTB v4.0.1).
**`kusur` is not used** for `defect`; it is in `trForbidden`. It is not absent
from the syllabus, though: the TR syllabus writes _kusur maskelenmesi_ (§4.2.4)
and _kusur ortaya çıkarmaya yönelik saldırılar_ (§4.4.1, fault attacks). Our
content writes _hata maskelenmesi_ there, because `terms.json` is the authority —
see the correction box in `docs/07-content-authoring-guide.md §5`.

## What the validator does not catch

- **Check #13 and check #21 are two different sweeps.** #13 catches an
  untranslated **English** word in Turkish text; #21 catches a banned **Turkish**
  word (`term.trForbidden`). Neither covers the other, and #21 deliberately skips
  `kapsama`, `test durumu`, `teknik gözden geçirme` and `testware` because each
  is ordinary Turkish in another role. A term with no `trForbidden` list is
  invisible to both — `test uygulama` for _test implementation_ and
  `test yürütme` for _test execution_ shipped into published content that way.
- **Options render in authored order, for every candidate.** `shuffle` applies to
  the question order only. Three checks guard the cues this creates, each added
  after a human found what the previous ones missed: #14 counts how often each
  letter is the key, #22 measures whether the key is the longest option, #23
  looks for a rotation in the keyed letters. `ch01-b` ran `a → c → b → d` and
  `ch04-b` ran `a → b → c → d` across thirteen consecutive questions, both with
  perfectly even counts. When writing a batch, vary the sequence, not only the
  totals. D-03 in `TODO.md` is the real fix.

## Parallel writers

Run several writing subagents in parallel only when each owns its own file. They
all trigger the `validate-data.sh` PostToolUse hook, which rewrites the shared
`questions/index.json` and `manifest.json`, so one agent can be shown another's
half-written index. Give each a separate chunk file and a reserved id range, tell
them an error naming another chapter is not theirs, and re-run
`yarn build:index && yarn validate:data` centrally when they are all done.

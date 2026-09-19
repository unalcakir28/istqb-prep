---
name: question-authoring
description: The rules that a CTFL exam question in data/ must satisfy — where the facts come from, what a rationale has to contain, the Turkish terminology mapping, and the publishing gate. Load this before writing or editing any file under data/*/questions/, before changing a question's status, and before answering a question about how questions are written here.
user-invocable: false
---

# Writing questions for this bank

Applies to every file under `data/*/questions/`.

## Where facts come from

Never write an exam fact from memory. `data/ctfl-v4.0.1/objectives.json` holds
the 64 learning objectives and their K-levels, `meta.json` the exam mechanics,
`terms.json` the terminology, and `docs/03-istqb-referans.md` the verified facts
with sources. If a claim is not in those, it is not established — treat `null`
as "not established", which is not the same as `false`.

Official ISTQB and TTB sample questions are never copied, translated or
"adapted". Changing the numbers in an official question produces a derivative
work, not a new question. Every question is written from a learning objective.
There is no `official` value for `origin`.

## What a question must contain

Both languages, always. A question missing `tr` or `en` cannot be published.

A rationale for **every** option, in both languages. For a wrong option the
rationale says _what that option actually describes_ — the concept the candidate
confused it with. "Wrong, because the answer is C" is not a rationale, and this
per-option explanation is the product's main differentiator.

`syllabusVersion` on every item. Retired content gets `status: "retired"`; it is
never deleted.

Emphasis words go uppercase in the stem: `EN İYİ`, `HARİÇ`, `DEĞİLDİR`,
`HANGİ İKİSİ`.

Question ids follow `ctfl4-NNNN` and are never reused. At most 40 questions per
chunk file, and a chunk's filename never changes — CDN and PWA caches key on it.

## Turkish terminology

`error` = `insan hatası` · `defect` = `hata` · `failure` = `arıza`.

These three are not all "hata". The distinction is examined directly. The word
`kusur` is not used for _defect_; it appears only inside official phrases such
as "kusur ortaya çıkarmaya yönelik saldırılar". `terms.json` is the only source
of truth — 97 terms, aligned from the official keyword lists. Check it rather
than translating freshly.

After a list containing both `insan hataları` and `hatalar`, a bare "bu hataları"
is ambiguous; name which one is meant.

## Traps that have already cost us

Do not refer to an option by its letter in prose ("(c) şıkkı"). Answer positions
get rebalanced and the letters move, leaving the reference wrong. Check #15
treats this as an error.

Keep the keyed answer spread across positions. This bank once had 51 of 78
single-answer keys on "a", which means a candidate could pass by always picking
"a". Check #14 watches the ratio.

Do not let two questions on the same objective answer each other. Seen before:
an option that is the exact inverse of another question's key, and a distractor
that restates another question's key. Shared taxonomy wording (test level names,
review activity names) is fine — those do not give the answer away.

A question answered by reading one cell out of a table supplied in the stem is
not K3, whatever its objective says.

Boundary value analysis is the recurring arithmetic trap: the boundary value is
the value inside the partition, 2-value analysis adds its closest neighbour in
the adjacent partition, and 3-value analysis adds _both_ neighbours. For
`total >= 500` that is {499, 500, 501}; 498 is not a coverage item.

## The publishing gate

New questions are written with `status: "review"` and an empty
`meta.reviewedBy`. An empty `reviewedBy` makes `published` invalid, by schema.

Promotion happens only through `yarn publish:questions --reviewer "<name>"`,
which records who reviewed it. Editing the status by hand bypasses the only
record of who checked the question.

After editing any content file, run `yarn build:index && yarn validate:data`.
A PostToolUse hook does this automatically and reports failures, but the chain
still has to be green before the work is called done.

Verification before publishing is a separate job: dispatch the
`question-verifier` agent, which is read-only and adversarial by design.

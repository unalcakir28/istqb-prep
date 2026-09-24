---
name: new-questions
description: Deepens the question bank for the learning objectives that need it — pick the objectives, write the questions, verify them adversarially, then publish through the reviewer gate. Use when the pool needs more questions, when yarn stats shows objectives below target, or when the user asks for new questions.
disable-model-invocation: true
---

# new-questions

The chain from "this learning objective is thin" to a published question. Each
step has a gate; none of them is optional, and the last one has side effects,
so it is never run without the user saying so.

Arguments, all optional: a learning objective code (`FL-4.2.1`), a chunk name
(`ch04-a`), or a count. With none, start from `yarn stats`.

## 1. Pick the objectives

```bash
yarn stats            # rewrites docs/coverage.md, per-LO counts
yarn validate:data    # the question gaps are the #11 warnings only
```

The warnings are two different gaps, and only one of them is yours. Check #11
("not enough to generate exams without repetition") is the question gap; check
#20 ("no published lesson yet") is a **lesson** gap, which Track C fills and
which writing questions will not move. Filter accordingly:

```bash
yarn validate:data | grep "without repetition"
```

Phase 2 targets 200 questions, Phase 3 targets 300, at ≥3 per objective
(`docs/09-roadmap.md`). Prefer the objectives with the lowest count, and keep
the section balance from `data/ctfl-v4.0.1/exam-blueprint.json` in mind rather
than deepening one chapter alone.

Tell the user which objectives you picked before writing anything.

## 2. Write

Dispatch the **question-writer** agent, one objective at a time. It loads the
`question-authoring` rules itself; do not restate them into the prompt.

It writes into the chapter's chunk under `data/ctfl-v4.0.1/questions/`, at
status `review`. At most 40 questions per chunk — if the chunk is full, a new
one is created and the existing filenames stay untouched (CDN and PWA caches
key on them).

The PostToolUse hook reruns `build:index`, `validate:data` and `stats` after
each write. If it reports an error, fix it before continuing — do not queue
more writing on top of a broken data set.

## 3. Verify

Dispatch the **question-verifier** agent on the chunks that changed. It is
read-only and adversarial: keyed answer against the syllabus, one rationale per
option that says what the wrong option actually describes, honest K-level,
Turkish terminology from `terms.json`, the key-length cue, and answers
leaking between questions.

Every finding is either fixed or explicitly waived, with the reason, before
step 4. A question the verifier is unsure about does not get published.

If a factual claim is still in doubt, the **syllabus-fact-checker** agent
answers supported / contradicted / unverified from this repository's sources.

## 4. Publish — only on the user's word

Publishing records a reviewer, which is an assertion about a human. Ask who the
reviewer is; never invent one, and never infer it from git config.

```bash
yarn publish:questions --reviewer "<name>" --chunk <chunk> --dry-run
yarn publish:questions --reviewer "<name>" --chunk <chunk>
```

Run the dry run first and show its output. This script is the only path:
editing the status field by hand is blocked by a hook, because this is the one
place the reviewer gets recorded.

## 5. Close out

```bash
yarn build:index && yarn validate:data && yarn stats
```

Report: which objectives were deepened, how many questions were added, the new
error/warning counts, and which findings were waived and why.

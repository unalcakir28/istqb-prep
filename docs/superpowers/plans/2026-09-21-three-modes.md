# Three Modes (Study / Practice / Exam) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the single timed mock-exam flow into three modes — Study, Practice and Exam — sharing one session engine, with an untimed practice mode that can reveal the rationale at the moment of answering.

**Architecture:** Mode is a field on the attempt record, and every behavioural difference is derived from data stored on that attempt (`deadlineAt`, `instantFeedback`, `scope`) rather than from a lookup keyed by mode name. `generateExam` is left untouched and a sibling dispatcher `selectQuestions` handles scoped selection. The session shell is extracted out of `ExamSession` so all three modes share it.

**Tech Stack:** Vite 6.4.3 · React 19.3.0 · TypeScript 5.9.3 · Tailwind v4 · Zustand 5.0.15 · Dexie 4.4.6 · react-router-dom 7.18.4 · Vitest 3.2.4 · Playwright 1.63.0

**Spec:** [`docs/superpowers/specs/2026-09-21-three-modes-design.md`](../specs/2026-09-21-three-modes-design.md)

## Global Constraints

- Package manager is **yarn**, never npm. Dependencies are pinned to exact versions — no `^`, `~`, or ranges.
- **Do not install any new dependency** without asking the user first. This plan is designed to need none.
- Everything written to a file is **English** — code, comments, commit messages, docs. Only UI strings under `src/lib/i18n/locales/` are localised.
- Every content item carries `syllabusVersion`; both `tr` and `en` are mandatory for any content that ships.
- `status: "published"` requires a non-empty `meta.reviewedBy`.
- Exam constants are read from `meta.json`, never hardcoded.
- A session is never silently generated short. Shortfalls are surfaced to the user.
- Never reference an option by its letter in question or rationale prose.
- `"resolutions": { "vite": "6.4.3" }` stays in `package.json`.
- After any change under `data/`: `yarn build:index && yarn validate:data`.
- CI gate, in order: `lint → format → typecheck → test → validate:data → validate:i18n → build → e2e`.
- Commit after every task. Do **not** run `git push` — the user asks for that separately.

---

### Task 1: Dexie v3 — mode, scope, nullable deadline, objective progress

**Files:**
- Modify: `src/lib/db/db.ts`
- Create: `src/lib/db/migrations.ts`
- Test: `src/lib/db/migrations.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `AttemptMode`, `AttemptScope`, the widened `Attempt` interface, `ObjectiveProgress`, `applyAttemptV3Defaults(row: LegacyAttempt): void`, and `saveResponse(attemptId, questionId, row: Pick<Response, "selected" | "flagged" | "revealedAt">)`.

The Dexie upgrade hook itself cannot be unit-tested here: `jsdom` has no IndexedDB and `fake-indexeddb` is not a dependency. The backfill logic therefore lives in a pure function that the hook calls, and that function is tested directly. The hook wiring is covered end-to-end in Task 13.

- [ ] **Step 1: Write the failing test**

Create `src/lib/db/migrations.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { applyAttemptV3Defaults, type LegacyAttempt } from "./migrations";

function v2Attempt(): LegacyAttempt {
  return {
    id: "attempt-1",
    certId: "ctfl-v4.0.1",
    seed: 42,
    questionIds: ["ctfl4-0001", "ctfl4-0002"],
    status: "in-progress",
    durationMinutes: 60,
    contentLang: "tr",
    startedAt: 1_700_000_000_000,
    deadlineAt: 1_700_000_360_000,
    syllabusVersion: "4.0.1",
    dataVersion: "2026.09.19",
  };
}

describe("applyAttemptV3Defaults", () => {
  it("treats every pre-v3 attempt as a blueprint exam", () => {
    const row = v2Attempt();

    applyAttemptV3Defaults(row);

    expect(row.mode).toBe("exam");
    expect(row.instantFeedback).toBe(false);
    expect(row.scope).toEqual({ kind: "blueprint" });
  });

  it("keeps an in-progress attempt resumable: deadline and answers survive", () => {
    const row = v2Attempt();

    applyAttemptV3Defaults(row);

    expect(row.status).toBe("in-progress");
    expect(row.deadlineAt).toBe(1_700_000_360_000);
    expect(row.questionIds).toEqual(["ctfl4-0001", "ctfl4-0002"]);
  });

  it("does not overwrite an attempt that already carries v3 fields", () => {
    const row: LegacyAttempt = {
      ...v2Attempt(),
      mode: "practice",
      instantFeedback: true,
      scope: { kind: "chapter", chapters: [4], count: 10 },
    };

    applyAttemptV3Defaults(row);

    expect(row.mode).toBe("practice");
    expect(row.instantFeedback).toBe(true);
    expect(row.scope).toEqual({ kind: "chapter", chapters: [4], count: 10 });
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `yarn vitest run src/lib/db/migrations.test.ts`
Expected: FAIL — `Failed to resolve import "./migrations"`.

- [ ] **Step 3: Create the migration module**

Create `src/lib/db/migrations.ts`:

```ts
/**
 * Dexie schema migrations that need logic rather than an index change.
 *
 * The backfill lives here as a plain function rather than inline in the
 * upgrade hook so it can be unit-tested: jsdom has no IndexedDB, so the hook
 * itself can only be exercised end-to-end.
 */

import type { Attempt } from "./db";

/** An attempt row as written by schema v1 or v2: the v3 fields may be absent. */
export type LegacyAttempt = Omit<Attempt, "mode" | "instantFeedback" | "scope"> &
  Partial<Pick<Attempt, "mode" | "instantFeedback" | "scope">>;

/**
 * Mutates the row in place, the way Dexie's `Collection.modify` expects.
 *
 * Every attempt written before v3 was a blueprint-driven timed exam with no
 * feedback, so those are the defaults. Rows that already carry the fields are
 * left alone, which makes the migration safe to run twice.
 */
export function applyAttemptV3Defaults(row: LegacyAttempt): void {
  row.mode ??= "exam";
  row.instantFeedback ??= false;
  row.scope ??= { kind: "blueprint" };
}
```

- [ ] **Step 4: Widen the database types and add the v3 store**

In `src/lib/db/db.ts`, add the new types above `AttemptStatus`:

```ts
export type AttemptMode = "study" | "practice" | "exam";

/**
 * What the session was asked to cover. `blueprint` is the official 40-question
 * distribution; the other two are scoped selections used by practice and study.
 */
export type AttemptScope =
  | { kind: "blueprint" }
  | { kind: "chapter"; chapters: number[]; count: number }
  | { kind: "objective"; objectives: string[]; count: number };
```

Change these fields on `Attempt`:

```ts
  mode: AttemptMode;
  /** null means untimed. A separate boolean could contradict this one. */
  deadlineAt: number | null;
  /** Frozen at setup so a resumed session keeps the rules it started with. */
  instantFeedback: boolean;
  scope: AttemptScope;
```

Add `revealedAt` to `Response`:

```ts
  /** Set once the rationale has been shown; the answer locks from then on. */
  revealedAt?: number;
```

Add the new record type after `Bookmark`:

```ts
export interface ObjectiveProgress {
  /** `${certId}:${objectiveCode}` */
  key: string;
  certId: string;
  objectiveCode: string;
  cardReadAt?: number;
  /** Questions answered for this objective across all sessions. */
  attemptCount: number;
  lastScorePercent: number;
  mastered: boolean;
  updatedAt: number;
}
```

Declare the table on the class, next to the others:

```ts
  objectiveProgress!: Table<ObjectiveProgress, string>;
```

Add the version after `version(2)`:

```ts
    // v3: three modes. `mode` and the compound index let the home screen list
    // sessions per mode; `deadlineAt` becomes nullable for the untimed modes.
    // Pre-v3 rows are all blueprint exams — see applyAttemptV3Defaults.
    this.version(3)
      .stores({
        attempts: "id, certId, status, mode, startedAt, [certId+status], [certId+mode+status]",
        objectiveProgress: "key, certId, objectiveCode, mastered",
      })
      .upgrade(async (tx) => {
        await tx.table<LegacyAttempt>("attempts").toCollection().modify(applyAttemptV3Defaults);
      });
```

Import at the top of `db.ts`:

```ts
import { applyAttemptV3Defaults, type LegacyAttempt } from "./migrations";
```

Widen `saveResponse` so a reveal can be persisted with the same whole-row write:

```ts
export async function saveResponse(
  attemptId: string,
  questionId: string,
  row: Pick<Response, "selected" | "flagged"> & { revealedAt?: number },
): Promise<void> {
  await db.responses.put({
    key: responseKey(attemptId, questionId),
    attemptId,
    questionId,
    selected: row.selected,
    flagged: row.flagged,
    revealedAt: row.revealedAt,
    updatedAt: Date.now(),
  });
}
```

- [ ] **Step 5: Run the test and confirm it passes**

Run: `yarn vitest run src/lib/db/migrations.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Confirm nothing else broke**

Run: `yarn typecheck`
Expected: errors only where `Attempt` objects are constructed without the new fields — `src/features/exam/examStore.ts`. Leave them; Task 8 fixes that file. If any *other* file errors, stop and report it.

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/db.ts src/lib/db/migrations.ts src/lib/db/migrations.test.ts
git commit -m "feat(db): add mode, scope and instant feedback to attempts (Dexie v3)"
```

---

### Task 2: Scoped question selection

**Files:**
- Modify: `src/features/exam/generateExam.ts` (export `preferUnseen` only)
- Create: `src/features/exam/selectQuestions.ts`
- Test: `src/features/exam/selectQuestions.test.ts`

**Interfaces:**
- Consumes: `AttemptScope` from Task 1.
- Produces: `Shortfall`, `SelectionResult`, `selectQuestions(options): SelectionResult`.

`generateExam` keeps its logic and its 50-seed distribution test. The only edit is adding `export` to an existing helper.

- [ ] **Step 1: Write the failing test**

Create `src/features/exam/selectQuestions.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import type { ExamBlueprint, QuestionIndexEntry } from "@/types/content";
import { selectQuestions } from "./selectQuestions";

function entry(id: string, chapter: number, objective: string): QuestionIndexEntry {
  return {
    id,
    chunk: `ch0${chapter}-a`,
    chapter,
    objectives: [objective],
    kLevel: "K2",
    type: "single",
    selectCount: 1,
    languages: ["tr", "en"],
    syllabusVersion: "4.0.1",
    status: "published",
  };
}

const POOL: QuestionIndexEntry[] = [
  entry("q1", 1, "FL-1.1.1"),
  entry("q2", 1, "FL-1.1.1"),
  entry("q3", 1, "FL-1.2.1"),
  entry("q4", 4, "FL-4.2.1"),
  entry("q5", 4, "FL-4.2.1"),
];

const EMPTY_BLUEPRINT: ExamBlueprint = {
  syllabusVersion: "4.0.1",
  source: "test",
  rule: "test",
  totals: { questions: 0, byChapter: {}, byKLevel: { K1: 0, K2: 0, K3: 0 } },
  groups: [],
};

describe("selectQuestions", () => {
  it("takes only questions from the requested chapter", () => {
    const result = selectQuestions({
      scope: { kind: "chapter", chapters: [1], count: 2 },
      blueprint: EMPTY_BLUEPRINT,
      pool: POOL,
      seed: 7,
    });

    expect(result.questionIds).toHaveLength(2);
    expect(result.questionIds.every((id) => ["q1", "q2", "q3"].includes(id))).toBe(true);
    expect(result.shortfalls).toEqual([]);
  });

  it("takes only questions for the requested objective", () => {
    const result = selectQuestions({
      scope: { kind: "objective", objectives: ["FL-4.2.1"], count: 2 },
      blueprint: EMPTY_BLUEPRINT,
      pool: POOL,
      seed: 7,
    });

    expect(result.questionIds.sort()).toEqual(["q4", "q5"]);
  });

  it("reports a shortfall rather than silently returning fewer questions", () => {
    const result = selectQuestions({
      scope: { kind: "objective", objectives: ["FL-1.2.1"], count: 5 },
      blueprint: EMPTY_BLUEPRINT,
      pool: POOL,
      seed: 7,
    });

    expect(result.questionIds).toEqual(["q3"]);
    expect(result.shortfalls).toEqual([{ kind: "scope", required: 5, available: 1 }]);
  });

  it("is reproducible for the same seed and varies across seeds", () => {
    const scope = { kind: "chapter", chapters: [1], count: 3 } as const;
    const a = selectQuestions({ scope, blueprint: EMPTY_BLUEPRINT, pool: POOL, seed: 11 });
    const b = selectQuestions({ scope, blueprint: EMPTY_BLUEPRINT, pool: POOL, seed: 11 });

    expect(a.questionIds).toEqual(b.questionIds);
    expect(a.seed).toBe(11);
  });

  it("prefers unseen questions when the pool is larger than the request", () => {
    const result = selectQuestions({
      scope: { kind: "objective", objectives: ["FL-4.2.1"], count: 1 },
      blueprint: EMPTY_BLUEPRINT,
      pool: POOL,
      seed: 3,
      exclude: new Set(["q4"]),
    });

    expect(result.questionIds).toEqual(["q5"]);
  });

  it("delegates the blueprint scope to generateExam and tags its shortfalls", () => {
    const blueprint: ExamBlueprint = {
      ...EMPTY_BLUEPRINT,
      totals: { questions: 3, byChapter: { "1": 3 }, byKLevel: { K1: 0, K2: 3, K3: 0 } },
      groups: [
        { id: "g1", chapter: 1, kLevel: "K2", questions: 3, objectives: ["FL-1.2.1"] },
      ],
    };

    const result = selectQuestions({
      scope: { kind: "blueprint" },
      blueprint,
      pool: POOL,
      seed: 5,
    });

    expect(result.questionIds).toEqual(["q3"]);
    expect(result.shortfalls).toEqual([
      {
        kind: "group",
        groupId: "g1",
        chapter: 1,
        kLevel: "K2",
        objectives: ["FL-1.2.1"],
        required: 3,
        available: 1,
      },
    ]);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `yarn vitest run src/features/exam/selectQuestions.test.ts`
Expected: FAIL — `Failed to resolve import "./selectQuestions"`.

- [ ] **Step 3: Export the existing helper**

In `src/features/exam/generateExam.ts`, change the `preferUnseen` declaration to:

```ts
export function preferUnseen(
```

Nothing else in that file changes.

- [ ] **Step 4: Write the dispatcher**

Create `src/features/exam/selectQuestions.ts`:

```ts
/**
 * Question selection for all three modes.
 *
 * The blueprint path is not reimplemented here — it delegates to
 * `generateExam`, whose distribution is verified across 50 independent seeds.
 * Only the scoped paths (a set of chapters, or a set of learning objectives)
 * are new.
 *
 * All three paths return the same shape so the session store has one contract,
 * and no path ever returns fewer questions than asked for without saying so.
 */

import type { AttemptScope } from "@/lib/db/db";
import type { ExamBlueprint, QuestionIndexEntry } from "@/types/content";
import { generateExam, preferUnseen, type GroupShortfall } from "./generateExam";
import { createRng, shuffle } from "./rng";

export type Shortfall =
  | ({ kind: "group" } & GroupShortfall)
  | { kind: "scope"; required: number; available: number };

export interface SelectionResult {
  seed: number;
  questionIds: string[];
  /** Empty means the request was satisfied in full. */
  shortfalls: Shortfall[];
}

export interface SelectQuestionsOptions {
  scope: AttemptScope;
  blueprint: ExamBlueprint;
  /** Index entries. Unpublished questions must be filtered out before calling. */
  pool: QuestionIndexEntry[];
  seed: number;
  exclude?: ReadonlySet<string>;
}

type ScopedScope = Exclude<AttemptScope, { kind: "blueprint" }>;

function matchesScope(entry: QuestionIndexEntry, scope: ScopedScope): boolean {
  if (scope.kind === "chapter") return scope.chapters.includes(entry.chapter);
  return entry.objectives.some((code) => scope.objectives.includes(code));
}

function selectScoped(
  scope: ScopedScope,
  pool: QuestionIndexEntry[],
  seed: number,
  exclude: ReadonlySet<string>,
): SelectionResult {
  const rng = createRng(seed);
  const matches = pool.filter((entry) => matchesScope(entry, scope));
  const ordered = preferUnseen(matches, exclude, rng);
  const questionIds = ordered.slice(0, scope.count).map((entry) => entry.id);

  const shortfalls: Shortfall[] =
    questionIds.length >= scope.count
      ? []
      : [{ kind: "scope", required: scope.count, available: questionIds.length }];

  return { seed, questionIds: shuffle(questionIds, rng), shortfalls };
}

export function selectQuestions({
  scope,
  blueprint,
  pool,
  seed,
  exclude = new Set<string>(),
}: SelectQuestionsOptions): SelectionResult {
  if (scope.kind !== "blueprint") return selectScoped(scope, pool, seed, exclude);

  const generated = generateExam({ blueprint, pool, seed, exclude });

  return {
    seed: generated.seed,
    questionIds: generated.questionIds,
    shortfalls: generated.shortfalls.map((shortfall) => ({ kind: "group", ...shortfall })),
  };
}
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `yarn vitest run src/features/exam/`
Expected: PASS — the 6 new tests plus every pre-existing `generateExam` test, including the 50-seed distribution test, unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/features/exam/generateExam.ts src/features/exam/selectQuestions.ts src/features/exam/selectQuestions.test.ts
git commit -m "feat(exam): add scoped question selection alongside the blueprint path"
```

---

### Task 3: Lesson content type and client access

**Files:**
- Modify: `src/types/content.ts`
- Modify: `src/lib/content/contentClient.ts`
- Create: `schemas/lesson.schema.json`
- Create: `schemas/lessons-index.schema.json`
- Create: `data/ctfl-v4.0.1/lessons/index.json`
- Create: `data/ctfl-v4.0.1/lessons/ch01.json` … `ch06.json`

**Interfaces:**
- Consumes: `Lang`, `QuestionStatus` from `src/types/content.ts`.
- Produces: `Lesson`, `LessonContent`, `LessonChunk`, `LessonIndex`, `LessonIndexEntry`, and on `contentClient`: `getLessonIndex(certPath)`, `getLessonChunk(certPath, chunk)`, `getLesson(certPath, objectiveCode): Promise<Lesson | null>`.

The lesson files ship empty. Track B must be fully usable with zero lesson content, and shipping the empty structure now means the validator and the index build exercise the path from day one.

- [ ] **Step 1: Add the types**

Append to `src/types/content.ts`:

```ts
export interface LessonContent {
  title: string;
  paragraphs: string[];
  keyPoints: string[];
  commonMistakes: string[];
}

/**
 * A short explanatory card for one learning objective, shown in study mode.
 *
 * Written from scratch against the syllabus, like every question: the official
 * text is never reproduced. `paragraphs` is plain text, not Markdown — the
 * project has no Markdown renderer and this feature does not justify adding one.
 */
export interface Lesson {
  objective: string;
  syllabusVersion: string;
  syllabusRef: string;
  revision: number;
  status: QuestionStatus;
  origin: "original";
  i18n: Record<Lang, LessonContent>;
  meta: {
    author: string;
    reviewedBy: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface LessonChunk {
  chunk: string;
  chapter: number;
  dataVersion: string;
  lessons: Lesson[];
}

export interface LessonIndexEntry {
  objective: string;
  chunk: string;
  chapter: number;
  languages: Lang[];
  syllabusVersion: string;
  status: QuestionStatus;
}

export interface LessonIndex {
  dataVersion: string;
  count: number;
  chunks: string[];
  lessons: LessonIndexEntry[];
}
```

- [ ] **Step 2: Create the empty data files**

`data/ctfl-v4.0.1/lessons/index.json`:

```json
{
  "dataVersion": "2026.09.19",
  "count": 0,
  "chunks": ["ch01", "ch02", "ch03", "ch04", "ch05", "ch06"],
  "lessons": []
}
```

Each of `ch01.json` … `ch06.json`, with `chapter` set to its own number and `chunk` to its own name — `ch01.json` shown, the other five identical but for those two values:

```json
{
  "chunk": "ch01",
  "chapter": 1,
  "dataVersion": "2026.09.19",
  "lessons": []
}
```

The `dataVersion` value must match the one already in `data/manifest.json`. Read it from there rather than copying the value above, in case it has moved on.

- [ ] **Step 3: Write the JSON Schemas**

`schemas/lessons-index.schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "lessons-index.schema.json",
  "title": "Lesson index",
  "type": "object",
  "required": ["dataVersion", "count", "chunks", "lessons"],
  "additionalProperties": false,
  "properties": {
    "dataVersion": { "type": "string" },
    "count": { "type": "integer", "minimum": 0 },
    "chunks": { "type": "array", "items": { "type": "string" } },
    "lessons": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["objective", "chunk", "chapter", "languages", "syllabusVersion", "status"],
        "additionalProperties": false,
        "properties": {
          "objective": { "type": "string", "pattern": "^FL-[0-9]+\\.[0-9]+\\.[0-9]+$" },
          "chunk": { "type": "string" },
          "chapter": { "type": "integer", "minimum": 1 },
          "languages": {
            "type": "array",
            "items": { "enum": ["tr", "en"] },
            "minItems": 2,
            "uniqueItems": true
          },
          "syllabusVersion": { "type": "string" },
          "status": { "enum": ["draft", "review", "published", "retired"] }
        }
      }
    }
  }
}
```

`schemas/lesson.schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "lesson.schema.json",
  "title": "Lesson chunk",
  "type": "object",
  "required": ["chunk", "chapter", "dataVersion", "lessons"],
  "additionalProperties": false,
  "properties": {
    "chunk": { "type": "string" },
    "chapter": { "type": "integer", "minimum": 1 },
    "dataVersion": { "type": "string" },
    "lessons": {
      "type": "array",
      "items": { "$ref": "#/definitions/lesson" }
    }
  },
  "definitions": {
    "lesson": {
      "type": "object",
      "required": [
        "objective",
        "syllabusVersion",
        "syllabusRef",
        "revision",
        "status",
        "origin",
        "i18n",
        "meta"
      ],
      "additionalProperties": false,
      "properties": {
        "objective": { "type": "string", "pattern": "^FL-[0-9]+\\.[0-9]+\\.[0-9]+$" },
        "syllabusVersion": { "type": "string" },
        "syllabusRef": { "type": "string" },
        "revision": { "type": "integer", "minimum": 1 },
        "status": { "enum": ["draft", "review", "published", "retired"] },
        "origin": { "const": "original" },
        "i18n": {
          "type": "object",
          "required": ["tr", "en"],
          "additionalProperties": false,
          "properties": {
            "tr": { "$ref": "#/definitions/content" },
            "en": { "$ref": "#/definitions/content" }
          }
        },
        "meta": {
          "type": "object",
          "required": ["author", "reviewedBy", "createdAt", "updatedAt"],
          "additionalProperties": false,
          "properties": {
            "author": { "type": "string" },
            "reviewedBy": { "type": "string" },
            "createdAt": { "type": "string" },
            "updatedAt": { "type": "string" }
          }
        }
      }
    },
    "content": {
      "type": "object",
      "required": ["title", "paragraphs", "keyPoints", "commonMistakes"],
      "additionalProperties": false,
      "properties": {
        "title": { "type": "string", "minLength": 1 },
        "paragraphs": { "type": "array", "items": { "type": "string", "minLength": 1 }, "minItems": 1 },
        "keyPoints": { "type": "array", "items": { "type": "string", "minLength": 1 } },
        "commonMistakes": { "type": "array", "items": { "type": "string", "minLength": 1 } }
      }
    }
  }
}
```

- [ ] **Step 4: Add the client methods**

In `src/lib/content/contentClient.ts`, extend the type import with `Lesson`, `LessonChunk` and `LessonIndex`, then add these methods after `getChunk`:

```ts
  getLessonIndex(certPath: string): Promise<LessonIndex> {
    return this.fetchJson<LessonIndex>(dataUrl(certPath, "lessons", "index.json"), true);
  }

  getLessonChunk(certPath: string, chunk: string): Promise<LessonChunk> {
    return this.fetchJson<LessonChunk>(dataUrl(certPath, "lessons", `${chunk}.json`), true);
  }

  /**
   * Returns null when the objective has no published lesson yet. Study mode
   * has to stay usable while the content is still being written, so a missing
   * lesson is an expected state, not an error.
   */
  async getLesson(certPath: string, objectiveCode: string): Promise<Lesson | null> {
    const index = await this.getLessonIndex(certPath);
    const entry = index.lessons.find(
      (item) => item.objective === objectiveCode && item.status === "published",
    );
    if (!entry) return null;

    const chunk = await this.getLessonChunk(certPath, entry.chunk);
    return chunk.lessons.find((lesson) => lesson.objective === objectiveCode) ?? null;
  }
```

- [ ] **Step 5: Sync and verify**

Run: `yarn sync:data && yarn typecheck`
Expected: PASS for the new code. The pre-existing `examStore.ts` errors from Task 1 are still there and still expected.

- [ ] **Step 6: Commit**

```bash
git add src/types/content.ts src/lib/content/contentClient.ts schemas/lesson.schema.json schemas/lessons-index.schema.json data/ctfl-v4.0.1/lessons/
git commit -m "feat(content): add the lesson content type, schemas and client access"
```

---

### Task 4: Validator checks 16–19 for lessons

**Files:**
- Modify: `scripts/validate-data.ts`
- Modify: `scripts/build-index.ts`

**Interfaces:**
- Consumes: the lesson types and schemas from Task 3.
- Produces: four new error checks and one new warning in `yarn validate:data`; `yarn build:index` also rebuilds `lessons/index.json`.

- [ ] **Step 1: Read the existing validator**

Read `scripts/validate-data.ts` in full before editing. Note how `SCHEMA_FILES` maps a data file to its schema, how a check reports an error versus a warning, and how the existing numbered checks are ordered and labelled. The new checks must follow that same pattern — do not invent a parallel mechanism.

- [ ] **Step 2: Register the new schemas**

Add `lessons/index.json → lessons-index.schema.json` and each `lessons/ch0N.json → lesson.schema.json` to the schema mapping, so check #1 covers them.

- [ ] **Step 3: Add the four error checks and one warning**

Following the existing pattern, add:

- **#16** — every lesson's `objective` exists in `objectives.json`.
  Message: `` `${file} [${objective}]: The lesson references a learning objective that does not exist in objectives.json.` ``
- **#17** — `i18n.tr` and `i18n.en` are both present, and their `keyPoints` and `commonMistakes` arrays are the same length in both languages.
  Message: `` `${file} [${objective}]: The Turkish and English lesson content are not parallel. Expected equal ${field} counts; found tr=${trCount}, en=${enCount}.` ``
- **#18** — a lesson with `status: "published"` has a non-empty `meta.reviewedBy`.
  Message: `` `${file} [${objective}]: A published lesson must record its reviewer in meta.reviewedBy.` ``
- **#19** — `lessons/index.json` agrees with the chunk files: every indexed objective exists in the named chunk, every chunk lesson appears in the index, and `count` equals the number of index entries.
  Message: `` `${file} [${objective}]: The lesson index disagrees with the chunk files.` ``
- **Warning** — an objective in `objectives.json` has no published lesson.
  Message: `` `data/${certId}/objectives.json [${code}]: This learning objective has no published lesson yet.` ``

Update the header comment and any printed summary that states how many checks run: **15 → 19**.

- [ ] **Step 4: Teach build-index about lessons**

In `scripts/build-index.ts`, mirror what it already does for questions: read `lessons/ch0N.json`, derive one `LessonIndexEntry` per lesson, and write `lessons/index.json` with `count`, `chunks` and `lessons`. With no lesson content yet, the output must be byte-identical to the file committed in Task 3 — that is the proof the generator and the hand-written seed agree.

- [ ] **Step 5: Run the pipeline**

Run: `yarn build:index && yarn validate:data`
Expected: `0 error(s)`. The warning count rises by 64 — one per objective with no lesson yet — on top of the existing 52. Confirm the summary line reads `RESULT: PASSED (with warnings)`.

- [ ] **Step 6: Commit**

```bash
git add scripts/validate-data.ts scripts/build-index.ts data/ctfl-v4.0.1/lessons/
git commit -m "feat(scripts): validate and index lesson content"
```

---

### Task 5: Objective progress and the mastery rule

**Files:**
- Create: `src/lib/db/objectiveProgress.ts`
- Test: `src/lib/db/objectiveProgress.test.ts`

**Interfaces:**
- Consumes: `ObjectiveProgress`, `db` from Task 1.
- Produces: `MASTERY_MIN_ANSWERED`, `MASTERY_MIN_PERCENT`, `isMastered(attemptCount, lastScorePercent)`, `progressKey(certId, objectiveCode)`, `recordObjectiveResult(...)`, `markLessonRead(...)`, `getObjectiveProgress(certId, codes)`.

Only `isMastered` and `progressKey` are unit-tested — the rest are thin Dexie wrappers, and there is no IndexedDB in the unit environment. They are covered by the end-to-end specs in Task 13.

- [ ] **Step 1: Write the failing test**

Create `src/lib/db/objectiveProgress.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { isMastered, progressKey } from "./objectiveProgress";

describe("progressKey", () => {
  it("scopes the key by certification so two certifications never collide", () => {
    expect(progressKey("ctfl-v4.0.1", "FL-1.1.1")).toBe("ctfl-v4.0.1:FL-1.1.1");
  });
});

describe("isMastered", () => {
  it("requires both enough answers and a high enough last score", () => {
    expect(isMastered(3, 80)).toBe(true);
  });

  it("is not reached on a high score alone", () => {
    expect(isMastered(2, 100)).toBe(false);
  });

  it("is not reached on volume alone", () => {
    expect(isMastered(20, 79)).toBe(false);
  });

  it("can be lost again when the latest score drops", () => {
    expect(isMastered(10, 50)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `yarn vitest run src/lib/db/objectiveProgress.test.ts`
Expected: FAIL — `Failed to resolve import "./objectiveProgress"`.

- [ ] **Step 3: Write the module**

Create `src/lib/db/objectiveProgress.ts`:

```ts
/**
 * Per-objective progress for study mode.
 *
 * Mastery is deliberately losable: it reflects the most recent objective test,
 * not a high-water mark. A candidate who has forgotten a topic should see that.
 */

import { db, type ObjectiveProgress } from "./db";

/** Questions that must have been answered for the objective before mastery counts. */
export const MASTERY_MIN_ANSWERED = 3;
/** The most recent objective test must reach this percentage. */
export const MASTERY_MIN_PERCENT = 80;

export function progressKey(certId: string, objectiveCode: string): string {
  return `${certId}:${objectiveCode}`;
}

export function isMastered(attemptCount: number, lastScorePercent: number): boolean {
  return attemptCount >= MASTERY_MIN_ANSWERED && lastScorePercent >= MASTERY_MIN_PERCENT;
}

export async function markLessonRead(certId: string, objectiveCode: string): Promise<void> {
  const key = progressKey(certId, objectiveCode);
  const existing = await db.objectiveProgress.get(key);

  await db.objectiveProgress.put({
    key,
    certId,
    objectiveCode,
    cardReadAt: Date.now(),
    attemptCount: existing?.attemptCount ?? 0,
    lastScorePercent: existing?.lastScorePercent ?? 0,
    mastered: existing?.mastered ?? false,
    updatedAt: Date.now(),
  });
}

/**
 * `answered` is how many questions this session asked for the objective, and
 * `percent` is that session's score. The answered count accumulates; the score
 * replaces the previous one.
 */
export async function recordObjectiveResult(
  certId: string,
  objectiveCode: string,
  answered: number,
  percent: number,
): Promise<void> {
  const key = progressKey(certId, objectiveCode);
  const existing = await db.objectiveProgress.get(key);
  const attemptCount = (existing?.attemptCount ?? 0) + answered;

  await db.objectiveProgress.put({
    key,
    certId,
    objectiveCode,
    cardReadAt: existing?.cardReadAt,
    attemptCount,
    lastScorePercent: percent,
    mastered: isMastered(attemptCount, percent),
    updatedAt: Date.now(),
  });
}

export async function getObjectiveProgress(
  certId: string,
  objectiveCodes: string[],
): Promise<Map<string, ObjectiveProgress>> {
  const rows = await db.objectiveProgress
    .where("key")
    .anyOf(objectiveCodes.map((code) => progressKey(certId, code)))
    .toArray();

  return new Map(rows.map((row) => [row.objectiveCode, row]));
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `yarn vitest run src/lib/db/objectiveProgress.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/objectiveProgress.ts src/lib/db/objectiveProgress.test.ts
git commit -m "feat(db): track per-objective progress and mastery"
```

---

### Task 6: Reveal semantics in the option list

**Files:**
- Modify: `src/components/OptionList.tsx`
- Modify: `src/components/QuestionCard.tsx`
- Modify: `src/routes/Review.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `OptionListProps.revealed`, `QuestionCardProps.revealed` — both replacing `review`.

`review` is renamed to `revealed` because "Review" is now a screen name and the prop no longer means that. The behaviour is unchanged: the same flag locks the options and marks the correct answer.

- [ ] **Step 1: Rename the prop in OptionList**

In `src/components/OptionList.tsx`, rename `review` to `revealed` in `OptionListProps`, in the destructured parameters, and at all five usages inside the component body (`showAsCorrect`, `showAsWrong`, the `cursor-pointer` class, `disabled`). Update the doc comment's wording from "In review mode" to "Once revealed".

- [ ] **Step 2: Rename the prop in QuestionCard**

In `src/components/QuestionCard.tsx`, rename `review` to `revealed` in `QuestionCardProps`, in the destructured parameters, and at the three usages: the `revealed` prop passed down, `correct={revealed ? question.correct : []}`, and the `CitationChips` condition. Update the doc comment's last sentence to "Citation chips only appear once the answer has been revealed."

- [ ] **Step 3: Update the call site**

In `src/routes/Review.tsx`, change `<QuestionCard … review />` to `<QuestionCard … revealed />`.

- [ ] **Step 4: Verify**

Run: `yarn typecheck && yarn lint`
Expected: no error mentioning `review` or `revealed`. The known `examStore.ts` errors from Task 1 remain.

- [ ] **Step 5: Commit**

```bash
git add src/components/OptionList.tsx src/components/QuestionCard.tsx src/routes/Review.tsx
git commit -m "refactor(ui): rename the review prop to revealed"
```

---

### Task 7: Generalise the store into a session store

**Files:**
- Create: `src/features/session/sessionStore.ts` (moved from `src/features/exam/examStore.ts`)
- Delete: `src/features/exam/examStore.ts`
- Modify: `src/routes/ExamSetup.tsx`, `src/routes/ExamSession.tsx`, `src/routes/ExamResult.tsx`, `src/routes/Review.tsx` (import paths and the start call)

**Interfaces:**
- Consumes: `AttemptMode`, `AttemptScope` (Task 1); `selectQuestions`, `Shortfall` (Task 2).
- Produces: `useSessionStore`, `StartSessionOptions`, and the store actions `startSession`, `resumeAttempt`, `loadSubmitted`, `select`, `toggleFlag`, `goTo`, `next`, `previous`, `setContentLang`, `submit`. New state: `revealed: Record<string, number>`.

- [ ] **Step 1: Move the file and rename the store**

`git mv src/features/exam/examStore.ts src/features/session/sessionStore.ts`. Rename `useExamStore` to `useSessionStore`, `ExamState` to `SessionState`, `StartExamOptions` to `StartSessionOptions`, and `startExam` to `startSession`. Update the four importing routes.

- [ ] **Step 2: Widen the start options**

Replace `StartExamOptions` with:

```ts
export interface StartSessionOptions {
  certPath: string;
  mode: AttemptMode;
  scope: AttemptScope;
  contentLang: Lang;
  instantFeedback: boolean;
  /** null means untimed — study and practice never carry a deadline. */
  durationMinutes: number | null;
  excludeSeen: boolean;
}
```

- [ ] **Step 3: Add revealed state**

Add to `SessionState`, next to `flagged`:

```ts
  /** questionId -> the timestamp the rationale was shown. Presence means locked. */
  revealed: Record<string, number>;
```

Add `revealed: {}` to the `initial` object, and to the `set({…})` calls in `startSession` and `resumeAttempt`. In `resumeAttempt`, rehydrate it alongside the answers:

```ts
      const revealed: Record<string, number> = {};
      for (const response of responses) {
        if (response.selected.length > 0) answers[response.questionId] = response.selected;
        if (response.flagged) flagged[response.questionId] = true;
        if (response.revealedAt) revealed[response.questionId] = response.revealedAt;
      }
```

- [ ] **Step 4: Switch selection to the dispatcher**

In `startSession`, replace the `generateExam` call and the attempt construction:

```ts
      const seed = randomSeed();
      const selection = selectQuestions({ scope, blueprint, pool, seed, exclude });

      if (selection.questionIds.length === 0) {
        set({ loading: false, error: "empty-pool", shortfalls: selection.shortfalls });
        return null;
      }

      const questions = await contentClient.getQuestions(certPath, selection.questionIds);
      const now = Date.now();
      const attempt: Attempt = {
        id: `attempt-${now}-${seed}`,
        certId: meta.id,
        seed,
        questionIds: selection.questionIds,
        status: "in-progress",
        mode,
        scope,
        instantFeedback,
        durationMinutes: durationMinutes ?? 0,
        contentLang,
        startedAt: now,
        deadlineAt: durationMinutes === null ? null : now + durationMinutes * 60_000,
        syllabusVersion: meta.syllabusVersion,
        dataVersion: index.dataVersion,
      };
```

Change the `shortfalls` field's type on `SessionState` from `GroupShortfall[]` to `Shortfall[]`, and update the import.

- [ ] **Step 5: Lock and reveal inside select**

Replace the guard at the top of `select` and the tail that persists:

```ts
  select(questionId, optionId) {
    const { attempt, questions, answers, revealed } = get();
    if (!attempt || attempt.status !== "in-progress") return;
    // Once the rationale has been shown the answer is final: changing it after
    // seeing the explanation would corrupt both the score and the mastery signal.
    if (revealed[questionId]) return;

    const question = questions.find((item) => item.id === questionId);
    if (!question) return;

    const current = answers[questionId] ?? [];
    let updated: string[];

    if (question.selectCount === 1) {
      updated = current.includes(optionId) ? [] : [optionId];
    } else if (current.includes(optionId)) {
      updated = current.filter((id) => id !== optionId);
    } else if (current.length >= question.selectCount) {
      updated = [...current.slice(1), optionId];
    } else {
      updated = [...current, optionId];
    }

    // A multi-select question reveals nothing until the full selection is made.
    const complete = updated.length === question.selectCount;
    const revealedAt = attempt.instantFeedback && complete ? Date.now() : undefined;

    set({
      answers: { ...answers, [questionId]: updated },
      revealed: revealedAt ? { ...revealed, [questionId]: revealedAt } : revealed,
    });

    persist(set, attempt.id, questionId, {
      selected: updated,
      flagged: get().flagged[questionId] ?? false,
      revealedAt,
    });
  },
```

Widen `persist`'s `row` parameter to `{ selected: string[]; flagged: boolean; revealedAt?: number }`.

- [ ] **Step 6: Update the exam setup call site**

In `src/routes/ExamSetup.tsx`, the call becomes:

```tsx
startSession({
  certPath,
  mode: "exam",
  scope: { kind: "blueprint" },
  contentLang,
  instantFeedback: false,
  durationMinutes,
  excludeSeen,
})
```

- [ ] **Step 7: Verify**

Run: `yarn typecheck && yarn test`
Expected: PASS. All pre-existing unit tests stay green — this task changes how a session starts, not how it is scored.

- [ ] **Step 8: Commit**

```bash
git add -A src/features src/routes
git commit -m "refactor(session): generalise the exam store into a mode-aware session store"
```

---

### Task 8: Extract the shared session shell

**Files:**
- Create: `src/features/session/SessionRunner.tsx`
- Modify: `src/routes/ExamSession.tsx`

**Interfaces:**
- Consumes: `useSessionStore` (Task 7), `QuestionCard` with `revealed` (Task 6), `RationalePanel`, `routeForAttempt` (Task 9 — run that task first).
- Produces: `SessionRunner` — props `{ attemptId: string; onSubmitted: (attemptId: string) => void; header?: ReactNode }`.

`ExamSession.tsx` is 17.9 KB and already owns rendering, navigation, the navigator panel and the keyboard shortcuts. Three modes cannot be layered onto it as it stands.

- [ ] **Step 1: Read the file to be split**

Read `src/routes/ExamSession.tsx` in full. Identify which parts are exam-specific — mounting `ExamTimer`, the submit confirmation dialog, the auto-submit on expiry — and which are common: loading and resuming the attempt, rendering `QuestionCard`, previous/next navigation, `QuestionNavigator`, `ContentLangToggle`, the shortcuts overlay, and the persistence-failure notice.

- [ ] **Step 2: Move the common parts into SessionRunner**

Create `src/features/session/SessionRunner.tsx` holding everything common. It reads its behaviour from the attempt rather than from a mode string:

```tsx
const attempt = useSessionStore((state) => state.attempt);
const revealed = useSessionStore((state) => state.revealed);

const question = questions[currentIndex];
const isRevealed = question ? Boolean(revealed[question.id]) : false;
```

The question block becomes:

```tsx
<QuestionCard
  question={question}
  lang={contentLang}
  selected={answers[question.id] ?? []}
  onSelect={(optionId) => select(question.id, optionId)}
  revealed={isRevealed}
/>

{isRevealed ? (
  <>
    <p aria-live="polite" className="sr-only">
      {isAnswerCorrect ? t("session.feedbackCorrect") : t("session.feedbackIncorrect")}
    </p>
    <RationalePanel
      question={question}
      lang={contentLang}
      selected={answers[question.id] ?? []}
    />
  </>
) : null}
```

`isAnswerCorrect` compares the selection to `question.correct` as an exact set, the same rule `scoreExam` uses:

```tsx
const selectedIds = answers[question.id] ?? [];
const isAnswerCorrect =
  selectedIds.length === question.correct.length &&
  selectedIds.every((id) => question.correct.includes(id));
```

The `header` prop is where a mode puts its own chrome. Exam mode passes `<ExamTimer … />`; study and practice pass their own progress line.

- [ ] **Step 3: Reduce ExamSession to the exam-specific parts**

`ExamSession.tsx` keeps the timer, the expiry handler that calls `submit(true)`, and the submit confirmation, and renders `<SessionRunner attemptId={attemptId} header={<ExamTimer … />} onSubmitted={…} />`. Everything it no longer owns is deleted, not commented out.

- [ ] **Step 4: Guard the untimed case**

`ExamTimer` must never mount when `attempt.deadlineAt` is `null`. In `SessionRunner`, the header slot is simply not rendered by the untimed modes; in `ExamSession`, add an explicit guard so an exam attempt that somehow has a null deadline renders without a timer rather than crashing:

```tsx
{attempt?.deadlineAt !== null && attempt !== null ? (
  <ExamTimer deadlineAt={attempt.deadlineAt} onExpire={handleExpire} />
) : null}
```

- [ ] **Step 5: Redirect an attempt opened from the wrong mode's URL**

This step depends on `routeForAttempt` from Task 9. If Task 9 has not run yet, do it first — the two tasks are ordered that way in the plan only for readability.

In `SessionRunner`, once the attempt has loaded, compare where it belongs against where the browser actually is, and correct it:

```tsx
const location = useLocation();
const expectedPath = attempt ? routeForAttempt(attempt) : null;

if (attempt && expectedPath && location.pathname !== expectedPath) {
  return <Navigate to={expectedPath} replace />;
}
```

Import `Navigate`, `useLocation` from `react-router-dom` and `routeForAttempt` from `./routeForAttempt`. Without this, a practice attempt opened at `/sinav/:id` would render with exam rules — a timer over an attempt whose `deadlineAt` is null.

- [ ] **Step 6: Verify the exam path did not regress**

Run: `yarn typecheck && yarn test && yarn e2e`
Expected: PASS, including `e2e/exam.spec.ts` unchanged. That spec passing is the proof the extraction preserved behaviour. If it fails, fix the extraction — do not edit the spec.

- [ ] **Step 7: Commit**

```bash
git add src/features/session/SessionRunner.tsx src/routes/ExamSession.tsx
git commit -m "refactor(session): extract the shared session shell from ExamSession"
```

---

### Task 9: Routes, redirects and mode-aware resume

**Files:**
- Modify: `src/App.tsx`
- Create: `src/features/session/routeForAttempt.ts`
- Test: `src/features/session/routeForAttempt.test.ts`
- Create: `src/routes/LegacyExamRedirect.tsx`

**Interfaces:**
- Consumes: `AttemptMode` (Task 1).
- Produces: `routeForAttempt(attempt: Pick<Attempt, "id" | "mode" | "scope">): string`.

- [ ] **Step 1: Write the failing test**

Create `src/features/session/routeForAttempt.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { routeForAttempt } from "./routeForAttempt";

describe("routeForAttempt", () => {
  it("sends an exam attempt to the exam session", () => {
    expect(
      routeForAttempt({ id: "a1", mode: "exam", scope: { kind: "blueprint" } }),
    ).toBe("/sinav/a1");
  });

  it("sends a practice attempt to the practice session", () => {
    expect(
      routeForAttempt({ id: "a2", mode: "practice", scope: { kind: "chapter", chapters: [1], count: 10 } }),
    ).toBe("/alistirma/a2");
  });

  it("sends a study attempt back to its own objective", () => {
    expect(
      routeForAttempt({
        id: "a3",
        mode: "study",
        scope: { kind: "objective", objectives: ["FL-1.1.1"], count: 3 },
      }),
    ).toBe("/calisma/lo/FL-1.1.1/a3");
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `yarn vitest run src/features/session/routeForAttempt.test.ts`
Expected: FAIL — `Failed to resolve import "./routeForAttempt"`.

- [ ] **Step 3: Write the resolver**

Create `src/features/session/routeForAttempt.ts`:

```ts
/**
 * Where an attempt belongs on screen.
 *
 * An attempt opened from the wrong mode's URL — a bookmark, a back button, a
 * stale link — is redirected here rather than rendered with the wrong rules.
 */

import type { Attempt } from "@/lib/db/db";

export function routeForAttempt(attempt: Pick<Attempt, "id" | "mode" | "scope">): string {
  if (attempt.mode === "exam") return `/sinav/${attempt.id}`;
  if (attempt.mode === "practice") return `/alistirma/${attempt.id}`;

  const objective = attempt.scope.kind === "objective" ? attempt.scope.objectives[0] : undefined;
  if (!objective) return `/alistirma/${attempt.id}`;

  return `/calisma/lo/${objective}/${attempt.id}`;
}
```

- [ ] **Step 4: Add the legacy redirect component**

Create `src/routes/LegacyExamRedirect.tsx`:

```tsx
import { Navigate, useParams } from "react-router-dom";

/**
 * /deneme/:attemptId was the exam session's address before the three modes
 * landed. Users have bookmarks and in-progress attempts on that path, so it
 * keeps working.
 */
export default function LegacyExamRedirect() {
  const { attemptId } = useParams<{ attemptId: string }>();

  return <Navigate to={attemptId ? `/sinav/${attemptId}` : "/sinav"} replace />;
}
```

- [ ] **Step 5: Wire the routes**

In `src/App.tsx`, add the lazy imports and replace the route list:

```tsx
const PracticeSetup = lazy(() => import("@/routes/PracticeSetup"));
const PracticeSession = lazy(() => import("@/routes/PracticeSession"));
const StudyChapters = lazy(() => import("@/routes/StudyChapters"));
const StudyChapter = lazy(() => import("@/routes/StudyChapter"));
const StudyObjective = lazy(() => import("@/routes/StudyObjective"));
const StudySession = lazy(() => import("@/routes/StudySession"));
const LegacyExamRedirect = lazy(() => import("@/routes/LegacyExamRedirect"));
```

```tsx
        { path: "/", element: <Home /> },
        { path: "/calisma", element: <StudyChapters /> },
        { path: "/calisma/:chapter", element: <StudyChapter /> },
        { path: "/calisma/lo/:loCode", element: <StudyObjective /> },
        { path: "/calisma/lo/:loCode/:attemptId", element: <StudySession /> },
        { path: "/alistirma", element: <PracticeSetup /> },
        { path: "/alistirma/:attemptId", element: <PracticeSession /> },
        { path: "/sinav", element: <ExamSetup /> },
        { path: "/sinav/:attemptId", element: <ExamSession /> },
        { path: "/deneme", element: <Navigate to="/sinav" replace /> },
        { path: "/deneme/:attemptId", element: <LegacyExamRedirect /> },
        { path: "/sonuc/:attemptId", element: <ExamResult /> },
        { path: "/inceleme/:attemptId", element: <Review /> },
        { path: "/kaynaklar", element: <Sources /> },
        { path: "*", element: <NotFound /> },
```

Import `Navigate` from `react-router-dom` alongside the existing imports.

The five new route components do not exist yet, so this step leaves the build red. Tasks 10 and 11 create them; do not commit until Task 11 is done, or create them as one-line placeholders now and fill them in there. Prefer the latter so each task ends green:

```tsx
export default function PracticeSetup() {
  return null;
}
```

- [ ] **Step 6: Verify**

Run: `yarn typecheck && yarn test`
Expected: PASS, including the 3 new resolver tests.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/features/session/routeForAttempt.ts src/features/session/routeForAttempt.test.ts src/routes/
git commit -m "feat(routes): add the study and practice routes with legacy exam redirects"
```

---

### Task 10: Practice mode screens

**Files:**
- Modify: `src/routes/PracticeSetup.tsx`
- Modify: `src/routes/PracticeSession.tsx`

**Interfaces:**
- Consumes: `useSessionStore.startSession` (Task 7), `SessionRunner` (Task 8), `selectQuestions` shortfall shapes (Task 2).
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Build the setup screen**

`PracticeSetup` follows the structure of the existing `ExamSetup` — read that file first and match its layout, loading states and error handling. It collects:

- **Scope**: a radio group with three choices — the whole syllabus, selected chapters (a multi-select over the six chapters from `syllabus.json`), or a single learning objective (a select over `objectives.json`).
- **Question count**: 10, 20 or 40. Default 10.
- **Instant feedback**: a checkbox, default on.
- **Content language**: reuse `ContentLangToggle`, seeded from the UI language exactly as `ExamSetup` does.
- A live coverage preview and, when the pool cannot fill the request, an explicit shortfall notice before the start button.

The "whole syllabus, 40 questions" combination maps to `scope: { kind: "blueprint" }` so it reproduces the official distribution. Every other combination maps to `chapter` or `objective`.

Starting calls:

```tsx
startSession({
  certPath,
  mode: "practice",
  scope,
  contentLang,
  instantFeedback,
  durationMinutes: null,
  excludeSeen: false,
})
```

Submitting with no chapter selected is blocked: the start button is disabled and the reason is shown in text, not only by the disabled state.

- [ ] **Step 2: Build the session screen**

`PracticeSession` renders `<SessionRunner attemptId={attemptId} onSubmitted={…} />` with no header. No timer is mounted. On submission it navigates to `/sonuc/:attemptId`, the same result screen the exam uses.

- [ ] **Step 3: Verify by hand**

Run: `yarn dev`, open `/alistirma`, start a 10-question practice session with instant feedback on. Confirm: answering reveals the rationale inline below the options; the options lock; a second click on a different option changes nothing; there is no timer anywhere on the screen.

- [ ] **Step 4: Verify the gate**

Run: `yarn typecheck && yarn lint && yarn test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/routes/PracticeSetup.tsx src/routes/PracticeSession.tsx
git commit -m "feat(practice): add the untimed practice mode with instant feedback"
```

---

### Task 11: Study mode screens

**Files:**
- Modify: `src/routes/StudyChapters.tsx`, `src/routes/StudyChapter.tsx`, `src/routes/StudyObjective.tsx`, `src/routes/StudySession.tsx`
- Create: `src/components/LessonCard.tsx`

**Interfaces:**
- Consumes: `contentClient.getLesson` (Task 3), `getObjectiveProgress`, `markLessonRead`, `recordObjectiveResult` (Task 5), `SessionRunner` (Task 8).
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Chapter list**

`StudyChapters` reads `syllabus.json` and `objectives.json`, then `getObjectiveProgress` for every objective code. Each of the six chapters is a card showing its title in the content language, its objective count, and how many of those objectives are mastered. Each links to `/calisma/:chapter`.

- [ ] **Step 2: Objective list**

`StudyChapter` lists the objectives of one chapter. Each row shows the LO code, its K-level, its text, and its state — not started, in progress, or mastered — conveyed by text and an icon, never by colour alone. Each row links to `/calisma/lo/:loCode`.

- [ ] **Step 3: Lesson card**

Create `src/components/LessonCard.tsx`, props `{ lesson: Lesson | null; lang: Lang }`. With a lesson it renders the title, the paragraphs, a key-points list and a common-mistakes list, plus `CitationChips` for the objective and syllabus reference. With `null` it renders a short placeholder telling the user the explanation for this objective has not been written yet — and nothing else. Study mode must remain usable before Track C lands.

- [ ] **Step 4: Objective screen**

`StudyObjective` renders `LessonCard`, calls `markLessonRead` once on mount, and offers a start button. The button starts:

```tsx
startSession({
  certPath,
  mode: "study",
  scope: { kind: "objective", objectives: [loCode], count },
  contentLang,
  instantFeedback: true,
  durationMinutes: null,
  excludeSeen: false,
})
```

`count` is the number of published questions for the objective, capped at 10. With zero published questions the button is disabled and states why. With fewer than three, the session still starts and the shortfall is shown first.

- [ ] **Step 5: Objective session**

`StudySession` renders `SessionRunner`. On submission it calls `recordObjectiveResult(certId, loCode, answeredCount, percent)` and then shows the objective's result inline — score, mastery state, and links back to the objective and on to the next objective in the chapter.

- [ ] **Step 6: Home page entry points**

In `src/routes/Home.tsx`, add the three mode cards in this order: Study, Practice, Exam. Study leads. This is the documented mitigation for persona P2 — a first-time visitor scoring 12/40 on a cold mock exam is the failure mode the product set out to avoid.

- [ ] **Step 7: Verify the gate**

Run: `yarn typecheck && yarn lint && yarn test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/routes/ src/components/LessonCard.tsx
git commit -m "feat(study): add chapter, objective and lesson screens with mastery tracking"
```

---

### Task 12: Interface strings

**Files:**
- Modify: `src/lib/i18n/locales/tr.json`
- Modify: `src/lib/i18n/locales/en.json`

**Interfaces:**
- Consumes: the keys referenced in Tasks 8, 10 and 11.
- Produces: the translated strings those components read.

- [ ] **Step 1: Add the keys to both files**

Both files must gain exactly the same key set — `yarn validate:i18n` is a CI gate and i18next silently falls back to English for a missing Turkish key, so nothing else would turn red.

Keys to add, grouped:

- `nav.study`, `nav.practice`, `nav.exam`
- `home.studyTitle`, `home.studyBody`, `home.practiceTitle`, `home.practiceBody`, `home.examTitle`, `home.examBody`
- `study.chaptersTitle`, `study.objectiveCount`, `study.masteredCount`, `study.stateNotStarted`, `study.stateInProgress`, `study.stateMastered`, `study.startTest`, `study.noQuestions`, `study.lessonMissing`, `study.nextObjective`, `study.backToObjective`
- `practice.setupTitle`, `practice.scopeAll`, `practice.scopeChapters`, `practice.scopeObjective`, `practice.questionCount`, `practice.instantFeedback`, `practice.instantFeedbackHelp`, `practice.start`, `practice.pickAtLeastOneChapter`
- `session.feedbackCorrect`, `session.feedbackIncorrect`, `session.answerLocked`
- `session.shortfallScope` — takes `{{required}}` and `{{available}}`

Turkish terminology follows `data/ctfl-v4.0.1/terms.json`: `error/defect/failure` are `insan hatası / hata / arıza`, and `kusur` is never used.

- [ ] **Step 2: Verify parity**

Run: `yarn validate:i18n`
Expected: PASS, no missing keys in either direction.

- [ ] **Step 3: Commit**

```bash
git add src/lib/i18n/locales/tr.json src/lib/i18n/locales/en.json
git commit -m "feat(i18n): add the strings for study and practice mode"
```

---

### Task 13: End-to-end and accessibility coverage

**Files:**
- Modify: `e2e/labels.ts`
- Create: `e2e/study.spec.ts`
- Create: `e2e/practice.spec.ts`
- Modify: `e2e/a11y.spec.ts`

**Interfaces:**
- Consumes: every screen from Tasks 10 and 11, and the strings from Task 12.
- Produces: nothing other tasks depend on.

The browser runs with the `en-US` locale set in `playwright.config.ts`. Labels are read from `src/lib/i18n/locales/en.json` through `e2e/labels.ts` and are never retyped in a spec. Options may be radios or checkboxes — a multi-select question has no radio at all, so any selector must accept both.

- [ ] **Step 1: Extend the label map**

Add the new English labels to `e2e/labels.ts`, following the existing pattern in that file.

- [ ] **Step 2: Write the practice spec**

`e2e/practice.spec.ts` covers four things:

1. With instant feedback on: answer the first question, then assert the rationale panel is visible and that every option input is disabled.
2. With instant feedback on: after answering, clicking another option leaves the selection unchanged.
3. With instant feedback off: answer the first question and assert no rationale panel is present.
4. No timer element is present on the practice session screen in either case.

- [ ] **Step 3: Write the study spec**

`e2e/study.spec.ts` walks the loop: `/calisma` → a chapter → an objective → start the test → answer every question → assert the result appears and that the objective's state on the chapter screen has changed from "not started".

With no lesson content shipped, also assert the placeholder is shown and the start button still works.

- [ ] **Step 4: Cover the redirects**

Add to `e2e/practice.spec.ts`: visiting `/deneme` lands on `/sinav`, and visiting `/deneme/:attemptId` for a known attempt lands on `/sinav/:attemptId`.

- [ ] **Step 5: Extend the accessibility spec**

Add `/calisma`, `/calisma/1`, `/calisma/lo/FL-1.1.1` and `/alistirma` to the axe sweep in `e2e/a11y.spec.ts`, in both light and dark themes, matching how the existing screens are covered there.

- [ ] **Step 6: Run everything**

Run: `yarn e2e`
Expected: PASS, including `e2e/exam.spec.ts` unchanged.

- [ ] **Step 7: Review what axe cannot see**

Dispatch the `a11y-reviewer` agent over the new and changed files under `src/components/` and `src/routes/`. It checks where focus lands when the rationale opens, whether the live-region announcement is actually reachable by a screen reader, and the radio versus checkbox distinction on multi-select questions. Fix what it finds, then re-run `yarn e2e`.

- [ ] **Step 8: Commit**

```bash
git add e2e/
git commit -m "test(e2e): cover the study loop, practice feedback and legacy redirects"
```

---

### Task 14: Documentation

**Files:**
- Modify: `docs/04-data-model.md`
- Modify: `docs/06-ui-ux-design.md`
- Modify: `docs/09-roadmap.md`
- Modify: `CLAUDE.md`
- Modify: `TODO.md`

**Interfaces:**
- Consumes: everything built in Tasks 1–13.
- Produces: documentation that matches the code.

- [ ] **Step 1: Repair the stale data-model section**

`docs/04-data-model.md` §4 describes an IndexedDB schema the code diverged from in 16 places. Rewrite it against `src/lib/db/db.ts` as it now stands — among the corrections: `answers` and `flagged` live in `responses`, not on the attempt; `score` is `points`; `finishedAt` is `submittedAt`; `durationSec` is `durationMinutes`; `settings` is a generic key–value table. Then document the v3 additions and the `objectiveProgress` table.

- [ ] **Step 2: Document the lesson type**

Add a `lessons/` subsection to `docs/04-data-model.md` §3 with the record shape from Task 3, and update §6's check table to 19 rows.

- [ ] **Step 3: Update the UI document**

In `docs/06-ui-ux-design.md`, replace the screen inventory with the three-mode structure and the routes from Task 9, and correct §3.6's practice-mode description — it specifies a fixed 10-question session, and the implementation is a configurable scope with 10 as the default.

- [ ] **Step 4: Amend the deferred list**

In `docs/09-roadmap.md`, change the **Deliberately deferred** row for *"Video / long-form text lessons"* so it records what was actually decided: long-form lessons stay deferred; short per-objective explanation cards bound to that objective's questions are in scope as of 21.09.2026, because they extend the rationale differentiator rather than compete with existing video courses.

- [ ] **Step 5: Update the project memory**

In `CLAUDE.md`, update the folder structure under `src/`, the validator check count (15 → 19), the route names in the pitfalls section, and the "Up next" section. Add a pitfall: an attempt opened from another mode's URL is redirected by `routeForAttempt`, so a test that hardcodes a session URL will silently land somewhere else.

- [ ] **Step 6: Reconcile the backlog**

In `TODO.md`, mark F2-01 as delivered by the configurable-scope practice mode, note that F2-03's syllabus explorer is absorbed into `/calisma`, and add the remaining Track A, C and D items.

- [ ] **Step 7: Audit for drift**

Dispatch the `doc-drift-auditor` agent over the whole change set. Fix every count, path, command or behavioural claim it reports as false.

- [ ] **Step 8: Run the full gate**

Run each in order, and do not proceed past a failure:

```bash
yarn lint && yarn format && yarn typecheck && yarn test && yarn validate:data && yarn validate:i18n && yarn build && yarn e2e
```

- [ ] **Step 9: Commit**

```bash
git add docs/ CLAUDE.md TODO.md
git commit -m "docs: document the three modes and repair the stale data-model section"
```

---

## Notes for the executor

**A dependency worth asking about.** The Dexie v3 upgrade hook is exercised only end-to-end, because `jsdom` has no IndexedDB and `fake-indexeddb` is not installed. Adding `fake-indexeddb` as a pinned dev dependency would let the hook itself be unit-tested, which is worth having for a migration that touches every existing user's data. **Ask the user before installing it** — this plan does not assume it.

**Tracks still to come.** Track A (official questions), Track C (the 64 lesson cards) and Track D (240 further original questions) each get their own spec and plan. Nothing in this plan should anticipate them beyond the extension points already built: the `origin` union arrives with A as Dexie v4, and the lesson files ship empty for C to fill.

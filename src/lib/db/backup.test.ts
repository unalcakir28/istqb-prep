import { describe, expect, it } from "vitest";

import { BACKUP_FORMAT, backupFileName, parseBackup, rowsToImport } from "./backup";
import type { Attempt, ObjectiveProgress, Response, SrsCard } from "./db";

const SCHEMA = 3;

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: "attempt-1",
    certId: "ctfl-v4.0.1",
    seed: 7,
    questionIds: ["ctfl4-0001"],
    status: "submitted",
    mode: "practice",
    durationMinutes: 0,
    contentLang: "tr",
    startedAt: 1_000,
    deadlineAt: null,
    submittedAt: 2_000,
    instantFeedback: true,
    scope: { kind: "chapter", chapters: [1], count: 10 },
    syllabusVersion: "4.0.1",
    dataVersion: "2026.09.19",
    ...overrides,
  };
}

function response(overrides: Partial<Response> = {}): Response {
  return {
    key: "attempt-1:ctfl4-0001",
    attemptId: "attempt-1",
    questionId: "ctfl4-0001",
    selected: ["a"],
    flagged: false,
    updatedAt: 1_500,
    ...overrides,
  };
}

function progress(overrides: Partial<ObjectiveProgress> = {}): ObjectiveProgress {
  return {
    key: "ctfl-v4.0.1:FL-1.1.1",
    certId: "ctfl-v4.0.1",
    objectiveCode: "FL-1.1.1",
    attemptCount: 3,
    lastScorePercent: 100,
    mastered: true,
    updatedAt: 3_000,
    ...overrides,
  };
}

function card(overrides: Partial<SrsCard> = {}): SrsCard {
  return {
    questionId: "ctfl4-0001",
    certId: "ctfl-v4.0.1",
    due: 9_000,
    stability: 1,
    difficulty: 5,
    scheduledDays: 0,
    learningSteps: 1,
    reps: 1,
    lapses: 0,
    state: "learning",
    lastReviewedAt: 4_000,
    addedAt: 2_000,
    ...overrides,
  };
}

function file(
  overrides: Record<string, unknown> = {},
  tables: Record<string, unknown> = {},
): string {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    formatVersion: 1,
    schemaVersion: SCHEMA,
    exportedAt: "2026-10-02T10:00:00.000Z",
    dataVersion: "2026.09.19",
    tables: {
      attempts: [attempt()],
      responses: [response()],
      objectiveProgress: [progress()],
      srsCards: [card()],
      bookmarks: [],
      settings: [],
      ...tables,
    },
    ...overrides,
  });
}

describe("parseBackup", () => {
  it("accepts a file this app wrote", () => {
    const result = parseBackup(file(), SCHEMA);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.backup.tables.attempts).toHaveLength(1);
    expect(result.backup.dataVersion).toBe("2026.09.19");
  });

  it("refuses text that is not JSON", () => {
    expect(parseBackup("{not json", SCHEMA)).toEqual({ ok: false, error: "not-json" });
  });

  it("refuses JSON that is not one of its backups", () => {
    expect(parseBackup(JSON.stringify({ questions: [] }), SCHEMA)).toEqual({
      ok: false,
      error: "not-a-backup",
    });
    expect(parseBackup(file({ format: "something-else" }), SCHEMA)).toEqual({
      ok: false,
      error: "not-a-backup",
    });
    expect(parseBackup("[]", SCHEMA)).toEqual({ ok: false, error: "not-a-backup" });
  });

  it("refuses a file from a newer app rather than half-understanding it", () => {
    expect(parseBackup(file({ formatVersion: 2 }), SCHEMA)).toEqual({
      ok: false,
      error: "newer-format",
    });
    expect(parseBackup(file({ schemaVersion: SCHEMA + 1 }), SCHEMA)).toEqual({
      ok: false,
      error: "newer-schema",
    });
  });

  it("accepts a file from an older schema", () => {
    expect(parseBackup(file({ schemaVersion: SCHEMA - 1 }), SCHEMA).ok).toBe(true);
  });

  it("refuses the whole file when one row is missing a field the app trusts", () => {
    const broken = { ...attempt(), questionIds: undefined };
    expect(parseBackup(file({}, { attempts: [attempt({ id: "ok" }), broken] }), SCHEMA)).toEqual({
      ok: false,
      error: "invalid-rows",
    });
  });

  it("refuses a response whose key does not name its own attempt and question", () => {
    const mismatched = response({ key: "attempt-2:ctfl4-0001" });
    expect(parseBackup(file({}, { responses: [mismatched] }), SCHEMA)).toEqual({
      ok: false,
      error: "invalid-rows",
    });
  });

  it("refuses a table that is not a list", () => {
    expect(parseBackup(file({}, { srsCards: { questionId: "x" } }), SCHEMA)).toEqual({
      ok: false,
      error: "invalid-rows",
    });
  });

  it("reads a table the file does not mention as empty", () => {
    const text = JSON.stringify({
      format: BACKUP_FORMAT,
      formatVersion: 1,
      schemaVersion: SCHEMA,
      tables: { attempts: [attempt()] },
    });
    const result = parseBackup(text, SCHEMA);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.backup.tables.srsCards).toEqual([]);
    expect(result.backup.dataVersion).toBeNull();
  });
});

describe("rowsToImport", () => {
  it("adds what this device lacks", () => {
    const { rows, count } = rowsToImport("attempts", [], [attempt()]);

    expect(rows).toEqual([attempt()]);
    expect(count).toEqual({ added: 1, updated: 0, kept: 0 });
  });

  it("keeps this device's copy when it is newer, and takes the file's when that is", () => {
    const local = [progress({ updatedAt: 5_000, lastScorePercent: 40 })];

    const older = rowsToImport("objectiveProgress", local, [progress({ updatedAt: 3_000 })]);
    expect(older.rows).toEqual([]);
    expect(older.count).toEqual({ added: 0, updated: 0, kept: 1 });

    const newer = rowsToImport("objectiveProgress", local, [progress({ updatedAt: 6_000 })]);
    expect(newer.rows).toEqual([progress({ updatedAt: 6_000 })]);
    expect(newer.count).toEqual({ added: 0, updated: 1, kept: 0 });
  });

  it("dates an attempt by its submission, so a finished copy beats an unfinished one", () => {
    const unfinished = attempt({ status: "in-progress", submittedAt: undefined, startedAt: 1_000 });
    const { rows } = rowsToImport("attempts", [unfinished], [attempt({ submittedAt: 2_000 })]);

    expect(rows).toEqual([attempt({ submittedAt: 2_000 })]);
  });

  it("dates a card by its last review, falling back to when it joined the deck", () => {
    const reviewed = card({ lastReviewedAt: 8_000 });
    const neverReviewed = card({ lastReviewedAt: undefined, addedAt: 7_000 });

    expect(rowsToImport("srsCards", [reviewed], [neverReviewed]).count.kept).toBe(1);
    expect(rowsToImport("srsCards", [neverReviewed], [reviewed]).count.updated).toBe(1);
  });

  it("makes importing the same file twice change nothing new", () => {
    const first = rowsToImport("responses", [], [response()]);
    const second = rowsToImport("responses", first.rows, [response()]);

    // A tie goes to the file, which writes the identical row again.
    expect(second.count).toEqual({ added: 0, updated: 1, kept: 0 });
    expect(second.rows).toEqual(first.rows);
  });
});

describe("backupFileName", () => {
  it("dates the file in local time", () => {
    expect(backupFileName(new Date(2026, 9, 2, 23, 30))).toBe(
      "istqb-prep-progress-2026-10-02.json",
    );
  });
});

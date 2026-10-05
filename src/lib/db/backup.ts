/**
 * F3-08 — progress export and import.
 *
 * Everything the candidate has done lives only in this browser's IndexedDB
 * (CLAUDE.md rule 7), so clearing the browser's data, or moving to another
 * device, loses it. A downloaded file is the only way to carry it: no
 * account, no server, nothing leaves the device unless the candidate saves
 * it somewhere themselves.
 *
 * The file holds all six tables, as stored. Display preferences kept in
 * localStorage (theme, interface language, side-by-side) are left out: they
 * are settings of this browser, not progress.
 *
 * Import MERGES, it never replaces: nothing already on this device is
 * deleted. Where both sides hold the same record (the same key), the newer one
 * is kept, judged by the timestamp each table already carries. Importing the
 * same file twice is therefore a no-op the second time.
 *
 * The parsing and the merge are pure functions, because jsdom has no
 * IndexedDB; only `exportProgress` and `importProgress` touch the database.
 */

import {
  db,
  type Attempt,
  type Bookmark,
  type ObjectiveProgress,
  type Response,
  type Setting,
  type SrsCard,
} from "./db";

export const BACKUP_FORMAT = "istqb-prep-progress";
export const BACKUP_FORMAT_VERSION = 1;

export interface BackupTables {
  attempts: Attempt[];
  responses: Response[];
  objectiveProgress: ObjectiveProgress[];
  srsCards: SrsCard[];
  bookmarks: Bookmark[];
  settings: Setting[];
}

export type TableName = keyof BackupTables;

export const TABLE_NAMES: readonly TableName[] = [
  "attempts",
  "responses",
  "objectiveProgress",
  "srsCards",
  "bookmarks",
  "settings",
];

export interface ProgressBackup {
  format: typeof BACKUP_FORMAT;
  formatVersion: number;
  /** The Dexie schema version the rows were written under. */
  schemaVersion: number;
  /** ISO 8601. */
  exportedAt: string;
  /** The content version at export — a mismatch on import is a warning, never a refusal. */
  dataVersion: string | null;
  tables: BackupTables;
}

export type BackupError =
  "not-json" | "not-a-backup" | "newer-format" | "newer-schema" | "invalid-rows";

export type ParseResult = { ok: true; backup: ProgressBackup } | { ok: false; error: BackupError };

type Row = Record<string, unknown>;

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isOptionalNumber(value: unknown): boolean {
  return value === undefined || isNumber(value);
}

const ATTEMPT_STATUSES = new Set(["in-progress", "submitted", "abandoned"]);
const ATTEMPT_MODES = new Set(["study", "practice", "exam"]);
const LANGS = new Set(["tr", "en"]);
const SRS_STATES = new Set(["new", "learning", "review", "relearning"]);
const SCOPE_KINDS = new Set(["blueprint", "chapter", "objective", "questions"]);

/**
 * The fields the app reads without checking, per table. A row missing one of
 * them would not fail on import — it would fail later, on whichever screen
 * first trusts it, so the whole file is refused instead.
 */
const VALID_ROW: Record<TableName, (row: Row) => boolean> = {
  attempts: (row) =>
    isString(row.id) &&
    isString(row.certId) &&
    isNumber(row.seed) &&
    isStringArray(row.questionIds) &&
    ATTEMPT_STATUSES.has(row.status as string) &&
    ATTEMPT_MODES.has(row.mode as string) &&
    isNumber(row.durationMinutes) &&
    LANGS.has(row.contentLang as string) &&
    isNumber(row.startedAt) &&
    (row.deadlineAt === null || isNumber(row.deadlineAt)) &&
    isOptionalNumber(row.submittedAt) &&
    typeof row.instantFeedback === "boolean" &&
    isRecord(row.scope) &&
    SCOPE_KINDS.has(row.scope.kind as string) &&
    typeof row.syllabusVersion === "string" &&
    typeof row.dataVersion === "string",
  responses: (row) =>
    isString(row.key) &&
    isString(row.attemptId) &&
    isString(row.questionId) &&
    row.key === `${row.attemptId}:${row.questionId}` &&
    isStringArray(row.selected) &&
    typeof row.flagged === "boolean" &&
    isOptionalNumber(row.revealedAt) &&
    isNumber(row.updatedAt),
  objectiveProgress: (row) =>
    isString(row.key) &&
    isString(row.certId) &&
    isString(row.objectiveCode) &&
    isNumber(row.attemptCount) &&
    isNumber(row.lastScorePercent) &&
    typeof row.mastered === "boolean" &&
    isOptionalNumber(row.cardReadAt) &&
    isNumber(row.updatedAt),
  srsCards: (row) =>
    isString(row.questionId) &&
    isString(row.certId) &&
    isNumber(row.due) &&
    isNumber(row.stability) &&
    isNumber(row.difficulty) &&
    isNumber(row.scheduledDays) &&
    isNumber(row.learningSteps) &&
    isNumber(row.reps) &&
    isNumber(row.lapses) &&
    SRS_STATES.has(row.state as string) &&
    isOptionalNumber(row.lastReviewedAt) &&
    isNumber(row.addedAt) &&
    isOptionalNumber(row.revision),
  bookmarks: (row) => isString(row.questionId) && isString(row.certId) && isNumber(row.createdAt),
  settings: (row) => isString(row.key),
};

/** Each table's primary key, as Dexie declares it in `db.ts`. */
const KEY_OF: Record<TableName, (row: Row) => string> = {
  attempts: (row) => row.id as string,
  responses: (row) => row.key as string,
  objectiveProgress: (row) => row.key as string,
  srsCards: (row) => row.questionId as string,
  bookmarks: (row) => row.questionId as string,
  settings: (row) => row.key as string,
};

/**
 * How recent a row is, from the timestamp the table already keeps. A tie goes
 * to the imported row. `settings` has no timestamp, so the import wins there.
 */
const STAMP_OF: Record<TableName, (row: Row) => number> = {
  attempts: (row) => (row.submittedAt as number | undefined) ?? (row.startedAt as number),
  responses: (row) => row.updatedAt as number,
  objectiveProgress: (row) => row.updatedAt as number,
  srsCards: (row) => (row.lastReviewedAt as number | undefined) ?? (row.addedAt as number),
  bookmarks: (row) => row.createdAt as number,
  settings: () => 0,
};

/**
 * Reads a backup file's text and checks it is one this app can import.
 *
 * `schemaVersion` is this app's Dexie version: a file written by a newer
 * version may hold rows in a shape this code does not know, so it is refused
 * rather than half-understood. An older one is fine — every schema change so
 * far has only added fields.
 */
export function parseBackup(text: string, schemaVersion: number): ParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, error: "not-json" };
  }

  if (!isRecord(value) || value.format !== BACKUP_FORMAT || !isRecord(value.tables)) {
    return { ok: false, error: "not-a-backup" };
  }
  if (!isNumber(value.formatVersion) || !isNumber(value.schemaVersion)) {
    return { ok: false, error: "not-a-backup" };
  }
  if (value.formatVersion > BACKUP_FORMAT_VERSION) return { ok: false, error: "newer-format" };
  if (value.schemaVersion > schemaVersion) return { ok: false, error: "newer-schema" };

  const tables = {} as Record<TableName, Row[]>;
  for (const name of TABLE_NAMES) {
    // A table the file does not mention is empty, not an error: a file from
    // before a table existed simply has nothing for it.
    const rows = value.tables[name] ?? [];
    if (!Array.isArray(rows)) return { ok: false, error: "invalid-rows" };
    if (!rows.every((row) => isRecord(row) && VALID_ROW[name](row))) {
      return { ok: false, error: "invalid-rows" };
    }
    tables[name] = rows as Row[];
  }

  return {
    ok: true,
    backup: {
      format: BACKUP_FORMAT,
      formatVersion: value.formatVersion,
      schemaVersion: value.schemaVersion,
      exportedAt: typeof value.exportedAt === "string" ? value.exportedAt : "",
      dataVersion: typeof value.dataVersion === "string" ? value.dataVersion : null,
      tables: tables as unknown as BackupTables,
    },
  };
}

export interface MergeCount {
  /** Rows this device did not have. */
  added: number;
  /** Rows this device had, replaced by a newer copy from the file. */
  updated: number;
  /** Rows in the file that lost to a newer copy already here. */
  kept: number;
}

/**
 * The rows of one table that an import writes: everything this device lacks,
 * plus every row the file holds a newer copy of.
 */
export function rowsToImport<T extends object>(
  name: TableName,
  existing: readonly T[],
  incoming: readonly T[],
): { rows: T[]; count: MergeCount } {
  const keyOf = KEY_OF[name] as (row: T) => string;
  const stampOf = STAMP_OF[name] as (row: T) => number;
  const local = new Map(existing.map((row) => [keyOf(row), row]));

  const rows: T[] = [];
  const count: MergeCount = { added: 0, updated: 0, kept: 0 };

  for (const row of incoming) {
    const current = local.get(keyOf(row));
    if (!current) {
      rows.push(row);
      count.added += 1;
      continue;
    }
    if (stampOf(current) > stampOf(row)) {
      count.kept += 1;
      continue;
    }
    rows.push(row);
    count.updated += 1;
  }

  return { rows, count };
}

export async function exportProgress(dataVersion: string | null): Promise<ProgressBackup> {
  const tables = await db.transaction(
    "r",
    TABLE_NAMES.map((name) => db.table(name)),
    async () => ({
      attempts: await db.attempts.toArray(),
      responses: await db.responses.toArray(),
      objectiveProgress: await db.objectiveProgress.toArray(),
      srsCards: await db.srsCards.toArray(),
      bookmarks: await db.bookmarks.toArray(),
      settings: await db.settings.toArray(),
    }),
  );

  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: db.verno,
    exportedAt: new Date().toISOString(),
    dataVersion,
    tables,
  };
}

/** Merges a parsed backup into this device's database, in one transaction. */
export async function importProgress(
  backup: ProgressBackup,
): Promise<Record<TableName, MergeCount>> {
  return db.transaction(
    "rw",
    TABLE_NAMES.map((name) => db.table(name)),
    async () => {
      const counts = {} as Record<TableName, MergeCount>;

      for (const name of TABLE_NAMES) {
        const table = db.table(name);
        const { rows, count } = rowsToImport(name, await table.toArray(), backup.tables[name]);
        if (rows.length > 0) await table.bulkPut(rows);
        counts[name] = count;
      }

      return counts;
    },
  );
}

/** `istqb-prep-progress-2026-10-02.json` — the date in local time, as the candidate reads it. */
export function backupFileName(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${BACKUP_FORMAT}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

/** Hands the backup to the browser as a download, and returns the file name it used. */
export function downloadBackup(backup: ProgressBackup): string {
  const name = backupFileName(new Date());
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoked on the next task: some browsers start the download asynchronously
  // and would otherwise find the URL already gone.
  setTimeout(() => URL.revokeObjectURL(url), 0);

  return name;
}

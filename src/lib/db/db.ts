/**
 * F1-03 — Client-side persistence (IndexedDB / Dexie).
 *
 * No backend, no account: all of the user's progress lives only in their own
 * browser and is never sent anywhere (CLAUDE.md rule 7).
 *
 * The cost of that is that progress is lost if the browser's data is
 * cleared; that's why export/import (F3-08) is planned, and it's stated
 * explicitly on the privacy page.
 *
 * Not all tables are used in Phase 1 (srsCards and bookmarks are Phase 2-3),
 * but defining the schema up front lets future migrations happen without
 * skipping a version.
 */

import Dexie, { type Table } from "dexie";

import type { Lang } from "@/types/content";

export type AttemptStatus = "in-progress" | "submitted" | "abandoned";

export interface Attempt {
  id: string;
  certId: string;
  seed: number;
  questionIds: string[];
  status: AttemptStatus;
  /** The duration at the moment the attempt was set up — comes from meta, never hardcoded. */
  durationMinutes: number;
  contentLang: Lang;
  startedAt: number;
  /** The countdown is based on `Date.now()`: it doesn't drift if the tab stays in the background. */
  deadlineAt: number;
  submittedAt?: number;
  /** Whether it was submitted because time ran out — shown separately on the result screen. */
  autoSubmitted?: boolean;
  points?: number;
  totalPoints?: number;
  passed?: boolean;
  syllabusVersion: string;
  dataVersion: string;
}

export interface Response {
  /** `${attemptId}:${questionId}` — no second record is ever created for the same question. */
  key: string;
  attemptId: string;
  questionId: string;
  selected: string[];
  flagged: boolean;
  updatedAt: number;
}

export interface SrsCard {
  questionId: string;
  certId: string;
  due: number;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  state: string;
  lastReviewedAt?: number;
}

export interface Bookmark {
  questionId: string;
  certId: string;
  createdAt: number;
  note?: string;
}

export interface Setting {
  key: string;
  value: unknown;
}

export class AppDatabase extends Dexie {
  attempts!: Table<Attempt, string>;
  responses!: Table<Response, string>;
  srsCards!: Table<SrsCard, string>;
  bookmarks!: Table<Bookmark, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super("istqb-prep");

    this.version(1).stores({
      attempts: "id, certId, status, startedAt",
      responses: "key, attemptId, questionId",
      srsCards: "questionId, certId, due",
      bookmarks: "questionId, certId, createdAt",
      settings: "key",
    });

    // v2: finding a resumable attempt on every launch queries by
    // `{certId, status}`; without a compound index, Dexie scans the table
    // and prints a console warning. The rest of the tables are unchanged, no
    // data migration is needed.
    this.version(2).stores({
      attempts: "id, certId, status, startedAt, [certId+status]",
    });
  }
}

export const db = new AppDatabase();

export function responseKey(attemptId: string, questionId: string): string {
  return `${attemptId}:${questionId}`;
}

/**
 * A resumable attempt (F1-10). If there's more than one, the newest is
 * returned — older ones aren't shown on the home screen, but they aren't
 * deleted either.
 */
export async function findResumableAttempt(certId: string): Promise<Attempt | undefined> {
  const open = await db.attempts.where({ certId, status: "in-progress" }).toArray();
  if (open.length === 0) return undefined;

  return open.sort((a, b) => b.startedAt - a.startedAt)[0];
}

export async function getResponses(attemptId: string): Promise<Response[]> {
  return db.responses.where("attemptId").equals(attemptId).toArray();
}

/**
 * The ENTIRE row is written; missing fields are never filled in by reading
 * from disk first.
 *
 * This function used to do a `get` followed by a `put`. There was no
 * concurrency protection between the two calls: when the user picked an
 * option and immediately flagged the same question (both are keyboard
 * shortcuts), the second call's `get` could return before the first call's
 * `put` did, and it would overwrite the selection with an empty array. The
 * answer looked selected on screen but vanished on disk. The caller already
 * holds both fields in memory, so there's no need to read at all.
 */
export async function saveResponse(
  attemptId: string,
  questionId: string,
  row: Pick<Response, "selected" | "flagged">,
): Promise<void> {
  await db.responses.put({
    key: responseKey(attemptId, questionId),
    attemptId,
    questionId,
    selected: row.selected,
    flagged: row.flagged,
    updatedAt: Date.now(),
  });
}

export async function discardAttempt(attemptId: string): Promise<void> {
  await db.transaction("rw", db.attempts, db.responses, async () => {
    await db.responses.where("attemptId").equals(attemptId).delete();
    await db.attempts.delete(attemptId);
  });
}

/**
 * IndexedDB doesn't work in every environment (private tab, storage
 * disabled, old browser). The app must not swallow this silently: the user
 * is told their progress won't be saved (F3-12).
 */
export async function isPersistenceAvailable(): Promise<boolean> {
  try {
    await db.open();
    return true;
  } catch {
    return false;
  }
}

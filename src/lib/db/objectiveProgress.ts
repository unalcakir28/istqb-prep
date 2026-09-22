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

/** How far the candidate has got with one objective, as the study screens show it. */
export type ObjectiveState = "not-started" | "in-progress" | "mastered";

/**
 * A row only exists once the objective has been opened or tested, so a missing
 * row is exactly "not started" — there is no separate empty state to store.
 */
export function objectiveStateOf(progress: ObjectiveProgress | undefined): ObjectiveState {
  if (!progress) return "not-started";
  if (progress.mastered) return "mastered";
  return "in-progress";
}

export async function markLessonRead(certId: string, objectiveCode: string): Promise<void> {
  const key = progressKey(certId, objectiveCode);

  await db.transaction("rw", db.objectiveProgress, async () => {
    const existing = await db.objectiveProgress.get(key);

    // Progress fields are carried forward as recordObjectiveResult last computed
    // them; this call only stamps cardReadAt.
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
  });
}

/**
 * `answered` is how many questions this session actually answered for the
 * objective — not how many it asked. The two differ whenever the candidate
 * leaves questions blank, and the conservative reading is the right one:
 * `percent` comes from `scoreExam`, which divides by the questions asked, so
 * answering 3 of 10 correctly scores 30% and must not count as mastery.
 * The answered count accumulates; the score replaces the previous one.
 *
 * Returns the row it wrote, so a caller that has just recorded a result can
 * render the new state without re-reading it.
 */
export async function recordObjectiveResult(
  certId: string,
  objectiveCode: string,
  answered: number,
  percent: number,
): Promise<ObjectiveProgress> {
  const key = progressKey(certId, objectiveCode);

  return db.transaction("rw", db.objectiveProgress, async () => {
    const existing = await db.objectiveProgress.get(key);
    // Answers accumulate across every session taken on this objective, so
    // MASTERY_MIN_ANSWERED can be reached by answering one question three
    // times. On a pool this thin that is currently the only route to mastery
    // for the objectives that carry fewer than three published questions —
    // the same ones whose shortfall banner says a single test cannot get
    // there. Deepening the pool (Track D) is what makes this honest; until
    // then the accumulation stays.
    const attemptCount = (existing?.attemptCount ?? 0) + answered;

    const row: ObjectiveProgress = {
      key,
      certId,
      objectiveCode,
      cardReadAt: existing?.cardReadAt,
      attemptCount,
      lastScorePercent: percent,
      mastered: isMastered(attemptCount, percent),
      updatedAt: Date.now(),
    };

    await db.objectiveProgress.put(row);
    return row;
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

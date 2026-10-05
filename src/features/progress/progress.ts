/**
 * F3-05 and F3-06 — what the progress screen says, computed from what is
 * already stored. Nothing here writes; every number is a reading of the
 * attempts, the answers and the repetition deck.
 *
 * Three readings:
 *
 *   - the mock exams over time, and whether the last three timed ones say
 *     "ready" (F3-06);
 *   - per chapter, how often a question was right the first time it was
 *     answered and how often it is right now;
 *   - a streak of active days that one missed day does not break.
 *
 * The readiness rule is this product's rule of thumb, stated as such on the
 * screen. ISTQB publishes no way to predict a result, and rule 5 forbids
 * implying one.
 */

import { isGraded } from "@/features/exam/scoreExam";
import type { Attempt, SrsCard } from "@/lib/db/db";
import type { QuestionHistory } from "@/lib/db/questionHistory";

/** How many timed mock exams the readiness estimate looks back over. */
export const READINESS_WINDOW = 3;
/** How many of them must have passed for the estimate to say "ready". */
export const READINESS_PASSES = 2;

/** One finished mock exam: graded against the pass mark. */
export interface ExamPoint {
  attemptId: string;
  at: number;
  points: number;
  totalPoints: number;
  passed: boolean;
  timed: boolean;
}

export type Readiness =
  | { state: "needMore"; missing: number }
  | { state: "ready" | "notYet"; passed: number; considered: number };

export interface ChapterProgress {
  chapter: number;
  /** Questions of this chapter answered at least once. */
  answered: number;
  /** Of those, the share answered correctly the first time. */
  firstPercent: number;
  /** Of those, the share whose latest answer is correct. */
  latestPercent: number;
}

export interface Streak {
  /** Active days in the current run. 0 when there is no run. */
  days: number;
  /** Whether today already counts. */
  activeToday: boolean;
}

const submittedAt = (attempt: Attempt) => attempt.submittedAt ?? attempt.startedAt;

/**
 * The finished mock exams, oldest first. "Mock exam" is the blueprint scope,
 * the one `isGraded` measures against the pass mark — never the mode, for
 * the reason given there.
 */
export function examPoints(attempts: readonly Attempt[]): ExamPoint[] {
  return attempts
    .filter((attempt) => attempt.status === "submitted" && isGraded(attempt.scope))
    .filter((attempt) => attempt.points !== undefined && attempt.totalPoints !== undefined)
    .sort((a, b) => submittedAt(a) - submittedAt(b))
    .map((attempt) => ({
      attemptId: attempt.id,
      at: submittedAt(attempt),
      points: attempt.points ?? 0,
      totalPoints: attempt.totalPoints ?? 0,
      passed: attempt.passed === true,
      timed: attempt.deadlineAt !== null,
    }));
}

/**
 * F3-06 — "2 of your last 3 timed mock exams passed". Untimed ones are left
 * out: the real paper has a clock, and a pass without one says less.
 */
export function readiness(exams: readonly ExamPoint[]): Readiness {
  const timed = exams.filter((exam) => exam.timed);
  if (timed.length < READINESS_WINDOW) {
    return { state: "needMore", missing: READINESS_WINDOW - timed.length };
  }

  const recent = timed.slice(-READINESS_WINDOW);
  const passed = recent.filter((exam) => exam.passed).length;
  return {
    state: passed >= READINESS_PASSES ? "ready" : "notYet",
    passed,
    considered: recent.length,
  };
}

/**
 * Per chapter: first answers against latest answers, over every question of
 * the chapter answered at least once. An entry with nothing selected (a
 * question flagged but skipped, or an answer cleared) is not an answer, so it
 * is left out, as the saved lists leave it out.
 */
export function chapterProgress(
  histories: readonly QuestionHistory[],
  chapterOf: (questionId: string) => number | undefined,
): ChapterProgress[] {
  const byChapter = new Map<number, { answered: number; first: number; latest: number }>();

  for (const history of histories) {
    const chapter = chapterOf(history.questionId);
    const answers = history.entries.filter((entry) => !entry.isUnanswered);
    const first = answers.at(0);
    const latest = answers.at(-1);
    if (chapter === undefined || !first || !latest) continue;

    const row = byChapter.get(chapter) ?? { answered: 0, first: 0, latest: 0 };
    row.answered += 1;
    if (first.isCorrect) row.first += 1;
    if (latest.isCorrect) row.latest += 1;
    byChapter.set(chapter, row);
  }

  return [...byChapter]
    .sort(([a], [b]) => a - b)
    .map(([chapter, row]) => ({
      chapter,
      answered: row.answered,
      firstPercent: Math.round((row.first / row.answered) * 100),
      latestPercent: Math.round((row.latest / row.answered) * 100),
    }));
}

/**
 * When the candidate was active: every finished session, in any mode, and
 * every card's last repetition. A card keeps only its latest review, so a day
 * whose only reviews were repeated later drops out.
 */
export function activityTimes(attempts: readonly Attempt[], deck: readonly SrsCard[]): number[] {
  return [
    ...attempts.flatMap((attempt) =>
      attempt.status === "submitted" ? [submittedAt(attempt)] : [],
    ),
    ...deck.flatMap((card) => (card.lastReviewedAt !== undefined ? [card.lastReviewedAt] : [])),
  ];
}

/** Local calendar day number, so two times on one date compare equal. */
function dayNumber(time: number): number {
  const date = new Date(time);
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/**
 * The forgiving streak: active days in a row, where one missed day between
 * two active days does not break the run (Duolingo's "streak freeze", given
 * for free). The run is still alive if the last active day was today,
 * yesterday or the day before — a candidate who misses yesterday has not lost
 * it yet, only today can.
 */
export function streak(activity: readonly number[], now: number): Streak {
  const days = [...new Set(activity.map(dayNumber))].sort((a, b) => b - a);
  const today = dayNumber(now);
  const latest = days.at(0);

  if (latest === undefined || today - latest > 2) return { days: 0, activeToday: false };

  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i - 1] - days[i] > 2) break;
    run += 1;
  }

  return { days: run, activeToday: latest === today };
}

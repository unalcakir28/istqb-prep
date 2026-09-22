/**
 * F1-06 — Exam scoring.
 *
 * The rules come from the official exam and are not hard-coded here:
 * - Every question is worth EXACTLY 1 point; Foundation has no multi-point
 *   questions.
 * - Multiple-answer (`multi`) questions are scored on an EXACT MATCH — there
 *   is no partial credit. Ticking one of the two correct options scores 0.
 * - The pass mark is read from `meta.json` (26/40 for CTFL v4.0.1), never
 *   embedded in the code.
 * - Negative marking appears in no official document; because
 *   `negativeMarking: null`, a wrong answer simply scores 0 and does not
 *   subtract points.
 */

import type { AttemptScope } from "@/lib/db/db";
import type { CertMeta, Question } from "@/types/content";

/**
 * Whether an attempt is measured against the official pass mark.
 *
 * `scoreExam` always fills `passed` in, because the comparison it makes is the
 * right one for the exam it was written for: a blueprint attempt is measured
 * against `meta.exam.passPoints` (26 for CTFL v4.0.1) however many questions
 * the pool could supply. Applied to a scoped set the same comparison is a lie —
 * 10 questions can never reach 26, so a perfect run reports `passed: false`.
 *
 * The discriminator is the SCOPE, never `attempt.mode`: a practice set built
 * from the blueprint at the official count is a mock exam in all but name. One
 * definition, used by the result screen to decide whether to show a verdict and
 * by the store to decide whether to persist one — so a stored `passed` and a
 * displayed one can never disagree.
 */
export function isGraded(scope: AttemptScope): boolean {
  return scope.kind === "blueprint";
}

/** The user's answer to one question: the ids of the selected options. */
export type AnswerMap = Record<string, string[]>;

export interface QuestionOutcome {
  questionId: string;
  chapter: number;
  objectives: string[];
  kLevel: string;
  selected: string[];
  correct: string[];
  isCorrect: boolean;
  /** A question with no option ticked — reported separately from a wrong answer. */
  isUnanswered: boolean;
  points: number;
}

export interface Breakdown {
  correct: number;
  total: number;
  percent: number;
}

export interface ExamScore {
  points: number;
  totalPoints: number;
  percent: number;
  passPoints: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  byChapter: Record<number, Breakdown>;
  byObjective: Record<string, Breakdown>;
  byKLevel: Record<string, Breakdown>;
  outcomes: QuestionOutcome[];
}

/**
 * Order-independent exact set equality.
 *
 * Exported because the saved lists (F2-07) replay old answers outside a
 * session and must decide "was this right?" by exactly the rule that scored
 * it at the time — a second implementation would eventually disagree with
 * this one and the lists would contradict the result screens.
 */
export function isExactMatch(selected: readonly string[], correct: readonly string[]): boolean {
  if (selected.length !== correct.length) return false;

  const expected = new Set(correct);
  if (expected.size !== correct.length) return false;

  const seen = new Set<string>();
  for (const id of selected) {
    if (!expected.has(id)) return false;
    if (seen.has(id)) return false;
    seen.add(id);
  }

  return true;
}

function bump(table: Record<string | number, Breakdown>, key: string | number, hit: boolean): void {
  const entry = (table[key] ??= { correct: 0, total: 0, percent: 0 });
  entry.total += 1;
  if (hit) entry.correct += 1;
}

function finalize(table: Record<string | number, Breakdown>): void {
  for (const entry of Object.values(table)) {
    entry.percent = entry.total === 0 ? 0 : Math.round((entry.correct / entry.total) * 100);
  }
}

export function scoreExam(questions: Question[], answers: AnswerMap, meta: CertMeta): ExamScore {
  const byChapter: Record<number, Breakdown> = {};
  const byObjective: Record<string, Breakdown> = {};
  const byKLevel: Record<string, Breakdown> = {};
  const outcomes: QuestionOutcome[] = [];

  let points = 0;
  let correctCount = 0;
  let unansweredCount = 0;

  for (const question of questions) {
    const selected = answers[question.id] ?? [];
    const isUnanswered = selected.length === 0;
    const isCorrect = !isUnanswered && isExactMatch(selected, question.correct);
    const earned = isCorrect ? question.points : 0;

    points += earned;
    if (isCorrect) correctCount += 1;
    if (isUnanswered) unansweredCount += 1;

    bump(byChapter, question.chapter, isCorrect);
    bump(byKLevel, question.kLevel, isCorrect);
    for (const code of question.objectives) bump(byObjective, code, isCorrect);

    outcomes.push({
      questionId: question.id,
      chapter: question.chapter,
      objectives: question.objectives,
      kLevel: question.kLevel,
      selected,
      correct: question.correct,
      isCorrect,
      isUnanswered,
      points: earned,
    });
  }

  finalize(byChapter);
  finalize(byObjective);
  finalize(byKLevel);

  // The total comes from the questions asked, not from the questions answered:
  // in a short exam the pass mark is still compared against the official value.
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
  const passPoints = meta.exam.passPoints;

  return {
    points,
    totalPoints,
    percent: totalPoints === 0 ? 0 : Math.round((points / totalPoints) * 100),
    passPoints,
    passed: points >= passPoints,
    correctCount,
    incorrectCount: questions.length - correctCount - unansweredCount,
    unansweredCount,
    byChapter,
    byObjective,
    byKLevel,
    outcomes,
  };
}

/** For the "3 weakest learning objectives" block on the result screen. */
export function weakestObjectives(score: ExamScore, limit = 3): string[] {
  return Object.entries(score.byObjective)
    .filter(([, breakdown]) => breakdown.total > 0 && breakdown.correct < breakdown.total)
    .sort((a, b) => a[1].percent - b[1].percent || b[1].total - a[1].total)
    .slice(0, limit)
    .map(([code]) => code);
}

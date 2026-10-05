/**
 * Which questions of a scored session the candidate did not know — the rule
 * the repetition deck (F3-01) and the result screen's retry (F2-02) share.
 * The saved "wrong" list applies the same one to stored answers
 * (`src/lib/db/questionHistory.ts`).
 *
 * A wrong answer counts. An unanswered question does not: nobody reached it,
 * so it shows no wrong belief to correct — unless its answer was shown
 * through the hint ladder before it was answered (F3-09). Then it was
 * reached, and not known.
 */

import type { QuestionOutcome } from "@/features/exam/scoreExam";

export function notKnownQuestionIds(
  outcomes: readonly QuestionOutcome[],
  revealed: Readonly<Record<string, number>>,
): string[] {
  return outcomes
    .filter(
      (outcome) =>
        !outcome.isCorrect && (!outcome.isUnanswered || Boolean(revealed[outcome.questionId])),
    )
    .map((outcome) => outcome.questionId);
}

/**
 * F2-07 — what the candidate has done with each question, across every
 * session.
 *
 * Nothing new is stored. The attempts and responses tables already hold every
 * answer ever given; this module reads them back and answers three questions
 * the saved lists ask:
 *
 *   - which questions did I get wrong (most recently)?
 *   - which did I flag?
 *   - which have I never got right twice in a row?
 *
 * Correctness is not persisted anywhere — `Response` stores the options that
 * were ticked, and the keyed answer lives in the content. So the caller hands
 * in the questions and this module replays the comparison with `isExactMatch`,
 * the same rule `scoreExam` used at the time.
 *
 * Only submitted attempts count. A session still in progress has answers that
 * the candidate may yet change, and counting them would let a list flicker
 * while its questions are still being worked on.
 */

import { isExactMatch } from "@/features/exam/scoreExam";
import type { Question } from "@/types/content";

import { db, type Response } from "./db";

/** One answer to one question, at one moment. */
export interface HistoryEntry {
  attemptId: string;
  /** When the attempt that produced it was submitted. */
  at: number;
  selected: string[];
  flagged: boolean;
  isCorrect: boolean;
  /** No option was ticked. Separate from wrong — it is not a wrong belief. */
  isUnanswered: boolean;
}

/** Everything one question's history says about it. */
export interface QuestionHistory {
  questionId: string;
  /** Oldest first, so "twice in a row" reads in the order it happened. */
  entries: HistoryEntry[];
}

/** Why a question is on a list. A question can be on more than one. */
export type ListKey = "wrong" | "flagged" | "shaky";

/**
 * A question is "shaky" until it has been answered correctly twice in a row.
 *
 * Two consecutive correct answers is the bar rather than one because a single
 * hit after a run of misses is as likely to be a guess as knowledge, and it is
 * exactly the claim the list makes: "ones I've never got right twice in a
 * row". A question answered only once cannot have met it, so it qualifies.
 *
 * An unanswered entry is not a wrong answer, but it does break a run: two
 * correct answers with a skip between them are not consecutive.
 */
export function isShaky(entries: readonly HistoryEntry[]): boolean {
  let run = 0;

  for (const entry of entries) {
    run = entry.isCorrect ? run + 1 : 0;
    if (run >= 2) return false;
  }

  return true;
}

/** The most recent answer, or undefined for a question with no history. */
export function latestEntry(history: QuestionHistory): HistoryEntry | undefined {
  return history.entries.at(-1);
}

/**
 * Which lists this question belongs on.
 *
 * "wrong" and "flagged" read the LATEST entry only: a question answered wrongly
 * in March and correctly in April is not a current mistake, and a flag cleared
 * in the last session is cleared. "shaky" reads the whole history, because that
 * is what the claim is about.
 */
export function listsFor(history: QuestionHistory): ListKey[] {
  const latest = latestEntry(history);
  if (!latest) return [];

  const lists: ListKey[] = [];
  if (!latest.isCorrect && !latest.isUnanswered) lists.push("wrong");
  if (latest.flagged) lists.push("flagged");
  if (isShaky(history.entries)) lists.push("shaky");

  return lists;
}

/** Group responses by the attempt that produced them, for one lookup per attempt. */
function byAttempt(responses: Response[]): Map<string, Response[]> {
  const grouped = new Map<string, Response[]>();

  for (const response of responses) {
    const rows = grouped.get(response.attemptId);
    if (rows) {
      rows.push(response);
      continue;
    }
    grouped.set(response.attemptId, [response]);
  }

  return grouped;
}

/**
 * Every question the candidate has ever answered for this certification, with
 * its full history — regardless of whether the question is still published.
 * Filtering to what the pool can still serve is the caller's job, because a
 * retired question should still be visible in a list even though no session
 * can ask it again.
 *
 * `questions` supplies the keyed answers. A question missing from it (retired,
 * or from a chunk that failed to load) is skipped rather than guessed at:
 * scoring an answer against a key nobody has is how a list starts lying.
 */
export async function buildQuestionHistory(
  certId: string,
  questions: readonly Question[],
): Promise<QuestionHistory[]> {
  const attempts = await db.attempts.where({ certId }).toArray();
  const submitted = attempts.filter((attempt) => attempt.status === "submitted");
  if (submitted.length === 0) return [];

  const responses = await db.responses
    .where("attemptId")
    .anyOf(submitted.map((attempt) => attempt.id))
    .toArray();

  const rowsByAttempt = byAttempt(responses);
  const keyed = new Map(questions.map((question) => [question.id, question.correct]));
  const histories = new Map<string, QuestionHistory>();

  // Oldest attempt first, so each question's entries come out in order.
  const ordered = [...submitted].sort(
    (a, b) => (a.submittedAt ?? a.startedAt) - (b.submittedAt ?? b.startedAt),
  );

  for (const attempt of ordered) {
    const at = attempt.submittedAt ?? attempt.startedAt;

    for (const response of rowsByAttempt.get(attempt.id) ?? []) {
      const correct = keyed.get(response.questionId);
      if (!correct) continue;

      const history = histories.get(response.questionId) ?? {
        questionId: response.questionId,
        entries: [],
      };

      history.entries.push({
        attemptId: attempt.id,
        at,
        selected: response.selected,
        flagged: response.flagged,
        isCorrect: isExactMatch(response.selected, correct),
        isUnanswered: response.selected.length === 0,
      });

      histories.set(response.questionId, history);
    }
  }

  return [...histories.values()];
}

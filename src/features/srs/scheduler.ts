/**
 * F3-01 — Spaced repetition, on `ts-fsrs`.
 *
 * The library owns the algorithm; this module owns the translation between
 * its `Card` (Dates, a numeric `State` enum) and the row stored in
 * `srsCards` (epoch ms, a readable state name). Nothing else in the app
 * imports `ts-fsrs`, so the stored shape is the only contract.
 *
 * The scheduler runs on the library's defaults: 90% target retention, short-term
 * learning steps of 1 and 10 minutes, and no fuzz. Fuzz would randomise an
 * interval after the review screen has already shown it on the button, and
 * the button's number is what the candidate is asked to trust (docs/06 §3.8).
 *
 * How a card enters the deck: a question answered WRONG in any mode. A wrong
 * answer is unambiguous evidence; a right one is not — a lucky guess scores
 * the same as knowledge, which is exactly why the review screen asks the
 * candidate to rate themselves instead of inferring it. So a wrong answer
 * outside the deck counts as a failed review ("Again") for a card already in
 * it, and a right answer outside the deck changes nothing.
 *
 * How a card leaves its schedule (F3-11): the question it stands for is
 * revised. Each card remembers the revision it was scheduled against; a
 * newer one means the candidate's memory is of a text that no longer exists,
 * so a card in review goes back to relearning, due now.
 */

import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from "ts-fsrs";

import type { SrsCard, SrsState } from "@/lib/db/db";

/** The four buttons, in the order the review screen shows them. */
export const GRADES = ["again", "hard", "good", "easy"] as const;
export type SrsGrade = (typeof GRADES)[number];

const RATING: Record<SrsGrade, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

const STATE_NAME: Record<State, SrsState> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
};

const STATE_VALUE: Record<SrsState, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
};

const scheduler = fsrs({ enable_fuzz: false });

const DAY_MS = 86_400_000;

/** The stored row as the library's card. */
export function toFsrsCard(row: SrsCard, now: number): Card {
  const lastReview = row.lastReviewedAt === undefined ? undefined : new Date(row.lastReviewedAt);

  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    // Deprecated in ts-fsrs 5 and recomputed from `last_review` by the
    // scheduler; filled in only because the type still requires it.
    elapsed_days: lastReview ? Math.max(0, Math.floor((now - lastReview.getTime()) / DAY_MS)) : 0,
    scheduled_days: row.scheduledDays,
    learning_steps: row.learningSteps,
    reps: row.reps,
    lapses: row.lapses,
    state: STATE_VALUE[row.state],
    last_review: lastReview,
  };
}

/**
 * The library's card as a row, keeping the row's identity, the moment it
 * joined the deck and the question revision it is scheduled against.
 */
export function fromFsrsCard(
  card: Card,
  identity: Pick<SrsCard, "questionId" | "certId" | "addedAt" | "revision">,
): SrsCard {
  const row: SrsCard = {
    questionId: identity.questionId,
    certId: identity.certId,
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: STATE_NAME[card.state],
    addedAt: identity.addedAt,
  };

  if (card.last_review) row.lastReviewedAt = card.last_review.getTime();
  if (identity.revision !== undefined) row.revision = identity.revision;
  return row;
}

/** A card that has never been reviewed, due immediately. */
export function newCard(
  questionId: string,
  certId: string,
  now: number,
  revision?: number,
): SrsCard {
  return fromFsrsCard(createEmptyCard(new Date(now)), {
    questionId,
    certId,
    addedAt: now,
    revision,
  });
}

/** The card after rating it `grade` at `now`. */
export function gradeCard(row: SrsCard, grade: SrsGrade, now: number): SrsCard {
  const { card } = scheduler.next(toFsrsCard(row, now), new Date(now), RATING[grade]);
  return fromFsrsCard(card, row);
}

/**
 * When each grade would make the card due next, as epoch ms.
 *
 * The same scheduler call `gradeCard` makes, run for all four grades at once,
 * so the interval printed on a button is the interval that button applies.
 */
export function previewDue(row: SrsCard, now: number): Record<SrsGrade, number> {
  const preview = scheduler.repeat(toFsrsCard(row, now), new Date(now));

  return {
    again: preview[Rating.Again].card.due.getTime(),
    hard: preview[Rating.Hard].card.due.getTime(),
    good: preview[Rating.Good].card.due.getTime(),
    easy: preview[Rating.Easy].card.due.getTime(),
  };
}

export function isDue(row: SrsCard, now: number): boolean {
  return row.due <= now;
}

/**
 * What a finished session does to the deck: the rows to write.
 *
 * Only questions answered wrong move anything. A question that is not in the
 * deck yet joins it as a new card, due now. One already in it is rated
 * "Again", unless it is still new — a new card is already due, and rating it
 * here would spend its first learning step on a review the candidate never
 * made on the review screen.
 *
 * Pure, so the rule is unit-tested; `srsCards.ts` runs it inside the same
 * transaction that submits the attempt.
 */
export function deckUpdatesForWrongAnswers(
  wrongQuestionIds: readonly string[],
  existing: ReadonlyMap<string, SrsCard>,
  certId: string,
  now: number,
  revisionOf: (questionId: string) => number | undefined = () => undefined,
): SrsCard[] {
  const updates: SrsCard[] = [];

  for (const questionId of new Set(wrongQuestionIds)) {
    const card = existing.get(questionId);
    const revision = revisionOf(questionId);
    if (!card) {
      updates.push(newCard(questionId, certId, now, revision));
      continue;
    }
    if (card.state === "new") continue;

    // The wrong answer was given to this revision's text.
    const failed = gradeCard(card, "again", now);
    updates.push(revision === undefined ? failed : { ...failed, revision });
  }

  return updates;
}

/**
 * F3-11 — the card for a question that may have been revised, or null when
 * nothing changes.
 *
 * A card with no revision predates F3-11: which text it was scheduled
 * against is unknown, so it adopts the current one and keeps its schedule —
 * sending every old card back to relearning would punish a change nobody can
 * show happened. A newer revision resets what the candidate remembers: a card
 * in review goes to relearning, due now, with its stability and difficulty
 * kept for the scheduler's next step; one still being learned just comes due.
 * No lapse is counted, because nothing was forgotten.
 */
export function reviseCard(card: SrsCard, revision: number, now: number): SrsCard | null {
  if (card.revision === undefined) return { ...card, revision };
  if (revision <= card.revision) return null;

  if (card.state === "review") {
    return { ...card, state: "relearning", due: now, learningSteps: 0, revision };
  }
  return { ...card, due: Math.min(card.due, now), revision };
}

/** The deck's revised cards, the rows to write. A question no longer in the index is left alone. */
export function deckRevisions(
  deck: readonly SrsCard[],
  revisionOf: (questionId: string) => number | undefined,
  now: number,
): SrsCard[] {
  return deck.flatMap((card) => {
    const revision = revisionOf(card.questionId);
    if (revision === undefined) return [];
    const revised = reviseCard(card, revision, now);
    return revised ? [revised] : [];
  });
}

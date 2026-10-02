/**
 * F3-01 — the repetition deck in IndexedDB.
 *
 * The scheduling rules live in `src/features/srs/scheduler.ts`, as pure
 * functions; this file only reads and writes `srsCards`.
 */

import { deckUpdatesForWrongAnswers, gradeCard, type SrsGrade } from "@/features/srs/scheduler";

import { db, type SrsCard } from "./db";

/** Every card in one certification's deck. Small enough to filter in memory. */
export async function loadDeck(certId: string): Promise<SrsCard[]> {
  return db.srsCards.where("certId").equals(certId).toArray();
}

/** Rates a card on the review screen, now, and stores the result. */
export async function rateCard(card: SrsCard, grade: SrsGrade): Promise<SrsCard> {
  const rated = gradeCard(card, grade, Date.now());
  await db.srsCards.put(rated);
  return rated;
}

/**
 * Puts the questions a finished session got wrong into the deck.
 *
 * Called from inside the transaction that submits the attempt, so a submitted
 * attempt and its deck changes land together or not at all. Dexie joins the
 * caller's transaction as long as `srsCards` is in its scope.
 */
export async function addWrongAnswersToDeck(
  certId: string,
  wrongQuestionIds: readonly string[],
  now: number,
): Promise<void> {
  if (wrongQuestionIds.length === 0) return;

  const rows = await db.srsCards.bulkGet([...wrongQuestionIds]);
  const existing = new Map<string, SrsCard>();
  for (const row of rows) {
    if (row) existing.set(row.questionId, row);
  }

  const updates = deckUpdatesForWrongAnswers(wrongQuestionIds, existing, certId, now);
  if (updates.length === 0) return;

  await db.srsCards.bulkPut(updates);
}

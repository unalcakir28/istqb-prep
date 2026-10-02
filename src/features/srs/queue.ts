/**
 * F3-02 — which cards the review screen shows, and in what order.
 *
 * A card whose question is no longer published (retired, or gone from the
 * index) is skipped rather than shown: the candidate cannot be asked a
 * question the pool no longer stands behind. It stays in the deck, so it
 * comes back if the question is ever republished. The home screen counts
 * with the same function, so the number it shows is the number the review
 * screen then serves.
 */

import type { SrsCard } from "@/lib/db/db";

import { isDue } from "./scheduler";

export interface DeckSummary {
  /** Due now, the most overdue first. */
  due: SrsCard[];
  /** Cards in the deck whose question is still published. */
  size: number;
  /** When the earliest card that is not yet due becomes due, or null if none is waiting. */
  nextDueAt: number | null;
}

export function summarizeDeck(
  deck: readonly SrsCard[],
  published: ReadonlySet<string>,
  now: number,
): DeckSummary {
  const live = deck.filter((card) => published.has(card.questionId));
  const due = live.filter((card) => isDue(card, now)).sort((a, b) => a.due - b.due);
  const waiting = live.filter((card) => !isDue(card, now)).map((card) => card.due);

  return {
    due,
    size: live.length,
    nextDueAt: waiting.length > 0 ? Math.min(...waiting) : null,
  };
}

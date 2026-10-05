/**
 * F3-02 — which cards the review screen shows, and in what order.
 *
 * A card whose question is no longer published (retired, or gone from the
 * index) is skipped rather than shown: the candidate cannot be asked a
 * question the pool no longer stands behind. It stays in the deck, so it
 * comes back if the question is ever republished. The home screen counts
 * with the same function, so the number it shows is the number the review
 * screen then serves.
 *
 * F3-03 — the review screen also spreads siblings apart (`spreadSiblings`):
 * two cards of the same learning objective are not served back to back,
 * because the first one's rationale answers the second.
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

/**
 * Reorders cards so that no two neighbours share a learning objective, while
 * keeping the given order (most overdue first) wherever the rule allows.
 *
 * Each position takes the earliest remaining card that shares no objective
 * with the card before it. A card that clashes with every remaining choice
 * goes into the latest gap whose two neighbours it does not clash with, so
 * `[x1, a1, a2]` becomes `[a2, x1, a1]` rather than ending on two siblings.
 * Only when no gap exists — the deck is all one objective, say — do two
 * siblings meet: a card that is due is moved, never held back.
 */
export function spreadSiblings<T extends { questionId: string }>(
  cards: readonly T[],
  objectivesOf: (questionId: string) => readonly string[],
): T[] {
  const clash = (card: T, neighbour: T | undefined) =>
    neighbour !== undefined &&
    objectivesOf(card.questionId).some((code) => objectivesOf(neighbour.questionId).includes(code));

  const remaining = [...cards];
  const ordered: T[] = [];

  while (remaining.length > 0) {
    const index = remaining.findIndex((card) => !clash(card, ordered.at(-1)));
    if (index !== -1) {
      ordered.push(...remaining.splice(index, 1));
      continue;
    }

    const [forced] = remaining.splice(0, 1);
    ordered.splice(latestGap(ordered, forced, clash), 0, forced);
  }

  return ordered;
}

/** The latest position where `card` clashes with neither neighbour, or the end if there is none. */
function latestGap<T>(
  ordered: readonly T[],
  card: T,
  clash: (a: T, b: T | undefined) => boolean,
): number {
  for (let gap = ordered.length; gap >= 0; gap--) {
    if (!clash(card, ordered[gap - 1]) && !clash(card, ordered[gap])) return gap;
  }
  return ordered.length;
}

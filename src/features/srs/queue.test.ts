import { describe, expect, it } from "vitest";

import { summarizeDeck } from "./queue";
import { newCard } from "./scheduler";
import type { SrsCard } from "@/lib/db/db";

const NOW = Date.UTC(2026, 9, 2, 10, 0, 0);
const CERT = "ctfl-v4.0.1";

function card(questionId: string, due: number): SrsCard {
  return { ...newCard(questionId, CERT, NOW), due };
}

describe("summarizeDeck", () => {
  it("serves the due cards most overdue first, and says when the next one is due", () => {
    const deck = [card("q1", NOW - 1_000), card("q2", NOW - 9_000), card("q3", NOW + 5_000)];
    const summary = summarizeDeck(deck, new Set(["q1", "q2", "q3"]), NOW);

    expect(summary.due.map((row) => row.questionId)).toEqual(["q2", "q1"]);
    expect(summary.size).toBe(3);
    expect(summary.nextDueAt).toBe(NOW + 5_000);
  });

  it("counts a card due exactly now as due", () => {
    const summary = summarizeDeck([card("q1", NOW)], new Set(["q1"]), NOW);

    expect(summary.due).toHaveLength(1);
    expect(summary.nextDueAt).toBeNull();
  });

  it("skips a card whose question is no longer published, in every number", () => {
    const deck = [card("q1", NOW - 1_000), card("retired", NOW - 1_000), card("gone", NOW + 1)];
    const summary = summarizeDeck(deck, new Set(["q1"]), NOW);

    expect(summary.due.map((row) => row.questionId)).toEqual(["q1"]);
    expect(summary.size).toBe(1);
    expect(summary.nextDueAt).toBeNull();
  });

  it("reports an empty deck as empty", () => {
    expect(summarizeDeck([], new Set(), NOW)).toEqual({ due: [], size: 0, nextDueAt: null });
  });
});

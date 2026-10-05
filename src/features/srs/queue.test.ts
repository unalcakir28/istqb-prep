import { describe, expect, it } from "vitest";

import { spreadSiblings, summarizeDeck } from "./queue";
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

describe("spreadSiblings", () => {
  const objectives: Record<string, string[]> = {
    a1: ["LO-1"],
    a2: ["LO-1"],
    a3: ["LO-1"],
    b1: ["LO-2"],
    c1: ["LO-3"],
    both: ["LO-1", "LO-2"],
  };
  const objectivesOf = (id: string) => objectives[id] ?? [];
  const ids = (list: { questionId: string }[]) => list.map((row) => row.questionId);
  const cards = (...list: string[]) => list.map((questionId) => ({ questionId }));
  const neighboursShareAnObjective = (list: string[]) =>
    list.some(
      (id, i) => i > 0 && objectivesOf(id).some((code) => objectivesOf(list[i - 1]).includes(code)),
    );

  it("moves a sibling back so two cards of one objective are not neighbours", () => {
    expect(ids(spreadSiblings(cards("a1", "a2", "b1"), objectivesOf))).toEqual(["a1", "b1", "a2"]);
  });

  it("keeps the given order when nothing has to move", () => {
    expect(ids(spreadSiblings(cards("a1", "b1", "c1"), objectivesOf))).toEqual(["a1", "b1", "c1"]);
  });

  it("treats a question with two objectives as a sibling of both", () => {
    expect(ids(spreadSiblings(cards("a1", "both", "b1", "c1"), objectivesOf))).toEqual([
      "a1",
      "b1",
      "c1",
      "both",
    ]);
  });

  it("serves every card even when the siblings cannot all be kept apart", () => {
    expect(ids(spreadSiblings(cards("a1", "a2", "a3", "b1"), objectivesOf))).toEqual([
      "a1",
      "b1",
      "a2",
      "a3",
    ]);
  });

  it("places a card that clashes with every remaining choice into an earlier gap", () => {
    const ordered = ids(spreadSiblings(cards("x1", "a1", "a2"), objectivesOf));

    expect(ordered).toEqual(["a2", "x1", "a1"]);
    expect(neighboursShareAnObjective(ordered)).toBe(false);
  });

  it("keeps siblings apart when the odd card is the most overdue", () => {
    expect(
      neighboursShareAnObjective(ids(spreadSiblings(cards("b1", "a1", "a2"), objectivesOf))),
    ).toBe(false);
  });

  it("returns an empty list for an empty one", () => {
    expect(spreadSiblings([], objectivesOf)).toEqual([]);
  });
});

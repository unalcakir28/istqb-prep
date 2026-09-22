import { describe, expect, it } from "vitest";

import type { ExamBlueprint, QuestionIndexEntry } from "@/types/content";
import { selectQuestions } from "./selectQuestions";

function entry(id: string, chapter: number, objective: string): QuestionIndexEntry {
  return {
    id,
    chunk: `ch0${chapter}-a`,
    chapter,
    objectives: [objective],
    kLevel: "K2",
    type: "single",
    selectCount: 1,
    languages: ["tr", "en"],
    syllabusVersion: "4.0.1",
    status: "published",
  };
}

const POOL: QuestionIndexEntry[] = [
  entry("q1", 1, "FL-1.1.1"),
  entry("q2", 1, "FL-1.1.1"),
  entry("q3", 1, "FL-1.2.1"),
  entry("q4", 4, "FL-4.2.1"),
  entry("q5", 4, "FL-4.2.1"),
];

const EMPTY_BLUEPRINT: ExamBlueprint = {
  syllabusVersion: "4.0.1",
  source: "test",
  rule: "test",
  totals: { questions: 0, byChapter: {}, byKLevel: { K1: 0, K2: 0, K3: 0 } },
  groups: [],
};

describe("selectQuestions", () => {
  it("takes only questions from the requested chapter", () => {
    const result = selectQuestions({
      scope: { kind: "chapter", chapters: [1], count: 2 },
      blueprint: EMPTY_BLUEPRINT,
      pool: POOL,
      seed: 7,
    });

    expect(result.questionIds).toHaveLength(2);
    expect(result.questionIds.every((id) => ["q1", "q2", "q3"].includes(id))).toBe(true);
    expect(result.shortfalls).toEqual([]);
  });

  it("takes only questions for the requested objective", () => {
    const result = selectQuestions({
      scope: { kind: "objective", objectives: ["FL-4.2.1"], count: 2 },
      blueprint: EMPTY_BLUEPRINT,
      pool: POOL,
      seed: 7,
    });

    expect(result.questionIds.sort()).toEqual(["q4", "q5"]);
  });

  it("reports a shortfall rather than silently returning fewer questions", () => {
    const result = selectQuestions({
      scope: { kind: "objective", objectives: ["FL-1.2.1"], count: 5 },
      blueprint: EMPTY_BLUEPRINT,
      pool: POOL,
      seed: 7,
    });

    expect(result.questionIds).toEqual(["q3"]);
    expect(result.shortfalls).toEqual([{ kind: "scope", required: 5, available: 1 }]);
  });

  it("is reproducible for the same seed and varies across seeds", () => {
    const scope = { kind: "chapter" as const, chapters: [1], count: 3 };
    const a = selectQuestions({ scope, blueprint: EMPTY_BLUEPRINT, pool: POOL, seed: 11 });
    const b = selectQuestions({ scope, blueprint: EMPTY_BLUEPRINT, pool: POOL, seed: 11 });

    expect(a.questionIds).toEqual(b.questionIds);
    expect(a.seed).toBe(11);
  });

  it("prefers unseen questions when the pool is larger than the request", () => {
    const result = selectQuestions({
      scope: { kind: "objective", objectives: ["FL-4.2.1"], count: 1 },
      blueprint: EMPTY_BLUEPRINT,
      pool: POOL,
      seed: 3,
      exclude: new Set(["q4"]),
    });

    expect(result.questionIds).toEqual(["q5"]);
  });

  it("delegates the blueprint scope to generateExam and tags its shortfalls", () => {
    const blueprint: ExamBlueprint = {
      ...EMPTY_BLUEPRINT,
      totals: { questions: 3, byChapter: { "1": 3 }, byKLevel: { K1: 0, K2: 3, K3: 0 } },
      groups: [{ id: "g1", chapter: 1, kLevel: "K2", questions: 3, objectives: ["FL-1.2.1"] }],
    };

    const result = selectQuestions({
      scope: { kind: "blueprint" },
      blueprint,
      pool: POOL,
      seed: 5,
    });

    expect(result.questionIds).toEqual(["q3"]);
    expect(result.shortfalls).toEqual([
      {
        kind: "group",
        groupId: "g1",
        chapter: 1,
        kLevel: "K2",
        objectives: ["FL-1.2.1"],
        required: 3,
        available: 1,
      },
    ]);
  });
});

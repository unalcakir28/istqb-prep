import { describe, expect, it } from "vitest";

import { groupPoints, pointsByKLevel } from "./points";
import type { BlueprintGroup, ExamBlueprint } from "@/types/content";

function group(
  id: string,
  kLevel: BlueprintGroup["kLevel"],
  pointsPerQuestion?: number,
): BlueprintGroup {
  return { id, chapter: 1, kLevel, questions: 1, objectives: ["AI-1.1.1"], pointsPerQuestion };
}

function blueprint(groups: BlueprintGroup[]): ExamBlueprint {
  return {
    syllabusVersion: "2.0",
    source: "test",
    rule: "test",
    totals: { questions: groups.length, byChapter: {}, byKLevel: { K1: 0, K2: 0, K3: 0 } },
    groups,
  };
}

describe("question points", () => {
  it("reads a group with no pointsPerQuestion as worth 1, as every CTFL group is", () => {
    expect(groupPoints(group("g1", "K2"))).toBe(1);
    expect(pointsByKLevel(blueprint([group("g1", "K1"), group("g2", "K3")]))).toEqual([
      { kLevel: "K1", points: 1 },
      { kLevel: "K3", points: 1 },
    ]);
  });

  it("gives each K-level the exam asks its points, lowest level first", () => {
    const mixed = blueprint([group("g2", "K3", 2), group("g1", "K2")]);

    expect(pointsByKLevel(mixed)).toEqual([
      { kLevel: "K2", points: 1 },
      { kLevel: "K3", points: 2 },
    ]);
  });
});

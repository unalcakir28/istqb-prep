/**
 * F4-01 — what one question is worth, by K-level.
 *
 * CTFL v4.0.1 never needed this: every question is worth 1 point. CT-AI v2.0
 * is the first certification where they differ — a K3 question is worth 2 —
 * and the exam tables give it per LO group, so it is read from the blueprint
 * rather than written into the code.
 */

import type { BlueprintGroup, ExamBlueprint, KLevel } from "@/types/content";

const K_ORDER: readonly KLevel[] = ["K1", "K2", "K3"];

export function groupPoints(group: BlueprintGroup): number {
  return group.pointsPerQuestion ?? 1;
}

export interface LevelPoints {
  kLevel: KLevel;
  points: number;
}

/**
 * The points a question of each K-level the exam asks is worth, lowest level
 * first. Empty for a blueprint with no groups. A level whose groups disagree
 * is reported at the highest value its groups give; check #24 refuses such a
 * blueprint, so the case never reaches a screen.
 */
export function pointsByKLevel(blueprint: ExamBlueprint): LevelPoints[] {
  const byLevel = new Map<KLevel, number>();
  for (const group of blueprint.groups) {
    byLevel.set(group.kLevel, Math.max(byLevel.get(group.kLevel) ?? 0, groupPoints(group)));
  }

  return K_ORDER.filter((level) => byLevel.has(level)).map((level) => ({
    kLevel: level,
    points: byLevel.get(level) ?? 1,
  }));
}

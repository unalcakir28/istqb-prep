/**
 * F1-05 — Exam generation against the official blueprint.
 *
 * An exam is not produced by pulling 40 random questions from the pool. The
 * official exam is built from the LO groups in `exam-blueprint.json`, and that
 * file's rule is applied verbatim:
 *
 *   "If a group has more questions than learning objectives, every LO
 *    contributes AT LEAST one question. If it has more LOs than questions,
 *    every question covers a DIFFERENT LO."
 *
 * The exam constants (40 questions, 8/6/4/11/9/2, K 8/24/8) are NOT hard-coded
 * here — all of them are read from the blueprint. If the blueprint changes, the
 * engine follows it on its own.
 *
 * If the pool is too small, the exam is never silently short (F1-05c): every
 * group that fell short is reported in `shortfalls`, and the caller tells the
 * user.
 */

import type { ExamBlueprint, BlueprintGroup, QuestionIndexEntry } from "@/types/content";
import { createRng, shuffle } from "./rng";

export interface GenerateExamOptions {
  blueprint: ExamBlueprint;
  /** Index entries. Unpublished questions must be filtered out before calling. */
  pool: QuestionIndexEntry[];
  seed: number;
  /**
   * Ids of questions already seen. A preference, not a constraint: if the pool
   * is too small they get reused, because producing a short exam is worse.
   */
  exclude?: ReadonlySet<string>;
}

export interface GroupShortfall {
  groupId: string;
  chapter: number;
  kLevel: string;
  objectives: string[];
  required: number;
  available: number;
}

export interface GeneratedExam {
  seed: number;
  questionIds: string[];
  /** If this is not empty the exam is short, and the user must be told plainly. */
  shortfalls: GroupShortfall[];
}

/** The pool entries eligible to serve as a question for a group. */
function candidatesForGroup(group: BlueprintGroup, pool: QuestionIndexEntry[]) {
  const objectives = new Set(group.objectives);

  return pool.filter(
    (entry) =>
      entry.chapter === group.chapter &&
      entry.kLevel === group.kLevel &&
      entry.objectives.some((code) => objectives.has(code)),
  );
}

/** Unseen questions come first; within a group the order depends on the seed. */
function preferUnseen(
  entries: QuestionIndexEntry[],
  exclude: ReadonlySet<string>,
  rng: () => number,
): QuestionIndexEntry[] {
  const shuffled = shuffle(entries, rng);
  const unseen = shuffled.filter((entry) => !exclude.has(entry.id));
  const seen = shuffled.filter((entry) => exclude.has(entry.id));
  return [...unseen, ...seen];
}

/**
 * Picks the requested number of questions from a group and applies the
 * blueprint's LO rule.
 *
 * One question is handed to each LO in turn first (round-robin). That
 * satisfies both halves of the rule at once: with fewer questions than LOs,
 * every question lands on a different LO; with more, every LO gets at least
 * one and the remainder is dealt out again.
 */
function selectFromGroup(
  group: BlueprintGroup,
  pool: QuestionIndexEntry[],
  exclude: ReadonlySet<string>,
  rng: () => number,
): string[] {
  const candidates = candidatesForGroup(group, pool);
  if (candidates.length === 0) return [];

  const byObjective = new Map<string, QuestionIndexEntry[]>();
  for (const code of group.objectives) {
    const forCode = candidates.filter((entry) => entry.objectives.includes(code));
    if (forCode.length > 0) byObjective.set(code, preferUnseen(forCode, exclude, rng));
  }

  const selected: string[] = [];
  const used = new Set<string>();
  // The LO order depends on the seed too, so which LOs get a question varies between exams.
  const objectiveOrder = shuffle([...byObjective.keys()], rng);

  while (selected.length < group.questions) {
    let addedThisPass = false;

    for (const code of objectiveOrder) {
      if (selected.length >= group.questions) break;

      const queue = byObjective.get(code) ?? [];
      const next = queue.find((entry) => !used.has(entry.id));
      if (!next) continue;

      used.add(next.id);
      selected.push(next.id);
      addedThisPass = true;
    }

    // If no LO can supply a new question the pool is exhausted; no infinite loop.
    if (!addedThisPass) break;
  }

  return selected;
}

export function generateExam({
  blueprint,
  pool,
  seed,
  exclude = new Set<string>(),
}: GenerateExamOptions): GeneratedExam {
  const rng = createRng(seed);
  const questionIds: string[] = [];
  const shortfalls: GroupShortfall[] = [];

  for (const group of blueprint.groups) {
    const selected = selectFromGroup(group, pool, exclude, rng);
    questionIds.push(...selected);

    if (selected.length >= group.questions) continue;

    shortfalls.push({
      groupId: group.id,
      chapter: group.chapter,
      kLevel: group.kLevel,
      objectives: group.objectives,
      required: group.questions,
      available: selected.length,
    });
  }

  // Questions are asked shuffled, not in blueprint order; otherwise the exam
  // would walk chapter by chapter, and the real exam does not behave that way.
  return { seed, questionIds: shuffle(questionIds, rng), shortfalls };
}

/**
 * Reduces the short groups to chapters: chapter -> how many questions that
 * chapter is missing.
 *
 * Groups that are not short deliver their full target, so a chapter's
 * achievable count falls below its target by exactly this difference.
 */
export function shortfallsByChapter(shortfalls: GroupShortfall[]): Map<number, number> {
  const missing = new Map<number, number>();

  for (const shortfall of shortfalls) {
    const current = missing.get(shortfall.chapter) ?? 0;
    missing.set(shortfall.chapter, current + (shortfall.required - shortfall.available));
  }

  return missing;
}

/** Says in advance whether the pool can produce a complete exam. */
export function previewCoverage(
  blueprint: ExamBlueprint,
  pool: QuestionIndexEntry[],
): { total: number; shortfalls: GroupShortfall[] } {
  const shortfalls: GroupShortfall[] = [];
  let total = 0;

  for (const group of blueprint.groups) {
    const available = candidatesForGroup(group, pool).length;
    const usable = Math.min(available, group.questions);
    total += usable;

    if (available >= group.questions) continue;

    shortfalls.push({
      groupId: group.id,
      chapter: group.chapter,
      kLevel: group.kLevel,
      objectives: group.objectives,
      required: group.questions,
      available,
    });
  }

  return { total, shortfalls };
}

/**
 * Question selection for all three modes.
 *
 * The blueprint path is not reimplemented here — it delegates to
 * `generateExam`, whose distribution is verified across 50 independent seeds.
 * Only the scoped paths (a set of chapters, or a set of learning objectives)
 * are new.
 *
 * All three paths return the same shape so the session store has one contract,
 * and no path ever returns fewer questions than asked for without saying so.
 */

import type { AttemptScope } from "@/lib/db/db";
import type { ExamBlueprint, QuestionIndexEntry } from "@/types/content";
import { generateExam, preferUnseen, type GroupShortfall } from "./generateExam";
import { createRng, shuffle } from "./rng";

export type Shortfall =
  ({ kind: "group" } & GroupShortfall) | { kind: "scope"; required: number; available: number };

export interface SelectionResult {
  seed: number;
  questionIds: string[];
  /** Empty means the request was satisfied in full. */
  shortfalls: Shortfall[];
}

export interface SelectQuestionsOptions {
  scope: AttemptScope;
  blueprint: ExamBlueprint;
  /** Index entries. Unpublished questions must be filtered out before calling. */
  pool: QuestionIndexEntry[];
  seed: number;
  exclude?: ReadonlySet<string>;
}

type ScopedScope = Exclude<AttemptScope, { kind: "blueprint" }>;

function matchesScope(entry: QuestionIndexEntry, scope: ScopedScope): boolean {
  if (scope.kind === "chapter") return scope.chapters.includes(entry.chapter);
  return entry.objectives.some((code) => scope.objectives.includes(code));
}

function selectScoped(
  scope: ScopedScope,
  pool: QuestionIndexEntry[],
  seed: number,
  exclude: ReadonlySet<string>,
): SelectionResult {
  const rng = createRng(seed);
  const matches = pool.filter((entry) => matchesScope(entry, scope));
  const ordered = preferUnseen(matches, exclude, rng);
  const questionIds = ordered.slice(0, scope.count).map((entry) => entry.id);

  const shortfalls: Shortfall[] =
    questionIds.length >= scope.count
      ? []
      : [{ kind: "scope", required: scope.count, available: questionIds.length }];

  return { seed, questionIds: shuffle(questionIds, rng), shortfalls };
}

export function selectQuestions({
  scope,
  blueprint,
  pool,
  seed,
  exclude = new Set<string>(),
}: SelectQuestionsOptions): SelectionResult {
  if (scope.kind !== "blueprint") return selectScoped(scope, pool, seed, exclude);

  const generated = generateExam({ blueprint, pool, seed, exclude });

  return {
    seed: generated.seed,
    questionIds: generated.questionIds,
    shortfalls: generated.shortfalls.map((shortfall) => ({ kind: "group", ...shortfall })),
  };
}

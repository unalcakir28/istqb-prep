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

/** The rule-based scopes: a filter over the pool, capped at a requested count. */
type RuleScope = Extract<AttemptScope, { kind: "chapter" | "objective" }>;

/** A named list of ids, already decided elsewhere (a retry set, a saved list). */
type ExplicitScope = Extract<AttemptScope, { kind: "questions" }>;

function matchesScope(entry: QuestionIndexEntry, scope: RuleScope): boolean {
  if (scope.kind === "chapter") return scope.chapters.includes(entry.chapter);
  return entry.objectives.some((code) => scope.objectives.includes(code));
}

function shortfallFor(available: number, required: number): Shortfall[] {
  if (available >= required) return [];
  return [{ kind: "scope", required, available }];
}

function selectScoped(
  scope: RuleScope,
  pool: QuestionIndexEntry[],
  seed: number,
  exclude: ReadonlySet<string>,
): SelectionResult {
  const rng = createRng(seed);
  const matches = pool.filter((entry) => matchesScope(entry, scope));
  const ordered = preferUnseen(matches, exclude, rng);
  const questionIds = ordered.slice(0, scope.count).map((entry) => entry.id);

  return {
    seed,
    questionIds: shuffle(questionIds, rng),
    shortfalls: shortfallFor(questionIds.length, scope.count),
  };
}

/**
 * An explicit list: the questions the candidate got wrong, or flagged.
 *
 * The pool still has the final say. A question retired or unpublished since
 * the attempt that named it simply is not there any more, and dropping it
 * silently would be the "silently short" failure rule 8 forbids — so what is
 * missing is reported as a shortfall exactly as it is for a rule scope.
 *
 * `exclude` is deliberately not applied. "Avoid what I have seen" cannot mean
 * anything here: every question in the set was seen, which is why it is in the
 * set.
 */
function selectExplicit(
  scope: ExplicitScope,
  pool: QuestionIndexEntry[],
  seed: number,
): SelectionResult {
  const rng = createRng(seed);
  const stillPublished = new Set(pool.map((entry) => entry.id));
  const questionIds = scope.questionIds.filter((id) => stillPublished.has(id));

  return {
    seed,
    questionIds: shuffle(questionIds, rng),
    shortfalls: shortfallFor(questionIds.length, scope.questionIds.length),
  };
}

export function selectQuestions({
  scope,
  blueprint,
  pool,
  seed,
  exclude = new Set<string>(),
}: SelectQuestionsOptions): SelectionResult {
  if (scope.kind === "questions") return selectExplicit(scope, pool, seed);
  if (scope.kind !== "blueprint") return selectScoped(scope, pool, seed, exclude);

  const generated = generateExam({ blueprint, pool, seed, exclude });

  return {
    seed: generated.seed,
    questionIds: generated.questionIds,
    shortfalls: generated.shortfalls.map((shortfall) => ({ kind: "group", ...shortfall })),
  };
}

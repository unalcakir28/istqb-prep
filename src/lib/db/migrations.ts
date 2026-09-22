/**
 * Dexie schema migrations that need logic rather than an index change.
 *
 * The backfill lives here as a plain function rather than inline in the
 * upgrade hook so it can be unit-tested: jsdom has no IndexedDB, so the hook
 * itself can only be exercised end-to-end.
 */

import type { Attempt } from "./db";

/** An attempt row as written by schema v1 or v2: the v3 fields may be absent. */
export type LegacyAttempt = Omit<Attempt, "mode" | "instantFeedback" | "scope"> &
  Partial<Pick<Attempt, "mode" | "instantFeedback" | "scope">>;

/**
 * Mutates the row in place, the way Dexie's `Collection.modify` expects.
 *
 * Every attempt written before v3 was a blueprint-driven timed exam with no
 * feedback, so those are the defaults. Rows that already carry the fields are
 * left alone, which makes the migration safe to run twice.
 */
export function applyAttemptV3Defaults(row: LegacyAttempt): void {
  row.mode ??= "exam";
  row.instantFeedback ??= false;
  row.scope ??= { kind: "blueprint" };
}

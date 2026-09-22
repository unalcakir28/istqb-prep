/**
 * Where an attempt belongs on screen.
 *
 * An attempt opened from the wrong mode's URL — a bookmark, a back button, a
 * stale link — is redirected here rather than rendered with the wrong rules.
 */

import type { Attempt } from "@/lib/db/db";

export function routeForAttempt(attempt: Pick<Attempt, "id" | "mode" | "scope">): string {
  if (attempt.mode === "exam") return `/sinav/${attempt.id}`;
  if (attempt.mode === "practice") return `/alistirma/${attempt.id}`;

  const objective = attempt.scope.kind === "objective" ? attempt.scope.objectives[0] : undefined;
  if (!objective) return `/alistirma/${attempt.id}`;

  return `/calisma/lo/${objective}/${attempt.id}`;
}

/**
 * The path the current route must be redirected to, or null to render in place.
 *
 * The identity check is not defensive noise. The session store is a
 * module-level singleton and `resumeAttempt` sets `loading` without clearing
 * `attempt`, so during a new route's first render the attempt in hand can
 * still be the one the user just left. Every path `routeForAttempt` returns
 * embeds the attempt's own id, so a stale attempt can never match the incoming
 * URL — redirecting on it would throw the user back into the previous session.
 */
export function redirectPathFor(
  attempt: Pick<Attempt, "id" | "mode" | "scope"> | null | undefined,
  attemptId: string,
  pathname: string,
): string | null {
  if (!attempt) return null;
  if (attempt.id !== attemptId) return null;

  const expected = routeForAttempt(attempt);
  if (expected === pathname) return null;

  return expected;
}

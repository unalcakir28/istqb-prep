/**
 * F1-08 — pure timer maths for the exam session.
 *
 * The countdown is derived from `attempt.deadlineAt`, an absolute timestamp,
 * and never from a stored "seconds left" counter: a backgrounded tab throttles
 * `setInterval` to once a minute or stops it entirely, so a decrementing
 * counter would drift and hand the candidate free time. Every tick recomputes
 * `deadlineAt - Date.now()`, which stays correct even if the tab slept for ten
 * minutes.
 *
 * Kept free of React so the boundaries can be tested without a clock.
 */

/** Amber from this point on (docs/06 §3.3). */
export const WARNING_MS = 10 * 60_000;
/** Red — and screen-reader announcement — from this point on. */
export const CRITICAL_MS = 60_000;

export type TimerUrgency = "normal" | "warning" | "critical" | "expired";

/** Milliseconds left, clamped at zero. */
export function remainingMs(deadlineAt: number, now: number): number {
  const left = deadlineAt - now;
  if (left <= 0) return 0;
  return left;
}

/**
 * Whole seconds left, rounded up: with 4.2s left the clock reads 5, and it
 * only reaches 0 when the time really is up.
 */
export function remainingSeconds(ms: number): number {
  if (ms <= 0) return 0;
  return Math.ceil(ms / 1000);
}

/** `mm:ss`; the exam never exceeds 75 minutes, so hours are not needed. */
export function formatRemaining(ms: number): string {
  const total = remainingSeconds(ms);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function timerUrgency(ms: number): TimerUrgency {
  if (ms <= 0) return "expired";
  if (ms <= CRITICAL_MS) return "critical";
  if (ms <= WARNING_MS) return "warning";
  return "normal";
}

/**
 * Which minute mark a screen reader should hear, or `null` for silence.
 *
 * Announcing every second would make the session unusable with a screen
 * reader, so the live region only speaks once per remaining minute inside the
 * final ten, and once more at zero (docs/06 §8).
 */
export function announcementMinute(ms: number): number | null {
  if (ms <= 0) return 0;
  if (ms > WARNING_MS) return null;

  return Math.ceil(ms / 60_000);
}

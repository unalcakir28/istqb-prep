/**
 * Score bar (F1-12).
 *
 * Design decision (docs/06 §3.4): the pass-mark line is ALWAYS drawn — both
 * when the candidate passed and when they failed. The score is never
 * smoothed or rounded; the bar shows the real score, and the threshold sits
 * on top of the bar as a clear mark.
 *
 * Color never carries meaning on its own (WCAG 1.4.1): the bar is always
 * paired with a numeric label, and `aria-label` states the score as text.
 * No library for the chart — plain CSS.
 */

export type ScoreBarTone = "accent" | "correct" | "incorrect";

export interface ScoreBarProps {
  value: number;
  max: number;
  /** A threshold marked explicitly, such as the pass mark. No line is drawn if omitted. */
  markAt?: number;
  /** The threshold's name below the bar — e.g. "Pass mark 26". */
  markLabel?: string;
  /**
   * The number of questions actually asked. When `max` is the official
   * target, the unasked region is shown hatched: a short pool is never
   * visually hidden either.
   */
  reach?: number;
  tone?: ScoreBarTone;
  size?: "sm" | "lg";
  /** The full sentence for the screen reader — the bar carries no information on its own. */
  ariaLabel: string;
  startLabel?: string;
  endLabel?: string;
}

const FILL_TONE: Record<ScoreBarTone, string> = {
  accent: "bg-accent",
  correct: "bg-correct",
  incorrect: "bg-incorrect",
};

export function ScoreBar({
  value,
  max,
  markAt,
  markLabel,
  reach,
  tone = "accent",
  size = "lg",
  ariaLabel,
  startLabel,
  endLabel,
}: ScoreBarProps) {
  // Division-by-zero and overflow are ruled out before any drawing happens.
  const span = max > 0 ? max : 0;
  const ratio = (n: number) => (span === 0 ? 0 : Math.min(100, Math.max(0, (n / span) * 100)));

  const trackHeight = size === "lg" ? "h-6" : "h-3";
  const showMark = markAt !== undefined && span > 0 && markAt > 0 && markAt <= span;
  const showGhost = reach !== undefined && span > 0 && reach < span;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative py-1" role="img" aria-label={ariaLabel}>
        <div
          className={`relative ${trackHeight} w-full overflow-hidden rounded-[var(--radius-badge)] border border-border bg-surface-2`}
        >
          {showGhost ? (
            <div
              aria-hidden="true"
              className="absolute inset-y-0 right-0"
              style={{
                left: `${ratio(reach)}%`,
                backgroundImage:
                  "repeating-linear-gradient(135deg, var(--border) 0 3px, transparent 3px 7px)",
              }}
            />
          ) : null}

          <div
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 ${FILL_TONE[tone]}`}
            style={{ width: `${ratio(value)}%` }}
          />
        </div>

        {showMark ? (
          <div
            aria-hidden="true"
            className="absolute inset-y-0 w-0.5 rounded-full bg-fg"
            // Clamped into the bar so the mark stays fully visible even when
            // the threshold sits at either end; the pass-mark line is never
            // clipped under any circumstance.
            style={{ left: `clamp(0px, calc(${ratio(markAt)}% - 1px), calc(100% - 2px))` }}
          />
        ) : null}
      </div>

      {startLabel || markLabel || endLabel ? (
        <div className="flex items-baseline justify-between gap-2 text-xs text-fg-muted">
          <span>{startLabel ?? ""}</span>
          {markLabel ? (
            <span className="font-medium text-fg">
              <span aria-hidden="true">│ </span>
              {markLabel}
            </span>
          ) : null}
          <span>{endLabel ?? ""}</span>
        </div>
      ) : null}
    </div>
  );
}

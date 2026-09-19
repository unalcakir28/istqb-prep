import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  announcementMinute,
  formatRemaining,
  remainingMs,
  timerUrgency,
} from "@/features/exam/examTimer";

/**
 * F1-08 — exam countdown.
 *
 * Drift-proof by construction: the component stores no "seconds left". Every
 * tick it reads the absolute `deadlineAt` from the attempt and subtracts
 * `Date.now()`, so a throttled or suspended tab cannot buy the candidate extra
 * time. Nothing is persisted here either — the deadline already lives in
 * IndexedDB, written when the attempt was created.
 *
 * Visible state is deliberately calm (docs/06 §3.3): amber in the last ten
 * minutes, red in the last minute, and a hide toggle for candidates who find a
 * running clock stressful. Hiding only hides; the countdown keeps running and
 * still auto-submits.
 */
export interface ExamTimerProps {
  /** Absolute epoch milliseconds when the attempt must end. */
  deadlineAt: number;
  hidden: boolean;
  onToggleHidden: () => void;
  /** Called exactly once, when the deadline passes. */
  onExpire: () => void;
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className="size-4 shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className="size-4"
    >
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {off ? <path d="m4 20 16-16" strokeLinecap="round" /> : null}
    </svg>
  );
}

const TONE: Record<string, string> = {
  normal: "text-fg",
  warning: "text-flag",
  critical: "text-incorrect",
  expired: "text-incorrect",
};

export function ExamTimer({ deadlineAt, hidden, onToggleHidden, onExpire }: ExamTimerProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  const [announcement, setAnnouncement] = useState("");
  const expiredRef = useRef(false);
  const announcedRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 1_000);

    // Coming back from a background tab or a locked screen: resync at once
    // rather than waiting for the next throttled tick.
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, []);

  const left = remainingMs(deadlineAt, now);
  const urgency = timerUrgency(left);

  // Fires once. The ref guard also covers the case where the attempt is
  // reopened after the deadline has already passed.
  useEffect(() => {
    if (left > 0) return;
    if (expiredRef.current) return;

    expiredRef.current = true;
    onExpire();
  }, [left, onExpire]);

  useEffect(() => {
    const minute = announcementMinute(left);
    if (minute === null) return;
    if (announcedRef.current === minute) return;

    announcedRef.current = minute;
    setAnnouncement(
      minute === 0 ? t("exam.timeUp") : t("result.duration", { minutes: minute, seconds: 0 }),
    );
  }, [left, t]);

  return (
    <div className="flex items-center gap-1.5">
      <span className={TONE[urgency]}>
        <ClockIcon />
      </span>

      {hidden ? (
        <span aria-hidden="true" className="font-mono text-sm text-fg-muted">
          --:--
        </span>
      ) : (
        <span
          role="timer"
          aria-live="off"
          className={`font-mono text-sm font-medium tabular-nums ${TONE[urgency]}`}
        >
          {formatRemaining(left)}
        </span>
      )}

      <button
        type="button"
        onClick={onToggleHidden}
        aria-pressed={hidden}
        aria-label={hidden ? t("exam.showTimer") : t("exam.hideTimer")}
        title={hidden ? t("exam.showTimer") : t("exam.hideTimer")}
        className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-btn)] text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <EyeIcon off={hidden} />
      </button>

      {/* Polite, and only once per remaining minute inside the last ten. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

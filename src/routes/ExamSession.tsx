import { useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ExamTimer } from "@/components/ExamTimer";
import { Spinner } from "@/components/Spinner";
import { SubmitConfirm } from "@/components/SubmitConfirm";
import { SessionRunner } from "@/features/session/SessionRunner";
import { useSessionStore } from "@/features/session/sessionStore";

/**
 * F1-07 / F1-10 — the exam session screen.
 *
 * The site header and footer are hidden on this route (see `Layout`), because
 * during the exam nothing but the question, the options, the clock and the
 * navigator may be on screen (docs/06 §1.1).
 *
 * Loading and resuming the attempt, the question card, navigation, the
 * navigator and the shortcuts common to every mode all live in
 * `SessionRunner`. This screen owns only what is exam-specific: the timer,
 * the auto-submit on expiry, the exam wording of the shared `SubmitConfirm`
 * dialog, and the short-exam notice (which compares against the fixed
 * 40-question blueprint total and would be meaningless for study/practice's
 * smaller pools).
 *
 * The "t" shortcut is exam-only but is NOT registered here: this screen
 * cannot see the navigator and the shortcuts overlay, which belong to
 * `SessionRunner`, so a key owned here stayed live behind them. The toggle is
 * handed to the runner and the runner's own handler silences it with the
 * rest.
 */

const BANNER =
  "rounded-[var(--radius-card)] border border-flag/40 bg-flag/10 px-4 py-2.5 text-sm text-fg";

export default function ExamSession() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const attempt = useSessionStore((state) => state.attempt);
  const questions = useSessionStore((state) => state.questions);
  const answers = useSessionStore((state) => state.answers);
  const meta = useSessionStore((state) => state.meta);
  const submit = useSessionStore((state) => state.submit);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [timerHidden, setTimerHidden] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  const submittingRef = useRef(false);

  const finish = useCallback(
    async (auto: boolean) => {
      // The clock and the button can race; only one submission may land.
      if (submittingRef.current) return;
      submittingRef.current = true;

      setConfirmOpen(false);
      if (auto) setAutoSubmitting(true);

      try {
        await submit(auto);
      } catch {
        // Scoring or the IndexedDB write failed: unlock so the candidate can
        // try again instead of being trapped on a dead screen.
        submittingRef.current = false;
        setAutoSubmitting(false);
      }
      // Navigation happens once SessionRunner observes the submitted status.
    },
    [submit],
  );

  const handleExpire = useCallback(() => {
    void finish(true);
  }, [finish]);

  const toggleTimer = useCallback(() => {
    setTimerHidden((hidden) => !hidden);
  }, []);

  // The route always supplies :attemptId; this only satisfies SessionRunner's
  // non-optional prop type.
  if (!attemptId) return <Spinner full />;

  const total = questions.length;
  const unanswered = questions.filter((item) => (answers[item.id]?.length ?? 0) === 0).length;

  // Rule 8: an exam is never silently short. This is derived from the ATTEMPT
  // ITSELF (not from transient store state), so it still shows after a reload
  // and after returning to an unfinished exam. Exam-specific: it compares
  // against the fixed 40-question blueprint total, which would be meaningless
  // for study/practice's much smaller per-objective pools.
  const expected = meta?.exam.questionCount ?? 0;
  const isShortExam = attempt?.id === attemptId && expected > 0 && total < expected;

  return (
    <>
      {isShortExam ? (
        <div className="mx-auto max-w-6xl px-3 pt-3 sm:px-4">
          <p role="status" className={BANNER}>
            {t("exam.shortExam", { count: total, expected })}
          </p>
        </div>
      ) : null}

      <SessionRunner
        attemptId={attemptId}
        onSubmitted={(id) => navigate(`/sonuc/${id}`, { replace: true })}
        modalOpen={confirmOpen}
        onToggleTimer={toggleTimer}
        header={
          attempt && attempt.id === attemptId && attempt.deadlineAt !== null ? (
            <ExamTimer
              deadlineAt={attempt.deadlineAt}
              hidden={timerHidden}
              onToggleHidden={toggleTimer}
              onExpire={handleExpire}
            />
          ) : null
        }
        footer={
          <div className="mt-6 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={autoSubmitting}
              className="min-h-11 w-full rounded-[var(--radius-btn)] bg-accent px-5 text-sm font-semibold text-accent-fg disabled:opacity-60 sm:w-auto"
            >
              {t("exam.submit")}
            </button>

            <p aria-live="polite" className="mt-2 text-xs text-fg-muted">
              {autoSubmitting ? t("exam.autoSubmitting") : ""}
            </p>
          </div>
        }
      />

      <SubmitConfirm
        open={confirmOpen}
        title={t("exam.submitConfirmTitle")}
        body={
          unanswered > 0
            ? // `count` picks the plural form; `unanswered` is what the string
              // interpolates. All three modes pass both — see `StudySession`.
              t("exam.submitConfirmBody", { count: unanswered, unanswered })
            : t("exam.submitConfirmBodyAll")
        }
        confirmLabel={t("exam.confirmSubmit")}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void finish(false)}
      />
    </>
  );
}

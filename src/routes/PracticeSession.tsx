import { useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Spinner } from "@/components/Spinner";
import { SubmitConfirm } from "@/components/SubmitConfirm";
import { SessionRunner } from "@/features/session/SessionRunner";
import { useSessionStore } from "@/features/session/sessionStore";

/**
 * Task 10 — the practice session screen.
 *
 * Untimed: no `header` is passed to `SessionRunner`, so no timer mounts.
 * `SessionRunner` has no auto-submit path of its own (only the exam screen's
 * clock triggers one), so practice needs its own manual finish control in the
 * `footer` slot — otherwise a practice session could never be ended.
 *
 * Finishing is confirmed, exactly as in exam mode: it writes
 * `status: "submitted"`, after which `SessionRunner` redirects this route to
 * the result screen and there is no way back into the session. Instant
 * feedback locking an individual answer is a different thing entirely — the
 * unanswered remainder is what is lost, and with instant feedback switched
 * off (a supported setting on the setup screen) nothing locks at all.
 */
export default function PracticeSession() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const questions = useSessionStore((state) => state.questions);
  const answers = useSessionStore((state) => state.answers);
  const submit = useSessionStore((state) => state.submit);

  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const finish = useCallback(async () => {
    // Guards against a double click firing two submissions.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setConfirmOpen(false);

    try {
      await submit(false);
    } catch {
      // Scoring or the IndexedDB write failed: unlock so the candidate can retry.
      submittingRef.current = false;
      setSubmitting(false);
    }
    // Navigation happens once SessionRunner observes the submitted status.
  }, [submit]);

  // The route always supplies :attemptId; this only satisfies SessionRunner's
  // non-optional prop type.
  if (!attemptId) return <Spinner full />;

  const unanswered = questions.filter((item) => (answers[item.id]?.length ?? 0) === 0).length;

  return (
    <>
      <SessionRunner
        attemptId={attemptId}
        onSubmitted={(id) => navigate(`/sonuc/${id}`, { replace: true })}
        modalOpen={confirmOpen}
        footer={
          <div className="mt-6 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
              className="min-h-11 w-full rounded-[var(--radius-btn)] bg-accent px-5 text-sm font-semibold text-accent-fg disabled:opacity-60 sm:w-auto"
            >
              {t("practice.finish")}
            </button>
          </div>
        }
      />

      <SubmitConfirm
        open={confirmOpen}
        title={t("practice.finishConfirmTitle")}
        body={
          unanswered > 0
            ? // `count` picks the plural form; `unanswered` is what the string
              // interpolates. All three modes pass both — see `StudySession`.
              t("practice.finishConfirmBody", { count: unanswered, unanswered })
            : t("practice.finishConfirmBodyAll")
        }
        confirmLabel={t("practice.confirmFinish")}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void finish()}
      />
    </>
  );
}

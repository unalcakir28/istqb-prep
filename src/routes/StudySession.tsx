/**
 * Study mode, level 4 — the objective test and its result.
 *
 * Untimed, so like practice it needs its own finish control: `SessionRunner`
 * has no auto-submit path of its own, only the exam screen's clock triggers
 * one. Unlike practice, finishing does not navigate away — the result belongs
 * next to the objective it belongs to, with the way back to the card and the
 * way on to the next objective both in reach.
 *
 * Mastery is recorded in `finish`, not when the result screen appears.
 * `SessionRunner` reports a submitted attempt on every mount, including a
 * reload of an already-finished session, so recording there would count the
 * same test again on every refresh.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ErrorNotice } from "@/components/ErrorNotice";
import { ObjectiveStateBadge } from "@/components/ObjectiveStateBadge";
import { ScoreBar } from "@/components/ScoreBar";
import { Spinner } from "@/components/Spinner";
import { SubmitConfirm } from "@/components/SubmitConfirm";
import { SessionRunner } from "@/features/session/SessionRunner";
import { useSessionStore } from "@/features/session/sessionStore";
import { contentClient } from "@/lib/content/contentClient";
import type { ObjectiveProgress } from "@/lib/db/db";
import {
  getObjectiveProgress,
  objectiveStateOf,
  recordObjectiveResult,
  type ObjectiveState,
} from "@/lib/db/objectiveProgress";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import type { Objective } from "@/types/content";

/**
 * Records the objective's result and reports the state it produced.
 *
 * A submit with nothing answered is not evidence about the objective: it
 * would write `(0, 0)` and erase a mastery the candidate had already earned.
 * Losing mastery to a genuinely bad attempt is intended; losing it to an
 * empty one is not, so nothing is written and the stored row stands.
 *
 * `null` means "no new state" — either nothing was recorded or the write
 * failed — and the result screen falls back to the stored row.
 */
async function recordResult(
  certId: string,
  loCode: string,
  answered: number,
  percent: number,
): Promise<ObjectiveState | null> {
  if (answered === 0) return null;

  try {
    return objectiveStateOf(await recordObjectiveResult(certId, loCode, answered, percent));
  } catch {
    // Mastery is a convenience signal, not the result itself. A failed
    // write must not hide the score the candidate just earned.
    return null;
  }
}

export default function StudySession() {
  const { loCode, attemptId } = useParams<{ loCode: string; attemptId: string }>();
  const { t } = useTranslation();

  const questions = useSessionStore((state) => state.questions);
  const answers = useSessionStore((state) => state.answers);
  const submit = useSessionStore((state) => state.submit);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  /**
   * How the session ended, once it has — null while it is still running.
   *
   * "click" is the candidate finishing the test on this screen; "cold" is this
   * URL being opened on an attempt that was already submitted (a bookmark, a
   * reload, a back navigation). The result screen is the same either way, but
   * only the click justifies moving focus: on the cold path nothing just
   * happened to announce, and `tabIndex={-1}` on the heading would put the tab
   * position AFTER it, leaving the skip link and the whole nav reachable only
   * by Shift+Tab.
   */
  const [finishedVia, setFinishedVia] = useState<"click" | "cold" | null>(null);
  const [recordedState, setRecordedState] = useState<ObjectiveState | null>(null);

  const finish = useCallback(async () => {
    if (!loCode) return;
    // Guards against a double click firing two submissions.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setConfirmOpen(false);

    // The click path owns the switch to the result, so that the badge is
    // known before the result first paints. `submittingRef` holds
    // `onSubmitted` off until then — it fires as soon as `submit` flips the
    // attempt's status, which is before the mastery write has finished.
    const showResult = (state: ObjectiveState | null) => {
      submittingRef.current = false;
      setRecordedState(state);
      setFinishedVia("click");
    };

    try {
      await submit(false);
    } catch {
      // Scoring or the IndexedDB write failed: unlock so the candidate can retry.
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    const { attempt, score, questions } = useSessionStore.getState();
    // No score means `submit` found the attempt already submitted; the result
    // screen rescores it from IndexedDB, and there is nothing new to record.
    if (!attempt || !score) {
      showResult(null);
      return;
    }

    const answered = questions.length - score.unansweredCount;
    showResult(await recordResult(attempt.certId, loCode, answered, score.percent));
  }, [loCode, submit]);

  // The route always supplies both; this only satisfies the non-optional props.
  if (!attemptId || !loCode) return <Spinner full />;
  if (finishedVia)
    return (
      <ObjectiveResult
        attemptId={attemptId}
        loCode={loCode}
        recorded={recordedState}
        focusHeading={finishedVia === "click"}
      />
    );

  const unanswered = questions.filter((item) => (answers[item.id]?.length ?? 0) === 0).length;

  return (
    <>
      <SessionRunner
        attemptId={attemptId}
        onSubmitted={() => {
          // `finish` reports the result itself once mastery is recorded. This
          // path is the cold one: a reload of an already-submitted attempt.
          if (submittingRef.current) return;
          setFinishedVia("cold");
        }}
        // While the dialog is up the shared shortcuts stand down: they are
        // registered inside the runner, which cannot see a dialog a mode screen
        // owns, and a candidate must not be able to change an answer from
        // behind the confirmation they are about to give.
        modalOpen={confirmOpen}
        footer={
          <div className="mt-6 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
              className="min-h-11 w-full rounded-[var(--radius-btn)] bg-accent px-5 text-sm font-semibold text-accent-fg disabled:opacity-60 sm:w-auto"
            >
              {t("study.finish")}
            </button>
          </div>
        }
      />

      {/* Study used to submit straight from the click — the only mode that
          did. Finishing scores the test and hands the score to
          `recordObjectiveResult`, which can take a mastery back down, so the
          act is confirmed here exactly as it is in exam and practice. */}
      <SubmitConfirm
        open={confirmOpen}
        title={t("study.finishConfirmTitle")}
        body={
          unanswered > 0
            ? // An objective test is 2-10 questions, so a remainder of exactly
              // one is routine here rather than the 1-in-40 case the exam copy
              // was written for. `count` picks the plural form; `unanswered` is
              // what the string interpolates.
              t("study.finishConfirmBody", { count: unanswered, unanswered })
            : t("study.finishConfirmBodyAll")
        }
        confirmLabel={t("study.confirmFinish")}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void finish()}
      />
    </>
  );
}

interface ResultContext {
  objective: Objective | null;
  next: Objective | null;
  progress: ObjectiveProgress | undefined;
}

/** `certId` doubles as the content path, exactly as the session store uses it. */
async function loadResultContext(certId: string, loCode: string): Promise<ResultContext> {
  const objectives = await contentClient.getObjectives(certId);
  const objective = objectives.find((item) => item.code === loCode) ?? null;

  const siblings = objective ? objectives.filter((item) => item.chapter === objective.chapter) : [];
  const position = siblings.findIndex((item) => item.code === loCode);

  const progress = await getObjectiveProgress(certId, [loCode]);

  return {
    objective,
    // The last objective of a chapter has nowhere to go on; the link is
    // dropped rather than looping back to the first one.
    next: position === -1 ? null : (siblings[position + 1] ?? null),
    progress: progress.get(loCode),
  };
}

/**
 * The objective's own result, shown in place of the session.
 *
 * It reads the score from the store when the test has just been submitted,
 * and rescores from IndexedDB when this URL is opened cold — a bookmark, a
 * reload, or a back navigation into a finished session.
 *
 * `recorded` is the objective state the finishing click just wrote. Passing it
 * down rather than re-reading it keeps the badge off the stored row while that
 * write is still in flight, and means the state is right on the first paint.
 * It is null on the cold path, where the stored row is the only source and
 * nothing is racing it.
 *
 * `focusHeading` says this render followed a finishing click. It is a separate
 * prop rather than `recorded !== null` because `recorded` is also null on the
 * hot path when nothing was answered or the mastery write failed.
 */
function ObjectiveResult({
  attemptId,
  loCode,
  recorded,
  focusHeading,
}: {
  attemptId: string;
  loCode: string;
  recorded: ObjectiveState | null;
  focusHeading: boolean;
}) {
  const { t, i18n } = useTranslation();

  const attempt = useSessionStore((state) => state.attempt);
  const questions = useSessionStore((state) => state.questions);
  const score = useSessionStore((state) => state.score);
  const error = useSessionStore((state) => state.error);
  const loadSubmitted = useSessionStore((state) => state.loadSubmitted);

  const [context, setContext] = useState<ResultContext | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const ready = attempt?.id === attemptId && !!score;

  /**
   * The finish swaps the session for this screen inside the same route: the
   * URL does not change, and the button the candidate was standing on
   * unmounts, which drops focus to `<body>`. A whole new screen — score,
   * mastery badge, next objective — used to arrive in silence.
   *
   * Focusing the heading is what announces it, the same way `SessionRunner`
   * announces a question change. It waits for `ready` because until then the
   * heading has not rendered and there is only a spinner to focus.
   *
   * Only on that path, though. Opening this URL cold — a bookmark, a reload —
   * is an ordinary page load with nothing to announce, and moving focus to a
   * `tabIndex={-1}` heading there puts the tab position after it, leaving the
   * skip link and the whole nav behind a Shift+Tab.
   */
  useEffect(() => {
    if (!focusHeading) return;
    if (!ready) return;
    headingRef.current?.focus();
  }, [focusHeading, ready]);

  // `SessionRunner` left the title on "Question 5 of 5" and nothing resets it;
  // same hook as the runner's, so the two cannot drift apart.
  useDocumentTitle(t("result.title"));

  useEffect(() => {
    if (ready) return;
    void loadSubmitted(attemptId);
  }, [attemptId, ready, loadSubmitted]);

  const certId = attempt?.certId;

  useEffect(() => {
    if (!certId) return;
    let cancelled = false;

    void loadResultContext(certId, loCode).then(
      (value) => {
        if (!cancelled) setContext(value);
      },
      () => {
        // Without the objective list the score still stands; only the
        // onward links are missing.
        if (!cancelled) setContext({ objective: null, next: null, progress: undefined });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [certId, loCode]);

  // Not yet loaded is not an error. On a cold mount `resumeAttempt` has
  // cleared the score and `loading` is already back to false, so keying the
  // error branch on the absence of data would flash the error screen one
  // render before the spinner. Only the store's own error means failure.
  if (error) return <ErrorNotice />;
  if (!ready) return <Spinner full />;

  const lang = i18n.language === "en" ? "en" : "tr";
  const scoreLabel = t("result.score", { points: score.points, total: score.totalPoints });
  // A submit with nothing answered is not evidence about the objective (see
  // `recordResult` above), so the badge must be suppressed regardless of why
  // `recorded` is null. `score` is already rebuilt from IndexedDB by
  // `loadSubmitted` on a cold reload — where `finish()` never ran and
  // `recorded` is always null — so `unansweredCount` reflects the real
  // attempt on both the hot and the cold path without needing a prop.
  const answered = questions.length - score.unansweredCount;
  // Null until the state is known: "not started" for an objective the
  // candidate has just tested would be a lie, so the badge waits instead.
  // Zero answered overrides both sources — a green badge over a 0-point
  // score would read as a false claim of mastery.
  const state =
    answered === 0 ? null : (recorded ?? (context ? objectiveStateOf(context.progress) : null));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-sm font-medium text-accent">
          <span className="sr-only">{t("question.objective")}: </span>
          {loCode}
        </p>
        {/* `tabIndex={-1}` only so the effect above can put focus here; it
            stays out of the tab order. */}
        <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-semibold leading-tight">
          {t("result.title")}
        </h1>
      </header>

      <section aria-labelledby="objective-score" className="flex flex-col gap-4">
        <h2 id="objective-score" className="sr-only">
          {scoreLabel}
        </h2>

        <p className="font-mono text-[40px] font-semibold leading-none tabular-nums">
          {scoreLabel}
        </p>

        {/* A row rather than inline text: the badge is absent until its state
            is known, and a leading margin would hang off nothing. */}
        <p className="flex flex-wrap items-center gap-2 text-base">
          {state ? <ObjectiveStateBadge state={state} /> : null}
          <span className="font-mono text-sm text-fg-muted">
            {t("result.percent", { percent: score.percent })}
          </span>
        </p>

        <ScoreBar
          value={score.points}
          max={score.totalPoints}
          tone={state === "mastered" ? "correct" : "accent"}
          size="sm"
          ariaLabel={scoreLabel}
        />
      </section>

      <nav className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Link
          to={`/calisma/lo/${loCode}`}
          className="rounded-[var(--radius-btn)] border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-2"
        >
          {t("study.backToObjective")}
        </Link>

        {context?.next ? (
          <Link
            to={`/calisma/lo/${context.next.code}`}
            className="flex flex-col rounded-[var(--radius-btn)] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg"
          >
            {t("study.nextObjective")}
            <span lang={lang} className="font-mono text-xs font-normal opacity-80">
              {context.next.code}
            </span>
          </Link>
        ) : null}
      </nav>
    </div>
  );
}

/**
 * F1-11 — Result screen (docs/06 §3.4).
 *
 * The principle: honesty over motivation. The pass line is ALWAYS drawn, the
 * score is never softened, and a failed exam is not dressed up as "almost".
 * Pass/fail is stated with an icon and text, not colour alone (WCAG 1.4.1).
 *
 * Every constant comes from the data: the pass mark from `score.passPoints`
 * (meta.json), chapter titles from syllabus.json, target question counts from
 * the syllabus `examQuestions` field, objective texts from objectives.json.
 *
 * Shared by exam and practice, so the verdict is conditional — see `graded`.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ErrorNotice } from "@/components/ErrorNotice";
import { ScoreBar } from "@/components/ScoreBar";
import { Spinner } from "@/components/Spinner";
import { useSessionStore } from "@/features/session/sessionStore";
import { isGraded, weakestObjectives } from "@/features/exam/scoreExam";
import { contentClient } from "@/lib/content/contentClient";
import type { Attempt } from "@/lib/db/db";
import { useArrivalFocus } from "@/lib/useArrivalFocus";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import type { Chapter, Objective } from "@/types/content";

/**
 * How long the attempt took, for display. `submittedAt` is the normal case.
 * Without it (a state that should not happen for a submitted attempt), a
 * timed session falls back to its allotted duration — but an untimed session
 * (study/practice) has no such duration to fall back to (`durationMinutes` is
 * a 0 placeholder there), so it reports real elapsed time since start instead
 * of a dishonest 0:00.
 */
function elapsedSeconds(attempt: Attempt): number {
  if (attempt.submittedAt !== undefined) {
    return Math.max(0, Math.round((attempt.submittedAt - attempt.startedAt) / 1000));
  }
  if (attempt.deadlineAt === null) {
    return Math.max(0, Math.round((Date.now() - attempt.startedAt) / 1000));
  }
  return attempt.durationMinutes * 60;
}

function PassIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
      className="size-5"
    >
      <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FailIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
      className="size-5"
    >
      <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
    </svg>
  );
}

export default function ExamResult() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { t } = useTranslation();

  const attempt = useSessionStore((state) => state.attempt);
  const score = useSessionStore((state) => state.score);
  const contentLang = useSessionStore((state) => state.contentLang);
  const loading = useSessionStore((state) => state.loading);
  const loadSubmitted = useSessionStore((state) => state.loadSubmitted);

  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [objectives, setObjectives] = useState<Objective[] | null>(null);

  const ready = Boolean(attemptId && attempt?.id === attemptId && score);

  // Both modes hand over with a `replace` navigation, so the session's own
  // title and focus position are what this screen would otherwise inherit.
  useDocumentTitle(t("result.title"));
  const headingRef = useArrivalFocus<HTMLHeadingElement>(ready);

  useEffect(() => {
    if (!attemptId || ready) return;
    void loadSubmitted(attemptId);
  }, [attemptId, ready, loadSubmitted]);

  const certId = attempt?.certId;

  useEffect(() => {
    if (!certId) return;
    let cancelled = false;

    async function load(path: string) {
      try {
        const [syllabus, list] = await Promise.all([
          contentClient.getSyllabus(path),
          contentClient.getObjectives(path),
        ]);
        if (cancelled) return;
        setChapters(syllabus.chapters);
        setObjectives(list);
      } catch {
        // If the titles fail to load the result still shows; only the codes appear.
        if (!cancelled) setChapters([]);
      }
    }

    void load(certId);
    return () => {
      cancelled = true;
    };
  }, [certId]);

  if (loading && !ready) return <Spinner />;
  if (!attempt || !score) return <ErrorNotice />;

  const elapsed = elapsedSeconds(attempt);

  /**
   * Whether this attempt was measured against the official pass mark — the same
   * definition the store uses to decide whether to persist a verdict at all, so
   * the two can never disagree (`isGraded`).
   *
   * A candidate who answered all ten questions of a scoped set correctly used
   * to be told they were below the pass mark, on a bar scaled to 26. Honesty
   * over motivation cuts both ways, so the verdict is dropped rather than
   * softened.
   */
  const graded = isGraded(attempt.scope);

  // Graded: even when fewer than 40 questions were asked because the pool fell
  // short, the bar still runs to the official pass mark — the pass line stays
  // visible ALWAYS, and the unasked region is hatched (docs/06 §3.4).
  // Ungraded: there is no pass mark to keep in view, so the bar ends at the
  // questions that were actually asked.
  const scale = graded ? Math.max(score.totalPoints, score.passPoints) : score.totalPoints;
  const scoreLabel = t("result.score", { points: score.points, total: score.totalPoints });
  const percentLabel = t("result.percent", { percent: score.percent });
  const passLabel = t("result.passLine", { pass: score.passPoints });
  const verdict = graded ? (score.passed ? t("result.passed") : t("result.failed")) : null;
  const objectiveText = new Map((objectives ?? []).map((item) => [item.code, item.text]));
  const chapterById = new Map((chapters ?? []).map((item) => [item.number, item]));
  const weakest = weakestObjectives(score);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      {/* `tabIndex={-1}` only so `useArrivalFocus` can put focus here; it stays
          out of the tab order. */}
      <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-semibold leading-tight">
        {t("result.title")}
      </h1>

      {attempt.autoSubmitted ? (
        <p className="rounded-[var(--radius-card)] border border-flag/40 bg-flag/10 px-4 py-3 text-sm">
          {t("exam.timeUp")}
        </p>
      ) : null}

      <section aria-labelledby="score-heading" className="flex flex-col gap-4">
        <h2 id="score-heading" className="sr-only">
          {verdict ? `${scoreLabel} — ${verdict}` : scoreLabel}
        </h2>

        <p className="font-mono text-[44px] font-semibold leading-none tabular-nums">
          {scoreLabel}
        </p>

        {/* The percentage is on the verdict's line when there is one, and on a
            line of its own when there is not — it is a fact about the session
            either way and must not go missing with the verdict. */}
        {verdict ? (
          <p
            className={`flex items-center gap-2 text-lg font-semibold ${
              score.passed ? "text-correct" : "text-incorrect"
            }`}
          >
            {score.passed ? <PassIcon /> : <FailIcon />}
            {verdict}
            <span className="font-mono text-base font-normal text-fg-muted">{percentLabel}</span>
          </p>
        ) : (
          <p className="font-mono text-base text-fg-muted">{percentLabel}</p>
        )}

        <ScoreBar
          value={score.points}
          max={scale}
          reach={graded ? score.totalPoints : undefined}
          markAt={graded ? score.passPoints : undefined}
          markLabel={graded ? passLabel : undefined}
          tone={graded ? (score.passed ? "correct" : "incorrect") : "accent"}
          startLabel="0"
          endLabel={String(scale)}
          ariaLabel={verdict ? `${scoreLabel} — ${passLabel} — ${verdict}` : scoreLabel}
        />

        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex items-baseline gap-2">
            <dt className="text-fg-muted">{t("result.correct")}</dt>
            <dd className="font-mono font-medium">{score.correctCount}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-fg-muted">{t("result.incorrect")}</dt>
            <dd className="font-mono font-medium">{score.incorrectCount}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-fg-muted">{t("result.unanswered")}</dt>
            <dd className="font-mono font-medium">{score.unansweredCount}</dd>
          </div>
        </dl>

        <p className="text-sm text-fg-muted">
          {t("result.duration", {
            minutes: Math.floor(elapsed / 60),
            seconds: elapsed % 60,
          })}
        </p>
      </section>

      <section aria-labelledby="by-chapter" className="flex flex-col gap-4">
        <h2 id="by-chapter" className="text-base font-semibold">
          {t("result.byChapter")}
        </h2>

        <ul className="flex flex-col gap-4">
          {Object.entries(score.byChapter)
            .map(([key, breakdown]) => ({ chapter: Number(key), breakdown }))
            .sort((a, b) => a.chapter - b.chapter)
            .map(({ chapter, breakdown }) => {
              const info = chapterById.get(chapter);
              // Ghost target: how many questions this chapter contributes on the real exam.
              const target = info?.examQuestions ?? breakdown.total;

              return (
                <li key={chapter} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span>
                      <span className="text-fg-muted">
                        {t("setup.chapter", { number: chapter })}
                      </span>{" "}
                      {info ? <span lang={contentLang}>{info.title[contentLang]}</span> : null}
                    </span>
                    <span className="shrink-0 font-mono text-fg-muted">
                      {t("result.score", { points: breakdown.correct, total: breakdown.total })}
                    </span>
                  </div>

                  <ScoreBar
                    value={breakdown.correct}
                    max={Math.max(target, breakdown.total)}
                    reach={breakdown.total}
                    size="sm"
                    tone="accent"
                    ariaLabel={`${t("setup.chapter", { number: chapter })}: ${t("result.score", {
                      points: breakdown.correct,
                      total: breakdown.total,
                    })}`}
                  />
                </li>
              );
            })}
        </ul>
      </section>

      {weakest.length > 0 ? (
        <section aria-labelledby="weakest" className="flex flex-col gap-3">
          <h2 id="weakest" className="text-base font-semibold">
            {t("result.weakest")}
          </h2>

          <ul className="flex flex-col gap-2">
            {weakest.map((code) => {
              const breakdown = score.byObjective[code];
              const text = objectiveText.get(code);

              return (
                <li
                  key={code}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3"
                >
                  <span className="rounded-[var(--radius-badge)] border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-xs font-medium text-accent">
                    {code}
                  </span>
                  {text ? (
                    <span lang={contentLang} className="flex-1 text-[15px]">
                      {text[contentLang]}
                    </span>
                  ) : null}
                  <span className="font-mono text-sm text-fg-muted">
                    {t("result.score", {
                      points: breakdown?.correct ?? 0,
                      total: breakdown?.total ?? 0,
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          to={`/inceleme/${attempt.id}`}
          className="rounded-[var(--radius-btn)] bg-accent px-5 py-3 font-semibold text-accent-fg"
        >
          {t("result.review")}
        </Link>
        {/* Offering "New exam" after a scoped practice set sends the candidate
            to a 40-question timed mock they did not ask for. */}
        <Link
          to={graded ? "/sinav" : "/alistirma"}
          className="rounded-[var(--radius-btn)] border border-border px-5 py-3 font-medium hover:bg-surface-2"
        >
          {graded ? t("result.retake") : t("result.retakePractice")}
        </Link>
        <Link
          to="/"
          className="rounded-[var(--radius-btn)] border border-border px-5 py-3 font-medium hover:bg-surface-2"
        >
          {t("result.backHome")}
        </Link>
      </div>
    </div>
  );
}

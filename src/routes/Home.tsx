/**
 * F1-16 — Home page.
 *
 * It has three jobs, and their order matters:
 *  1. An unfinished exam (F1-10) is shown at the top — that is the first thing
 *     a returning user needs.
 *  2. It states the exam's real constants. 40/26/60/75 are NEVER hard-coded;
 *     all of them are read from meta.json (the CLAUDE.md "do not" list).
 *  3. If the pool cannot produce a full exam it says so plainly (F1-05c).
 *     Silently generating a short exam is forbidden (CLAUDE.md rule 8).
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ErrorNotice } from "@/components/ErrorNotice";
import { ScoreBar } from "@/components/ScoreBar";
import { Spinner } from "@/components/Spinner";
import {
  previewCoverage,
  shortfallsByChapter,
  type GroupShortfall,
} from "@/features/exam/generateExam";
import { routeForAttempt } from "@/features/session/routeForAttempt";
import { contentClient } from "@/lib/content/contentClient";
import { discardAttempt, findResumableAttempt, getResponses, type Attempt } from "@/lib/db/db";
import { useAsyncData } from "@/lib/useAsyncData";
import type { CertMeta, CertificationSummary, ExamBlueprint } from "@/types/content";

interface ResumeState {
  attempt: Attempt;
  answered: number;
}

interface HomeData {
  cert: CertificationSummary;
  meta: CertMeta;
  blueprint: ExamBlueprint;
  poolSize: number;
  achievable: number;
  shortfalls: GroupShortfall[];
  resume: ResumeState | null;
}

async function loadHome(): Promise<HomeData> {
  const cert = await contentClient.getActiveCertification();

  const [meta, blueprint, index] = await Promise.all([
    contentClient.getMeta(cert.path),
    contentClient.getBlueprint(cert.path),
    contentClient.getIndex(cert.path),
  ]);

  // Only published questions are counted; a draft never enters an exam.
  const pool = index.questions.filter((entry) => entry.status === "published");
  const preview = previewCoverage(blueprint, pool);

  const attempt = await findResumableAttempt(cert.id);
  const responses = attempt ? await getResponses(attempt.id) : [];

  return {
    cert,
    meta,
    blueprint,
    poolSize: pool.length,
    achievable: preview.total,
    shortfalls: preview.shortfalls,
    resume: attempt
      ? {
          attempt,
          answered: responses.filter((response) => response.selected.length > 0).length,
        }
      : null,
  };
}

function achievableByChapter(
  blueprint: ExamBlueprint,
  shortfalls: GroupShortfall[],
): { chapter: number; available: number; required: number }[] {
  return [...shortfallsByChapter(shortfalls).entries()]
    .map(([chapter, gap]) => {
      const required = blueprint.totals.byChapter[String(chapter)] ?? 0;
      return { chapter, required, available: Math.max(0, required - gap) };
    })
    .sort((a, b) => a.chapter - b.chapter);
}

/**
 * One of the three modes. The card is not itself a link: its heading, body and
 * action would collapse into one long accessible name, and the action's own
 * wording is what a screen-reader user navigating by link needs to hear.
 */
function ModeCard({
  title,
  body,
  action,
  to,
  primary = false,
}: {
  title: string;
  body: string;
  action: string;
  to: string;
  primary?: boolean;
}) {
  return (
    <article
      className={`flex flex-col gap-2 rounded-[var(--radius-card)] border bg-surface p-5 ${
        primary ? "border-accent/50" : "border-border"
      }`}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">{body}</p>
      <Link
        to={to}
        className={
          primary
            ? "mt-2 w-fit rounded-[var(--radius-btn)] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg"
            : "mt-2 w-fit rounded-[var(--radius-btn)] border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-2"
        }
      >
        {action}
      </Link>
    </article>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const { data, failed, reload } = useAsyncData(loadHome);
  const [discardedId, setDiscardedId] = useState<string | null>(null);

  if (failed) return <ErrorNotice onRetry={reload} />;
  if (!data) return <Spinner />;

  const { cert, meta, blueprint, poolSize, achievable, shortfalls } = data;
  const exam = meta.exam;
  const resume = data.resume?.attempt.id === discardedId ? null : data.resume;
  const shortChapters = achievableByChapter(blueprint, shortfalls);
  const coverageLabel = t("home.coverage", {
    questions: poolSize,
    covered: cert.coverage.objectivesCovered,
    total: cert.coverage.objectivesTotal,
  });

  async function onDiscard(attemptId: string) {
    await discardAttempt(attemptId);
    setDiscardedId(attemptId);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      {resume ? (
        <section
          aria-labelledby="resume-title"
          className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-flag/40 bg-flag/10 p-4"
        >
          <p id="resume-title" className="font-semibold text-fg">
            {t("home.resumeTitle")}
          </p>
          <p className="text-sm text-fg-muted">
            {t("home.resumeBody", {
              answered: resume.answered,
              total: resume.attempt.questionIds.length,
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to={routeForAttempt(resume.attempt)}
              className="rounded-[var(--radius-btn)] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
            >
              {t("home.resume")}
            </Link>
            <button
              type="button"
              onClick={() => void onDiscard(resume.attempt.id)}
              className="rounded-[var(--radius-btn)] border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
            >
              {t("home.discard")}
            </button>
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <h1 className="text-[28px] font-semibold leading-tight sm:text-[32px]">
          {t("home.heroTitle")}
        </h1>

        <p className="text-lg text-fg-muted">
          {t("home.heroSubtitle", {
            count: exam.questionCount,
            minutes: exam.durationMinutes,
            pass: exam.passPoints,
            total: exam.totalPoints,
          })}
        </p>

        <p className="text-sm text-fg-muted">
          {t("setup.duration75", { minutes: exam.extendedDurationMinutes })} —{" "}
          {t("setup.durationHint")}
        </p>

        <span className="font-mono text-xs text-fg-muted">
          {cert.acronym} v{cert.syllabusVersion}
        </span>
      </section>

      {/* Study leads, on purpose. A first-time visitor who opens with a cold
          mock exam scores around 12/40 and leaves; putting the lesson-first
          path at the top is the documented mitigation for persona P2. */}
      <section className="flex flex-col gap-3">
        <ModeCard
          title={t("home.studyTitle")}
          body={t("home.studyBody")}
          action={t("home.startStudy")}
          to="/calisma"
          primary
        />
        <ModeCard
          title={t("home.practiceTitle")}
          body={t("home.practiceBody")}
          action={t("practice.start")}
          to="/alistirma"
        />
        <ModeCard
          title={t("home.examTitle")}
          body={t("home.examBody")}
          action={t("home.startExam")}
          to="/sinav"
        />
      </section>

      <section
        aria-labelledby="what-is-this"
        className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-surface p-5"
      >
        <h2 id="what-is-this" className="text-base font-semibold">
          {t("home.whatIsThis")}
        </h2>
        <p className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">{t("home.intro")}</p>
      </section>

      <section aria-label={coverageLabel} className="flex flex-col gap-3">
        <p className="text-sm text-fg-muted">{coverageLabel}</p>

        <ScoreBar
          value={cert.coverage.objectivesCovered}
          max={cert.coverage.objectivesTotal}
          size="sm"
          tone="accent"
          ariaLabel={coverageLabel}
        />
      </section>

      {shortfalls.length > 0 ? (
        <section
          aria-labelledby="pool-warning"
          className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-flag/40 bg-flag/10 p-4"
        >
          <h2 id="pool-warning" className="text-base font-semibold">
            {t("home.poolWarningTitle")}
          </h2>
          <p className="max-w-[65ch] text-sm text-fg-muted">
            {t("home.poolWarningBody", {
              available: achievable,
              required: blueprint.totals.questions,
            })}
          </p>

          <ul className="flex flex-col gap-1 text-sm">
            {shortChapters.map(({ chapter, available, required }) => (
              <li key={chapter} className="flex items-baseline justify-between gap-3">
                <span className="text-fg-muted">{t("setup.chapter", { number: chapter })}</span>
                <span className="font-mono">
                  {t("result.score", { points: available, total: required })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

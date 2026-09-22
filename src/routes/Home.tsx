/**
 * F1-16 — Home page.
 *
 * A first-time visitor arrives knowing nothing, so the page answers three
 * questions in order: what is this, what does the exam actually look like, and
 * which of the three modes should I open. The blueprint figure is the hero
 * because the per-chapter question weighting is the one fact that changes how
 * a candidate spends their study time, and it is the thing no generic exam
 * site can show.
 *
 * Its other jobs, unchanged:
 *  1. An unfinished session (F1-10) is shown above everything — that is the
 *     first thing a returning user needs.
 *  2. Every number comes from `meta.json`, `syllabus.json` and the question
 *     index. None of 40 / 26 / 60 is written in the code (the CLAUDE.md "do
 *     not" list).
 *  3. If the pool cannot produce a full exam it says so plainly (F1-05c).
 *     Silently generating a short exam is forbidden (CLAUDE.md rule 8).
 *  4. Study leads the modes, on purpose: a first-time visitor who opens with a
 *     cold mock exam scores around 12/40 and leaves, and the lesson-first path
 *     is the documented mitigation for persona P2. All 64 lesson cards are
 *     written and published, so the card no longer warns that they are not.
 */

import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { BlueprintFigure, type BlueprintChapter } from "@/components/BlueprintFigure";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Spinner } from "@/components/Spinner";
import {
  previewCoverage,
  shortfallsByChapter,
  type GroupShortfall,
} from "@/features/exam/generateExam";
import { routeForAttempt } from "@/features/session/routeForAttempt";
import { contentClient } from "@/lib/content/contentClient";
import { db, discardAttempt, findResumableAttempt, getResponses, type Attempt } from "@/lib/db/db";
import { useAsyncData } from "@/lib/useAsyncData";
import type {
  CertMeta,
  CertificationSummary,
  ExamBlueprint,
  Lang,
  Syllabus,
} from "@/types/content";

interface ResumeState {
  attempt: Attempt;
  answered: number;
}

/**
 * F1-16 — what this candidate has done so far.
 *
 * Three numbers, no chart. A first-time visitor gets none of it and is pointed
 * at study instead; a returning one gets the three facts that answer "am I
 * ready?" — how many objectives are learned, how many sessions are behind
 * them, and what the last one scored.
 */
interface Progress {
  mastered: number;
  objectives: number;
  sessions: number;
  /** The most recent submitted session's percentage, or null before the first. */
  lastPercent: number | null;
}

interface HomeData {
  cert: CertificationSummary;
  meta: CertMeta;
  blueprint: ExamBlueprint;
  syllabus: Syllabus;
  poolSize: number;
  achievable: number;
  shortfalls: GroupShortfall[];
  resume: ResumeState | null;
  progress: Progress;
}

/**
 * Read straight from IndexedDB rather than recomputed from the content: the
 * objective progress rows are already the study screens' own source of truth,
 * and a second definition of "mastered" here would eventually disagree with
 * the one on the objective page.
 */
async function loadProgress(certId: string, objectives: number): Promise<Progress> {
  // `mastered` is indexed but boolean, and IndexedDB has no boolean key type —
  // a `where({ mastered: true })` matches nothing. Counted in memory instead;
  // there are 64 rows at most.
  const [progressRows, attempts] = await Promise.all([
    db.objectiveProgress.where({ certId }).toArray(),
    db.attempts.where({ certId }).toArray(),
  ]);

  const mastered = progressRows.filter((row) => row.mastered).length;

  const submitted = attempts
    .filter((attempt) => attempt.status === "submitted")
    .sort((a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0));

  const last = submitted.at(-1);
  const lastPercent =
    last && last.points !== undefined && last.totalPoints
      ? Math.round((last.points / last.totalPoints) * 100)
      : null;

  return { mastered, objectives, sessions: submitted.length, lastPercent };
}

async function loadHome(): Promise<HomeData> {
  const cert = await contentClient.getActiveCertification();

  const [meta, blueprint, syllabus, index] = await Promise.all([
    contentClient.getMeta(cert.path),
    contentClient.getBlueprint(cert.path),
    contentClient.getSyllabus(cert.path),
    contentClient.getIndex(cert.path),
  ]);

  // Only published questions are counted; a draft never enters an exam.
  const pool = index.questions.filter((entry) => entry.status === "published");
  const preview = previewCoverage(blueprint, pool);

  const attempt = await findResumableAttempt(cert.id);
  const responses = attempt ? await getResponses(attempt.id) : [];
  const progress = await loadProgress(cert.id, cert.coverage.objectivesTotal);

  return {
    cert,
    meta,
    blueprint,
    syllabus,
    poolSize: pool.length,
    achievable: preview.total,
    shortfalls: preview.shortfalls,
    resume: attempt
      ? {
          attempt,
          answered: responses.filter((response) => response.selected.length > 0).length,
        }
      : null,
    progress,
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

/** The exam's per-chapter weighting, in the interface's language. */
function blueprintChapters(syllabus: Syllabus, lang: Lang): BlueprintChapter[] {
  return syllabus.chapters.map((chapter) => ({
    number: chapter.number,
    title: chapter.title[lang],
    questions: chapter.examQuestions,
  }));
}

/**
 * One of the three modes.
 *
 * The card is not itself a link: its heading, body and action would collapse
 * into one long accessible name, and the action's own wording is what a
 * screen-reader user navigating by link needs to hear.
 *
 * The three facts are a real definition list rather than a styled row, because
 * they are the same three questions for every mode — is there a clock, when do
 * I see the answer, how am I scored — and comparing them across the modes is
 * the whole reason they are on this page.
 */
function ModeCard({
  title,
  lead,
  notice,
  facts,
  action,
  to,
  primary = false,
}: {
  title: string;
  lead: string;
  notice?: string;
  facts: { term: string; detail: string }[];
  action: string;
  to: string;
  primary?: boolean;
}) {
  return (
    <article
      className={`grid gap-5 rounded-[var(--radius-card)] border bg-surface p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] sm:gap-8 sm:p-6 ${
        primary ? "border-accent/50" : "border-border"
      }`}
    >
      <div className="flex flex-col items-start gap-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="max-w-[48ch] text-[15px] leading-relaxed text-fg-muted">{lead}</p>

        {notice ? (
          <p className="max-w-[48ch] rounded-[var(--radius-badge)] border border-flag/40 bg-flag/10 px-3 py-2 text-[13px] leading-relaxed text-fg-muted">
            {notice}
          </p>
        ) : null}

        <Link
          to={to}
          className={
            primary
              ? "mt-1 rounded-[var(--radius-btn)] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg"
              : "mt-1 rounded-[var(--radius-btn)] border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-2"
          }
        >
          {action}
        </Link>
      </div>

      <dl className="flex flex-col gap-3 border-t border-border pt-4 text-[13px] sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
        {facts.map((fact) => (
          <div key={fact.term} className="flex flex-col gap-0.5">
            <dt className="font-medium text-fg">{fact.term}</dt>
            <dd className="m-0 leading-relaxed text-fg-muted">{fact.detail}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <section className="flex flex-col gap-4">{children}</section>;
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const { data, failed, reload } = useAsyncData(loadHome);
  const [discardedId, setDiscardedId] = useState<string | null>(null);

  if (failed) return <ErrorNotice onRetry={reload} />;
  if (!data) return <Spinner />;

  const { cert, meta, blueprint, syllabus, poolSize, achievable, shortfalls, progress } = data;
  const lang: Lang = i18n.language === "en" ? "en" : "tr";
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
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-8 sm:py-12">
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

      {/* F1-16 — the two halves of the same question, "where am I?". A first
          visit has no answer, so it gets a direction instead of an empty
          dashboard of zeros. */}
      {progress.sessions === 0 && progress.mastered === 0 ? (
        <section
          aria-labelledby="start-here"
          className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-accent/40 bg-accent/5 p-5"
        >
          <h2 id="start-here" className="text-lg font-semibold">
            {t("home.startHereTitle")}
          </h2>
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-fg-muted">
            {t("home.startHereBody", { total: cert.coverage.objectivesTotal })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/calisma"
              className="rounded-[var(--radius-btn)] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
            >
              {t("home.startHereStudy")}
            </Link>
            <Link
              to="/sinav"
              className="rounded-[var(--radius-btn)] border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
            >
              {t("home.startHereExam")}
            </Link>
          </div>
        </section>
      ) : (
        <section
          aria-labelledby="your-status"
          className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5"
        >
          <h2 id="your-status" className="text-lg font-semibold">
            {t("home.statusTitle")}
          </h2>

          <dl className="flex flex-wrap gap-x-8 gap-y-3">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs uppercase text-fg-muted">{t("home.statusMastered")}</dt>
              <dd className="font-mono text-xl font-semibold tabular-nums">
                {progress.mastered}/{progress.objectives}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs uppercase text-fg-muted">{t("home.statusSessions")}</dt>
              <dd className="font-mono text-xl font-semibold tabular-nums">{progress.sessions}</dd>
            </div>
            {/* Omitted rather than shown as 0% before the first finished
                session: a dash reads as a score of zero. */}
            {progress.lastPercent !== null ? (
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs uppercase text-fg-muted">{t("home.statusLast")}</dt>
                <dd className="font-mono text-xl font-semibold tabular-nums">
                  {t("result.percent", { percent: progress.lastPercent })}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/listelerim"
              className="rounded-[var(--radius-btn)] border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
            >
              {t("nav.lists")}
            </Link>
            <Link
              to="/calisma"
              className="rounded-[var(--radius-btn)] border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
            >
              {t("home.startStudy")}
            </Link>
          </div>
        </section>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:gap-14">
        <div className="flex flex-col gap-5">
          <h1 className="max-w-[20ch] text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[42px]">
            {t("home.heroTitle")}
          </h1>

          <p className="max-w-[54ch] text-[17px] leading-[1.6] text-fg-muted sm:text-[19px]">
            {t("home.heroLead", { questions: poolSize, version: cert.syllabusVersion })}
          </p>

          <span className="font-mono text-xs text-fg-muted">
            {cert.acronym} v{cert.syllabusVersion}
          </span>
        </div>

        <div lang={lang}>
          <BlueprintFigure
            chapters={blueprintChapters(syllabus, lang)}
            totalQuestions={blueprint.totals.questions}
            durationMinutes={exam.durationMinutes}
            passPoints={exam.passPoints}
            totalPoints={exam.totalPoints}
          />
        </div>
      </div>

      <Section>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-semibold">{t("home.modesTitle")}</h2>
          <p className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">
            {t("home.modesLead")}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <ModeCard
            title={t("home.studyTitle")}
            lead={t("home.studyLead")}
            facts={[
              { term: t("home.factTime"), detail: t("home.studyTime") },
              { term: t("home.factAnswers"), detail: t("home.studyAnswers") },
              { term: t("home.factScore"), detail: t("home.studyScore") },
            ]}
            action={t("home.startStudy")}
            to="/calisma"
            primary
          />

          <ModeCard
            title={t("home.practiceTitle")}
            lead={t("home.practiceLead")}
            facts={[
              { term: t("home.factTime"), detail: t("home.practiceTime") },
              { term: t("home.factAnswers"), detail: t("home.practiceAnswers") },
              { term: t("home.factScore"), detail: t("home.practiceScore") },
            ]}
            action={t("practice.start")}
            to="/alistirma"
          />

          <ModeCard
            title={t("home.examTitle")}
            lead={t("home.examLead", {
              count: exam.questionCount,
              chapters: syllabus.chapters.length,
            })}
            facts={[
              {
                term: t("home.factTime"),
                detail: t("home.examTime", { minutes: exam.durationMinutes }),
              },
              { term: t("home.factAnswers"), detail: t("home.examAnswers") },
              {
                term: t("home.factScore"),
                detail: t("home.examScore", {
                  pass: exam.passPoints,
                  total: exam.totalPoints,
                }),
              },
            ]}
            action={t("home.startExam")}
            to="/sinav"
          />
        </div>
      </Section>

      {/* The official questions are the first thing a candidate looks for and
          the one thing this pool may never hold — their licence permits
          attributed extracts and prohibits everything else without ISTQB's
          written approval (docs/08 §2). Saying so here, rather than letting
          someone search the pool for them, is the honest answer. */}
      <section
        aria-labelledby="official-questions"
        className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6"
      >
        <h2 id="official-questions" className="text-lg font-semibold">
          {t("home.officialTitle")}
        </h2>
        <p className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">
          {t("home.officialBody")}
        </p>
        <Link
          to="/kaynaklar"
          className="rounded-[var(--radius-btn)] border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-2"
        >
          {t("home.officialAction")}
        </Link>
      </section>

      <Section>
        {/* No progress bar here. Coverage is 64 of 64 and the objective count
            is fixed by the syllabus, so a bar would sit permanently full and
            read as decoration; the sentence carries both numbers. */}
        <p className="max-w-[65ch] text-sm text-fg-muted">{coverageLabel}</p>

        {shortfalls.length > 0 ? (
          <div
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
          </div>
        ) : null}
      </Section>
    </div>
  );
}

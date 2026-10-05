/**
 * F3-05 — `/ilerleme`, the progress screen.
 *
 * Four readings of what is already stored, for the picked certification:
 * the readiness estimate (F3-06), the mock exams over time against the pass
 * line, first answers against latest answers per chapter, and a streak of
 * active days that one missed day does not break. Nothing here is written;
 * the numbers come from `features/progress/progress.ts`.
 *
 * Every bar is `aria-hidden` and every row says its number in words, as on
 * the repetition forecast: a bar repeats what the text already states.
 */

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { CertificationTag } from "@/components/CertificationTag";
import { ErrorNotice } from "@/components/ErrorNotice";
import { ReadinessNote } from "@/components/ReadinessNote";
import { Spinner } from "@/components/Spinner";
import {
  activityTimes,
  chapterProgress,
  examPoints,
  readiness,
  streak,
  type ChapterProgress,
  type ExamPoint,
  type Readiness,
  type Streak,
} from "@/features/progress/progress";
import { contentClient } from "@/lib/content/contentClient";
import { db } from "@/lib/db/db";
import { buildQuestionHistory } from "@/lib/db/questionHistory";
import { loadDeck } from "@/lib/db/srsCards";
import { useArrivalFocus } from "@/lib/useArrivalFocus";
import { useAsyncData } from "@/lib/useAsyncData";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import type { CertificationSummary, Lang } from "@/types/content";

/** How many mock exams the trend shows: the latest ones. */
const TREND_LENGTH = 10;

interface ProgressData {
  cert: CertificationSummary;
  passPoints: number;
  totalPoints: number;
  exams: ExamPoint[];
  readiness: Readiness;
  chapters: (ChapterProgress & { title: Record<Lang, string> })[];
  streak: Streak;
}

async function loadProgress(): Promise<ProgressData> {
  const cert = await contentClient.getActiveCertification();
  const [meta, syllabus, index, attempts, deck] = await Promise.all([
    contentClient.getMeta(cert.path),
    contentClient.getSyllabus(cert.path),
    contentClient.getIndex(cert.path),
    db.attempts.where({ certId: cert.id }).toArray(),
    loadDeck(cert.id),
  ]);

  // Every question in the index, published or not: a question retired since
  // it was answered still says something about how a chapter went.
  const questions = await contentClient.getQuestions(
    cert.path,
    index.questions.map((entry) => entry.id),
  );
  const histories = await buildQuestionHistory(cert.id, questions);
  const chapterById = new Map(index.questions.map((entry) => [entry.id, entry.chapter]));
  const titles = new Map(syllabus.chapters.map((chapter) => [chapter.number, chapter.title]));

  const exams = examPoints(attempts);

  return {
    cert,
    passPoints: meta.exam.passPoints,
    totalPoints: meta.exam.totalPoints,
    exams,
    readiness: readiness(exams),
    chapters: chapterProgress(histories, (id) => chapterById.get(id)).map((row) => ({
      ...row,
      title: titles.get(row.chapter) ?? { tr: "", en: "" },
    })),
    streak: streak(activityTimes(attempts, deck), Date.now()),
  };
}

const CARD = "flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5";

export default function Progress() {
  const { t, i18n } = useTranslation();
  const { data, failed, reload } = useAsyncData(loadProgress);
  const lang: Lang = i18n.language === "en" ? "en" : "tr";

  useDocumentTitle(t("progress.title"));
  // A nav click is a route swap inside a Suspense boundary: nothing else
  // would tell a screen reader it arrived anywhere.
  const headingRef = useArrivalFocus<HTMLHeadingElement>(Boolean(data));

  if (failed) return <ErrorNotice onRetry={reload} />;
  if (!data) return <Spinner />;

  const trend = data.exams.slice(-TREND_LENGTH);
  // One scale for every bar and the pass line: the paper's. A short exam (the
  // pool could not fill it) drawn on its own total would cross a line it did
  // not reach.
  const percentOf = (points: number) => (points / data.totalPoints) * 100;
  // With the time, so two exams on one day are two different rows.
  const date = new Intl.DateTimeFormat(i18n.language, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-2">
        <CertificationTag cert={data.cert} />
        <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-semibold leading-tight">
          {t("progress.title")}
        </h1>
        <p className="max-w-[60ch] text-[15px] text-fg-muted">{t("progress.intro")}</p>
      </header>

      <section aria-labelledby="progress-readiness" className={CARD}>
        <h2 id="progress-readiness" className="text-lg font-semibold">
          {t("progress.readinessTitle")}
        </h2>
        <ReadinessNote readiness={data.readiness} />
      </section>

      <section aria-labelledby="progress-streak" className={CARD}>
        <h2 id="progress-streak" className="text-lg font-semibold">
          {t("progress.streakTitle")}
        </h2>
        <p className="text-[15px]">
          {data.streak.days > 0
            ? t("progress.streakDays", { count: data.streak.days })
            : t("progress.streakNone")}
        </p>
        <p className="max-w-[65ch] text-[13px] text-fg-muted">
          {data.streak.days > 0 && !data.streak.activeToday
            ? t("progress.streakKeep")
            : t("progress.streakRule")}
        </p>
      </section>

      <section aria-labelledby="progress-exams" className={CARD}>
        <h2 id="progress-exams" className="text-lg font-semibold">
          {t("progress.examsTitle")}
        </h2>

        {trend.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-[15px] text-fg-muted">{t("progress.examsNone")}</p>
            <Link
              to="/sinav"
              className="rounded-[var(--radius-btn)] border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
            >
              {t("home.startExam")}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-fg-muted">
              {t("progress.examsCaption", {
                count: trend.length,
                pass: data.passPoints,
                total: data.totalPoints,
              })}
            </p>
            <ol className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2">
              {trend.map((exam) => (
                <li key={exam.attemptId} className="col-span-3 grid grid-cols-subgrid items-center">
                  <time
                    dateTime={new Date(exam.at).toISOString()}
                    className="font-mono text-[13px] tabular-nums"
                  >
                    {date.format(exam.at)}
                  </time>
                  <span aria-hidden="true" className="relative h-2.5 rounded-full bg-surface-2">
                    <span
                      className={
                        exam.passed
                          ? "block h-full rounded-full bg-accent"
                          : "block h-full rounded-full bg-fg-muted"
                      }
                      style={{ width: `${percentOf(exam.points)}%` }}
                    />
                    <span
                      className="absolute -top-1 h-[18px] w-0.5 bg-fg"
                      style={{ left: `${percentOf(data.passPoints)}%` }}
                    />
                  </span>
                  <span className="text-right text-[13px]">
                    {t(exam.passed ? "progress.examPassed" : "progress.examNotPassed", {
                      points: exam.points,
                      total: exam.totalPoints,
                    })}
                    {exam.timed ? null : (
                      <span className="text-fg-muted"> · {t("progress.examUntimed")}</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>

      <section aria-labelledby="progress-chapters" className={CARD}>
        <h2 id="progress-chapters" className="text-lg font-semibold">
          {t("progress.chaptersTitle")}
        </h2>

        {data.chapters.length === 0 ? (
          <p className="text-[15px] text-fg-muted">{t("progress.chaptersNone")}</p>
        ) : (
          <>
            <p className="max-w-[65ch] text-[13px] text-fg-muted">
              {t("progress.chaptersCaption")}
            </p>
            <ul className="flex flex-col gap-3">
              {data.chapters.map((row) => (
                <li key={row.chapter} className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-medium">
                    {t("setup.chapter", { number: row.chapter })} · {row.title[lang]}
                  </span>
                  <span className="text-[13px] text-fg-muted">
                    {t("progress.chapterRow", {
                      first: row.firstPercent,
                      latest: row.latestPercent,
                      count: row.answered,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

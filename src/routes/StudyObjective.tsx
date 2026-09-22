/**
 * Study mode, level 3 — teach one learning objective, then test it.
 *
 * Reading the card is itself progress: `markLessonRead` runs on mount, so the
 * objective leaves the "not started" state as soon as it has been opened, even
 * if the candidate never takes the test — but only once there is a card to
 * read. Lessons land objective by objective, and an objective whose lesson has
 * not shipped shows a placeholder; counting that as reading would move the
 * chapter badge for content nobody was given.
 *
 * The test is deliberately short and always instant-feedback: the point is to
 * close the loop between the explanation and the question while the
 * explanation is still on screen. It is never timed.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ContentLangToggle } from "@/components/ContentLangToggle";
import { ErrorNotice } from "@/components/ErrorNotice";
import { LessonCard } from "@/components/LessonCard";
import { Spinner } from "@/components/Spinner";
import { useSessionStore } from "@/features/session/sessionStore";
import { contentClient } from "@/lib/content/contentClient";
import { markLessonRead, MASTERY_MIN_ANSWERED } from "@/lib/db/objectiveProgress";
import { useAsyncData } from "@/lib/useAsyncData";
import type { CertificationSummary, Lang, Lesson, Objective } from "@/types/content";

/**
 * The longest objective test. A single objective rarely carries more than a
 * handful of published questions, and a study loop that outgrows one screenful
 * stops being a study loop — this is a study-mode product choice, not an exam
 * constant, so it does not come from meta.json.
 */
const MAX_TEST_QUESTIONS = 10;

interface ObjectiveData {
  cert: CertificationSummary;
  objective: Objective | null;
  lesson: Lesson | null;
  /** Published questions carrying this objective — drafts never enter a session. */
  available: number;
}

async function loadObjective(loCode: string): Promise<ObjectiveData> {
  const cert = await contentClient.getActiveCertification();

  const [objectives, lesson, index] = await Promise.all([
    contentClient.getObjectives(cert.path),
    contentClient.getLesson(cert.path, loCode),
    contentClient.getIndex(cert.path),
  ]);

  const available = index.questions.filter(
    (entry) => entry.status === "published" && entry.objectives.includes(loCode),
  ).length;

  return {
    cert,
    objective: objectives.find((item) => item.code === loCode) ?? null,
    lesson,
    available,
  };
}

/**
 * Keyed on the LO code for the same reason `StudyChapter` is: `useAsyncData`
 * loads once per mount, and the "next objective" link on the result screen
 * navigates between two instances of this very route.
 */
export default function StudyObjective() {
  const { loCode } = useParams<{ loCode: string }>();

  if (!loCode) return <Spinner />;
  return <ObjectiveView key={loCode} loCode={loCode} />;
}

function ObjectiveView({ loCode }: { loCode: string }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const startSession = useSessionStore((state) => state.startSession);
  const starting = useSessionStore((state) => state.loading);

  const { data, failed, reload } = useAsyncData(() => loadObjective(loCode));

  const [contentLang, setContentLang] = useState<Lang>(() =>
    i18n.language === "en" ? "en" : "tr",
  );
  const [startFailed, setStartFailed] = useState(false);

  const certId = data?.cert.id;
  const objectiveExists = Boolean(data?.objective);
  const hasLesson = Boolean(data?.lesson);

  // Opening the card is progress in its own right — when there is a card. An
  // unknown LO code is not recorded either: that would create a progress row
  // for an objective that does not exist and inflate every chapter's
  // denominator.
  useEffect(() => {
    if (!certId || !objectiveExists || !hasLesson) return;
    void markLessonRead(certId, loCode);
  }, [certId, objectiveExists, hasLesson, loCode]);

  if (failed) return <ErrorNotice onRetry={reload} />;
  if (!data) return <Spinner />;

  const { cert, objective, lesson, available } = data;

  if (!objective) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-16">
        <h1 className="text-2xl font-semibold">{t("common.notFoundTitle")}</h1>
        <p className="text-sm text-fg-muted">{t("common.notFoundBody")}</p>
        <Link
          to="/calisma"
          className="w-fit rounded-[var(--radius-btn)] border border-border px-4 py-2 font-medium hover:bg-surface-2"
        >
          {t("study.chaptersTitle")}
        </Link>
      </div>
    );
  }

  const count = Math.min(available, MAX_TEST_QUESTIONS);
  // Rule 8: the pool's limits are stated before the test starts, never after.
  // Three is the mastery bar, so below it the test cannot mark the objective
  // learned however well it goes — the candidate is told that up front.
  const shortOfMastery = count > 0 && count < MASTERY_MIN_ANSWERED;

  async function onStart() {
    setStartFailed(false);

    const attemptId = await startSession({
      certPath: cert.path,
      mode: "study",
      scope: { kind: "objective", objectives: [loCode], count },
      contentLang,
      instantFeedback: true,
      durationMinutes: null,
      excludeSeen: false,
    });

    if (!attemptId) {
      setStartFailed(true);
      return;
    }

    navigate(`/calisma/lo/${loCode}/${attemptId}`);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-3">
        <Link
          to={`/calisma/${objective.chapter}`}
          className="w-fit text-sm text-fg-muted underline underline-offset-2"
        >
          {t("setup.chapter", { number: objective.chapter })}
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-sm font-medium text-accent">
            <span className="sr-only">{t("question.objective")}: </span>
            {objective.code}
            <span className="ml-2 text-fg-muted">
              <span className="sr-only">{t("question.kLevel")}: </span>
              {objective.kLevel}
            </span>
          </p>

          <ContentLangToggle value={contentLang} onChange={setContentLang} />
        </div>

        <h1 lang={contentLang} className="text-[26px] font-semibold leading-tight">
          {objective.text[contentLang]}
        </h1>
      </header>

      <LessonCard lesson={lesson} lang={contentLang} />

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        {available === 0 ? (
          <p className="max-w-[65ch] text-sm text-fg-muted">{t("study.noQuestions")}</p>
        ) : (
          <p className="max-w-[65ch] text-sm text-fg-muted">{t("study.testLength", { count })}</p>
        )}

        {shortOfMastery ? (
          <p
            role="status"
            className="max-w-[65ch] rounded-[var(--radius-card)] border border-flag/40 bg-flag/10 px-4 py-3 text-sm"
          >
            {/* Not `session.shortfallScope`: that string says a selection
                could not be filled, and the candidate made no selection here.
                On the current pool this fires on 52 of the 64 objectives, so
                it is the study-mode default rather than an edge case, and it
                has to say what it actually means. */}
            {t("study.belowMastery", { count, required: MASTERY_MIN_ANSWERED })}
          </p>
        ) : null}

        {startFailed ? (
          <p role="alert" className="max-w-[65ch] text-sm text-flag">
            {t("common.errorTitle")}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void onStart()}
          disabled={count === 0 || starting}
          className="w-fit rounded-[var(--radius-btn)] bg-accent px-5 py-3 font-semibold text-accent-fg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {starting ? t("common.loading") : t("study.startTest")}
        </button>
      </section>
    </div>
  );
}

/**
 * Study mode, level 1 — the six syllabus chapters.
 *
 * The entry point for persona P2: a first-time visitor who would score 12/40
 * on a cold mock exam starts here instead, one learning objective at a time.
 *
 * Chapter titles and objective counts come from syllabus.json and
 * objectives.json; the mastered count comes from IndexedDB. Nothing about the
 * syllabus is restated in code.
 */

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ErrorNotice } from "@/components/ErrorNotice";
import { Spinner } from "@/components/Spinner";
import { contentClient } from "@/lib/content/contentClient";
import { getObjectiveProgress } from "@/lib/db/objectiveProgress";
import { useAsyncData } from "@/lib/useAsyncData";
import type { Chapter, Lang, Objective } from "@/types/content";

interface ChaptersData {
  chapters: Chapter[];
  objectives: Objective[];
  /** Objective code -> whether its most recent test cleared the mastery bar. */
  mastered: Set<string>;
}

async function loadChapters(): Promise<ChaptersData> {
  const cert = await contentClient.getActiveCertification();

  const [syllabus, objectives] = await Promise.all([
    contentClient.getSyllabus(cert.path),
    contentClient.getObjectives(cert.path),
  ]);

  const progress = await getObjectiveProgress(
    cert.id,
    objectives.map((objective) => objective.code),
  );

  const mastered = new Set<string>();
  for (const [code, row] of progress) {
    if (row.mastered) mastered.add(code);
  }

  return { chapters: syllabus.chapters, objectives, mastered };
}

export default function StudyChapters() {
  const { t, i18n } = useTranslation();
  const { data, failed, reload } = useAsyncData(loadChapters);

  if (failed) return <ErrorNotice onRetry={reload} />;
  if (!data) return <Spinner />;

  // Deliberately the interface language. The content-language toggle lives on
  // the objective screen and there is nothing above it to hold one, so a
  // chapter list has no content language of its own to follow. The two stay
  // the same here until study grows a control that sits above the objective.
  const lang: Lang = i18n.language === "en" ? "en" : "tr";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      <h1 className="text-[28px] font-semibold leading-tight">{t("study.chaptersTitle")}</h1>

      <ul className="flex flex-col gap-3">
        {data.chapters.map((chapter) => {
          const codes = data.objectives.filter((objective) => objective.chapter === chapter.number);
          const mastered = codes.filter((objective) => data.mastered.has(objective.code)).length;

          return (
            <li key={chapter.number}>
              <Link
                to={`/calisma/${chapter.number}`}
                className="flex flex-col gap-1.5 rounded-[var(--radius-card)] border border-border bg-surface p-5 transition-colors hover:bg-surface-2"
              >
                <span className="text-sm text-fg-muted">
                  {t("setup.chapter", { number: chapter.number })}
                </span>

                <span lang={lang} className="text-lg font-semibold leading-snug">
                  {chapter.title[lang]}
                </span>

                <span className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-fg-muted">
                  <span>{t("study.objectiveCount", { count: codes.length })}</span>
                  <span className="font-mono">
                    {t("study.masteredCount", { mastered, total: codes.length })}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

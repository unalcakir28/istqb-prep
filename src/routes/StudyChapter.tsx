/**
 * Study mode, level 2 — the learning objectives of one chapter.
 *
 * Each row states the objective's state in words next to an icon. Colour is
 * never the only carrier (WCAG 1.4.1), which is why the badge lives in
 * `ObjectiveStateBadge` rather than being a coloured dot per row.
 */

import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ErrorNotice } from "@/components/ErrorNotice";
import { ObjectiveStateBadge } from "@/components/ObjectiveStateBadge";
import { Spinner } from "@/components/Spinner";
import { contentClient } from "@/lib/content/contentClient";
import type { ObjectiveProgress } from "@/lib/db/db";
import { getObjectiveProgress, objectiveStateOf } from "@/lib/db/objectiveProgress";
import { useAsyncData } from "@/lib/useAsyncData";
import type { Chapter, Lang, Objective } from "@/types/content";

interface ChapterData {
  chapter: Chapter | null;
  objectives: Objective[];
  progress: Map<string, ObjectiveProgress>;
}

async function loadChapter(chapterNumber: number): Promise<ChapterData> {
  const cert = await contentClient.getActiveCertification();

  const [syllabus, all] = await Promise.all([
    contentClient.getSyllabus(cert.path),
    contentClient.getObjectives(cert.path),
  ]);

  const objectives = all.filter((objective) => objective.chapter === chapterNumber);
  const progress = await getObjectiveProgress(
    cert.id,
    objectives.map((objective) => objective.code),
  );

  return {
    chapter: syllabus.chapters.find((item) => item.number === chapterNumber) ?? null,
    objectives,
    progress,
  };
}

/**
 * The route component only reads the parameter and keys the view on it.
 * `useAsyncData` loads once per mount, so without the key a navigation that
 * changes only `:chapter` would keep the previous chapter's objectives on
 * screen under the new heading.
 */
export default function StudyChapter() {
  const { chapter } = useParams<{ chapter: string }>();

  // A non-numeric segment can only come from a hand-edited URL; `NaN` matches
  // no chapter and falls through to the same "not found" branch as chapter 9.
  return <ChapterView key={chapter} chapterNumber={Number(chapter)} />;
}

function ChapterView({ chapterNumber }: { chapterNumber: number }) {
  const { t, i18n } = useTranslation();
  const { data, failed, reload } = useAsyncData(() => loadChapter(chapterNumber));

  if (failed) return <ErrorNotice onRetry={reload} />;
  if (!data) return <Spinner />;

  const { chapter, objectives, progress } = data;
  // Deliberately the interface language, exactly as on the chapter list: the
  // content-language toggle lives one level down, on the objective screen, so
  // there is no content language for this screen to follow yet.
  const lang: Lang = i18n.language === "en" ? "en" : "tr";

  if (!chapter) {
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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-2">
        <Link to="/calisma" className="w-fit text-sm text-fg-muted underline underline-offset-2">
          {t("study.chaptersTitle")}
        </Link>

        <h1 lang={lang} className="text-[28px] font-semibold leading-tight">
          {t("setup.chapter", { number: chapter.number })} — {chapter.title[lang]}
        </h1>

        <p className="text-sm text-fg-muted">
          {t("study.objectiveCount", { count: objectives.length })}
        </p>
      </header>

      <ul className="flex flex-col gap-2">
        {objectives.map((objective) => (
          <li key={objective.code}>
            <Link
              to={`/calisma/lo/${objective.code}`}
              className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-colors hover:bg-surface-2"
            >
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[13px] font-medium text-accent">
                  {objective.code}
                </span>
                <span className="font-mono text-[12px] text-fg-muted">
                  <span className="sr-only">{t("question.kLevel")}: </span>
                  {objective.kLevel}
                </span>
                <ObjectiveStateBadge state={objectiveStateOf(progress.get(objective.code))} />
              </span>

              <span lang={lang} className="text-[15px] leading-relaxed">
                {objective.text[lang]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

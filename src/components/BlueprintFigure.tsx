/**
 * The exam's own shape, drawn from the syllabus.
 *
 * One cell per question of the real paper, grouped by chapter. The ragged
 * right edge IS the information: chapter 4 is the longest row and chapter 6 is
 * two cells, which is the single most useful thing a candidate can learn about
 * where to spend study time.
 *
 * Nothing here is decorative and nothing is hardcoded — the rows come from
 * `syllabus.json` and the figures under them from `meta.json`, so the picture
 * changes when the blueprint does (the CLAUDE.md "do not hardcode exam
 * constants" rule).
 *
 * The cells are `aria-hidden`: they carry no information the row's own text
 * does not already state, and forty unlabelled squares would be forty stops on
 * a screen reader for nothing.
 */

import { useTranslation } from "react-i18next";

export interface BlueprintChapter {
  number: number;
  title: string;
  questions: number;
}

interface Props {
  chapters: BlueprintChapter[];
  totalQuestions: number;
  durationMinutes: number;
  passPoints: number;
  totalPoints: number;
}

/** Running index across every chapter, so the load-in reads left to right. */
function cellDelays(chapters: BlueprintChapter[]): number[][] {
  let index = 0;

  return chapters.map((chapter) =>
    Array.from({ length: chapter.questions }, () => {
      index += 1;
      return (index - 1) * 12;
    }),
  );
}

export function BlueprintFigure({
  chapters,
  totalQuestions,
  durationMinutes,
  passPoints,
  totalPoints,
}: Props) {
  const { t } = useTranslation();
  const delays = cellDelays(chapters);

  return (
    <figure className="m-0 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
      <figcaption className="mb-4 flex flex-col gap-1.5">
        <h2 className="text-[17px] font-semibold leading-snug">{t("home.blueprintTitle")}</h2>
        <p className="max-w-[46ch] text-[13px] leading-relaxed text-fg-muted">
          {t("home.blueprintCaption", { total: totalQuestions, chapters: chapters.length })}
        </p>
      </figcaption>

      <ol className="flex flex-col gap-3">
        {chapters.map((chapter, chapterIndex) => (
          <li key={chapter.number} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] leading-snug text-fg-muted">
                <span aria-hidden="true" className="mr-1.5 font-mono tabular-nums text-fg">
                  {chapter.number}
                </span>
                <span className="sr-only">{t("setup.chapter", { number: chapter.number })} </span>
                {chapter.title}
              </span>

              <span className="shrink-0 font-mono text-[13px] tabular-nums text-fg">
                {chapter.questions}
                <span className="sr-only"> {t("home.blueprintQuestions")}</span>
              </span>
            </div>

            <div aria-hidden="true" className="flex flex-wrap gap-1">
              {delays[chapterIndex].map((delay, cellIndex) => (
                <span
                  key={cellIndex}
                  className="blueprint-cell size-3 rounded-[3px] bg-accent"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-border pt-3.5 text-[13px] text-fg-muted">
        <span>{t("home.blueprintDuration", { minutes: durationMinutes })}</span>
        <span>{t("home.blueprintPass", { pass: passPoints, total: totalPoints })}</span>
      </p>
    </figure>
  );
}

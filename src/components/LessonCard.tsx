import { useTranslation } from "react-i18next";

import { CitationChips } from "./CitationChips";
import type { Lang, Lesson } from "@/types/content";

/**
 * The teaching half of study mode: one learning objective explained before it
 * is tested.
 *
 * `lesson` is deliberately nullable. Lesson content lands objective by
 * objective (Track C), and study mode has to stay usable before it is
 * complete — an objective without a card still has questions, still records
 * mastery, and still belongs in the chapter list. A missing card is therefore
 * a normal state with a short honest placeholder, not an error screen.
 *
 * `paragraphs` is plain text, not Markdown (see `Lesson` in types/content.ts):
 * the project ships no Markdown renderer and this feature does not justify
 * adding one.
 */
export interface LessonCardProps {
  lesson: Lesson | null;
  lang: Lang;
}

const CARD = "rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6";

function PointList({ title, items, lang }: { title: string; items: string[]; lang: Lang }) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">{title}</h3>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed">
        {items.map((item) => (
          <li key={item} lang={lang}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LessonCard({ lesson, lang }: LessonCardProps) {
  const { t } = useTranslation();

  if (!lesson) {
    return (
      <div className={CARD}>
        <p className="max-w-[65ch] text-[15px] text-fg-muted">{t("study.lessonMissing")}</p>
      </div>
    );
  }

  const content = lesson.i18n[lang];

  return (
    <article className={`${CARD} flex flex-col gap-5`}>
      <header className="flex flex-col gap-3">
        <h2 lang={lang} className="text-xl font-semibold leading-snug">
          {content.title}
        </h2>
        <CitationChips
          objectives={[lesson.objective]}
          syllabusRef={lesson.syllabusRef}
          syllabusVersion={lesson.syllabusVersion}
        />
      </header>

      <div className="flex max-w-[70ch] flex-col gap-3 text-[15px] leading-relaxed">
        {content.paragraphs.map((paragraph) => (
          <p key={paragraph} lang={lang}>
            {paragraph}
          </p>
        ))}
      </div>

      <PointList title={t("study.keyPoints")} items={content.keyPoints} lang={lang} />
      <PointList title={t("study.commonMistakes")} items={content.commonMistakes} lang={lang} />
    </article>
  );
}

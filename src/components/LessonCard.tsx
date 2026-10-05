import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { CitationChips } from "./CitationChips";
import { GlossaryTerm } from "./GlossaryTerm";
import { lessonTexts, type LessonGlossary } from "@/features/glossary/lessonGlossary";
import { markTerms, type Segment } from "@/features/glossary/markTerms";
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
 *
 * F2-11: with `glossary`, the first time the card names an ISTQB Glossary
 * term it becomes a button that opens the definition in place
 * (`GlossaryTerm`). Without it — the glossary failed to load — the card is
 * the same text, unmarked.
 */
export interface LessonCardProps {
  lesson: Lesson | null;
  lang: Lang;
  glossary?: LessonGlossary | null;
}

const CARD = "rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6";

/** One text of the card, its glossary terms made into buttons. */
type Rendered = { key: string; node: ReactNode };

function renderSegments(
  segments: Segment[],
  glossary: LessonGlossary | null | undefined,
  lang: Lang,
): ReactNode {
  if (!glossary) return segments.map((segment) => segment.text).join("");

  return segments.map((segment, index) =>
    segment.slug ? (
      <GlossaryTerm
        key={index}
        text={segment.text}
        slug={segment.slug}
        glossary={glossary}
        lang={lang}
      />
    ) : (
      segment.text
    ),
  );
}

function PointList({ title, items, lang }: { title: string; items: Rendered[]; lang: Lang }) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">{title}</h3>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed">
        {items.map((item) => (
          <li key={item.key} lang={lang}>
            {item.node}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LessonCard({ lesson, lang, glossary }: LessonCardProps) {
  const { t } = useTranslation();

  // Every text of the card in one pass, so a term is marked only where the
  // card first names it, paragraphs and lists alike.
  const rendered = useMemo(() => {
    if (!lesson) return [];
    const texts = lessonTexts(lesson, lang);
    const segments = markTerms(texts, glossary?.terms ?? [], lang);
    return texts.map((text, index) => ({
      key: text,
      node: renderSegments(segments[index], glossary, lang),
    }));
  }, [lesson, lang, glossary]);

  if (!lesson) {
    return (
      <div className={CARD}>
        <p className="max-w-[65ch] text-[15px] text-fg-muted">{t("study.lessonMissing")}</p>
      </div>
    );
  }

  const content = lesson.i18n[lang];
  const paragraphs = rendered.slice(0, content.paragraphs.length);
  const keyPoints = rendered.slice(
    content.paragraphs.length,
    content.paragraphs.length + content.keyPoints.length,
  );
  const commonMistakes = rendered.slice(content.paragraphs.length + content.keyPoints.length);

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
        {paragraphs.map((paragraph) => (
          <p key={paragraph.key} lang={lang}>
            {paragraph.node}
          </p>
        ))}
      </div>

      <PointList title={t("study.keyPoints")} items={keyPoints} lang={lang} />
      <PointList title={t("study.commonMistakes")} items={commonMistakes} lang={lang} />
    </article>
  );
}

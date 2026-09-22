import type { RefObject } from "react";
import { useTranslation } from "react-i18next";

import { CitationChips } from "./CitationChips";
import { MediaRenderer } from "./MediaRenderer";
import { OptionList } from "./OptionList";
import type { Lang, Question } from "@/types/content";

/**
 * Question card — the hero of the exam screen (docs/06 §1.1).
 *
 * Content language is independent of the UI language: a candidate can
 * leave the UI in Turkish and still read the question in English. The
 * question body carries its own `lang` attribute, so the screen reader
 * pronounces it correctly.
 *
 * The LO code is NOT shown during the exam — it doesn't appear on the real
 * exam either, and it would give away the answer. Citation chips only
 * appear once the answer has been revealed.
 *
 * The stem is a HEADING, not a paragraph. Next replaces the stem, every
 * option and the rationale without a page load, so the shell needs somewhere
 * to put focus that both announces the change and orients the reader; a
 * heading also puts the question itself on the heading outline, which used to
 * jump straight from the counter to "Navigator".
 */
export interface QuestionCardProps {
  question: Question;
  lang: Lang;
  selected: string[];
  onSelect?: (optionId: string) => void;
  revealed?: boolean;
  /** The shell focuses the stem heading when the question changes. */
  headingRef?: RefObject<HTMLHeadingElement | null>;
  /**
   * Id of the element holding the question counter. The heading borrows it so
   * that focusing it reads "Question 3 of 40 <stem>" — the number is not
   * duplicated into the DOM, it is only referenced.
   */
  counterId?: string;
  /**
   * The stem heading's level. The session screen renders one question under
   * the counter `<h1>`, so the default is right there. The review screen
   * stacks forty of them, each already introduced by its own "Question N of
   * 40" `<h2>` — without this the stem would be that heading's SIBLING and a
   * 40-question review would read as 120 flat headings instead of 40 nested
   * groups.
   */
  headingLevel?: 2 | 3;
  /**
   * F2-06 — the other language, shown beside this one. `lang` stays the
   * primary: it is what the heading is announced in and what the attempt
   * records. The second language is a quieter companion column, never a second
   * question.
   */
  secondaryLang?: Lang;
}

export function QuestionCard({
  question,
  lang,
  selected,
  onSelect,
  revealed = false,
  headingRef,
  counterId,
  headingLevel = 2,
  secondaryLang,
}: QuestionCardProps) {
  const { t } = useTranslation();
  const content = question.i18n[lang];
  const secondary = secondaryLang ? question.i18n[secondaryLang] : undefined;

  if (!content) {
    return (
      <p className="rounded-[var(--radius-card)] border border-border bg-surface-2 p-4 text-sm text-fg-muted">
        {t("common.errorTitle")}
      </p>
    );
  }

  const multi = question.selectCount > 1;
  const stemId = `${question.id}-stem`;
  const instructionId = `${question.id}-instruction`;
  const Stem = headingLevel === 3 ? "h3" : "h2";

  return (
    <article className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {/* For "HANGİ İKİSİ" (WHICH TWO) questions, the number of options to
            select is spelled out explicitly — this is what candidates miss
            most often (docs/07 §5). It is also half of the option group's
            accessible name, so a reader learns two are wanted without having
            to leave forms mode. */}
        <p
          id={instructionId}
          className={
            multi
              ? "rounded-[var(--radius-badge)] border border-flag/40 bg-flag/10 px-2 py-0.5 text-xs font-semibold text-flag"
              : "text-xs text-fg-muted"
          }
        >
          {multi ? t("exam.selectTwo") : t("exam.selectOne")}
        </p>
      </header>

      <Stem
        ref={headingRef}
        id={stemId}
        tabIndex={-1}
        lang={lang}
        aria-labelledby={counterId ? `${counterId} ${stemId}` : undefined}
        className="prose-question whitespace-pre-line text-fg"
      >
        {content.stem}
      </Stem>

      {/* Not a heading: the stem is already on the outline, and a second one
          would make every question read as two. It is the same question in
          another language, so it is marked as a quieter aside beside it. */}
      {secondary ? (
        <p
          lang={secondaryLang}
          className="prose-question whitespace-pre-line border-l-2 border-border pl-4 text-fg-muted"
        >
          {secondary.stem}
        </p>
      ) : null}

      {/* Between the stem and the options, where it is read in the order the
          question is asked. A figure after the options would be a figure the
          candidate meets only after deciding. */}
      {question.media ? (
        <MediaRenderer media={question.media} lang={lang} secondaryLang={secondaryLang} />
      ) : null}

      <OptionList
        questionId={question.id}
        options={content.options}
        selected={selected}
        selectCount={question.selectCount}
        lang={lang}
        onSelect={onSelect}
        revealed={revealed}
        correct={revealed ? question.correct : []}
        labelledBy={`${stemId} ${instructionId}`}
        secondary={
          secondary && secondaryLang
            ? { lang: secondaryLang, options: secondary.options }
            : undefined
        }
      />

      {revealed ? (
        <CitationChips
          objectives={question.objectives}
          syllabusRef={question.syllabusRef}
          kLevel={question.kLevel}
          syllabusVersion={question.syllabusVersion}
        />
      ) : null}
    </article>
  );
}

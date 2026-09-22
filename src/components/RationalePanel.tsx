import type { RefObject } from "react";
import { useTranslation } from "react-i18next";

import { CitationChips } from "./CitationChips";
import { ReportQuestionLink } from "./ReportQuestionLink";
import type { Lang, Question } from "@/types/content";

/**
 * Rationale panel — this product's main differentiator (CLAUDE.md rule 2).
 *
 * "Wrong, because the correct answer is C" is not a rationale. Every wrong
 * option states WHAT it describes, so the candidate who picked it learns
 * which concept they confused it with. That's why the panel has two layers
 * — a summary plus a per-option rationale — and the per-option part is never
 * collapsed: that's where the real value is.
 *
 * The panel is also a focus target. Revealing the answer disables the option
 * the user just activated, which drops focus to `<body>`; the shell moves it
 * here instead, so the heading is read and Tab carries on into Prev/Next
 * rather than restarting at the top of the document.
 */
export interface RationalePanelProps {
  question: Question;
  lang: Lang;
  selected: string[];
  /** The shell focuses the panel when the answer is revealed. */
  panelRef?: RefObject<HTMLElement | null>;
  /**
   * The verdict of the answer that was just revealed, folded into the panel's
   * ACCESSIBLE NAME rather than written to a live region.
   *
   * NVDA and VoiceOver both give a focus event priority and flush pending
   * polite speech, so a verdict announced at the same moment the shell moves
   * focus here is dropped — the user hears "Why?, region" and never learns
   * whether they were right. Named into the thing that receives the focus, it
   * cannot lose that race: the panel reads as "Correct answer! Why?".
   *
   * Passed only by the session shell. The review screen leaves it undefined:
   * nothing focuses the panel there and every question already carries its own
   * outcome badge.
   */
  verdict?: "correct" | "incorrect";
  /**
   * The panel heading's level — `<h2>` in session, where it sits under the
   * counter `<h1>`, `<h3>` on the review screen, where it belongs under that
   * question's own "Question N of 40" heading. The two inner headings follow
   * it one level down.
   */
  headingLevel?: 2 | 3;
}

/** The i18n key of each verdict, so the panel names one without a branch in JSX. */
const VERDICT_KEY = {
  correct: "session.feedbackCorrect",
  incorrect: "session.feedbackIncorrect",
} as const;

/** Left border color: green for the correct option, red for the candidate's wrong pick. */
function optionBorder(isCorrect: boolean, wasSelected: boolean): string {
  if (isCorrect) return "border-correct";
  if (wasSelected) return "border-incorrect";
  return "border-border";
}

export function RationalePanel({
  question,
  lang,
  selected,
  panelRef,
  verdict,
  headingLevel = 2,
}: RationalePanelProps) {
  const { t } = useTranslation();
  const content = question.i18n[lang];
  if (!content) return null;

  const { rationale, options } = content;
  const headingId = `${question.id}-rationale`;
  const verdictId = `${question.id}-verdict`;
  const spokenVerdict = verdict ? t(VERDICT_KEY[verdict]) : null;

  const Title = headingLevel === 3 ? "h3" : "h2";
  const Subtitle = headingLevel === 3 ? "h4" : "h3";

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      aria-labelledby={spokenVerdict ? `${verdictId} ${headingId}` : headingId}
      className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface-2 p-4 sm:p-5"
    >
      {/* Part of the region's name, not of the page: the verdict is already
          on the option rows for anyone who can see them, and this is here so
          that the focus move on reveal carries it. */}
      {spokenVerdict ? (
        <span id={verdictId} className="sr-only">
          {spokenVerdict}
        </span>
      ) : null}

      {/* A real heading rather than an `aria-label`: focus lands here the
          moment the answer is revealed, and a named region with nothing to
          read announces only its own name. */}
      <Title id={headingId} className="text-base font-semibold">
        {t("review.whyTitle")}
      </Title>

      <div className="flex flex-col gap-2">
        <Subtitle className="text-sm font-semibold">{t("review.summary")}</Subtitle>
        <p lang={lang} className="max-w-[65ch] text-[15px] leading-relaxed text-fg">
          {rationale.summary}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Subtitle className="text-sm font-semibold">{t("review.perOption")}</Subtitle>
        <dl className="flex flex-col gap-2">
          {options.map((option) => {
            const isCorrect = question.correct.includes(option.id);
            const wasSelected = selected.includes(option.id);
            const text = rationale.byOption[option.id];
            if (!text) return null;

            return (
              <div
                key={option.id}
                className={`rounded-[var(--radius-btn)] border-l-2 bg-surface px-3 py-2 ${optionBorder(
                  isCorrect,
                  wasSelected,
                )}`}
              >
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase text-fg-muted">
                  <span className="font-mono">{option.id}</span>
                  {wasSelected ? (
                    <span className="font-sans normal-case text-fg-muted">
                      — {t("review.yourAnswer")}
                    </span>
                  ) : null}
                </dt>
                <dd lang={lang} className="mt-1 max-w-[65ch] text-[15px] leading-relaxed text-fg">
                  {text}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1">
        <CitationChips
          objectives={question.objectives}
          syllabusRef={question.syllabusRef}
          kLevel={question.kLevel}
          syllabusVersion={question.syllabusVersion}
        />

        {/* F2-08 — the report link lives here rather than on the question card
            because this is the only place a candidate can see the keyed answer
            and its reasoning, which is what they need in order to know that
            something is actually wrong. */}
        <ReportQuestionLink question={question} lang={lang} selected={selected} />
      </div>
    </section>
  );
}

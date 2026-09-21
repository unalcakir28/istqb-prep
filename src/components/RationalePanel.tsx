import { useTranslation } from "react-i18next";

import { CitationChips } from "./CitationChips";
import type { Lang, Question } from "@/types/content";

/**
 * Rationale panel — this product's main differentiator (CLAUDE.md rule 2).
 *
 * "Wrong, because the correct answer is C" is not a rationale. Every wrong
 * option states WHAT it describes, so the candidate who picked it learns
 * which concept they confused it with. That's why the panel has two layers
 * — a summary plus a per-option rationale — and the per-option part is never
 * collapsed: that's where the real value is.
 */
export interface RationalePanelProps {
  question: Question;
  lang: Lang;
  selected: string[];
}

/** Left border color: green for the correct option, red for the candidate's wrong pick. */
function optionBorder(isCorrect: boolean, wasSelected: boolean): string {
  if (isCorrect) return "border-correct";
  if (wasSelected) return "border-incorrect";
  return "border-border";
}

export function RationalePanel({ question, lang, selected }: RationalePanelProps) {
  const { t } = useTranslation();
  const content = question.i18n[lang];
  if (!content) return null;

  const { rationale, options } = content;

  return (
    <section
      aria-label={t("review.whyTitle")}
      className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface-2 p-4 sm:p-5"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{t("review.summary")}</h2>
        <p lang={lang} className="max-w-[65ch] text-[15px] leading-relaxed text-fg">
          {rationale.summary}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">{t("review.perOption")}</h2>
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

      <CitationChips
        objectives={question.objectives}
        syllabusRef={question.syllabusRef}
        kLevel={question.kLevel}
        syllabusVersion={question.syllabusVersion}
        className="pt-1"
      />
    </section>
  );
}

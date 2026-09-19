import { useTranslation } from "react-i18next";

import { CitationChips } from "./CitationChips";
import type { Lang, Question } from "@/types/content";

/**
 * Gerekce paneli — urunun ana farklilastiricisi (CLAUDE.md kural 2).
 *
 * "Yanlis, cunku dogru cevap C'dir" gerekce degildir. Her yanlis sikkin
 * NEYI tanimladigi yazilir, boylece o sikki isaretleyen aday karistirdigi
 * kavrami ogrenir. Bu yuzden panel, ozet + SIK SIK gerekce olarak iki
 * katmanlidir ve sik sik kisim katlanmaz — asil deger orada.
 */
export interface RationalePanelProps {
  question: Question;
  lang: Lang;
  selected: string[];
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
                className={
                  isCorrect
                    ? "rounded-[var(--radius-btn)] border-l-2 border-correct bg-surface px-3 py-2"
                    : wasSelected
                      ? "rounded-[var(--radius-btn)] border-l-2 border-incorrect bg-surface px-3 py-2"
                      : "rounded-[var(--radius-btn)] border-l-2 border-border bg-surface px-3 py-2"
                }
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

import { useTranslation } from "react-i18next";

import { CitationChips } from "./CitationChips";
import { OptionList } from "./OptionList";
import type { Lang, Question } from "@/types/content";

/**
 * Soru karti — sinav ekraninin kahramani (docs/06 §1.1).
 *
 * Icerik dili arayuz dilinden bagimsizdir: aday arayuzu Turkce birakip
 * soruyu Ingilizce okuyabilir. Soru govdesi kendi `lang` ozniteligini tasir,
 * boylece ekran okuyucu dogru sesletir.
 *
 * Sinav sirasinda LO kodu GOSTERILMEZ — gercek sinavda da yoktur ve cevabi
 * ele verir. Atif cipleri yalnizca inceleme modunda gorunur.
 */
export interface QuestionCardProps {
  question: Question;
  lang: Lang;
  selected: string[];
  onSelect?: (optionId: string) => void;
  review?: boolean;
}

export function QuestionCard({
  question,
  lang,
  selected,
  onSelect,
  review = false,
}: QuestionCardProps) {
  const { t } = useTranslation();
  const content = question.i18n[lang];

  if (!content) {
    return (
      <p className="rounded-[var(--radius-card)] border border-border bg-surface-2 p-4 text-sm text-fg-muted">
        {t("common.errorTitle")}
      </p>
    );
  }

  const multi = question.selectCount > 1;

  return (
    <article className="flex flex-col gap-5">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {/* "HANGİ İKİSİ" sorularinda kac sik secilecegi acikca yazilir —
            adaylarin en cok gozden kacirdigi sey bu (docs/07 §5). */}
        <p
          className={
            multi
              ? "rounded-[var(--radius-badge)] border border-flag/40 bg-flag/10 px-2 py-0.5 text-xs font-semibold text-flag"
              : "text-xs text-fg-muted"
          }
        >
          {multi ? t("exam.selectTwo") : t("exam.selectOne")}
        </p>
      </header>

      <p lang={lang} className="prose-question whitespace-pre-line text-fg">
        {content.stem}
      </p>

      <OptionList
        questionId={question.id}
        options={content.options}
        selected={selected}
        selectCount={question.selectCount}
        lang={lang}
        onSelect={onSelect}
        review={review}
        correct={review ? question.correct : []}
      />

      {review ? (
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

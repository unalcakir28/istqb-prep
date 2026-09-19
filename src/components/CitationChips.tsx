import { useTranslation } from "react-i18next";

import type { KLevel } from "@/types/content";

/**
 * Musredat atif cipleri — bu urunun imza ogesi.
 *
 * Her gerekcenin altinda LO kodu, mufredat bolumu, bilissel seviye ve
 * mufredat surumu durur (docs/06 §1.3: "Her iddia kaynaklidir"). Rakiplerin
 * hicbiri sorularin hangi surume ait oldugunu bile yazmiyor; bu satir hem
 * dogruluk hem guven isareti oldugu icin kucuk gri metadata gibi degil,
 * okunakli ve ayirt edilebilir bicimde gosterilir.
 *
 * Etiketler `title` ve gorunmez metinle acilir — kisaltmalar tek basina
 * anlamli degil.
 */
export interface CitationChipsProps {
  objectives: string[];
  syllabusRef?: string;
  kLevel?: KLevel;
  syllabusVersion?: string;
  className?: string;
}

function Chip({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <span
      title={`${label}: ${value}`}
      className={
        emphasis
          ? "inline-flex items-center rounded-[var(--radius-badge)] border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[12px] font-medium text-accent"
          : "inline-flex items-center rounded-[var(--radius-badge)] border border-border bg-surface-2 px-2 py-0.5 font-mono text-[12px] text-fg-muted"
      }
    >
      <span className="sr-only">{label}: </span>
      {value}
    </span>
  );
}

export function CitationChips({
  objectives,
  syllabusRef,
  kLevel,
  syllabusVersion,
  className = "",
}: CitationChipsProps) {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {objectives.map((code) => (
        <Chip key={code} label={t("question.objective")} value={code} emphasis />
      ))}
      {syllabusRef ? <Chip label={t("question.syllabus")} value={syllabusRef} /> : null}
      {kLevel ? <Chip label={t("question.kLevel")} value={kLevel} /> : null}
      {syllabusVersion ? <Chip label={t("question.version")} value={`v${syllabusVersion}`} /> : null}
    </div>
  );
}

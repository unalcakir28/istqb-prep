import { useTranslation } from "react-i18next";

import type { KLevel } from "@/types/content";

/**
 * Syllabus citation chips — this product's signature element.
 *
 * Underneath every rationale sits the LO code, syllabus chapter, cognitive
 * level, and syllabus version (docs/06 §1.3: "Every claim is sourced").
 * None of the competitors even state which version a question belongs to;
 * because this line is both an accuracy and a trust signal, it's shown
 * legibly and distinctly rather than as small gray metadata.
 *
 * Labels are expanded via `title` and visually-hidden text — the
 * abbreviations aren't meaningful on their own.
 */
export interface CitationChipsProps {
  objectives: string[];
  syllabusRef?: string;
  kLevel?: KLevel;
  syllabusVersion?: string;
  className?: string;
}

const CHIP =
  "inline-flex items-center rounded-[var(--radius-badge)] border px-2 py-0.5 font-mono text-[12px]";
/** Emphasizes the LO code — the other chips are supporting information. */
const CHIP_EMPHASIS = "border-accent/40 bg-accent/10 font-medium text-accent";
const CHIP_PLAIN = "border-border bg-surface-2 text-fg-muted";

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
      className={`${CHIP} ${emphasis ? CHIP_EMPHASIS : CHIP_PLAIN}`}
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
      {syllabusVersion ? (
        <Chip label={t("question.version")} value={`v${syllabusVersion}`} />
      ) : null}
    </div>
  );
}

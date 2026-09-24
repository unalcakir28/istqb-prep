import { useTranslation } from "react-i18next";

import type { Lang, QuestionOption } from "@/types/content";

/**
 * Option list.
 *
 * - The whole row is the touch target (docs/06 §1.7 — one-handed use on
 *   mobile).
 * - Selection can be made with keys 1-9; the shortcut is shown on the row.
 * - Rows render in the order given, which is the attempt's shuffled order
 *   (D-03, `withOptionOrder`). The number on a row is its displayed position,
 *   never its option id.
 * - Single-select uses radio semantics, multi-select uses checkbox; a native
 *   input was chosen over Radix because the native behavior is already
 *   correct.
 * - Once revealed, correct/wrong is NEVER conveyed by color alone: an icon
 *   and text are always present too (WCAG 1.4.1).
 * - The options are a NAMED group (WCAG 1.3.1 / 3.3.2). Without it a screen
 *   reader entering the options reads four option texts and never the
 *   question: single-select gets "1 of 4" for free from the shared radio
 *   `name`, but multi-select gives each checkbox its own name — correct HTML,
 *   and no grouping at all. `labelledBy` carries the stem and the
 *   "select 2 options" instruction, so both are read on entry.
 */
export interface OptionListProps {
  questionId: string;
  options: QuestionOption[];
  selected: string[];
  selectCount: number;
  lang: Lang;
  onSelect?: (optionId: string) => void;
  /** Once revealed: selection is locked, the correct answer is marked. */
  revealed?: boolean;
  correct?: string[];
  /** Space-separated ids naming the group — the stem and the instruction. */
  labelledBy?: string;
  /**
   * F2-06 — the same options in the other language, matched by option id.
   *
   * They go INSIDE each row's own `<label>` rather than into a second column
   * of rows, because two parallel radio groups would be two answers to one
   * question: the candidate could tick a Turkish option and an English one and
   * mean a single choice. One group, two texts per choice.
   */
  secondary?: { lang: Lang; options: QuestionOption[] };
}

const ROW =
  "flex w-full items-start gap-3 rounded-[var(--radius-card)] border px-4 py-3 text-left transition-colors";

/**
 * Revealed state: the correct answer is always marked; the user's wrong
 * pick additionally turns red.
 */
function rowState(showAsCorrect: boolean, showAsWrong: boolean, isSelected: boolean): string {
  if (showAsCorrect) return "border-correct/60 bg-correct/10";
  if (showAsWrong) return "border-incorrect/60 bg-incorrect/10";
  if (isSelected) return "border-accent bg-accent/5";
  return "border-border bg-surface hover:bg-surface-2";
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4">
      <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4">
      <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
    </svg>
  );
}

export function OptionList({
  questionId,
  options,
  selected,
  selectCount,
  lang,
  onSelect,
  revealed = false,
  correct = [],
  labelledBy,
  secondary,
}: OptionListProps) {
  const { t } = useTranslation();
  const multi = selectCount > 1;
  const secondaryText = new Map(
    (secondary?.options ?? []).map((option) => [option.id, option.text]),
  );

  return (
    /* The group replaces the former `<ul>`: "list, 4 items" on top of
       "radio group, 1 of 4" is noise, and a list cannot carry the name. */
    <div
      role={multi ? "group" : "radiogroup"}
      aria-labelledby={labelledBy}
      className="flex flex-col gap-2"
    >
      {options.map((option, position) => {
        const isSelected = selected.includes(option.id);
        const isCorrect = correct.includes(option.id);
        const showAsCorrect = revealed && isCorrect;
        const showAsWrong = revealed && isSelected && !isCorrect;
        const state = rowState(showAsCorrect, showAsWrong, isSelected);

        return (
          <label key={option.id} className={`${ROW} ${state} ${revealed ? "" : "cursor-pointer"}`}>
            <input
              type={multi ? "checkbox" : "radio"}
              name={multi ? `${questionId}-${option.id}` : questionId}
              value={option.id}
              checked={isSelected}
              disabled={revealed}
              onChange={() => onSelect?.(option.id)}
              className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
            />

            <span
              aria-hidden="true"
              className="mt-0.5 hidden w-4 shrink-0 font-mono text-xs text-fg-muted sm:block"
            >
              {position + 1}
            </span>

            <span className="flex flex-1 flex-col gap-1">
              <span lang={lang} className="text-[16px] leading-relaxed">
                {option.text}
              </span>

              {secondary && secondaryText.has(option.id) ? (
                <span
                  lang={secondary.lang}
                  className="border-l-2 border-border pl-3 text-[15px] leading-relaxed text-fg-muted"
                >
                  {secondaryText.get(option.id)}
                </span>
              ) : null}
            </span>

            {showAsCorrect ? (
              <span className="mt-0.5 flex shrink-0 items-center gap-1 text-xs font-medium text-correct">
                <CheckIcon />
                {t("result.correct")}
              </span>
            ) : null}

            {showAsWrong ? (
              <span className="mt-0.5 flex shrink-0 items-center gap-1 text-xs font-medium text-incorrect">
                <CrossIcon />
                {t("result.incorrect")}
              </span>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}

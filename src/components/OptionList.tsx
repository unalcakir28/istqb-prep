import { useTranslation } from "react-i18next";

import type { Lang, QuestionOption } from "@/types/content";

/**
 * Option list.
 *
 * - The whole row is the touch target (docs/06 §1.7 — one-handed use on
 *   mobile).
 * - Selection can be made with keys 1-9; the shortcut is shown on the row.
 * - Single-select uses radio semantics, multi-select uses checkbox; a native
 *   input was chosen over Radix because the native behavior is already
 *   correct.
 * - In review mode, correct/wrong is NEVER conveyed by color alone: an icon
 *   and text are always present too (WCAG 1.4.1).
 */
export interface OptionListProps {
  questionId: string;
  options: QuestionOption[];
  selected: string[];
  selectCount: number;
  lang: Lang;
  onSelect?: (optionId: string) => void;
  /** Review mode: selection is locked, the correct answer is marked. */
  review?: boolean;
  correct?: string[];
}

const ROW =
  "flex w-full items-start gap-3 rounded-[var(--radius-card)] border px-4 py-3 text-left transition-colors";

/**
 * Review-mode state: the correct answer is always marked; the user's wrong
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
  review = false,
  correct = [],
}: OptionListProps) {
  const { t } = useTranslation();
  const multi = selectCount > 1;

  return (
    <ul className="flex flex-col gap-2">
      {options.map((option, position) => {
        const isSelected = selected.includes(option.id);
        const isCorrect = correct.includes(option.id);
        const showAsCorrect = review && isCorrect;
        const showAsWrong = review && isSelected && !isCorrect;
        const state = rowState(showAsCorrect, showAsWrong, isSelected);

        return (
          <li key={option.id}>
            <label className={`${ROW} ${state} ${review ? "" : "cursor-pointer"}`}>
              <input
                type={multi ? "checkbox" : "radio"}
                name={multi ? `${questionId}-${option.id}` : questionId}
                value={option.id}
                checked={isSelected}
                disabled={review}
                onChange={() => onSelect?.(option.id)}
                className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
              />

              <span
                aria-hidden="true"
                className="mt-0.5 hidden w-4 shrink-0 font-mono text-xs text-fg-muted sm:block"
              >
                {position + 1}
              </span>

              <span lang={lang} className="flex-1 text-[16px] leading-relaxed">
                {option.text}
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
          </li>
        );
      })}
    </ul>
  );
}

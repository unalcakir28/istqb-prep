/**
 * A single-select segmented control: exactly one of N options is chosen.
 *
 * Built on native `<input type="radio">` rather than on a row of `aria-pressed`
 * buttons, for the same reason `OptionList` uses native inputs — the native
 * behaviour is already correct and nothing here improves on it. `aria-pressed`
 * says "this button toggles independently": three of them where exactly one is
 * ever on announces as three unrelated toggles, gives no "1 of 3" position, and
 * leaves the arrow keys dead. A radio group announces the set, the position and
 * the choice, and arrow keys move between options for free.
 *
 * The input itself is invisible but NOT `display: none` — it still takes focus,
 * and the focus ring is drawn on the label through `peer-focus-visible`. It is
 * stretched over the whole chip rather than clipped to a corner by `sr-only`:
 * a clipped input sits UNDER the label's own text, so a pointer aimed at the
 * radio lands on the span instead. The label would forward that click, but a
 * caller that drives the radio directly — a test, a screen reader's click, an
 * automation tool — is left clicking an element something else covers.
 *
 * Three callers: the question-language toggle (TR · EN · TR+EN), the review
 * screen's copy of it, and the glossary's chapter filter. They were three
 * hand-rolled button rows before, which is how the same pattern problem
 * appeared three times.
 */

import type { ReactNode } from "react";

export interface Segment<T extends string> {
  value: T;
  /** What is shown. Keep it short — these are chips. */
  label: ReactNode;
  /**
   * The accessible name, when `label` is not one on its own. "TR" means
   * nothing spoken aloud; "Show in Turkish" does.
   */
  srLabel?: string;
}

export interface SegmentedControlProps<T extends string> {
  /** Names the group. Required — an unnamed radio group is read as a bare list of options. */
  label: string;
  /** Distinguishes this group's radios from any other on the page. */
  name: string;
  value: T;
  options: Segment<T>[];
  onChange: (value: T) => void;
  size?: "sm" | "md";
}

const SIZE = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3 py-1.5 text-xs",
} as const;

export function SegmentedControl<T extends string>({
  label,
  name,
  value,
  options,
  onChange,
  size = "sm",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex shrink-0 rounded-[var(--radius-btn)] border border-border p-0.5"
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <label key={option.value} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={active}
              onChange={() => onChange(option.value)}
              className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
            />

            <span
              className={`block rounded-[6px] font-medium peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${
                SIZE[size]
              } ${active ? "bg-accent font-semibold text-accent-fg" : "text-fg-muted hover:text-fg"}`}
            >
              {option.srLabel ? (
                <>
                  <span className="sr-only">{option.srLabel}</span>
                  <span aria-hidden="true">{option.label}</span>
                </>
              ) : (
                option.label
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}

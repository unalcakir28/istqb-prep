import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { DialogScrim } from "./DialogScrim";
import { useDialogFocus } from "@/lib/useDialogFocus";

/**
 * F1-09 — question navigator.
 *
 * Three states have to be readable at a glance: empty, answered, flagged.
 * Colour alone would fail WCAG 1.4.1, so each state also carries a distinct
 * shape: an empty question has a dashed outline and nothing inside it, an
 * answered one a solid outline plus a tick, a flagged one a pennant badge in
 * the corner. A question can be answered and flagged at the same time, which
 * is why the tick and the pennant are separate marks rather than one icon.
 *
 * Desktop keeps the grid pinned beside the question; below `lg` it opens as a
 * bottom sheet from the top bar, where the thumb can reach it.
 */
export interface QuestionNavigatorProps {
  total: number;
  currentIndex: number;
  answered: boolean[];
  flagged: boolean[];
  onJump: (index: number) => void;
  /** Called after a jump so the mobile sheet can close itself. */
  onAfterJump?: () => void;
}

function TickMark() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden="true"
      className="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-surface text-accent"
    >
      <path d="m2 6.4 2.6 2.6L10 3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PennantMark() {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="currentColor"
      aria-hidden="true"
      className="absolute -right-1 -top-1 size-3.5 text-flag"
    >
      <path d="M3 1v10h1.4V7.2h5.2L7.4 4.1 9.6 1H3Z" />
    </svg>
  );
}

function cellClasses(answered: boolean, flagged: boolean, current: boolean): string {
  const base =
    "relative grid h-9 w-full min-w-9 place-items-center rounded-[var(--radius-badge)] border text-xs font-medium tabular-nums transition-colors";
  const ring = current ? " ring-2 ring-accent ring-offset-1 ring-offset-bg" : "";

  if (flagged) return `${base}${ring} border-solid border-flag bg-flag/10 text-flag`;
  if (answered) return `${base}${ring} border-solid border-accent bg-accent/10 text-fg`;

  return `${base}${ring} border-dashed border-border bg-surface text-fg-muted hover:bg-surface-2`;
}

function LegendItem({
  answered,
  flagged,
  label,
}: {
  answered: boolean;
  flagged: boolean;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden="true" className="relative block w-9">
        <span className={cellClasses(answered, flagged, false)}>
          1{answered ? <TickMark /> : null}
          {flagged ? <PennantMark /> : null}
        </span>
      </span>
      <span className="text-xs text-fg-muted">{label}</span>
    </li>
  );
}

export function QuestionNavigator({
  total,
  currentIndex,
  answered,
  flagged,
  onJump,
  onAfterJump,
}: QuestionNavigatorProps) {
  const { t } = useTranslation();

  const state = (index: number) => {
    const marks = [answered[index] ? t("exam.answered") : t("exam.unanswered")];
    if (flagged[index]) marks.push(t("exam.flagged"));

    return marks.join(", ");
  };

  return (
    <nav aria-label={t("exam.navigator")} className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-1.5">
        {Array.from({ length: total }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => {
              onJump(index);
              onAfterJump?.();
            }}
            aria-current={index === currentIndex ? "true" : undefined}
            aria-label={`${t("exam.question", { current: index + 1, total })} — ${state(index)}`}
            className={cellClasses(!!answered[index], !!flagged[index], index === currentIndex)}
          >
            <span aria-hidden="true">{index + 1}</span>
            {answered[index] ? <TickMark /> : null}
            {flagged[index] ? <PennantMark /> : null}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        <LegendItem answered={false} flagged={false} label={t("exam.unanswered")} />
        <LegendItem answered flagged={false} label={t("exam.answered")} />
        <LegendItem answered={false} flagged label={t("exam.flagged")} />
      </ul>
    </nav>
  );
}

export interface QuestionNavigatorSheetProps extends QuestionNavigatorProps {
  open: boolean;
  onClose: () => void;
}

/** Bottom sheet wrapper for narrow screens: focus trap, Esc, focus restore. */
export function QuestionNavigatorSheet({ open, onClose, ...grid }: QuestionNavigatorSheetProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  useDialogFocus(open, panelRef, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <DialogScrim label={t("common.close")} onClose={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("exam.navigator")}
        className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[var(--radius-card)] border-t border-border bg-surface p-4 pb-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">{t("exam.navigator")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-btn)] border border-border px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-2 hover:text-fg"
          >
            {t("common.close")}
          </button>
        </div>

        <QuestionNavigator {...grid} />
      </div>
    </div>
  );
}

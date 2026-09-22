import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { DialogScrim } from "./DialogScrim";
import { useDialogFocus } from "@/lib/useDialogFocus";

/**
 * Keyboard shortcut help (docs/06 §5), opened with `?` and from the top bar.
 *
 * Every shortcut listed here also has a visible control on screen — the
 * overlay documents the fast path, it never owns the only path.
 */
export interface ShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
  /** The session has a clock on screen, so the "T" shortcut has something to hide. */
  hasTimer?: boolean;
}

export function ShortcutsOverlay({ open, onClose, hasTimer = false }: ShortcutsOverlayProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  // Only the close button is focusable, so the shared trap simply keeps Tab
  // on it.
  useDialogFocus(open, panelRef, onClose);

  if (!open) return null;

  // The "T" row is omitted where there is no clock — study and practice would
  // otherwise advertise a key that does nothing.
  const timerRows: Array<[string, string]> = hasTimer
    ? [["T", `${t("exam.hideTimer")} / ${t("exam.showTimer")}`]]
    : [];

  const rows: Array<[string, string]> = [
    ["1 – 9", t("exam.selectOne")],
    ["← / →", `${t("exam.previous")} / ${t("exam.next")}`],
    ["F", t("exam.flag")],
    ["L", t("question.contentLang")],
    ["N", t("exam.navigator")],
    ...timerRows,
    ["?", t("exam.shortcuts")],
    ["Esc", t("common.close")],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <DialogScrim label={t("common.close")} onClose={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-[var(--radius-card)] border border-border bg-surface p-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="shortcuts-title" className="text-base font-semibold">
            {t("exam.shortcuts")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-[var(--radius-btn)] border border-border px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-2 hover:text-fg"
          >
            {t("common.close")}
          </button>
        </div>

        <dl className="flex flex-col gap-2">
          {rows.map(([keys, label]) => (
            <div key={keys} className="flex items-baseline gap-3">
              <dt className="w-20 shrink-0">
                <kbd className="rounded-[var(--radius-badge)] border border-border bg-surface-2 px-2 py-0.5 font-mono text-[12px] text-fg-muted">
                  {keys}
                </kbd>
              </dt>
              <dd className="min-w-0 flex-1 text-sm text-fg">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

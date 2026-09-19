import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

/**
 * Keyboard shortcut help (docs/06 §5), opened with `?` and from the top bar.
 *
 * Every shortcut listed here also has a visible control on screen — the
 * overlay documents the fast path, it never owns the only path.
 */
export interface ShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      // Only the close button is focusable, so Tab simply stays put.
      event.preventDefault();
      panel?.querySelector<HTMLElement>("button")?.focus();
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      opener?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const rows: Array<[string, string]> = [
    ["1 – 9", t("exam.selectOne")],
    ["← / →", `${t("exam.previous")} / ${t("exam.next")}`],
    ["F", t("exam.flag")],
    ["L", t("question.contentLang")],
    ["N", t("exam.navigator")],
    ["T", `${t("exam.hideTimer")} / ${t("exam.showTimer")}`],
    ["?", t("exam.shortcuts")],
    ["Esc", t("common.close")],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label={t("common.close")}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-bg/80 backdrop-blur-sm"
      />

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

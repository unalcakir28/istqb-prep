/**
 * The keyboard contract of an open dialog (docs/06 §5).
 *
 * Three dialogs — the submit confirmation, the navigation drawer and the
 * shortcut help — each wired up the same four rules separately: focus
 * something useful on open, keep Tab inside the panel, close on Escape, and
 * return focus to the opener on close.
 *
 * The listener is attached in the capture phase: the session screen's global
 * shortcuts must not see Escape while a dialog is open.
 */

import { useEffect, useRef, type RefObject } from "react";

interface Options {
  /**
   * CSS selector, resolved inside the panel, for where focus should land.
   *
   * Defaults to the panel's first button, which is right for a confirmation
   * or a help overlay — but wrong for the navigator sheet, where the first
   * button is Close and the useful landing spot is the question the user is
   * on (F2-13). Falls back to the first button when the selector matches
   * nothing, so a stale selector degrades instead of trapping focus outside
   * the panel.
   */
  initialFocus?: string;
}

export function useDialogFocus(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  options: Options = {},
): void {
  const { initialFocus } = options;

  /**
   * Every call site passes an inline arrow, so `onClose` is a new function on
   * every render. In the dependency array it re-ran the whole effect — moving
   * focus back to the top of the panel and re-attaching the listener — on each
   * one. Reading it through a ref keeps the effect keyed on what actually
   * changes: whether the dialog is open.
   */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;

    const preferred = initialFocus ? panel?.querySelector<HTMLElement>(initialFocus) : undefined;
    (preferred ?? panel?.querySelector<HTMLElement>("button"))?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = panel?.querySelectorAll<HTMLElement>("button:not([disabled])");
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      opener?.focus();
    };
  }, [open, panelRef, initialFocus]);
}

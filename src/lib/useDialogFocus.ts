/**
 * The keyboard contract of an open dialog (docs/06 §5).
 *
 * Three dialogs — the submit confirmation, the navigation drawer and the
 * shortcut help — each wired up the same four rules separately: focus the
 * first button on open, keep Tab inside the panel, close on Escape, and
 * return focus to the opener on close.
 *
 * The listener is attached in the capture phase: the session screen's global
 * shortcuts must not see Escape while a dialog is open.
 */

import { useEffect, type RefObject } from "react";

export function useDialogFocus(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
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
  }, [open, panelRef, onClose]);
}

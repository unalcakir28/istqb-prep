/**
 * Acik bir diyalogun klavye sozlesmesi (docs/06 §7).
 *
 * Uc diyalog — gonderme onayi, gezinme cekmecesi, kisayol yardimi — ayni
 * dort kurali ayri ayri kurmustu: acilista ilk dugmeye odaklan, Tab'i panel
 * icinde tut, Escape ile kapan, kapanista odagi aciciya geri ver.
 *
 * Dinleyici yakalama (capture) asamasinda baglanir: oturum ekraninin genel
 * kisayollari diyalog aciken Escape'i gormemelidir.
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

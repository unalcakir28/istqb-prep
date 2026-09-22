/**
 * The document title for one screen.
 *
 * `document.title` used to have exactly two writers — the session shell and
 * the study result — so `/sonuc` and `/inceleme` inherited whatever the
 * session had left behind ("Question 10 of 10 · ISTQB-PREP") and announced
 * nothing of their own on arrival. One hook, so the screens that set it cannot
 * drift apart on the suffix or on the separator.
 *
 * `what` is already translated by the caller. `null` leaves the title alone —
 * what a screen needs while its subject is still loading, rather than writing
 * a placeholder and then correcting it.
 */

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function useDocumentTitle(what: string | null): void {
  const { t } = useTranslation();

  useEffect(() => {
    if (what === null) return;
    document.title = `${what} · ${t("app.name")}`;
  }, [what, t]);
}

/**
 * F3-12 — the one warning that sits on every screen: this browser is saving
 * nothing. Shown only when IndexedDB does not open, because then every
 * session, answer and repetition card is lost the moment the tab closes, and
 * nothing else on the page would say so until a session tried to save.
 *
 * A browser that saves but has not promised to keep the data is not warned
 * here; that is a choice the candidate can act on, and `/verilerim` offers it.
 */

import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useStorageStatus } from "@/lib/useStorageStatus";

export function StorageWarning() {
  const { t } = useTranslation();
  const status = useStorageStatus();
  const { pathname } = useLocation();

  if (status !== "unavailable") return null;

  return (
    <div className="border-b border-flag/40 bg-flag/10">
      <p role="alert" className="mx-auto max-w-5xl px-4 py-2.5 text-sm text-fg">
        {t("storage.unavailable")}
        {/* Not on the page it leads to. */}
        {pathname === "/verilerim" ? null : (
          <>
            {" "}
            <Link to="/verilerim" className="underline underline-offset-2">
              {t("storage.unavailableLink")}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

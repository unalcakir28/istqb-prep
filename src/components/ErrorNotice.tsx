import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useOnline } from "@/lib/useOnline";

/**
 * Notice shown in place of a screen that couldn't render because its content
 * failed to load.
 *
 * The setup, result, and review screens had each copied this with the exact
 * same markup. A retry button is shown where retrying makes sense (the home
 * screen); the others show a link back to the home screen instead.
 *
 * F3-13: offline, the failure is almost always a screen whose content was
 * never loaded on this device while online — the service worker keeps the
 * app, and the content cache keeps only what was read (F3-07). Saying
 * "something went wrong" there blames the app for the network; the notice
 * says what is missing and when it will open instead. It follows the
 * browser's online state, so it changes back the moment the network does.
 */
export interface ErrorNoticeProps {
  onRetry?: () => void;
}

const ACTION =
  "w-fit rounded-[var(--radius-btn)] border border-border px-4 py-2 font-medium hover:bg-surface-2";

export function ErrorNotice({ onRetry }: ErrorNoticeProps) {
  const { t } = useTranslation();
  const online = useOnline();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">
        {online ? t("common.errorTitle") : t("common.offlineTitle")}
      </h1>
      {online ? null : (
        <p className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">
          {t("common.offlineBody")}
        </p>
      )}

      {onRetry ? (
        <button type="button" onClick={onRetry} className={ACTION}>
          {t("common.retry")}
        </button>
      ) : (
        <Link to="/" className={ACTION}>
          {t("result.backHome")}
        </Link>
      )}
    </div>
  );
}

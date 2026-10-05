import { useEffect, useRef } from "react";
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
 * F3-13: offline, a screen that loads content and offers a retry (`onRetry`)
 * has almost certainly failed because its content was never opened on this
 * device while online — the service worker keeps the app, and the content
 * cache keeps only what was read (F3-07). Saying "something went wrong" there
 * blames the app for the network. The notice says what is missing instead,
 * and keeps its promise: when the browser reports the network back, it
 * retries on its own. A screen without `onRetry` (a session, a result) can
 * fail for reasons the network does not explain — an attempt that does not
 * exist, storage that does not open — so it keeps the generic wording.
 *
 * The heading and its text sit in a polite live region, present from the
 * first render, so going offline or back online is heard, not only seen.
 */
export interface ErrorNoticeProps {
  onRetry?: () => void;
}

const ACTION =
  "w-fit rounded-[var(--radius-btn)] border border-border px-4 py-2 font-medium hover:bg-surface-2";

export function ErrorNotice({ onRetry }: ErrorNoticeProps) {
  const { t } = useTranslation();
  const online = useOnline();
  const offline = !online && Boolean(onRetry);
  const wasOfflineRef = useRef(offline);

  // Back online after being offline here: the content can load now.
  useEffect(() => {
    const wasOffline = wasOfflineRef.current;
    wasOfflineRef.current = offline;
    if (!wasOffline || !online) return;

    onRetry?.();
  }, [offline, online, onRetry]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-16">
      <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">
          {offline ? t("common.offlineTitle") : t("common.errorTitle")}
        </h1>
        {offline ? (
          <p className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">
            {t("common.offlineBody")}
          </p>
        ) : null}
      </div>

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

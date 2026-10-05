/**
 * F3-12 — `/verilerim`'s account of whether this browser keeps the progress,
 * and the one thing the candidate can do about it: ask the browser to keep
 * it (`navigator.storage.persist()`).
 *
 * The request is a button and never runs unasked, because Firefox answers it
 * with a permission prompt. A refusal is not an error: browsers decide from
 * their own signals, and the advice is the same either way — keep a
 * downloaded copy.
 */

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { requestPersistence, type StorageStatus } from "@/lib/storage";
import { useStorageStatus } from "@/lib/useStorageStatus";

const BODY: Record<StorageStatus, string> = {
  unavailable: "myData.storageUnavailable",
  persistent: "myData.storagePersistent",
  "best-effort": "myData.storageBestEffort",
  unknown: "myData.storageUnknown",
};

const BUTTON =
  "w-fit rounded-[var(--radius-btn)] border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50";

export function StorageSection() {
  const { t } = useTranslation();
  const read = useStorageStatus();
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<"granted" | "refused" | null>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const status = answer === "granted" ? "persistent" : read;

  // A grant removes the button that was just pressed. Focus goes to the body,
  // which now says the data is kept; the status line announces the answer on
  // its own, and focusing it as well would have it read twice.
  useEffect(() => {
    if (answer === "granted") bodyRef.current?.focus();
  }, [answer]);

  if (status === null) return null;

  async function onAsk() {
    if (asking) return;

    setAsking(true);
    setAnswer(null);
    const granted = await requestPersistence();
    setAsking(false);
    setAnswer(granted ? "granted" : "refused");
  }

  return (
    <section aria-labelledby="storage-title" className="flex flex-col gap-3">
      <h2 id="storage-title" className="text-base font-semibold">
        {t("myData.storageTitle")}
      </h2>
      <p
        ref={bodyRef}
        tabIndex={-1}
        className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted"
      >
        {t(BODY[status])}
      </p>

      {status === "best-effort" ? (
        <button
          type="button"
          onClick={() => void onAsk()}
          aria-disabled={asking}
          className={BUTTON}
        >
          {t("myData.storageAsk")}
        </button>
      ) : null}

      {/* Always in the tree, so the browser's answer is announced. */}
      <p role="status" className="text-sm text-fg-muted">
        {answer === "granted" ? t("myData.storageGranted") : null}
        {answer === "refused" ? t("myData.storageRefused") : null}
      </p>
    </section>
  );
}

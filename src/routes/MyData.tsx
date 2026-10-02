/**
 * F3-08 — Your data (`/verilerim`): download and load a copy of the progress.
 *
 * The one mitigation for the cost of having no server (docs/10 R-08): a
 * browser that clears its storage takes every session, answer, mastered
 * objective and repetition card with it. A file the candidate keeps is the
 * only copy that survives that, and the only way to move to another device.
 *
 * Loading is two steps on purpose — choose, read what the file holds, then
 * confirm — because it writes into this browser's progress. It merges and
 * never deletes (`src/lib/db/backup.ts`), and says so before the button.
 * A file saved under a different question version is a warning, not a
 * refusal: answers are keyed by question and option id, which a content
 * update keeps.
 */

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Spinner } from "@/components/Spinner";
import { contentClient } from "@/lib/content/contentClient";
import {
  downloadBackup,
  exportProgress,
  importProgress,
  parseBackup,
  TABLE_NAMES,
  type BackupError,
  type ProgressBackup,
} from "@/lib/db/backup";
import { db } from "@/lib/db/db";
import { useArrivalFocus } from "@/lib/useArrivalFocus";
import { useAsyncData } from "@/lib/useAsyncData";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const ERROR_KEY: Record<BackupError, string> = {
  "not-json": "myData.errorNotJson",
  "not-a-backup": "myData.errorNotBackup",
  "newer-format": "myData.errorNewerFormat",
  "newer-schema": "myData.errorNewerSchema",
  "invalid-rows": "myData.errorInvalidRows",
};

const BUTTON =
  "w-fit rounded-[var(--radius-btn)] border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50";
const PRIMARY =
  "w-fit rounded-[var(--radius-btn)] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg aria-disabled:cursor-not-allowed aria-disabled:opacity-50";
const ALERT =
  "max-w-[65ch] rounded-[var(--radius-card)] border border-flag/40 bg-flag/10 px-4 py-2.5 text-sm text-fg";

/** The content version this site serves now — what a file's own is compared against. */
async function loadDataVersion(): Promise<string> {
  const manifest = await contentClient.getManifest();
  return manifest.dataVersion;
}

/** What the import area is showing: nothing yet, a refusal, or a file waiting for confirmation. */
type Pending =
  | { kind: "none" }
  | { kind: "error"; error: BackupError }
  | { kind: "ready"; backup: ProgressBackup };

export default function MyData() {
  const { t, i18n } = useTranslation();
  // The version is only needed for the warning; the page works without it.
  const { data: dataVersion, failed } = useAsyncData(loadDataVersion);
  const ready = dataVersion !== null || failed;

  const [busy, setBusy] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ ok: boolean; file?: string } | null>(null);
  const [pending, setPending] = useState<Pending>({ kind: "none" });
  const [importStatus, setImportStatus] = useState<
    { ok: true; added: number; updated: number; kept: number } | { ok: false } | null
  >(null);
  // Bumped to remount the file input: clearing its value is the only way to
  // let the same file be chosen again after a cancel.
  const [inputKey, setInputKey] = useState(0);
  /**
   * Bumped by every export, file choice and import, and used as the key of
   * the message it produces: an alert or a status line only speaks when its
   * text changes, so a second identical failure would otherwise be silent.
   */
  const [round, setRound] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLParagraphElement>(null);
  const importStatusRef = useRef<HTMLParagraphElement>(null);
  /**
   * Where focus goes once the next render lands. Every step here unmounts the
   * control that was just used — the preview's buttons, the remounted file
   * input — and focus would otherwise fall to <body>.
   */
  const focusNextRef = useRef<"preview" | "input" | "status" | null>(null);

  useEffect(() => {
    const target = focusNextRef.current;
    if (target === null) return;

    focusNextRef.current = null;
    if (target === "preview") previewRef.current?.focus();
    if (target === "input") inputRef.current?.focus();
    if (target === "status") importStatusRef.current?.focus();
  }, [pending, importStatus, inputKey]);

  useDocumentTitle(t("myData.title"));
  const headingRef = useArrivalFocus<HTMLHeadingElement>(ready);

  if (!ready) return <Spinner />;

  async function onExport() {
    if (busy) return;

    setBusy(true);
    setExportStatus(null);
    setRound((value) => value + 1);
    try {
      const backup = await exportProgress(dataVersion);
      setExportStatus({ ok: true, file: downloadBackup(backup) });
    } catch {
      setExportStatus({ ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function onChoose(event: ChangeEvent<HTMLInputElement>) {
    setImportStatus(null);
    setRound((value) => value + 1);
    const file = event.target.files?.[0];
    if (!file) {
      setPending({ kind: "none" });
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      // Removed or unreadable since it was chosen: the same answer as a file
      // that is not JSON, rather than a preview of the previous one.
      setPending({ kind: "error", error: "not-json" });
      return;
    }

    const result = parseBackup(text, db.verno);
    if (!result.ok) {
      setPending({ kind: "error", error: result.error });
      return;
    }

    // Focus moves to what the file holds: the confirm step is the point of
    // reading it first, and it sits after the input in the tab order.
    focusNextRef.current = "preview";
    setPending({ kind: "ready", backup: result.backup });
  }

  function onCancel() {
    focusNextRef.current = "input";
    setPending({ kind: "none" });
    setInputKey((key) => key + 1);
  }

  async function onImport() {
    if (busy) return;
    if (pending.kind !== "ready") return;

    setBusy(true);
    setImportStatus(null);
    setRound((value) => value + 1);
    try {
      const counts = await importProgress(pending.backup);
      const total = { added: 0, updated: 0, kept: 0 };
      for (const name of TABLE_NAMES) {
        total.added += counts[name].added;
        total.updated += counts[name].updated;
        total.kept += counts[name].kept;
      }
      focusNextRef.current = "status";
      setImportStatus({ ok: true, ...total });
      setPending({ kind: "none" });
      setInputKey((key) => key + 1);
    } catch {
      setImportStatus({ ok: false });
    } finally {
      setBusy(false);
    }
  }

  const backup = pending.kind === "ready" ? pending.backup : null;
  const versionDiffers =
    backup !== null &&
    backup.dataVersion !== null &&
    dataVersion !== null &&
    backup.dataVersion !== dataVersion;
  const savedOn =
    backup && backup.exportedAt && !Number.isNaN(Date.parse(backup.exportedAt))
      ? new Intl.DateTimeFormat(i18n.language, { dateStyle: "long", timeStyle: "short" }).format(
          new Date(backup.exportedAt),
        )
      : "—";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-semibold leading-tight">
          {t("myData.title")}
        </h1>
        <p className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">
          {t("myData.intro")}
        </p>
      </div>

      <section aria-labelledby="export-title" className="flex flex-col gap-3">
        <h2 id="export-title" className="text-base font-semibold">
          {t("myData.exportTitle")}
        </h2>
        <p className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">
          {t("myData.exportBody")}
        </p>
        <button
          type="button"
          onClick={() => void onExport()}
          aria-disabled={busy}
          className={PRIMARY}
        >
          {t("myData.exportAction")}
        </button>

        {/* Always in the tree, so the result is announced when it is written. */}
        <p role="status" className="text-sm text-fg-muted">
          {exportStatus?.ok ? t("myData.exported", { file: exportStatus.file }) : null}
        </p>
        {exportStatus && !exportStatus.ok ? (
          <p key={round} role="alert" className={ALERT}>
            {t("myData.exportFailed")}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="import-title" className="flex flex-col gap-3">
        <h2 id="import-title" className="text-base font-semibold">
          {t("myData.importTitle")}
        </h2>
        <p id="import-body" className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">
          {t("myData.importBody")}
        </p>

        <label className="flex w-fit flex-col gap-1.5 text-sm font-medium">
          {t("myData.chooseFile")}
          <input
            key={inputKey}
            ref={inputRef}
            type="file"
            aria-describedby="import-body"
            accept="application/json,.json"
            onChange={(event) => void onChoose(event)}
            className="text-sm font-normal text-fg-muted file:mr-3 file:rounded-[var(--radius-btn)] file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-fg"
          />
        </label>

        {pending.kind === "error" ? (
          <p key={round} role="alert" className={ALERT}>
            {t(ERROR_KEY[pending.error])}
          </p>
        ) : null}

        {backup ? (
          <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
            {/* Focused once a file is read; the version warning is part of
                its description, so it is heard in the same breath. */}
            <p
              ref={previewRef}
              tabIndex={-1}
              aria-describedby={versionDiffers ? "import-warning" : undefined}
              className="text-[15px] leading-relaxed"
            >
              {t("myData.preview", {
                date: savedOn,
                sessions: backup.tables.attempts.length,
                answers: backup.tables.responses.length,
                objectives: backup.tables.objectiveProgress.length,
                cards: backup.tables.srsCards.length,
              })}
            </p>

            {versionDiffers ? (
              <p id="import-warning" className={ALERT}>
                {t("myData.versionWarning")}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onImport()}
                aria-disabled={busy}
                className={PRIMARY}
              >
                {t("myData.importAction")}
              </button>
              <button type="button" onClick={onCancel} className={BUTTON}>
                {t("common.cancel")}
              </button>
            </div>
          </div>
        ) : null}

        {/* Focused after a successful import, which unmounts the button that
            started it. */}
        <p ref={importStatusRef} tabIndex={-1} role="status" className="text-sm text-fg-muted">
          {importStatus?.ok ? t("myData.imported", importStatus) : null}
        </p>
        {importStatus && !importStatus.ok ? (
          <p key={round} role="alert" className={ALERT}>
            {t("myData.importFailed")}
          </p>
        ) : null}
      </section>

      <Link to="/" className={BUTTON}>
        {t("result.backHome")}
      </Link>
    </div>
  );
}

import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { DialogScrim } from "@/components/DialogScrim";
import { useDialogFocus } from "@/lib/useDialogFocus";

/**
 * Confirmation before an irreversible finish (docs/06 §3.3).
 *
 * Shared by every mode that can end a session by hand. Submitting writes
 * `status: "submitted"`, after which `SessionRunner` bounces the route to the
 * result screen and there is no way back in — so the click has to be
 * confirmed, whether the session was timed or not.
 *
 * The copy is passed in rather than read from a namespace here: an exam and a
 * practice session end differently and must say so. Only the cancel label is
 * owned by the component, because standing down is the same act in every mode.
 *
 * A mode screen renders this outside `SessionRunner`, so it must also pass
 * `modalOpen` to the runner while it is open — otherwise the shared shortcuts
 * stay live and the user can change answers from behind the dialog.
 */
export interface SubmitConfirmProps {
  open: boolean;
  /** Dialog heading, e.g. "Finish the exam?". */
  title: string;
  /** Body text; the caller decides what the unanswered remainder costs. */
  body: string;
  /** Label of the confirming button, e.g. "Yes, finish". */
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SubmitConfirm({
  open,
  title,
  body,
  confirmLabel,
  onCancel,
  onConfirm,
}: SubmitConfirmProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  useDialogFocus(open, panelRef, onCancel);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <DialogScrim label={t("common.cancel")} onClose={onCancel} />

      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="submit-confirm-title"
        aria-describedby="submit-confirm-body"
        className="relative w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-surface p-5"
      >
        <h2 id="submit-confirm-title" className="text-base font-semibold">
          {title}
        </h2>

        <p id="submit-confirm-body" className="mt-2 text-sm text-fg-muted">
          {body}
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-[var(--radius-btn)] border border-border px-4 text-sm font-medium hover:bg-surface-2"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-11 rounded-[var(--radius-btn)] bg-accent px-4 text-sm font-semibold text-accent-fg"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

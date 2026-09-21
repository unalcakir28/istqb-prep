import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ContentLangToggle } from "@/components/ContentLangToggle";
import { DialogScrim } from "@/components/DialogScrim";
import { ExamTimer } from "@/components/ExamTimer";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionNavigator, QuestionNavigatorSheet } from "@/components/QuestionNavigator";
import { ShortcutsOverlay } from "@/components/ShortcutsOverlay";
import { Spinner } from "@/components/Spinner";
import { useExamStore } from "@/features/exam/examStore";
import { useDialogFocus } from "@/lib/useDialogFocus";

/**
 * F1-07 / F1-10 — the exam session screen.
 *
 * The site header and footer are hidden on this route (see `Layout`), because
 * during the exam nothing but the question, the options, the clock and the
 * navigator may be on screen (docs/06 §1.1). That makes this screen
 * responsible for its own minimal top bar.
 *
 * Refresh recovery: the route is the single source of truth for which attempt
 * is open. If the store is empty — a reload, a crash, a link opened in a new
 * tab — the attempt and every answer are read back from IndexedDB before
 * anything renders. Nothing about the session lives only in memory.
 */

/** Typing in a real text field must never be swallowed by a shortcut. */
function isTextEntry(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  if (element.isContentEditable) return true;

  const tag = element.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag !== "INPUT") return false;

  // Radios and checkboxes are the options themselves — shortcuts stay live
  // there, otherwise a keyboard user would lose them after the first answer.
  const type = (element as HTMLInputElement).type;
  return type !== "radio" && type !== "checkbox" && type !== "button";
}

function FlagIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className="size-4"
    >
      <path d="M5 21V4h13l-3 4.5L18 13H5" strokeLinejoin="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className="size-4"
    >
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

/* Display is set per call site so that `hidden sm:flex` cannot fight a base
   `flex`, and the flagged state swaps the whole colour set rather than
   layering a second, conflicting one. */
const TOP_BAR_BUTTON =
  "h-9 items-center gap-1.5 rounded-[var(--radius-btn)] border px-2.5 text-xs font-medium transition-colors sm:px-3";
const TOP_BAR_IDLE = "border-border text-fg-muted hover:bg-surface-2 hover:text-fg";
const TOP_BAR_ACTIVE = "border-flag text-flag hover:bg-flag/10";

const BANNER =
  "rounded-[var(--radius-card)] border border-flag/40 bg-flag/10 px-4 py-2.5 text-sm text-fg";

const NAV_BUTTON =
  "flex min-h-11 items-center gap-2 rounded-[var(--radius-btn)] border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40";

/** Submit confirmation — destructive enough to deserve a stop (docs/06 §3.3). */
function SubmitConfirm({
  open,
  unanswered,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  unanswered: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  useDialogFocus(open, panelRef, onCancel);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <DialogScrim label={t("exam.cancel")} onClose={onCancel} />

      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="submit-confirm-title"
        aria-describedby="submit-confirm-body"
        className="relative w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-surface p-5"
      >
        <h2 id="submit-confirm-title" className="text-base font-semibold">
          {t("exam.submitConfirmTitle")}
        </h2>

        <p id="submit-confirm-body" className="mt-2 text-sm text-fg-muted">
          {unanswered > 0
            ? t("exam.submitConfirmBody", { unanswered })
            : t("exam.submitConfirmBodyAll")}
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 rounded-[var(--radius-btn)] border border-border px-4 text-sm font-medium hover:bg-surface-2"
          >
            {t("exam.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-11 rounded-[var(--radius-btn)] bg-accent px-4 text-sm font-semibold text-accent-fg"
          >
            {t("exam.confirmSubmit")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExamSession() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const attempt = useExamStore((state) => state.attempt);
  const questions = useExamStore((state) => state.questions);
  const answers = useExamStore((state) => state.answers);
  const flagged = useExamStore((state) => state.flagged);
  const currentIndex = useExamStore((state) => state.currentIndex);
  const contentLang = useExamStore((state) => state.contentLang);
  const loading = useExamStore((state) => state.loading);
  const error = useExamStore((state) => state.error);
  const meta = useExamStore((state) => state.meta);
  const persistFailed = useExamStore((state) => state.persistFailed);

  const resumeAttempt = useExamStore((state) => state.resumeAttempt);
  const select = useExamStore((state) => state.select);
  const toggleFlag = useExamStore((state) => state.toggleFlag);
  const goTo = useExamStore((state) => state.goTo);
  const next = useExamStore((state) => state.next);
  const previous = useExamStore((state) => state.previous);
  const setContentLang = useExamStore((state) => state.setContentLang);
  const submit = useExamStore((state) => state.submit);

  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [timerHidden, setTimerHidden] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  const requestedRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const sidePanelRef = useRef<HTMLElement>(null);

  const ready = !!attempt && attempt.id === attemptId && questions.length > 0;
  const question = questions[currentIndex];
  const total = questions.length;
  const dialogOpen = navigatorOpen || shortcutsOpen || confirmOpen;

  // F1-10 — rehydrate from IndexedDB when the store is cold (reload, new tab).
  useEffect(() => {
    if (!attemptId) return;
    if (attempt?.id === attemptId) return;
    if (requestedRef.current === attemptId) return;

    requestedRef.current = attemptId;
    void resumeAttempt(attemptId);
  }, [attemptId, attempt?.id, resumeAttempt]);

  // An attempt that is already finished has no session screen.
  useEffect(() => {
    if (!attempt || attempt.id !== attemptId) return;
    if (attempt.status === "in-progress") return;

    navigate(`/sonuc/${attemptId}`, { replace: true });
  }, [attempt, attemptId, navigate]);

  useEffect(() => {
    if (!ready) return;
    document.title = `${t("exam.question", { current: currentIndex + 1, total })} · ${t("app.name")}`;
  }, [ready, currentIndex, total, t]);

  const finish = useCallback(
    async (auto: boolean) => {
      // The clock and the button can race; only one submission may land.
      if (submittingRef.current) return;
      submittingRef.current = true;

      setConfirmOpen(false);
      if (auto) setAutoSubmitting(true);

      try {
        await submit(auto);
      } catch {
        // Scoring or the IndexedDB write failed: unlock so the candidate can
        // try again instead of being trapped on a dead screen.
        submittingRef.current = false;
        setAutoSubmitting(false);
        return;
      }

      navigate(`/sonuc/${attemptId}`, { replace: true });
    },
    [attemptId, navigate, submit],
  );

  const handleExpire = useCallback(() => {
    void finish(true);
  }, [finish]);

  // F1-13 — exam shortcuts. Every one of them also has a visible control.
  useEffect(() => {
    if (!ready) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTextEntry(event.target)) return;
      // Open dialogs own the keyboard: they handle Escape and trap Tab.
      if (dialogOpen) return;

      const current = questions[useExamStore.getState().currentIndex];
      if (!current) return;

      if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "f") {
        event.preventDefault();
        toggleFlag(current.id);
        return;
      }

      if (key === "l") {
        event.preventDefault();
        setContentLang(useExamStore.getState().contentLang === "tr" ? "en" : "tr");
        return;
      }

      if (key === "n") {
        event.preventDefault();

        // On desktop the navigator is already on screen, so `n` moves focus
        // into it. Opening the sheet there would mount a focus trap inside a
        // panel that CSS has hidden.
        const sidePanel = sidePanelRef.current;
        if (sidePanel && sidePanel.offsetParent !== null) {
          sidePanel.querySelector<HTMLElement>("button")?.focus();
          return;
        }

        setNavigatorOpen(true);
        return;
      }

      if (key === "t") {
        event.preventDefault();
        setTimerHidden((hidden) => !hidden);
        return;
      }

      if (!/^[1-9]$/.test(event.key)) return;

      const options = current.i18n[useExamStore.getState().contentLang]?.options ?? [];
      const option = options[Number(event.key) - 1];
      if (!option) return;

      event.preventDefault();
      select(current.id, option.id);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ready, dialogOpen, questions, previous, next, toggleFlag, setContentLang, select]);

  if (!attemptId || error) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-start gap-4 px-4 py-16">
        <h1 className="text-xl font-semibold">{t("common.errorTitle")}</h1>
        <p className="text-sm text-fg-muted">
          {!error || error === "not-found" ? t("common.notFoundBody") : error}
        </p>
        <div className="flex flex-wrap gap-2">
          {attemptId ? (
            <button
              type="button"
              onClick={() => void resumeAttempt(attemptId)}
              className="min-h-11 rounded-[var(--radius-btn)] border border-border px-4 text-sm font-medium hover:bg-surface-2"
            >
              {t("common.retry")}
            </button>
          ) : null}
          <Link
            to="/"
            className="flex min-h-11 items-center rounded-[var(--radius-btn)] bg-accent px-4 text-sm font-semibold text-accent-fg"
          >
            {t("result.backHome")}
          </Link>
        </div>
      </section>
    );
  }

  if (loading || !ready || !question) return <Spinner full />;

  const answeredFlags = questions.map((item) => (answers[item.id]?.length ?? 0) > 0);
  const flaggedFlags = questions.map((item) => !!flagged[item.id]);
  const unanswered = answeredFlags.filter((value) => !value).length;
  const isFlagged = !!flagged[question.id];
  const flagLabel = isFlagged ? t("exam.unflag") : t("exam.flag");

  // Rule 8: an exam is never silently short. This is derived from the ATTEMPT
  // ITSELF (not from transient store state), so it still shows after a reload
  // and after returning to an unfinished exam.
  const expected = meta?.exam.questionCount ?? 0;
  const isShortExam = expected > 0 && total < expected;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-4">
          <ExamTimer
            deadlineAt={attempt.deadlineAt}
            hidden={timerHidden}
            onToggleHidden={() => setTimerHidden((hidden) => !hidden)}
            onExpire={handleExpire}
          />

          <h1 className="text-sm font-medium tabular-nums">
            {t("exam.question", { current: currentIndex + 1, total })}
          </h1>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <ContentLangToggle value={contentLang} onChange={setContentLang} />

            <button
              type="button"
              onClick={() => toggleFlag(question.id)}
              aria-pressed={isFlagged}
              aria-label={flagLabel}
              title={flagLabel}
              className={`flex ${TOP_BAR_BUTTON} ${isFlagged ? TOP_BAR_ACTIVE : TOP_BAR_IDLE}`}
            >
              <FlagIcon filled={isFlagged} />
              <span className="hidden sm:inline">{flagLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setNavigatorOpen(true)}
              aria-label={t("exam.navigator")}
              title={t("exam.navigator")}
              className={`flex ${TOP_BAR_BUTTON} ${TOP_BAR_IDLE} lg:hidden`}
            >
              <GridIcon />
            </button>

            <button
              type="button"
              onClick={() => setShortcutsOpen(true)}
              aria-label={t("exam.shortcuts")}
              title={t("exam.shortcuts")}
              className={`hidden ${TOP_BAR_BUTTON} ${TOP_BAR_IDLE} sm:flex`}
            >
              <span aria-hidden="true" className="font-mono">
                ?
              </span>
            </button>
          </div>
        </div>
      </header>

      {isShortExam || persistFailed ? (
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 pt-3 sm:px-4">
          {isShortExam ? (
            <p role="status" className={BANNER}>
              {t("exam.shortExam", { count: total, expected })}
            </p>
          ) : null}
          {persistFailed ? (
            <p role="alert" className={BANNER}>
              {t("exam.persistFailed")}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 sm:py-8">
        <section className="min-w-0 flex-1">
          <QuestionCard
            question={question}
            lang={contentLang}
            selected={answers[question.id] ?? []}
            onSelect={(optionId) => select(question.id, optionId)}
          />

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={previous}
              disabled={currentIndex === 0}
              className={NAV_BUTTON}
            >
              <span aria-hidden="true">←</span>
              {t("exam.previous")}
            </button>

            <button
              type="button"
              onClick={next}
              disabled={currentIndex === total - 1}
              className={NAV_BUTTON}
            >
              {t("exam.next")}
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={autoSubmitting}
              className="min-h-11 w-full rounded-[var(--radius-btn)] bg-accent px-5 text-sm font-semibold text-accent-fg disabled:opacity-60 sm:w-auto"
            >
              {t("exam.submit")}
            </button>

            <p aria-live="polite" className="mt-2 text-xs text-fg-muted">
              {autoSubmitting ? t("exam.autoSubmitting") : ""}
            </p>
          </div>
        </section>

        <aside ref={sidePanelRef} className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold">{t("exam.navigator")}</h2>
            <QuestionNavigator
              total={total}
              currentIndex={currentIndex}
              answered={answeredFlags}
              flagged={flaggedFlags}
              onJump={goTo}
            />
          </div>
        </aside>
      </div>

      <QuestionNavigatorSheet
        open={navigatorOpen}
        onClose={() => setNavigatorOpen(false)}
        total={total}
        currentIndex={currentIndex}
        answered={answeredFlags}
        flagged={flaggedFlags}
        onJump={goTo}
        onAfterJump={() => setNavigatorOpen(false)}
      />

      <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <SubmitConfirm
        open={confirmOpen}
        unanswered={unanswered}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void finish(false)}
      />
    </div>
  );
}

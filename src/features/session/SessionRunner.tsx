import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ContentLangToggle } from "@/components/ContentLangToggle";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionNavigator, QuestionNavigatorSheet } from "@/components/QuestionNavigator";
import { RationalePanel } from "@/components/RationalePanel";
import { ShortcutsOverlay } from "@/components/ShortcutsOverlay";
import { Spinner } from "@/components/Spinner";
import { otherLang, readSideBySide, writeSideBySide } from "@/lib/bilingual";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { redirectPathFor } from "./routeForAttempt";
import { useSessionStore } from "./sessionStore";

/**
 * Shared session shell for all three modes (study / practice / exam).
 *
 * Loading and resuming the attempt, the question card with instant-feedback
 * rendering, previous/next navigation, the question navigator and the
 * keyboard shortcuts common to every mode all live here. A mode screen
 * (`ExamSession`, and later the practice/study screens) supplies only its own
 * chrome through `header`/`footer` and owns whatever is truly mode-specific
 * — the exam timer, the submit confirmation, the auto-submit-on-expiry.
 *
 * Refresh recovery: the route is the single source of truth for which
 * attempt is open. If the store is empty — a reload, a crash, a link opened
 * in a new tab — the attempt and every answer are read back from IndexedDB
 * before anything renders. Nothing about the session lives only in memory.
 */
export interface SessionRunnerProps {
  attemptId: string;
  /** Called once the loaded attempt is no longer in progress. */
  onSubmitted: (attemptId: string) => void;
  /** A mode's own chrome in the top bar — e.g. exam mode's `ExamTimer`. */
  header?: ReactNode;
  /** A mode's own controls below the question — e.g. exam mode's submit button. */
  footer?: ReactNode;
  /**
   * A mode's own dialog is open; the shared shortcuts stand down. A mode
   * screen owns its dialogs outside this component, so the local dialog state
   * cannot see them — without this the user could answer, flag or navigate
   * from behind the modal and then confirm something it never described.
   */
  modalOpen?: boolean;
  /**
   * A mode's own keyboard shortcut, folded into the shared handler instead of
   * being registered next to it. Exam mode's "T" is the only one: owned by the
   * mode screen it stayed live behind the navigator and the shortcuts overlay,
   * which are local to this component — the clock would vanish behind the
   * scrim with nothing to explain it. One owner of the keyboard, not two.
   */
  onToggleTimer?: () => void;
}

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

/* At a boundary the button is aria-disabled rather than disabled: `disabled`
   fires while the user is still pressing it and focus vanishes to `<body>` —
   at the exact moment they want Submit, the very next tab stop. The state is
   still conveyed, and the button stays where the keyboard left it. */
const NAV_BUTTON =
  "flex min-h-11 items-center gap-2 rounded-[var(--radius-btn)] border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-surface";

/** The counter heading's id — the question heading is named after it too. */
const COUNTER_ID = "session-question-counter";

export function SessionRunner({
  attemptId,
  onSubmitted,
  header,
  footer,
  modalOpen = false,
  onToggleTimer,
}: SessionRunnerProps) {
  const { t } = useTranslation();
  const location = useLocation();

  const attempt = useSessionStore((state) => state.attempt);
  const questions = useSessionStore((state) => state.questions);
  const answers = useSessionStore((state) => state.answers);
  const flagged = useSessionStore((state) => state.flagged);
  const revealed = useSessionStore((state) => state.revealed);
  const currentIndex = useSessionStore((state) => state.currentIndex);
  const contentLang = useSessionStore((state) => state.contentLang);
  const loading = useSessionStore((state) => state.loading);
  const error = useSessionStore((state) => state.error);
  const persistFailed = useSessionStore((state) => state.persistFailed);

  const resumeAttempt = useSessionStore((state) => state.resumeAttempt);
  const select = useSessionStore((state) => state.select);
  const toggleFlag = useSessionStore((state) => state.toggleFlag);
  const goTo = useSessionStore((state) => state.goTo);
  const next = useSessionStore((state) => state.next);
  const previous = useSessionStore((state) => state.previous);
  const setContentLang = useSessionStore((state) => state.setContentLang);

  // F2-06 — read once at mount so the choice survives a reload, then owned
  // here: it is a display preference, not part of the attempt.
  const [sideBySide, setSideBySide] = useState(readSideBySide);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const requestedRef = useRef<string | null>(null);
  const sidePanelRef = useRef<HTMLElement>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const rationaleRef = useRef<HTMLElement>(null);
  const liveRegionRef = useRef<HTMLParagraphElement>(null);
  /** The question the last announcement/focus pass ran for; null before the first. */
  const announcedQuestionRef = useRef<string | null>(null);
  /** The revealed question id at that same pass, or null if none was revealed. */
  const announcedRevealRef = useRef<string | null>(null);

  const ready = !!attempt && attempt.id === attemptId && questions.length > 0;
  const question = questions[currentIndex];
  const total = questions.length;
  const dialogOpen = navigatorOpen || shortcutsOpen || modalOpen;

  // Derived up here rather than after the early returns: the focus effect
  // below needs them, and a hook cannot live behind a `return`.
  const selectedIds = question ? (answers[question.id] ?? []) : [];
  const isRevealed = !!question && Boolean(revealed[question.id]);
  const isAnswerCorrect =
    !!question &&
    selectedIds.length === question.correct.length &&
    selectedIds.every((id) => question.correct.includes(id));

  // F1-10 — rehydrate from IndexedDB when the store is cold (reload, new tab).
  useEffect(() => {
    if (attempt?.id === attemptId) return;
    if (requestedRef.current === attemptId) return;

    requestedRef.current = attemptId;
    void resumeAttempt(attemptId);
  }, [attemptId, attempt?.id, resumeAttempt]);

  // An attempt that is no longer in progress has no session screen.
  useEffect(() => {
    if (!attempt || attempt.id !== attemptId) return;
    if (attempt.status === "in-progress") return;

    onSubmitted(attempt.id);
  }, [attempt, attemptId, onSubmitted]);

  useDocumentTitle(ready ? t("exam.question", { current: currentIndex + 1, total }) : null);

  /**
   * Writes the polite live region.
   *
   * The region is an external system — the accessibility tree, read by the
   * AT — not a piece of rendered state, and it is written directly for two
   * reasons. React state would re-render the whole session screen for a
   * sentence nobody can see, and the region is rendered EMPTY on every pass:
   * `aria-live="polite"` announces a change to a region already in the tree,
   * so a node inserted with its text already inside it is the region's
   * initial state and is entitled to say nothing (VoiceOver reliably says
   * nothing). React owns no children here, so nothing it does overwrites this.
   */
  const announce = useCallback((text: string) => {
    const region = liveRegionRef.current;
    if (!region) return;
    region.textContent = text;
  }, []);

  /**
   * The two moments a screen reader has to be told about, in one place.
   *
   * Revealing the answer and moving to the next question both replace most of
   * the screen without a page load, and both used to pass in silence: nothing
   * was announced, and `disabled` landing on the option the user had just
   * activated dropped focus to `<body>`.
   *
   * Both are announced by MOVING FOCUS, never by racing it. A focus event is
   * given priority by NVDA and VoiceOver and flushes whatever polite speech is
   * pending, so anything written to the live region in the same breath as a
   * focus call is dropped; what has to be heard is named onto the element that
   * receives the focus instead — the counter and the stem on the heading, the
   * verdict on the rationale panel. The live region is left to the
   * announcements that move nothing, which is `selectOption`'s displacement.
   *
   * Driven by the TRANSITION rather than by render state, so arrowing between
   * two already-revealed questions cannot re-announce a verdict for a question
   * nobody just answered.
   *
   * Both handled here so a question that arrives already revealed cannot fire
   * the reveal branch as well: the new question wins and focus goes to its
   * heading.
   */
  useEffect(() => {
    if (!question) return;

    const previousQuestionId = announcedQuestionRef.current;
    const revealKey = isRevealed ? question.id : null;
    const previousRevealKey = announcedRevealRef.current;

    announcedQuestionRef.current = question.id;
    announcedRevealRef.current = revealKey;

    // First paint. Nothing was navigated to and nothing was answered, so
    // focus stays wherever the route left it.
    if (previousQuestionId === null) return;

    if (previousQuestionId !== question.id) {
      // The heading carries the counter and the stem, so focusing it both
      // announces the change and says where the reader now is. Clearing the
      // region keeps a stale verdict from being read after it.
      announce("");
      questionHeadingRef.current?.focus();
      return;
    }

    if (revealKey === previousRevealKey) return;

    // Nothing is written for the reveal: the panel is NAMED after the verdict
    // (`RationalePanel`'s `verdict` prop), so focusing it reads "Correct
    // answer! Why?" and the verdict cannot be flushed by the focus move that
    // was supposed to deliver it. Clearing is still right — a displacement
    // announced a moment ago must not be read out after the answer is final.
    announce("");
    if (!revealKey) return;

    rationaleRef.current?.focus();
  }, [question, isRevealed, announce]);

  /**
   * Selection, with the displacement a multi-select makes announced.
   *
   * Past the limit `sessionStore.select` drops the OLDEST pick to make room,
   * which spares the user having to clear a box before changing their mind —
   * a real kindness, and worth keeping. What it cannot do is say so: a screen
   * reader hears "checked" for the box just activated and nothing at all for
   * the one that silently cleared somewhere above. So the displacement stays
   * and is announced instead of being taken away.
   *
   * This is the live region's only writer, and deliberately so: a displacement
   * moves no focus, so nothing flushes it before it is read. It cannot collide
   * with the reveal either — `select` refuses a revealed question, so a
   * displacement can only happen while nothing here has been revealed.
   */
  const selectOption = useCallback(
    (questionId: string, optionId: string) => {
      const before = useSessionStore.getState().answers[questionId] ?? [];
      select(questionId, optionId);

      const state = useSessionStore.getState();
      const target = state.questions.find((item) => item.id === questionId);
      if (!target) return;

      // The one case the message describes: a pick past the limit displaced an
      // older one. A radio group replaces its own selection on every pick and
      // conveys single-selection natively, so without this guard the sentence
      // fires on every ordinary answer change — up to forty times an exam, and
      // again on every change of mind.
      if (target.selectCount < 2 || before.length < target.selectCount) return;

      const after = state.answers[questionId] ?? [];
      const dropped = before.find((id) => id !== optionId && !after.includes(id));
      if (!dropped) return;

      const options = target.i18n[state.contentLang]?.options ?? [];
      // The position is what the user can act on: it is printed on the row and
      // it is the key that selects it.
      const position = options.findIndex((option) => option.id === dropped) + 1;
      if (position === 0) return;

      announce(t("session.optionReplaced", { position }));
    },
    [select, announce, t],
  );

  // F1-13 — shortcuts common to every mode. Every one also has a visible control.
  useEffect(() => {
    if (!ready) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTextEntry(event.target)) return;
      // Open dialogs own the keyboard: they handle Escape and trap Tab.
      if (dialogOpen) return;

      const current = questions[useSessionStore.getState().currentIndex];
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
        setContentLang(useSessionStore.getState().contentLang === "tr" ? "en" : "tr");
        return;
      }

      // Exam mode's "T". It is handled here rather than in the exam screen so
      // that the navigator and the shortcuts overlay — both local to this
      // component — can silence it: reading the help is exactly when a
      // candidate presses the key the help documents.
      if (key === "t" && onToggleTimer) {
        event.preventDefault();
        onToggleTimer();
        return;
      }

      if (key === "n") {
        event.preventDefault();

        // On desktop the navigator is already on screen, so `n` moves focus
        // into it. Opening the sheet there would mount a focus trap inside a
        // panel that CSS has hidden.
        const sidePanel = sidePanelRef.current;
        if (sidePanel && sidePanel.offsetParent !== null) {
          // The CURRENT question's cell, not the first: from question 30, cell
          // 1 leaves 29 tab stops between the user and where they were.
          const currentCell = sidePanel.querySelector<HTMLElement>('[aria-current="true"]');
          (currentCell ?? sidePanel.querySelector<HTMLElement>("button"))?.focus();
          return;
        }

        setNavigatorOpen(true);
        return;
      }

      if (!/^[1-9]$/.test(event.key)) return;

      const options = current.i18n[useSessionStore.getState().contentLang]?.options ?? [];
      const option = options[Number(event.key) - 1];
      if (!option) return;

      event.preventDefault();
      selectOption(current.id, option.id);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    ready,
    dialogOpen,
    questions,
    previous,
    next,
    toggleFlag,
    setContentLang,
    selectOption,
    onToggleTimer,
  ]);

  if (error) {
    return (
      <section className="mx-auto flex max-w-md flex-col items-start gap-4 px-4 py-16">
        <h1 className="text-xl font-semibold">{t("common.errorTitle")}</h1>
        <p className="text-sm text-fg-muted">
          {error === "not-found" ? t("common.notFoundBody") : error}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void resumeAttempt(attemptId)}
            className="min-h-11 rounded-[var(--radius-btn)] border border-border px-4 text-sm font-medium hover:bg-surface-2"
          >
            {t("common.retry")}
          </button>
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

  // An attempt opened from the wrong mode's URL is redirected, never rendered
  // with the wrong rules — a timer must never mount over a null `deadlineAt`.
  // The predicate lives in routeForAttempt.ts so the stale-attempt case it
  // guards against can be tested without a router.
  const redirectTo = redirectPathFor(attempt, attemptId, location.pathname);
  if (redirectTo) return <Navigate to={redirectTo} replace />;

  if (loading || !ready || !question) return <Spinner full />;

  const answeredFlags = questions.map((item) => (answers[item.id]?.length ?? 0) > 0);
  const flaggedFlags = questions.map((item) => !!flagged[item.id]);
  const isFlagged = !!flagged[question.id];
  const flagLabel = isFlagged ? t("exam.unflag") : t("exam.flag");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-4">
          {header}

          {/* The question heading borrows this id so that focusing it reads
              "Question 3 of 40 <stem>" without the counter being written into
              the document twice. */}
          <h1 id={COUNTER_ID} className="text-sm font-medium tabular-nums">
            {t("exam.question", { current: currentIndex + 1, total })}
          </h1>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <ContentLangToggle
              value={contentLang}
              sideBySide={sideBySide}
              onChange={setContentLang}
              onSideBySideChange={(on) => {
                setSideBySide(on);
                writeSideBySide(on);
              }}
            />

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

      {persistFailed ? (
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 pt-3 sm:px-4">
          <p role="alert" className={BANNER}>
            {t("exam.persistFailed")}
          </p>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 sm:py-8">
        <section className="min-w-0 flex-1">
          <QuestionCard
            question={question}
            lang={contentLang}
            selected={selectedIds}
            onSelect={(optionId) => selectOption(question.id, optionId)}
            revealed={isRevealed}
            headingRef={questionHeadingRef}
            counterId={COUNTER_ID}
            secondaryLang={sideBySide ? otherLang(contentLang) : undefined}
          />

          {/* Rendered on every pass and always empty in the markup: `announce`
              is the only thing that puts text in it. */}
          <p ref={liveRegionRef} aria-live="polite" aria-atomic="true" className="sr-only" />

          {isRevealed ? (
            <div className="mt-5">
              <RationalePanel
                question={question}
                lang={contentLang}
                selected={selectedIds}
                panelRef={rationaleRef}
                verdict={isAnswerCorrect ? "correct" : "incorrect"}
              />
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            {/* `previous` and `next` already no-op past the ends (`goTo`
                bounds-checks), so an aria-disabled button needs no extra
                guard here. */}
            <button
              type="button"
              onClick={previous}
              aria-disabled={currentIndex === 0}
              className={NAV_BUTTON}
            >
              <span aria-hidden="true">←</span>
              {t("exam.previous")}
            </button>

            <button
              type="button"
              onClick={next}
              aria-disabled={currentIndex === total - 1}
              className={NAV_BUTTON}
            >
              {t("exam.next")}
              <span aria-hidden="true">→</span>
            </button>
          </div>

          {footer}
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

      {/* Only a timed attempt has a clock to hide, and the "T" row would
          otherwise document a key that does nothing in study and practice. */}
      <ShortcutsOverlay
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        hasTimer={attempt.deadlineAt !== null}
      />
    </div>
  );
}

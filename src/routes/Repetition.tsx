/**
 * F3-02 — Repetition (`/tekrar`), the spaced-repetition review screen.
 *
 * One due card at a time: question, answer, rationale, then a self-rating —
 * Again / Hard / Good / Easy — with the interval each rating would set printed
 * on its button (docs/06 §3.8). Showing the interval is what lets a candidate
 * trust the schedule rather than guess at it.
 *
 * A wrong answer offers only "Again". The rating exists because a right
 * answer can be a guess; a wrong one is not a matter of confidence, and
 * letting it be rated "Easy" would send a question the candidate does not know
 * weeks away.
 *
 * Each rating is written the moment it is given, so leaving halfway loses
 * nothing. This screen keeps no attempt and writes no responses: the deck is
 * its only state, and the saved lists, the home numbers and the exam history
 * stay about the three modes.
 *
 * Options are shuffled per visit (D-03) from a fresh seed, so a question that
 * keeps coming back does not keep its key in the same row.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ContentLangToggle } from "@/components/ContentLangToggle";
import { ErrorNotice } from "@/components/ErrorNotice";
import { QuestionCard } from "@/components/QuestionCard";
import { RationalePanel } from "@/components/RationalePanel";
import { Spinner } from "@/components/Spinner";
import { withOptionOrder } from "@/features/exam/optionOrder";
import { randomSeed } from "@/features/exam/rng";
import { isExactMatch } from "@/features/exam/scoreExam";
import { formatInterval } from "@/features/srs/interval";
import { summarizeDeck } from "@/features/srs/queue";
import { GRADES, previewDue, type SrsGrade } from "@/features/srs/scheduler";
import { otherLang, readSideBySide, writeSideBySide } from "@/lib/bilingual";
import { contentClient } from "@/lib/content/contentClient";
import type { SrsCard } from "@/lib/db/db";
import { loadDeck, rateCard } from "@/lib/db/srsCards";
import { isTextEntry } from "@/lib/isTextEntry";
import { useArrivalFocus } from "@/lib/useArrivalFocus";
import { useAsyncData } from "@/lib/useAsyncData";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import type { Lang, Question } from "@/types/content";

interface ReviewItem {
  card: SrsCard;
  question: Question;
}

interface RepetitionData {
  items: ReviewItem[];
  size: number;
  nextDueAt: number | null;
  /** The "now" the deck was summarised at — what "next due in" counts from. */
  loadedAt: number;
}

const COUNTER_ID = "repetition-counter";

const BUTTON =
  "flex min-w-[7.5rem] flex-col items-center gap-0.5 rounded-[var(--radius-btn)] border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50";

async function loadRepetition(): Promise<RepetitionData> {
  const cert = await contentClient.getActiveCertification();
  const [index, deck] = await Promise.all([contentClient.getIndex(cert.path), loadDeck(cert.id)]);

  const published = new Set(
    index.questions.filter((entry) => entry.status === "published").map((entry) => entry.id),
  );
  const loadedAt = Date.now();
  const summary = summarizeDeck(deck, published, loadedAt);
  const questions = await contentClient.getQuestions(
    cert.path,
    summary.due.map((card) => card.questionId),
  );

  const seed = randomSeed();
  const byId = new Map(questions.map((question) => [question.id, withOptionOrder(question, seed)]));
  const items = summary.due.flatMap((card) => {
    const question = byId.get(card.questionId);
    return question ? [{ card, question }] : [];
  });

  return { items, size: summary.size, nextDueAt: summary.nextDueAt, loadedAt };
}

export default function Repetition() {
  const { t, i18n } = useTranslation();
  const { data, failed, reload } = useAsyncData(loadRepetition);
  const uiLang: Lang = i18n.language === "en" ? "en" : "tr";

  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  /** When the answer was revealed — also the "now" the interval preview is computed for. */
  const [revealedAt, setRevealedAt] = useState<number | null>(null);
  const [reviewed, setReviewed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [contentLang, setContentLang] = useState<Lang>(uiLang);
  const [sideBySide, setSideBySide] = useState(readSideBySide);

  const stemRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  /** Set by a rating: the next thing rendered takes focus. A cold load does not. */
  const focusNextRef = useRef(false);

  useDocumentTitle(t("repetition.title"));
  const titleRef = useArrivalFocus<HTMLHeadingElement>(Boolean(data));

  const item = data?.items[position];

  // After a rating the next card (or the end) replaces this one without a
  // page load; focusing its heading is what tells a screen reader it changed.
  useEffect(() => {
    if (!focusNextRef.current) return;
    if (!data) return;

    focusNextRef.current = false;
    if (item) stemRef.current?.focus();
    else doneRef.current?.focus();
  }, [data, item]);

  // Revealing locks the options, which drops focus; the rationale panel is
  // named after the verdict, so focusing it says whether the answer was right.
  useEffect(() => {
    if (revealedAt === null) return;
    panelRef.current?.focus();
  }, [revealedAt]);

  const select = useCallback(
    (optionId: string) => {
      if (!item) return;
      if (revealedAt !== null) return;

      const { selectCount } = item.question;
      const next = selected.includes(optionId)
        ? selected.filter((id) => id !== optionId)
        : selectCount === 1
          ? [optionId]
          : [...selected, optionId];

      setSelected(next);
      // A multi-select question reveals nothing until the full selection is made.
      if (next.length === selectCount) setRevealedAt(Date.now());
    },
    [item, revealedAt, selected],
  );

  // 1-9 picks an option, as in the three modes. Nothing grades from the
  // keyboard: the same digit would select one moment and rate the next.
  useEffect(() => {
    if (!item || revealedAt !== null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTextEntry(event.target)) return;
      if (!/^[1-9]$/.test(event.key)) return;

      const option = item.question.i18n[contentLang]?.options[Number(event.key) - 1];
      if (!option) return;

      event.preventDefault();
      select(option.id);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item, revealedAt, contentLang, select]);

  if (failed) return <ErrorNotice onRetry={reload} />;
  if (!data) return <Spinner />;

  async function rate(grade: SrsGrade) {
    if (!item || !data) return;
    // `aria-disabled` keeps the button focusable while the write is in
    // flight; it does not block a second click, so this does.
    if (saving) return;

    setSaving(true);
    try {
      await rateCard(item.card, grade);
    } catch {
      setSaving(false);
      setSaveFailed(true);
      return;
    }

    setSaving(false);
    setSaveFailed(false);
    setReviewed((count) => count + 1);
    setSelected([]);
    setRevealedAt(null);
    focusNextRef.current = true;

    if (position + 1 < data.items.length) {
      setPosition(position + 1);
      return;
    }

    // The end of this batch. Reloading picks up whatever has come due since —
    // an "Again" from a minute ago, say — and otherwise says when the next
    // card will be.
    setPosition(0);
    reload();
  }

  const header = (
    <div className="flex flex-col gap-3">
      <h1 ref={titleRef} tabIndex={-1} className="text-[28px] font-semibold leading-tight">
        {t("repetition.title")}
      </h1>
      <p className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">
        {t("repetition.intro")}
      </p>
    </div>
  );

  if (!item) {
    const hasDeck = data.size > 0;

    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
        {header}

        <section
          aria-labelledby="repetition-done"
          className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5"
        >
          {/* Described by the facts under it, so the focus move that lands
              here after the last rating reads them too, not just the title. */}
          <h2
            id="repetition-done"
            ref={doneRef}
            tabIndex={-1}
            aria-describedby="repetition-done-facts"
            className="text-lg font-semibold"
          >
            {hasDeck ? t("repetition.doneTitle") : t("repetition.emptyTitle")}
          </h2>

          <div id="repetition-done-facts" className="flex flex-col gap-3">
            {reviewed > 0 ? (
              <p className="text-[15px] text-fg-muted">
                {t("repetition.reviewed", { count: reviewed })}
              </p>
            ) : null}

            {hasDeck ? (
              <p className="text-[15px] text-fg-muted">
                {t("repetition.deckSize", { count: data.size })}{" "}
                {data.nextDueAt !== null
                  ? t("repetition.nextDue", {
                      interval: formatInterval(data.nextDueAt - data.loadedAt, i18n.language),
                    })
                  : null}
              </p>
            ) : (
              <p className="max-w-[65ch] text-[15px] text-fg-muted">{t("repetition.emptyBody")}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {hasDeck ? (
              <button
                type="button"
                onClick={() => {
                  // The button unmounts with the screen while it reloads, so
                  // focus is put back on whatever renders next.
                  focusNextRef.current = true;
                  reload();
                }}
                className="rounded-[var(--radius-btn)] border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
              >
                {t("repetition.checkAgain")}
              </button>
            ) : null}
            <Link
              to="/"
              className="rounded-[var(--radius-btn)] border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
            >
              {t("result.backHome")}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const { question, card } = item;
  const revealed = revealedAt !== null;
  const correct = revealed && isExactMatch(selected, question.correct);
  const preview = revealedAt !== null ? previewDue(card, revealedAt) : null;
  const offered: readonly SrsGrade[] = correct ? GRADES : ["again"];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
      {header}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <p id={COUNTER_ID} className="text-sm font-medium tabular-nums">
          {t("repetition.card", { current: position + 1, total: data.items.length })}
        </p>
        <ContentLangToggle
          value={contentLang}
          sideBySide={sideBySide}
          onChange={setContentLang}
          onSideBySideChange={(on) => {
            setSideBySide(on);
            writeSideBySide(on);
          }}
        />
      </div>

      <QuestionCard
        key={question.id}
        question={question}
        lang={contentLang}
        selected={selected}
        onSelect={select}
        revealed={revealed}
        headingRef={stemRef}
        counterId={COUNTER_ID}
        secondaryLang={sideBySide ? otherLang(contentLang) : undefined}
      />

      {revealed && preview ? (
        <>
          <RationalePanel
            question={question}
            lang={contentLang}
            selected={selected}
            panelRef={panelRef}
            verdict={correct ? "correct" : "incorrect"}
          />

          <section aria-labelledby="repetition-grade" className="flex flex-col gap-3">
            <h2 id="repetition-grade" className="text-base font-semibold">
              {t("repetition.gradeTitle")}
            </h2>
            <p className="max-w-[65ch] text-sm text-fg-muted">
              {correct ? t("repetition.gradeLead") : t("repetition.gradeWrongLead")}
            </p>

            {saveFailed ? (
              <p
                role="alert"
                className="rounded-[var(--radius-card)] border border-flag/40 bg-flag/10 px-4 py-2.5 text-sm text-fg"
              >
                {t("repetition.saveFailed")}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {offered.map((grade) => {
                const label = t(`repetition.${grade}`);
                const due = t("repetition.dueIn", {
                  interval: formatInterval(preview[grade] - revealedAt, i18n.language),
                });

                // Named explicitly: the two lines are flex items, and the
                // accessible name of adjacent flex items runs them together
                // ("Goodin 4 days") in some browsers.
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => void rate(grade)}
                    aria-disabled={saving}
                    aria-label={`${label} ${due}`}
                    className={BUTTON}
                  >
                    <span>{label}</span>
                    <span className="text-xs font-normal text-fg-muted">{due}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

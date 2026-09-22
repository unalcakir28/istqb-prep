/**
 * F1-12 — Review tour (docs/06 §3.5).
 *
 * This screen is where the product's real value shows: a separate rationale
 * for every option (CLAUDE.md rule 2). The rationale panel does not collapse,
 * it is open by default, and every question gets one.
 *
 * The question language can be switched here too; because a selection is held
 * by question id and option id, the answers are unaffected.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ErrorNotice } from "@/components/ErrorNotice";
import { QuestionCard } from "@/components/QuestionCard";
import { RationalePanel } from "@/components/RationalePanel";
import { Spinner } from "@/components/Spinner";
import { useSessionStore } from "@/features/session/sessionStore";
import { CONTENT_LANGUAGES } from "@/lib/i18n";
import { useArrivalFocus } from "@/lib/useArrivalFocus";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

type Filter = "all" | "wrong";

/** A two-segment button group — the filter and the question language share one look. */
function segmentClasses(active: boolean): string {
  if (active) return "rounded-[6px] bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg";
  return "rounded-[6px] px-3 py-1.5 text-xs font-medium text-fg-muted hover:text-fg";
}

/** An unanswered question is stated separately from a wrong one; colour alone is not enough (WCAG 1.4.1). */
function OutcomeBadge({ isCorrect, answered }: { isCorrect: boolean; answered: boolean }) {
  const { t } = useTranslation();

  function label(): string {
    if (isCorrect) return `✓ ${t("result.correct")}`;
    if (!answered) return `– ${t("result.unanswered")}`;
    return `✕ ${t("result.incorrect")}`;
  }

  const tone = isCorrect
    ? "border-correct/40 bg-correct/10 text-correct"
    : "border-incorrect/40 bg-incorrect/10 text-incorrect";

  return (
    <span
      className={`rounded-[var(--radius-badge)] border px-2 py-0.5 text-xs font-semibold ${tone}`}
    >
      {label()}
    </span>
  );
}

export default function Review() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { t } = useTranslation();

  const attempt = useSessionStore((state) => state.attempt);
  const score = useSessionStore((state) => state.score);
  const questions = useSessionStore((state) => state.questions);
  const answers = useSessionStore((state) => state.answers);
  const contentLang = useSessionStore((state) => state.contentLang);
  const loading = useSessionStore((state) => state.loading);
  const setContentLang = useSessionStore((state) => state.setContentLang);
  const loadSubmitted = useSessionStore((state) => state.loadSubmitted);

  const [filter, setFilter] = useState<Filter>("all");

  const ready = Boolean(attemptId && attempt?.id === attemptId && score);

  // Arrived at from the result screen, which itself arrived from a session:
  // without these the tour inherits "Question 40 of 40" as its title and lands
  // the reader back at the top of the document with nothing said.
  useDocumentTitle(t("review.title"));
  const headingRef = useArrivalFocus<HTMLHeadingElement>(ready);

  useEffect(() => {
    if (!attemptId || ready) return;
    void loadSubmitted(attemptId);
  }, [attemptId, ready, loadSubmitted]);

  if (loading && !ready) return <Spinner />;
  if (!attempt || !score) return <ErrorNotice />;

  const wrongIds = new Set(
    score.outcomes.filter((outcome) => !outcome.isCorrect).map((outcome) => outcome.questionId),
  );
  const visible = questions
    .map((question, index) => ({ question, position: index + 1 }))
    .filter((item) => filter === "all" || wrongIds.has(item.question.id));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-4">
        {/* `tabIndex={-1}` only so `useArrivalFocus` can put focus here; it
            stays out of the tab order. */}
        <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-semibold leading-tight">
          {t("review.title")}
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label={t("review.title")}
            className="flex rounded-[var(--radius-btn)] border border-border p-0.5"
          >
            {(["all", "wrong"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={segmentClasses(filter === value)}
              >
                {value === "all" ? t("review.all") : `${t("review.onlyWrong")} (${wrongIds.size})`}
              </button>
            ))}
          </div>

          <div
            role="group"
            aria-label={t("question.contentLang")}
            className="flex rounded-[var(--radius-btn)] border border-border p-0.5"
          >
            {CONTENT_LANGUAGES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setContentLang(option.value)}
                aria-pressed={contentLang === option.value}
                lang={option.value}
                className={segmentClasses(contentLang === option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Link
            to={`/sonuc/${attempt.id}`}
            className="text-sm text-fg-muted underline underline-offset-2 hover:text-fg"
          >
            {t("review.back")}
          </Link>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-border bg-surface-2 px-4 py-8 text-center text-fg-muted">
          {t("review.noneWrong")}
        </p>
      ) : (
        <ol className="flex flex-col gap-10">
          {visible.map(({ question, position }) => {
            const selected = answers[question.id] ?? [];
            const isCorrect = !wrongIds.has(question.id);

            return (
              <li
                key={question.id}
                className="flex flex-col gap-4 border-t border-border pt-6 first:border-t-0 first:pt-0"
              >
                <h2 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-fg-muted">
                  {t("exam.question", { current: position, total: questions.length })}
                  <OutcomeBadge isCorrect={isCorrect} answered={selected.length > 0} />
                </h2>

                {/* Both nest under the counter heading above rather than
                    sitting beside it: a 40-question review is 40 groups of
                    three, not 120 headings in a row. */}
                <QuestionCard
                  question={question}
                  lang={contentLang}
                  selected={selected}
                  revealed
                  headingLevel={3}
                />

                <RationalePanel
                  question={question}
                  lang={contentLang}
                  selected={selected}
                  headingLevel={3}
                />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

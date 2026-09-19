/**
 * F1-16 — Inceleme turu (docs/06 §3.5).
 *
 * Bu ekran urunun asil degerinin gosterildigi yerdir: her sik icin ayri
 * gerekce (CLAUDE.md kural 2). Gerekce paneli katlanmaz, varsayilan aciktir
 * ve her soruya yer verilir.
 *
 * Soru dili burada da degistirilebilir; secim soru ve sik ID'si uzerinden
 * tutuldugu icin cevaplar etkilenmez.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { QuestionCard } from "@/components/QuestionCard";
import { RationalePanel } from "@/components/RationalePanel";
import { Spinner } from "@/components/Spinner";
import { useExamStore } from "@/features/exam/examStore";
import type { Lang } from "@/types/content";

type Filter = "all" | "wrong";

const CONTENT_LANGUAGES: { value: Lang; label: string }[] = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "English" },
];

export default function Review() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { t } = useTranslation();

  const attempt = useExamStore((state) => state.attempt);
  const score = useExamStore((state) => state.score);
  const questions = useExamStore((state) => state.questions);
  const answers = useExamStore((state) => state.answers);
  const contentLang = useExamStore((state) => state.contentLang);
  const loading = useExamStore((state) => state.loading);
  const setContentLang = useExamStore((state) => state.setContentLang);
  const loadSubmitted = useExamStore((state) => state.loadSubmitted);

  const [filter, setFilter] = useState<Filter>("all");

  const ready = Boolean(attemptId && attempt?.id === attemptId && score);

  useEffect(() => {
    if (!attemptId || ready) return;
    void loadSubmitted(attemptId);
  }, [attemptId, ready, loadSubmitted]);

  if (loading && !ready) return <Spinner />;

  if (!attempt || !score) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-16">
        <h1 className="text-2xl font-semibold">{t("common.errorTitle")}</h1>
        <Link
          to="/"
          className="w-fit rounded-[var(--radius-btn)] border border-border px-4 py-2 font-medium hover:bg-surface-2"
        >
          {t("result.backHome")}
        </Link>
      </div>
    );
  }

  const wrongIds = new Set(
    score.outcomes.filter((outcome) => !outcome.isCorrect).map((outcome) => outcome.questionId),
  );
  const visible = questions
    .map((question, index) => ({ question, position: index + 1 }))
    .filter((item) => filter === "all" || wrongIds.has(item.question.id));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-4">
        <h1 className="text-[28px] font-semibold leading-tight">{t("review.title")}</h1>

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
                className={
                  filter === value
                    ? "rounded-[6px] bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg"
                    : "rounded-[6px] px-3 py-1.5 text-xs font-medium text-fg-muted hover:text-fg"
                }
              >
                {value === "all"
                  ? t("review.all")
                  : `${t("review.onlyWrong")} (${wrongIds.size})`}
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
                className={
                  contentLang === option.value
                    ? "rounded-[6px] bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg"
                    : "rounded-[6px] px-3 py-1.5 text-xs font-medium text-fg-muted hover:text-fg"
                }
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
                  <span
                    className={
                      isCorrect
                        ? "rounded-[var(--radius-badge)] border border-correct/40 bg-correct/10 px-2 py-0.5 text-xs font-semibold text-correct"
                        : "rounded-[var(--radius-badge)] border border-incorrect/40 bg-incorrect/10 px-2 py-0.5 text-xs font-semibold text-incorrect"
                    }
                  >
                    {isCorrect
                      ? `✓ ${t("result.correct")}`
                      : selected.length === 0
                        ? `– ${t("result.unanswered")}`
                        : `✕ ${t("result.incorrect")}`}
                  </span>
                </h2>

                <QuestionCard
                  question={question}
                  lang={contentLang}
                  selected={selected}
                  review
                />

                <RationalePanel question={question} lang={contentLang} selected={selected} />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

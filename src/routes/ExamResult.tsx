/**
 * F1-12 — Sonuc ekrani (docs/06 §3.4).
 *
 * Ilke: durustluk > motivasyon. Baraj cizgisi HER ZAMAN cizilir, skor
 * yumusatilmaz, kalan bir deneme "neredeyse" diye suslenmez. Gecti/kaldi
 * yalnizca renkle degil ikon ve metinle de soylenir (WCAG 1.4.1).
 *
 * Tum sabitler veriden gelir: baraj `score.passPoints` (meta.json), bolum
 * basliklari syllabus.json, hedef soru sayilari syllabus'un `examQuestions`
 * alani, ogrenme hedefi metinleri objectives.json.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ScoreBar } from "@/components/ScoreBar";
import { Spinner } from "@/components/Spinner";
import { useExamStore } from "@/features/exam/examStore";
import { weakestObjectives } from "@/features/exam/scoreExam";
import { contentClient } from "@/lib/content/contentClient";
import type { Chapter, Objective } from "@/types/content";

function PassIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
      className="size-5"
    >
      <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FailIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
      className="size-5"
    >
      <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
    </svg>
  );
}

export default function ExamResult() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { t } = useTranslation();

  const attempt = useExamStore((state) => state.attempt);
  const score = useExamStore((state) => state.score);
  const contentLang = useExamStore((state) => state.contentLang);
  const loading = useExamStore((state) => state.loading);
  const loadSubmitted = useExamStore((state) => state.loadSubmitted);

  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [objectives, setObjectives] = useState<Objective[] | null>(null);

  const ready = Boolean(attemptId && attempt?.id === attemptId && score);

  useEffect(() => {
    if (!attemptId || ready) return;
    void loadSubmitted(attemptId);
  }, [attemptId, ready, loadSubmitted]);

  const certId = attempt?.certId;

  useEffect(() => {
    if (!certId) return;
    let cancelled = false;

    async function load(path: string) {
      try {
        const [syllabus, list] = await Promise.all([
          contentClient.getSyllabus(path),
          contentClient.getObjectives(path),
        ]);
        if (cancelled) return;
        setChapters(syllabus.chapters);
        setObjectives(list);
      } catch {
        // Basliklar inmezse sonuc yine gosterilir; sadece kodlar gorunur.
        if (!cancelled) setChapters([]);
      }
    }

    void load(certId);
    return () => {
      cancelled = true;
    };
  }, [certId]);

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

  // Teslim zamani yoksa (olmamasi gereken durum) tahmin uretmek yerine
  // ayrilan surenin tamami gosterilir — render saf kalir.
  const elapsedSeconds =
    attempt.submittedAt === undefined
      ? attempt.durationMinutes * 60
      : Math.max(0, Math.round((attempt.submittedAt - attempt.startedAt) / 1000));
  // Havuz yetmedigi icin 40'tan az soru sorulduysa bile cubuk resmi baraja
  // kadar uzatilir: baraj cizgisi HER ZAMAN gorunur kalir, sorulmayan bolge
  // taranarak isaretlenir (docs/06 §3.4).
  const scale = Math.max(score.totalPoints, score.passPoints);
  const scoreLabel = t("result.score", { points: score.points, total: score.totalPoints });
  const passLabel = t("result.passLine", { pass: score.passPoints });
  const verdict = score.passed ? t("result.passed") : t("result.failed");
  const objectiveText = new Map((objectives ?? []).map((item) => [item.code, item.text]));
  const chapterById = new Map((chapters ?? []).map((item) => [item.number, item]));
  const weakest = weakestObjectives(score);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      <h1 className="text-[28px] font-semibold leading-tight">{t("result.title")}</h1>

      {attempt.autoSubmitted ? (
        <p className="rounded-[var(--radius-card)] border border-flag/40 bg-flag/10 px-4 py-3 text-sm">
          {t("exam.timeUp")}
        </p>
      ) : null}

      <section aria-labelledby="score-heading" className="flex flex-col gap-4">
        <h2 id="score-heading" className="sr-only">
          {`${scoreLabel} — ${verdict}`}
        </h2>

        <p className="font-mono text-[44px] font-semibold leading-none tabular-nums">
          {scoreLabel}
        </p>

        <p
          className={
            score.passed
              ? "flex items-center gap-2 text-lg font-semibold text-correct"
              : "flex items-center gap-2 text-lg font-semibold text-incorrect"
          }
        >
          {score.passed ? <PassIcon /> : <FailIcon />}
          {verdict}
          <span className="font-mono text-base font-normal text-fg-muted">
            {t("result.percent", { percent: score.percent })}
          </span>
        </p>

        <ScoreBar
          value={score.points}
          max={scale}
          reach={score.totalPoints}
          markAt={score.passPoints}
          markLabel={passLabel}
          tone={score.passed ? "correct" : "incorrect"}
          startLabel="0"
          endLabel={String(scale)}
          ariaLabel={`${scoreLabel} — ${passLabel} — ${verdict}`}
        />

        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex items-baseline gap-2">
            <dt className="text-fg-muted">{t("result.correct")}</dt>
            <dd className="font-mono font-medium">{score.correctCount}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-fg-muted">{t("result.incorrect")}</dt>
            <dd className="font-mono font-medium">{score.incorrectCount}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-fg-muted">{t("result.unanswered")}</dt>
            <dd className="font-mono font-medium">{score.unansweredCount}</dd>
          </div>
        </dl>

        <p className="text-sm text-fg-muted">
          {t("result.duration", {
            minutes: Math.floor(elapsedSeconds / 60),
            seconds: elapsedSeconds % 60,
          })}
        </p>
      </section>

      <section aria-labelledby="by-chapter" className="flex flex-col gap-4">
        <h2 id="by-chapter" className="text-base font-semibold">
          {t("result.byChapter")}
        </h2>

        <ul className="flex flex-col gap-4">
          {Object.entries(score.byChapter)
            .map(([key, breakdown]) => ({ chapter: Number(key), breakdown }))
            .sort((a, b) => a.chapter - b.chapter)
            .map(({ chapter, breakdown }) => {
              const info = chapterById.get(chapter);
              // Hayalet hedef: gercek sinavda bu bolumden kac soru gelir.
              const target = info?.examQuestions ?? breakdown.total;

              return (
                <li key={chapter} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span>
                      <span className="text-fg-muted">
                        {t("setup.chapter", { number: chapter })}
                      </span>{" "}
                      {info ? <span lang={contentLang}>{info.title[contentLang]}</span> : null}
                    </span>
                    <span className="shrink-0 font-mono text-fg-muted">
                      {t("result.score", { points: breakdown.correct, total: breakdown.total })}
                    </span>
                  </div>

                  <ScoreBar
                    value={breakdown.correct}
                    max={Math.max(target, breakdown.total)}
                    reach={breakdown.total}
                    size="sm"
                    tone="accent"
                    ariaLabel={`${t("setup.chapter", { number: chapter })}: ${t("result.score", {
                      points: breakdown.correct,
                      total: breakdown.total,
                    })}`}
                  />
                </li>
              );
            })}
        </ul>
      </section>

      {weakest.length > 0 ? (
        <section aria-labelledby="weakest" className="flex flex-col gap-3">
          <h2 id="weakest" className="text-base font-semibold">
            {t("result.weakest")}
          </h2>

          <ul className="flex flex-col gap-2">
            {weakest.map((code) => {
              const breakdown = score.byObjective[code];
              const text = objectiveText.get(code);

              return (
                <li
                  key={code}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3"
                >
                  <span className="rounded-[var(--radius-badge)] border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-xs font-medium text-accent">
                    {code}
                  </span>
                  {text ? (
                    <span lang={contentLang} className="flex-1 text-[15px]">
                      {text[contentLang]}
                    </span>
                  ) : null}
                  <span className="font-mono text-sm text-fg-muted">
                    {t("result.score", {
                      points: breakdown?.correct ?? 0,
                      total: breakdown?.total ?? 0,
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          to={`/inceleme/${attempt.id}`}
          className="rounded-[var(--radius-btn)] bg-accent px-5 py-3 font-semibold text-accent-fg"
        >
          {t("result.review")}
        </Link>
        <Link
          to="/deneme"
          className="rounded-[var(--radius-btn)] border border-border px-5 py-3 font-medium hover:bg-surface-2"
        >
          {t("result.retake")}
        </Link>
        <Link
          to="/"
          className="rounded-[var(--radius-btn)] border border-border px-5 py-3 font-medium hover:bg-surface-2"
        >
          {t("result.backHome")}
        </Link>
      </div>
    </div>
  );
}

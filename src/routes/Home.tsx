/**
 * F1-11 — Ana sayfa.
 *
 * Uc isi var ve sirasi onemli:
 *  1. Yarim kalan deneme varsa (F1-10) en ustte gosterilir — geri donen
 *     kullanicinin ilk ihtiyaci budur.
 *  2. Sinavin gercek sabitlerini soyler. 40/26/60/75 koda GOMULMEZ,
 *     hepsi meta.json'dan okunur (CLAUDE.md "Yapma" listesi).
 *  3. Havuz bir tam deneme uretemiyorsa bunu acikca yazar (F1-05c).
 *     Sessizce eksik deneme uretmek yasak (CLAUDE.md kural 8).
 */

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ScoreBar } from "@/components/ScoreBar";
import { Spinner } from "@/components/Spinner";
import { previewCoverage, type GroupShortfall } from "@/features/exam/generateExam";
import { contentClient } from "@/lib/content/contentClient";
import { discardAttempt, findResumableAttempt, getResponses, type Attempt } from "@/lib/db/db";
import type { CertMeta, CertificationSummary, ExamBlueprint } from "@/types/content";

interface HomeData {
  cert: CertificationSummary;
  meta: CertMeta;
  blueprint: ExamBlueprint;
  poolSize: number;
  achievable: number;
  shortfalls: GroupShortfall[];
}

interface ResumeState {
  attempt: Attempt;
  answered: number;
}

/**
 * Eksik gruplari bolume indirger. Eksiksiz gruplar hedefleri kadar soru
 * verecegi icin, bolumun ulasilabilir sayisi hedeften yalnizca eksik
 * gruplarin farki kadar duser.
 */
function achievableByChapter(
  blueprint: ExamBlueprint,
  shortfalls: GroupShortfall[],
): { chapter: number; available: number; required: number }[] {
  const missing = new Map<number, number>();
  for (const shortfall of shortfalls) {
    const current = missing.get(shortfall.chapter) ?? 0;
    missing.set(shortfall.chapter, current + (shortfall.required - shortfall.available));
  }

  return [...missing.entries()]
    .map(([chapter, gap]) => {
      const required = blueprint.totals.byChapter[String(chapter)] ?? 0;
      return { chapter, required, available: Math.max(0, required - gap) };
    })
    .sort((a, b) => a.chapter - b.chapter);
}

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [data, setData] = useState<HomeData | null>(null);
  const [resume, setResume] = useState<ResumeState | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const manifest = await contentClient.getManifest();
        const cert =
          manifest.certifications.find((item) => item.status === "active") ??
          manifest.certifications[0];
        if (!cert) throw new Error("manifest has no certification");

        const [meta, blueprint, index] = await Promise.all([
          contentClient.getMeta(cert.path),
          contentClient.getBlueprint(cert.path),
          contentClient.getIndex(cert.path),
        ]);

        // Yalnizca yayinlanmis sorular sayilir; taslak soru denemeye girmez.
        const pool = index.questions.filter((entry) => entry.status === "published");
        const preview = previewCoverage(blueprint, pool);

        const attempt = await findResumableAttempt(cert.id);
        const responses = attempt ? await getResponses(attempt.id) : [];

        if (cancelled) return;

        setData({
          cert,
          meta,
          blueprint,
          poolSize: pool.length,
          achievable: preview.total,
          shortfalls: preview.shortfalls,
        });
        setResume(
          attempt
            ? {
                attempt,
                answered: responses.filter((response) => response.selected.length > 0).length,
              }
            : null,
        );
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const onDiscard = useCallback(async () => {
    if (!resume) return;
    await discardAttempt(resume.attempt.id);
    setResume(null);
  }, [resume]);

  if (failed) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-16">
        <h1 className="text-2xl font-semibold">{t("common.errorTitle")}</h1>
        <button
          type="button"
          onClick={() => {
            setFailed(false);
            setReloadToken((token) => token + 1);
          }}
          className="w-fit rounded-[var(--radius-btn)] border border-border px-4 py-2 font-medium hover:bg-surface-2"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  if (!data) return <Spinner />;

  const { cert, meta, blueprint, poolSize, achievable, shortfalls } = data;
  const exam = meta.exam;
  const shortChapters = achievableByChapter(blueprint, shortfalls);
  const coverageLabel = t("home.coverage", {
    questions: poolSize,
    covered: cert.coverage.objectivesCovered,
    total: cert.coverage.objectivesTotal,
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      {resume ? (
        <section
          aria-labelledby="resume-title"
          className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-flag/40 bg-flag/10 p-4"
        >
          <p id="resume-title" className="font-semibold text-fg">
            {t("home.resumeTitle")}
          </p>
          <p className="text-sm text-fg-muted">
            {t("home.resumeBody", {
              answered: resume.answered,
              total: resume.attempt.questionIds.length,
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(`/deneme/${resume.attempt.id}`)}
              className="rounded-[var(--radius-btn)] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg"
            >
              {t("home.resume")}
            </button>
            <button
              type="button"
              onClick={() => void onDiscard()}
              className="rounded-[var(--radius-btn)] border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
            >
              {t("home.discard")}
            </button>
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <h1 className="text-[28px] font-semibold leading-tight sm:text-[32px]">
          {t("home.heroTitle")}
        </h1>

        <p className="text-lg text-fg-muted">
          {t("home.heroSubtitle", {
            count: exam.questionCount,
            minutes: exam.durationMinutes,
            pass: exam.passPoints,
            total: exam.totalPoints,
          })}
        </p>

        <p className="text-sm text-fg-muted">
          {t("setup.duration75", { minutes: exam.extendedDurationMinutes })} —{" "}
          {t("setup.durationHint")}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            to="/deneme"
            className="rounded-[var(--radius-btn)] bg-accent px-5 py-3 font-semibold text-accent-fg"
          >
            {t("home.startExam")}
          </Link>
          <span className="font-mono text-xs text-fg-muted">
            {cert.acronym} v{cert.syllabusVersion}
          </span>
        </div>
      </section>

      <section
        aria-labelledby="what-is-this"
        className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-surface p-5"
      >
        <h2 id="what-is-this" className="text-base font-semibold">
          {t("home.whatIsThis")}
        </h2>
        <p className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">{t("home.intro")}</p>
      </section>

      <section aria-label={coverageLabel} className="flex flex-col gap-3">
        <p className="text-sm text-fg-muted">{coverageLabel}</p>

        <ScoreBar
          value={cert.coverage.objectivesCovered}
          max={cert.coverage.objectivesTotal}
          size="sm"
          tone="accent"
          ariaLabel={coverageLabel}
        />
      </section>

      {shortfalls.length > 0 ? (
        <section
          aria-labelledby="pool-warning"
          className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-flag/40 bg-flag/10 p-4"
        >
          <h2 id="pool-warning" className="text-base font-semibold">
            {t("home.poolWarningTitle")}
          </h2>
          <p className="max-w-[65ch] text-sm text-fg-muted">
            {t("home.poolWarningBody", {
              available: achievable,
              required: blueprint.totals.questions,
            })}
          </p>

          <ul className="flex flex-col gap-1 text-sm">
            {shortChapters.map(({ chapter, available, required }) => (
              <li key={chapter} className="flex items-baseline justify-between gap-3">
                <span className="text-fg-muted">{t("setup.chapter", { number: chapter })}</span>
                <span className="font-mono">
                  {t("result.score", { points: available, total: required })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

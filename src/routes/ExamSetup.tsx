/**
 * F1-11 — Deneme kurulumu (docs/06 §3.2).
 *
 * Ekranin asil isi, denemenin NE uretecegini basmadan once soylemektir:
 * bolum basina dagilim canli olarak hesaplanir ve havuz yetmiyorsa uyari
 * BURADA cikar (F1-05c). Sessizce eksik deneme uretmek yasak.
 *
 * Sure secenekleri meta.json'dan gelir. Arayuz Turkce ise uzatilmis sure
 * ONCEDEN SECILI gelir: Turkce konusan aday resmi sinavi ana dili olmayan
 * bir dilde verir ve %25 ek sure hakki vardir.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ErrorNotice } from "@/components/ErrorNotice";
import { ScoreBar } from "@/components/ScoreBar";
import { Spinner } from "@/components/Spinner";
import { collectSeenQuestionIds, useExamStore } from "@/features/exam/examStore";
import {
  previewCoverage,
  shortfallsByChapter,
  type GroupShortfall,
} from "@/features/exam/generateExam";
import { contentClient } from "@/lib/content/contentClient";
import { CONTENT_LANGUAGES } from "@/lib/i18n";
import { useAsyncData } from "@/lib/useAsyncData";
import type {
  CertMeta,
  CertificationSummary,
  ExamBlueprint,
  Lang,
  QuestionIndexEntry,
  Syllabus,
} from "@/types/content";

interface SetupData {
  cert: CertificationSummary;
  meta: CertMeta;
  blueprint: ExamBlueprint;
  syllabus: Syllabus;
  pool: QuestionIndexEntry[];
  /** Daha once cozulmus sorular — "gordugumu eleme" onizlemesi icin. */
  seen: Set<string>;
}

interface ChapterRow {
  chapter: number;
  title: Record<Lang, string>;
  required: number;
  available: number;
}

async function loadSetup(): Promise<SetupData> {
  const cert = await contentClient.getActiveCertification();

  const [meta, blueprint, syllabus, index] = await Promise.all([
    contentClient.getMeta(cert.path),
    contentClient.getBlueprint(cert.path),
    contentClient.getSyllabus(cert.path),
    contentClient.getIndex(cert.path),
  ]);

  return {
    cert,
    meta,
    blueprint,
    syllabus,
    pool: index.questions.filter((entry) => entry.status === "published"),
    seen: await collectSeenQuestionIds(meta.id),
  };
}

function buildChapterRows(
  blueprint: ExamBlueprint,
  syllabus: Syllabus,
  shortfalls: GroupShortfall[],
): ChapterRow[] {
  const missing = shortfallsByChapter(shortfalls);

  return syllabus.chapters.map((chapter) => {
    const required = blueprint.totals.byChapter[String(chapter.number)] ?? 0;
    const gap = missing.get(chapter.number) ?? 0;
    return {
      chapter: chapter.number,
      title: chapter.title,
      required,
      available: Math.max(0, required - gap),
    };
  });
}

const CHOICE_ROW =
  "flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 hover:bg-surface-2";

export default function ExamSetup() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const startExam = useExamStore((state) => state.startExam);
  const starting = useExamStore((state) => state.loading);

  const { data, failed } = useAsyncData(loadSetup);
  const [extended, setExtended] = useState(() => i18n.language === "tr");
  const [contentLang, setContentLang] = useState<Lang>(() =>
    i18n.language === "en" ? "en" : "tr",
  );
  const [excludeSeen, setExcludeSeen] = useState(true);
  const [startFailed, setStartFailed] = useState(false);

  // Onizleme, denemeyi gercekten uretecek olan filtreyle ayni havuza
  // bakmali. Aksi halde "gordugumu eleme" aciksa ekran "eksik yok" der,
  // sonra 40 yerine 37 soruluk deneme baslar — kural 8'in ta kendisi.
  const preview = useMemo(() => {
    if (!data) return null;
    const pool = excludeSeen ? data.pool.filter((entry) => !data.seen.has(entry.id)) : data.pool;
    return previewCoverage(data.blueprint, pool);
  }, [data, excludeSeen]);

  const rows = useMemo(
    () =>
      data && preview ? buildChapterRows(data.blueprint, data.syllabus, preview.shortfalls) : [],
    [data, preview],
  );

  if (failed) return <ErrorNotice />;
  if (!data || !preview) return <Spinner />;

  const { cert, meta, blueprint } = data;
  const { total: achievable, shortfalls } = preview;
  const exam = meta.exam;
  const durationMinutes = extended ? exam.extendedDurationMinutes : exam.durationMinutes;
  const canStart = achievable > 0;
  // Uyari, baslatma denenip basarisiz olduysa da gosterilir: dugme olu
  // kalmaz, nedeni yazar.
  const showWarning = startFailed || shortfalls.length > 0;

  async function onStart() {
    setStartFailed(false);

    const attemptId = await startExam({
      certPath: cert.path,
      durationMinutes,
      contentLang,
      excludeSeen,
    });

    if (!attemptId) {
      setStartFailed(true);
      return;
    }

    navigate(`/deneme/${attemptId}`);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      <h1 className="text-[28px] font-semibold leading-tight">{t("setup.title")}</h1>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-base font-semibold">{t("setup.duration")}</legend>

        <label className={CHOICE_ROW}>
          <input
            type="radio"
            name="duration"
            checked={!extended}
            onChange={() => setExtended(false)}
            className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
          />
          <span className="text-[15px]">
            {t("setup.duration60", { minutes: exam.durationMinutes })}
          </span>
        </label>

        <label className={CHOICE_ROW}>
          <input
            type="radio"
            name="duration"
            checked={extended}
            onChange={() => setExtended(true)}
            className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
          />
          <span className="text-[15px]">
            {t("setup.duration75", { minutes: exam.extendedDurationMinutes })}
          </span>
        </label>

        <p className="max-w-[65ch] text-sm text-fg-muted">{t("setup.durationHint")}</p>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-base font-semibold">{t("setup.contentLanguage")}</legend>

        <div className="flex flex-wrap gap-2">
          {CONTENT_LANGUAGES.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 hover:bg-surface-2"
            >
              <input
                type="radio"
                name="content-lang"
                checked={contentLang === option.value}
                onChange={() => setContentLang(option.value)}
                className="size-4 shrink-0 accent-[var(--accent)]"
              />
              <span lang={option.value} className="text-[15px]">
                {option.label}
              </span>
            </label>
          ))}
        </div>

        <p className="max-w-[65ch] text-sm text-fg-muted">{t("setup.contentLanguageHint")}</p>
      </fieldset>

      <label className={CHOICE_ROW}>
        <input
          type="checkbox"
          checked={excludeSeen}
          onChange={(event) => setExcludeSeen(event.target.checked)}
          className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
        />
        <span className="text-[15px]">{t("setup.excludeSeen")}</span>
      </label>

      {showWarning ? (
        <section
          aria-labelledby="setup-pool-warning"
          className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-flag/40 bg-flag/10 p-4"
        >
          <h2 id="setup-pool-warning" className="text-base font-semibold">
            {t("home.poolWarningTitle")}
          </h2>
          <p className="max-w-[65ch] text-sm text-fg-muted">
            {t("home.poolWarningBody", {
              available: achievable,
              required: blueprint.totals.questions,
            })}
          </p>
        </section>
      ) : null}

      <section aria-labelledby="distribution" className="flex flex-col gap-4">
        <h2 id="distribution" className="text-base font-semibold">
          {t("setup.distribution")}
        </h2>

        <ul className="flex flex-col gap-4">
          {rows.map((row) => (
            <li key={row.chapter} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span>
                  <span className="text-fg-muted">
                    {t("setup.chapter", { number: row.chapter })}
                  </span>{" "}
                  <span lang={contentLang}>{row.title[contentLang]}</span>
                </span>
                <span
                  className={`shrink-0 font-mono ${
                    row.available < row.required ? "text-flag" : "text-fg-muted"
                  }`}
                >
                  {t("result.score", { points: row.available, total: row.required })}
                </span>
              </div>

              <ScoreBar
                value={row.available}
                max={row.required}
                size="sm"
                tone="accent"
                reach={row.available}
                ariaLabel={`${t("setup.chapter", { number: row.chapter })}: ${t("result.score", {
                  points: row.available,
                  total: row.required,
                })}`}
              />
            </li>
          ))}
        </ul>

        <p className="flex items-baseline justify-between gap-3 border-t border-border pt-3 text-sm font-semibold">
          <span>{t("setup.distribution")}</span>
          <span className="font-mono">
            {t("result.score", { points: achievable, total: blueprint.totals.questions })}
          </span>
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void onStart()}
          disabled={!canStart || starting}
          className="rounded-[var(--radius-btn)] bg-accent px-5 py-3 font-semibold text-accent-fg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {starting ? t("common.loading") : t("setup.start")}
        </button>

        <span className="text-sm text-fg-muted">
          {t("home.heroSubtitle", {
            count: achievable,
            minutes: durationMinutes,
            pass: exam.passPoints,
            total: exam.totalPoints,
          })}
        </span>
      </div>
    </div>
  );
}

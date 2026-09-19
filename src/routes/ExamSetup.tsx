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

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ScoreBar } from "@/components/ScoreBar";
import { Spinner } from "@/components/Spinner";
import { useExamStore } from "@/features/exam/examStore";
import { previewCoverage, type GroupShortfall } from "@/features/exam/generateExam";
import { contentClient } from "@/lib/content/contentClient";
import type {
  CertMeta,
  CertificationSummary,
  ExamBlueprint,
  Lang,
  Syllabus,
} from "@/types/content";

const CONTENT_LANGUAGES: { value: Lang; label: string }[] = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "English" },
];

interface SetupData {
  cert: CertificationSummary;
  meta: CertMeta;
  blueprint: ExamBlueprint;
  syllabus: Syllabus;
  achievable: number;
  shortfalls: GroupShortfall[];
}

interface ChapterRow {
  chapter: number;
  title: Record<Lang, string>;
  required: number;
  available: number;
}

/**
 * Eksiksiz gruplar hedefleri kadar soru verir; bir bolumun ulasilabilir
 * sayisi yalnizca o bolumdeki eksik gruplarin farki kadar duser.
 */
function buildChapterRows(
  blueprint: ExamBlueprint,
  syllabus: Syllabus,
  shortfalls: GroupShortfall[],
): ChapterRow[] {
  const missing = new Map<number, number>();
  for (const shortfall of shortfalls) {
    const current = missing.get(shortfall.chapter) ?? 0;
    missing.set(shortfall.chapter, current + (shortfall.required - shortfall.available));
  }

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

export default function ExamSetup() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const startExam = useExamStore((state) => state.startExam);
  const starting = useExamStore((state) => state.loading);

  const [data, setData] = useState<SetupData | null>(null);
  const [failed, setFailed] = useState(false);
  const [extended, setExtended] = useState(() => i18n.language === "tr");
  const [contentLang, setContentLang] = useState<Lang>(() =>
    i18n.language === "en" ? "en" : "tr",
  );
  const [excludeSeen, setExcludeSeen] = useState(true);
  const [startFailed, setStartFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const manifest = await contentClient.getManifest();
        const cert =
          manifest.certifications.find((item) => item.status === "active") ??
          manifest.certifications[0];
        if (!cert) throw new Error("manifest has no certification");

        const [meta, blueprint, syllabus, index] = await Promise.all([
          contentClient.getMeta(cert.path),
          contentClient.getBlueprint(cert.path),
          contentClient.getSyllabus(cert.path),
          contentClient.getIndex(cert.path),
        ]);

        const pool = index.questions.filter((entry) => entry.status === "published");
        const preview = previewCoverage(blueprint, pool);

        if (cancelled) return;
        setData({
          cert,
          meta,
          blueprint,
          syllabus,
          achievable: preview.total,
          shortfalls: preview.shortfalls,
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(
    () => (data ? buildChapterRows(data.blueprint, data.syllabus, data.shortfalls) : []),
    [data],
  );

  if (failed) {
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

  if (!data) return <Spinner />;

  const { cert, meta, blueprint, achievable, shortfalls } = data;
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

        <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 hover:bg-surface-2">
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

        <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 hover:bg-surface-2">
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

      <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 hover:bg-surface-2">
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
                  className={
                    row.available < row.required
                      ? "shrink-0 font-mono text-flag"
                      : "shrink-0 font-mono text-fg-muted"
                  }
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

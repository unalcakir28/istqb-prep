/**
 * F1-17 — Exam setup (docs/06 §3.2).
 *
 * The screen's main job is to say WHAT the exam will produce before the
 * candidate starts: the per-chapter distribution is computed live, and if the
 * pool falls short the warning appears RIGHT HERE (F1-05c). Silently
 * generating a short exam is forbidden.
 *
 * Duration options come from meta.json. If the UI is in Turkish, the extended
 * duration comes PRE-SELECTED: a Turkish-speaking candidate takes the real
 * exam in a language that isn't their mother tongue, and is entitled to 25%
 * extra time.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ErrorNotice } from "@/components/ErrorNotice";
import { ScoreBar } from "@/components/ScoreBar";
import { Spinner } from "@/components/Spinner";
import { useSessionStore } from "@/features/session/sessionStore";
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

  const startSession = useSessionStore((state) => state.startSession);
  const starting = useSessionStore((state) => state.loading);

  const { data, failed } = useAsyncData(loadSetup);
  const [extended, setExtended] = useState(() => i18n.language === "tr");
  const [contentLang, setContentLang] = useState<Lang>(() =>
    i18n.language === "en" ? "en" : "tr",
  );
  const [excludeSeen, setExcludeSeen] = useState(true);
  const [startFailed, setStartFailed] = useState(false);

  // The seen set is deliberately NOT applied here. `generateExam`'s `exclude`
  // is a preference, not a filter (`generateExam.ts:29-33`): `preferUnseen`
  // returns `[...unseen, ...seen]` and drops nothing (`:65-74`), so the full
  // pool is exactly what generation can reach whether "avoid what I have seen"
  // is on or off. Previewing over a filtered pool can only invent shortfalls
  // the generator never hits — the screen would announce a short exam and then
  // start a complete one. Re-adding the filter re-opens that bug.
  const preview = useMemo(() => {
    if (!data) return null;
    return previewCoverage(data.blueprint, data.pool);
  }, [data]);

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
  // The warning also shows when starting was attempted and failed: the button
  // never just sits dead, it states the reason.
  const showWarning = startFailed || shortfalls.length > 0;

  async function onStart() {
    setStartFailed(false);

    const attemptId = await startSession({
      certPath: cert.path,
      mode: "exam",
      scope: { kind: "blueprint" },
      contentLang,
      instantFeedback: false,
      durationMinutes,
      excludeSeen,
    });

    if (!attemptId) {
      setStartFailed(true);
      return;
    }

    navigate(`/sinav/${attemptId}`);
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

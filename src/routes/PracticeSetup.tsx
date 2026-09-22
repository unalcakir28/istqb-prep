/**
 * Task 10 — Practice setup.
 *
 * Follows `ExamSetup`'s structure (loading via `useAsyncData`, the same error
 * and spinner states, the same "warn before starting rather than silently
 * shortchange" rule), but the scope is chosen by the candidate instead of
 * being fixed to the official blueprint.
 *
 * The live preview calls `selectQuestions` directly — the same function
 * `startSession` uses internally — rather than reimplementing scope-matching
 * or shortfall logic here. That is the only way the preview can never drift
 * from what actually gets generated, for all three scope kinds (blueprint,
 * chapter, objective), not just the blueprint one `previewCoverage` handles.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ContentLangToggle } from "@/components/ContentLangToggle";
import { ErrorNotice } from "@/components/ErrorNotice";
import { Spinner } from "@/components/Spinner";
import { useSessionStore } from "@/features/session/sessionStore";
import { selectQuestions, type Shortfall } from "@/features/exam/selectQuestions";
import { contentClient } from "@/lib/content/contentClient";
import { useAsyncData } from "@/lib/useAsyncData";
import type {
  CertificationSummary,
  ExamBlueprint,
  Lang,
  Objective,
  QuestionIndexEntry,
  Syllabus,
} from "@/types/content";
import type { AttemptScope } from "@/lib/db/db";

interface SetupData {
  cert: CertificationSummary;
  blueprint: ExamBlueprint;
  syllabus: Syllabus;
  objectives: Objective[];
  pool: QuestionIndexEntry[];
}

type ScopeChoice = "all" | "chapters" | "objective";
type QuestionCount = 10 | 20 | 40;

const QUESTION_COUNTS: QuestionCount[] = [10, 20, 40];

/** A fixed seed keeps the live preview stable while the candidate is still choosing options. */
const PREVIEW_SEED = 1;

async function loadSetup(): Promise<SetupData> {
  const cert = await contentClient.getActiveCertification();

  const [blueprint, syllabus, objectives, index] = await Promise.all([
    contentClient.getBlueprint(cert.path),
    contentClient.getSyllabus(cert.path),
    contentClient.getObjectives(cert.path),
    contentClient.getIndex(cert.path),
  ]);

  return {
    cert,
    blueprint,
    syllabus,
    objectives,
    pool: index.questions.filter((entry) => entry.status === "published"),
  };
}

function buildScope(
  data: SetupData,
  scopeChoice: ScopeChoice,
  count: QuestionCount,
  selectedChapters: number[],
  objectiveCode: string,
): AttemptScope | null {
  if (scopeChoice === "all") {
    // Only the full syllabus at the official count reproduces the blueprint
    // distribution, and that count is read from the blueprint, never hardcoded.
    if (count === data.blueprint.totals.questions) return { kind: "blueprint" };
    const chapters = data.syllabus.chapters.map((chapter) => chapter.number);
    return { kind: "chapter", chapters, count };
  }

  if (scopeChoice === "chapters") {
    if (selectedChapters.length === 0) return null;
    return { kind: "chapter", chapters: selectedChapters, count };
  }

  if (!objectiveCode) return null;
  return { kind: "objective", objectives: [objectiveCode], count };
}

const CHOICE_ROW =
  "flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 hover:bg-surface-2";

const WARNING_BOX =
  "flex flex-col gap-2 rounded-[var(--radius-card)] border border-flag/40 bg-flag/10 p-4";

export default function PracticeSetup() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const startSession = useSessionStore((state) => state.startSession);
  const starting = useSessionStore((state) => state.loading);

  const { data, failed } = useAsyncData(loadSetup);

  const [scopeChoice, setScopeChoice] = useState<ScopeChoice>("all");
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
  const [selectedObjective, setSelectedObjective] = useState("");
  const [count, setCount] = useState<QuestionCount>(10);
  const [instantFeedback, setInstantFeedback] = useState(true);
  const [contentLang, setContentLang] = useState<Lang>(() =>
    i18n.language === "en" ? "en" : "tr",
  );
  const [startFailed, setStartFailed] = useState(false);

  // No objective is selected yet on first render, so fall back to the first one.
  const objectiveCode = selectedObjective || (data?.objectives[0]?.code ?? "");

  const scope = useMemo<AttemptScope | null>(() => {
    if (!data) return null;
    return buildScope(data, scopeChoice, count, selectedChapters, objectiveCode);
  }, [data, scopeChoice, count, selectedChapters, objectiveCode]);

  // Same function `startSession` calls internally, so the preview and the
  // actual generation can never disagree — for any of the three scope kinds.
  const preview = useMemo(() => {
    if (!data || !scope) return null;
    return selectQuestions({
      scope,
      blueprint: data.blueprint,
      pool: data.pool,
      seed: PREVIEW_SEED,
    });
  }, [data, scope]);

  if (failed) return <ErrorNotice />;
  if (!data) return <Spinner />;

  const { cert, syllabus, objectives } = data;
  const chaptersMissing = scopeChoice === "chapters" && selectedChapters.length === 0;
  const achievable = preview?.questionIds.length ?? 0;
  const requiredTotal = scope?.kind === "blueprint" ? data.blueprint.totals.questions : count;
  const canStart = !!scope && achievable > 0;

  const shortfalls = preview?.shortfalls ?? [];
  const groupShortfall = shortfalls.some((item) => item.kind === "group");
  const scopeShortfall = shortfalls.find(
    (item): item is Extract<Shortfall, { kind: "scope" }> => item.kind === "scope",
  );
  // Rule 8 (never silently short): both shortfall shapes render, not just the
  // blueprint one. A failed start is NOT one of them — it says nothing about
  // the pool and gets its own message, so this box never opens with no body.
  const showShortfall = groupShortfall || !!scopeShortfall;

  function toggleChapter(number: number) {
    setSelectedChapters((current) =>
      current.includes(number)
        ? current.filter((value) => value !== number)
        : [...current, number].sort((a, b) => a - b),
    );
  }

  async function onStart() {
    if (!scope) return;
    setStartFailed(false);

    const attemptId = await startSession({
      certPath: cert.path,
      mode: "practice",
      scope,
      contentLang,
      instantFeedback,
      durationMinutes: null,
      excludeSeen: false,
    });

    if (!attemptId) {
      setStartFailed(true);
      return;
    }

    navigate(`/alistirma/${attemptId}`);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      <h1 className="text-[28px] font-semibold leading-tight">{t("practice.setupTitle")}</h1>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-base font-semibold">{t("practice.scope")}</legend>

        <label className={CHOICE_ROW}>
          <input
            type="radio"
            name="scope"
            checked={scopeChoice === "all"}
            onChange={() => setScopeChoice("all")}
            className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
          />
          <span className="text-[15px]">{t("practice.scopeAll")}</span>
        </label>

        <label className={CHOICE_ROW}>
          <input
            type="radio"
            name="scope"
            checked={scopeChoice === "chapters"}
            onChange={() => setScopeChoice("chapters")}
            className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
          />
          <span className="text-[15px]">{t("practice.scopeChapters")}</span>
        </label>

        {scopeChoice === "chapters" ? (
          <div className="ml-4 flex flex-col gap-2 border-l border-border pl-4">
            {syllabus.chapters.map((chapter) => (
              <label key={chapter.number} className={CHOICE_ROW}>
                <input
                  type="checkbox"
                  checked={selectedChapters.includes(chapter.number)}
                  onChange={() => toggleChapter(chapter.number)}
                  className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
                />
                <span className="text-[15px]">
                  <span className="text-fg-muted">
                    {t("setup.chapter", { number: chapter.number })}
                  </span>{" "}
                  <span lang={contentLang}>{chapter.title[contentLang]}</span>
                </span>
              </label>
            ))}

            {chaptersMissing ? (
              <p role="alert" className="text-sm text-flag">
                {t("practice.pickAtLeastOneChapter")}
              </p>
            ) : null}
          </div>
        ) : null}

        <label className={CHOICE_ROW}>
          <input
            type="radio"
            name="scope"
            checked={scopeChoice === "objective"}
            onChange={() => setScopeChoice("objective")}
            className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
          />
          <span className="text-[15px]">{t("practice.scopeObjective")}</span>
        </label>

        {scopeChoice === "objective" ? (
          <div className="ml-4 border-l border-border pl-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-fg-muted">{t("question.objective")}</span>
              <select
                value={objectiveCode}
                onChange={(event) => setSelectedObjective(event.target.value)}
                className="min-h-11 rounded-[var(--radius-btn)] border border-border bg-surface px-3 text-[15px]"
              >
                {objectives.map((objective) => (
                  <option key={objective.code} value={objective.code}>
                    {objective.code} — {objective.text[contentLang]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-base font-semibold">{t("practice.questionCount")}</legend>

        <div className="flex flex-wrap gap-2">
          {QUESTION_COUNTS.map((value) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 hover:bg-surface-2"
            >
              <input
                type="radio"
                name="count"
                checked={count === value}
                onChange={() => setCount(value)}
                className="size-4 shrink-0 accent-[var(--accent)]"
              />
              <span className="text-[15px]">{value}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-base font-semibold">{t("setup.contentLanguage")}</legend>
        <ContentLangToggle value={contentLang} onChange={setContentLang} />
      </fieldset>

      <div className="flex flex-col gap-2">
        <label className={CHOICE_ROW}>
          <input
            type="checkbox"
            checked={instantFeedback}
            onChange={(event) => setInstantFeedback(event.target.checked)}
            className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
          />
          <span className="text-[15px]">{t("practice.instantFeedback")}</span>
        </label>

        <p className="max-w-[65ch] text-sm text-fg-muted">{t("practice.instantFeedbackHelp")}</p>
      </div>

      {startFailed ? (
        <section role="alert" aria-labelledby="practice-start-error" className={WARNING_BOX}>
          <h2 id="practice-start-error" className="text-base font-semibold">
            {t("practice.startFailedTitle")}
          </h2>

          <p className="max-w-[65ch] text-sm text-fg-muted">{t("practice.startFailedBody")}</p>
        </section>
      ) : null}

      {/* WCAG 4.1.3, and the accessibility face of rule 8: ticking a chapter
          can make this warning appear, change its numbers or take it away
          again, with focus still on the checkbox and nothing said. A blind
          candidate was being silently shortchanged by the very screen that
          exists to stop that.

          The region is rendered on EVERY pass and only its contents swap: a
          live region inserted with its text already inside it is the region's
          initial state and is entitled to say nothing. While it is empty it is
          `sr-only`, which takes it out of the flex flow (absolute positioning)
          so no gap opens where a warning is not. */}
      <section role="status" className={showShortfall ? WARNING_BOX : "sr-only"}>
        {showShortfall ? (
          <>
            <h2 className="text-base font-semibold">{t("practice.poolWarningTitle")}</h2>

            {groupShortfall ? (
              <p className="max-w-[65ch] text-sm text-fg-muted">
                {t("practice.poolWarningBody", { available: achievable, required: requiredTotal })}
              </p>
            ) : null}

            {scopeShortfall ? (
              <p className="max-w-[65ch] text-sm text-fg-muted">
                {t("session.shortfallScope", {
                  count: scopeShortfall.available,
                  required: scopeShortfall.required,
                  available: scopeShortfall.available,
                })}
              </p>
            ) : null}
          </>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void onStart()}
          disabled={!canStart || starting}
          className="rounded-[var(--radius-btn)] bg-accent px-5 py-3 font-semibold text-accent-fg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {starting ? t("common.loading") : t("practice.start")}
        </button>

        {/* The same change moves this number, so it is announced too — and it
            says what it counts. It used to borrow `result.score` and read out
            as a bare "10 / 10": a SCORE key on a COVERAGE number, with no
            label to make the announcement mean anything.

            Hidden from the accessibility tree while the warning above is up:
            the two carry the SAME two figures, so every chapter tick that
            produces a shortfall was announcing the same fact twice in a row.
            The warning is the one that explains it, this is the only signal
            in the healthy state, and neither can be dropped outright — so the
            count stands down while the warning speaks. It stays visible
            either way; `aria-hidden` does not hide it from the screen. */}
        <span
          role="status"
          aria-hidden={showShortfall ? true : undefined}
          className="text-sm text-fg-muted"
        >
          {t("practice.achievableCount", { available: achievable, required: requiredTotal })}
        </span>
      </div>
    </div>
  );
}

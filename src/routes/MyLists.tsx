/**
 * F2-07 — the saved lists: my mistakes, my flagged questions, and the ones I
 * have never got right twice in a row.
 *
 * Nothing here is a new store. Every list is a view over the answers already
 * in IndexedDB, computed by `buildQuestionHistory`, so a list can never drift
 * from what actually happened in a session.
 *
 * Each list is a set of question ids, which is exactly what the `questions`
 * scope takes — so "practise this list" is the same machinery as "retry the
 * ones you missed" on the result screen, not a second path through selection.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ErrorNotice } from "@/components/ErrorNotice";
import { Spinner } from "@/components/Spinner";
import { routeForAttempt } from "@/features/session/routeForAttempt";
import { useSessionStore } from "@/features/session/sessionStore";
import { contentClient } from "@/lib/content/contentClient";
import type { QuestionSetSource } from "@/lib/db/db";
import { buildQuestionHistory, latestEntry, listsFor } from "@/lib/db/questionHistory";
import { useArrivalFocus } from "@/lib/useArrivalFocus";
import { useAsyncData } from "@/lib/useAsyncData";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import type { Lang, Question } from "@/types/content";

/** One row: the question, and when it was last answered. */
interface Row {
  question: Question;
  lastAt: number;
}

interface ListsData {
  certPath: string;
  /** Every list, keyed by its source — the same key the attempt stores. */
  rows: Record<QuestionSetSource, Row[]>;
  /** True when the candidate has never submitted a session. */
  empty: boolean;
}

const EMPTY_ROWS: Record<QuestionSetSource, Row[]> = { wrong: [], flagged: [], shaky: [] };

/** The i18n key of each list's title and of its empty state. */
const LIST_KEYS: Record<QuestionSetSource, { title: string; empty: string }> = {
  wrong: { title: "lists.wrongTitle", empty: "lists.wrongEmpty" },
  flagged: { title: "lists.flaggedTitle", empty: "lists.flaggedEmpty" },
  shaky: { title: "lists.shakyTitle", empty: "lists.shakyEmpty" },
};

const ORDER: QuestionSetSource[] = ["wrong", "flagged", "shaky"];

async function loadLists(): Promise<ListsData> {
  const cert = await contentClient.getActiveCertification();
  const index = await contentClient.getIndex(cert.path);

  // Every question in the index, not only the published ones: a question
  // retired since it was answered still belongs on the list that says what the
  // candidate got wrong. Whether it can be asked again is selection's problem.
  const questions = await contentClient.getQuestions(
    cert.path,
    index.questions.map((entry) => entry.id),
  );

  const histories = await buildQuestionHistory(cert.id, questions);
  if (histories.length === 0) {
    return { certPath: cert.path, rows: EMPTY_ROWS, empty: true };
  }

  const byId = new Map(questions.map((question) => [question.id, question]));
  const rows: Record<QuestionSetSource, Row[]> = { wrong: [], flagged: [], shaky: [] };

  for (const history of histories) {
    const question = byId.get(history.questionId);
    const latest = latestEntry(history);
    if (!question || !latest) continue;

    for (const key of listsFor(history)) {
      rows[key].push({ question, lastAt: latest.at });
    }
  }

  // Most recently answered first: the session just finished is what the
  // candidate came here about.
  for (const key of ORDER) rows[key].sort((a, b) => b.lastAt - a.lastAt);

  return { certPath: cert.path, rows, empty: false };
}

/** The stem, cut to a length that keeps a list scannable. */
function snippet(question: Question, lang: Lang): string {
  const stem = question.i18n[lang]?.stem ?? question.i18n.en?.stem ?? "";
  if (stem.length <= 120) return stem;

  return `${stem.slice(0, 120).trimEnd()}…`;
}

export default function MyLists() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const startSession = useSessionStore((state) => state.startSession);
  const { data, failed, reload } = useAsyncData(loadLists);
  const [starting, setStarting] = useState<QuestionSetSource | null>(null);

  useDocumentTitle(t("lists.title"));
  // Clicking "Listelerim" in the nav is a route swap inside a Suspense
  // boundary — no page load fires, so nothing would tell a screen-reader user
  // they arrived anywhere.
  const headingRef = useArrivalFocus<HTMLHeadingElement>(Boolean(data));

  if (failed) return <ErrorNotice onRetry={reload} />;
  if (!data) return <Spinner />;

  const lang: Lang = i18n.language === "en" ? "en" : "tr";

  async function practise(source: QuestionSetSource, questionIds: string[]) {
    if (!data) return;
    // `aria-disabled` keeps the button focusable — a native `disabled` drops
    // focus to <body> the moment it is clicked and strands a keyboard user
    // mid-action. It does not block the click, so the guard is here.
    if (starting !== null) return;

    const scope = { kind: "questions" as const, questionIds, source };

    setStarting(source);
    const attemptId = await startSession({
      certPath: data.certPath,
      mode: "practice",
      scope,
      contentLang: lang,
      // A list is revision, so the reasoning is the point.
      instantFeedback: true,
      durationMinutes: null,
      // Every question on a list was seen by definition.
      excludeSeen: false,
    });

    if (!attemptId) {
      setStarting(null);
      return;
    }

    navigate(routeForAttempt({ id: attemptId, mode: "practice", scope }));
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-2">
        <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-semibold leading-tight">
          {t("lists.title")}
        </h1>
        <p className="max-w-[60ch] text-[15px] text-fg-muted">{t("lists.intro")}</p>
      </header>

      {data.empty ? (
        <p className="rounded-[var(--radius-card)] border border-border bg-surface p-5 text-[15px]">
          {t("lists.noSessions")}
        </p>
      ) : null}

      {ORDER.map((source) => {
        const rows = data.rows[source];
        const keys = LIST_KEYS[source];
        const headingId = `list-${source}`;

        return (
          <section key={source} aria-labelledby={headingId} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <h2 id={headingId} className="text-lg font-semibold">
                {t(keys.title)}{" "}
                <span className="font-mono text-base font-normal text-fg-muted">{rows.length}</span>
              </h2>

              {rows.length > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    void practise(
                      source,
                      rows.map((row) => row.question.id),
                    )
                  }
                  aria-disabled={starting !== null}
                  className="rounded-[var(--radius-btn)] border border-accent/50 px-4 py-2 text-sm font-medium hover:bg-surface-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                >
                  {starting === source
                    ? t("common.loading")
                    : t("lists.practise", { count: rows.length })}
                </button>
              ) : null}
            </div>

            {rows.length === 0 ? (
              <p className="text-[15px] text-fg-muted">{t(keys.empty)}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {rows.map((row) => (
                  <li
                    key={row.question.id}
                    className="flex flex-col gap-1.5 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3"
                  >
                    <span className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                      <span className="font-mono">{row.question.id}</span>
                      {row.question.objectives.map((code) => (
                        <span
                          key={code}
                          className="rounded-[var(--radius-badge)] border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono font-medium text-accent"
                        >
                          {code}
                        </span>
                      ))}
                    </span>

                    <span lang={lang} className="text-[15px] leading-relaxed">
                      {snippet(row.question, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

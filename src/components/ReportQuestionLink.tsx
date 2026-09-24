/**
 * F2-08 — reporting a problem with a question.
 *
 * There is no backend to receive a report (rule 7), so the link opens a
 * pre-filled GitHub issue. That is not a workaround: a report about a question
 * belongs in public next to the question's own history, where it can be
 * discussed, linked to a fix and closed.
 *
 * What the candidate sees is a link, not a form. Everything the maintainer
 * needs — which question, which syllabus version, which language they were
 * reading, what they had selected — is already known here, and asking a person
 * to retype it is how reports stop being actionable.
 */

import { useTranslation } from "react-i18next";

import { REPO_URL } from "@/lib/product";
import type { Lang, Question } from "@/types/content";

interface Props {
  question: Question;
  lang: Lang;
  selected: string[];
}

/**
 * The issue body. English on purpose: it is a bug report to a repository, not
 * a product string, and the maintainer triages in one language.
 *
 * `selected` is included because a wrong keyed answer and a misleading option
 * look identical in a report that omits what the reporter actually picked.
 *
 * Every option is named by its AUTHORED id — the one in the chunk file, which
 * is what the maintainer opens. The reporter saw the options shuffled (D-03),
 * so "the second one" or "the first one" in their own words means nothing
 * without the order they were shown in; that order is written out too, top to
 * bottom, in authored ids.
 */
function issueBody(question: Question, lang: Lang, selected: string[]): string {
  const shown = (question.i18n[lang]?.options ?? []).map((option) => option.id);

  return [
    "<!-- Describe the problem below. Everything under the line is filled in automatically. -->",
    "",
    "",
    "---",
    `- Question: \`${question.id}\``,
    `- Objectives: ${question.objectives.join(", ")}`,
    `- Syllabus: ${question.syllabusRef} (v${question.syllabusVersion})`,
    `- Reading in: ${lang}`,
    `- Options shown, top to bottom (authored ids): ${shown.join(", ")}`,
    `- Selected (authored ids): ${selected.length > 0 ? selected.join(", ") : "nothing"}`,
    `- Keyed answer (authored ids): ${question.correct.join(", ")}`,
  ].join("\n");
}

export function ReportQuestionLink({ question, lang, selected }: Props) {
  const { t } = useTranslation();

  const href = `${REPO_URL}/issues/new?${new URLSearchParams({
    title: `Question ${question.id}: `,
    body: issueBody(question, lang, selected),
    labels: "question-report",
  }).toString()}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      // The question id is in the accessible name because a review screen
      // renders one of these per question, and forty links all reading
      // "Report a problem" tell a screen-reader user nothing about which.
      aria-label={t("review.reportLabel", { id: question.id })}
      className="w-fit text-xs text-fg-muted underline underline-offset-2 hover:text-fg"
    >
      {t("review.report")}
    </a>
  );
}

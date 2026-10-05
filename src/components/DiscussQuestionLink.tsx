/**
 * F4-06 — talking a question over with other candidates.
 *
 * A link, not an embed. An embedded thread (giscus and the like) would load
 * GitHub's script on every rationale panel and hand it the visit, which rule 7
 * forbids; a link sends nothing until the candidate follows it, the same
 * trade the report link makes (F2-08).
 *
 * It opens the repository's Discussions searched for the question's id, so
 * an existing thread is found before a new one is started; a thread is named
 * after the id for that reason (CONTRIBUTING.md). It sits in the rationale
 * panel only — after the answer is shown — because a thread about a question
 * discusses its key.
 */

import { useTranslation } from "react-i18next";

import { REPO_URL } from "@/lib/product";

function discussionUrl(questionId: string): string {
  return `${REPO_URL}/discussions?${new URLSearchParams({ discussions_q: `"${questionId}"` }).toString()}`;
}

export function DiscussQuestionLink({ questionId }: { questionId: string }) {
  const { t } = useTranslation();

  return (
    <a
      href={discussionUrl(questionId)}
      target="_blank"
      rel="noreferrer noopener"
      // Named after the question for the same reason as the report link: the
      // review screen renders one per question.
      aria-label={t("review.discussLabel", { id: questionId })}
      className="w-fit text-xs text-fg-muted underline underline-offset-2 hover:text-fg"
    >
      {t("review.discuss")}
    </a>
  );
}

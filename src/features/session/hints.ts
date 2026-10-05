/**
 * F3-09 — what the hint ladder's middle step shows for one question.
 *
 * The ladder is nudge -> hint -> solution, and none of it is new content:
 * the nudge is the question's learning objective, the solution is the answer
 * with its rationale. The hint is the question's own authored `hints` where
 * it has them (30 published CTFL questions, no CT-AI one, on 05.10.2026),
 * and otherwise one wrong option taken away.
 *
 * The option is taken away WITHOUT its rationale (D-07). The rationales are
 * written to be read beside the key, and many name it: a sweep of one third
 * of the CTFL pool found 15 wrong-option rationales in 13 questions that
 * quote or paraphrase the keyed option. Shown before the answer, any of them
 * would have handed the key over. The rationale waits for the reveal, where
 * it was always meant to be read.
 *
 * The option taken away is the first wrong one in the order shown, whatever
 * the candidate has picked. Following the picks would let a multi-select
 * question be probed — tick one, see whether the hint moves — and answered
 * correctly without the cost of the last step.
 */

import type { Lang, Question } from "@/types/content";

export type Hint =
  | { kind: "authored"; texts: string[] }
  | { kind: "eliminate"; optionId: string; optionText: string };

export function hintFor(question: Question, lang: Lang): Hint | null {
  const content = question.i18n[lang];
  if (!content) return null;

  const authored = content.hints?.filter((text) => text.trim() !== "") ?? [];
  if (authored.length > 0) return { kind: "authored", texts: authored };

  const target = content.options.find((option) => !question.correct.includes(option.id));
  if (!target) return null;

  return { kind: "eliminate", optionId: target.id, optionText: target.text };
}

/**
 * F3-14 — the same hint in the side-by-side mode's second language: the
 * other language's authored hints, or the same option (by id) in that
 * language. Null when that language does not carry the same kind of hint,
 * so the two never disagree.
 */
export function hintIn(question: Question, hint: Hint, lang: Lang): Hint | null {
  const content = question.i18n[lang];
  if (!content) return null;

  if (hint.kind === "authored") {
    const other = hintFor(question, lang);
    return other?.kind === "authored" ? other : null;
  }

  const option = content.options.find((item) => item.id === hint.optionId);
  if (!option) return null;

  return { kind: "eliminate", optionId: option.id, optionText: option.text };
}

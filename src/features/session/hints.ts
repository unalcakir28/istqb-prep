/**
 * F3-09 — what the hint ladder's middle step shows for one question.
 *
 * The ladder is nudge -> hint -> solution, and none of it is new content:
 * the nudge is the question's learning objective, the solution is the answer
 * with its rationale. The hint is the question's own authored `hints` where
 * it has them (30 published CTFL questions, no CT-AI one, on 05.10.2026),
 * and otherwise one wrong option taken away,
 * with the rationale that says what that option actually describes — the
 * reviewed text the product already ships for every option (rule 2).
 *
 * The option taken away is the first wrong one in the order shown, whatever
 * the candidate has picked. Following the picks would let a multi-select
 * question be probed — tick one, see whether the hint moves — and answered
 * correctly without the cost of the last step.
 */

import type { Lang, Question } from "@/types/content";

export type Hint =
  | { kind: "authored"; texts: string[] }
  | { kind: "eliminate"; optionText: string; rationale: string };

export function hintFor(question: Question, lang: Lang): Hint | null {
  const content = question.i18n[lang];
  if (!content) return null;

  const authored = content.hints?.filter((text) => text.trim() !== "") ?? [];
  if (authored.length > 0) return { kind: "authored", texts: authored };

  const wrong = content.options.filter((option) => !question.correct.includes(option.id));
  const target = wrong[0];
  if (!target) return null;

  const rationale = content.rationale.byOption[target.id];
  if (!rationale) return null;

  return { kind: "eliminate", optionText: target.text, rationale };
}

/**
 * D-03 — Option order, shuffled per attempt.
 *
 * Authored order used to reach the candidate unchanged, so any habit in how a
 * writer placed the key (always "a", or a rotation a → c → b → d down a chunk)
 * was a cue that scored without reading the stem. Shuffling per attempt makes
 * the key's displayed position independent of the file.
 *
 * The order is DERIVED, never stored: the attempt's seed and the question id
 * fully determine it. That is what keeps a resumed session, the result screen
 * and the review screen showing each question's options in the order the
 * candidate saw them, and it is why attempts written before this change need
 * no migration — their stored seed gives them an order too, the same one on
 * every load.
 *
 * Nothing downstream depends on position: answers, `correct`,
 * `rationale.byOption` and scoring are all keyed by option id. The one thing
 * that follows position is what the candidate sees — the number on the row,
 * the 1-9 shortcut and the label in the rationale panel — and those read the
 * reordered list, so they follow the displayed order by construction.
 */

import type { Lang, Question, QuestionContent } from "@/types/content";

import { createRng, shuffle } from "./rng";

/**
 * FNV-1a over the question id, started from the attempt seed.
 *
 * One 32-bit value per (attempt, question) pair: two questions in one attempt
 * get unrelated orders, and the same question in two attempts does too.
 */
export function optionSeed(seed: number, questionId: string): number {
  let hash = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < questionId.length; i += 1) {
    hash ^= questionId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * The option ids of one question in the order this attempt shows them.
 *
 * Taken from one language only: check #6 guarantees TR and EN carry the same
 * ids in the same order, and one permutation applied to both is what keeps a
 * side-by-side row, and a language switch mid-question, on the same option.
 */
export function optionOrder(question: Question, seed: number): string[] {
  const authored = (question.i18n.tr ?? question.i18n.en)?.options ?? [];
  const ids = authored.map((option) => option.id);
  if (ids.length < 2) return ids;

  return shuffle(ids, createRng(optionSeed(seed, question.id)));
}

/** A copy of the question with every language's options in this attempt's order. */
export function withOptionOrder(question: Question, seed: number): Question {
  const order = optionOrder(question, seed);
  if (order.length < 2) return question;

  // An id missing from the order (a language out of step with the other,
  // which check #6 rejects) sorts last rather than vanishing.
  const rank = new Map(order.map((id, index) => [id, index]));
  const rankOf = (id: string) => rank.get(id) ?? order.length;

  const i18n = {} as Record<Lang, QuestionContent>;
  for (const [lang, content] of Object.entries(question.i18n) as [Lang, QuestionContent][]) {
    const options = [...content.options].sort((a, b) => rankOf(a.id) - rankOf(b.id));
    i18n[lang] = { ...content, options };
  }

  return { ...question, i18n };
}

/**
 * F1-06 — Deneme puanlama.
 *
 * Kurallar resmi sinavdan gelir ve buraya sabit yazilmaz:
 * - Her soru TAM OLARAK 1 puandir; Foundation'da cok puanli soru yoktur.
 * - Coktan secmeli (`multi`) sorularda puanlama TAM ESLESMEdir — kismi puan
 *   yoktur. Iki dogrudan birini isaretlemek 0 puandir.
 * - Baraj `meta.json`'dan okunur (CTFL v4.0.1 icin 26/40), koda gomulmez.
 * - Negatif puanlama hicbir resmi dokumanda gecmiyor; `negativeMarking: null`
 *   oldugu icin yanlis cevap yalnizca 0 puan getirir, puan dusurmez.
 */

import type { CertMeta, Question } from "@/types/content";

/** Kullanicinin bir soruya verdigi cevap: secilen sik ID'leri. */
export type AnswerMap = Record<string, string[]>;

export interface QuestionOutcome {
  questionId: string;
  chapter: number;
  objectives: string[];
  kLevel: string;
  selected: string[];
  correct: string[];
  isCorrect: boolean;
  /** Hic sik isaretlenmemis soru — yanlistan ayri raporlanir. */
  isUnanswered: boolean;
  points: number;
}

export interface Breakdown {
  correct: number;
  total: number;
  percent: number;
}

export interface ExamScore {
  points: number;
  totalPoints: number;
  percent: number;
  passPoints: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  byChapter: Record<number, Breakdown>;
  byObjective: Record<string, Breakdown>;
  byKLevel: Record<string, Breakdown>;
  outcomes: QuestionOutcome[];
}

/** Sira bagimsiz tam kume esitligi. */
function isExactMatch(selected: readonly string[], correct: readonly string[]): boolean {
  if (selected.length !== correct.length) return false;

  const expected = new Set(correct);
  if (expected.size !== correct.length) return false;

  const seen = new Set<string>();
  for (const id of selected) {
    if (!expected.has(id)) return false;
    if (seen.has(id)) return false;
    seen.add(id);
  }

  return true;
}

function bump(table: Record<string | number, Breakdown>, key: string | number, hit: boolean): void {
  const entry = (table[key] ??= { correct: 0, total: 0, percent: 0 });
  entry.total += 1;
  if (hit) entry.correct += 1;
}

function finalize(table: Record<string | number, Breakdown>): void {
  for (const entry of Object.values(table)) {
    entry.percent = entry.total === 0 ? 0 : Math.round((entry.correct / entry.total) * 100);
  }
}

export function scoreExam(questions: Question[], answers: AnswerMap, meta: CertMeta): ExamScore {
  const byChapter: Record<number, Breakdown> = {};
  const byObjective: Record<string, Breakdown> = {};
  const byKLevel: Record<string, Breakdown> = {};
  const outcomes: QuestionOutcome[] = [];

  let points = 0;
  let correctCount = 0;
  let unansweredCount = 0;

  for (const question of questions) {
    const selected = answers[question.id] ?? [];
    const isUnanswered = selected.length === 0;
    const isCorrect = !isUnanswered && isExactMatch(selected, question.correct);
    const earned = isCorrect ? question.points : 0;

    points += earned;
    if (isCorrect) correctCount += 1;
    if (isUnanswered) unansweredCount += 1;

    bump(byChapter, question.chapter, isCorrect);
    bump(byKLevel, question.kLevel, isCorrect);
    for (const code of question.objectives) bump(byObjective, code, isCorrect);

    outcomes.push({
      questionId: question.id,
      chapter: question.chapter,
      objectives: question.objectives,
      kLevel: question.kLevel,
      selected,
      correct: question.correct,
      isCorrect,
      isUnanswered,
      points: earned,
    });
  }

  finalize(byChapter);
  finalize(byObjective);
  finalize(byKLevel);

  // Toplam puan, cevaplanan soru sayisindan degil sorulan sorulardan gelir:
  // eksik uretilmis bir denemede baraj yine resmi degerle karsilastirilir.
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
  const passPoints = meta.exam.passPoints;

  return {
    points,
    totalPoints,
    percent: totalPoints === 0 ? 0 : Math.round((points / totalPoints) * 100),
    passPoints,
    passed: points >= passPoints,
    correctCount,
    incorrectCount: questions.length - correctCount - unansweredCount,
    unansweredCount,
    byChapter,
    byObjective,
    byKLevel,
    outcomes,
  };
}

/** Sonuc ekranindaki "en zayif 3 ogrenme hedefi" icin. */
export function weakestObjectives(score: ExamScore, limit = 3): string[] {
  return Object.entries(score.byObjective)
    .filter(([, breakdown]) => breakdown.total > 0 && breakdown.correct < breakdown.total)
    .sort((a, b) => a[1].percent - b[1].percent || b[1].total - a[1].total)
    .slice(0, limit)
    .map(([code]) => code);
}

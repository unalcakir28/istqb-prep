/**
 * Sinav oturumu durumu (Zustand) + IndexedDB kaliciligi.
 *
 * Tasarim notlari:
 * - Sayac `deadlineAt` (mutlak zaman damgasi) uzerinden yurur. Kalan sureyi
 *   saymak yerine bitis anini saklamak, sekme arka plana alindiginda veya
 *   cihaz uykuya gectiginde surenin kaymasini onler (F1-08).
 * - Her cevap aninda IndexedDB'ye yazilir; yenileme veya kaza ile kapatma
 *   sonrasi oturum kurtarilabilir (F1-10).
 * - Icerik dili oturum icinde degisebilir ve cevabi ETKILEMEZ: secim soru
 *   ID'si + sik ID'si uzerinden tutulur, metin uzerinden degil.
 */

import { create } from "zustand";

import type { CertMeta, Lang, Question, QuestionIndexEntry } from "@/types/content";
import { contentClient } from "@/lib/content/contentClient";
import { db, getResponses, saveResponse, type Attempt } from "@/lib/db/db";
import { generateExam, type GroupShortfall } from "./generateExam";
import { randomSeed } from "./rng";
import { scoreExam, type AnswerMap, type ExamScore } from "./scoreExam";

export interface StartExamOptions {
  certPath: string;
  durationMinutes: number;
  contentLang: Lang;
  excludeSeen: boolean;
}

interface ExamState {
  attempt: Attempt | null;
  questions: Question[];
  answers: AnswerMap;
  flagged: Record<string, boolean>;
  currentIndex: number;
  contentLang: Lang;
  shortfalls: GroupShortfall[];
  meta: CertMeta | null;
  score: ExamScore | null;
  loading: boolean;
  error: string | null;
  /** IndexedDB yazmasi basarisiz oldu — ilerleme diske gitmiyor (F3-12). */
  persistFailed: boolean;

  startExam: (options: StartExamOptions) => Promise<string | null>;
  resumeAttempt: (attemptId: string) => Promise<boolean>;
  loadSubmitted: (attemptId: string) => Promise<boolean>;
  select: (questionId: string, optionId: string) => void;
  toggleFlag: (questionId: string) => void;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
  setContentLang: (lang: Lang) => void;
  submit: (auto?: boolean) => Promise<void>;
}

const initial = {
  attempt: null,
  questions: [],
  answers: {},
  flagged: {},
  currentIndex: 0,
  contentLang: "tr" as Lang,
  shortfalls: [],
  meta: null,
  score: null,
  loading: false,
  error: null,
  persistFailed: false,
};

/** Daha once gorulmus sorular — yeni denemede tekrar sorulmamasi tercih edilir. */
export async function collectSeenQuestionIds(certId: string): Promise<Set<string>> {
  const attempts = await db.attempts.where({ certId }).toArray();
  const seen = new Set<string>();

  for (const attempt of attempts) {
    if (attempt.status !== "submitted") continue;
    for (const id of attempt.questionIds) seen.add(id);
  }

  return seen;
}

/**
 * Cevap ve isaret yazmalari "ates et unut" calisir: kullanici yazmanin
 * bitmesini beklemez. Ama hata yutulmaz — gizli sekmede veya depolama
 * kapaliyken yazma patlar, ekranda cevap secili gorunur ve yenilemede
 * kaybolurdu. Bayrak kaldirilir, sinav ekrani kullaniciya soyler.
 */
function persist(
  set: (partial: Partial<ExamState>) => void,
  attemptId: string,
  questionId: string,
  row: { selected: string[]; flagged: boolean },
): void {
  saveResponse(attemptId, questionId, row).catch(() => set({ persistFailed: true }));
}

export const useExamStore = create<ExamState>((set, get) => ({
  ...initial,

  async startExam({ certPath, durationMinutes, contentLang, excludeSeen }) {
    set({ loading: true, error: null });

    try {
      const [meta, blueprint, index] = await Promise.all([
        contentClient.getMeta(certPath),
        contentClient.getBlueprint(certPath),
        contentClient.getIndex(certPath),
      ]);

      // Yalnizca yayinlanmis sorular havuza girer; taslak soru sinavda cikmaz.
      const pool: QuestionIndexEntry[] = index.questions.filter(
        (entry) => entry.status === "published",
      );
      const exclude = excludeSeen ? await collectSeenQuestionIds(meta.id) : new Set<string>();
      const seed = randomSeed();
      const generated = generateExam({ blueprint, pool, seed, exclude });

      if (generated.questionIds.length === 0) {
        set({ loading: false, error: "empty-pool", shortfalls: generated.shortfalls });
        return null;
      }

      const questions = await contentClient.getQuestions(certPath, generated.questionIds);
      const now = Date.now();
      const attempt: Attempt = {
        id: `attempt-${now}-${seed}`,
        certId: meta.id,
        seed,
        questionIds: generated.questionIds,
        status: "in-progress",
        durationMinutes,
        contentLang,
        startedAt: now,
        deadlineAt: now + durationMinutes * 60_000,
        syllabusVersion: meta.syllabusVersion,
        dataVersion: index.dataVersion,
      };

      await db.attempts.put(attempt);

      set({
        attempt,
        questions,
        answers: {},
        flagged: {},
        currentIndex: 0,
        contentLang,
        shortfalls: generated.shortfalls,
        meta,
        score: null,
        loading: false,
        error: null,
      });

      return attempt.id;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      return null;
    }
  },

  async resumeAttempt(attemptId) {
    set({ loading: true, error: null });

    try {
      const attempt = await db.attempts.get(attemptId);
      if (!attempt) {
        set({ loading: false, error: "not-found" });
        return false;
      }

      const certPath = attempt.certId;
      const [meta, questions, responses] = await Promise.all([
        contentClient.getMeta(certPath),
        contentClient.getQuestions(certPath, attempt.questionIds),
        getResponses(attemptId),
      ]);

      const answers: AnswerMap = {};
      const flagged: Record<string, boolean> = {};
      for (const response of responses) {
        if (response.selected.length > 0) answers[response.questionId] = response.selected;
        if (response.flagged) flagged[response.questionId] = true;
      }

      // Kaldigi yerden degil, ilk cevapsiz sorudan devam etmek daha faydali.
      const firstUnanswered = attempt.questionIds.findIndex((id) => !answers[id]);

      set({
        attempt,
        questions,
        answers,
        flagged,
        currentIndex: firstUnanswered === -1 ? 0 : firstUnanswered,
        contentLang: attempt.contentLang,
        meta,
        score: null,
        loading: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      return false;
    }
  },

  async loadSubmitted(attemptId) {
    const restored = await get().resumeAttempt(attemptId);
    if (!restored) return false;

    const { questions, answers, meta } = get();
    if (!meta) return false;

    set({ score: scoreExam(questions, answers, meta) });
    return true;
  },

  select(questionId, optionId) {
    const { attempt, questions, answers } = get();
    if (!attempt || attempt.status !== "in-progress") return;

    const question = questions.find((item) => item.id === questionId);
    if (!question) return;

    const current = answers[questionId] ?? [];
    let updated: string[];

    if (question.selectCount === 1) {
      // Tek secimli: ayni sikka tekrar basmak secimi kaldirir.
      updated = current.includes(optionId) ? [] : [optionId];
    } else if (current.includes(optionId)) {
      updated = current.filter((id) => id !== optionId);
    } else if (current.length >= question.selectCount) {
      // Sinir asilinca en eski secim dusurulur; kullanici once secimini
      // kaldirmak zorunda kalmaz.
      updated = [...current.slice(1), optionId];
    } else {
      updated = [...current, optionId];
    }

    set({ answers: { ...answers, [questionId]: updated } });
    persist(set, attempt.id, questionId, {
      selected: updated,
      flagged: get().flagged[questionId] ?? false,
    });
  },

  toggleFlag(questionId) {
    const { attempt, flagged } = get();
    if (!attempt) return;

    const next = !flagged[questionId];
    set({ flagged: { ...flagged, [questionId]: next } });
    persist(set, attempt.id, questionId, {
      selected: get().answers[questionId] ?? [],
      flagged: next,
    });
  },

  goTo(index) {
    const { questions } = get();
    if (index < 0 || index >= questions.length) return;
    set({ currentIndex: index });
  },

  next() {
    get().goTo(get().currentIndex + 1);
  },

  previous() {
    get().goTo(get().currentIndex - 1);
  },

  setContentLang(lang) {
    const { attempt } = get();
    set({ contentLang: lang });
    if (attempt) void db.attempts.update(attempt.id, { contentLang: lang });
  },

  async submit(auto = false) {
    const { attempt, questions, answers, meta } = get();
    if (!attempt || !meta || attempt.status !== "in-progress") return;

    const score = scoreExam(questions, answers, meta);
    const submitted: Attempt = {
      ...attempt,
      status: "submitted",
      submittedAt: Date.now(),
      autoSubmitted: auto,
      points: score.points,
      totalPoints: score.totalPoints,
      passed: score.passed,
    };

    await db.attempts.put(submitted);
    set({ attempt: submitted, score });
  },
}));

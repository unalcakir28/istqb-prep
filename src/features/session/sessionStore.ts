/**
 * Session state (Zustand) + IndexedDB persistence, shared by all three modes
 * (study / practice / exam).
 *
 * Design notes:
 * - The timer runs off `deadlineAt` (an absolute timestamp). Storing the end
 *   instant rather than counting down the remaining time keeps the clock from
 *   drifting when the tab goes to the background or the device sleeps (F1-08).
 *   `deadlineAt` is null for untimed modes (study, practice).
 * - Every answer is written to IndexedDB immediately, so a session survives a
 *   refresh or an accidental close (F1-10).
 * - The content language may change mid-session and does NOT affect the
 *   answer: a selection is held by question id + option id, never by text.
 * - `mode`, `instantFeedback` and `scope` are frozen onto the attempt at
 *   creation. A resumed session reads them back from the stored attempt —
 *   never recomputes them from whatever the setup screen currently defaults
 *   to, otherwise resuming could silently change the rules mid-session.
 */

import { create } from "zustand";

import type { AttemptMode, AttemptScope } from "@/lib/db/db";
import type { CertMeta, Lang, Question, QuestionIndexEntry } from "@/types/content";
import { contentClient } from "@/lib/content/contentClient";
import { db, getResponses, saveResponse, type Attempt } from "@/lib/db/db";
import { randomSeed } from "../exam/rng";
import { isGraded, scoreExam, type AnswerMap, type ExamScore } from "../exam/scoreExam";
import { selectQuestions, type Shortfall } from "../exam/selectQuestions";

export interface StartSessionOptions {
  certPath: string;
  mode: AttemptMode;
  scope: AttemptScope;
  contentLang: Lang;
  instantFeedback: boolean;
  /** null means untimed — study and practice never carry a deadline. */
  durationMinutes: number | null;
  excludeSeen: boolean;
}

interface SessionState {
  attempt: Attempt | null;
  questions: Question[];
  answers: AnswerMap;
  flagged: Record<string, boolean>;
  /** questionId -> the timestamp the rationale was shown. Presence means locked. */
  revealed: Record<string, number>;
  currentIndex: number;
  contentLang: Lang;
  shortfalls: Shortfall[];
  meta: CertMeta | null;
  score: ExamScore | null;
  loading: boolean;
  error: string | null;
  /** An IndexedDB write failed — progress is not reaching disk (F3-12). */
  persistFailed: boolean;

  startSession: (options: StartSessionOptions) => Promise<string | null>;
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
  revealed: {},
  currentIndex: 0,
  contentLang: "tr" as Lang,
  shortfalls: [],
  meta: null,
  score: null,
  loading: false,
  error: null,
  persistFailed: false,
};

/** Questions already seen — preferably not asked again in a new session. */
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
 * Answer and flag writes are fire-and-forget: the user does not wait for the
 * write to finish. The error is not swallowed, though — in a private tab or
 * with storage disabled the write throws, the answer still looks selected on
 * screen, and it would vanish on refresh. The flag is raised and the exam
 * screen tells the user.
 */
function persist(
  set: (partial: Partial<SessionState>) => void,
  attemptId: string,
  questionId: string,
  row: { selected: string[]; flagged: boolean; revealedAt?: number },
): void {
  saveResponse(attemptId, questionId, row).catch(() => set({ persistFailed: true }));
}

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initial,

  async startSession({
    certPath,
    mode,
    scope,
    contentLang,
    instantFeedback,
    durationMinutes,
    excludeSeen,
  }) {
    set({ loading: true, error: null });

    try {
      const [meta, blueprint, index] = await Promise.all([
        contentClient.getMeta(certPath),
        contentClient.getBlueprint(certPath),
        contentClient.getIndex(certPath),
      ]);

      // Only published questions enter the pool; a draft never appears in a session.
      const pool: QuestionIndexEntry[] = index.questions.filter(
        (entry) => entry.status === "published",
      );
      const exclude = excludeSeen ? await collectSeenQuestionIds(meta.id) : new Set<string>();
      const seed = randomSeed();
      const selection = selectQuestions({ scope, blueprint, pool, seed, exclude });

      if (selection.questionIds.length === 0) {
        set({ loading: false, error: "empty-pool", shortfalls: selection.shortfalls });
        return null;
      }

      const questions = await contentClient.getQuestions(certPath, selection.questionIds);
      const now = Date.now();
      const attempt: Attempt = {
        id: `attempt-${now}-${seed}`,
        certId: meta.id,
        seed,
        questionIds: selection.questionIds,
        status: "in-progress",
        mode,
        scope,
        instantFeedback,
        durationMinutes: durationMinutes ?? 0,
        contentLang,
        startedAt: now,
        deadlineAt: durationMinutes === null ? null : now + durationMinutes * 60_000,
        syllabusVersion: meta.syllabusVersion,
        dataVersion: index.dataVersion,
      };

      await db.attempts.put(attempt);

      set({
        attempt,
        questions,
        answers: {},
        flagged: {},
        revealed: {},
        currentIndex: 0,
        contentLang,
        shortfalls: selection.shortfalls,
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
      const revealed: Record<string, number> = {};
      for (const response of responses) {
        if (response.selected.length > 0) answers[response.questionId] = response.selected;
        if (response.flagged) flagged[response.questionId] = true;
        if (response.revealedAt) revealed[response.questionId] = response.revealedAt;
      }

      // Resuming at the first unanswered question is more useful than resuming where the user left off.
      const firstUnanswered = attempt.questionIds.findIndex((id) => !answers[id]);

      set({
        attempt,
        questions,
        answers,
        flagged,
        revealed,
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
    const { attempt, questions, answers, revealed } = get();
    if (!attempt || attempt.status !== "in-progress") return;
    // Once the rationale has been shown the answer is final: changing it after
    // seeing the explanation would corrupt both the score and the mastery signal.
    if (revealed[questionId]) return;

    const question = questions.find((item) => item.id === questionId);
    if (!question) return;

    const current = answers[questionId] ?? [];
    let updated: string[];

    if (question.selectCount === 1) {
      // Single-answer: pressing the same option again clears the selection.
      updated = current.includes(optionId) ? [] : [optionId];
    } else if (current.includes(optionId)) {
      updated = current.filter((id) => id !== optionId);
    } else if (current.length >= question.selectCount) {
      // Past the limit the oldest selection is dropped, so the user does not
      // have to clear a selection first.
      updated = [...current.slice(1), optionId];
    } else {
      updated = [...current, optionId];
    }

    // A multi-select question reveals nothing until the full selection is made.
    const complete = updated.length === question.selectCount;
    const revealedAt = attempt.instantFeedback && complete ? Date.now() : undefined;

    set({
      answers: { ...answers, [questionId]: updated },
      revealed: revealedAt ? { ...revealed, [questionId]: revealedAt } : revealed,
    });

    persist(set, attempt.id, questionId, {
      selected: updated,
      flagged: get().flagged[questionId] ?? false,
      revealedAt,
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
      revealedAt: get().revealed[questionId],
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
    };

    // A scoped set has no verdict to store: `score.passed` compares against the
    // 40-question exam's pass mark, which ten questions cannot reach. The
    // result screen already refuses to show that comparison; writing it to disk
    // anyway would hand the same falsehood to the first history or stats view
    // that reads the row. The field stays absent rather than false.
    if (isGraded(attempt.scope)) submitted.passed = score.passed;

    await db.attempts.put(submitted);
    set({ attempt: submitted, score });
  },
}));

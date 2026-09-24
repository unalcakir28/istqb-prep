import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Attempt, Response } from "@/lib/db/db";
import type { Question } from "@/types/content";

const dbMock = {
  attempts: {
    get: vi.fn(),
    put: vi.fn(),
    update: vi.fn(),
  },
};
const getResponsesMock = vi.fn();
const saveResponseMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db/db", () => ({
  db: dbMock,
  getResponses: (...args: unknown[]) => getResponsesMock(...args),
  saveResponse: (...args: unknown[]) => saveResponseMock(...args),
}));

vi.mock("@/lib/content/contentClient", () => ({
  contentClient: {
    getMeta: vi.fn(),
    getQuestions: vi.fn(),
  },
}));

const { useSessionStore } = await import("./sessionStore");
const { optionOrder } = await import("../exam/optionOrder");
const { contentClient } = await import("@/lib/content/contentClient");

function baseAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: "attempt-1",
    certId: "ctfl-v4.0.1",
    seed: 1,
    questionIds: ["ctfl4-0001", "ctfl4-0002"],
    status: "in-progress",
    mode: "practice",
    durationMinutes: 0,
    contentLang: "tr",
    startedAt: 1_700_000_000_000,
    deadlineAt: null,
    instantFeedback: true,
    scope: { kind: "blueprint" },
    syllabusVersion: "4.0.1",
    dataVersion: "2026.09.19",
    ...overrides,
  };
}

function singleSelectQuestion(id: string): Question {
  return {
    id,
    revision: 1,
    syllabusVersion: "4.0.1",
    chapter: 1,
    section: "1.1",
    syllabusRef: "FL-1.1.1",
    objectives: ["FL-1.1.1"],
    kLevel: "K1",
    type: "single",
    selectCount: 1,
    points: 1,
    difficulty: 1,
    tags: [],
    origin: "original",
    status: "published",
    correct: ["a"],
    media: null,
    i18n: {
      tr: {
        stem: "stem",
        options: [
          { id: "a", text: "a" },
          { id: "b", text: "b" },
        ],
        rationale: { summary: "s", byOption: { a: "a", b: "b" } },
      },
      en: {
        stem: "stem",
        options: [
          { id: "a", text: "a" },
          { id: "b", text: "b" },
        ],
        rationale: { summary: "s", byOption: { a: "a", b: "b" } },
      },
    },
    meta: { author: "x", reviewedBy: "y", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  };
}

function multiSelectQuestion(id: string): Question {
  const q = singleSelectQuestion(id);
  return { ...q, selectCount: 2, correct: ["a", "b"] };
}

describe("useSessionStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({
      attempt: null,
      questions: [],
      answers: {},
      flagged: {},
      revealed: {},
      currentIndex: 0,
      contentLang: "tr",
      shortfalls: [],
      meta: null,
      score: null,
      loading: false,
      error: null,
      persistFailed: false,
    });
  });

  describe("select", () => {
    it("sets revealedAt once a single-select answer is complete in an instantFeedback session", () => {
      const attempt = baseAttempt({ instantFeedback: true });
      const question = singleSelectQuestion("ctfl4-0001");
      useSessionStore.setState({ attempt, questions: [question] });

      useSessionStore.getState().select("ctfl4-0001", "a");

      expect(useSessionStore.getState().revealed["ctfl4-0001"]).toBeTypeOf("number");
      expect(saveResponseMock).toHaveBeenCalledWith(
        "attempt-1",
        "ctfl4-0001",
        expect.objectContaining({ selected: ["a"], revealedAt: expect.any(Number) }),
      );
    });

    it("does not set revealedAt for a multi-select question until the selection is complete", () => {
      const attempt = baseAttempt({ instantFeedback: true });
      const question = multiSelectQuestion("ctfl4-0001");
      useSessionStore.setState({ attempt, questions: [question] });

      useSessionStore.getState().select("ctfl4-0001", "a");

      expect(useSessionStore.getState().revealed["ctfl4-0001"]).toBeUndefined();
      expect(saveResponseMock).toHaveBeenLastCalledWith(
        "attempt-1",
        "ctfl4-0001",
        expect.objectContaining({ selected: ["a"], revealedAt: undefined }),
      );

      useSessionStore.getState().select("ctfl4-0001", "b");

      expect(useSessionStore.getState().revealed["ctfl4-0001"]).toBeTypeOf("number");
      expect(saveResponseMock).toHaveBeenLastCalledWith(
        "attempt-1",
        "ctfl4-0001",
        expect.objectContaining({ selected: ["a", "b"], revealedAt: expect.any(Number) }),
      );
    });

    it("is a no-op on an already-revealed question", () => {
      const attempt = baseAttempt({ instantFeedback: true });
      const question = singleSelectQuestion("ctfl4-0001");
      useSessionStore.setState({
        attempt,
        questions: [question],
        answers: { "ctfl4-0001": ["a"] },
        revealed: { "ctfl4-0001": 1_700_000_001_000 },
      });

      useSessionStore.getState().select("ctfl4-0001", "b");

      expect(useSessionStore.getState().answers["ctfl4-0001"]).toEqual(["a"]);
      expect(saveResponseMock).not.toHaveBeenCalled();
    });
  });

  describe("toggleFlag", () => {
    it("preserves revealedAt on a revealed question in the persisted row", () => {
      const attempt = baseAttempt({ instantFeedback: true });
      const question = singleSelectQuestion("ctfl4-0001");
      const revealedAt = 1_700_000_001_000;
      useSessionStore.setState({
        attempt,
        questions: [question],
        answers: { "ctfl4-0001": ["a"] },
        revealed: { "ctfl4-0001": revealedAt },
      });

      useSessionStore.getState().toggleFlag("ctfl4-0001");

      expect(saveResponseMock).toHaveBeenCalledWith(
        "attempt-1",
        "ctfl4-0001",
        expect.objectContaining({ selected: ["a"], flagged: true, revealedAt }),
      );
    });
  });

  describe("submit", () => {
    /**
     * `scoreExam` always compares against the official pass mark, which is
     * right for the exam it was written for and a lie for a scoped set: two
     * questions cannot reach 26. The screen already refuses to show that
     * verdict; the row must not carry it either, or the first Phase 2 history
     * view reproduces the bug from disk.
     */
    async function submitPerfectRun(scope: Attempt["scope"]): Promise<Attempt> {
      const attempt = baseAttempt({ scope, instantFeedback: false });
      const questions = [singleSelectQuestion("ctfl4-0001"), singleSelectQuestion("ctfl4-0002")];

      useSessionStore.setState({
        attempt,
        questions,
        answers: { "ctfl4-0001": ["a"], "ctfl4-0002": ["a"] },
        meta: { exam: { passPoints: 26 } } as never,
      });

      await useSessionStore.getState().submit();

      return dbMock.attempts.put.mock.calls.at(-1)?.[0] as Attempt;
    }

    it("stores no verdict for a scoped set scored full marks", async () => {
      const stored = await submitPerfectRun({
        kind: "objective",
        objectives: ["FL-1.1.1"],
        count: 2,
      });

      expect(stored.status).toBe("submitted");
      expect(stored.points).toBe(2);
      // Absent, not false: `false` is the falsehood, and `"passed" in row` is
      // how a reader would tell "no verdict" from "failed".
      expect("passed" in stored).toBe(false);
    });

    it("stores the verdict for a blueprint attempt", async () => {
      const stored = await submitPerfectRun({ kind: "blueprint" });

      // The positive control: 2 of 2 is still below the official 26, and a
      // blueprint attempt is measured against it however short the pool ran.
      expect(stored.passed).toBe(false);
      expect(useSessionStore.getState().score?.passed).toBe(false);
    });
  });

  describe("resumeAttempt", () => {
    it("rebuilds revealed from responses that carry revealedAt", async () => {
      const attempt = baseAttempt();
      const question = singleSelectQuestion("ctfl4-0001");
      const revealedAt = 1_700_000_002_000;
      const responses: Response[] = [
        {
          key: "attempt-1:ctfl4-0001",
          attemptId: "attempt-1",
          questionId: "ctfl4-0001",
          selected: ["a"],
          flagged: false,
          revealedAt,
          updatedAt: revealedAt,
        },
        {
          key: "attempt-1:ctfl4-0002",
          attemptId: "attempt-1",
          questionId: "ctfl4-0002",
          selected: [],
          flagged: false,
          updatedAt: revealedAt,
        },
      ];

      dbMock.attempts.get.mockResolvedValue(attempt);
      getResponsesMock.mockResolvedValue(responses);
      vi.mocked(contentClient.getMeta).mockResolvedValue({ id: "ctfl-v4.0.1" } as never);
      vi.mocked(contentClient.getQuestions).mockResolvedValue([question]);

      const ok = await useSessionStore.getState().resumeAttempt("attempt-1");

      expect(ok).toBe(true);
      expect(useSessionStore.getState().revealed).toEqual({ "ctfl4-0001": revealedAt });
      expect(useSessionStore.getState().revealed["ctfl4-0002"]).toBeUndefined();
    });

    /**
     * D-03. The order is not stored, so the only thing that keeps a resume, the
     * result and the review on the order the candidate saw is that every load
     * derives it from the attempt's own seed.
     */
    it("orders options from the stored seed, identically on every load", async () => {
      const ids = ["a", "b", "c", "d"];
      const base = singleSelectQuestion("ctfl4-0001");
      const fourOptions: Question = {
        ...base,
        i18n: {
          tr: { ...base.i18n.tr, options: ids.map((id) => ({ id, text: `tr ${id}` })) },
          en: { ...base.i18n.en, options: ids.map((id) => ({ id, text: `en ${id}` })) },
        },
      };

      getResponsesMock.mockResolvedValue([]);
      vi.mocked(contentClient.getMeta).mockResolvedValue({ id: "ctfl-v4.0.1" } as never);
      vi.mocked(contentClient.getQuestions).mockResolvedValue([fourOptions]);

      const shownFor = async (seed: number) => {
        dbMock.attempts.get.mockResolvedValue(baseAttempt({ seed }));
        await useSessionStore.getState().resumeAttempt("attempt-1");
        const [question] = useSessionStore.getState().questions;
        return {
          tr: question.i18n.tr.options.map((option) => option.id),
          en: question.i18n.en.options.map((option) => option.id),
        };
      };

      for (const seed of [1, 2, 3, 4, 5]) {
        const first = await shownFor(seed);
        const again = await shownFor(seed);

        expect(first.en).toEqual(optionOrder(fourOptions, seed));
        expect(first.tr).toEqual(first.en);
        expect(again).toEqual(first);
      }
      // The content client's copy is never reordered in place.
      expect(fourOptions.i18n.en.options.map((option) => option.id)).toEqual(ids);
    });
  });
});

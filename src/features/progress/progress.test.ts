import { describe, expect, it } from "vitest";

import type { Attempt, SrsCard } from "@/lib/db/db";
import type { HistoryEntry, QuestionHistory } from "@/lib/db/questionHistory";

import {
  activityTimes,
  chapterProgress,
  examPoints,
  readiness,
  streak,
  type ExamPoint,
} from "./progress";

function attempt(overrides: Partial<Attempt>): Attempt {
  return {
    id: "a",
    certId: "ctfl-v4.0.1",
    seed: 1,
    questionIds: [],
    status: "submitted",
    mode: "exam",
    durationMinutes: 60,
    contentLang: "en",
    startedAt: 1_000,
    deadlineAt: 4_600_000,
    submittedAt: 2_000,
    points: 30,
    totalPoints: 40,
    passed: true,
    instantFeedback: false,
    scope: { kind: "blueprint" },
    syllabusVersion: "4.0.1",
    dataVersion: "x",
    ...overrides,
  };
}

function exam(passed: boolean, timed = true): ExamPoint {
  return { attemptId: "x", at: 0, points: 0, totalPoints: 40, passed, timed };
}

describe("examPoints", () => {
  it("keeps finished blueprint attempts, oldest first, and drops everything else", () => {
    const points = examPoints([
      attempt({ id: "late", submittedAt: 9_000 }),
      attempt({ id: "early", submittedAt: 3_000, deadlineAt: null }),
      attempt({ id: "open", status: "in-progress" }),
      attempt({ id: "scoped", scope: { kind: "chapter", chapters: [1], count: 10 } }),
    ]);

    expect(points.map((point) => point.attemptId)).toEqual(["early", "late"]);
    expect(points[0].timed).toBe(false);
    expect(points[1]).toMatchObject({ points: 30, totalPoints: 40, passed: true, timed: true });
  });
});

describe("readiness", () => {
  it("asks for more timed exams until there are three", () => {
    expect(readiness([exam(true), exam(true, false)])).toEqual({ state: "needMore", missing: 2 });
  });

  it("says ready when two of the last three timed exams passed", () => {
    expect(readiness([exam(false), exam(true), exam(false), exam(true), exam(true)])).toEqual({
      state: "ready",
      passed: 2,
      considered: 3,
    });
  });

  it("says not yet when fewer than two of the last three passed, ignoring untimed passes", () => {
    expect(
      readiness([exam(true), exam(false), exam(true, false), exam(false), exam(true)]),
    ).toEqual({ state: "notYet", passed: 1, considered: 3 });
  });
});

describe("chapterProgress", () => {
  const entry = (isCorrect: boolean): HistoryEntry => ({
    attemptId: "a",
    at: 0,
    selected: ["a"],
    flagged: false,
    isCorrect,
    isUnanswered: false,
  });
  const skipped: HistoryEntry = {
    ...entry(false),
    selected: [],
    flagged: true,
    isUnanswered: true,
  };
  const history = (questionId: string, ...results: boolean[]): QuestionHistory => ({
    questionId,
    entries: results.map(entry),
  });
  const chapters: Record<string, number> = { q1: 1, q2: 1, q3: 2 };

  it("compares first answers with latest answers per chapter", () => {
    const rows = chapterProgress(
      [history("q1", false, true), history("q2", true), history("q3", false, false)],
      (id) => chapters[id],
    );

    expect(rows).toEqual([
      { chapter: 1, answered: 2, firstPercent: 50, latestPercent: 100 },
      { chapter: 2, answered: 1, firstPercent: 0, latestPercent: 0 },
    ]);
  });

  it("leaves out entries with nothing selected, first and latest alike", () => {
    const rows = chapterProgress(
      [
        { questionId: "q1", entries: [skipped, entry(true), skipped] },
        { questionId: "q2", entries: [skipped] },
      ],
      (id) => chapters[id],
    );

    expect(rows).toEqual([{ chapter: 1, answered: 1, firstPercent: 100, latestPercent: 100 }]);
  });

  it("skips a question whose chapter is unknown, and one with no answers", () => {
    expect(chapterProgress([history("gone", true), history("q1")], (id) => chapters[id])).toEqual(
      [],
    );
  });
});

describe("activityTimes", () => {
  it("takes finished sessions and each card's last review, nothing unfinished", () => {
    const deck = [{ lastReviewedAt: 7_000 }, { lastReviewedAt: undefined }] as SrsCard[];

    expect(
      activityTimes(
        [
          attempt({ submittedAt: 2_000 }),
          attempt({ submittedAt: undefined }),
          attempt({ status: "in-progress", submittedAt: undefined }),
        ],
        deck,
      ),
    ).toEqual([2_000, 1_000, 7_000]);
  });
});

describe("streak", () => {
  // Local times, so the day boundaries hold in any time zone the suite runs in.
  const day = (date: number, hour = 12) => new Date(2026, 9, date, hour).getTime();

  it("counts active days in a row, with one missed day forgiven", () => {
    expect(streak([day(1), day(2), day(4), day(5)], day(5, 20))).toEqual({
      days: 4,
      activeToday: true,
    });
  });

  it("breaks the run at a gap of two missed days", () => {
    expect(streak([day(1), day(4), day(5)], day(5)).days).toBe(2);
  });

  it("keeps the run alive when only yesterday was missed", () => {
    expect(streak([day(2), day(3)], day(5))).toEqual({ days: 2, activeToday: false });
  });

  it("has no run when the last active day was three days ago, or never", () => {
    expect(streak([day(1), day(2)], day(5)).days).toBe(0);
    expect(streak([], day(5))).toEqual({ days: 0, activeToday: false });
  });

  it("counts several sessions on one day once", () => {
    expect(streak([day(5, 9), day(5, 21)], day(5, 22)).days).toBe(1);
  });
});

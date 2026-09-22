import { describe, expect, it } from "vitest";

import { applyAttemptV3Defaults, type LegacyAttempt } from "./migrations";

function v2Attempt(): LegacyAttempt {
  return {
    id: "attempt-1",
    certId: "ctfl-v4.0.1",
    seed: 42,
    questionIds: ["ctfl4-0001", "ctfl4-0002"],
    status: "in-progress",
    durationMinutes: 60,
    contentLang: "tr",
    startedAt: 1_700_000_000_000,
    deadlineAt: 1_700_000_360_000,
    syllabusVersion: "4.0.1",
    dataVersion: "2026.09.19",
  };
}

describe("applyAttemptV3Defaults", () => {
  it("treats every pre-v3 attempt as a blueprint exam", () => {
    const row = v2Attempt();

    applyAttemptV3Defaults(row);

    expect(row.mode).toBe("exam");
    expect(row.instantFeedback).toBe(false);
    expect(row.scope).toEqual({ kind: "blueprint" });
  });

  it("keeps an in-progress attempt resumable: deadline and answers survive", () => {
    const row = v2Attempt();

    applyAttemptV3Defaults(row);

    expect(row.status).toBe("in-progress");
    expect(row.deadlineAt).toBe(1_700_000_360_000);
    expect(row.questionIds).toEqual(["ctfl4-0001", "ctfl4-0002"]);
  });

  it("does not overwrite an attempt that already carries v3 fields", () => {
    const row: LegacyAttempt = {
      ...v2Attempt(),
      mode: "practice",
      instantFeedback: true,
      scope: { kind: "chapter", chapters: [4], count: 10 },
    };

    applyAttemptV3Defaults(row);

    expect(row.mode).toBe("practice");
    expect(row.instantFeedback).toBe(true);
    expect(row.scope).toEqual({ kind: "chapter", chapters: [4], count: 10 });
  });
});

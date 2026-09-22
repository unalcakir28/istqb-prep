import { describe, expect, it } from "vitest";

import { isShaky, listsFor, type HistoryEntry, type QuestionHistory } from "./questionHistory";

/**
 * `buildQuestionHistory` needs a real IndexedDB and is covered by the route's
 * own tests. The claims worth pinning down in isolation are the two rules that
 * decide what a list means.
 */
function entry(partial: Partial<HistoryEntry>): HistoryEntry {
  return {
    attemptId: "a1",
    at: 0,
    selected: ["a"],
    flagged: false,
    isCorrect: false,
    isUnanswered: false,
    ...partial,
  };
}

const right = entry({ isCorrect: true });
const wrong = entry({ isCorrect: false });
const skipped = entry({ isCorrect: false, isUnanswered: true, selected: [] });

describe("isShaky", () => {
  it("counts a question answered right only once as still shaky", () => {
    expect(isShaky([right])).toBe(true);
  });

  it("clears a question once it has been right twice in a row", () => {
    expect(isShaky([wrong, right, right])).toBe(false);
  });

  it("does not clear two correct answers separated by a wrong one", () => {
    expect(isShaky([right, wrong, right])).toBe(true);
  });

  it("does not clear two correct answers separated by a skip", () => {
    // A question nobody answered is not evidence of knowing it, so it breaks
    // the run exactly as a wrong answer does.
    expect(isShaky([right, skipped, right])).toBe(true);
  });

  it("keeps a question cleared even if it is later got wrong again", () => {
    // The list is "never got right twice in a row" — a run that happened,
    // happened.
    expect(isShaky([right, right, wrong])).toBe(false);
  });

  it("treats a question with no history as shaky", () => {
    expect(isShaky([])).toBe(true);
  });
});

describe("listsFor", () => {
  function history(entries: HistoryEntry[]): QuestionHistory {
    return { questionId: "q1", entries };
  }

  it("reads wrong and flagged from the latest answer only", () => {
    // Wrong in the first session, right and unflagged in the second: not a
    // current mistake.
    expect(listsFor(history([entry({ flagged: true }), right]))).toEqual(["shaky"]);
  });

  it("puts a currently wrong answer on the mistakes list", () => {
    expect(listsFor(history([right, right, wrong]))).toEqual(["wrong"]);
  });

  it("does not call an unanswered question a mistake", () => {
    expect(listsFor(history([skipped]))).toEqual(["shaky"]);
  });

  it("puts one question on every list it qualifies for", () => {
    expect(listsFor(history([entry({ flagged: true })]))).toEqual(["wrong", "flagged", "shaky"]);
  });

  it("returns nothing for a question that was never answered", () => {
    expect(listsFor(history([]))).toEqual([]);
  });
});

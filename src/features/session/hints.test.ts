import { describe, expect, it } from "vitest";

import { hintFor } from "./hints";
import type { Question, QuestionContent } from "@/types/content";

function content(overrides: Partial<QuestionContent> = {}): QuestionContent {
  return {
    stem: "Which one?",
    options: [
      { id: "c", text: "Option C" },
      { id: "a", text: "Option A" },
      { id: "b", text: "Option B" },
    ],
    rationale: {
      summary: "A is right.",
      byOption: {
        a: "Right, because.",
        b: "B describes something else.",
        c: "C describes a third thing.",
      },
    },
    ...overrides,
  };
}

function question(tr: QuestionContent, en: QuestionContent, correct = ["a"]): Question {
  return { id: "ctfl4-0001", correct, i18n: { tr, en } } as Question;
}

describe("hintFor", () => {
  it("prefers the question's own authored hints", () => {
    const hinted = content({ hints: ["Think about X.", " "] });

    expect(hintFor(question(hinted, hinted), "en")).toEqual({
      kind: "authored",
      texts: ["Think about X."],
    });
  });

  it("otherwise takes away the first wrong option in the order shown, with its rationale", () => {
    expect(hintFor(question(content(), content()), "en")).toEqual({
      kind: "eliminate",
      optionText: "Option C",
      rationale: "C describes a third thing.",
    });
  });

  it("skips correct options when choosing the one to take away", () => {
    const multi = question(content(), content(), ["a", "c"]);

    expect(hintFor(multi, "en")).toEqual({
      kind: "eliminate",
      optionText: "Option B",
      rationale: "B describes something else.",
    });
  });

  it("reads the language asked for", () => {
    const tr = content({ hints: ["X'i düşün."] });

    expect(hintFor(question(tr, content()), "tr")).toEqual({
      kind: "authored",
      texts: ["X'i düşün."],
    });
  });

  it("has nothing to take away when every option is correct", () => {
    expect(hintFor(question(content(), content(), ["a", "b", "c"]), "en")).toBeNull();
  });
});

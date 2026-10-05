import { describe, expect, it } from "vitest";

import { hintFor, hintIn } from "./hints";
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

  it("otherwise takes away the first wrong option in the order shown, without its rationale (D-07)", () => {
    expect(hintFor(question(content(), content()), "en")).toEqual({
      kind: "eliminate",
      optionId: "c",
      optionText: "Option C",
    });
  });

  it("skips correct options when choosing the one to take away", () => {
    const multi = question(content(), content(), ["a", "c"]);

    expect(hintFor(multi, "en")).toEqual({
      kind: "eliminate",
      optionId: "b",
      optionText: "Option B",
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

describe("hintIn (F3-14)", () => {
  const turkish = content({
    options: [
      { id: "a", text: "Şık A" },
      { id: "b", text: "Şık B" },
      { id: "c", text: "Şık C" },
    ],
    rationale: {
      summary: "A doğru.",
      byOption: { a: "Doğru.", b: "B başka bir şeyi anlatır.", c: "C üçüncü bir şeyi anlatır." },
    },
  });

  it("takes away the same option in the other language, whatever its position there", () => {
    const q = question(turkish, content());
    const english = hintFor(q, "en")!;

    expect(hintIn(q, english, "tr")).toEqual({
      kind: "eliminate",
      optionId: "c",
      optionText: "Şık C",
    });
  });

  it("shows the other language's authored hints beside the first's", () => {
    const q = question(content({ hints: ["X'i düşün."] }), content({ hints: ["Think about X."] }));

    expect(hintIn(q, hintFor(q, "en")!, "tr")).toEqual({ kind: "authored", texts: ["X'i düşün."] });
  });

  it("shows nothing when the other language has no hint of the same kind", () => {
    const q = question(content(), content({ hints: ["Think about X."] }));

    expect(hintIn(q, hintFor(q, "en")!, "tr")).toBeNull();
  });
});

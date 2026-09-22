import type { Question, QuestionContent } from "@/types/content";

/**
 * A minimal question for component tests.
 *
 * Built here rather than read from `data/`, so a test about markup does not go
 * red the day the pool is re-balanced — and so a case the pool does not happen
 * to contain (a three-of-five multi-select, say) is still reachable.
 */
function content(suffix: string): QuestionContent {
  return {
    stem: `What is a test case? (${suffix})`,
    options: [
      { id: "a", text: `A set of preconditions and expected results (${suffix})` },
      { id: "b", text: `A defect report (${suffix})` },
    ],
    rationale: {
      summary: `A test case is the unit of execution (${suffix})`,
      byOption: {
        a: `Correct: this is the definition (${suffix})`,
        b: `That describes a defect report (${suffix})`,
      },
    },
  };
}

export function questionFixture(overrides: Partial<Question> = {}): Question {
  return {
    id: "ctfl4-9001",
    revision: 1,
    syllabusVersion: "4.0.1",
    chapter: 1,
    section: "1.1",
    syllabusRef: "1.1",
    objectives: ["FL-1.1.1"],
    kLevel: "K1",
    type: "single",
    selectCount: 1,
    points: 1,
    difficulty: 2,
    tags: [],
    origin: "original",
    status: "published",
    correct: ["a"],
    media: null,
    i18n: { en: content("en"), tr: content("tr") },
    meta: { author: "test", reviewedBy: "test", createdAt: "", updatedAt: "" },
    ...overrides,
  };
}

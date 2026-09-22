import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import en from "@/lib/i18n/locales/en.json";
import { generateExam } from "@/features/exam/generateExam";
import type {
  CertMeta,
  CertificationSummary,
  Chapter,
  ExamBlueprint,
  QuestionIndex,
  QuestionIndexEntry,
  Syllabus,
} from "@/types/content";

/**
 * C1 — the setup screen must not warn about a shortfall that generation will
 * not produce.
 *
 * `generateExam`'s `exclude` set is a preference, not a filter: `preferUnseen`
 * returns `[...unseen, ...seen]` and drops nothing (the `exclude` docstring at
 * `generateExam.ts:29-33`, `preferUnseen` at `:65-74`). A preview that removes
 * seen questions from the pool therefore
 * reports shortfalls the generator never hits, and the screen tells the
 * candidate the pool is too small when it is not.
 *
 * The fixture is deliberately tiny and local: pinned to the shipped content
 * this test would go red the day the pool grows, on a spec unrelated to the
 * change that broke it.
 */

const SEEN = new Set(["q-seen-1", "q-seen-2"]);

function entry(id: string): QuestionIndexEntry {
  return {
    id,
    chunk: "ch01-a",
    chapter: 1,
    objectives: ["FL-1.1.1"],
    kLevel: "K2",
    type: "single",
    selectCount: 1,
    languages: ["tr", "en"],
    syllabusVersion: "4.0.1",
    status: "published",
  };
}

/** Two questions for one group of two — and the candidate has seen both. */
const POOL: QuestionIndexEntry[] = [entry("q-seen-1"), entry("q-seen-2")];

const BLUEPRINT: ExamBlueprint = {
  syllabusVersion: "4.0.1",
  source: "fixture",
  rule: "fixture",
  totals: {
    questions: 2,
    byChapter: { "1": 2 },
    byKLevel: { K1: 0, K2: 2, K3: 0 },
  },
  groups: [{ id: "g1", chapter: 1, kLevel: "K2", questions: 2, objectives: ["FL-1.1.1"] }],
};

const CHAPTER: Chapter = {
  number: 1,
  title: { tr: "Bölüm", en: "Chapter" },
  trainingMinutes: 180,
  objectiveCount: 1,
  objectiveKDistribution: { K1: 0, K2: 1, K3: 0 },
  examQuestions: 2,
  examPoints: 2,
  examKDistribution: { K1: 0, K2: 2, K3: 0 },
};

const SYLLABUS: Syllabus = {
  syllabusVersion: "4.0.1",
  source: "fixture",
  chapters: [CHAPTER],
  totals: {
    trainingMinutes: 180,
    objectives: 1,
    objectiveKDistribution: { K1: 0, K2: 1, K3: 0 },
    examQuestions: 2,
    examPoints: 2,
    examKDistribution: { K1: 0, K2: 2, K3: 0 },
  },
};

const META: CertMeta = {
  id: "ctfl-v4.0.1",
  name: { tr: "CTFL", en: "CTFL" },
  acronym: "CTFL",
  stream: "Core",
  level: "Foundation",
  syllabusVersion: "4.0.1",
  syllabusReleaseDate: "2023-04-21",
  exam: {
    questionCount: 2,
    totalPoints: 2,
    passPoints: 2,
    passPercent: 65,
    durationMinutes: 60,
    pointsPerQuestion: 1,
    negativeMarking: null,
    questionKLevelDistribution: { K1: 0, K2: 2, K3: 0 },
  },
  sources: {},
};

const CERT: CertificationSummary = {
  id: "ctfl-v4.0.1",
  acronym: "CTFL",
  syllabusVersion: "4.0.1",
  status: "active",
  path: "ctfl-v4.0.1",
  languages: ["tr", "en"],
  questionCount: POOL.length,
  coverage: { objectivesTotal: 1, objectivesCovered: 1, minPerObjective: 2 },
};

const INDEX: QuestionIndex = {
  dataVersion: "fixture",
  count: POOL.length,
  chunks: ["ch01-a"],
  questions: POOL,
};

vi.mock("@/lib/content/contentClient", () => ({
  contentClient: {
    getActiveCertification: () => Promise.resolve(CERT),
    getMeta: () => Promise.resolve(META),
    getBlueprint: () => Promise.resolve(BLUEPRINT),
    getSyllabus: () => Promise.resolve(SYLLABUS),
    getIndex: () => Promise.resolve(INDEX),
  },
}));

// `useSessionStore` is read with a selector, so a plain state object is enough.
// `collectSeenQuestionIds` is mocked even though the fixed screen no longer
// calls it: that is what makes this a regression guard. Re-add the filter and
// the seen set flows back in, the preview drops to 0/2, and this goes red.
vi.mock("@/features/session/sessionStore", () => ({
  collectSeenQuestionIds: () => Promise.resolve(SEEN),
  useSessionStore: (selector: (state: unknown) => unknown) =>
    selector({ startSession: () => Promise.resolve(null), loading: false }),
}));

const { default: ExamSetup } = await import("./ExamSetup");

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

describe("ExamSetup pool preview", () => {
  it("generation fills the exam from seen questions, so there is no shortfall to warn about", () => {
    const generated = generateExam({ blueprint: BLUEPRINT, pool: POOL, seed: 1, exclude: SEEN });

    expect(generated.questionIds).toHaveLength(BLUEPRINT.totals.questions);
    expect(generated.shortfalls).toEqual([]);
  });

  it("does not warn when every question in the pool has already been seen", async () => {
    render(
      <MemoryRouter>
        <ExamSetup />
      </MemoryRouter>,
    );

    // "Avoid what I have seen" is on by default, and every pool entry is seen.
    await screen.findByRole("heading", { name: en.setup.title, level: 1 });

    expect(
      screen.queryByRole("heading", { name: en.home.poolWarningTitle }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("2 / 2").length).toBeGreaterThan(0);
  });
});

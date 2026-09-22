import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import en from "@/lib/i18n/locales/en.json";
import type {
  CertificationSummary,
  Lesson,
  Objective,
  QuestionIndex,
  QuestionIndexEntry,
} from "@/types/content";

/**
 * I2 and I3 — the objective card, on the two states the shipped pool actually
 * produces.
 *
 * I2: `markLessonRead` ran in a mount effect with no regard for whether there
 * was a lesson to read, and `objectiveStateOf` returns "in-progress" for any
 * existing row. All six lesson chunks currently ship empty, so opening any of
 * the 64 objectives flipped its chapter badge off "Not started" on the
 * strength of a placeholder that says the content is not ready.
 *
 * I3: the shortfall banner borrowed `session.shortfallScope` — "Only 1/3
 * questions could be found for this selection" — for a candidate who made no
 * selection and never asked for three. It fires on 52 of the 64 objectives.
 */

const LO_CODE = "FL-1.1.1";

const CERT: CertificationSummary = {
  id: "ctfl-v4.0.1",
  acronym: "CTFL",
  syllabusVersion: "4.0.1",
  status: "active",
  path: "ctfl-v4.0.1",
  languages: ["tr", "en"],
  questionCount: 1,
  coverage: { objectivesTotal: 1, objectivesCovered: 1, minPerObjective: 1 },
};

const OBJECTIVE: Objective = {
  code: LO_CODE,
  chapter: 1,
  section: "1.1",
  kLevel: "K1",
  text: { tr: "Hedef", en: "Objective" },
};

const LESSON: Lesson = {
  objective: LO_CODE,
  syllabusVersion: "4.0.1",
  syllabusRef: "1.1",
  revision: 1,
  status: "published",
  origin: "original",
  i18n: {
    tr: { title: "Ders", paragraphs: ["Metin."], keyPoints: [], commonMistakes: [] },
    en: { title: "Lesson", paragraphs: ["Text."], keyPoints: [], commonMistakes: [] },
  },
  meta: { author: "fixture", reviewedBy: "fixture", createdAt: "", updatedAt: "" },
};

function entry(id: string): QuestionIndexEntry {
  return {
    id,
    chunk: "ch01-a",
    chapter: 1,
    objectives: [LO_CODE],
    kLevel: "K1",
    type: "single",
    selectCount: 1,
    languages: ["tr", "en"],
    syllabusVersion: "4.0.1",
    status: "published",
  };
}

/** Swapped per test before rendering. */
let lesson: Lesson | null = null;
let published: QuestionIndexEntry[] = [];

const markLessonRead = vi.fn(() => Promise.resolve());

vi.mock("@/lib/content/contentClient", () => ({
  contentClient: {
    getActiveCertification: () => Promise.resolve(CERT),
    getObjectives: () => Promise.resolve([OBJECTIVE]),
    getLesson: () => Promise.resolve(lesson),
    getIndex: () =>
      Promise.resolve({
        dataVersion: "fixture",
        count: published.length,
        chunks: ["ch01-a"],
        questions: published,
      } satisfies QuestionIndex),
  },
}));

// The real mastery bar is kept; only the write is spied on.
vi.mock("@/lib/db/objectiveProgress", () => ({
  markLessonRead,
  MASTERY_MIN_ANSWERED: 3,
}));

vi.mock("@/features/session/sessionStore", () => ({
  useSessionStore: (selector: (state: unknown) => unknown) =>
    selector({ startSession: () => Promise.resolve(null), loading: false }),
}));

const { default: StudyObjective } = await import("./StudyObjective");

function renderObjective() {
  return render(
    <MemoryRouter initialEntries={[`/calisma/lo/${LO_CODE}`]}>
      <Routes>
        <Route path="/calisma/lo/:loCode" element={<StudyObjective />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** The old string, filled from the locale rather than retyped. */
const shortfallScope = (available: number, required: number) =>
  en.session.shortfallScope_other
    .replace("{{available}}", String(available))
    .replace("{{required}}", String(required));

const belowMastery = (count: number, required: number) =>
  en.study.belowMastery_one
    .replace("{{count}}", String(count))
    .replace("{{required}}", String(required));

const testLength = (count: number) => en.study.testLength_other.replace("{{count}}", String(count));

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

beforeEach(() => {
  markLessonRead.mockClear();
  lesson = null;
  published = [entry("q-1")];
});

describe("StudyObjective progress", () => {
  it("records nothing when the objective's lesson has not shipped", async () => {
    renderObjective();

    await screen.findByText(en.study.lessonMissing);
    // Positive control on the opposite side: the placeholder is what is on
    // screen, so there is nothing the candidate could have read.
    expect(screen.queryByText(LESSON.i18n.en.title)).not.toBeInTheDocument();

    expect(markLessonRead).not.toHaveBeenCalled();
  });

  it("records the read once there is a card to read", async () => {
    lesson = LESSON;
    renderObjective();

    await screen.findByText(LESSON.i18n.en.title);

    await waitFor(() => {
      expect(markLessonRead).toHaveBeenCalledWith(CERT.id, LO_CODE);
    });
  });
});

describe("StudyObjective shortfall banner", () => {
  it("says the test is below the mastery bar, not that a selection came up short", async () => {
    renderObjective();

    // The spinner is a `role="status"` of its own, so the banner is found by
    // its text and only then checked for the role it has to carry.
    await screen.findByRole("button", { name: en.study.startTest });

    expect(screen.getByText(belowMastery(1, 3))).toHaveAttribute("role", "status");
    expect(screen.queryByText(shortfallScope(1, 3))).not.toBeInTheDocument();
  });

  it("says nothing when the objective can reach the mastery bar on its own", async () => {
    published = [entry("q-1"), entry("q-2"), entry("q-3")];
    renderObjective();

    await screen.findByRole("button", { name: en.study.startTest });

    // The positive control: the banner is absent because the objective really
    // reaches the bar, not because the fixture never took. Asserting the
    // absence of `belowMastery(3, 3)` here would not do it — at count 3 the
    // banner does not render at all, and i18next would reach for the `_other`
    // plural anyway, so that assertion could never have failed.
    expect(screen.getByText(testLength(3))).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

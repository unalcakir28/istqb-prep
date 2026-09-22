import { useEffect } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
  type Location,
} from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import en from "@/lib/i18n/locales/en.json";
import { PRODUCT_NAME } from "@/lib/product";
import type { ExamScore, QuestionOutcome } from "@/features/exam/scoreExam";
import type { Attempt, AttemptMode, AttemptScope } from "@/lib/db/db";
import type { Chapter, Objective, Syllabus } from "@/types/content";

/**
 * C1 — `/sonuc` is shared by exam and practice, and the pass mark is a fact
 * about the 40-question exam alone.
 *
 * `scoreExam` always reads `meta.exam.passPoints` (26 for CTFL v4.0.1) and
 * always sets `passed = points >= passPoints`, because in exam mode that is
 * exactly right — a short exam is still measured against the official mark.
 * A 10-question practice set cannot reach 26 however well it goes, so the
 * screen used to tell a candidate who answered all ten correctly that they
 * were below the pass mark, on a bar scaled to 26.
 *
 * The discriminator asserted here is `attempt.scope.kind`, not `attempt.mode`:
 * the spec's rule is that behaviour derives from what the attempt covered. A
 * 40-question blueprint practice set keeps the verdict; an exam-mode attempt
 * with a scoped selection would lose it.
 */

const ATTEMPT_ID = "attempt-1";

const CHAPTER: Chapter = {
  number: 1,
  title: { tr: "Bölüm", en: "Chapter" },
  trainingMinutes: 180,
  objectiveCount: 1,
  objectiveKDistribution: { K1: 0, K2: 1, K3: 0 },
  examQuestions: 8,
  examPoints: 8,
  examKDistribution: { K1: 0, K2: 8, K3: 0 },
};

const SYLLABUS: Syllabus = {
  syllabusVersion: "4.0.1",
  source: "fixture",
  chapters: [CHAPTER],
  totals: {
    trainingMinutes: 180,
    objectives: 1,
    objectiveKDistribution: { K1: 0, K2: 1, K3: 0 },
    examQuestions: 8,
    examPoints: 8,
    examKDistribution: { K1: 0, K2: 8, K3: 0 },
  },
};

const OBJECTIVES: Objective[] = [];

vi.mock("@/lib/content/contentClient", () => ({
  contentClient: {
    getSyllabus: () => Promise.resolve(SYLLABUS),
    getObjectives: () => Promise.resolve(OBJECTIVES),
  },
}));

/** Swapped per test before rendering; the store is read with plain selectors. */
let attempt: Attempt;
let score: ExamScore;

/** Replaced by the retry tests so they can assert what the screen asked for. */
let startSession: (options: unknown) => Promise<string | null> = () => Promise.resolve(null);

vi.mock("@/features/session/sessionStore", () => ({
  useSessionStore: (selector: (state: unknown) => unknown) =>
    selector({
      attempt,
      score,
      contentLang: "en",
      loading: false,
      loadSubmitted: () => Promise.resolve(),
      startSession: (options: unknown) => startSession(options),
    }),
}));

const { default: ExamResult } = await import("./ExamResult");

function makeAttempt(mode: AttemptMode, scope: AttemptScope): Attempt {
  return {
    id: ATTEMPT_ID,
    certId: "ctfl-v4.0.1",
    seed: 1,
    questionIds: [],
    status: "submitted",
    mode,
    durationMinutes: 0,
    contentLang: "en",
    startedAt: 1_000,
    deadlineAt: null,
    submittedAt: 61_000,
    instantFeedback: true,
    scope,
    syllabusVersion: "4.0.1",
    dataVersion: "fixture",
  };
}

/**
 * A score exactly as `scoreExam` produces it: `passPoints` is the official 26
 * whatever was asked, and `passed` compares against it.
 */
function makeScore(points: number, totalPoints: number): ExamScore {
  return {
    points,
    totalPoints,
    percent: Math.round((points / totalPoints) * 100),
    passPoints: 26,
    passed: points >= 26,
    correctCount: points,
    incorrectCount: totalPoints - points,
    unansweredCount: 0,
    byChapter: { 1: { correct: points, total: totalPoints, percent: 0 } },
    byObjective: {},
    byKLevel: {},
    outcomes: [],
  };
}

/** One outcome, defaulted to a plain wrong answer. */
function outcome(
  questionId: string,
  flags: { isCorrect: boolean; isUnanswered?: boolean },
): QuestionOutcome {
  return {
    questionId,
    chapter: 1,
    objectives: ["FL-1.1.1"],
    kLevel: "K2",
    selected: [],
    correct: ["a"],
    isCorrect: flags.isCorrect,
    isUnanswered: flags.isUnanswered ?? false,
    points: flags.isCorrect ? 1 : 0,
  };
}

/**
 * Where the router ended up. The retry button's whole job is to leave for a
 * NEW attempt, and a test that only asserts what `startSession` was asked for
 * would pass with the navigation deleted.
 */
function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

/**
 * `entry` is what the history stack starts with. A bare string is a cold load;
 * a partial location carrying a `key` is a reload, because the browser restores
 * `history.state` — key included — and React Router reads its `location.key`
 * straight back out of it.
 */
function renderResult(entry: string | Partial<Location> = `/sonuc/${ATTEMPT_ID}`) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocationProbe />
      <Routes>
        <Route path="/sonuc/:attemptId" element={<ExamResult />} />
        {/* Stands in for the practice session the retry button leaves for. */}
        <Route path="/alistirma/:attemptId" element={null} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Both session screens hand over to the result with exactly this call. */
function ArrivalRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/sonuc/${ATTEMPT_ID}`, { replace: true });
  }, [navigate]);

  return null;
}

function renderArrival() {
  return render(
    <MemoryRouter initialEntries={["/sinav/" + ATTEMPT_ID]}>
      <Routes>
        <Route path="/sinav/:attemptId" element={<ArrivalRedirect />} />
        <Route path="/sonuc/:attemptId" element={<ExamResult />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** "Pass mark 26", built from the locale rather than retyped. */
const passLine = (pass: number) => en.result.passLine.replace("{{pass}}", String(pass));

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

beforeEach(() => {
  document.title = "";
});

describe("ExamResult verdict", () => {
  it("states no verdict and no pass mark for a scoped practice set scored full marks", async () => {
    attempt = makeAttempt("practice", { kind: "objective", objectives: ["FL-1.1.1"], count: 10 });
    score = makeScore(10, 10);

    renderResult();
    await screen.findByRole("heading", { name: en.result.title, level: 1 });

    // Every place the old screen called a perfect run a failure.
    expect(screen.queryByText(en.result.failed)).not.toBeInTheDocument();
    expect(screen.queryByText(en.result.passed)).not.toBeInTheDocument();
    expect(screen.queryByText(passLine(26))).not.toBeInTheDocument();

    // The bar is scaled to the questions asked, not to a mark this set cannot
    // reach: its accessible name is the score and nothing else, and the end
    // label is 10 rather than 26.
    expect(screen.getByRole("img", { name: "10 / 10" })).toBeInTheDocument();
    expect(screen.getByText("10", { selector: "span" })).toBeInTheDocument();

    // The percentage survives the verdict it used to share a line with.
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("offers another practice set rather than a 40-question exam nobody asked for", async () => {
    attempt = makeAttempt("practice", { kind: "chapter", chapters: [1], count: 10 });
    score = makeScore(10, 10);

    renderResult();
    await screen.findByRole("heading", { name: en.result.title, level: 1 });

    expect(screen.queryByRole("link", { name: en.result.retake })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.result.retakePractice })).toHaveAttribute(
      "href",
      "/alistirma",
    );
  });

  it("keeps the verdict and the pass mark for a blueprint attempt", async () => {
    attempt = makeAttempt("exam", { kind: "blueprint" });
    score = makeScore(26, 40);

    renderResult();
    await screen.findByRole("heading", { name: en.result.title, level: 1 });

    expect(screen.getByText(en.result.passed)).toBeInTheDocument();
    expect(screen.getByText(passLine(26))).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: `26 / 40 — ${passLine(26)} — ${en.result.passed}` }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.result.retake })).toHaveAttribute("href", "/sinav");
  });

  it("keeps the verdict for a practice set built from the blueprint", async () => {
    attempt = makeAttempt("practice", { kind: "blueprint" });
    score = makeScore(10, 40);

    renderResult();
    await screen.findByRole("heading", { name: en.result.title, level: 1 });

    // Mode says "practice"; the scope says this was the official distribution
    // at the official count, and the scope is what the screen reads.
    expect(screen.getByText(en.result.failed)).toBeInTheDocument();
    expect(screen.getByText(passLine(26))).toBeInTheDocument();
  });
});

describe("ExamResult retry the ones you missed", () => {
  /** A set where one was wrong, one was right and one was never reached. */
  function scoreWithOutcomes(): ExamScore {
    return {
      ...makeScore(1, 3),
      outcomes: [
        outcome("q-wrong", { isCorrect: false, isUnanswered: false }),
        outcome("q-right", { isCorrect: true, isUnanswered: false }),
        outcome("q-skipped", { isCorrect: false, isUnanswered: true }),
      ],
    };
  }

  const retryLabel = en.result.retryMissed_one.replace("{{count}}", "1");

  it("starts a practice attempt over the wrong answers only, leaving the unanswered out", async () => {
    attempt = makeAttempt("exam", { kind: "blueprint" });
    score = scoreWithOutcomes();

    let asked: Record<string, unknown> | null = null;
    startSession = (options) => {
      asked = options as Record<string, unknown>;
      return Promise.resolve("attempt-2");
    };

    renderResult();
    const button = await screen.findByRole("button", { name: retryLabel });
    fireEvent.click(button);

    await waitFor(() => {
      expect(asked).not.toBeNull();
    });

    // A question nobody reached teaches nothing about a wrong belief, and a
    // right answer is not something to re-sit.
    expect(asked!.scope).toEqual({
      kind: "questions",
      questionIds: ["q-wrong"],
      source: "wrong",
    });
    expect(asked!.mode).toBe("practice");
    // The point of the retry is the reasoning, and every question in the set
    // was seen by definition.
    expect(asked!.instantFeedback).toBe(true);
    expect(asked!.excludeSeen).toBe(false);
    expect(asked!.durationMinutes).toBeNull();

    // The new attempt, not a re-queue inside the one just scored.
    expect(screen.getByTestId("location")).toHaveTextContent("/alistirma/attempt-2");
  });

  it("is not offered when nothing was answered wrongly", async () => {
    attempt = makeAttempt("exam", { kind: "blueprint" });
    score = { ...makeScore(3, 3), outcomes: [outcome("q1", { isCorrect: true })] };

    renderResult();
    await screen.findByRole("heading", { name: en.result.title, level: 1 });

    expect(screen.queryByRole("button", { name: retryLabel })).not.toBeInTheDocument();
  });

  it("brings the button back when the pool can no longer supply the set", async () => {
    attempt = makeAttempt("exam", { kind: "blueprint" });
    score = scoreWithOutcomes();
    startSession = () => Promise.resolve(null);

    renderResult();
    const button = await screen.findByRole("button", { name: retryLabel });
    fireEvent.click(button);

    // A dead button would leave the candidate with no way to learn that
    // nothing happened. It uses `aria-disabled` rather than `disabled` so it
    // keeps focus while the session is being built, so that is what is
    // asserted here.
    await waitFor(() => {
      expect(screen.getByRole("button", { name: retryLabel })).toHaveAttribute(
        "aria-disabled",
        "false",
      );
    });
    expect(screen.getByTestId("location")).toHaveTextContent(`/sonuc/${ATTEMPT_ID}`);
  });
});

describe("ExamResult title and focus", () => {
  it("replaces the title the session left behind", async () => {
    attempt = makeAttempt("exam", { kind: "blueprint" });
    score = makeScore(26, 40);

    document.title = `Question 40 of 40 · ${PRODUCT_NAME}`;
    renderResult();
    await screen.findByRole("heading", { name: en.result.title, level: 1 });

    expect(document.title).toBe(`${en.result.title} · ${PRODUCT_NAME}`);
  });

  it("leaves focus alone when the URL is opened cold", async () => {
    attempt = makeAttempt("exam", { kind: "blueprint" });
    score = makeScore(26, 40);

    renderResult();
    const heading = await screen.findByRole("heading", { name: en.result.title, level: 1 });

    // An ordinary page load. Focusing a tabIndex={-1} heading would put the tab
    // position after it, leaving the skip link behind a Shift+Tab.
    expect(heading).not.toHaveFocus();
  });

  it("leaves focus alone when the result URL is reloaded after an in-app arrival", async () => {
    attempt = makeAttempt("exam", { kind: "blueprint" });
    score = makeScore(26, 40);

    // The state a reload actually restores: the key the `replace` navigation
    // wrote into `history.state` is still there, so `location.key` is NOT
    // "default" — but this is a genuine page load with nothing to announce.
    renderResult({ pathname: `/sonuc/${ATTEMPT_ID}`, key: "restored-from-history-state" });
    const heading = await screen.findByRole("heading", { name: en.result.title, level: 1 });

    expect(heading).not.toHaveFocus();
  });

  it("moves focus to the heading when the session hands over", async () => {
    attempt = makeAttempt("exam", { kind: "blueprint" });
    score = makeScore(26, 40);

    // The positive control for the two above: without it they would still pass
    // with the hook deleted.
    renderArrival();
    const heading = await screen.findByRole("heading", { name: en.result.title, level: 1 });

    await waitFor(() => {
      expect(heading).toHaveFocus();
    });
  });
});

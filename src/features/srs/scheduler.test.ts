import { describe, expect, it } from "vitest";
import { fsrs, Rating, type Grade } from "ts-fsrs";

import {
  deckRevisions,
  deckUpdatesForWrongAnswers,
  fromFsrsCard,
  gradeCard,
  isDue,
  newCard,
  previewDue,
  reviseCard,
  toFsrsCard,
} from "./scheduler";
import type { SrsCard } from "@/lib/db/db";

const NOW = Date.UTC(2026, 9, 2, 10, 0, 0);
const MINUTE = 60_000;
const DAY = 86_400_000;

describe("newCard", () => {
  it("is new and due immediately", () => {
    const card = newCard("ctfl4-0001", "ctfl-v4.0.1", NOW);

    expect(card).toMatchObject({
      questionId: "ctfl4-0001",
      certId: "ctfl-v4.0.1",
      state: "new",
      reps: 0,
      lapses: 0,
      addedAt: NOW,
    });
    expect(card.lastReviewedAt).toBeUndefined();
    expect(isDue(card, NOW)).toBe(true);
  });
});

describe("gradeCard", () => {
  it("moves a new card through the 1 and 10 minute learning steps", () => {
    const card = newCard("ctfl4-0001", "ctfl-v4.0.1", NOW);

    const again = gradeCard(card, "again", NOW);
    expect(again.state).toBe("learning");
    expect(again.due).toBe(NOW + MINUTE);
    expect(again.lastReviewedAt).toBe(NOW);

    const good = gradeCard(card, "good", NOW);
    expect(good.due).toBe(NOW + 10 * MINUTE);
    expect(good.reps).toBe(1);
  });

  it("graduates a card rated easy straight to review, days away", () => {
    const easy = gradeCard(newCard("ctfl4-0001", "ctfl-v4.0.1", NOW), "easy", NOW);

    expect(easy.state).toBe("review");
    expect(easy.due - NOW).toBeGreaterThanOrEqual(DAY);
    expect(easy.scheduledDays).toBeGreaterThanOrEqual(1);
  });

  it("counts a lapse when a review card is failed", () => {
    const review = gradeCard(newCard("ctfl4-0001", "ctfl-v4.0.1", NOW), "easy", NOW);
    const later = review.due;

    const failed = gradeCard(review, "again", later);
    expect(failed.state).toBe("relearning");
    expect(failed.lapses).toBe(1);
    expect(failed.due).toBe(later + 10 * MINUTE);
  });

  it("keeps the row's identity and the moment it joined the deck", () => {
    const card = { ...newCard("ctfl4-0042", "ctfl-v4.0.1", NOW - DAY) };
    const graded = gradeCard(card, "good", NOW);

    expect(graded.questionId).toBe("ctfl4-0042");
    expect(graded.certId).toBe("ctfl-v4.0.1");
    expect(graded.addedAt).toBe(NOW - DAY);
  });

  /**
   * The stored row drops `elapsed_days` and turns Dates into numbers. If that
   * lost anything the algorithm reads, a card reloaded from disk would be
   * scheduled differently from the same card held in memory.
   */
  it("schedules a card reloaded from its row exactly as the library's own card", () => {
    const scheduler = fsrs({ enable_fuzz: false });
    const RATINGS: Record<"again" | "hard" | "good" | "easy", Grade> = {
      again: Rating.Again,
      hard: Rating.Hard,
      good: Rating.Good,
      easy: Rating.Easy,
    };
    let card = scheduler.next(
      toFsrsCard(newCard("q", "c", NOW), NOW),
      new Date(NOW),
      Rating.Easy,
    ).card;
    let row = fromFsrsCard(card, { questionId: "q", certId: "c", addedAt: NOW });

    let now = NOW;
    for (const grade of ["good", "hard", "again", "good", "easy"] as const) {
      now = Math.max(now + MINUTE, row.due);
      card = scheduler.next(card, new Date(now), RATINGS[grade]).card;
      row = gradeCard(row, grade, now);

      expect(row.due).toBe(card.due.getTime());
      expect(row.stability).toBeCloseTo(card.stability, 10);
      expect(row.difficulty).toBeCloseTo(card.difficulty, 10);
      expect(row.reps).toBe(card.reps);
      expect(row.lapses).toBe(card.lapses);
    }
  });
});

describe("previewDue", () => {
  it("shows for each button the due date that button applies", () => {
    const review = gradeCard(newCard("ctfl4-0001", "ctfl-v4.0.1", NOW), "easy", NOW);
    const at = review.due + DAY;
    const preview = previewDue(review, at);

    for (const grade of ["again", "hard", "good", "easy"] as const) {
      expect(preview[grade]).toBe(gradeCard(review, grade, at).due);
    }
    expect(preview.again).toBeLessThan(preview.hard);
    expect(preview.hard).toBeLessThanOrEqual(preview.good);
    expect(preview.good).toBeLessThan(preview.easy);
  });
});

describe("deckUpdatesForWrongAnswers", () => {
  const CERT = "ctfl-v4.0.1";

  it("adds a question that is not in the deck as a new card, due now", () => {
    const [card, ...rest] = deckUpdatesForWrongAnswers(["ctfl4-0001"], new Map(), CERT, NOW);

    expect(rest).toHaveLength(0);
    expect(card).toMatchObject({ questionId: "ctfl4-0001", state: "new", due: NOW });
  });

  it("rates a card already under review as a failed review", () => {
    const review = gradeCard(newCard("ctfl4-0001", CERT, NOW - 30 * DAY), "easy", NOW - 30 * DAY);
    const [updated] = deckUpdatesForWrongAnswers(
      ["ctfl4-0001"],
      new Map([["ctfl4-0001", review]]),
      CERT,
      NOW,
    );

    expect(updated).toEqual(gradeCard(review, "again", NOW));
    expect(updated?.lapses).toBe(1);
  });

  it("leaves a card that is still new alone — it is already due", () => {
    const card: SrsCard = newCard("ctfl4-0001", CERT, NOW - DAY);
    const updates = deckUpdatesForWrongAnswers(
      ["ctfl4-0001"],
      new Map([["ctfl4-0001", card]]),
      CERT,
      NOW,
    );

    expect(updates).toEqual([]);
  });

  it("writes one row per question even if the id is repeated", () => {
    const updates = deckUpdatesForWrongAnswers(["ctfl4-0001", "ctfl4-0001"], new Map(), CERT, NOW);

    expect(updates).toHaveLength(1);
  });
});

describe("deckUpdatesForWrongAnswers and revisions (F3-11)", () => {
  const CERT = "ctfl-v4.0.1";
  const revisionOf = (id: string) => (id === "ctfl4-0001" ? 3 : undefined);

  it("records the revision the wrong answer was given to, on a new card and a failed one", () => {
    const [added] = deckUpdatesForWrongAnswers(["ctfl4-0001"], new Map(), CERT, NOW, revisionOf);
    expect(added?.revision).toBe(3);

    const review = gradeCard(
      newCard("ctfl4-0001", CERT, NOW - 30 * DAY, 2),
      "easy",
      NOW - 30 * DAY,
    );
    const [failed] = deckUpdatesForWrongAnswers(
      ["ctfl4-0001"],
      new Map([["ctfl4-0001", review]]),
      CERT,
      NOW,
      revisionOf,
    );
    expect(failed).toMatchObject({ state: "relearning", revision: 3 });
  });

  it("keeps a card's revision through a grade", () => {
    const card = newCard("ctfl4-0001", CERT, NOW, 2);

    expect(gradeCard(card, "good", NOW).revision).toBe(2);
  });
});

describe("reviseCard", () => {
  const CERT = "ctfl-v4.0.1";
  const review = (revision?: number): SrsCard => ({
    ...gradeCard(newCard("ctfl4-0001", CERT, NOW - 30 * DAY), "easy", NOW - 30 * DAY),
    ...(revision === undefined ? {} : { revision }),
  });

  it("sends a card in review back to relearning, due now, without counting a lapse", () => {
    const before = review(1);
    const revised = reviseCard(before, 2, NOW);

    expect(revised).toMatchObject({
      state: "relearning",
      due: NOW,
      learningSteps: 0,
      revision: 2,
      lapses: before.lapses,
      stability: before.stability,
      reps: before.reps,
    });
  });

  it("leaves a card alone when the revision has not moved", () => {
    expect(reviseCard(review(2), 2, NOW)).toBeNull();
    expect(reviseCard(review(3), 2, NOW)).toBeNull();
  });

  it("lets a card written before F3-11 adopt the current revision and keep its schedule", () => {
    const before = review();

    expect(reviseCard(before, 4, NOW)).toEqual({ ...before, revision: 4 });
  });

  it("brings a card still being learned due now, in the state it is in", () => {
    const learning = { ...gradeCard(newCard("ctfl4-0001", CERT, NOW, 1), "good", NOW) };
    expect(learning.state).toBe("learning");

    expect(reviseCard(learning, 2, NOW)).toMatchObject({
      state: "learning",
      due: NOW,
      revision: 2,
    });
  });

  it("leaves a revised card one the scheduler grades normally", () => {
    const revised = reviseCard(review(1), 2, NOW);
    if (!revised) throw new Error("expected a revised card");

    const good = gradeCard(revised, "good", NOW);
    expect(good.state).toBe("review");
    expect(good.due).toBeGreaterThan(NOW);
    expect(good.lapses).toBe(revised.lapses);
  });
});

describe("deckRevisions", () => {
  it("returns only the cards that change, and skips a question no longer in the index", () => {
    const CERT = "ctfl-v4.0.1";
    const stale = { ...gradeCard(newCard("ctfl4-0001", CERT, NOW - DAY, 1), "easy", NOW - DAY) };
    const current = newCard("ctfl4-0002", CERT, NOW, 1);
    const gone = newCard("ctfl4-0003", CERT, NOW, 1);
    const revisions = new Map([
      ["ctfl4-0001", 2],
      ["ctfl4-0002", 1],
    ]);

    const rows = deckRevisions([stale, current, gone], (id) => revisions.get(id), NOW);

    expect(rows.map((row) => row.questionId)).toEqual(["ctfl4-0001"]);
    expect(rows[0]).toMatchObject({ state: "relearning", revision: 2 });
  });
});

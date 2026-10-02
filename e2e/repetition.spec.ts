import { test, expect, type Page } from "@playwright/test";

import { publishedQuestionId, seedDueCard, storedCard } from "./deck";

import {
  answerCurrentQuestion,
  correctOptionIds,
  en,
  fill,
  partial,
  questionCounter,
  totalQuestions,
} from "./labels";

/**
 * F3-01 / F3-02 — the repetition deck and its review screen.
 *
 * The deck is written by finishing a session, so the first test drives a real
 * practice set and checks that what the home screen counts is what the
 * candidate actually got wrong. The rest seed one card straight into
 * IndexedDB: the review screen's behaviour must not depend on how many
 * guesses happened to miss.
 *
 * Every test starts in its own browser context, so IndexedDB is empty.
 */

/** The ids of the options ticked on the visible question. */
async function selectedOptionIds(page: Page): Promise<string[]> {
  return page
    .getByRole("article")
    .locator("input:checked")
    .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));
}

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

function cardCounter(current: number, total: number): string {
  return fill(en.repetition.card, { current, total });
}

test("the questions a practice set got wrong are the ones the home screen offers to repeat", async ({
  page,
}) => {
  await page.goto("/alistirma");
  // Instant feedback stays on (the default): the reveal marks the keyed
  // options, which is how this test learns, question by question, whether the
  // guess it made was wrong.
  await page.getByRole("button", { name: en.practice.start }).click();
  const total = await totalQuestions(page);

  let wrong = 0;
  for (let index = 1; index <= total; index += 1) {
    await expect(page.getByText(questionCounter(index))).toBeVisible();
    await answerCurrentQuestion(page);
    await expect(page.getByRole("heading", { name: en.review.whyTitle })).toBeVisible();

    const chosen = await selectedOptionIds(page);
    const keyed = await correctOptionIds(page);
    if (!sameSet(chosen, keyed)) wrong += 1;

    if (index < total) await page.getByRole("button", { name: en.exam.next }).click();
  }

  await page.getByRole("button", { name: en.practice.finish }).click();
  await page.getByRole("button", { name: en.practice.confirmFinish }).click();
  await expect(page).toHaveURL(/\/sonuc\/[\w-]+$/);

  await page.goto("/");
  const link = page.getByRole("link", {
    name: fill(wrong === 1 ? en.home.repetitionDue_one : en.home.repetitionDue_other, {
      count: wrong,
    }),
  });

  // Ten first-option guesses all landing is about one in a million; if it
  // happens, the deck is rightly empty and the home screen rightly offers
  // nothing.
  if (wrong === 0) {
    await expect(page.getByRole("link", { name: en.home.repetitionNone })).toHaveCount(0);
    return;
  }

  await link.click();
  await expect(page.getByText(cardCounter(1, wrong))).toBeVisible();
});

test("a deck with nothing in it says how a question gets there", async ({ page }) => {
  await page.goto("/tekrar");

  await expect(page.getByRole("heading", { name: en.repetition.title, level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: en.repetition.emptyTitle })).toBeVisible();
  await expect(page.getByText(en.repetition.emptyBody)).toBeVisible();
});

test("rating a card stores the schedule the button showed, and empties the queue", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const questionId = await publishedQuestionId(page);
  await seedDueCard(page, questionId);

  await page.goto("/tekrar");
  await expect(page.getByText(cardCounter(1, 1))).toBeVisible();
  await expect(page.getByRole("heading", { name: en.repetition.gradeTitle })).toHaveCount(0);

  await answerCurrentQuestion(page);
  await expect(page.getByRole("heading", { name: en.repetition.gradeTitle })).toBeVisible();

  const right = sameSet(await selectedOptionIds(page), await correctOptionIds(page));
  // Every grade button, whichever its label: each one names its interval.
  const grades = page.getByRole("button", {
    name: partial(en.repetition.dueIn, { interval: ".+" }),
  });

  // A wrong answer is not a matter of confidence: only "Again" is offered.
  await expect(grades).toHaveCount(right ? 4 : 1);
  await expect(
    page.getByText(right ? en.repetition.gradeLead : en.repetition.gradeWrongLead),
  ).toBeVisible();

  // A new card's first "Again" is its first learning step: one minute.
  const again = page.getByRole("button", {
    name: `${en.repetition.again} ${fill(en.repetition.dueIn, { interval: "1 min" })}`,
  });
  await expect(again).toBeVisible();
  await again.click();

  const done = page.getByRole("heading", { name: en.repetition.doneTitle });
  await expect(done).toBeVisible();
  await expect(done).toBeFocused();
  await expect(page.getByText(fill(en.repetition.reviewed_one, { count: 1 }))).toBeVisible();

  const row = await storedCard(page, questionId);
  expect(row.state).toBe("learning");
  expect(row.reps).toBe(1);
  expect(row.lastReviewedAt).toEqual(expect.any(Number));
  expect((row.due as number) - (row.lastReviewedAt as number)).toBe(60_000);
});

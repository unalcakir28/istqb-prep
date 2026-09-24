import { test, expect, type Page } from "@playwright/test";

import {
  answerCurrentQuestion,
  en,
  fill,
  optionInputs,
  partial,
  pattern,
  PRODUCT_NAME,
  questionCounter,
  shownOptionIds,
} from "./labels";

/**
 * F1-15 — full exam flow: home -> setup -> session -> result -> review.
 * Selectors use accessible roles and names, so the test also verifies what
 * a screen reader sees. Adding `data-testid` would break that link.
 *
 * The names themselves come from `en.json` via `./labels`, so UI copy has a
 * single owner — and so do the session helpers. This file used to keep its own
 * copies of them; the shared ones scope every option locator to the question
 * card's `<article>`, which no setup screen renders, so they cannot resolve
 * against a setup screen's own radios and checkboxes mid-navigation.
 */

/** Every test starts from a clean browser state: no half-finished exam leaks in. */
async function clearStorage(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(async () => {
    localStorage.clear();
    const dbs = await indexedDB.databases?.();
    await Promise.all(
      (dbs ?? []).map(
        (info) =>
          new Promise<void>((resolve) => {
            if (!info.name) return resolve();
            const request = indexedDB.deleteDatabase(info.name);
            request.onsuccess = request.onerror = request.onblocked = () => resolve();
          }),
      ),
    );
  });
  await page.reload();
}

test.beforeEach(async ({ page }) => {
  await clearStorage(page);
});

test("a full exam is set up, answered and reviewed from the home page", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByRole("link", { name: en.home.startExam }).click();
  await expect(page).toHaveURL(/\/sinav$/);

  await page.getByRole("button", { name: en.setup.start }).click();
  await expect(page).toHaveURL(/\/sinav\/[\w-]+$/);

  // The total question count comes from meta.json; it is not hard-coded here.
  const counter = page.getByText(questionCounter(1));
  await expect(counter).toBeVisible();
  const total = Number((await counter.innerText()).match(questionCounter(1))![1]);
  expect(total).toBeGreaterThan(0);

  // D-03: the order each question's options were shown in, to hold the
  // review screen to below.
  const shown: string[][] = [];

  for (let index = 1; index <= total; index += 1) {
    await expect(page.getByText(fill(en.exam.question, { current: index, total }))).toBeVisible();
    shown.push(await shownOptionIds(page));
    await answerCurrentQuestion(page);
    if (index < total) await page.getByRole("button", { name: en.exam.next }).click();
  }

  await page.getByRole("button", { name: en.exam.submit }).click();
  await expect(page.getByText(en.exam.submitConfirmBodyAll)).toBeVisible();
  await page.getByRole("button", { name: en.exam.confirmSubmit }).click();

  await expect(page).toHaveURL(/\/sonuc\/[\w-]+$/);
  const resultHeading = page.getByRole("heading", { name: en.result.title, level: 1 });
  await expect(resultHeading).toBeVisible();
  // Everything was answered: the score cannot exceed the total and nothing is left empty.
  const score = pattern(en.result.score, { points: "\\d+", total: String(total) });
  await expect(page.getByText(score).first()).toBeVisible();

  // The other side of C1's branch. A blueprint attempt is measured against the
  // official pass mark, and that verdict must survive the fix that drops it
  // for a scoped practice set.
  await expect(page.getByText(partial(en.result.passLine, { pass: "\\d+" })).first()).toBeVisible();
  await expect(page.getByRole("link", { name: en.result.retake })).toBeVisible();

  await expect(page).toHaveTitle(`${en.result.title} · ${PRODUCT_NAME}`);
  await expect(resultHeading).toBeFocused();

  await page.getByRole("link", { name: en.result.review }).click();
  await expect(page).toHaveURL(/\/inceleme\/[\w-]+$/);
  const reviewHeading = page.getByRole("heading", { name: en.review.title, level: 1 });
  await expect(reviewHeading).toBeVisible();
  await expect(page).toHaveTitle(`${en.review.title} · ${PRODUCT_NAME}`);
  await expect(reviewHeading).toBeFocused();
  // The product's main differentiator: a per-option rationale on every question.
  await expect(page.getByText(en.review.perOption).first()).toBeVisible();

  // D-03. Every chunk authors its option ids in order (a, b, c, d), so an
  // exam in which every question still reads that way was not shuffled — the
  // chance of that by accident is 1 in 24 per question.
  expect(shown.some((ids) => ids.join() !== [...ids].sort().join())).toBe(true);

  // ...and the review shows each question's options in the order the
  // candidate saw them, although the order is derived rather than stored.
  const cards = page.getByRole("article");
  await expect(cards).toHaveCount(total);
  for (let index = 0; index < total; index += 1) {
    expect(await shownOptionIds(page, cards.nth(index))).toEqual(shown[index]);
  }
});

test("an unfinished exam resumes from the home page", async ({ page }) => {
  await page.getByRole("link", { name: en.home.startExam }).click();
  await page.getByRole("button", { name: en.setup.start }).click();
  await expect(page).toHaveURL(/\/sinav\/[\w-]+$/);
  // The counter is the one thing only a mounted session screen renders, which
  // makes it the guard to wait on after navigating in. Belt-and-braces, not
  // load-bearing: every option locator below goes through the question-card
  // scope, which cannot resolve on the setup screen either. It stays because
  // the navigation itself is worth asserting.
  await expect(page.getByText(questionCounter(1))).toBeVisible();

  const firstOrder = await shownOptionIds(page);
  await answerCurrentQuestion(page);
  await page.getByRole("button", { name: en.exam.next }).click();
  await expect(page.getByText(questionCounter(2))).toBeVisible();
  const sessionUrl = page.url();

  await page.goto("/");
  await expect(page.getByText(en.home.resumeTitle)).toBeVisible();
  await page.getByRole("link", { name: en.home.resume }).click();

  await expect(page).toHaveURL(sessionUrl);

  // A full reload: state comes back from IndexedDB rather than memory, which
  // proves the answer really was written to disk.
  await page.reload();

  // An unfinished exam resumes at the FIRST UNANSWERED question
  // (resumeAttempt); question 1 is answered, so it must open on question 2.
  await expect(page.getByText(questionCounter(2))).toBeVisible();

  await page.getByRole("button", { name: en.exam.previous }).click();
  await expect(page.getByText(questionCounter(1))).toBeVisible();
  // D-03: the reload rebuilt the option order from the stored seed, so the
  // first row is still the one that was ticked.
  expect(await shownOptionIds(page)).toEqual(firstOrder);
  await expect(optionInputs(page).first()).toBeChecked();
});

test("the selected answer survives a question-language switch", async ({ page }) => {
  await page.getByRole("link", { name: en.home.startExam }).click();
  await page.getByRole("button", { name: en.setup.start }).click();
  // The setup screen has radios of its own (duration, language) and React
  // Router keeps it on screen until the session's chunk paints. `optionInputs`
  // is scoped to the question card and cannot match them, but the stem read
  // below is unscoped, so the session is asserted up before anything is read.
  await expect(page).toHaveURL(/\/sinav\/[\w-]+$/);
  await expect(page.getByText(questionCounter(1))).toBeVisible();

  const first = optionInputs(page).first();
  await first.check();

  // The starting question language depends on the interface language, which
  // depends on the browser locale. The test does not rely on that chain: it
  // switches to Turkish first, so the language it switches away from is known
  // whatever the locale is. The buttons' accessible names are their sr-only
  // text; the "TR" / "EN" badges are aria-hidden.
  await page.getByRole("radio", { name: en.question.showTurkish, exact: true }).click();

  // The switch is read from the QUESTION STEM, not from an option: on
  // questions with numeric options ("19", "67%") both languages render the
  // same option text.
  const stem = page.locator(".prose-question").first();
  const turkishStem = await stem.innerText();

  await page.getByRole("radio", { name: en.question.showEnglish, exact: true }).click();
  await expect(stem).not.toHaveText(turkishStem);

  await expect(optionInputs(page).first()).toBeChecked();
});

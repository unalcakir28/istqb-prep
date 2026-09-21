import { test, expect, type Page } from "@playwright/test";

import { en, fill, pattern } from "./labels";

/**
 * F1-15 — full exam flow: home -> setup -> session -> result -> review.
 * Selectors use accessible roles and names, so the test also verifies what
 * a screen reader sees. Adding `data-testid` would break that link.
 *
 * The names themselves come from `en.json` via `./labels`, so UI copy has a
 * single owner.
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

/** Option controls: radio for a single-answer question, checkbox for a multi. */
function options(page: Page) {
  return page.getByRole("radio").or(page.getByRole("checkbox"));
}

/** Ticks as many options as the visible question requires. */
async function answerCurrentQuestion(page: Page): Promise<void> {
  const checkboxes = page.getByRole("checkbox");
  const isMulti = (await checkboxes.count()) > 0;

  if (!isMulti) {
    await page.getByRole("radio").first().check();
    return;
  }

  // A "WHICH TWO" question — exactly two options get ticked.
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
}

/** The question counter, with the total left open as a capture group. */
function counterPattern(current: number) {
  return pattern(en.exam.question, { current: String(current), total: "(\\d+)" });
}

test.beforeEach(async ({ page }) => {
  await clearStorage(page);
});

test("a full exam is set up, answered and reviewed from the home page", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByRole("link", { name: en.home.startExam }).click();
  await expect(page).toHaveURL(/\/deneme$/);

  await page.getByRole("button", { name: en.setup.start }).click();
  await expect(page).toHaveURL(/\/deneme\/[\w-]+$/);

  // The total question count comes from meta.json; it is not hard-coded here.
  const counter = page.getByText(counterPattern(1));
  await expect(counter).toBeVisible();
  const total = Number((await counter.innerText()).match(counterPattern(1))![1]);
  expect(total).toBeGreaterThan(0);

  for (let index = 1; index <= total; index += 1) {
    await expect(page.getByText(fill(en.exam.question, { current: index, total }))).toBeVisible();
    await answerCurrentQuestion(page);
    if (index < total) await page.getByRole("button", { name: en.exam.next }).click();
  }

  await page.getByRole("button", { name: en.exam.submit }).click();
  await expect(page.getByText(en.exam.submitConfirmBodyAll)).toBeVisible();
  await page.getByRole("button", { name: en.exam.confirmSubmit }).click();

  await expect(page).toHaveURL(/\/sonuc\/[\w-]+$/);
  await expect(page.getByRole("heading", { name: en.result.title, level: 1 })).toBeVisible();
  // Everything was answered: the score cannot exceed the total and nothing is left empty.
  const score = pattern(en.result.score, { points: "\\d+", total: String(total) });
  await expect(page.getByText(score).first()).toBeVisible();

  await page.getByRole("link", { name: en.result.review }).click();
  await expect(page).toHaveURL(/\/inceleme\/[\w-]+$/);
  await expect(page.getByRole("heading", { name: en.review.title, level: 1 })).toBeVisible();
  // The product's main differentiator: a per-option rationale on every question.
  await expect(page.getByText(en.review.perOption).first()).toBeVisible();
});

test("an unfinished exam resumes from the home page", async ({ page }) => {
  await page.getByRole("link", { name: en.home.startExam }).click();
  await page.getByRole("button", { name: en.setup.start }).click();
  await expect(page).toHaveURL(/\/deneme\/[\w-]+$/);

  await answerCurrentQuestion(page);
  await page.getByRole("button", { name: en.exam.next }).click();
  await expect(page.getByText(counterPattern(2))).toBeVisible();
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
  await expect(page.getByText(counterPattern(2))).toBeVisible();

  await page.getByRole("button", { name: en.exam.previous }).click();
  await expect(page.getByText(counterPattern(1))).toBeVisible();
  await expect(options(page).first()).toBeChecked();
});

test("the selected answer survives a question-language switch", async ({ page }) => {
  await page.getByRole("link", { name: en.home.startExam }).click();
  await page.getByRole("button", { name: en.setup.start }).click();
  // The setup screen also has radios (duration and language) and React Router
  // keeps it on screen until the next one loads. Without first asserting that
  // the session is up, `.check()` can hit a duration radio by mistake.
  await expect(page).toHaveURL(/\/deneme\/[\w-]+$/);
  await expect(page.getByText(counterPattern(1))).toBeVisible();

  const first = options(page).first();
  await first.check();

  // The starting question language depends on the interface language, which
  // depends on the browser locale. The test does not rely on that chain: it
  // switches to Turkish first, so the language it switches away from is known
  // whatever the locale is. The buttons' accessible names are their sr-only
  // text; the "TR" / "EN" badges are aria-hidden.
  await page.getByRole("button", { name: en.question.showTurkish }).click();

  // The switch is read from the QUESTION STEM, not from an option: on
  // questions with numeric options ("19", "67%") both languages render the
  // same option text.
  const stem = page.locator(".prose-question").first();
  const turkishStem = await stem.innerText();

  await page.getByRole("button", { name: en.question.showEnglish }).click();
  await expect(stem).not.toHaveText(turkishStem);

  await expect(options(page).first()).toBeChecked();
});

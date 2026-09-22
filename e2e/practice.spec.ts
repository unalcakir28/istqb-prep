import { test, expect, type Page } from "@playwright/test";

import {
  answerCurrentQuestion,
  checkedStates,
  en,
  fill,
  isMultiSelect,
  optionInputs,
  partial,
  pattern,
  PRODUCT_NAME,
  questionCounter,
} from "./labels";

/**
 * Practice mode — the parts that separate it from an exam: instant feedback,
 * the lock it puts on an answered question, and the absence of a clock.
 *
 * Selectors use accessible roles and names, so the specs also verify what a
 * screen reader sees. The names come from `en.json` via `./labels`.
 *
 * Every test here starts in its own browser context, so IndexedDB is already
 * empty and no attempt leaks in from a neighbouring test.
 */

/** The rationale panel is a landmark named after its heading in `en.json`. */
function rationale(page: Page) {
  return page.getByRole("region", { name: en.review.whyTitle });
}

/**
 * Opens a practice session with instant feedback on or off, and leaves the
 * page on the first question.
 *
 * The session screen is a lazy chunk and the setup screen stays mounted until
 * it paints — and the setup screen has radios and checkboxes of its own. The
 * question counter is the guard: only a mounted session screen renders it.
 */
async function startPractice(page: Page, instantFeedback: boolean): Promise<void> {
  await page.goto("/alistirma");

  const feedback = page.getByRole("checkbox", { name: en.practice.instantFeedback });
  await expect(feedback).toBeVisible();
  // On by default; the spec sets it rather than trusting the default.
  await feedback.setChecked(instantFeedback);

  await page.getByRole("button", { name: en.practice.start }).click();
  await expect(page).toHaveURL(/\/alistirma\/[\w-]+$/);
  await expect(page.getByText(questionCounter(1))).toBeVisible();
}

test("instant feedback reveals the rationale and locks every option", async ({ page }) => {
  await startPractice(page, true);

  await answerCurrentQuestion(page);

  await expect(rationale(page)).toBeVisible();
  // The product's differentiator: the panel is per-option, not a single verdict.
  await expect(rationale(page).getByText(en.review.perOption)).toBeVisible();

  const inputs = optionInputs(page);
  const count = await inputs.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    await expect(inputs.nth(index)).toBeDisabled();
  }
});

/**
 * The lock on a revealed answer, driven through the one path that can still
 * reach the store.
 *
 * A click cannot. A `disabled` input dispatches no click event at all — not on
 * itself, not on `document` in the capture phase — so a forced click leaves
 * the selection alone whatever the store does, and the previous spec asserts
 * the inputs are disabled anyway. The 1-9 shortcut is the real bypass:
 * `isTextEntry` in `SessionRunner` deliberately keeps the shortcuts live over
 * radios and checkboxes, so `disabled` does not protect that path and the
 * store's own `revealed` guard is the only thing holding the lock.
 */
test("a revealed answer cannot be changed with the option shortcut", async ({ page }) => {
  await startPractice(page, true);

  // Answering with the keys doubles as the positive control: if the shortcut
  // were dead, nothing would be selected and nothing would reveal, so the
  // lock below could never be mistaken for a key that does nothing.
  const wanted = (await isMultiSelect(page)) ? 2 : 1;
  for (let position = 1; position <= wanted; position += 1) {
    await page.keyboard.press(String(position));
  }

  await expect(rationale(page)).toBeVisible();

  const before = await checkedStates(page);
  expect(before.filter(Boolean)).toHaveLength(wanted);

  const untouched = before.indexOf(false);
  // Every question has at least one option the candidate did not pick, and the
  // row's number is its position in this list.
  expect(untouched).toBeGreaterThanOrEqual(0);

  await page.keyboard.press(String(untouched + 1));

  expect(await checkedStates(page)).toEqual(before);
  await expect(rationale(page)).toBeVisible();
});

test("with instant feedback off, answering reveals nothing", async ({ page }) => {
  await startPractice(page, false);

  await answerCurrentQuestion(page);

  const inputs = optionInputs(page);
  const count = await inputs.count();

  // Positive proof the answer registered, so the absence below cannot be the
  // absence of a rendered question.
  expect((await checkedStates(page)).some(Boolean)).toBe(true);
  for (let index = 0; index < count; index += 1) {
    await expect(inputs.nth(index)).toBeEnabled();
  }

  await expect(rationale(page)).toHaveCount(0);
});

for (const instantFeedback of [true, false]) {
  test(`practice is untimed (instant feedback ${instantFeedback ? "on" : "off"})`, async ({
    page,
  }) => {
    await startPractice(page, instantFeedback);

    // Both halves of `ExamTimer`: the countdown itself and its hide control.
    await expect(page.getByRole("timer")).toHaveCount(0);
    await expect(page.getByRole("button", { name: en.exam.hideTimer })).toHaveCount(0);
    await expect(page.getByRole("button", { name: en.exam.showTimer })).toHaveCount(0);

    // The finish control is present, though: without a clock to auto-submit,
    // it is the only way a practice session can end.
    await expect(page.getByRole("button", { name: en.practice.finish })).toBeVisible();
  });
}

test("finishing a practice session is confirmed before it scores", async ({ page }) => {
  await startPractice(page, true);
  await answerCurrentQuestion(page);

  await page.getByRole("button", { name: en.practice.finish }).click();

  const dialog = page.getByRole("alertdialog", { name: en.practice.finishConfirmTitle });
  await expect(dialog).toBeVisible();

  // Standing down leaves the session exactly where it was.
  await dialog.getByRole("button", { name: en.common.cancel }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/alistirma\/[\w-]+$/);

  await page.getByRole("button", { name: en.practice.finish }).click();
  await page.getByRole("button", { name: en.practice.confirmFinish }).click();

  await expect(page).toHaveURL(/\/sonuc\/[\w-]+$/);
  const heading = page.getByRole("heading", { name: en.result.title, level: 1 });
  await expect(heading).toBeVisible();

  /**
   * C1 — the result screen is shared with the exam, and the pass mark it used
   * to draw is 26, a fact about the 40-question exam alone. The default
   * practice length is 10, so a candidate who answered everything correctly
   * was told they were below the pass mark, on a bar scaled to a number the
   * set could not reach. The verdict is dropped for a scoped set rather than
   * softened — the screen's own principle is honesty, in both directions.
   */
  await expect(page.getByText(en.result.failed)).toHaveCount(0);
  await expect(page.getByText(en.result.passed)).toHaveCount(0);
  await expect(page.getByText(partial(en.result.passLine, { pass: "\\d+" }))).toHaveCount(0);

  // And the way onward is another practice set, not a timed mock exam.
  await expect(page.getByRole("link", { name: en.result.retake })).toHaveCount(0);
  await expect(page.getByRole("link", { name: en.result.retakePractice })).toBeVisible();

  // The result replaces the session with no page load: without these it
  // inherits "Question 10 of 10" as its title and says nothing on arrival.
  await expect(page).toHaveTitle(`${en.result.title} · ${PRODUCT_NAME}`);
  await expect(heading).toBeFocused();
});

/**
 * WCAG 4.1.3 on the setup screen, and the accessibility face of rule 8: a
 * chapter checkbox changes how many questions can be assembled, can raise or
 * clear the shortfall warning and can disable the Start button, all with focus
 * still on the checkbox.
 *
 * Both readouts are live regions that exist from the first paint — the count
 * because it is always rendered, the warning because its container is rendered
 * empty. `toHaveCount(2)` before the toggle is the guard on that: a region
 * mounted with its text already inside it is its own initial state and is
 * entitled to say nothing.
 *
 * Once the warning speaks, the count stands down. The two carry the SAME two
 * figures — "At most 3 of the 40 you asked for can be assembled" and "3 of the
 * 40 you asked for are ready" — so every tick that produced a shortfall was
 * two consecutive polite utterances of one fact. The count is `aria-hidden`
 * rather than unmounted: it is still on screen, and it is the only signal
 * there is in the healthy state.
 */
test("the pool shortfall and the achievable count are announced, not swapped in silence", async ({
  page,
}) => {
  await page.goto("/alistirma");
  await expect(page.getByRole("button", { name: en.practice.start })).toBeVisible();

  const regions = page.getByRole("status");
  await expect(regions).toHaveCount(2);

  const warning = regions.filter({ hasText: en.practice.poolWarningTitle });
  await expect(warning).toHaveCount(0);

  // The number next to the Start button says what it counts, in its own
  // region. It used to borrow the result screen's score key and read out as a
  // bare "3 / 40".
  const readout = page.getByText(
    pattern(en.practice.achievableCount, { available: "\\d+", required: "\\d+" }),
  );
  await expect(readout).toBeVisible();
  await expect(readout).toHaveRole("status");

  // 40 questions out of chapter 6 alone — the shortest chapter in the
  // syllabus. The pool cannot fill that, and saying so is the whole point of
  // this screen.
  await page.getByRole("radio", { name: en.practice.scopeChapters }).check();
  await page
    .getByRole("checkbox", { name: new RegExp(`^${fill(en.setup.chapter, { number: 6 })}\\b`) })
    .check();
  await page.getByRole("radio", { name: "40", exact: true }).check();

  await expect(warning).toBeVisible();
  // The warning filled the region it already had rather than mounting a new
  // one, and it is now the only one left in the tree: the count has stood
  // down rather than repeat its two figures after it.
  await expect(regions).toHaveCount(1);
  await expect(warning).toHaveCount(1);

  // Stood down, not taken away — it is still on screen, and still says what it
  // counts the moment the shortfall clears.
  await expect(readout).toBeVisible();
  await expect(readout).toHaveAttribute("aria-hidden", "true");
});

/**
 * /deneme was the exam's address before the three modes landed. Bookmarks and
 * in-progress attempts still point at it, so both forms keep working.
 */
test("the legacy /deneme path redirects to the exam setup screen", async ({ page }) => {
  await page.goto("/deneme");

  await expect(page).toHaveURL(/\/sinav$/);
  await expect(page.getByRole("button", { name: en.setup.start })).toBeVisible();
});

test("a legacy /deneme/:attemptId link redirects into the same exam session", async ({ page }) => {
  await page.goto("/sinav");
  await page.getByRole("button", { name: en.setup.start }).click();
  await expect(page).toHaveURL(/\/sinav\/[\w-]+$/);
  await expect(page.getByText(questionCounter(1))).toBeVisible();

  const attemptId = new URL(page.url()).pathname.split("/").pop();
  expect(attemptId).toBeTruthy();

  await page.goto(`/deneme/${attemptId}`);

  await expect(page).toHaveURL(new RegExp(`/sinav/${attemptId}$`));
  // The attempt itself came back, not just the URL.
  await expect(page.getByText(questionCounter(1))).toBeVisible();
});

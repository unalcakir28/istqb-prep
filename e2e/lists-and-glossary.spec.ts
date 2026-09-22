import { test, expect, type Page } from "@playwright/test";

import { answerCurrentQuestion, en, fill, questionCounter } from "./labels";

/**
 * The two screens that read back what the candidate has already done, and the
 * one that does not depend on them at all.
 *
 * `/listelerim` is derived: nothing writes to it, so the only honest way to
 * test it is to finish a real session first and then check that the screen
 * says what actually happened. `/sozluk` is static content and is tested cold.
 *
 * Every test starts in its own browser context, so IndexedDB is empty and no
 * attempt leaks in from a neighbouring test.
 */

/** Finishes a two-question practice set, answering the first and skipping the second. */
async function finishShortPractice(page: Page): Promise<void> {
  await page.goto("/alistirma");

  // Instant feedback off: it locks an answer, and this helper wants to move on
  // after answering rather than read the rationale.
  await page.getByRole("checkbox", { name: en.practice.instantFeedback }).setChecked(false);
  await page.getByRole("button", { name: en.practice.start }).click();
  await expect(page.getByText(questionCounter(1))).toBeVisible();

  await answerCurrentQuestion(page);

  await page.getByRole("button", { name: en.practice.finish }).click();
  await page.getByRole("button", { name: en.practice.confirmFinish }).click();
  await expect(page).toHaveURL(/\/sonuc\/[\w-]+$/);
}

test.describe("my lists", () => {
  test("says so plainly before there is anything to list", async ({ page }) => {
    await page.goto("/listelerim");

    await expect(page.getByRole("heading", { name: en.lists.title, level: 1 })).toBeVisible();
    await expect(page.getByText(en.lists.noSessions)).toBeVisible();

    // The three sections still exist — an empty list is a fact about the
    // candidate, not a missing feature.
    await expect(
      page.getByRole("heading", { name: new RegExp(en.lists.wrongTitle) }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: new RegExp(en.lists.shakyTitle) }),
    ).toBeVisible();
  });

  test("lists a question answered once as still shaky, and offers to practise it", async ({
    page,
  }) => {
    await finishShortPractice(page);
    await page.goto("/listelerim");

    await expect(page.getByText(en.lists.noSessions)).toBeHidden();

    // One correct answer is not two in a row, so whatever was answered is on
    // the shaky list whichever way it went.
    const shaky = page
      .getByRole("region")
      .filter({ has: page.getByRole("heading", { name: new RegExp(en.lists.shakyTitle) }) });
    await expect(shaky.getByRole("listitem").first()).toBeVisible();

    // The list's own button starts a real session over exactly those ids.
    await shaky
      .getByRole("button", { name: new RegExp(en.lists.practise_one.split("{{")[0]) })
      .click();
    await expect(page).toHaveURL(/\/alistirma\/[\w-]+$/);
    await expect(page.getByText(questionCounter(1))).toBeVisible();
  });
});

test.describe("glossary", () => {
  test("searches both languages at once and says how many matched", async ({ page }) => {
    await page.goto("/sozluk");

    await expect(page.getByRole("heading", { name: en.glossary.title, level: 1 })).toBeVisible();
    // Rule 5 on screen: the absence of definitions is stated, not left to be
    // noticed.
    await expect(page.getByText(en.glossary.noDefinitions)).toBeVisible();

    const search = page.getByRole("searchbox", { name: en.glossary.searchLabel });

    // An English word finds its row...
    await search.fill("regression");
    await expect(page.getByText("regression testing")).toBeVisible();

    // ...and so does the Turkish one, in the same box.
    await search.fill("regresyon");
    await expect(page.getByText("regression testing")).toBeVisible();

    await search.fill("zzzzzz");
    await expect(page.getByText(en.glossary.noMatch)).toBeVisible();
    await expect(page.getByText(fill(en.glossary.resultCount_other, { count: 0 }))).toBeVisible();
  });

  test("shows the Turkish word that is deliberately NOT used", async ({ page }) => {
    await page.goto("/sozluk");

    await page.getByRole("searchbox", { name: en.glossary.searchLabel }).fill("defect");

    // A candidate who learned "kusur" from an older book has to be told it is
    // wrong; hiding it means they never find out.
    await expect(page.getByText(fill(en.glossary.notUsed, { terms: "kusur" }))).toBeVisible();
  });
});

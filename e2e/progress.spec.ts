import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import ctfl from "../data/ctfl-v4.0.1/meta.json" with { type: "json" };
import { en, fill } from "./labels";

/**
 * F3-05 / F3-06 — the progress screen, and the readiness estimate under a
 * timed mock exam's result.
 */

test("with nothing done yet, the progress screen says what each part waits for", async ({
  page,
}) => {
  await page.goto("/ilerleme");

  await expect(page.getByRole("heading", { level: 1, name: en.progress.title })).toBeVisible();
  await expect(
    page.getByText(fill(en.progress.readinessNeedMore_other, { count: 3 })),
  ).toBeVisible();
  await expect(page.getByText(en.progress.streakNone)).toBeVisible();
  await expect(page.getByText(en.progress.examsNone)).toBeVisible();
  await expect(page.getByText(en.progress.chaptersNone)).toBeVisible();
});

test("a finished timed mock exam shows up in the estimate, the trend and the streak", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: en.home.startExam }).click();
  await page.getByRole("button", { name: en.setup.start }).click();
  await expect(page).toHaveURL(/\/sinav\/[\w-]+$/);

  // Nothing answered: a fail, which is all the estimate needs to count it.
  await page.getByRole("button", { name: en.exam.submit }).click();
  await page.getByRole("button", { name: en.exam.confirmSubmit }).click();
  await expect(page).toHaveURL(/\/sonuc\/[\w-]+$/);

  await expect(
    page.getByText(fill(en.progress.readinessNeedMore_other, { count: 2 })),
  ).toBeVisible();
  await page.getByRole("link", { name: en.progress.seeProgress }).click();

  await expect(page.getByRole("heading", { level: 1, name: en.progress.title })).toBeVisible();
  await expect(
    page.getByText(fill(en.progress.readinessNeedMore_other, { count: 2 })),
  ).toBeVisible();
  await expect(page.getByText(fill(en.progress.streakDays_one, { count: 1 }))).toBeVisible();

  const exams = page.getByRole("region", { name: en.progress.examsTitle });
  await expect(
    exams.getByText(fill(en.progress.examNotPassed, { points: 0, total: ctfl.exam.totalPoints })),
  ).toBeVisible();

  // The bars and the pass line drawn over them: scanned with a row present,
  // in both themes. The theme is set before a page load, never flipped live
  // (see a11y.spec.ts), so the second scan reloads.
  for (const theme of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.reload();
    await expect(exams.getByRole("listitem")).toHaveCount(1);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations.map((violation) => `${theme}: ${violation.id}`)).toEqual([]);
  }
});

import { test, expect, type Page } from "@playwright/test";

import ctai from "../data/ct-ai-v2.0/meta.json" with { type: "json" };
import { en, escapeRegExp, fill, pattern } from "./labels";

/**
 * F4-01 — the second certification (ADR-0006).
 *
 * CTFL stays the default, which is why every other spec still runs against
 * it untouched. These tests pick CT-AI v2.0 the way a candidate does — on the
 * home screen — and hold the one thing CTFL never exercised: a paper of 40
 * questions worth 44 points.
 */

function picker(page: Page) {
  return page.getByRole("group", { name: en.home.certificationLabel });
}

function pickerButton(page: Page, acronym: string) {
  return picker(page).getByRole("button", { name: new RegExp(`^${acronym} v`) });
}

const CTAI_HEADING = fill(en.home.heroTitle, { name: ctai.name.en });

test("the home screen switches to CT-AI, and the choice survives a reload", async ({ page }) => {
  await page.goto("/");
  await expect(pickerButton(page, "CTFL")).toHaveAttribute("aria-pressed", "true");
  await expect(pickerButton(page, "CT-AI")).toHaveAttribute("aria-pressed", "false");

  await pickerButton(page, "CT-AI").click();

  await expect(page.getByRole("heading", { level: 1, name: CTAI_HEADING })).toBeVisible();
  // The page under the picker was replaced; focus is back where it was.
  await expect(pickerButton(page, "CT-AI")).toBeFocused();
  await expect(pickerButton(page, "CT-AI")).toHaveAttribute("aria-pressed", "true");

  // A K3 question is worth 2: the figure says so, in words, from the blueprint.
  const levels = new Intl.ListFormat("en", { type: "conjunction" }).format([
    fill(en.home.blueprintLevelPoints_one, { level: "K2", count: 1 }),
    fill(en.home.blueprintLevelPoints_other, { level: "K3", count: 2 }),
  ]);
  await expect(
    page.getByText(
      fill(en.home.blueprintPointsMixed, { list: levels, total: ctai.exam.totalPoints }),
      {
        exact: false,
      },
    ),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: CTAI_HEADING })).toBeVisible();
});

test("a CT-AI mock exam is scored in points, not questions", async ({ page }) => {
  await page.goto("/");
  await pickerButton(page, "CT-AI").click();
  await expect(page.getByRole("heading", { level: 1, name: CTAI_HEADING })).toBeVisible();

  await page.getByRole("link", { name: en.home.startExam }).click();
  await page.getByRole("button", { name: en.setup.start }).click();
  await expect(page).toHaveURL(/\/sinav\/[\w-]+$/);
  await expect(
    page.getByText(fill(en.exam.question, { current: 1, total: ctai.exam.questionCount })),
  ).toBeVisible();

  // Nothing answered: the score is 0 of the paper's points, which are not its question count.
  await page.getByRole("button", { name: en.exam.submit }).click();
  await page.getByRole("button", { name: en.exam.confirmSubmit }).click();

  await expect(page).toHaveURL(/\/sonuc\/[\w-]+$/);
  await expect(
    page
      .getByText(pattern(en.result.score, { points: "0", total: String(ctai.exam.totalPoints) }))
      .first(),
  ).toBeVisible();
});

test("a link to a CT-AI objective opens it, and switches the site to CT-AI", async ({ page }) => {
  await page.goto("/calisma/lo/AI-6.1.5");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("AI-6.1.5").first()).toBeVisible();

  await page.goto("/");
  await expect(pickerButton(page, "CT-AI")).toHaveAttribute("aria-pressed", "true");
});

test("CT-AI says which version TTB examines, on the home and setup screens (F4-09)", async ({
  page,
}) => {
  // The notice ends on the day TTB moves to v2.0; pin the day so the spec does not expire.
  await page.clock.setFixedTime(new Date(2026, 9, 5));
  const anyNotice = page.getByRole("heading", {
    name: pattern(en.ttbPaper.title, { acronym: "\\S+", examined: "\\S+" }),
  });
  const ctaiNotice = page.getByRole("heading", {
    name: fill(en.ttbPaper.title, {
      acronym: ctai.acronym,
      examined: ctai.ttbPaper.syllabusVersion,
    }),
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(anyNotice).toHaveCount(0);

  await pickerButton(page, "CT-AI").click();
  await expect(ctaiNotice).toBeVisible();
  // The notice lands after the focused picker, so the pick announcement names it.
  await expect(
    page.getByRole("status").filter({ hasText: en.ttbPaper.title.split("{{")[0] }),
  ).toHaveText(
    new RegExp(
      `${escapeRegExp(
        fill(en.ttbPaper.title, {
          acronym: ctai.acronym,
          examined: ctai.ttbPaper.syllabusVersion,
        }),
      )}$`,
    ),
  );

  for (const path of ["/calisma", "/alistirma", "/sinav"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(ctaiNotice).toBeVisible();
  }

  // The footer carries a link with the same name; take the notice's own.
  await page
    .getByRole("region", {
      name: fill(en.ttbPaper.title, {
        acronym: ctai.acronym,
        examined: ctai.ttbPaper.syllabusVersion,
      }),
    })
    .getByRole("link", { name: en.ttbPaper.link })
    .click();
  await expect(page).toHaveURL(/\/sinav-sureci$/);
});

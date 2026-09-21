import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import { en } from "./labels";

/**
 * F1-18 — no critical accessibility violation on any main route.
 *
 * The exam screen must be fully usable from the keyboard (docs/06 §7): a
 * candidate must be able to pick an option without reaching for the mouse.
 * The scan runs in both the light and the dark theme, because colour
 * contrast differs per theme and dark is the default.
 */
const THEMES = ["light", "dark"] as const;

async function scan(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  // If there is a violation, the output must name it; a bare count
  // comparison does not tell you what to fix.
  expect(
    results.violations.map(
      (violation) =>
        `${violation.id} (${violation.nodes.length}): ${violation.help}\n${violation.nodes
          .map((node) => `    ${node.target.join(" ")} — ${node.failureSummary ?? ""}`)
          .join("\n")}`,
    ),
  ).toEqual([]);
}

/**
 * The theme is set BEFORE the page opens. The app runs its own theme logic on
 * startup, so changing the class from the outside afterwards races with it and
 * produced intermittent colour-contrast failures in the dark theme.
 */
async function setTheme(page: Page, theme: (typeof THEMES)[number]): Promise<void> {
  await page.emulateMedia({ colorScheme: theme });
}

for (const theme of THEMES) {
  test(`the home page is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await scan(page);
  });

  test(`the setup screen is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/deneme");
    await expect(page.getByRole("button", { name: en.setup.start })).toBeVisible();
    await scan(page);
  });

  test(`the sources page is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/kaynaklar");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await scan(page);
  });

  test(`the exam screen is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/deneme");
    await page.getByRole("button", { name: en.setup.start }).click();
    await expect(page).toHaveURL(/\/deneme\/[\w-]+$/);
    await scan(page);
  });
}

test("an option can be selected with the keyboard on the exam screen", async ({ page }) => {
  await page.goto("/deneme");
  await page.getByRole("button", { name: en.setup.start }).click();
  await expect(page).toHaveURL(/\/deneme\/[\w-]+$/);

  // The first question may be a "WHICH TWO" one, and then the options render
  // as checkboxes rather than radios. The test must not depend on the type.
  const firstOption = page.getByRole("radio").or(page.getByRole("checkbox")).first();
  await firstOption.focus();
  await page.keyboard.press("Space");
  await expect(firstOption).toBeChecked();
});

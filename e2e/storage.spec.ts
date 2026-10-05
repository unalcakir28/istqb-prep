import { test, expect } from "@playwright/test";

import { en } from "./labels";

/**
 * F3-12 — whether this browser keeps the progress. A private window is not
 * detected (src/lib/storage.ts); what is detected is storage that does not
 * open, and a browser that has not promised to keep the data.
 */

test("a browser whose storage does not open is warned on every screen", async ({ page }) => {
  // The same thing a browser with site data blocked does: no IndexedDB.
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", { value: undefined, configurable: true });
  });

  await page.goto("/");
  const warning = page.getByRole("alert").filter({ hasText: en.storage.unavailable });
  await expect(warning).toBeVisible();

  await warning.getByRole("link", { name: en.storage.unavailableLink }).click();
  await expect(page).toHaveURL(/\/verilerim$/);
  await expect(page.getByText(en.myData.storageUnavailable)).toBeVisible();
  // The warning stays, without a link to the page it is on.
  await expect(warning).toBeVisible();
  await expect(warning.getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("button", { name: en.myData.storageAsk })).toHaveCount(0);
});

test("a first visit is told where the progress lives, and how to keep a copy", async ({ page }) => {
  await page.goto("/");
  const notice = page.getByText(en.home.startHereStorage);
  await expect(notice).toBeVisible();

  await page.getByRole("link", { name: en.home.startHereStorageLink }).click();
  await expect(page).toHaveURL(/\/verilerim$/);
});

test("a browser that saves the progress says whether it keeps it, and can be asked to", async ({
  page,
}) => {
  await page.goto("/verilerim");
  const section = page.getByRole("region", { name: en.myData.storageTitle });
  await expect(section).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: en.storage.unavailable })).toHaveCount(0);

  const ask = section.getByRole("button", { name: en.myData.storageAsk });
  // Headless Chromium usually has not granted persistence yet; where it has,
  // the section says so and offers nothing to press.
  if ((await ask.count()) === 0) {
    await expect(section.getByText(en.myData.storagePersistent)).toBeVisible();
    return;
  }

  await expect(section.getByText(en.myData.storageBestEffort)).toBeVisible();
  await ask.click();
  await expect(section.getByRole("status")).toHaveText(
    new RegExp(`${en.myData.storageGranted}|${en.myData.storageRefused}`.replace(/[.;]/g, "\\$&")),
  );
});

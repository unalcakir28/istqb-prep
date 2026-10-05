import { test, expect } from "@playwright/test";

import { en } from "./labels";

/**
 * F3-13 — a screen whose content never reached this device says so offline,
 * instead of "Something went wrong". The dev server has no service worker,
 * so the content request is failed by hand and the browser is then taken
 * offline: what is under test is the notice, not the cache.
 */
test("content that never loaded is explained as offline, and recovers its wording online", async ({
  page,
  context,
}) => {
  await page.route("**/data/**/terms.json", (route) => route.abort("internetdisconnected"));
  await page.goto("/sozluk");

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText(en.common.errorTitle);

  await context.setOffline(true);
  await expect(heading).toHaveText(en.common.offlineTitle);
  await expect(page.getByText(en.common.offlineBody)).toBeVisible();

  await context.setOffline(false);
  await expect(heading).toHaveText(en.common.errorTitle);
  await expect(page.getByText(en.common.offlineBody)).toHaveCount(0);
});

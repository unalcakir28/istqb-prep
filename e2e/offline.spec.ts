import { test, expect } from "@playwright/test";

import { en } from "./labels";

/**
 * F3-13 — a screen whose content never reached this device says so offline,
 * instead of "Something went wrong", and loads by itself once the network is
 * back. The dev server has no service worker,
 * so the content request is failed by hand and the browser is then taken
 * offline: what is under test is the notice, not the cache.
 */
test("content that never loaded is explained as offline, and loads on its own once back online", async ({
  page,
  context,
}) => {
  const terms = "**/data/**/terms.json";
  await page.route(terms, (route) => route.abort("internetdisconnected"));
  await page.goto("/sozluk");

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toHaveText(en.common.errorTitle);

  await context.setOffline(true);
  await expect(heading).toHaveText(en.common.offlineTitle);
  await expect(page.getByText(en.common.offlineBody)).toBeVisible();

  // The network is back, and the request would now succeed: the notice
  // retries by itself, as its text promised.
  await page.unroute(terms);
  await context.setOffline(false);
  await expect(heading).toHaveText(en.glossary.title);
});

import { test, expect } from "@playwright/test";

import { en } from "./labels";

/**
 * F4-07 — the exam process guide: reached from the footer on every width,
 * and every section that states a fact links the page it comes from.
 */

test("the footer leads to the exam process guide, whose sections name their sources", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("contentinfo").getByRole("link", { name: en.footer.process }).click();

  await expect(page).toHaveURL(/\/sinav-sureci$/);
  await expect(page.getByRole("heading", { level: 1, name: en.process.title })).toBeFocused();

  const register = page.getByRole("region", { name: en.process.registerTitle });
  const source = register.getByRole("link", { name: en.process.page.ctflRegistration });
  await expect(source).toHaveAttribute("href", /turkishtestingboard\.org\/en\/register\//);
  await expect(source).toHaveAttribute("target", "_blank");

  // The one section with nothing to cite says so instead of linking.
  const notFound = page.getByRole("region", { name: en.process.notFoundTitle });
  await expect(notFound.getByRole("link")).toHaveCount(0);
});

import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * F1-18 — her ana rotada kritik erisilebilirlik ihlali olmamali.
 *
 * Sinav ekrani klavyeyle tam kullanilabilir olmali (docs/06 §7): aday
 * fareye uzanmadan sik secebilmeli. Tarama hem acik hem koyu temada
 * kosar — renk kontrasti temaya gore degisir ve koyu tema varsayilan.
 */
const THEMES = ["light", "dark"] as const;

async function scan(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  // Ihlal varsa hangisi oldugu ciktida gorunsun; ciplak bir sayi
  // karsilastirmasi neyi duzeltecegini soylemez.
  expect(
    results.violations.map(
      (violation) => `${violation.id} (${violation.nodes.length}): ${violation.help}`,
    ),
  ).toEqual([]);
}

async function setTheme(page: Page, theme: (typeof THEMES)[number]): Promise<void> {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((value) => {
    document.documentElement.classList.toggle("dark", value === "dark");
  }, theme);
}

for (const theme of THEMES) {
  test(`ana sayfa erisilebilir (${theme})`, async ({ page }) => {
    await page.goto("/");
    await setTheme(page, theme);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await scan(page);
  });

  test(`kurulum ekrani erisilebilir (${theme})`, async ({ page }) => {
    await page.goto("/deneme");
    await setTheme(page, theme);
    await expect(page.getByRole("button", { name: "Denemeyi başlat" })).toBeVisible();
    await scan(page);
  });

  test(`kaynaklar sayfasi erisilebilir (${theme})`, async ({ page }) => {
    await page.goto("/kaynaklar");
    await setTheme(page, theme);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await scan(page);
  });

  test(`sinav ekrani erisilebilir (${theme})`, async ({ page }) => {
    await page.goto("/deneme");
    await page.getByRole("button", { name: "Denemeyi başlat" }).click();
    await expect(page).toHaveURL(/\/deneme\/[\w-]+$/);
    await setTheme(page, theme);
    await scan(page);
  });
}

test("sinav ekraninda sik klavyeyle secilebilir", async ({ page }) => {
  await page.goto("/deneme");
  await page.getByRole("button", { name: "Denemeyi başlat" }).click();
  await expect(page).toHaveURL(/\/deneme\/[\w-]+$/);

  // Ilk soru "HANGI IKISI" tipinde olabilir; o zaman sikler radio degil
  // checkbox olarak cizilir. Test soru tipine bagimli olmamali.
  const firstOption = page.getByRole("radio").or(page.getByRole("checkbox")).first();
  await firstOption.focus();
  await page.keyboard.press("Space");
  await expect(firstOption).toBeChecked();
});

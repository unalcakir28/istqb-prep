import { defineConfig, devices } from "@playwright/test";

/**
 * F1-15 / F1-18 — uctan uca ve erisilebilirlik testleri.
 *
 * Vitest birim testlerinden ayri tutulur: `yarn test` hizli kalmali, E2E
 * gercek tarayici acar. Ikisi ayri komutlardir (`yarn e2e`).
 */
const PORT = 5183;
const HOST = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  use: {
    baseURL: HOST,
    trace: "on-first-retry",
  },

  // Arayuz dili `navigator.language` ile secilir (src/lib/i18n). Testler
  // Turkce etiketlere bakiyor, dolayisiyla tarayici da Turkce acilmali.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], locale: "tr-TR" } }],

  webServer: {
    command: `yarn dev --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: HOST,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // GITHUB_ACTIONS set ise vite uygulamayi '/istqb-prep/' altina tasir ve
    // baseURL tutmaz. E2E her ortamda kok yoldan kossun.
    env: { GITHUB_ACTIONS: "" },
  },
});

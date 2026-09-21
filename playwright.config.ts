import { defineConfig, devices } from "@playwright/test";

/**
 * F1-15 / F1-18 — end-to-end and accessibility tests.
 *
 * Kept separate from the Vitest unit tests: `yarn test` has to stay fast,
 * while E2E opens a real browser. They are two different commands (`yarn e2e`).
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

  // The full-exam test answers 40 questions one by one (~120 interactions) and
  // the dev server compiles modules on first request; 30s was not enough under load.
  timeout: 60_000,

  use: {
    baseURL: HOST,
    trace: "on-first-retry",
  },

  // The interface language is picked from `navigator.language` (src/lib/i18n).
  // The tests assert on English labels, so the browser must open in English.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], locale: "en-US" } }],

  webServer: {
    command: `yarn dev --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: HOST,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // With GITHUB_ACTIONS set, vite moves the app under '/istqb-prep/' and the
    // baseURL no longer matches. E2E must run from the root path everywhere.
    env: { GITHUB_ACTIONS: "" },
  },
});

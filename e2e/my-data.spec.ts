import { readFile } from "node:fs/promises";

import { test, expect, type Page } from "@playwright/test";

import { publishedQuestionId, seedDueCard, storedCard } from "./deck";
import { en, fill, pattern } from "./labels";

/**
 * F3-08 — the progress file: download it in one browser, load it in another.
 *
 * Each test starts in its own browser context, so its IndexedDB is empty; the
 * second browser in the round trip is a second context, which is exactly what
 * "another device" is from the app's point of view.
 */

async function openMyData(page: Page): Promise<void> {
  await page.goto("/verilerim");
  await expect(page.getByRole("heading", { name: en.myData.title, level: 1 })).toBeVisible();
}

function chooseFile(page: Page, name: string, contents: string) {
  return page.getByLabel(en.myData.chooseFile).setInputFiles({
    name,
    mimeType: "application/json",
    buffer: Buffer.from(contents),
  });
}

test("a downloaded copy loads into another browser, and loading it twice adds nothing", async ({
  page,
  browser,
  baseURL,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const questionId = await publishedQuestionId(page);
  await seedDueCard(page, questionId);

  await openMyData(page);
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: en.myData.exportAction }).click();
  const download = await downloading;

  expect(download.suggestedFilename()).toMatch(/^istqb-prep-progress-\d{4}-\d{2}-\d{2}\.json$/);
  await expect(
    page.getByText(fill(en.myData.exported, { file: download.suggestedFilename() })),
  ).toBeVisible();

  const path = await download.path();
  const contents = await readFile(path, "utf8");
  const backup = JSON.parse(contents) as { format: string; tables: { srsCards: unknown[] } };
  expect(backup.format).toBe("istqb-prep-progress");
  expect(backup.tables.srsCards).toHaveLength(1);

  // The other device: a fresh context with nothing in it.
  const other = await browser.newContext({ baseURL, locale: "en-US" });
  const second = await other.newPage();
  await openMyData(second);
  await chooseFile(second, download.suggestedFilename(), contents);

  // Read before it is written: the file is described, and nothing has changed yet.
  await expect(
    second.getByText(
      pattern(en.myData.preview, {
        date: ".+",
        sessions: "0",
        answers: "0",
        objectives: "0",
        cards: "1",
      }),
    ),
  ).toBeFocused();
  await expect(second.getByRole("button", { name: en.myData.importAction })).toBeVisible();

  await second.getByRole("button", { name: en.myData.importAction }).click();
  const result = second.getByText(fill(en.myData.imported, { added: 1, updated: 0, kept: 0 }));
  await expect(result).toBeVisible();
  // The button that started the load is gone; focus is on what it did.
  await expect(result).toBeFocused();
  expect((await storedCard(second, questionId)).questionId).toBe(questionId);

  // Same file again: the identical rows tie, and a tie is taken from the file —
  // nothing is added, so the deck still holds one card.
  await chooseFile(second, download.suggestedFilename(), contents);
  await second.getByRole("button", { name: en.myData.importAction }).click();
  await expect(
    second.getByText(fill(en.myData.imported, { added: 0, updated: 1, kept: 0 })),
  ).toBeVisible();

  await second.goto("/tekrar");
  await expect(second.getByText(fill(en.repetition.card, { current: 1, total: 1 }))).toBeVisible();

  await other.close();
});

test("a file that is not a progress file is refused before anything is offered", async ({
  page,
}) => {
  await openMyData(page);

  await chooseFile(page, "notes.json", JSON.stringify({ questions: [] }));
  await expect(page.getByRole("alert")).toHaveText(en.myData.errorNotBackup);
  await expect(page.getByRole("button", { name: en.myData.importAction })).toHaveCount(0);

  await chooseFile(page, "broken.json", "{ not json");
  await expect(page.getByRole("alert")).toHaveText(en.myData.errorNotJson);
});

test("a file saved under another question version warns, and still loads", async ({ page }) => {
  await openMyData(page);

  const old = {
    format: "istqb-prep-progress",
    formatVersion: 1,
    schemaVersion: 3,
    exportedAt: "2026-01-15T09:00:00.000Z",
    dataVersion: "1999.01.01",
    tables: {},
  };
  await chooseFile(page, "old.json", JSON.stringify(old));

  await expect(page.getByText(en.myData.versionWarning)).toBeVisible();

  // Cancel unmounts itself; focus goes back to where the file was chosen.
  await page.getByRole("button", { name: en.common.cancel }).click();
  await expect(page.getByRole("button", { name: en.myData.importAction })).toHaveCount(0);
  await expect(page.getByLabel(en.myData.chooseFile)).toBeFocused();
  await chooseFile(page, "old.json", JSON.stringify(old));
  await page.getByRole("button", { name: en.myData.importAction }).click();
  await expect(
    page.getByText(fill(en.myData.imported, { added: 0, updated: 0, kept: 0 })),
  ).toBeVisible();
});

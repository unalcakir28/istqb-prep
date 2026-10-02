import type { Page } from "@playwright/test";

/**
 * Direct access to the repetition deck in the browser's IndexedDB.
 *
 * The deck is normally written by finishing a session, and one spec does
 * exactly that. The rest need a card in a known state, which no amount of
 * guessing at answers can promise, so they put it there themselves. The app
 * must have opened the database first (any page load does): these helpers
 * open whatever version it created and never upgrade it.
 */

/** Any published question id, read from the index the app itself serves. */
export async function publishedQuestionId(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const response = await fetch("/data/ctfl-v4.0.1/questions/index.json");
    const index = (await response.json()) as { questions: { id: string; status: string }[] };
    const entry = index.questions.find((question) => question.status === "published");
    if (!entry) throw new Error("no published question in the index");
    return entry.id;
  });
}

/** Puts one never-reviewed card, due now, into the deck the app opened. */
export async function seedDueCard(page: Page, questionId: string): Promise<void> {
  await page.evaluate(async (id) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("istqb-prep");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const now = Date.now();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("srsCards", "readwrite");
      tx.objectStore("srsCards").put({
        questionId: id,
        certId: "ctfl-v4.0.1",
        due: now,
        stability: 0,
        difficulty: 0,
        scheduledDays: 0,
        learningSteps: 0,
        reps: 0,
        lapses: 0,
        state: "new",
        addedAt: now,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, questionId);
}

export async function storedCard(page: Page, questionId: string): Promise<Record<string, unknown>> {
  return page.evaluate(async (id) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("istqb-prep");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const row = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const request = db.transaction("srsCards").objectStore("srsCards").get(id);
      request.onsuccess = () => resolve(request.result as Record<string, unknown>);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return row;
  }, questionId);
}

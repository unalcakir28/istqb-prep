/**
 * F3-12 — whether this browser keeps what the app writes.
 *
 * Progress lives only in IndexedDB (rule 7), so two things decide whether it
 * survives: that IndexedDB opens at all, and whether the browser has agreed
 * to keep this site's data rather than evict it under storage pressure
 * (`navigator.storage.persisted()`).
 *
 * A private window is not detected. No API reports it, and the heuristics
 * (quota sizes, feature probes) change between browser versions; a guess
 * presented as a fact would break rule 5. The screens say instead what a
 * private window does to the data, and leave the candidate to know whether
 * they are in one.
 */

import { db } from "@/lib/db/db";

export type StorageStatus =
  /** IndexedDB does not open: nothing is saved. */
  | "unavailable"
  /** The browser agreed to keep the data until the user clears it. */
  | "persistent"
  /** Saved, but the browser may evict it when the device runs low on space. */
  | "best-effort"
  /** Saved; the browser does not say whether it will keep it. */
  | "unknown";

export async function storageStatus(): Promise<StorageStatus> {
  try {
    await db.open();
  } catch {
    return "unavailable";
  }

  if (typeof navigator === "undefined" || !navigator.storage?.persisted) return "unknown";
  try {
    return (await navigator.storage.persisted()) ? "persistent" : "best-effort";
  } catch {
    return "unknown";
  }
}

/**
 * Asks the browser to keep the data. Called from a button only: Firefox
 * answers with a permission prompt, which must never appear unasked.
 */
export async function requestPersistence(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

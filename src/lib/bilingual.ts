/**
 * F2-06 — reading a question in both languages at once.
 *
 * This is a DISPLAY preference, not a property of the attempt. `contentLang`
 * stays exactly what it was: the primary language, the one the attempt records
 * and the one a screen reader announces first. Side-by-side only adds the
 * other language beside it.
 *
 * It is kept out of the attempt on purpose. An attempt records what the
 * candidate was reading, and "both" is not a language — persisting it there
 * would make `Attempt.contentLang` a three-valued field that every consumer
 * would have to translate back into a real language.
 *
 * Stored in localStorage rather than IndexedDB because it is a chrome setting
 * that must be known before anything async has resolved, exactly like the
 * theme.
 */

import type { Lang } from "@/types/content";

const STORAGE_KEY = "istqb-prep:side-by-side";

export function readSideBySide(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    // Storage disabled (private tab): the feature still works for the session.
    return false;
  }
}

export function writeSideBySide(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Not persisting the preference is not a reason to refuse to apply it.
  }
}

/** The other language — what side-by-side shows beside the primary one. */
export function otherLang(lang: Lang): Lang {
  return lang === "tr" ? "en" : "tr";
}

/**
 * What the three-way language control shows as selected. `both` is a state of
 * the control, never of the content: the primary language underneath it is
 * still `lang`.
 */
export type LangChoice = Lang | "both";

export function langChoice(lang: Lang, sideBySide: boolean): LangChoice {
  return sideBySide ? "both" : lang;
}

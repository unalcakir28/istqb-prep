/**
 * F1-04 — UI language.
 *
 * IMPORTANT: the UI language and the CONTENT language are separate concepts.
 * - UI language: buttons, headings, menus. Managed here.
 * - Content language: whether the question and its rationale are shown in
 *   TR or EN. Kept separate during the exam session, because a candidate
 *   may want to leave the UI in Turkish while reading the question in
 *   English — the real exam booklet is bilingual too.
 *
 * `<html lang>` is always set to the UI language; the question body carries
 * its own `lang` attribute, so the screen reader pronounces it correctly.
 */

import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import type { Lang } from "@/types/content";
import tr from "./locales/tr.json";
import en from "./locales/en.json";

export const UI_LANGUAGES = ["tr", "en"] as const;
export type UiLanguage = (typeof UI_LANGUAGES)[number];

/**
 * CONTENT language options, named in their own language. Independent of the
 * UI language (see the note above); the same list is presented on the setup
 * and review screens.
 */
export const CONTENT_LANGUAGES: { value: Lang; label: string }[] = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "English" },
];

const STORAGE_KEY = "istqb-prep:ui-lang";

function isUiLanguage(value: unknown): value is UiLanguage {
  return typeof value === "string" && (UI_LANGUAGES as readonly string[]).includes(value);
}

/** Stored preference > browser language > Turkish. */
export function detectUiLanguage(): UiLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isUiLanguage(stored)) return stored;
  } catch {
    // localStorage access can throw in private browsing; fall back to the default.
  }

  const browser = typeof navigator === "undefined" ? "" : navigator.language.slice(0, 2);
  return isUiLanguage(browser) ? browser : "tr";
}

export function setUiLanguage(language: UiLanguage): void {
  void i18next.changeLanguage(language);
  document.documentElement.lang = language;

  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Still works within the session even if the preference isn't persisted.
  }
}

void i18next.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: detectUiLanguage(),
  fallbackLng: "tr",
  interpolation: { escapeValue: false },
  returnNull: false,
});

if (typeof document !== "undefined") {
  document.documentElement.lang = i18next.language;
}

export default i18next;

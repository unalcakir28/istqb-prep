/**
 * F1-04 — Arayuz dili.
 *
 * ONEMLI: arayuz dili ile ICERIK dili ayri kavramlardir.
 * - Arayuz dili: dugmeler, basliklar, menuler. Burada yonetilir.
 * - Icerik dili: sorunun ve gerekcenin TR mi EN mi gosterildigi. Sinav
 *   oturumunda ayri tutulur, cunku aday arayuzu Turkce birakip soruyu
 *   Ingilizce okumak isteyebilir — gercek sinav kitapcigi da iki dillidir.
 *
 * `<html lang>` her zaman ARAYUZ diline ayarlanir; soru govdesi kendi `lang`
 * ozniteligini tasir, boylece ekran okuyucu dogru sesletir.
 */

import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import tr from "./locales/tr.json";
import en from "./locales/en.json";

export const UI_LANGUAGES = ["tr", "en"] as const;
export type UiLanguage = (typeof UI_LANGUAGES)[number];

const STORAGE_KEY = "istqb-prep:ui-lang";

function isUiLanguage(value: unknown): value is UiLanguage {
  return typeof value === "string" && (UI_LANGUAGES as readonly string[]).includes(value);
}

/** Kayitli tercih > tarayici dili > Turkce. */
export function detectUiLanguage(): UiLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isUiLanguage(stored)) return stored;
  } catch {
    // Gizli sekmede localStorage erisimi atabilir; varsayilana duseriz.
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
    // Tercih kalici olmazsa da oturum icinde calisir.
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

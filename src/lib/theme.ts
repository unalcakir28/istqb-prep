/**
 * Dark mode is a first-class citizen (docs/06 §1.4): the target developer
 * audience skews dark, and none of the competitors even advertise a dark
 * mode.
 *
 * The theme must be applied before the first paint; otherwise a dark-mode
 * user sees a flash of white screen. The small script inside `index.html`
 * does that; the code here handles switching and listening.
 */

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "istqb-prep:theme";

function prefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // If storage is disabled, fall back to the system preference.
  }
  return "system";
}

export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference === "system") return prefersDark() ? "dark" : "light";
  return preference;
}

export function applyTheme(preference: ThemePreference): void {
  const resolved = resolveTheme(preference);
  document.documentElement.classList.toggle("dark", resolved === "dark");

  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Still works within the session even if the preference isn't persisted.
  }
}

/** If the user chose "system", tracks the OS theme live. */
export function watchSystemTheme(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};

  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

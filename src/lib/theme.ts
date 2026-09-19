/**
 * Karanlik mod birinci siniftir (docs/06 §1.4): kitle gelistirici ve
 * rakiplerin hicbiri karanlik mod ilan etmiyor.
 *
 * Tema, ilk boyamadan once uygulanmalidir; aksi halde koyu tema kullanicisi
 * bir kare beyaz ekran gorur. `index.html` icindeki kucuk betik bunu yapar,
 * buradaki kod ise degistirme ve dinleme isini ustlenir.
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
    // Depolama kapaliysa sistem tercihiyle devam.
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
    // Tercih kalici olmasa da oturum icinde calisir.
  }
}

/** Kullanici "sistem" sectiyse isletim sistemi temasini canli takip eder. */
export function watchSystemTheme(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};

  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

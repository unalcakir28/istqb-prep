import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "istqb-prep:theme";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
        <span className="text-lg font-semibold">ISTQB-PREP</span>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--fg)] hover:bg-[var(--surface-2)]"
        >
          {theme === "dark" ? "Açık mod" : "Koyu mod"}
        </button>
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold">ISTQB Temel Seviye sınavına hazırlan</h1>
        <p className="text-[var(--fg-muted)]">
          40 soru · 60 dakika · geçme notu 26/40. Bu iskelet, araç zincirinin çalıştığını
          doğrulamak için var — sınav motoru henüz burada değil.
        </p>
      </main>
    </div>
  );
}

export default App;

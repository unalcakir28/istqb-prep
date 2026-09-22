import { Suspense, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Spinner } from "./Spinner";
import { setUiLanguage, UI_LANGUAGES, type UiLanguage } from "@/lib/i18n";
import { PRODUCT_NAME } from "@/lib/product";
import {
  applyTheme,
  readThemePreference,
  resolveTheme,
  watchSystemTheme,
  type ThemePreference,
} from "@/lib/theme";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function ThemeToggle() {
  const { t } = useTranslation();
  const [preference, setPreference] = useState<ThemePreference>(readThemePreference);

  useEffect(() => {
    applyTheme(preference);
    if (preference !== "system") return;
    return watchSystemTheme(() => applyTheme("system"));
  }, [preference]);

  const resolved = resolveTheme(preference);

  return (
    <button
      type="button"
      onClick={() => setPreference(resolved === "dark" ? "light" : "dark")}
      className="grid size-9 place-items-center rounded-[var(--radius-btn)] border border-border text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
      aria-label={t("nav.theme")}
      title={t("nav.theme")}
    >
      {resolved === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/** UI language — NOT the question's language. That is managed separately during the exam session. */
function UiLanguageToggle() {
  const { t, i18n } = useTranslation();
  const active = i18n.language as UiLanguage;

  return (
    <div
      className="flex rounded-[var(--radius-btn)] border border-border p-0.5"
      role="group"
      aria-label={t("nav.uiLanguage")}
    >
      {UI_LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setUiLanguage(lang)}
          aria-pressed={active === lang}
          className={
            active === lang
              ? "rounded-[6px] bg-accent px-2.5 py-1 text-xs font-semibold text-accent-fg"
              : "rounded-[6px] px-2.5 py-1 text-xs font-medium text-fg-muted hover:text-fg"
          }
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function Layout() {
  const { t } = useTranslation();
  const location = useLocation();

  // During any of the three modes' sessions, nothing but the question appears
  // on screen (docs/06 §1.1): the top nav and footer are hidden. Covers
  // /sinav/:attemptId, /alistirma/:attemptId and /calisma/lo/:loCode/:attemptId.
  const isSessionScreen =
    /^\/sinav\/[^/]+$|^\/alistirma\/[^/]+$|^\/calisma\/lo\/[^/]+\/[^/]+$/.test(location.pathname);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        {t("app.skipToContent")}
      </a>

      {!isSessionScreen && (
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
            <Link to="/" className="font-semibold tracking-tight">
              {PRODUCT_NAME}
            </Link>

            <nav className="ml-auto hidden items-center gap-1 sm:flex">
              <NavLink
                to="/listelerim"
                className={({ isActive }) =>
                  isActive
                    ? "rounded-[var(--radius-btn)] px-3 py-1.5 text-sm font-medium text-fg"
                    : "rounded-[var(--radius-btn)] px-3 py-1.5 text-sm text-fg-muted hover:text-fg"
                }
              >
                {t("nav.lists")}
              </NavLink>
              <NavLink
                to="/sozluk"
                className={({ isActive }) =>
                  isActive
                    ? "rounded-[var(--radius-btn)] px-3 py-1.5 text-sm font-medium text-fg"
                    : "rounded-[var(--radius-btn)] px-3 py-1.5 text-sm text-fg-muted hover:text-fg"
                }
              >
                {t("nav.glossary")}
              </NavLink>
              <NavLink
                to="/kaynaklar"
                className={({ isActive }) =>
                  isActive
                    ? "rounded-[var(--radius-btn)] px-3 py-1.5 text-sm font-medium text-fg"
                    : "rounded-[var(--radius-btn)] px-3 py-1.5 text-sm text-fg-muted hover:text-fg"
                }
              >
                {t("nav.sources")}
              </NavLink>
            </nav>

            <div className="ml-auto flex items-center gap-2 sm:ml-0">
              <UiLanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}

      <main id="main" className="flex-1">
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>

      {!isSessionScreen && (
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 text-xs text-fg-muted">
            <span>{t("footer.disclaimerShort")}</span>
            <Link to="/kaynaklar" className="underline underline-offset-2 hover:text-fg">
              {t("footer.sources")}
            </Link>
            {/* The top nav is hidden below `sm`, so without this the saved
                lists have no entry point at all on a phone. */}
            <Link to="/listelerim" className="underline underline-offset-2 hover:text-fg sm:hidden">
              {t("nav.lists")}
            </Link>
            <Link to="/sozluk" className="underline underline-offset-2 hover:text-fg sm:hidden">
              {t("nav.glossary")}
            </Link>
          </div>
        </footer>
      )}
    </div>
  );
}

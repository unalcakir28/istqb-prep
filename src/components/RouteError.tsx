import { useRouteError, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Error caught at the route boundary. The message is shown to the user
 * because this app has no server-side log — if the error isn't visible here,
 * it's never reported at all.
 */
export function RouteError() {
  const error = useRouteError() as Error | undefined;
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-20">
      <h1 className="text-2xl font-semibold">{t("common.errorTitle")}</h1>
      {error?.message ? (
        <p className="rounded-[var(--radius-card)] border border-border bg-surface-2 p-4 font-mono text-sm text-fg-muted">
          {error.message}
        </p>
      ) : null}
      <Link
        to="/"
        className="w-fit rounded-[var(--radius-btn)] bg-accent px-4 py-2 font-medium text-accent-fg"
      >
        {t("result.backHome")}
      </Link>
    </main>
  );
}

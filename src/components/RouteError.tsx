import { useRouteError, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Rota sinirinda yakalanan hata. Mesaj kullaniciya gosterilir cunku bu
 * uygulamada sunucu logu yok — hata gorunmezse hic bildirilmez.
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

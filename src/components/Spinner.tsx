import { useTranslation } from "react-i18next";

/**
 * Yukleniyor gostergesi. `role="status"` ile ekran okuyucuya duyurulur;
 * gorsel animasyon prefers-reduced-motion'da CSS tarafindan durdurulur.
 */
export function Spinner({ full = false }: { full?: boolean }) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      className={full ? "flex min-h-screen items-center justify-center" : "flex justify-center py-12"}
    >
      <span className="sr-only">{t("common.loading")}</span>
      <span
        aria-hidden="true"
        className="size-6 animate-spin rounded-full border-2 border-border border-t-accent"
      />
    </div>
  );
}

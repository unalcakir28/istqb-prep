import { useTranslation } from "react-i18next";

/**
 * Loading indicator. Announced to the screen reader via `role="status"`;
 * the visual animation is stopped by CSS under prefers-reduced-motion.
 */
export function Spinner({ full = false }: { full?: boolean }) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      className={
        full ? "flex min-h-screen items-center justify-center" : "flex justify-center py-12"
      }
    >
      <span className="sr-only">{t("common.loading")}</span>
      <span
        aria-hidden="true"
        className="size-6 animate-spin rounded-full border-2 border-border border-t-accent"
      />
    </div>
  );
}

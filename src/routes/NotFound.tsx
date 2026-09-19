import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-20">
      <h1 className="text-2xl font-semibold">{t("common.notFoundTitle")}</h1>
      <p className="text-fg-muted">{t("common.notFoundBody")}</p>
      <Link
        to="/"
        className="w-fit rounded-[var(--radius-btn)] bg-accent px-4 py-2 font-medium text-accent-fg"
      >
        {t("result.backHome")}
      </Link>
    </main>
  );
}

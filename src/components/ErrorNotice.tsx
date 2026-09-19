import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Icerik inmedigi icin cizilemeyen ekranin yerini alan bildirim.
 *
 * Kurulum, sonuc ve inceleme ekranlari bunu birebir ayni isaretlemeyle
 * kopyalamisti. Yeniden denemenin anlamli oldugu yerde (ana sayfa) dugme,
 * digerlerinde ana sayfaya donus baglantisi gosterilir.
 */
export interface ErrorNoticeProps {
  onRetry?: () => void;
}

const ACTION =
  "w-fit rounded-[var(--radius-btn)] border border-border px-4 py-2 font-medium hover:bg-surface-2";

export function ErrorNotice({ onRetry }: ErrorNoticeProps) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t("common.errorTitle")}</h1>

      {onRetry ? (
        <button type="button" onClick={onRetry} className={ACTION}>
          {t("common.retry")}
        </button>
      ) : (
        <Link to="/" className={ACTION}>
          {t("result.backHome")}
        </Link>
      )}
    </div>
  );
}

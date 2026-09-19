import { useTranslation } from "react-i18next";

import type { Lang } from "@/types/content";

/**
 * Content language switch — the language of the QUESTION, not of the
 * interface. The interface toggle lives in the site header and is a separate
 * control (see `src/lib/i18n/index.ts`): a candidate may well want Turkish
 * chrome around an English question, because the real exam booklet is
 * bilingual too.
 *
 * Switching never disturbs the answer: the store keeps selections by option
 * id, and this toggle only changes which `i18n` block is rendered, so nothing
 * that holds state is remounted.
 */
export interface ContentLangToggleProps {
  value: Lang;
  onChange: (lang: Lang) => void;
}

const LANGS: Lang[] = ["tr", "en"];

export function ContentLangToggle({ value, onChange }: ContentLangToggleProps) {
  const { t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t("question.contentLang")}
      className="flex shrink-0 rounded-[var(--radius-btn)] border border-border p-0.5"
    >
      {LANGS.map((lang) => {
        // "TR" / "EN" rozeti tek basina anlasilmaz; erisilebilir ad tam cumle.
        const label = lang === "tr" ? t("question.showTurkish") : t("question.showEnglish");

        return (
          <button
            key={lang}
            type="button"
            onClick={() => onChange(lang)}
            aria-pressed={value === lang}
            title={label}
            className={
              value === lang
                ? "rounded-[6px] bg-accent px-2.5 py-1 text-xs font-semibold text-accent-fg"
                : "rounded-[6px] px-2.5 py-1 text-xs font-medium text-fg-muted hover:text-fg"
            }
          >
            <span className="sr-only">{label}</span>
            <span aria-hidden="true">{lang.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}

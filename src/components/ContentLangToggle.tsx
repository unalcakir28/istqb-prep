import { useTranslation } from "react-i18next";

import { SegmentedControl, type Segment } from "./SegmentedControl";
import { langChoice, type LangChoice } from "@/lib/bilingual";
import type { Lang } from "@/types/content";

/**
 * Content language switch — the language of the QUESTION, not of the
 * interface. The interface toggle lives in the site header and is a separate
 * control (see `src/lib/i18n/index.ts`): a candidate may well want Turkish
 * chrome around an English question, because the real exam booklet is
 * bilingual too.
 *
 * Three states, one control (F2-06): TR, EN, and both at once. "Both" is not a
 * third language — the primary language stays whichever single one was last
 * chosen, and it is the one read first and the one the attempt records. That
 * is why pressing TR while in side-by-side turns side-by-side off and leaves
 * Turkish primary, rather than needing a second control to say which side is
 * which.
 *
 * Switching never disturbs the answer: the store keeps selections by option
 * id, and this toggle only changes which `i18n` block is rendered, so nothing
 * that holds state is remounted.
 */
export interface ContentLangToggleProps {
  value: Lang;
  sideBySide?: boolean;
  onChange: (lang: Lang) => void;
  /** Omit to render the plain two-state control, without the side-by-side option. */
  onSideBySideChange?: (on: boolean) => void;
  /** Distinguishes this group's radios when two are on one page. */
  name?: string;
  size?: "sm" | "md";
}

const LANGS: Lang[] = ["tr", "en"];

export function ContentLangToggle({
  value,
  sideBySide = false,
  onChange,
  onSideBySideChange,
  name = "content-lang",
  size = "sm",
}: ContentLangToggleProps) {
  const { t } = useTranslation();
  const bilingual = sideBySide && onSideBySideChange !== undefined;

  function pick(next: LangChoice) {
    if (next === "both") {
      onSideBySideChange?.(true);
      return;
    }

    onSideBySideChange?.(false);
    onChange(next);
  }

  const options: Segment<LangChoice>[] = [
    ...LANGS.map((lang) => ({
      value: lang as LangChoice,
      label: lang.toUpperCase(),
      // A "TR" / "EN" badge means nothing on its own; the accessible name is a
      // full sentence.
      srLabel: lang === "tr" ? t("question.showTurkish") : t("question.showEnglish"),
    })),
    ...(onSideBySideChange
      ? [{ value: "both" as LangChoice, label: "TR+EN", srLabel: t("question.showBoth") }]
      : []),
  ];

  return (
    <SegmentedControl
      label={t("question.contentLang")}
      name={name}
      value={langChoice(value, bilingual)}
      options={options}
      onChange={pick}
      size={size}
    />
  );
}

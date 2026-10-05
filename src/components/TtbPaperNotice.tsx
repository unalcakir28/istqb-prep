/**
 * F4-09 — the version TTB examines, where it differs from the one taught.
 *
 * Through TTB the CT-AI exam is still the v1.0 paper, while this site teaches
 * v2.0 (docs/03 §8). A candidate picks the certification on the home screen
 * and starts from a setup screen, so the notice sits on both, not only on
 * `/sinav-sureci`. Everything it says comes from `meta.ttbPaper`, and it
 * disappears on `replacedOn`, the first exam day TTB names for the new
 * version: no content change has to remember to remove it.
 */

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ttbPaperValues } from "@/lib/ttbPaper";
import type { CertMeta } from "@/types/content";

export function TtbPaperNotice({ meta, now }: { meta: CertMeta; now?: Date }) {
  const { t, i18n } = useTranslation();
  const values = ttbPaperValues(meta, i18n.language, now);
  if (!values) return null;

  return (
    <section
      aria-labelledby="ttb-paper-notice"
      className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-flag/40 bg-flag/10 p-4"
    >
      <h2 id="ttb-paper-notice" className="text-base font-semibold">
        {t("ttbPaper.title", values)}
      </h2>
      <p className="max-w-[65ch] text-sm text-fg-muted">{t("ttbPaper.body", values)}</p>
      <Link to="/sinav-sureci" className="w-fit text-sm underline underline-offset-2">
        {t("ttbPaper.link")}
      </Link>
    </section>
  );
}

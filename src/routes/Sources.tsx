/**
 * F1-C3 — Kaynaklar, gizlilik ve lisans.
 *
 * Hukuki dayanak sayfasi: ISTQB'nin "for non-commercial use" kosulu telif
 * dayanagimiz oldugu icin bagimsizlik beyani acikca yazilir (CLAUDE.md
 * kural 6). Resmi baglantilar meta.json'daki `sources` alanindan gelir;
 * sayfaya elle URL yazilmaz.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Spinner } from "@/components/Spinner";
import { contentClient } from "@/lib/content/contentClient";
import type { CertMeta } from "@/types/content";

/** `syllabusEn` -> `Syllabus EN`. Kaynak anahtarlari dil-bagimsiz kimliklerdir. */
function humanize(key: string): string {
  const words = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(" ");

  return words
    .map((word, index) => {
      if (/^(en|tr|api)$/i.test(word)) return word.toUpperCase();
      if (index > 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export default function Sources() {
  const { t } = useTranslation();
  const [meta, setMeta] = useState<CertMeta | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const manifest = await contentClient.getManifest();
        const cert =
          manifest.certifications.find((item) => item.status === "active") ??
          manifest.certifications[0];
        if (!cert) throw new Error("manifest has no certification");

        const loaded = await contentClient.getMeta(cert.path);
        if (!cancelled) setMeta(loaded);
      } catch {
        // Baglanti listesi inmezse bile feragatname ve gizlilik gosterilir.
        if (!cancelled) setFailed(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!meta && !failed) return <Spinner />;

  const sources = meta ? Object.entries(meta.sources) : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
      <h1 className="text-[28px] font-semibold leading-tight">{t("sources.title")}</h1>

      <p className="max-w-[65ch] rounded-[var(--radius-card)] border border-border bg-surface p-5 text-[15px] leading-relaxed">
        {t("sources.disclaimer")}
      </p>

      <section aria-labelledby="official-links" className="flex flex-col gap-3">
        <h2 id="official-links" className="text-base font-semibold">
          {t("sources.officialLinks")}
        </h2>

        {sources.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("common.errorTitle")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sources.map(([key, url]) => (
              <li
                key={key}
                className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-accent underline underline-offset-2"
                >
                  {humanize(key)}
                </a>
                <span className="break-all font-mono text-xs text-fg-muted">{url}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="privacy" className="flex flex-col gap-2">
        <h2 id="privacy" className="text-base font-semibold">
          {t("sources.privacyTitle")}
        </h2>
        <p className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">
          {t("sources.privacyBody")}
        </p>
      </section>

      <section aria-labelledby="license" className="flex flex-col gap-2">
        <h2 id="license" className="text-base font-semibold">
          {t("sources.licenseTitle")}
        </h2>
        <p className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">
          {t("sources.licenseBody")}
        </p>
      </section>

      <Link
        to="/"
        className="w-fit rounded-[var(--radius-btn)] border border-border px-4 py-2 font-medium hover:bg-surface-2"
      >
        {t("result.backHome")}
      </Link>
    </div>
  );
}

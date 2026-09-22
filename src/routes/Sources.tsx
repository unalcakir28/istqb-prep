/**
 * F1-C3 — Sources, privacy and licence.
 *
 * The legal-basis page: because ISTQB's "for non-commercial use" clause is
 * what our copyright position rests on, the statement of independence is
 * spelled out here (CLAUDE.md rule 6). The official links come from the
 * `sources` field in meta.json; no URL is typed into this page by hand.
 */

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Spinner } from "@/components/Spinner";
import { contentClient } from "@/lib/content/contentClient";
import { useAsyncData } from "@/lib/useAsyncData";
import type { CertMeta } from "@/types/content";

/** `syllabusEn` -> `Syllabus EN`. Source keys are language-independent identifiers. */
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

async function loadMeta(): Promise<CertMeta> {
  const cert = await contentClient.getActiveCertification();
  return contentClient.getMeta(cert.path);
}

export default function Sources() {
  const { t } = useTranslation();
  // The disclaimer and the privacy note show even if the link list fails to load.
  const { data: meta, failed } = useAsyncData(loadMeta);

  if (!meta && !failed) return <Spinner />;

  const sources = meta ? Object.entries(meta.sources) : [];
  const officialExams = meta?.officialSampleExams ?? [];

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

      {/*
        Links, never questions. The sample exams' own copyright notice allows
        attributed extracts for non-commercial use and prohibits every other
        use without ISTQB's written approval, so a candidate who wants the
        official questions is sent to the publisher to answer them there
        (docs/08 §2, ADR-0004, D-07). The notice itself is quoted with
        attribution, which is exactly what its first clause permits.
      */}
      {officialExams.length > 0 ? (
        <section aria-labelledby="official-exams" className="flex flex-col gap-3">
          <h2 id="official-exams" className="text-base font-semibold">
            {t("sources.officialExamsTitle")}
          </h2>

          <p className="max-w-[65ch] text-[15px] leading-relaxed text-fg-muted">
            {t("sources.officialExamsBody")}
          </p>

          <ul className="flex flex-col gap-2">
            {officialExams.map((exam) => (
              <li
                key={`${exam.lang}-${exam.set}`}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3"
              >
                <a
                  href={exam.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-accent underline underline-offset-2"
                >
                  {t("sources.officialExamsSet", { set: exam.set, publisher: exam.publisher })}
                </a>
                <span className="font-mono text-xs uppercase text-fg-muted">{exam.lang}</span>
              </li>
            ))}
          </ul>

          <p className="max-w-[65ch] border-l-2 border-border pl-4 text-[13px] leading-relaxed text-fg-muted">
            {t("sources.officialExamsNotice")}
          </p>
        </section>
      ) : null}

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

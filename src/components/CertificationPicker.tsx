/**
 * F4-01 — the certification the site shows, picked on the home screen.
 *
 * A group of toggle buttons, like the interface-language control, rather than
 * a radio group: a pick reloads the page under it, and arrow keys that moved
 * the selection would reload it on every keypress. Each button says which
 * one it is in full — acronym, version and name — because the acronyms alone
 * (CTFL, CT-AI) mean nothing to someone who has not sat either.
 *
 * Shown only when there are two or more to pick from (`Home.tsx`).
 */

import type { Ref } from "react";
import { useTranslation } from "react-i18next";

import type { Lang } from "@/types/content";

/** What a button names: the manifest's acronym and version, and `meta.json`'s name. */
export interface PickableCertification {
  id: string;
  acronym: string;
  syllabusVersion: string;
  name: Record<Lang, string>;
}

interface Props {
  ref?: Ref<HTMLDivElement>;
  certifications: PickableCertification[];
  selectedId: string;
  onPick: (id: string) => void;
}

export function CertificationPicker({ ref, certifications, selectedId, onPick }: Props) {
  const { t, i18n } = useTranslation();
  const lang: Lang = i18n.language === "en" ? "en" : "tr";

  return (
    <div
      ref={ref}
      role="group"
      aria-labelledby="certification-picker-label"
      className="flex flex-col gap-2"
    >
      <p id="certification-picker-label" className="text-sm font-medium text-fg-muted">
        {t("home.certificationLabel")}
      </p>
      <div className="flex flex-wrap gap-2">
        {certifications.map((cert) => {
          const selected = cert.id === selectedId;
          return (
            <button
              key={cert.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onPick(cert.id)}
              className={
                selected
                  ? "flex flex-col items-start rounded-[var(--radius-btn)] border-2 border-accent bg-accent/10 px-4 py-2 text-left"
                  : "flex flex-col items-start rounded-[var(--radius-btn)] border border-border px-4 py-2 text-left hover:bg-surface-2"
              }
            >
              <span className="flex items-center gap-1.5 font-mono text-sm font-semibold">
                {/* A second cue beside the border colour, for anyone who
                    cannot tell the two borders apart. */}
                {selected ? <span aria-hidden="true">✓</span> : null}
                {cert.acronym} v{cert.syllabusVersion}
              </span>{" "}
              <span className="text-xs text-fg-muted">{cert.name[lang]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * F2-11 — a glossary term in a lesson card, and its definition.
 *
 * A disclosure, not a hover tooltip: a tooltip cannot be opened on a touch
 * screen, and one that stays open, can be hovered and can be dismissed
 * (WCAG 1.4.13) is the kind of component a library exists for. A button that
 * opens the definition in place needs none of that. The definition sits
 * right after the term, so it is read next by a screen reader as well; Escape
 * closes it and returns focus to the term.
 *
 * Its own words (the button's name, the note, "Source:") are in the card's
 * language, not the interface's: they sit inside the card's `lang`, and a
 * screen reader would read them in the wrong voice otherwise.
 *
 * The definition is the ISTQB Glossary's own English text (CC BY 4.0), with
 * the source and licence beside it as the licence asks. There is no Turkish
 * definition: none has a verified source (docs/04 §3.10), and a translation
 * of ours would not be the glossary's.
 */

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import type { LessonGlossary } from "@/features/glossary/lessonGlossary";
import type { Lang } from "@/types/content";

interface GlossaryTermProps {
  /** The words as the card writes them. */
  text: string;
  slug: string;
  glossary: LessonGlossary;
  /** The card's language: a Turkish card says the definition is English. */
  lang: Lang;
}

export function GlossaryTerm({ text, slug, glossary, lang }: GlossaryTermProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const entry = glossary.entries.get(slug);

  if (!entry) return <>{text}</>;

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "Escape" || !open) return;

    event.stopPropagation();
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <span onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t("study.termDefinition", { term: text, lng: lang })}
        onClick={() => setOpen((value) => !value)}
        className="rounded-sm underline decoration-accent decoration-dotted decoration-2 underline-offset-4 hover:text-accent"
      >
        {text}
      </button>
      {open ? (
        <span
          id={panelId}
          className="my-2 block rounded-[var(--radius-card)] border border-border border-l-2 border-l-accent bg-surface-2 p-3 text-sm leading-relaxed"
        >
          <span lang="en" className="block font-semibold">
            {entry.en.term}
          </span>
          <span lang="en" className="block">
            {entry.en.definition}
          </span>
          {lang === "tr" ? (
            <span className="mt-1 block text-fg-muted">
              {t("study.termEnglishOnly", { lng: lang })}
            </span>
          ) : null}
          <span className="mt-1 block text-xs text-fg-muted">
            {t("study.termSource", { lng: lang })}{" "}
            <a
              href={entry.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent underline underline-offset-2"
            >
              {glossary.source}
            </a>
            {" · "}
            <a
              href={glossary.licenseUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent underline underline-offset-2"
            >
              {glossary.license}
            </a>
          </span>
        </span>
      ) : null}
    </span>
  );
}

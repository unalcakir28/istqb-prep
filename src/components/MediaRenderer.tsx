/**
 * F1-14 / F2-09 — the figures a question needs in order to be answerable.
 *
 * The rule this component exists to enforce: **a figure is text**. Every kind
 * renders as a real table, a real `<pre>`, or a written alternative — never as
 * an image with the meaning locked inside it. A K3 question about a decision
 * table is unanswerable without the table, so a candidate who cannot see a
 * picture would simply be unable to sit that question. The schema therefore
 * requires an `alt` for every kind whose natural form is a diagram, and this
 * component renders it rather than hiding it behind an attribute.
 *
 * `caption` is rendered as a real `<caption>` / `<figcaption>`, which is what
 * names the figure for a screen reader moving by table or by region.
 */

import { useTranslation } from "react-i18next";

import type { BilingualRow, Lang, QuestionMedia } from "@/types/content";

interface Props {
  media: QuestionMedia;
  lang: Lang;
  /** F2-06 — the other language, shown beneath. */
  secondaryLang?: Lang;
}

const CELL = "border border-border px-3 py-2 text-left align-top text-[15px]";

function DataTable({
  caption,
  headers,
  rows,
  lang,
}: {
  caption: string;
  headers: BilingualRow;
  rows: BilingualRow[];
  lang: Lang;
}) {
  return (
    // `lang` on the table, not only on the lookup: without it both tables in
    // side-by-side mode inherit the page's language and the second one is read
    // in the wrong voice. `caption`, `th` and `td` inherit it.
    <table lang={lang} className="w-full border-collapse">
      {/* A real caption, not a paragraph above the table: it is the table's
          accessible name, and a reader jumping table to table hears it. */}
      <caption className="mb-2 text-left text-sm font-medium text-fg-muted">{caption}</caption>

      <thead>
        <tr>
          {headers[lang].map((header, index) => (
            <th key={index} scope="col" className={`${CELL} bg-surface-2 font-semibold`}>
              {header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row[lang].map((cell, cellIndex) =>
              // The first cell of each row names the row — a condition, a rule,
              // a state. Marked as a header so a reader reaching a "Y" three
              // columns in is told which row it belongs to.
              cellIndex === 0 ? (
                <th key={cellIndex} scope="row" className={`${CELL} font-medium`}>
                  {cell}
                </th>
              ) : (
                <td key={cellIndex} className={CELL}>
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** The `<pre>` used by both code and control-flow fragments. */
function CodeBlock({ content, language }: { content: string; language: string }) {
  return (
    <pre
      // Code is not prose: `lang` would make a screen reader try to pronounce
      // it as the page's language, and it is not in any human language.
      lang="en"
      data-language={language}
      className="overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface-2 p-4 font-mono text-[14px] leading-relaxed"
    >
      <code>{content}</code>
    </pre>
  );
}

/**
 * The written equivalent of a figure whose natural form is a diagram.
 *
 * Rendered in full, not tucked behind a `<details>`: it is the only form of
 * the figure some candidates get, and a collapsed one is a figure they have to
 * ask for.
 */
function Alternative({
  alt,
  lang,
  secondaryLang,
}: {
  alt: Record<Lang, string>;
  lang: Lang;
  secondaryLang?: Lang;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1.5 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3">
      <p className="text-xs font-semibold uppercase text-fg-muted">{t("media.textAlternative")}</p>
      <p lang={lang} className="max-w-[65ch] text-[15px] leading-relaxed">
        {alt[lang]}
      </p>
      {secondaryLang ? (
        <p
          lang={secondaryLang}
          className="max-w-[65ch] border-l-2 border-border pl-3 text-[15px] leading-relaxed text-fg-muted"
        >
          {alt[secondaryLang]}
        </p>
      ) : null}
    </div>
  );
}

export function MediaRenderer({ media, lang, secondaryLang }: Props) {
  const { t } = useTranslation();

  if (media.kind === "decision-table" || media.kind === "table") {
    return (
      <figure className="flex flex-col gap-3 overflow-x-auto">
        <DataTable
          caption={media.caption[lang]}
          headers={media.headers}
          rows={media.rows}
          lang={lang}
        />

        {/* The second language gets its own table rather than extra columns:
            doubling the columns of a decision table destroys the very shape
            the question is asking the candidate to read. */}
        {secondaryLang ? (
          <DataTable
            caption={media.caption[secondaryLang]}
            headers={media.headers}
            rows={media.rows}
            lang={secondaryLang}
          />
        ) : null}
      </figure>
    );
  }

  if (media.kind === "state-transition") {
    // Rendered as the transition table it already is, rather than as a diagram
    // with a table hidden behind a toggle. The table IS the accessible form,
    // and it is also the form the exam itself uses.
    const headers: BilingualRow = {
      tr: [
        t("media.from", { lng: "tr" }),
        t("media.event", { lng: "tr" }),
        t("media.to", { lng: "tr" }),
      ],
      en: [
        t("media.from", { lng: "en" }),
        t("media.event", { lng: "en" }),
        t("media.to", { lng: "en" }),
      ],
    };
    const rows: BilingualRow[] = media.transitions.map((transition) => ({
      tr: [transition.from, transition.event, transition.to],
      en: [transition.from, transition.event, transition.to],
    }));

    return (
      <figure className="flex flex-col gap-3 overflow-x-auto">
        <DataTable caption={media.caption[lang]} headers={headers} rows={rows} lang={lang} />
        <p className="text-sm text-fg-muted">
          {t("media.states", { states: media.states.join(", ") })}
        </p>
        <Alternative alt={media.alt} lang={lang} secondaryLang={secondaryLang} />
      </figure>
    );
  }

  if (media.kind === "control-flow") {
    return (
      <figure className="flex flex-col gap-3">
        <figcaption className="text-sm font-medium text-fg-muted">{media.caption[lang]}</figcaption>
        <CodeBlock content={media.content} language={media.language} />
        {/* Coverage questions turn on which paths exist. The code alone leaves
            that to be inferred by reading indentation, which is exactly what a
            screen reader cannot do at a glance. */}
        <Alternative alt={media.alt} lang={lang} secondaryLang={secondaryLang} />
      </figure>
    );
  }

  if (media.kind === "code") {
    return (
      <figure className="flex flex-col gap-2">
        <figcaption className="text-sm font-medium text-fg-muted">{media.caption[lang]}</figcaption>
        <CodeBlock content={media.content} language={media.language} />
      </figure>
    );
  }

  if (media.kind !== "image") return null;

  return (
    <figure className="flex flex-col gap-2">
      <img
        src={media.src}
        alt={media.alt[lang]}
        className="max-w-full rounded-[var(--radius-card)] border border-border"
      />
      <figcaption className="text-sm text-fg-muted">{media.caption[lang]}</figcaption>
    </figure>
  );
}

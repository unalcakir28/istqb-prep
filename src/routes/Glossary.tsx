/**
 * F2-05 — the glossary.
 *
 * What it is NOT: the ISTQB Glossary's definitions. Their licence is now
 * verified — CC BY 4.0, confirmed in the browser on 22.09.2026 (F0-02,
 * `docs/evidence/`) — but nothing has been copied yet, and rule 5 says a
 * screen does not imply content it does not have. So it says plainly that
 * these are translations rather than definitions.
 *
 * What it is: the 97 keyword pairs the two official syllabi publish in their
 * own per-chapter keyword lists, aligned positionally rather than translated
 * (`terms.json`, `source.method`). That mapping is the thing a Turkish
 * candidate actually needs and cannot get anywhere else: which English term the
 * exam's Turkish word answers to, and — where the project has banned one — the
 * plausible-looking Turkish word that is NOT the syllabus's.
 *
 * Search runs over both languages at once. A candidate who only knows
 * "regression" and a candidate who only knows "regresyon" both find the row.
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ErrorNotice } from "@/components/ErrorNotice";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Spinner } from "@/components/Spinner";
import { contentClient } from "@/lib/content/contentClient";
import { useArrivalFocus } from "@/lib/useArrivalFocus";
import { useAsyncData } from "@/lib/useAsyncData";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import type { Term, Terms } from "@/types/content";

async function loadTerms(): Promise<Terms> {
  const cert = await contentClient.getActiveCertification();
  return contentClient.getTerms(cert.path);
}

/**
 * Turkish-aware lowercasing.
 *
 * `"I".toLowerCase()` is `"i"` in the default locale but `"ı"` in Turkish, and
 * the terms are full of dotted and dotless i. Searching "ISTQB" or "İzleme"
 * without this misses rows the reader can see on screen.
 */
function fold(text: string): string {
  return text.toLocaleLowerCase("tr");
}

function matches(term: Term, query: string): boolean {
  if (query === "") return true;

  const haystack = [term.en, term.tr, ...(term.trVariants ?? [])].map(fold);
  return haystack.some((text) => text.includes(query));
}

export default function Glossary() {
  const { t } = useTranslation();
  const { data, failed, reload } = useAsyncData(loadTerms);
  const [query, setQuery] = useState("");
  const [chapter, setChapter] = useState<number | null>(null);
  /**
   * The count the live region announces, held one step behind the count on
   * screen. Writing to a live region on every keystroke makes a screen reader
   * queue "N terms" over the user's own typing feedback — worse than silence.
   * The visible count updates immediately; only the announcement waits.
   */
  const [announced, setAnnounced] = useState(0);

  useDocumentTitle(t("glossary.title"));
  const headingRef = useArrivalFocus<HTMLHeadingElement>(Boolean(data));

  const terms = data?.terms;
  const visible = useMemo(() => {
    if (!terms) return [];
    const folded = fold(query.trim());

    return terms.filter(
      (term) => matches(term, folded) && (chapter === null || term.chapters.includes(chapter)),
    );
  }, [terms, query, chapter]);

  const count = visible.length;
  useEffect(() => {
    const timer = window.setTimeout(() => setAnnounced(count), 500);
    return () => window.clearTimeout(timer);
  }, [count]);

  if (failed) return <ErrorNotice onRetry={reload} />;
  if (!data) return <Spinner />;

  const chapters = [...new Set(data.terms.flatMap((term) => term.chapters))].sort((a, b) => a - b);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-2">
        {/* `tabIndex={-1}` only so `useArrivalFocus` can put focus here on an
            in-app navigation; it stays out of the tab order. */}
        <h1 ref={headingRef} tabIndex={-1} className="text-[28px] font-semibold leading-tight">
          {t("glossary.title")}
        </h1>
        <p className="max-w-[65ch] text-[15px] text-fg-muted">
          {t("glossary.intro", { count: data.termCount, version: data.syllabusVersion })}
        </p>
        {/* Rule 5: the reason a term has no definition is stated, not left as
            an apparent omission. */}
        <p className="max-w-[65ch] text-[15px] text-fg-muted">{t("glossary.noDefinitions")}</p>
      </header>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t("glossary.searchLabel")}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("glossary.searchPlaceholder")}
            className="w-full rounded-[var(--radius-btn)] border border-border bg-surface px-3 py-2 text-[15px] outline-none focus-visible:border-accent"
          />
        </label>

        <SegmentedControl
          label={t("glossary.chapterFilter")}
          name="glossary-chapter"
          value={chapter === null ? "all" : String(chapter)}
          onChange={(next) => setChapter(next === "all" ? null : Number(next))}
          size="md"
          options={[
            { value: "all", label: t("glossary.allChapters") },
            ...chapters.map((number) => ({
              value: String(number),
              label: String(number),
              // "3" alone is not a name; the group is about chapters.
              srLabel: t("setup.chapter", { number }),
            })),
          ]}
        />
      </div>

      {/* A count, announced once the typing stops: a search that filters
          silently leaves a screen reader user with no idea anything happened,
          and one that announces on every keystroke talks over them. */}
      <p aria-live="polite" className="text-sm text-fg-muted">
        {t("glossary.resultCount", { count: announced })}
      </p>

      {visible.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-border bg-surface p-5 text-[15px]">
          {t("glossary.noMatch")}
        </p>
      ) : (
        <dl className="flex flex-col gap-2">
          {visible.map((term) => (
            <div
              key={term.en}
              className="flex flex-col gap-1.5 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4"
            >
              <dt lang="en" className="text-[15px] font-medium sm:w-1/2">
                {term.en}
              </dt>

              <dd className="flex flex-col gap-1 sm:w-1/2">
                <span lang="tr" className="text-[15px]">
                  {term.tr}
                </span>

                {term.trVariants?.length ? (
                  <span lang="tr" className="text-xs text-fg-muted">
                    {t("glossary.alsoWritten", { terms: term.trVariants.join(", ") })}
                  </span>
                ) : null}

                {/* The banned word is shown deliberately. A candidate who has
                    read it in an older book needs to be told it is wrong, and
                    hiding it means they never find out. */}
                {term.trForbidden?.length ? (
                  <span lang="tr" className="text-xs text-incorrect">
                    {t("glossary.notUsed", { terms: term.trForbidden.join(", ") })}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <footer className="flex flex-col gap-1 border-t border-border pt-4 text-xs text-fg-muted">
        <p>{t("glossary.sourceTag", { source: data.trSource })}</p>
        <p lang="en">{data.source.en}</p>
        <p lang="tr">{data.source.tr}</p>
      </footer>
    </div>
  );
}

/**
 * F2-11 — where a lesson card's text names an ISTQB Glossary term.
 *
 * Pure: given the card's texts in one language and the glossary's terms, it
 * splits each text into plain runs and term runs. Only the first occurrence
 * of each term on the card is marked, so a paragraph reads as prose and not
 * as a row of links; the definition is one press away the first time the
 * term appears, which is when the reader meets it.
 *
 * Matching is on the term as the glossary (English) or `terms.json`
 * (Turkish) writes it, case-insensitively:
 *
 *   - English takes a plural `s`/`es` and nothing else, so "test cases"
 *     finds "test case" and "testing" does not find "test".
 *   - Turkish takes any suffix, because it is agglutinative: "kabul
 *     testinin" is "kabul testi". Consonant softening ("özelliği") is not
 *     undone; such an occurrence is left plain rather than guessed at. A verbal
 *     noun in -ma/-me is where the suffix rule misleads: "sağlamak",
 *     "sağlaması" and "sağlamaya" are nearly always the verb "to ensure", not
 *     "sağlama" (validation). A one-word term of that shape is therefore
 *     matched only as written, with no suffix; in a longer term the
 *     infinitive (-mak/-mek) is refused.
 *   - A hyphen counts as part of a word, so "risk" is not found inside
 *     "risk-based".
 *   - Where two terms start at the same place the longer wins ("test
 *     analysis" over "test").
 */

import type { GlossaryIndexEntry, Lang } from "@/types/content";

/**
 * Terms too general to mark on a testing syllabus' own pages: every card
 * uses them, and their glossary definitions ("a set of one or more test
 * cases") explain nothing the sentence did not.
 */
const TOO_GENERAL = new Set(["test", "testing", "tester", "failed", "passed"]);

export type Segment = { text: string; slug?: undefined } | { text: string; slug: string };

interface Matcher {
  pattern: RegExp;
  slugOf: Map<string, string>;
}

function fold(text: string, lang: Lang): string {
  return lang === "tr" ? text.toLocaleLowerCase("tr") : text.toLowerCase();
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMatcher(terms: readonly GlossaryIndexEntry[], lang: Lang): Matcher | null {
  const slugOf = new Map<string, string>();
  for (const term of terms) {
    if (TOO_GENERAL.has(term.slug)) continue;
    const written = lang === "tr" ? term.tr : term.en;
    if (!written) continue;
    const key = fold(written, lang);
    if (!slugOf.has(key)) slugOf.set(key, term.slug);
  }
  if (slugOf.size === 0) return null;

  const alternatives = [...slugOf.keys()].sort((a, b) => b.length - a.length).map(escape);
  const suffix = lang === "tr" ? "[\\p{L}]*" : "(?:s|es)?";
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}-])(${alternatives.join("|")})${suffix}(?![\\p{L}\\p{N}-])`,
    "gu",
  );
  return { pattern, slugOf };
}

function isVerbForm(term: string, written: string): boolean {
  if (!/m[ae]$/.test(term)) return false;

  const suffix = written.slice(term.length);
  if (!term.includes(" ")) return suffix !== "";
  return suffix.startsWith("k");
}

/**
 * One segment list per text, in order. A term already marked in an earlier
 * text stays plain in the later ones.
 */
export function markTerms(
  texts: readonly string[],
  terms: readonly GlossaryIndexEntry[],
  lang: Lang,
): Segment[][] {
  const matcher = buildMatcher(terms, lang);
  if (!matcher) return texts.map((text) => [{ text }]);

  const seen = new Set<string>();
  return texts.map((text) => {
    const folded = fold(text, lang);
    // Folding must not move a character, or the offsets below would cut the
    // original text in the wrong place.
    if (folded.length !== text.length) return [{ text }];

    const segments: Segment[] = [];
    let cursor = 0;
    for (const match of folded.matchAll(matcher.pattern)) {
      const slug = matcher.slugOf.get(match[1]);
      if (!slug || seen.has(slug)) continue;
      if (lang === "tr" && isVerbForm(match[1], match[0])) continue;

      seen.add(slug);
      const start = match.index;
      const end = start + match[0].length;
      if (start > cursor) segments.push({ text: text.slice(cursor, start) });
      segments.push({ text: text.slice(start, end), slug });
      cursor = end;
    }
    if (cursor < text.length) segments.push({ text: text.slice(cursor) });
    return segments;
  });
}

/** Every term `markTerms` would mark in these texts, in either language. */
export function termsIn(
  texts: Record<Lang, readonly string[]>,
  terms: readonly GlossaryIndexEntry[],
): Set<string> {
  const slugs = new Set<string>();
  for (const lang of ["tr", "en"] as const) {
    for (const segments of markTerms(texts[lang], terms, lang)) {
      for (const segment of segments) if (segment.slug) slugs.add(segment.slug);
    }
  }
  return slugs;
}

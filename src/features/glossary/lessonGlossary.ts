/**
 * F2-11 — the ISTQB Glossary definitions one lesson card needs.
 *
 * Given the index (every term, no definitions), only the chunks holding a
 * term the card names, in either language, are fetched. The caller fetches
 * the index beside the lesson, so the definitions cost one round trip more,
 * not two.
 * The terms handed on are the ones whose definition arrived, so a marked
 * term never opens onto nothing.
 */

import { contentClient } from "@/lib/content/contentClient";
import type {
  GlossaryEntry,
  GlossaryIndex,
  GlossaryIndexEntry,
  Lang,
  Lesson,
} from "@/types/content";

import { termsIn } from "./markTerms";

export interface LessonGlossary {
  /** The terms to mark: those the card names whose definition is loaded. */
  terms: GlossaryIndexEntry[];
  entries: Map<string, GlossaryEntry>;
  /** What CC BY 4.0 asks to be shown beside the definitions. */
  source: string;
  license: string;
  licenseUrl: string;
}

export function lessonTexts(lesson: Lesson, lang: Lang): string[] {
  const content = lesson.i18n[lang];
  return [...content.paragraphs, ...content.keyPoints, ...content.commonMistakes];
}

export async function loadLessonGlossary(
  certPath: string,
  lesson: Lesson,
  index: GlossaryIndex,
): Promise<LessonGlossary> {
  const named = termsIn(
    { tr: lessonTexts(lesson, "tr"), en: lessonTexts(lesson, "en") },
    index.terms,
  );
  const wanted = index.terms.filter((term) => named.has(term.slug));

  const chunks = await Promise.all(
    [...new Set(wanted.map((term) => term.chunk))].map((chunk) =>
      contentClient.getGlossaryChunk(certPath, chunk),
    ),
  );
  const entries = new Map<string, GlossaryEntry>();
  for (const chunk of chunks) {
    for (const entry of chunk.terms) if (named.has(entry.slug)) entries.set(entry.slug, entry);
  }

  return {
    terms: wanted.filter((term) => entries.has(term.slug)),
    entries,
    source: index.source,
    license: index.license,
    licenseUrl: index.licenseUrl,
  };
}

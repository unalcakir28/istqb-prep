/**
 * F4-09 — what the TTB version notice says (`TtbPaperNotice`), or null while
 * there is nothing to say. The home screen reads it too, so the pick
 * announcement names the notice the pick adds.
 */

import type { CertMeta } from "@/types/content";

/** "2027-10-21" as the start of that day, local time — the candidate's exam day. */
function parseDay(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function ttbPaperValues(meta: CertMeta, locale: string, now = new Date()) {
  const paper = meta.ttbPaper;
  if (!paper) return null;

  const replacedOn = parseDay(paper.replacedOn);
  if (!replacedOn || now >= replacedOn) return null;

  return {
    acronym: meta.acronym,
    taught: meta.syllabusVersion,
    examined: paper.syllabusVersion,
    date: new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(replacedOn),
  };
}

/**
 * F4-01 — which certification the screens show.
 *
 * The manifest can list more than one. The candidate picks one on the home
 * screen, and every screen that is not tied to an attempt reads it from here:
 * study, practice and exam setup, the lists, the repetition deck, the
 * glossary, the sources. A screen tied to an attempt — the session, its
 * result, its review — reads the attempt's own `certId` instead, so switching
 * never changes what an old attempt shows.
 *
 * It lives in localStorage rather than IndexedDB for the reason the theme and
 * side-by-side do: it must be known before anything async has resolved, and
 * it is a choice about this browser's view, not progress. The routes carry no
 * certification on purpose — every bookmark made before there were two keeps
 * working, and lands on the certification it was made for, which is the
 * default one.
 */

import type { CertificationSummary } from "@/types/content";

const STORAGE_KEY = "istqb-prep:certification";

/** Only these can be picked. Any other status (`draft`, `retired`) is listed but not offered. */
export const SELECTABLE_STATUS = "active";

/** This page's own copy, for a browser that refuses storage (a private tab). */
let pageChoice: string | null = null;

export function readCertificationChoice(): string | null {
  try {
    // The page's own copy first: if storage refused the last write, what is
    // stored is an older pick.
    return pageChoice ?? localStorage.getItem(STORAGE_KEY);
  } catch {
    return pageChoice;
  }
}

export function writeCertificationChoice(id: string): void {
  pageChoice = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Not persisting the choice is not a reason to refuse to apply it; it
    // simply does not outlive this page.
  }
}

export function selectableCertifications(
  certifications: readonly CertificationSummary[],
): CertificationSummary[] {
  return certifications.filter((cert) => cert.status === SELECTABLE_STATUS);
}

/**
 * The certification to show: the stored choice if it can still be picked,
 * else the first selectable one, else the first listed. A choice that has
 * since been withdrawn falls back quietly rather than failing every screen.
 */
export function pickCertification(
  certifications: readonly CertificationSummary[],
  choice: string | null,
): CertificationSummary | undefined {
  const selectable = selectableCertifications(certifications);
  return selectable.find((cert) => cert.id === choice) ?? selectable[0] ?? certifications[0];
}

/**
 * F4-01 — which certification a setup screen is about to start.
 *
 * The routes carry no certification (ADR-0006), so the screens that begin a
 * session say it themselves, above their heading: a candidate who picked
 * CT-AI on the home screen yesterday should not start a CTFL exam today
 * without being told.
 */

import type { CertificationSummary } from "@/types/content";

export function CertificationTag({
  cert,
}: {
  cert: Pick<CertificationSummary, "acronym" | "syllabusVersion">;
}) {
  return (
    <p className="font-mono text-xs text-fg-muted">
      {cert.acronym} v{cert.syllabusVersion}
    </p>
  );
}

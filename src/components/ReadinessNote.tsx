/**
 * F3-06 — the readiness estimate, in one sentence and its caveat.
 *
 * Shown on the progress screen and under a timed mock exam's result. The
 * caveat is not optional: the rule ("2 of the last 3 timed mock exams") is
 * this product's rule of thumb, and ISTQB publishes no way to predict a
 * result, so the screen must not sound like it has one (rule 5).
 */

import { useTranslation } from "react-i18next";

import { READINESS_PASSES, READINESS_WINDOW, type Readiness } from "@/features/progress/progress";

interface Props {
  readiness: Readiness;
}

export function ReadinessNote({ readiness }: Props) {
  const { t } = useTranslation();

  const verdict =
    readiness.state === "needMore"
      ? t("progress.readinessNeedMore", { count: readiness.missing })
      : t(readiness.state === "ready" ? "progress.readinessReady" : "progress.readinessNotYet", {
          passed: readiness.passed,
          count: readiness.considered,
        });

  return (
    <div className="flex flex-col gap-1.5">
      <p
        className={
          readiness.state === "ready" ? "text-[15px] font-semibold" : "text-[15px] font-medium"
        }
      >
        {verdict}
      </p>
      <p className="max-w-[65ch] text-[13px] text-fg-muted">
        {t("progress.readinessRule", { passes: READINESS_PASSES, count: READINESS_WINDOW })}
      </p>
    </div>
  );
}

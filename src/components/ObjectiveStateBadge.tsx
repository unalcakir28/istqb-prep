import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import type { ObjectiveState } from "@/lib/db/objectiveProgress";

/**
 * How far the candidate has got with one learning objective.
 *
 * The state is always carried by an icon AND a word; colour is decoration on
 * top of both (WCAG 1.4.1). The same badge is used by the chapter's objective
 * list and by the objective test's result, so the two can never disagree about
 * what "mastered" looks like.
 */
function MasteredIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden="true"
      className="size-4 shrink-0"
    >
      <path d="m4 10.5 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InProgressIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className="size-4 shrink-0"
    >
      <circle cx="10" cy="10" r="7" />
      <path d="M10 5.5V10l3 2" strokeLinecap="round" />
    </svg>
  );
}

function NotStartedIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeDasharray="3 3"
      aria-hidden="true"
      className="size-4 shrink-0"
    >
      <circle cx="10" cy="10" r="7" />
    </svg>
  );
}

const ICON: Record<ObjectiveState, () => ReactElement> = {
  "not-started": NotStartedIcon,
  "in-progress": InProgressIcon,
  mastered: MasteredIcon,
};

const LABEL_KEY: Record<ObjectiveState, string> = {
  "not-started": "study.stateNotStarted",
  "in-progress": "study.stateInProgress",
  mastered: "study.stateMastered",
};

const TONE: Record<ObjectiveState, string> = {
  "not-started": "text-fg-muted",
  "in-progress": "text-fg",
  mastered: "text-correct",
};

export function ObjectiveStateBadge({ state }: { state: ObjectiveState }) {
  const { t } = useTranslation();
  const Icon = ICON[state];

  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${TONE[state]}`}>
      <Icon />
      {t(LABEL_KEY[state])}
    </span>
  );
}

/**
 * F3-09 — graduated hints: nudge -> hint -> solution, one press each.
 *
 *   1. The nudge names what the question checks: its learning objective, in
 *      the question's language.
 *   2. The hint is `hintFor`'s (src/features/session/hints.ts): the
 *      question's authored hints, or the first wrong option shown taken
 *      away. Its rationale waits for the reveal (TODO D-07).
 *   3. The solution reveals the answer through the same path a complete
 *      answer takes, so it locks the question. The button says what that
 *      costs before it is pressed: the question is scored as it stands and
 *      joins the repetition deck at the end.
 *
 * Shown only where the answer is revealed on the spot (study, and practice
 * with instant feedback): in a mock exam a hint would change what the score
 * measures, and with feedback off there is nothing to reveal until review.
 *
 * Each step moves focus to what it added, the shell's own way of announcing
 * a change (SessionRunner): text written to a live region in the same moment
 * as a focus move is dropped. The last step needs nothing here, because the
 * shell focuses the rationale panel when the question is revealed.
 */

import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";

import { hintFor, hintIn, type Hint } from "@/features/session/hints";
import { contentClient } from "@/lib/content/contentClient";
import { useAsyncData } from "@/lib/useAsyncData";
import type { Lang, Question } from "@/types/content";

export type HintLevel = 0 | 1 | 2;

interface HintLadderProps {
  question: Question;
  lang: Lang;
  /** F3-14 — the side-by-side mode's second language, shown as a quieter aside. */
  secondaryLang?: Lang;
  /** The attempt's certification, which is also its content path. */
  certId: string;
  level: HintLevel;
  onStep: () => void;
  onReveal: () => void;
}

/** The question card's own mark for the same text in the other language. */
const ASIDE = "border-l-2 border-border pl-3 text-fg-muted";

/** One hint in one language. The aside repeats the text, not the "Not this one:" label. */
function HintBody({ hint, lang, aside }: { hint: Hint; lang: Lang; aside?: boolean }) {
  const { t } = useTranslation();

  if (hint.kind === "authored") {
    return hint.texts.map((text) => (
      <p key={text} lang={lang} className="max-w-[65ch] text-[15px] leading-relaxed">
        {text}
      </p>
    ));
  }

  return (
    <p className="max-w-[65ch] text-[15px] font-medium leading-relaxed">
      {aside ? null : <>{t("hints.notThis")} </>}
      <span lang={lang}>“{hint.optionText}”</span>
    </p>
  );
}

const STEP_BUTTON =
  "inline-flex min-h-11 w-fit items-center rounded-[var(--radius-btn)] border border-border bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-2";

export function HintLadder({
  question,
  lang,
  secondaryLang,
  certId,
  level,
  onStep,
  onReveal,
}: HintLadderProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const { data: objectives } = useAsyncData(() => contentClient.getObjectives(certId));
  const nudgeRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLButtonElement>(null);
  /** Set by a press, so arriving at a question already part-way up the ladder moves nothing. */
  const steppedRef = useRef(false);

  useEffect(() => {
    if (!steppedRef.current) return;
    steppedRef.current = false;
    // A question with no hint to give still has the solution button to land on.
    const target = level === 2 ? (hintRef.current ?? solutionRef.current) : nudgeRef.current;
    target?.focus();
  }, [level]);

  const hint = level >= 2 ? hintFor(question, lang) : null;
  const secondHint = hint && secondaryLang ? hintIn(question, hint, secondaryLang) : null;
  const tested = question.objectives.map((code) => {
    const objective = objectives?.find((item) => item.code === code);
    return {
      code,
      text: objective?.text[lang] ?? null,
      second: secondaryLang ? (objective?.text[secondaryLang] ?? null) : null,
    };
  });

  function step() {
    steppedRef.current = true;
    onStep();
  }

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-dashed border-fg-muted/50 p-4"
    >
      <h2 id={titleId} className="text-sm font-semibold">
        {t("hints.stuck")}
      </h2>

      {level >= 1 ? (
        <div ref={nudgeRef} tabIndex={-1} className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            {t("hints.nudgeLabel")}
          </h3>
          {tested.map((objective) => (
            <div key={objective.code} className="flex flex-col gap-1">
              <p className="max-w-[65ch] text-[15px] leading-relaxed">
                <span className="font-mono text-sm text-accent">{objective.code}</span>
                {objective.text ? (
                  <>
                    {" "}
                    <span lang={lang}>{objective.text}</span>
                  </>
                ) : null}
              </p>
              {objective.second ? (
                <p
                  lang={secondaryLang}
                  className={`max-w-[65ch] text-[15px] leading-relaxed ${ASIDE}`}
                >
                  {objective.second}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {level >= 2 && hint ? (
        <div ref={hintRef} tabIndex={-1} className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            {t("hints.hintLabel")}
          </h3>
          <HintBody hint={hint} lang={lang} />
          {secondHint && secondaryLang ? (
            <div className={`flex flex-col gap-1 ${ASIDE}`}>
              <HintBody hint={secondHint} lang={secondaryLang} aside />
            </div>
          ) : null}
        </div>
      ) : null}

      {level < 2 ? (
        <button type="button" onClick={step} className={STEP_BUTTON}>
          {level === 0 ? t("hints.nudge") : t("hints.hint")}
        </button>
      ) : (
        <div className="flex flex-col gap-1.5">
          <button
            ref={solutionRef}
            type="button"
            onClick={onReveal}
            aria-describedby={`${titleId}-cost`}
            className={STEP_BUTTON}
          >
            {t("hints.solution")}
          </button>
          <p id={`${titleId}-cost`} className="max-w-[65ch] text-sm text-fg-muted">
            {t("hints.solutionNote")}
          </p>
        </div>
      )}
    </section>
  );
}

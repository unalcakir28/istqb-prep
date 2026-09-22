import type { Locator, Page } from "@playwright/test";

import en from "../src/lib/i18n/locales/en.json" with { type: "json" };

/**
 * UI strings for the selectors, read from the shipped English locale instead
 * of being retyped here. The specs select by accessible name, so a copy change
 * in `en.json` must fail the test rather than silently leave a selector
 * pointing at text the app no longer renders.
 *
 * The session helpers below live here rather than in a spec because all three
 * modes (study, practice, exam) share one session screen: a locator written
 * once cannot drift between the specs that drive it.
 */
export { en };

export function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Splits a locale template on its `{{placeholder}}` parts. */
function parts(template: string): string[] {
  return template.split(/(\{\{\w+\}\})/);
}

function placeholderOf(part: string): string | undefined {
  return part.match(/^\{\{(\w+)\}\}$/)?.[1];
}

/** Fills a locale template, e.g. `Question {{current}} of {{total}}`. */
export function fill(template: string, values: Record<string, string | number>): string {
  return parts(template)
    .map((part) => {
      const key = placeholderOf(part);
      return key === undefined ? part : String(values[key]);
    })
    .join("");
}

/** A locale template as a regex body: literals escaped, placeholders filled. */
function templateBody(template: string, patterns: Record<string, string>): string {
  return parts(template)
    .map((part) => {
      const key = placeholderOf(part);
      return key === undefined ? escapeRegExp(part) : patterns[key];
    })
    .join("");
}

/**
 * Turns a locale template into an anchored pattern. Each placeholder is
 * replaced by the sub-pattern given for it, so the surrounding wording stays
 * owned by `en.json` and only the variable parts are written by the test.
 */
export function pattern(template: string, patterns: Record<string, string>): RegExp {
  return new RegExp(`^${templateBody(template, patterns)}$`);
}

/**
 * The same, unanchored — for a string the app renders INSIDE a larger node.
 *
 * `ScoreBar` puts its `markLabel` next to an `aria-hidden` divider, so the
 * element's text is "│ Pass mark 26" and an anchored pattern silently matches
 * nothing. An anchored pattern asserted with `toHaveCount(0)` would then pass
 * on a screen that renders the label perfectly well.
 */
export function partial(template: string, patterns: Record<string, string>): RegExp {
  return new RegExp(templateBody(template, patterns));
}

/**
 * The question card.
 *
 * Every option locator below is scoped to it, and that scope is what keeps
 * them off a setup screen's own radios and checkboxes: a session route is a
 * lazy chunk, and the screen that started it stays mounted until the chunk
 * paints. `QuestionCard` is the only `<article>` that contains option
 * controls, and neither `ExamSetup` nor `PracticeSetup` renders an `<article>`
 * at all — so an unscoped locator can resolve mid-navigation, while a scoped
 * one waits for the question.
 */
function questionCard(page: Page): Locator {
  return page.getByRole("article");
}

/**
 * The session shell's polite live region — the one `SessionRunner` writes to.
 *
 * Anchored to the question card it follows, because `p[aria-live="polite"]`
 * alone is not unique: the exam screen carries three of them (the timer's
 * sr-only reading, the shell's, and the auto-submit notice in the footer), and
 * the practice screen is one polite region away from the same ambiguity. The
 * adjacency is the shell's own markup — the region is rendered immediately
 * after `QuestionCard`, on every pass, so that it is already in the tree
 * before anything is written to it.
 */
export function sessionLiveRegion(page: Page): Locator {
  return page.locator('article + p[aria-live="polite"]');
}

/**
 * The option controls of the question on screen: radio for a single-answer
 * question, checkbox for a "WHICH TWO" one. A multi-select question has no
 * radio at all, so no selector may assume either type.
 */
export function optionInputs(page: Page): Locator {
  const card = questionCard(page);
  return card.getByRole("radio").or(card.getByRole("checkbox"));
}

/**
 * One option control, by its accessible name — which is the option's text:
 * the position number on the row is `aria-hidden`.
 *
 * Only valid before the answer is revealed. Once it is, the row also carries
 * a "Correct" / "Incorrect" marker and that marker becomes part of the name.
 */
export function optionByName(page: Page, name: string): Locator {
  const card = questionCard(page);
  return card
    .getByRole("radio", { name, exact: true })
    .or(card.getByRole("checkbox", { name, exact: true }));
}

/**
 * Whether the visible question is a "WHICH TWO" — its options are checkboxes
 * rather than radios.
 *
 * The wait is the point: this is the branching decision every option helper
 * makes, and a non-waiting `count()` would answer it from whatever is on
 * screen, including a half-navigated one.
 */
export async function isMultiSelect(page: Page): Promise<boolean> {
  await optionInputs(page).first().waitFor();

  return (await questionCard(page).getByRole("checkbox").count()) > 0;
}

/**
 * The question counter, with the total left open as a capture group.
 *
 * Every mode renders it, and it is the one thing only a mounted session screen
 * shows — which makes it the visibility guard to wait on after navigating into
 * a session. Without it an interaction can land on the setup screen's own
 * controls while the session's lazy chunk is still loading.
 */
export function questionCounter(current: number): RegExp {
  return pattern(en.exam.question, { current: String(current), total: "(\\d+)" });
}

/** How many questions the session holds, read from the counter it renders. */
export async function totalQuestions(page: Page): Promise<number> {
  const counter = page.getByText(questionCounter(1));
  await counter.waitFor();

  const match = (await counter.innerText()).match(questionCounter(1));
  if (!match) throw new Error("the question counter did not match its own locale template");

  return Number(match[1]);
}

/** Ticks as many options as the visible question requires. */
export async function answerCurrentQuestion(page: Page): Promise<void> {
  if (!(await isMultiSelect(page))) {
    await optionInputs(page).first().check();
    return;
  }

  // A "WHICH TWO" question — exactly two options get ticked. With instant
  // feedback on, the first tick reveals nothing: the store only locks the
  // answer once the selection is complete.
  const checkboxes = questionCard(page).getByRole("checkbox");
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
}

/**
 * The 1-based positions of the options a REVEALED question marks correct.
 *
 * `OptionList` computes these markers from `question.correct` on its own, with
 * no input from the session shell — which is what makes them usable as a
 * cross-check on the verdict the shell announces. Reading them is the only way
 * a spec can learn the keyed answer without retyping it out of `data/`.
 *
 * Matched on the marker's exact text: "Incorrect" would otherwise contain
 * "correct" and every wrong row would read as a right one.
 */
export async function correctOptionPositions(page: Page): Promise<number[]> {
  const rows = questionCard(page).locator("label");
  const count = await rows.count();
  const positions: number[] = [];

  for (let index = 0; index < count; index += 1) {
    const marked = await rows.nth(index).getByText(en.result.correct, { exact: true }).count();
    if (marked > 0) positions.push(index + 1);
  }

  return positions;
}

/** Ticks the options at the given 1-based positions, in order. */
export async function checkOptionsAt(page: Page, positions: number[]): Promise<void> {
  const inputs = optionInputs(page);
  for (const position of positions) {
    await inputs.nth(position - 1).check();
  }
}

/** The checked state of every option, in render order. */
export async function checkedStates(page: Page): Promise<boolean[]> {
  const inputs = optionInputs(page);
  const count = await inputs.count();

  return Promise.all(Array.from({ length: count }, (_, index) => inputs.nth(index).isChecked()));
}

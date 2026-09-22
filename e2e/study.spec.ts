import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { test, expect, type Page } from "@playwright/test";

import {
  answerCurrentQuestion,
  checkedStates,
  en,
  fill,
  optionByName,
  questionCounter,
  totalQuestions,
} from "./labels";

/**
 * Study mode — the whole loop a first-time candidate walks:
 * chapters -> one chapter -> one learning objective -> its test -> its result,
 * and back to the chapter with the objective now MASTERED.
 *
 * Mastery is the assertion because it is the one state nothing but a completed,
 * correctly answered test can produce. "No longer not started" cannot be:
 * `StudyObjective` calls `markLessonRead` in a mount effect for any objective
 * whose lesson has shipped, so once Track C lands one here, merely opening the
 * card would move the badge to "In progress" — and a spec that stopped there
 * would stay green with the whole scoring and mastery path deleted.
 *
 * Every test starts in its own browser context, so IndexedDB carries no
 * objective progress from a neighbouring test and "not started" is real.
 */

/**
 * The objective the mastery walk uses.
 *
 * Mastery needs at least `MASTERY_MIN_ANSWERED` (3) answered questions and a
 * last score of at least `MASTERY_MIN_PERCENT` (80), and FL-6.1.1 carries
 * exactly three published questions — the only objective that can reach both
 * bars in one sitting. One of the three is a "WHICH TWO", so the walk covers
 * the checkbox shape as well as the radio one.
 */
const MASTERY_LO = "FL-6.1.1";
const MASTERY_CHAPTER = 6;

/** The objective's row in the chapter list, whatever state badge it carries. */
const MASTERY_LO_ROW = /^FL-6\.1\.1\b/;

/** The objective the two smaller specs open — the first one of the syllabus. */
const LO_CODE = "FL-1.1.1";

/**
 * The published questions of one learning objective, read from the content
 * source `yarn sync:data` serves to the app.
 *
 * The spec has to bring the keyed answers: the app never shows which option is
 * correct until the answer is already locked in, and answering correctly is
 * the only way to reach mastery. The chunk files are the source of truth —
 * the generated index carries no option text.
 */
const QUESTIONS_DIR = fileURLToPath(new URL("../data/ctfl-v4.0.1/questions/", import.meta.url));

interface QuestionRecord {
  id: string;
  status: string;
  objectives: string[];
  correct: string[];
  i18n: { en: { stem: string; options: { id: string; text: string }[] } };
}

/** Whitespace-normalised the way an `innerText` read of the stem already is. */
function normalise(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function publishedQuestionsFor(loCode: string): QuestionRecord[] {
  return readdirSync(QUESTIONS_DIR)
    .filter((name) => name.endsWith(".json") && name !== "index.json")
    .flatMap((name) => {
      const chunk = JSON.parse(readFileSync(QUESTIONS_DIR + name, "utf8")) as {
        questions: QuestionRecord[];
      };
      return chunk.questions;
    })
    .filter((question) => question.status === "published" && question.objectives.includes(loCode));
}

/** The English text of every keyed option, in the order the answer key lists them. */
function correctOptionTexts(question: QuestionRecord): string[] {
  const texts = question.correct.map(
    (id) => question.i18n.en.options.find((option) => option.id === id)?.text,
  );
  const found = texts.filter((text): text is string => text !== undefined);

  if (found.length !== question.correct.length) {
    throw new Error(`${question.id}: a keyed option id is missing from its English options`);
  }

  return found;
}

const MASTERY_POOL = publishedQuestionsFor(MASTERY_LO);

/** Keyed answers by stem, because the stem is all the session screen shows. */
const CORRECT_BY_STEM = new Map(
  MASTERY_POOL.map((question) => [normalise(question.i18n.en.stem), correctOptionTexts(question)]),
);

/** Ticks the keyed answer of the question on screen, whatever its shape. */
async function answerCorrectly(page: Page): Promise<void> {
  // The stem is the first h2 on the session screen; the navigator's is below it.
  const stem = normalise(await page.getByRole("heading", { level: 2 }).first().innerText());

  const texts = CORRECT_BY_STEM.get(stem);
  if (!texts) {
    throw new Error(`the question on screen is not in ${MASTERY_LO}'s published pool: ${stem}`);
  }

  // A "WHICH TWO" reveals only once the second box is ticked, so both are
  // still enabled while this loop runs.
  for (const text of texts) {
    await optionByName(page, text).check();
  }
}

test("an objective answered correctly is recorded as mastered", async ({ page }) => {
  // Three answers at 100% is exactly the mastery bar; a thinner pool would
  // make this walk unreachable rather than failing.
  expect(MASTERY_POOL.length).toBeGreaterThanOrEqual(3);

  await page.goto("/calisma");
  await expect(page.getByRole("heading", { name: en.study.chaptersTitle, level: 1 })).toBeVisible();

  await page
    .getByRole("link", {
      name: new RegExp(`^${fill(en.setup.chapter, { number: MASTERY_CHAPTER })}\\b`),
    })
    .click();
  await expect(page).toHaveURL(new RegExp(`/calisma/${MASTERY_CHAPTER}$`));

  // The starting point, asserted before the objective is ever opened: the day
  // this objective's lesson ships, opening the card alone moves it on.
  await expect(page.getByRole("link", { name: MASTERY_LO_ROW })).toContainText(
    en.study.stateNotStarted,
  );

  await page.getByRole("link", { name: MASTERY_LO_ROW }).click();
  await expect(page).toHaveURL(new RegExp(`/calisma/lo/${MASTERY_LO}$`));

  // The question language is set, never inherited from the browser locale:
  // the keyed answers are matched against the ENGLISH option text.
  await page.getByRole("radio", { name: en.question.showEnglish, exact: true }).click();

  const startTest = page.getByRole("button", { name: en.study.startTest });
  await expect(startTest).toBeEnabled();
  await startTest.click();

  await expect(page).toHaveURL(new RegExp(`/calisma/lo/${MASTERY_LO}/[\\w-]+$`));
  // The session screen is a lazy chunk and the objective screen stays mounted
  // until it paints; the counter is the one thing only the session renders.
  await expect(page.getByText(questionCounter(1))).toBeVisible();

  const total = await totalQuestions(page);
  // An objective test asks the whole published pool, up to the cap study mode
  // puts on itself (`MAX_TEST_QUESTIONS` in `StudyObjective`). Every question
  // in the pool is in the answer map, so any subset of it is answerable.
  expect(total).toBe(Math.min(MASTERY_POOL.length, 10));

  for (let index = 1; index <= total; index += 1) {
    await expect(page.getByText(fill(en.exam.question, { current: index, total }))).toBeVisible();
    await answerCorrectly(page);
    if (index < total) await page.getByRole("button", { name: en.exam.next }).click();
  }

  // Finishing is confirmed in every mode, study included: the score it writes
  // can take a mastery back down.
  await page.getByRole("button", { name: en.study.finish }).click();
  await page.getByRole("button", { name: en.study.confirmFinish }).click();

  await expect(page.getByRole("heading", { name: en.result.title, level: 1 })).toBeVisible();

  // The score section is named after the score, so the number is asserted once
  // rather than once per place it is rendered. A full mark is the only score
  // the walk above can produce, and only a scored test produces any.
  const scoreLabel = fill(en.result.score, { points: total, total });
  await expect(page.getByRole("region", { name: scoreLabel })).toBeVisible();

  // Mastery is written by `recordObjectiveResult` and by nothing else.
  await expect(page.getByText(en.study.stateMastered)).toBeVisible();

  // Back up the same way a candidate goes: result -> objective -> chapter.
  await page.getByRole("link", { name: en.study.backToObjective }).click();
  await expect(page).toHaveURL(new RegExp(`/calisma/lo/${MASTERY_LO}$`));

  await page
    .getByRole("link", { name: fill(en.setup.chapter, { number: MASTERY_CHAPTER }), exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/calisma/${MASTERY_CHAPTER}$`));

  // And it survived the round trip: the badge is read back from IndexedDB,
  // not from the state the result screen was handed.
  await expect(page.getByRole("link", { name: MASTERY_LO_ROW })).toContainText(
    en.study.stateMastered,
  );
});

/**
 * Lesson content lands objective by objective (Track C) and an objective
 * without one still has questions to answer. This is the durable half of that:
 * whatever the card above it says, the test starts.
 *
 * That a missing lesson renders the placeholder is a unit test over
 * `LessonCard` instead (`src/components/LessonCard.test.tsx`). Asserting it
 * here would turn the first authored lesson into a red E2E run on a spec that
 * has nothing to do with the change.
 */
test("an objective starts its test whether or not its lesson has shipped", async ({ page }) => {
  await page.goto(`/calisma/lo/${LO_CODE}`);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByRole("button", { name: en.study.startTest }).click();

  await expect(page).toHaveURL(new RegExp(`/calisma/lo/${LO_CODE}/[\\w-]+$`));
  await expect(page.getByText(questionCounter(1))).toBeVisible();
});

/**
 * Study was the one mode that submitted straight from the click. The score it
 * writes goes to `recordObjectiveResult`, which can take a mastery the
 * candidate had already earned back down, so the act is confirmed like any
 * other finish.
 */
test("finishing an objective test is confirmed, and the dialog owns the keyboard", async ({
  page,
}) => {
  await page.goto(`/calisma/lo/${LO_CODE}`);
  await page.getByRole("button", { name: en.study.startTest }).click();
  await expect(page.getByText(questionCounter(1))).toBeVisible();

  const finishButton = page.getByRole("button", { name: en.study.finish });
  await finishButton.click();

  const dialog = page.getByRole("alertdialog", { name: en.study.finishConfirmTitle });
  await expect(dialog).toBeVisible();

  // The option shortcut is registered inside `SessionRunner`, which cannot see
  // a dialog the mode screen owns. Without `modalOpen` the candidate answers
  // from behind the confirmation — and study mode's instant feedback locks
  // that answer for good — while being asked whether to finish.
  await page.keyboard.press("1");
  await expect(page.getByRole("region", { name: en.review.whyTitle })).toHaveCount(0);

  // Standing down leaves the test exactly where it was: nothing answered,
  // nothing scored.
  await dialog.getByRole("button", { name: en.common.cancel }).click();
  await expect(dialog).toHaveCount(0);

  // Closing the dialog unmounts the button the keyboard was standing on, which
  // drops focus to `<body>` and puts the candidate back at the top of the
  // document. `useDialogFocus` returns it to the opener instead — the one rule
  // of the four it wires up that nothing in the suite asserted.
  await expect(finishButton).toBeFocused();

  expect((await checkedStates(page)).some(Boolean)).toBe(false);
  await expect(page.getByRole("heading", { name: en.result.title, level: 1 })).toHaveCount(0);

  // Escape is the other way out of the dialog, and it owes the same return.
  await finishButton.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(finishButton).toBeFocused();

  // And the body counts what is left in the candidate's own grammar. An
  // objective test is 2-10 questions, so a remainder of exactly one is a
  // routine path here rather than the 1-in-40 case the exam copy was written
  // for — "1 questions are unanswered." was on the common path.
  const total = await totalQuestions(page);
  for (let position = 1; position < total; position += 1) {
    await answerCurrentQuestion(page);
    await page.getByRole("button", { name: en.exam.next }).click();
    await expect(page.getByText(questionCounter(position + 1))).toBeVisible();
  }

  await finishButton.click();
  await expect(
    dialog.getByText(fill(en.study.finishConfirmBody_one, { unanswered: 1 })),
  ).toBeVisible();

  await page.getByRole("button", { name: en.study.confirmFinish }).click();
  await expect(page.getByRole("heading", { name: en.result.title, level: 1 })).toBeVisible();
});

test("an objective test is untimed and always gives instant feedback", async ({ page }) => {
  await page.goto(`/calisma/lo/${LO_CODE}`);
  await page.getByRole("button", { name: en.study.startTest }).click();
  await expect(page.getByText(questionCounter(1))).toBeVisible();

  await expect(page.getByRole("timer")).toHaveCount(0);
  await expect(page.getByRole("button", { name: en.exam.hideTimer })).toHaveCount(0);

  // Instant feedback is not a choice in study mode: the point is to close the
  // loop while the explanation is still on screen.
  await answerCurrentQuestion(page);
  await expect(page.getByRole("region", { name: en.review.whyTitle })).toBeVisible();
});

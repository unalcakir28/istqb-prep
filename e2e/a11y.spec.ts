import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import {
  answerCurrentQuestion,
  checkedStates,
  checkOptionIds,
  correctOptionIds,
  en,
  escapeRegExp,
  fill,
  isMultiSelect,
  optionInputs,
  PRODUCT_NAME,
  questionCounter,
  sessionLiveRegion,
  shownOptionIds,
  totalQuestions,
} from "./labels";

/**
 * F1-18 — no critical accessibility violation on any main route.
 *
 * The exam screen must be fully usable from the keyboard (docs/06 §5): a
 * candidate must be able to pick an option without reaching for the mouse.
 * The scan runs in both the light and the dark theme, because colour
 * contrast differs per theme and dark is the default.
 */
const THEMES = ["light", "dark"] as const;

async function scan(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  // If there is a violation, the output must name it; a bare count
  // comparison does not tell you what to fix.
  expect(
    results.violations.map(
      (violation) =>
        `${violation.id} (${violation.nodes.length}): ${violation.help}\n${violation.nodes
          .map((node) => `    ${node.target.join(" ")} — ${node.failureSummary ?? ""}`)
          .join("\n")}`,
    ),
  ).toEqual([]);
}

/**
 * The theme is set BEFORE the page opens. The app runs its own theme logic on
 * startup, so changing the class from the outside afterwards races with it and
 * produced intermittent colour-contrast failures in the dark theme.
 */
async function setTheme(page: Page, theme: (typeof THEMES)[number]): Promise<void> {
  await page.emulateMedia({ colorScheme: theme });
}

for (const theme of THEMES) {
  test(`the home page is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await scan(page);
  });

  test(`the setup screen is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/deneme");
    await expect(page.getByRole("button", { name: en.setup.start })).toBeVisible();
    await scan(page);
  });

  test(`the study chapter list is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/calisma");
    await expect(
      page.getByRole("heading", { name: en.study.chaptersTitle, level: 1 }),
    ).toBeVisible();
    await scan(page);
  });

  test(`the chapter's objective list is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/calisma/1");
    // Every row carries an `ObjectiveStateBadge`, which is the only place
    // progress is conveyed — the scan is here to prove it is not conveyed by
    // colour alone or at a contrast the muted tone cannot hold.
    await expect(page.getByRole("link", { name: /^FL-1\.1\.1\b/ })).toBeVisible();
    await scan(page);
  });

  test(`the study objective screen is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/calisma");
    // Chapter 6 is the shortest one, and the objective screen is reached the
    // way a candidate reaches it rather than by a hand-written URL.
    await page
      .getByRole("link", { name: new RegExp(`^${fill(en.setup.chapter, { number: 6 })}\\b`) })
      .click();
    await page.getByRole("link", { name: /^FL-6\.1\.1\b/ }).click();
    await expect(page.getByRole("button", { name: en.study.startTest })).toBeVisible();
    await scan(page);
  });

  test(`the objective screen with no lesson is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    // FL-1.1.1 carries fewer questions than the mastery bar, so this screen
    // also renders the flag-toned shortfall notice that FL-6.1.1 does not.
    await page.goto("/calisma/lo/FL-1.1.1");
    await expect(page.getByRole("button", { name: en.study.startTest })).toBeVisible();
    await scan(page);
  });

  test(`the practice setup screen is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/alistirma");
    await expect(page.getByRole("button", { name: en.practice.start })).toBeVisible();
    await scan(page);
  });

  test(`the saved lists are accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    // Empty lists, which is the state most likely to render a bare heading
    // with nothing named under it.
    await page.goto("/listelerim");
    await expect(page.getByRole("heading", { name: en.lists.title, level: 1 })).toBeVisible();
    await scan(page);
  });

  test(`the glossary is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/sozluk");
    await expect(page.getByRole("heading", { name: en.glossary.title, level: 1 })).toBeVisible();
    // The chapter filter is a radio group of visually-hidden inputs with
    // styled labels; the scan is here to prove the labels still name them.
    await expect(page.getByRole("radio", { name: en.glossary.allChapters })).toBeVisible();
    await scan(page);
  });

  test(`the sources page is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/kaynaklar");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await scan(page);
  });

  test(`the exam screen is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/deneme");
    await page.getByRole("button", { name: en.setup.start }).click();
    await expect(page).toHaveURL(/\/sinav\/[\w-]+$/);
    // The URL changes before the session's lazy chunk paints, and the setup
    // screen stays mounted until it does. Without this the scan can run over
    // the setup screen and report a clean exam screen it never saw.
    await expect(page.getByText(questionCounter(1))).toBeVisible();
    await scan(page);
  });

  test(`a revealed practice answer is accessible (${theme})`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/alistirma");
    await page.getByRole("button", { name: en.practice.start }).click();
    await expect(page.getByText(questionCounter(1))).toBeVisible();

    // The only state in which the correct/incorrect tones, the disabled option
    // rows and the rationale panel are all on screen at once. No other scan
    // reaches it: the exam screen never reveals.
    await answerCurrentQuestion(page);
    await expect(page.getByRole("region", { name: en.review.whyTitle })).toBeVisible();
    await scan(page);
  });
}

test("an option can be selected with the keyboard on the exam screen", async ({ page }) => {
  await page.goto("/deneme");
  await page.getByRole("button", { name: en.setup.start }).click();
  await expect(page).toHaveURL(/\/sinav\/[\w-]+$/);

  // Scoped to the question card: the question-language toggle is a radio group
  // too, and a page-wide locator can land on it instead of an option.
  const firstOption = optionInputs(page).first();
  await firstOption.focus();
  await page.keyboard.press("Space");
  await expect(firstOption).toBeChecked();
});

/**
 * Task 15a — the accessibility defects axe cannot see: whether the options
 * carry the question's name, and where focus goes when the screen changes
 * under the user. An axe scan is clean through every one of these.
 */

/** Opens an exam session and leaves the page on question 1. */
async function startExam(page: Page): Promise<void> {
  await page.goto("/sinav");
  await page.getByRole("button", { name: en.setup.start }).click();
  await expect(page).toHaveURL(/\/sinav\/[\w-]+$/);
  await expect(page.getByText(questionCounter(1))).toBeVisible();
}

/** The stem, whitespace-normalised the way an accessible name is. */
async function stemText(page: Page): Promise<string> {
  const stem = await page.locator(".prose-question").first().innerText();
  return stem.replace(/\s+/g, " ").trim();
}

test("the options are one group named after the stem and the instruction", async ({ page }) => {
  await startExam(page);

  // A multi-select gives every checkbox its own `name`, so without the group
  // there is no "1 of 4" and no way to learn that two are wanted.
  const multi = (await page.getByRole("checkbox").count()) > 0;
  const expected = `${await stemText(page)} ${multi ? en.exam.selectTwo : en.exam.selectOne}`;

  // Single-select is a radiogroup, multi-select a plain group. The
  // question-language toggle is a radiogroup too, so the role alone no longer
  // picks one out; `aria-labelledby` does, because only the option list names
  // itself from elements already on the page.
  const group = page.locator("[role=radiogroup][aria-labelledby], [role=group][aria-labelledby]");
  await expect(group).toHaveAccessibleName(expected);
});

/** Either verdict, followed by the panel's own title — the panel's whole name. */
const VERDICT_NAME = new RegExp(
  `^(${escapeRegExp(en.session.feedbackCorrect)}|${escapeRegExp(
    en.session.feedbackIncorrect,
  )}) ${escapeRegExp(en.review.whyTitle)}$`,
);

test("the answer's reveal moves focus to the rationale, which is named after the verdict", async ({
  page,
}) => {
  await page.goto("/alistirma");
  await page.getByRole("button", { name: en.practice.start }).click();
  await expect(page.getByText(questionCounter(1))).toBeVisible();

  await answerCurrentQuestion(page);

  // `disabled` landing on the option the user just activated used to drop
  // focus to <body>, 300px above a rationale they had no way to know about.
  const rationale = page.getByRole("region", { name: en.review.whyTitle });
  await expect(rationale).toBeFocused();

  // The verdict rides on the name of the element that TAKES the focus. NVDA
  // and VoiceOver both give a focus event priority and flush pending polite
  // speech, so a verdict written to the live region in the same breath is
  // dropped and the user hears "Why?, region" and nothing else.
  await expect(rationale).toHaveAccessibleName(VERDICT_NAME);

  // And nothing raced it: the region is left to the announcements that move
  // no focus.
  const liveRegion = sessionLiveRegion(page);
  await expect(liveRegion).toHaveCount(1);
  await expect(liveRegion).toBeEmpty();
});

/**
 * FL-6.1.1 is the fixed route to both option shapes: three published
 * questions, exactly one of them a "WHICH TWO". It is also a small enough set
 * that the same question can be found again in a second session.
 *
 * Instant feedback defaults OFF here because a complete answer would otherwise
 * lock the question, and the displacement specs below need to keep answering
 * after that point. The verdict spec asks for it ON — locking is the whole
 * point there.
 */
async function startObjectivePractice(page: Page, instantFeedback = false): Promise<void> {
  await page.goto("/alistirma");

  await page
    .getByRole("checkbox", { name: en.practice.instantFeedback })
    .setChecked(instantFeedback);
  await page.getByRole("radio", { name: en.practice.scopeObjective }).check();
  await page.getByRole("combobox").selectOption("FL-6.1.1");

  await page.getByRole("button", { name: en.practice.start }).click();
  await expect(page.getByText(questionCounter(1))).toBeVisible();
}

/**
 * Walks forward to the first question of the wanted shape. If the pool ever
 * stops carrying one, this fails outright rather than quietly leaving the
 * spec with nothing to exercise.
 */
async function walkToShape(
  page: Page,
  multi: boolean,
): Promise<{ position: number; total: number }> {
  const total = await totalQuestions(page);
  let position = 1;

  while ((await isMultiSelect(page)) !== multi) {
    expect(position).toBeLessThan(total);
    await page.getByRole("button", { name: en.exam.next }).click();
    position += 1;
    await expect(page.getByText(questionCounter(position))).toBeVisible();
  }

  return { position, total };
}

test("a third pick on a multi-select announces the option it cleared", async ({ page }) => {
  await startObjectivePractice(page);
  const { position, total } = await walkToShape(page, true);

  const boxes = optionInputs(page);
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await boxes.nth(2).check();

  // The oldest pick makes room for the new one. A screen reader hears
  // "checked" for the box just activated and nothing for the box that
  // cleared somewhere above it, so the displacement is spoken instead.
  const liveRegion = sessionLiveRegion(page);
  await expect(liveRegion).toHaveText(fill(en.session.optionReplaced, { position: 1 }));
  expect((await checkedStates(page)).filter(Boolean)).toHaveLength(2);

  // ...and the sentence does not outlive the question it describes. Either
  // neighbour will do; the set holds three questions, so one of them exists.
  expect(total).toBeGreaterThan(1);
  const backwards = position > 1;
  await page.getByRole("button", { name: backwards ? en.exam.previous : en.exam.next }).click();
  await expect(
    page.getByText(questionCounter(backwards ? position - 1 : position + 1)),
  ).toBeVisible();
  await expect(liveRegion).toBeEmpty();
});

/**
 * The other half of the same guard, and the path nothing covered while the
 * bug was live: `sessionStore.select` replaces `[a]` with `[b]` for a radio,
 * so an unguarded diff finds a "displaced" option on EVERY answer change and
 * narrates the obvious up to forty times an exam.
 */
test("changing a single-select answer announces nothing", async ({ page }) => {
  await startObjectivePractice(page);
  await walkToShape(page, false);

  const radios = optionInputs(page);
  await radios.nth(0).check();
  await radios.nth(1).check();

  // The replacement really happened — this is the exact diff the message used
  // to be computed from, so the silence below is the guard and not an
  // interaction that never landed.
  const checked = await checkedStates(page);
  expect(checked.filter(Boolean)).toHaveLength(1);
  expect(checked[1]).toBe(true);

  // Same locator the multi-select spec watches speak, so an empty read here
  // cannot be a locator that matches nothing.
  await expect(sessionLiveRegion(page)).toBeEmpty();
});

/**
 * Walks forward to the question carrying `stem`, and fails outright if the
 * session does not hold it. The question set for an objective is fixed, but the
 * ORDER is seeded per session — so across two sessions a question is found by
 * what it says, never by where it sat last time.
 */
async function walkToStem(page: Page, stem: string): Promise<void> {
  const total = await totalQuestions(page);

  for (let position = 1; position <= total; position += 1) {
    if ((await stemText(page)) === stem) return;

    expect(position).toBeLessThan(total);
    await page.getByRole("button", { name: en.exam.next }).click();
    await expect(page.getByText(questionCounter(position + 1))).toBeVisible();
  }

  throw new Error("the probed question was not in this session");
}

/**
 * A complete but wrong selection: every keyed option but the last, plus one
 * that is not keyed at all.
 *
 * Completeness matters — a multi-select reveals nothing until the full number
 * of options is picked, so "wrong" cannot mean "fewer".
 */
function wrongSelection(correct: string[], optionIds: string[]): string[] {
  const others = optionIds.filter((id) => !correct.includes(id));

  expect(others.length).toBeGreaterThan(0);
  return [...correct.slice(0, -1), others[0]];
}

/** The panel's whole accessible name for one verdict — nothing else allowed. */
function verdictName(verdict: string): RegExp {
  return new RegExp(`^${escapeRegExp(verdict)} ${escapeRegExp(en.review.whyTitle)}$`);
}

/**
 * Nothing else in the suite ties the announced verdict to whether the answer
 * was actually right.
 *
 * `SessionRunner.isAnswerCorrect` is the only place the verdict is chosen, and
 * since the reveal stopped writing to the live region, the rationale panel's
 * accessible name is the ONLY channel by which a screen-reader user learns the
 * outcome at the moment it happens. The reveal spec above accepts either
 * verdict through an alternation, so inverting that expression — or breaking
 * either of its two arms — used to leave lint, typecheck, every unit test and
 * every e2e spec green.
 *
 * The cross-check is the option rows' own correct/incorrect markers, which
 * `OptionList` derives from `question.correct` with no input from the shell.
 * A first session learns the keyed answer from them; a second answers with it
 * and must hear "Correct answer!", a third answers against it and must hear
 * "Incorrect answer." — both exactly, with no alternation to hide behind.
 */
test("the announced verdict follows whether the answer was actually right", async ({ page }) => {
  // Probe: answer question 1 however, then read the keyed answer off the
  // revealed rows — as option ids, because every session shuffles the options
  // again (D-03). The question is locked afterwards, so the two assertions
  // below each need a session of their own.
  await startObjectivePractice(page, true);
  const stem = await stemText(page);
  const optionIds = await shownOptionIds(page);

  await answerCurrentQuestion(page);
  await expect(page.getByRole("region", { name: en.review.whyTitle })).toBeVisible();

  const correct = await correctOptionIds(page);
  expect(correct.length).toBeGreaterThan(0);

  // Right answer -> "Correct answer! Why?".
  await startObjectivePractice(page, true);
  await walkToStem(page, stem);
  await checkOptionIds(page, correct);

  const rightPanel = page.getByRole("region", { name: en.review.whyTitle });
  await expect(rightPanel).toBeVisible();
  await expect(rightPanel).toHaveAccessibleName(verdictName(en.session.feedbackCorrect));

  // Wrong answer, same question -> "Incorrect answer. Why?".
  await startObjectivePractice(page, true);
  await walkToStem(page, stem);
  await checkOptionIds(page, wrongSelection(correct, optionIds));

  const wrongPanel = page.getByRole("region", { name: en.review.whyTitle });
  await expect(wrongPanel).toBeVisible();
  await expect(wrongPanel).toHaveAccessibleName(verdictName(en.session.feedbackIncorrect));
});

test("moving to the next question moves focus to its heading", async ({ page }) => {
  await startExam(page);

  await page.getByRole("button", { name: en.exam.next }).click();
  await expect(page.getByText(questionCounter(2))).toBeVisible();

  // The stem is the first h2 on the screen; the navigator's is further down.
  // Focusing it is what announces the swap — the button the user pressed is
  // still there and says nothing.
  const heading = page.getByRole("heading", { level: 2 }).first();
  await expect(heading).toBeFocused();

  // And it is named after the counter as well as the stem, so the
  // announcement says where the reader now is. The counter is referenced,
  // never written into the document a second time.
  const counter = await page.getByText(questionCounter(2)).innerText();
  await expect(heading).toHaveAccessibleName(`${counter} ${await stemText(page)}`);
});

test("the Next button keeps focus at the last question", async ({ page }) => {
  await startExam(page);
  const total = await totalQuestions(page);

  // Straight to the end through the navigator rather than 39 clicks.
  await page
    .getByRole("button", { name: fill(en.exam.question, { current: total, total }) })
    .click();
  await expect(page.getByText(questionCounter(total))).toBeVisible();

  // Disabling under the user's finger throws focus to <body> exactly when the
  // next tab stop is the submit button, so the state is conveyed instead.
  const next = page.getByRole("button", { name: en.exam.next });
  await expect(next).toHaveAttribute("aria-disabled", "true");
  await next.focus();
  await expect(next).toBeFocused();
});

test('"n" lands on the current question, not on the first', async ({ page }) => {
  await startExam(page);

  await page.getByRole("button", { name: en.exam.next }).click();
  await expect(page.getByText(questionCounter(2))).toBeVisible();

  await page.keyboard.press("n");

  // The desktop navigator's current cell, which is the only thing carrying
  // `aria-current` on this screen.
  await expect(page.locator('aside [aria-current="true"]')).toBeFocused();
});

/**
 * F2-13 — the same contract on a narrow screen, where the navigator is a modal
 * sheet rather than an always-visible panel.
 *
 * `useDialogFocus` focused the panel's first button, which in the sheet is
 * Close. A keyboard user pressing "n" to jump to a question landed on the
 * control that throws the sheet away, with the whole grid behind them.
 */
test('on a narrow screen, "n" lands on the current question inside the sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await startExam(page);

  await page.getByRole("button", { name: en.exam.next }).click();
  await expect(page.getByText(questionCounter(2))).toBeVisible();

  await page.keyboard.press("n");

  const sheet = page.getByRole("dialog", { name: en.exam.navigator });
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[aria-current="true"]')).toBeFocused();

  // Escape still closes it and hands focus back, which is the rest of the
  // contract the initial-focus change must not have broken.
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

/**
 * Task 15b — the study finish, which was the least-signalled state change in
 * the app: the result replaces the session inside the same route, so the URL
 * does not change, the button the candidate was standing on unmounts, and a
 * whole new screen used to arrive with focus on `<body>` and the tab still
 * claiming they were answering question 1.
 */
test("finishing an objective test moves focus to the result heading, a cold load does not", async ({
  page,
}) => {
  await page.goto("/calisma/lo/FL-1.1.1");
  await page.getByRole("button", { name: en.study.startTest }).click();
  await expect(page.getByText(questionCounter(1))).toBeVisible();

  await page.getByRole("button", { name: en.study.finish }).click();
  await page.getByRole("button", { name: en.study.confirmFinish }).click();

  const heading = page.getByRole("heading", { name: en.result.title, level: 1 });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();

  // `SessionRunner` owns `document.title` while the session is up and nothing
  // used to take it back.
  await expect(page).toHaveTitle(`${en.result.title} · ${PRODUCT_NAME}`);

  // The same screen reached cold — a bookmark, a reload — is an ordinary page
  // load with nothing to announce, and the heading is `tabIndex={-1}`, so
  // taking focus there would start the tab order BELOW it and leave the skip
  // link and the whole nav behind a Shift+Tab.
  await page.reload();
  await expect(heading).toBeVisible();

  // Waited on rather than the heading alone: the onward link renders only once
  // the objective lookup has resolved, which is strictly after the render that
  // would have moved focus. Without that ordering "not focused" could pass by
  // being asked too early.
  await expect(page.getByRole("link", { name: en.study.nextObjective })).toBeVisible();
  await expect(heading).not.toBeFocused();
});

/**
 * The same rule on `/sonuc`, which is a real URL rather than a state swap — and
 * which `useArrivalFocus` used to get wrong on exactly the path this reload
 * takes. The hand-over is a `replace` navigation, `replace` writes its key into
 * `history.state`, and the browser restores `history.state` across a reload, so
 * `location.key` came back non-"default" and the heading was focused on a
 * genuine page load. Only a real browser proves the restore; the navigation
 * type does not survive it.
 */
test("finishing a practice session moves focus to the result heading, a reload does not", async ({
  page,
}) => {
  await page.goto("/alistirma");
  await page.getByRole("button", { name: en.practice.start }).click();
  await expect(page.getByText(questionCounter(1))).toBeVisible();

  await answerCurrentQuestion(page);
  await page.getByRole("button", { name: en.practice.finish }).click();
  await page.getByRole("button", { name: en.practice.confirmFinish }).click();

  await expect(page).toHaveURL(/\/sonuc\/[\w-]+$/);
  const heading = page.getByRole("heading", { name: en.result.title, level: 1 });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();

  await page.reload();
  await expect(heading).toBeVisible();

  // Waited on rather than the heading alone: the onward links render only once
  // the attempt has been read back and scored, which is strictly after the
  // render that would have moved focus.
  await expect(page.getByRole("link", { name: en.result.retakePractice })).toBeVisible();
  await expect(heading).not.toBeFocused();
});

test("the timer shortcut stands down behind the shortcuts overlay", async ({ page }) => {
  await startExam(page);

  const hide = page.getByRole("button", { name: en.exam.hideTimer });
  await expect(hide).toBeVisible();

  await page.getByRole("button", { name: en.exam.shortcuts }).click();
  await expect(page.getByRole("dialog", { name: en.exam.shortcuts })).toBeVisible();

  // The overlay itself lists "T — hide timer", so reading the help is exactly
  // when a candidate presses it. The clock must not vanish behind the scrim.
  await page.keyboard.press("t");
  await expect(hide).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: en.exam.shortcuts })).toHaveCount(0);

  // ...and the key works again once the overlay is gone.
  await page.keyboard.press("t");
  await expect(page.getByRole("button", { name: en.exam.showTimer })).toBeVisible();
});

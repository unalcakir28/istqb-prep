import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { QuestionCard } from "./QuestionCard";
import i18n from "@/lib/i18n";
import en from "@/lib/i18n/locales/en.json";
import { questionFixture } from "@/test/questionFixture";

/**
 * The stem's heading level, which is the half of the review screen's outline
 * that an axe scan cannot judge: three `<h2>` siblings per question are valid
 * HTML and a flat, unreadable outline at the same time.
 */
beforeAll(async () => {
  await i18n.changeLanguage("en");
});

const question = questionFixture();
const stem = question.i18n.en.stem;

describe("QuestionCard", () => {
  it("puts the stem at h2 in a session, under the counter h1", () => {
    render(<QuestionCard question={question} lang="en" selected={[]} />);

    expect(screen.getByRole("heading", { name: stem, level: 2 })).toBeInTheDocument();
  });

  it("puts the stem at h3 on the review screen, under that question's own heading", () => {
    render(<QuestionCard question={question} lang="en" selected={[]} headingLevel={3} />);

    expect(screen.getByRole("heading", { name: stem, level: 3 })).toBeInTheDocument();
  });

  it("keeps the option group named after the stem at either level", () => {
    render(<QuestionCard question={question} lang="en" selected={[]} headingLevel={3} />);

    // The group is named by id reference, so a change of tag must not break
    // the link between the options and the question they belong to.
    expect(screen.getByRole("radiogroup")).toHaveAccessibleName(`${stem} ${en.exam.selectOne}`);
  });
});

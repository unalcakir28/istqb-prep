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

  describe("side by side (F2-06)", () => {
    it("shows both languages while keeping one answer per question", () => {
      render(<QuestionCard question={question} lang="en" selected={[]} secondaryLang="tr" />);

      expect(screen.getByRole("heading", { name: stem, level: 2 })).toBeInTheDocument();
      expect(screen.getByText(question.i18n.tr.stem)).toBeInTheDocument();

      // The whole point: two texts per choice, not two choices. A second radio
      // group would let the candidate tick a Turkish option and an English one
      // and mean a single answer.
      expect(screen.getAllByRole("radiogroup")).toHaveLength(1);
      expect(screen.getAllByRole("radio")).toHaveLength(question.i18n.en.options.length);
    });

    it("puts each option's two languages inside the same control", () => {
      render(<QuestionCard question={question} lang="en" selected={[]} secondaryLang="tr" />);

      const [first] = screen.getAllByRole("radio");
      // The label wrapping the input carries both texts, so clicking either
      // one selects the same option.
      expect(first.closest("label")).toHaveTextContent(question.i18n.en.options[0].text);
      expect(first.closest("label")).toHaveTextContent(question.i18n.tr.options[0].text);
    });

    it("shows one language when no secondary is asked for", () => {
      render(<QuestionCard question={question} lang="en" selected={[]} />);

      expect(screen.queryByText(question.i18n.tr.stem)).not.toBeInTheDocument();
    });
  });
});

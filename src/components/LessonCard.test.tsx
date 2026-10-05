import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { LessonCard } from "./LessonCard";
import type { LessonGlossary } from "@/features/glossary/lessonGlossary";
import i18n from "@/lib/i18n";
import en from "@/lib/i18n/locales/en.json";
import tr from "@/lib/i18n/locales/tr.json";
import type { Lesson } from "@/types/content";

/**
 * The placeholder branch, which is the half of study mode that has to change
 * the day lesson content starts landing (Track C).
 *
 * It lives here rather than in an E2E spec on purpose: pinned to the shipped
 * content, "the placeholder is on screen" is a test that goes red when the
 * project succeeds, on a spec unrelated to the change that broke it. Here the
 * lesson is a fixture, both branches are covered, and neither depends on which
 * lesson chunks under `data` happen to be filled in.
 */

function lessonFixture(): Lesson {
  const content = {
    title: "What testing is",
    paragraphs: ["Testing is more than running the software."],
    keyPoints: ["Testing includes static activities."],
    commonMistakes: ["Treating testing and debugging as the same activity."],
  };

  return {
    objective: "FL-1.1.1",
    syllabusVersion: "4.0.1",
    syllabusRef: "1.1",
    revision: 1,
    status: "published",
    origin: "original",
    i18n: { en: content, tr: { ...content, title: "Test nedir" } },
    meta: { author: "test", reviewedBy: "test", createdAt: "", updatedAt: "" },
  };
}

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

describe("LessonCard", () => {
  it("shows the placeholder while the objective has no lesson", () => {
    render(<LessonCard lesson={null} lang="en" />);

    expect(screen.getByText(en.study.lessonMissing)).toBeInTheDocument();
  });

  it("shows the lesson instead of the placeholder once one exists", () => {
    const lesson = lessonFixture();
    render(<LessonCard lesson={lesson} lang="en" />);

    expect(screen.getByRole("heading", { name: lesson.i18n.en.title })).toBeInTheDocument();
    expect(screen.getByText(lesson.i18n.en.paragraphs[0])).toBeInTheDocument();
    // The placeholder must not outlive the content it stands in for.
    expect(screen.queryByText(en.study.lessonMissing)).not.toBeInTheDocument();
  });

  it("renders the lesson in the content language it is given", () => {
    const lesson = lessonFixture();
    render(<LessonCard lesson={lesson} lang="tr" />);

    expect(screen.getByRole("heading", { name: lesson.i18n.tr.title })).toBeInTheDocument();
    expect(screen.queryByText(lesson.i18n.en.title)).not.toBeInTheDocument();
  });
});

describe("LessonCard glossary terms (F2-11)", () => {
  const glossary: LessonGlossary = {
    terms: [{ slug: "debugging", en: "debugging", chunk: "terms-d" }],
    entries: new Map([
      [
        "debugging",
        {
          slug: "debugging",
          revision: 1,
          en: { term: "debugging", definition: "The process of finding and fixing defects." },
          source: "ISTQB Glossary",
          sourceUrl: "https://glossary.istqb.org/en_US/term/debugging",
        },
      ],
    ]),
    source: "ISTQB Glossary",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  };

  it("leaves the text unmarked without a glossary", () => {
    render(<LessonCard lesson={lessonFixture()} lang="en" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("opens the definition in place, with its source and licence", () => {
    render(<LessonCard lesson={lessonFixture()} lang="en" glossary={glossary} />);

    // The fixture names "debugging" once, in the common mistakes.
    const term = screen.getByRole("button", { name: "debugging (show definition)" });
    expect(term).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(term);
    expect(term).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("The process of finding and fixing defects.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ISTQB Glossary" })).toHaveAttribute(
      "href",
      "https://glossary.istqb.org/en_US/term/debugging",
    );
    expect(screen.getByRole("link", { name: "CC BY 4.0" })).toBeInTheDocument();
    expect(screen.queryByText(en.study.termEnglishOnly)).not.toBeInTheDocument();
  });

  it("closes on Escape and gives focus back to the term", () => {
    render(<LessonCard lesson={lessonFixture()} lang="en" glossary={glossary} />);
    const term = screen.getByRole("button", { name: "debugging (show definition)" });

    fireEvent.click(term);
    fireEvent.keyDown(screen.getByText("The process of finding and fixing defects."), {
      key: "Escape",
    });

    expect(term).toHaveAttribute("aria-expanded", "false");
    expect(term).toHaveFocus();
  });

  it("says on a Turkish card that the definition is English only", () => {
    const turkish: LessonGlossary = {
      ...glossary,
      terms: [{ slug: "debugging", en: "debugging", tr: "debugging", chunk: "terms-d" }],
    };
    render(<LessonCard lesson={lessonFixture()} lang="tr" glossary={turkish} />);

    // The card's own words follow the card's language, not the interface's.
    fireEvent.click(screen.getByRole("button", { name: "debugging (tanımı göster)" }));
    expect(screen.getByText(tr.study.termEnglishOnly)).toBeInTheDocument();
  });
});

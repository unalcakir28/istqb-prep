import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { LessonCard } from "./LessonCard";
import i18n from "@/lib/i18n";
import en from "@/lib/i18n/locales/en.json";
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

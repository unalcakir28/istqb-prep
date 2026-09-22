import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { RationalePanel } from "./RationalePanel";
import i18n from "@/lib/i18n";
import en from "@/lib/i18n/locales/en.json";
import { questionFixture } from "@/test/questionFixture";

/**
 * The two things about this panel that no screenshot and no axe scan can see:
 * what its accessible NAME says at the moment the shell focuses it, and where
 * its headings sit in the outline of the screen that rendered it.
 *
 * Both are asserted here rather than end to end because both are pure markup —
 * the E2E suite proves the focus actually moves, which is the part a real
 * browser is needed for.
 */
beforeAll(async () => {
  await i18n.changeLanguage("en");
});

const question = questionFixture();

describe("RationalePanel", () => {
  it("is named after its title alone when no verdict is given", () => {
    render(<RationalePanel question={question} lang="en" selected={["a"]} />);

    // The review screen's case: nothing focuses the panel there, and every
    // question already carries its own outcome badge.
    expect(screen.getByRole("region")).toHaveAccessibleName(en.review.whyTitle);
  });

  it("carries the verdict in its name so a focus move cannot flush it", () => {
    render(<RationalePanel question={question} lang="en" selected={["a"]} verdict="correct" />);

    expect(screen.getByRole("region")).toHaveAccessibleName(
      `${en.session.feedbackCorrect} ${en.review.whyTitle}`,
    );
  });

  it("names the incorrect verdict the same way", () => {
    render(<RationalePanel question={question} lang="en" selected={["b"]} verdict="incorrect" />);

    expect(screen.getByRole("region")).toHaveAccessibleName(
      `${en.session.feedbackIncorrect} ${en.review.whyTitle}`,
    );
  });

  it("keeps the verdict out of the visible panel", () => {
    render(<RationalePanel question={question} lang="en" selected={["a"]} verdict="correct" />);

    // `sr-only` clips it rather than hiding it, which is what keeps it in the
    // accessible name; it must not become a second visible verdict next to the
    // one already marked on the option rows.
    expect(screen.getByText(en.session.feedbackCorrect)).toHaveClass("sr-only");
  });

  it("titles itself h2 in a session and h3 on the review screen", () => {
    const { unmount } = render(<RationalePanel question={question} lang="en" selected={["a"]} />);

    expect(screen.getByRole("heading", { name: en.review.whyTitle, level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.review.summary, level: 3 })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: en.review.perOption, level: 3 }),
    ).toBeInTheDocument();
    unmount();

    render(<RationalePanel question={question} lang="en" selected={["a"]} headingLevel={3} />);

    // Under the review screen's own "Question N of M" heading, one level down,
    // with the inner two following it.
    expect(screen.getByRole("heading", { name: en.review.whyTitle, level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: en.review.summary, level: 4 })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: en.review.perOption, level: 4 }),
    ).toBeInTheDocument();
  });
});

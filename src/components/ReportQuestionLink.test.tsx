import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { ReportQuestionLink } from "./ReportQuestionLink";
import i18n from "@/lib/i18n";
import { questionFixture } from "@/test/questionFixture";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

/**
 * D-03: the reporter saw the options shuffled, the maintainer opens the chunk
 * file. The issue body names options by their authored id and writes out the
 * order they were shown in, so "the first one" in a report can be mapped back.
 */
describe("ReportQuestionLink", () => {
  it("writes authored ids and the order the options were shown in", () => {
    const question = questionFixture();
    const content = question.i18n.en;
    const shown = {
      ...question,
      i18n: { ...question.i18n, en: { ...content, options: [...content.options].reverse() } },
    };

    render(<ReportQuestionLink question={shown} lang="en" selected={["b"]} />);

    const href = screen.getByRole("link").getAttribute("href") ?? "";
    const body = new URL(href).searchParams.get("body") ?? "";

    expect(body).toContain("- Options shown, top to bottom (authored ids): b, a");
    expect(body).toContain("- Selected (authored ids): b");
    expect(body).toContain("- Keyed answer (authored ids): a");
  });
});

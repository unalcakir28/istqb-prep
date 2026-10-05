import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { DiscussQuestionLink } from "./DiscussQuestionLink";
import i18n from "@/lib/i18n";
import { REPO_URL } from "@/lib/product";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

describe("DiscussQuestionLink (F4-06)", () => {
  it("searches the repository's discussions for the question's exact id", () => {
    render(<DiscussQuestionLink questionId="ctfl4-0042" />);

    const link = screen.getByRole("link", {
      name: "Discuss question ctfl4-0042 with other candidates",
    });
    const url = new URL(link.getAttribute("href") ?? "");

    expect(`${url.origin}${url.pathname}`).toBe(`${REPO_URL}/discussions`);
    expect(url.searchParams.get("discussions_q")).toBe('"ctfl4-0042"');
    expect(link).toHaveAttribute("rel", "noreferrer noopener");
  });
});

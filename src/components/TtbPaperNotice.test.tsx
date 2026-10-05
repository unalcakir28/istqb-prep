import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it } from "vitest";

import { TtbPaperNotice } from "./TtbPaperNotice";
import i18n from "@/lib/i18n";
import type { CertMeta } from "@/types/content";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

const META = {
  acronym: "CT-AI",
  syllabusVersion: "2.0",
  ttbPaper: {
    syllabusVersion: "1.0",
    replacedOn: "2027-10-21",
    source: "https://www.turkishtestingboard.org/en/ai-testing-exam/",
  },
} as CertMeta;

function renderAt(meta: CertMeta, now: Date) {
  return render(
    <MemoryRouter>
      <TtbPaperNotice meta={meta} now={now} />
    </MemoryRouter>,
  );
}

describe("TtbPaperNotice (F4-09)", () => {
  it("names the version TTB examines and the day the taught one takes over", () => {
    renderAt(META, new Date(2026, 9, 5));

    expect(
      screen.getByRole("heading", { name: "TTB still examines CT-AI v1.0" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/teaches CT-AI v2\.0/)).toHaveTextContent("October 21, 2027");
    expect(screen.getByRole("link", { name: "Taking the exam in Turkey" })).toHaveAttribute(
      "href",
      "/sinav-sureci",
    );
  });

  it("is gone from the first day TTB examines the taught version", () => {
    const { container } = renderAt(META, new Date(2027, 9, 21));

    expect(container).toBeEmptyDOMElement();
  });

  it("shows nothing for a certification TTB examines on the taught version", () => {
    const { container } = renderAt(
      { acronym: "CTFL", syllabusVersion: "4.0.1" } as CertMeta,
      new Date(2026, 9, 5),
    );

    expect(container).toBeEmptyDOMElement();
  });
});

import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { MediaRenderer } from "./MediaRenderer";
import i18n from "@/lib/i18n";
import en from "@/lib/i18n/locales/en.json";
import type { QuestionMedia } from "@/types/content";

/**
 * The claim under test is the one the schema cannot make: that a figure whose
 * natural form is a picture still reaches a candidate who cannot see it.
 */
beforeAll(async () => {
  await i18n.changeLanguage("en");
});

const decisionTable: QuestionMedia = {
  kind: "decision-table",
  caption: { tr: "Kupon kuralları", en: "Coupon rules" },
  headers: { tr: ["Koşul", "K1", "K2"], en: ["Condition", "R1", "R2"] },
  rows: [
    { tr: ["Üye", "E", "H"], en: ["Member", "Y", "N"] },
    { tr: ["Sepet > 100", "E", "E"], en: ["Basket > 100", "Y", "Y"] },
  ],
};

const stateTransition: QuestionMedia = {
  kind: "state-transition",
  caption: { tr: "Hesap durumları", en: "Account states" },
  states: ["Active", "Suspended", "Closed"],
  transitions: [
    { from: "Active", event: "suspend", to: "Suspended" },
    { from: "Suspended", event: "close", to: "Closed" },
  ],
  alt: {
    tr: "Active durumundan suspend olayıyla Suspended'a, oradan close olayıyla Closed'a geçilir.",
    en: "From Active, suspend goes to Suspended; from Suspended, close goes to Closed.",
  },
};

const controlFlow: QuestionMedia = {
  kind: "control-flow",
  caption: { tr: "İndirim fonksiyonu", en: "Discount function" },
  language: "python",
  content: "if total > 100:\n    total -= 10\nreturn total",
  alt: {
    tr: "Tek bir if dalı var; toplam 100'den büyükse 10 düşülür.",
    en: "One if branch: when the total is over 100, ten is subtracted.",
  },
};

/** Pulled out so the assertions do not have to re-narrow the union. */
const STATE_ALT_EN =
  "From Active, suspend goes to Suspended; from Suspended, close goes to Closed.";
const FLOW_ALT_EN = "One if branch: when the total is over 100, ten is subtracted.";

describe("MediaRenderer", () => {
  it("renders a decision table as a real table with row and column headers", () => {
    render(<MediaRenderer media={decisionTable} lang="en" />);

    const table = screen.getByRole("table", { name: "Coupon rules" });
    // Column headers come from `headers`; the first cell of each row is the
    // row's own header, so a "Y" three columns in is still attributable.
    expect(within(table).getByRole("columnheader", { name: "R1" })).toBeInTheDocument();
    expect(within(table).getByRole("rowheader", { name: "Member" })).toBeInTheDocument();
  });

  it("renders a state machine as a transition table plus its written alternative", () => {
    render(<MediaRenderer media={stateTransition} lang="en" />);

    const table = screen.getByRole("table", { name: "Account states" });
    expect(within(table).getByRole("columnheader", { name: en.media.from })).toBeInTheDocument();
    expect(within(table).getByRole("rowheader", { name: "Active" })).toBeInTheDocument();

    // Not behind a toggle: some candidates get only this.
    expect(screen.getByText(STATE_ALT_EN)).toBeInTheDocument();
    expect(screen.getByText(en.media.textAlternative)).toBeInTheDocument();
  });

  it("gives a control-flow fragment a written alternative next to the code", () => {
    render(<MediaRenderer media={controlFlow} lang="en" />);

    expect(screen.getByText(/if total > 100/)).toBeInTheDocument();
    expect(screen.getByText(FLOW_ALT_EN)).toBeInTheDocument();
  });

  it("shows a second table rather than doubling the columns when both languages are on", () => {
    render(<MediaRenderer media={decisionTable} lang="en" secondaryLang="tr" />);

    // Doubling the columns would destroy the very shape the question asks the
    // candidate to read.
    expect(screen.getAllByRole("table")).toHaveLength(2);
    expect(screen.getByRole("table", { name: "Kupon kuralları" })).toBeInTheDocument();
  });
});

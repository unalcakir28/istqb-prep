import { describe, expect, it } from "vitest";

import { markTerms, termsIn } from "./markTerms";
import type { GlossaryIndexEntry } from "@/types/content";

const TERMS: GlossaryIndexEntry[] = [
  { slug: "test", en: "test", chunk: "terms-t" },
  { slug: "test-case", en: "test case", tr: "test senaryosu", chunk: "terms-t" },
  { slug: "test-analysis", en: "test analysis", tr: "test analizi", chunk: "terms-t" },
  { slug: "defect", en: "defect", tr: "hata", chunk: "terms-d" },
  { slug: "error", en: "error", tr: "insan hatası", chunk: "terms-e" },
  { slug: "risk", en: "risk", tr: "risk", chunk: "terms-r" },
  { slug: "risk-based-testing", en: "risk-based testing", chunk: "terms-r" },
  { slug: "validation", en: "validation", tr: "sağlama", chunk: "terms-v" },
  { slug: "review", en: "review", tr: "gözden geçirme", chunk: "terms-r" },
];

function marked(texts: string[], lang: "tr" | "en"): string[] {
  return markTerms(texts, TERMS, lang)
    .flat()
    .filter((segment) => segment.slug)
    .map((segment) => `${segment.text}=${segment.slug}`);
}

describe("markTerms", () => {
  it("keeps every character of the text, in order", () => {
    const text = "A test case found a defect during test analysis.";
    const [segments] = markTerms([text], TERMS, "en");

    expect(segments.map((segment) => segment.text).join("")).toBe(text);
  });

  it("marks only the first occurrence of a term on the card", () => {
    expect(marked(["A defect here.", "Another defect there."], "en")).toEqual(["defect=defect"]);
  });

  it("prefers the longer term where two start at the same place", () => {
    expect(marked(["Start the test analysis."], "en")).toEqual(["test analysis=test-analysis"]);
  });

  it("takes an English plural but not another word that starts the same", () => {
    expect(marked(["Two test cases; defects; erroneous."], "en")).toEqual([
      "test cases=test-case",
      "defects=defect",
    ]);
  });

  it("never marks the terms too general to explain anything", () => {
    expect(marked(["Run the test."], "en")).toEqual([]);
  });

  it("matches case-insensitively and keeps the text as written", () => {
    expect(marked(["Validation comes later."], "en")).toEqual(["Validation=validation"]);
  });

  it("does not find a term inside a hyphenated word", () => {
    expect(marked(["A risk-based approach."], "en")).toEqual([]);
    expect(marked(["Use risk-based testing."], "en")).toEqual([
      "risk-based testing=risk-based-testing",
    ]);
  });

  it("takes a Turkish suffix", () => {
    expect(marked(["Test senaryosunu yaz; hatayı bul."], "tr")).toEqual([
      "Test senaryosunu=test-case",
      "hatayı=defect",
    ]);
  });

  it("finds the longer Turkish term before the shorter one inside it", () => {
    expect(marked(["Bir insan hatası, bir hataya yol açar."], "tr")).toEqual([
      "insan hatası=error",
      "hataya=defect",
    ]);
  });

  it("folds the Turkish dotted capital I", () => {
    const terms: GlossaryIndexEntry[] = [
      { slug: "inspection", en: "inspection", tr: "inceleme", chunk: "terms-i" },
    ];
    const [segments] = markTerms(["İnceleme yapılır."], terms, "tr");

    expect(segments[0]).toEqual({ text: "İnceleme", slug: "inspection" });
  });

  it("does not read a Turkish verb as the one-word verbal noun it is built on", () => {
    expect(marked(["Kaliteyi sağlamak, fayda sağlaması ve sağlamaya."], "tr")).toEqual([]);
    expect(marked(["Bunun için sağlama yapılır."], "tr")).toEqual(["sağlama=validation"]);
  });

  it("refuses the infinitive of a longer verbal-noun term but takes its other suffixes", () => {
    expect(marked(["Gözden geçirmek yetmez; gözden geçirmenin amacı."], "tr")).toEqual([
      "gözden geçirmenin=review",
    ]);
  });

  it("leaves a text unmarked when there are no terms in its language", () => {
    const [segments] = markTerms(["Bir test."], [TERMS[0]], "tr");

    expect(segments).toEqual([{ text: "Bir test." }]);
  });
});

describe("termsIn", () => {
  it("collects the terms named in either language", () => {
    const slugs = termsIn({ en: ["A test case."], tr: ["Bir gözden geçirme ve risk."] }, TERMS);

    expect([...slugs].sort()).toEqual(["review", "risk", "test-case"]);
  });
});

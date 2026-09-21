/**
 * Tests whether the real question bank satisfies the official blueprint.
 *
 * generateExam.test.ts validates the ENGINE against a synthetic pool; this
 * file validates the CONTENT. The two are separate concerns: the engine can
 * be flawless, but if the pool lacks enough questions for an LO group, the
 * user still gets a short exam.
 *
 * `review` questions are included in the pool too: they're written but not
 * yet published, and count as present for content-coverage purposes. The
 * publishing gate is a separate matter (validate-data #10/#11 enforces it).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { generateExam, previewCoverage } from "./generateExam";
import type { ExamBlueprint, QuestionIndex, QuestionIndexEntry } from "@/types/content";

const DATA = resolve(__dirname, "../../../data/ctfl-v4.0.1");

const blueprint = JSON.parse(
  readFileSync(resolve(DATA, "exam-blueprint.json"), "utf8"),
) as ExamBlueprint;

const index = JSON.parse(
  readFileSync(resolve(DATA, "questions", "index.json"), "utf8"),
) as QuestionIndex;

const bank: QuestionIndexEntry[] = index.questions.filter(
  (entry) => entry.status === "published" || entry.status === "review",
);

describe("real question bank", () => {
  it("contains enough questions to satisfy every blueprint group", () => {
    const { total, shortfalls } = previewCoverage(blueprint, bank);

    // If something is missing, show which group it is in the test output —
    // a bare number comparison tells the content author nothing.
    expect(
      shortfalls.map(
        (s) => `${s.groupId} (b${s.chapter} ${s.kLevel}): ${s.available}/${s.required}`,
      ),
    ).toEqual([]);
    expect(total).toBe(blueprint.totals.questions);
  });

  it("can generate a real 40-question exam from the bank", () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const exam = generateExam({ blueprint, pool: bank, seed });

      expect(exam.shortfalls).toEqual([]);
      expect(exam.questionIds).toHaveLength(40);
      expect(new Set(exam.questionIds).size).toBe(40);
    }
  });

  it("has the generated exam's chapter and K-level distribution match the official exam", () => {
    const byId = new Map(bank.map((entry) => [entry.id, entry]));

    for (let seed = 0; seed < 20; seed += 1) {
      const ids = generateExam({ blueprint, pool: bank, seed }).questionIds;

      const chapters: Record<number, number> = {};
      const kLevels: Record<string, number> = {};
      for (const id of ids) {
        const entry = byId.get(id)!;
        chapters[entry.chapter] = (chapters[entry.chapter] ?? 0) + 1;
        kLevels[entry.kLevel] = (kLevels[entry.kLevel] ?? 0) + 1;
      }

      expect(chapters).toEqual({ 1: 8, 2: 6, 3: 4, 4: 11, 5: 9, 6: 2 });
      expect(kLevels).toEqual({ K1: 8, K2: 24, K3: 8 });
    }
  });

  it("has at least one question per learning objective", () => {
    const objectives = (
      JSON.parse(readFileSync(resolve(DATA, "objectives.json"), "utf8")) as {
        objectives: Array<{ code: string }>;
      }
    ).objectives;

    const covered = new Set(bank.flatMap((entry) => entry.objectives));
    const missing = objectives.map((o) => o.code).filter((code) => !covered.has(code));

    expect(missing).toEqual([]);
  });

  it("has both languages for every question", () => {
    const monolingual = bank
      .filter((entry) => !(entry.languages.includes("tr") && entry.languages.includes("en")))
      .map((entry) => entry.id);

    expect(monolingual).toEqual([]);
  });
});

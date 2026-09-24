import { describe, expect, it } from "vitest";

import { optionOrder, optionSeed, withOptionOrder } from "./optionOrder";
import { scoreExam, type AnswerMap } from "./scoreExam";
import type { CertMeta, Question, QuestionContent } from "@/types/content";
import { questionFixture } from "@/test/questionFixture";

/**
 * D-03 — the order is a pure function of (seed, question id). These tests pin
 * the properties the session, result and review screens rely on: the same
 * pair always gives the same order, different pairs spread, nothing is lost,
 * TR and EN move together, and the score does not care.
 */

const IDS = ["a", "b", "c", "d"];

function content(lang: string): QuestionContent {
  return {
    stem: `stem (${lang})`,
    options: IDS.map((id) => ({ id, text: `${id} (${lang})` })),
    rationale: {
      summary: `summary (${lang})`,
      byOption: Object.fromEntries(IDS.map((id) => [id, `why ${id} (${lang})`])),
    },
  };
}

function fourOptions(id: string, correct: string[] = ["c"]): Question {
  return questionFixture({ id, correct, i18n: { tr: content("tr"), en: content("en") } });
}

const ids = (question: Question, lang: "tr" | "en" = "en") =>
  question.i18n[lang].options.map((option) => option.id);

describe("optionOrder", () => {
  it("gives the same order for the same seed and question, every time", () => {
    const question = fourOptions("ctfl4-0001");

    expect(optionOrder(question, 12345)).toEqual(optionOrder(question, 12345));
    expect(ids(withOptionOrder(question, 12345))).toEqual(optionOrder(question, 12345));
    expect(optionSeed(12345, "ctfl4-0001")).toBe(optionSeed(12345, "ctfl4-0001"));
  });

  it("varies across questions of one attempt and across attempts", () => {
    const orders = new Set<string>();
    for (let n = 1; n <= 40; n += 1) {
      const id = `ctfl4-${String(n).padStart(4, "0")}`;
      orders.add(optionOrder(fourOptions(id), 777).join(""));
    }
    // 40 draws from 24 permutations: far more than a handful must appear.
    expect(orders.size).toBeGreaterThan(10);

    const acrossSeeds = new Set<string>();
    for (let seed = 1; seed <= 40; seed += 1) {
      acrossSeeds.add(optionOrder(fourOptions("ctfl4-0001"), seed).join(""));
    }
    expect(acrossSeeds.size).toBeGreaterThan(10);
  });

  it("does not leave the key on its authored letter", () => {
    // Every question keyed "a" in the file: after the shuffle, the displayed
    // position of the key must spread over all four rows.
    const positions = new Set<number>();
    for (let n = 1; n <= 40; n += 1) {
      const question = withOptionOrder(fourOptions(`q${n}`, ["a"]), 99);
      positions.add(ids(question).indexOf("a"));
    }
    expect([...positions].sort()).toEqual([0, 1, 2, 3]);
  });

  it("keeps every option, its text and its rationale", () => {
    const question = fourOptions("ctfl4-0042");
    const shuffled = withOptionOrder(question, 5);

    for (const lang of ["tr", "en"] as const) {
      const before = question.i18n[lang];
      const after = shuffled.i18n[lang];

      expect([...after.options].sort((x, y) => x.id.localeCompare(y.id))).toEqual(before.options);
      expect(after.rationale).toEqual(before.rationale);
      expect(after.stem).toBe(before.stem);
    }
    expect(shuffled.correct).toEqual(question.correct);
  });

  it("applies one permutation to both languages", () => {
    const shuffled = withOptionOrder(fourOptions("ctfl4-0100"), 31337);

    expect(ids(shuffled, "tr")).toEqual(ids(shuffled, "en"));
  });

  it("does not mutate the question it was given", () => {
    const question = fourOptions("ctfl4-0007");
    const snapshot = structuredClone(question);

    withOptionOrder(question, 8);

    expect(question).toEqual(snapshot);
  });

  it("leaves a question with fewer than two options alone", () => {
    const one = questionFixture({
      i18n: {
        tr: { ...content("tr"), options: [{ id: "a", text: "only" }] },
        en: { ...content("en"), options: [{ id: "a", text: "only" }] },
      },
    });

    expect(withOptionOrder(one, 3)).toBe(one);
  });

  it("scores the same before and after the shuffle", () => {
    const meta = {
      exam: { passPoints: 1, totalPoints: 2, pointsPerQuestion: 1 },
    } as unknown as CertMeta;
    const questions = [fourOptions("q1", ["c"]), fourOptions("q2", ["b", "d"])];
    questions[1].selectCount = 2;
    questions[1].type = "multi";
    const answers: AnswerMap = { q1: ["c"], q2: ["d", "b"] };

    const authored = scoreExam(questions, answers, meta);
    const shuffled = scoreExam(
      questions.map((question) => withOptionOrder(question, 2024)),
      answers,
      meta,
    );

    expect(shuffled.points).toBe(2);
    expect(shuffled).toEqual(authored);
  });
});

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { scoreExam, weakestObjectives } from "./scoreExam";
import type { AnswerMap } from "./scoreExam";
import type { CertMeta, Question } from "@/types/content";

const DATA = resolve(__dirname, "../../../data/ctfl-v4.0.1");
const meta = JSON.parse(readFileSync(resolve(DATA, "meta.json"), "utf8")) as CertMeta;

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "ctfl4-9001",
    revision: 1,
    syllabusVersion: "4.0.1",
    chapter: 1,
    section: "1.1",
    syllabusRef: "§1.1",
    objectives: ["FL-1.1.1"],
    kLevel: "K1",
    type: "single",
    selectCount: 1,
    points: 1,
    difficulty: 2,
    tags: [],
    origin: "original",
    status: "published",
    correct: ["a"],
    media: null,
    i18n: {} as Question["i18n"],
    meta: { author: "test", reviewedBy: "test", createdAt: "", updatedAt: "" },
    ...overrides,
  };
}

describe("scoreExam", () => {
  it("baraji meta.json'dan okur, koda gommez", () => {
    expect(meta.exam.passPoints).toBe(26);

    const questions = Array.from({ length: 40 }, (_, i) =>
      makeQuestion({ id: `q${i}`, correct: ["a"] }),
    );
    const answers: AnswerMap = {};
    for (let i = 0; i < 26; i += 1) answers[`q${i}`] = ["a"];

    const score = scoreExam(questions, answers, meta);

    expect(score.points).toBe(26);
    expect(score.passPoints).toBe(26);
    expect(score.passed).toBe(true);
  });

  it("25/40 barajin altindadir, 26/40 gecer", () => {
    const questions = Array.from({ length: 40 }, (_, i) => makeQuestion({ id: `q${i}` }));

    const answer = (n: number): AnswerMap => {
      const map: AnswerMap = {};
      for (let i = 0; i < n; i += 1) map[`q${i}`] = ["a"];
      return map;
    };

    expect(scoreExam(questions, answer(25), meta).passed).toBe(false);
    expect(scoreExam(questions, answer(26), meta).passed).toBe(true);
  });

  it("coktan secmeli soruda TAM ESLESME arar — kismi puan yoktur", () => {
    const question = makeQuestion({
      id: "multi",
      type: "multi",
      selectCount: 2,
      correct: ["a", "c"],
    });

    // Ikisinden biri dogru: yine de 0 puan.
    expect(scoreExam([question], { multi: ["a"] }, meta).points).toBe(0);
    // Uc sik isaretlemek: 0 puan.
    expect(scoreExam([question], { multi: ["a", "c", "d"] }, meta).points).toBe(0);
    // Ikisi de dogru: 1 puan.
    expect(scoreExam([question], { multi: ["a", "c"] }, meta).points).toBe(1);
    // Sira onemsiz.
    expect(scoreExam([question], { multi: ["c", "a"] }, meta).points).toBe(1);
  });

  it("ayni sikkin iki kez gonderilmesini dogru saymaz", () => {
    const question = makeQuestion({
      id: "multi",
      type: "multi",
      selectCount: 2,
      correct: ["a", "c"],
    });

    expect(scoreExam([question], { multi: ["a", "a"] }, meta).points).toBe(0);
  });

  it("yanlis cevap puan dusurmez — negatif puanlama yok", () => {
    const questions = [
      makeQuestion({ id: "q1", correct: ["a"] }),
      makeQuestion({ id: "q2", correct: ["a"] }),
    ];
    const score = scoreExam(questions, { q1: ["a"], q2: ["b"] }, meta);

    expect(meta.exam.negativeMarking).toBeNull();
    expect(score.points).toBe(1);
  });

  it("cevapsiz soruyu yanlistan ayri sayar", () => {
    const questions = [
      makeQuestion({ id: "q1", correct: ["a"] }),
      makeQuestion({ id: "q2", correct: ["a"] }),
      makeQuestion({ id: "q3", correct: ["a"] }),
    ];
    const score = scoreExam(questions, { q1: ["a"], q2: ["b"] }, meta);

    expect(score.correctCount).toBe(1);
    expect(score.incorrectCount).toBe(1);
    expect(score.unansweredCount).toBe(1);
  });

  it("bolum, LO ve K-seviyesi kirilimi uretir", () => {
    const questions = [
      makeQuestion({ id: "q1", chapter: 1, objectives: ["FL-1.1.1"], kLevel: "K1" }),
      makeQuestion({ id: "q2", chapter: 1, objectives: ["FL-1.1.2"], kLevel: "K2" }),
      makeQuestion({ id: "q3", chapter: 4, objectives: ["FL-4.2.1"], kLevel: "K3" }),
    ];
    const score = scoreExam(questions, { q1: ["a"], q2: ["b"], q3: ["a"] }, meta);

    expect(score.byChapter[1]).toEqual({ correct: 1, total: 2, percent: 50 });
    expect(score.byChapter[4]).toEqual({ correct: 1, total: 1, percent: 100 });
    expect(score.byObjective["FL-1.1.2"]).toEqual({ correct: 0, total: 1, percent: 0 });
    expect(score.byKLevel.K3).toEqual({ correct: 1, total: 1, percent: 100 });
  });

  it("bir soru birden fazla LO'ya sayilir", () => {
    const question = makeQuestion({
      id: "q1",
      objectives: ["FL-1.2.1", "FL-1.2.3"],
    });
    const score = scoreExam([question], { q1: ["a"] }, meta);

    expect(score.byObjective["FL-1.2.1"].correct).toBe(1);
    expect(score.byObjective["FL-1.2.3"].correct).toBe(1);
  });

  it("eksik uretilmis denemede baraji yine resmi degerle karsilastirir", () => {
    // 30 soruluk eksik deneme: 26 dogru hala gecer, 25 gecmez.
    const questions = Array.from({ length: 30 }, (_, i) => makeQuestion({ id: `q${i}` }));
    const answers: AnswerMap = {};
    for (let i = 0; i < 26; i += 1) answers[`q${i}`] = ["a"];

    const score = scoreExam(questions, answers, meta);

    expect(score.totalPoints).toBe(30);
    expect(score.passPoints).toBe(26);
    expect(score.passed).toBe(true);
  });

  it("hic cevap verilmemis denemede cokmez", () => {
    const questions = Array.from({ length: 40 }, (_, i) => makeQuestion({ id: `q${i}` }));
    const score = scoreExam(questions, {}, meta);

    expect(score.points).toBe(0);
    expect(score.percent).toBe(0);
    expect(score.passed).toBe(false);
    expect(score.unansweredCount).toBe(40);
  });
});

describe("weakestObjectives", () => {
  it("en dusuk basarili LO'lari siralar, tam dogrulari disarida birakir", () => {
    const questions = [
      makeQuestion({ id: "a1", objectives: ["FL-1.1.1"] }),
      makeQuestion({ id: "a2", objectives: ["FL-1.1.1"] }),
      makeQuestion({ id: "b1", objectives: ["FL-2.1.1"], chapter: 2 }),
      makeQuestion({ id: "c1", objectives: ["FL-3.1.1"], chapter: 3 }),
    ];
    const score = scoreExam(questions, { a1: ["a"], a2: ["b"], b1: ["b"], c1: ["a"] }, meta);

    const weakest = weakestObjectives(score);

    expect(weakest[0]).toBe("FL-2.1.1"); // %0
    expect(weakest[1]).toBe("FL-1.1.1"); // %50
    expect(weakest).not.toContain("FL-3.1.1"); // %100 — zayif degil
  });
});

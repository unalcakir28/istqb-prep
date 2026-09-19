import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { generateExam, previewCoverage } from "./generateExam";
import type { ExamBlueprint, Objective, QuestionIndexEntry } from "@/types/content";

const DATA = resolve(__dirname, "../../../data/ctfl-v4.0.1");

const blueprint = JSON.parse(
  readFileSync(resolve(DATA, "exam-blueprint.json"), "utf8"),
) as ExamBlueprint;

const objectives = (
  JSON.parse(readFileSync(resolve(DATA, "objectives.json"), "utf8")) as {
    objectives: Objective[];
  }
).objectives;

/** Her LO icin `perObjective` adet yayinlanmis soru tasiyan sentetik havuz. */
function buildPool(perObjective: number): QuestionIndexEntry[] {
  const pool: QuestionIndexEntry[] = [];

  for (const objective of objectives) {
    for (let i = 0; i < perObjective; i += 1) {
      pool.push({
        id: `${objective.code}#${i}`,
        chunk: `ch0${objective.chapter}-a`,
        chapter: objective.chapter,
        objectives: [objective.code],
        kLevel: objective.kLevel,
        type: "single",
        selectCount: 1,
        languages: ["tr", "en"],
        syllabusVersion: "4.0.1",
        status: "published",
      });
    }
  }

  return pool;
}

function countBy<T extends string | number>(ids: string[], pick: (id: string) => T) {
  const counts = {} as Record<T, number>;
  for (const id of ids) {
    const key = pick(id);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

describe("generateExam", () => {
  const pool = buildPool(3);
  const byId = new Map(pool.map((entry) => [entry.id, entry]));
  const chapterOf = (id: string) => byId.get(id)!.chapter;
  const kLevelOf = (id: string) => byId.get(id)!.kLevel;

  it("blueprint'teki toplam soru sayisini uretir", () => {
    const exam = generateExam({ blueprint, pool, seed: 1 });

    expect(exam.questionIds).toHaveLength(blueprint.totals.questions);
    expect(exam.questionIds).toHaveLength(40);
    expect(exam.shortfalls).toEqual([]);
  });

  it("bolum dagilimi TAM OLARAK 8/6/4/11/9/2 olur", () => {
    // Tek tohumda tutmasi yeterli degil: dagilim sansa birakilmamali.
    for (let seed = 0; seed < 50; seed += 1) {
      const exam = generateExam({ blueprint, pool, seed });

      expect(countBy(exam.questionIds, chapterOf)).toEqual({
        1: 8,
        2: 6,
        3: 4,
        4: 11,
        5: 9,
        6: 2,
      });
    }
  });

  it("K-seviyesi dagilimi TAM OLARAK K1=8 K2=24 K3=8 olur", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      const exam = generateExam({ blueprint, pool, seed });

      expect(countBy(exam.questionIds, kLevelOf)).toEqual({ K1: 8, K2: 24, K3: 8 });
    }
  });

  it("dagilimi blueprint'ten okur, sabit yazmaz", () => {
    // Blueprint degistiginde motor kendiliginden uymali.
    const trimmed: ExamBlueprint = {
      ...blueprint,
      groups: blueprint.groups.filter((group) => group.chapter === 1),
    };
    const exam = generateExam({ blueprint: trimmed, pool, seed: 7 });

    expect(exam.questionIds).toHaveLength(8);
    expect(new Set(exam.questionIds.map(chapterOf))).toEqual(new Set([1]));
  });

  it("ayni soruyu bir denemede iki kez sormaz", () => {
    for (let seed = 0; seed < 25; seed += 1) {
      const ids = generateExam({ blueprint, pool, seed }).questionIds;

      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("ayni tohum ayni denemeyi uretir, farkli tohum farkli deneme", () => {
    const a = generateExam({ blueprint, pool, seed: 42 }).questionIds;
    const b = generateExam({ blueprint, pool, seed: 42 }).questionIds;
    const c = generateExam({ blueprint, pool, seed: 43 }).questionIds;

    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("sorudan cok LO olan grupta her soru FARKLI bir LO'yu kapsar", () => {
    const exam = generateExam({ blueprint, pool, seed: 11 });
    const selected = new Set(exam.questionIds);

    for (const group of blueprint.groups) {
      if (group.questions >= group.objectives.length) continue;

      const covered = [...selected]
        .map((id) => byId.get(id)!)
        .filter(
          (entry) =>
            entry.chapter === group.chapter &&
            entry.kLevel === group.kLevel &&
            entry.objectives.some((code) => group.objectives.includes(code)),
        )
        .flatMap((entry) => entry.objectives);

      expect(new Set(covered).size).toBe(covered.length);
    }
  });

  it("LO'dan cok soru olan grupta her LO'dan en az bir soru gelir", () => {
    const exam = generateExam({ blueprint, pool, seed: 13 });
    const selected = exam.questionIds.map((id) => byId.get(id)!);

    for (const group of blueprint.groups) {
      if (group.questions < group.objectives.length) continue;

      for (const code of group.objectives) {
        const hit = selected.some(
          (entry) => entry.kLevel === group.kLevel && entry.objectives.includes(code),
        );
        expect(hit, `${group.id} grubunda ${code} icin soru yok`).toBe(true);
      }
    }
  });

  it("gorulmus sorular yerine gorulmemisleri tercih eder", () => {
    const first = generateExam({ blueprint, pool, seed: 5 });
    const second = generateExam({
      blueprint,
      pool,
      seed: 5,
      exclude: new Set(first.questionIds),
    });

    const repeated = second.questionIds.filter((id) => first.questionIds.includes(id));
    expect(repeated).toHaveLength(0);
  });

  it("havuz yetersizse SESSIZCE eksik uretmez, eksigi raporlar", () => {
    // Her LO icin tek soru: 3 soru isteyen gruplar karsilanamaz.
    const thin = buildPool(1).filter((entry) => entry.chapter !== 3);
    const exam = generateExam({ blueprint, pool: thin, seed: 3 });

    expect(exam.shortfalls.length).toBeGreaterThan(0);
    expect(exam.questionIds.length).toBeLessThan(40);

    const chapter3 = exam.shortfalls.filter((shortfall) => shortfall.chapter === 3);
    expect(chapter3.length).toBe(3);
    for (const shortfall of chapter3) {
      expect(shortfall.available).toBe(0);
      expect(shortfall.required).toBeGreaterThan(0);
    }
  });

  it("bos havuzda cokmez, her grubu eksik raporlar", () => {
    const exam = generateExam({ blueprint, pool: [], seed: 1 });

    expect(exam.questionIds).toEqual([]);
    expect(exam.shortfalls).toHaveLength(blueprint.groups.length);
  });

  it("yalnizca dogru bolum ve K-seviyesindeki sorulari secer", () => {
    const exam = generateExam({ blueprint, pool, seed: 21 });

    for (const id of exam.questionIds) {
      const entry = byId.get(id)!;
      const fits = blueprint.groups.some(
        (group) =>
          group.chapter === entry.chapter &&
          group.kLevel === entry.kLevel &&
          entry.objectives.some((code) => group.objectives.includes(code)),
      );
      expect(fits, `${id} hicbir blueprint grubuna uymuyor`).toBe(true);
    }
  });
});

describe("previewCoverage", () => {
  it("yeterli havuzda 40 soru ve eksiksiz rapor verir", () => {
    const { total, shortfalls } = previewCoverage(blueprint, buildPool(3));

    expect(total).toBe(40);
    expect(shortfalls).toEqual([]);
  });

  it("eksik havuzu deneme baslamadan once bildirir", () => {
    const pool = buildPool(3).filter((entry) => entry.chapter !== 6);
    const { total, shortfalls } = previewCoverage(blueprint, pool);

    expect(total).toBe(38);
    expect(shortfalls.map((shortfall) => shortfall.chapter)).toEqual([6, 6]);
  });
});

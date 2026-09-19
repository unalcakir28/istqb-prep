/**
 * Gercek soru bankasinin resmi blueprint'i karsilayip karsilamadigini sinar.
 *
 * generateExam.test.ts sentetik havuzla MOTORU dogrular; bu dosya ICERIGI
 * dogrular. Ikisi ayri sorular: motor kusursuz olabilir ama havuzda bir LO
 * grubu icin yeterli soru yoksa kullanici eksik deneme alir.
 *
 * Havuza `review` sorulari da dahil edilir: bunlar yazilmis ama heniz
 * yayinlanmamis sorulardir ve icerik kapsamasi acisindan mevcut sayilirlar.
 * Yayin kapisi ayri bir sey (validate-data #10/#11 onu tutar).
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

describe("gercek soru bankasi", () => {
  it("her blueprint grubunu karsilayacak kadar soru icerir", () => {
    const { total, shortfalls } = previewCoverage(blueprint, bank);

    // Eksik varsa hangi grup oldugu testte gorunsun — cıplak bir sayi
    // karsilastirmasi icerik yazarina hicbir sey soylemez.
    expect(
      shortfalls.map(
        (s) => `${s.groupId} (b${s.chapter} ${s.kLevel}): ${s.available}/${s.required}`,
      ),
    ).toEqual([]);
    expect(total).toBe(blueprint.totals.questions);
  });

  it("bankadan tam 40 soruluk gercek bir deneme uretilebilir", () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const exam = generateExam({ blueprint, pool: bank, seed });

      expect(exam.shortfalls).toEqual([]);
      expect(exam.questionIds).toHaveLength(40);
      expect(new Set(exam.questionIds).size).toBe(40);
    }
  });

  it("uretilen denemenin bolum ve K dagilimi resmi sinavla ayni olur", () => {
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

  it("her ogrenme hedefi icin en az bir soru vardir", () => {
    const objectives = (
      JSON.parse(readFileSync(resolve(DATA, "objectives.json"), "utf8")) as {
        objectives: Array<{ code: string }>;
      }
    ).objectives;

    const covered = new Set(bank.flatMap((entry) => entry.objectives));
    const missing = objectives.map((o) => o.code).filter((code) => !covered.has(code));

    expect(missing).toEqual([]);
  });

  it("her sorunun iki dili de vardir", () => {
    const monolingual = bank
      .filter((entry) => !(entry.languages.includes("tr") && entry.languages.includes("en")))
      .map((entry) => entry.id);

    expect(monolingual).toEqual([]);
  });
});

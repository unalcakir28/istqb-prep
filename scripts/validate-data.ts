#!/usr/bin/env tsx
/**
 * scripts/validate-data.ts
 *
 * Implements the 13 CI checks from docs/04-veri-modeli.md §6.
 * Checks #1-9 are ERRORS (exit 1). Checks #10-13 are WARNINGS (exit 0, printed).
 *
 * Design rules followed (see CLAUDE.md):
 *   - Guard clauses / early returns, no deep nesting, no hardcoded exam
 *     constants (40, 8-6-4-11-9-2, 8-24-8) — those are read from
 *     syllabus.json, never hardcoded here.
 *   - Walks outward from data/manifest.json; no certification id is
 *     hardcoded anywhere in this file.
 *
 * Run with: tsx scripts/validate-data.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const SCHEMAS_DIR = path.join(ROOT, "schemas");

function toRel(absPath: string): string {
  return path.relative(ROOT, absPath);
}

// ---------------------------------------------------------------------------
// Issue collection
// ---------------------------------------------------------------------------

type Level = "error" | "warning";

interface CheckDef {
  num: number;
  level: Level;
  name: string;
}

const CHECKS: Record<number, CheckDef> = {
  1: { num: 1, level: "error", name: "JSON Schema uygunlugu" },
  2: { num: 2, level: "error", name: "objectives[] kodu objectives.json'da var mi" },
  3: { num: 3, level: "error", name: "correct[] uzunlugu selectCount ile esit mi" },
  4: { num: 4, level: "error", name: "correct[] icindeki ID'ler options'ta var mi" },
  5: { num: 5, level: "error", name: "rationale.byOption her sik icin dolu mu (TR/EN)" },
  6: { num: 6, level: "error", name: "i18n.tr ve i18n.en tutarli mi (sik sayisi/sirasi)" },
  7: { num: 7, level: "error", name: "Soru ID'leri tum parcalar arasinda benzersiz mi" },
  8: { num: 8, level: "error", name: "index.json parca dosyalariyla tutarli mi" },
  9: { num: 9, level: "error", name: "exam-blueprint.json toplami syllabus.json ile uyusuyor mu" },
  10: { num: 10, level: "warning", name: "Her LO icin en az 1 yayinlanmis soru" },
  11: { num: 11, level: "warning", name: "Her LO icin en az 3 yayinlanmis soru" },
  12: { num: 12, level: "warning", name: "kLevel, LO'larin en yuksegiyle uyumlu mu" },
  13: { num: 13, level: "warning", name: "Turkce metinde Ingilizce terim sizintisi" },
  14: { num: 14, level: "warning", name: "Dogru cevabin sik konumu dengeli mi" },
  15: { num: 15, level: "error", name: "Metinde sik harfine atif var mi" },
};

interface Issue {
  checkNum: number;
  level: Level;
  file: string;
  refId?: string;
  message: string;
}

const issues: Issue[] = [];

function report(checkNum: number, file: string, refId: string | undefined, message: string): void {
  const check = CHECKS[checkNum];
  issues.push({ checkNum, level: check.level, file: toRel(file.startsWith(ROOT) ? file : path.join(ROOT, file)), refId, message });
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

// Diskten okunan JSON'un sekli tanim geregi bilinmiyor — bu dosyanin isi
// zaten o sekli dogrulamak. Cagri yerleri alanlara isaretsiz erisir; hatali
// veri, tip sistemi tarafindan degil asagidaki kontroller tarafindan yakalanir.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readJson(absPath: string): any {
  if (!fs.existsSync(absPath)) {
    report(1, absPath, undefined, `Dosya bulunamadi: ${toRel(absPath)}`);
    return null;
  }

  const raw = fs.readFileSync(absPath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    report(1, absPath, undefined, `Gecersiz JSON (parse hatasi): ${(err as Error).message}`);
    return null;
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const K_ORDER: Record<string, number> = { K1: 1, K2: 2, K3: 3 };

function highestKLevel(levels: string[]): string | null {
  if (levels.length === 0) return null;
  return levels.reduce((best, current) => (K_ORDER[current] > K_ORDER[best] ? current : best));
}

// ---------------------------------------------------------------------------
// AJV setup (schemas are 2020-12 dialect)
// ---------------------------------------------------------------------------

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

// Sema adlari tek yerde durur: hata mesaji hangi semanin konustugunu yazar
// ve ikinci bir tablo tutulursa er gec biriyle otekinin arasi acilir.
const SCHEMA_FILES = {
  manifest: "manifest.schema.json",
  certifications: "certifications.schema.json",
  meta: "meta.schema.json",
  syllabus: "syllabus.schema.json",
  objectives: "objectives.schema.json",
  examBlueprint: "exam-blueprint.schema.json",
  questionsIndex: "questions-index.schema.json",
  question: "question.schema.json",
  glossaryIndex: "glossary-index.schema.json",
  glossary: "glossary.schema.json",
} as const;

type SchemaKey = keyof typeof SCHEMA_FILES;

function compileSchema(fileName: string) {
  const schemaPath = path.join(SCHEMAS_DIR, fileName);
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Sema dosyasi bulunamadi: schemas/${fileName} — validator calisamaz.`);
  }
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  return ajv.compile(schema);
}

const validators = Object.fromEntries(
  Object.entries(SCHEMA_FILES).map(([key, fileName]) => [key, compileSchema(fileName)]),
) as Record<SchemaKey, ReturnType<typeof compileSchema>>;

function validateAgainstSchema(key: SchemaKey, data: unknown, file: string): void {
  const validate = validators[key];
  if (validate(data)) return;

  for (const err of validate.errors ?? []) {
    const location = err.instancePath || "(kok)";
    report(1, file, location, `${err.message} — schema: schemas/${SCHEMA_FILES[key]} (${JSON.stringify(err.params)})`);
  }
}

// ---------------------------------------------------------------------------
// Turkish terminology leak table (docs/07-icerik-uretim-rehberi.md §5)
// "testware" is intentionally excluded: the table marks it as an accepted
// loanword ("testware / test ürünleri"), not a mistranslation to flag.
// ---------------------------------------------------------------------------

// Terim listesi terms.json'dan gelir — tek dogruluk kaynagi odur.
// Buraya elle kopyalanan bir liste kaciniimaz olarak eskir; nitekim ilk
// surumu "defect -> kusur" gibi resmi mufredatla CELISEN karsiliklar
// tasiyordu ve yazarlari yanlis terime yonlendiriyordu.
interface LeakPattern {
  en: string;
  tr: string;
  regex: RegExp;
}

function buildLeakPatterns(termsDoc: any): LeakPattern[] {
  const terms: any[] = Array.isArray(termsDoc?.terms) ? termsDoc.terms : [];
  const patterns: LeakPattern[] = [];

  for (const term of terms) {
    const en = String(term?.en ?? "").trim();
    const tr = String(term?.tr ?? "").trim();
    if (en.length === 0 || tr.length === 0) continue;

    // Turkce karsilik Ingilizce terimi zaten iceriyorsa (ör. "shift left" ->
    // "shift-left", "risk" -> "risk") arama anlamsizdir: dogru kullanim da
    // eslesir ve her metin yanlis yere sizinti sayilir.
    const normalizedEn = en.toLowerCase();
    const normalizedTr = tr.toLowerCase().replace(/-/g, " ");
    if (normalizedTr.includes(normalizedEn)) continue;

    patterns.push({ en, tr, regex: new RegExp(`\\b${escapeRegExp(en)}\\b`, "gi") });
  }

  // Uzun terim once denensin: "branch coverage" eslesirse "coverage" ayrica
  // raporlanmasin.
  return patterns.sort((a, b) => b.en.length - a.en.length);
}

/**
 * Metindeki parantez araliklari.
 *
 * Ilk gecişte parantez icinde Ingilizcesini vermek kurallidir:
 * "hata (defect)". Eskiden parantez, terimin HEMEN oncesinde/sonrasinda
 * aranıyordu; bu, "teknik gözden geçirme (technical review)" gibi cok
 * kelimeli aciklamalarda kiriliyordu, cunku '(' 'technical'in onunde,
 * aranan terim ise 'review'. Artik eslesmenin bir parantez araliginin
 * ICINDE olup olmadigina bakiliyor.
 */
function parenSpans(text: string): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  const open: number[] = [];

  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "(") open.push(i);
    if (text[i] !== ")") continue;
    const start = open.pop();
    if (start !== undefined) spans.push([start, i]);
  }

  return spans;
}

function findTerminologyLeaks(text: string, patterns: LeakPattern[]): Array<{ en: string; tr: string }> {
  const spans = parenSpans(text);
  const found = new Map<string, { en: string; tr: string }>();
  const claimed: Array<[number, number]> = [];

  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.regex.exec(text)) !== null) {
      const from = match.index;
      const to = from + match[0].length;

      const inGloss = spans.some(([open, close]) => from > open && to <= close);
      if (inGloss) continue;

      // Daha uzun bir terim bu araligi zaten kapsadiysa tekrar sayma.
      const covered = claimed.some(([start, end]) => from >= start && to <= end);
      if (covered) continue;

      claimed.push([from, to]);
      found.set(pattern.en, { en: pattern.en, tr: pattern.tr });
    }
  }

  return [...found.values()];
}

// ---------------------------------------------------------------------------
// Per-question checks (#2 - #7, #10 - #13)
// ---------------------------------------------------------------------------

interface QuestionRecord {
  question: any;
  file: string;
}

function checkObjectivesExist(questions: QuestionRecord[], objectiveCodes: Set<string>, objectivesFile: string): void {
  for (const { question, file } of questions) {
    const objectives: string[] = Array.isArray(question.objectives) ? question.objectives : [];
    for (const code of objectives) {
      if (objectiveCodes.has(code)) continue;
      report(2, file, question.id, `objectives[] icinde '${code}' var ama ${toRel(objectivesFile)} icinde boyle bir LO kodu yok. Beklenen: objectives.json'da tanimli bir kod; Bulunan: '${code}'.`);
    }
  }
}

// exam-blueprint.json groups[] also carry an objectives[] field referencing
// LO codes — same invariant, same check number (#2), just a different
// source file. This is what actually surfaces "objectives.json is only
// 3/64 complete" as a concrete, actionable list instead of a silent gap.
function checkBlueprintObjectivesExist(blueprint: any, blueprintFile: string, objectiveCodes: Set<string>, objectivesFile: string): void {
  const groups: any[] = Array.isArray(blueprint?.groups) ? blueprint.groups : [];
  for (const group of groups) {
    const objectives: string[] = Array.isArray(group.objectives) ? group.objectives : [];
    for (const code of objectives) {
      if (objectiveCodes.has(code)) continue;
      report(2, blueprintFile, group.id, `groups[].objectives icinde '${code}' var ama ${toRel(objectivesFile)} icinde boyle bir LO kodu yok. Beklenen: objectives.json'da tanimli bir kod; Bulunan: '${code}'.`);
    }
  }
}

function checkCorrectLengthMatchesSelectCount(questions: QuestionRecord[]): void {
  for (const { question, file } of questions) {
    const correct: unknown[] = Array.isArray(question.correct) ? question.correct : [];
    const selectCount = question.selectCount;
    if (correct.length === selectCount) continue;
    report(3, file, question.id, `correct[] uzunlugu selectCount ile eslesmiyor. Beklenen: selectCount=${selectCount}; Bulunan: correct=${JSON.stringify(correct)} (uzunluk ${correct.length}).`);
  }
}

function checkCorrectIdsInOptions(questions: QuestionRecord[]): void {
  for (const { question, file } of questions) {
    const correct: string[] = Array.isArray(question.correct) ? question.correct : [];
    for (const lang of ["tr", "en"] as const) {
      const localized = question.i18n?.[lang];
      if (!localized) continue;
      const optionIds: string[] = Array.isArray(localized.options) ? localized.options.map((o: any) => o.id) : [];
      const missing = correct.filter((id) => !optionIds.includes(id));
      if (missing.length === 0) continue;
      report(4, file, question.id, `correct[] icinde options'ta olmayan ID var (i18n.${lang}). Beklenen: correct[] ⊆ options[].id (${JSON.stringify(optionIds)}); Bulunan eksik ID('lar): ${JSON.stringify(missing)}.`);
    }
  }
}

function checkRationaleByOptionComplete(questions: QuestionRecord[]): void {
  for (const { question, file } of questions) {
    for (const lang of ["tr", "en"] as const) {
      const localized = question.i18n?.[lang];
      if (!localized) continue;
      const optionIds: string[] = Array.isArray(localized.options) ? localized.options.map((o: any) => o.id) : [];
      const byOption = localized.rationale?.byOption ?? {};
      const rationaleIds = Object.keys(byOption);

      const missing = optionIds.filter((id) => !rationaleIds.includes(id));
      if (missing.length > 0) {
        report(5, file, question.id, `rationale.byOption (i18n.${lang}) bazi siklar icin eksik. Beklenen: her sik icin bir gerekce (${JSON.stringify(optionIds)}); Bulunan eksik: ${JSON.stringify(missing)}.`);
      }

      const extra = rationaleIds.filter((id) => !optionIds.includes(id));
      if (extra.length > 0) {
        report(5, file, question.id, `rationale.byOption (i18n.${lang}) icinde options'ta olmayan sik ID'leri var. Beklenen: yalnizca ${JSON.stringify(optionIds)}; Bulunan fazladan: ${JSON.stringify(extra)}.`);
      }

      for (const id of optionIds) {
        const text = byOption[id];
        if (isNonEmptyString(text) && text.trim().length >= 15) continue;
        if (missing.includes(id)) continue; // already reported above
        report(5, file, question.id, `rationale.byOption.${id} (i18n.${lang}) bos veya cok kisa. Beklenen: en az 15 karakterlik, o sikkin neyi tanimladigini aciklayan bir gerekce; Bulunan: ${JSON.stringify(text)}.`);
      }
    }
  }
}

function checkI18nTrEnConsistent(questions: QuestionRecord[]): void {
  for (const { question, file } of questions) {
    const tr = question.i18n?.tr;
    const en = question.i18n?.en;
    if (!tr || !en) {
      report(6, file, question.id, `i18n icinde hem tr hem en gerekli. Bulunan: tr=${tr ? "var" : "YOK"}, en=${en ? "var" : "YOK"}.`);
      continue;
    }

    const trOptions: any[] = Array.isArray(tr.options) ? tr.options : [];
    const enOptions: any[] = Array.isArray(en.options) ? en.options : [];
    if (trOptions.length !== enOptions.length) {
      report(6, file, question.id, `TR ve EN sik sayisi farkli. Beklenen: esit sayida sik; Bulunan: tr=${trOptions.length}, en=${enOptions.length}.`);
      continue;
    }

    for (let i = 0; i < trOptions.length; i += 1) {
      if (trOptions[i]?.id === enOptions[i]?.id) continue;
      report(6, file, question.id, `TR ve EN siklarin sirasi/ID'leri uyusmuyor (index ${i}). Beklenen: ayni sirada ayni ID; Bulunan: tr='${trOptions[i]?.id}', en='${enOptions[i]?.id}'.`);
    }
  }
}

function checkQuestionIdsUnique(questions: QuestionRecord[]): void {
  const seen = new Map<string, string[]>();
  for (const { question, file } of questions) {
    if (!isNonEmptyString(question.id)) continue;
    const files = seen.get(question.id) ?? [];
    files.push(file);
    seen.set(question.id, files);
  }

  for (const [id, files] of seen) {
    if (files.length <= 1) continue;
    report(7, files[0], id, `Soru ID'si birden fazla yerde kullanilmis. Beklenen: her ID tam olarak bir kez; Bulunan: '${id}' su dosyalarda geciyor: ${files.map(toRel).join(", ")}.`);
  }
}

function checkKLevelConsistency(questions: QuestionRecord[], objectivesByCode: Map<string, any>): void {
  for (const { question, file } of questions) {
    const objectives: string[] = Array.isArray(question.objectives) ? question.objectives : [];
    const knownKLevels = objectives
      .map((code) => objectivesByCode.get(code)?.kLevel)
      .filter((k): k is string => isNonEmptyString(k));

    if (knownKLevels.length === 0) continue; // check #2 already flags unknown LO codes

    const expected = highestKLevel(knownKLevels);
    if (expected === question.kLevel) continue;
    report(12, file, question.id, `Sorunun kLevel'i, LO'larinin en yuksek K-seviyesiyle uyumlu degil. Beklenen: ${expected} (LO'lar: ${JSON.stringify(objectives)} → ${JSON.stringify(knownKLevels)}); Bulunan: ${question.kLevel}.`);
  }
}

function checkTerminologyLeakage(questions: QuestionRecord[], patterns: LeakPattern[]): void {
  if (patterns.length === 0) return;

  for (const { question, file } of questions) {
    const tr = question.i18n?.tr;
    if (!tr) continue;

    const fields: Array<{ label: string; text: string }> = [];
    if (isNonEmptyString(tr.stem)) fields.push({ label: "stem", text: tr.stem });
    for (const opt of Array.isArray(tr.options) ? tr.options : []) {
      if (isNonEmptyString(opt?.text)) fields.push({ label: `options[${opt.id}]`, text: opt.text });
    }
    if (isNonEmptyString(tr.rationale?.summary)) fields.push({ label: "rationale.summary", text: tr.rationale.summary });
    for (const [optId, text] of Object.entries(tr.rationale?.byOption ?? {})) {
      if (isNonEmptyString(text)) fields.push({ label: `rationale.byOption.${optId}`, text: text as string });
    }
    for (const hint of Array.isArray(tr.hints) ? tr.hints : []) {
      if (isNonEmptyString(hint)) fields.push({ label: "hints[]", text: hint });
    }

    for (const field of fields) {
      const leaks = findTerminologyLeaks(field.text, patterns);
      for (const leak of leaks) {
        report(13, file, question.id, `TR metninde (${field.label}) cevrilmemis Ingilizce terim: '${leak.en}'. Beklenen terim: '${leak.tr}' (bkz. docs/07-icerik-uretim-rehberi.md §5); ilk gecişte parantez icinde Ingilizcesi verilebilir, ama parantezsiz kullanim beklenmez.`);
      }
    }
  }
}

/**
 * #14 — Dogru cevabin sik konumu dengeli mi?
 *
 * Bu kontrol sonradan eklendi: ilk 87 soruluk partide tek secimli sorularin
 * 78'inden 51'inde dogru cevap "a" siktaydi (%65). Hep "a" isaretleyen bir
 * aday baraji gecerdi. Uretilen icerikte sistematik bir egilim oldugu icin
 * tek seferlik duzeltme yetmez; kapi burada tutulur.
 *
 * Esik bilerek gevsek: kucuk havuzlarda sapma dogaldir, amac tesaduf degil
 * SISTEMATIK egilimi yakalamak.
 */
function checkAnswerPositionBalance(questions: QuestionRecord[], file: string): void {
  const singles = questions.filter(({ question }) => question?.type === "single");
  if (singles.length < 20) return;

  const counts = new Map<string, number>();
  for (const { question } of singles) {
    const first = Array.isArray(question.correct) ? question.correct[0] : undefined;
    if (!isNonEmptyString(first)) continue;
    counts.set(first, (counts.get(first) ?? 0) + 1);
  }

  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
  if (total === 0) return;

  const positions = Math.max(counts.size, 4);
  const expected = total / positions;
  const limit = expected * 1.6;

  for (const [optionId, count] of [...counts].sort()) {
    if (count <= limit) continue;
    report(
      14,
      file,
      undefined,
      `Dogru cevap '${optionId}' sikkinda orantisiz siklikta. Beklenen: ~${expected.toFixed(1)} (${total} tek secimli soru / ${positions} sik); Bulunan: ${count}. Siklari dondurup yeniden etiketleyin.`,
    );
  }
}

/**
 * #15 — Soru metninde sik harfine atif var mi?
 *
 * "Bu nedenle (c) yanlis esleştirmedir" gibi bir cumle, siklarin sirasi
 * degistigi anda YALAN olur. Siklar yeniden siralandiginda `byOption`
 * anahtarlari programatik olarak tasinir ama duz metin icindeki harf
 * kalir — ve cevap anahtarina duyulan guveni yok eden tam da bu tur bir
 * kusurdur.
 *
 * Gercekten yasandi: sik konumu dengelemesi sonrasi bir sorunun ozeti
 * adaya cevabin C oldugunu soyluyordu, anahtar ise D idi. Bu yuzden
 * uyari degil HATA seviyesinde.
 *
 * Gerekce metinleri sikka konumuyla degil ICERIGIYLE atifta bulunmalidir:
 * "(c) yanlistir" yerine "is birligi araclari satiri yanlistir".
 */
const OPTION_LETTER_REF =
  /(?<![\w])\(([a-e])\)(?![\w])|\b(?:sik|şık|secenek|seçenek|option|choice)\s+\(?([a-e])\)?(?![\w])/i;

function checkNoOptionLetterReferences(questions: QuestionRecord[]): void {
  for (const { question, file } of questions) {
    for (const [lang, content] of Object.entries(question.i18n ?? {})) {
      const fields: Array<{ label: string; text: unknown }> = [
        { label: "stem", text: (content as any)?.stem },
        { label: "rationale.summary", text: (content as any)?.rationale?.summary },
      ];

      for (const [optionId, text] of Object.entries((content as any)?.rationale?.byOption ?? {})) {
        fields.push({ label: `rationale.byOption.${optionId}`, text });
      }
      for (const [i, hint] of ((content as any)?.hints ?? []).entries()) {
        fields.push({ label: `hints[${i}]`, text: hint });
      }

      for (const field of fields) {
        if (!isNonEmptyString(field.text)) continue;
        const match = OPTION_LETTER_REF.exec(field.text);
        if (!match) continue;

        report(
          15,
          file,
          question.id,
          `${lang}.${field.label} metninde sik harfine atif var: '${match[0]}'. Siklar yeniden siralandiginda bu atif yanlis sikki gosterir. Sikka konumuyla degil icerigiyle atifta bulunun.`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Objective coverage checks (#10, #11)
// ---------------------------------------------------------------------------

function checkObjectiveCoverage(objectivesByCode: Map<string, any>, questions: QuestionRecord[], objectivesFile: string): void {
  const publishedCountByCode = new Map<string, number>();
  for (const { question } of questions) {
    if (question.status !== "published") continue;
    for (const code of Array.isArray(question.objectives) ? question.objectives : []) {
      publishedCountByCode.set(code, (publishedCountByCode.get(code) ?? 0) + 1);
    }
  }

  for (const code of objectivesByCode.keys()) {
    const count = publishedCountByCode.get(code) ?? 0;

    if (count < 1) {
      report(10, objectivesFile, code, `LO icin yayinlanmis (status=published) hic soru yok. Beklenen: >=1; Bulunan: 0.`);
    }

    if (count < 3) {
      report(11, objectivesFile, code, `LO icin yayinlanmis soru sayisi denemelerin tekrarsiz uretilmesi icin yetersiz. Beklenen: >=3; Bulunan: ${count}.`);
    }
  }
}

// ---------------------------------------------------------------------------
// exam-blueprint.json totals vs syllabus.json (#9)
// Per CLAUDE.md: expected numbers are NEVER hardcoded here — they are read
// from syllabus.json's own totals, which is the single source of truth.
// ---------------------------------------------------------------------------

function checkExamBlueprintTotals(blueprint: any, blueprintFile: string, syllabus: any, syllabusFile: string): void {
  if (!syllabus) {
    report(9, blueprintFile, undefined, `Karsilastirma yapilamadi: ${toRel(syllabusFile)} okunamadi/gecersiz. exam-blueprint.json toplamlarini dogrulamak icin syllabus.json gerekli.`);
    return;
  }

  const expectedTotal = syllabus.totals?.examQuestions;
  const expectedByKLevel = syllabus.totals?.examKDistribution;
  const expectedByChapter: Record<string, number> = {};
  for (const chapter of Array.isArray(syllabus.chapters) ? syllabus.chapters : []) {
    if (typeof chapter.number === "number" && typeof chapter.examQuestions === "number") {
      expectedByChapter[String(chapter.number)] = chapter.examQuestions;
    }
  }

  if (typeof expectedTotal !== "number" || !expectedByKLevel) {
    report(9, syllabusFile, undefined, `syllabus.json içinde totals.examQuestions / totals.examKDistribution eksik — beklenen degerler cikartilamadi.`);
    return;
  }

  const groups: any[] = Array.isArray(blueprint.groups) ? blueprint.groups : [];
  let actualTotal = 0;
  const actualByChapter: Record<string, number> = {};
  const actualByKLevel: Record<string, number> = {};

  for (const group of groups) {
    const q = typeof group.questions === "number" ? group.questions : 0;
    actualTotal += q;
    const chapterKey = String(group.chapter);
    actualByChapter[chapterKey] = (actualByChapter[chapterKey] ?? 0) + q;
    if (isNonEmptyString(group.kLevel)) {
      actualByKLevel[group.kLevel] = (actualByKLevel[group.kLevel] ?? 0) + q;
    }
  }

  if (actualTotal !== expectedTotal) {
    report(9, blueprintFile, undefined, `groups[] toplam soru sayisi syllabus.json ile uyusmuyor. Beklenen (syllabus.totals.examQuestions): ${expectedTotal}; Bulunan (groups[].questions toplami): ${actualTotal}.`);
  }

  for (const chapterKey of Object.keys(expectedByChapter)) {
    const expected = expectedByChapter[chapterKey];
    const actual = actualByChapter[chapterKey] ?? 0;
    if (actual === expected) continue;
    report(9, blueprintFile, `chapter-${chapterKey}`, `Bolum ${chapterKey} icin soru sayisi syllabus.json ile uyusmuyor. Beklenen: ${expected}; Bulunan: ${actual}.`);
  }

  for (const kLevel of Object.keys(expectedByKLevel)) {
    const expected = expectedByKLevel[kLevel];
    const actual = actualByKLevel[kLevel] ?? 0;
    if (actual === expected) continue;
    report(9, blueprintFile, kLevel, `K-seviyesi ${kLevel} icin soru sayisi syllabus.json ile uyusmuyor. Beklenen: ${expected}; Bulunan: ${actual}.`);
  }
}

// ---------------------------------------------------------------------------
// index.json vs chunk files (#8)
// ---------------------------------------------------------------------------

function checkIndexConsistency(
  index: any,
  indexFile: string,
  actualChunkNames: string[],
  chunkQuestions: QuestionRecord[],
  chunkByQuestionId: Map<string, string>
): void {
  if (!index) return; // schema check (#1) already reported the missing/invalid file

  const declaredChunks: string[] = Array.isArray(index.chunks) ? index.chunks : [];
  const declaredChunkSet = new Set(declaredChunks);
  const actualChunkSet = new Set(actualChunkNames);

  for (const chunk of declaredChunks) {
    if (actualChunkSet.has(chunk)) continue;
    report(8, indexFile, chunk, `index.json 'chunks' icinde '${chunk}' listeleniyor ama questions/${chunk}.json dosyasi yok.`);
  }
  for (const chunk of actualChunkNames) {
    if (declaredChunkSet.has(chunk)) continue;
    report(8, indexFile, chunk, `questions/${chunk}.json dosyasi var ama index.json 'chunks' listesinde yok.`);
  }

  const actualCount = chunkQuestions.length;
  if (typeof index.count === "number" && index.count !== actualCount) {
    report(8, indexFile, undefined, `index.json 'count' alani gercek soru sayisiyla uyusmuyor. Beklenen (chunk dosyalarindaki gercek toplam): ${actualCount}; Bulunan (index.count): ${index.count}.`);
  }

  const declaredQuestions: any[] = Array.isArray(index.questions) ? index.questions : [];
  const declaredById = new Map(declaredQuestions.map((q) => [q.id, q]));
  const actualIds = new Set(chunkQuestions.map((q) => q.question.id));

  for (const declared of declaredQuestions) {
    const actualChunk = chunkByQuestionId.get(declared.id);
    if (!actualChunk) {
      report(8, indexFile, declared.id, `index.json icinde '${declared.id}' listeleniyor ama hicbir chunk dosyasinda bulunamadi.`);
      continue;
    }
    if (declared.chunk !== actualChunk) {
      report(8, indexFile, declared.id, `index.json 'chunk' alani yanlis. Beklenen: '${actualChunk}' (sorunun gercekte bulundugu dosya); Bulunan: '${declared.chunk}'.`);
    }
  }

  for (const id of actualIds) {
    if (declaredById.has(id)) continue;
    report(8, indexFile, id, `'${id}' bir chunk dosyasinda var ama index.json icinde listelenmemis.`);
  }
}

// ---------------------------------------------------------------------------
// Glossary (schema-only, part of check #1 — no dedicated numbered check
// exists for glossary content beyond JSON Schema conformance).
// ---------------------------------------------------------------------------

function validateGlossaryDir(glossaryDir: string): void {
  if (!fs.existsSync(glossaryDir)) return; // not built yet (F0-09) — nothing to validate

  const indexPath = path.join(glossaryDir, "index.json");
  const indexFile = toRel(indexPath);
  if (fs.existsSync(indexPath)) {
    const indexData = readJson(indexPath);
    if (indexData) validateAgainstSchema("glossaryIndex", indexData, indexFile);
  }

  const termFiles = fs.readdirSync(glossaryDir).filter((f) => f.endsWith(".json") && f !== "index.json");
  for (const termFile of termFiles) {
    const termPath = path.join(glossaryDir, termFile);
    const termData = readJson(termPath);
    if (termData) validateAgainstSchema("glossary", termData, toRel(termPath));
  }
}

// ---------------------------------------------------------------------------
// Per-certification orchestration
// ---------------------------------------------------------------------------

function validateCertification(certEntry: any): void {
  const certId = isNonEmptyString(certEntry?.id) ? certEntry.id : "(bilinmeyen sertifika)";
  const certPath = certEntry?.path;

  if (!isNonEmptyString(certPath)) {
    report(1, "data/manifest.json", certId, `certifications[].path eksik/gecersiz — bu sertifika hic dogrulanamiyor.`);
    return;
  }

  const certDir = path.join(DATA_DIR, certPath);
  if (!fs.existsSync(certDir)) {
    report(1, "data/manifest.json", certId, `Sertifika dizini bulunamadi: data/${certPath}/`);
    return;
  }

  // meta.json
  const metaFile = path.join(certDir, "meta.json");
  const meta = readJson(metaFile);
  if (meta) validateAgainstSchema("meta", meta, toRel(metaFile));

  // syllabus.json
  const syllabusFile = path.join(certDir, "syllabus.json");
  const syllabus = readJson(syllabusFile);
  if (syllabus) validateAgainstSchema("syllabus", syllabus, toRel(syllabusFile));

  // objectives.json
  const objectivesFile = path.join(certDir, "objectives.json");
  const objectivesDoc = readJson(objectivesFile);
  if (objectivesDoc) validateAgainstSchema("objectives", objectivesDoc, toRel(objectivesFile));

  const objectivesByCode = new Map<string, any>();
  for (const objective of objectivesDoc?.objectives ?? []) {
    if (isNonEmptyString(objective?.code)) objectivesByCode.set(objective.code, objective);
  }
  const objectiveCodes = new Set(objectivesByCode.keys());

  // exam-blueprint.json
  const blueprintFile = path.join(certDir, "exam-blueprint.json");
  const blueprint = readJson(blueprintFile);
  if (blueprint) {
    validateAgainstSchema("examBlueprint", blueprint, toRel(blueprintFile));
    checkExamBlueprintTotals(blueprint, blueprintFile, syllabus, syllabusFile);
    checkBlueprintObjectivesExist(blueprint, blueprintFile, objectiveCodes, objectivesFile);
  }

  // questions/
  const questionsDir = path.join(certDir, "questions");
  if (!fs.existsSync(questionsDir)) {
    report(1, path.join(questionsDir, "index.json"), certId, `questions/ dizini bulunamadi.`);
    return;
  }

  const indexFile = path.join(questionsDir, "index.json");
  const index = readJson(indexFile);
  if (index) validateAgainstSchema("questionsIndex", index, toRel(indexFile));

  const chunkFileNames = fs
    .readdirSync(questionsDir)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort();

  const allQuestions: QuestionRecord[] = [];
  const chunkByQuestionId = new Map<string, string>();
  const actualChunkNames: string[] = [];

  for (const chunkFileName of chunkFileNames) {
    const chunkPath = path.join(questionsDir, chunkFileName);
    const chunkData = readJson(chunkPath);
    if (!chunkData) continue;

    validateAgainstSchema("question", chunkData, toRel(chunkPath));

    const chunkName = isNonEmptyString((chunkData as any).chunk) ? (chunkData as any).chunk : path.basename(chunkFileName, ".json");
    actualChunkNames.push(chunkName);

    const qs: any[] = Array.isArray((chunkData as any).questions) ? (chunkData as any).questions : [];
    for (const q of qs) {
      allQuestions.push({ question: q, file: chunkPath });
      if (isNonEmptyString(q?.id)) chunkByQuestionId.set(q.id, chunkName);
    }
  }

  checkObjectivesExist(allQuestions, objectiveCodes, objectivesFile);
  checkCorrectLengthMatchesSelectCount(allQuestions);
  checkCorrectIdsInOptions(allQuestions);
  checkRationaleByOptionComplete(allQuestions);
  checkI18nTrEnConsistent(allQuestions);
  checkQuestionIdsUnique(allQuestions);
  checkIndexConsistency(index, indexFile, actualChunkNames, allQuestions, chunkByQuestionId);

  checkObjectiveCoverage(objectivesByCode, allQuestions, objectivesFile);
  checkKLevelConsistency(allQuestions, objectivesByCode);

  // terms.json yoksa 13. kontrol sessizce atlanir — uyari seviyesindeki bir
  // kontrol icin veri eksikligi CI'yi kirmamali.
  const termsFile = path.join(certDir, "terms.json");
  const termsDoc = fs.existsSync(termsFile) ? readJson(termsFile) : null;
  checkTerminologyLeakage(allQuestions, buildLeakPatterns(termsDoc));
  checkAnswerPositionBalance(allQuestions, indexFile);
  checkNoOptionLetterReferences(allQuestions);

  validateGlossaryDir(path.join(certDir, "glossary"));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const manifestPath = path.join(DATA_DIR, "manifest.json");
  const manifest = readJson(manifestPath);

  if (!manifest) {
    printReportAndExit();
    return;
  }
  validateAgainstSchema("manifest", manifest, toRel(manifestPath));

  const certificationsPath = path.join(DATA_DIR, "certifications.json");
  const certifications = readJson(certificationsPath);
  if (certifications) validateAgainstSchema("certifications", certifications, toRel(certificationsPath));

  const certList: any[] = Array.isArray((manifest as any).certifications) ? (manifest as any).certifications : [];
  if (certList.length === 0) {
    report(1, manifestPath, undefined, `manifest.certifications bos — dogrulanacak sertifika yok.`);
  }

  for (const certEntry of certList) {
    validateCertification(certEntry);
  }

  printReportAndExit();
}

function printReportAndExit(): void {
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  const byCheck = new Map<number, Issue[]>();
  for (const issue of issues) {
    const list = byCheck.get(issue.checkNum) ?? [];
    list.push(issue);
    byCheck.set(issue.checkNum, list);
  }

  for (const checkNum of Object.keys(CHECKS).map(Number).sort((a, b) => a - b)) {
    const forCheck = byCheck.get(checkNum);
    if (!forCheck || forCheck.length === 0) continue;

    const check = CHECKS[checkNum];
    const icon = check.level === "error" ? "❌" : "⚠️ ";
    console.log(`\n${icon} #${check.num} ${check.name} — ${forCheck.length} bulgu`);
    for (const issue of forCheck) {
      const ref = issue.refId ? ` [${issue.refId}]` : "";
      console.log(`   ${issue.file}${ref}: ${issue.message}`);
    }
  }

  console.log("\n" + "-".repeat(72));
  console.log(`Ozet: ${errors.length} hata, ${warnings.length} uyari.`);

  if (errors.length > 0) {
    console.log("SONUC: BASARISIZ (validate:data) — yukaridaki hatalar duzeltilmeden PR birlestirilemez.");
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log("SONUC: GECTI (uyarilarla) — icerik eksiklikleri var ama CI kirilmiyor.");
    process.exit(0);
  }

  console.log("SONUC: GECTI — tum kontroller temiz.");
  process.exit(0);
}

main();

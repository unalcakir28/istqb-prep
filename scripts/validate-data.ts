#!/usr/bin/env tsx
/**
 * scripts/validate-data.ts
 *
 * Implements the 15 CI checks from docs/04-data-model.md §6.
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
  1: { num: 1, level: "error", name: "JSON Schema conformance" },
  2: { num: 2, level: "error", name: "Does the objectives[] code exist in objectives.json" },
  3: { num: 3, level: "error", name: "Does correct[] length equal selectCount" },
  4: { num: 4, level: "error", name: "Do the IDs in correct[] exist in options" },
  5: { num: 5, level: "error", name: "Is rationale.byOption filled in for every option (TR/EN)" },
  6: { num: 6, level: "error", name: "Are i18n.tr and i18n.en consistent (option count/order)" },
  7: { num: 7, level: "error", name: "Are question IDs unique across all chunks" },
  8: { num: 8, level: "error", name: "Is index.json consistent with the chunk files" },
  9: { num: 9, level: "error", name: "Does the exam-blueprint.json total match syllabus.json" },
  10: { num: 10, level: "warning", name: "At least 1 published question per LO" },
  11: { num: 11, level: "warning", name: "At least 3 published questions per LO" },
  12: { num: 12, level: "warning", name: "Is kLevel consistent with the highest LO K-level" },
  13: { num: 13, level: "warning", name: "Untranslated English term leaking into Turkish text" },
  14: { num: 14, level: "warning", name: "Is the correct answer's option position balanced" },
  15: { num: 15, level: "error", name: "Does the text reference an option letter" },
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

// The shape of JSON read from disk is unknown by definition — validating
// that shape is this file's whole job. Call sites access fields without
// type checking; bad data is caught by the checks below, not the type system.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readJson(absPath: string): any {
  if (!fs.existsSync(absPath)) {
    report(1, absPath, undefined, `File not found: ${toRel(absPath)}`);
    return null;
  }

  const raw = fs.readFileSync(absPath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    report(1, absPath, undefined, `Invalid JSON (parse error): ${(err as Error).message}`);
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

// Schema names live in exactly one place: the error message names which
// schema is speaking, and keeping a second table would eventually drift
// out of sync with this one.
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
    throw new Error(`Schema file not found: schemas/${fileName} — the validator cannot run.`);
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
    const location = err.instancePath || "(root)";
    report(1, file, location, `${err.message} — schema: schemas/${SCHEMA_FILES[key]} (${JSON.stringify(err.params)})`);
  }
}

// ---------------------------------------------------------------------------
// Turkish terminology leak table (docs/07-content-authoring-guide.md §5)
// "testware" is intentionally excluded: the table marks it as an accepted
// loanword ("testware / test ürünleri"), not a mistranslation to flag.
// ---------------------------------------------------------------------------

// The term list comes from terms.json — that is the single source of truth.
// A list copied here by hand would inevitably go stale; in fact its first
// version carried mappings like "defect -> kusur" that CONTRADICTED the
// official syllabus and steered authors toward the wrong term.
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

    // If the Turkish equivalent already contains the English term (e.g.
    // "shift left" -> "shift-left", "risk" -> "risk"), the search is
    // meaningless: correct usage would also match, and flag every such text
    // as a leak.
    const normalizedEn = en.toLowerCase();
    const normalizedTr = tr.toLowerCase().replace(/-/g, " ");
    if (normalizedTr.includes(normalizedEn)) continue;

    patterns.push({ en, tr, regex: new RegExp(`\\b${escapeRegExp(en)}\\b`, "gi") });
  }

  // Try longer terms first: if "branch coverage" matches, don't also
  // report "coverage" separately.
  return patterns.sort((a, b) => b.en.length - a.en.length);
}

/**
 * Parenthetical spans in the text.
 *
 * Giving the English term in parentheses on first use is the rule:
 * "hata (defect)". Previously the parenthesis was searched for
 * IMMEDIATELY before/after the term; that broke on multi-word glosses
 * like "teknik gözden geçirme (technical review)", because the '(' sits
 * before "technical" while the term being searched for is "review". Now
 * we check whether the match falls INSIDE a parenthetical span.
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

      // Don't count it again if a longer term already covers this span.
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
      report(2, file, question.id, `objectives[] contains '${code}' but no such LO code exists in ${toRel(objectivesFile)}. Expected: a code defined in objectives.json; Found: '${code}'.`);
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
      report(2, blueprintFile, group.id, `groups[].objectives contains '${code}' but no such LO code exists in ${toRel(objectivesFile)}. Expected: a code defined in objectives.json; Found: '${code}'.`);
    }
  }
}

function checkCorrectLengthMatchesSelectCount(questions: QuestionRecord[]): void {
  for (const { question, file } of questions) {
    const correct: unknown[] = Array.isArray(question.correct) ? question.correct : [];
    const selectCount = question.selectCount;
    if (correct.length === selectCount) continue;
    report(3, file, question.id, `correct[] length does not match selectCount. Expected: selectCount=${selectCount}; Found: correct=${JSON.stringify(correct)} (length ${correct.length}).`);
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
      report(4, file, question.id, `correct[] contains an ID not present in options (i18n.${lang}). Expected: correct[] ⊆ options[].id (${JSON.stringify(optionIds)}); Found missing ID(s): ${JSON.stringify(missing)}.`);
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
        report(5, file, question.id, `rationale.byOption (i18n.${lang}) is missing some options. Expected: a rationale for every option (${JSON.stringify(optionIds)}); Found missing: ${JSON.stringify(missing)}.`);
      }

      const extra = rationaleIds.filter((id) => !optionIds.includes(id));
      if (extra.length > 0) {
        report(5, file, question.id, `rationale.byOption (i18n.${lang}) has option IDs not present in options. Expected: only ${JSON.stringify(optionIds)}; Found extra: ${JSON.stringify(extra)}.`);
      }

      for (const id of optionIds) {
        const text = byOption[id];
        if (isNonEmptyString(text) && text.trim().length >= 15) continue;
        if (missing.includes(id)) continue; // already reported above
        report(5, file, question.id, `rationale.byOption.${id} (i18n.${lang}) is empty or too short. Expected: a rationale of at least 15 characters explaining what that option describes; Found: ${JSON.stringify(text)}.`);
      }
    }
  }
}

function checkI18nTrEnConsistent(questions: QuestionRecord[]): void {
  for (const { question, file } of questions) {
    const tr = question.i18n?.tr;
    const en = question.i18n?.en;
    if (!tr || !en) {
      report(6, file, question.id, `Both tr and en are required in i18n. Found: tr=${tr ? "present" : "MISSING"}, en=${en ? "present" : "MISSING"}.`);
      continue;
    }

    const trOptions: any[] = Array.isArray(tr.options) ? tr.options : [];
    const enOptions: any[] = Array.isArray(en.options) ? en.options : [];
    if (trOptions.length !== enOptions.length) {
      report(6, file, question.id, `TR and EN have a different number of options. Expected: equal option counts; Found: tr=${trOptions.length}, en=${enOptions.length}.`);
      continue;
    }

    for (let i = 0; i < trOptions.length; i += 1) {
      if (trOptions[i]?.id === enOptions[i]?.id) continue;
      report(6, file, question.id, `TR and EN option order/IDs don't match (index ${i}). Expected: the same ID at the same position; Found: tr='${trOptions[i]?.id}', en='${enOptions[i]?.id}'.`);
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
    report(7, files[0], id, `Question ID used in more than one place. Expected: each ID exactly once; Found: '${id}' appears in these files: ${files.map(toRel).join(", ")}.`);
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
    report(12, file, question.id, `The question's kLevel does not match the highest K-level among its LOs. Expected: ${expected} (LOs: ${JSON.stringify(objectives)} → ${JSON.stringify(knownKLevels)}); Found: ${question.kLevel}.`);
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
        report(13, file, question.id, `Untranslated English term in the TR text (${field.label}): '${leak.en}'. Expected term: '${leak.tr}' (see docs/07-content-authoring-guide.md §5); the English word may be given in parentheses on first use, but is not expected to appear unparenthesized.`);
      }
    }
  }
}

/**
 * #14 — Is the correct answer's option position balanced?
 *
 * This check was added after the fact: in the first batch of 87 questions,
 * 51 of the 78 single-choice questions had the correct answer on option
 * "a" (65%). A candidate who always marked "a" would have passed. Because
 * the generated content had a systematic bias, a one-off fix isn't enough;
 * the gate stays here.
 *
 * The threshold is deliberately loose: deviation is natural in small pools,
 * the goal is to catch a SYSTEMATIC bias, not chance.
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
      `Correct answer disproportionately falls on option '${optionId}'. Expected: ~${expected.toFixed(1)} (${total} single-choice questions / ${positions} options); Found: ${count}. Rotate and relabel the options.`,
    );
  }
}

/**
 * #15 — Does the question text reference an option letter?
 *
 * A sentence like "Bu nedenle (c) yanlis esleştirmedir" ("So (c) is the
 * wrong pairing") becomes FALSE the instant the options are reordered.
 * When options are reshuffled, the `byOption` keys move programmatically,
 * but the letter inside the plain-text sentence stays behind — and that
 * exact kind of defect is what destroys trust in the answer key.
 *
 * This actually happened: after an option-position rebalancing pass, one
 * question's summary told the candidate the answer was C, while the key
 * said D. That's why this is an ERROR, not a warning.
 *
 * Rationale text must refer to an option by its CONTENT, not its
 * position: "the collaboration-tools row is wrong" instead of "(c) is
 * wrong".
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
          `${lang}.${field.label} text references an option letter: '${match[0]}'. If the options are reordered, this reference will point at the wrong option. Refer to the option by its content, not its position.`,
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
      report(10, objectivesFile, code, `No published (status=published) questions exist for this LO. Expected: >=1; Found: 0.`);
    }

    if (count < 3) {
      report(11, objectivesFile, code, `The number of published questions for this LO is not enough to generate exams without repetition. Expected: >=3; Found: ${count}.`);
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
    report(9, blueprintFile, undefined, `Comparison could not be made: ${toRel(syllabusFile)} could not be read/is invalid. syllabus.json is required to validate exam-blueprint.json totals.`);
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
    report(9, syllabusFile, undefined, `syllabus.json is missing totals.examQuestions / totals.examKDistribution — expected values could not be derived.`);
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
    report(9, blueprintFile, undefined, `groups[] total question count does not match syllabus.json. Expected (syllabus.totals.examQuestions): ${expectedTotal}; Found (sum of groups[].questions): ${actualTotal}.`);
  }

  for (const chapterKey of Object.keys(expectedByChapter)) {
    const expected = expectedByChapter[chapterKey];
    const actual = actualByChapter[chapterKey] ?? 0;
    if (actual === expected) continue;
    report(9, blueprintFile, `chapter-${chapterKey}`, `Question count for chapter ${chapterKey} does not match syllabus.json. Expected: ${expected}; Found: ${actual}.`);
  }

  for (const kLevel of Object.keys(expectedByKLevel)) {
    const expected = expectedByKLevel[kLevel];
    const actual = actualByKLevel[kLevel] ?? 0;
    if (actual === expected) continue;
    report(9, blueprintFile, kLevel, `Question count for K-level ${kLevel} does not match syllabus.json. Expected: ${expected}; Found: ${actual}.`);
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
    report(8, indexFile, chunk, `index.json 'chunks' lists '${chunk}' but questions/${chunk}.json does not exist.`);
  }
  for (const chunk of actualChunkNames) {
    if (declaredChunkSet.has(chunk)) continue;
    report(8, indexFile, chunk, `questions/${chunk}.json exists but is not listed in index.json 'chunks'.`);
  }

  const actualCount = chunkQuestions.length;
  if (typeof index.count === "number" && index.count !== actualCount) {
    report(8, indexFile, undefined, `index.json 'count' field does not match the actual question count. Expected (actual total across chunk files): ${actualCount}; Found (index.count): ${index.count}.`);
  }

  const declaredQuestions: any[] = Array.isArray(index.questions) ? index.questions : [];
  const declaredById = new Map(declaredQuestions.map((q) => [q.id, q]));
  const actualIds = new Set(chunkQuestions.map((q) => q.question.id));

  for (const declared of declaredQuestions) {
    const actualChunk = chunkByQuestionId.get(declared.id);
    if (!actualChunk) {
      report(8, indexFile, declared.id, `index.json lists '${declared.id}' but it was not found in any chunk file.`);
      continue;
    }
    if (declared.chunk !== actualChunk) {
      report(8, indexFile, declared.id, `index.json 'chunk' field is wrong. Expected: '${actualChunk}' (the file the question is actually in); Found: '${declared.chunk}'.`);
    }
  }

  for (const id of actualIds) {
    if (declaredById.has(id)) continue;
    report(8, indexFile, id, `'${id}' exists in a chunk file but is not listed in index.json.`);
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
  const certId = isNonEmptyString(certEntry?.id) ? certEntry.id : "(unknown certification)";
  const certPath = certEntry?.path;

  if (!isNonEmptyString(certPath)) {
    report(1, "data/manifest.json", certId, `certifications[].path is missing/invalid — this certification cannot be validated at all.`);
    return;
  }

  const certDir = path.join(DATA_DIR, certPath);
  if (!fs.existsSync(certDir)) {
    report(1, "data/manifest.json", certId, `Certification directory not found: data/${certPath}/`);
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
    report(1, path.join(questionsDir, "index.json"), certId, `questions/ directory not found.`);
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

  // If terms.json is missing, check #13 is silently skipped — missing data
  // for a warning-level check should not break CI.
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
    report(1, manifestPath, undefined, `manifest.certifications is empty — no certification to validate.`);
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
    console.log(`\n${icon} #${check.num} ${check.name} — ${forCheck.length} finding(s)`);
    for (const issue of forCheck) {
      const ref = issue.refId ? ` [${issue.refId}]` : "";
      console.log(`   ${issue.file}${ref}: ${issue.message}`);
    }
  }

  console.log("\n" + "-".repeat(72));
  console.log(`Summary: ${errors.length} error(s), ${warnings.length} warning(s).`);

  if (errors.length > 0) {
    console.log("RESULT: FAILED (validate:data) — the PR cannot be merged until the errors above are fixed.");
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log("RESULT: PASSED (with warnings) — there are content gaps but CI is not broken.");
    process.exit(0);
  }

  console.log("RESULT: PASSED — all checks are clean.");
  process.exit(0);
}

main();

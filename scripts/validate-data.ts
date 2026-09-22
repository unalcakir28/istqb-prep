#!/usr/bin/env tsx
/**
 * scripts/validate-data.ts
 *
 * Implements the 20 CI checks from docs/04-data-model.md §6.
 * Checks #1-9 and #15-19 are ERRORS (exit 1). Checks #10-14 and #20 are
 * WARNINGS (exit 0, printed). The registry below is the source of truth for
 * the severity levels.
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
  16: { num: 16, level: "error", name: "Does every lesson's objective exist in objectives.json" },
  17: { num: 17, level: "error", name: "Are i18n.tr and i18n.en lesson content parallel (keyPoints/commonMistakes counts)" },
  18: { num: 18, level: "error", name: "Does a published lesson record meta.reviewedBy" },
  19: { num: 19, level: "error", name: "Is lessons/index.json consistent with the lesson chunk files" },
  20: { num: 20, level: "warning", name: "At least 1 published lesson per LO" },
  21: { num: 21, level: "warning", name: "A term.trForbidden word used in Turkish text" },
  22: { num: 22, level: "warning", name: "Is the keyed option the longest one too often" },
  23: { num: 23, level: "warning", name: "Do the keyed letters run a rotation in file order" },
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
  lessonsIndex: "lessons-index.schema.json",
  lesson: "lesson.schema.json",
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
// #21 — a banned Turkish word used as if it were the term
//
// `terms.json` carries a `trForbidden` list per term: the plausible-looking
// Turkish words that are NOT the syllabus's. #13 never reads that list — it
// only catches an untranslated ENGLISH word sitting in Turkish text — so until
// this check existed, `kusur` for defect and `test izleme` for test monitoring
// shipped into published content and were found by hand, chunk by chunk.
//
// Three exclusions, each for a different reason:
//
//  1. A forbidden word that is some OTHER term's correct `tr`. `hata` is banned
//     for `error` and for `failure`, and is the right word for `defect`. Scanning
//     for it flags every correct sentence in the pool.
//  2. `testware`, which the guide marks as an accepted loanword rather than a
//     mistranslation — the same exclusion #13's table already makes.
//  3. Words that are also ordinary Turkish in a different grammatical role.
//     `kapsama` is banned as a noun for `coverage` but is the dative of
//     `kapsam` ("makul bir kapsama ulaşmak"); `test durumu` is banned for
//     `test case` but is the natural phrase for "test status"; and
//     `teknik gözden geçirme` is banned as a rendering of `walkthrough` while
//     being the name of a real review type in its own right. A check that
//     cannot tell those apart teaches authors to ignore it.
//
// A warning, not an error, for the same reason #13 is: the remaining matches
// still need a human to read the sentence.
// ---------------------------------------------------------------------------

const FORBIDDEN_AMBIGUOUS = new Set(["kapsama", "test durumu", "teknik gözden geçirme", "testware"]);

interface ForbiddenPattern {
  word: string;
  en: string;
  tr: string;
  regex: RegExp;
}

/**
 * Turkish-aware lowercasing that preserves length, so match offsets stay valid.
 *
 * `"I".toLowerCase()` is `"i"` in the default locale but `"ı"` in Turkish, and
 * the terms are full of dotted and dotless i. Without this, "Test İzleme" does
 * not match the pattern built from "test izleme".
 */
function foldTr(text: string): string {
  return text.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();
}

function buildForbiddenPatterns(termsDoc: any): ForbiddenPattern[] {
  const terms: any[] = Array.isArray(termsDoc?.terms) ? termsDoc.terms : [];
  const correctTr = new Set(terms.map((term) => foldTr(String(term?.tr ?? "").trim())).filter((tr) => tr.length > 0));
  const patterns = new Map<string, ForbiddenPattern>();

  for (const term of terms) {
    const en = String(term?.en ?? "").trim();
    const tr = String(term?.tr ?? "").trim();
    const forbidden: string[] = Array.isArray(term?.trForbidden) ? term.trForbidden : [];

    for (const raw of forbidden) {
      const word = String(raw ?? "").trim();
      if (word.length === 0) continue;

      const folded = foldTr(word);
      if (correctTr.has(folded)) continue;
      if (FORBIDDEN_AMBIGUOUS.has(folded)) continue;
      if (patterns.has(folded)) continue;

      // `\b` is ASCII-only, so it treats ç/ğ/ı/ö/ş/ü as boundaries and would
      // match "hata" inside "hatalar". The explicit character class keeps a
      // suffixed Turkish word from matching its own stem.
      patterns.set(folded, {
        word,
        en,
        tr,
        regex: new RegExp(`(?<![0-9a-zçğıöşü])${escapeRegExp(folded)}(?![0-9a-zçğıöşü])`, "g"),
      });
    }
  }

  return [...patterns.values()];
}

function findForbiddenTerms(text: string, patterns: ForbiddenPattern[]): ForbiddenPattern[] {
  const folded = foldTr(text);
  const spans = parenSpans(folded);
  const found: ForbiddenPattern[] = [];

  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.regex.exec(folded)) !== null) {
      // A gloss is allowed to name the wrong word in order to reject it:
      // "hata (defect, not 'kusur')" is teaching, not a violation.
      const from = match.index;
      const to = from + match[0].length;
      if (spans.some(([open, close]) => from > open && to <= close)) continue;

      found.push(pattern);
      break;
    }
  }

  return found;
}

/** Every Turkish string a reader will see, labelled by where it sits. */
function trFieldsOfQuestion(tr: any): Array<{ label: string; text: string }> {
  const fields: Array<{ label: string; text: string }> = [];
  if (isNonEmptyString(tr?.stem)) fields.push({ label: "stem", text: tr.stem });
  for (const opt of Array.isArray(tr?.options) ? tr.options : []) {
    if (isNonEmptyString(opt?.text)) fields.push({ label: `options[${opt.id}]`, text: opt.text });
  }
  if (isNonEmptyString(tr?.rationale?.summary)) fields.push({ label: "rationale.summary", text: tr.rationale.summary });
  for (const [optId, text] of Object.entries(tr?.rationale?.byOption ?? {})) {
    if (isNonEmptyString(text)) fields.push({ label: `rationale.byOption.${optId}`, text: text as string });
  }
  for (const hint of Array.isArray(tr?.hints) ? tr.hints : []) {
    if (isNonEmptyString(hint)) fields.push({ label: "hints[]", text: hint });
  }
  return fields;
}

function trFieldsOfLesson(tr: any): Array<{ label: string; text: string }> {
  const fields: Array<{ label: string; text: string }> = [];
  if (isNonEmptyString(tr?.title)) fields.push({ label: "title", text: tr.title });
  for (const [key, label] of [["paragraphs", "paragraphs"], ["keyPoints", "keyPoints"], ["commonMistakes", "commonMistakes"]] as const) {
    const list = Array.isArray(tr?.[key]) ? tr[key] : [];
    list.forEach((text: unknown, index: number) => {
      if (isNonEmptyString(text)) fields.push({ label: `${label}[${index}]`, text: text as string });
    });
  }
  return fields;
}

function checkForbiddenTurkishTerms(
  questions: QuestionRecord[],
  lessons: LessonRecord[],
  patterns: ForbiddenPattern[],
): void {
  if (patterns.length === 0) return;

  const scan = (refId: string, file: string, fields: Array<{ label: string; text: string }>): void => {
    for (const field of fields) {
      for (const hit of findForbiddenTerms(field.text, patterns)) {
        report(
          21,
          file,
          refId,
          `Banned Turkish term in the TR text (${field.label}): '${hit.word}'. terms.json lists it under trForbidden for '${hit.en}'; the syllabus term is '${hit.tr}'. terms.json is the authority even where the official TR syllabus writes otherwise — see docs/07-content-authoring-guide.md §5.`,
        );
      }
    }
  };

  for (const { question, file } of questions) scan(question.id, file, trFieldsOfQuestion(question.i18n?.tr));
  for (const { lesson, file } of lessons) scan(lesson.objective, file, trFieldsOfLesson(lesson.i18n?.tr));
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
 * #22 — Is the keyed option the longest one too often?
 *
 * The sibling of #14, and it exists for the same reason: a cue that lets a
 * candidate score without reading the question. #14 watches WHICH LETTER the
 * key falls on; this one watches HOW LONG the key is. A writer who states the
 * right answer completely and the wrong ones in a clause produces a pool where
 * "pick the longest option" beats studying, and #14 sees nothing wrong with it.
 *
 * Both languages are measured, and a question counts as cued if EITHER cues.
 * The first version of this check read English only, on the assumption that the
 * two track each other. They do not: one chunk came back 8/19 in English and
 * 3/19 in Turkish, another the other way round. A candidate reads one language,
 * and it only has to leak in the one they read.
 *
 * Multi-select counts too, against the N longest options where N is the number
 * of keys. The first version skipped it — `type !== "single"` — and a review
 * found a five-option question whose two keys were ranks 1 and 2 by length in
 * both languages, so "pick the two longest" scored it perfectly and CI saw
 * nothing.
 *
 * Aggregate over the whole pool rather than per chunk, exactly as #14 does: in
 * a 20-question chunk the ratio swings on chance, across 250 it does not. With
 * four options and one key the expected rate is 25%; the gate is 40%, loose
 * enough that an honest pool clears it and a systematic habit does not. When it
 * fires it names the worst chunks, because the fix is per chunk.
 */
/**
 * Do the N longest options in this language happen to be exactly the N keys?
 *
 * A tie between a key and one distractor still counts: it narrows a four-way
 * choice to a coin flip, which is most of the advantage. A tie across ALL the
 * options does not, and must not — four options of identical length carry no
 * information at all, so "pick the longest" returns the whole set. The first
 * version of this check missed that distinction and flagged a decision-table
 * question whose four options were four equal-length lists of records; the fix
 * for the phantom finding made the options inconsistent with each other, which
 * was a real defect introduced to satisfy a false one.
 */
function keysAreLongest(options: any[], keys: Set<string>): boolean {
  const lengths: Array<{ id: string; length: number }> = [];
  for (const option of options) {
    if (isNonEmptyString(option?.id) && isNonEmptyString(option?.text)) {
      lengths.push({ id: option.id, length: option.text.length });
    }
  }

  if (lengths.length <= keys.size) return false;
  for (const key of keys) {
    if (!lengths.some((entry) => entry.id === key)) return false;
  }

  // The shortest key has to beat every non-key for the cue to work.
  const shortestKey = Math.min(...lengths.filter((entry) => keys.has(entry.id)).map((entry) => entry.length));
  const longestOther = Math.max(...lengths.filter((entry) => !keys.has(entry.id)).map((entry) => entry.length));
  if (shortestKey < longestOther) return false;

  // ...and something has to be shorter, or "the longest" names every option.
  return lengths.some((entry) => entry.length < shortestKey);
}

function checkAnswerLengthCue(questions: QuestionRecord[], file: string): void {
  const byChunk = new Map<string, { total: number; cued: number }>();
  let total = 0;
  let cued = 0;

  for (const { question, file: chunkFile } of questions) {
    const keys: string[] = Array.isArray(question?.correct) ? question.correct.filter(isNonEmptyString) : [];
    if (keys.length === 0) continue;

    const keySet = new Set(keys);
    const languages = ["tr", "en"] as const;
    let measured = false;
    let isCued = false;

    for (const lang of languages) {
      const options: any[] = question.i18n?.[lang]?.options;
      if (!Array.isArray(options) || options.length < 2) continue;

      measured = true;
      if (keysAreLongest(options, keySet)) isCued = true;
    }

    if (!measured) continue;

    total += 1;
    if (isCued) cued += 1;

    const name = path.basename(chunkFile, ".json");
    const bucket = byChunk.get(name) ?? { total: 0, cued: 0 };
    bucket.total += 1;
    if (isCued) bucket.cued += 1;
    byChunk.set(name, bucket);
  }

  if (total < 40) return;

  const rate = cued / total;
  if (rate <= 0.4) return;

  const worst = [...byChunk]
    .filter(([, bucket]) => bucket.total >= 10 && bucket.cued / bucket.total > 0.4)
    .sort((a, b) => b[1].cued / b[1].total - a[1].cued / a[1].total)
    .map(([name, bucket]) => `${name} ${bucket.cued}/${bucket.total}`)
    .join(", ");

  report(
    22,
    file,
    undefined,
    `The keyed options are the longest ones in ${cued} of ${total} questions (${(rate * 100).toFixed(0)}%), counting a question as cued if it cues in Turkish or in English. Expected: ~25% by chance on a four-option single, gate 40%. A candidate who always picks the longest option — or, on a multi-select, the N longest — scores at that rate without reading the stem. Worst chunks: ${worst}. Trim the key: its trailing clause is usually the rationale leaking into the option.`,
  );
}

/**
 * #23 — Do the keyed letters run a rotation in file order?
 *
 * The third sibling of #14. #14 counts how often each letter is the key and
 * #22 measures how long the key is; neither looks at the ORDER. A writer
 * spreading answers "evenly" by hand produces a b c d a b c d …, which passes
 * #14 with perfect counts and lets a candidate predict the next answer from
 * the last one.
 *
 * Two real cases forced this check: one chunk ran a → c → b → d for twelve of
 * its twenty-nine questions in three separate cycles, and another ran
 * a → b → c → d unbroken across thirteen consecutive questions. Both were
 * found by a human reading the file, after #14 had passed them.
 *
 * It matters because nothing shuffles options at runtime and study mode walks
 * an objective's questions in id order, so the candidate sees exactly the
 * sequence written here.
 *
 * Measured per chunk, not pooled: a rotation is a local writing habit, and
 * pooling would average it away against the chunks that do not have one. The
 * statistic is the longest run of a constant step between consecutive keys
 * (a → b → c → d is a constant step of 1; a → a → a is a constant step of 0,
 * which #14 also catches, but only once it dominates the whole pool). With
 * four options a run of five happens by chance often enough to be noise, so
 * the gate is seven.
 *
 * A pass is a floor, not a clean bill: this finds the longest run and says
 * nothing about three short cycles scattered through a chunk. A human reading
 * the keyed letters in order still catches more.
 */
function checkAnswerPositionSequence(questions: QuestionRecord[]): void {
  const byChunk = new Map<string, { keys: string[]; file: string }>();

  for (const { question, file } of questions) {
    if (question?.type !== "single") continue;

    const key = Array.isArray(question.correct) ? question.correct[0] : undefined;
    if (!isNonEmptyString(key)) continue;

    const name = path.basename(file, ".json");
    const bucket = byChunk.get(name) ?? { keys: [], file };
    bucket.keys.push(key);
    byChunk.set(name, bucket);
  }

  const RUN_GATE = 7;

  for (const [, { keys, file }] of byChunk) {
    if (keys.length < RUN_GATE) continue;

    const positions = keys.map((key) => key.charCodeAt(0) - "a".charCodeAt(0));
    const modulus = Math.max(...positions) + 1;
    if (modulus < 2) continue;

    let bestLength = 1;
    let bestStart = 0;
    let bestStep = 0;
    let runLength = 1;
    let runStart = 0;
    let previousStep: number | null = null;

    for (let i = 1; i < positions.length; i += 1) {
      const step = (positions[i] - positions[i - 1] + modulus) % modulus;

      if (step === previousStep) {
        runLength += 1;
      } else {
        runLength = 2;
        runStart = i - 1;
        previousStep = step;
      }

      if (runLength > bestLength) {
        bestLength = runLength;
        bestStart = runStart;
        bestStep = step;
      }
    }

    if (bestLength < RUN_GATE) continue;

    const run = keys.slice(bestStart, bestStart + bestLength).join(" → ");
    report(
      23,
      file,
      undefined,
      `The keyed letters run a rotation of step ${bestStep} across ${bestLength} consecutive single-choice questions: ${run}. Check #14 passes this, because the letter COUNTS are even — it is the order that gives the answer away, and nothing shuffles options at runtime. Re-order the options (moving each rationale with its option) on enough of the run to break it, then confirm the counts are still balanced.`,
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
// Lesson checks (#16 - #19), lesson coverage warning (#20)
// ---------------------------------------------------------------------------

interface LessonRecord {
  lesson: any;
  file: string;
}

/** #16 — every lesson's objective exists in objectives.json. */
function checkLessonObjectivesExist(lessons: LessonRecord[], objectiveCodes: Set<string>): void {
  for (const { lesson, file } of lessons) {
    const objective = lesson?.objective;
    if (objectiveCodes.has(objective)) continue;
    report(16, file, objective, `The lesson references a learning objective that does not exist in objectives.json.`);
  }
}

/**
 * #17 — Are i18n.tr and i18n.en lesson content parallel?
 *
 * A missing tr/en block is treated as zero-length arrays, so an entirely
 * missing translation surfaces through the same mismatch message rather
 * than needing a second, undocumented message.
 */
function checkLessonI18nParallel(lessons: LessonRecord[]): void {
  for (const { lesson, file } of lessons) {
    const tr = lesson?.i18n?.tr;
    const en = lesson?.i18n?.en;

    for (const field of ["keyPoints", "commonMistakes"] as const) {
      const trCount = Array.isArray(tr?.[field]) ? tr[field].length : 0;
      const enCount = Array.isArray(en?.[field]) ? en[field].length : 0;
      if (trCount === enCount) continue;
      report(
        17,
        file,
        lesson?.objective,
        `The Turkish and English lesson content are not parallel. Expected equal ${field} counts; found tr=${trCount}, en=${enCount}.`,
      );
    }
  }
}

/** #18 — a lesson with status: "published" has a non-empty meta.reviewedBy. */
function checkLessonPublishedHasReviewer(lessons: LessonRecord[]): void {
  for (const { lesson, file } of lessons) {
    if (lesson?.status !== "published") continue;
    if (isNonEmptyString(lesson?.meta?.reviewedBy)) continue;
    report(18, file, lesson?.objective, `A published lesson must record its reviewer in meta.reviewedBy.`);
  }
}

/**
 * #19 — lessons/index.json agrees with the chunk files: every indexed
 * objective exists in the named chunk, every chunk lesson appears in the
 * index, and count equals the number of index entries.
 */
function checkLessonIndexConsistency(
  index: any,
  indexFile: string,
  lessons: LessonRecord[],
  chunkByObjective: Map<string, string>,
): void {
  if (!index) return; // schema check (#1) already reported the missing/invalid file

  const declaredLessons: any[] = Array.isArray(index.lessons) ? index.lessons : [];
  const declaredObjectives = new Set(declaredLessons.map((l) => l.objective));
  const actualObjectives = new Set(lessons.map(({ lesson }) => lesson?.objective));

  for (const declared of declaredLessons) {
    const actualChunk = chunkByObjective.get(declared.objective);
    if (actualChunk && actualChunk === declared.chunk) continue;
    report(19, indexFile, declared.objective, `The lesson index disagrees with the chunk files.`);
  }

  for (const objective of actualObjectives) {
    if (declaredObjectives.has(objective)) continue;
    report(19, indexFile, objective, `The lesson index disagrees with the chunk files.`);
  }

  if (typeof index.count === "number" && index.count !== declaredLessons.length) {
    report(19, indexFile, undefined, `The lesson index disagrees with the chunk files.`);
  }
}

/** #20 — an objective in objectives.json has no published lesson. */
function checkLessonCoverage(objectivesByCode: Map<string, any>, lessons: LessonRecord[], objectivesFile: string): void {
  const publishedObjectives = new Set<string>();
  for (const { lesson } of lessons) {
    if (lesson?.status !== "published") continue;
    if (isNonEmptyString(lesson?.objective)) publishedObjectives.add(lesson.objective);
  }

  for (const code of objectivesByCode.keys()) {
    if (publishedObjectives.has(code)) continue;
    report(20, objectivesFile, code, `This learning objective has no published lesson yet.`);
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
  checkAnswerLengthCue(allQuestions, indexFile);
  checkAnswerPositionSequence(allQuestions);
  checkNoOptionLetterReferences(allQuestions);

  // lessons/
  const allLessons = validateLessonsDir(path.join(certDir, "lessons"), objectiveCodes, objectivesByCode, objectivesFile);

  // #21 runs over questions AND lessons together: one banned word is one
  // finding wherever a candidate reads it.
  checkForbiddenTurkishTerms(allQuestions, allLessons, buildForbiddenPatterns(termsDoc));

  validateGlossaryDir(path.join(certDir, "glossary"));
}

function validateLessonsDir(
  lessonsDir: string,
  objectiveCodes: Set<string>,
  objectivesByCode: Map<string, any>,
  objectivesFile: string,
): LessonRecord[] {
  if (!fs.existsSync(lessonsDir)) return []; // not built yet — nothing to validate

  const lessonIndexFile = path.join(lessonsDir, "index.json");
  const lessonIndex = readJson(lessonIndexFile);
  if (lessonIndex) validateAgainstSchema("lessonsIndex", lessonIndex, toRel(lessonIndexFile));

  const lessonChunkFileNames = fs
    .readdirSync(lessonsDir)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .sort();

  const allLessons: LessonRecord[] = [];
  const chunkByObjective = new Map<string, string>();

  for (const chunkFileName of lessonChunkFileNames) {
    const chunkPath = path.join(lessonsDir, chunkFileName);
    const chunkData = readJson(chunkPath);
    if (!chunkData) continue;

    validateAgainstSchema("lesson", chunkData, toRel(chunkPath));

    const chunkName = isNonEmptyString((chunkData as any).chunk) ? (chunkData as any).chunk : path.basename(chunkFileName, ".json");

    const ls: any[] = Array.isArray((chunkData as any).lessons) ? (chunkData as any).lessons : [];
    for (const lesson of ls) {
      allLessons.push({ lesson, file: chunkPath });
      if (isNonEmptyString(lesson?.objective)) chunkByObjective.set(lesson.objective, chunkName);
    }
  }

  checkLessonObjectivesExist(allLessons, objectiveCodes);
  checkLessonI18nParallel(allLessons);
  checkLessonPublishedHasReviewer(allLessons);
  checkLessonIndexConsistency(lessonIndex, lessonIndexFile, allLessons, chunkByObjective);
  checkLessonCoverage(objectivesByCode, allLessons, objectivesFile);

  return allLessons;
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

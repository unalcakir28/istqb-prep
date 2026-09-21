/**
 * F0-13 — Per-LO coverage report -> docs/coverage.md
 *
 * Shows at a glance where the "at least 3 questions per learning objective"
 * goal stands. The report is a generated file; it is never edited by hand.
 *
 * Usage:  yarn stats
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "data");
const OUT = path.join(ROOT, "docs", "coverage.md");
const README = path.join(ROOT, "README.md");
/**
 * The language the generated report is written in. The repository's documents
 * are English, so the bilingual data fields are read through this one constant
 * rather than each call site picking a language of its own.
 */
const DOC_LANG = "en" as const;

const BADGE_START = "<!-- coverage:start";
const BADGE_END = "<!-- coverage:end -->";

type Json = Record<string, any>;

function readJson(absPath: string): Json {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

/** Phase targets — docs/09-roadmap.md */
const TARGETS = [
  { phase: "Phase 1 (MVP)", questions: 120, perObjective: 1 },
  { phase: "Phase 2", questions: 200, perObjective: 2 },
  { phase: "Phase 3", questions: 300, perObjective: 3 },
];

function bar(value: number, max: number, width = 12): string {
  if (max <= 0) return "·".repeat(width);
  const filled = Math.min(width, Math.round((value / max) * width));
  return "█".repeat(filled) + "·".repeat(width - filled);
}

interface Badge {
  questions: number;
  covered: number;
  objectives: number;
  acronym: string;
  version: string;
}

function shield(label: string, message: string, color: string): string {
  const escape = (text: string) => encodeURIComponent(text.replace(/-/g, "--"));
  return `https://img.shields.io/badge/${escape(label)}-${escape(message)}-${color}`;
}

/**
 * Badges in the README go silently stale if written by hand. The marker
 * span is regenerated on every `yarn stats` run; if the markers are
 * missing, the README is left untouched (a warning is printed), because
 * the rest of the file is not this script's job.
 */
function writeBadges(badges: Badge[]): void {
  const first = badges[0];
  if (!first) return;

  const readme = fs.readFileSync(README, "utf8");
  const start = readme.indexOf(BADGE_START);
  const end = readme.indexOf(BADGE_END);
  if (start === -1 || end === -1) {
    console.warn("No coverage markers found in README.md — badges not updated.");
    return;
  }

  const complete = first.covered === first.objectives;
  const block = [
    readme.slice(start, readme.indexOf("\n", start)),
    "",
    `[![questions](${shield("questions", String(first.questions), "2ea043")})](docs/coverage.md)`,
    `[![objective coverage](${shield("objective coverage", `${first.covered}/${first.objectives}`, complete ? "2ea043" : "d29922")})](docs/coverage.md)`,
    `[![syllabus](${shield(first.acronym, `v${first.version}`, "0969da")})](docs/03-istqb-reference.md)`,
    "",
  ].join("\n");

  fs.writeFileSync(README, readme.slice(0, start) + block + readme.slice(end), "utf8");
  console.log(`README.md badges updated (${first.questions} question(s), ${first.covered}/${first.objectives} LO)`);
}

function main(): void {
  const manifest = readJson(path.join(DATA_DIR, "manifest.json"));
  const lines: string[] = [];
  const badges: Badge[] = [];

  lines.push("# Coverage report");
  lines.push("");
  lines.push(
    "> This file is **generated** by `yarn stats`. Do not edit by hand — it is overwritten on the next run.",
  );
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");

  for (const certification of manifest.certifications ?? []) {
    const certDir = path.join(DATA_DIR, certification.path);
    const objectives: Json[] = readJson(path.join(certDir, "objectives.json")).objectives ?? [];
    const syllabus = readJson(path.join(certDir, "syllabus.json"));
    const index = readJson(path.join(certDir, "questions", "index.json"));

    // Only published questions are counted — drafts don't count toward the
    // pool, so they shouldn't count toward coverage either.
    const published = (index.questions ?? []).filter((q: Json) => q.status === "published");
    const counts = new Map<string, number>(objectives.map((o) => [o.code, 0]));
    for (const question of published) {
      for (const code of question.objectives ?? []) {
        counts.set(code, (counts.get(code) ?? 0) + 1);
      }
    }

    const values = [...counts.values()];
    const covered = values.filter((n) => n > 0).length;
    const atLeast = (n: number) => values.filter((v) => v >= n).length;

    badges.push({
      questions: published.length,
      covered,
      objectives: objectives.length,
      acronym: certification.acronym,
      version: certification.syllabusVersion,
    });

    lines.push(`## ${certification.acronym} v${certification.syllabusVersion}`);
    lines.push("");
    lines.push(
      `**${published.length}** published question(s) in the pool · **${covered}/${objectives.length}** learning objective(s) covered.`,
    );
    lines.push("");
    lines.push("| Target | Questions | LO >= threshold | Status |");
    lines.push("|---|--:|--:|---|");
    for (const target of TARGETS) {
      const reached = atLeast(target.perObjective);
      const done = published.length >= target.questions && reached === objectives.length;
      lines.push(
        `| ${target.phase} — ${target.questions} questions, every LO >= ${target.perObjective} | ${published.length}/${target.questions} | ${reached}/${objectives.length} | ${done ? "done" : "in progress"} |`,
      );
    }
    lines.push("");

    for (const chapter of syllabus.chapters ?? []) {
      const chapterObjectives = objectives.filter((o) => o.chapter === chapter.number);
      const total = chapterObjectives.reduce((sum, o) => sum + (counts.get(o.code) ?? 0), 0);

      lines.push(`### Chapter ${chapter.number} — ${chapter.title[DOC_LANG]}`);
      lines.push("");
      lines.push(
        `${total} question(s) · ${chapter.examQuestions} question(s) on the exam · ${chapterObjectives.length} learning objective(s)`,
      );
      lines.push("");
      lines.push("| LO | K | Questions | | Objective text |");
      lines.push("|---|:--:|--:|---|---|");

      for (const objective of chapterObjectives) {
        const count = counts.get(objective.code) ?? 0;
        lines.push(
          `| \`${objective.code}\` | ${objective.kLevel} | ${count} | \`${bar(count, 3)}\` | ${objective.text[DOC_LANG]} |`,
        );
      }
      lines.push("");
    }
  }

  fs.writeFileSync(OUT, `${lines.join("\n")}\n`, "utf8");
  console.log(`docs/coverage.md written (${lines.length} line(s))`);

  writeBadges(badges);
}

main();

/**
 * F0-12 — Regenerates questions/index.json and the counters in
 * data/manifest.json from the question chunks.
 *
 * The index does not contain question TEXT: the app downloads the index
 * first, works out which chunks it needs, and fetches only those
 * (docs/04-data-model.md §3.6). That's why the index is never edited by
 * hand — its only source is the chunk files.
 *
 * Usage:  yarn build:index
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "data");
const MANIFEST = path.join(DATA_DIR, "manifest.json");

type Json = Record<string, any>;

function fail(message: string): never {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function readJson(absPath: string): Json {
  if (!fs.existsSync(absPath)) fail(`File not found: ${path.relative(ROOT, absPath)}`);
  try {
    return JSON.parse(fs.readFileSync(absPath, "utf8"));
  } catch (err) {
    fail(`Invalid JSON: ${path.relative(ROOT, absPath)} — ${(err as Error).message}`);
  }
}

function writeJson(absPath: string, value: unknown): void {
  fs.writeFileSync(absPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

/** Fields that go into the index — the question body (i18n) is deliberately left out. */
function toIndexEntry(question: Json, chunk: string): Json {
  const languages = Object.keys(question.i18n ?? {}).sort();

  return {
    id: question.id,
    chunk,
    chapter: question.chapter,
    section: question.section,
    objectives: question.objectives,
    kLevel: question.kLevel,
    type: question.type,
    selectCount: question.selectCount,
    difficulty: question.difficulty,
    hasMedia: Boolean(question.media),
    tags: question.tags ?? [],
    languages,
    syllabusVersion: question.syllabusVersion,
    status: question.status,
  };
}

function buildCertificationIndex(certPath: string): {
  count: number;
  objectivesCovered: number;
  minPerObjective: number;
} {
  const certDir = path.join(DATA_DIR, certPath);
  const questionsDir = path.join(certDir, "questions");
  if (!fs.existsSync(questionsDir)) fail(`questions/ directory missing: data/${certPath}/`);

  const chunkFiles = fs
    .readdirSync(questionsDir)
    .filter((name) => name.endsWith(".json") && name !== "index.json")
    .sort();

  const entries: Json[] = [];
  const chunks: string[] = [];
  const seen = new Map<string, string>();

  for (const fileName of chunkFiles) {
    const chunkDoc = readJson(path.join(questionsDir, fileName));
    const chunk = chunkDoc.chunk ?? path.basename(fileName, ".json");
    chunks.push(chunk);

    for (const question of chunkDoc.questions ?? []) {
      const previous = seen.get(question.id);
      // Question IDs are permanent and never reused — if a collision is
      // silently ignored, two different questions end up sharing one ID.
      if (previous) fail(`Duplicate question ID: ${question.id} (${previous} and ${chunk})`);
      seen.set(question.id, chunk);
      entries.push(toIndexEntry(question, chunk));
    }
  }

  entries.sort((a, b) => String(a.id).localeCompare(String(b.id)));

  const dataVersion = readJson(MANIFEST).dataVersion;
  writeJson(path.join(questionsDir, "index.json"), {
    dataVersion,
    count: entries.length,
    chunks,
    questions: entries,
  });

  // Coverage: only published questions are counted, drafts don't count toward the pool.
  const perObjective = new Map<string, number>();
  for (const objective of readJson(path.join(certDir, "objectives.json")).objectives ?? []) {
    perObjective.set(objective.code, 0);
  }
  for (const entry of entries) {
    if (entry.status !== "published") continue;
    for (const code of entry.objectives) {
      perObjective.set(code, (perObjective.get(code) ?? 0) + 1);
    }
  }

  const counts = [...perObjective.values()];
  console.log(
    `  data/${certPath}/questions/index.json — ${entries.length} question(s), ${chunks.length} chunk(s)`,
  );

  return {
    count: entries.length,
    objectivesCovered: counts.filter((n) => n > 0).length,
    minPerObjective: counts.length === 0 ? 0 : Math.min(...counts),
  };
}

function main(): void {
  const manifest = readJson(MANIFEST);
  const certifications = manifest.certifications ?? [];
  if (certifications.length === 0) fail("data/manifest.json has no certifications.");

  console.log("Generating index...");
  for (const certification of certifications) {
    const stats = buildCertificationIndex(certification.path);
    certification.questionCount = stats.count;
    certification.coverage = {
      objectivesTotal: certification.coverage?.objectivesTotal ?? 0,
      objectivesCovered: stats.objectivesCovered,
      minPerObjective: stats.minPerObjective,
    };
  }

  writeJson(MANIFEST, manifest);
  console.log("  data/manifest.json counters updated");
  console.log("Done.");
}

main();

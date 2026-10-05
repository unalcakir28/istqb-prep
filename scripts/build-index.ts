/**
 * F0-12 — Regenerates questions/index.json and the counters in
 * data/manifest.json from the question chunks.
 *
 * The index does not contain question TEXT: the app downloads the index
 * first, works out which chunks it needs, and fetches only those
 * (docs/04-data-model.md §3.6). That's why the index is never edited by
 * hand — its only source is the chunk files.
 *
 * It also sets `manifest.dataVersion`, the key the app's content cache is
 * invalidated by. It used to be a date typed by hand, and nobody retyped it:
 * it read 2026.09.19 through two later content releases, so a returning
 * visitor's cache kept serving the old pool. It is now a hash of every content
 * file the app can fetch, so it changes exactly when the content does.
 *
 * The manifest's list of certifications is generated too (F4-01): one entry
 * per `data/<dir>/meta.json`, in the order the manifest already lists them and
 * any new one appended. Its id, acronym, version and `status` come from that
 * meta.json, and the counters from the content — so adding a certification is
 * adding its directory, and making it selectable is setting its meta.json
 * `status` to "active".
 *
 * Usage:  yarn build:index
 */

import { createHash } from "node:crypto";
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
    revision: question.revision,
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

function buildCertificationIndex(
  certPath: string,
  dataVersion: string,
): {
  count: number;
  objectivesTotal: number;
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
    objectivesTotal: counts.length,
    objectivesCovered: counts.filter((n) => n > 0).length,
    minPerObjective: counts.length === 0 ? 0 : Math.min(...counts),
  };
}

/** Fields that go into the lesson index — lesson body text (i18n) is deliberately left out. */
function toLessonIndexEntry(lesson: Json, chunk: string, chapter: number): Json {
  const languages = Object.keys(lesson.i18n ?? {}).sort();

  return {
    objective: lesson.objective,
    chunk,
    chapter,
    languages,
    syllabusVersion: lesson.syllabusVersion,
    status: lesson.status,
  };
}

function buildLessonIndex(certPath: string, dataVersion: string): { count: number } {
  const certDir = path.join(DATA_DIR, certPath);
  const lessonsDir = path.join(certDir, "lessons");
  if (!fs.existsSync(lessonsDir)) return { count: 0 }; // no lessons/ yet for this certification

  const chunkFiles = fs
    .readdirSync(lessonsDir)
    .filter((name) => name.endsWith(".json") && name !== "index.json")
    .sort();

  const entries: Json[] = [];
  const chunks: string[] = [];
  const seen = new Map<string, string>();

  for (const fileName of chunkFiles) {
    const chunkDoc = readJson(path.join(lessonsDir, fileName));
    const chunk = chunkDoc.chunk ?? path.basename(fileName, ".json");
    chunks.push(chunk);

    for (const lesson of chunkDoc.lessons ?? []) {
      const previous = seen.get(lesson.objective);
      // Each learning objective has at most one lesson — a collision means
      // the same objective was authored twice across chunks.
      if (previous) fail(`Duplicate lesson objective: ${lesson.objective} (${previous} and ${chunk})`);
      seen.set(lesson.objective, chunk);
      entries.push(toLessonIndexEntry(lesson, chunk, chunkDoc.chapter));
    }
  }

  entries.sort((a, b) => String(a.objective).localeCompare(String(b.objective)));

  writeJson(path.join(lessonsDir, "index.json"), {
    dataVersion,
    count: entries.length,
    chunks,
    lessons: entries,
  });

  console.log(`  data/${certPath}/lessons/index.json — ${entries.length} lesson(s), ${chunks.length} chunk(s)`);

  return { count: entries.length };
}

/** Every JSON file under data/ except the ones this script writes. */
function contentFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...contentFiles(absPath));
      continue;
    }
    if (!entry.name.endsWith(".json")) continue;
    if (absPath === MANIFEST || entry.name === "index.json") continue;
    files.push(absPath);
  }
  return files;
}

/**
 * The content version: the first 12 hex digits of a SHA-256 over each content
 * file's path and bytes, in a fixed order. The generated files are left out —
 * they embed this value, and they are derived from the files that are hashed.
 */
function contentVersion(): string {
  const hash = createHash("sha256");
  for (const file of contentFiles(DATA_DIR).sort()) {
    hash.update(path.relative(DATA_DIR, file).split(path.sep).join("/"));
    hash.update("\0");
    hash.update(fs.readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 12);
}

/**
 * One manifest entry per certification directory. An entry whose directory
 * has gone is dropped; one whose directory is new is appended. Every content
 * file a question needs is checked by `yarn validate:data`, not here.
 */
function syncCertifications(existing: Json[]): Json[] {
  const dirs = fs
    .readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(DATA_DIR, entry.name, "meta.json")))
    .map((entry) => entry.name)
    .sort();

  const known = existing.filter((entry) => dirs.includes(entry.path));
  const added = dirs
    .filter((dir) => !known.some((entry) => entry.path === dir))
    .map((dir): Json => ({ path: dir }));

  return [...known, ...added].map((entry) => {
    const meta = readJson(path.join(DATA_DIR, entry.path, "meta.json"));
    return {
      id: meta.id,
      acronym: meta.acronym,
      syllabusVersion: meta.syllabusVersion,
      status: meta.status ?? "draft",
      path: entry.path,
      // Rule 3: nothing is published without both, so every certification offers both.
      languages: entry.languages ?? ["tr", "en"],
      questionCount: entry.questionCount ?? 0,
      coverage: entry.coverage,
    };
  });
}

function main(): void {
  const manifest = readJson(MANIFEST);
  const dataVersion = contentVersion();
  manifest.dataVersion = dataVersion;
  manifest.certifications = syncCertifications(manifest.certifications ?? []);
  const certifications = manifest.certifications;
  if (certifications.length === 0) fail("data/ has no certification directory with a meta.json.");

  console.log("Generating index...");
  for (const certification of certifications) {
    const stats = buildCertificationIndex(certification.path, dataVersion);
    certification.questionCount = stats.count;
    certification.coverage = {
      objectivesTotal: stats.objectivesTotal,
      objectivesCovered: stats.objectivesCovered,
      minPerObjective: stats.minPerObjective,
    };
    buildLessonIndex(certification.path, dataVersion);
  }

  writeJson(MANIFEST, manifest);
  console.log(`  data/manifest.json counters updated, dataVersion ${dataVersion}`);
  console.log("Done.");
}

main();

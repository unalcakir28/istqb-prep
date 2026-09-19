/**
 * F0-12 — Soru parcalarindan questions/index.json ve data/manifest.json'daki
 * sayaclari yeniden uretir.
 *
 * Indeks, soru METNI icermez: uygulama once indeksi indirir, hangi parcalara
 * ihtiyaci oldugunu hesaplar, sadece onlari ceker (docs/04-veri-modeli.md §3.6).
 * Bu yuzden indeks elle duzenlenmez — tek kaynagi parca dosyalaridir.
 *
 * Kullanim:  yarn build:index
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "data");
const MANIFEST = path.join(DATA_DIR, "manifest.json");

type Json = Record<string, any>;

function fail(message: string): never {
  console.error(`HATA: ${message}`);
  process.exit(1);
}

function readJson(absPath: string): Json {
  if (!fs.existsSync(absPath)) fail(`Dosya bulunamadi: ${path.relative(ROOT, absPath)}`);
  try {
    return JSON.parse(fs.readFileSync(absPath, "utf8"));
  } catch (err) {
    fail(`Gecersiz JSON: ${path.relative(ROOT, absPath)} — ${(err as Error).message}`);
  }
}

function writeJson(absPath: string, value: unknown): void {
  fs.writeFileSync(absPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

/** Indekse giren alanlar — soru govdesi (i18n) bilerek disarida birakilir. */
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
  if (!fs.existsSync(questionsDir)) fail(`questions/ dizini yok: data/${certPath}/`);

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
      // Soru ID'leri kalicidir ve asla yeniden kullanilmaz — carpisma sessizce
      // gecilirse iki farkli soru ayni ID ile dolasir.
      if (previous) fail(`Soru ID'si tekrar ediyor: ${question.id} (${previous} ve ${chunk})`);
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

  // Kapsama: sadece yayinlanmis sorular sayilir, taslak soru havuza girmez.
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
    `  data/${certPath}/questions/index.json — ${entries.length} soru, ${chunks.length} parca`,
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
  if (certifications.length === 0) fail("data/manifest.json icinde sertifika yok.");

  console.log("Indeks uretiliyor...");
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
  console.log("  data/manifest.json sayaclari guncellendi");
  console.log("Bitti.");
}

main();

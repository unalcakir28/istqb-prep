/**
 * F0-13 — LO basina kapsama raporu -> docs/kapsama.md
 *
 * "Her ogrenme hedefi icin en az 3 soru" hedefinin nerede durdugunu tek
 * bakista gosterir. Rapor uretilen bir dosyadir; elle duzenlenmez.
 *
 * Kullanim:  yarn stats
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "data");
const OUT = path.join(ROOT, "docs", "kapsama.md");
const README = path.join(ROOT, "README.md");
const BADGE_START = "<!-- kapsama:basla";
const BADGE_END = "<!-- kapsama:bitti -->";

type Json = Record<string, any>;

function readJson(absPath: string): Json {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

/** Faz hedefleri — docs/09-yol-haritasi.md */
const TARGETS = [
  { phase: "Faz 1 (MVP)", questions: 120, perObjective: 1 },
  { phase: "Faz 2", questions: 200, perObjective: 2 },
  { phase: "Faz 3", questions: 300, perObjective: 3 },
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
 * README'deki rozetler elle yazilirsa sessizce eskir. Marker araligi her
 * `yarn stats` calismasinda yeniden uretilir; markerlar yoksa README'ye
 * dokunulmaz (uyari verilir), cunku dosyanin geri kalani bu betigin isi degil.
 */
function writeBadges(badges: Badge[]): void {
  const first = badges[0];
  if (!first) return;

  const readme = fs.readFileSync(README, "utf8");
  const start = readme.indexOf(BADGE_START);
  const end = readme.indexOf(BADGE_END);
  if (start === -1 || end === -1) {
    console.warn("README.md icinde kapsama markerlari yok — rozetler guncellenmedi.");
    return;
  }

  const complete = first.covered === first.objectives;
  const block = [
    readme.slice(start, readme.indexOf("\n", start)),
    "",
    `[![soru](${shield("soru", String(first.questions), "2ea043")})](docs/kapsama.md)`,
    `[![hedef kapsama](${shield("hedef kapsama", `${first.covered}/${first.objectives}`, complete ? "2ea043" : "d29922")})](docs/kapsama.md)`,
    `[![mufredat](${shield(first.acronym, `v${first.version}`, "0969da")})](docs/03-istqb-referans.md)`,
    "",
  ].join("\n");

  fs.writeFileSync(README, readme.slice(0, start) + block + readme.slice(end), "utf8");
  console.log(`README.md rozetleri guncellendi (${first.questions} soru, ${first.covered}/${first.objectives} LO)`);
}

function main(): void {
  const manifest = readJson(path.join(DATA_DIR, "manifest.json"));
  const lines: string[] = [];
  const badges: Badge[] = [];

  lines.push("# Kapsama raporu");
  lines.push("");
  lines.push(
    "> Bu dosya `yarn stats` ile **uretilir**. Elle duzenlemeyin — bir sonraki calistirmada uzerine yazilir.",
  );
  lines.push("");
  lines.push(`Uretildi: ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");

  for (const certification of manifest.certifications ?? []) {
    const certDir = path.join(DATA_DIR, certification.path);
    const objectives: Json[] = readJson(path.join(certDir, "objectives.json")).objectives ?? [];
    const syllabus = readJson(path.join(certDir, "syllabus.json"));
    const index = readJson(path.join(certDir, "questions", "index.json"));

    // Yalnizca yayinlanmis sorular sayilir — taslak soru havuza girmez,
    // dolayisiyla kapsama da saymamali.
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
      `Havuzda **${published.length}** yayinlanmis soru · **${covered}/${objectives.length}** ogrenme hedefi kapsaniyor.`,
    );
    lines.push("");
    lines.push("| Hedef | Soru | LO >= esik | Durum |");
    lines.push("|---|--:|--:|---|");
    for (const target of TARGETS) {
      const reached = atLeast(target.perObjective);
      const done = published.length >= target.questions && reached === objectives.length;
      lines.push(
        `| ${target.phase} — ${target.questions} soru, her LO >= ${target.perObjective} | ${published.length}/${target.questions} | ${reached}/${objectives.length} | ${done ? "tamam" : "devam"} |`,
      );
    }
    lines.push("");

    for (const chapter of syllabus.chapters ?? []) {
      const chapterObjectives = objectives.filter((o) => o.chapter === chapter.number);
      const total = chapterObjectives.reduce((sum, o) => sum + (counts.get(o.code) ?? 0), 0);

      lines.push(`### Bolum ${chapter.number} — ${chapter.title.tr}`);
      lines.push("");
      lines.push(
        `${total} soru · sinavda ${chapter.examQuestions} soru · ${chapterObjectives.length} ogrenme hedefi`,
      );
      lines.push("");
      lines.push("| LO | K | Soru | | Hedef metni |");
      lines.push("|---|:--:|--:|---|---|");

      for (const objective of chapterObjectives) {
        const count = counts.get(objective.code) ?? 0;
        lines.push(
          `| \`${objective.code}\` | ${objective.kLevel} | ${count} | \`${bar(count, 3)}\` | ${objective.text.tr} |`,
        );
      }
      lines.push("");
    }
  }

  fs.writeFileSync(OUT, `${lines.join("\n")}\n`, "utf8");
  console.log(`docs/kapsama.md yazildi (${lines.length} satir)`);

  writeBadges(badges);
}

main();

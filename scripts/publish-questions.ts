/**
 * Publishes reviewed questions: status "review" -> "published".
 *
 * CLAUDE.md rule: `status` CANNOT be `published` while `meta.reviewedBy` is
 * empty. This script is the only way through that gate — hand-editing with
 * sed would publish a question without recording who reviewed it, silently
 * breaking the rule.
 *
 * Usage:
 *   yarn publish:questions --reviewer "name" --chunk ch04-a
 *   yarn publish:questions --reviewer "name" --chunk ch04-a --except ctfl4-0067,ctfl4-0070
 *   yarn publish:questions --reviewer "name" --all --dry-run
 *
 * Questions held back with `--except` stay in `review`; questions with
 * findings from validation must not be published until they're fixed.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "data");

interface Options {
  reviewer: string;
  chunks: string[] | "all";
  except: Set<string>;
  dryRun: boolean;
}

function fail(message: string): never {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function parseArgs(argv: string[]): Options {
  const get = (flag: string): string | undefined => {
    const at = argv.indexOf(flag);
    if (at === -1) return undefined;
    return argv[at + 1];
  };

  const reviewer = get("--reviewer");
  if (!reviewer || reviewer.startsWith("--")) {
    fail("--reviewer is required. A question cannot be published without recording who reviewed it.");
  }

  const all = argv.includes("--all");
  const chunk = get("--chunk");
  if (!all && !chunk) fail("--chunk <name> or --all is required.");

  return {
    reviewer,
    chunks: all ? "all" : (chunk as string).split(","),
    except: new Set((get("--except") ?? "").split(",").filter(Boolean)),
    dryRun: argv.includes("--dry-run"),
  };
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "manifest.json"), "utf8"));
  const today = new Date().toISOString().slice(0, 10);

  let published = 0;
  let held = 0;

  for (const certification of manifest.certifications ?? []) {
    const questionsDir = path.join(DATA_DIR, certification.path, "questions");
    if (!fs.existsSync(questionsDir)) continue;

    const files = fs
      .readdirSync(questionsDir)
      .filter((name) => name.endsWith(".json") && name !== "index.json");

    for (const fileName of files) {
      const chunkName = path.basename(fileName, ".json");
      if (options.chunks !== "all" && !options.chunks.includes(chunkName)) continue;

      const filePath = path.join(questionsDir, fileName);
      const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
      let dirty = false;

      for (const question of doc.questions ?? []) {
        if (question.status !== "review") continue;

        if (options.except.has(question.id)) {
          held += 1;
          console.log(`  held        ${question.id} (--except)`);
          continue;
        }

        question.status = "published";
        question.meta.reviewedBy = options.reviewer;
        question.meta.updatedAt = today;
        published += 1;
        dirty = true;
      }

      if (!dirty || options.dryRun) continue;
      fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
      console.log(`  written     ${chunkName}`);
    }
  }

  const prefix = options.dryRun ? "[dry run] " : "";
  console.log(`${prefix}${published} question(s) published, ${held} question(s) held back.`);
  if (options.dryRun) return;

  console.log("Now run: yarn build:index && yarn validate:data");
}

main();

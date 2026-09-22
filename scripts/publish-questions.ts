/**
 * Publishes reviewed content: status "review" -> "published".
 *
 * CLAUDE.md rule: `status` CANNOT be `published` while `meta.reviewedBy` is
 * empty. This script is the only way through that gate — hand-editing with
 * sed would publish an item without recording who reviewed it, silently
 * breaking the rule.
 *
 * It covers BOTH collections. Questions and lessons carry the same three
 * fields the gate turns on (`status`, `meta.reviewedBy`, `meta.updatedAt`),
 * differing only in which directory they live in and what identifies a record
 * — so one implementation serves both, and a second copy could only drift
 * (F2-12).
 *
 * Usage:
 *   yarn publish:questions --reviewer "name" --chunk ch04-a
 *   yarn publish:questions --reviewer "name" --chunk ch04-a --except ctfl4-0067,ctfl4-0070
 *   yarn publish:questions --reviewer "name" --all --dry-run
 *   yarn publish:lessons   --reviewer "name" --chunk ch01
 *   yarn publish:lessons   --reviewer "name" --all --except FL-1.1.1
 *
 * Items held back with `--except` stay in `review`; anything with findings
 * from validation must not be published until it is fixed.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "data");

/** What separates the two collections, and nothing else. */
interface Collection {
  /** Directory under a certification's path. */
  dir: "questions" | "lessons";
  /** The array inside a chunk file. */
  arrayKey: "questions" | "lessons";
  /** How one record names itself in the console and in `--except`. */
  identify: (record: Record<string, unknown>) => string;
  /** What `--except` takes, for the usage message. */
  exceptHint: string;
}

const COLLECTIONS: Record<string, Collection> = {
  questions: {
    dir: "questions",
    arrayKey: "questions",
    identify: (record) => String(record.id),
    exceptHint: "question ids (ctfl4-0067)",
  },
  lessons: {
    dir: "lessons",
    arrayKey: "lessons",
    // A lesson has no id of its own: the learning objective IS its key.
    identify: (record) => String(record.objective),
    exceptHint: "objective codes (FL-1.1.1)",
  },
};

interface Options {
  collection: Collection;
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

  const kind = get("--kind") ?? "questions";
  const collection = COLLECTIONS[kind];
  if (!collection) fail(`--kind must be one of: ${Object.keys(COLLECTIONS).join(", ")}.`);

  const reviewer = get("--reviewer");
  if (!reviewer || reviewer.startsWith("--")) {
    fail(`--reviewer is required. Nothing is published without recording who reviewed it.`);
  }

  const all = argv.includes("--all");
  const chunk = get("--chunk");
  if (!all && !chunk) fail("--chunk <name> or --all is required.");

  return {
    collection,
    reviewer,
    chunks: all ? "all" : (chunk as string).split(","),
    except: new Set((get("--except") ?? "").split(",").filter(Boolean)),
    dryRun: argv.includes("--dry-run"),
  };
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const { collection } = options;
  const manifest = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "manifest.json"), "utf8"));
  const today = new Date().toISOString().slice(0, 10);

  let published = 0;
  let held = 0;

  for (const certification of manifest.certifications ?? []) {
    const contentDir = path.join(DATA_DIR, certification.path, collection.dir);
    if (!fs.existsSync(contentDir)) continue;

    const files = fs
      .readdirSync(contentDir)
      .filter((name) => name.endsWith(".json") && name !== "index.json");

    for (const fileName of files) {
      const chunkName = path.basename(fileName, ".json");
      if (options.chunks !== "all" && !options.chunks.includes(chunkName)) continue;

      const filePath = path.join(contentDir, fileName);
      const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
      let dirty = false;

      for (const record of doc[collection.arrayKey] ?? []) {
        if (record.status !== "review") continue;

        const name = collection.identify(record);
        if (options.except.has(name)) {
          held += 1;
          console.log(`  held        ${name} (--except)`);
          continue;
        }

        record.status = "published";
        record.meta.reviewedBy = options.reviewer;
        record.meta.updatedAt = today;
        published += 1;
        dirty = true;
      }

      if (!dirty || options.dryRun) continue;
      fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
      console.log(`  written     ${chunkName}`);
    }
  }

  const prefix = options.dryRun ? "[dry run] " : "";
  console.log(
    `${prefix}${published} ${collection.dir.slice(0, -1)}(s) published, ${held} held back.`,
  );
  if (options.dryRun) return;

  console.log("Now run: yarn build:index && yarn validate:data");
}

main();

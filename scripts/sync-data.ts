/**
 * Copies data/ -> public/data/.
 *
 * Source data is kept under `data/` and reviewed in Git; the copy served
 * to the browser lives under `public/data/` and is in .gitignore
 * (docs/05-technical-architecture.md §3). Rather than maintaining the same
 * JSON by hand in two places, it's copied before dev and before build.
 *
 * Usage:  yarn sync:data   (runs automatically from predev and prebuild)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "data");
const TARGET = path.join(ROOT, "public", "data");

function main(): void {
  if (!fs.existsSync(SOURCE)) {
    console.error("ERROR: data/ directory does not exist.");
    process.exit(1);
  }

  // Cleared first so a deleted question chunk doesn't linger under public/.
  fs.rmSync(TARGET, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.cpSync(SOURCE, TARGET, { recursive: true });

  const count = fs
    .readdirSync(TARGET, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile()).length;

  console.log(`data/ -> public/data/ (${count} file(s))`);
}

main();

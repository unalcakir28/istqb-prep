#!/usr/bin/env tsx
/**
 * scripts/check-i18n.ts
 *
 * Key parity for the UI locales in src/lib/i18n/locales/.
 *
 * Bilingualism is an inviolable rule (docs/adr/0005-bilingualism.md), but
 * `yarn validate:data` only inspects data/ — the UI strings had no gate at
 * all. A missing Turkish key does not fail the build either: i18next silently
 * falls back to English, and the E2E specs read their labels from en.json, so
 * nothing turns red. This check is that gate.
 *
 * It is deliberately NOT one of the 15 checks in validate-data.ts: those are
 * the content checks specified in docs/04-data-model.md §6, and this one is
 * about src/, not data/.
 *
 * Exit codes: 0 = the locales agree, 1 = they do not.
 *
 * Run with: yarn validate:i18n
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES_DIR = path.join(ROOT, "src", "lib", "i18n", "locales");

/** The locale every other locale is compared against. */
const REFERENCE = "en";

type Json = Record<string, unknown>;

/** Flattens a nested locale object into dotted leaf paths. */
function leafKeys(value: Json, prefix = ""): string[] {
  const keys: string[] = [];

  for (const [key, child] of Object.entries(value)) {
    const dotted = prefix ? `${prefix}.${key}` : key;

    if (child !== null && typeof child === "object" && !Array.isArray(child)) {
      keys.push(...leafKeys(child as Json, dotted));
      continue;
    }

    keys.push(dotted);
  }

  return keys;
}

function readLocale(file: string): Json {
  return JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), "utf8"));
}

function report(locale: string, label: string, keys: string[]): void {
  if (keys.length === 0) return;
  console.error(`\n  ${locale}.json — ${label} (${keys.length}):`);
  for (const key of keys.sort()) console.error(`    ${key}`);
}

function main(): void {
  if (!fs.existsSync(LOCALES_DIR)) {
    console.error(`ERROR: locales directory not found: ${LOCALES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith(".json"));
  const referenceFile = `${REFERENCE}.json`;

  if (!files.includes(referenceFile)) {
    console.error(`ERROR: the reference locale ${referenceFile} is missing.`);
    process.exit(1);
  }

  const referenceKeys = new Set(leafKeys(readLocale(referenceFile)));
  let failed = false;

  for (const file of files) {
    const locale = path.basename(file, ".json");
    if (locale === REFERENCE) continue;

    const keys = new Set(leafKeys(readLocale(file)));
    const missing = [...referenceKeys].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !referenceKeys.has(k));

    if (missing.length === 0 && extra.length === 0) {
      console.log(`${locale}.json: OK (${keys.size} keys)`);
      continue;
    }

    failed = true;
    report(locale, `missing, present in ${REFERENCE}.json`, missing);
    report(locale, `extra, absent from ${REFERENCE}.json`, extra);
  }

  if (failed) {
    console.error(
      `\nRESULT: FAILED — the UI locales disagree. Every string ships in TR and EN ` +
        `(docs/adr/0005-bilingualism.md).`,
    );
    process.exit(1);
  }

  console.log(
    `RESULT: PASSED — ${files.length} locale(s) agree on ${referenceKeys.size} keys.`,
  );
}

main();

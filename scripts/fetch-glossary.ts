/**
 * F0-09 — Pulls each certification's terms from the ISTQB Glossary API into
 * data/<cert>/glossary/.
 *
 * Which terms: the ones the glossary itself lists as used in the
 * certification's syllabus, named in meta.json as `glossaryUsedIn`
 * ({ syllabus, version }, the API's own `used_in` value). A certification
 * without `sources.glossaryApi` and `glossaryUsedIn` is skipped.
 *
 * What is copied: the English term and definition, verbatim, with a link to
 * the term's page. The glossary is CC BY 4.0 "except where otherwise noted"
 * (docs/08-legal-and-copyright.md §5); the API records carry no notice of
 * their own, so the default applies, and the attribution travels with the
 * data in glossary/index.json.
 *
 * The Turkish term comes from the certification's terms.json — the keyword
 * mapping taken from the TTB syllabus, or marked editorial — matched on the
 * English term, case-insensitively. No Turkish definition is written: none
 * has a verified source yet, and a translated one would be ours, not the
 * glossary's (docs/04-data-model.md §3.10). A term with no match carries no
 * `tr` at all rather than a guess.
 *
 * The output is generated: rerun the script rather than edit it. It rewrites
 * every terms-<letter>.json and the index, and removes a chunk whose letter
 * no longer has a term.
 *
 * Usage:  yarn fetch:glossary          (then yarn build:index && yarn validate:data)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "data");
const TERM_PAGE = "https://glossary.istqb.org/en_US/term/";
const LICENSE = "CC BY 4.0";
const LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";

type Json = Record<string, any>;

/** One record of GET /v1/terms. `version` is the term's own revision. */
interface ApiTerm {
  term: string;
  slug: string;
  version: number;
  definition: string;
  used_in: { syllabus_name: string; version: string }[];
}

interface UsedIn {
  syllabus: string;
  version: string;
}

function fail(message: string): never {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function readJson(absPath: string): Json {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

function writeJson(absPath: string, value: unknown): void {
  fs.writeFileSync(absPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function fetchTerms(url: string): Promise<ApiTerm[]> {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) fail(`${url} answered ${response.status}`);

  const body = (await response.json()) as { data?: ApiTerm[] };
  if (!Array.isArray(body.data) || body.data.length === 0) fail(`${url} returned no terms`);
  return body.data;
}

/** The Turkish term and its source, keyed by the lower-cased English term. */
function turkishTerms(certDir: string): Map<string, { term: string; trSource: string }> {
  const file = readJson(path.join(certDir, "terms.json"));
  const terms = new Map<string, { term: string; trSource: string }>();
  for (const entry of file.terms as Json[]) {
    terms.set(String(entry.en).toLowerCase(), {
      term: entry.tr,
      trSource: entry.trSource ?? file.trSource,
    });
  }
  return terms;
}

function chunkOf(slug: string): string {
  return `terms-${slug[0]}`;
}

function writeCertification(certDir: string, usedIn: UsedIn, api: ApiTerm[], fetchedAt: string): void {
  const selected = api
    .filter((term) =>
      term.used_in.some((use) => use.syllabus_name === usedIn.syllabus && use.version === usedIn.version),
    )
    .sort((a, b) => a.slug.localeCompare(b.slug));
  if (selected.length === 0) fail(`no glossary term is used in ${usedIn.syllabus} ${usedIn.version}`);

  const turkish = turkishTerms(certDir);
  const chunks = new Map<string, Json[]>();
  const index: Json[] = [];

  for (const term of selected) {
    const tr = turkish.get(term.term.toLowerCase());
    const chunk = chunkOf(term.slug);

    const entry: Json = {
      slug: term.slug,
      revision: term.version,
      en: { term: term.term, definition: term.definition.trim() },
      ...(tr ? { tr: { term: tr.term }, trSource: tr.trSource } : {}),
      source: "ISTQB Glossary",
      sourceUrl: `${TERM_PAGE}${term.slug}`,
    };
    chunks.set(chunk, [...(chunks.get(chunk) ?? []), entry]);
    index.push({ slug: term.slug, en: term.term, ...(tr ? { tr: tr.term } : {}), chunk });
  }

  const glossaryDir = path.join(certDir, "glossary");
  fs.mkdirSync(glossaryDir, { recursive: true });
  for (const name of fs.readdirSync(glossaryDir)) {
    if (/^terms-[a-z0-9]\.json$/.test(name)) fs.rmSync(path.join(glossaryDir, name));
  }
  for (const [chunk, terms] of chunks) writeJson(path.join(glossaryDir, `${chunk}.json`), { terms });

  writeJson(path.join(glossaryDir, "index.json"), {
    source: "ISTQB Glossary",
    sourceUrl: "https://glossary.istqb.org/",
    license: LICENSE,
    licenseUrl: LICENSE_URL,
    usedIn,
    fetchedAt,
    terms: index,
  });

  const withTurkish = index.filter((entry) => entry.tr !== undefined).length;
  console.log(
    `  ${path.relative(ROOT, glossaryDir)}/ — ${index.length} term(s), ${withTurkish} with a Turkish term, ${chunks.size} chunk(s)`,
  );
}

async function main(): Promise<void> {
  const certDirs = fs
    .readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(DATA_DIR, entry.name, "meta.json")))
    .map((entry) => path.join(DATA_DIR, entry.name))
    .sort();

  const fetchedAt = new Date().toISOString().slice(0, 10);
  const responses = new Map<string, ApiTerm[]>();

  for (const certDir of certDirs) {
    const meta = readJson(path.join(certDir, "meta.json"));
    const url: string | undefined = meta.sources?.glossaryApi;
    const usedIn: UsedIn | undefined = meta.glossaryUsedIn;
    if (!url || !usedIn) {
      console.log(`  ${path.relative(ROOT, certDir)}/ — skipped, no glossaryApi / glossaryUsedIn in meta.json`);
      continue;
    }

    if (!responses.has(url)) responses.set(url, await fetchTerms(url));
    writeCertification(certDir, usedIn, responses.get(url) ?? [], fetchedAt);
  }

  console.log("Now run: yarn build:index && yarn validate:data");
}

await main();

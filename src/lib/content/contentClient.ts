/**
 * F1-02 — Content access layer.
 *
 * Single responsibility: "give me these question IDs", with as little
 * network traffic as possible (docs/05-technical-architecture.md §4).
 *
 * Data is served as static JSON. The app fetches the lightweight index
 * first, works out which chunks it needs, and downloads only those — the
 * full 300-question pool is never downloaded in one go.
 *
 * The cache has two layers: an in-process Map, and the Cache API across
 * processes. Both are invalidated by `dataVersion`; the manifest is always
 * fetched fresh on each launch, and everything else is cached alongside
 * that version.
 */

import type {
  CertificationSummary,
  CertMeta,
  ExamBlueprint,
  Manifest,
  Objective,
  Question,
  QuestionChunk,
  QuestionIndex,
  Syllabus,
  Terms,
} from "@/types/content";

const CACHE_NAME = "istqb-prep-content";

/** Vite's `base` setting becomes '/istqb-prep/' on GitHub Pages. */
function dataUrl(...segments: string[]): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}/data/${segments.join("/")}`;
}

async function openCache(): Promise<Cache | null> {
  // The Cache API doesn't exist in private browsing or older browsers; caching is optional.
  if (typeof caches === "undefined") return null;
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

export class ContentClient {
  private memory = new Map<string, unknown>();
  private inflight = new Map<string, Promise<unknown>>();
  private dataVersion: string | null = null;
  private versionCheck: Promise<void> | null = null;

  /**
   * The version check used to happen only inside `getManifest`, which was
   * only called from the home / setup / sources screens. When a URL like
   * /deneme/:id was entered directly (refresh, bookmark, back/forward
   * history), the check never ran, and stale content in the Cache API was
   * served forever. Now every cached read waits on this first.
   */
  private ensureVersion(): Promise<void> {
    this.versionCheck ??= this.getManifest().then(() => undefined);
    return this.versionCheck;
  }

  /** Two concurrent requests for the same URL collapse into a single fetch. */
  private async fetchJson<T>(url: string, cacheable: boolean): Promise<T> {
    // The manifest doesn't go through this path (it has its own `no-cache`
    // fetch), so waiting here doesn't create a cycle.
    await this.ensureVersion();

    const cached = this.memory.get(url);
    if (cached) return cached as T;

    const pending = this.inflight.get(url);
    if (pending) return pending as Promise<T>;

    const request = this.loadJson<T>(url, cacheable)
      .then((value) => {
        this.memory.set(url, value);
        return value;
      })
      .finally(() => {
        this.inflight.delete(url);
      });

    this.inflight.set(url, request);
    return request;
  }

  private async loadJson<T>(url: string, cacheable: boolean): Promise<T> {
    const cache = cacheable ? await openCache() : null;

    if (cache) {
      const hit = await cache.match(url);
      if (hit) return (await hit.json()) as T;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load content (${response.status}): ${url}`);
    }

    if (cache) await cache.put(url, response.clone());
    return (await response.json()) as T;
  }

  /**
   * The manifest always comes from the network — since it carries
   * `dataVersion`, caching it would mean a version change is never noticed.
   */
  async getManifest(): Promise<Manifest> {
    const url = dataUrl("manifest.json");
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load manifest (${response.status})`);

    const manifest = (await response.json()) as Manifest;
    await this.applyDataVersion(manifest.dataVersion);
    this.memory.set(url, manifest);

    return manifest;
  }

  /**
   * The certification the screens operate on. The manifest can carry more
   * than one, but in Phase 1 only the one marked `active` is shown; if none
   * is marked, the first one is used.
   */
  async getActiveCertification(): Promise<CertificationSummary> {
    const manifest = await this.getManifest();
    const cert =
      manifest.certifications.find((item) => item.status === "active") ??
      manifest.certifications[0];

    if (!cert) throw new Error("manifest has no certification");
    return cert;
  }

  /** If the version has changed, everything belonging to the old version is discarded. */
  private async applyDataVersion(version: string): Promise<void> {
    if (this.dataVersion === version) return;

    if (this.dataVersion !== null) {
      this.memory.clear();
      if (typeof caches !== "undefined") {
        try {
          await caches.delete(CACHE_NAME);
        } catch {
          // Keep working even if the cache can't be deleted.
        }
      }
    }

    this.dataVersion = version;
  }

  getMeta(certPath: string): Promise<CertMeta> {
    return this.fetchJson<CertMeta>(dataUrl(certPath, "meta.json"), true);
  }

  getSyllabus(certPath: string): Promise<Syllabus> {
    return this.fetchJson<Syllabus>(dataUrl(certPath, "syllabus.json"), true);
  }

  async getObjectives(certPath: string): Promise<Objective[]> {
    const doc = await this.fetchJson<{ objectives: Objective[] }>(
      dataUrl(certPath, "objectives.json"),
      true,
    );
    return doc.objectives;
  }

  getBlueprint(certPath: string): Promise<ExamBlueprint> {
    return this.fetchJson<ExamBlueprint>(dataUrl(certPath, "exam-blueprint.json"), true);
  }

  getTerms(certPath: string): Promise<Terms> {
    return this.fetchJson<Terms>(dataUrl(certPath, "terms.json"), true);
  }

  getIndex(certPath: string): Promise<QuestionIndex> {
    return this.fetchJson<QuestionIndex>(dataUrl(certPath, "questions", "index.json"), true);
  }

  getChunk(certPath: string, chunk: string): Promise<QuestionChunk> {
    return this.fetchJson<QuestionChunk>(dataUrl(certPath, "questions", `${chunk}.json`), true);
  }

  /**
   * Fetches the requested questions: first finds which chunks they're in
   * via the index, then downloads only those chunks (in parallel).
   * The returned array preserves the requested ID order.
   */
  async getQuestions(certPath: string, ids: string[]): Promise<Question[]> {
    if (ids.length === 0) return [];

    const index = await this.getIndex(certPath);
    const chunkById = new Map(index.questions.map((entry) => [entry.id, entry.chunk]));

    const needed = new Set<string>();
    const missing: string[] = [];
    for (const id of ids) {
      const chunk = chunkById.get(id);
      if (!chunk) {
        missing.push(id);
        continue;
      }
      needed.add(chunk);
    }

    if (missing.length > 0) {
      throw new Error(`Question IDs not found in the index: ${missing.join(", ")}`);
    }

    const chunks = await Promise.all([...needed].map((chunk) => this.getChunk(certPath, chunk)));

    const byId = new Map<string, Question>();
    for (const chunk of chunks) {
      for (const question of chunk.questions) byId.set(question.id, question);
    }

    return ids.map((id) => {
      const question = byId.get(id);
      if (!question) throw new Error(`Question not found in chunk: ${id}`);
      return question;
    });
  }

  /** Clears the in-memory cache, used in tests and on session teardown. */
  clear(): void {
    this.memory.clear();
    this.inflight.clear();
    this.dataVersion = null;
  }
}

export const contentClient = new ContentClient();

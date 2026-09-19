/**
 * F1-02 — Icerik erisim katmani.
 *
 * Tek sorumluluk: "bu soru ID'lerini bana ver", mumkun olan en az ag
 * trafigiyle (docs/05-teknik-mimari.md §4).
 *
 * Veri statik JSON olarak servis edilir. Uygulama once hafif indeksi ceker,
 * hangi parcalara ihtiyaci oldugunu hesaplar ve sadece o parcalari indirir —
 * 300 soruluk havuzun tamami hicbir zaman tek seferde inmez.
 *
 * Onbellek iki katmanli: sureç icinde Map, sureçler arasinda Cache API.
 * Ikisi de `dataVersion` ile gecersizlestirilir; manifest her acilista
 * taze cekilir, geri kalan her sey surumle birlikte onbellege alinir.
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

/** Vite `base` ayari GitHub Pages'te '/istqb-prep/' oluyor. */
function dataUrl(...segments: string[]): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}/data/${segments.join("/")}`;
}

async function openCache(): Promise<Cache | null> {
  // Cache API gizli sekmede veya eski tarayicida yok; onbellek zorunlu degil.
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
   * Surum kontrolu yalnizca `getManifest` icinde yapiliyordu, o da sadece
   * ana sayfa / kurulum / kaynaklar ekranlarindan cagriliyordu. Dogrudan
   * /deneme/:id gibi bir adrese girildiginde (yenileme, yer imi, gecmis)
   * kontrol hic calismiyor ve Cache API'deki eski icerik sonsuza kadar
   * servis ediliyordu. Artik onbellege alinan her okuma once bunu bekler.
   */
  private ensureVersion(): Promise<void> {
    this.versionCheck ??= this.getManifest().then(() => undefined);
    return this.versionCheck;
  }

  /** Ayni URL icin es zamanli iki istek tek fetch'e indirgenir. */
  private async fetchJson<T>(url: string, cacheable: boolean): Promise<T> {
    // Manifest bu yoldan gecmez (kendi `no-cache` fetch'i var), dolayisiyla
    // burada beklemek dongu yaratmaz.
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
      throw new Error(`Icerik yuklenemedi (${response.status}): ${url}`);
    }

    if (cache) await cache.put(url, response.clone());
    return (await response.json()) as T;
  }

  /**
   * Manifest her zaman agdan gelir — `dataVersion`'i o tasidigi icin
   * onbellege alinirsa surum degisikligi hicbir zaman fark edilmez.
   */
  async getManifest(): Promise<Manifest> {
    const url = dataUrl("manifest.json");
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Manifest yuklenemedi (${response.status})`);

    const manifest = (await response.json()) as Manifest;
    await this.applyDataVersion(manifest.dataVersion);
    this.memory.set(url, manifest);

    return manifest;
  }

  /**
   * Ekranlarin calistigi sertifika. Manifest birden fazla tasiyabilir ama
   * Faz 1'de yalnizca `active` olan gosterilir; hicbiri isaretli degilse
   * ilki kullanilir.
   */
  async getActiveCertification(): Promise<CertificationSummary> {
    const manifest = await this.getManifest();
    const cert =
      manifest.certifications.find((item) => item.status === "active") ??
      manifest.certifications[0];

    if (!cert) throw new Error("manifest has no certification");
    return cert;
  }

  /** Surum degistiyse eski surume ait her sey atilir. */
  private async applyDataVersion(version: string): Promise<void> {
    if (this.dataVersion === version) return;

    if (this.dataVersion !== null) {
      this.memory.clear();
      if (typeof caches !== "undefined") {
        try {
          await caches.delete(CACHE_NAME);
        } catch {
          // Onbellek silinemezse de calismaya devam edilir.
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
   * Istenen sorulari getirir: once indeksten hangi parcalarda olduklari
   * bulunur, sonra yalnizca o parcalar (paralel) indirilir.
   * Donen dizi, istenen ID sirasini korur.
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
      throw new Error(`Indekste bulunmayan soru ID'leri: ${missing.join(", ")}`);
    }

    const chunks = await Promise.all([...needed].map((chunk) => this.getChunk(certPath, chunk)));

    const byId = new Map<string, Question>();
    for (const chunk of chunks) {
      for (const question of chunk.questions) byId.set(question.id, question);
    }

    return ids.map((id) => {
      const question = byId.get(id);
      if (!question) throw new Error(`Soru parcasinda bulunamadi: ${id}`);
      return question;
    });
  }

  /** Test ve oturum kapanisinda bellek onbellegini bosaltir. */
  clear(): void {
    this.memory.clear();
    this.inflight.clear();
    this.dataVersion = null;
  }
}

export const contentClient = new ContentClient();

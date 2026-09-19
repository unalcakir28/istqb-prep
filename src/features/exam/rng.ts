/**
 * Tohumlanmis, belirlenimci rastgelelik.
 *
 * Deneme uretimi Math.random() ile yapilamaz: ayni denemeyi yeniden kurabilmek
 * (yarim kalan oturumu kurtarma, sonuc ekranini tekrar acma) ve dagilim
 * testlerinin tekrarlanabilir olmasi icin tohum saklanir.
 */

/** mulberry32 — 32-bit tohumdan hizli, yeterince iyi dagilimli PRNG. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;

  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bir metni 32-bit tohuma cevirir (soru ID'sinden sik sirasi turetmek icin). */
export function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Fisher-Yates. Girdi dizisi degistirilmez. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Tohumdan uretilmis yeni bir deneme kimligi. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

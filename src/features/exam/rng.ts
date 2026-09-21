/**
 * Seeded, deterministic randomness.
 *
 * Exam generation cannot use Math.random(): the seed is stored so the same
 * exam can be rebuilt (recovering an unfinished session, reopening the result
 * screen) and so the distribution tests are repeatable.
 */

/** mulberry32 — a fast PRNG with good enough distribution, from a 32-bit seed. */
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

/** Fisher-Yates. The input array is not mutated. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** A new attempt id derived from the seed. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

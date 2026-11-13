// Seeded PRNG (mulberry32) whose state lives inside the game state. This keeps
// the engine deterministic: the same seed + the same actions always produce the
// same game, which makes unit tests reliable and future online play possible.

export interface Rng {
  rng: number;
}

export function nextRandom(r: Rng): number {
  r.rng = (r.rng + 0x6d2b79f5) | 0;
  let t = r.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Inclusive integer in [min, max]. */
export function randInt(r: Rng, min: number, max: number): number {
  return min + Math.floor(nextRandom(r) * (max - min + 1));
}

export function chance(r: Rng, probability: number): boolean {
  return nextRandom(r) < probability;
}

export function pick<T>(r: Rng, items: readonly T[]): T {
  return items[Math.floor(nextRandom(r) * items.length)];
}

export function shuffle<T>(r: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(r) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

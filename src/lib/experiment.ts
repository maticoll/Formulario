// ─────────────────────────────────────────────────────────────────────────────
// Experimento A/B del explorador.
// Grupo 'full' ve el 100% de los testimonios; grupo 'reduced' ve el 25%
// (mínimo 1). El resumen ejecutivo es igual para ambos grupos: la única
// variable manipulada es la cantidad de testimonios crudos.
// ─────────────────────────────────────────────────────────────────────────────

export type Variant = 'full' | 'reduced'

export const REDUCED_FRACTION = 0.25

export function assignVariant(): Variant {
  return Math.random() < 0.5 ? 'full' : 'reduced'
}

export function reducedCount(total: number): number {
  if (total <= 0) return 0
  return Math.max(1, Math.ceil(total * REDUCED_FRACTION))
}

// Hash FNV-1a de un string → seed de 32 bits.
function hashSeed(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// PRNG determinístico (mulberry32).
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Subconjunto determinístico: con el mismo seed (sessionId + careerKey) el
// usuario siempre ve exactamente los mismos testimonios, aunque recargue.
// Los items deben venir en orden estable (ordenar antes de llamar).
export function pickDeterministicSubset<T>(items: T[], count: number, seedStr: string): T[] {
  if (count >= items.length) return items
  const rand = mulberry32(hashSeed(seedStr))
  const indices = items.map((_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices
    .slice(0, count)
    .sort((a, b) => a - b)
    .map((i) => items[i])
}

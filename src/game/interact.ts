/**
 * Picks which interactable Bill is "looking at": nearest in reach, favouring things in
 * front of him. Pure function over plain numbers so it can be unit-tested.
 */
export interface Candidate<T = string> {
  id: T;
  x: number;
  z: number;
  /** How close Bill must be (metres, horizontal). */
  reach: number;
  /** Vertical position; candidates on another floor are ignored. */
  y?: number;
}

export function pickTarget<T>(
  bill: { x: number; y: number; z: number; facing: number },
  candidates: readonly Candidate<T>[],
): Candidate<T> | null {
  const fx = Math.sin(bill.facing);
  const fz = Math.cos(bill.facing);
  let best: Candidate<T> | null = null;
  let bestScore = Infinity;
  for (const c of candidates) {
    if (c.y !== undefined && Math.abs(c.y - bill.y) > 1.2) continue;
    const dx = c.x - bill.x;
    const dz = c.z - bill.z;
    const d = Math.hypot(dx, dz);
    if (d > c.reach) continue;
    // cosine of the angle between facing and the item: 1 ahead, -1 behind
    const cos = d > 1e-4 ? (dx * fx + dz * fz) / d : 1;
    // things behind him cost up to 2.5x their distance; right in front costs 1x
    const score = d * (1 + 0.75 * (1 - cos));
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

/** The whole site: Bill's estate, the street out front, the Route (laneway, lot, corner store, gym) and Big Wanda's Junkyard. */
export const SITE = { x0: -14, x1: 64, z0: -35, z1: 25 };

/** Where Bill can actually walk (the rest is scenery at the diorama's edge). */
export const WALKABLE = { x0: -12.6, x1: 62.6, z0: -27, z1: 23.2 };

export const inRect = (p: { x: number; z: number }, r: Rect, m = 0) => p.x > r.x0 - m && p.x < r.x1 + m && p.z > r.z0 - m && p.z < r.z1 + m;

/**
 * How far behind a building (along the camera ray) Bill can stand before the view ray from his
 * chest clears a roof of this height: past that he's visible over it, so the roof can stay on.
 */
export const roofReach = (top: number) => Math.max(0, (top - 1.2) / (Math.tan((32 * Math.PI) / 180) * Math.SQRT2));

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

/**
 * Does the building footprint sit between Bill and the camera? The camera looks from +X+Z
 * (dir 1) or, in his front yard, from -X-Z (dir -1), so follow the ray from Bill toward it
 * and see whether it crosses the footprint.
 */
export function occludes(bill: { x: number; z: number }, r: Rect, reach = 12, dir: 1 | -1 = 1) {
  if (inRect(bill, r)) return false;
  // mirror everything for the reversed camera, then it's the same test
  const bx = bill.x * dir, bz = bill.z * dir;
  const x0 = dir > 0 ? r.x0 : -r.x1, x1 = dir > 0 ? r.x1 : -r.x0, z0 = dir > 0 ? r.z0 : -r.z1, z1 = dir > 0 ? r.z1 : -r.z0;
  const lo = Math.max(x0 - bx, z0 - bz), hi = Math.min(x1 - bx, z1 - bz);
  return lo <= hi && hi >= 0 && lo < reach;
}

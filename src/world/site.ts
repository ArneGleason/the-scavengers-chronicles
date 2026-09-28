/** The whole walkable site: Bill's estate plus the Route (laneway, lot, corner store, gym). */
export const SITE = { x0: -14, x1: 41, z0: -17, z1: 25 };

/** Where Bill can actually walk (the rest is scenery at the diorama's edge). */
export const WALKABLE = { x0: -12.6, x1: 39.6, z0: -9.6, z1: 23.2 };

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

/**
 * Does the building footprint sit between Bill and the camera? The camera looks from +X+Z,
 * so follow the ray from Bill in that direction and see whether it crosses the footprint.
 */
export function occludes(bill: { x: number; z: number }, r: Rect, reach = 12) {
  if (bill.x > r.x0 && bill.x < r.x1 && bill.z > r.z0 && bill.z < r.z1) return false;
  const lo = Math.max(r.x0 - bill.x, r.z0 - bill.z), hi = Math.min(r.x1 - bill.x, r.z1 - bill.z);
  return lo <= hi && hi >= 0 && lo < reach;
}

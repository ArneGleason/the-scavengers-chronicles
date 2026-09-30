/**
 * Wayfinding (pure, unit-tested): the objective arrow shouldn't point through walls, fences or
 * floors. The world is a handful of regions joined by portals (doors, gates, the stairs); to get
 * from Bill to a goal in another region, the arrow points at the first portal on the shortest way.
 */
export interface P3 { x: number; y: number; z: number }
export type Region = "basement" | "house" | "yard" | "junkyard" | "gym" | "store" | "outside";

interface Box { x0: number; x1: number; z0: number; z1: number }
const inBox = (p: P3, b: Box) => p.x > b.x0 && p.x < b.x1 && p.z > b.z0 && p.z < b.z1;

/** The regions, most specific first. (Numbers match world/: estate, street, route, junkyard.) */
const HOUSE: Box = { x0: -6, x1: 6, z0: -5, z1: 5 };
const YARD: Box = { x0: -11, x1: 11, z0: -11, z1: 15 };
const JUNKYARD: Box = { x0: 43, x1: 64, z0: -5, z1: 15 };
const GYM: Box = { x0: 32, x1: 40, z0: -5.2, z1: 10 };
const STORE: Box = { x0: 22, x1: 31, z0: -5.2, z1: 9.5 };

export function regionOf(p: P3): Region {
  if (p.y < -1) return "basement";
  if (inBox(p, HOUSE)) return "house";
  if (inBox(p, YARD)) return "yard";
  if (inBox(p, JUNKYARD)) return "junkyard";
  if (inBox(p, GYM)) return "gym";
  if (inBox(p, STORE)) return "store";
  return "outside";
}

export interface Portal {
  label: string;
  a: Region;
  b: Region;
  /** A point just on each side of the doorway. */
  pa: P3;
  pb: P3;
}

export const PORTALS: Portal[] = [
  { label: "STAIRS", a: "house", b: "basement", pa: { x: 4.9, y: 0, z: -3.7 }, pb: { x: 0.2, y: -2.6, z: -3.7 } },
  { label: "BACK DOOR", a: "house", b: "yard", pa: { x: -3.6, y: 0, z: 4.4 }, pb: { x: -3.6, y: 0, z: 5.7 } },
  { label: "FRONT DOOR", a: "house", b: "yard", pa: { x: -0.7, y: 0, z: -4.4 }, pb: { x: -0.7, y: 0, z: -5.8 } },
  { label: "BACK GATE", a: "yard", b: "outside", pa: { x: 0, y: 0, z: 14.3 }, pb: { x: 0, y: 0, z: 15.9 } },
  { label: "FRONT GATE", a: "yard", b: "outside", pa: { x: -0.7, y: 0, z: -10.3 }, pb: { x: -0.7, y: 0, z: -11.8 } },
  { label: "JUNKYARD GATE", a: "junkyard", b: "outside", pa: { x: 48, y: 0, z: 14.2 }, pb: { x: 48, y: 0, z: 16.0 } },
  { label: "GYM DOOR", a: "gym", b: "outside", pa: { x: 35.4, y: 0, z: 9.2 }, pb: { x: 35.4, y: 0, z: 10.9 } },
  { label: "STORE DOOR", a: "store", b: "outside", pa: { x: 27.95, y: 0, z: 8.7 }, pb: { x: 27.95, y: 0, z: 10.3 } },
  { label: "STORE DOOR", a: "store", b: "outside", pa: { x: 25.5, y: 0, z: -4.4 }, pb: { x: 25.5, y: 0, z: -6.0 } },
];

const dist = (a: P3, b: P3) => Math.hypot(a.x - b.x, (a.y - b.y) * 2, a.z - b.z);

/**
 * Where the arrow should point: the goal itself when it's in Bill's region, otherwise the near
 * side of the first portal on the shortest route (Dijkstra over portal sides).
 */
export function nextWaypoint(from: P3, goal: P3): { at: P3; label: string } | null {
  const r0 = regionOf(from), rg = regionOf(goal);
  if (r0 === rg) return null;
  // nodes: each portal side; node i*2 is side a, i*2+1 is side b
  const n = PORTALS.length * 2;
  const node = (i: number) => (i % 2 ? PORTALS[i >> 1].pb : PORTALS[i >> 1].pa);
  const reg = (i: number) => (i % 2 ? PORTALS[i >> 1].b : PORTALS[i >> 1].a);
  const best = new Array<number>(n).fill(Infinity), prev = new Array<number>(n).fill(-1), done = new Array<boolean>(n).fill(false);
  for (let i = 0; i < n; i++) if (reg(i) === r0) best[i] = dist(from, node(i));
  let end = -1, endCost = Infinity;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && best[i] < Infinity && (u < 0 || best[i] < best[u])) u = i;
    if (u < 0) break;
    done[u] = true;
    // crossing the portal to its other side
    const v = u ^ 1;
    const through = best[u] + dist(node(u), node(v));
    if (through < best[v]) { best[v] = through; prev[v] = u; }
    // arrived at the goal's region?
    if (reg(u) === rg) {
      const c = best[u] + dist(node(u), goal);
      if (c < endCost) { endCost = c; end = u; }
    }
    // walking within a region to another portal side there
    for (let w = 0; w < n; w++) {
      if (done[w] || w === v || reg(w) !== reg(u)) continue;
      const c = best[u] + dist(node(u), node(w));
      if (c < best[w]) { best[w] = c; prev[w] = u; }
    }
  }
  if (end < 0) return null;
  // walk back to the first portal side entered from Bill's region
  let first = end;
  while (prev[first] >= 0) first = prev[first];
  return { at: node(first), label: PORTALS[first >> 1].label };
}

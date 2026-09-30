import * as THREE from "three/webgpu";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Physics } from "./physics";
import { addInkNormal } from "../render/ink";
import { toonShared } from "../render/comicMaterial";
import { damp } from "../core/math";
import type { Surface } from "../content/items";

/** Visibility groups the cutaway controller toggles. */
export type Tag = "ground" | "basement" | "outdoors" | "roof";

type V3t = [number, number, number];

/** Give a box geometry world-scale UVs so tiled textures (checker lino, planks) keep their size. */
function worldUV(g: THREE.BufferGeometry, tile: number) {
  const p = g.getAttribute("position"), n = g.getAttribute("normal"), uv = g.getAttribute("uv");
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (ay > 0.5) uv.setXY(i, x / tile, z / tile);
    else if (ax > 0.5) uv.setXY(i, z / tile, y / tile);
    else uv.setXY(i, x / tile, y / tile);
  }
  return g;
}

/**
 * Collects static geometry and merges it into one mesh per (material, tag), so a whole
 * furnished floor costs a handful of draw calls instead of hundreds.
 */
export class StaticBuilder {
  private buckets = new Map<string, { mat: THREE.Material; tag: Tag; geos: THREE.BufferGeometry[] }>();
  readonly groups: Record<Tag, THREE.Group> = { ground: new THREE.Group(), basement: new THREE.Group(), outdoors: new THREE.Group(), roof: new THREE.Group() };

  constructor(scene: THREE.Scene, readonly phys: Physics) {
    for (const [k, g] of Object.entries(this.groups)) { g.name = k; scene.add(g); }
  }

  /** Axis-aligned box from min to max corners. */
  box(min: V3t, max: V3t, mat: THREE.Material | string, tag: Tag, o: { collide?: boolean; tile?: number; ink?: number } = {}) {
    const sx = max[0] - min[0], sy = max[1] - min[1], sz = max[2] - min[2];
    const g = new THREE.BoxGeometry(sx, sy, sz).translate(min[0] + sx / 2, min[1] + sy / 2, min[2] + sz / 2);
    if (o.tile) worldUV(g, o.tile);
    this.add(g, mat, tag, o.ink);
    if (o.collide !== false) this.phys.box(min, max);
  }

  /** Any geometry, transformed by position/rotation/scale before merging. */
  geo(g: THREE.BufferGeometry, mat: THREE.Material | string, tag: Tag, at: V3t = [0, 0, 0], rot: V3t = [0, 0, 0], scale: V3t = [1, 1, 1], ink?: number) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(...at), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...scale));
    this.add(g.clone().applyMatrix4(m), mat, tag, ink);
  }

  private add(g: THREE.BufferGeometry, mat: THREE.Material | string, tag: Tag, ink?: number) {
    const material = typeof mat === "string" ? toonShared(mat, ink ?? 0.75) : mat;
    if (g.index) g = g.toNonIndexed();
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
    addInkNormal(g);
    const key = `${material.uuid}|${tag}`;
    let b = this.buckets.get(key);
    if (!b) this.buckets.set(key, (b = { mat: material, tag, geos: [] }));
    b.geos.push(g);
  }

  finish() {
    for (const b of this.buckets.values()) {
      const merged = mergeGeometries(b.geos, false);
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, b.mat);
      this.groups[b.tag].add(mesh);
    }
    this.buckets.clear();
  }
}

/* ---------------- walls with cutaways ---------------- */

export interface Opening {
  from: number;
  to: number;
  kind: "door" | "window";
}

interface WallPiece {
  mesh: THREE.Mesh;
  /** Height of the piece's bottom above the wall base. */
  lift: number;
  height: number;
}

interface WallLine {
  /** The building footprint this wall belongs to: inside it, its camera-side walls drop. */
  owner?: { x0: number; x1: number; z0: number; z1: number };
  axis: "x" | "z";
  /** Fixed coordinate (z for an x-running wall, x for a z-running wall). */
  at: number;
  from: number;
  to: number;
  base: number;
  height: number;
  level: "ground" | "basement";
  pieces: WallPiece[];
  cut: number;
}

const STUB = 0.42;
/** How much the view ray toward the camera climbs per metre along one axis (32 degree pitch, 45 degree yaw). */
export const RAY_CLIMB = Math.tan((32 * Math.PI) / 180) * Math.SQRT2;

/**
 * Walls between Bill and the camera drop to capped stubs (a dollhouse cutaway). The camera
 * normally looks from +X+Z (dir 1), and turns round to look from -X-Z (dir -1) in his front
 * yard; a wall occludes Bill when it lies on his camera side and the view ray toward the
 * camera crosses it. Inside a building, all of that building's camera-side walls drop, and
 * only that building's.
 */
export class Walls {
  readonly lines: WallLine[] = [];
  readonly root = new THREE.Group();

  constructor(scene: THREE.Scene, private phys: Physics) {
    this.root.name = "walls";
    scene.add(this.root);
  }

  add(axis: "x" | "z", at: number, from: number, to: number, o: { base: number; height: number; level: "ground" | "basement"; color: string; openings?: Opening[]; thick?: number; owner?: WallLine["owner"] }) {
    const t = o.thick ?? 0.15;
    const line: WallLine = { owner: o.owner, axis, at, from, to, base: o.base, height: o.height, level: o.level, pieces: [], cut: 0 };
    const openings = [...(o.openings ?? [])].sort((a, b) => a.from - b.from);
    const segs: { a: number; b: number; lift: number; h: number }[] = [];
    let cur = from;
    for (const op of openings) {
      if (op.from > cur) segs.push({ a: cur, b: op.from, lift: 0, h: o.height });
      if (op.kind === "door") segs.push({ a: op.from, b: op.to, lift: 2.1, h: o.height - 2.1 });
      else {
        segs.push({ a: op.from, b: op.to, lift: 0, h: 0.9 });
        segs.push({ a: op.from, b: op.to, lift: 2.0, h: o.height - 2.0 });
      }
      cur = op.to;
    }
    if (cur < to) segs.push({ a: cur, b: to, lift: 0, h: o.height });
    const mat = toonShared(o.color, 0.8);
    for (const s of segs) {
      const len = s.b - s.a;
      const g = axis === "x" ? new THREE.BoxGeometry(len, s.h, t) : new THREE.BoxGeometry(t, s.h, len);
      g.translate(0, s.h / 2, 0); // origin at the bottom, so scaling y shrinks it downward
      addInkNormal(g);
      const m = new THREE.Mesh(g, mat);
      const mid = (s.a + s.b) / 2;
      if (axis === "x") m.position.set(mid, o.base + s.lift, at);
      else m.position.set(at, o.base + s.lift, mid);
      this.root.add(m);
      line.pieces.push({ mesh: m, lift: s.lift, height: s.h });
      const y0 = o.base + s.lift, y1 = y0 + s.h;
      if (axis === "x") this.phys.box([s.a, y0, at - t / 2], [s.b, y1, at + t / 2]);
      else this.phys.box([at - t / 2, y0, s.a], [at + t / 2, y1, s.b]);
    }
    this.lines.push(line);
  }

  /**
   * @param bill Bill's feet position
   * @param mode which floor is being viewed
   * @param dir 1 when the camera looks from +X+Z, -1 when it looks from -X-Z
   */
  update(bill: THREE.Vector3, mode: "ground" | "basement", dir: 1 | -1, dt: number) {
    for (const L of this.lines) {
      let target = 0;
      const visibleLevel = L.level === mode;
      if (visibleLevel) {
        // how far the wall lies from Bill toward the camera
        const along = ((L.axis === "x" ? L.at - bill.z : L.at - bill.x) * dir);
        if (along > 0.05) {
          const o = L.owner, m = 0.05;
          const inside = !!o && bill.x > o.x0 - m && bill.x < o.x1 + m && bill.z > o.z0 - m && bill.z < o.z1 + m;
          if (inside) target = 1;
          else {
            // Follow the view ray from Bill's chest toward the camera. The camera is on a diagonal
            // and pitched down, so the ray climbs as it goes; only drop the wall if the ray still
            // meets it below the top (otherwise he's plainly visible over it).
            const cross = (L.axis === "x" ? bill.x : bill.z) + along * dir;
            const rayY = bill.y + 1.2 + along * RAY_CLIMB;
            target = rayY < L.base + L.height && cross > L.from - 1.2 && cross < L.to + 1.2 ? 1 : 0;
          }
        }
      }
      L.cut = damp(L.cut, target, 14, dt);
      for (const p of L.pieces) {
        p.mesh.visible = visibleLevel && !(p.lift >= STUB && L.cut > 0.5);
        if (p.lift < STUB) {
          const stubScale = Math.min(1, (STUB - p.lift) / p.height);
          p.mesh.scale.y = 1 + (stubScale - 1) * L.cut;
        }
      }
    }
  }
}

/* ---------------- surfaces (for footsteps) ---------------- */
export interface SurfaceRect { x0: number; x1: number; z0: number; z1: number; y0: number; y1: number; surface: Surface }
export class Surfaces {
  private rects: SurfaceRect[] = [];
  add(r: SurfaceRect) { this.rects.push(r); }
  at(p: THREE.Vector3, fallback: Surface = "grass"): Surface {
    for (const r of this.rects) if (p.x >= r.x0 && p.x <= r.x1 && p.z >= r.z0 && p.z <= r.z1 && p.y >= r.y0 && p.y <= r.y1) return r.surface;
    return fallback;
  }
}

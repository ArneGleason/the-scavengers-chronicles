import * as THREE from "three/webgpu";
import type RAPIER from "@dimforge/rapier3d-compat";
import type { Physics } from "./physics";
import { ITEMS, type ItemId } from "../content/items";
import { P } from "../content/palette";
import { toon, canvasTex, flat, blobTexture } from "../render/comicMaterial";
import { ensureInkNormals } from "../render/ink";
import { clamp, smoothstep } from "../core/math";

type State = "world" | "flying" | "satchel" | "hands" | "installed";

export interface WorldItem {
  id: ItemId;
  obj: THREE.Group;
  /** Visual pivot inside obj (bounces when highlighted). */
  visual: THREE.Group;
  half: [number, number, number];
  body: RAPIER.RigidBody | null;
  state: State;
  mats: THREE.MeshToonNodeMaterial[];
  flight?: { from: THREE.Vector3; t: number; dur: number; to: "satchel" | "hands" | "install"; dest?: THREE.Vector3; rotY?: number };
}

const cutTex = canvasTex(128, 128, (g, w) => {
  g.fillStyle = P.cut; g.fillRect(0, 0, w, w); g.strokeStyle = "#b98a58"; g.lineWidth = 2;
  for (let r = 6; r < 62; r += 6 + Math.sin(r) * 2) { g.beginPath(); g.ellipse(64, 64, r, r * 0.95, 0.2, 0, 7); g.stroke(); }
  g.strokeStyle = "#8a5f38"; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 61, 0, 7); g.stroke();
});
const barkTex = canvasTex(64, 32, (g) => {
  g.fillStyle = P.bark; g.fillRect(0, 0, 64, 32); g.fillStyle = "#4a3220";
  for (let i = 0; i < 12; i++) { const x = (i * 5.3 + (i % 3) * 1.7) % 64; g.fillRect(x, (i * 7) % 12, 1.6, 20 + (i % 4) * 4); }
}, { nearest: true, repeat: true });

/** Procedural greybox models, each centred on its collider. Returns the group and collider half-extents. */
function makeModel(id: ItemId): { g: THREE.Group; half: [number, number, number]; mats: THREE.MeshToonNodeMaterial[] } {
  const g = new THREE.Group();
  const mats: THREE.MeshToonNodeMaterial[] = [];
  const m = (c: string, o: Parameters<typeof toon>[1] = {}) => { const x = toon(c, { ink: 1.15, ...o }); mats.push(x); return x; };
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, p: number[] = [0, 0, 0], r: number[] = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geo, mat); mesh.position.set(p[0], p[1], p[2]); mesh.rotation.set(r[0], r[1], r[2]); g.add(mesh); return mesh;
  };
  const def = ITEMS[id];
  switch (id) {
    case "dinCable": {
      const c = m(def.color);
      add(new THREE.TorusGeometry(0.12, 0.022, 8, 24), c, [0, 0, 0], [Math.PI / 2, 0, 0]);
      add(new THREE.TorusGeometry(0.09, 0.02, 8, 24), c, [0.02, 0.035, 0], [Math.PI / 2, 0, 0.4]);
      const plug = m(def.accent);
      add(new THREE.CylinderGeometry(0.025, 0.025, 0.07, 12), plug, [0.15, 0.01, 0.05], [0, 0, Math.PI / 2]);
      add(new THREE.CylinderGeometry(0.025, 0.025, 0.07, 12), plug, [-0.1, 0.02, 0.13], [Math.PI / 2, 0, 0]);
      return { g, half: [0.15, 0.04, 0.15], mats };
    }
    case "powerBrick": {
      add(new THREE.BoxGeometry(0.2, 0.08, 0.12), m(def.color));
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 4), flat(def.accent)); led.position.set(0.07, 0.041, 0.03); g.add(led);
      add(new THREE.TorusGeometry(0.07, 0.012, 6, 16), m("#222"), [-0.14, -0.02, 0], [Math.PI / 2, 0, 0]);
      return { g, half: [0.14, 0.045, 0.08], mats };
    }
    case "cableBundle": {
      const c = m(def.color), tape = m(def.accent);
      for (let i = 0; i < 3; i++) add(new THREE.TorusGeometry(0.14 - i * 0.025, 0.028, 8, 22), c, [0, i * 0.045, 0], [Math.PI / 2, 0, i * 0.5]);
      add(new THREE.BoxGeometry(0.05, 0.13, 0.07), tape, [0.12, 0.05, 0]);
      return { g, half: [0.17, 0.07, 0.17], mats };
    }
    case "speakAndSpell": {
      add(new THREE.BoxGeometry(0.34, 0.06, 0.24), m(def.color));
      add(new THREE.BoxGeometry(0.28, 0.012, 0.1), m(def.accent), [0, 0.035, 0.04]);
      add(new THREE.BoxGeometry(0.2, 0.012, 0.04), m("#2f3a33"), [0, 0.035, -0.07]);
      add(new THREE.TorusGeometry(0.05, 0.012, 6, 14, Math.PI), m(def.color), [0, 0.0, -0.13], [0, 0, 0]);
      return { g, half: [0.17, 0.035, 0.13], mats };
    }
    case "newspaperBundle": {
      const paper = m(def.color);
      for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.4, 0.045, 0.3), paper, [((i * 7) % 3 - 1) * 0.01, -0.09 + i * 0.045, ((i * 5) % 3 - 1) * 0.01]);
      const string = m("#6b4a2e", { ink: 0.5 });
      add(new THREE.BoxGeometry(0.42, 0.24, 0.015), string, [0, 0, 0]);
      add(new THREE.BoxGeometry(0.015, 0.24, 0.32), string, [0, 0, 0]);
      return { g, half: [0.2, 0.115, 0.15], mats };
    }
    case "personalityStump": {
      const bark = m("#fff", { map: barkTex });
      const pts = [[0.001, -0.14], [0.19, -0.14], [0.2, -0.125], [0.17, -0.095], [0.155, -0.055], [0.15, 0.04], [0.153, 0.115], [0.148, 0.126], [0.001, 0.126]].map(([r, y]) => new THREE.Vector2(r, y));
      const lathe = new THREE.LatheGeometry(pts, 28);
      const uv = lathe.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i));
      add(lathe, bark);
      add(new THREE.CircleGeometry(0.146, 28), m("#fff", { map: cutTex }), [0, 0.1268, 0], [-Math.PI / 2, 0, 0]);
      for (let i = 0; i < 5; i++) {
        const a = i * 1.37 + 0.4;
        const nub = add(new THREE.SphereGeometry(1, 12, 8), bark, [Math.sin(a) * 0.2, -0.11, Math.cos(a) * 0.2], [0.35, a, 0]);
        nub.scale.set(0.035, 0.03, 0.075);
      }
      return { g, half: [0.2, 0.135, 0.2], mats };
    }
    case "rustyGrate":
    case "grateShelf": {
      // a heavy floor grate: a frame and a grid of bars, rust everywhere
      const rust = m(def.color), dark = m("#5e4636", { ink: 0.8 });
      for (const z of [-0.29, 0.29]) add(new THREE.BoxGeometry(0.9, 0.05, 0.04), rust, [0, 0, z]);
      for (const x of [-0.43, 0.43]) add(new THREE.BoxGeometry(0.04, 0.05, 0.6), rust, [x, 0, 0]);
      for (let i = 1; i < 8; i++) add(new THREE.BoxGeometry(0.025, 0.04, 0.56), dark, [-0.45 + i * 0.1125, 0, 0]);
      for (const z of [-0.1, 0.1]) add(new THREE.BoxGeometry(0.86, 0.035, 0.025), dark, [0, 0.005, z]);
      if (id === "grateShelf") {
        // two chrome brackets and a price tag: now it's mid-century
        const chrome = m("#c9ced1");
        for (const x of [-0.3, 0.3]) { add(new THREE.BoxGeometry(0.04, 0.2, 0.04), chrome, [x, -0.12, -0.26]); add(new THREE.BoxGeometry(0.04, 0.04, 0.3), chrome, [x, -0.2, -0.12]); }
        add(new THREE.BoxGeometry(0.1, 0.06, 0.005), m(def.accent), [0.36, -0.04, 0.31], [0, 0, 0.3]);
      }
      return { g, half: [0.45, 0.03, 0.3], mats };
    }
    case "complaint": {
      // four pages, stapled, with a red LEGAL stamp
      add(new THREE.BoxGeometry(0.22, 0.02, 0.29), m(def.color));
      add(new THREE.BoxGeometry(0.2, 0.004, 0.02), m("#1e1a18", { ink: 0 }), [0, 0.012, -0.1]);
      for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.16 - (i % 2) * 0.03, 0.004, 0.01), m("#8a8274", { ink: 0 }), [-0.01, 0.012, -0.05 + i * 0.035]);
      add(new THREE.CylinderGeometry(0.035, 0.035, 0.006, 14), m(def.accent), [0.06, 0.013, 0.09]);
      return { g, half: [0.11, 0.015, 0.145], mats };
    }
    case "parcels": {
      // three boxes, stacked, taped, addressed to someone else
      const card = m(def.color), tape = m(def.accent), label = m("#fbf6ec");
      add(new THREE.BoxGeometry(0.5, 0.26, 0.4), card, [0, -0.17, 0]);
      add(new THREE.BoxGeometry(0.4, 0.2, 0.34), card, [0.03, 0.06, 0.01], [0, 0.25, 0]);
      add(new THREE.BoxGeometry(0.26, 0.14, 0.22), card, [-0.02, 0.23, 0], [0, -0.3, 0]);
      add(new THREE.BoxGeometry(0.51, 0.01, 0.08), tape, [0, -0.04, 0]);
      add(new THREE.BoxGeometry(0.14, 0.09, 0.005), label, [0.1, -0.16, 0.203]);
      return { g, half: [0.25, 0.3, 0.2], mats };
    }
    case "manuscript": {
      // a lined notepad, one page filled in, bristling with sticky notes
      add(new THREE.BoxGeometry(0.22, 0.03, 0.3), m(def.color));
      for (let i = 0; i < 7; i++) add(new THREE.BoxGeometry(0.18, 0.002, 0.006), m("#8fb0b5", { ink: 0 }), [0, 0.016, -0.11 + i * 0.035]);
      add(new THREE.BoxGeometry(0.22, 0.008, 0.03), m("#c8312d", { ink: 0.3 }), [0, 0.018, -0.14]);
      const note = m(def.accent, { ink: 0.3 });
      for (const [x, z, r] of [[0.1, 0.1, 0.4], [-0.09, 0.12, -0.3], [0.12, -0.05, 0.9], [-0.11, -0.08, -0.7], [0.02, 0.15, 0.1]] as const) add(new THREE.BoxGeometry(0.07, 0.004, 0.07), note, [x, 0.02, z], [0, r, 0]);
      return { g, half: [0.11, 0.02, 0.15], mats };
    }
    case "movieIdeas": {
      // a brick of sticky notes, with the top ones curling
      add(new THREE.BoxGeometry(0.16, 0.12, 0.16), m(def.color));
      add(new THREE.BoxGeometry(0.16, 0.004, 0.16), m("#e8b23a"), [0.01, 0.063, 0.01], [0.15, 0.2, 0.05]);
      add(new THREE.BoxGeometry(0.14, 0.004, 0.14), m("#f7e27a"), [-0.03, 0.08, 0.02], [-0.25, -0.4, 0.1]);
      return { g, half: [0.08, 0.07, 0.08], mats };
    }
  }
}

function junkModel(kind: "box" | "crate" | "bucket"): { g: THREE.Group; half: [number, number, number]; mass: number } {
  const g = new THREE.Group();
  if (kind === "box") {
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.46), toon("#c79a62", { ink: 0.9 })));
    const tape = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.01, 0.1), toon("#e0c28a", { ink: 0.4 })); tape.position.y = 0.23; g.add(tape);
    return { g, half: [0.23, 0.23, 0.23], mass: 3 };
  }
  if (kind === "crate") {
    const wood = toon("#b88a58", { ink: 0.9 });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.45), wood));
    for (const y of [-0.15, 0.15]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.47), toon("#8d6440", { ink: 0.5 })); s.position.y = y; g.add(s); }
    return { g, half: [0.3, 0.275, 0.225], mass: 6 };
  }
  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.32, 16, 1, true), toon("#7f9aa3", { ink: 0.9, side: THREE.DoubleSide }));
  g.add(bucket);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), toon("#6d868f")); bottom.rotation.x = -Math.PI / 2; bottom.position.y = -0.16; g.add(bottom);
  return { g, half: [0.16, 0.16, 0.16], mass: 1.5 };
}

const HANDS_OFFSET: Partial<Record<ItemId, number>> = { personalityStump: 0.158, rustyGrate: 0.3, grateShelf: 0.3, parcels: 0.25 };

export class Items {
  readonly list: WorldItem[] = [];
  private shadows: THREE.Mesh[] = [];
  private junk: THREE.Object3D[] = [];
  private shadowGeo = new THREE.PlaneGeometry(1, 1);
  private shadowMat = flat("#2c4543", { map: blobTexture, transparent: true, depthWrite: false, opacity: 0.22 });

  constructor(private scene: THREE.Scene, private phys: Physics) {}

  spawn(id: ItemId, at: THREE.Vector3) {
    const { g, half, mats } = makeModel(id);
    const obj = new THREE.Group();
    const visual = new THREE.Group();
    visual.add(g);
    obj.add(visual);
    ensureInkNormals(obj);
    obj.position.copy(at);
    this.scene.add(obj);
    const it: WorldItem = { id, obj, visual, half, body: null, state: "world", mats };
    it.body = this.phys.dynamicBox(obj, half, ITEMS[id].mass, at);
    this.list.push(it);
    return it;
  }

  /** Loose junk with physics; `vel` launches it (a geyser of archive, a fridge avalanche). */
  spawnJunk(kind: "box" | "crate" | "bucket", at: THREE.Vector3, vel?: THREE.Vector3) {
    const { g, half, mass } = junkModel(kind);
    ensureInkNormals(g);
    g.position.copy(at);
    this.scene.add(g);
    const body = this.phys.dynamicBox(g, half, mass, at);
    if (vel) {
      body.setLinvel({ x: vel.x, y: vel.y, z: vel.z }, true);
      body.setAngvel({ x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8, z: (Math.random() - 0.5) * 8 }, true);
    }
    this.junk.push(g);
    const sh = new THREE.Mesh(this.shadowGeo, this.shadowMat);
    sh.rotation.x = -Math.PI / 2;
    sh.scale.set(half[0] * 3, half[2] * 3, 1);
    sh.renderOrder = -1;
    sh.userData.follow = g;
    sh.userData.lift = half[1];
    this.scene.add(sh);
    this.shadows.push(sh);
  }

  /** Hide loose junk (and its shadow) that sits on a floor the camera isn't showing. */
  setJunkVisibility(visible: (y: number) => boolean) {
    for (const j of this.junk) j.visible = visible(j.position.y);
    for (const sh of this.shadows) sh.visible = (sh.userData.follow as THREE.Object3D).visible;
  }

  /** Start the pickup: the item hops, then arcs into the satchel or Bill's hands. */
  beginPickup(it: WorldItem, to: "satchel" | "hands") {
    if (it.body) { this.phys.remove(it.body); it.body = null; }
    it.state = "flying";
    it.flight = { from: it.obj.position.clone(), t: 0, dur: to === "hands" ? 0.3 : 0.42, to };
    it.obj.quaternion.identity();
  }

  /**
   * Deliver: the item leaves the satchel or Bill's hands and arcs to its place in the house,
   * where it stays for good ("the house keeps score").
   */
  beginInstall(it: WorldItem, from: THREE.Vector3, dest: THREE.Vector3, rotY = 0) {
    if (it.state === "hands") this.scene.attach(it.obj);
    it.obj.visible = true;
    it.obj.scale.setScalar(1);
    it.obj.quaternion.identity();
    it.state = "flying";
    it.flight = { from: from.clone(), t: 0, dur: 0.6, to: "install", dest: dest.clone(), rotY };
  }

  /**
   * Advance flights. `satchel` is where small finds disappear; `carry` is the hands anchor.
   * Returns items that just arrived.
   */
  update(dt: number, t: number, satchel: THREE.Vector3, carry: THREE.Object3D, target: WorldItem | null) {
    const arrived: WorldItem[] = [];
    for (const it of this.list) {
      if (it.state === "flying" && it.flight) {
        const f = it.flight;
        f.t += dt / f.dur;
        const k = clamp(f.t, 0, 1);
        const dest = f.to === "hands" ? carry.getWorldPosition(_v) : f.to === "install" ? f.dest! : satchel;
        // hop, then arc (ease-in) to the destination
        const e = k * k;
        it.obj.position.lerpVectors(f.from, dest, e);
        it.obj.position.y += Math.sin(Math.PI * Math.min(1, k * 1.2)) * (f.to === "install" ? 0.9 : 0.45) * (1 - k);
        if (f.to === "install") it.obj.rotation.y = (f.rotY ?? 0) * k + (1 - k) * 4 * k;
        const s = f.to === "satchel" ? 1 - 0.75 * smoothstep(0.55, 1, k) : 1;
        it.obj.scale.setScalar(s);
        if (k >= 1) {
          it.flight = undefined;
          if (f.to === "install") {
            it.state = "installed";
            it.obj.position.copy(f.dest!);
            it.obj.rotation.set(0, f.rotY ?? 0, 0);
          } else if (f.to === "hands") {
            it.state = "hands";
            carry.add(it.obj);
            it.obj.position.set(0, 0, 0);
            it.obj.scale.setScalar(1);
          } else {
            it.state = "satchel";
            it.obj.visible = false;
          }
          arrived.push(it);
        }
      }
      // highlight: the one Bill is looking at bounces and glows salvage-gold
      const hl = it === target && it.state === "world";
      it.visual.position.y = hl ? Math.abs(Math.sin(t * 5)) * 0.05 : 0;
      const glow = hl ? 0.25 + 0.15 * Math.sin(t * 6) : 0;
      for (const mat of it.mats) mat.emissive.setRGB(0.95 * glow, 0.71 * glow, 0.2 * glow);
    }
    for (const sh of this.shadows) {
      const o = sh.userData.follow as THREE.Object3D;
      sh.position.set(o.position.x, o.position.y - (sh.userData.lift as number) + 0.01, o.position.z);
    }
    return arrived;
  }

  /** Take an item out of physics so something else (a tug-of-war, the ground) can hold it. */
  hold(it: WorldItem) {
    if (it.body) { this.phys.remove(it.body); it.body = null; }
  }

  /** Put an item back in the world at a spot and let physics have it again. */
  settle(it: WorldItem, at: THREE.Vector3) {
    this.hold(it);
    it.obj.position.copy(at);
    it.obj.quaternion.identity();
    it.state = "world";
    it.body = this.phys.dynamicBox(it.obj, it.half, ITEMS[it.id].mass, at);
  }

  /** Put an item back into the world in front of Bill. */
  drop(it: WorldItem, at: THREE.Vector3, facing: number, fromHands: boolean) {
    const ahead = fromHands ? 0.45 : 0.55;
    const p = new THREE.Vector3(at.x + Math.sin(facing) * ahead, at.y + (fromHands ? 0.35 : 0.55), at.z + Math.cos(facing) * ahead);
    if (it.state === "hands") this.scene.attach(it.obj);
    it.obj.visible = true;
    it.obj.scale.setScalar(1);
    it.obj.position.copy(p);
    it.state = "world";
    it.body = this.phys.dynamicBox(it.obj, it.half, ITEMS[it.id].mass, p);
    it.body.setLinvel({ x: Math.sin(facing) * 0.8, y: fromHands ? -0.5 : 1.2, z: Math.cos(facing) * 0.8 }, true);
    it.body.setAngvel({ x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 4, z: (Math.random() - 0.5) * 3 }, true);
  }

  gripHalf(id: ItemId) {
    return HANDS_OFFSET[id] ?? 0.16;
  }
}
const _v = new THREE.Vector3();

/**
 * Townies: one configurable primitive-built rig for the neighbourhood's smaller parts (the
 * joggers on "his" sidewalk, the Lug Nutz at the gym, Kevin across the street). No physics:
 * they're placed and walked by main.ts. Same construction as Gary and Wanda.
 */
import * as THREE from "three/webgpu";
import { toon } from "../render/comicMaterial";
import { ensureInkNormals } from "../render/ink";
import { clamp, damp } from "../core/math";
import { blob, limb } from "./bill/billModel";

export interface TownieLook {
  /** Overall scale (1 = about 1.8 m). */
  size?: number;
  /** Chest width multiplier: Lug Nutz are 1.5. */
  bulk?: number;
  skin: string;
  shirt: string;
  pants: string;
  shoes: string;
  hair?: string;
  headband?: string;
  cap?: string;
  /** Bare arms (tank top) or sleeves. */
  bareArms?: boolean;
  beard?: string;
  /** Carry a coffee cup (Kevin), earbuds (joggers). */
  cup?: boolean;
  earbuds?: boolean;
}

export type TownieMode = "idle" | "walk" | "run" | "flex" | "punch" | "skip" | "curl" | "laugh" | "shocked" | "cower";

export class Townie {
  readonly root = new THREE.Group();
  readonly body = new THREE.Group();
  readonly head = new THREE.Group();
  private sh: THREE.Group[] = [];
  private el: THREE.Group[] = [];
  private hips: THREE.Group[] = [];
  private phase = 0;
  mode: TownieMode = "idle";
  speed = 0;
  facing = 0;

  constructor(readonly look: TownieLook) {
    const s = look.size ?? 1, k = look.bulk ?? 1;
    const skin = toon(look.skin, { emissive: "#301008" }), shirt = toon(look.shirt), pants = toon(look.pants), shoes = toon(look.shoes);
    const black = toon("#1e1a18", { ink: 0.3 });
    this.root.add(this.body);
    this.body.position.y = 0.88 * s;
    const torso = new THREE.Mesh(blob(0.19 * k * s, 0.3 * s, 0.14 * k * s, (v) => { if (v.y > 0.4) { v.x *= 1 + 0.2 * (k - 1); } }), shirt);
    torso.position.y = 0.3 * s; this.body.add(torso);
    this.head.position.set(0, 0.72 * s, 0.02); this.body.add(this.head);
    this.head.add(new THREE.Mesh(blob(0.1 * s, 0.12 * s, 0.1 * s), skin));
    const nose = new THREE.Mesh(blob(0.025 * s, 0.028 * s, 0.03 * s), skin); nose.position.set(0, -0.01 * s, 0.1 * s); this.head.add(nose);
    for (const x of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.013 * s, 8, 6), black); e.position.set(0.035 * x * s, 0.03 * s, 0.09 * s); this.head.add(e); }
    if (look.hair) { const h = new THREE.Mesh(blob(0.105 * s, 0.07 * s, 0.105 * s, (v) => { if (v.y < -0.1) v.y = -0.1; }), toon(look.hair)); h.position.y = 0.07 * s; this.head.add(h); }
    if (look.headband) { const hb = new THREE.Mesh(new THREE.TorusGeometry(0.1 * s, 0.018 * s, 6, 18), toon(look.headband, { ink: 0.5 })); hb.rotation.x = Math.PI / 2; hb.position.y = 0.06 * s; this.head.add(hb); }
    if (look.cap) {
      const c = new THREE.Mesh(blob(0.11 * s, 0.06 * s, 0.11 * s, (v) => { if (v.y < 0) v.y = 0; }), toon(look.cap)); c.position.y = 0.07 * s; this.head.add(c);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.14 * s, 0.015 * s, 0.1 * s), toon(look.cap)); brim.position.set(0, 0.07 * s, 0.12 * s); this.head.add(brim);
    }
    if (look.beard) { const b = new THREE.Mesh(blob(0.09 * s, 0.06 * s, 0.06 * s, (v) => { if (v.y > 0) v.y *= 0.4; }), toon(look.beard)); b.position.set(0, -0.07 * s, 0.05 * s); this.head.add(b); }
    if (look.earbuds) for (const x of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.018 * s, 6, 5), toon("#f4f1e6", { ink: 0.3 })); e.position.set(0.1 * x * s, 0, 0); this.head.add(e); }
    for (const x of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(0.2 * k * x * s, 0.52 * s, 0); this.body.add(sh); this.sh.push(sh);
      const upper = new THREE.Mesh(limb(0.28 * s, 0.06 * k * s, 0.05 * k * s), look.bareArms ? skin : shirt); sh.add(upper);
      const el = new THREE.Group(); el.position.y = -0.28 * s; sh.add(el); this.el.push(el);
      el.add(new THREE.Mesh(limb(0.26 * s, 0.048 * k * s, 0.04 * k * s), skin));
      const hand = new THREE.Mesh(blob(0.045 * s, 0.05 * s, 0.045 * s), skin); hand.position.y = -0.28 * s; el.add(hand);
      if (look.cup && x > 0) { const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * s, 0.03 * s, 0.1 * s, 12), toon("#fbf6ec", { ink: 0.6 })); cup.position.set(0, -0.3 * s, 0.05 * s); el.add(cup); }
    }
    for (const x of [-1, 1]) {
      const hip = new THREE.Group(); hip.position.set(0.09 * k * x * s, 0, 0); this.body.add(hip); this.hips.push(hip);
      hip.add(new THREE.Mesh(limb(0.8 * s, 0.07 * s, 0.055 * s), pants));
      const shoe = new THREE.Mesh(blob(0.06 * s, 0.05 * s, 0.12 * s), shoes); shoe.position.set(0, -0.84 * s, 0.04 * s); hip.add(shoe);
    }
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.3 * s * k, 18), new THREE.MeshBasicNodeMaterial({ color: "#2c4543", transparent: true, opacity: 0.25, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; shadow.renderOrder = -1; this.root.add(shadow);
    ensureInkNormals(this.root);
    this.root.traverse((o) => { o.frustumCulled = false; });
  }

  /** Pose for this frame. `speed` drives the leg cycle for walk and run. */
  update(dt: number, t: number) {
    const run = this.mode === "run", moving = this.mode === "walk" || run;
    this.phase += (this.speed * dt) / (run ? 0.42 : 0.32);
    const w = moving ? clamp(this.speed / (run ? 2.5 : 1.1), 0, 1) : 0;
    const swing = Math.sin(this.phase) * (run ? 0.9 : 0.55) * w;
    let hipL = swing, hipR = -swing, armL = -swing * (run ? 1.1 : 0.7), armR = swing * (run ? 1.1 : 0.7), elL = run ? -1.4 : -0.2, elR = elL;
    let spreadL = 0.1, spreadR = -0.1, lean = run ? 0.25 : 0.05, headX = 0, bob = run ? Math.abs(Math.cos(this.phase)) * 0.06 : 0;
    switch (this.mode) {
      case "flex": { // double biceps, pulsing
        const p = 0.5 + 0.5 * Math.sin(t * 5);
        armL = armR = -0.1; spreadL = 1.5; spreadR = -1.5; elL = elR = -2.2 - 0.3 * p; lean = -0.1; headX = -0.15; break;
      }
      case "punch": { // the heavy bag: jab, jab, cross
        const p = (t * 3) % 1, jab = Math.sin(p * Math.PI * 2);
        armL = -1.4 - 0.3 * Math.max(0, jab); armR = -1.2 - 0.3 * Math.max(0, -jab); elL = -0.6 + 0.6 * Math.max(0, jab); elR = -0.6 + 0.6 * Math.max(0, -jab);
        lean = 0.15; hipL = 0.25; hipR = -0.2; break;
      }
      case "skip": { // skipping rope: little hops, wrists turning
        bob = Math.abs(Math.sin(t * 9)) * 0.12; armL = armR = -0.3; spreadL = 0.5; spreadR = -0.5; elL = elR = -0.5 + 0.3 * Math.sin(t * 18); break;
      }
      case "curl": { // dumbbell curls, one arm then the other
        armL = armR = 0; elL = -0.2 - 1.8 * (0.5 + 0.5 * Math.sin(t * 3)); elR = -0.2 - 1.8 * (0.5 + 0.5 * Math.sin(t * 3 + Math.PI)); break;
      }
      case "laugh": { // head back, hands on belly, shaking
        armL = armR = -0.4; elL = elR = -1.6; spreadL = 0.3; spreadR = -0.3; lean = -0.2 + 0.05 * Math.sin(t * 20); headX = -0.4; break;
      }
      case "shocked": { armL = armR = -0.3; spreadL = 1.0; spreadR = -1.0; elL = elR = -0.3; lean = -0.15; headX = -0.2; break; }
      case "cower": { armL = armR = -1.8; elL = elR = -1.8; spreadL = -0.2; spreadR = 0.2; lean = 0.3; headX = 0.3; break; }
    }
    this.body.position.y = 0.88 * (this.look.size ?? 1) + bob;
    this.hips[0].rotation.x = damp(this.hips[0].rotation.x, hipL, 14, dt);
    this.hips[1].rotation.x = damp(this.hips[1].rotation.x, hipR, 14, dt);
    this.sh[0].rotation.set(damp(this.sh[0].rotation.x, armL, 14, dt), 0, damp(this.sh[0].rotation.z, -spreadL, 14, dt));
    this.sh[1].rotation.set(damp(this.sh[1].rotation.x, armR, 14, dt), 0, damp(this.sh[1].rotation.z, -spreadR, 14, dt));
    this.el[0].rotation.x = damp(this.el[0].rotation.x, elL, 14, dt);
    this.el[1].rotation.x = damp(this.el[1].rotation.x, elR, 14, dt);
    this.body.rotation.x = damp(this.body.rotation.x, lean, 8, dt);
    this.head.rotation.x = damp(this.head.rotation.x, headX, 8, dt);
    this.root.rotation.y = this.facing;
  }

  headWorld(out: THREE.Vector3) {
    return this.head.getWorldPosition(out).setY(this.root.position.y + 1.95 * (this.look.size ?? 1));
  }
}

/**
 * Gary the Rummager: a primitive-built rig (hunched, hood up, olive parka, grabby hands, a
 * plastic bag), a kinematic capsule so he walks around fences instead of through them, and
 * the pure brain from game/gary.ts deciding where he wants to go.
 */
import * as THREE from "three/webgpu";
import type RAPIER from "@dimforge/rapier3d-compat";
import type { Physics } from "../world/physics";
import { toon } from "../render/comicMaterial";
import { ensureInkNormals } from "../render/ink";
import { newGary, stepGary, type GaryMode, type GaryState, type GaryWorld } from "../game/gary";
import { SecondOrder, angleDelta, clamp, damp, dampAngle } from "../core/math";
import { blob, limb } from "./bill/billModel";

const PARKA = "#6b6f3a", PARKA_DARK = "#555a2e", SKIN = "#c98f72", BEARD = "#7a6a5c", PANTS = "#45474a", BOOTS = "#4a3524", GLOVE = "#5a5f64";

class GaryRig {
  readonly root = new THREE.Group();
  readonly body = new THREE.Group();
  readonly head = new THREE.Group();
  private sh: THREE.Group[] = [];
  private hips: THREE.Group[] = [];
  private bag = new THREE.Group();
  private bagSpring = new SecondOrder(2.2, 0.25);

  constructor() {
    const parka = toon(PARKA), dark = toon(PARKA_DARK), skin = toon(SKIN, { emissive: "#301008" }), beard = toon(BEARD);
    const pants = toon(PANTS), boots = toon(BOOTS), glove = toon(GLOVE), black = toon("#1e1a18", { ink: 0.3 });
    this.root.add(this.body);
    this.body.position.y = 0.82;
    // torso: a hunched parka lump
    const torso = new THREE.Mesh(blob(0.2, 0.34, 0.18, (v) => { if (v.y > 0.3) v.z -= 0.2 * (v.y - 0.3); }), parka);
    torso.position.set(0, 0.3, 0); this.body.add(torso);
    const hem = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.035, 8, 20), dark); hem.rotation.x = Math.PI / 2; hem.scale.set(1, 0.92, 1); hem.position.y = 0.02; this.body.add(hem);
    // head in a hood
    this.head.position.set(0, 0.64, 0.08); this.body.add(this.head);
    const face = new THREE.Mesh(blob(0.11, 0.13, 0.11), skin); this.head.add(face);
    const nose = new THREE.Mesh(blob(0.03, 0.03, 0.035), skin); nose.position.set(0, 0.0, 0.11); this.head.add(nose);
    const beardM = new THREE.Mesh(blob(0.1, 0.07, 0.07, (v) => { if (v.y > 0) v.y *= 0.4; }), beard); beardM.position.set(0, -0.07, 0.06); this.head.add(beardM);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), black); e.position.set(0.04 * s, 0.035, 0.1); this.head.add(e); }
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.02), toon(BEARD, { ink: 0.4 })); brow.position.set(0, 0.07, 0.1); brow.rotation.x = 0.2; this.head.add(brow);
    const hood = new THREE.Mesh(blob(0.15, 0.16, 0.15, (v) => { if (v.z > 0.35) v.z = 0.35 + (v.z - 0.35) * 0.2; }), parka); hood.position.set(0, 0.03, -0.035); this.head.add(hood);
    // arms: sleeves and big fingerless-gloved hands
    for (const s of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(0.19 * s, 0.52, 0); this.body.add(sh); this.sh.push(sh);
      const sleeve = new THREE.Mesh(limb(0.5, 0.065, 0.055), parka); sh.add(sleeve);
      const hand = new THREE.Mesh(blob(0.05, 0.06, 0.05), glove); hand.position.y = -0.55; sh.add(hand);
      if (s > 0) {
        // the plastic bag, swinging
        this.bag.position.y = -0.58; sh.add(this.bag);
        const b = new THREE.Mesh(blob(0.12, 0.15, 0.08, (v) => { if (v.y > 0.5) { v.x *= 0.5; } }), toon("#e8edf0", { ink: 0.7 }));
        b.position.y = -0.17; this.bag.add(b);
      }
    }
    // legs
    for (const s of [-1, 1]) {
      const hip = new THREE.Group(); hip.position.set(0.09 * s, 0, 0); this.body.add(hip); this.hips.push(hip);
      const leg = new THREE.Mesh(limb(0.72, 0.075, 0.065), pants); hip.add(leg);
      const boot = new THREE.Mesh(blob(0.07, 0.06, 0.13), boots); boot.position.set(0, -0.76, 0.04); hip.add(boot);
    }
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.35, 20), new THREE.MeshBasicNodeMaterial({ color: "#2c4543", transparent: true, opacity: 0.25, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; shadow.renderOrder = -1; this.root.add(shadow);
    ensureInkNormals(this.root);
    this.root.traverse((o) => { o.frustumCulled = false; });
  }

  /** Procedural pose from speed and mode. */
  pose(speed: number, phase: number, mode: GaryMode | "block", t: number, dt: number) {
    const walk = clamp(speed / 1.1, 0, 1);
    const swing = Math.sin(phase) * 0.55 * walk;
    this.hips[0].rotation.x = swing;
    this.hips[1].rotation.x = -swing;
    this.body.position.y = 0.82 - 0.03 * Math.abs(Math.cos(phase)) * walk;
    let lean = 0.28 + 0.08 * walk, armL = -swing * 0.8, armR = swing * 0.8, spreadL = 0.12, spreadR = -0.12, headDown = 0.1;
    if (mode === "guard" && walk < 0.2) {
      // rummaging: reach, grab, reach
      lean = 0.55;
      armL = -0.9 + 0.35 * Math.sin(t * 5);
      armR = -0.9 + 0.35 * Math.sin(t * 5 + 2);
      headDown = 0.35;
    } else if (mode === "decoy" && walk < 0.2) {
      lean = 0.7; armL = armR = -1.1 + 0.15 * Math.sin(t * 7); headDown = 0.45;
    } else if (mode === "sulk") {
      lean = 0.45; armL = armR = 0.05; spreadL = 0.05; spreadR = -0.05; headDown = 0.5;
    } else if (mode === "block") {
      lean = 0.15; armL = armR = -0.3; spreadL = 1.25; spreadR = -1.25; headDown = -0.05;
    } else if (mode === "gag") {
      // doubled over, clutching his throat, head going side to side
      lean = 0.85; armL = armR = -2.2; spreadL = -0.35; spreadR = 0.35; headDown = 0.3;
      this.head.rotation.y = 0.3 * Math.sin(t * 14);
    } else if (mode === "tug") {
      lean = -0.3 + 0.05 * Math.sin(t * 23); armL = armR = -1.45; spreadL = -0.15; spreadR = 0.15; headDown = -0.1;
      this.hips[0].rotation.x = 0.35; this.hips[1].rotation.x = -0.25;
    } else if (mode === "binned") {
      // upside down in the dumpster: only the legs are visible, kicking
      lean = 0; armL = armR = 2.8; headDown = 0;
      this.hips[0].rotation.x = 0.5 * Math.sin(t * 9);
      this.hips[1].rotation.x = 0.5 * Math.sin(t * 9 + Math.PI);
    }
    if (mode !== "gag") this.head.rotation.y = damp(this.head.rotation.y, 0, 8, dt);
    this.body.rotation.x = damp(this.body.rotation.x, lean, 8, dt);
    this.sh[0].rotation.set(damp(this.sh[0].rotation.x, armL, 10, dt), 0, damp(this.sh[0].rotation.z, -spreadL, 10, dt));
    this.sh[1].rotation.set(damp(this.sh[1].rotation.x, armR, 10, dt), 0, damp(this.sh[1].rotation.z, -spreadR, 10, dt));
    this.head.rotation.x = damp(this.head.rotation.x, headDown, 6, dt);
    // the bag lags behind the hand
    const sw = this.bagSpring.step(dt, this.sh[1].rotation.x + speed * 0.25);
    this.bag.rotation.x = clamp(-(sw - this.sh[1].rotation.x), -0.8, 0.8);
  }
}

type Mode = GaryMode | "block";

export class Gary {
  readonly rig = new GaryRig();
  readonly brain: GaryState;
  private body: RAPIER.RigidBody;
  private col: RAPIER.Collider;
  private kcc: RAPIER.KinematicCharacterController;
  readonly pos = new THREE.Vector3();
  private prev = new THREE.Vector3();
  facing = Math.PI;
  private phase = 0;
  speed = 0;
  private blockUntil = 0;
  /** Flight into the dumpster: from, to, progress 0..1. */
  private binFlight: { from: THREE.Vector3; to: THREE.Vector3; k: number } | null = null;
  private tugSpot = { x: 0, z: 0 };

  constructor(scene: THREE.Scene, private phys: Physics, post: { x: number; z: number }) {
    this.brain = newGary(post);
    const R = phys.R;
    this.body = phys.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(post.x, 0.8, post.z));
    this.col = phys.world.createCollider(R.ColliderDesc.capsule(0.5, 0.28), this.body);
    this.kcc = phys.world.createCharacterController(0.02);
    this.kcc.enableSnapToGround(0.3);
    this.kcc.enableAutostep(0.3, 0.15, false);
    this.pos.set(post.x, 0, post.z);
    this.prev.copy(this.pos);
    this.rig.root.position.copy(this.pos);
    scene.add(this.rig.root);
  }

  /** Fixed step: the brain picks where he wants to be; the capsule gets him there around obstacles. */
  step(dt: number, world: GaryWorld): GaryMode | null {
    if (this.brain.mode === "binned") return null;
    this.prev.copy(this.pos);
    let changed: GaryMode | null = null;
    if (this.brain.mode === "tug") {
      // shuffle up to arm's length of Bill and dig in
      const dx = this.tugSpot.x - this.brain.x, dz = this.tugSpot.z - this.brain.z, d = Math.hypot(dx, dz);
      const k = d > 1e-3 ? Math.min(1, (2.2 * dt) / d) : 0;
      this.brain.x += dx * k;
      this.brain.z += dz * k;
    } else changed = stepGary(this.brain, world, dt);
    const t = this.body.translation();
    const want = { x: this.brain.x - t.x, y: -0.5 * dt, z: this.brain.z - t.z };
    this.kcc.computeColliderMovement(this.col, want);
    const mv = this.kcc.computedMovement();
    this.body.setNextKinematicTranslation({ x: t.x + mv.x, y: t.y + mv.y, z: t.z + mv.z });
    // the brain learns where he actually got to
    this.brain.x = t.x + mv.x;
    this.brain.z = t.z + mv.z;
    this.pos.set(this.brain.x, t.y + mv.y - 0.78, this.brain.z);
    const dx = this.pos.x - this.prev.x, dz = this.pos.z - this.prev.z;
    this.speed = Math.hypot(dx, dz) / dt;
    if (this.brain.mode === "tug") this.facing = dampAngle(this.facing, Math.atan2(world.bill.x - this.pos.x, world.bill.z - this.pos.z), 12, dt);
    else if (this.speed > 0.1) this.facing = dampAngle(this.facing, Math.atan2(dx, dz), 10, dt);
    else {
      // face Bill when shadowing or blocking, the prize when rummaging
      const look = this.brain.mode === "follow" || this.blockUntil > 0 ? world.bill : this.brain.post;
      const target = Math.atan2(look.x - this.pos.x, look.z - this.pos.z);
      if (this.brain.mode !== "guard" || this.blockUntil > 0) this.facing = dampAngle(this.facing, target, 6, dt);
      else this.facing = dampAngle(this.facing, Math.PI, 3, dt);
    }
    this.phase += (this.speed * dt) / 0.32;
    this.blockUntil = Math.max(0, this.blockUntil - dt);
    return changed;
  }

  /** He plants himself in front of the prize, arms out. */
  block(seconds = 1.6) {
    this.blockUntil = seconds;
  }

  /** Lock him into a tug-of-war over the prize, standing at `spot` (arm's length from Bill). */
  startTug(spot: { x: number; z: number }) {
    this.brain.mode = "tug";
    this.brain.gag = 0;
    this.tugSpot = { ...spot };
    this.blockUntil = 0;
  }

  /** The tug is over: he either gloats (won) or goes head-first into the dumpster. */
  endTug(billWon: boolean, dumpsterTop: THREE.Vector3) {
    if (billWon) {
      this.brain.mode = "binned";
      this.binFlight = { from: this.pos.clone(), to: dumpsterTop.clone(), k: 0 };
      this.phys.world.removeCollider(this.col, false); // he's out of everyone's way now
    } else {
      this.brain.mode = "guard";
      this.block(1.8);
    }
  }

  render(alpha: number, t: number, dt: number) {
    if (this.binFlight) {
      // an arc over the rim, flipping head-first, then legs kicking above the lid
      const f = this.binFlight;
      f.k = Math.min(1, f.k + dt / 0.6);
      const r = this.rig.root;
      r.position.lerpVectors(f.from, f.to, f.k);
      r.position.y += Math.sin(f.k * Math.PI) * 1.6;
      r.rotation.x = Math.PI * f.k;
      this.rig.pose(0, 0, "binned", t, dt);
      return;
    }
    this.rig.root.position.lerpVectors(this.prev, this.pos, clamp(alpha, 0, 1));
    const cur = this.rig.root.rotation.y;
    this.rig.root.rotation.y = cur + angleDelta(cur, this.facing) * Math.min(1, dt * 12);
    const mode: Mode = this.blockUntil > 0 ? "block" : this.brain.mode;
    this.rig.pose(this.speed, this.phase, mode, t, dt);
  }

  /** World position of his hands, roughly (for the thing he's tugging on). */
  handsWorld(out: THREE.Vector3) {
    return out.set(this.pos.x + Math.sin(this.facing) * 0.45, this.pos.y + 0.95, this.pos.z + Math.cos(this.facing) * 0.45);
  }

  /** World position of his head (for his speech balloon). */
  headWorld(out: THREE.Vector3) {
    return this.rig.head.getWorldPosition(out).setY(this.rig.root.position.y + 1.85);
  }
}

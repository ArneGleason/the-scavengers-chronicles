/**
 * Big Wanda: a primitive-built rig (tall and broad, denim overalls over a pink work shirt, a
 * red bandana, a big blonde-grey bun, yellow work gloves, boots), a kinematic capsule, and the
 * pure brain from game/wanda.ts. Same pattern as Gary.
 */
import * as THREE from "three/webgpu";
import type RAPIER from "@dimforge/rapier3d-compat";
import type { Physics } from "../world/physics";
import { toon } from "../render/comicMaterial";
import { ensureInkNormals } from "../render/ink";
import { newWanda, stepWanda, type WandaMode, type WandaState, type WandaWorld } from "../game/wanda";
import { angleDelta, clamp, damp, dampAngle } from "../core/math";
import { blob, limb } from "./bill/billModel";

const DENIM = "#3f5f8a", SHIRT = "#d86f8a", SKIN = "#d69a7a", HAIR = "#cdb57e", BANDANA = "#c8312d", GLOVE = "#e8b23a", BOOTS = "#5a3a22";

class WandaRig {
  readonly root = new THREE.Group();
  readonly body = new THREE.Group();
  readonly head = new THREE.Group();
  private sh: THREE.Group[] = [];
  private hips: THREE.Group[] = [];

  constructor() {
    const denim = toon(DENIM), shirt = toon(SHIRT), skin = toon(SKIN, { emissive: "#301008" }), hair = toon(HAIR);
    const glove = toon(GLOVE), boots = toon(BOOTS), band = toon(BANDANA), black = toon("#1e1a18", { ink: 0.3 });
    this.root.add(this.body);
    this.body.position.y = 0.95;
    // a big barrel of a torso: shirt, with the overall bib over it
    const torso = new THREE.Mesh(blob(0.28, 0.4, 0.23), shirt); torso.position.y = 0.36; this.body.add(torso);
    const bib = new THREE.Mesh(blob(0.24, 0.3, 0.2, (v) => { if (v.y > 0.6) v.y = 0.6; }), denim); bib.position.set(0, 0.2, 0.04); this.body.add(bib);
    for (const s of [-1, 1]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.02), denim);
      strap.position.set(0.12 * s, 0.55, 0.2); strap.rotation.x = -0.25; this.body.add(strap);
    }
    // head: bandana, a big bun, earrings
    this.head.position.set(0, 0.86, 0.02); this.body.add(this.head);
    this.head.add(new THREE.Mesh(blob(0.12, 0.14, 0.12), skin));
    const nose = new THREE.Mesh(blob(0.028, 0.03, 0.035), skin); nose.position.set(0, -0.01, 0.12); this.head.add(nose);
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), black); e.position.set(0.045 * s, 0.03, 0.105); this.head.add(e);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 12), toon("#f2b632", { ink: 0.4 })); ring.position.set(0.12 * s, -0.05, 0); this.head.add(ring);
    }
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.01), toon("#8a2b2b", { ink: 0.3 })); mouth.position.set(0, -0.06, 0.115); this.head.add(mouth);
    const bandana = new THREE.Mesh(blob(0.13, 0.07, 0.13, (v) => { if (v.y < -0.2) v.y = -0.2; }), band); bandana.position.y = 0.08; this.head.add(bandana);
    const bun = new THREE.Mesh(blob(0.11, 0.1, 0.11), hair); bun.position.set(0, 0.19, -0.03); this.head.add(bun);
    // arms: rolled sleeves, bare forearms, big yellow gloves
    for (const s of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(0.3 * s, 0.66, 0); this.body.add(sh); this.sh.push(sh);
      const upper = new THREE.Mesh(limb(0.3, 0.085, 0.08), shirt); sh.add(upper);
      const fore = new THREE.Mesh(limb(0.28, 0.07, 0.06), skin); fore.position.y = -0.3; sh.add(fore);
      const hand = new THREE.Mesh(blob(0.07, 0.08, 0.06), glove); hand.position.y = -0.62; sh.add(hand);
    }
    // legs: overalls and boots
    for (const s of [-1, 1]) {
      const hip = new THREE.Group(); hip.position.set(0.13 * s, 0, 0); this.body.add(hip); this.hips.push(hip);
      hip.add(new THREE.Mesh(limb(0.84, 0.1, 0.085), denim));
      const boot = new THREE.Mesh(blob(0.085, 0.07, 0.15), boots); boot.position.set(0, -0.88, 0.04); hip.add(boot);
    }
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 20), new THREE.MeshBasicNodeMaterial({ color: "#2c4543", transparent: true, opacity: 0.25, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; shadow.renderOrder = -1; this.root.add(shadow);
    ensureInkNormals(this.root);
    this.root.traverse((o) => { o.frustumCulled = false; });
  }

  pose(speed: number, phase: number, mode: WandaMode | "caught", t: number, dt: number) {
    const walk = clamp(speed / 1.2, 0, 1);
    const swing = Math.sin(phase) * 0.6 * walk;
    this.hips[0].rotation.x = swing;
    this.hips[1].rotation.x = -swing;
    this.body.position.y = 0.95 - 0.04 * Math.abs(Math.cos(phase)) * walk;
    let lean = 0.05 + 0.08 * walk, armL = -swing * 0.7, armR = swing * 0.7, spreadL = 0.15, spreadR = -0.15, headX = 0;
    if (mode === "chase") {
      // arms out, reaching for her magnificent little scrap prophet
      lean = 0.3; armL = armR = -1.45 + 0.2 * Math.sin(t * 9); spreadL = 0.25; spreadR = -0.25; headX = -0.1;
    } else if (mode === "applaud") {
      lean = -0.05; armL = armR = -1.3; const c = Math.abs(Math.sin(t * 12)); spreadL = -0.1 + 0.45 * c; spreadR = -spreadL; headX = -0.15;
    } else if (mode === "admire") {
      // one arm waving hello, the other hand on her hip
      armR = -2.7 + 0.3 * Math.sin(t * 8); spreadR = -0.3; armL = -0.3; spreadL = 0.9; headX = -0.05;
    } else if (mode === "home" && walk < 0.2) {
      armL = armR = -0.35; spreadL = 0.95; spreadR = -0.95; // hands on hips, surveying her kingdom
    } else if (mode === "caught") {
      lean = -0.15; armL = armR = -2.6; spreadL = 0.1; spreadR = -0.1; headX = -0.3; // holding him up to the light
    }
    this.body.rotation.x = damp(this.body.rotation.x, lean, 8, dt);
    this.sh[0].rotation.set(damp(this.sh[0].rotation.x, armL, 10, dt), 0, damp(this.sh[0].rotation.z, -spreadL, 12, dt));
    this.sh[1].rotation.set(damp(this.sh[1].rotation.x, armR, 10, dt), 0, damp(this.sh[1].rotation.z, -spreadR, 12, dt));
    this.head.rotation.x = damp(this.head.rotation.x, headX, 6, dt);
  }
}

export class Wanda {
  readonly rig = new WandaRig();
  readonly brain: WandaState;
  private body: RAPIER.RigidBody;
  private col: RAPIER.Collider;
  private kcc: RAPIER.KinematicCharacterController;
  readonly pos = new THREE.Vector3();
  private prev = new THREE.Vector3();
  facing = 0;
  private phase = 0;
  speed = 0;
  /** Seconds left of holding a caught Bill up (a pose only). */
  holding = 0;

  constructor(scene: THREE.Scene, phys: Physics, home: { x: number; z: number }) {
    this.brain = newWanda(home);
    const R = phys.R;
    this.body = phys.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(home.x, 0.9, home.z));
    this.col = phys.world.createCollider(R.ColliderDesc.capsule(0.55, 0.34), this.body);
    this.kcc = phys.world.createCharacterController(0.02);
    this.kcc.enableSnapToGround(0.3);
    this.kcc.enableAutostep(0.3, 0.15, false);
    this.pos.set(home.x, 0, home.z);
    this.prev.copy(this.pos);
    this.rig.root.position.copy(this.pos);
    this.rig.root.userData.tag = "outdoors";
    scene.add(this.rig.root);
  }

  step(dt: number, world: WandaWorld) {
    this.prev.copy(this.pos);
    this.holding = Math.max(0, this.holding - dt);
    const r = this.holding > 0 ? { changed: null, caught: false } : stepWanda(this.brain, world, dt);
    const t = this.body.translation();
    const want = { x: this.brain.x - t.x, y: -0.5 * dt, z: this.brain.z - t.z };
    this.kcc.computeColliderMovement(this.col, want);
    const mv = this.kcc.computedMovement();
    this.body.setNextKinematicTranslation({ x: t.x + mv.x, y: t.y + mv.y, z: t.z + mv.z });
    this.brain.x = t.x + mv.x;
    this.brain.z = t.z + mv.z;
    this.pos.set(this.brain.x, t.y + mv.y - 0.89, this.brain.z);
    const dx = this.pos.x - this.prev.x, dz = this.pos.z - this.prev.z;
    this.speed = Math.hypot(dx, dz) / dt;
    const m = this.brain.mode;
    if (m === "chase" || m === "admire" || m === "applaud" || this.holding > 0) this.facing = dampAngle(this.facing, Math.atan2(world.bill.x - this.pos.x, world.bill.z - this.pos.z), 8, dt);
    else if (this.speed > 0.1) this.facing = dampAngle(this.facing, Math.atan2(dx, dz), 8, dt);
    else this.facing = dampAngle(this.facing, 0, 3, dt); // home: facing the lane, surveying
    this.phase += (this.speed * dt) / 0.36;
    return r;
  }

  render(alpha: number, t: number, dt: number) {
    this.rig.root.position.lerpVectors(this.prev, this.pos, clamp(alpha, 0, 1));
    const cur = this.rig.root.rotation.y;
    this.rig.root.rotation.y = cur + angleDelta(cur, this.facing) * Math.min(1, dt * 10);
    this.rig.pose(this.speed, this.phase, this.holding > 0 ? "caught" : this.brain.mode, t, dt);
  }

  headWorld(out: THREE.Vector3) {
    return this.rig.head.getWorldPosition(out).setY(this.rig.root.position.y + 2.05);
  }

  handsWorld(out: THREE.Vector3) {
    return out.set(this.pos.x + Math.sin(this.facing) * 0.35, this.pos.y + 2.1, this.pos.z + Math.cos(this.facing) * 0.35);
  }
}

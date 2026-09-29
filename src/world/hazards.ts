/**
 * Traversal gags (docs/design/comedy.md, "World gags"): things lying around that Bill steps on.
 *   the rake:       on the path home from the dig patch; the handle comes up into his face
 *   the skateboard: in the laneway; he rides it at speed until it shoots out from under him
 * This module owns the props and their little animations; main.ts decides what happens to Bill.
 */
import * as THREE from "three/webgpu";
import { toon } from "../render/comicMaterial";
import { ensureInkNormals } from "../render/ink";
import { clamp } from "../core/math";

export const RAKE_AT = new THREE.Vector3(-3.25, 0, 8.3);
export const BOARD_AT = new THREE.Vector3(5.5, 0, 17.6);

export interface Stepper { x: number; y: number; z: number; facing: number; speed: number; busy: boolean }
export type HazardHit = "rake" | "board";

type BoardState = "idle" | "ride" | "loose";

export class Hazards {
  readonly rake = new THREE.Group();
  private rakeArm = new THREE.Group();
  readonly board = new THREE.Group();
  private rakeArmed = true;
  private rakeSwing = -1; // seconds into the swing, -1 when lying still
  private rakeRearm = 0;
  boardState: BoardState = "idle";
  private boardRearm = 0;
  private loose = { vx: 0, vz: 0, t: 0, spin: 0 };

  constructor(scene: THREE.Scene) {
    // rake: a wooden handle with a steel head, lying tines-up with the handle along +Z
    const wood = toon("#b8894f", { ink: 0.8 }), steel = toon("#77838a", { ink: 0.8 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 1.45, 8), wood);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 0.03, 0.74);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.03, 0.04), steel);
    bar.position.y = 0.03;
    this.rakeArm.add(handle, bar);
    for (let i = 0; i < 10; i++) {
      const tine = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.09, 0.012), steel);
      tine.position.set(-0.21 + i * 0.0467, 0.08, -0.01);
      tine.rotation.x = -0.25;
      this.rakeArm.add(tine);
    }
    this.rake.add(this.rakeArm);
    this.rake.position.copy(RAKE_AT);
    this.rake.rotation.y = 2.6;

    // skateboard: a red deck with a yellow stripe and fat cream wheels
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.8), toon("#c8312d", { ink: 1 }));
    deck.position.y = 0.1;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.006, 0.7), toon("#f2b632", { ink: 0 }));
    stripe.position.y = 0.121;
    const kick = (z: number, a: number) => {
      const k = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.14), deck.material);
      k.position.set(0, 0.125, z);
      k.rotation.x = a;
      return k;
    };
    this.board.add(deck, stripe, kick(0.44, -0.4), kick(-0.44, 0.4));
    const wheel = toon("#efe3c4", { ink: 0.9 });
    for (const x of [-0.09, 0.09]) for (const z of [-0.26, 0.26]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12), wheel);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.04, z);
      this.board.add(w);
    }
    this.board.position.copy(BOARD_AT);
    this.board.rotation.y = Math.PI / 2; // lying along the lane
    for (const o of [this.rake, this.board]) {
      o.userData.tag = "outdoors";
      ensureInkNormals(o);
      scene.add(o);
    }
  }

  /** Did Bill just step on something? Fires once per trigger. */
  check(dt: number, b: Stepper): HazardHit | null {
    this.rakeRearm = Math.max(0, this.rakeRearm - dt);
    this.boardRearm = Math.max(0, this.boardRearm - dt);
    if (b.y < -1 || b.busy) return null;
    const near = (o: THREE.Object3D, r: number) => Math.hypot(b.x - o.position.x, b.z - o.position.z) < r;
    // the rake re-arms once he's wandered off
    if (!this.rakeArmed && this.rakeRearm <= 0 && !near(this.rake, 2.2)) this.rakeArmed = true;
    if (this.rakeArmed && b.speed > 0.3) {
      // the tines are where he steps; the head sits at the rake's origin
      if (near(this.rake, 0.42)) {
        this.rakeArmed = false;
        this.rakeRearm = 5;
        // the head is under his leading foot; the handle, lying ahead of him, comes up and over into his face
        const f = b.facing;
        this.rake.position.set(b.x + Math.sin(f) * 0.34, 0, b.z + Math.cos(f) * 0.34);
        this.rake.rotation.y = f;
        this.rakeSwing = 0;
        return "rake";
      }
    }
    if (this.boardState === "idle" && this.boardRearm <= 0 && b.speed > 0.4 && near(this.board, 0.6)) {
      this.boardState = "ride";
      return "board";
    }
    return null;
  }

  /** While riding: the board is under his feet, pointing where he's going. */
  ride(at: THREE.Vector3, heading: number) {
    this.board.position.set(at.x, at.y, at.z);
    this.board.rotation.set(0, heading, 0);
  }

  /** The wipeout: the board shoots out ahead of him and skids to a stop. */
  kick(heading: number, speed: number) {
    this.boardState = "loose";
    this.loose = { vx: Math.sin(heading) * speed, vz: Math.cos(heading) * speed, t: 0, spin: 9 };
    this.boardRearm = 3;
  }

  update(dt: number, walk: { x0: number; x1: number; z0: number; z1: number }) {
    // rake: slam up (0.09 s), hold a beat, then flop back down with a bounce
    if (this.rakeSwing >= 0) {
      const t = (this.rakeSwing += dt);
      const UP = 1.82; // just past vertical, leaning back into his face
      let a: number;
      if (t < 0.09) a = (t / 0.09) * UP;
      else if (t < 0.35) a = UP;
      else if (t < 0.75) { const k = (t - 0.35) / 0.4; a = UP * (1 - k * k); }
      else if (t < 0.95) a = Math.sin(((t - 0.75) / 0.2) * Math.PI) * 0.12;
      else { a = 0; this.rakeSwing = -1; }
      // the arm's +Z is the handle; lifting it rotates about the head
      this.rakeArm.rotation.x = -a;
    }
    // the loose board rolls on, spinning, and settles
    if (this.boardState === "loose") {
      const l = this.loose;
      l.t += dt;
      const k = Math.exp(-2.4 * dt);
      l.vx *= k; l.vz *= k; l.spin *= Math.exp(-3 * dt);
      const b = this.board.position;
      b.x = clamp(b.x + l.vx * dt, walk.x0, walk.x1);
      b.z = clamp(b.z + l.vz * dt, walk.z0, walk.z1);
      b.y = Math.max(0, Math.sin(Math.min(1, l.t / 0.5) * Math.PI) * 0.45);
      // a kickflip in the air, then it settles wheels-down
      if (l.t < 0.5) this.board.rotation.z += l.spin * dt;
      else {
        const r = this.board.rotation.z, rest = Math.round(r / (Math.PI * 2)) * Math.PI * 2;
        this.board.rotation.z = rest + (r - rest) * Math.exp(-12 * dt);
      }
      if (Math.hypot(l.vx, l.vz) < 0.15 && l.t > 0.6) {
        this.boardState = "idle";
        this.board.rotation.z = 0;
        b.y = 0;
      }
    }
  }
}

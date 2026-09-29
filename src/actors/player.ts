import type RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three/webgpu";
import type { Physics } from "../world/physics";
import { DEG, clamp, damp, dampAngle, angleDelta, moveTowards2 } from "../core/math";

/** Tunable feel parameters (docs/design/technical-design.md, "Bill's controller"). */
export const FEEL = {
  // brisker than the walking toy: getting around shouldn't be the boring part (docs/design/comedy.md)
  shuffleSpeed: 1.75,
  hurrySpeed: 3.3,
  heavyFactor: 0.8,
  accelTime: 0.2,
  hurryAccelTime: 0.3,
  stopTime: 0.18,
  hurryStopTime: 0.4,
  /** Seconds to mostly finish turning toward the move direction. */
  turnTime: 0.18,
  /** Extra speed along the camera's forward axis (iso makes "up" look slow). */
  isoForwardBoost: 1.12,
  keyboardSmoothing: 15,
  skidDot: -0.3,
  skidTime: 0.22,
};

const CAPSULE_HALF = 0.55;
const CAPSULE_R = 0.28;
const FOOT_OFFSET = CAPSULE_HALF + CAPSULE_R;

/** Bill's kinematic controller: crisp capsule underneath, springy drawn body on top. */
export class Player {
  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  private kcc: RAPIER.KinematicCharacterController;
  private hit: RAPIER.CharacterCollision;
  /** Up-component of the ground normal under him last step (1 = flat). */
  private groundNy = 1;
  /** Feet position (current and previous fixed step, for render interpolation). */
  readonly pos = new THREE.Vector3();
  readonly prevPos = new THREE.Vector3();
  /** Horizontal velocity (x, z) in m/s. */
  readonly vel = { x: 0, y: 0 };
  private vy = 0;
  private smoothIn = { x: 0, y: 0 };
  facing = Math.PI / 4;
  prevFacing = Math.PI / 4;
  yawRate = 0;
  /** Signed forward acceleration, m/s² (for lean). */
  accel = 0;
  grounded = true;
  hurrying = false;
  /** 0..1 blend while carrying something heavy. */
  heavy = 0;
  skidTimer = 0;
  /** Seconds since last meaningful input. */
  idleTime = 0;
  /** Multiplier from carried mass (satchel full of junk slows him a little). */
  loadFactor = 1;
  /** Seconds of ignored input (dazed, flat on his face, mid-challenge). */
  lockTimer = 0;
  /** A velocity imposed from outside (toot dash, skateboard, being flung), decaying linearly. */
  readonly forced = { vx: 0, vz: 0, time: 0, total: 0, decay: 0 };
  /** Actual horizontal movement / intended, last step (well below 1 = he hit something). */
  moveRatio = 1;
  onSkid: ((speed: number) => void) | null = null;
  onLand: ((speed: number) => void) | null = null;

  constructor(private phys: Physics, spawn: THREE.Vector3) {
    const R = phys.R;
    this.body = phys.world.createRigidBody(
      R.RigidBodyDesc.kinematicPositionBased().setTranslation(spawn.x, spawn.y + FOOT_OFFSET, spawn.z),
    );
    this.collider = phys.world.createCollider(R.ColliderDesc.capsule(CAPSULE_HALF, CAPSULE_R).setFriction(0), this.body);
    const k = phys.world.createCharacterController(0.02);
    k.enableAutostep(0.3, 0.15, true);
    k.enableSnapToGround(0.3);
    k.setMaxSlopeClimbAngle(45 * DEG);
    k.setMinSlopeSlideAngle(50 * DEG); // above the climb limit: he should never slide off the stairs
    k.setApplyImpulsesToDynamicBodies(true);
    k.setCharacterMass(75);
    k.setSlideEnabled(true);
    this.kcc = k;
    this.hit = new phys.R.CharacterCollision();
    this.pos.copy(spawn);
    this.prevPos.copy(spawn);
  }

  teleport(p: THREE.Vector3, facing = this.facing) {
    this.body.setTranslation({ x: p.x, y: p.y + FOOT_OFFSET, z: p.z }, true);
    this.body.setNextKinematicTranslation({ x: p.x, y: p.y + FOOT_OFFSET, z: p.z });
    this.pos.copy(p);
    this.prevPos.copy(p);
    this.vel.x = this.vel.y = 0;
    this.facing = this.prevFacing = facing;
  }

  /**
   * One fixed step. `move` is the screen-space input (x right, y up), `camYaw` the camera yaw.
   * `pull` is an extra world-space input vector (the soup pull, later).
   */
  /** Ignore input for a while (he's busy being dazed). */
  stun(seconds: number) {
    this.lockTimer = Math.max(this.lockTimer, seconds);
  }

  /** Impose a velocity for `seconds`; `decay` 0..1 is how much of it bleeds away by the end. */
  force(vx: number, vz: number, seconds: number, decay = 0) {
    Object.assign(this.forced, { vx, vz, time: seconds, total: seconds, decay });
  }

  get isForced() {
    return this.forced.time > 0;
  }

  step(dt: number, move: { x: number; y: number }, analog: boolean, hurry: boolean, camYaw: number, pull?: { x: number; z: number }) {
    this.prevPos.copy(this.pos);
    this.prevFacing = this.facing;
    if (this.lockTimer > 0 || this.forced.time > 0) {
      this.lockTimer = Math.max(0, this.lockTimer - dt);
      move = { x: 0, y: 0 };
      hurry = false;
      pull = undefined;
    }

    // keyboard input gets smoothed so diagonal changes blend; analog sticks are already smooth
    if (analog) {
      this.smoothIn.x = move.x;
      this.smoothIn.y = move.y;
    } else {
      this.smoothIn.x = damp(this.smoothIn.x, move.x, FEEL.keyboardSmoothing, dt);
      this.smoothIn.y = damp(this.smoothIn.y, move.y, FEEL.keyboardSmoothing, dt);
    }
    // screen -> world: right = (cos yaw, 0, -sin yaw), forward(up) = (-sin yaw, 0, -cos yaw)
    const s = Math.sin(camYaw), c = Math.cos(camYaw);
    const fy = this.smoothIn.y * FEEL.isoForwardBoost;
    let wx = this.smoothIn.x * c - fy * s;
    let wz = -this.smoothIn.x * s - fy * c;
    if (pull) {
      wx += pull.x;
      wz += pull.z;
    }
    let mag = Math.hypot(wx, wz);
    if (mag > FEEL.isoForwardBoost) {
      wx *= FEEL.isoForwardBoost / mag;
      wz *= FEEL.isoForwardBoost / mag;
      mag = FEEL.isoForwardBoost;
    }

    this.hurrying = hurry && mag > 0.1;
    const heavyMul = 1 + (FEEL.heavyFactor - 1) * this.heavy;
    const top = (this.hurrying ? FEEL.hurrySpeed : FEEL.shuffleSpeed) * heavyMul * this.loadFactor;
    const accelT = (this.hurrying ? FEEL.hurryAccelTime : FEEL.accelTime) + 0.1 * this.heavy;
    const stopT = (this.hurrying ? FEEL.hurryStopTime : FEEL.stopTime) + 0.1 * this.heavy;
    const tx = wx * top, tz = wz * top;

    const speed = Math.hypot(this.vel.x, this.vel.y);
    // skid: hurrying and yanking the stick backwards
    if (this.skidTimer <= 0 && this.hurrying && speed > 0.6 * FEEL.hurrySpeed && mag > 0.3) {
      const dot = (wx * this.vel.x + wz * this.vel.y) / (mag * speed);
      if (dot < FEEL.skidDot) {
        this.skidTimer = FEEL.skidTime;
        this.onSkid?.(speed);
      }
    }
    const before = { x: this.vel.x, y: this.vel.y };
    if (this.skidTimer > 0) {
      this.skidTimer -= dt;
      moveTowards2(this.vel, 0, 0, (2 * FEEL.hurrySpeed / FEEL.hurryStopTime) * dt);
    } else {
      const speeding = tx * this.vel.x + tz * this.vel.y > 0 && Math.hypot(tx, tz) >= speed;
      const rate = speeding ? top / accelT : Math.max(top, speed) / stopT;
      moveTowards2(this.vel, tx, tz, rate * dt);
    }

    if (this.forced.time > 0) {
      const k = 1 - this.forced.decay * (1 - this.forced.time / this.forced.total);
      this.vel.x = this.forced.vx * k;
      this.vel.y = this.forced.vz * k;
      this.forced.time = Math.max(0, this.forced.time - dt);
    }

    // turn toward the direction of travel (or of input when starting); not while being shoved
    const aimX = mag > 0.1 ? wx : this.vel.x, aimZ = mag > 0.1 ? wz : this.vel.y;
    if (Math.hypot(aimX, aimZ) > 0.05 && this.skidTimer <= 0 && this.forced.time <= 0 && this.lockTimer <= 0) {
      const target = Math.atan2(aimX, aimZ);
      const lambda = 4 / (FEEL.turnTime + 0.08 * this.heavy);
      this.facing = dampAngle(this.facing, target, lambda, dt);
    }
    this.yawRate = angleDelta(this.prevFacing, this.facing) / dt;
    const fwdX = Math.sin(this.facing), fwdZ = Math.cos(this.facing);
    this.accel = ((this.vel.x - before.x) * fwdX + (this.vel.y - before.y) * fwdZ) / dt;

    // vertical: gravity, with a small downward bias while grounded so snap-to-ground engages
    this.vy = this.grounded ? -0.5 : Math.max(-20, this.vy - 19.6 * dt);
    // The controller projects his step onto slopes, which slows him on the stairs; scale it back
    // up so he keeps his walking pace along the slope (1 / cos of the slope angle).
    const slopeBoost = this.groundNy > 0.5 && this.groundNy < 0.985 ? 1 / this.groundNy : 1;
    const desired = { x: this.vel.x * dt * slopeBoost, y: this.vy * dt, z: this.vel.y * dt * slopeBoost };
    this.kcc.computeColliderMovement(this.collider, desired);
    const mv = this.kcc.computedMovement();
    const wasGrounded = this.grounded;
    this.grounded = this.kcc.computedGrounded();
    if (this.grounded && !wasGrounded && this.vy < -3) this.onLand?.(-this.vy);
    const t = this.body.translation();
    this.body.setNextKinematicTranslation({ x: t.x + mv.x, y: t.y + mv.y, z: t.z + mv.z });
    // Walls stop him: cancel only the part of his velocity that pushes into a wall, so he
    // slides along it instead of moonwalking. Slopes and stairs (normals pointing up) are
    // left alone; the controller already walks him up those.
    let groundNy = this.grounded ? 1 : 0;
    for (let i = 0; i < this.kcc.numComputedCollisions(); i++) {
      const c = this.kcc.computedCollision(i, this.hit);
      if (!c) continue;
      const n = c.normal1; // outward from the obstacle, toward Bill
      if (n.y > 0.5) groundNy = Math.min(groundNy || 1, n.y);
      if (Math.abs(n.y) > 0.5) continue;
      const hl = Math.hypot(n.x, n.z) || 1, hx = n.x / hl, hz = n.z / hl;
      const into = this.vel.x * hx + this.vel.y * hz;
      if (into < 0) {
        this.vel.x -= into * hx;
        this.vel.y -= into * hz;
      }
    }
    this.groundNy = groundNy;
    const want = Math.hypot(desired.x, desired.z);
    this.moveRatio = want > 1e-4 ? Math.hypot(mv.x, mv.z) / want : 1;
    this.pos.set(t.x + mv.x, t.y + mv.y - FOOT_OFFSET, t.z + mv.z);

    this.idleTime = mag > 0.1 || speed > 0.1 ? 0 : this.idleTime + dt;
  }

  get speed() {
    return Math.hypot(this.vel.x, this.vel.y);
  }

  /** Interpolated feet position for rendering. */
  renderPos(alpha: number, out: THREE.Vector3) {
    return out.lerpVectors(this.prevPos, this.pos, clamp(alpha, 0, 1));
  }

  renderFacing(alpha: number) {
    return this.prevFacing + angleDelta(this.prevFacing, this.facing) * clamp(alpha, 0, 1);
  }
}

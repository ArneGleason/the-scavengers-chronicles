import { Gait, SHUFFLE, HURRY, HEAVY, blendGait } from "./gait";
import { basePose, blendPose, type Pose, type Expression, type BillRig } from "./billModel";
import { SecondOrder, DEG, clamp, damp, lerp, smoothstep, TAU } from "../../core/math";

/** What the controller tells the animator each frame. */
export interface Motion {
  speed: number;
  hurrying: boolean;
  heavy: number;
  accel: number;
  yawRate: number;
  skidding: boolean;
  idleTime: number;
  satchelCount: number;
}

export const ANIM = {
  /** Lean into turns: radians of roll per (rad/s × m/s). */
  turnLean: 0.055,
  maxTurnLean: 12 * DEG,
  /** Forward/back tilt per m/s² of acceleration. */
  accelLean: 0.022,
  maxAccelLean: 10 * DEG,
};

/**
 * Turns controller state into Bill's pose: distance-driven gait, lean into turns and
 * acceleration, squash & stretch, idle fidgets, and short-lived expression overrides.
 */
export class BillAnimator {
  readonly gait = new Gait();
  private moveW = 0;
  private hurryW = 0;
  private turnLean = new SecondOrder(2.2, 0.55);
  private pitchLean = new SecondOrder(2.6, 0.4, 0.5);
  private squash = new SecondOrder(4.5, 0.32);
  private exprUntil = 0;
  private exprOverride: Expression | null = null;
  private nextElvis = 16;
  private fidgetClock = 0;

  constructor(private rig: BillRig) {}

  /** Briefly show an expression (pickups, refusals...). */
  flash(e: Expression, seconds: number, now: number) {
    this.exprOverride = e;
    this.exprUntil = now + seconds;
  }

  /** Squash (s < 1) or stretch (s > 1) impulse: pickups, heavy drops, landings. */
  bump(strength: number) {
    this.squash.kick(strength);
  }

  /** Returns feet that planted this frame (0 = left, 1 = right). */
  update(m: Motion, dt: number, t: number): number[] {
    this.moveW = damp(this.moveW, clamp(m.speed / 0.35, 0, 1), 12, dt);
    this.hurryW = damp(this.hurryW, m.hurrying ? 1 : 0, 6, dt);
    const heavyW = m.heavy;
    const params = blendGait(blendGait(SHUFFLE, HURRY, this.hurryW), HEAVY, heavyW);
    const planted = this.gait.advance(m.speed * dt, params);
    const ph = this.gait.cycle * TAU;

    // --- moving pose ---
    const mp = basePose();
    const L = this.gait.left, R = this.gait.right;
    mp.lf = [L.x, L.y, L.z + 0.02, L.pitch];
    mp.rf = [R.x, R.y, R.z + 0.02, R.pitch];
    const sway = lerp(lerp(2, 7, this.hurryW), 4.5, heavyW) * DEG;
    const bob = lerp(lerp(0.008, 0.02, this.hurryW), 0.01, heavyW);
    mp.py = lerp(lerp(-0.012, -0.03, this.hurryW), -0.035, heavyW) + bob * Math.cos(2 * ph);
    mp.roll = sway * Math.sin(ph);
    mp.troll = -0.45 * mp.roll;
    mp.yaw = lerp(2.5, 6, this.hurryW) * DEG * Math.sin(ph);
    mp.lean = lerp(lerp(0.03, 0.2, this.hurryW), -0.14, heavyW);
    mp.hp = lerp(lerp(-0.015 * Math.cos(2 * ph), -0.18, this.hurryW), -0.12, heavyW);
    mp.hy = -1.5 * DEG * Math.sin(ph);
    mp.neck = lerp(lerp(0, -0.05, this.hurryW), -0.06, heavyW);
    // arms: shuffle hang -> hurry flail; heavy carry grips the item
    const sh = { lh: [0.215, -0.085, 0.085 + 0.035 * Math.sin(ph + Math.PI)], rh: [-0.215, -0.085, 0.085 + 0.035 * Math.sin(ph)], le: [0.5, 0.1, -0.7], re: [-0.5, 0.1, -0.7] };
    const hu = {
      lh: [0.26, 0.2 + 0.08 * Math.sin(2 * ph), 0.17 + 0.08 * Math.cos(ph)],
      rh: [-0.26, 0.2 + 0.08 * Math.sin(2 * ph + Math.PI), 0.17 - 0.08 * Math.cos(ph)],
      le: [0.9, 0.7, -0.35], re: [-0.9, 0.7, -0.35],
    };
    for (const k of ["lh", "rh", "le", "re"] as const) mp[k] = sh[k].map((v, i) => lerp(v, hu[k][i], this.hurryW));
    if (heavyW > 0) {
      mp.le = mp.le.map((v, i) => lerp(v, [0.7, -0.2, -0.4][i], heavyW));
      mp.re = mp.re.map((v, i) => lerp(v, [-0.7, -0.2, -0.4][i], heavyW));
    }

    // --- idle pose (from the maquette): breathing, weight shift, glasses push ---
    const ip = basePose();
    const br = Math.sin((t * TAU) / 4.2), w = Math.sin((t * TAU) / 9), ws = Math.sign(w) * Math.abs(w) ** 0.6;
    ip.breath = br; ip.lean = 0.012 * br; ip.px = 0.024 * ws; ip.roll = -0.035 * ws; ip.troll = 0.03 * ws; ip.hr = 0.03 * ws; ip.py = -0.006 * Math.abs(ws);
    ip.lh[2] += 0.006 * br; ip.rh[2] += 0.006 * br;
    if (m.idleTime > 2.5 && heavyW < 0.5) {
      this.fidgetClock += dt;
      const c = this.fidgetClock % 9;
      ip.push = smoothstep(4.9, 5.5, c) * (1 - smoothstep(6.5, 7.1, c));
      ip.curl = ip.push;
      ip.hp = 0.07 * ip.push;
      ip.nudge = smoothstep(5.6, 5.85, c) * (1 - smoothstep(6.2, 6.5, c));
    } else this.fidgetClock = 0;
    if (heavyW > 0) {
      ip.carry = heavyW; ip.lean = lerp(ip.lean, -0.1, heavyW); ip.hp = -0.1 * heavyW;
      ip.le = [0.7, -0.2, -0.4]; ip.re = [-0.7, -0.2, -0.4];
    }
    mp.carry = heavyW;

    const pose: Pose = blendPose(ip, mp, this.moveW);

    // --- lean into turns and acceleration (applied to the whole body around the feet) ---
    const tl = clamp(-m.yawRate * m.speed * ANIM.turnLean, -ANIM.maxTurnLean, ANIM.maxTurnLean);
    const pl = clamp(m.accel * ANIM.accelLean, -ANIM.maxAccelLean, ANIM.maxAccelLean) + (m.skidding ? -14 * DEG : 0);
    const roll = this.turnLean.step(dt, tl);
    const pitch = this.pitchLean.step(dt, pl);
    this.rig.squash.rotation.set(pitch, 0, roll);

    // --- squash & stretch (volume preserving) ---
    const s = clamp(this.squash.step(dt, 1), 0.7, 1.3);
    this.rig.squash.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));

    // --- satchel bulges as it fills ---
    const fill = m.satchelCount / 4;
    this.rig.bag.scale.set(1 + 0.45 * fill, 1 + 0.06 * fill, 1 + 0.08 * fill);

    // --- expression: overrides, then an occasional Elvis sneer when idle ---
    let expr: Expression = "deadpan";
    if (this.exprOverride && t < this.exprUntil) expr = this.exprOverride;
    else if (m.idleTime > this.nextElvis && m.idleTime < this.nextElvis + 2.4) expr = "elvis";
    else if (m.idleTime > this.nextElvis + 2.4) this.nextElvis += 20;
    if (m.idleTime === 0) this.nextElvis = 16;
    this.rig.expression = expr;

    this.rig.update(pose, dt, t);
    return this.moveW > 0.3 ? planted : [];
  }
}

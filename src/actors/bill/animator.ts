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
  /** Riding the skateboard: feet planted, arms out, wobbling. */
  surfing?: boolean;
  /** Heaving in a tug-of-war: feet braced, hands out front. */
  tugging?: boolean;
  /** Posing for the commemorative photo: arms up in a V, TA-DA. */
  posing?: boolean;
  /** At the keyboard: hands on the keys; press is 0..1 for each hand's current note. */
  playing?: { pressL: number; pressR: number };
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
  private noseUntil = 0;
  private noseFrom = 0;

  constructor(private rig: BillRig) {}

  /** Briefly show an expression (pickups, refusals...). */
  flash(e: Expression, seconds: number, now: number) {
    this.exprOverride = e;
    this.exprUntil = now + seconds;
  }

  /** The nasal audit: finger to nose, a thorough rummage, a flick. */
  pickNose(now: number) {
    this.noseFrom = now;
    this.noseUntil = now + 2.2;
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

    let pose: Pose = blendPose(ip, mp, this.moveW);

    if (m.surfing) {
      // feet planted on the board, arms out like a man who has never surfed
      const sp = basePose();
      sp.lf = [0.17, 0, 0.16, 0]; sp.rf = [-0.15, 0, -0.14, 0];
      sp.lh = [0.55, 0.22, 0.05 + 0.06 * Math.sin(t * 7)]; sp.rh = [-0.55, 0.28, -0.02 - 0.06 * Math.sin(t * 7)];
      sp.le = [0.9, 0.6, -0.2]; sp.re = [-0.9, 0.6, -0.2];
      sp.py = -0.08; sp.lean = 0.12; sp.roll = 0.09 * Math.sin(t * 6); sp.hp = -0.1;
      pose = sp;
    }
    if (m.tugging) {
      const tp = basePose();
      tp.lf = [0.15, 0, 0.22, 0]; tp.rf = [-0.14, 0, -0.16, 0];
      tp.lh = [0.12, 0.02, 0.42]; tp.rh = [-0.12, 0.02, 0.42];
      tp.le = [0.6, -0.3, 0.1]; tp.re = [-0.6, -0.3, 0.1];
      tp.py = -0.1; tp.hp = -0.2 + 0.05 * Math.sin(t * 22);
      pose = tp;
    }
    if (m.playing) {
      // hands on the keys, head nodding to a rhythm only he can hear
      const pp = basePose();
      const { pressL, pressR } = m.playing;
      pp.lh = [0.16, -0.1 - 0.05 * pressL, 0.36]; pp.rh = [-0.16, -0.1 - 0.05 * pressR, 0.36];
      pp.le = [0.6, -0.2, 0.1]; pp.re = [-0.6, -0.2, 0.1];
      pp.lean = 0.1; pp.hp = 0.12 + 0.05 * Math.sin(t * 6) + 0.08 * Math.max(pressL, pressR);
      pose = pp;
    }
    if (m.posing) {
      const pp = basePose();
      pp.lf = [0.17, 0, 0.05, 0]; pp.rf = [-0.17, 0, -0.03, 0];
      pp.lh = [0.4, 0.52, 0.12]; pp.rh = [-0.4, 0.52, 0.12];
      pp.le = [0.9, 0.6, -0.2]; pp.re = [-0.9, 0.6, -0.2];
      pp.hp = -0.12; pp.lean = -0.04; pp.roll = 0.05 * Math.sin(t * 3);
      pose = pp;
    }
    // the nasal audit overrides the right hand
    if (t < this.noseUntil) {
      const k = t - this.noseFrom, dur = this.noseUntil - this.noseFrom;
      pose.nose = smoothstep(0, 0.35, k) * (1 - smoothstep(dur - 0.25, dur, k));
      pose.hp += 0.08 * pose.nose + 0.03 * Math.sin(t * 18) * pose.nose;
    }

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

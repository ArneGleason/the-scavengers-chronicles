import { Vector3 } from "three";

export const PI = Math.PI;
export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const fract = (x: number) => x - Math.floor(x);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Frame-rate independent exponential smoothing: a -> b with decay rate lambda (1/s). */
export const damp = (a: number, b: number, lambda: number, dt: number) => b + (a - b) * Math.exp(-lambda * dt);

/** Shortest signed angle from a to b, in (-PI, PI]. */
export const angleDelta = (a: number, b: number) => {
  let d = (b - a) % TAU;
  if (d > PI) d -= TAU;
  if (d <= -PI) d += TAU;
  return d;
};

export const dampAngle = (a: number, b: number, lambda: number, dt: number) =>
  a + angleDelta(a, b) * (1 - Math.exp(-lambda * dt));

/** Move a 2D vector toward a target by at most maxDelta. Mutates and returns `v`. */
export function moveTowards2(v: { x: number; y: number }, tx: number, ty: number, maxDelta: number) {
  const dx = tx - v.x;
  const dy = ty - v.y;
  const d = Math.hypot(dx, dy);
  if (d <= maxDelta || d === 0) {
    v.x = tx;
    v.y = ty;
  } else {
    v.x += (dx / d) * maxDelta;
    v.y += (dy / d) * maxDelta;
  }
  return v;
}

/**
 * Second-order dynamics (t3ssel8r): a critically tunable spring that follows x.
 * f = natural frequency (Hz), z = damping (0 = wobbles forever, 1 = no overshoot),
 * r = initial response (negative = anticipation, >1 = overshoot).
 */
export class SecondOrder {
  private k1: number;
  private k2: number;
  private k3: number;
  private xp = 0;
  y = 0;
  private yd = 0;
  private started = false;

  constructor(f: number, z: number, r = 0) {
    this.k1 = z / (PI * f);
    this.k2 = 1 / (TAU * f) ** 2;
    this.k3 = (r * z) / (TAU * f);
  }

  reset(x: number) {
    this.xp = x;
    this.y = x;
    this.yd = 0;
    this.started = true;
    return x;
  }

  /** Add an instantaneous velocity kick (for squash/bump reactions). */
  kick(v: number) {
    this.yd += v;
  }

  step(dt: number, x: number, xd?: number) {
    if (!this.started) return this.reset(x);
    if (dt <= 0) return this.y;
    const vel = xd ?? (x - this.xp) / dt;
    this.xp = x;
    const k2 = Math.max(this.k2, (dt * dt) / 2 + (dt * this.k1) / 2, dt * this.k1);
    this.y += dt * this.yd;
    this.yd += (dt * (x + this.k3 * vel - this.y - this.k1 * this.yd)) / k2;
    return this.y;
  }
}

/** Vector version of SecondOrder, used for hair clumps and the satchel. */
export class SecondOrder3 {
  private k1: number;
  private k2: number;
  private k3: number;
  private xp = new Vector3();
  y = new Vector3();
  private yd = new Vector3();
  private started = false;
  private tmp = new Vector3();

  constructor(f: number, z: number, r = 0) {
    this.k1 = z / (PI * f);
    this.k2 = 1 / (TAU * f) ** 2;
    this.k3 = (r * z) / (TAU * f);
  }

  reset(x: Vector3) {
    this.xp.copy(x);
    this.y.copy(x);
    this.yd.set(0, 0, 0);
    this.started = true;
    return this.y;
  }

  step(dt: number, x: Vector3) {
    if (!this.started || dt <= 0) return this.started ? this.y : this.reset(x);
    const xd = this.tmp.copy(x).sub(this.xp).divideScalar(dt);
    this.xp.copy(x);
    const k2 = Math.max(this.k2, (dt * dt) / 2 + (dt * this.k1) / 2, dt * this.k1);
    this.y.addScaledVector(this.yd, dt);
    // yd += dt * (x + k3*xd - y - k1*yd) / k2
    xd.multiplyScalar(this.k3).add(x).sub(this.y).addScaledVector(this.yd, -this.k1).multiplyScalar(dt / k2);
    this.yd.add(xd);
    return this.y;
  }
}

/** Small deterministic PRNG (mulberry32) so gags and fidgets are reproducible in tests. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

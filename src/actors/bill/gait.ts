/**
 * Distance-driven gait. The cycle advances with distance travelled rather than time,
 * so the stance foot stays planted on the ground at any speed (no foot sliding).
 * One cycle = two steps = 2 * stepLength metres of travel.
 */
export interface GaitParams {
  /** Metres travelled per step. Shorter = more of a shuffle. */
  stepLength: number;
  /** Fraction of the cycle each foot spends on the ground (0.5–0.7). */
  duty: number;
  /** Peak foot lift during swing, metres. */
  lift: number;
  /** Half the distance between the feet, metres. */
  width: number;
}

export interface FootTarget {
  x: number;
  y: number;
  z: number;
  /** Toe pitch in radians (heel-toe roll during swing). */
  pitch: number;
}

export const SHUFFLE: GaitParams = { stepLength: 0.55, duty: 0.62, lift: 0.035, width: 0.1 };
export const HURRY: GaitParams = { stepLength: 0.86, duty: 0.5, lift: 0.09, width: 0.11 };
export const HEAVY: GaitParams = { stepLength: 0.34, duty: 0.66, lift: 0.032, width: 0.125 };

export function blendGait(a: GaitParams, b: GaitParams, t: number): GaitParams {
  const l = (x: number, y: number) => x + (y - x) * t;
  return { stepLength: l(a.stepLength, b.stepLength), duty: l(a.duty, b.duty), lift: l(a.lift, b.lift), width: l(a.width, b.width) };
}

export class Gait {
  /** Cycle position in [0, 1). Left foot uses `cycle`, right uses `cycle + 0.5`. */
  cycle = 0;
  readonly left: FootTarget = { x: 0, y: 0, z: 0, pitch: 0 };
  readonly right: FootTarget = { x: 0, y: 0, z: 0, pitch: 0 };

  /**
   * Advance by `distance` metres of travel. Returns which feet planted this update
   * (0 = left, 1 = right) so footstep sounds land on the actual foot plant.
   */
  advance(distance: number, p: GaitParams): number[] {
    const prev = this.cycle;
    this.cycle = (this.cycle + distance / (2 * p.stepLength)) % 1;
    const planted: number[] = [];
    // a foot plants when its local cycle wraps past 0 (swing -> stance)
    if (distance > 0) {
      if (wrapped(prev, this.cycle, 0)) planted.push(0);
      if (wrapped(prev, this.cycle, 0.5)) planted.push(1);
    }
    this.solve(this.left, this.cycle, 1, p);
    this.solve(this.right, (this.cycle + 0.5) % 1, -1, p);
    return planted;
  }

  private solve(f: FootTarget, c: number, side: number, p: GaitParams) {
    // Half the foot's travel relative to the body during stance equals the distance the
    // body moves while that foot is down: stepLength * duty.
    const a = p.stepLength * p.duty;
    f.x = side * p.width;
    if (c < p.duty) {
      f.z = a * (1 - (2 * c) / p.duty);
      f.y = 0;
      f.pitch = 0;
    } else {
      const u = (c - p.duty) / (1 - p.duty);
      const e = u * u * (3 - 2 * u);
      f.z = -a + 2 * a * e;
      f.y = p.lift * Math.sin(Math.PI * u);
      f.pitch = 0.35 * Math.sin(2 * Math.PI * u) * Math.min(1, p.lift / 0.05);
    }
  }
}

/** Did the local cycle `offset` pass through 0 going from prev to next (with wrap)? */
function wrapped(prev: number, next: number, offset: number) {
  const a = (prev + 1 - offset) % 1;
  const b = (next + 1 - offset) % 1;
  return b < a;
}

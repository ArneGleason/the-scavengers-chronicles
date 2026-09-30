/**
 * Bill's pratfalls, applied on top of whatever the animator posed: the whole body tips around
 * the feet like a plank ("TIMBER"), flops onto its backside, reels, or spins through the air.
 * The player controller is locked for the duration; the caller supplies the velocity for flings.
 */
import type { BillRig } from "./billModel";
import { clamp, smoothstep } from "../../core/math";

export type Fall = "stagger" | "teeter" | "faceplant" | "buttflop" | "flung" | "tug" | "dig";

const DURATION: Record<Fall, number> = { stagger: 1.3, teeter: 1.6, faceplant: 1.7, buttflop: 1.5, flung: 0.75, tug: 99, dig: 99 };

export class Slapstick {
  state: Fall | null = null;
  private t = 0;
  private then: Fall | null = null;
  /** 0..1 how hard he's straining in a tug-of-war (set by the challenge). */
  strain = 0;

  start(kind: Fall, then: Fall | null = null) {
    this.state = kind;
    this.t = 0;
    this.then = then;
  }

  stop() {
    this.state = null;
  }

  /** Seconds the player should stay locked for this fall. */
  static lockFor(kind: Fall) {
    return kind === "stagger" ? 0.9 : kind === "flung" ? DURATION.flung + DURATION.buttflop : DURATION[kind];
  }

  /** Advance and apply to the rig (after the animator has run this frame). */
  apply(rig: BillRig, dt: number, now: number) {
    if (!this.state) return;
    this.t += dt;
    const t = this.t, sq = rig.squash;
    switch (this.state) {
      case "stagger": {
        // head snapped back, reeling side to side, easing off
        const k = 1 - smoothstep(0.3, DURATION.stagger, t);
        sq.rotation.x += -0.45 * k * (t < 0.12 ? t / 0.12 : 1);
        sq.rotation.z += 0.18 * k * Math.sin(t * 13);
        break;
      }
      case "teeter": {
        // the world has turned round and he hasn't: wobbling on the spot like a man on a ledge
        const k = smoothstep(0, 0.2, t) * (1 - smoothstep(1.1, DURATION.teeter, t));
        sq.rotation.z += 0.3 * k * Math.sin(t * 7.5);
        sq.rotation.x += 0.14 * k * Math.sin(t * 5 + 1);
        break;
      }
      case "faceplant": {
        // fall forward like a plank, bounce, lie there twitching, pop back up
        const fall = t < 0.28 ? (t / 0.28) ** 2 : 1;
        const up = smoothstep(DURATION.faceplant - 0.35, DURATION.faceplant, t);
        const bounce = t > 0.28 && t < 0.5 ? Math.sin(((t - 0.28) / 0.22) * Math.PI) * 0.12 : 0;
        sq.rotation.x += (1.48 - bounce) * fall * (1 - up);
        sq.position.y = 0.05 * fall * (1 - up);
        if (t > 0.5 && t < DURATION.faceplant - 0.35) sq.rotation.z += 0.04 * Math.sin(now * 30); // twitch
        break;
      }
      case "buttflop": {
        // straight down onto the backside, a bounce, then up
        const drop = t < 0.18 ? (t / 0.18) ** 2 : 1;
        const up = smoothstep(DURATION.buttflop - 0.4, DURATION.buttflop, t);
        const bounce = t > 0.18 && t < 0.42 ? Math.sin(((t - 0.18) / 0.24) * Math.PI) * 0.1 : 0;
        const k = drop * (1 - up);
        sq.rotation.x += -0.95 * k;
        sq.position.y = (-0.42 + bounce) * k;
        sq.position.z = -0.25 * k;
        break;
      }
      case "flung": {
        // an arc through the air, spinning; the caller moves him horizontally
        const k = clamp(t / DURATION.flung, 0, 1);
        sq.position.y = Math.sin(k * Math.PI) * 1.3;
        sq.rotation.x += -k * Math.PI * 2;
        break;
      }
      case "dig": {
        // head first into the pile, shoulders going like a dog at a flowerbed
        sq.rotation.x += 0.62 + 0.08 * Math.sin(now * 24) * (0.5 + this.strain);
        sq.rotation.z += 0.07 * Math.sin(now * 12);
        break;
      }
      case "tug": {
        // heaving backwards against something, legs braced
        sq.rotation.x += -0.35 - 0.1 * this.strain + 0.05 * Math.sin(now * 25) * this.strain;
        sq.position.z = -0.08;
        break;
      }
    }
    if (t >= DURATION[this.state]) {
      sq.position.set(0, 0, 0);
      if (this.then) { this.state = this.then; this.then = null; this.t = 0; }
      else this.state = null;
    }
  }
}

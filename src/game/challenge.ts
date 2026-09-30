/**
 * Tug-of-war: the action challenge used at key plot beats (docs/design/comedy.md). The
 * player mashes; the opponent (the ground, or Gary) pulls back steadily, with the odd surge.
 * Tuned to be easy: enthusiastic mashing always wins. Pure, so it's unit-tested.
 */
export interface TugConfig {
  /** Where the meter starts, 0..1. */
  start: number;
  /** Progress per mash. */
  gain: number;
  /** Progress lost per second to the opponent. */
  pull: number;
  /** Seconds between opponent surges (0 = none), and how much each surge takes. */
  surgeEvery: number;
  surge: number;
  /** Losing is possible only if this is set (the ground can't win; Gary can). */
  canLose: boolean;
}

export const STUMP_WRESTLE: TugConfig = { start: 0.05, gain: 0.1, pull: 0.12, surgeEvery: 0, surge: 0, canLose: false };
/** The hoard fights back: every couple of seconds a newspaper avalanche buries him a little. */
export const HOARD_DIVE: TugConfig = { start: 0, gain: 0.065, pull: 0.04, surgeEvery: 2.2, surge: 0.12, canLose: false };
/** Hammering the grate into a shelf: the thumb gets hit every few seconds. Can't be lost. */
export const HAMMER_TIME: TugConfig = { start: 0, gain: 0.07, pull: 0.035, surgeEvery: 2.4, surge: 0.1, canLose: false };
/** Bill's Legal Department: pound the typewriter; the carriage return fights back. Can't be lost. */
export const LEGAL_DEPT: TugConfig = { start: 0, gain: 0.09, pull: 0.03, surgeEvery: 2.2, surge: 0.06, canLose: false };
/** Insults at the Lug Nutz, who laugh them off in waves. Can't be lost. */
export const INSULT_VOLLEY: TugConfig = { start: 0.2, gain: 0.075, pull: 0.05, surgeEvery: 1.8, surge: 0.09, canLose: false };
/** Sticky notes at Kevin, who keeps trying to close the door. Can't be lost. */
export const THE_PITCH: TugConfig = { start: 0.05, gain: 0.045, pull: 0.03, surgeEvery: 2.0, surge: 0.08, canLose: false };
/** Life lessons at his former students, who groan in waves. Can't be lost. */
export const LIFE_LESSONS: TugConfig = { start: 0.1, gain: 0.06, pull: 0.04, surgeEvery: 1.9, surge: 0.08, canLose: false };
export const DUMPSTER_DUEL: TugConfig = { start: 0.5, gain: 0.08, pull: 0.17, surgeEvery: 1.4, surge: 0.07, canLose: true };

export type TugState = "running" | "won" | "lost";

export class Tug {
  progress: number;
  state: TugState = "running";
  elapsed = 0;
  /** Seconds since the last opponent surge (for a little visual jolt). */
  sinceSurge = 99;
  private nextSurge: number;

  constructor(readonly cfg: TugConfig) {
    this.progress = cfg.start;
    this.nextSurge = cfg.surgeEvery;
  }

  mash() {
    if (this.state !== "running") return;
    this.progress = Math.min(1, this.progress + this.cfg.gain);
    if (this.progress >= 1) this.state = "won";
  }

  update(dt: number) {
    if (this.state !== "running") return this.state;
    this.elapsed += dt;
    this.sinceSurge += dt;
    this.progress -= this.cfg.pull * dt;
    if (this.cfg.surgeEvery > 0) {
      this.nextSurge -= dt;
      if (this.nextSurge <= 0) {
        this.progress -= this.cfg.surge;
        this.nextSurge = this.cfg.surgeEvery;
        this.sinceSurge = 0;
      }
    }
    if (this.progress <= 0) {
      this.progress = 0;
      if (this.cfg.canLose) this.state = "lost";
    }
    return this.state;
  }
}

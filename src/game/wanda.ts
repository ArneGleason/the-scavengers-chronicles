/**
 * Big Wanda's brain (pure, unit-tested). She runs her junkyard and admires Bill's salvage taste
 * aggressively. Without the grate he gets admired from a respectful two and a half metres. With
 * the grate he gets chased, at a speed a hurrying Bill can beat and a shuffling one can't. A toot
 * stops her to applaud. If she catches him, main.ts throws him out of the gate.
 */
export type WandaMode = "home" | "admire" | "chase" | "applaud" | "return";

export const WANDA = {
  /** Faster than a heavy shuffle (about 1.4 m/s), slower than a heavy hurry (about 2.6 m/s). */
  chaseSpeed: 2.0,
  walkSpeed: 0.95,
  catchRadius: 0.95,
  admireRadius: 9,
  admireStop: 2.6,
  applaudTime: 2.6,
};

export interface WandaState {
  x: number;
  z: number;
  mode: WandaMode;
  applaud: number;
  home: { x: number; z: number };
}

export interface WandaWorld {
  bill: { x: number; z: number };
  carryingGrate: boolean;
  /** Is Bill inside the junkyard fence? */
  billInside: boolean;
}

export const newWanda = (home: { x: number; z: number }): WandaState => ({ x: home.x, z: home.z, mode: "home", applaud: 0, home: { ...home } });

/** A toot in her direction: she stops to applaud the man's digestive commitment. */
export function applaudWanda(w: WandaState, seconds = WANDA.applaudTime) {
  w.applaud = seconds;
  w.mode = "applaud";
}

function moveTo(w: WandaState, x: number, z: number, speed: number, dt: number, stopAt = 0) {
  const dx = x - w.x, dz = z - w.z, d = Math.hypot(dx, dz);
  if (d <= stopAt + 1e-3) return d;
  const step = Math.min(speed * dt, d - stopAt);
  w.x += (dx / d) * step;
  w.z += (dz / d) * step;
  return d - step;
}

/** One fixed step. Returns a mode change (for her lines) and whether she caught him. */
export function stepWanda(w: WandaState, world: WandaWorld, dt: number): { changed: WandaMode | null; caught: boolean } {
  const before = w.mode;
  let caught = false;
  if (w.applaud > 0) {
    w.applaud = Math.max(0, w.applaud - dt);
    if (w.applaud > 0) return { changed: null, caught };
    w.mode = "return";
  }
  const d = Math.hypot(world.bill.x - w.x, world.bill.z - w.z);
  if (world.carryingGrate && world.billInside) {
    w.mode = "chase";
    const left = moveTo(w, world.bill.x, world.bill.z, WANDA.chaseSpeed, dt);
    if (left < WANDA.catchRadius) caught = true;
  } else if (world.billInside && d < WANDA.admireRadius) {
    w.mode = "admire";
    moveTo(w, world.bill.x, world.bill.z, WANDA.walkSpeed, dt, WANDA.admireStop);
  } else {
    w.mode = moveTo(w, w.home.x, w.home.z, WANDA.walkSpeed, dt) < 0.05 ? "home" : "return";
  }
  return { changed: w.mode !== before ? w.mode : null, caught };
}

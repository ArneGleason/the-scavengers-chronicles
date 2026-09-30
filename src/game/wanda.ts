/**
 * Big Wanda's brain (pure, unit-tested). She runs her junkyard and admires Bill's salvage taste
 * aggressively.
 * - Without the grate, she hustles over and crowds him, close enough to be a threat to personal space.
 * - With the grate, she charges, and lunges when she's close. A fresh Wanda catches even a hurrying
 *   Bill, so the answer is a toot (she stops to applaud) and then the gate.
 * - The game is about comedy, not difficulty: after two catches she's winded, and a hurrying Bill
 *   gets away.
 * If she catches him, main.ts has her throw him back over the fence.
 */
export type WandaMode = "home" | "admire" | "chase" | "applaud" | "return";

export const WANDA = {
  chaseSpeed: 2.55,
  /** Speed while crowding him without the grate. */
  crowdSpeed: 1.9,
  walkSpeed: 0.95,
  catchRadius: 0.95,
  admireRadius: 11,
  admireStop: 2.6,
  /** The moment she notices the grate is gone: a freeze, a "HEY!", then the charge. */
  windup: 0.9,
  applaudTime: 2.8,
  lunge: { range: 5.5, speed: 6.5, time: 0.45, every: 1.6 },
  /** After this many catches she's winded: slower, and no more lunges. */
  windedAfter: 2,
  windedFactor: 0.62,
};

export interface WandaState {
  x: number;
  z: number;
  mode: WandaMode;
  applaud: number;
  home: { x: number; z: number };
  /** Seconds left of the current lunge, and until the next one is allowed. */
  lunge: number;
  lungeCool: number;
  catches: number;
  /** Seconds of "HEY!" left before she charges, and whether she's seen him with the grate yet. */
  windup: number;
  sawGrate: boolean;
}

export interface WandaWorld {
  bill: { x: number; z: number };
  carryingGrate: boolean;
  /** Is Bill inside the junkyard fence (or just outside it, with her grate)? */
  billInside: boolean;
}

export const newWanda = (home: { x: number; z: number }): WandaState => ({
  x: home.x, z: home.z, mode: "home", applaud: 0, home: { ...home }, lunge: 0, lungeCool: 1, catches: 0, windup: 0, sawGrate: false,
});

export const isWinded = (w: WandaState) => w.catches >= WANDA.windedAfter;

/** A toot in her direction: she stops to applaud the man's digestive commitment. */
export function applaudWanda(w: WandaState, seconds = WANDA.applaudTime) {
  w.applaud = seconds;
  w.lunge = 0;
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

/**
 * One fixed step. Returns a mode change (for her lines), whether she caught him, whether she just
 * lunged, and whether she just noticed the grate (the "HEY!").
 */
export function stepWanda(w: WandaState, world: WandaWorld, dt: number): { changed: WandaMode | null; caught: boolean; lunged: boolean; noticed: boolean } {
  const before = w.mode;
  let caught = false, lunged = false, noticed = false;
  if (world.carryingGrate && !w.sawGrate) { w.sawGrate = true; w.windup = WANDA.windup; noticed = true; }
  if (!world.carryingGrate) w.sawGrate = false;
  w.lungeCool = Math.max(0, w.lungeCool - dt);
  if (w.applaud > 0) {
    w.applaud = Math.max(0, w.applaud - dt);
    if (w.applaud > 0) return { changed: null, caught, lunged, noticed };
    w.mode = "return";
  }
  const d = Math.hypot(world.bill.x - w.x, world.bill.z - w.z);
  const winded = isWinded(w);
  if (world.carryingGrate && world.billInside) {
    w.mode = "chase";
    if (w.windup > 0) {
      w.windup = Math.max(0, w.windup - dt);
      return { changed: w.mode !== before ? w.mode : null, caught, lunged, noticed };
    }
    if (!winded && w.lunge <= 0 && w.lungeCool <= 0 && d < WANDA.lunge.range) {
      w.lunge = WANDA.lunge.time;
      w.lungeCool = WANDA.lunge.every;
      lunged = true;
    }
    const speed = w.lunge > 0 ? WANDA.lunge.speed : WANDA.chaseSpeed * (winded ? WANDA.windedFactor : 1);
    w.lunge = Math.max(0, w.lunge - dt);
    const left = moveTo(w, world.bill.x, world.bill.z, speed, dt);
    if (left < WANDA.catchRadius) {
      caught = true;
      w.catches++;
      w.lunge = 0;
      w.lungeCool = WANDA.lunge.every;
    }
  } else if (world.billInside && d < WANDA.admireRadius) {
    w.mode = "admire";
    moveTo(w, world.bill.x, world.bill.z, WANDA.crowdSpeed, dt, WANDA.admireStop);
  } else {
    w.lunge = 0;
    w.mode = moveTo(w, w.home.x, w.home.z, WANDA.walkSpeed, dt) < 0.05 ? "home" : "return";
  }
  return { changed: w.mode !== before ? w.mode : null, caught, lunged, noticed };
}

import type { Physics } from "./physics";

export const BASEMENT_Y = -2.6;
/** The basement stairs: they descend toward -X inside the back hall, top at x = 4.6. */
export const STAIRS = { xTop: 4.6, xBottom: 0.6, z0: -4.5, z1: -2.9, steps: 14 };

/**
 * Stair collision: the visible steps are solid (so nobody walks underneath them), with a
 * smooth ramp laid over the step edges for Bill's capsule to walk on.
 */
export function addStairColliders(phys: Physics) {
  const run = (STAIRS.xTop - STAIRS.xBottom) / STAIRS.steps, rise = -BASEMENT_Y / STAIRS.steps;
  // Solid steps sit a few cm below the ramp so their edges never poke through it.
  for (let i = 0; i < STAIRS.steps - 1; i++) {
    const x1 = STAIRS.xTop - i * run, x0 = x1 - run, top = -(i + 1) * rise - 0.06;
    phys.box([x0, BASEMENT_Y, STAIRS.z0], [x1, top, STAIRS.z1]);
  }
  // The ramp follows the line through every step edge exactly, and runs on below the basement
  // floor so it rises out of the floor with no lip to catch his feet.
  const slope = rise / run, under = 0.4;
  phys.ramp(STAIRS.xTop, 0, STAIRS.xBottom - under, BASEMENT_Y - under * slope, STAIRS.z0, STAIRS.z1);
}

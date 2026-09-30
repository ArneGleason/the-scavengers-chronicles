/**
 * Kevin's favours as a little state machine (pure, unit-tested): he hands one out, Bill goes and
 * does it (arrives, or stands there long enough), Bill reports back, Kevin hands out the next.
 * The list loops forever; that's the joke.
 */
import { FAVOURS, type FavourDef } from "../content/favours";

export type FavourStage = "none" | "doing" | "report";

export interface FavourState {
  stage: FavourStage;
  /** Which favour (counts up forever; the list loops). */
  n: number;
  /** Seconds he's stood there, for "wait" favours. */
  waited: number;
  /** Favours done: what Kevin owes him. */
  owed: number;
}

export const newFavours = (): FavourState => ({ stage: "none", n: 0, waited: 0, owed: 0 });
export const currentFavour = (f: FavourState): FavourDef => FAVOURS[f.n % FAVOURS.length];

/** Kevin hands out the next favour. */
export function assign(f: FavourState) {
  f.stage = "doing";
  f.waited = 0;
}

/** Bill's progress: returns "done" the step it's finished. */
export function stepFavour(f: FavourState, bill: { x: number; y: number; z: number }, dt: number): "done" | null {
  if (f.stage !== "doing") return null;
  const d = currentFavour(f), [x, , z] = d.at;
  const here = bill.y > -1 && Math.hypot(bill.x - x, bill.z - z) < d.reach;
  if (d.kind === "go") {
    if (!here) return null;
  } else {
    f.waited = here ? f.waited + dt : Math.max(0, f.waited - dt * 2);
    if (f.waited < (d.secs ?? 5)) return null;
  }
  f.stage = "report";
  f.owed++;
  return "done";
}

/** Bill reports back at Kevin's door; Kevin thanks him and hands out another. */
export function report(f: FavourState) {
  if (f.stage !== "report") return false;
  f.n++;
  assign(f);
  return true;
}

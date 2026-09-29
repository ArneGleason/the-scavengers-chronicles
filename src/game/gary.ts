/**
 * Gary the Rummager's brain (pure: positions in, decisions out). v0.2's lure rule in metres:
 * he guards the dumpster; when Bill comes near he follows him, but only on a leash; when Bill
 * gets away he drifts back slowly, which is the window to double back and grab the prize.
 * A humming Power Brick dropped near his post distracts him for a while.
 */
export interface GaryTuning {
  /** Bill within this distance of the post wakes Gary up. */
  noticeRadius: number;
  /** Gary won't follow Bill further than this from his post. */
  leash: number;
  /** Speak & Spell counts as guarded while Gary is within this distance of it. */
  guardRadius: number;
  followSpeed: number;
  /** Speed while drifting back after losing interest (slow on purpose). */
  returnSpeed: number;
  /** Seconds he keeps drifting slowly before hurrying back to his post. */
  distractedTime: number;
  returnHurrySpeed: number;
  /** A decoy within this distance of the post attracts him. */
  decoyRadius: number;
  decoyTime: number;
}

export const GARY: GaryTuning = {
  noticeRadius: 5.5,
  leash: 11,
  guardRadius: 2.2,
  followSpeed: 1.5,
  returnSpeed: 0.6,
  distractedTime: 4,
  returnHurrySpeed: 1.25,
  decoyRadius: 9,
  decoyTime: 9,
};

export type GaryMode = "guard" | "follow" | "drift" | "return" | "decoy" | "sulk" | "gag" | "binned" | "tug";

export interface GaryState {
  x: number;
  z: number;
  mode: GaryMode;
  /** Seconds left in the current timed mode (drift, decoy). */
  timer: number;
  /** Seconds before a decoy can distract him again. */
  cooldown: number;
  /** Seconds left gagging in one of Bill's clouds. */
  gag: number;
  post: { x: number; z: number };
}

export const newGary = (post: { x: number; z: number }): GaryState => ({ x: post.x, z: post.z, mode: "guard", timer: 0, cooldown: 0, gag: 0, post: { ...post } });

export interface GaryWorld {
  bill: { x: number; z: number };
  /** A dropped Power Brick, if any. */
  decoy: { x: number; z: number } | null;
  /** The prize is gone (Bill has it, or it's delivered). */
  prizeTaken: boolean;
}

const dist = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

function moveToward(g: GaryState, t: { x: number; z: number }, speed: number, dt: number, stopAt = 0.05) {
  const dx = t.x - g.x, dz = t.z - g.z, d = Math.hypot(dx, dz);
  if (d <= stopAt) return true;
  const step = Math.min(d - stopAt, speed * dt);
  g.x += (dx / d) * step;
  g.z += (dz / d) * step;
  return false;
}

/** Advance Gary. Returns the mode he just entered (for barks), or null. */
export function stepGary(g: GaryState, w: GaryWorld, dt: number, t: GaryTuning = GARY): GaryMode | null {
  const prev = g.mode;
  // a man in the dumpster, or locked in a tug-of-war, is not making decisions
  if (g.mode === "binned" || g.mode === "tug") return null;
  if (g.gag > 0) {
    g.gag -= dt;
    g.mode = g.gag > 0 ? "gag" : "return";
    return g.mode !== prev ? g.mode : null;
  }
  const billFromPost = dist(w.bill, g.post);
  g.cooldown = Math.max(0, g.cooldown - dt);
  if (w.prizeTaken) {
    if (g.mode !== "sulk") g.mode = "sulk";
    moveToward(g, g.post, t.returnHurrySpeed, dt);
  } else if (w.decoy && dist(w.decoy, g.post) < t.decoyRadius && g.mode !== "decoy" && g.cooldown <= 0) {
    g.mode = "decoy";
    g.timer = t.decoyTime;
  }
  if (!w.prizeTaken) {
    switch (g.mode) {
      case "decoy":
        g.timer -= dt;
        if (!w.decoy || g.timer <= 0) { g.mode = "return"; g.timer = 0; g.cooldown = 12; break; }
        moveToward(g, w.decoy, t.followSpeed, dt, 0.6);
        break;
      case "guard":
        if (billFromPost < t.noticeRadius) g.mode = "follow";
        else moveToward(g, g.post, t.returnHurrySpeed, dt);
        break;
      case "follow": {
        // shadow Bill, keeping a step away, but never past the leash
        const beyond = dist(g, g.post) >= t.leash;
        if (billFromPost > t.leash + 1.5 || beyond) { g.mode = "drift"; g.timer = t.distractedTime; break; }
        moveToward(g, w.bill, t.followSpeed, dt, 1.1);
        break;
      }
      case "drift":
        g.timer -= dt;
        if (billFromPost < t.noticeRadius && dist(g, w.bill) < t.noticeRadius) { g.mode = "follow"; break; }
        moveToward(g, g.post, t.returnSpeed, dt);
        if (g.timer <= 0) g.mode = "return";
        break;
      case "return":
        if (billFromPost < t.noticeRadius && dist(g, w.bill) < 3) { g.mode = "follow"; break; }
        if (moveToward(g, g.post, t.returnHurrySpeed, dt)) g.mode = "guard";
        break;
      case "sulk":
        break;
    }
  }
  return g.mode !== prev ? g.mode : null;
}

/** Bill's cloud reached him: he's busy gagging for a while. */
export function gagGary(g: GaryState, seconds: number) {
  if (g.mode === "binned" || g.mode === "sulk") return false;
  g.gag = Math.max(g.gag, seconds);
  return true;
}

/** Is the prize (at `prize`) guarded right now? */
export const isGuarded = (g: GaryState, prize: { x: number; z: number }, t: GaryTuning = GARY) =>
  !["sulk", "gag", "binned"].includes(g.mode) && g.gag <= 0 && dist(g, prize) < t.guardRadius;

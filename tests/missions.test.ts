import { describe, expect, it } from "vitest";
import { newMissionState, onPickup, onDrop, deliverable, deliver, objective, cycleActive, allDone } from "../src/game/missions";
import { newGary, stepGary, isGuarded, gagGary, GARY } from "../src/game/gary";
import { Tug, STUMP_WRESTLE, DUMPSTER_DUEL } from "../src/game/challenge";
import { GagDirector } from "../src/game/gags";

describe("mission chain", () => {
  it("starts on the cable pilgrimage with only that errand open", () => {
    const s = newMissionState();
    expect(s.active).toBe("cablePilgrimage");
    expect(objective(s)?.point).toBe("basementHoard");
    expect(s.stages.dumpsterDiplomacy).toBe("locked");
  });

  it("find, deliver, then unlock the stump and Speak & Spell errands", () => {
    const s = newMissionState();
    expect(onPickup(s, "dinCable")).toEqual([{ type: "picked", mission: "cablePilgrimage" }]);
    expect(objective(s)?.point).toBe("synthAltar");
    expect(deliverable(s, "synthAltar", ["powerBrick"])).toBeNull();
    expect(deliverable(s, "shelfZone", ["dinCable"])).toBeNull();
    expect(deliverable(s, "synthAltar", ["dinCable"])).toBe("cablePilgrimage");
    const ev = deliver(s, "cablePilgrimage");
    expect(ev[0]).toEqual({ type: "completed", mission: "cablePilgrimage", unlocked: ["stumpProphecy"] });
    expect(ev[1]).toEqual({ type: "selected", mission: "stumpProphecy" });
    expect(s.stages.dumpsterDiplomacy).toBe("locked");
  });

  it("items picked up early still count, and dropping sends the errand back to finding", () => {
    const s = newMissionState();
    onPickup(s, "speakAndSpell"); // locked errand: nothing happens yet
    expect(s.stages.dumpsterDiplomacy).toBe("locked");
    onPickup(s, "dinCable");
    onDrop(s, "dinCable");
    expect(s.stages.cablePilgrimage).toBe("find");
  });

  it("runs in a straight line: cable, then stump, then Speak & Spell", () => {
    const s = newMissionState();
    onPickup(s, "dinCable");
    deliver(s, "cablePilgrimage");
    expect(cycleActive(s)).toBe("stumpProphecy"); // only one errand is ever open
    onPickup(s, "personalityStump");
    const ev = deliver(s, "stumpProphecy");
    expect(ev[1]).toEqual({ type: "selected", mission: "dumpsterDiplomacy" });
    onPickup(s, "speakAndSpell");
    deliver(s, "dumpsterDiplomacy");
    expect(allDone(s)).toBe(true);
    expect(s.active).toBeNull();
  });
});

describe("Gary the Rummager", () => {
  const post = { x: 0, z: 0 };
  const prize = { x: 0.6, z: 0.3 };
  const run = (g: ReturnType<typeof newGary>, bill: { x: number; z: number }, seconds: number, decoy: { x: number; z: number } | null = null) => {
    for (let i = 0; i < seconds * 60; i++) stepGary(g, { bill, decoy, prizeTaken: false }, 1 / 60);
  };

  it("guards the prize while Bill is far away", () => {
    const g = newGary(post);
    run(g, { x: 20, z: 0 }, 2);
    expect(g.mode).toBe("guard");
    expect(isGuarded(g, prize)).toBe(true);
  });

  it("follows Bill when he comes close, but only to the end of his leash", () => {
    const g = newGary(post);
    run(g, { x: 4, z: 0 }, 1);
    expect(g.mode).toBe("follow");
    // Bill walks away slowly; Gary shadows him and stops at the leash
    for (let x = 4; x < 20; x += 0.02) stepGary(g, { bill: { x, z: 0 }, decoy: null, prizeTaken: false }, 1 / 60);
    expect(Math.hypot(g.x, g.z)).toBeLessThanOrEqual(GARY.leash + 0.05);
    expect(["drift", "return"]).toContain(g.mode);
  });

  it("drifts back slowly enough that a hurrying Bill wins the race back", () => {
    const g = newGary(post);
    g.x = GARY.leash; g.mode = "drift"; g.timer = GARY.distractedTime;
    // Bill hurries (3.3 m/s) from just past Gary back to the prize
    let bill = { x: GARY.leash + 1, z: 0 };
    let t = 0;
    while (Math.hypot(bill.x - prize.x, bill.z - prize.z) > 0.8 && t < 20) {
      bill = { x: bill.x - 3.3 / 60, z: 0 };
      stepGary(g, { bill, decoy: null, prizeTaken: false }, 1 / 60);
      t += 1 / 60;
    }
    expect(isGuarded(g, prize)).toBe(false);
  });

  it("wanders off to investigate a humming Power Brick, comes back, and gets re-lured later", () => {
    const g = newGary(post);
    const brick = { x: -6, z: 2 };
    run(g, { x: 30, z: 0 }, 6, brick);
    expect(g.mode).toBe("decoy");
    expect(isGuarded(g, prize)).toBe(false);
    run(g, { x: 30, z: 0 }, GARY.decoyTime - 6 + 8, brick);
    expect(g.mode).toBe("guard"); // back on duty during the cooldown
    run(g, { x: 30, z: 0 }, 12, brick);
    expect(g.mode).toBe("decoy"); // the brick is still humming
  });
});

describe("Gary and the soup cloud", () => {
  it("gags, stops guarding, then goes back to his post", () => {
    const g = newGary({ x: 0, z: 0 });
    expect(gagGary(g, 3)).toBe(true);
    stepGary(g, { bill: { x: 1, z: 0 }, decoy: null, prizeTaken: false }, 1 / 60);
    expect(g.mode).toBe("gag");
    expect(isGuarded(g, { x: 0.5, z: 0 })).toBe(false);
    for (let i = 0; i < 4 * 60; i++) stepGary(g, { bill: { x: 20, z: 0 }, decoy: null, prizeTaken: false }, 1 / 60);
    expect(["return", "guard"]).toContain(g.mode);
  });
});

describe("tug-of-war challenges", () => {
  const play = (cfg: typeof STUMP_WRESTLE, mashesPerSecond: number, seconds = 12) => {
    const t = new Tug(cfg);
    const dt = 1 / 60;
    let acc = 0;
    for (let i = 0; i < seconds * 60 && t.state === "running"; i++) {
      acc += mashesPerSecond * dt;
      while (acc >= 1) { t.mash(); acc -= 1; }
      t.update(dt);
    }
    return t;
  };

  it("the stump comes out for anyone mashing at a relaxed 4 presses a second, in about 3 seconds", () => {
    const t = play(STUMP_WRESTLE, 4);
    expect(t.state).toBe("won");
    expect(t.elapsed).toBeLessThan(4.5);
  });

  it("the ground never wins, however lazy the player", () => {
    expect(play(STUMP_WRESTLE, 0.5, 30).state).toBe("running");
  });

  it("Gary beats a player who barely tries, and loses to one who mashes", () => {
    expect(play(DUMPSTER_DUEL, 1).state).toBe("lost");
    const t = play(DUMPSTER_DUEL, 5);
    expect(t.state).toBe("won");
    expect(t.elapsed).toBeLessThan(5);
  });
});

describe("the gag clock", () => {
  it("stays quiet right after a gag, then supplies one that's eligible and off cooldown", () => {
    const d = new GagDirector<"poop" | "wind">(12);
    d.mark(0);
    const opts = [{ id: "poop" as const, ok: true, cooldown: 60 }, { id: "wind" as const, ok: false, cooldown: 30 }];
    expect(d.pick(5, opts, () => 0)).toBeNull();
    expect(d.pick(13, opts, () => 0)).toBe("poop");
    // poop is on cooldown and wind isn't eligible
    expect(d.pick(40, opts, () => 0)).toBeNull();
    expect(d.perMinute(40)).toBe(2);
  });
});

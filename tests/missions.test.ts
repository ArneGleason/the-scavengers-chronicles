import { describe, expect, it } from "vitest";
import { newMissionState, onPickup, onDrop, deliverable, deliver, objective, cycleActive, allDone } from "../src/game/missions";
import { newGary, stepGary, isGuarded, GARY } from "../src/game/gary";

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
    expect(ev[0]).toEqual({ type: "completed", mission: "cablePilgrimage", unlocked: ["stumpProphecy", "dumpsterDiplomacy"] });
    expect(ev[1]).toEqual({ type: "selected", mission: "stumpProphecy" });
  });

  it("items picked up early still count, and dropping sends the errand back to finding", () => {
    const s = newMissionState();
    onPickup(s, "speakAndSpell"); // locked errand: nothing happens yet
    expect(s.stages.dumpsterDiplomacy).toBe("locked");
    onPickup(s, "dinCable");
    onDrop(s, "dinCable");
    expect(s.stages.cablePilgrimage).toBe("find");
  });

  it("M cycles between open errands, and all three can be completed", () => {
    const s = newMissionState();
    onPickup(s, "dinCable");
    deliver(s, "cablePilgrimage");
    expect(cycleActive(s)).toBe("dumpsterDiplomacy");
    expect(cycleActive(s)).toBe("stumpProphecy");
    onPickup(s, "personalityStump");
    deliver(s, "stumpProphecy");
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
    // Bill hurries (2.4 m/s) from just past Gary back to the prize
    let bill = { x: GARY.leash + 1, z: 0 };
    let t = 0;
    while (Math.hypot(bill.x - prize.x, bill.z - prize.z) > 0.8 && t < 20) {
      bill = { x: bill.x - 2.4 / 60, z: 0 };
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

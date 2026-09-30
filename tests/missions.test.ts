import { describe, expect, it } from "vitest";
import { newMissionState, onPickup, onDrop, deliverable, deliver, objective, cycleActive, allDone, syncCarrying } from "../src/game/missions";
import { newGary, stepGary, isGuarded, gagGary, GARY } from "../src/game/gary";
import { Tug, STUMP_WRESTLE, DUMPSTER_DUEL, HOARD_DIVE } from "../src/game/challenge";
import { newJam, press, nextKey } from "../src/game/jam";
import { newSoup, collect, distill, canDistill, isReady, eat } from "../src/game/soup";
import { INGREDIENTS, DISTILLATIONS, type IngredientId } from "../src/content/soup";
import { newWanda, stepWanda, applaudWanda, WANDA } from "../src/game/wanda";
import { nextWaypoint, regionOf } from "../src/game/wayfinding";
import { newFavours, assign, stepFavour, report, currentFavour } from "../src/game/favours";
import { FAVOURS } from "../src/content/favours";
import { zoneOf, MUSINGS, HINTS } from "../src/content/musings";
import { MISSION_ORDER } from "../src/content/missions";
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
    const ev3 = deliver(s, "dumpsterDiplomacy");
    expect(ev3[0]).toMatchObject({ unlocked: ["grateShelf"] });
    expect(objective(s)?.point).toBe("junkyard");
    // errand 4 has two legs: the grate to the workbench, then the shelf to the vault
    onPickup(s, "rustyGrate");
    expect(deliverable(s, "workbench", ["rustyGrate"])).toBe("grateShelf");
    deliver(s, "grateShelf");
    expect(objective(s)).toMatchObject({ mission: "grateVault", point: "workbench" });
    onPickup(s, "grateShelf");
    expect(deliverable(s, "vault", ["grateShelf"])).toBe("grateVault");
    deliver(s, "grateVault");
    // then the street: the noise complaint, Kevin's parcels, and the pitch
    expect(objective(s)).toMatchObject({ mission: "noiseComplaint", point: "typewriter" });
    for (const [id, item, drop] of [["noiseComplaint", "complaint", "gymDoor"], ["parcelProtection", "parcels", "billStoop"], ["thePitch", "movieIdeas", "kevinDoor"], ["vinegarReserve", "vinegarJug", "reserveShelf"], ["cheesecloth", "cheesecloth", "frame"], ["theManuscript", "manuscript", "kevinDoor"], ["firstPage", "firstPage", "students"]] as const) {
      expect(s.active).toBe(id);
      onPickup(s, item);
      expect(deliverable(s, drop, [item])).toBe(id);
      deliver(s, id);
    }
    expect(allDone(s)).toBe(true);
    expect(s.active).toBeNull();
  });
});

describe("errands out of order", () => {
  it("an item grabbed early turns its errand straight into a delivery when the chain reaches it", () => {
    const s = newMissionState();
    const carrying = ["speakAndSpell"] as const;
    syncCarrying(s, carrying); // still locked: nothing to do yet
    expect(s.stages.dumpsterDiplomacy).toBe("locked");
    onPickup(s, "dinCable");
    deliver(s, "cablePilgrimage", carrying);
    onPickup(s, "personalityStump");
    const ev = deliver(s, "stumpProphecy", carrying);
    expect(s.stages.dumpsterDiplomacy).toBe("deliver");
    expect(ev.at(-1)).toEqual({ type: "selected", mission: "dumpsterDiplomacy" });
    expect(objective(s)).toMatchObject({ point: "synthAltar" }); // not "go to Gary's"
  });

  it("an item delivered early completes its errand, and the chain skips it later", () => {
    const s = newMissionState();
    expect(deliverable(s, "synthAltar", ["speakAndSpell"])).toBe("dumpsterDiplomacy");
    const early = deliver(s, "dumpsterDiplomacy");
    expect(early[0]).toMatchObject({ type: "completed", mission: "dumpsterDiplomacy", early: true, unlocked: [] });
    expect(s.stages.grateShelf).toBe("locked"); // nothing opens out of turn
    expect(s.active).toBe("cablePilgrimage");
    onPickup(s, "dinCable");
    deliver(s, "cablePilgrimage");
    onPickup(s, "personalityStump");
    const ev = deliver(s, "stumpProphecy");
    expect(ev).toContainEqual({ type: "alreadyDone", mission: "dumpsterDiplomacy" });
    expect(s.stages.grateShelf).toBe("find");
    expect(s.active).toBe("grateShelf");
  });

  it("losing the item sends a delivery back to a search", () => {
    const s = newMissionState();
    onPickup(s, "dinCable");
    expect(syncCarrying(s, [])).toBe(true);
    expect(s.stages.cablePilgrimage).toBe("find");
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

  it("the hoard gives up the cable to steady mashing, avalanches and all, and can't be lost", () => {
    const t = play(HOARD_DIVE, 5);
    expect(t.state).toBe("won");
    expect(t.elapsed).toBeGreaterThan(2.2); // long enough for at least one avalanche
    expect(t.elapsed).toBeLessThan(6);
    expect(play(HOARD_DIVE, 0, 30).state).toBe("running");
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

describe("the masterpiece, as performed", () => {
  it("plays two notes back and forth, then the third goes sour however right the key was", () => {
    const j = newJam();
    expect(nextKey(j)).toBe("E");
    expect(press(j, "R")).toBeNull(); // wrong key: nothing happens
    expect(press(j, "E")).toEqual({ midi: 62, sour: false });
    expect(press(j, "R")).toEqual({ midi: 69, sour: false });
    expect(press(j, "E")).toEqual({ midi: 62, sour: true });
    expect(j.done).toBe(true);
    expect(nextKey(j)).toBeNull();
    expect(press(j, "R")).toBeNull();
  });
});

describe("the soup's ten distillations", () => {
  it("needs ten ingredients, one per distillation, before it can be eaten", () => {
    const s = newSoup();
    expect(canDistill(s)).toBe(false);
    const ids = Object.keys(INGREDIENTS) as IngredientId[];
    expect(ids.length).toBeGreaterThanOrEqual(DISTILLATIONS); // enough in the world, with spares
    expect(collect(s, ids[0])).toBe(true);
    expect(collect(s, ids[0])).toBe(false); // each ingredient only once
    expect(distill(s)).toEqual({ ingredient: ids[0], n: 1, ready: false });
    expect(eat(s)).toBe(false);
    for (const id of ids.slice(1, DISTILLATIONS)) collect(s, id);
    let last = null;
    while (canDistill(s)) last = distill(s);
    expect(last).toMatchObject({ n: DISTILLATIONS, ready: true });
    expect(isReady(s)).toBe(true);
    collect(s, ids[DISTILLATIONS]);
    expect(canDistill(s)).toBe(false); // ten is plenty
    expect(eat(s)).toBe(true);
    expect(eat(s)).toBe(false);
  });
});

describe("Big Wanda", () => {
  const home = { x: 0, z: 0 };
  const run = (billSpeed: number, carrying = true, seconds = 8, w = newWanda(home), start = 4) => {
    const bill = { x: start, z: 0 };
    for (let i = 0; i < seconds * 60; i++) {
      bill.x += billSpeed / 60; // running away from her
      const r = stepWanda(w, { bill, carryingGrate: carrying, billInside: true }, 1 / 60);
      if (r.caught) return { caught: true, w };
    }
    return { caught: false, w };
  };

  it("fresh, she catches a man running off with the grate, even hurrying (after a HEY!, she lunges)", () => {
    expect(run(1.4).caught).toBe(true);
    // she's been crowding him, so she starts about her crowding distance away
    expect(run(2.6, true, 12, newWanda(home), WANDA.admireStop).caught).toBe(true);
  });

  it("after two catches she's winded, and a hurrying man gets away", () => {
    const w = newWanda(home);
    w.catches = WANDA.windedAfter;
    expect(run(2.6, true, 8, w, WANDA.admireStop).caught).toBe(false);
  });

  it("without the grate she crowds him, but never catches him", () => {
    const { caught, w } = run(0, false, 10);
    expect(caught).toBe(false);
    expect(w.mode).toBe("admire");
    expect(Math.hypot(4 - w.x, w.z)).toBeCloseTo(WANDA.admireStop, 1);
  });

  it("stops to applaud a toot, then carries on", () => {
    const w = newWanda(home);
    applaudWanda(w, 1);
    const bill = { x: 3, z: 0 };
    for (let i = 0; i < 30; i++) stepWanda(w, { bill, carryingGrate: true, billInside: true }, 1 / 60);
    expect(w.x).toBe(0);
    for (let i = 0; i < 90; i++) stepWanda(w, { bill, carryingGrate: true, billInside: true }, 1 / 60); // "HEY!", then the charge
    expect(w.mode).toBe("chase");
    expect(w.x).toBeGreaterThan(0);
  });

  it("gives up and goes home when he's out of reach", () => {
    const w = newWanda(home);
    w.x = 5;
    let last = null;
    for (let i = 0; i < 60 * 8; i++) last = stepWanda(w, { bill: { x: 20, z: 0 }, carryingGrate: true, billInside: false }, 1 / 60);
    expect(w.mode).toBe("home");
    expect(last?.caught).toBe(false);
  });
});

describe("wayfinding: the arrow goes through doors, not walls", () => {
  it("knows which region he's in", () => {
    expect(regionOf({ x: 0, y: -2.6, z: 0 })).toBe("basement");
    expect(regionOf({ x: 0, y: 0, z: 0 })).toBe("house");
    expect(regionOf({ x: 0, y: 0, z: -8 })).toBe("yard");
    expect(regionOf({ x: 0, y: 0, z: -15 })).toBe("outside");
    expect(regionOf({ x: 54, y: 0, z: 7 })).toBe("junkyard");
  });
  it("points straight at a goal in the same region", () => {
    expect(nextWaypoint({ x: 0, y: 0, z: 10 }, { x: -3, y: 0, z: 11 })).toBeNull();
  });
  it("from the back yard to the basement: the back door first", () => {
    expect(nextWaypoint({ x: -3, y: 0, z: 10 }, { x: -2, y: -2.6, z: 0.8 })?.label).toBe("BACK DOOR");
  });
  it("from inside the house to the basement: the stairs", () => {
    expect(nextWaypoint({ x: 3, y: 0, z: 2 }, { x: -2, y: -2.6, z: 0.8 })?.label).toBe("STAIRS");
  });
  it("from the basement to the lane: the stairs first", () => {
    expect(nextWaypoint({ x: -2, y: -2.6, z: 0 }, { x: 25, y: 0, z: 14 })?.label).toBe("STAIRS");
  });
  it("from the street to the house: the front gate; from the lane: the back gate", () => {
    expect(nextWaypoint({ x: 0, y: 0, z: -16 }, { x: 0, y: 0, z: 1 })?.label).toBe("FRONT GATE");
    expect(nextWaypoint({ x: 0, y: 0, z: 17 }, { x: 0, y: 0, z: 1 })?.label).toBe("BACK GATE");
  });
  it("into the junkyard through its gate", () => {
    const w = nextWaypoint({ x: 40, y: 0, z: 18 }, { x: 54.5, y: 0, z: 7.4 });
    expect(w?.label).toBe("JUNKYARD GATE");
    expect(w?.at.z).toBeGreaterThan(15);
  });
});

describe("Kevin's favours", () => {
  it("go there, report back, get another one, forever", () => {
    const f = newFavours();
    assign(f);
    const go = FAVOURS.findIndex((d) => d.kind === "go");
    f.n = go;
    const [x, , z] = currentFavour(f).at;
    expect(stepFavour(f, { x: x + 20, y: 0, z }, 0.1)).toBeNull();
    expect(stepFavour(f, { x, y: 0, z }, 0.1)).toBe("done");
    expect(f.stage).toBe("report");
    expect(report(f)).toBe(true);
    expect(f.stage).toBe("doing");
    expect(f.owed).toBe(1);
  });
  it("wait favours need him to stand there, and lose progress if he wanders off", () => {
    const f = newFavours();
    assign(f);
    const d = currentFavour(f);
    expect(d.kind).toBe("wait");
    const [x, , z] = d.at;
    for (let i = 0; i < 20; i++) stepFavour(f, { x, y: 0, z }, 0.1);
    expect(f.stage).toBe("doing");
    stepFavour(f, { x: x + 20, y: 0, z }, 1);
    expect(f.waited).toBeLessThan(1);
    let r = null;
    for (let i = 0; i < 200 && !r; i++) r = stepFavour(f, { x, y: 0, z }, 0.1);
    expect(r).toBe("done");
  });
  it("loops through the whole list", () => {
    const f = newFavours();
    f.n = FAVOURS.length;
    expect(currentFavour(f)).toBe(FAVOURS[0]);
  });
});

describe("Bill's musings", () => {
  it("knows where he is", () => {
    expect(zoneOf({ x: -3, y: 0, z: 2 })).toBe("kitchen");
    expect(zoneOf({ x: -2, y: -2.6, z: 0.8 })).toBe("hoard");
    expect(zoneOf({ x: 0, y: 0, z: -8 })).toBe("frontYard");
    expect(zoneOf({ x: 0.2, y: 0, z: -23 })).toBe("kevins");
    expect(zoneOf({ x: 30, y: 0, z: -12 })).toBe("sidewalk");
    expect(zoneOf({ x: 54, y: 0, z: 7 })).toBe("junkyard");
  });
  it("has lines for every area and a hint for every errand", () => {
    for (const lines of Object.values(MUSINGS)) expect(lines.length).toBeGreaterThan(0);
    for (const id of MISSION_ORDER) expect(HINTS[id]?.find.length && HINTS[id]?.deliver.length).toBeTruthy();
  });
});

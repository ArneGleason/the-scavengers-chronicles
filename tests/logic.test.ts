import { describe, expect, it } from "vitest";
import { newInventory, pickUp, drop, canPickUp, carriedMass } from "../src/game/inventory";
import { pickTarget } from "../src/game/interact";
import { Gait, SHUFFLE, HURRY } from "../src/actors/bill/gait";
import { SecondOrder, angleDelta, moveTowards2, damp } from "../src/core/math";

describe("inventory", () => {
  it("fills four satchel slots, then refuses", () => {
    const inv = newInventory();
    for (const id of ["dinCable", "powerBrick", "cableBundle", "speakAndSpell"] as const) expect(pickUp(inv, id)).toEqual({ ok: true, to: "satchel" });
    expect(pickUp(inv, "newspaperBundle")).toEqual({ ok: false, reason: "satchelFull" });
    expect(inv.satchel).toHaveLength(4);
  });

  it("puts heavy things in his hands, one at a time, without blocking the satchel", () => {
    const inv = newInventory();
    expect(pickUp(inv, "personalityStump")).toEqual({ ok: true, to: "hands" });
    expect(canPickUp(inv, "personalityStump")).toEqual({ ok: false, reason: "handsFull" });
    expect(pickUp(inv, "dinCable")).toEqual({ ok: true, to: "satchel" });
  });

  it("drops the heavy item first, then the latest satchel find", () => {
    const inv = newInventory();
    pickUp(inv, "dinCable");
    pickUp(inv, "powerBrick");
    pickUp(inv, "personalityStump");
    expect(drop(inv)).toBe("personalityStump");
    expect(drop(inv)).toBe("powerBrick");
    expect(drop(inv)).toBe("dinCable");
    expect(drop(inv)).toBeNull();
  });

  it("adds up carried mass", () => {
    const inv = newInventory();
    pickUp(inv, "personalityStump");
    pickUp(inv, "dinCable");
    expect(carriedMass(inv)).toBeCloseTo(18.2);
  });
});

describe("interaction targeting", () => {
  const bill = { x: 0, y: 0, z: 0, facing: 0 }; // facing +Z
  it("prefers what is in front of him over something equally close behind", () => {
    const t = pickTarget(bill, [
      { id: "behind", x: 0, z: -0.8, reach: 1 },
      { id: "ahead", x: 0, z: 0.8, reach: 1 },
    ]);
    expect(t?.id).toBe("ahead");
  });
  it("ignores things out of reach or on another floor", () => {
    expect(pickTarget(bill, [{ id: "far", x: 0, z: 2, reach: 1 }])).toBeNull();
    expect(pickTarget(bill, [{ id: "downstairs", x: 0, z: 0.5, y: -2.6, reach: 1 }])).toBeNull();
  });
});

describe("gait", () => {
  it("keeps the stance foot planted: its world position doesn't move while it's down", () => {
    for (const params of [SHUFFLE, HURRY]) {
      const g = new Gait();
      const v = 1.4, dt = 1 / 120;
      let body = 0;
      let plantedAt: number | null = null;
      let maxSlide = 0;
      for (let i = 0; i < 600; i++) {
        body += v * dt;
        g.advance(v * dt, params);
        const foot = g.left;
        if (foot.y === 0) {
          const world = body + foot.z;
          if (plantedAt === null) plantedAt = world;
          maxSlide = Math.max(maxSlide, Math.abs(world - plantedAt));
        } else plantedAt = null;
      }
      expect(maxSlide).toBeLessThan(0.02);
    }
  });

  it("reports one plant per step", () => {
    const g = new Gait();
    let plants = 0;
    const dist = 10;
    for (let i = 0; i < 1000; i++) plants += g.advance(dist / 1000, SHUFFLE).length;
    expect(plants).toBeGreaterThanOrEqual(Math.floor(dist / SHUFFLE.stepLength) - 1);
    expect(plants).toBeLessThanOrEqual(Math.ceil(dist / SHUFFLE.stepLength) + 1);
  });
});

describe("math", () => {
  it("second-order spring settles on its target and stays stable at large steps", () => {
    const s = new SecondOrder(3, 0.3);
    s.reset(0);
    for (let i = 0; i < 400; i++) s.step(1 / 60, 1);
    expect(s.y).toBeCloseTo(1, 3);
    const big = new SecondOrder(6, 0.1);
    big.reset(0);
    for (let i = 0; i < 50; i++) big.step(0.25, 1);
    expect(Number.isFinite(big.y)).toBe(true);
    expect(Math.abs(big.y)).toBeLessThan(10);
  });

  it("wraps angles the short way", () => {
    expect(angleDelta(3, -3)).toBeCloseTo(2 * Math.PI - 6);
    expect(angleDelta(-3, 3)).toBeCloseTo(-(2 * Math.PI - 6));
  });

  it("moveTowards never overshoots and damp is frame-rate independent", () => {
    const v = { x: 0, y: 0 };
    moveTowards2(v, 1, 0, 0.3);
    expect(v.x).toBeCloseTo(0.3);
    moveTowards2(v, 1, 0, 5);
    expect(v.x).toBe(1);
    let a = 0, b = 0;
    for (let i = 0; i < 60; i++) a = damp(a, 1, 5, 1 / 60);
    for (let i = 0; i < 120; i++) b = damp(b, 1, 5, 1 / 120);
    expect(a).toBeCloseTo(b, 6);
  });
});

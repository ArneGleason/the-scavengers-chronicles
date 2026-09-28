import { describe, expect, it } from "vitest";
import * as THREE from "three/webgpu";
import { Physics } from "../src/world/physics";
import { Player } from "../src/actors/player";
import { addStairColliders } from "../src/world/stairs";
import { DEG } from "../src/core/math";

/** The basement stairs, alone: basement floor, hall floor at the top, and the stair colliders. */
async function stairsWorld() {
  const phys = await Physics.create();
  phys.box([-6, -2.8, -5], [6, -2.6, 5]); // basement floor
  phys.box([4.6, -0.2, -5], [6, 0, 0]); // hall floor beside the stairwell top
  phys.box([6, -0.2, -5], [6.2, 3, 0]); // the house's east wall, so he stops at the top
  addStairColliders(phys);
  return phys;
}

/** Walk with a screen-space input for `seconds`; returns the path. */
function walk(phys: Physics, player: Player, move: { x: number; y: number }, seconds: number, hurry = false) {
  const dt = 1 / 60;
  const path: THREE.Vector3[] = [];
  for (let i = 0; i < seconds * 60; i++) {
    player.step(dt, move, true, hurry, 45 * DEG);
    phys.step(dt);
    if (i % 30 === 0) path.push(player.pos.clone());
  }
  return path;
}

// With the camera at yaw 45°, world +X is screen right + down.
const TOWARD_PLUS_X = { x: Math.SQRT1_2, y: -Math.SQRT1_2 };
const TOWARD_MINUS_X = { x: -Math.SQRT1_2, y: Math.SQRT1_2 };

describe("basement stairs", () => {
  it("climbs from the basement up to the hall", async () => {
    const phys = await stairsWorld();
    const player = new Player(phys, new THREE.Vector3(0.1, -2.6, -3.7));
    walk(phys, player, TOWARD_PLUS_X, 6);
    expect(player.pos.y).toBeGreaterThan(-0.05);
    expect(player.pos.x).toBeGreaterThan(4.6);
  });

  it("climbs while hurrying and while carrying something heavy", async () => {
    for (const setup of [{ hurry: true, heavy: 0 }, { hurry: false, heavy: 1 }]) {
      const phys = await stairsWorld();
      const player = new Player(phys, new THREE.Vector3(0.1, -2.6, -3.7));
      player.heavy = setup.heavy;
      walk(phys, player, TOWARD_PLUS_X, 8, setup.hurry);
      expect(player.pos.y).toBeGreaterThan(-0.05);
    }
  });

  it("walks down from the hall to the basement", async () => {
    const phys = await stairsWorld();
    const player = new Player(phys, new THREE.Vector3(5.3, 0, -3.7));
    walk(phys, player, TOWARD_MINUS_X, 6);
    expect(player.pos.y).toBeLessThan(-2.5);
    expect(player.pos.x).toBeLessThan(0.6);
  });
});

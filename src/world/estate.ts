/**
 * The estate greybox for the walking toy: his late mother's 1955 house (kitchen, living room,
 * back hall with the antique vault), stairs down to the 1986 basement, and the backyard.
 * Units are metres; the camera looks from +X+Z, so the backyard (+Z) sits toward the viewer.
 */
import * as THREE from "three/webgpu";
import { StaticBuilder, Walls, Surfaces, type Tag } from "./builder";
import type { Physics } from "./physics";
import { P } from "../content/palette";
import { canvasTex, flat, toon } from "../render/comicMaterial";
import type { ItemId } from "../content/items";
import { BASEMENT_Y, STAIRS, addStairColliders } from "./stairs";

export { BASEMENT_Y, STAIRS };

export const HOUSE = { x0: -6, x1: 6, z0: -5, z1: 5 };
export const WALL_H = 2.6;

export interface Estate {
  builder: StaticBuilder;
  walls: Walls;
  surfaces: Surfaces;
  itemSpawns: { id: ItemId; at: THREE.Vector3 }[];
  junkSpawns: { kind: "box" | "crate" | "bucket"; at: THREE.Vector3 }[];
  spawn: THREE.Vector3;
  leds: THREE.Mesh[];
}

/* ---------- textures ---------- */
const linoTex = canvasTex(64, 64, (g) => {
  g.fillStyle = P.lino1; g.fillRect(0, 0, 64, 64);
  g.fillStyle = P.lino2; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32);
}, { nearest: true, repeat: true });
const plankTex = canvasTex(64, 64, (g) => {
  g.fillStyle = P.hardwood; g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#946338";
  for (let i = 0; i < 4; i++) { g.fillRect(0, i * 16 + 15, 64, 1); g.fillRect(((i * 23) % 64), i * 16, 1, 16); }
}, { nearest: true, repeat: true });
const carpetTex = canvasTex(32, 32, (g) => {
  g.fillStyle = P.carpet; g.fillRect(0, 0, 32, 32);
  g.fillStyle = "rgba(90,40,25,.18)";
  for (let y = 0; y < 32; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < 32; x += 4) g.fillRect(x, y, 1, 1);
}, { nearest: true, repeat: true });
const concreteTex = canvasTex(64, 64, (g) => {
  g.fillStyle = P.concrete; g.fillRect(0, 0, 64, 64);
  g.fillStyle = "rgba(60,55,50,.18)";
  for (let i = 0; i < 40; i++) g.fillRect((i * 37) % 64, (i * 53) % 64, 2, 2);
  g.fillStyle = "rgba(60,55,50,.35)"; g.fillRect(0, 63, 64, 1); g.fillRect(63, 0, 1, 64);
}, { nearest: true, repeat: true });
const grassTex = canvasTex(64, 64, (g) => {
  g.fillStyle = P.grass; g.fillRect(0, 0, 64, 64);
  g.fillStyle = P.grassDark;
  for (let i = 0; i < 70; i++) { const x = (i * 29) % 64, y = (i * 41) % 64; g.fillRect(x, y, 1, 3); }
}, { nearest: true, repeat: true });
const rugTex = canvasTex(64, 64, (g) => {
  g.fillStyle = P.cream; g.fillRect(0, 0, 64, 64);
  g.strokeStyle = P.rose; g.lineWidth = 4; g.strokeRect(4, 4, 56, 56);
  g.fillStyle = P.mustard; g.beginPath(); g.arc(32, 32, 12, 0, 7); g.fill();
  g.fillStyle = P.rose; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.fillRect(32 + Math.cos(a) * 20 - 2, 32 + Math.sin(a) * 20 - 2, 4, 4); }
});
const newsTex = canvasTex(32, 32, (g) => {
  g.fillStyle = "#ece2c8"; g.fillRect(0, 0, 32, 32);
  g.fillStyle = "#b9ad8f"; for (let y = 2; y < 32; y += 3) g.fillRect(0, y, 32, 1);
}, { nearest: true, repeat: true });

export function buildEstate(scene: THREE.Scene, phys: Physics): Estate {
  const b = new StaticBuilder(scene, phys);
  const walls = new Walls(scene, phys);
  const surfaces = new Surfaces();
  const leds: THREE.Mesh[] = [];

  const lino = toon("#fff", { map: linoTex, ink: 0.7 });
  const planks = toon("#fff", { map: plankTex, ink: 0.7 });
  const carpet = toon("#fff", { map: carpetTex, ink: 0.7 });
  const concrete = toon("#fff", { map: concreteTex, ink: 0.7 });
  const grass = toon("#fff", { map: grassTex, ink: 0.6 });
  const rug = toon("#fff", { map: rugTex, ink: 0.5 });
  const news = toon("#fff", { map: newsTex, ink: 0.7 });
  const ledMat = flat(P.led);

  /* ---------- ground outside: soil blocks with grass tops, a hole where the house sits ---------- */
  const W = { x0: -14, x1: 14, z0: -11, z1: 17 };
  const ground = (x0: number, x1: number, z0: number, z1: number) => {
    b.box([x0, -3, z0], [x1, -0.1, z1], P.soil, "outdoors", { collide: false, ink: 0.6 });
    b.box([x0, -0.1, z0], [x1, 0, z1], grass, "outdoors", { tile: 1.6 });
  };
  ground(W.x0, W.x1, W.z0, HOUSE.z0);
  ground(W.x0, W.x1, HOUSE.z1, W.z1);
  ground(W.x0, HOUSE.x0, HOUSE.z0, HOUSE.z1);
  ground(HOUSE.x1, W.x1, HOUSE.z0, HOUSE.z1);
  // invisible world edge so he can't shuffle off the diorama
  phys.box([W.x0 + 1.4, 0, W.z0 + 1.4], [W.x1 - 1.4, 3, W.z0 + 1.5]);
  phys.box([W.x0 + 1.4, 0, W.z1 - 1.5], [W.x1 - 1.4, 3, W.z1 - 1.4]);
  phys.box([W.x0 + 1.4, 0, W.z0 + 1.4], [W.x0 + 1.5, 3, W.z1 - 1.4]);
  phys.box([W.x1 - 1.5, 0, W.z0 + 1.4], [W.x1 - 1.4, 3, W.z1 - 1.4]);

  /* ---------- ground floor slabs (top at y = 0) ---------- */
  const slab = (x0: number, x1: number, z0: number, z1: number, mat: THREE.Material, tile: number) =>
    b.box([x0, -0.2, z0], [x1, 0, z1], mat, "ground", { tile });
  slab(-6, -1, 0, 5, lino, 1.2);
  slab(-1, 6, 0, 5, carpet, 1);
  slab(-6, STAIRS.xBottom, -5, 0, planks, 2);
  slab(STAIRS.xTop, 6, -5, 0, planks, 2);
  slab(STAIRS.xBottom, STAIRS.xTop, STAIRS.z1, 0, planks, 2);
  slab(STAIRS.xBottom, STAIRS.xTop, -5, STAIRS.z0, planks, 2);
  surfaces.add({ x0: STAIRS.xBottom, x1: STAIRS.xTop, z0: STAIRS.z0, z1: STAIRS.z1, y0: -3, y1: 0.3, surface: "stairs" });
  surfaces.add({ x0: -6, x1: -1, z0: 0, z1: 5, y0: -0.5, y1: 1, surface: "linoleum" });
  surfaces.add({ x0: -1, x1: 6, z0: 0, z1: 5, y0: -0.5, y1: 1, surface: "carpet" });
  surfaces.add({ x0: -6, x1: 6, z0: -5, z1: 0, y0: -0.5, y1: 1, surface: "hardwood" });
  surfaces.add({ x0: -6, x1: 6, z0: -5, z1: 5, y0: -3.5, y1: -1, surface: "concrete" });

  /* ---------- basement ---------- */
  b.box([-6, BASEMENT_Y - 0.2, -5], [6, BASEMENT_Y, 5], concrete, "basement", { tile: 2 });
  const bw = { base: BASEMENT_Y, height: 2.4, level: "basement" as const, color: P.basementWall };
  walls.add("x", -5, -6, 6, bw);
  walls.add("z", -6, -5, 5, bw);
  walls.add("z", 6, -5, 5, bw);
  walls.add("x", 5, -6, 6, bw);

  /* ---------- stairs: solid steps plus a smooth ramp collider on top ---------- */
  const run = (STAIRS.xTop - STAIRS.xBottom) / STAIRS.steps, rise = -BASEMENT_Y / STAIRS.steps;
  for (let i = 0; i < STAIRS.steps - 1; i++) {
    const x1 = STAIRS.xTop - i * run, x0 = x1 - run, top = -(i + 1) * rise;
    b.box([x0, BASEMENT_Y, STAIRS.z0], [x1, top, STAIRS.z1], i % 2 ? P.walnut : "#7a5038", "basement", { ink: 0.6, collide: false });
  }
  addStairColliders(phys);
  // railings around the stairwell at ground level
  const rail = (x0: number, x1: number, z0: number, z1: number) => {
    b.box([x0, 0.92, z0], [x1, 1.0, z1], P.walnut, "ground", { collide: false });
    phys.box([x0, 0, z0], [x1, 1.0, z1]);
    const n = Math.max(2, Math.round(Math.max(x1 - x0, z1 - z0) / 0.5));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      b.box([x - 0.025, 0, z - 0.025], [x + 0.025, 0.92, z + 0.025], P.walnut, "ground", { collide: false, ink: 0.5 });
    }
  };
  rail(STAIRS.xBottom, STAIRS.xTop, STAIRS.z1 - 0.05, STAIRS.z1 + 0.05);
  rail(STAIRS.xBottom - 0.05, STAIRS.xBottom + 0.05, STAIRS.z0, STAIRS.z1);

  /* ---------- ground floor walls ---------- */
  const ext = { base: 0, height: WALL_H, level: "ground" as const, color: P.cream };
  const int = { base: 0, height: WALL_H, level: "ground" as const, color: P.wallpaper };
  walls.add("x", -5, -6, 6, ext);
  walls.add("z", -6, -5, 5, { ...ext, openings: [{ from: 1.5, to: 3.5, kind: "window" }] });
  walls.add("z", 6, -5, 5, { ...ext, openings: [{ from: 1.5, to: 3.5, kind: "window" }] });
  walls.add("x", 5, -6, 6, { ...ext, openings: [{ from: -4.2, to: -3.0, kind: "door" }, { from: 1.0, to: 4.5, kind: "window" }] });
  walls.add("x", 0, -6, 6, { ...int, openings: [{ from: -3.9, to: -2.7, kind: "door" }, { from: 2.1, to: 3.3, kind: "door" }] });
  walls.add("z", -1, 0, 5, { ...int, openings: [{ from: 1.9, to: 3.1, kind: "door" }] });

  /* ---------- roof: a simple gable, lifted away when he's inside ---------- */
  {
    const pitchH = 1.8, half = 5.5, len = Math.hypot(half, pitchH), ang = Math.atan2(pitchH, half);
    const roofMat = toon("#9a5a45", { ink: 0.9 });
    const g = new THREE.BoxGeometry(13, 0.14, len);
    b.geo(g, roofMat, "roof", [0, WALL_H + pitchH / 2, half / 2], [ang, 0, 0]);
    b.geo(g, roofMat, "roof", [0, WALL_H + pitchH / 2, -half / 2], [-ang, 0, 0]);
    const sh = new THREE.Shape([new THREE.Vector2(-5, 0), new THREE.Vector2(5, 0), new THREE.Vector2(0, pitchH)]);
    const gable = new THREE.ExtrudeGeometry(sh, { depth: 0.15, bevelEnabled: false });
    b.geo(gable, P.cream, "roof", [-6.075, WALL_H, 0], [0, Math.PI / 2, 0]);
    b.geo(gable, P.cream, "roof", [5.925, WALL_H, 0], [0, Math.PI / 2, 0]);
  }

  /* ---------- kitchen (1955) ---------- */
  // counter run under the west window: mint cabinets, formica top
  b.box([-5.925, 0, 0.1], [-5.3, 0.86, 4.0], P.mint, "ground");
  b.box([-5.95, 0.86, 0.08], [-5.25, 0.92, 4.02], P.formica, "ground", { collide: false });
  // stove + the soup pot
  b.box([-5.9, 0.92, 0.25], [-5.35, 0.95, 0.95], "#3a3a38", "ground", { collide: false });
  b.geo(new THREE.CylinderGeometry(0.2, 0.18, 0.26, 20), P.enamel, "ground", [-5.62, 1.08, 0.6]);
  // upper cabinets
  b.box([-5.925, 1.55, 0.1], [-5.55, 2.25, 1.3], P.mint, "ground", { collide: false });
  // fridge in the corner by the back door
  b.box([-5.9, 0, 4.15], [-5.15, 1.75, 4.9], P.cream, "ground");
  b.box([-5.16, 1.05, 4.3], [-5.12, 1.5, 4.36], P.chrome, "ground", { collide: false, ink: 0.4 });
  // table: chrome-edged formica, teal vinyl chairs
  table(b, -3.2, 2.5, 1.3, 0.9, 0.76, P.formica, P.chrome);
  chair(b, -3.2, 1.75, 0);
  chair(b, -3.2, 3.25, Math.PI);
  // the BILL ONLY bowl and a comic stack on the table
  b.geo(new THREE.CylinderGeometry(0.16, 0.1, 0.11, 18), P.enamel, "ground", [-3.4, 0.82, 2.35]);
  b.geo(new THREE.CylinderGeometry(0.14, 0.14, 0.01, 18), "#b4502c", "ground", [-3.4, 0.86, 2.35], undefined, undefined, 0.3);
  b.box([-2.95, 0.765, 2.45], [-2.65, 0.84, 2.75], "#e8c64a", "ground", { collide: false, ink: 0.5 });

  /* ---------- living room ---------- */
  // mustard sofa along the east wall
  b.box([5.25, 0, 1.3], [5.9, 0.45, 3.7], P.mustard, "ground");
  b.box([5.65, 0.45, 1.3], [5.9, 0.95, 3.7], P.mustard, "ground", { collide: false });
  b.box([5.25, 0.45, 1.3], [5.9, 0.7, 1.5], P.mustard, "ground", { collide: false });
  b.box([5.25, 0.45, 3.5], [5.9, 0.7, 3.7], P.mustard, "ground", { collide: false });
  b.box([3.2, 0.001, 1.2], [5.0, 0.012, 3.8], rug, "ground", { collide: false });
  table(b, 4.2, 2.5, 0.6, 1.1, 0.42, P.walnut, P.walnut);
  // TV console with a 1986 CRT
  b.box([-0.8, 0, 0.15], [0.4, 0.55, 0.75], P.walnut, "ground");
  b.box([-0.55, 0.55, 0.25], [0.15, 1.1, 0.7], P.plastic, "ground", { collide: false });
  b.box([-0.5, 0.62, 0.705], [0.1, 1.03, 0.72], "#5f7f79", "ground", { collide: false, ink: 0.4 });
  // synth on a stand by the picture window
  b.box([1.4, 0, 4.3], [1.5, 0.8, 4.4], P.plastic, "ground", { collide: false });
  b.box([2.7, 0, 4.3], [2.8, 0.8, 4.4], P.plastic, "ground", { collide: false });
  phys.box([1.4, 0, 4.2], [2.8, 0.95, 4.75]);
  synth(b, 2.1, 0.8, 4.47, 1.4, "ground", leds, ledMat, scene);
  // floor lamp
  b.geo(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8), P.chrome, "ground", [5.55, 0.75, 0.55], undefined, undefined, 0.5);
  b.geo(new THREE.CylinderGeometry(0.16, 0.26, 0.3, 16, 1, true), P.cream, "ground", [5.55, 1.55, 0.55]);
  phys.box([5.4, 0, 0.4], [5.7, 1.6, 0.7]);
  // newspaper towers along the front wall
  for (const [x, z, n] of [[-0.6, 4.55, 9], [-0.1, 4.6, 6], [0.4, 4.55, 11], [3.6, 4.6, 7]] as const) newspapers(b, news, x, 0, z, n, "ground");

  /* ---------- back hall + antique vault ---------- */
  b.box([-5.85, 0, -4.9], [-1.6, 2.0, -4.45], P.walnut, "ground");
  for (const y of [0.5, 1.0, 1.5]) b.box([-5.8, y, -4.44], [-1.65, y + 0.05, -4.4], "#5a3826", "ground", { collide: false, ink: 0.5 });
  for (let i = 0; i < 7; i++) {
    const x = -5.5 + i * 0.6, y = [0.55, 1.05, 1.55][i % 3];
    b.geo(vase(), [P.rose, P.mint, P.mustard, P.cream][i % 4], "ground", [x, y, -4.62], undefined, [0.9, 0.9 + (i % 2) * 0.4, 0.9]);
  }
  b.box([-5.9, 0, -3.6], [-5.1, 0.9, -2.8], "#4d5a4e", "ground"); // the safe
  b.geo(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16), P.chrome, "ground", [-5.08, 0.55, -3.2], [0, 0, Math.PI / 2], undefined, 0.4);
  for (const [x, z, n] of [[-0.6, -4.5, 12], [-0.1, -4.55, 8], [5.5, -0.5, 10]] as const) newspapers(b, news, x, 0, z, n, "ground");

  /* ---------- basement (1986): the synth altar ---------- */
  const by = BASEMENT_Y;
  b.box([-4.6, by, -4.9], [0.2, by + 0.8, -4.15], P.walnut, "basement");
  synth(b, -3.5, by + 0.8, -4.5, 1.6, "basement", leds, ledMat, scene);
  synth(b, -1.7, by + 0.8, -4.5, 1.2, "basement", leds, ledMat, scene);
  b.box([-0.8, by + 0.8, -4.85], [0.1, by + 1.55, -4.2], P.plastic, "basement", { collide: false });
  b.box([-0.7, by + 0.9, -4.19], [0.0, by + 1.45, -4.17], "#6fa38d", "basement", { collide: false, ink: 0.4 });
  // rack of almost music
  b.box([-5.9, by, -3.8], [-5.25, by + 1.8, -1.6], P.plastic, "basement");
  for (let i = 0; i < 6; i++) {
    b.box([-5.24, by + 0.2 + i * 0.27, -3.7], [-5.22, by + 0.4 + i * 0.27, -1.7], P.silver, "basement", { collide: false, ink: 0.4 });
    ledRow(scene, leds, ledMat, -5.21, by + 0.3 + i * 0.27, -3.5, -1.9, 5, "z");
  }
  // newspaper towers and the hoard
  for (const [x, z, n] of [[5.5, -2.0, 14], [5.5, -1.4, 11], [5.5, -0.8, 13], [5.5, 0.6, 9], [-5.5, 2.5, 12], [-5.5, 3.1, 8], [-4.9, 3.1, 10]] as const) newspapers(b, news, x, by, z, n, "basement");
  b.box([-5.9, by, 3.6], [-4.3, by + 0.6, 4.9], P.cassette, "basement");
  b.box([-5.7, by + 0.6, 3.8], [-4.8, by + 1.0, 4.7], "#a38b62", "basement", { collide: false });
  // cable coils on the floor
  for (const [x, z, r] of [[-1.2, 1.8, 0.28], [0.9, 2.6, 0.2], [2.8, 0.2, 0.25], [-3.2, -1.8, 0.3]] as const) {
    b.geo(new THREE.TorusGeometry(r, 0.035, 8, 24), "#2f3438", "basement", [x, by + 0.035, z], [Math.PI / 2, 0, 0], undefined, 0.5);
    b.geo(new THREE.TorusGeometry(r * 0.75, 0.03, 8, 24), "#2f3438", "basement", [x + 0.05, by + 0.09, z - 0.04], [Math.PI / 2, 0, 0.3], undefined, 0.5);
  }
  // a bare bulb
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), flat("#fff2c2"));
  bulb.position.set(0, -0.55, 0); basementDecor(scene, bulb);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.35, 5), flat(P.ink));
  cord.position.set(0, -0.37, 0); basementDecor(scene, cord);

  /* ---------- backyard ---------- */
  // dig patch (the stump waits here)
  b.box([-4.6, 0, 9.0], [-1.4, 0.015, 12.0], P.dirt, "outdoors", { collide: false, ink: 0.5 });
  for (let i = 0; i < 4; i++) b.box([-4.4 + i * 0.8, 0.015, 9.2], [-4.0 + i * 0.8, 0.07, 11.8], "#76553b", "outdoors", { collide: false, ink: 0.4 });
  surfaces.add({ x0: -4.6, x1: -1.4, z0: 9, z1: 12, y0: -0.5, y1: 1, surface: "dirt" });
  // stepping stones from the back door
  for (let i = 0; i < 5; i++) b.geo(new THREE.CylinderGeometry(0.28, 0.3, 0.05, 12), "#b7ae9d", "outdoors", [-3.6 + i * 0.12, 0.02, 5.8 + i * 0.75], undefined, undefined, 0.5);
  // a tree and some shrubs
  b.geo(new THREE.CylinderGeometry(0.2, 0.28, 2.2, 10), P.bark, "outdoors", [5.2, 1.1, 11]);
  phys.box([4.95, 0, 10.75], [5.45, 2.2, 11.25]);
  for (const [x, y, z, r] of [[5.2, 2.7, 11, 1.2], [4.5, 2.3, 11.4, 0.8], [5.9, 2.4, 10.6, 0.85]] as const) b.geo(new THREE.IcosahedronGeometry(r, 1), P.leaf, "outdoors", [x, y, z], undefined, undefined, 0.8);
  for (const [x, z, r] of [[-5.3, 5.8, 0.45], [0.6, 5.7, 0.5], [2.2, 5.8, 0.4], [4.6, 5.8, 0.55], [7.0, 3.0, 0.5], [7.1, -1.0, 0.45]] as const) {
    b.geo(new THREE.IcosahedronGeometry(r, 1), P.grassDark, "outdoors", [x, r * 0.8, z], undefined, [1, 0.8, 1], 0.7);
  }
  // picket fence around the yard
  const fence = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 0.45);
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      b.box([x - 0.05, 0, z - 0.05], [x + 0.05, 1.05, z + 0.05], P.fence, "outdoors", { collide: false, ink: 0.55 });
    }
    const mnx = Math.min(x0, x1) - 0.03, mxx = Math.max(x0, x1) + 0.03, mnz = Math.min(z0, z1) - 0.03, mxz = Math.max(z0, z1) + 0.03;
    b.box([mnx, 0.35, mnz], [mxx, 0.43, mxz], P.fence, "outdoors", { collide: false, ink: 0.5 });
    b.box([mnx, 0.78, mnz], [mxx, 0.86, mxz], P.fence, "outdoors", { collide: false, ink: 0.5 });
    phys.box([mnx, 0, mnz], [mxx, 1.1, mxz]);
  };
  fence(-11, 15, 11, 15);
  fence(-11, 5.2, -11, 15);
  fence(11, 5.2, 11, 15);

  b.finish();

  return {
    builder: b,
    walls,
    surfaces,
    leds,
    spawn: new THREE.Vector3(2.4, 0, 2.2),
    itemSpawns: [
      { id: "powerBrick", at: new THREE.Vector3(-4.4, 0.2, 3.7) },
      { id: "speakAndSpell", at: new THREE.Vector3(3.0, 0.2, 3.9) },
      { id: "newspaperBundle", at: new THREE.Vector3(-2.6, 0.2, -2.3) },
      { id: "dinCable", at: new THREE.Vector3(-2.0, BASEMENT_Y + 0.2, 0.8) },
      { id: "cableBundle", at: new THREE.Vector3(3.6, BASEMENT_Y + 0.2, 2.2) },
      { id: "personalityStump", at: new THREE.Vector3(-3.0, 0.3, 10.5) },
    ],
    junkSpawns: [
      { kind: "box", at: new THREE.Vector3(-3.6, BASEMENT_Y + 0.25, -1.0) },
      { kind: "box", at: new THREE.Vector3(-3.5, BASEMENT_Y + 0.75, -1.05) },
      { kind: "box", at: new THREE.Vector3(2.4, BASEMENT_Y + 0.25, 3.6) },
      { kind: "box", at: new THREE.Vector3(0.3, 0.25, 3.8) },
      { kind: "crate", at: new THREE.Vector3(4.0, 0.3, 8.0) },
      { kind: "crate", at: new THREE.Vector3(4.2, 0.9, 8.05) },
      { kind: "bucket", at: new THREE.Vector3(0.8, 0.2, 12.4) },
    ],
  };
}

/* ---------- prop helpers ---------- */
function table(b: StaticBuilder, cx: number, cz: number, w: number, d: number, h: number, top: string, leg: string, tag: Tag = "ground") {
  b.box([cx - w / 2, h - 0.05, cz - d / 2], [cx + w / 2, h, cz + d / 2], top, tag, { collide: false });
  b.box([cx - w / 2 - 0.02, h - 0.07, cz - d / 2 - 0.02], [cx + w / 2 + 0.02, h - 0.045, cz + d / 2 + 0.02], P.chrome, tag, { collide: false, ink: 0.4 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = cx + sx * (w / 2 - 0.08), z = cz + sz * (d / 2 - 0.08);
    b.box([x - 0.025, 0, z - 0.025], [x + 0.025, h - 0.05, z + 0.025], leg, tag, { collide: false, ink: 0.5 });
  }
  b.phys.box([cx - w / 2, 0, cz - d / 2], [cx + w / 2, h, cz + d / 2]);
}

function chair(b: StaticBuilder, cx: number, cz: number, rotY: number) {
  const back = Math.cos(rotY) > 0 ? -1 : 1;
  b.box([cx - 0.22, 0.42, cz - 0.22], [cx + 0.22, 0.5, cz + 0.22], P.vinyl, "ground", { collide: false });
  b.box([cx - 0.22, 0.5, cz + back * 0.22 - 0.03], [cx + 0.22, 0.95, cz + back * 0.22 + 0.03], P.vinyl, "ground", { collide: false });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    b.box([cx + sx * 0.18 - 0.015, 0, cz + sz * 0.18 - 0.015], [cx + sx * 0.18 + 0.015, 0.42, cz + sz * 0.18 + 0.015], P.chrome, "ground", { collide: false, ink: 0.4 });
  }
  b.phys.box([cx - 0.22, 0, cz - 0.22], [cx + 0.22, 0.95, cz + 0.22]);
}

function newspapers(b: StaticBuilder, mat: THREE.Material, x: number, y: number, z: number, n: number, tag: Tag) {
  let h = y;
  for (let i = 0; i < n; i++) {
    const t = 0.09 + ((i * 7) % 3) * 0.015, jx = (((i * 13) % 5) - 2) * 0.015, jz = (((i * 17) % 5) - 2) * 0.015;
    b.box([x - 0.2 + jx, h, z - 0.15 + jz], [x + 0.2 + jx, h + t, z + 0.15 + jz], mat, tag, { collide: false, ink: 0.55 });
    h += t;
  }
  b.phys.box([x - 0.22, y, z - 0.17], [x + 0.22, h, z + 0.17]);
}

function vase() {
  const pts = [[0.001, 0], [0.07, 0], [0.09, 0.08], [0.06, 0.2], [0.035, 0.26], [0.05, 0.3], [0.001, 0.3]].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 14);
}

function synth(b: StaticBuilder, cx: number, y: number, cz: number, w: number, tag: Tag, leds: THREE.Mesh[], ledMat: THREE.Material, scene: THREE.Scene) {
  b.box([cx - w / 2, y, cz - 0.25], [cx + w / 2, y + 0.1, cz + 0.25], P.plastic, tag, { collide: false });
  b.box([cx - w / 2 + 0.08, y + 0.1, cz + 0.02], [cx + w / 2 - 0.08, y + 0.12, cz + 0.22], P.cassette, tag, { collide: false, ink: 0.35 });
  for (let i = 0; i < Math.floor(w / 0.12); i++) {
    b.geo(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 8), P.silver, tag, [cx - w / 2 + 0.12 + i * 0.12, y + 0.12, cz - 0.12], undefined, undefined, 0.3);
  }
  ledRow(scene, leds, ledMat, cx - w / 2 + 0.15, y + 0.105, cz - 0.2, cz - 0.2, Math.max(3, Math.floor(w / 0.25)), "x", cx + w / 2 - 0.15, tag);
}

function ledRow(scene: THREE.Scene, leds: THREE.Mesh[], mat: THREE.Material, a: number, y: number, z0: number, z1: number, n: number, axis: "x" | "z", aEnd?: number, tag: Tag = "basement") {
  const geo = new THREE.SphereGeometry(0.014, 6, 4);
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0;
    const m = new THREE.Mesh(geo, mat);
    if (axis === "z") m.position.set(a, y, z0 + (z1 - z0) * t);
    else m.position.set(a + ((aEnd ?? a) - a) * t, y, z0);
    m.userData.tag = tag;
    m.userData.phase = i * 0.7 + a * 3;
    scene.add(m);
    leds.push(m);
  }
}

function basementDecor(scene: THREE.Scene, m: THREE.Mesh) {
  m.userData.tag = "basement";
  scene.add(m);
}

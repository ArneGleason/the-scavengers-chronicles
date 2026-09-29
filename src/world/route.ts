/**
 * The Route (Act 2), greybox. Inspired by a Toronto west-end block, not copied from it:
 * Victorian semis backing onto a named laneway of garages, ivy-covered hydro poles, tangled
 * wires and green bins; a municipal parking lot; the back of a corner store with its
 * dumpster; a boxing gym; and a streetcar street beyond the lot.
 *
 * Layout (metres; the camera looks from +X+Z):
 *   laneway      z 15.6..19.6, the whole width of the site, behind Bill's backyard gate
 *   parking lot  x 12.5..21.5, z -5.2..15.5
 *   corner store x 22..31,    z -5.2..9.5, its yard and dumpster between it and the lane
 *   boxing gym   x 32..40,    z -5.2..10
 *   main street  z -10.5..-6.6 with streetcar tracks, along the whole north edge (past Bill's front)
 */
import * as THREE from "three/webgpu";
import { StaticBuilder, type Walls, type Surfaces } from "./builder";
import type { Physics } from "./physics";
import { P } from "../content/palette";
import { canvasTex, toon } from "../render/comicMaterial";
import type { ItemId } from "../content/items";
import { SITE, type Rect } from "./site";

export const LANE = { z0: 15.6, z1: 19.6 };
export const LOT: Rect = { x0: 12.5, x1: 21.5, z0: -5.2, z1: 15.5 };
export const STORE: Rect = { x0: 22, x1: 31, z0: -5.2, z1: 9.5 };
export const GYM: Rect = { x0: 32, x1: 40, z0: -5.2, z1: 10 };
export const STREET = { z0: -10.5, z1: -6.6, x0: -14 };
/** Gary's post, in front of the dumpster and the heap the Speak & Spell sits on. */
export const GARY_POST = { x: 25.9, z: 14.4 };
export const PRIZE_AT = new THREE.Vector3(25.1, 0.62, 13.0);

export interface Route {
  builder: StaticBuilder;
  /** Building roofs to lift when they'd hide Bill. */
  roofs: { rect: Rect; obj: THREE.Object3D }[];
  itemSpawns: { id: ItemId; at: THREE.Vector3 }[];
  junkSpawns: { kind: "box" | "crate" | "bucket"; at: THREE.Vector3 }[];
  streetcar: THREE.Group;
  raccoon: THREE.Group;
  raccoonHome: THREE.Vector3;
}

/* ---------- textures: signs and graffiti ---------- */
function signTex(text: string, bg: string, fg: string, w = 512, h = 96, font = "900 58px 'Arial Black', Impact, sans-serif") {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = P.ink; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = fg; g.font = font; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(text, w / 2, h / 2 + 3, w - 30);
  });
}
/** Tags and throw-ups in the art bible palette: loose, loud, and not real anyone's tags. */
function graffitiTex(base: string, seed: number) {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(0,0,0,.12)"; g.lineWidth = 1;
    for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    const cols = ["#e0367a", "#2aa6a1", "#f2b632", "#1e1a18", "#c8312d", "#ffffff"];
    let s = seed;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 5; i++) {
      g.strokeStyle = cols[Math.floor(r() * cols.length)]; g.lineWidth = 3 + r() * 6; g.lineCap = "round";
      g.beginPath();
      let x = r() * w, y = 20 + r() * (h - 40);
      g.moveTo(x, y);
      for (let k = 0; k < 6; k++) { x += 12 + r() * 30; y += (r() - 0.5) * 40; g.quadraticCurveTo(x - 10, y - 25 * r(), x, y); }
      g.stroke();
    }
    // one big bubble-letter throw-up
    g.font = "900 44px 'Arial Black', Impact, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.lineWidth = 7; g.strokeStyle = P.ink; g.fillStyle = cols[Math.floor(r() * 3)];
    const word = ["SOUP", "DIN!", "ZOOP", "BILL?"][seed % 4];
    g.strokeText(word, w * (0.3 + r() * 0.4), h * 0.55); g.fillText(word, w * (0.3 + r() * 0.4), h * 0.55);
  });
}
const muralTex = canvasTex(512, 256, (g, w, h) => {
  // a lion mural for the back of the boxing gym, all flat shapes
  g.fillStyle = "#2a2350"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#e8b23a"; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; g.beginPath(); g.ellipse(w / 2 + Math.cos(a) * 70, h / 2 + Math.sin(a) * 70, 42, 22, a, 0, 7); g.fill(); }
  g.fillStyle = "#d9a441"; g.beginPath(); g.arc(w / 2, h / 2, 62, 0, 7); g.fill();
  g.fillStyle = P.ink; g.beginPath(); g.arc(w / 2 - 22, h / 2 - 12, 8, 0, 7); g.arc(w / 2 + 22, h / 2 - 12, 8, 0, 7); g.fill();
  g.beginPath(); g.moveTo(w / 2 - 12, h / 2 + 14); g.lineTo(w / 2 + 12, h / 2 + 14); g.lineTo(w / 2, h / 2 + 28); g.fill();
  g.font = "900 40px 'Arial Black', Impact, sans-serif"; g.fillStyle = "#fbf6ec"; g.textAlign = "left"; g.fillText("PRIDE", 20, 50); g.textAlign = "right"; g.fillText("BOXING", w - 20, h - 24);
});
const asphaltTex = canvasTex(64, 64, (g) => {
  g.fillStyle = P.asphalt; g.fillRect(0, 0, 64, 64);
  g.fillStyle = "rgba(255,255,255,.06)"; for (let i = 0; i < 60; i++) g.fillRect((i * 37) % 64, (i * 23) % 64, 1, 1);
  g.fillStyle = "rgba(0,0,0,.18)"; for (let i = 0; i < 20; i++) g.fillRect((i * 13) % 64, (i * 29) % 64, 2, 1);
}, { nearest: true, repeat: true });
const brickTex = canvasTex(64, 64, (g) => {
  g.fillStyle = "#a4553f"; g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#8a4533";
  for (let y = 0; y < 64; y += 8) { g.fillRect(0, y + 7, 64, 1); for (let x = (y / 8) % 2 ? 8 : 0; x < 64; x += 16) g.fillRect(x, y, 1, 8); }
}, { nearest: true, repeat: true });

const EAST = SITE.x1;

export function buildRoute(scene: THREE.Scene, phys: Physics, walls: Walls, surfaces: Surfaces): Route {
  const b = new StaticBuilder(scene, phys);
  const roofs: Route["roofs"] = [];
  const asphalt = toon("#fff", { map: asphaltTex, ink: 0.5 });
  const brick = toon("#fff", { map: brickTex, ink: 0.8 });

  /* ---------- paving ---------- */
  b.box([-14, -0.1, LANE.z0], [EAST, 0.006, LANE.z1], asphalt, "outdoors", { collide: false, tile: 2 });
  b.box([LOT.x0, -0.1, LOT.z0], [LOT.x1, 0.006, LOT.z1], asphalt, "outdoors", { collide: false, tile: 2 });
  b.box([STORE.x0, -0.1, STORE.z1], [EAST, 0.008, LANE.z0], P.concrete, "outdoors", { collide: false, ink: 0.4 });
  b.box([STREET.x0, -0.1, STREET.z0], [EAST, 0.006, STREET.z1], asphalt, "outdoors", { collide: false, tile: 2 });
  b.box([STREET.x0, -0.1, STREET.z1], [EAST, 0.03, -5.1], P.concrete, "outdoors", { collide: false, ink: 0.5 }); // sidewalk
  surfaces.add({ x0: -14, x1: EAST, z0: LANE.z0, z1: LANE.z1, y0: -0.5, y1: 2, surface: "asphalt" });
  surfaces.add({ x0: LOT.x0, x1: LOT.x1, z0: LOT.z0, z1: LOT.z1, y0: -0.5, y1: 2, surface: "asphalt" });
  surfaces.add({ x0: STORE.x0, x1: EAST, z0: STORE.z1, z1: LANE.z0, y0: -0.5, y1: 2, surface: "concrete" });
  surfaces.add({ x0: STREET.x0, x1: EAST, z0: STREET.z1, z1: -5.1, y0: -0.5, y1: 2, surface: "concrete" });
  // oil stains and a drain grate in the lane
  for (const [x, z, r] of [[6, 17.2, 0.7], [18.5, 18.1, 0.5], [30, 16.8, 0.9], [-7, 18.4, 0.6]] as const) {
    b.geo(new THREE.CircleGeometry(r, 14), "#2a2e33", "outdoors", [x, 0.008, z], [-Math.PI / 2, 0, 0], [1, 0.7, 1], 0.2);
  }
  b.box([9.6, 0, 17.3], [10.4, 0.012, 17.9], P.silver, "outdoors", { collide: false, ink: 0.4 });

  /* ---------- parking lot ---------- */
  for (let i = 0; i <= 3; i++) {
    const x = LOT.x0 + 0.6 + i * 2.7;
    b.box([x - 0.05, 0.007, 2.0], [x + 0.05, 0.012, 7.0], "#f1eee4", "outdoors", { collide: false, ink: 0 });
    b.box([x - 0.05, 0.007, 8.5], [x + 0.05, 0.012, 13.5], "#f1eee4", "outdoors", { collide: false, ink: 0 });
  }
  car(b, phys, 14.45, 4.4, "#9aa3a8");
  car(b, phys, 19.85, 11.0, "#3f8a86");
  car(b, phys, 17.15, 4.6, "#8a3d3d");
  // pay-and-display machine and the green P sign
  b.box([13.0, 0, 14.4], [13.4, 1.3, 14.7], P.plastic, "outdoors");
  b.box([13.05, 1.0, 14.71], [13.35, 1.2, 14.73], "#6fa38d", "outdoors", { collide: false, ink: 0.3 });
  b.box([12.75, 0, 15.1], [12.85, 2.6, 15.2], P.silver, "outdoors", { collide: false, ink: 0.4 });
  const pSign = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), toon("#fff", { map: canvasTex(128, 128, (g) => {
    g.fillStyle = "#2f8f4e"; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill();
    g.fillStyle = "#fff"; g.font = "900 96px 'Arial Black', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("P", 64, 70);
  }), ink: 0.6 }));
  pSign.position.set(12.8, 2.75, 15.26); scene.add(pSign); tagOutdoors(pSign);
  // bollards between the lot and the sidewalk
  for (let x = LOT.x0 + 0.4; x < LOT.x1; x += 1.3) b.geo(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 10), "#e6c13a", "outdoors", [x, 0.4, LOT.z0 + 0.1], undefined, undefined, 0.6);

  /* ---------- the corner store (the back of it faces the lane) ---------- */
  const H = 4.0;
  const wallOpts = { base: 0, height: H, level: "ground" as const, color: "#c9b79a" };
  walls.add("x", STORE.z1, STORE.x0, STORE.x1, { ...wallOpts, openings: [{ from: 27.4, to: 28.5, kind: "door" }, { from: 23.2, to: 25.0, kind: "window" }] });
  walls.add("z", STORE.x0, STORE.z0, STORE.z1, { ...wallOpts, openings: [{ from: -3.8, to: -0.4, kind: "window" }, { from: 1.2, to: 4.6, kind: "window" }] });
  walls.add("z", STORE.x1, STORE.z0, STORE.z1, wallOpts);
  walls.add("x", STORE.z0, STORE.x0, STORE.x1, { ...wallOpts, openings: [{ from: 24.8, to: 26.2, kind: "door" }] });
  b.box([STORE.x0, -0.05, STORE.z0], [STORE.x1, 0.02, STORE.z1], "#d9d2bf", "outdoors", { collide: false, ink: 0.4 });
  // inside: shelves and a counter, so the cutaway shows a real shop
  for (const z of [-2.8, 0.2, 3.2]) b.box([24.2, 0, z], [29.4, 1.6, z + 0.6], "#c9cfd1", "outdoors");
  for (let i = 0; i < 12; i++) b.box([24.3 + (i % 6) * 0.85, 1.6, -2.75 + Math.floor(i / 6) * 3], [24.9 + (i % 6) * 0.85, 1.9, -2.3 + Math.floor(i / 6) * 3], ["#c8312d", "#e8b23a", "#2aa6a1", "#e0367a"][i % 4], "outdoors", { collide: false, ink: 0.4 });
  b.box([22.3, 0, 6.2], [24.6, 1.05, 7.0], P.walnut, "outdoors");
  b.box([22.5, 1.05, 6.3], [23.0, 1.35, 6.9], "#39414b", "outdoors", { collide: false, ink: 0.4 }); // till
  const storeRoof = new THREE.Group();
  const roofMat = toon("#6f6a62", { ink: 0.8 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(STORE.x1 - STORE.x0 + 0.3, 0.25, STORE.z1 - STORE.z0 + 0.3), roofMat);
  slab.position.set((STORE.x0 + STORE.x1) / 2, H + 0.12, (STORE.z0 + STORE.z1) / 2);
  storeRoof.add(slab);
  // The camera only sees faces pointing +X or +Z, so the store's name goes on the lane-side parapet.
  const sign = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.95, 0.14), toon("#fff", { map: signTex("VARIETY · LOTTO · ICE · MILK", "#f2b632", "#c8312d", 1024, 96), ink: 0.9 }));
  sign.position.set((STORE.x0 + STORE.x1) / 2, H + 0.72, STORE.z1 + 0.05);
  fixBoxFaceUV(sign.geometry as THREE.BoxGeometry, 4);
  storeRoof.add(sign);
  scene.add(storeRoof);
  tagOutdoors(storeRoof);
  roofs.push({ rect: STORE, obj: storeRoof });
  const deliveries = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), toon("#fff", { map: signTex("DELIVERIES ONLY", "#fbf6ec", "#1e1a18", 512, 128, "900 52px 'Arial Black', sans-serif"), ink: 0.6 }));
  deliveries.position.set(27.95, 2.45, STORE.z1 + 0.09); scene.add(deliveries); tagOutdoors(deliveries);
  const mural = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.4), toon("#fff", { map: graffitiTex("#c9b79a", 3), ink: 0.3 }));
  mural.position.set(29.6, 1.7, STORE.z1 + 0.085); scene.add(mural); tagOutdoors(mural);

  /* ---------- store yard: the dumpster and the heap ---------- */
  // dumpster: green steel with the lid flipped open
  b.box([25.9, 0.12, 12.3], [27.9, 1.3, 13.5], "#2f6e4f", "outdoors");
  b.box([25.85, 1.3, 12.25], [27.95, 1.38, 12.45], "#265a41", "outdoors", { collide: false });
  b.geo(new THREE.BoxGeometry(2.1, 0.06, 1.2), "#265a41", "outdoors", [26.9, 1.75, 11.95], [-1.1, 0, 0]);
  for (const x of [26.1, 27.7]) for (const z of [12.45, 13.35]) b.geo(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10), P.plastic, "outdoors", [x, 0.1, z], [Math.PI / 2, 0, 0], undefined, 0.5);
  // the heap of cardboard the Speak & Spell sits on
  b.box([24.55, 0, 12.5], [25.65, 0.34, 13.5], "#c79a62", "outdoors");
  b.box([24.7, 0.34, 12.65], [25.5, 0.56, 13.35], "#b88a58", "outdoors");
  b.geo(new THREE.BoxGeometry(0.7, 0.05, 0.5), "#d8b27a", "outdoors", [24.4, 0.5, 13.6], [0.5, 0.3, 0.2], undefined, 0.5);
  // milk crates, recycling, and a shed covered in tags
  for (const [x, y, z, c] of [[28.6, 0, 13.9, "#2a6fb5"], [28.6, 0.34, 13.9, "#c8312d"], [29.1, 0, 13.4, "#2a6fb5"]] as const) b.box([x, y, z], [x + 0.4, y + 0.33, z + 0.4], c, "outdoors");
  b.box([22.2, 0, 11.4], [24.3, 2.4, 15.2], "#8c7a62", "outdoors");
  const shedArt = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.2), toon("#fff", { map: graffitiTex("#8c7a62", 7), ink: 0.3 }));
  shedArt.position.set(23.25, 1.15, 15.21); scene.add(shedArt); tagOutdoors(shedArt);
  b.box([22.1, 2.4, 11.3], [24.4, 2.55, 15.3], "#5b5249", "outdoors", { collide: false });

  /* ---------- the boxing gym ---------- */
  const gymOpts = { base: 0, height: 4.4, level: "ground" as const, color: "#8c8f93" };
  walls.add("x", GYM.z1, GYM.x0, GYM.x1, { ...gymOpts, openings: [{ from: 34.0, to: 36.8, kind: "door" }] });
  walls.add("z", GYM.x0, GYM.z0, GYM.z1, gymOpts);
  walls.add("x", GYM.z0, GYM.x0, GYM.x1, gymOpts);
  b.box([GYM.x0, -0.05, GYM.z0], [GYM.x1, 0.02, GYM.z1], "#3a3f46", "outdoors", { collide: false, ink: 0.4 });
  const gymMural = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), toon("#fff", { map: muralTex, ink: 0.4 }));
  gymMural.position.set(38.4, 2.6, GYM.z1 + 0.085); scene.add(gymMural); tagOutdoors(gymMural);
  // a heavy bag and ring posts, visible through the roll-up door
  b.geo(new THREE.CylinderGeometry(0.22, 0.22, 1.1, 14), "#8a2b2b", "outdoors", [35.4, 1.6, 8.2]);
  b.geo(new THREE.CylinderGeometry(0.01, 0.01, 1.6, 4), P.ink, "outdoors", [35.4, 3.0, 8.2], undefined, undefined, 0);
  for (const [x, z] of [[33.2, 1], [38.8, 1], [33.2, 5.8], [38.8, 5.8]] as const) b.box([x - 0.08, 0, z - 0.08], [x + 0.08, 1.4, z + 0.08], "#c8312d", "outdoors", { collide: false });
  b.box([33.2, 0.02, 1], [38.8, 0.35, 5.8], "#2a6fb5", "outdoors");
  const gymRoof = new THREE.Group();
  const gslab = new THREE.Mesh(new THREE.BoxGeometry(GYM.x1 - GYM.x0 + 0.3, 0.25, GYM.z1 - GYM.z0 + 0.3), roofMat);
  gslab.position.set((GYM.x0 + GYM.x1) / 2, 4.4 + 0.12, (GYM.z0 + GYM.z1) / 2);
  gymRoof.add(gslab); scene.add(gymRoof); tagOutdoors(gymRoof);
  roofs.push({ rect: GYM, obj: gymRoof });

  /* ---------- the neighbour's garage west of Bill's yard, and fences across the lane ---------- */
  b.box([-13.8, 0, 11.6], [-11.4, 2.5, 15.3], brick, "outdoors", { tile: 1.2 });
  b.box([-13.9, 2.5, 11.5], [-11.3, 2.65, 15.4], "#5b5249", "outdoors", { collide: false });
  const garageDoor = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.1), toon("#fff", { map: graffitiTex("#b9b3a6", 11), ink: 0.4 }));
  garageDoor.position.set(-12.6, 1.05, 15.31); scene.add(garageDoor); tagOutdoors(garageDoor);
  // low back fences of the next street's yards, on the camera side of the lane
  for (let x = -14; x < EAST; x += 5.5) {
    const len = 4.6;
    b.box([x, 0, 20.1], [x + len, 1.15, 20.2], "#a88a64", "outdoors", { collide: false, ink: 0.6 });
    for (let k = 0; k <= 4; k++) b.box([x + (k * len) / 4 - 0.05, 0, 20.05], [x + (k * len) / 4 + 0.05, 1.3, 20.25], "#8d7050", "outdoors", { collide: false, ink: 0.5 });
  }
  phys.box([-14, 0, 20.0], [EAST, 1.2, 20.3]);
  /* ---------- hydro poles, wires and ivy ---------- */
  const poles = [-9, 3, 15, 27, 39, 57, 63];
  for (const x of poles) {
    b.geo(new THREE.CylinderGeometry(0.13, 0.16, 8, 8), "#7a6048", "outdoors", [x, 4, 19.85], undefined, undefined, 0.7);
    b.box([x - 0.9, 7.2, 19.8], [x + 0.9, 7.35, 19.92], "#6b5540", "outdoors", { collide: false, ink: 0.5 });
    phys.box([x - 0.16, 0, 19.7], [x + 0.16, 3, 20.0]);
  }
  for (let i = 0; i < poles.length - 1; i++) {
    for (const [dz, dy] of [[-0.8, 7.4], [0.8, 7.4], [0, 6.6]] as const) {
      const a = new THREE.Vector3(poles[i], dy, 19.85 + dz), c = new THREE.Vector3(poles[i + 1], dy, 19.85 + dz);
      const mid = a.clone().lerp(c, 0.5); mid.y -= 0.45; // a little sag
      const curve = new THREE.QuadraticBezierCurve3(a, mid, c);
      b.geo(new THREE.TubeGeometry(curve, 16, 0.018, 4), P.ink, "outdoors", undefined, undefined, undefined, 0);
    }
  }
  // service drops from the poles to the houses
  for (const [x, zt] of [[3, 12], [-9, 13]] as const) {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(x, 6.6, 19.85), new THREE.Vector3(x - 1.2, 5.4, (19.85 + zt) / 2), new THREE.Vector3(x - 2, 4.5, zt));
    b.geo(new THREE.TubeGeometry(curve, 12, 0.015, 4), P.ink, "outdoors", undefined, undefined, undefined, 0);
  }
  // Virginia creeper climbing the pole by Bill's gate
  for (let i = 0; i < 22; i++) {
    const t = i / 22, a = t * 14;
    b.geo(new THREE.IcosahedronGeometry(0.2 + 0.08 * Math.sin(i), 0), i % 5 === 0 ? "#b5452f" : P.leaf, "outdoors",
      [3 + Math.cos(a) * 0.2, 0.3 + t * 5.5, 19.85 + Math.sin(a) * 0.2], undefined, undefined, 0.5);
  }

  /* ---------- bins, a lane sign, a mattress ---------- */
  bins(b, 1.7, 15.25);
  bins(b, 21.9, 15.9);
  bins(b, -10.5, 15.3);
  b.box([2.05, 0, 15.3], [2.12, 2.1, 15.37], P.silver, "outdoors", { collide: false, ink: 0.4 });
  const laneSign = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 0.04), toon("#fff", { map: signTex("LANE S BILL E SOUP", "#fbf6ec", "#2a6fb5", 512, 96, "900 44px 'Arial Black', sans-serif"), ink: 0.6 }));
  laneSign.position.set(2.4, 2.05, 15.36); scene.add(laneSign); tagOutdoors(laneSign);
  b.geo(new THREE.BoxGeometry(1.4, 1.9, 0.22), "#e9dcc0", "outdoors", [11.9, 0.95, 15.45], [-0.18, 0, 0]); // curbside mattress
  phys.box([11.2, 0, 15.3], [12.6, 1.9, 15.7]);

  /* ---------- the main street, its streetcar, and the shops across it ---------- */
  for (const z of [-7.9, -9.3]) for (const dz of [-0.36, 0.36]) b.box([STREET.x0, 0.006, z + dz - 0.04], [EAST, 0.03, z + dz + 0.04], "#6b6f73", "outdoors", { collide: false, ink: 0.2 });
  for (let x = -10; x < EAST; x += 8) {
    b.geo(new THREE.CylinderGeometry(0.1, 0.12, 6.2, 8), "#4d5156", "outdoors", [x, 3.1, -6.9], undefined, undefined, 0.6);
    b.box([x - 0.05, 5.8, -9.3], [x + 0.05, 5.9, -6.9], "#4d5156", "outdoors", { collide: false, ink: 0.4 });
  }
  for (const z of [-7.9, -9.3]) b.box([STREET.x0, 5.7, z - 0.012], [EAST, 5.725, z + 0.012], P.ink, "outdoors", { collide: false, ink: 0 });
  phys.box([STREET.x0, 0, STREET.z1 - 0.2], [EAST, 2, STREET.z1]); // curb: he stays on the sidewalk
  const shops: [number, number, number, string, string, string][] = [
    [-14, 6.4, 6.4, "#7f6a8a", "VIDEO RENTALS", "#f2b632"], [-7.4, 5.4, 8, "#9aa3a8", "LAUNDROMAT", "#1e1a18"],
    [-1.2, 6.2, 6.8, "#a4553f", "BARBER", "#fbf6ec"], [5.2, 7, 7.2, "#6f8f4e", "FRUIT & VEG", "#fbf6ec"],
    [12.5, 7.4, 7.5, "#b0665a", "CAFÉ", "#fbf6ec"], [20.5, 7.4, 6.5, "#8a9a7e", "BAKERY", "#fbf6ec"],
    [27.5, 7.4, 8.5, "#a4553f", "HARDWARE", "#f2b632"], [35.1, 5.9, 7, "#6f7f86", "RECORDS", "#e0367a"],
    [41.6, 6.6, 6.8, "#7a6f5c", "PAWN", "#f2b632"], [48.8, 7.4, 7.4, "#5f7f79", "DOLLAR STORE", "#fbf6ec"], [56.8, 7.2, 6.2, "#8a5a6a", "VACUUM REPAIR", "#fbf6ec"],
  ];
  for (const [x, w, h, col, name, fg] of shops) {
    b.box([x, 0, -16.5], [x + w, h, -11], col, "outdoors", { collide: false, ink: 0.8 });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w - 1, 0.8), toon("#fff", { map: signTex(name, "#1e1a18", fg), ink: 0.5 }));
    s.position.set(x + w / 2, 3.4, -10.98); scene.add(s); tagOutdoors(s);
    for (let k = 0; k < Math.floor(w / 1.6); k++) b.box([x + 0.5 + k * 1.6, 1.0, -10.99], [x + 1.6 + k * 1.6, 2.6, -10.97], "#8fb0b5", "outdoors", { collide: false, ink: 0.4 });
    b.box([x + 0.3, 2.8, -10.9], [x + w - 0.3, 3.0, -10.1], ["#c8312d", "#2aa6a1", "#e8b23a", "#2f6e4f"][((Math.floor(x) % 4) + 4) % 4], "outdoors", { collide: false, ink: 0.5 });
  }
  const streetcar = makeStreetcar();
  streetcar.position.set(60, 0, -7.9);
  scene.add(streetcar); tagOutdoors(streetcar);

  /* ---------- a raccoon on the bins ---------- */
  const raccoon = makeRaccoon();
  const raccoonHome = new THREE.Vector3(22.1, 1.12, 16.05);
  raccoon.position.copy(raccoonHome);
  scene.add(raccoon); tagOutdoors(raccoon);

  b.finish();
  return {
    builder: b,
    roofs,
    streetcar,
    raccoon,
    raccoonHome,
    itemSpawns: [{ id: "speakAndSpell", at: PRIZE_AT.clone() }],
    junkSpawns: [
      { kind: "box", at: new THREE.Vector3(29.9, 0.25, 14.5) },
      { kind: "crate", at: new THREE.Vector3(-4.8, 0.3, 17.0) },
      { kind: "bucket", at: new THREE.Vector3(14.2, 0.2, 16.3) },
    ],
  };
}

/* ---------- helpers ---------- */
function tagOutdoors(o: THREE.Object3D) {
  o.userData.tag = "outdoors";
}

function fixBoxFaceUV(g: THREE.BoxGeometry, faceIndex: number) {
  // show the sign texture only on one face; the other faces sample a flat corner
  const uv = g.attributes.uv;
  for (let f = 0; f < 6; f++) if (f !== faceIndex) for (let v = 0; v < 4; v++) uv.setXY(f * 4 + v, 0.01, 0.01);
  uv.needsUpdate = true;
}

function bins(b: StaticBuilder, x: number, z: number) {
  const colors = ["#2f6e4f", "#2a6fb5", "#5a5f64"];
  colors.forEach((c, i) => {
    const bx = x + i * 0.62;
    b.box([bx, 0, z - 0.3], [bx + 0.55, 1.0, z + 0.3], c, "outdoors", { ink: 0.8 });
    b.box([bx - 0.02, 1.0, z - 0.33], [bx + 0.57, 1.08, z + 0.33], c, "outdoors", { collide: false, ink: 0.6 });
  });
}

function car(b: StaticBuilder, phys: Physics, cx: number, cz: number, color: string) {
  // parked nose-in along Z
  b.box([cx - 0.85, 0.3, cz - 2.1], [cx + 0.85, 0.95, cz + 2.1], color, "outdoors", { collide: false });
  b.box([cx - 0.75, 0.95, cz - 1.0], [cx + 0.75, 1.45, cz + 1.1], color, "outdoors", { collide: false });
  b.box([cx - 0.76, 1.0, cz - 0.9], [cx + 0.76, 1.4, cz + 1.0], "#8fb0b5", "outdoors", { collide: false, ink: 0.3 });
  for (const sx of [-0.8, 0.8]) for (const sz of [-1.35, 1.35]) b.geo(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 14), P.plastic, "outdoors", [cx + sx, 0.3, cz + sz], [0, 0, Math.PI / 2], undefined, 0.6);
  phys.box([cx - 0.9, 0, cz - 2.15], [cx + 0.9, 1.45, cz + 2.15]);
}

function makeStreetcar() {
  const g = new THREE.Group();
  const red = toon("#c8312d", { ink: 1 }), white = toon("#f2f5f7", { ink: 0.8 }), glass = toon("#8fb0b5", { ink: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(15, 2.3, 2.5), red); body.position.y = 1.55; g.add(body);
  const band = new THREE.Mesh(new THREE.BoxGeometry(15.02, 0.9, 2.52), glass); band.position.y = 2.0; g.add(band);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.35, 2.3), white); roof.position.y = 2.88; g.add(roof);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.9, 4), toon(P.ink, { ink: 0 }));
  pole.position.set(-3, 4.2, 0); pole.rotation.z = -0.9; g.add(pole);
  return g;
}

function makeRaccoon() {
  const g = new THREE.Group();
  const fur = toon("#7d7a74", { ink: 1 }), dark = toon("#2b2826", { ink: 0.8 }), light = toon("#d8d2c4", { ink: 0.6 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), fur); body.scale.set(1, 0.8, 1.35); body.position.y = 0.16; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), fur); head.position.set(0, 0.3, 0.24); g.add(head);
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.05), dark); mask.position.set(0, 0.32, 0.34); g.add(mask);
  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), light); snout.position.set(0, 0.27, 0.36); g.add(snout);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.07, 8), fur); ear.position.set(0.07 * s, 0.41, 0.22); g.add(ear); }
  const tail = new THREE.Group(); tail.position.set(0, 0.2, -0.24); g.add(tail);
  for (let i = 0; i < 5; i++) {
    const seg = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), i % 2 ? dark : fur);
    seg.position.set(0, i * 0.02, -i * 0.09); seg.scale.set(1, 1, 1.25); tail.add(seg);
  }
  g.userData.tail = tail;
  g.userData.head = head;
  return g;
}

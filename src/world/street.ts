/**
 * The front of the house (docs/design/areas/the-street.md): Bill's overgrown front yard, the
 * sidewalk he believes he owns, a quiet residential street of semis, and the houses across it,
 * including Kevin's, whose parcels Bill "protects". Mood only; no real street.
 *
 * Layout (metres, north is -Z):
 *   front yard    x -11..11,  z -11..-5    (weeds; the camera turns round in here)
 *   sidewalk      z -13..-11 (Bill's side), road z -19..-13, far sidewalk z -21..-19
 *   across        front yards z -25..-21, houses z -33..-25; Kevin's is straight across
 */
import * as THREE from "three/webgpu";
import { StaticBuilder, type Surfaces } from "./builder";
import type { Physics } from "./physics";
import { P } from "../content/palette";
import { canvasTex, toon } from "../render/comicMaterial";
import { SITE, type Rect } from "./site";

export const FRONT_YARD: Rect = { x0: -11, x1: 11, z0: -11, z1: -5 };
export const SIDEWALK = { z0: -13, z1: -11 };
export const ROAD = { z0: -19, z1: -13 };
export const FAR_WALK = { z0: -21, z1: -19 };
export const ACROSS = { yard: -21, front: -25, back: -33 };
export const FRONT_DOOR = new THREE.Vector3(-0.7, 0, -5);
/** Where Bill leaves Kevin's parcels "for safekeeping": his own front stoop. */
export const BILL_STOOP = new THREE.Vector3(-0.7, 0, -6.1);
/** Kevin's house is straight across the street. */
export const KEVIN = { x0: -3.4, x1: 3.8, door: 0.2 };
export const KEVIN_STOOP = new THREE.Vector3(0.2, 0, -23.5);
export const PARCELS_AT = new THREE.Vector3(0.2, 0.7, -24.35);
export const FRONT_GATE = { x0: -1.5, x1: 0.1, z: FRONT_YARD.z0 };

const EAST = SITE.x1, WEST = SITE.x0;

const concreteTex = canvasTex(64, 64, (g) => {
  g.fillStyle = "#c9c2b3"; g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#b3ab9b"; g.fillRect(0, 31, 64, 2); g.fillRect(31, 0, 2, 64);
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(0,0,0,.06)"; g.fillRect((i * 37) % 64, (i * 19) % 64, 2, 2); }
}, { nearest: true, repeat: true });
const asphaltTex = canvasTex(64, 64, (g) => {
  g.fillStyle = P.asphalt; g.fillRect(0, 0, 64, 64);
  g.fillStyle = "rgba(255,255,255,.06)"; for (let i = 0; i < 60; i++) g.fillRect((i * 37) % 64, (i * 23) % 64, 1, 1);
  g.fillStyle = "rgba(0,0,0,.18)"; for (let i = 0; i < 20; i++) g.fillRect((i * 13) % 64, (i * 29) % 64, 2, 1);
}, { nearest: true, repeat: true });
const newsTex = canvasTex(64, 64, (g) => {
  g.fillStyle = "#e7dcc2"; g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#1e1a18"; g.fillRect(6, 6, 52, 8);
  g.fillStyle = "#a89d82"; for (let y = 18; y < 60; y += 5) { g.fillRect(6, y, 24, 2); g.fillRect(34, y, 24, 2); }
});
function sign(lines: string[], bg: string, fg: string, w = 256, h = 128) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = P.ink; g.lineWidth = 5; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
    lines.forEach((t, i) => { g.font = i === 0 ? "900 34px 'Arial Black', Impact, sans-serif" : "700 24px 'Comic Sans MS', 'Shantell Sans', cursive"; g.fillText(t, w / 2, (h / (lines.length + 1)) * (i + 1), w - 16); });
  });
}

/** A seeded random, so the weeds grow the same way every time. */
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

export function buildStreet(scene: THREE.Scene, phys: Physics, surfaces: Surfaces) {
  const b = new StaticBuilder(scene, phys);
  /** The houses across the street, in their own builder so they can be hidden when the camera turns round. */
  const across = new StaticBuilder(scene, phys);
  const tag = (o: THREE.Object3D, t = "outdoors") => { o.userData.tag = t; scene.add(o); return o; };
  const concrete = toon("#fff", { map: concreteTex, ink: 0.4 });
  const asphalt = toon("#fff", { map: asphaltTex, ink: 0.4 });
  const Y = FRONT_YARD;
  const rnd = seeded(7);

  /* ---------- sidewalks, the road, curbs ---------- */
  b.box([WEST, -0.1, SIDEWALK.z0], [EAST, 0.03, SIDEWALK.z1], concrete, "outdoors", { collide: false, tile: 2 });
  b.box([WEST, -0.1, FAR_WALK.z0], [EAST, 0.03, FAR_WALK.z1], concrete, "outdoors", { collide: false, tile: 2 });
  b.box([WEST, -0.1, ROAD.z0], [EAST, 0.004, ROAD.z1], asphalt, "outdoors", { collide: false, tile: 2 });
  for (const z of [ROAD.z1, ROAD.z0]) b.box([WEST, 0, z - 0.1], [EAST, 0.06, z + 0.1], "#b3ab9b", "outdoors", { collide: false, ink: 0.3 });
  // the forecourt in front of the lot, the store and the gym
  b.box([11, -0.1, SIDEWALK.z1], [EAST, 0.025, -5.2], concrete, "outdoors", { collide: false, tile: 2 });
  surfaces.add({ x0: WEST, x1: EAST, z0: FAR_WALK.z0, z1: FAR_WALK.z1, y0: -0.5, y1: 2, surface: "concrete" });
  surfaces.add({ x0: WEST, x1: EAST, z0: ROAD.z0, z1: ROAD.z1, y0: -0.5, y1: 2, surface: "asphalt" });
  surfaces.add({ x0: WEST, x1: EAST, z0: SIDEWALK.z0, z1: SIDEWALK.z1, y0: -0.5, y1: 2, surface: "concrete" });
  surfaces.add({ x0: 11, x1: EAST, z0: SIDEWALK.z1, z1: -5.2, y0: -0.5, y1: 2, surface: "concrete" });
  surfaces.add({ x0: Y.x0, x1: Y.x1, z0: Y.z0, z1: Y.z1, y0: -0.5, y1: 2, surface: "grass" });

  /* ---------- Bill's front yard: weeds as tall as a man's patience ---------- */
  const greens = ["#6f8f4e", "#5c7a3e", "#8a9a4e", "#a39a5a", "#7d8f3a", "#95a24e"];
  const onPath = (x: number, z: number) => x > FRONT_GATE.x0 - 0.2 && x < FRONT_GATE.x1 + 0.2 && z > Y.z0 && z < -5.0;
  for (let i = 0; i < 320; i++) {
    const x = Y.x0 + 0.3 + rnd() * (Y.x1 - Y.x0 - 0.6), z = Y.z0 + 0.3 + rnd() * (Y.z1 - Y.z0 - 0.5);
    if (onPath(x, z) && rnd() < 0.85) continue;
    const blades = 3 + Math.floor(rnd() * 4), tall = 0.45 + rnd() * 0.9, col = greens[Math.floor(rnd() * greens.length)];
    for (let k = 0; k < blades; k++) {
      const h = tall * (0.6 + rnd() * 0.5);
      b.geo(new THREE.ConeGeometry(0.035 + rnd() * 0.03, h, 4), col, "outdoors",
        [x + (rnd() - 0.5) * 0.18, h / 2, z + (rnd() - 0.5) * 0.18], [(rnd() - 0.5) * 0.6, rnd() * 3, (rnd() - 0.5) * 0.6], undefined, 0.5);
    }
    if (rnd() < 0.18) b.geo(new THREE.SphereGeometry(0.05, 6, 4), rnd() < 0.5 ? "#e3c545" : "#e9e2cc", "outdoors", [x, tall + 0.02, z], undefined, undefined, 0.4); // dandelions and seed heads
  }
  // overgrown flagstones from the front door to the gate
  for (let z = -6.6; z > Y.z0 + 0.3; z -= 0.8) b.geo(new THREE.CylinderGeometry(0.34, 0.36, 0.05, 10), "#b7ae9d", "outdoors", [-0.7 + (rnd() - 0.5) * 0.2, 0.025, z], undefined, undefined, 0.4);
  // the archive's outdoor wing: a bathtub planter, a rusty bike, a birdbath with no water
  b.box([-8.6, 0, -9.4], [-7.0, 0.55, -8.6], "#eeeae0", "outdoors");
  b.box([-8.5, 0.35, -9.3], [-7.1, 0.56, -8.7], "#6f8f4e", "outdoors", { collide: false, ink: 0.3 });
  for (const x of [5.6, 6.6]) b.geo(new THREE.TorusGeometry(0.33, 0.035, 6, 16), "#8a5a3a", "outdoors", [x, 0.33, -8.2], [0, 0.3, 0.1], undefined, 0.7);
  b.box([5.6, 0.5, -8.25], [6.6, 0.55, -8.15], "#8a5a3a", "outdoors", { collide: false });
  b.geo(new THREE.CylinderGeometry(0.1, 0.16, 0.8, 10), "#b7ae9d", "outdoors", [4.2, 0.4, -6.6], undefined, undefined, 0.6);
  b.geo(new THREE.CylinderGeometry(0.42, 0.3, 0.12, 14), "#b7ae9d", "outdoors", [4.2, 0.86, -6.6], undefined, undefined, 0.6);
  phys.box([3.8, 0, -7.0], [4.6, 0.9, -6.2]);
  const keepOff = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), toon("#fff", { map: sign(["ARCHIVE", "keep off. it's all important"], "#e9dcc0", "#1e1a18"), ink: 0.4 }));
  keepOff.position.set(-4.2, 0.9, -9.8); keepOff.rotation.y = Math.PI; tag(keepOff);
  b.box([-4.22, 0, -9.78], [-4.18, 0.8, -9.74], P.walnut, "outdoors", { collide: false });

  /* ---------- the front of Bill's house: stoop, porch roof, newspapered windows, a mailbox ---------- */
  b.box([-1.8, 0, -6.3], [0.4, 0.12, -5.05], "#b3ab9b", "outdoors", { collide: false, ink: 0.4 });
  b.box([-1.9, 2.55, -6.4], [0.5, 2.65, -5.05], "#6b5540", "outdoors", { collide: false, ink: 0.6 });
  for (const x of [-1.8, 0.35]) b.box([x - 0.05, 0.12, -6.35], [x + 0.05, 2.55, -6.25], "#e9e2cc", "outdoors", { collide: false, ink: 0.5 });
  const news = toon("#fff", { map: newsTex, ink: 0.4 });
  for (const [x0, x1] of [[-5.0, -3.0], [1.4, 3.4], [4.0, 5.4]] as const) {
    b.box([x0 - 0.08, 0.95, -5.12], [x1 + 0.08, 2.15, -5.08], "#e9e2cc", "outdoors", { collide: false, ink: 0.5 });
    b.box([x0, 1.02, -5.14], [x1, 2.08, -5.1], news, "outdoors", { collide: false, ink: 0.3 });
  }
  b.box([-1.35, 0, -5.1], [-0.05, 2.1, -5.06], "#4a3524", "outdoors", { collide: false, ink: 0.6 }); // the front door, closed-looking from outside
  b.box([-2.6, 0.9, -6.05], [-2.2, 1.25, -5.85], "#2f3438", "outdoors", { collide: false, ink: 0.6 }); // mailbox
  b.box([-2.43, 0, -5.97], [-2.37, 0.9, -5.93], "#2f3438", "outdoors", { collide: false });
  for (let i = 0; i < 5; i++) b.box([0.0 + i * 0.05, 0.12 + i * 0.05, -5.9 + (i % 2) * 0.05], [0.3 + i * 0.05, 0.17 + i * 0.05, -5.55], "#e7dcc2", "outdoors", { collide: false, ink: 0.4 }); // unread newspapers
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.45), toon("#fff", { map: sign(["GO AWAY"], "#8a6446", "#e9dcc0", 256, 128), ink: 0.3 }));
  mat.rotation.x = -Math.PI / 2; mat.rotation.z = Math.PI; mat.position.set(-0.7, 0.125, -5.6); tag(mat);

  /* ---------- fences: the front, with a gate, and the sides down to the back yard ---------- */
  const fence = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 0.45));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      b.box([x - 0.05, 0, z - 0.05], [x + 0.05, 1.05, z + 0.05], P.fence, "outdoors", { collide: false, ink: 0.55 });
    }
    const mnx = Math.min(x0, x1) - 0.03, mxx = Math.max(x0, x1) + 0.03, mnz = Math.min(z0, z1) - 0.03, mxz = Math.max(z0, z1) + 0.03;
    b.box([mnx, 0.35, mnz], [mxx, 0.43, mxz], P.fence, "outdoors", { collide: false, ink: 0.5 });
    b.box([mnx, 0.78, mnz], [mxx, 0.86, mxz], P.fence, "outdoors", { collide: false, ink: 0.5 });
    phys.box([mnx, 0, mnz], [mxx, 1.1, mxz]);
  };
  fence(Y.x0, Y.z0, FRONT_GATE.x0, Y.z0);
  fence(FRONT_GATE.x1, Y.z0, Y.x1, Y.z0);
  fence(Y.x0, Y.z0, Y.x0, 5.2);
  fence(Y.x1, Y.z0, Y.x1, 5.2);
  // the gate, hanging open toward the weeds
  b.geo(new THREE.BoxGeometry(1.5, 0.9, 0.06), P.fence, "outdoors", [FRONT_GATE.x0 + 0.1, 0.5, Y.z0 + 0.7], [0, 1.35, 0], undefined, 0.5);
  const noJog = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.45), toon("#fff", { map: sign(["NO JOGGING", "this means the sidewalk"], "#fbf6ec", "#c8312d"), ink: 0.4 }));
  noJog.position.set(3.0, 0.95, Y.z0 - 0.07); noJog.rotation.y = Math.PI; tag(noJog);

  /* ---------- trees, poles and parked cars along the street ---------- */
  const tree = (x: number, z: number, s = 1) => {
    b.geo(new THREE.CylinderGeometry(0.16 * s, 0.22 * s, 2.4 * s, 8), P.bark, "outdoors", [x, 1.2 * s, z], undefined, undefined, 0.7);
    for (const [dx, dy, dz, r] of [[0, 3.0, 0, 1.3], [0.7, 2.6, 0.3, 0.9], [-0.6, 2.7, -0.4, 0.95]] as const)
      b.geo(new THREE.IcosahedronGeometry(r * s, 1), P.leaf, "outdoors", [x + dx * s, dy * s, z + dz * s], undefined, undefined, 0.8);
    phys.box([x - 0.25, 0, z - 0.25], [x + 0.25, 2, z + 0.25]);
  };
  for (const x of [-8, 7, 21, 35, 49, 61]) tree(x, FAR_WALK.z0 + 0.6, 0.95);
  for (const x of [15, 29, 44, 58]) tree(x, SIDEWALK.z0 + 0.5, 0.85);
  const carX = (cx: number, cz: number, color: string) => {
    b.box([cx - 2.1, 0.3, cz - 0.85], [cx + 2.1, 0.95, cz + 0.85], color, "outdoors", { collide: false });
    b.box([cx - 1.0, 0.95, cz - 0.75], [cx + 1.1, 1.45, cz + 0.75], color, "outdoors", { collide: false });
    b.box([cx - 0.9, 1.0, cz - 0.76], [cx + 1.0, 1.4, cz + 0.76], "#8fb0b5", "outdoors", { collide: false, ink: 0.3 });
    for (const sx of [-1.35, 1.35]) for (const sz of [-0.8, 0.8]) b.geo(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 14), P.plastic, "outdoors", [cx + sx, 0.3, cz + sz], [Math.PI / 2, 0, 0], undefined, 0.6);
    phys.box([cx - 2.15, 0, cz - 0.9], [cx + 2.15, 1.45, cz + 0.9]);
  };
  for (const [x, c] of [[9.5, "#9aa3a8"], [19, "#3f8a86"], [31, "#e8b23a"], [46, "#8a3d3d"]] as const) carX(x, ROAD.z1 - 1.0, c);
  for (const [x, c] of [[-7.5, "#5f7f79"], [13, "#b0665a"], [27, "#2a6fb5"], [41, "#9aa3a8"], [55, "#6b5540"]] as const) carX(x, ROAD.z0 + 1.0, c);

  /* ---------- the houses across the street: a row of semis, fronts to the street ---------- */
  const colors = ["#a4553f", "#e9dcc0", "#7f8f9a", "#6f8f6a", "#c9b79a", "#8a5a6a", "#b0665a", "#9aa3a8"];
  const F = ACROSS.front, D = ACROSS.front - ACROSS.back;
  let i = 0;
  for (let x = WEST; x < EAST - 2; x += 6.6, i++) {
    const x0 = x + 0.25, x1 = x + 6.35, cx = (x0 + x1) / 2;
    const kevin = cx > KEVIN.x0 && cx < KEVIN.x1;
    const wall = kevin ? "#3a3d42" : colors[i % colors.length], trim = kevin ? "#1e1a18" : "#efe9dc";
    const H = kevin ? 6.4 : 5.8 + (i % 3) * 0.3;
    across.box([x0, 0, ACROSS.back], [x1, H, F], wall, "outdoors", { ink: 0.8 });
    // a front gable
    const sh = new THREE.Shape();
    sh.moveTo(-(x1 - x0) / 2 - 0.2, 0); sh.lineTo((x1 - x0) / 2 + 0.2, 0); sh.lineTo(0, kevin ? 1.2 : 2.2); sh.closePath();
    across.geo(new THREE.ExtrudeGeometry(sh, { depth: D + 0.3, bevelEnabled: false }), kevin ? "#2b2826" : "#6b5540", "outdoors", [cx, H, ACROSS.back - 0.15]);
    // windows, a door, a porch
    const win = kevin ? "#8fd0f0" : "#8fb0b5";
    for (const wx of [x0 + 0.7, x1 - 2.1]) across.box([wx, 3.4, F], [wx + 1.4, 4.9, F + 0.06], trim, "outdoors", { collide: false, ink: 0.5 });
    for (const wx of [x0 + 0.8, x1 - 2.0]) across.box([wx, 3.5, F + 0.02], [wx + 1.2, 4.8, F + 0.08], win, "outdoors", { collide: false, ink: 0.3 });
    const doorX = kevin ? KEVIN.door : x0 + 1.4 + (i % 2) * 2.4;
    across.box([doorX - 0.55, 0, F], [doorX + 0.55, 2.2, F + 0.06], kevin ? "#8fb0b5" : ["#2f6e4f", "#c8312d", "#2a2350", "#1e1a18"][i % 4], "outdoors", { collide: false, ink: 0.6 });
    across.box([doorX + 1.2, 0.9, F], [doorX + 2.6, 2.1, F + 0.06], win, "outdoors", { collide: false, ink: 0.4 });
    // the stoop: two steps up to the door
    across.box([doorX - 0.9, 0, F], [doorX + 0.9, 0.18, F + 1.5], "#b3ab9b", "outdoors", { ink: 0.4 });
    across.box([doorX - 0.9, 0.18, F], [doorX + 0.9, 0.36, F + 0.9], "#b3ab9b", "outdoors", { ink: 0.4 });
    if (!kevin) {
      across.box([doorX - 1.0, 2.55, F], [doorX + 1.0, 2.65, F + 1.5], trim, "outdoors", { collide: false, ink: 0.5 });
      for (const px of [doorX - 0.9, doorX + 0.9]) across.box([px - 0.05, 0.36, F + 1.4], [px + 0.05, 2.55, F + 1.5], trim, "outdoors", { collide: false, ink: 0.5 });
    }
    // front yard: a low fence or a hedge, with a gap at the walk
    if (i % 2) for (const [a, c] of [[x0, doorX - 0.7], [doorX + 0.7, x1]] as const) across.box([a, 0, ACROSS.yard - 0.35], [c, 0.8, ACROSS.yard + 0.05], "#4f7a3e", "outdoors", { ink: 0.6 });
    else for (const [a, c] of [[x0, doorX - 0.7], [doorX + 0.7, x1]] as const) {
      across.box([a, 0.3, ACROSS.yard - 0.1], [c, 0.36, ACROSS.yard - 0.04], trim, "outdoors", { collide: false, ink: 0.4 });
      across.box([a, 0.66, ACROSS.yard - 0.1], [c, 0.72, ACROSS.yard - 0.04], trim, "outdoors", { collide: false, ink: 0.4 });
      for (let px = a; px <= c; px += 0.5) across.box([px - 0.04, 0, ACROSS.yard - 0.11], [px + 0.04, 0.85, ACROSS.yard - 0.03], trim, "outdoors", { collide: false, ink: 0.4 });
      phys.box([a, 0, ACROSS.yard - 0.12], [c, 0.9, ACROSS.yard]);
    }
    if (kevin) {
      // Kevin's renovation: a doorbell camera, a sleek planter, and a brass number he didn't need
      across.box([doorX + 0.62, 1.2, F], [doorX + 0.74, 1.4, F + 0.08], "#1e1a18", "outdoors", { collide: false, ink: 0.3 });
      across.box([doorX + 0.66, 1.33, F + 0.08], [doorX + 0.7, 1.36, F + 0.09], "#2aa6a1", "outdoors", { collide: false, ink: 0 });
      across.box([doorX - 1.9, 0, F + 0.4], [doorX - 1.3, 0.7, F + 1.0], "#2b2826", "outdoors", { ink: 0.6 });
      across.geo(new THREE.IcosahedronGeometry(0.45, 1), P.leaf, "outdoors", [doorX - 1.6, 1.1, F + 0.7], undefined, [1, 1.3, 1], 0.7);
    }
  }
  const kevinSign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.5), toon("#fff", { map: sign(["KEVIN", "media professional"], "#1e1a18", "#fbf6ec"), ink: 0.4 }));
  kevinSign.position.set(KEVIN.door + 1.9, 2.3, ACROSS.front + 0.08);
  across.groups.outdoors.add(kevinSign);

  b.finish();
  across.finish();
  return { builder: b, across };
}

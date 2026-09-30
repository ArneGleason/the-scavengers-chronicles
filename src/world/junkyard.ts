/**
 * Big Wanda's Junkyard (errand 4, Grate Shelf Revelation): east of the gym, where the laneway
 * ends. A chain-link fence with a gate onto the lane, mounds of the archive's wild relatives,
 * the rusty grate, and Wanda's trailer. Wanda herself is actors/wanda.ts.
 */
import * as THREE from "three/webgpu";
import { StaticBuilder, type Surfaces } from "./builder";
import type { Physics } from "./physics";
import { P } from "../content/palette";
import { canvasTex, toon, flat } from "../render/comicMaterial";
import type { Rect } from "./site";

export const JUNKYARD: Rect = { x0: 43, x1: 64, z0: -5, z1: 15 };
/** The gate in the lane-side fence. */
export const GATE = { x0: 46, x1: 50, z: 15 };
export const GRATE_AT = new THREE.Vector3(54.5, 0, 7.4);
export const WANDA_HOME = { x: 56.6, z: 1.9 };
/** Where a caught Bill lands after Wanda throws him out: the lane, just past the gate. */
export const TOSS_TO = new THREE.Vector3(48.2, 0, 17.6);

export const inJunkyard = (p: { x: number; z: number }) => p.x > JUNKYARD.x0 && p.x < JUNKYARD.x1 && p.z > JUNKYARD.z0 && p.z < JUNKYARD.z1 + 0.3;

const gravelTex = canvasTex(64, 64, (g) => {
  g.fillStyle = "#9a8a70"; g.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 160; i++) { g.fillStyle = ["#857661", "#b0a084", "#6f6352"][i % 3]; g.fillRect((i * 37) % 64, (i * 23 + (i >> 2)) % 64, 2, 2); }
}, { nearest: true, repeat: true });
const linkTex = canvasTex(64, 64, (g) => {
  g.clearRect(0, 0, 64, 64);
  g.strokeStyle = "#8d9499"; g.lineWidth = 2.2;
  for (let i = -64; i < 128; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke(); }
}, { repeat: true });
function signTex(lines: [string, string, number][], bg: string, w = 512, h = 160) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = P.ink; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
    g.textAlign = "center"; g.textBaseline = "middle";
    lines.forEach(([text, color, y], i) => {
      g.fillStyle = color;
      g.font = i === 0 ? "900 54px 'Arial Black', Impact, sans-serif" : "700 34px 'Comic Sans MS', 'Shantell Sans', cursive";
      g.fillText(text, w / 2, y, w - 24);
    });
  });
}

export function buildJunkyard(scene: THREE.Scene, phys: Physics, surfaces: Surfaces) {
  const b = new StaticBuilder(scene, phys);
  const L = JUNKYARD;
  const tag = (o: THREE.Object3D) => { o.userData.tag = "outdoors"; scene.add(o); return o; };

  /* ---------- the ground: gravel inside the fence ---------- */
  b.box([L.x0, -0.1, L.z0], [L.x1, 0.012, L.z1], toon("#fff", { map: gravelTex, ink: 0.4 }), "outdoors", { collide: false, tile: 2 });
  surfaces.add({ x0: L.x0, x1: L.x1, z0: L.z0, z1: L.z1, y0: -0.5, y1: 2, surface: "dirt" });

  /* ---------- chain-link fence, with a gate onto the lane ---------- */
  const chainLink = (map: THREE.Texture) => {
    const m = new THREE.MeshBasicNodeMaterial({ map, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
    m.userData.ink = 0;
    return m;
  };
  const leafTex = linkTex.clone(); leafTex.repeat.set(1.6, 1.5); leafTex.needsUpdate = true;
  const link = chainLink(leafTex);
  const post = (x: number, z: number, h = 2.1) => b.geo(new THREE.CylinderGeometry(0.045, 0.045, h, 6), "#7d858a", "outdoors", [x, h / 2, z], undefined, undefined, 0.6);
  const run = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    for (let i = 0; i <= Math.round(len / 2.5); i++) { const t = i / Math.round(len / 2.5); post(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t); }
    const tex = linkTex.clone(); tex.repeat.set(len / 1.2, 1.6); tex.needsUpdate = true;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.9), chainLink(tex));
    mesh.position.set((x0 + x1) / 2, 0.98, (z0 + z1) / 2);
    mesh.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    tag(mesh);
    b.box([Math.min(x0, x1) - 0.03, 2.0, Math.min(z0, z1) - 0.03], [Math.max(x0, x1) + 0.03, 2.06, Math.max(z0, z1) + 0.03], "#7d858a", "outdoors", { collide: false, ink: 0.4 });
    phys.box([Math.min(x0, x1) - 0.05, 0, Math.min(z0, z1) - 0.05], [Math.max(x0, x1) + 0.05, 2.1, Math.max(z0, z1) + 0.05]);
  };
  run(L.x0, L.z1, GATE.x0, L.z1);
  run(GATE.x1, L.z1, 63.4, L.z1);
  run(L.x0, L.z0, L.x0, L.z1);
  run(L.x0, L.z0, 63.4, L.z0);
  // the gate: two tall posts and an arch sign over the gap
  for (const x of [GATE.x0, GATE.x1]) post(x, L.z1, 3.4);
  const arch = new THREE.Mesh(new THREE.BoxGeometry(GATE.x1 - GATE.x0 + 0.3, 0.7, 0.08), toon("#fff", {
    map: signTex([["BIG WANDA'S JUNKYARD", "#fbf6ec", 58], ["no scavenging (this means you bill)", "#f2b632", 118]], "#2f6e4f"), ink: 0.8,
  }));
  arch.position.set((GATE.x0 + GATE.x1) / 2, 3.1, L.z1);
  tag(arch);
  // the gate leaves, hinged on the posts; closed (and padlocked) until main.ts opens them
  const half = (GATE.x1 - GATE.x0) / 2;
  const leaves = ([[GATE.x0, 1], [GATE.x1, -1]] as const).map(([x, dir]) => {
    const hinge = new THREE.Group();
    hinge.position.set(x, 0, L.z1);
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(half, 1.8), link);
    leaf.position.set((dir * half) / 2, 0.95, 0);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(half, 0.05, 0.05), toon("#7d858a", { ink: 0.5 }));
    frame.position.set((dir * half) / 2, 1.86, 0);
    hinge.add(leaf, frame);
    hinge.userData.dir = dir;
    return tag(hinge);
  });
  const lock = new THREE.Group();
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 16), toon("#9aa3a8", { ink: 0.7 }));
  chain.position.set(0, 1.0, 0);
  const padlock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.06), toon("#e8b23a", { ink: 0.9 }));
  padlock.position.set(0, 0.8, 0.04);
  const closedSign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.45), toon("#fff", {
    map: signTex([["CLOSED", "#c8312d", 44], ["wanda is at lunch. a long lunch.", "#1e1a18", 110]], "#fbf6ec", 360, 150), ink: 0.5,
  }));
  closedSign.position.set(0, 1.45, 0.05);
  lock.add(chain, padlock, closedSign);
  lock.position.set((GATE.x0 + GATE.x1) / 2, 0, L.z1 + 0.03);
  tag(lock);
  let gateCollider: ReturnType<Physics["box"]> | null = phys.box([GATE.x0, 0, L.z1 - 0.08], [GATE.x1, 2.1, L.z1 + 0.08]);
  let gateOpen = 0; // 0 closed .. 1 open
  let opening = false;
  /** Swing the gate open (once), and take the padlock away. */
  const openGate = () => {
    if (opening) return;
    opening = true;
    lock.visible = false;
    if (gateCollider) { phys.world.removeCollider(gateCollider, false); gateCollider = null; }
  };
  const updateGate = (dt: number) => {
    if (!opening || gateOpen >= 1) return;
    gateOpen = Math.min(1, gateOpen + dt / 1.2);
    const k = 1 - (1 - gateOpen) ** 3;
    for (const h of leaves) h.rotation.y = (h.userData.dir as number) * 1.25 * k;
  };
  // the street side of her north fence
  const streetSign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.6), toon("#fff", {
    map: signTex([["BIG WANDA'S JUNKYARD", "#fbf6ec", 58], ["entrance on the lane. no browsing.", "#f2b632", 118]], "#2f6e4f"), ink: 0.6,
  }));
  streetSign.position.set(50, 1.3, L.z0 - 0.08); streetSign.rotation.y = Math.PI;
  tag(streetSign);

  /* ---------- mounds: the archive's wild relatives ---------- */
  const mound = (x: number, z: number, r: number, h: number, seed: number) => {
    const geo = new THREE.SphereGeometry(1, 12, 7); // indexed, so the lumps stay one skin
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i), k = 1 + 0.12 * Math.sin(i * 1.7 + seed) + 0.08 * Math.cos(i * 0.9 + seed * 2);
      pos.setXYZ(i, pos.getX(i) * k, Math.max(-0.1, y) * k, pos.getZ(i) * k);
    }
    geo.computeVertexNormals();
    b.geo(geo, ["#8a7a62", "#7b6e5c", "#948469"][seed % 3], "outdoors", [x, 0, z], [0, seed, 0], [r, h, r], 0.7);
    phys.box([x - r * 0.7, 0, z - r * 0.7], [x + r * 0.7, h * 0.8, z + r * 0.7]);
    // junk poking out of the top
    const top = (dx: number, dz: number) => [x + dx * r, h * (1 - (dx * dx + dz * dz)) * 0.95, z + dz * r] as [number, number, number];
    b.geo(new THREE.TorusGeometry(0.28, 0.1, 8, 16), "#2b2b2d", "outdoors", top(0.1, -0.2), [1.2, seed, 0.3], undefined, 0.8);
    b.geo(new THREE.BoxGeometry(0.7, 0.8, 0.65), seed % 2 ? "#e9e4d8" : "#c9d3d6", "outdoors", top(-0.25, 0.15), [0.3, seed * 0.7, -0.4], undefined, 0.9);
    b.geo(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8), P.silver, "outdoors", top(0.3, 0.2), [0.2, seed, 1.1], undefined, 0.6);
    b.geo(new THREE.ConeGeometry(0.16, 0.42, 10), "#e8762e", "outdoors", top(-0.1, -0.35), [0.5, 0, 0.3], undefined, 0.8);
  };
  mound(47.2, 4.0, 2.4, 1.6, 1);
  mound(52.4, -0.6, 2.2, 1.9, 2);
  mound(58.8, 10.6, 2.3, 1.7, 3);
  mound(61.6, 5.2, 1.4, 1.2, 4);
  mound(50.0, 10.2, 1.2, 1.0, 5);
  // loose junk on the flat: tires, a bathtub, a car door
  for (const [x, z] of [[55.8, 12.3], [44.6, 12.0], [60.2, -3.2]] as const) b.geo(new THREE.TorusGeometry(0.3, 0.11, 8, 16), "#2b2b2d", "outdoors", [x, 0.1, z], [Math.PI / 2, 0, 0], undefined, 0.8);
  b.box([44.2, 0, 7.6], [45.6, 0.55, 8.4], "#eeeae0", "outdoors");
  b.geo(new THREE.BoxGeometry(1.1, 0.9, 0.08), "#b5452f", "outdoors", [56.2, 0.45, 13.4], [0, 0.6, -0.2], undefined, 0.8);

  /* ---------- Big Wanda's trailer ---------- */
  const T = { x0: 55.2, x1: 60.6, z0: -3.2, z1: 0.9 };
  b.box([T.x0, 0.35, T.z0], [T.x1, 2.75, T.z1], "#efe9dc", "outdoors");
  b.box([T.x0 - 0.02, 1.2, T.z1], [T.x1 + 0.02, 1.45, T.z1 + 0.02], "#2aa6a1", "outdoors", { collide: false, ink: 0.3 });
  b.box([T.x0 - 0.1, 2.75, T.z0 - 0.1], [T.x1 + 0.1, 2.85, T.z1 + 0.1], "#8d9499", "outdoors", { collide: false, ink: 0.5 });
  for (const x of [T.x0 + 0.5, T.x1 - 0.5]) b.box([x - 0.25, 0, T.z0 + 0.3], [x + 0.25, 0.35, T.z1 - 0.3], "#7b6e5c", "outdoors", { collide: false }); // cinder blocks
  b.box([56.4, 0.35, T.z1], [57.2, 2.3, T.z1 + 0.03], "#c8a266", "outdoors", { collide: false, ink: 0.6 }); // door
  b.box([56.2, 0, T.z1], [57.4, 0.35, T.z1 + 0.6], "#7b6e5c", "outdoors"); // step
  for (const x of [58.0, 59.5]) b.box([x - 0.4, 1.55, T.z1], [x + 0.4, 2.2, T.z1 + 0.02], "#8fb0b5", "outdoors", { collide: false, ink: 0.5 });
  // an awning, a lawn chair, a pink flamingo, and hubcaps on the wall like trophies
  b.box([55.8, 2.45, T.z1], [60.0, 2.5, T.z1 + 1.4], "#e0367a", "outdoors", { collide: false, ink: 0.6 });
  b.box([58.4, 0.3, 1.6], [59.0, 0.36, 2.2], "#2aa6a1", "outdoors", { collide: false });
  b.box([58.4, 0.36, 2.15], [59.0, 0.9, 2.2], "#2aa6a1", "outdoors", { collide: false });
  b.geo(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 5), P.ink, "outdoors", [60.3, 0.35, 1.8], undefined, undefined, 0);
  b.geo(new THREE.SphereGeometry(0.16, 12, 8), "#f28ab0", "outdoors", [60.3, 0.8, 1.8], undefined, [1, 0.8, 1.4], 0.8);
  b.geo(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), "#f28ab0", "outdoors", [60.3, 1.02, 1.95], [0.5, 0, 0], undefined, 0.6);
  for (const [x, y] of [[55.7, 1.9], [55.7, 0.95], [60.1, 1.0]] as const) b.geo(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), P.chrome, "outdoors", [x, y, T.z1 + 0.03], [Math.PI / 2, 0, 0], undefined, 0.6);
  const wandaSign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), toon("#fff", {
    map: signTex([["WANDA", "#e0367a", 60], ["proprietor & sincere admirer", "#1e1a18", 122]], "#fbf6ec", 512, 150), ink: 0.4,
  }));
  wandaSign.position.set(58.0, 3.2, T.z1 - 0.15);
  tag(wandaSign);
  for (const x of [57.1, 58.9]) b.box([x - 0.04, 2.85, T.z1 - 0.2], [x + 0.04, 2.95, T.z1 - 0.12], "#7d858a", "outdoors", { collide: false, ink: 0.4 });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(T.x1 - T.x0 + 0.6, T.z1 - T.z0 + 0.6), flat("#2c4543", { transparent: true, opacity: 0.2, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set((T.x0 + T.x1) / 2, 0.02, (T.z0 + T.z1) / 2); shadow.renderOrder = -1;
  tag(shadow);

  b.finish();
  return { builder: b, openGate, updateGate, gateIsOpen: () => opening, lock };
}

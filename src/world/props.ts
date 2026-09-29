/**
 * Props that Bill can poke for a gag (docs/design/gags.md): the basement hoard he dives into
 * for the DIN cable, the kitchen toaster, and a box marked ADAPTERS in the lane. Plus the
 * newspaper that sticks to his shoe and grows into a train. The fridge is part of the estate;
 * its gag only needs a spot. main.ts decides what happens to Bill.
 */
import * as THREE from "three/webgpu";
import { toon, canvasTex } from "../render/comicMaterial";
import { ensureInkNormals } from "../render/ink";
import type { Physics } from "./physics";
import { BASEMENT_Y } from "./stairs";
import { P } from "../content/palette";

export const HOARD_AT = new THREE.Vector3(-2.0, BASEMENT_Y, 0.8);
export const TOASTER_AT = new THREE.Vector3(-5.6, 0.92, 2.3);
/** Where Bill stands to open the fridge, and where the fridge's door is. */
export const FRIDGE_AT = new THREE.Vector3(-5.1, 0, 4.52);
export const ADAPTER_BOX_AT = new THREE.Vector3(8.6, 0, 16.2);

const newsTex = canvasTex(64, 48, (g, w, h) => {
  g.fillStyle = "#ece2c8"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#1e1a18"; g.fillRect(4, 3, w - 8, 7); // the masthead
  g.fillStyle = "#b9ad8f"; for (let y = 14; y < h - 2; y += 4) { g.fillRect(4, y, w / 2 - 6, 2); g.fillRect(w / 2 + 2, y, w / 2 - 6, 2); }
});

function tagged<T extends THREE.Object3D>(o: T, tag: string, scene: THREE.Scene) {
  o.userData.tag = tag;
  ensureInkNormals(o);
  scene.add(o);
  return o;
}

export interface Props {
  hoard: THREE.Group;
  toaster: THREE.Group;
  toast: THREE.Mesh[];
  adapterBox: THREE.Group;
}

export function buildProps(scene: THREE.Scene, phys: Physics): Props {
  /* ---------- the hoard: a heap of archive with the DIN cable somewhere inside ---------- */
  const hoard = new THREE.Group();
  const news = toon("#fff", { map: newsTex, ink: 0.7 });
  const card = toon("#c79a62", { ink: 0.9 });
  const put = (m: THREE.Mesh, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz); hoard.add(m); return m;
  };
  const bundles: [number, number, number, number, number][] = [
    [-0.4, 0.12, -0.25, 0.1, 0.4], [0.2, 0.12, -0.3, -0.08, -0.3], [0.45, 0.12, 0.2, 0.15, 0.9], [-0.35, 0.12, 0.3, -0.12, 1.4],
    [0.05, 0.12, 0.3, 0.05, 0.2], [-0.1, 0.36, -0.05, 0.3, 0.7], [0.3, 0.34, 0.0, -0.25, -0.5], [-0.3, 0.38, 0.12, 0.2, 2.1],
    [0.05, 0.58, 0.05, -0.35, 0.3],
  ];
  for (const [x, y, z, t, r] of bundles) put(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.24, 0.36), news), x, y, z, t, r, t * 0.5);
  put(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.42), card), 0.55, 0.2, -0.25, 0, 0.5, 0.2);
  put(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.34), card), -0.6, 0.18, -0.05, 0.1, -0.4, -0.25);
  // a lampshade, a small TV, a boot, a coil of cable: the archive
  put(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.22, 14, 1, true), toon(P.mustard, { ink: 1, side: THREE.DoubleSide })), 0.02, 0.82, 0.02, 0.5, 0, 0.4);
  const tv = put(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.26), toon(P.plastic, { ink: 1 })), 0.38, 0.55, 0.28, 0.1, -0.7, -0.3);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.16), toon("#5f7f79", { ink: 0.3 }));
  screen.position.z = 0.131; tv.add(screen);
  put(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.28), toon("#5a3a22", { ink: 1 })), -0.45, 0.5, 0.3, 0.9, 0.2, 0.4);
  put(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 20), toon("#2f3438", { ink: 0.6 })), -0.2, 0.62, -0.2, 1.1, 0.3, 0);
  hoard.position.copy(HOARD_AT);
  tagged(hoard, "basement", scene);
  phys.box([HOARD_AT.x - 0.6, BASEMENT_Y, HOARD_AT.z - 0.5], [HOARD_AT.x + 0.6, BASEMENT_Y + 0.55, HOARD_AT.z + 0.5]);

  /* ---------- the toaster on the counter, two slices loaded ---------- */
  const toaster = new THREE.Group();
  const chrome = toon(P.chrome, { ink: 1 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.28), chrome);
  body.position.y = 0.09;
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.06), toon(P.ink, { ink: 0.5 }));
  lever.position.set(0.09, 0.13, 0);
  lever.name = "lever";
  toaster.add(body, lever);
  const toast: THREE.Mesh[] = [];
  const bread = toon("#d9a55b", { ink: 0.9 });
  for (const z of [-0.05, 0.05]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.13), bread);
    t.position.set(0, 0.16, z);
    t.rotation.y = Math.PI / 2;
    t.userData.home = t.position.clone();
    toaster.add(t);
    toast.push(t);
  }
  toaster.position.copy(TOASTER_AT);
  tagged(toaster, "ground", scene);

  /* ---------- a box marked ADAPTERS in the lane ---------- */
  const adapterBox = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.45), card);
  box.position.y = 0.2;
  const flapL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.02, 0.2), card);
  flapL.position.set(0, 0.42, -0.3); flapL.rotation.x = -0.9;
  const flapR = flapL.clone(); flapR.position.z = 0.3; flapR.rotation.x = 0.9;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.16), toon("#fff", {
    map: canvasTex(256, 80, (g, w, h) => {
      g.fillStyle = "#e9dcc0"; g.fillRect(0, 0, w, h);
      g.fillStyle = P.ink; g.font = "900 50px 'Arial Black', Impact, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.save(); g.translate(w / 2, h / 2 + 2); g.rotate(-0.04); g.fillText("ADAPTERS", 0, 0, w - 16); g.restore();
    }),
    ink: 0.2,
  }));
  label.position.set(0, 0.24, 0.227);
  adapterBox.add(box, flapL, flapR, label);
  adapterBox.position.copy(ADAPTER_BOX_AT);
  tagged(adapterBox, "outdoors", scene);
  phys.box([ADAPTER_BOX_AT.x - 0.28, 0, ADAPTER_BOX_AT.z - 0.23], [ADAPTER_BOX_AT.x + 0.28, 0.4, ADAPTER_BOX_AT.z + 0.23]);

  return { hoard, toaster, toast, adapterBox };
}

/**
 * A newspaper sticks to his shoe and, one sheet at a time, grows into a train behind him
 * (docs/design/gags.md). The sheets follow his recent path like a conga line.
 */
export class PaperTrain {
  private sheets: THREE.Mesh[] = [];
  private trail: THREE.Vector3[] = [];
  private t = -1;
  private lastSample = new THREE.Vector3();
  static readonly GROW = 4.5;

  constructor(private scene: THREE.Scene) {
    const mat = toon("#fff", { map: newsTex, ink: 0.5, side: THREE.DoubleSide });
    for (let i = 0; i < 8; i++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.26), mat);
      s.rotation.x = -Math.PI / 2;
      s.visible = false;
      ensureInkNormals(s);
      scene.add(s);
      this.sheets.push(s);
    }
  }

  get active() { return this.t >= 0; }

  start(at: THREE.Vector3) {
    this.t = 0;
    this.trail = [at.clone()];
    this.lastSample.copy(at);
  }

  /** Returns the sheets' positions when it's time for the kick (then the caller scatters them). */
  update(dt: number, foot: THREE.Vector3, now: number): THREE.Vector3[] | null {
    if (this.t < 0) return null;
    this.t += dt;
    // sample the path every 22 cm
    if (foot.distanceTo(this.lastSample) > 0.22) {
      this.trail.unshift(foot.clone());
      this.lastSample.copy(foot);
      if (this.trail.length > 40) this.trail.pop();
    }
    const n = Math.min(this.sheets.length, 1 + Math.floor(this.t / 0.55));
    this.sheets.forEach((s, i) => {
      const p = this.trail[Math.min(this.trail.length - 1, i * 2)];
      s.visible = i < n && !!p;
      if (!s.visible) return;
      s.position.set(p.x, p.y + 0.012 + i * 0.002, p.z);
      s.rotation.z = Math.sin(now * 3 + i * 1.7) * 0.4 + i * 0.6;
    });
    if (this.t > PaperTrain.GROW) {
      const out = this.sheets.filter((s) => s.visible).map((s) => s.position.clone());
      this.stop();
      return out;
    }
    return null;
  }

  stop() {
    this.t = -1;
    for (const s of this.sheets) s.visible = false;
  }
}

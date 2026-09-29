/**
 * Bill, built from primitives. Ported from docs/design/maquettes/bill-maquette-v0.html,
 * with the v0 findings addressed: more hair over the scalp, a deeper upper-back stoop,
 * and brows lifted clear of the glasses.
 *
 * Units are metres; Bill faces +Z with his feet at the root origin.
 */
import * as THREE from "three/webgpu";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { P } from "../../content/palette";
import { canvasTex, flat, toon, blobTexture } from "../../render/comicMaterial";
import { SecondOrder3, clamp, fract, lerp, smoothstep as sstep, PI, DEG as D } from "../../core/math";

const V3 = THREE.Vector3;
type V = THREE.Vector3;

/* ---------------- textures ---------------- */
const plaidTex = canvasTex(32, 32, (g) => {
  g.fillStyle = P.flRed; g.fillRect(0, 0, 32, 32);
  g.fillStyle = P.flRust; g.fillRect(0, 0, 13, 32); g.fillRect(0, 0, 32, 13);
  g.fillStyle = "#dd8a55"; g.fillRect(0, 0, 13, 13);
  g.fillStyle = P.flLine; g.fillRect(19, 0, 3, 32); g.fillRect(0, 19, 32, 3);
  g.fillStyle = "rgba(58,37,34,.55)"; g.fillRect(27, 0, 1, 32); g.fillRect(0, 27, 32, 1);
  g.fillStyle = "#e6a06d"; g.fillRect(6, 0, 1, 32); g.fillRect(0, 6, 32, 1);
}, { nearest: true, repeat: true });

const hairTex = (band: string) => canvasTex(32, 32, (g) => {
  g.fillStyle = P.hairBase; g.fillRect(0, 0, 32, 32);
  g.fillStyle = band; g.fillRect(2, 6, 3, 16);
  g.fillStyle = P.hairLight; g.fillRect(28, 12, 1, 8);
}, { nearest: true });

const ribTex = canvasTex(8, 4, (g) => {
  g.fillStyle = P.vestRib; g.fillRect(0, 0, 8, 4);
  g.fillStyle = "#211e1c"; g.fillRect(0, 0, 2, 4); g.fillRect(4, 0, 2, 4);
}, { nearest: true, repeat: true });

/** Skin with Ben-Day stubble on the jaw and thin-hair shading over the crown (sphere UVs: u=.25 is the face). */
const headTex = canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = "#d08e6f"; g.fillRect(0, 0, w, h);
  // crown: scalp showing through thin hair, darker toward the sides, with fine strands
  for (let y = 0; y < h * 0.34; y++) {
    const th = (y / h) * PI, dy = Math.cos(th);
    const k = sstep(0.55, 0.95, dy);
    g.fillStyle = `rgba(122,74,52,${0.22 + 0.18 * (1 - k)})`;
    g.fillRect(0, y, w, 1);
  }
  g.strokeStyle = "rgba(74,46,34,.55)"; g.lineWidth = 1.2;
  for (let i = 0; i < 40; i++) {
    const x0 = (i / 40) * w;
    g.beginPath(); g.moveTo(x0, 2); g.quadraticCurveTo(x0 + 10, h * 0.16, x0 + 4, h * 0.3); g.stroke();
  }
  g.fillStyle = P.stubble;
  for (let y = 0; y < h; y += 5.5) {
    for (let x = (Math.round(y / 5.5) % 2) * 3.5; x < w; x += 7) {
      const phi = (x / w) * 2 * PI, th = (y / h) * PI;
      const dx = -Math.cos(phi) * Math.sin(th), dy = Math.cos(th), dz = Math.sin(phi) * Math.sin(th);
      const top = -0.46 + 0.26 * Math.abs(dx), k = sstep(0, 0.1, top - dy) * sstep(-0.3, 0.1, dz);
      if (k > 0.05) { g.beginPath(); g.arc(x, y, 1.7 * k, 0, 7); g.fill(); }
    }
  }
});

/* ---------------- materials ---------------- */
const WARM = { emissive: "#40100c" }; // lifts skin shadows toward bill.skin.shade instead of the mint ambient
export const BILL_MATS = {
  head: toon("#fff", { map: headTex, ...WARM }),
  skin: toon("#d08e6f", WARM),
  hair: toon("#fff", { map: hairTex(P.hairLight) }),
  hairG: toon("#fff", { map: hairTex(P.hairGrey) }),
  hairDark: toon(P.hairBase),
  brow: toon("#3a241b", { ink: 0.55 }),
  glasses: toon(P.glasses),
  glint: flat("#ffffff"),
  eyeW: toon("#fbf7ee"),
  pupil: flat(P.ink),
  mouth: toon("#3a1c17", { ink: 0.6 }),
  mouthIn: toon("#6a2420"),
  tear: toon("#63b4ea"),
  plaid: toon("#fff", { map: plaidTex }),
  vest: toon(P.vest),
  rib: toon("#fff", { map: ribTex }),
  trousers: toon(P.trousers),
  shoes: toon(P.shoes),
  satchel: toon(P.satchel),
  strap: toon(P.strap),
  cable: toon("#55504b"),
  plug: toon("#a39c90"),
  shadow: flat("#2c4543", { map: blobTexture, transparent: true, depthWrite: false, opacity: 0.3 }),
};
const M = BILL_MATS;

/* ---------------- geometry helpers ---------------- */
function smoothSeams(g: THREE.BufferGeometry) {
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal, map = new Map<string, number[]>(), v = new V3();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(4)}|${p.getY(i).toFixed(4)}|${p.getZ(i).toFixed(4)}`;
    let a = map.get(k); if (!a) map.set(k, (a = [])); a.push(i);
  }
  for (const ids of map.values()) if (ids.length > 1) {
    v.set(0, 0, 0);
    for (const i of ids) { v.x += n.getX(i); v.y += n.getY(i); v.z += n.getZ(i); }
    v.normalize();
    for (const i of ids) n.setXYZ(i, v.x, v.y, v.z);
  }
  return g;
}
export function blob(sx: number, sy: number, sz: number, deform?: (v: V) => void, ws = 24, hs = 16) {
  const g = new THREE.SphereGeometry(1, ws, hs), p = g.attributes.position, v = new V3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); if (deform) deform(v); p.setXYZ(i, v.x * sx, v.y * sy, v.z * sz); }
  return smoothSeams(g);
}
/** Capsule along -Y from the joint, tapering r0 -> r1. */
export function limb(len: number, r0: number, r1: number, seg = 18) {
  const pts: THREE.Vector2[] = [], n = 5;
  for (let i = 0; i <= n; i++) { const a = -PI / 2 + (PI / 2) * i / n; pts.push(new THREE.Vector2(Math.cos(a) * r1 + 1e-4, -len + Math.sin(a) * r1)); }
  for (let i = 1; i < 6; i++) { const t = i / 6; pts.push(new THREE.Vector2(lerp(r1, r0, t), -len + len * t)); }
  for (let i = 0; i <= n; i++) { const a = (PI / 2) * i / n; pts.push(new THREE.Vector2(Math.cos(a) * r0 + 1e-4, Math.sin(a) * r0)); }
  return smoothSeams(new THREE.LatheGeometry(pts, seg));
}
function scaleUV(g: THREE.BufferGeometry, su: number, sv: number) {
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return g;
}
function tubeGeo(seg: number, rad: number) {
  const g = new THREE.BufferGeometry(), n = (seg + 1) * (rad + 1), idx: number[] = [], uv: number[] = [];
  for (let i = 0; i <= seg; i++) for (let j = 0; j <= rad; j++) uv.push(j / rad, i / seg);
  for (let i = 0; i < seg; i++) for (let j = 0; j < rad; j++) { const a = i * (rad + 1) + j, b = a + rad + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.userData = { seg, rad }; return g;
}
const _P = new V3(), _T = new V3(), _N = new V3(), _B = new V3(), _O = new V3();
/** Flattened, tapered sweep; `outFn` gives the broad face's normal. */
function setTube(g: THREE.BufferGeometry, pts: V[], rFn: (t: number) => number, flatK: number, outFn: (p: V, t: number, o: V) => void) {
  const curve = new THREE.CatmullRomCurve3(pts), { seg, rad } = g.userData as { seg: number; rad: number };
  const Pp = g.attributes.position, Nn = g.attributes.normal;
  for (let i = 0; i <= seg; i++) {
    const t = i / seg; curve.getPointAt(t, _P); curve.getTangentAt(t, _T); outFn(_P, t, _O);
    _N.copy(_O).addScaledVector(_T, -_O.dot(_T)).normalize(); _B.crossVectors(_T, _N);
    const rw = rFn(t), rn = rw * flatK;
    for (let j = 0; j <= rad; j++) {
      const a = (j / rad) * 2 * PI, c = Math.cos(a), s = Math.sin(a), k = i * (rad + 1) + j;
      Pp.setXYZ(k, _P.x + _N.x * c * rn + _B.x * s * rw, _P.y + _N.y * c * rn + _B.y * s * rw, _P.z + _N.z * c * rn + _B.z * s * rw);
      const mw = Math.max(rw, 1e-3), mn = Math.max(rn, 1e-3);
      const nx = _N.x * c * mw + _B.x * s * mn, ny = _N.y * c * mw + _B.y * s * mn, nz = _N.z * c * mw + _B.z * s * mn, l = Math.hypot(nx, ny, nz);
      Nn.setXYZ(k, nx / l, ny / l, nz / l);
    }
  }
  Pp.needsUpdate = Nn.needsUpdate = true; g.computeBoundingSphere(); return g;
}
function mesh(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, p: number[] = [0, 0, 0], r: number[] = [0, 0, 0], s?: number[]) {
  const m = new THREE.Mesh(geo, mat); m.position.set(p[0], p[1], p[2]); m.rotation.set(r[0], r[1], r[2]);
  if (s) m.scale.set(s[0], s[1], s[2]); parent.add(m); return m;
}
function group(parent: THREE.Object3D, p: number[] = [0, 0, 0], r: number[] = [0, 0, 0]) {
  const g = new THREE.Group(); g.position.set(p[0], p[1], p[2]); g.rotation.set(r[0], r[1], r[2]); parent.add(g); return g;
}

/* ---------------- torso: one revolved, bent shape (upper-back curve baked in) ---------------- */
const BEND = { y0: 0.1, L: 0.38, ang: 20 * D }, SZ = 0.74, TY = 1.08;
function bend(p: V) {
  p.y *= TY; const s = p.y - BEND.y0; if (s <= 0) return p;
  const R = BEND.L / BEND.ang, th = BEND.ang * Math.min(s, BEND.L) / BEND.L, ex = Math.max(0, s - BEND.L);
  const sy = BEND.y0 + R * Math.sin(th) + ex * Math.cos(th), sz = R * (1 - Math.cos(th)) + ex * Math.sin(th), z = p.z;
  p.y = sy - z * Math.sin(th); p.z = sz + z * Math.cos(th); return p;
}
const bendAng = (y: number) => BEND.ang * clamp((y * TY - BEND.y0) / BEND.L, 0, 1);
const PROFILE = [[-0.16, 0.15], [-0.04, 0.157], [0.06, 0.162], [0.18, 0.16], [0.3, 0.155], [0.37, 0.147], [0.415, 0.128], [0.45, 0.092], [0.472, 0.056], [0.487, 0]];
function torsoR(y: number, phi: number) {
  let r = PROFILE[0][1];
  for (let i = 1; i < PROFILE.length; i++) {
    const [y0, r0] = PROFILE[i - 1], [y1, r1] = PROFILE[i];
    if (y <= y1) { const t = clamp((y - y0) / (y1 - y0), 0, 1); r = lerp(r0, r1, t * t * (3 - 2 * t) * 0.5 + t * 0.5); break; }
    r = r1;
  }
  const c = Math.cos(phi);
  return r + 0.1 * Math.exp(-(((y - 0.03) / 0.13) ** 2)) * Math.max(0, c) ** 2 + 0.03 * Math.exp(-(((y - 0.33) / 0.1) ** 2)) * Math.max(0, -c) ** 2;
}
function revolve(rFn: (y: number, phi: number) => number, y0: number, y1: number, ny: number, seg: number, topFn?: (phi: number) => number) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= ny; i++) for (let j = 0; j <= seg; j++) {
    const phi = -PI + 2 * PI * j / seg; let y = lerp(y0, y1, i / ny); if (topFn) y = Math.min(y, topFn(phi));
    const r = rFn(y, phi), p = bend(new V3(Math.sin(phi) * r, y, Math.cos(phi) * r * SZ)); pos.push(p.x, p.y, p.z); uv.push(j / seg, i / ny);
  }
  for (let i = 0; i < ny; i++) for (let j = 0; j < seg; j++) { const a = i * (seg + 1) + j, b = a + seg + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return smoothSeams(g);
}
const onTorsoU = (x: number, y: number, z: number, off: number) => { const phi = Math.atan2(x, z / SZ), r = torsoR(y, phi) + off; return new V3(Math.sin(phi) * r, y, Math.cos(phi) * r * SZ); };
const onTorso = (x: number, y: number, z: number, off: number) => bend(onTorsoU(x, y, z, off));

/* ---------------- head shape ---------------- */
const HS = new V3(0.142, 0.17, 0.152);
function headDeform(v: V) { v.y *= v.y < 0 ? 1.22 : 0.86; const j = clamp(-v.y, 0, 1); v.x *= 1 - 0.22 * j * j; if (v.z > 0) v.z *= 1 + 0.08 * j; if (v.z < 0) v.z *= 1.08; }
const headPt = (dir: V) => { const v = dir.clone().normalize(); headDeform(v); return v.multiply(HS); };
const headGeo = blob(HS.x, HS.y, HS.z, headDeform, 40, 26);
const faceGrid = (() => {
  const m = new THREE.Mesh(headGeo, M.skin), rc = new THREE.Raycaster(), out: number[] = [];
  for (let iy = 0; iy <= 40; iy++) for (let ix = 0; ix <= 30; ix++) {
    rc.set(new V3(-0.15 + ix * 0.01, -0.24 + iy * 0.01, 1), new V3(0, 0, -1)); const h = rc.intersectObject(m)[0]; out.push(h ? h.point.z : 0);
  }
  return out;
})();
function faceZ(x: number, y: number) {
  const fx = clamp((x + 0.15) / 0.01, 0, 29.999), fy = clamp((y + 0.24) / 0.01, 0, 39.999), ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
  const g = (a: number, b: number) => faceGrid[b * 31 + a];
  return lerp(lerp(g(ix, iy), g(ix + 1, iy), tx), lerp(g(ix, iy + 1), g(ix + 1, iy + 1), tx), ty);
}

/* ---------------- pose + expression types ---------------- */
export interface Pose {
  py: number; px: number; roll: number; yaw: number; lean: number; troll: number; tyaw: number; breath: number; neck: number;
  hp: number; hr: number; hy: number; push: number; carry: number; curl: number; nudge: number;
  /** 0..1 right index finger heading for the nose (the nasal audit). */
  nose: number;
  lf: number[]; rf: number[]; lh: number[]; rh: number[]; le: number[]; re: number[];
}
export const basePose = (): Pose => ({
  py: 0, px: 0, roll: 0, yaw: 0, lean: 0, troll: 0, tyaw: 0, breath: 0, neck: 0, hp: 0, hr: 0, hy: 0, push: 0, carry: 0, curl: 0, nudge: 0, nose: 0,
  lf: [0.1, 0, 0.02, 0], rf: [-0.1, 0, 0.02, 0], lh: [0.215, -0.085, 0.085], rh: [-0.215, -0.085, 0.085], le: [0.5, 0.1, -0.7], re: [-0.5, 0.1, -0.7],
});
export function blendPose(a: Pose, b: Pose, w: number): Pose {
  const o = {} as Record<string, unknown>;
  for (const k in b) {
    const av = (a as unknown as Record<string, number | number[]>)[k], bv = (b as unknown as Record<string, number | number[]>)[k];
    o[k] = Array.isArray(bv) ? bv.map((v, i) => lerp((av as number[])[i], v, w)) : lerp(av as number, bv, w);
  }
  return o as unknown as Pose;
}

export type Expression = "deadpan" | "suspicious" | "junklove" | "soupgrief" | "elvis";
type Ex = Record<"bLy" | "bLi" | "bRy" | "bRi" | "drop" | "shift" | "open" | "curl" | "wob" | "slide" | "gtilt" | "chin" | "roll" | "tears" | "spark" | "mw" | "asym", number>;
const EXPR: Record<Expression, Ex> = {
  deadpan: { bLy: 0, bLi: -0.16, bRy: 0, bRi: -0.16, drop: 1, shift: 0, open: 0, curl: 0, wob: 0, slide: 0, gtilt: 0, chin: 0, roll: 0, tears: 0, spark: 0, mw: 1, asym: 0 },
  suspicious: { bLy: 0.02, bLi: 0.12, bRy: -0.01, bRi: -0.34, drop: 0.45, shift: 0.02, open: 0, curl: 0, wob: 0, slide: 0.12, gtilt: -0.07, chin: 0.03, roll: 0.07, tears: 0, spark: 0, mw: 0.78, asym: 0.6 },
  junklove: { bLy: 0.035, bLi: 0.12, bRy: 0.035, bRi: 0.12, drop: -0.3, shift: 0, open: 1, curl: 0, wob: 0, slide: 1, gtilt: 0, chin: -0.07, roll: 0, tears: 0, spark: 1, mw: 1, asym: 0 },
  soupgrief: { bLy: 0.018, bLi: 0.5, bRy: 0.018, bRi: 0.5, drop: 1.5, shift: 0, open: 0, curl: 0, wob: 1, slide: 0, gtilt: 0, chin: 0.1, roll: -0.03, tears: 1, spark: 0, mw: 0.9, asym: 0 },
  elvis: { bLy: 0.03, bLi: 0.05, bRy: -0.008, bRi: -0.22, drop: 0.2, shift: -0.006, open: 0, curl: 1, wob: 0, slide: 0, gtilt: 0.03, chin: -0.15, roll: -0.06, tears: 0, spark: 0, mw: 1, asym: 0 },
};

interface Arm { sh: THREE.Group; el: THREE.Group; wr: THREE.Group; hand: THREE.Group; mitt: THREE.Mesh; s: number }
interface Leg { hip: THREE.Group; knee: THREE.Group; ankle: THREE.Group; s: number }
interface Spring { pivot: THREE.Object3D; dir: V; len: number; g: number; max: number; sod: SecondOrder3 }

export const PELVIS_Y = 0.79;
const THIGH = 0.33, SHIN = 0.335, ANK = 0.085, NECK0 = 0.36, HEAD0 = -0.46, PUSH_BEND = -1.25;
const EYE_Y = 0.022, MOUTH_Y = -0.118, BROW_Y = 0.068;

/* ---------------- the rig ---------------- */
export class BillRig {
  readonly root = new THREE.Group();
  /** Scales for squash & stretch (applied around the feet). */
  readonly squash = new THREE.Group();
  readonly pelvis: THREE.Group;
  readonly torso: THREE.Group;
  /** Attach point for a heavy item held against the belly. */
  readonly carry: THREE.Group;
  /** Satchel body (scale it to bulge). */
  readonly bag: THREE.Group;
  readonly bagPivot: THREE.Group;
  readonly head: THREE.Group;
  /** Carried item half-width for the hand grip. */
  gripHalf = 0.158;
  private body: THREE.Group;
  private neck: THREE.Group;
  private hc: THREE.Group;
  private arms: { L: Arm; R: Arm };
  private legs: { L: Leg; R: Leg };
  private brows: THREE.Group[];
  private glasses: THREE.Group;
  private G0: V;
  private glints: THREE.Mesh[] = [];
  private eyes: THREE.Group;
  private lip: THREE.Mesh;
  private tooth: THREE.Mesh;
  private mouthGeo: THREE.BufferGeometry;
  private mouthO: THREE.Mesh;
  private tears: THREE.Mesh[];
  private springs: Spring[] = [];
  private ex: Ex = { ...EXPR.deadpan };
  expression: Expression = "deadpan";
  /** 0..1: a gust of wind lifting the hair straight up. */
  hairLift = 0;
  private splatMesh: THREE.Mesh;

  constructor() {
    this.root.add(this.squash);
    const bill = group(this.squash);
    const pelvis = (this.pelvis = group(bill, [0, PELVIS_Y, 0]));
    mesh(pelvis, blob(0.162, 0.12, 0.125), M.trousers, [0, -0.02, 0]);
    const torso = (this.torso = group(pelvis, [0, 0.02, 0]));
    const body = (this.body = group(torso));
    const vestTop = (phi: number) => { const a = Math.abs(phi), Vv = Math.max(0, 1 - a / 0.6), A = Math.exp(-(((a - 1.57) / 0.42) ** 2)); return 0.475 - 0.2 * Vv ** 1.15 - 0.105 * A; };
    mesh(body, scaleUV(revolve(torsoR, -0.13, 0.487, 32, 48), 12, 7), M.plaid);
    mesh(body, revolve((y, p) => torsoR(y, p) + 0.013, -0.115, 0.49, 32, 48, vestTop), M.vest);
    mesh(body, scaleUV(revolve((y, p) => torsoR(y, p) + 0.021, -0.15, -0.085, 3, 48), 26, 1), M.rib);
    { // collar ring + wings
      mesh(body, smoothSeams(new THREE.LatheGeometry([[0.07, 0], [0.079, 0.003], [0.071, 0.04], [0.064, 0.037], [0.07, 0]].map(([r, y]) => new THREE.Vector2(r, y)), 28)), M.plaid, bend(new V3(0, 0.43, 0)).toArray(), [bendAng(0.43) + 0.3, 0, 0]);
      for (const s of [1, -1]) {
        const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0.05 * s, -0.004); sh.quadraticCurveTo(0.052 * s, -0.012, 0.042 * s, -0.024); sh.lineTo(0.022 * s, -0.066); sh.quadraticCurveTo(0.016 * s, -0.072, 0.012 * s, -0.064); sh.lineTo(0, 0);
        const g = scaleUV(new THREE.ExtrudeGeometry(sh, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 4 }), 14, 14);
        mesh(body, g, M.plaid, onTorso(0.03 * s, 0.455, 0.2, 0.012).toArray(), [bendAng(0.44) - 0.62, 0.3 * s, 0]);
      }
    }
    { // satchel strap over the right shoulder to the left hip
      const ctrl = [[-0.11, 0.458, 0.0], [-0.075, 0.405, 0.1], [0, 0.27, 0.15], [0.085, 0.12, 0.17], [0.16, 0.0, 0.1], [0.19, -0.07, 0.0], [0.155, 0.03, -0.1], [0.065, 0.2, -0.12], [-0.045, 0.36, -0.11]];
      const pts = ctrl.map(([x, y, z]) => onTorsoU(x, y, z, 0.024));
      const loop = new THREE.CatmullRomCurve3(pts, true).getSpacedPoints(64).map((p) => onTorso(p.x, p.y, p.z, 0.024));
      mesh(body, setTube(tubeGeo(64, 6), loop, () => 0.021, 0.28, (p, _t, o) => o.set(p.x, 0, p.z).normalize()), M.strap);
    }
    const makeArm = (s: number): Arm => {
      const sh = group(torso, bend(new V3(0.168 * s, 0.4, -0.01)).toArray());
      mesh(sh, scaleUV(limb(0.245, 0.057, 0.047), 4, 4), M.plaid);
      const el = group(sh, [0, -0.245, 0]); mesh(el, scaleUV(limb(0.225, 0.047, 0.043), 4, 4), M.plaid);
      mesh(el, new THREE.TorusGeometry(0.046, 0.013, 8, 20), M.plaid, [0, -0.2, 0], [PI / 2, 0, 0], [1, 1, 1.7]);
      const wr = group(el, [0, -0.23, 0]); const hand = group(wr);
      const mitt = mesh(hand, blob(0.031, 0.072, 0.052, (v) => { if (v.y < 0) v.z *= 1 - 0.15 * v.y * v.y; }), M.skin, [0, -0.075, 0.004]);
      mesh(hand, limb(0.052, 0.017, 0.015), M.skin, [-0.012 * s, -0.035, 0.042], [-1.0, 0, 0.25 * s]);
      mesh(hand, limb(0.075, 0.0145, 0.013), M.skin, [0.002 * s, -0.08, 0.041]);
      return { sh, el, wr, hand, mitt, s };
    };
    this.arms = { L: makeArm(1), R: makeArm(-1) };
    const shoeGeo = blob(0.064, 0.055, 0.158, (v) => { if (v.y < -0.45) v.y = -0.45 + (v.y + 0.45) * 0.1; if (v.z < 0) v.x *= 1 - 0.18 * v.z * v.z; if (v.z > 0.3) v.y *= 1 - 0.25 * (v.z - 0.3); });
    const makeLeg = (s: number): Leg => {
      const hip = group(pelvis, [0.09 * s, -0.035, 0]); mesh(hip, limb(THIGH, 0.09, 0.068), M.trousers);
      const knee = group(hip, [0, -THIGH, 0]); mesh(knee, limb(SHIN, 0.066, 0.074), M.trousers);
      mesh(knee, new THREE.TorusGeometry(0.07, 0.012, 6, 18), M.trousers, [0, -SHIN + 0.05, 0], [PI / 2, 0, 0]); // trouser cuff
      const ankle = group(knee, [0, -SHIN, 0]); mesh(ankle, shoeGeo, M.shoes, [0, -0.06, 0.055]);
      mesh(ankle, new THREE.TorusGeometry(0.045, 0.007, 6, 16, PI), M.brow, [0, -0.03, 0.12], [-1.15, 0, 0]);
      return { hip, knee, ankle, s };
    };
    this.legs = { L: makeLeg(1), R: makeLeg(-1) };

    // satchel on the left hip, on a spring
    const bagPivot = (this.bagPivot = group(pelvis, [0.205, -0.055, -0.035]));
    const bag = (this.bag = group(bagPivot, [0, 0, 0], [0, -0.25, 0]));
    mesh(bag, new RoundedBoxGeometry(0.07, 0.2, 0.26, 4, 0.032), M.satchel, [0.02, -0.115, 0]);
    mesh(bag, new RoundedBoxGeometry(0.02, 0.115, 0.266, 3, 0.009), M.satchel, [0.055, -0.058, 0]);
    mesh(bag, new RoundedBoxGeometry(0.012, 0.064, 0.028, 2, 0.004), M.strap, [0.067, -0.094, 0]);
    const cable = mesh(bag, limb(0.085, 0.008, 0.008), M.cable, [0.02, -0.03, -0.085], [PI + 0.55, 0, -0.25]);
    mesh(cable, limb(0.032, 0.015, 0.015), M.plug, [0, -0.085, 0]);

    this.carry = group(pelvis, [0, 0.11, 0.31]);

    // neck + head
    const neck = (this.neck = group(torso, bend(new V3(0, 0.455, 0)).toArray()));
    mesh(neck, limb(0.085, 0.05, 0.054), M.skin, [0, 0.085, 0]);
    const head = (this.head = group(neck, [0, 0.085, 0]));
    const hc = (this.hc = group(head, [0, 0.155, 0.03])); hc.scale.setScalar(1.06);
    mesh(hc, headGeo, M.head);
    mesh(hc, blob(0.028, 0.042, 0.03, (v) => { if (v.y > 0) { const k = 1 - 0.5 * v.y; v.x *= k; v.z *= k; } else { v.x *= 1.15; v.z *= 1.1; } }), M.skin, [0, -0.042, faceZ(0, -0.042) + 0.006], [-0.2, 0, 0]);
    this.lip = mesh(hc, blob(0.021, 0.0085, 0.01), M.skin, [0, MOUTH_Y - 0.011, faceZ(0, MOUTH_Y - 0.011) + 0.002]);
    this.tooth = mesh(hc, blob(0.0085, 0.006, 0.004), M.eyeW, [-0.024, MOUTH_Y + 0.001, faceZ(-0.024, MOUTH_Y + 0.001) + 0.0015]);
    this.eyes = group(hc);
    for (const s of [1, -1]) {
      const e = mesh(this.eyes, blob(0.016, 0.013, 0.008), M.eyeW, [0.052 * s, EYE_Y + 0.004, faceZ(0.052 * s, EYE_Y) + 0.001]);
      mesh(e, blob(0.0068, 0.0082, 0.004), M.pupil, [-0.003 * s, 0.002, 0.0065]);
    }
    this.brows = [1, -1].map((s) => {
      const g = group(hc, [0.055 * s, BROW_Y, faceZ(0.055 * s, BROW_Y) + 0.014], [0, 0.3 * s, 0]);
      const pts = [-0.036, -0.012, 0.014, 0.04].map((x, i) => new V3(x * s, [0, 0.006, 0.006, -0.002][i], [0.002, 0.004, 0.002, -0.006][i]));
      mesh(g, setTube(tubeGeo(12, 8), pts, (t) => 0.0115 * (1 - 0.6 * t) * (t < 0.12 ? 0.75 + 2 * t : 1), 0.7, (_p, _t, o) => o.set(0, 0, 1)), M.brow);
      g.userData.s = s; return g;
    });
    const glasses = (this.glasses = group(hc, [0, EYE_Y, faceZ(0, EYE_Y) + 0.016]));
    this.G0 = glasses.position.clone();
    const lensGeo = (s: number) => {
      const sh = new THREE.Shape(), m = (x: number, y: number): [number, number] => [x * s, y];
      sh.moveTo(...m(-0.041, 0.027)); sh.lineTo(...m(0.04, 0.031)); sh.quadraticCurveTo(...m(0.051, 0.032), ...m(0.05, 0.02));
      sh.quadraticCurveTo(...m(0.047, -0.022), ...m(0.017, -0.027)); sh.quadraticCurveTo(...m(-0.022, -0.03), ...m(-0.038, -0.017));
      sh.quadraticCurveTo(...m(-0.047, -0.005), ...m(-0.046, 0.016)); sh.quadraticCurveTo(...m(-0.046, 0.027), ...m(-0.041, 0.027));
      return new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 2, curveSegments: 6 }).translate(0, 0, -0.012);
    };
    for (const s of [1, -1]) {
      const lz = faceZ(0.056 * s, EYE_Y) + 0.02 - this.G0.z;
      const lens = mesh(glasses, lensGeo(s), M.glasses, [0.057 * s, 0, lz], [0, 0.24 * s, 0]);
      const gl = mesh(lens, new THREE.CircleGeometry(0.0078, 12), M.glint, [-0.022, 0.014, 0.0012]);
      mesh(gl, new THREE.CircleGeometry(0.0034, 8), M.glint, [0.014, -0.008, 0]);
      this.glints.push(gl);
      const arm = [new V3(0.1 * s, 0.026, lz - 0.02), ...[66, 84, 102].map((a) => headPt(new V3(Math.sin(a * D) * s, 0.3, Math.cos(a * D))).multiplyScalar(1.03).sub(this.G0))];
      mesh(glasses, setTube(tubeGeo(10, 5), arm, () => 0.0036, 1, (_p, _t, o) => o.set(0, 1, 0)), M.glasses);
    }
    mesh(glasses, limb(0.026, 0.0065, 0.0065), M.glasses, [0.013, 0.016, 0.006], [0, 0, PI / 2]);
    this.mouthGeo = tubeGeo(14, 6); this.mouthGeo.userData.dynamic = true; mesh(hc, this.mouthGeo, M.mouth);
    this.mouthO = mesh(hc, blob(0.021, 0.025, 0.012), M.mouthIn, [0, MOUTH_Y - 0.004, faceZ(0, MOUTH_Y) - 0.002]);
    this.tears = [0, 1, 2, 3].map(() => mesh(hc, blob(0.008, 0.012, 0.006, (v) => { if (v.y > 0) { v.x *= 1 - 0.75 * v.y; v.z *= 1 - 0.75 * v.y; } }), M.tear));

    // hair: 11 tapered clumps on springs, a trimmed cap, and comb-over strands
    const HAIR: [number, number, number, number, number][] = [[80, .66, .5, .044, 0], [-80, .66, .49, .044, 0], [97, .74, .55, .054, 0], [-97, .74, .56, .054, 1], [116, .8, .54, .058, 0], [-116, .8, .53, .058, 0],
      [136, .83, .5, .06, 1], [-136, .83, .52, .06, 0], [158, .85, .46, .062, 0], [-158, .85, .47, .062, 0], [180, .86, .44, .064, 0]];
    const clumps = HAIR.map(([az, el, len, w, grey], i) => {
      const a = az * D, dirH = new V3(Math.sin(a), 0, Math.cos(a));
      const root = headPt(new V3(dirH.x * Math.sqrt(1 - el * el), el, dirH.z * Math.sqrt(1 - el * el))).multiplyScalar(0.95);
      const eq = headPt(dirH.clone().setY(-0.05)), req = Math.hypot(eq.x, eq.z), back = Math.abs(az) > 140 ? 0.03 : 0, wig = (i % 3 - 1) * 0.012;
      const at = (d: number, y: number, side = 0) => dirH.clone().multiplyScalar(d).add(new V3(-dirH.z * side, y, dirH.x * side));
      const pts = [root, root.clone().addScaledVector(dirH, 0.04).add(new V3(0, 0.002, 0)), at(req + 0.036, 0.01), at(req + 0.044 + back, -0.16, wig),
        at(req + 0.05 + back * 1.5, root.y - len * 0.76, -wig), at(req + 0.072 + back * 2, root.y - len, wig * 0.6)].map((p) => p.sub(root));
      const pivot = group(hc, root.toArray()), g = tubeGeo(22, 8), side = new V3(-dirH.z, 0, dirH.x);
      setTube(g, pts, (t) => w * (1 - t ** 2.2) * (0.8 + 0.8 * t * (1 - t)), 0.4, (_p, _t, o) => o.crossVectors(side, _T));
      mesh(pivot, g, grey ? M.hairG : M.hair);
      return { pivot, dir: pts[pts.length - 1].clone().normalize(), len: pts[pts.length - 1].length() };
    });
    { // hair cap: the head shell trimmed to the horseshoe of remaining hair (raised to cover more of the crown sides)
      const g = headGeo.clone(), uv = g.attributes.uv, keep: number[] = [], idx = g.index!.array, line = (az: number) => lerp(0.76, 0.93, sstep(60, 175, az));
      const inCap = (i: number) => {
        const ph = uv.getX(i) * 2 * PI, th = (1 - uv.getY(i)) * PI, x = -Math.cos(ph) * Math.sin(th), y = Math.cos(th), z = Math.sin(ph) * Math.sin(th), az = Math.abs(Math.atan2(x, z)) / D;
        return az > 62 && y < line(az) && y > -0.42 + 0.2 * sstep(90, 160, az);
      };
      for (let i = 0; i < idx.length; i += 3) if (inCap(idx[i]) && inCap(idx[i + 1]) && inCap(idx[i + 2])) keep.push(idx[i], idx[i + 1], idx[i + 2]);
      g.setIndex(keep); mesh(hc, g, M.hairDark, [0, 0, -0.002], [0, 0, 0], [1.03, 1.02, 1.03]);
    }
    const strands: [number, number, number, number][] = [[-0.3, 0.005, -72, 66], [-0.18, 0.0055, -70, 62], [-0.06, 0.005, -68, 60], [0.06, 0.005, -66, 58], [0.18, 0.0048, -62, 48], [0.3, 0.0042, -58, 38]];
    for (const [zo, w, a0, a1] of strands) {
      const pts: V[] = [];
      for (let k = 0; k <= 6; k++) { const th = lerp(a0, a1, k / 6) * D; pts.push(headPt(new V3(Math.sin(th), Math.cos(th), zo + 0.06 * Math.sin(k * 0.9 + zo * 9))).multiplyScalar(1.008)); }
      mesh(hc, setTube(tubeGeo(24, 6), pts, (t) => w * (0.5 + 0.6 * Math.sin(PI * t)), 0.5, (p, _t, o) => o.copy(p).normalize()), M.hair);
    }

    // bird poop, for when the gag clock needs it
    this.splatMesh = mesh(hc, blob(0.07, 0.035, 0.06, (v) => { if (v.y < 0) v.y *= 0.3; if (v.x > 0.4) v.y -= 0.4 * (v.x - 0.4); }), toon("#f4f1e8", { ink: 0.7 }), [0.03, 0.17, 0.02], [0.2, 0.3, -0.15]);
    this.splatMesh.visible = false;

    // contact shadow
    const shadow = mesh(this.root, new THREE.PlaneGeometry(0.8, 0.8), M.shadow, [0, 0.006, 0.03], [-PI / 2, 0, 0]);
    shadow.renderOrder = -1;

    // springs
    const DOWN = new V3(0, -1, 0);
    this.springs = [
      ...clumps.map((c, i) => ({ ...c, g: 0.42, max: 0.55, sod: new SecondOrder3(2.2 + (i % 4) * 0.25, 0.25) })),
      { pivot: bagPivot, dir: DOWN.clone(), len: 0.2, g: 1, max: 0.6, sod: new SecondOrder3(3, 0.3) },
    ];
    this.root.traverse((o) => { o.frustumCulled = false; });
  }

  setSpringTuning(hairHz: number, hairDamping: number) {
    this.springs.forEach((s, i) => { if (s.pivot !== this.bagPivot) s.sod = new SecondOrder3(hairHz + (i % 4) * 0.25, hairDamping); });
  }

  /** Apply a pose, solve IK, update expression and springs. `t` drives expression wobble. */
  update(p: Pose, dt: number, t: number) {
    const { pelvis, torso, body, neck, head } = this;
    pelvis.position.set(p.px, PELVIS_Y + p.py, 0);
    pelvis.rotation.set(0, p.yaw, p.roll);
    torso.rotation.set(p.lean, p.tyaw, p.troll);
    body.scale.set(1 + 0.008 * p.breath, 1 + 0.004 * p.breath, 1 + 0.014 * p.breath);
    neck.rotation.x = bendAng(0.455) + NECK0 + p.neck;
    head.rotation.set(HEAD0 + p.hp + this.ex.chin, p.hy, p.hr + this.ex.roll);
    this.carry.rotation.x = -p.lean * 0.5;
    this.root.updateMatrixWorld(true);

    const bill = this.squash;
    for (const [k, leg] of [["lf", this.legs.L], ["rf", this.legs.R]] as const) {
      const f = p[k];
      bill.localToWorld(_t0.set(f[0], ANK + f[1], f[2]));
      leg.hip.getWorldPosition(_p0);
      _p0.add(_up.set(0, 0.2, 1).applyQuaternion(this.root.quaternion));
      ik(leg.hip, leg.knee, leg.ankle, _t0, _p0, 1);
      _Q.setFromEuler(_E.set(f[3], 0.1 * leg.s, 0));
      leg.knee.getWorldQuaternion(_pq);
      this.root.getWorldQuaternion(_rq);
      leg.ankle.quaternion.copy(_pq.invert().multiply(_rq).multiply(_Q));
    }
    this.root.updateMatrixWorld(true);
    for (const [k, e, arm] of [["lh", "le", this.arms.L], ["rh", "re", this.arms.R]] as const) {
      torso.localToWorld(_t0.set(p[k][0], p[k][1], p[k][2]));
      if (p.carry > 0.01) _t0.lerp(this.carry.localToWorld(_c0.set(this.gripHalf * arm.s, 0.035, 0.02)), p.carry);
      const pushing = arm.s < 0 && p.push > 0.001;
      if (pushing) _t0.lerp(this.hc.localToWorld(_c0.set(-0.004, -0.045, this.G0.z + 0.125)), p.push);
      if (arm.s < 0 && p.nose > 0.001) _t0.lerp(this.hc.localToWorld(_c0.set(0.004, -0.06, faceZ(0, -0.06) + 0.1)), p.nose);
      const pe = p[e];
      torso.localToWorld(_p0.set(...(pushing ? [lerp(pe[0], -0.6, p.push), lerp(pe[1], -0.6, p.push), lerp(pe[2], 0.3, p.push)] as [number, number, number] : [pe[0], pe[1], pe[2]] as [number, number, number])));
      ik(arm.sh, arm.el, arm.wr, _t0, _p0, -1);
      arm.hand.rotation.set(p.carry * -0.3 + (arm.s < 0 ? PUSH_BEND * p.push : 0), p.carry * 0.9 * arm.s, 0);
      const c = arm.s < 0 ? Math.max(p.curl, p.nose) : 0; arm.mitt.scale.set(1, 1 - 0.35 * c, 1 + 0.1 * c); arm.mitt.position.y = -0.075 + 0.025 * c;
    }
    // expression blend (~50 ms time constant)
    const target = EXPR[this.expression], k = 1 - Math.exp(-dt / 0.05);
    for (const n in this.ex) (this.ex as Record<string, number>)[n] += ((target as Record<string, number>)[n] - (this.ex as Record<string, number>)[n]) * k;
    this.applyExpr(t, p.nudge);
    this.root.updateMatrixWorld(true);
    this.updateSprings(dt);
  }

  private applyExpr(t: number, nudge: number) {
    const ex = this.ex;
    for (const b of this.brows) { const s = b.userData.s as number, L = s > 0; b.position.y = BROW_Y + (L ? ex.bLy : ex.bRy); b.rotation.z = -s * (L ? ex.bLi : ex.bRi); }
    const pts: V[] = [], hw = 0.037 * ex.mw * (1 - 0.8 * ex.open);
    for (let i = 0; i < 7; i++) {
      const u = (i / 6) * 2 - 1, x = u * hw + ex.shift;
      const y = MOUTH_Y - ex.drop * 0.017 * u * u + ex.asym * 0.008 * u + ex.curl * 0.032 * Math.max(0, -u) ** 1.5 + ex.wob * 0.004 * Math.sin(u * 8 + t * 19) * (1 - u * u * 0.5);
      pts.push(new V3(x, y, faceZ(x, y) + 0.002));
    }
    setTube(this.mouthGeo, pts, (k) => 0.0055 * (0.55 + 0.45 * Math.sin(PI * k)), 0.8, (_p, _k, o) => o.set(0, 0, 1));
    this.tooth.visible = ex.curl > 0.05; this.tooth.scale.setScalar(Math.max(0.01, ex.curl));
    this.mouthO.visible = ex.open > 0.03; this.mouthO.scale.setScalar(Math.max(0.01, ex.open));
    this.lip.scale.setScalar(Math.max(0.01, 1 - ex.open));
    this.lip.position.set(ex.shift, MOUTH_Y - 0.011 - 0.012 * Math.max(0, ex.drop - 1), this.lip.position.z);
    this.glasses.position.set(this.G0.x, this.G0.y - 0.044 * ex.slide + 0.007 * nudge, this.G0.z + 0.011 * ex.slide);
    this.glasses.rotation.set(0.22 * ex.slide, 0, ex.gtilt);
    this.eyes.visible = ex.slide > 0.18; this.eyes.scale.setScalar(sstep(0.18, 0.6, ex.slide));
    this.glints.forEach((g) => g.scale.setScalar(1 + 0.9 * ex.spark * (0.8 + 0.2 * Math.sin(t * 9))));
    this.tears.forEach((m, i) => {
      const s = i % 2 ? -1 : 1, k = fract(t * 0.7 + i * 0.27), x = s * (0.075 + 0.01 * k), y = -0.01 - 0.14 * k;
      m.visible = ex.tears > 0.05; m.position.set(x, y, faceZ(x, y) + 0.006); m.scale.setScalar(ex.tears * sstep(0, 0.12, k) * (1 - sstep(0.85, 1, k)));
    });
  }

  private updateSprings(dt: number) {
    const DOWN = _down.set(0, -1, 0);
    for (const s of this.springs) {
      s.pivot.parent!.getWorldQuaternion(_pq); s.pivot.getWorldPosition(_R);
      _X.copy(s.dir).applyQuaternion(_pq).lerp(DOWN, s.g);
      if (this.hairLift > 0 && s.pivot !== this.bagPivot) _X.lerp(_up.set(0.15, 1, -0.2), this.hairLift);
      _X.normalize().multiplyScalar(s.len).add(_R);
      const y = dt > 0 ? s.sod.step(dt, _X) : s.sod.reset(_X);
      const d = _D.copy(y).sub(_R).normalize().applyQuaternion(_pq.invert());
      _q.setFromUnitVectors(s.dir, d); const ang = 2 * Math.acos(clamp(Math.abs(_q.w), 0, 1));
      if (ang > s.max) _q.slerpQuaternions(_q0, _q, s.max / ang);
      s.pivot.quaternion.copy(_q);
    }
  }

  setSplat(on: boolean) {
    this.splatMesh.visible = on;
  }

  /** World position of the top of his head (for stars and splats). */
  crown(out: V) {
    return this.hc.localToWorld(out.set(0, 0.2, 0));
  }

  /** World position of the satchel opening (where picked-up items fly to). */
  satchelMouth(out: V) {
    return this.bag.localToWorld(out.set(0.02, 0.0, 0));
  }
}

/* ---------------- IK (two-bone, with a pole) ---------------- */
const _A = new V3(), _d = new V3(), _pl = new V3(), _n = new V3(), _e = new V3(), _Ev = new V3(), _Tg = new V3(), _f = new V3(), _y = new V3(), _z = new V3(), _x = new V3(), _m = new THREE.Matrix4();
const _q = new THREE.Quaternion(), _pq = new THREE.Quaternion(), _rq = new THREE.Quaternion(), _q0 = new THREE.Quaternion(), _Q = new THREE.Quaternion(), _E = new THREE.Euler();
const _t0 = new V3(), _p0 = new V3(), _c0 = new V3(), _up = new V3(), _R = new V3(), _X = new V3(), _D = new V3(), _down = new V3();
function aim(bone: THREE.Object3D, dir: V, ref: V, sign: number) {
  _y.copy(dir).negate(); _z.copy(ref).addScaledVector(dir, -ref.dot(dir)).normalize().multiplyScalar(sign); _x.crossVectors(_y, _z);
  _q.setFromRotationMatrix(_m.makeBasis(_x, _y, _z)); bone.parent!.getWorldQuaternion(_pq); bone.quaternion.copy(_pq.invert().multiply(_q)); bone.updateMatrixWorld(true);
}
function ik(up: THREE.Object3D, low: THREE.Object3D, end: THREE.Object3D, T: V, Pp: V, sign: number) {
  up.getWorldPosition(_A); const l1 = low.position.length(), l2 = end.position.length();
  _d.subVectors(T, _A); const dist = clamp(_d.length(), 0.02, (l1 + l2) * 0.999); _d.normalize();
  const ang = Math.acos(clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1));
  _pl.subVectors(Pp, _A); _n.crossVectors(_d, _pl).normalize(); _e.copy(_d).applyAxisAngle(_n, ang);
  aim(up, _e, _pl, sign); _Ev.copy(_A).addScaledVector(_e, l1); _Tg.copy(_A).addScaledVector(_d, dist); _f.subVectors(_Tg, _Ev).normalize(); aim(low, _f, _pl, sign);
}

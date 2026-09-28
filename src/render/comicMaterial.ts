import * as THREE from "three/webgpu";

/**
 * The comic material: MeshToonNodeMaterial on a hard 3-step ramp (core shadow | shade | lit).
 * Shadow tint comes from the zone's ambient light colour, so shadows are tinted, never grey.
 * `ink` scales the outline weight for this material (1 = character weight).
 */
const gradientMap = (() => {
  const v = [0, 36, 36, 36, 255, 255, 255, 255];
  const d = new Uint8Array(v.length * 4);
  v.forEach((x, i) => d.set([x, x, x, 255], i * 4));
  const t = new THREE.DataTexture(d, v.length, 1);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
})();

export interface ComicOpts {
  map?: THREE.Texture;
  emissive?: THREE.ColorRepresentation;
  ink?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
}

const cache = new Map<string, THREE.MeshToonNodeMaterial>();

export function toon(color: THREE.ColorRepresentation, opts: ComicOpts = {}) {
  const m = new THREE.MeshToonNodeMaterial({ color, gradientMap });
  if (opts.map) m.map = opts.map;
  if (opts.emissive !== undefined) m.emissive = new THREE.Color(opts.emissive);
  if (opts.transparent) m.transparent = true;
  if (opts.opacity !== undefined) m.opacity = opts.opacity;
  if (opts.side !== undefined) m.side = opts.side;
  m.userData.ink = opts.ink ?? 1;
  return m;
}

/** Shared toon material per colour + ink weight (environment pieces reuse these so they batch). */
export function toonShared(color: string, ink = 0.75) {
  const k = `${color}|${ink}`;
  let m = cache.get(k);
  if (!m) cache.set(k, (m = toon(color, { ink })));
  return m;
}

/** Unlit, never outlined (glints, pupils, blob shadows, LEDs). */
export function flat(color: THREE.ColorRepresentation, opts: { map?: THREE.Texture; transparent?: boolean; opacity?: number; depthWrite?: boolean } = {}) {
  const m = new THREE.MeshBasicNodeMaterial({ color });
  if (opts.map) m.map = opts.map;
  if (opts.transparent) m.transparent = true;
  if (opts.opacity !== undefined) m.opacity = opts.opacity;
  if (opts.depthWrite !== undefined) m.depthWrite = opts.depthWrite;
  return m;
}

/** Canvas-drawn texture helper. */
export function canvasTex(
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
  o: { nearest?: boolean; repeat?: boolean } = {},
) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (o.nearest) {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
  }
  if (o.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Soft round blob used for cheap contact shadows. */
export const blobTexture = canvasTex(128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.55, "rgba(255,255,255,.75)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
});

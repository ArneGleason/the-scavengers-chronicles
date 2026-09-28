import * as THREE from "three/webgpu";

/**
 * The ink pass extrudes a back-face hull along each vertex's `inkNormal`. Smooth meshes
 * share their shading normal; hard-edged meshes (boxes, walls) get normals averaged across
 * coincident vertices so the hull stays closed at corners instead of cracking open.
 */
export function ensureInkNormals(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.geometry) return;
    addInkNormal(m.geometry);
  });
}

export function addInkNormal(g: THREE.BufferGeometry) {
  if (g.getAttribute("inkNormal")) return g;
  const n = g.getAttribute("normal") as THREE.BufferAttribute | undefined;
  if (!n) return g;
  if (g.userData.dynamic) {
    g.setAttribute("inkNormal", n); // shared reference: stays in sync when the mesh deforms
    return g;
  }
  const p = g.getAttribute("position");
  const out = new Float32Array(n.count * 3);
  const map = new Map<string, number[]>();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(3)}|${p.getY(i).toFixed(3)}|${p.getZ(i).toFixed(3)}`;
    let a = map.get(k);
    if (!a) map.set(k, (a = []));
    a.push(i);
  }
  for (const ids of map.values()) {
    let x = 0, y = 0, z = 0;
    for (const i of ids) { x += n.getX(i); y += n.getY(i); z += n.getZ(i); }
    const l = Math.hypot(x, y, z) || 1;
    for (const i of ids) { out[i * 3] = x / l; out[i * 3 + 1] = y / l; out[i * 3 + 2] = z / l; }
  }
  g.setAttribute("inkNormal", new THREE.BufferAttribute(out, 3));
  return g;
}

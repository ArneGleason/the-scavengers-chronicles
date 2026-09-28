import * as THREE from "three/webgpu";
import { toonOutlinePass, uniform, vec4, color, max, length, positionLocal, attribute, modelViewMatrix, cameraProjectionMatrix, transformNormalToView } from "three/tsl";
import { P } from "../content/palette";

export type Tier = "high" | "medium" | "low";

export interface Gfx {
  renderer: THREE.WebGPURenderer;
  pipeline: THREE.RenderPipeline;
  backend: "WebGPU" | "WebGL2";
  tier: Tier;
  /** Ink line width in device px (set per frame). */
  inkPx: { value: number };
  /** Draw calls in the last frame (scene + ink hulls + post). */
  drawCalls: number;
  resize(): void;
  render(): void;
}

/**
 * Renderer + comic post pipeline. Ink is three's toonOutlinePass with its hull material
 * swapped for one that extrudes a fixed number of *pixels* along the projected `inkNormal`
 * (see render/ink.ts), so line weight is even at any aspect ratio and zoom and hard-edged
 * boxes keep closed corners. The stock hull extrudes in clip space along shading normals.
 */
export async function createGfx(canvas: HTMLCanvasElement, scene: THREE.Scene, camera: THREE.Camera): Promise<Gfx> {
  const forceWebGL = new URLSearchParams(location.search).has("webgl");
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: true, forceWebGL });
  await renderer.init();
  const backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? "WebGPU" : "WebGL2";

  const mobile = matchMedia("(pointer: coarse)").matches;
  const tier: Tier = mobile ? "low" : backend === "WebGPU" ? "high" : "medium";
  const maxDpr = tier === "high" ? 2 : tier === "medium" ? 1.5 : 1.25;
  renderer.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
  renderer.setClearColor(0x000000, 0); // the page's paper colour shows through
  renderer.info.autoReset = false;

  const inkPx = uniform(1.6);
  const halfRes = uniform(new THREE.Vector2(1, 1));
  const outline = toonOutlinePass(scene, camera, new THREE.Color(P.ink), 0.003, 1);
  const inkCache = new WeakMap<THREE.Material, THREE.NodeMaterial>();
  (outline as unknown as { _getOutlineMaterial: (m: THREE.Material) => THREE.NodeMaterial })._getOutlineMaterial = (src) => {
    let m = inkCache.get(src);
    if (m) return m;
    m = new THREE.NodeMaterial();
    m.side = THREE.BackSide;
    m.name = "ink";
    const weight = (src.userData.ink as number | undefined) ?? 1;
    const pos = cameraProjectionMatrix.mul(modelViewMatrix).mul(vec4(positionLocal, 1));
    const nPx = cameraProjectionMatrix.mul(vec4(transformNormalToView(attribute("inkNormal", "vec3")), 0)).xy.mul(halfRes);
    const off = nPx.div(max(length(nPx), 1e-6)).mul(inkPx.mul(weight)).div(halfRes).mul(pos.w);
    m.vertexNode = vec4(pos.xy.add(off), pos.z, pos.w);
    m.colorNode = vec4(color(P.ink), 1);
    inkCache.set(src, m);
    return m;
  };
  const pipeline = new THREE.RenderPipeline(renderer);
  pipeline.outputNode = outline;

  const gfx: Gfx = {
    renderer,
    pipeline,
    backend,
    tier,
    inkPx: inkPx as unknown as { value: number },
    drawCalls: 0,
    resize() {
      const w = Math.max(1, innerWidth);
      const h = Math.max(1, innerHeight);
      renderer.setSize(w, h, false);
      const pr = renderer.getPixelRatio();
      halfRes.value.set((w * pr) / 2, (h * pr) / 2);
    },
    render() {
      // A hidden 0x0 canvas makes WebGPU reject the swapchain texture, so skip those frames.
      if (innerWidth > 0 && innerHeight > 0 && !document.hidden) {
        renderer.info.reset();
        pipeline.render();
        gfx.drawCalls = renderer.info.render.drawCalls;
      }
    },
  };
  gfx.resize();
  return gfx;
}

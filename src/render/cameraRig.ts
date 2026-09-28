import * as THREE from "three/webgpu";
import { DEG, damp, SecondOrder } from "../core/math";

export const CAM = {
  yaw: 45 * DEG,
  pitch: 32 * DEG,
  /** Seconds of velocity lookahead. */
  lookahead: 0.35,
  /** Follow smoothing (1/s). */
  follow: 5,
  /** Metres Bill can drift before the camera starts following. */
  deadZone: 0.6,
  /** Bill's on-screen height as a fraction of the viewport, outdoors and indoors. */
  gameFrac: 110 / 1080,
  closeFrac: 170 / 1080,
  zoomSmoothing: 3,
};

/** Bill's projected height in world units at this pitch (1.78 m tall, standing). */
const BILL_PROJ = 1.78 * Math.cos(32 * DEG) + 0.25;

export type ZoomMode = "auto" | "game" | "close";

/** Orthographic isometric follow camera. */
export class CameraRig {
  readonly camera: THREE.OrthographicCamera;
  private focus = new THREE.Vector3();
  private look = new THREE.Vector3();
  private frac = CAM.closeFrac;
  private punch = new SecondOrder(5, 0.35);
  zoomMode: ZoomMode = "auto";
  /** Current frustum half-height in world units. */
  halfH = 5;

  constructor() {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  }

  snap(target: THREE.Vector3) {
    this.focus.copy(target);
    this.look.set(0, 0, 0);
  }

  /** Brief zoom-in pop (pickups, heavy drops). */
  zoomPunch(amount = 0.06) {
    this.punch.kick(amount * 12);
  }

  get pixelsPerMetre() {
    return innerHeight / (2 * this.halfH);
  }

  update(dt: number, bill: THREE.Vector3, vel: { x: number; y: number }, indoors: boolean) {
    // lookahead leads the camera in the direction of travel
    this.look.x = damp(this.look.x, vel.x * CAM.lookahead, 2.5, dt);
    this.look.z = damp(this.look.z, vel.y * CAM.lookahead, 2.5, dt);
    const tx = bill.x + this.look.x, ty = bill.y + 0.9, tz = bill.z + this.look.z;
    // dead zone: only chase the part of the offset outside the window
    const dx = tx - this.focus.x, dz = tz - this.focus.z, d = Math.hypot(dx, dz);
    const excess = Math.max(0, d - CAM.deadZone);
    const gx = d > 0 ? this.focus.x + (dx / d) * excess : this.focus.x;
    const gz = d > 0 ? this.focus.z + (dz / d) * excess : this.focus.z;
    this.focus.x = damp(this.focus.x, gx, CAM.follow, dt);
    this.focus.z = damp(this.focus.z, gz, CAM.follow, dt);
    this.focus.y = damp(this.focus.y, ty, CAM.follow * 1.4, dt);

    const wantClose = this.zoomMode === "close" || (this.zoomMode === "auto" && indoors);
    this.frac = damp(this.frac, wantClose ? CAM.closeFrac : CAM.gameFrac, CAM.zoomSmoothing, dt);
    const ref = Math.min(innerHeight, innerWidth * 1.25);
    const pop = 1 + this.punch.step(dt, 0);
    this.halfH = (BILL_PROJ / this.frac / 2) * (innerHeight / ref) / pop;

    const aspect = innerWidth / Math.max(1, innerHeight);
    const c = this.camera;
    c.top = this.halfH;
    c.bottom = -this.halfH;
    c.left = -this.halfH * aspect;
    c.right = this.halfH * aspect;
    c.updateProjectionMatrix();

    const R = 60, cp = Math.cos(CAM.pitch);
    c.position.set(
      this.focus.x + Math.sin(CAM.yaw) * cp * R,
      this.focus.y + Math.sin(CAM.pitch) * R,
      this.focus.z + Math.cos(CAM.yaw) * cp * R,
    );
    c.lookAt(this.focus);
  }

  /** Screen position (CSS px) of a world point. */
  project(p: THREE.Vector3, out: { x: number; y: number }) {
    const v = _p.copy(p).project(this.camera);
    out.x = (v.x * 0.5 + 0.5) * innerWidth;
    out.y = (-v.y * 0.5 + 0.5) * innerHeight;
    return out;
  }

  /** Is a projected point (roughly) on screen? */
  onScreen(pt: { x: number; y: number }) {
    return pt.x > -40 && pt.x < innerWidth + 40 && pt.y > -40 && pt.y < innerHeight + 40;
  }
}
const _p = new THREE.Vector3();

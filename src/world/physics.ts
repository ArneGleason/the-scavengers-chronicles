import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three/webgpu";

export type Rapier = typeof RAPIER;

/** Physics world wrapper: static level colliders, loose junk bodies, and mesh syncing. */
export class Physics {
  readonly world: RAPIER.World;
  private synced: { body: RAPIER.RigidBody; obj: THREE.Object3D }[] = [];

  private constructor(readonly R: Rapier) {
    this.world = new R.World({ x: 0, y: -19.6, z: 0 });
  }

  static async create() {
    await RAPIER.init();
    return new Physics(RAPIER);
  }

  /** Static axis-aligned box from min/max corners. */
  box(min: [number, number, number], max: [number, number, number], rotZ = 0) {
    const R = this.R;
    const hx = (max[0] - min[0]) / 2, hy = (max[1] - min[1]) / 2, hz = (max[2] - min[2]) / 2;
    const desc = R.ColliderDesc.cuboid(hx, hy, hz).setTranslation(min[0] + hx, min[1] + hy, min[2] + hz);
    if (rotZ) desc.setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rotZ));
    return this.world.createCollider(desc);
  }

  /** A sloped slab from (x0,y0) to (x1,y1) along X, spanning z0..z1; its top surface passes through both points. */
  ramp(x0: number, y0: number, x1: number, y1: number, z0: number, z1: number, thick = 0.2) {
    const R = this.R;
    if (x1 < x0) [x0, y0, x1, y1] = [x1, y1, x0, y0];
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const nx = -Math.sin(ang), ny = Math.cos(ang); // top-surface normal
    const cx = (x0 + x1) / 2 - nx * thick / 2, cy = (y0 + y1) / 2 - ny * thick / 2;
    const desc = R.ColliderDesc.cuboid(len / 2, thick / 2, (z1 - z0) / 2)
      .setTranslation(cx, cy, (z0 + z1) / 2)
      .setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), ang))
      .setFriction(0.8);
    return this.world.createCollider(desc);
  }

  /** Dynamic box body synced to `obj` (its origin is the body centre). */
  dynamicBox(obj: THREE.Object3D, half: [number, number, number], mass: number, at: THREE.Vector3) {
    const R = this.R;
    const body = this.world.createRigidBody(
      R.RigidBodyDesc.dynamic().setTranslation(at.x, at.y, at.z).setLinearDamping(0.6).setAngularDamping(0.8).setCanSleep(true),
    );
    const vol = 8 * half[0] * half[1] * half[2];
    this.world.createCollider(R.ColliderDesc.cuboid(...half).setDensity(mass / vol).setFriction(0.9).setRestitution(0.05), body);
    this.synced.push({ body, obj });
    return body;
  }

  remove(body: RAPIER.RigidBody) {
    this.synced = this.synced.filter((s) => s.body !== body);
    this.world.removeRigidBody(body);
  }

  step(dt: number) {
    this.world.timestep = dt;
    this.world.step();
    for (const { body, obj } of this.synced) {
      if (body.isSleeping()) continue;
      const t = body.translation(), r = body.rotation();
      obj.position.set(t.x, t.y, t.z);
      obj.quaternion.set(r.x, r.y, r.z, r.w);
    }
  }
}

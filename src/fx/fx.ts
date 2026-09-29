/**
 * Slapstick effects: cloud and dust puffs, stars around a dazed head, and pop-in sound-effect
 * lettering ("PFFRRT!", "THWACK!"). Everything is pooled sprites with ink drawn into the
 * texture, so it matches the comic look without going through the ink pass.
 */
import * as THREE from "three/webgpu";
import { P } from "../content/palette";

function tex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const PUFF_TEX = tex(128, 128, (g) => {
  // a lumpy cartoon cloud: white fill (tinted per puff) with an ink edge
  const blobs = [[64, 70, 38], [40, 76, 24], [88, 78, 26], [58, 48, 26], [80, 54, 20]];
  g.fillStyle = P.ink;
  for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x, y, r + 5, 0, 7); g.fill(); }
  g.fillStyle = "#ffffff";
  for (const [x, y, r] of blobs) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  g.fillStyle = "rgba(0,0,0,.12)";
  g.beginPath(); g.arc(70, 82, 22, 0, 7); g.fill();
});
const STAR_TEX = tex(64, 64, (g) => {
  const star = (r: number) => {
    g.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(32 + Math.cos(a) * rr, 34 + Math.sin(a) * rr); }
    g.closePath();
  };
  g.fillStyle = P.ink; star(30); g.fill();
  g.fillStyle = "#f7d547"; star(24); g.fill();
});

interface Puff { s: THREE.Sprite; m: THREE.SpriteNodeMaterial; vel: THREE.Vector3; life: number; age: number; size: number; grow: number }
interface Letter { s: THREE.Sprite; m: THREE.SpriteNodeMaterial; age: number; life: number; w: number; h: number }
interface Stars { sprites: THREE.Sprite[]; anchor: () => THREE.Vector3; until: number; phase: number }

let fontReady = false;
void document.fonts?.load("64px Bangers").then(() => (fontReady = true)).catch(() => {});

export class Fx {
  private puffs: Puff[] = [];
  private letters: Letter[] = [];
  private stars: Stars[] = [];
  private letterCache = new Map<string, { t: THREE.CanvasTexture; aspect: number }>();
  readonly root = new THREE.Group();

  constructor(scene: THREE.Scene) {
    scene.add(this.root);
    for (let i = 0; i < 90; i++) {
      const m = new THREE.SpriteNodeMaterial({ map: PUFF_TEX, transparent: true, depthWrite: false });
      const s = new THREE.Sprite(m);
      s.visible = false;
      s.renderOrder = 5;
      this.root.add(s);
      this.puffs.push({ s, m, vel: new THREE.Vector3(), life: 1, age: 99, size: 1, grow: 1 });
    }
  }

  /** A burst of cloud puffs (fart clouds, dust, dirt). */
  puff(at: THREE.Vector3, color: string, count: number, o: { spread?: number; up?: number; push?: THREE.Vector3; size?: number; life?: number; grow?: number } = {}) {
    for (let n = 0; n < count; n++) {
      const p = this.puffs.find((q) => q.age >= q.life);
      if (!p) return;
      const sp = o.spread ?? 0.4;
      p.s.position.set(at.x + (Math.random() - 0.5) * sp, at.y + (Math.random() - 0.5) * sp * 0.5, at.z + (Math.random() - 0.5) * sp);
      p.vel.set((Math.random() - 0.5) * sp * 2, (o.up ?? 0.4) * (0.6 + Math.random() * 0.8), (Math.random() - 0.5) * sp * 2);
      if (o.push) p.vel.add(o.push);
      p.m.color.set(color);
      p.size = (o.size ?? 0.45) * (0.7 + Math.random() * 0.6);
      p.grow = o.grow ?? 1.6;
      p.life = (o.life ?? 1.2) * (0.8 + Math.random() * 0.4);
      p.age = 0;
      p.s.visible = true;
    }
  }

  /** Pop-in sound-effect lettering in the comic font. */
  letter(text: string, at: THREE.Vector3, fill = "#f7d547", size = 0.9, life = 1.0) {
    const key = `${text}|${fill}|${fontReady}`;
    let c = this.letterCache.get(key);
    if (!c) {
      const font = fontReady ? "Bangers" : "Impact, 'Arial Black', sans-serif";
      const probe = document.createElement("canvas").getContext("2d")!;
      probe.font = `120px ${font}`;
      const w = Math.ceil(probe.measureText(text).width) + 60, h = 170;
      const t = tex(w, h, (g) => {
        g.translate(w / 2, h / 2 + 8);
        g.rotate(-0.08);
        g.font = `120px ${font}`;
        g.textAlign = "center"; g.textBaseline = "middle";
        g.lineJoin = "round";
        g.lineWidth = 22; g.strokeStyle = P.ink; g.strokeText(text, 0, 0);
        g.fillStyle = fill; g.fillText(text, 0, 0);
        g.lineWidth = 3; g.strokeStyle = "rgba(255,255,255,.6)"; g.strokeText(text, -2, -4);
      });
      c = { t, aspect: w / h };
      this.letterCache.set(key, c);
    }
    const m = new THREE.SpriteNodeMaterial({ map: c.t, transparent: true, depthWrite: false, depthTest: false });
    const s = new THREE.Sprite(m);
    s.renderOrder = 20;
    s.position.copy(at);
    this.root.add(s);
    this.letters.push({ s, m, age: 0, life, w: size * c.aspect * 0.75, h: size * 0.75 });
  }

  /** Stars circling a dazed head for a while. */
  daze(anchor: () => THREE.Vector3, seconds: number, now: number) {
    const sprites = [0, 1, 2].map(() => {
      const s = new THREE.Sprite(new THREE.SpriteNodeMaterial({ map: STAR_TEX, transparent: true, depthWrite: false }));
      s.scale.setScalar(0.22);
      s.renderOrder = 6;
      this.root.add(s);
      return s;
    });
    this.stars.push({ sprites, anchor, until: now + seconds, phase: Math.random() * 6 });
  }

  update(dt: number, now: number) {
    for (const p of this.puffs) {
      if (p.age >= p.life) continue;
      p.age += dt;
      const k = p.age / p.life;
      p.vel.multiplyScalar(Math.exp(-2.2 * dt));
      p.s.position.addScaledVector(p.vel, dt);
      p.s.scale.setScalar(p.size * (1 + p.grow * Math.sqrt(k)));
      p.m.opacity = k < 0.7 ? 0.95 : 0.95 * (1 - (k - 0.7) / 0.3);
      if (p.age >= p.life) p.s.visible = false;
    }
    this.letters = this.letters.filter((l) => {
      l.age += dt;
      const k = l.age / 0.18;
      const pop = k < 1 ? 1.3 * Math.sin((k * Math.PI) / 2) : 1 + 0.3 * Math.exp(-(l.age - 0.18) * 14);
      l.s.scale.set(l.w * pop, l.h * pop, 1);
      l.s.position.y += dt * 0.25;
      l.m.opacity = l.age < l.life - 0.2 ? 1 : Math.max(0, (l.life - l.age) / 0.2);
      if (l.age >= l.life) { this.root.remove(l.s); l.m.dispose(); return false; }
      return true;
    });
    this.stars = this.stars.filter((st) => {
      const c = st.anchor();
      st.sprites.forEach((s, i) => {
        const a = now * 7 + st.phase + (i * Math.PI * 2) / 3;
        s.position.set(c.x + Math.cos(a) * 0.28, c.y + 0.05 * Math.sin(a * 2), c.z + Math.sin(a) * 0.28);
      });
      if (now > st.until) { st.sprites.forEach((s) => this.root.remove(s)); return false; }
      return true;
    });
  }
}

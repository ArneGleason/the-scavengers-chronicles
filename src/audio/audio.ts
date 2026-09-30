/**
 * Walking-toy audio, all synthesised (docs/design/audio-design.md): a bus mix into a master
 * compressor, surface-aware footsteps with a shuffle scuff loop, pickup/drop/skid/refuse
 * gags, Bill's gibberish voice, and a small music layer that switches at the stairs.
 */
import type { Surface } from "../content/items";
import { rng } from "../core/math";

type Bus = "foley" | "sfx" | "ui" | "voice" | "music" | "amb";

const SURF: Record<Surface, { bp: number; q: number; dec: number; thump: number; gain: number }> = {
  carpet: { bp: 650, q: 0.7, dec: 0.07, thump: 85, gain: 0.5 },
  linoleum: { bp: 2900, q: 1.1, dec: 0.045, thump: 140, gain: 0.55 },
  hardwood: { bp: 1300, q: 1.4, dec: 0.06, thump: 150, gain: 0.7 },
  concrete: { bp: 2100, q: 1.0, dec: 0.055, thump: 110, gain: 0.6 },
  grass: { bp: 3600, q: 0.6, dec: 0.09, thump: 70, gain: 0.35 },
  dirt: { bp: 1000, q: 0.8, dec: 0.085, thump: 80, gain: 0.5 },
  stairs: { bp: 480, q: 3.5, dec: 0.09, thump: 120, gain: 0.8 },
  asphalt: { bp: 1700, q: 0.9, dec: 0.05, thump: 100, gain: 0.6 },
};

const NOTE = (n: number) => 440 * 2 ** ((n - 69) / 12);
const PICKUP_SCALE = [62, 65, 67, 69, 72, 74, 77]; // D minor pentatonic, D4 upward

export class GameAudio {
  ctx: AudioContext | null = null;
  private buses = {} as Record<Bus, GainNode>;
  private master!: GainNode;
  private noise!: AudioBuffer;
  private music?: { ground: GainNode; basement: GainNode };
  muted = false;
  private rand = rng(7);

  unlock() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = "playback";
    const ctx = new AudioContext({ latencyHint: "interactive" });
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -6; comp.ratio.value = 12; comp.attack.value = 0.003; comp.release.value = 0.15;
    this.master = ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(comp).connect(ctx.destination);
    const vols: Record<Bus, number> = { foley: 0.55, sfx: 0.6, ui: 0.4, voice: 0.55, music: 0.28, amb: 0.3 };
    for (const k of Object.keys(vols) as Bus[]) { const g = ctx.createGain(); g.gain.value = vols[k]; g.connect(this.master); this.buses[k] = g; }
    // two seconds of white noise, reused by every noisy sound
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.startMusic();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) void ctx.resume(); });
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  private get now() { return this.ctx!.currentTime; }
  private vary(semi = 1.5) { return 2 ** (((this.rand() * 2 - 1) * semi) / 12); }

  private noiseBurst(bus: Bus, t: number, dur: number, type: BiquadFilterType, freq: number, q: number, gain: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.playbackRate.value = this.vary(2);
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.buses[bus]);
    src.start(t, this.rand() * 1.5, dur + 0.05);
  }

  private tone(bus: Bus, t: number, type: OscillatorType, f0: number, f1: number, dur: number, gain: number, attack = 0.005) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.buses[bus]);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }

  footstep(surface: Surface, weight: number, hurry: boolean) {
    if (!this.ctx) return;
    const s = SURF[surface], t = this.now, v = this.vary(), g = s.gain * (hurry ? 1.25 : 0.7) * (0.85 + 0.3 * this.rand()) * weight;
    this.noiseBurst("foley", t, s.dec * (hurry ? 1.2 : 1), "bandpass", s.bp * v, s.q, g * 0.9);
    this.tone("foley", t, "sine", s.thump * v * (hurry ? 1.2 : 1), s.thump * 0.6, 0.06, g * 0.5);
    if (hurry) this.noiseBurst("foley", t + 0.012, 0.03, "highpass", 3500, 0.7, g * 0.35); // the slap
  }

  /**
   * One shuffle scrape: the loafer dragging forward through its swing. Called once per step
   * while shuffling, so it rises and falls with each foot instead of droning.
   */
  scrape(surface: Surface, speed: number) {
    if (!this.ctx) return;
    const ctx = this.ctx, sf = SURF[surface], t = this.now + 0.04, dur = 0.2 + 0.12 * this.rand();
    const k = Math.min(1, speed / 1.6) * sf.gain * (0.6 + 0.4 * this.rand());
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.playbackRate.value = this.vary(3);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.3;
    bp.frequency.setValueAtTime(sf.bp * 0.7, t);
    bp.frequency.linearRampToValueAtTime(sf.bp * 1.15, t + dur * 0.6);
    bp.frequency.linearRampToValueAtTime(sf.bp * 0.8, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09 * k, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(this.buses.foley);
    src.start(t, this.rand() * 1.5, dur + 0.05);
  }

  pickup(index: number) {
    if (!this.ctx) return;
    const t = this.now, n = PICKUP_SCALE[Math.min(index, PICKUP_SCALE.length - 1)];
    this.tone("sfx", t, "triangle", NOTE(n), NOTE(n), 0.22, 0.35);
    this.tone("sfx", t + 0.07, "triangle", NOTE(n + 7), NOTE(n + 7), 0.28, 0.25);
    this.tone("sfx", t + 0.14, "sine", NOTE(n + 12), NOTE(n + 12), 0.4, 0.18);
  }

  thunk(mass: number) {
    if (!this.ctx) return;
    const t = this.now, k = Math.min(1, Math.sqrt(mass / 18));
    this.tone("sfx", t, "sine", 120 - 40 * k, 42, 0.18 + 0.25 * k, 0.4 + 0.5 * k);
    this.noiseBurst("sfx", t, 0.08 + 0.15 * k, "lowpass", 500 + 900 * (1 - k), 0.7, 0.3 + 0.4 * k);
    if (mass > 5) this.noiseBurst("sfx", t + 0.01, 0.12, "bandpass", 320, 4, 0.5); // wood knock
  }

  rattle(items: number) {
    if (!this.ctx || items === 0) return;
    const t = this.now;
    for (let i = 0; i < 2 + items; i++) this.noiseBurst("foley", t + i * 0.035 + this.rand() * 0.02, 0.03, "bandpass", 3800 + this.rand() * 2500, 6, 0.08 + 0.04 * items);
  }

  skid() {
    if (!this.ctx) return;
    const t = this.now;
    const o = this.tone("sfx", t, "sine", 1500, 900, 0.32, 0.18, 0.01);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 28;
    const lg = this.ctx.createGain(); lg.gain.value = 60; lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + 0.35);
    this.noiseBurst("foley", t, 0.25, "bandpass", 1800, 1, 0.3);
  }

  /** The kazoo honk of a satchel that refuses the strategic vision. */
  refuse() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this.now;
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(230, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.35);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1000; bp.Q.value = 5;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(bp).connect(g).connect(this.buses.sfx); o.start(t); o.stop(t + 0.4);
  }

  /** Mission complete: a little synth fanfare in D, the key of the score. */
  jingle() {
    if (!this.ctx) return;
    const t = this.now;
    [62, 66, 69, 74].forEach((n, i) => this.tone("sfx", t + i * 0.09, "square", NOTE(n), NOTE(n), 0.22, 0.12));
    for (const n of [62, 66, 69, 74]) this.tone("sfx", t + 0.4, "triangle", NOTE(n), NOTE(n), 0.9, 0.12, 0.02);
  }

  /** The streetcar's two-tone bell, from across the lot. */
  streetcarBell() {
    if (!this.ctx) return;
    const t = this.now;
    for (const k of [0, 0.28]) {
      this.tone("amb", t + k, "sine", 1480, 1480, 0.5, 0.35, 0.002);
      this.tone("amb", t + k, "sine", 2210, 2210, 0.35, 0.15, 0.002);
    }
    this.noiseBurst("amb", t, 2.5, "lowpass", 180, 0.7, 0.35); // rumble
  }

  /** Raccoon chitter: fast little squeaks. */
  chitter() {
    if (!this.ctx) return;
    const t = this.now;
    for (let i = 0; i < 6; i++) this.tone("sfx", t + i * 0.055, "square", 2400 + this.rand() * 900, 1800, 0.04, 0.05);
  }

  land(speed: number) {
    if (!this.ctx) return;
    this.thunk(Math.min(18, speed * 3));
  }

  /* ---------- slapstick (docs/design/comedy.md) ---------- */

  /** A toot: a buzzy, flapping low tone. `size` 0..1 goes from a squeak to a trombone solo. */
  fart(size = 0.6) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this.now, dur = 0.22 + 0.7 * size;
    const f0 = (125 - 55 * size) * this.vary(3);
    const o = ctx.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(f0 * 1.2, t);
    o.frequency.linearRampToValueAtTime(f0, t + dur * 0.25);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.65, t + dur);
    // the flap: amplitude modulation at a lip-buzz rate that slows as it runs out
    const flap = ctx.createOscillator(); flap.type = "square";
    flap.frequency.setValueAtTime(26 + 14 * this.rand(), t); flap.frequency.linearRampToValueAtTime(11, t + dur);
    const depth = ctx.createGain(); depth.gain.value = 0.45;
    const am = ctx.createGain(); am.gain.value = 0.55;
    flap.connect(depth).connect(am.gain);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420 + 380 * size; lp.Q.value = 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.02);
    g.gain.setValueAtTime(0.9, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(am).connect(lp).connect(g).connect(this.buses.sfx);
    o.start(t); o.stop(t + dur + 0.05); flap.start(t); flap.stop(t + dur + 0.05);
    this.noiseBurst("sfx", t, dur * 0.8, "lowpass", 380, 1, 0.25); // the air
  }

  /** A rake handle to the face, or a fist to the dumpster. */
  thwack() {
    if (!this.ctx) return;
    const t = this.now;
    this.noiseBurst("sfx", t, 0.07, "bandpass", 2300, 1.1, 1.0);
    this.tone("sfx", t, "triangle", 900, 180, 0.09, 0.6, 0.001);
    this.noiseBurst("sfx", t + 0.005, 0.14, "bandpass", 360, 5, 0.6); // wood
  }

  /** A body meeting the ground. */
  whump(k = 1) {
    if (!this.ctx) return;
    const t = this.now;
    this.tone("sfx", t, "sine", 95, 38, 0.32, 0.9 * k, 0.003);
    this.noiseBurst("sfx", t, 0.22, "lowpass", 420, 0.8, 0.7 * k);
  }

  /** Something wet arriving from above. */
  splat() {
    if (!this.ctx) return;
    const t = this.now;
    this.noiseBurst("sfx", t, 0.16, "lowpass", 1500, 3, 0.8);
    this.tone("sfx", t, "sine", 700, 140, 0.12, 0.35, 0.002);
    this.noiseBurst("sfx", t + 0.07, 0.08, "bandpass", 2600, 2, 0.25);
  }

  /** A long, proud belch. */
  burp() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this.now, dur = 0.55 + 0.3 * this.rand();
    const o = ctx.createOscillator(); o.type = "sawtooth";
    o.frequency.setValueAtTime(82 * this.vary(2), t); o.frequency.linearRampToValueAtTime(64, t + dur);
    const rough = ctx.createOscillator(); rough.frequency.value = 31;
    const rg = ctx.createGain(); rg.gain.value = 18; rough.connect(rg).connect(o.frequency);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 520; bp.Q.value = 2.5;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1.2, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(bp).connect(g).connect(this.buses.sfx);
    o.start(t); o.stop(t + dur + 0.05); rough.start(t); rough.stop(t + dur + 0.05);
  }

  /** Air rushing past (a dash, a gust, a man leaving the ground). */
  whoosh(dur = 0.45) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this.now;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(350, t); bp.frequency.exponentialRampToValueAtTime(2200, t + dur * 0.45); bp.frequency.exponentialRampToValueAtTime(450, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.6, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(this.buses.sfx);
    src.start(t, this.rand(), dur + 0.05);
  }

  /** A slide whistle, up (flung into the air) or down (falling over). */
  slide(up: boolean, dur = 0.55) {
    if (!this.ctx) return;
    const t = this.now;
    const o = this.tone("sfx", t, "sine", up ? 420 : 1500, up ? 1600 : 380, dur, 0.28, 0.02);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 6;
    const lg = this.ctx.createGain(); lg.gain.value = 18; lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.05);
  }

  /** Steel: a dumpster lid, a man inside a dumpster. */
  clang() {
    if (!this.ctx) return;
    const t = this.now;
    for (const [f, g] of [[311, 0.5], [737, 0.35], [1187, 0.28], [1790, 0.2], [2630, 0.12]] as const) this.tone("sfx", t, "sine", f * this.vary(0.5), f, 0.9, g, 0.001);
    this.noiseBurst("sfx", t, 0.05, "highpass", 3000, 0.7, 0.8);
  }

  /** A spring-loaded boing (rake handles, skateboards, dignity). */
  boing() {
    if (!this.ctx) return;
    const t = this.now;
    const o = this.tone("sfx", t, "triangle", 190, 150, 0.6, 0.35, 0.003);
    const lfo = this.ctx.createOscillator(); lfo.frequency.setValueAtTime(18, t); lfo.frequency.linearRampToValueAtTime(7, t + 0.6);
    const lg = this.ctx.createGain(); lg.gain.setValueAtTime(90, t); lg.gain.exponentialRampToValueAtTime(5, t + 0.6);
    lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + 0.65);
  }

  /** One effortful "hnnf" per mash in a tug-of-war. */
  grunt(pitch = 1) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this.now, dur = 0.14;
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(125 * pitch * this.vary(2), t); o.frequency.exponentialRampToValueAtTime(90 * pitch, t + dur);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 640; bp.Q.value = 3;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(bp).connect(g).connect(this.buses.voice); o.start(t); o.stop(t + dur + 0.03);
  }

  /** Something giving way: a stump out of the ground, a prize out of a fist. */
  pop() {
    if (!this.ctx) return;
    const t = this.now;
    this.tone("sfx", t, "sine", 500, 1400, 0.08, 0.6, 0.002);
    this.noiseBurst("sfx", t, 0.3, "lowpass", 700, 0.8, 0.5);
  }

  /** The satchel blurts one synth note at the wrong moment: a detuned brass stab with a pitch droop. */
  blurt() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this.now, f = NOTE(50 + Math.floor(this.rand() * 5) * 2);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 6;
    lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(2600, t + 0.08); lp.frequency.exponentialRampToValueAtTime(400, t + 0.7);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    for (const d of [0.995, 1.005]) {
      const o = ctx.createOscillator(); o.type = "sawtooth";
      o.frequency.setValueAtTime(f * d, t); o.frequency.exponentialRampToValueAtTime(f * d * 0.94, t + 0.8);
      o.connect(lp); o.start(t); o.stop(t + 0.85);
    }
    lp.connect(g).connect(this.buses.sfx);
  }

  /** Paper: rummaging in a hoard, a newspaper flapping off a shoe. */
  rustle(k = 1) {
    if (!this.ctx) return;
    const t = this.now;
    for (let i = 0; i < 3; i++) this.noiseBurst("foley", t + i * 0.04 + this.rand() * 0.02, 0.05, "bandpass", 2800 + this.rand() * 2000, 1.5, 0.25 * k);
  }

  /** The phone's fake shutter: a click and a little mechanical whirr. */
  shutter() {
    if (!this.ctx) return;
    const t = this.now;
    this.noiseBurst("ui", t, 0.03, "highpass", 3000, 0.7, 0.6);
    this.noiseBurst("ui", t + 0.06, 0.05, "bandpass", 1800, 2, 0.4);
  }

  /** A reply arriving on the phone. */
  bloop(i = 0) {
    if (!this.ctx) return;
    const t = this.now, f = NOTE(79 + (i % 3) * 3);
    this.tone("ui", t, "sine", f, f * 1.5, 0.12, 0.25, 0.004);
  }

  /** The soup, bubbling to itself. */
  blub() {
    if (!this.ctx) return;
    const t = this.now;
    this.tone("amb", t, "sine", 160 + this.rand() * 80, 420 + this.rand() * 160, 0.07, 0.12, 0.004);
  }

  /** A long, committed slurp. */
  slurp() {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this.now, dur = 1.2;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 5;
    bp.frequency.setValueAtTime(500, t); bp.frequency.exponentialRampToValueAtTime(2400, t + dur * 0.8); bp.frequency.exponentialRampToValueAtTime(900, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7, t + 0.1); g.gain.setValueAtTime(0.7, t + dur * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(this.buses.sfx); src.start(t, 0, dur + 0.05);
  }

  /** A hammer on a steel grate: a bright ping. */
  tink() {
    if (!this.ctx) return;
    const t = this.now, v = this.vary(2);
    this.tone("sfx", t, "sine", 1900 * v, 1850 * v, 0.18, 0.3, 0.001);
    this.tone("sfx", t, "sine", 2870 * v, 2800 * v, 0.12, 0.15, 0.001);
    this.noiseBurst("sfx", t, 0.03, "highpass", 3500, 0.7, 0.4);
  }

  /** A typewriter key. */
  clack() {
    if (!this.ctx) return;
    const t = this.now;
    this.noiseBurst("sfx", t, 0.025, "bandpass", 2400 + this.rand() * 1200, 3, 0.5);
    this.tone("sfx", t, "square", 1200, 900, 0.02, 0.08, 0.001);
  }

  /** The typewriter's bell at the end of the line. */
  ding() {
    if (!this.ctx) return;
    const t = this.now;
    this.tone("sfx", t, "sine", 2640, 2640, 0.6, 0.3, 0.001);
    this.tone("sfx", t, "sine", 5280, 5280, 0.3, 0.08, 0.001);
  }

  /** A cat-fight slap. */
  slap() {
    if (!this.ctx) return;
    const t = this.now;
    this.noiseBurst("sfx", t, 0.05, "highpass", 1800 + this.rand() * 1500, 0.8, 0.55);
    this.tone("sfx", t, "sine", 420, 180, 0.05, 0.25, 0.001);
  }

  /**
   * One note on Bill's 1986 poly synth: two detuned saws through a plucky low-pass. `sour`
   * is the third note of every take: a semitone off, wobbling, and sagging like old tape.
   */
  synthNote(midi: number, sour = false) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = this.now, dur = sour ? 1.6 : 0.9;
    const f = NOTE(midi + (sour ? 1 : 0));
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = sour ? 9 : 4;
    lp.frequency.setValueAtTime(500, t); lp.frequency.exponentialRampToValueAtTime(sour ? 1800 : 3200, t + 0.03); lp.frequency.exponentialRampToValueAtTime(700, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(g).connect(this.buses.sfx);
    for (const d of sour ? [0.97, 1.012] : [0.996, 1.004]) {
      const o = ctx.createOscillator(); o.type = "sawtooth";
      o.frequency.setValueAtTime(f * d, t);
      if (sour) {
        // the droop, then a seasick wobble
        o.frequency.exponentialRampToValueAtTime(f * d * 0.955, t + 0.35);
        o.frequency.exponentialRampToValueAtTime(f * d * 0.9, t + dur);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 6.5;
        const lg = ctx.createGain(); lg.gain.value = f * 0.03; lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + dur + 0.05);
      }
      o.connect(lp); o.start(t); o.stop(t + dur + 0.05);
    }
  }

  /** The victory sting after a challenge: a trombone-ish "ta-daa". Or a sad one. */
  sting(won: boolean) {
    if (!this.ctx) return;
    const t = this.now;
    const notes = won ? [62, 69, 74] : [67, 66, 65, 62];
    notes.forEach((n, i) => this.tone("sfx", t + i * (won ? 0.12 : 0.28), "sawtooth", NOTE(n - 12), NOTE(n - 12) * (won ? 1 : 0.97), won && i === 2 ? 0.7 : 0.3, 0.14, 0.02));
  }

  /**
   * Gibberish voice (Animalese-style): one formant-filtered pulse grain per syllable,
   * seeded from the line so the same line always sounds the same.
   */
  speak(text: string, basePitch = 105) {
    if (!this.ctx) return 0;
    const ctx = this.ctx;
    let seed = 0; for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) | 0;
    const r = rng(seed);
    const FORM: Record<string, [number, number]> = { a: [730, 1090], e: [530, 1840], i: [270, 2290], o: [570, 840], u: [300, 870] };
    const words = text.toLowerCase().replace(/[^a-z?!.,' ]/g, "").split(/\s+/).slice(0, 16);
    let t = this.now + 0.02;
    for (const [wi, w] of words.entries()) {
      const syl = Math.max(1, Math.round(w.length / 3));
      for (let s = 0; s < syl; s++) {
        const chunk = w.slice(s * 3, s * 3 + 3);
        const vowel = (chunk.match(/[aeiou]/) ?? ["a"])[0];
        const [f1, f2] = FORM[vowel];
        const q = w.includes("?") && wi >= words.length - 1 ? 4 : 0;
        const pitch = basePitch * 2 ** (((r() * 4 - 2) + q + (w.includes("!") ? 2 : 0)) / 12);
        const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = pitch;
        const g = ctx.createGain(); const dur = 0.075;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400; // mumbling through the hair
        for (const f of [f1, f2]) {
          const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 6;
          o.connect(bp).connect(g);
        }
        g.connect(lp).connect(this.buses.voice);
        o.start(t); o.stop(t + dur + 0.02);
        t += 1 / 9;
      }
      t += /[.,]/.test(w) ? 0.2 : 0.04;
    }
    return t - this.now;
  }

  /** A small music layer: lounge chords upstairs, Bill's three-note figure in the basement, birds outside. */
  private startMusic() {
    const ctx = this.ctx!;
    const mk = () => { const g = ctx.createGain(); g.gain.value = 0; g.connect(this.buses.music); return g; };
    this.music = { ground: mk(), basement: mk() };
    const beat = 60 / 96, bar = beat * 4;
    const chords = [[50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59], [57, 61, 64, 67]]; // Dm7 G7 Cmaj7 A7
    const figure = [62, 57, 65]; // Bill's lazy three-note leitmotif
    let next = ctx.currentTime + 0.1, barIdx = 0;
    const delay = ctx.createDelay(1); delay.delayTime.value = beat * 0.75;
    const fb = ctx.createGain(); fb.gain.value = 0.35; delay.connect(fb).connect(delay); delay.connect(this.music.basement);
    const schedule = () => {
      while (next < ctx.currentTime + 0.4) {
        const chord = chords[Math.floor(barIdx / 2) % chords.length];
        if (barIdx % 2 === 0) for (const n of chord) {
          const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = NOTE(n);
          const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, next); g.gain.exponentialRampToValueAtTime(0.06, next + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, next + bar * 2);
          o.connect(g).connect(this.music!.ground); o.start(next); o.stop(next + bar * 2 + 0.1);
        }
        // brushed snare on 2 and 4
        for (const b of [1, 3]) {
          const t = next + b * beat;
          const src = ctx.createBufferSource(); src.buffer = this.noise;
          const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 3000;
          const g = ctx.createGain(); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
          src.connect(f).connect(g).connect(this.music!.ground); src.start(t, Math.random(), 0.2);
        }
        // basement: the figure on a plucky saw through a lowpass, into a dub delay; a sub drone
        figure.forEach((n, i) => {
          const t = next + i * beat * 1.25;
          const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = NOTE(n);
          const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(2200, t); lp.frequency.exponentialRampToValueAtTime(400, t + 0.5);
          const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
          o.connect(lp).connect(g); g.connect(this.music!.basement); g.connect(delay); o.start(t); o.stop(t + 1);
        });
        const sub = ctx.createOscillator(); sub.type = "sine"; sub.frequency.value = NOTE(38);
        const sg = ctx.createGain(); sg.gain.setValueAtTime(0.0001, next); sg.gain.exponentialRampToValueAtTime(0.08, next + 0.5); sg.gain.exponentialRampToValueAtTime(0.0001, next + bar);
        sub.connect(sg).connect(this.music!.basement); sub.start(next); sub.stop(next + bar + 0.1);
        // outdoors: a bird now and then
        if (Math.random() < 0.6) {
          const t = next + Math.random() * bar, f = 2600 + Math.random() * 1400;
          for (let k = 0; k < 2 + Math.floor(Math.random() * 3); k++) this.tone("amb", t + k * 0.09, "sine", f, f * 1.25, 0.07, 0.05);
        }
        next += bar;
        barIdx++;
      }
    };
    setInterval(schedule, 100);
    schedule();
  }

  /** Crossfade music layers for where Bill is. */
  setScene(where: "ground" | "basement" | "outdoors") {
    if (!this.music || !this.ctx) return;
    const t = this.now;
    this.music.ground.gain.setTargetAtTime(where === "ground" ? 1 : where === "outdoors" ? 0.35 : 0, t, 0.8);
    this.music.basement.gain.setTargetAtTime(where === "basement" ? 1 : 0, t, 0.8);
    this.buses.amb.gain.setTargetAtTime(where === "outdoors" ? 0.3 : 0.05, t, 0.8);
  }
}

/**
 * Fixed-step simulation with render interpolation (Fiedler, "Fix Your Timestep").
 * step() runs at exactly `hz`; render() gets the leftover fraction and real frame dt.
 */
export class FixedLoop {
  readonly dt: number;
  private acc = 0;
  private last = -1;
  /** Seconds of simulation time elapsed. */
  simTime = 0;
  /** Multiplies simulation time (hit-stop sets this to 0 briefly). */
  timeScale = 1;
  private freezeUntil = 0;

  constructor(
    private step: (dt: number) => void,
    private render: (alpha: number, frameDt: number) => void,
    hz = 60,
  ) {
    this.dt = 1 / hz;
  }

  /** Freeze simulation for `ms` of real time (hit-stop). */
  hitStop(ms: number, now = performance.now()) {
    this.freezeUntil = Math.max(this.freezeUntil, now + ms);
  }

  tick(now: number) {
    if (this.last < 0) this.last = now;
    const frameDt = Math.min(0.25, (now - this.last) / 1000);
    this.last = now;
    const scale = now < this.freezeUntil ? 0 : this.timeScale;
    this.acc += frameDt * scale;
    let steps = 0;
    while (this.acc >= this.dt && steps < 8) {
      this.step(this.dt);
      this.simTime += this.dt;
      this.acc -= this.dt;
      steps++;
    }
    if (steps === 8) this.acc = 0; // spiral-of-death guard
    this.render(this.acc / this.dt, frameDt);
  }
}

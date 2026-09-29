/**
 * The gag clock (docs/design/comedy.md): anything funny marks the clock; if nothing funny
 * has happened for `interval` seconds, the director picks an eligible ambient gag.
 */
export interface GagOption<T extends string = string> {
  id: T;
  /** Can this gag happen right now (outdoors, idle, and so on)? */
  ok: boolean;
  /** Minimum seconds between two of the same gag. */
  cooldown: number;
}

export class GagDirector<T extends string = string> {
  private lastGag = 0;
  private lastOf = new Map<T, number>();
  /** Gag timestamps for the debug readout (gags per minute). */
  private history: number[] = [];

  constructor(public interval = 12) {}

  /** Something funny just happened, whoever caused it. */
  mark(now: number, id?: T) {
    this.lastGag = now;
    this.history.push(now);
    if (id) this.lastOf.set(id, now);
  }

  sinceLast(now: number) {
    return now - this.lastGag;
  }

  /** Returns a gag to play, or null if one happened recently or none is eligible. */
  pick(now: number, options: GagOption<T>[], rnd: () => number): T | null {
    if (now - this.lastGag < this.interval) return null;
    const ready = options.filter((o) => o.ok && now - (this.lastOf.get(o.id) ?? -1e9) >= o.cooldown);
    if (!ready.length) return null;
    const id = ready[Math.floor(rnd() * ready.length)].id;
    this.mark(now, id);
    return id;
  }

  perMinute(now: number) {
    this.history = this.history.filter((t) => now - t < 60);
    return this.history.length;
  }
}

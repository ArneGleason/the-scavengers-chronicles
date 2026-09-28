/**
 * Keyboard + gamepad input. Movement is reported in screen space (x right, y up);
 * the controller rotates it by the camera yaw. Button presses are latched until a
 * fixed simulation step consumes them, so a quick tap between steps is never lost.
 */
export type Button = "interact" | "drop" | "debug" | "tune" | "mute" | "zoom" | "mission";

const KEYMAP: Record<string, Button> = {
  KeyE: "interact",
  Space: "interact",
  Enter: "interact",
  KeyR: "drop",
  Backquote: "debug",
  KeyT: "tune",
  KeyN: "mute",
  KeyM: "mission",
  KeyZ: "zoom",
};

export class Input {
  private keys = new Set<string>();
  private latched = new Set<Button>();
  private padPrev: boolean[] = [];
  /** Raw stick/keys vector, magnitude 0..1. */
  readonly move = { x: 0, y: 0 };
  hurry = false;
  /** True when the last movement came from an analog stick (no keyboard smoothing needed). */
  analog = false;
  /** Fired once on the first user gesture (used to unlock audio). */
  onFirstGesture: (() => void) | null = null;

  constructor(target: Window = window) {
    target.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      if (isTyping(e)) return;
      this.gesture();
      this.keys.add(e.code);
      const b = KEYMAP[e.code];
      if (b) this.latched.add(b);
      if (e.code.startsWith("Arrow") || e.code === "Space") e.preventDefault();
    });
    target.addEventListener("keyup", (e) => this.keys.delete(e.code));
    target.addEventListener("blur", () => this.keys.clear());
    target.addEventListener("pointerdown", () => this.gesture());
  }

  private gesture() {
    if (this.onFirstGesture) {
      const f = this.onFirstGesture;
      this.onFirstGesture = null;
      f();
    }
  }

  /** Returns true once per press. */
  consume(b: Button) {
    const had = this.latched.has(b);
    this.latched.delete(b);
    return had;
  }

  press(b: Button) {
    this.latched.add(b);
  }

  /** Poll keyboard + first connected gamepad. Call once per frame. */
  poll() {
    const k = this.keys;
    let x = (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) - (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
    let y = (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) - (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    let hurry = k.has("ShiftLeft") || k.has("ShiftRight");
    this.analog = false;

    const pad = navigator.getGamepads?.().find((p) => p && p.connected) ?? null;
    if (pad) {
      const sx = pad.axes[0] ?? 0;
      const sy = -(pad.axes[1] ?? 0);
      const m = Math.hypot(sx, sy);
      const dead = 0.2;
      if (m > dead) {
        // radial dead zone, rescaled, with a response curve so small tilts sneak
        const t = Math.min(1, (m - dead) / (1 - dead)) ** 1.5;
        x = (sx / m) * t;
        y = (sy / m) * t;
        this.analog = true;
      }
      const btn = (i: number) => !!pad.buttons[i]?.pressed;
      hurry ||= btn(7) || btn(2) || btn(10); // RT, X, L3
      const edges: [number, Button][] = [
        [0, "interact"],
        [1, "drop"],
        [8, "debug"],
        [3, "mission"],
      ];
      for (const [i, b] of edges) {
        if (btn(i) && !this.padPrev[i]) {
          this.gesture();
          this.latched.add(b);
        }
      }
      this.padPrev = pad.buttons.map((b) => b.pressed);
    }

    this.move.x = x;
    this.move.y = y;
    this.hurry = hurry;
  }
}

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
}

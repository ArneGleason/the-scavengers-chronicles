import { ITEMS, type ItemId } from "../content/items";
import type { Inventory } from "../game/inventory";

type Pt = { x: number; y: number };

interface Balloon {
  el: HTMLDivElement;
  text: HTMLSpanElement;
  until: number;
}

/**
 * The comic layer over the 3D view (docs/design/art-bible.md, "Lettering"): speech balloons
 * for anyone who talks, the narrator's caption box, the interaction prompt, the objective
 * card and marker, the satchel, and a debug line.
 */
export class Hud {
  private balloons = new Map<string, Balloon>();
  private caption = el("div", "caption");
  private prompt = el("div", "prompt");
  private satchel = el("div", "satchel");
  private help = el("div", "help");
  private debug = el("div", "debug");
  private objective = el("div", "objective");
  private marker = el("div", "marker");
  private gas = el("div", "gas");
  private challengeEl = el("div", "challenge");
  private lastGas = "";
  private captionUntil = 0;
  private captionQueue: { text: string; seconds: number }[] = [];
  showDebug = false;

  constructor(private root: HTMLElement) {
    root.append(this.caption, this.prompt, this.satchel, this.help, this.debug, this.objective, this.marker, this.gas, this.challengeEl);
    this.help.innerHTML = `<b>How to Bill</b>
      <span><kbd>WASD</kbd> shuffle</span><span><kbd>Shift</kbd> hurry</span>
      <span><kbd>Space</kbd> toot dash</span><span><kbd>E</kbd> grab / mash</span>
      <span><kbd>R</kbd> drop</span><span><kbd>Z</kbd> zoom</span>
      <span><kbd>T</kbd> tune feel</span><span><kbd>N</kbd> mute</span>`;
    this.marker.innerHTML = `<span>&#9660;</span>`;
    this.challengeEl.innerHTML = `<b></b><div class="meter"><i></i><em></em></div><span class="mash">MASH <kbd>E</kbd>!</span>`;
    for (const e of [this.caption, this.prompt, this.debug, this.objective, this.marker, this.challengeEl]) e.hidden = true;
  }

  private balloon(speaker: string) {
    let b = this.balloons.get(speaker);
    if (!b) {
      const e = el("div", `balloon balloon-${speaker}`) as HTMLDivElement;
      const text = el("span", "") as HTMLSpanElement;
      e.append(text);
      e.hidden = true;
      this.root.append(e);
      b = { el: e, text, until: 0 };
      this.balloons.set(speaker, b);
    }
    return b;
  }

  say(text: string, seconds: number, now: number, speaker = "bill") {
    const b = this.balloon(speaker);
    b.text.textContent = text;
    b.el.hidden = false;
    b.until = now + seconds;
  }

  /** Narrator caption. Lines queue so a mission line isn't trampled by the next one. */
  narrate(text: string, seconds: number, now: number, queue = false) {
    if (queue && now < this.captionUntil) {
      this.captionQueue.push({ text, seconds });
      return;
    }
    this.caption.textContent = text;
    this.caption.hidden = false;
    this.captionUntil = now + seconds;
  }

  setObjective(title: string | null, guide = "") {
    this.objective.hidden = !title;
    if (title) this.objective.innerHTML = `<small>Current compulsion</small><b>${esc(title)}</b><span>${esc(guide)}</span>`;
  }

  /**
   * @param anchors speaker -> screen position of their head (null if off screen)
   * @param target the interaction prompt, if any
   * @param goal where the objective marker points (screen px), or null
   */
  update(now: number, anchors: Record<string, Pt | null>, target: (Pt & { label: string }) | null, goal: Pt | null) {
    const placed: { x: number; y: number; w: number; h: number }[] = [];
    for (const [speaker, b] of this.balloons) {
      if (now > b.until) b.el.hidden = true;
      const head = anchors[speaker];
      if (b.el.hidden || !head) { if (!head) b.el.hidden = true; continue; }
      const w = b.el.offsetWidth, h = b.el.offsetHeight;
      const x = Math.min(innerWidth - w - 12, Math.max(12, head.x - w * 0.3));
      let y = Math.max(12, head.y - h - 26);
      // two people talking at once: stack the later balloon above the earlier one
      for (const o of placed) if (x < o.x + o.w && o.x < x + w && y < o.y + o.h + 6 && o.y < y + h) y = o.y - h - 10;
      placed.push({ x, y, w, h });
      b.el.style.transform = `translate(${x}px, ${y}px)`;
      b.el.style.setProperty("--tail", `${Math.min(w - 24, Math.max(18, head.x - x))}px`);
    }
    if (now > this.captionUntil) {
      const next = this.captionQueue.shift();
      if (next) this.narrate(next.text, next.seconds, now);
      else this.caption.hidden = true;
    }
    if (target) {
      this.prompt.hidden = false;
      this.prompt.textContent = target.label;
      const w = this.prompt.offsetWidth;
      this.prompt.style.transform = `translate(${Math.round(target.x - w / 2)}px, ${Math.round(target.y - 46)}px)`;
    } else this.prompt.hidden = true;

    // objective marker: bob over the goal, or pin to the screen edge and point at it
    if (goal && !target) {
      const m = 34, bob = Math.sin(now * 5) * 5;
      const inside = goal.x > m && goal.x < innerWidth - m && goal.y > m + 40 && goal.y < innerHeight - m;
      let x = goal.x, y = goal.y - 58 + bob, rot = 0;
      if (!inside) {
        const cx = innerWidth / 2, cy = innerHeight / 2, dx = goal.x - cx, dy = goal.y - cy;
        const k = Math.min((innerWidth / 2 - m) / Math.abs(dx || 1e-3), (innerHeight / 2 - m) / Math.abs(dy || 1e-3));
        x = cx + dx * k; y = cy + dy * k;
        rot = (Math.atan2(dy, dx) * 180) / Math.PI - 90;
      }
      this.marker.hidden = false;
      this.marker.classList.toggle("edge", !inside);
      this.marker.style.transform = `translate(${Math.round(x - 16)}px, ${Math.round(y - 16)}px) rotate(${rot}deg)`;
    } else this.marker.hidden = true;
  }

  setInventory(inv: Inventory) {
    const slot = (id: ItemId | null, kind: string) => {
      if (!id) return `<div class="slot ${kind} empty"></div>`;
      const d = ITEMS[id];
      return `<div class="slot ${kind}" title="${d.name}"><i style="background:${d.color};border-color:${d.accent}"></i><span>${d.shortName}</span></div>`;
    };
    const slots = Array.from({ length: inv.capacity }, (_, i) => slot(inv.satchel[i] ?? null, "bag")).join("");
    this.satchel.innerHTML = `<div class="label">Satchel</div><div class="slots">${slots}</div><div class="label">Hands</div>${slot(inv.hands, "hands")}`;
  }

  /** The soup gauge: one bean per toot, the next one filling up. */
  setGas(charges: number, max: number, refill: number) {
    const key = `${charges}|${Math.round(refill * 10)}`;
    if (key === this.lastGas) return;
    this.lastGas = key;
    const beans = Array.from({ length: max }, (_, i) => {
      const f = i < charges ? 1 : i === charges ? refill : 0;
      return `<i class="${f >= 1 ? "full" : ""}" style="--f:${(f * 100).toFixed(0)}%"></i>`;
    }).join("");
    this.gas.innerHTML = `<span>Soup</span>${beans}<kbd>Space</kbd>`;
  }

  /** The action-challenge panel: a title, a tug meter (0..1, 0.5 is even), and a mash prompt. */
  setChallenge(c: { title: string; progress: number; jolt: number; now: number } | null) {
    this.challengeEl.hidden = !c;
    if (!c) return;
    this.challengeEl.querySelector("b")!.textContent = c.title;
    (this.challengeEl.querySelector(".meter i") as HTMLElement).style.width = `${(c.progress * 100).toFixed(1)}%`;
    (this.challengeEl.querySelector(".meter em") as HTMLElement).style.left = `${(c.progress * 100).toFixed(1)}%`;
    const shake = c.jolt > 0 ? Math.sin(c.now * 70) * 6 * c.jolt : 0;
    this.challengeEl.style.transform = `translateX(calc(-50% + ${shake.toFixed(1)}px))`;
    this.challengeEl.querySelector(".mash")!.classList.toggle("big", Math.sin(c.now * 18) > 0);
  }

  hideHelp() {
    this.help.classList.add("faded");
  }

  setDebug(text: string) {
    this.debug.hidden = !this.showDebug;
    if (this.showDebug) this.debug.textContent = text;
  }
}

function el(tag: string, cls: string) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

import { ITEMS, type ItemId } from "../content/items";
import type { Inventory } from "../game/inventory";

/**
 * The comic layer over the 3D view (docs/design/art-bible.md, "Lettering"): Bill's speech
 * balloon, the narrator's caption box, the interaction prompt, the satchel, and a debug line.
 */
export class Hud {
  private balloon = el("div", "balloon");
  private balloonText = el("span", "");
  private caption = el("div", "caption");
  private prompt = el("div", "prompt");
  private satchel = el("div", "satchel");
  private help = el("div", "help");
  private debug = el("div", "debug");
  private balloonUntil = 0;
  private captionUntil = 0;
  showDebug = false;

  constructor(root: HTMLElement) {
    this.balloon.append(this.balloonText);
    root.append(this.balloon, this.caption, this.prompt, this.satchel, this.help, this.debug);
    this.help.innerHTML = `<b>Bill's walking toy</b>
      <span><kbd>WASD</kbd> shuffle</span><span><kbd>Shift</kbd> hurry</span>
      <span><kbd>E</kbd> pick up</span><span><kbd>R</kbd> drop</span>
      <span><kbd>Z</kbd> zoom</span><span><kbd>T</kbd> tune feel</span>
      <span><kbd>M</kbd> mute</span><span><kbd>\`</kbd> debug</span>`;
    this.balloon.hidden = true;
    this.caption.hidden = true;
    this.prompt.hidden = true;
    this.debug.hidden = true;
  }

  say(text: string, seconds: number, now: number) {
    this.balloonText.textContent = text;
    this.balloon.hidden = false;
    this.balloonUntil = now + seconds;
  }

  narrate(text: string, seconds: number, now: number) {
    this.caption.textContent = text;
    this.caption.hidden = false;
    this.captionUntil = now + seconds;
  }

  /** Place the balloon so its tail points at Bill's head (screen px). */
  update(now: number, head: { x: number; y: number } | null, target: { x: number; y: number; label: string } | null) {
    if (now > this.balloonUntil) this.balloon.hidden = true;
    if (now > this.captionUntil) this.caption.hidden = true;
    if (!this.balloon.hidden && head) {
      const w = this.balloon.offsetWidth, h = this.balloon.offsetHeight;
      const x = Math.min(innerWidth - w - 12, Math.max(12, head.x - w * 0.3));
      const y = Math.max(12, head.y - h - 26);
      this.balloon.style.transform = `translate(${x}px, ${y}px)`;
      this.balloon.style.setProperty("--tail", `${Math.min(w - 24, Math.max(18, head.x - x))}px`);
    }
    if (target) {
      this.prompt.hidden = false;
      this.prompt.textContent = target.label;
      const w = this.prompt.offsetWidth;
      this.prompt.style.transform = `translate(${Math.round(target.x - w / 2)}px, ${Math.round(target.y - 46)}px)`;
    } else this.prompt.hidden = true;
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

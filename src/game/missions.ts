/**
 * Pure mission state machine (no three.js, no DOM). Each errand is: find the item, then
 * deliver it. Completing an errand unlocks the next, and the next available one is selected
 * automatically so Bill is never missionless (v0.2 behaviour).
 *
 * Bill is free to do things out of order. An item picked up early puts its errand straight into
 * delivery when the errand opens (see syncCarrying), and an item delivered early completes its
 * errand on the spot; when the chain reaches it, it's skipped as already done.
 */
import { MISSIONS, MISSION_ORDER, type MissionId, type PointId } from "../content/missions";
import type { ItemId } from "../content/items";

export type Stage = "locked" | "find" | "deliver" | "complete";

export interface MissionState {
  stages: Record<MissionId, Stage>;
  active: MissionId | null;
}

export const newMissionState = (): MissionState => ({
  stages: { cablePilgrimage: "find", stumpProphecy: "locked", dumpsterDiplomacy: "locked", grateShelf: "locked", grateVault: "locked", noiseComplaint: "locked", parcelProtection: "locked", thePitch: "locked", theManuscript: "locked" },
  active: "cablePilgrimage",
});

export type MissionEvent =
  | { type: "picked"; mission: MissionId }
  | { type: "completed"; mission: MissionId; unlocked: MissionId[]; early?: boolean }
  | { type: "alreadyDone"; mission: MissionId }
  | { type: "selected"; mission: MissionId };

/** Bill picked up an item: if it's the active (or any open) errand's item, move to delivery. */
export function onPickup(s: MissionState, item: ItemId): MissionEvent[] {
  const out: MissionEvent[] = [];
  for (const id of MISSION_ORDER) {
    if (MISSIONS[id].item === item && s.stages[id] === "find") {
      s.stages[id] = "deliver";
      out.push({ type: "picked", mission: id });
    }
  }
  return out;
}

/** Bill dropped an item back into the world: its errand goes back to finding it. */
export function onDrop(s: MissionState, item: ItemId) {
  for (const id of MISSION_ORDER) if (MISSIONS[id].item === item && s.stages[id] === "deliver") s.stages[id] = "find";
}

/**
 * Keep errands in step with what he's actually carrying: an open errand whose item is in his
 * satchel or hands is a delivery, and one in delivery whose item he no longer has is a search.
 * Returns true if anything changed.
 */
export function syncCarrying(s: MissionState, carrying: readonly ItemId[]) {
  const changed = syncStages(s, carrying);
  if (changed && (!s.active || s.stages[s.active] === "complete")) s.active = nextAvailable(s);
  // prefer an errand he can deliver right now over one he'd have to go and find
  if (changed && s.active && s.stages[s.active] === "find") {
    const ready = MISSION_ORDER.find((id) => s.stages[id] === "deliver");
    if (ready) s.active = ready;
  }
  return changed;
}

function syncStages(s: MissionState, carrying: readonly ItemId[], downgrade = true) {
  let changed = false;
  for (const id of MISSION_ORDER) {
    const has = carrying.includes(MISSIONS[id].item);
    if (s.stages[id] === "find" && has) { s.stages[id] = "deliver"; changed = true; }
    else if (downgrade && s.stages[id] === "deliver" && !has) { s.stages[id] = "find"; changed = true; }
  }
  return changed;
}

/**
 * Which errand could Bill deliver right now at this point, holding these items? Includes errands
 * the chain hasn't reached yet: delivering early counts.
 */
export function deliverable(s: MissionState, point: PointId, carrying: readonly ItemId[]): MissionId | null {
  for (const id of MISSION_ORDER) {
    const m = MISSIONS[id], st = s.stages[id];
    if ((st === "deliver" || st === "find" || st === "locked") && m.drop === point && carrying.includes(m.item)) return id;
  }
  return null;
}

/**
 * Complete an errand. Pass what he's carrying so errands it opens can go straight to delivery.
 * An early delivery (of a locked errand) completes it without opening anything yet; when the
 * chain later reaches it, it's reported as already done and the chain carries on past it.
 */
export function deliver(s: MissionState, id: MissionId, carrying: readonly ItemId[] = []): MissionEvent[] {
  const st = s.stages[id];
  if (st === "complete") return [];
  const early = st === "locked";
  s.stages[id] = "complete";
  const out: MissionEvent[] = [];
  const unlocked: MissionId[] = [];
  const open = (from: MissionId) => {
    for (const u of MISSIONS[from].unlocks) {
      if (s.stages[u] === "locked") { s.stages[u] = "find"; unlocked.push(u); }
      else if (s.stages[u] === "complete") { out.push({ type: "alreadyDone", mission: u }); open(u); }
    }
  };
  if (!early) open(id);
  out.unshift({ type: "completed", mission: id, unlocked, early: early || undefined });
  syncStages(s, carrying.filter((i) => i !== MISSIONS[id].item), false);
  if (s.active === id || s.active === null || s.stages[s.active] === "complete") {
    s.active = nextAvailable(s);
    if (s.active) out.push({ type: "selected", mission: s.active });
  }
  return out;
}

export function nextAvailable(s: MissionState): MissionId | null {
  // prefer one already in delivery, then any open one, in story order
  return MISSION_ORDER.find((id) => s.stages[id] === "deliver") ?? MISSION_ORDER.find((id) => s.stages[id] === "find") ?? null;
}

/** Cycle the active errand among the open ones (the M key). */
export function cycleActive(s: MissionState): MissionId | null {
  const open = MISSION_ORDER.filter((id) => s.stages[id] === "find" || s.stages[id] === "deliver");
  if (!open.length) return (s.active = null);
  const i = s.active ? open.indexOf(s.active) : -1;
  s.active = open[(i + 1) % open.length];
  return s.active;
}

/** Where the objective marker should point for the active errand. */
export function objective(s: MissionState): { mission: MissionId; point: PointId; guide: string } | null {
  if (!s.active) return null;
  const m = MISSIONS[s.active], st = s.stages[s.active];
  if (st === "find") return { mission: m.id, point: m.pickup, guide: m.pickupGuide };
  if (st === "deliver") return { mission: m.id, point: m.drop, guide: m.returnGuide };
  return null;
}

export const allDone = (s: MissionState) => MISSION_ORDER.every((id) => s.stages[id] === "complete");

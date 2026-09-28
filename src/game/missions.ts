/**
 * Pure mission state machine (no three.js, no DOM). Each errand is: find the item, then
 * deliver it. Completing an errand unlocks others, and the next available one is selected
 * automatically so Bill is never missionless (v0.2 behaviour).
 */
import { MISSIONS, MISSION_ORDER, type MissionId, type PointId } from "../content/missions";
import type { ItemId } from "../content/items";

export type Stage = "locked" | "find" | "deliver" | "complete";

export interface MissionState {
  stages: Record<MissionId, Stage>;
  active: MissionId | null;
}

export const newMissionState = (): MissionState => ({
  stages: { cablePilgrimage: "find", stumpProphecy: "locked", dumpsterDiplomacy: "locked" },
  active: "cablePilgrimage",
});

export type MissionEvent =
  | { type: "picked"; mission: MissionId }
  | { type: "completed"; mission: MissionId; unlocked: MissionId[] }
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

/** Which errand could Bill deliver right now at this point, holding these items? */
export function deliverable(s: MissionState, point: PointId, carrying: readonly ItemId[]): MissionId | null {
  for (const id of MISSION_ORDER) {
    const m = MISSIONS[id];
    if (s.stages[id] === "deliver" && m.drop === point && carrying.includes(m.item)) return id;
  }
  return null;
}

export function deliver(s: MissionState, id: MissionId): MissionEvent[] {
  if (s.stages[id] !== "deliver") return [];
  s.stages[id] = "complete";
  const unlocked: MissionId[] = [];
  for (const u of MISSIONS[id].unlocks) if (s.stages[u] === "locked") { s.stages[u] = "find"; unlocked.push(u); }
  const out: MissionEvent[] = [{ type: "completed", mission: id, unlocked }];
  if (s.active === id || s.active === null) {
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

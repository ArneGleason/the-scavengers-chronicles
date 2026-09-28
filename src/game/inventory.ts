import { ITEMS, type ItemId } from "../content/items";

/**
 * Pure inventory rules: a four-slot satchel for small finds, plus both hands for one
 * heavy item. No three.js or DOM here, so it runs in unit tests.
 */
export interface Inventory {
  satchel: ItemId[];
  hands: ItemId | null;
  capacity: number;
}

export type PickupResult =
  | { ok: true; to: "satchel" | "hands" }
  | { ok: false; reason: "satchelFull" | "handsFull" };

export const newInventory = (capacity = 4): Inventory => ({ satchel: [], hands: null, capacity });

export function canPickUp(inv: Inventory, item: ItemId): PickupResult {
  const def = ITEMS[item];
  if (def.carry === "heavy") return inv.hands ? { ok: false, reason: "handsFull" } : { ok: true, to: "hands" };
  // Carrying something heavy doesn't stop him cramming small things into the satchel.
  return inv.satchel.length >= inv.capacity ? { ok: false, reason: "satchelFull" } : { ok: true, to: "satchel" };
}

export function pickUp(inv: Inventory, item: ItemId): PickupResult {
  const r = canPickUp(inv, item);
  if (!r.ok) return r;
  if (r.to === "hands") inv.hands = item;
  else inv.satchel.push(item);
  return r;
}

/** Drops the heavy item first (it's in the way), otherwise the most recent satchel find. */
export function drop(inv: Inventory): ItemId | null {
  if (inv.hands) {
    const h = inv.hands;
    inv.hands = null;
    return h;
  }
  return inv.satchel.pop() ?? null;
}

/** Total carried mass in kg, used to slow him down and make the satchel clank. */
export const carriedMass = (inv: Inventory) =>
  inv.satchel.reduce((m, id) => m + ITEMS[id].mass, 0) + (inv.hands ? ITEMS[inv.hands].mass : 0);

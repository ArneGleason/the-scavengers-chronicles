import type { ItemId, Surface } from "../content/items";

export type GameEvent =
  | { type: "ItemPickedUp"; item: ItemId; to: "satchel" | "hands" }
  | { type: "ItemDropped"; item: ItemId; mass: number }
  | { type: "PickupRefused"; item: ItemId; reason: "satchelFull" | "handsFull" }
  | { type: "Footstep"; surface: Surface; weight: number; hurry: boolean }
  | { type: "Skid"; speed: number }
  | { type: "Landed"; speed: number }
  | { type: "LevelChanged"; level: "ground" | "basement"; inside: boolean }
  | { type: "Bark"; text: string; speaker: "bill" | "narrator"; seconds?: number };

type Handler<T extends GameEvent["type"]> = (e: Extract<GameEvent, { type: T }>) => void;

/** Minimal typed event bus. Logic publishes facts; presentation subscribes. */
export class Events {
  private map = new Map<string, Set<(e: GameEvent) => void>>();

  on<T extends GameEvent["type"]>(type: T, fn: Handler<T>) {
    let set = this.map.get(type);
    if (!set) this.map.set(type, (set = new Set()));
    set.add(fn as (e: GameEvent) => void);
    return () => set!.delete(fn as (e: GameEvent) => void);
  }

  emit(e: GameEvent) {
    this.map.get(e.type)?.forEach((fn) => fn(e));
  }
}

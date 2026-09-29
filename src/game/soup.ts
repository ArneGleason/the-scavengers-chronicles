/**
 * The soup's state (pure): ingredients collected into his pocket, distillations done, and
 * whether it has finally been eaten. See content/soup.ts.
 */
import { DISTILLATIONS, type IngredientId } from "../content/soup";

export interface SoupState {
  distilled: number;
  pocket: IngredientId[];
  found: IngredientId[];
  eaten: boolean;
}

export const newSoup = (): SoupState => ({ distilled: 0, pocket: [], found: [], eaten: false });

/** Picked up an ingredient (each one only once). */
export function collect(s: SoupState, id: IngredientId) {
  if (s.found.includes(id)) return false;
  s.found.push(id);
  s.pocket.push(id);
  return true;
}

export const isReady = (s: SoupState) => s.distilled >= DISTILLATIONS;
export const canDistill = (s: SoupState) => !isReady(s) && s.pocket.length > 0;

/** One distillation: the oldest ingredient in his pocket goes in. */
export function distill(s: SoupState): { ingredient: IngredientId; n: number; ready: boolean } | null {
  if (!canDistill(s)) return null;
  const ingredient = s.pocket.shift()!;
  s.distilled++;
  return { ingredient, n: s.distilled, ready: isReady(s) };
}

export function eat(s: SoupState) {
  if (!isReady(s) || s.eaten) return false;
  s.eaten = true;
  return true;
}

/**
 * The soup (docs/design/gags.md, "Soup"): it's on the stove from the start and it is not ready.
 * Bill's process is the distillation: add an ingredient, stir, photograph it, and send the
 * photo to every contact he has. It takes at least ten. "SOUP FIRST. EVERYTHING ELSE LATER."
 */
import { BASEMENT_Y } from "../world/stairs";

export type IngredientId =
  | "breadHeel" | "dandelion" | "yardSorrel" | "bouillon1987" | "satchelCrouton" | "laneGarlic"
  | "elvisPotato" | "hubcapRain" | "carrot" | "dumpsterOregano" | "mysteryHerb" | "heroicOnion";

export interface IngredientDef {
  name: string;
  /** Where it's waiting (x, y, z); Bill collects it by walking up to it. */
  at: [number, number, number];
  color: string;
  shape: "blob" | "leaf" | "cube" | "stick";
  line: string;
}

export const INGREDIENTS: Record<IngredientId, IngredientDef> = {
  breadHeel: { name: "heel of a crusty loaf", at: [-3.0, 0.8, 2.15], color: "#c98a47", shape: "blob", line: "The heel of a crusty loaf. The soup's structural engineer." },
  dandelion: { name: "backyard dandelion", at: [-7.2, 0, 8.6], color: "#e3c545", shape: "leaf", line: "A backyard dandelion. It is either garnish, medicine, or lawn evidence." },
  yardSorrel: { name: "fence-line sorrel", at: [8.4, 0, 12.8], color: "#9fc45e", shape: "leaf", line: "Fence-line sorrel. The soup accepts yard material without checking credentials." },
  bouillon1987: { name: "bouillon cube from 1987", at: [-3.9, BASEMENT_Y, 3.3], color: "#d8a431", shape: "cube", line: "A bouillon cube from 1987. He calls it vintage. The cube does not argue." },
  satchelCrouton: { name: "sofa crouton", at: [5.45, 0.47, 2.4], color: "#d9a55b", shape: "cube", line: "A crouton from between the sofa cushions. Aged, like a fine archive." },
  laneGarlic: { name: "wild lane garlic", at: [-5.2, 0, 16.1], color: "#eee6d0", shape: "blob", line: "Wild garlic from the laneway. Wild, anyway." },
  elvisPotato: { name: "potato shaped like Elvis", at: [12.9, 0, 16.3], color: "#b98d58", shape: "blob", line: "A potato shaped like Elvis. He will not be taking questions." },
  hubcapRain: { name: "hubcap of rainwater", at: [16.0, 0, 8.2], color: "#8fb0b5", shape: "blob", line: "Rainwater from a hubcap. Municipal terroir." },
  carrot: { name: "carrot of questionable provenance", at: [18.2, 0, 14.6], color: "#e07a2e", shape: "stick", line: "A carrot of questionable provenance. Provenance is a strong word." },
  dumpsterOregano: { name: "dumpster oregano", at: [29.4, 0, 12.4], color: "#6f8f4e", shape: "leaf", line: "Dumpster oregano. Probably oregano." },
  mysteryHerb: { name: "mystery herb", at: [35.5, 0, 12.6], color: "#4f9a6a", shape: "leaf", line: "A mystery herb from behind the gym. It smells like effort." },
  heroicOnion: { name: "heroic onion", at: [8.2, 0.03, -5.8], color: "#c9a0c8", shape: "blob", line: "One heroic onion that escaped the fruit stand. It chose Bill." },
};

export const DISTILLATIONS = 10;
export const CONTACTS = 214;

/** The narrator after each distillation, one per distillation. */
export const DISTILLED_LINES = [
  "Distillation one. The soup is technically soup. Two hundred and fourteen people have been informed.",
  "Distillation two. The group chat has entered its soup era.",
  "Distillation three. A dentist's office has asked to be removed from the soup.",
  "Distillation four. The broth now has what he calls provenance.",
  "Distillation five. Halfway. This soup has been photographed more than most weddings.",
  "Distillation six. It is thicker now, like his argument.",
  "Distillation seven. Rob has muted the chat. Rob has unmuted the chat to ask about the soup.",
  "Distillation eight. The pot is now mostly ingredients and documentation.",
  "Distillation nine. One more. The spoon stands up on its own, out of respect.",
  "Distillation ten. The soup is ready. Nobody has ever been this informed about a soup.",
];

export const SOUP_SAYS = {
  distill: ["For the record.", "Documenting.", "They'll want to see this.", "Witnesses required.", "Another angle. For posterity."],
  collect: ["For the soup.", "Soup business.", "The pot will want this.", "Distillation material."],
  eat: ["SOUP FIRST. EVERYTHING ELSE LATER."],
};

/** Replies from the contacts, pulled a few at a time after each photo goes out. */
export const REPLIES: [string, string][] = [
  ["Rob", "is this the same photo as yesterday"],
  ["Rob", "\u{1F44D}"],
  ["Rob", "when do I get some"],
  ["Rob", "that's the first photo with a different spoon"],
  ["Dentist's office", "Please remove us from this list."],
  ["Unknown number", "who is this"],
  ["Gary", "looks thin"],
  ["Big Wanda", "now THAT is a pot"],
  ["Barber", "that's a lot of soup, Bill"],
  ["Hardware store", "We don't sell soup. We have never sold soup."],
  ["Pizza place", "wrong number but it looks great"],
  ["Bylaw office", "Noted."],
  ["Record store", "is that a Juno-106 in the background"],
  ["Aximandra", "kjjjjjjjjjjjjjj"],
  ["Unknown number", "please stop"],
  ["Rob", "are you ever going to eat it"],
];

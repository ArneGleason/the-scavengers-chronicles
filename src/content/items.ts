/**
 * Item definitions for the walking toy. Names and lines are ported verbatim from the
 * v0.2 prototype (classic/app.js) where they exist.
 */
export type ItemId = "dinCable" | "powerBrick" | "cableBundle" | "speakAndSpell" | "newspaperBundle" | "personalityStump";
export type CarryKind = "satchel" | "heavy";
export type Surface = "carpet" | "linoleum" | "hardwood" | "concrete" | "grass" | "dirt" | "stairs" | "asphalt";

export interface ItemDef {
  id: ItemId;
  name: string;
  shortName: string;
  carry: CarryKind;
  /** kg; drives gait, drop thunk and hit-stop. */
  mass: number;
  color: string;
  accent: string;
  pickupText: string;
  dropText: string;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  dinCable: {
    id: "dinCable",
    name: "Obscure DIN Sync Cable",
    shortName: "DIN Cable",
    carry: "satchel",
    mass: 0.2,
    color: "#30343d",
    accent: "#d8c783",
    pickupText: "Picked up the Obscure DIN Sync Cable. He remembers buying it in 1986 and needing it since 1987.",
    dropText: "He drops the DIN cable, then immediately calls the spot 'temporary cable staging.'",
  },
  powerBrick: {
    id: "powerBrick",
    name: "Questionable Power Brick",
    shortName: "Power Brick",
    carry: "satchel",
    mass: 0.9,
    color: "#39414b",
    accent: "#b8d17b",
    pickupText: "The power brick hums in a way that suggests either voltage or a tiny lawsuit.",
    dropText: "He sets down the power brick and pretends the smell is vintage.",
  },
  cableBundle: {
    id: "cableBundle",
    name: "Mystery Cable Bundle",
    shortName: "Cable Bundle",
    carry: "satchel",
    mass: 1.6,
    color: "#2f3438",
    accent: "#dc8e58",
    pickupText: "Picked up the Mystery Cable Bundle. It wriggles with almost-solutions.",
    dropText: "The cable bundle sprawls into a small, judgemental nest.",
  },
  speakAndSpell: {
    id: "speakAndSpell",
    name: "Antique Speak & Spell",
    shortName: "Speak & Spell",
    carry: "satchel",
    mass: 0.7,
    color: "#b64532",
    accent: "#f2d88a",
    pickupText: "Picked up the Antique Speak & Spell. It says one busted syllable and immediately becomes essential studio gear.",
    dropText: "He sets down the Speak & Spell like a sacred oracle with leaking batteries.",
  },
  newspaperBundle: {
    id: "newspaperBundle",
    name: "Newspaper Bundle",
    shortName: "Newspapers",
    carry: "satchel",
    mass: 2.2,
    color: "#d8c9a3",
    accent: "#5e5545",
    pickupText: "A bundle of newspapers sorted by year, weather event, and whether he was right about something.",
    dropText: "The newspapers land with the thud of an archive that refuses to be thrown away.",
  },
  personalityStump: {
    id: "personalityStump",
    name: "Stump With Personality",
    shortName: "Stump",
    carry: "heavy",
    mass: 18,
    color: "#7b5435",
    accent: "#d1a260",
    pickupText: "Picked up the Stump With Personality. It is heavy with dirt and unearned confidence.",
    dropText: "The stump lands with the confidence of furniture nobody asked for.",
  },
};

/** Quip pools for the walking toy. inventoryFull and inventoryEmpty are verbatim from v0.2; handsFull is new. */
export const QUIPS = {
  inventoryFull: [
    "Inventory full. He briefly considers wearing a cable as a belt, then calls that phase two.",
    "Inventory full. His pockets reject the strategic vision.",
    "No room. He whispers, 'satchel expansion,' like that counts as engineering.",
    "Inventory full. One more object and the bag becomes a legal structure.",
  ],
  handsFull: [
    "His hands are occupied by a stump. The stump outranks everything.",
    "Both hands are committed to the current masterpiece component.",
  ],
  inventoryEmpty: [
    "Inventory empty. The Scavenger has only theories and several overdue projects.",
    "Nothing to drop. Even his cargo has abandoned the agenda.",
    "Inventory empty. He briefly tries to set down a thought, but it rolls away.",
  ],
} as const;

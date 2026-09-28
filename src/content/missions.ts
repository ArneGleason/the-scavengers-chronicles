/**
 * The three starter errands, ported verbatim from the v0.2 prototype (public/classic/app.js).
 * Points are named places in the world (see world/points.ts), not raw coordinates.
 */
import type { ItemId } from "./items";

export type MissionId = "cablePilgrimage" | "stumpProphecy" | "dumpsterDiplomacy";
export type PointId = "basementHoard" | "synthAltar" | "backyardDig" | "shelfZone" | "dumpster";

export interface MissionDef {
  id: MissionId;
  title: string;
  summary: string;
  item: ItemId;
  pickup: PointId;
  drop: PointId;
  pickupLabel: string;
  dropLabel: string;
  pickupGuide: string;
  returnGuide: string;
  completeGuide: string;
  pickupText: string;
  completeText: string;
  unlocks: MissionId[];
}

export const MISSIONS: Record<MissionId, MissionDef> = {
  cablePilgrimage: {
    id: "cablePilgrimage",
    title: "Sacred Cable Pilgrimage",
    summary: "Find the obscure DIN sync cable so the masterpiece can continue not beginning.",
    item: "dinCable",
    pickup: "basementHoard",
    drop: "synthAltar",
    pickupLabel: "DIN sync cable",
    dropLabel: "synth altar",
    pickupGuide: "Search the basement hoard for the obscure DIN sync cable.",
    returnGuide: "Bring the DIN cable to the synth altar. The masterpiece is now only several excuses away.",
    completeGuide: "The cable is installed. Press M to select the next obstacle to genius.",
    pickupText: "Picked up the Obscure DIN Sync Cable. He remembers buying it in 1986 and needing it since 1987.",
    completeText: "Mission complete: the cable fits. No music happens, but the excuse architecture improves.",
    unlocks: ["stumpProphecy", "dumpsterDiplomacy"],
  },
  stumpProphecy: {
    id: "stumpProphecy",
    title: "Stump of Destiny",
    summary: "Dig up a stump with personality and declare it the beginning of a furniture movement.",
    item: "personalityStump",
    pickup: "backyardDig",
    drop: "shelfZone",
    pickupLabel: "personality stump",
    dropLabel: "future shelf zone",
    pickupGuide: "Go to the backyard dig patch and recover the stump with personality.",
    returnGuide: "Bring the stump to the living-room shelf zone before it becomes compost with opinions.",
    completeGuide: "The stump has arrived indoors, which history may not forgive.",
    pickupText: "Picked up the Stump With Personality. It is heavy with dirt and unearned confidence.",
    completeText: "Mission complete: the stump is now furniture-adjacent, which is legally different from garbage.",
    unlocks: [],
  },
  dumpsterDiplomacy: {
    id: "dumpsterDiplomacy",
    title: "Speak & Spell Salvage Duel",
    summary: "Distract a rival rummager and recover antique Speak & Spells from the corner-store dumpster.",
    item: "speakAndSpell",
    pickup: "dumpster",
    drop: "synthAltar",
    pickupLabel: "antique Speak & Spell",
    dropLabel: "synth altar",
    pickupGuide: "Go to the corner-store dumpster, lure the rival rummager away, then sprint back for the antique Speak & Spell.",
    returnGuide: "Bring the Speak & Spell to the synth altar so the masterpiece can be alphabetized before it is avoided.",
    completeGuide: "The Speak & Spell is home. It knows more songs than he has finished.",
    pickupText: "Picked up the Antique Speak & Spell. It says one busted syllable and immediately becomes essential studio gear.",
    completeText: "Mission complete: the synth altar gains a Speak & Spell and a new excuse called 'phonics integration.'",
    unlocks: [],
  },
};

export const MISSION_ORDER: MissionId[] = ["cablePilgrimage", "stumpProphecy", "dumpsterDiplomacy"];

/** v0.2 quip pools for the mission layer and Gary (verbatim). */
export const MISSION_QUIPS = {
  missionSelected: [
    "Active mission: {mission}. {guide}",
    "New official priority: {mission}. {guide}",
    "He has promoted {mission} from vague burden to current burden. {guide}",
  ],
  rummagerTaunt: [
    'Gary the Rummager hisses, "Those talking calculators are mine." He follows just far enough to be exploitable.',
    'Gary snarls, "Back away from the educational plastic." His priorities are tragic but clear.',
    "Gary shadows him, muttering about phonics rights and dumpster jurisdiction.",
    "Gary takes the bait because nothing clouds judgment like a red toy that spells badly.",
  ],
  rummagerBlock: [
    'Gary the Rummager blocks the Speak & Spell: "Back off, phonics vulture." Lure him away, then sprint back.',
    'Gary plants himself in front of the Speak & Spell: "Find your own talking rectangle." Draw him away.',
    "Gary guards the prize with dumpster nobility. Lead him off, then double back.",
    "Gary refuses access to the alphabet. Distract the man, then rob the concept of learning.",
  ],
} as const;

/** Short lines Gary says out loud in his balloon (new, in the spirit of the v0.2 quips). */
export const GARY_SAYS = {
  follow: ["Those talking calculators are mine.", "Back away from the educational plastic.", "Dumpster jurisdiction. Look it up."],
  block: ["Back off, phonics vulture.", "Find your own talking rectangle."],
  decoy: ["Is that... humming? Is that for me?", "Finders keepers. Brick edition."],
  lost: ["My alphabet!", "That was spelled M-I-N-E."],
} as const;

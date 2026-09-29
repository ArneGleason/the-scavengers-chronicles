/**
 * The three starter errands, ported verbatim from the v0.2 prototype (public/classic/app.js).
 * Since the comedy direction (docs/design/comedy.md) they run in a straight line:
 * cable, then stump, then Speak & Spell.
 * Points are named places in the world (see world/points.ts), not raw coordinates.
 */
import type { ItemId } from "./items";

export type MissionId = "cablePilgrimage" | "stumpProphecy" | "dumpsterDiplomacy" | "grateShelf" | "grateVault";
export type PointId = "basementHoard" | "synthAltar" | "backyardDig" | "shelfZone" | "dumpster" | "junkyard" | "workbench" | "vault";

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
    unlocks: ["stumpProphecy"],
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
    unlocks: ["dumpsterDiplomacy"],
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
    unlocks: ["grateShelf"],
  },
  // errand 4 has two legs in v0.2; here each leg is its own step under the same title
  grateShelf: {
    id: "grateShelf",
    title: "Grate Shelf Revelation",
    summary: "Turn junkyard metal into an antique-vault shelf because buying shelves is how they get you.",
    item: "rustyGrate",
    pickup: "junkyard",
    drop: "workbench",
    pickupLabel: "rusty floor grate",
    dropLabel: "workbench",
    pickupGuide: "Big Wanda's Junkyard is open. Find a rusty floor grate with shelf potential.",
    returnGuide: "Bring the rusty grate to the workbench so he can convert danger into decor.",
    completeGuide: "Pick up the visionary grate shelf from the workbench.",
    pickupText: "Picked up the Rusty Floor Grate. It has a pattern, a smell, and a tetanus narrative.",
    completeText: "Stage complete: the grate becomes a shelf after three minutes of hammering and forty years of theory.",
    unlocks: ["grateVault"],
  },
  grateVault: {
    id: "grateVault",
    title: "Grate Shelf Revelation",
    summary: "Turn junkyard metal into an antique-vault shelf because buying shelves is how they get you.",
    item: "grateShelf",
    pickup: "workbench",
    drop: "vault",
    pickupLabel: "grate shelf",
    dropLabel: "antique vault",
    pickupGuide: "Pick up the visionary grate shelf from the workbench.",
    returnGuide: "Install the grate shelf in the antique vault, where sharp edges become provenance.",
    completeGuide: "The vault shelf is installed. Several antiques now fear for their finish.",
    pickupText: "Picked up the Visionary Grate Shelf. It is mostly rust plus thesis statement.",
    completeText: "Mission complete: the grate shelf is installed with the confidence of a man banned from furniture stores.",
    unlocks: [],
  },
};

export const MISSION_ORDER: MissionId[] = ["cablePilgrimage", "stumpProphecy", "dumpsterDiplomacy", "grateShelf", "grateVault"];

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
  /** Escalating nags when the player dawdles (v0.2 verbatim; "{direction}" is a screen direction here). */
  guidance: {
    1: [
      'Helpful nudge: go {direction} toward {target}. The Scavenger calls this "field research" because "wandering" sounds taxable.',
      "The objective is {direction}: {target}. He has been circling it like a man testing carpet density.",
      "Small hint, enormous implication: {target} is {direction}.",
    ],
    2: [
      "Still looking? {target} remains {direction}. It has not moved; unlike his standards, it is stable.",
      "{target} continues being {direction}, about {paces} paces away, despite his commitment to avoidance.",
      "The guide would like to remind everyone that {target} is not a philosophical concept. It is {direction}.",
    ],
    3: [
      "The help system has escalated to theatre. {target} is {direction}, roughly {paces} paces away. The game is short. Help it end.",
      "Emergency clarity: {target}, {direction}, {paces} paces. Even the soup understands this route.",
      "At this point the glowing marker is basically doing community service. Go {direction} to {target}.",
    ],
  },
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
  tug: ["Mine! MINE!", "Let go of my alphabet!", "Dumpster law!"],
  gag: ["HURK! My eyes!", "What did you EAT?", "That's a bylaw violation!"],
  won: ["Phonics stays with Gary.", "Educational plastic: one. You: zero."],
  binned: ["I meant to do this.", "It's warmer in here anyway.", "Nobody look at me.", "Found a sandwich. Never mind."],
  insults: ["Forty years and not one song!", "Dumpster law, soup boy!", "You smell like minestrone!", "It spells better than you!", "Finders keepers, cable weepers!", "Your satchel's a fire hazard!", "Go write your masterpiece. Oh, wait."],
} as const;

/** The narrator after each synth take ({n} is the take number). */
export const JAM_LINES = [
  "Take {n}. The masterpiece remains two notes long. The third is under investigation.",
  "Take {n}: two notes of genius and one note of hardware failure, according to the artist.",
  "Take {n}. The keyboard has been blamed. The keyboard has been blamed before.",
  "Take {n}. Forty years of preparation, three notes, one grievance filed against a synthesizer.",
] as const;

/** Big Wanda's lines, from the v0.2 pools where they fit (her admiration is for his salvage taste). */
export const WANDA_SAYS = {
  intro: ["Big Wanda's Junkyard is open. Down the lane, a trailer door bangs like a warning made of plywood."],
  admire: ["There he is, my magnificent little scrap prophet.", "I admire a man who looks at garbage and sees furniture.", "Come let Wanda catalogue your pockets."],
  chase: ["Quit running, antique snack!", "I have a trailer, a label maker, and feelings bigger than zoning allows!", "That grate is catalogued, sweetie!"],
  applaud: ["Now THAT'S a digestive system.", "Bravo! Bravo!", "What a man. What a smell."],
  caught: ["Gotcha. Catalogued.", "Lot number forty-seven: one scrap prophet."],
  toss: ["Come back anytime!", "Same time tomorrow!"],
  gaveUp: ["He'll be back. They always come back for the grates."],
} as const;

/** Bill's lines for the slapstick layer (docs/design/comedy.md). */
export const BILL_GAGS = {
  rake: ["Who left a rake there? I left a rake there.", "That rake has been waiting since 1994.", "Garden... ambush."],
  board: ["Wheels! I have wheels!", "Nobody tell my knees.", "I am the wind."],
  wipeout: ["Nobody saw that.", "Planned dismount.", "The board and I have agreed to see other people."],
  bonk: ["Wall.", "Who moved the fence?"],
  poop: ["Is it raining? It is not raining.", "A review. Of my hair.", "That's good luck. Somewhere."],
  gust: ["My architecture!", "Don't look at the scaffolding."],
  nose: ["Just auditing.", "Quality control."],
  burp: ["Soup's still with me.", "Pardon the bouillon."],
  trip: ["Nobody saw that.", "Gravity's been extra lately.", "The ground started it."],
  noGas: ["Running on fumes. Literally.", "The soup is still processing."],
  stumpStart: ["Come to Bill.", "You have presence. You also have roots."],
  duelStart: ["Unhand my phonics!", "It's for the masterpiece!"],
  duelLost: ["I let him have that one.", "He's been training."],
  hoardStart: ["It's in here. It's always in here.", "Archive, reveal yourself."],
  hoardFinds: ["NOT IT!", "A BOOT?", "TV GUIDE '84", "ANOTHER CABLE", "WRONG DIN", "RECEIPT (1991)", "LAMPSHADE", "MORE NEWSPAPER", "A SMALLER BOOT"],
  fridge: ["The last properly made one.", "They don't make them like this. They don't make them at all."],
  fridgeAfter: ["See?", "See? Useful."],
  toast: ["Toast. The 1955 way.", "A toaster that has outlived three governments."],
  adapters: ["ADAPTERS.", "It says ADAPTERS."],
  adaptersAfter: ["Still. Adapters.", "Keeping all of them."],
  blurt: ["That wasn't me.", "The satchel is composing.", "Noted. Unreleased."],
  snag: ["The cable has concerns.", "It wants to go back."],
  paper: ["I was going to file those.", "The archive follows me. As it should."],
  insults: ["You'll be hearing from my legal department.", "Cease and desist, dumpster man.", "Unhand it, you phonics goblin.", "You rummage like an amateur.", "My counsel is a cat and she'd beat you.", "That's evidence you're touching.", "You smell like recycling day."],
  jamStart: ["From the top.", "This is the one.", "Okay. Now with feeling.", "Quiet, everyone. Genius is happening."],
  jamExcuse: ["Genius. This keyboard can't capture it.", "It needs more parameters. More dynamics.", "The gear isn't ready for me.", "That third note was the synth's fault. Clearly.", "Too much genius for sixty-one keys.", "The velocity curve is wrong. I'm not."],
} as const;

/**
 * Bill's one-liners about where he is (docs/design/gags.md, "Musings"): each area has its own,
 * said a second or two after he arrives (not too often), and each errand step has a hint he
 * mutters when the player has stalled. Pure data plus a pure zone lookup, so it's unit-tested.
 */
import type { MissionId } from "./missions";

export type Zone =
  | "hoard" | "altar" | "basement" | "kitchen" | "livingRoom" | "frontHall"
  | "digPatch" | "workbench" | "backyard" | "frontYard" | "kevins" | "acrossStreet" | "road" | "sidewalk"
  | "lane" | "lot" | "storeYard" | "store" | "gym" | "gymYard" | "junkyard";

interface ZoneDef { id: Zone; x0: number; x1: number; z0: number; z1: number; basement?: boolean }

/** Most specific first. Numbers match world/: estate, street, route, junkyard. */
const ZONES: ZoneDef[] = [
  { id: "hoard", x0: -3.6, x1: -0.4, z0: -0.6, z1: 2.4, basement: true },
  { id: "altar", x0: -4.8, x1: 0.4, z0: -5, z1: -3, basement: true },
  { id: "basement", x0: -6, x1: 6, z0: -5, z1: 5, basement: true },
  { id: "kitchen", x0: -6, x1: -1, z0: 0, z1: 5 },
  { id: "livingRoom", x0: -1, x1: 6, z0: 0, z1: 5 },
  { id: "frontHall", x0: -6, x1: 6, z0: -5, z1: 0 },
  { id: "digPatch", x0: -4.8, x1: -1.2, z0: 8.8, z1: 12.2 },
  { id: "workbench", x0: 6.6, x1: 9, z0: 7, z1: 9.6 },
  { id: "backyard", x0: -11, x1: 11, z0: 5, z1: 15 },
  { id: "frontYard", x0: -11, x1: 11, z0: -11, z1: -5 },
  { id: "kevins", x0: -3.6, x1: 4, z0: -27, z1: -19 },
  { id: "acrossStreet", x0: -14, x1: 64, z0: -27, z1: -19 },
  { id: "road", x0: -14, x1: 64, z0: -19, z1: -13 },
  { id: "sidewalk", x0: -14, x1: 64, z0: -13, z1: -5 },
  { id: "lane", x0: -14, x1: 64, z0: 15.6, z1: 20 },
  { id: "lot", x0: 12.5, x1: 21.5, z0: -5.2, z1: 15.5 },
  { id: "storeYard", x0: 22, x1: 31, z0: 9.5, z1: 15.6 },
  { id: "store", x0: 22, x1: 31, z0: -5.2, z1: 9.5 },
  { id: "gym", x0: 32, x1: 40, z0: -5.2, z1: 10 },
  { id: "gymYard", x0: 31, x1: 43, z0: 10, z1: 15.6 },
  { id: "junkyard", x0: 43, x1: 64, z0: -5, z1: 15 },
];

export function zoneOf(p: { x: number; y: number; z: number }): Zone | null {
  const below = p.y < -1;
  for (const z of ZONES) if (!!z.basement === below && p.x > z.x0 && p.x < z.x1 && p.z > z.z0 && p.z < z.z1) return z.id;
  return null;
}

export const MUSINGS: Record<Zone, readonly string[]> = {
  hoard: ["The archive. Don't call it a pile.", "Everything I need is in here. Under everything else I need.", "Nineteen eighty-four is in here somewhere. The newspapers, I mean."],
  altar: ["The altar. Forty years of preparation. Any day now.", "Sacred ground. Please don't put drinks on it.", "The masterpiece starts here. It's been starting here since 1986."],
  basement: ["My studio. Technically a basement. Spiritually, Abbey Road.", "It smells like 1986 down here. In a good way. Mostly.", "Every cable here is essential. Especially the ones I can't identify.", "The bulb flickers. That's ambience."],
  kitchen: ["My mother's kitchen. I've changed nothing. That's curation.", "BILL ONLY. It's on the bowl. It's legally binding.", "The toaster is from 1955. It still works. It still hates me.", "Formica. They don't make it like this. They don't make it at all.", "The fridge is a filing system. For ideas. And cheese."],
  livingRoom: ["The future shelf zone. It's taped. That makes it official.", "The synth by the window. For when inspiration strikes. It hasn't. But it could.", "Every newspaper in here is a primary source.", "This sofa has seen things. Mostly me, lying down, preparing."],
  frontHall: ["Bill's Legal Department. Open by appointment. And also always.", "The vault. Antiques. Don't breathe on them. I breathe on them.", "The stairs down. To the altar. Mind the fourth step. The fourth step is a lawsuit."],
  digPatch: ["The dig patch. Everything valuable is buried eventually.", "Stumps with personality. Rare. Like me."],
  workbench: ["Salvage transformation. Outdoors. Like the Renaissance, if they'd had a tarp.", "Everything's a shelf if you hit it long enough."],
  backyard: ["The back yard. Some call it overgrown. I call it rewilded.", "Soup ingredients grow wild out here. Allegedly.", "Aximandra's out here somewhere, judging me.", "Garden furniture. It was furniture once. Now it's garden."],
  frontYard: ["The front yard. Wild on purpose. It's a statement. The statement is 'go away'.", "These weeds are older than some of my cables.", "KEEP OFF THE ARCHIVE. I wrote the sign. It's a good sign.", "A bathtub planter. Classic. Nobody appreciates classic anymore."],
  kevins: ["Kevin's house. Media mogul. He just doesn't dress like it.", "A doorbell camera. He's in media. He knows how to frame a shot.", "Kevin owes me. He doesn't know it yet, but he owes me."],
  acrossStreet: ["The other side of the street. Nice porches. No archive to speak of.", "Their front yards are mowed. Conformists."],
  road: ["A residential street. Some of us reside.", "Look both ways. Then look again. Then once more, for the archive."],
  sidewalk: ["My sidewalk. Technically the city's. Morally mine.", "If a jogger comes by, I'll be ready.", "I can hear the gym from here. I can hear it from everywhere."],
  lane: ["The laneway. Where the good bins are.", "LANE S BILL E SOUP. It's a sign. Literally.", "Garbage day is a holiday, if you know how to look."],
  lot: ["A parking lot. Forty cars' worth of nothing interesting.", "Somebody's parked in the spot I imagine is mine."],
  storeYard: ["Gary's territory. The dumpster of destiny.", "Smells like cardboard and competition."],
  store: ["The corner store. Milk and lottery tickets. Hope, and more hope."],
  gym: ["It smells like effort in here. Other people's.", "Nobody needs to lift things this often. Except cables."],
  gymYard: ["The Lug Nutz. I can hear their protein from here.", "Every grunt is a noise complaint waiting to happen."],
  junkyard: ["Wanda's place. She has taste. Terrifying taste.", "Everything here is somebody's future shelf.", "No browsing, it says. I don't browse. I curate."],
};

/** What he mutters when the player's stalled: one or two lines per errand step. */
export const HINTS: Partial<Record<MissionId, { find: readonly string[]; deliver: readonly string[] }>> = {
  cablePilgrimage: { find: ["The cable's downstairs. In the hoard. It's always in the hoard.", "Basement. Hoard. Dig."], deliver: ["The cable goes on the altar. In the basement. Where else."] },
  stumpProphecy: { find: ["The stump's out back in the dig patch. It has roots. And opinions."], deliver: ["The living room. The taped-off future shelf zone. By the sofa."] },
  dumpsterDiplomacy: { find: ["The Speak & Spell's behind the corner store. Down the lane. Gary's guarding it.", "Gary won't let go of it. A toot might help. Morally."], deliver: ["The Speak & Spell goes on the altar. Down in the basement."] },
  grateShelf: { find: ["Wanda's junkyard is at the end of the lane. The grate's inside. So is Wanda.", "Grab the grate and hurry. If she lunges, toot."], deliver: ["The workbench. Out back. Past the tree."] },
  grateVault: { find: ["The shelf's on the workbench, out back."], deliver: ["The vault's in the front hall. The shelf goes on top."] },
  noiseComplaint: { find: ["The typewriter's in the front hall. My legal department."], deliver: ["The gym's down the street. I can hear it from here. Obviously."] },
  parcelProtection: { find: ["Kevin's parcels are on his stoop. Across the street. Unprotected."], deliver: ["My front stoop. For safekeeping. Through the front gate."] },
  thePitch: { find: ["The movie ideas are by the fridge. In the kitchen."], deliver: ["Kevin's door. Across the street. He's expecting me. He isn't."] },
  theManuscript: { find: ["Captain Caffeine is on the kitchen table. My novel. The first page is excellent."], deliver: ["Kevin's door. Across the street. He's in media. Basically publishing."] },
};

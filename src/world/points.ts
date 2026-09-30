import * as THREE from "three/webgpu";
import type { PointId } from "../content/missions";
import type { ItemId } from "../content/items";
import { BASEMENT_Y } from "./stairs";
import { PRIZE_AT } from "./route";
import { GRATE_AT } from "./junkyard";
import { WORKBENCH_AT, TYPEWRITER_AT, STICKY_AT, MANUSCRIPT_AT } from "./props";
import { BILL_STOOP, KEVIN_STOOP } from "./street";

/**
 * Named places the missions refer to. Pickup points are only a fallback for the marker (it
 * normally follows the item itself); drop points are where Bill stands to deliver.
 */
export const POINTS: Record<PointId, { at: THREE.Vector3; reach: number }> = {
  basementHoard: { at: new THREE.Vector3(-2.0, BASEMENT_Y, 0.8), reach: 1.2 },
  synthAltar: { at: new THREE.Vector3(-2.3, BASEMENT_Y, -3.7), reach: 1.7 },
  backyardDig: { at: new THREE.Vector3(-3.0, 0, 10.5), reach: 1.4 },
  shelfZone: { at: new THREE.Vector3(4.1, 0, 0.8), reach: 1.5 },
  dumpster: { at: PRIZE_AT.clone(), reach: 1.2 },
  junkyard: { at: GRATE_AT.clone(), reach: 1.3 },
  workbench: { at: WORKBENCH_AT.clone(), reach: 1.3 },
  vault: { at: new THREE.Vector3(-3.7, 0, -3.85), reach: 1.4 },
  typewriter: { at: TYPEWRITER_AT.clone(), reach: 1.2 },
  gymDoor: { at: new THREE.Vector3(35.4, 0, 11.0), reach: 1.7 },
  kevinStoop: { at: KEVIN_STOOP.clone(), reach: 1.4 },
  billStoop: { at: BILL_STOOP.clone(), reach: 1.4 },
  stickyWall: { at: STICKY_AT.clone().setY(0), reach: 1.2 },
  kevinDoor: { at: KEVIN_STOOP.clone(), reach: 1.6 },
  kitchenTable: { at: MANUSCRIPT_AT.clone().setY(0), reach: 1.3 },
};

/** Where each delivered item ends up in the house, and which way it faces. */
export const INSTALL: Partial<Record<ItemId, { at: THREE.Vector3; rotY: number }>> = {
  dinCable: { at: new THREE.Vector3(-2.5, BASEMENT_Y + 0.84, -4.42), rotY: 0.3 },
  speakAndSpell: { at: new THREE.Vector3(-0.35, BASEMENT_Y + 1.6, -4.5), rotY: 0.15 },
  personalityStump: { at: new THREE.Vector3(4.1, 0.14, 0.62), rotY: 0.6 },
  // the grate goes on the workbench to be hammered; the shelf goes on top of the antique vault
  rustyGrate: { at: new THREE.Vector3(WORKBENCH_AT.x, 0.96, WORKBENCH_AT.z + 0.95), rotY: 0 },
  grateShelf: { at: new THREE.Vector3(-3.7, 2.22, -4.67), rotY: 0 },
  // the complaint becomes the gym's doormat; the parcels sit on Bill's stoop; the ideas end up on Kevin
  complaint: { at: new THREE.Vector3(35.4, 0.03, 10.75), rotY: 0.2 },
  parcels: { at: new THREE.Vector3(-0.1, 0.42, -5.65), rotY: 0.35 },
  movieIdeas: { at: new THREE.Vector3(0.9, 0.44, -24.3), rotY: 0.4 },
  manuscript: { at: new THREE.Vector3(-0.6, 0.39, -24.5), rotY: -0.3 },
};

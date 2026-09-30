/**
 * The commemorative photograph at the end of each errand: Bill sets the self-timer, strikes a
 * pose beside what he's achieved, and sends the result to all his contacts. The picture is a
 * real frame from the game; these are the captions, and the replies that come back.
 */
import type { MissionId } from "./missions";

export type PhotoKey = MissionId | "soup" | "kids" | "favours";

export interface PhotoDef {
  /** Handwritten under the photo. */
  caption: string;
  /** Bill, just before the timer goes. */
  pose: string;
  replies: [string, string][];
  narrator: string;
}

export const PHOTOS: Partial<Record<PhotoKey, PhotoDef>> = {
  cablePilgrimage: {
    caption: "Exhibit A: the cable, reunited with its purpose (pending).",
    pose: "Historic moment. Hold still, history.",
    replies: [["Rob", "is that the same cable from 1986"], ["Record store", "that's just a MIDI cable, Bill"], ["Dentist's office", "Please stop."]],
    narrator: "He commemorates the cable with a photograph. Two hundred and fourteen people now know about the cable.",
  },
  stumpProphecy: {
    caption: "The Stump of Destiny. Furniture-adjacent. Legally not garbage.",
    pose: "A movement begins. Smile, stump.",
    replies: [["Rob", "is that a stump in your living room"], ["Barber", "nice stool"], ["Unknown number", "why"]],
    narrator: "The stump is photographed for the record. The record now includes a stump.",
  },
  dumpsterDiplomacy: {
    caption: "Phonics integration. (Gary not pictured. Gary is in a bin.)",
    pose: "For the archive. Say 'phonics'.",
    replies: [["Gary", "that's MY alphabet"], ["Rob", "it just said E at me"], ["Hardware store", "We don't fix those."]],
    narrator: "The Speak & Spell poses on the CRT like it has an agent.",
  },
  grateVault: {
    caption: "The Visionary Grate Shelf. Mid-century. Mostly rust.",
    pose: "Gallery opening. Nobody touch it.",
    replies: [["Big Wanda", "I KNEW that grate had a future"], ["Rob", "is that from a sewer"], ["Unknown number", "tetanus is real, Bill"]],
    narrator: "The shelf is photographed from its good side. It does not have a good side.",
  },
  noiseComplaint: {
    caption: "Complaint delivered. The Lug Nutz were very supportive. (The complaint is now a doormat.)",
    pose: "For the file. Nobody flex.",
    replies: [["The Lug Nutz", "good letter bill"], ["Bylaw office", "Noted."], ["Rob", "did they read it"]],
    narrator: "He photographs the gym's new doormat. It is his complaint. He considers this a partial victory.",
  },
  parcelProtection: {
    caption: "Parcels in protective custody. Kevin is away. (Kevin is not away.)",
    pose: "Neighbourly. Say 'custody'.",
    replies: [["Kevin", "have you seen my packages"], ["Unknown number", "that's theft, Bill"], ["Rob", "lol"]],
    narrator: "He photographs the parcels on his stoop, and sends it to everyone, including Kevin.",
  },
  thePitch: {
    caption: "The Pitch. Kevin is taking it to the top. (Kevin runs social media for a mattress store.)",
    pose: "Hollywood, get ready.",
    replies: [["Kevin", "please stop putting notes on my car"], ["Rob", "which idea did he like"], ["Sleep Barn Mattresses", "who is this"]],
    narrator: "He photographs Kevin under the sticky notes. It is the first time his ideas have been seen by anyone in media.",
  },
  theManuscript: {
    caption: "Captain Caffeine: submitted. Kevin is reading it. (Kevin is not reading it.)",
    pose: "A literary moment. Hold still.",
    replies: [["Kevin", "Got it Bill!! Reading it now"], ["Rob", "is it the sticky notes"], ["Unknown number", "who is captain caffeine"]],
    narrator: "He photographs the manuscript in Kevin's hands. Kevin is holding it the way you'd hold a live crab.",
  },
  kids: {
    caption: "Life lesson: acknowledged. One of them said the vinegar thing works. (Tenure.)",
    pose: "Class photo. Everybody say 'Tarkus'.",
    replies: [["Former student", "who sent this"], ["Rob", "are those your students"], ["Dentist's office", "Please stop."]],
    narrator: "He sends a class photo to everyone. The class did not agree to a class photo.",
  },
  favours: {
    caption: "Favours Kevin owes me: three and counting. Fame: imminent.",
    pose: "The ledger. For the record.",
    replies: [["Kevin", "thanks bill!!"], ["Rob", "what favours"], ["Big Wanda", "you can do favours for ME"]],
    narrator: "Kevin now owes Bill three favours, by Bill's count. Kevin's count is zero, and he'd like his packages back.",
  },
  soup: {
    caption: "Distillation eleven: consumed.",
    pose: "The final distillation. For posterity.",
    replies: [["Rob", "FINALLY"], ["Dentist's office", "Congratulations. Please stop."], ["All 214 contacts", "finally"]],
    narrator: "The empty pot is photographed and sent to everyone. It is the most-liked photo he has ever sent. It is the only liked photo he has ever sent.",
  },
};

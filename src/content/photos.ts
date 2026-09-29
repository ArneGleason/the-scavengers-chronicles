/**
 * The commemorative photograph at the end of each errand: Bill sets the self-timer, strikes a
 * pose beside what he's achieved, and sends the result to all his contacts. The picture is a
 * real frame from the game; these are the captions, and the replies that come back.
 */
import type { MissionId } from "./missions";

export type PhotoKey = MissionId | "soup";

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
  soup: {
    caption: "Distillation eleven: consumed.",
    pose: "The final distillation. For posterity.",
    replies: [["Rob", "FINALLY"], ["Dentist's office", "Congratulations. Please stop."], ["All 214 contacts", "finally"]],
    narrator: "The empty pot is photographed and sent to everyone. It is the most-liked photo he has ever sent. It is the only liked photo he has ever sent.",
  },
};

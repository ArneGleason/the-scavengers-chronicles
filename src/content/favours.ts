/**
 * Kevin's favours (docs/design/areas/the-street.md): once Bill has given him the Captain Caffeine
 * manuscript, Kevin keeps sending him on pointless errands to get rid of him. Bill takes every
 * one seriously, because every favour means Kevin owes him more, and Kevin is in media.
 * "go" favours finish on arrival; "wait" favours need him to stand there for a while.
 */
export interface FavourDef {
  ask: string;
  guide: string;
  at: [number, number, number];
  label: string;
  kind: "go" | "wait";
  secs?: number;
  reach: number;
  /** Title for the waiting meter. */
  waiting?: string;
  done: string;
  narrator: string;
}

export const FAVOURS: FavourDef[] = [
  {
    ask: "Could you keep an eye out for a delivery van? From your stoop. For a while.",
    guide: "Watch for Kevin's delivery van from your own front stoop.",
    at: [-0.7, 0, -6.1], label: "YOUR STOOP", kind: "wait", secs: 12, reach: 1.3, waiting: "WATCHING FOR VANS...",
    done: "No van. Nothing got past me.",
    narrator: "Bill watches the street with the intensity of a lighthouse. No van comes. Kevin is very grateful, from indoors.",
  },
  {
    ask: "Hey, could you count the parked cars on the street? For... a thing.",
    guide: "Count the cars parked on the street, all the way to the east end.",
    at: [61, 0, -16], label: "END OF THE STREET", kind: "go", reach: 3,
    done: "Nine cars. I counted one twice, for accuracy.",
    narrator: "Bill counts nine cars. He writes it on a sticky note, for the novel.",
  },
  {
    ask: "Could you ask the gym guys what time it is? My phone's... dead.",
    guide: "Ask the Lug Nutz what time it is.",
    at: [35.4, 0, 11.4], label: "LUG NUTZ", kind: "go", reach: 2,
    done: "It's leg day. I'll tell him.",
    narrator: "The Lug Nutz report that it is leg day. It is always leg day.",
  },
  {
    ask: "Would you mind checking whether the corner store has left-handed scissors?",
    guide: "Check the corner store for left-handed scissors (the front door, on the street).",
    at: [25.5, 0, -6.4], label: "CORNER STORE", kind: "go", reach: 1.7,
    done: "They have scissors. Their handedness is unclear.",
    narrator: "The corner store has scissors. The clerk declines to discuss which hand they're for.",
  },
  {
    ask: "Could you stand guard by my recycling bin? Just for a bit.",
    guide: "Guard Kevin's recycling bin, beside his front yard.",
    at: [4.4, 0, -22.2], label: "KEVIN'S BIN", kind: "wait", secs: 10, reach: 1.3, waiting: "GUARDING THE RECYCLING...",
    done: "Nobody touched it. I made sure.",
    narrator: "Bill guards the recycling like the crown jewels. The crown jewels are a pizza box.",
  },
  {
    ask: "Hey, could you find out what the junkyard lady wants for a bent spoon?",
    guide: "Ask Big Wanda, at her gate on the lane, what she wants for a bent spoon.",
    at: [48, 0, 16.6], label: "JUNKYARD GATE", kind: "go", reach: 1.8,
    done: "She wants my satchel. Negotiations continue.",
    narrator: "Big Wanda will trade a bent spoon for Bill's satchel. Bill tells himself this is progress.",
  },
  {
    ask: "Could you water my plant? The one by the door.",
    guide: "Water Kevin's plant, beside his front door.",
    at: [-1.4, 0, -23.6], label: "KEVIN'S PLANT", kind: "wait", secs: 5, reach: 1.3, waiting: "WATERING...",
    done: "It's plastic. I watered it anyway. That's commitment.",
    narrator: "The plant is plastic. Bill waters it thoroughly. It is the best-watered plastic plant on the street.",
  },
  {
    ask: "You know what would really help? Go and stand at the end of the lane for a bit.",
    guide: "Stand at the west end of the lane for a bit. Kevin says it helps.",
    at: [-11.8, 0, 17.6], label: "END OF THE LANE", kind: "wait", secs: 8, reach: 1.6, waiting: "STANDING THERE...",
    done: "I stood there. It mattered. He'll owe me.",
    narrator: "Bill stands at the end of the lane. It helps Kevin enormously, in the sense that Bill is not at Kevin's door.",
  },
];

export const KEVIN_FAVOUR_SAYS = {
  more: ["Actually, one more thing.", "You know what? I've got another one.", "Oh! While you're here..."],
  thanks: ["Oh. You... did it.", "Wow. Okay. Great.", "Bill, that's... so thorough.", "Right. Thanks. Really."],
  bill: ["Consider it done. You owe me.", "Leave it with me. That's another one you owe me.", "On it. Keep a tally."],
} as const;

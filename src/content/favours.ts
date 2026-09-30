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
  // round 2 of the outside brainstorm
  { ask: "Could you check how far my gate opens? From over there.", guide: "Stand well back from Kevin's gate while he checks how far it opens.", at: [-2.5, 0, -19.8], label: "BY KEVIN'S GATE", kind: "wait", secs: 5, reach: 1.4, waiting: "A BOUNDARY STUDY...", done: "A boundary study. Complete.", narrator: "While Bill studies the boundary, Kevin slips inside and locks it." },
  { ask: "Tell me if that sign in my window falls down.", guide: "Watch Kevin's front window for a sign that isn't there.", at: [2.5, 0, -21.8], label: "KEVIN'S WINDOW", kind: "wait", secs: 9, reach: 1.5, waiting: "PREVENTIVE OVERSIGHT...", done: "It did not fall. There was no sign. Oversight successful.", narrator: "Nothing falls, because nothing is there. Bill logs it as a success." },
  { ask: "Which bit of the parking lot sounds quietest? For... acoustics.", guide: "Find the quietest bit of the parking lot.", at: [17, 0, 1.5], label: "PARKING LOT", kind: "go", reach: 2.5, done: "I have mapped the silence. It's all the same silence.", narrator: "Bill stamps on three patches of asphalt. They make the same scrape. He writes down all three." },
  { ask: "Could you see if there's a queue at the corner store?", guide: "Check the corner store for a queue.", at: [25.5, 0, -6.4], label: "CORNER STORE", kind: "go", reach: 1.7, done: "Public demand assessed. There is no public.", narrator: "There is no queue. Bill photographs the lack of a queue and sends it to 214 people." },
  { ask: "Is it cloudy at the other end of the lane, too?", guide: "Go and see whether it's cloudy at the east end of the lane.", at: [40, 0, 17.6], label: "EAST END OF THE LANE", kind: "go", reach: 2, done: "Cloudy. A second opinion confirms the first.", narrator: "It is cloudy there as well. Kevin receives this news through a closed door." },
  { ask: "Could you check whether the bell on the junkyard fence works?", guide: "Try the bell on Big Wanda's fence, by her gate.", at: [45.5, 0, 16], label: "WANDA'S BELL", kind: "go", reach: 1.6, done: "It clunks. The communications audit is complete.", narrator: "The bell is not attached to anything. It makes a sad clunk. Somewhere, Wanda says 'Hello?'" },
  { ask: "Make sure the lines in the parking lot are still there.", guide: "Make sure the parking lot's lines are still there.", at: [15.2, 0, 10], label: "PARKING LINES", kind: "wait", secs: 6, reach: 2, waiting: "CONTINUITY CHECK...", done: "Continuity confirmed. All lines present.", narrator: "Bill counts the same three lines several times. They remain, as lines do." },
  { ask: "Could you practise leaving after ringing? My doorbell. For deliveries.", guide: "Stand at the bottom of Kevin's stoop and practise leaving after ringing.", at: [0.2, 0, -22.4], label: "KEVIN'S DOORBELL", kind: "wait", secs: 5, reach: 1.3, waiting: "RING. LEAVE. RING. LEAVE...", done: "Finally, a clear brief.", narrator: "Bill practises ringing and leaving. He is especially good at ringing." },
];

/** Kevin, very nearly admitting that the favours are to get rid of him; and Bill, missing it. */
export const KEVIN_ADMITS: [string, string][] = [
  ["I just need you out of... outside. More exterior work.", "The project expands."],
  ["You don't have to report back.", "You trust my discretion."],
  ["I do mattress posts, Bill.", "A platform."],
];

export const KEVIN_FAVOUR_SAYS = {
  more: ["Actually, one more thing.", "You know what? I've got another one.", "Oh! While you're here..."],
  thanks: ["Oh. You... did it.", "Wow. Okay. Great.", "Bill, that's... so thorough.", "Right. Thanks. Really."],
  bill: ["Consider it done. You owe me.", "Leave it with me. That's another one you owe me.", "On it. Keep a tally."],
} as const;

# Gag Catalogue

The backlog of gags and mini-games, and what's built. Rules and pacing live in [comedy.md](comedy.md); this file is the list.

**Sources:**
- The first pass (rake, skateboard, toot dash, ambient gags) came out of `comedy.md`.
- On 29 September 2026 an outside brainstorm (ChatGPT, fed [briefs/gag-brainstorm.md](briefs/gag-brainstorm.md)) added about 30 gags and 16 mini-games. Numbers like **#7** refer to that brainstorm's list.
- Ideas marked *history* reuse established bits from the friends' canon; the rest are new.

## Triage rules

1. **Build now:** cheap, and it fits a system we already have (pratfalls, lettering, clouds, junk physics, synthesised sound, the challenge meter, E to poke a prop).
2. **Next:** cheap, but it needs a small new piece, such as a pose, a prop that animates, or a new area.
3. **Waiting on a system:** needs the soup episodes, Aximandra, Rob, Big Wanda or a later zone.
4. **Parked:** breaks the tone rules, or duplicates something better.

## Built

| Gag | Where / trigger | What happens | From |
|---|---|---|---|
| **Hoard Dive** (challenge) | The basement hoard, E | The DIN cable is buried in a heap of archive. Mash E to dig: useless finds fly out ("TV GUIDE '84", "A SMALLER BOOT"), and a newspaper avalanche buries him every couple of seconds (FWUMP!). It ends in a geyser of obsolete goods (KA-FWOOSH!) that knocks him on his backside while the cable arcs into the satchel. It can't be lost. | Mini-games "archaeological dig" and "newspaper avalanche", plus the planned Hoard Dive |
| **The museum tour** | The kitchen fridge, E | "The last properly made one." He opens it; the archive inside comes out all at once (KER-CHUNK!) and carries him across the kitchen onto his backside. He recovers one small knob: "See?" | #7 |
| **The toaster** | The kitchen counter, E | He pushes the lever. Nothing. He leans in to check. The toast hits his forehead (PAP!), with stars and a stagger, then lands on the lino. | #11, simplified |
| **The ADAPTERS box** | The laneway, E | A box marked ADAPTERS. He dives in: FONDUE POT, VACUUM, ELECTRIC BLANKET. The blanket's cord trips him (YANK!). "Still. Adapters." | #20 |
| **Captain Caffeine ignition** | Hurrying from a standstill, sometimes | His feet spin in place (SKREEE!), dust flies, then traction arrives all at once (ZOOM!). | #27, *history* |
| **Cable snag** | Gag clock, satchel not empty, moving | A cable end catches and yanks him back like a bow (TWANG!). "The cable has concerns." | Gag-clock pool |
| **Newspaper train** | Gag clock, indoors, moving | A newspaper sticks to his shoe and grows into a conga line of sheets behind him until he notices (FLAP-FLAP!). "I was going to file those." | Gag-clock pool |
| **Satchel blurt** | Gag clock, satchel not empty | His bag plays one synth note at the wrong moment (BWAAMP!). "That wasn't me." | Gag-clock pool |

Second pass (29 September 2026, from playtest feedback):

| Gag | Where / trigger | What happens |
|---|---|---|
| **The masterpiece, performed** | Any of his keyboards, E | TAKE {n}. E, R, E: two notes back and forth, and the third always comes out wrong (BLORRNK?) however right the key was. He blames the gear: "It needs more parameters. More dynamics." |
| **The Ten Distillations** | The stove, with an ingredient | PLOP, STIR, KLIK: a photo of the soup to all 214 contacts, and the replies ("Dentist's office: Please remove us from this list."). After ten he eats it. |
| **The cat fight** | The Dumpster Duel | A boiling dust cloud, SLAP! and HSSS!, and insults both ways ("Forty years and not one song!" / "Cease and desist, dumpster man.") |
| **Big Wanda** | Her junkyard | Waves and admires from a respectful distance; chases him once he has the grate; stops to applaud a toot; if she catches him, CATALOGUED!, and he's thrown back over the fence |
| **SHELF-IFY!** | The backyard workbench | Mash to hammer the grate into a shelf; every few seconds, the thumb (YEOWCH!) |

Third pass (30 September 2026):

| Gag | Where / trigger | What happens |
|---|---|---|
| **Musings** | Everywhere | A one-liner for each of about twenty areas, a second or two after he arrives, never too often: "The front yard. Wild on purpose. It's a statement. The statement is 'go away'." When the player stalls, he mutters a hint for the current errand before the narrator gets snide. (`src/content/musings.ts`) |
| **Kevin's favours** | Kevin's door | Endless pointless errands; Bill thinks each one means Kevin owes him more |
| **LIFE LESSONS!** | His former students, at the corner store | Vinegar and prog rock, until one grudgingly thanks him. TENURE! |
| **The locked gate** | Big Wanda's Junkyard | CLOSED: Wanda is at lunch. A long lunch. |

Fourth pass (30 September 2026, from the round-2 brainstorm; the story is in [story.md](story.md)):

| Gag | Where / trigger | What happens |
|---|---|---|
| **RESERVE TRANSFER!** | The RESERVE shelf, with the vinegar jug | Pour through an oversized funnel; the jug glugs and he counterweights it. The funnel ends up on his head for a while. "Containment achieved." |
| **CURATE!** | The empty frame, with the cheesecloth | Stretch it over the frame; it wraps round him instead, and he becomes the exhibit. The Cheesecloth Period goes on display. |
| **PROTECT THE TEXT!** | His students, with page one | A gust takes the page; he lunges, faceplants; Mina catches it and reads it: "You wrote this?" |
| **The students, named** | The corner store | Mina, Jules, Dev and Tess, each with their own insult and groan |
| **Kevin nearly admits it** | Every third favour report | "I just need you out of... outside." / "The project expands." |
| **The street spins** | Whenever the camera turns round on the street | He teeters (WHOA-OA-OA!) or faceplants (SPLAT!), which gives the player a moment to reorient, then blames the Earth's orbit, his vagus nerve, a bylaw scan, low soup or the gym noise. At most every ten seconds; excuses don't repeat until he's used them all. |

Earlier, from `comedy.md`: the Stump Wrestle, the Dumpster Duel, the toot dash, the rake, the skateboard, bird poop, the comb-over gust, the nose audit, the burp, the trip and the raccoon faint.

## Next

| Gag | Where / trigger | What happens | Needs | From |
|---|---|---|---|---|
| DIN sync birthright | Picking up the DIN cable | He raises it like a sword; the far end is under his shoe; he pulls himself flat on his back (TWANG!). The cable is unharmed. | A hold-aloft pose | #1 |
| Newspaper slide | A basement pile | The pile collapses into a slide that's a real shortcut; the last sheet lands over his face. | A slide ramp that animates | #3 |
| One magnificent note | Delivering to the synth altar | He dusts one key; a machine behind him falls; he catches it with his foot and plays one glorious note. | A falling prop | #4 |
| The lampshade | Taking an item from a stack | Everything above drops a level, leaving a Bill-shaped hole. He emerges wearing a lampshade for a while. | A hat attachment on the rig | #8 |
| The productive pose | Idle at the synth altar | Rolls his sleeves, cracks his fingers, breathes in, moves a cable two inches. A triumphant sting. | An idle-at-place hook | #10 |
| Cable divining | A basement coil | The coil winds him three times round a table leg like a roast. | A wrap animation | #2 |
| Archivist's label | A heap upstairs | He ties POSSIBLY IMPORTANT to something unidentifiable; the string sweeps him into the heap. | Upstairs heaps (see "The house" below) | #12 |
| Legal stationery | The typewriter | He crosses a floor of typed demands; each footstep stamps $50,000,000; the last sheet sticks to his backside like a cape. | A typewriter corner, footprint decals | #9, *history* |
| Bin surfing | Laneway bins | A wheelie bin as a ride, like the skateboard; a missed turn ends in a lid-flipping butt-flop. | Reuses the skateboard ride | #15 |
| Curb launch | Main-street curbs | He steps off a curb carrying cables; the bundle lands first and bounces him into a hedge. | A curb trigger | #16 |
| Crosswalk conductor | The main street crossing | He conducts the crossing beeps like his arrangement; a bicycle bell supplies the final note as he dives aside. | A crosswalk and a cyclist | #21 |
| Rolling-chair relay | The lane or the lot | Abandoned office chairs: sit, roll, leap to the next. Missing one drops him in cushions. | Chair props, the ride system | #22 |
| Bin-lid salute | Gag-clock pool, the lane | A bin lid flips up as he passes, like a salute. | Bins as separate props | Gag-clock pool |
| The bridge | Finale | The eight bars are *surprisingly good*. Everyone braces for more. Silence. "I'm still working on the bridge." The jet hits a tiny bump: THWACK! Freeze-frame. | The finale | Finale note |

## Waiting on a system

| System | Gags |
|---|---|
| **Soup episodes** | #5 soup before anything (the slurp that draws his whole upper body into the bowl); #6 crusty-bread brake; #13 the sprinkler that tracks him like a turret; mini-games "soup slalom" (spills become slippery ramps; a perfect run ends with Bill sitting in the bowl) and "crusty-bread dunk" |
| **Aximandra** | #30 he tries to follow her through a narrow gap, sticks sideways, and she walks across his back; the gag-clock "avoidance leap" when she crosses his path; mini-game "Aximandra herding" |
| **Rob** | #17 the fake fried-pigeon special sign (Bill gets mistaken for the promoter; pigeons take his bread); #18 Rob's birds, who demand cheese snacks, carry Bill a few feet and drop him in a bin; #23 the ten-page search for himself in *Mega Vegas Elvis*; #31 Rob's helpful boost over a fence (CLONK. CLONK.); mini-games "find Bill in the comic" (Rob points to a background soup bowl as the cameo) and "cheese-snack delivery" |
| **Bill's Legal Department** | #24 he goes through a door marked LEGAL in a tie, hands himself a stern demand, and comes back out to receive it; mini-game "legal filing" (pound the typewriter; the carriage return spins his chair; the $50 million demand runs to dozens of pages taped together). A good response to bylaw scoldings. |
| ***Keith Richards: Psychic Detective*** | #26 a comic panel says Keith senses "a cable nearby"; every cable in the satchel springs loose, hogties Bill and drags him off. Keith was right. |
| **Big Wanda** | #28 she moves in one go what he wrestled for a minute; he says he "loosened it"; it rolls back and pins him; mini-game "heavy lifting" (Bill mashes to help, she's already lifted it, he faceplants into empty air) |
| **Gary, more** | #29 Gary's coat unfolds into a whole sidewalk stall and buries both of them; the adapter pops out on top. A drawn Dumpster Duel where both land in opposite bins and the prize drops between them. |
| **Later zones** | #14 stump audition; #19 park-bench composition (the park); #22 the chairs; "stump rodeo"; "adapter chase" |

## Mini-games against the plot beats

| Beat | Challenge | Candidates |
|---|---|---|
| Sacred Cable Pilgrimage | Hoard Dive | **Built** from "archaeological dig" and "newspaper avalanche" |
| Stump of Destiny | Stump Wrestle | Built |
| Speak & Spell Salvage Duel | Dumpster Duel | Built. "Gary's rummage duel" suggests a draw outcome. |
| Soup episodes | Soup Sprint | "Soup slalom", "crusty-bread dunk", the sprinkler turret |
| Grate Shelf Revelation | Wanda Chase | "Big Wanda's heavy lifting"; "keep or keep" (sort flying objects into ESSENTIAL and HISTORICALLY ESSENTIAL, with no discard bin, until the piles squeeze him up into the ceiling) as the vault install |
| Rack Rail Rescue | *(none yet)* | "Adapter roulette": jam big plugs toward a socket; the match powers an unrelated old machine that launches him. It fits the Final Adapter reveal. |
| The Route | Stealth Shuffle, Insult Volley | None offered; ask again |
| Finale | Takeoff | "Airport baggage belt" (hop between bags hauling the synth case) and "eight-bar assembly" (every stumble adds a sound to the eight bars) |

## Parked

- **#25 The wrong Elvis.** A poster wraps Bill into the overweight Elvis silhouette. It's a joke about body shape, which the tone rules rule out ("never his looks for their own sake"), and the comic's Elvis is close to real people. Keep *Mega Vegas Elvis* to the face-theft grievance.

## Canon from the brainstorm

Adopted on 29 September 2026:

- **The house is a hoarder shambles, not a pristine period home.** Everything in it is from the 1950s because Bill never replaces anything, and he keeps collecting more old things and leaving them in heaps for their future use. He calls himself an **archivist**: the modern world will eventually realise these things were the best they could ever be. The comedy of a stored object is that it vindicates Bill for one second, then causes a much bigger problem.
- **Soup:** his motto is "SOUP FIRST. EVERYTHING ELSE LATER." He wants it extra-large and thick, with crusty bread, sometimes with foraged ingredients, from the battered BILL ONLY bowl.
- **The Legal Department's origin:** Rob lured Bill into reading *Mega Vegas Elvis* by saying he was in it. Ten pages in, Bill still couldn't find himself. The $50 million demand followed, typed by Bill himself on the old typewriter.
- **Rob** is a covert prankster whose birds demand cheese snacks.
- ***Keith Richards: Psychic Detective*** has Keith (whose psychic insights are useless), Hervé, a gorilla and an exasperated Kissinger.
- **No established canon was found** for Big Wanda, Gary or Aximandra; everything about them is still ours to decide.

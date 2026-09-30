# The Scavenger's Chronicles

Living world and mechanics bible for a browser-playable isometric scavenging comedy.

## Core Pitch

It is 2026. The Scavenger lives in a 1955 house he has never updated and never stopped filling: heaps of antiques, newspapers, synthesizers, old cables, cracked wood, metal grates, broken appliances, and projects that are absolutely about to become brilliant. He calls himself an archivist. The modern world will eventually realise these things were the best they could ever be.

He is emotionally stuck at 14. He believes the right cable, the right synthesizer, the right rack rail, or the right piece of salvaged wood will finally unlock the masterpiece he has been preparing to compose for forty years. No music has been written. Preparation, however, is world-class.

The game is an isometric mission-based scavenging game with simple controls, cartoon graphics, absurd grimy humour, and a growing map of hoards, alleys, landfills, factories, dusk parks, and one private airfield escape fantasy.

## Design Pillars

1. **Scavenge First**
   - The main joy is finding objects and hearing The Scavenger justify them.
   - Most junk is useful because he has invented a future in which it is essential.

2. **The Basement Is the Brain**
   - Synths, mixers, racks, mystery power supplies, adapters, newspapers, and research logs form the home base.
   - Missions often return to the basement so every find can be filed into the masterpiece delusion.

3. **Contemporary World, Frozen Taste**
   - The year is 2026.
   - The Scavenger's interior life is stuck in the era when he was 14.
   - The house should feel like several decades gave up and became furniture.

4. **Absurd, Grimy, Character-Driven Comedy**
   - The jokes come from hoarder logic, audio gear procrastination, salvage taste, and grand claims about tiny errands.
   - The Scavenger is ridiculous but specific, not generic.

5. **Simple Browser Play**
   - Runs from a URL.
   - Keyboard-first controls.
   - Short missions, readable goals, no setup.

## Character

### The Scavenger

The player character is an odd aging obsessive with long side hair, thinning top hair, and heroic resistance to finishing anything. He keeps an old hairspray can around and sometimes uses it as if follicle engineering remains a solvable problem.

His name is **Bill**. He wears dark sunglasses indoors, a red plaid flannel shirt and a charcoal sweater vest, eats soup from an enamel bowl labelled BILL ONLY, and lives with Aximandra, a tabby cat who "gets him." The same Bill appears in the Mega Vegas Elvis comics, where he runs a legal department against Rob. Full character bible: [docs/design/characters/bill.md](docs/design/characters/bill.md). Reference: [docs/design/reference/bill-soup-kitchen.jpg](docs/design/reference/bill-soup-kitchen.jpg).

The hairspray can is only a background gag. It is not a central mechanic.

### Obsessions

- Vintage synthesizers.
- Mystery cables and adapters.
- Old grates that could become shelves.
- Tree stumps with "presence."
- Wood chunks with "tone."
- Newspaper hoards.
- Rare antiques.
- Broken appliances that are "basically parts."
- A private airfield jet escape plan that sounds less legal the longer it is explained.

## World

### Starting Estate

- Retro 1950s-feeling living room.
- Basement synth and newspaper hoard.
- Rare antique vault.
- Backyard dig area for buried relics.
- Workbench for salvage transformation.

### Neighbourhood Route

- Gated estate alley.
- Abandoned lot with old appliances.
- Corner-store dumpster with functional trash and antique educational electronics nobody should be emotionally attached to.
- Bylaw patrol and gym-guy pressure placed directly on the main scavenging route, so the trip to the dumpster feels like crossing a social minefield in bad shoes.

### Later Zones

- Big Wanda's Junkyard (once the city landfill; renamed on 29 September 2026).
  - Big Wanda's dump trailer, revealed by a short cutaway when the route first opens.
  - Big Wanda runs the junkyard, has aggressive admiration for The Scavenger's salvage taste, and becomes a capture hazard.
- Dangerous old factory.
- Park dusk events.
- Private airfield with repair-and-escape endgame.

## Current Playable Scope

- A flat intro explains the Scavenger's life, hoard, cable obsession, salvage worldview, and first objective.
- The Scavenger starts inside the estate.
- He can walk through the house, basement, backyard, alley, lot, dumpster route, landfill, factory, and airfield.
- He has a four-slot inventory with pickup, drop, re-pick, and use.
- A mission browser lets the player switch active errands.
- A guidance dock gives wrapped instructions, nearby interaction hints, directional help, and increasingly snide nudges if the player takes too long.
- The mission system auto-selects the next available errand so the player is never missionless unless the game has reached the final airfield objective.
- A shabby-kitchen soup timer interrupts play every minute: The Scavenger must forage a backyard ingredient and return it to the pot before the soup boils over and ruins the photo he planned to share.
- If the soup deadline gets urgent, his soup obsession starts pulling player movement toward the current soup obligation.
- An optional narrator toggle uses the browser's speech-synthesis voice to read gag text, guidance beats, and key soup countdown warnings.
- A checklist points players toward discoveries without affecting progression.
- Procedural gag sounds differentiate cables, metal, wood, paper, power bricks, cops, hairspray, synth burps, house creaks, and the jet ending.
- Ambient comic NPCs include rabbits with justified trust issues, birds with poor navigation, rats that provoke involuntary scavenger chases, gym guys who laugh off insults, clearer dumpster patrols, and Gary the Rummager guarding the Speak & Spell like a landfill dragon with reading software.
- Characters use simple flat cutout construction with separate heads, torsos, limbs, shoes, hair, clothing, bags, and props so upgrades stay readable inside the canvas-vector art system.
- The neighbourhood layout puts bylaw patrols and gym guys in the middle of objective routes rather than safely off to the side.
- One bylaw officer and one gym guy now roam longer loops so route hazards cover more ground and feel less locally trapped.
- Completing two starter errands opens the landfill and factory missions, triggers Big Wanda's trailer cutaway, and activates her landfill chase/capture threat.
- Toast and narrator delivery use cooldowns plus a brief handoff gap so minor barks do not trample higher-priority instructions.
- Completing all five missions sends The Scavenger to the airfield for the finale.

## Prototype Controls

- `WASD` / arrow keys: move.
- `E`, `Space`, or `Enter`: interact.
- `M`: mission browser.
- `C`: optional checklist.
- `R`: drop selected item.
- `F`: use selected item.
- `1`, `2`, `3`, `4`: select inventory slot.
- `Shift`: move faster.
- `END` on the intro screen: jump to the ending for testing.

## First Mission Set

1. **Sacred Cable Pilgrimage**
   - Find the obscure DIN sync cable in the basement hoard.
   - Deliver it to the synth altar.

2. **Stump of Destiny**
   - Dig up a backyard stump with personality.
   - Bring it to the living-room shelf zone.

3. **Speak & Spell Salvage Duel**
   - Lure Gary the rival rummager away from the corner-store dumpster.
   - Scavenge the antique Speak & Spell before Gary returns to guard it.
   - Bring it back to the synth altar.

4. **Grate Shelf Revelation**
   - Retrieve a rusty floor grate from Big Wanda's Junkyard.
   - Turn it into a shelf at the workbench.
   - Install the shelf in the antique vault.

5. **Rack Rail Rescue**
   - Retrieve rack rails from the old factory.
   - Fit them to the basement rack.
   - Return the resulting mystery cable bundle to the synth altar.
   - Pick up the Final Adapter that the bundle reveals.
   - Install the Final Adapter at the private airfield so the ending is reachable without the joke becoming a soft lock.

## 3D Rebuild Direction

Decided on 2026-09-28. The design documents are in [docs/design/](docs/design/README.md).

- A ligne claire comic look in 3D, with a fixed isometric camera and dollhouse cutaways, built on Three.js and running in the browser.
- The 2D prototype moves to `/classic` and stays playable.
- Three eras: his late mother's 1955 house, his taste frozen in 1986, and the 2026 world outside.
- The house is a hoarder shambles, not a museum piece. Its furniture and appliances are 1950s because Bill never replaces anything, and the heaps are his archive. A stored object vindicates him for one second, then causes a much bigger problem.
- Carrying is physical: junk rides on Bill's body and changes how he walks.
- The soup becomes three or four scripted episodes instead of a once-a-minute timer.
- The masterpiece finally plays at the end: eight bars arranged from the sounds of what he delivered.
- The private airfield moves to the far edge of the map, so the last errand is a long walk out of town.
- The jet escape goes to **Las Vegas**. Mega Vegas Elvis is a light touch: comic stacks, the fridge photo and magnet, the ELVIS LIVES ashtray, Bill's lip curl, and then the finale.
- Every cutscene and comic panel renders in-engine in the game's own look.
- Bill lives with **Aximandra**, a tabby who knows the soup will boil over before he does. She rides to the airfield in the satchel.

### The Street (built as greybox)

Bill's front door opens onto an overgrown front yard of tall weeds, a sidewalk he considers his property, and a quiet residential street of semis. Across the street lives Kevin, who works at a media company (Bill says media mogul) and whose parcels Bill "protects". The Lug Nutz train at the gym down the block; Bill says he can hear them from his house. Joggers use his sidewalk. The camera turns round in the front yard to show the front of the house. Layout, people and errands: [docs/design/areas/the-street.md](docs/design/areas/the-street.md).

### The Route (built as greybox)

Bill's back gate opens onto a Toronto-style laneway. Along the lane are a parking lot, the back of a corner variety store with the dumpster Gary guards, and a boxing gym. The residential street runs along the north edge (see The Street). Layout, errands and Gary's rules: [docs/design/areas/the-route.md](docs/design/areas/the-route.md).

### Finale beats (draft)

Played as an in-engine cutscene. A fuller road to the finale, from the factory and Kevin's last favour to page ten and "Page two?", is in [docs/design/story.md](docs/design/story.md); where the two differ, `story.md` is newer.

1. At the airfield, Bill fits the Final Adapter into the jet's panel. Aximandra's head pops out of the satchel.
2. In the cockpit, sunglasses on, he patches the basement synth rig into the jet's PA with the Final Adapter. No one asks why this works.
3. The masterpiece plays while the jet taxis. Panels cut on the beat: the stump kick, the Speak & Spell spelling "B-I-L-L", the soup bass (a sob if the last soup was ruined).
4. The jet lifts off. The eight bars are surprisingly good; everyone braces for more. They end. Silence. Aximandra meows once. Bill: "I'm still working on the bridge." (Proposed: the jet hits a tiny bump, THWACK, freeze-frame.)
5. Vegas at night. A marquee reads TONIGHT: MEGA VEGAS ELVIS. The poster's face is Bill's. Bill, with a grievance face: "That's my face."
6. End card: **Masterpiece Completed (Eight Bars). Escape Achieved. Litigation Pending.**

## Development Notes

Keep this file alive. Add decisions as they become real, move rejected ideas into a parking lot, and let the game discover its strangest usable shape through playable prototypes.

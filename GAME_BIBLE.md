# The Scavenger's Chronicles

Living world and mechanics bible for a browser-playable isometric scavenging comedy.

## Core Pitch

It is 2026. The Scavenger lives in a preserved retro estate, surrounded by antiques, newspapers, synthesizers, old cables, cracked wood, metal grates, broken appliances, and projects that are absolutely about to become brilliant.

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

- City landfill.
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
- The neighbourhood layout puts bylaw patrols and gym guys in the middle of objective routes rather than safely off to the side.
- Completing two starter errands opens the landfill and factory missions.
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
   - Retrieve a rusty floor grate from the landfill.
   - Turn it into a shelf at the workbench.
   - Install the shelf in the antique vault.

5. **Rack Rail Rescue**
   - Retrieve rack rails from the old factory.
   - Fit them to the basement rack.
   - Return the resulting mystery cable bundle to the synth altar.
   - Pick up the Final Adapter that the bundle reveals.
   - Install the Final Adapter at the private airfield so the ending is reachable without the joke becoming a soft lock.

## Development Notes

Keep this file alive. Add decisions as they become real, move rejected ideas into a parking lot, and let the game discover its strangest usable shape through playable prototypes.

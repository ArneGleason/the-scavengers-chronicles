# The Route

Area design, v0, 28 September 2026. It covers Act 2's neighbourhood, the first piece of it built as greybox (`src/world/route.ts`), and the three starter errands that now run across the estate and the Route.

## Inspiration

A Toronto west-end neighbourhood, used for mood rather than accuracy. Nothing here is a real address.

- **Victorian semis** with deep porches and overgrown front gardens, painted dark.
- **Named laneways** behind every block, lined with garages, back fences, and green, blue and grey bins. There are graffiti tags on the fences, Virginia creeper climbing the hydro poles, and wires everywhere overhead.
- **A commercial strip** with a streetcar, a corner variety store, a boxing gym, and a municipal parking lot behind the shops.
- **A big park a block away**, a candidate for the park-at-dusk events.

## Layout

The camera looks from +X+Z, so the lane runs across the foreground and the buildings stand behind it.

| Place | Where (metres) | What's there |
|---|---|---|
| Laneway | z 15.6–19.6, the full width | Bill's back gate, the lane sign ("LANE S BILL E SOUP"), hydro poles with ivy, bins, a curbside mattress, low back fences across the lane |
| Parking lot | x 12.5–21.5 | Three parked cars, stall lines, a pay machine, the green P sign, bollards along the sidewalk |
| Corner store | x 22–31 | Back wall on the lane with a "DELIVERIES ONLY" door, graffiti, the store name on the lane-side parapet, shelves and a till inside for the cutaway |
| Store yard | between the store and the lane | **The dumpster**, the cardboard heap with the Speak & Spell, milk crates, a tagged shed, a raccoon on the bins |
| Boxing gym | x 32–40 | LUG NUTZ BOXING & IRON: a roll-up door onto the yard, a heavy bag and ring inside, a lion mural, and the Lug Nutz ([the-street.md](the-street.md)) |
| The street out front | north of the house | Replaced on 30 September 2026 by a residential street with houses on both sides: see [the-street.md](the-street.md) |

**Why the store's name is on the parapet:** the camera only sees faces pointing +X or +Z, so every sign and mural in the Route faces the lane or the street edge.

## The three starter errands

Text is ported verbatim from v0.2 (`src/content/missions.ts`). The flow is pure logic in `src/game/missions.ts` and is unit-tested.

| Errand | Find | Deliver to | Unlocks |
|---|---|---|---|
| Sacred Cable Pilgrimage | DIN cable in the basement hoard | Synth altar | The other two |
| Stump of Destiny | Stump in the backyard dig patch | The taped "future shelf" zone in the living room | — |
| Speak & Spell Salvage Duel | Speak & Spell on the heap by the dumpster | Synth altar | — |

- **Auto-selection.** The next open errand is picked automatically, so Bill is never missionless (v0.2 behaviour). `M` cycles between open errands.
- **The objective card** ("Current compulsion") shows the title and the guide line.
- **The salvage-gold marker** bobs over the target, or pins to the screen edge and points when the target is off screen.
- **Delivering** means standing at the drop point with the item and pressing `E`. The item flies to its spot and stays installed: the cable coils on the altar, the Speak & Spell sits on the CRT, and the stump lands in the shelf zone. The house keeps score.

## Gary the Rummager

Gary's brain is `src/game/gary.ts`. It is pure and unit-tested; a kinematic capsule walks him around obstacles.

| Mode | When | What he does |
|---|---|---|
| Guard | Default | Rummages at his post in front of the heap. The Speak & Spell counts as guarded while he's within 2.2 m of it. |
| Follow | Bill comes within 5.5 m of the post | Shadows Bill a step away at 1.15 m/s, but never more than 11 m from his post |
| Drift | Bill gets past the leash | Wanders back at 0.45 m/s for 4 s. **This is the window.** |
| Return | After drifting | Hurries back at 0.95 m/s; re-follows if Bill is right there |
| Decoy | A dropped Power Brick lies within 9 m of the post | Investigates the hum for 9 s, then a 12 s cooldown before it can lure him again |
| Sulk | The Speak & Spell is gone | Stands at his post, defeated |

A shuffling Bill loses the race back. A hurrying one (2.4 m/s) wins it. That makes Shift the verb this errand teaches.

The end-to-end check `tools/e2e.mjs` plays the whole duel: blocked, lure, drift, hurry back, grab.

## Ambient life

- **A streetcar every 45 seconds**, with a two-tone bell as it enters.
- **A raccoon on the store's bins.** It flees down the lane when Bill gets close ("finds his satchel structurally inferior") and is back 14 seconds later.

## Next for this area

1. **Bylaw patrols** with flashlight cones along the lane and the lot.
2. **The gym guys**, based at the boxing gym.
3. **The second soup episode**, with an ingredient that grows along the lane fence.
4. **The store interior**, with a clerk. The first time Bill enters is a cutaway moment.
5. **Bill's house exterior** restyled as a dark Victorian semi with twin gables, a porch and an overgrown front garden facing the main street.
6. **The park-at-dusk** area, beyond the main street.

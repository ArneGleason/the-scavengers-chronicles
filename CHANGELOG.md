# Changelog

All notable prototype milestones for The Scavenger's Chronicles are tracked here.

## 0.5.0 - Slapstick (in progress)

- Set the comedy direction (`docs/design/comedy.md`): an easy, guided game with a silly action challenge at every key plot beat, and a gag at least every 10–15 seconds.
- The errands now run in a straight line: cable, then stump, then Speak & Spell.
- Added the toot dash on `Space`: three charges of soup that refill over time, a green cloud and sound-effect lettering. The cloud makes Gary gag, which leaves the Speak & Spell unguarded, and knocks out the raccoon.
- Added the Stump Wrestle: the stump is rooted, and mashing `E` pops it free and puts Bill on his backside.
- Added the Dumpster Duel: grabbing the guarded Speak & Spell starts a tug-of-war with Gary. Win and Gary goes head-first into the dumpster. Lose and Bill is flung into the lane, ready to try again.
- Added traversal gags: a rake on the path home from the dig patch, and a skateboard in the laneway that Bill rides until it shoots out from under him or he meets a hydro pole.
- Added the gag clock: when nothing funny has happened for 12 seconds, the world supplies bird poop, a comb-over gust, a nose audit, a burp or a trip.
- Added pratfalls (stagger, faceplant, butt-flop, flung), stars around the head, pop-in comic lettering, dust and soup clouds.
- Added synthesised slapstick sounds: toots, thwacks, whumps, splats, a burp, a slide whistle, a dumpster clang, a boing and effort grunts.
- The narrator now nags with the v0.2 guidance lines, with escalating sarcasm, when progress stalls.
- Shuffle and hurry are faster, with longer strides.
- Added a soup gauge and a challenge meter to the HUD. `M` is no longer advertised; the objective always points at the one thing to do.
- End-to-end checks for both challenges, the toot dash, the rake and the skateboard.

## 0.4.0 - The Route and the Starter Errands (in progress)

- Added the Route: a laneway behind Bill's back gate with hydro poles, ivy, bins and graffiti; a municipal parking lot; the back of a corner store with its dumpster; a boxing gym; and a streetcar street with shopfronts along the north edge.
- Added the three v0.2 starter errands with their original text: Sacred Cable Pilgrimage, Stump of Destiny, and Speak & Spell Salvage Duel.
- Delivered items install in the house: the cable on the synth altar, the Speak & Spell on the CRT, the stump in the taped-out shelf zone.
- Added Gary the Rummager: guards the dumpster, follows on a leash, drifts back slowly, can be distracted by a dropped Power Brick, and blocks the Speak & Spell while he's guarding it.
- Added an objective card, a salvage-gold objective marker, delivery prompts, and speech balloons for more than one speaker.
- Added a raccoon on the bins and a streetcar that passes every 45 seconds with its bell.
- `M` now cycles errands and `N` mutes.
- Tests for the mission chain and Gary's brain, plus end-to-end checks that deliver the cable and win the Gary duel.

## 0.3.0 - 3D Walking Toy (in progress)

- Started the 3D rebuild: Three.js r186 with WebGPU and a WebGL2 fallback, Rapier physics, TypeScript and Vite.
- Moved the 2D prototype to `/classic/`; `/web/` redirects there.
- Added a greybox estate: 1955 kitchen and living room, back hall with the antique vault, stairs down to the 1986 basement synth altar, and a fenced backyard with the dig patch.
- Added Bill as a primitive-built character with a shuffle, a hurry with skids, lean into turns, springy hair and satchel, squash and stretch, idle fidgets and five expressions.
- Added a comic render pass: toon banding with tinted shadows and pixel-constant ink outlines.
- Added dollhouse cutaways: walls between Bill and the camera drop to stubs, the roof lifts when he goes inside, and the basement is shown as a cross-section.
- Added carrying: a four-slot satchel for small finds and two hands for the stump, with pickup arcs, drop thunks, hit-stop and v0.2 narration lines.
- Added synthesised audio: surface-aware footsteps and shuffle scuff, pickup notes, skid squeak, a kazoo honk for a full satchel, Bill's gibberish voice, and music that changes at the basement stairs.
- Added a feel-tuning panel, unit tests, headless interaction checks and a screenshot tool.

## 0.2.0 - Graphics and Final Adapter Pass

- Added a real Final Adapter leg to the last mission so the adapter joke resolves as a playable objective.
- Improved the estate, basement, backyard, neighbourhood, landfill, factory, and airfield visuals with more props, texture, furniture, clutter, and environmental detail.
- Reworked the private jet and final airfield end-card art with a more detailed shared procedural jet graphic.
- Improved The Scavenger's character silhouette with clearer hair, face, satchel, and body details.
- Added a broader procedural gag-sound layer for cables, metal, wood, paper, cops, hairspray, synth burps, house creaks, and jet nonsense.
- Added an intro joke clarifying that the best thing about the game is that it is very short.
- Added always-on mission auto-selection so players are never left missionless between errands.
- Added escalating mission guidance with directional text, brighter target markers, breadcrumb arrows, snide nudges, and tiny impatient guide beeps.
- Added comic ambient NPCs: rabbits that adore The Scavenger from a safe distance, birds that bonk into him and recover, rats that trigger a brief involuntary chase, and gym guys who laugh off his distant insults.
- Improved the corner-store patrol graphics with clearer bylaw uniforms, gadgets, flashlight cones, badges, hats, and movement details.
- Added the perpetual shabby-kitchen soup timer: every minute The Scavenger must forage a backyard ingredient and return it to the pot before the photo-worthy soup boils over.
- Added soup-compulsion control pull, soup HUD countdowns, pot/weed target markers, boiling-over disappointment, crying animation, and procedural soup alarm/plop/sob-burp sounds.
- Reworked the neighbourhood geography so bylaw patrols and gym guys sit across the main dumpster route instead of politely existing where they could be ignored.
- Replaced the dumpster power-brick errand with a Speak & Spell salvage duel guarded by Gary the Rummager, who must be lured away before the pickup.
- Added a narrator toggle using browser speech synthesis for gag text, guidance beats, and urgent soup countdown warnings.
- Added rotating gag-line pools for soup panic, narrator countdowns, Gary, cops, rabbits, rats, birds, gym taunts, discovery re-inspection, inventory nags, and guidance zingers so repeated actions vary instead of grinding the same joke flat.
- Made narration more robust by debouncing rapid speech calls, preserving the active utterance, resuming browser speech after user gestures, and clarifying the narrator button state.
- Spread bylaw patrols, gym guys, rabbits, birds, and rats across the estate route, dumpster approach, and gate area so hazards are distributed instead of clumped around one crowded choke point.
- Added a shared five-second ambient text cooldown so low-priority NPC gags and background barks do not interrupt mission, soup, inventory, or player-triggered narration.
- Added a landfill-unlock cinematic that pans to Big Wanda's dump trailer, introduces her unwanted scrap-yard admiration, and turns her into a capture hazard with a comic game-over recovery.
- Extended one bylaw patrol and one gym-guy route into longer wandering loops so they cover more of the map instead of pacing tiny local circles.
- Added a 250ms toast/narrator handoff gap so high-priority messages pause briefly before replacing the current line.
- Upgraded NPC rendering with flat cutout-style body parts, clearer faces/clothing, and more articulated limb animation for Big Wanda, Gary, gym guys, cops, and ambient animals.
- Upgraded The Scavenger's lead-character rendering with layered clothing, softer cutout articulation, clearer hair/balding details, directional face cues, satchel detail, and richer walking/carrying states.
- Let Space, Enter, or E dismiss the mission browser so players can return to scavenging without reaching for the mouse.
- Polished the finale airfield Scavenger so the ending frame uses the richer lead-character design instead of the older simplified figure.

## 0.1.0 - First Scavenging Slice

- Created a standalone static browser game from the Whiskey Runner Rob canvas pattern.
- Added the estate, basement hoard, backyard dig patch, alley route, abandoned lot, corner-store dumpster, landfill, factory, and private airfield.
- Added on-foot movement, inventory, mission browser, guidance dock, target markers, optional checklist, and procedural sound cues.
- Added five scavenging missions centered on cables, synth gear, salvage, wood, grates, and unfinished masterpiece logic.
- Added cops as light patrol pressure in the neighbourhood route.
- Added the old hairspray can as a small flavour gag rather than a core mechanic.
- Added an end-state canvas animation at the private airfield after all missions are complete.

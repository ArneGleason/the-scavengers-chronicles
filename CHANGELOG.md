# Changelog

All notable prototype milestones for The Scavenger's Chronicles are tracked here.

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

## 0.1.0 - First Scavenging Slice

- Created a standalone static browser game from the Whiskey Runner Rob canvas pattern.
- Added the estate, basement hoard, backyard dig patch, alley route, abandoned lot, corner-store dumpster, landfill, factory, and private airfield.
- Added on-foot movement, inventory, mission browser, guidance dock, target markers, optional checklist, and procedural sound cues.
- Added five scavenging missions centered on cables, synth gear, salvage, wood, grates, and unfinished masterpiece logic.
- Added cops as light patrol pressure in the neighbourhood route.
- Added the old hairspray can as a small flavour gag rather than a core mechanic.
- Added an end-state canvas animation at the private airfield after all missions are complete.

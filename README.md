# The Scavenger's Chronicles

A browser-playable isometric scavenging comedy about an aging obsessive in 2026 who lives like time became suspicious after he turned 14.

The Scavenger owns too many synthesizers, too many newspapers, too many antique things, and not nearly enough of the exact cables he insists are required before his masterpiece can begin. He scavenges alleys, backyards, landfills, old factories, and private airfields for junk he believes will become furniture, audio gear, art, or finally the missing piece of the song he has avoided composing for forty years.

## Play

Local build:

Open `web/index.html` in a browser.

## Controls

- `WASD` / arrow keys: move The Scavenger.
- `E`, `Space`, or `Enter`: interact, pick up, inspect, deliver, or board the final escape plan.
- `M`: open the mission browser.
- `C`: open the optional checklist.
- `R`: drop the selected inventory item.
- `F`: use the selected inventory item.
- `1` / `2` / `3` / `4`: select an inventory slot.
- `Shift`: shuffle faster, with the confidence of a man late for a dumpster.
- `END` on the intro screen: jump straight to the ending animation for testing.

## Current Prototype

- A flat scrolling intro establishes the estate, basement synth hoard, antique vault, cable obsession, salvage logic, and first objective.
- The Scavenger can explore the estate interior, basement hoard, backyard dig patch, neighbourhood alley, abandoned lot, and corner-store dumpster.
- Inventory supports pickup, drop, re-pick, select, and use.
- The mission chain has five errands:
  - Sacred Cable Pilgrimage
  - Stump of Destiny
  - Speak & Spell Salvage Duel
  - Grate Shelf Revelation
  - Rack Rail Rescue
- Completing two starter errands opens the landfill and factory route.
- The final mission now reveals a real Final Adapter at the synth altar, then sends it to the private airfield before the end-state animation triggers.
- The mission system keeps an active errand selected at all times, while the guidance dock adds directions and gets snidier the longer the player avoids the obvious glowing target.
- Every minute, the shabby-kitchen soup timer interrupts everything: forage a backyard ingredient, return it to the pot, or watch the soup boil over and ruin its chance at social documentation.
- A narrator toggle uses browser speech synthesis to read gag text, guidance beats, and urgent soup countdowns in a dry, unhelpfully helpful voice.
- Optional checklist discoveries point players toward hairspray, newspapers, synths, relics, dumpsters, cops, landfill art, and the jet fence.
- The hairspray can is a small recurring gag only, not a real mechanic.
- Procedural gag sounds give different junk, cops, papers, synths, hairspray, house creaks, and the airfield ending their own tiny noises.
- The bylaw patrol and gym guys now sit across the neighbourhood route as actual obstacles to squeeze past on the way to dumpster objectives.
- Rabbits, birds, rats, gym guys, Gary the rival rummager, and better-dressed dumpster patrols add small ambient comedy around the map without making the already short game grow delusions of grandeur.
- The dumpster errand is now guarded by Gary the Rummager, who wants the antique Speak & Spell for himself and must be lured away before The Scavenger can grab it.

## Design Notes

The living world and mechanics bible is in `GAME_BIBLE.md`.

Version history is tracked in `CHANGELOG.md`.

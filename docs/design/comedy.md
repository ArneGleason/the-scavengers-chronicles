# Comedy Direction

Set on 29 September 2026. This outranks earlier pacing assumptions in the other design documents.

**The Scavenger's Chronicles is a ridiculously slapstick, crude interactive comedy.** It is easy to play, it walks the player along one main plot, and every key plot beat is a short, silly action challenge. Walking around must never be the boring part.

## Rules

1. **The gag clock.** Something funny happens at least every 10–15 seconds of play. If the player hasn't caused a gag in that time, the world supplies one.
2. **Easy and guided.**
   - One main plot, one current objective, always visible.
   - The narrator nags with escalating sarcasm when the player dawdles.
   - Nothing is a puzzle you can get stuck on. Every challenge can be won by mashing enthusiastically.
3. **Failing is funnier than winning.** Losing a challenge flings Bill into the bins, not back to a checkpoint. Retries are instant.
4. **Traversal is a toy.** Moving has its own gags and verbs: the soup-powered toot dash, skateboards, rakes, trips and pratfalls. Getting from A to B should be something the player fools around with.
5. **Slapstick is physical.** Pratfalls, faceplants, butt-flops, getting flung. Big squash and stretch, stars around the head, sound-effect lettering, and a hit-stop on every impact.
6. **Crude, not cruel.** This follows the circle-of-friends rule from *Whiskey Runner Rob*: crude, absurd, warm.

   | Allowed | Not allowed |
   |---|---|
   | Farts, burps, nose-picking, bird poop, garbage, profanity on signs, bodily indignity | Anything sexual, slurs, or jokes about anyone's real health, money, age or loneliness |

   Bill loses his dignity. He never loses the fight with the world for good.

## Bill's comedy verbs

| Verb | Input | What happens |
|---|---|---|
| **Shuffle and hurry** | Stick, Shift | Faster than the walking toy, with more flail |
| **Toot dash** | Space (or F; gamepad Y or RB) | A soup-powered burst forward, a green cloud and "PFFRRT!". Three charges, one back every five seconds. The cloud makes Gary gag and knocks raccoons over. |
| **Grab** | E | Pick up, deliver, and mash during challenges |
| **Drop** | R | Unchanged |

## World gags (all built in the first pass)

| Gag | Where | Trigger |
|---|---|---|
| **The rake** | The dig patch | Step on it and the handle smacks him in the face: THWACK, stars, a stagger |
| **The skateboard** | The laneway | Step on it and he rides it at speed until it shoots out from under him (butt-flop) or he meets a hydro pole (faceplant) |
| **Bird poop** | Outdoors | Ambient gag: a white splat on his head for a while |
| **Wind gust** | Outdoors | Ambient gag: the comb-over lifts straight up |
| **Nose audit** | Indoors, idle | A thorough nasal inspection with a flick |
| **Raccoon faint** | The laneway bins | A toot nearby knocks it out cold |
| **Burp** and **trip** | Anywhere | Ambient gags: a long proud belch; a faceplant over nothing (not while carrying the stump) |

The gag clock lives in `src/game/gags.ts`. Player-caused gags (toots, the rake, the skateboard, challenges) reset it; ambient gags each have their own cooldown so the same one doesn't repeat. The debug readout (`` ` ``) shows gags per minute.

## Plot beats and their challenges

| Beat | Challenge | Status |
|---|---|---|
| Sacred Cable Pilgrimage | **Hoard Dive:** dig through the hoard while newspaper avalanches bury him; it ends in a geyser of obsolete goods | Built |
| Stump of Destiny | **Stump Wrestle:** mash to uproot it; it pops free and he goes over backwards. Then the rake on the way home. | Built |
| Speak & Spell Salvage Duel | **Dumpster Duel:** a tug-of-war with Gary. Win and Gary goes head-first into the dumpster, legs kicking. Lose and Bill lands in the recycling. A toot or the old lure are the sneaky alternatives. | Built |
| The Noise Complaint | **LEGAL DEPARTMENT!** (type it, mind the carriage return), then the **INSULT VOLLEY!** at the Lug Nutz, who laugh and flex it off | Built |
| The Pitch | **THE PITCH!**: sticky-note movie ideas stuck on Kevin one at a time while he tries to close the door | Built |
| The soup | **The Ten Distillations:** collect ingredients, add one per distillation, photograph it and send it to every contact | Built (the timed Soup Sprint is still planned) |
| The Route | **Stealth Shuffle** past bylaw flashlight cones; an **Insult Volley** with the gym guys | Planned |
| Grate Shelf Revelation | **Wanda Chase:** grab the grate and she chases; hurry or toot to escape, or get thrown back over the fence. Then **SHELF-IFY!** at the workbench: mash to hammer, and mind the thumb. | Built |
| Finale | **Takeoff:** mash to get the jet moving while the masterpiece plays | Planned |

Candidates for the planned challenges, and the full backlog of gags, are in [gags.md](gags.md).

The main plot runs in a straight line: cable, then stump, then Speak & Spell. Each errand unlocks the next, and the objective card and marker always point at the one thing to do.

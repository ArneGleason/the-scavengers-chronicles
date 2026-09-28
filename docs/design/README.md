# Design

Design documents for rebuilding The Scavenger's Chronicles as a comic-book isometric 3D game that runs in the browser. The 2D prototype (v0.2.0, `web/`) remains the reference for story, missions and writing. `GAME_BIBLE.md` stays the living bible for the world and mechanics.

The audit and planning pass that led here: [The Scavenger Goes 3D](https://claude.ai/artifact/JQHrKw2zTnwwc5wKdufuGz), a private page.

## Documents

| Document | What it covers | Status |
|---|---|---|
| [art-bible.md](art-bible.md) | Look, line, colour, palettes, print texture, camera, lettering, readability | v0 |
| [characters/bill.md](characters/bill.md) | Bill: who he is, voice, look, palette, expressions, gaits, sound | v0 |
| [prompts/bill.md](prompts/bill.md) | Image-model prompts for Bill's sheets and the Phase 0 style frames; turnaround-to-3D spec | v0 |
| [maquettes/bill-maquette-v0.html](maquettes/bill-maquette-v0.html) | Bill built from primitives under the real renderer (three.js r186, toon ramp, ink pass): poses, expressions, game zoom. [Live page](https://claude.ai/artifact/Rnmx5EQGARTef27vSA3Gg4) | v0 |
| [technical-design.md](technical-design.md) | Stack, layout, runtime, content and zone formats, render pipeline, camera, controller, animation, NPCs, testing, the walking-toy milestone | v0 |
| [audio-design.md](audio-design.md) | Buses, adaptive music, the masterpiece, voices, foley, ambience, formats | v0 |

## Reference

- [reference/bill-soup-kitchen.jpg](reference/bill-soup-kitchen.jpg): the primary reference for Bill and the 1955 kitchen.
- MVE Comics (`keith-psychic-detective` repo): Bill appears on page 6 of *Keith Richards: Psychic Detective* No. 1 ("Bill's Legal Department").
- `whiskey-runner-rob`: Rob's game, and the tone rules for the circle of friends.

## Decisions

| Date | Decision |
|---|---|
| 2026-09-28 | Ligne claire comic look in 3D, with halftone and hatching accents |
| 2026-09-28 | Three.js r186, TypeScript, Vite; WebGPU with automatic WebGL2 fallback; Rapier physics (assumed, not yet revisited) |
| 2026-09-28 | Fixed-yaw orthographic camera with dollhouse cutaways (assumed) |
| 2026-09-28 | Hybrid assets: AI-generated characters and props (paid tiers), code-built environments, one palette under the toon shader |
| 2026-09-28 | Same repository; the 2D game moves to `/classic` and stays playable |
| 2026-09-28 | Three eras (1955 house, 1986 Bill, 2026 world); soup as scripted episodes; the masterpiece plays at the end; the airfield moves to the far edge of the map |
| 2026-09-28 | The Scavenger is named **Bill** |
| 2026-09-28 | Mega Vegas Elvis as a light touch; the jet escape goes to Las Vegas (finale beats in `GAME_BIBLE.md`) |
| 2026-09-28 | Every cutscene and comic panel renders in-engine in the game's own look |
| 2026-09-28 | The cat is **Aximandra** |

## Open

- Scope of v1 (recommended: the five errands, refined).
- Voices (recommended: pre-rendered narrator plus gibberish barks).
- Phones (recommended: desktop first, touch in Phase 5).
- Story hooks 2 to 6 in `characters/bill.md`.

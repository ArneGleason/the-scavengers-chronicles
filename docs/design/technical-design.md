# Technical Design

v0, 28 September 2026. It covers how the 3D rebuild is built, run and shipped. Versions are pinned as of this date; upgrade them deliberately.

## Goals and constraints

| Constraint | Target |
|---|---|
| Launch | Opens from a URL with no install. Static hosting (GitHub Pages first). |
| First load | 3–5 MB compressed to first gameplay; later zones stream in. |
| Frame rate | 60 fps on a mid-range laptop with integrated graphics; a low tier for phones. |
| Browsers | WebGPU where available (~86%), WebGL2 fallback for the rest. Both are tested. |
| Working style | Code-first and text-diffable. No editor or binary scene files. An agent can build, test and screenshot everything from the command line. |

## Stack

| Concern | Choice | Pinned |
|---|---|---|
| Language, build | TypeScript, Vite | latest stable at setup |
| Renderer | `three` with `WebGPURenderer` (automatic WebGL2 fallback), TSL materials, `RenderPipeline` | `three@0.186.1` |
| Physics | Rapier kinematic character controller. Start with the `-compat` build (WASM inlined, no bundler plugin); switch to the plain build if the download budget gets tight. | `@dimforge/rapier3d-compat@0.21.0` |
| Spatial queries | `three-mesh-bvh` for look-at, occlusion and foot-placement raycasts | `0.9.15` |
| Synths | Tone.js, loaded only when the basement synth or the finale needs it | 15.x |
| Asset processing | `@gltf-transform/cli` (meshopt, KTX2, palette merge), headless Blender scripts | `4.5.1` |
| Tests | Vitest for logic; Playwright screenshots on WebGPU and forced WebGL2 | latest stable at setup |

**Not used:**

- pmndrs `postprocessing`, `EffectComposer`, `ShaderMaterial`, `onBeforeCompile`: none of them work with the WebGPU renderer.
- React Three Fiber: its WebGPU version is still alpha.
- Howler: no release since 2023.

## Repository layout

```
/                      README, GAME_BIBLE.md, CHANGELOG.md
/classic/              the v0.2 canvas game, unchanged, still playable
/src/                  the 3D game (layout below)
/public/assets/        processed GLB, KTX2 and audio (build output of tools/)
/assets-src/           source images, Blender files, generation manifests
/tools/                asset pipeline, content lint, contact sheets
/tests/                Vitest and Playwright
/docs/design/          these documents
```

```
src/
  main.ts        boot: capability check, quality tier, loading, intro
  core/          fixed-step loop, input, event bus, save, random
  render/        comic pipeline, comic material, camera rig, cutaways, tiers
  world/         zone loading, colliders, interactables, cutaway volumes
  actors/        player controller, gait, carrying, NPC brains, perception
  anim/          clip layers, state machine, springs, look-at, foot IK, face
  game/          missions, inventory, soup director, hazards, cinematics
  content/       items, missions, quips, discoveries, soup episodes (data)
  ui/            balloons, captions, sound-effect lettering, satchel, Research Log
  audio/         buses, music director, foley, gibberish voice, sampler
```

**Hosting.** Vite's `base` is set to `/the-scavengers-chronicles/`, with content-hashed filenames because Pages caches for 10 minutes. A GitHub Actions workflow builds and deploys. Switching Pages from "deploy from branch" to "GitHub Actions" is a repository setting you change yourself when the first build is ready.

## Runtime architecture

### Boot sequence

1. Detect WebGPU, device memory and screen size, and pick a quality tier.
2. Load the core bundle, Rapier, and the estate zone.
3. Run `renderer.compileAsync()` on the estate, so shaders don't compile mid-play.
4. Show the intro. Audio is unlocked by the player's first input.
5. Stream the next zone while the player is in the current one.

### Main loop

- The simulation runs at a **fixed 60 Hz** using an accumulator. Frame time is clamped to 0.25 s so a background tab doesn't cause a catch-up spiral.
- Rendering interpolates between the last two simulation states.
- Input edges (a key pressed this frame) are held until a simulation step consumes them, so no tap is lost between steps.
- Purely visual springs (hair, satchel, UI) run on frame time.

### Layers

```
game/ (pure logic)  ── events ──▶  render/ ui/ audio/ (presentation)
      ▲                                   
actors/ world/ (simulation, physics)
```

- `game/` never imports three.js or the DOM. Missions, inventory, soup and hazard rules are plain functions over a `GameState` object, so Vitest runs them headless.
- `actors/` and `world/` own physics bodies and movement and publish facts: `EnteredZone`, `NearInteractable`, `SeenByPatrol`.
- The presentation layers subscribe to events and never change game state directly.

### Event examples

```ts
type GameEvent =
  | { type: "ItemPickedUp"; item: ItemId; by: "bill" }
  | { type: "ItemDelivered"; item: ItemId; to: DropPointId; mission: MissionId }
  | { type: "MissionLegCompleted"; mission: MissionId; leg: number }
  | { type: "SoupEpisodeStarted"; episode: SoupEpisodeId; deadline: number }
  | { type: "Bark"; speaker: SpeakerId; poolKey: string; priority: BarkPriority }
  | { type: "Caught"; by: "bigWanda" | "patrol"; at: Vec3 };
```

**Save.** `GameState` serialises to `localStorage` at safe points (after a delivery, on entering a zone). Wrap every read and write in try/catch; a missing save starts a new game.

## Content data

All v0.2 text is ported verbatim first. Jokes are then edited in `content/`, never in logic.

```ts
interface ItemDef {
  id: ItemId;
  name: string;            // "Obscure DIN Sync Cable"
  shortName: string;
  carry: "satchel" | "heavy" | "long" | "precious";
  mass: number;            // kg; affects gait, drop thunk, hit-stop
  model: string;           // "items/din-cable.glb"
  sound: SoundSet;         // pickup, drop, rattle
  sample?: string;         // finale masterpiece sample this item records
  useText: string;
  dropText: string;
}

interface MissionDef {
  id: MissionId;
  title: string;
  summary: string;
  act: 1 | 2 | 3 | "finale";
  unlocks: MissionId[];
  legs: MissionLeg[];      // single-leg missions have one entry
  completeText: string;
}

interface MissionLeg {
  item: ItemId;
  pickup: PointRef;        // named point in a zone file, not raw coordinates
  drop: PointRef;
  pickupGuide: string;
  returnGuide: string;
  pickupText: string;
  dropText: string;
  installs?: string;       // prop that appears at home when delivered
}

interface QuipPool { key: string; lines: string[]; sticky?: boolean }
```

## Zones

Each zone is one GLB plus one JSON file.

```jsonc
// public/assets/zones/estate.json
{
  "id": "estate",
  "glb": "zones/estate.glb",
  "lighting": "estate-afternoon",
  "shadowTint": "#7fb5a6",
  "grade": "estate.cube",
  "points": { "synthAltar": [4.2, 0, -6.1], "soupPot": [-9.8, 0, 1.4] },
  "interactables": [
    { "id": "din-cable", "item": "dinCable", "at": "basementHoard" }
  ],
  "cutaways": [
    { "id": "kitchen", "volume": [[-12, 0, -2], [-6, 3, 4]], "hide": ["kitchen_roof", "kitchen_wall_s", "kitchen_wall_e"] }
  ],
  "spawn": "livingRoom",
  "cameraBounds": [[-20, -14], [16, 12]],
  "exits": [{ "to": "route", "at": "alleyGate", "lockedUntil": "starterTwo" }]
}
```

- One unit is one metre.
- Distances are tuned by walking time. In v0.2, crossing the whole map takes about 14 s at walking speed, and the soup's 45 s window assumes that.
- Blender object names carry roles by prefix: `col_` for colliders, `cut_` for cutaway geometry, `pt_` for points, `ix_` for interactables. A pipeline script turns those into the JSON.

## Render pipeline

The material stage and post stage from the art bible, in code terms.

### The comic material

`makeComicMaterial(opts)` returns a `MeshToonNodeMaterial` configured with:

- A 3-step gradient ramp, nearest-filtered.
- A `receivedShadowNode` that mixes toward the zone's shadow tint instead of black.
- A stepped rim term for characters and interactables.
- An optional halftone node, locked to the world with a constant dot size on screen.
- A hatching node driven by the baked AO mask.
- A `surfaceId` vertex attribute and a line-weight flag written to the auxiliary render target.

### Post stage (`RenderPipeline`)

1. A scene pass with multiple render targets: colour, plus one aux target packing the normal, surface ID and flags. No MSAA here, because averaged IDs create false edges.
2. An ink pass: edges from depth, surface ID and normals. Line weight comes from the flags, and background props get coloured ink.
3. An outline pass for the nearest interactable (salvage gold) and Bill's x-ray silhouette.
4. Grade: the zone's 3D LUT, paper grain, and optional misregistration.
5. SMAA (FXAA on the low tier).

Reference implementations to read first:

- three's `PixelationPassNode` (depth and normal edges in TSL).
- The `webgpu_tsl_halftone` example.
- Bruno Simon's `folio-2025`.

### Quality tiers

| Tier | Render scale | Ink | Anti-aliasing | Shadows |
|---|---|---|---|---|
| High | 1.0 | Depth, ID and normals | SMAA | Shadowed sun |
| Medium | 0.75 | Depth and ID | FXAA | Frozen static shadows |
| Low | 0.5–0.67 | Inverted hull on characters only; environment lines painted into textures | FXAA | Blob shadows |

Clutter is instanced or batched. Draw-call budget: about 150 on desktop, about 100 on phones.

## Camera rig

- Orthographic, yaw 45°, pitch 30–35° (set in Phase 0).
- **Follow:** target = Bill + velocity × 0.35 s of lookahead. Frame-rate-independent smoothing with λ ≈ 5 (`a = b + (a − b)·e^(−λ·dt)`), and a dead zone of 0.6 m so fidgets don't move the camera.
- **Zoom levels:**

  | Level | Bill's height | Used for |
  |---|---|---|
  | Game | ~110 px | Ordinary play |
  | Close | ~220 px | Interiors, dialogue |
  | Panel | Framed | Inspect moments and cutscenes |

- **Cutaways:** when Bill's capsule enters a cutaway volume, the listed meshes drop to capped stubs or hide over 200 ms.
- **Occlusion:** props between the camera and Bill fade through a Ben-Day dither inside a screen-space circle around him.
- **Shake:** from a trauma value. Offset = max × trauma² × noise(t × 20 Hz), with at most 0.15 m translation and 1.5° roll. Kept small; comedy prefers wobbling props.

## Bill's controller

A Rapier kinematic character controller: capsule radius 0.3 m, half-height 0.6 m, auto-step 0.3 m, snap to ground 0.3 m, max slope 45°. It may push dynamic bodies, which is how junk piles get barged.

| State | Top speed | To top speed | To stop | Turn smoothing |
|---|---|---|---|---|
| Shuffle | 1.3 m/s | 0.28 s | 0.18 s | 0.18 s |
| Hurry | 2.4 m/s | 0.40 s | 0.40 s with skid | 0.25 s |
| Carrying heavy | ×0.8 | +0.1 s | +0.1 s | +0.08 s |

- **Input:** the stick or keys are rotated by the camera yaw. Keyboard input is smoothed (λ ≈ 15) so diagonals blend. Analog stick: radial dead zone 0.2, response exponent 1.5; magnitude under 0.5 means sneak.
- **Involuntary movement** reuses v0.2's rules as input blends:
  - The soup pull adds a vector toward the soup target, weight 0.62 under 18 s and 1.25 under 8 s.
  - The rat chase and the patrol panic briefly take over the input.
- **Carry states** come from the carried item's `carry` field and change gait, speed and turn rate. Long items get a wider collider, so doors need a sideways shuffle.

## Animation

- `AnimationMixer` for clips. All humanoids share one Mixamo-named skeleton and rest pose, so clips bind by bone name with no retargeting.
- **Custom modules on top:**
  - Masked layers (tracks filtered by bone name).
  - A small state machine with crossfades.
  - Walk and hurry kept in phase with `syncWith`.
  - Additive clips only after `makeClipAdditive`.
- **Procedural layer,** applied after `mixer.update` and before rendering:
  - Lean into turns.
  - Squash and stretch.
  - Second-order springs for hair clumps, satchel and belly.
  - Look-at: eyes, then head after 100 ms, then torso after 250 ms, with junk scored above people.
  - Two-bone foot IK against a BVH raycast.
- **Face:** brow and mouth frames from the face atlas, a jaw bone, and the glasses mesh with a slide-down animation.
- **"On twos"** (12 fps posing) only in panel freezes and cutscenes, never in play.

## Interaction

- Interactables register with a radius and a priority.
- Each step, the nearest one in front of Bill wins and gets the salvage-gold outline, an idle bounce, and a small "?!" balloon.
- **Tap E** to grab, deliver or use. **Hold E** (0.4 s) to inspect, which opens a panel close-up.
- The prompt text comes from `content/`; the verb comes from the item and mission state.

## NPC brains

- Each NPC is a small state machine: patrol, notice, react, return. Behaviour parameters come from data.
- **Bylaw patrols** see through a flashlight cone (visible on the ground). Being seen while carrying "municipal-looking" items triggers a citation panel and a short escort back.
- **Gary** keeps v0.2's lure rule: he follows Bill when near and drifts back slowly. The Power Brick decoy makes him investigate a humming spot.
- **Big Wanda** telegraphs a charge with a dust cloud. Junk piles block her line of sight.
- **Ambient animals** keep their v0.2 triggers: rabbits flee, rats hijack Bill, birds bonk.

## Interface layer

- An HTML and CSS overlay for balloons, captions, the satchel, the Research Log and menus. Balloons are positioned by projecting each speaker's head bone every frame and clamped to the screen edges.
- **The caption and bark queue ports v0.2's rules:**
  - Priorities.
  - A 5 s cooldown for ambient barks.
  - A 250 ms handoff gap before a higher-priority line replaces the current one.
  - No-repeat quip memory.
- Sound-effect lettering lives in the 3D scene as pooled sprites.

## Cutscenes and panels

Every cutscene and comic panel renders in-engine: the same scene, materials and ink as play. See "One look, in-engine" in the art bible.

**Scripts are data.** A cutscene is a TypeScript script of timed steps in `game/cinematics/`, so an agent can write and diff it like any other content:

```ts
const wandaReveal: Cutscene = {
  id: "wandaReveal",
  pauses: ["player", "soup", "hazards"],
  steps: [
    { at: 0.0, page: "wide" },                                   // one full-width panel, letterboxed
    { at: 0.0, shot: { cam: "persp15", from: "gatePan0", to: "wandaTrailer", ease: "inOut", dur: 3.2 } },
    { at: 0.7, sfx: "gateRattle", lettering: { text: "KLANG", at: "gate" } },
    { at: 1.2, actor: "bigWanda", do: "doorBurst" },
    { at: 2.9, page: "two", panels: ["wandaClose", "billClose"] },  // split into two panels
    { at: 2.9, bark: { speaker: "bigWanda", pool: "bigWandaAdmiration" } },
    { at: 5.4, actor: "bill", expr: "soupPanic", hold: "twos" },
    { at: 5.4, caption: { pool: "bigWandaWarning" } },
    { at: 6.8, end: true }
  ]
};
```

**Shots and pages.**

- **Shots:** each shot names a camera preset (the orthographic game camera, or a narrow-lens perspective camera at 10–20°) and a path from named points in the zone file.
- **Pages:** each page is a layout of one to three panels.
- **Rendering panels:** each panel renders the scene into its own screen region using the renderer's viewport and scissor, and the gutters and borders are HTML. With three panels the scene renders three times, so pages cap at three panels and the low tier drops to two.

**Tools inside the engine:**

- **Freeze:** stop the animation clock on a key pose, keep the camera drifting slightly, turn on line boil and extra halftone.
- **On twos:** step character animation at 12 fps during cutscenes. Cameras and effects stay smooth.
- **Transitions:** `TransitionNode` wipes between pages (a page turn, a Ben-Day dissolve), plus letterbox bars.
- **Actor commands:** play an animation or expression, move to a point, look at a point, attach or detach a prop.
- **Skip:** any cutscene can be skipped. Skipping jumps to the end state the script declares, so a skip can't leave the game in the wrong state.

**Existing moments that become cutscenes:**

| v0.2 moment | 3D cutscene |
|---|---|
| Big Wanda reveal (camera pan, 6.8 s) | `wandaReveal` above |
| Big Wanda catch and game-over card | A two-panel page: Bill dragged by the collar, then the trailer interior (wedding binders, matching recliners), then a resume panel at the gate |
| Soup ruined (crying) | Freeze on Soup Grief with a caption; Aximandra in frame, unsurprised |
| Soup saved | The photo: a panel framed as a phone screenshot, with one reaction |
| Airfield ending illustration | The Vegas finale (see `GAME_BIBLE.md`) |

## Asset pipeline

```
assets-src/  ──(tools/generate: Tripo/Meshy API, manifest)──▶  raw GLB
raw GLB      ──(tools/blender: cleanup, palette snap, rig, bake)──▶  clean GLB
clean GLB    ──(tools/optimize: gltf-transform meshopt + KTX2 + palette)──▶  public/assets
public/assets ─(tools/contact-sheet: headless render under the game's pipeline)──▶  review PNG
```

- Keep toon ramps and palette textures uncompressed and nearest-filtered, since block compression smears hard steps.
- Ship `EXT_meshopt_compression` (the KHR version is still a release candidate).
- Pin KTX-Software 4.4.x or use `ktx create`; v5 removes `toktx`.

## Testing

| Test | Tool | What it checks |
|---|---|---|
| Unit | Vitest | Mission legs and unlocks, inventory limits, the soup episode director, quip no-repeat, save round-trip |
| Visual | Playwright | Fixed camera shots of each zone and of Bill's poses, on WebGPU and forced WebGL2, compared against approved images |
| Performance | Playwright plus a budget check | Frame time on a scripted walk; bundle size and first-load bytes under budget |
| Content lint | Script | Every quip key referenced exists; every mission point exists in a zone file |

## Porting map from v0.2

| v0.2 (`web/app.js`) | 3D home |
|---|---|
| `itemTypes`, `missionDefs`, `discoveries`, `optionalGoals`, `quipPools`, `*Lines` | `content/` (verbatim) |
| `missionStates`, `setActiveMission`, `unlockMissions`, legs | `game/missions.ts` |
| `inventory` | `game/inventory.ts` plus carry states |
| `soup`, `updateSoup` | `game/soupDirector.ts` (episodes instead of a timer) |
| `cops`, `rummager`, `bigWanda`, animals | `actors/npc/*` |
| `say`, `sayAmbient`, toast and narrator timing | `ui/captions.ts`, `audio/voice.ts` |
| `play*Sound` (40 procedural cues) | `audio/foley.ts` as named cues, kept as fallbacks until recorded sounds replace them |
| `drawEndingScene` | The finale cutscene and masterpiece |

## First milestone: the walking toy

This is the Phase 1 gate: two minutes of aimless walking and carrying should feel good at 60 fps.

1. Vite and TypeScript scaffold. Move v0.2 to `/classic`. Deploy workflow.
2. Renderer boot with tier detection, the comic material, and the ink pass v1.
3. A greybox living room, kitchen and basement stairs, with cutaway volumes.
4. The camera rig: follow, lookahead, dead zone, zoom levels.
5. Rapier controller with shuffle, hurry and skid; keyboard and gamepad.
6. Bill stand-in (maquette v0 geometry, then the first generated model) with springs.
7. Carry a box (satchel) and the stump (heavy), with pickup juice.
8. Footstep foley on two surfaces; a basic bus mix.
9. Playwright screenshots on both backends, and a frame-time check.

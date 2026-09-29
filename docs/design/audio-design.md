# Audio Design

v0, 28 September 2026. It covers how the game sounds, how the mix is built, and how the masterpiece finally plays.

## Principles

1. **Sound tells the joke.** Every gag has a sound, and the funniest ones have a lettered sound effect on screen too.
2. **Diegetic first.** Bill's synths, the kitchen radio and the gym's music leak into the score as you walk past them.
3. **The man is a synth obsessive.** A good part of the music is synthesised live in the browser: his gear, playing.
4. **Small downloads.** About 1 MB of audio before first play; everything else streams by zone.

## Architecture

```
one-shots ─▶ foley ─┐
one-shots ─▶ sfx ───┼─▶ per-zone reverb send
one-shots ─▶ ui ────┤
narrator  ─▶ voice ─┤   (ducks music and ambience)
barks     ─▶ voice ─┤
stems     ─▶ music ─┤
beds      ─▶ amb ───┘
all buses ─▶ master compressor ─▶ output
```

| Part | Setting |
|---|---|
| Buses | Foley, effects, interface, voice, music, ambience. Each has its own gain node and a player-facing slider (voice, music, effects). |
| Placement | Effects and foley pan by screen position (×0.7) and drop off with distance from Bill. Three.js positional audio only for a few looping sources such as the radio and the gym. The listener sits on Bill, not the camera. |
| Ducking | Voice pulls music and ambience down to 0.35 gain: 50 ms attack, 300 ms release. |
| Reverb | Generated impulse responses: basement dense and short, alley slap-back, factory long, house small and warm. |
| Master | Compressor at −6 dB threshold, 12:1, 3 ms attack, 150 ms release. |
| Loudness targets | Music −16 LUFS; voice −18 LUFS (dialogue-normalised); effect peaks at −6 dBFS |

## Music

### One key, one tempo

Every zone's stems share **96 BPM, D minor, 16-bar loops**, so layers and zone changes line up on the bar. The Vegas fantasy moves to D major.

### Zone sets

| Zone | Era | Base layer | Added layers |
|---|---|---|---|
| Estate | 1955 | Lounge organ and brushed drums, via the kitchen radio | Bill's synth drone near the basement door |
| Basement | 1986 | Synth arpeggios, drum machine | More instruments come alive as the altar fills |
| The Route | 2026 | Bland strip-mall background music | Gym thump near the gym; patrol snare |
| Big Wanda's Junkyard | 2026 | Junk percussion: bins, springs, hubcaps | Big Wanda's tuba when she's near |
| Factory | — | Industrial drones and drips | Metallic hits |
| Airfield | Vegas | A lounge swell building toward the finale | — |

### Adaptive rules

Vertical layering: every stem starts at the same moment and loops, and gain follows the game state (smoothing time 0.5–1.5 s).

| Game state | Music response |
|---|---|
| Patrol or Gary within 8 m | Tension layer up |
| Big Wanda chasing | Her tuba layer up; the base drops out |
| Soup episode | Switch at the next bar to the soup alarm segment, and back after |
| Carrying something precious | Everything thins to a tiptoe version |
| Pickup | A stinger in key, on the next beat, with the bed ducked 4–6 dB |

### Bill's leitmotif

A lazy three-note figure on a 1986-style synth. It turns up everywhere: hummed in gibberish when he idles, in the basement arpeggios, and as the hook of the masterpiece.

## The masterpiece

The finale plays the song Bill never wrote, arranged from what the player actually did.

| Delivered item | Sample it records | Role in the song |
|---|---|---|
| DIN sync cable | The first sync pulse click | Clock and hi-hat tick |
| Stump With Personality | A thunk ("wood with tone") | Kick drum |
| Speak & Spell | Its speech chip spelling "B-I-L-L" | Lead vocal |
| Rusty grate, grate shelf | Scrape and clank | Hi-hat and percussion |
| Rack rails | A metallic ring | Snare |
| Mystery cable bundle | A plucked cable twang | Bass |
| Soup | Bubbling (or a sob, if the last soup episode failed) | Sub bass wobble |
| Final Adapter | The power-on swell | Intro riser |

- A Tone.js sequencer fills eight bars from these slots, with Bill's leitmotif on the lead synth.
- Every mission is required, so every slot gets filled. Only the soup slot changes, depending on how the soup episodes went.
- It plays through the jet's PA as the jet taxis toward Vegas. The song lasts eight bars, which is the joke from the intro. It ends with a Vegas-lounge turn, then silence while Bill waits for applause. Aximandra meows once.

## Voices

| Voice | Approach | Notes |
|---|---|---|
| Narrator | Pre-rendered from a designed text-to-speech voice. ElevenLabs v3 on a paid plan, or local Qwen3-TTS VoiceDesign or Chatterbox for free. About 200 lines, 3–5 MB, streamed by zone. | Character: a deadpan documentary narrator who is clearly tired of Bill. Browser speech synthesis stays as a fallback for dynamic lines. |
| Bill | Gibberish at about 105 Hz, low-passed, 9 syllables per second, seeded per line; a tape chirp on emphasis | Plus sniffs, "hmph", slurps, grumbles and the sob-burp |
| Gary | Gibberish at about 130 Hz, raspy, fast and muttering | |
| Big Wanda | Gibberish at about 190 Hz, warm and booming, slow | |
| Bylaw officers | Gibberish at about 120 Hz, clipped monotone, with a radio squelch before each line | |
| Gym guys | Gibberish at about 115 Hz, bouncy, laugh samples | |
| Aximandra, the cat | Recorded or generated meows and purrs | A low warning trill a few seconds before each soup episode |

**How the gibberish voice works.**

- Synthesis: for each syllable (every 2–3 characters of the line), play a 60–90 ms grain: a pulse wave through two band-pass filters at vowel formant frequencies.
- Pitch: jitter each syllable by ±2 semitones. A question raises the last three syllables; an exclamation adds level and pitch.
- Consistency: seed the random generator from the line's text, so the same line always sounds the same.

**Always subtitled.** Every voiced line appears in its balloon or caption box.

## Foley and effects

- **Footsteps** fire on the gait's foot plants, not on a timer, with a surface table: linoleum, carpet, newspaper drift, stairs, grass, gravel, grate, landfill mush, puddle.
  - The shuffle is a continuous scuff loop whose level and brightness follow speed, plus soft heel taps.
  - The hurry is discrete slaps; skids squeak.
- **The satchel** rattles with cables and clanks with metal, louder as it fills and on sudden starts and stops.
- **Items** each get pickup, drop and carry-rattle sounds by material (cable, wood, metal, paper, plastic, electronics). Drop loudness and pitch scale with mass and impact speed.
- **Variation:** 3–5 takes per event from a shuffle bag, pitch ±1–2 semitones, gain ±2 dB, 60–100 ms cooldown per event.
- **Comedy set:** slide whistle, boing, bonk, kazoo honk, tape stop and record scratch. Synthesised recipes are in the research notes (planning page, section 3.5).
- **Sound effects with lettering:** CLANK!, SLURP, BONK, THUNK, SKREEE (skid), SNIFF, WHAM (Big Wanda).
- **The v0.2 procedural cues** (40 of them) are ported as named fallbacks, so every event has a sound from day one.

## Ambience

| Zone | Bed |
|---|---|
| Estate | Fridge hum, wall clock, the kitchen radio, the cat purring nearby |
| Basement | Power-supply hum, LED buzz, tape hiss, a dripping pipe |
| The Route | Distant traffic, gym music through glass, a shop door chime, bylaw radio chatter |
| Big Wanda's Junkyard | Gulls, wind, reversing-truck beeps, wind chimes made of junk at Big Wanda's trailer |
| Factory | Creaks, drips, pigeons in the rafters, wind through broken windows |
| Airfield | Wind, a distant jet whine, a flag snapping, cicadas at dusk |

## Sources and licensing

- **Music** is composed from Tone.js stems and arranged by hand. Purely AI-generated music can't be copyrighted in the US, so human arrangement stays in the loop.
  - An optional theme song could come from Suno v6 on a paid plan.
  - No real Elvis recordings and no impersonation of his voice. The Vegas flavour comes from lounge instrumentation.
- **Effects:** synthesised in code, recorded, or generated with ElevenLabs SFX (paid) or Stable Audio 3 (local).
- **Narrator:** paid-plan text-to-speech, or local open models. Tell players the narrator voice is synthetic.

## Formats and platforms

- **Files:**
  - Opus in Ogg or WebM, with an AAC `.m4a` fallback, because Safari plays Ogg Opus only from 18.4.
  - Mono for effects and voice, stereo for stems.
  - Stream anything longer than about 30 s through a media element instead of decoding it into memory.
- **Unlocking:** audio starts on the player's first input on the intro screen. Resume the audio context after visibility changes and Safari's "interrupted" state.
- **iOS:** set `navigator.audioSession.type = "playback"` so sound plays with the silent switch on. Offer a setting that leaves other apps' music playing.
- **Budget:** about 1 MB before first play (estate stems, interface sounds, Bill's grains); everything else loads per zone.

## First milestone

For the Phase 1 walking toy:

1. Bus mix and master compressor.
2. Shuffle scuff loop and hurry slaps on linoleum and carpet.
3. Satchel rattle.
4. The stump's pickup and drop thunk.
5. One estate music stem and one basement layer switching at the stairs.
6. Bill's gibberish voice on one test bark.

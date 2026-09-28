# Prompts: Bill and the Phase 0 style frames

Prompts for an image model, plus the input spec for turning Bill's turnaround into a 3D model. Attach `../reference/bill-soup-kitchen.jpg` as the likeness reference wherever the model accepts image input.

## Style block

Paste this at the start of every prompt so all images share one look.

> Ligne claire comic illustration (Franco-Belgian clear-line style) as art for a cozy isometric video game. Clean ink outlines of even weight in warm black, flat colours, simple two-tone cel shading with shadows tinted cool mint-teal rather than grey, no gradients, no painterly or photographic texture. Small Ben-Day halftone dots only in mid-tone areas and as stubble. Warm off-white paper background (#efe9dc).

Also say what to avoid:

> Avoid: photorealism, 3D-render look, soft gradients, lens blur, dramatic lighting, extra text or logos, real brand names.

## 1. Turnaround sheet

Used for the model sheet and as multi-view input for 3D generation.

> [Style block] Character model sheet: full-body turnaround of BILL, a man in his mid-fifties, drawn as a charming caricature about 4.5 heads tall. Long, stringy dark-brown hair with warm highlights hanging well past his shoulders in side curtains, thinning on top with scalp showing and a few comb-over strands. Dark wayfarer-style sunglasses with one small white glint per lens. Heavy furrowed brows, a long face, a strong slightly bulbous nose, a downturned mouth, a stubbled jaw. Red and rust plaid flannel shirt with big readable checks, charcoal knit sweater vest with a ribbed hem, dark brown corduroy trousers, scuffed brown loafers. A tan canvas satchel worn across his body, strap over the left shoulder, bag at the right hip, a few cable ends poking out. Stooped posture with his upper back curved and head pushed forward, narrow shoulders, a slight belly, big hands, big shoes. Four views at identical scale in a row: front, three-quarter front, side profile, back. A-pose, arms slightly away from the body, feet shoulder-width apart, deadpan skeptical expression. Flat even lighting, no cast shadows, plain background. Small caption under each view: FRONT, 3/4, SIDE, BACK.

For 3D input, also generate each view on its own: one full-body figure centred on a plain background, at the same scale and pose. Multi-view generators handle separate images better than a sheet, and views that don't match produce ghosting, so regenerate until they agree.

## 2. Expression sheet

> [Style block] Expression sheet for BILL (same character as the turnaround: long stringy brown hair, thinning top, dark sunglasses, stubble, plaid flannel collar and charcoal sweater vest). Eight head-and-shoulders portraits in a 4 × 2 grid, three-quarter view, each labelled underneath:
> 1. DEADPAN: brows low and flat, mouth a flat line with the corners turned down.
> 2. SUSPICIOUS: one brow up, one down, mouth pulled to one side, glasses slightly tilted.
> 3. JUNK LOVE: brows high and arched, mouth an open O, sunglasses slid down his nose to reveal small delighted eyes, a sparkle on the lens.
> 4. GRIEVANCE: brows in a deep V, teeth clenched, pushing the glasses up with one finger, a small puff of steam.
> 5. SOUP PANIC: brows raised in the middle, mouth wide and wobbling, glasses askew, sweat drops.
> 6. SOUP GRIEF: brows tented, mouth turned down and trembling, tears streaming from under the lenses.
> 7. ELVIS SNEER: one brow up, upper lip curled on one side, chin raised.
> 8. SMUG: relaxed lowered brows, half smile, a glint flashing on the glasses.
> His eyes are never visible except in JUNK LOVE.

## 3. Hero style frame: the kitchen

> [Style block] Isometric video game screenshot, orthographic camera looking down at about 30 degrees, rotated 45 degrees. A 1955 kitchen shown as a dollhouse cutaway: the two walls nearest the camera are cut down to low stubs so we can see in. Mint-green cabinets, cream walls, curtains printed with red roses, a mustard-yellow bread box, a chrome-edged speckled Formica table, chrome chairs with teal vinyl seats, a rounded cream refrigerator covered in magnets and handwritten notes, a patterned tile backsplash, a floral coffee percolator. BILL (sunglasses, long hair curtains, plaid flannel, charcoal sweater vest) sits hunched at the table over a large chipped enamel bowl hand-labelled BILL ONLY, spoon in hand, surrounded by stacks of comic books. An orange-brown tabby cat sits on the other chair. A mug reads SOUP KEEPS ME SANE (BARELY). A white comic speech balloon above Bill. A pale yellow narrator caption box with typewriter lettering at the bottom. Clean readable composition with one clear walking lane across the floor.

## 4. Style frame: the basement synth altar

> [Style block] Isometric video game screenshot, same camera as the kitchen frame. A basement cut away from the house above. A shrine of 1980s synthesizers and rack gear in black plastic with glowing orange LEDs, nests of coiled cables, towers of tied newspaper bundles, masking-tape labels reading EXHIBIT A and PROJECT (1987), an old typewriter on a side table next to a manuscript titled CAPTAIN CAFFEINE. Deep blue-violet shadows with warm orange light from the LEDs. BILL stands admiring a single cable held up to the light, sunglasses slid down his nose. One item on the altar glows with a golden outline to show it can be interacted with.

## 5. Style frame: the dumpster alley

> [Style block] Isometric video game screenshot, same camera. A 2026 strip-mall back alley in daylight: concrete, asphalt, a green dumpster, a corner-store back door, a gym window with a neon GYM sign. A hunched rival scavenger in an olive parka guards the dumpster. A bylaw officer in a peaked cap and hi-vis vest walks a patrol with a flashlight cone drawn on the ground. Two muscular gym guys in tank tops laugh by the door. BILL shuffles past with his satchel full of junk, carrying a red educational toy like a baby. Cool slate-coloured shadows.

## 6. Value study

For each style frame:

> Convert this image to five flat values of grey with no colour. Keep every line.

What to check: Bill and every interactable should hold the darkest and lightest values, and the background dressing should sit in the middle.

## From turnaround to 3D model

Check the current API docs for exact parameter names before scripting; these are the settings to look for.

| Step | Setting |
|---|---|
| Input | 3–4 separate views (front, side, back, optionally three-quarter), background removed, same scale and pose |
| Meshy 7.x image-to-3D (multi-view) | Quad topology, target around 10,000 polygons, lighting removal on, A-pose, 1024 px texture |
| Tripo P2 (multi-view, alternative) | Quad output, face limit around 12,000 |
| Cleanup (Blender, headless script) | Delete metal, roughness and normal maps. Snap the colour map to the `bill.*` palette tokens. Separate the glasses into their own mesh. Rebuild the hair as 8–12 clump meshes if the generated hair is a single blob. Keep a clean UV area for the brow and mouth atlas. |
| Rig | Mixamo bone names, the shared humanoid rest pose, no finger bones beyond a mitten plus thumb, extra bones for the jaw, glasses and each hair clump |
| Record | One JSON manifest per asset with the tool, model version, plan tier, prompt and date |

Only use paid-plan output for final assets. Free-tier output carries attribution or ownership conditions.

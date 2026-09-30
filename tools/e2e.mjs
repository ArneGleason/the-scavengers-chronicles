#!/usr/bin/env node
/**
 * End-to-end check of the game's interactions in headless Chrome: pickups and drops, the stairs,
 * deliveries, the two action challenges (Stump Wrestle, Dumpster Duel), the toot dash, the rake,
 * the skateboard, and luring Gary.
 *   node tools/e2e.mjs           -> every check
 *   node tools/e2e.mjs photo     -> only the blocks whose opening comment mentions "photo"
 *   node tools/e2e.mjs photo,duel -> blocks mentioning either
 */
import { createServer } from "vite";
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
await mkdir("shots", { recursive: true });
const server = await createServer({ server: { port: 5197, strictPort: false }, logLevel: "error" });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

const only = process.argv[2];
const want = (what) => !only || only.split(",").some((w) => what.toLowerCase().includes(w.trim().toLowerCase()));
let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? "pass" : "FAIL"} ${msg}`); if (!ok) failures++; };
/** Steer Bill to (x, z) by holding the right keys, whichever way the camera is facing. */
async function walkTo(page, x, z, { hurry = false, timeout = 20000, near = 0.35 } = {}) {
  const t0 = Date.now();
  let held = new Set();
  const set = async (keys) => {
    for (const k of held) if (!keys.has(k)) await page.keyboard.up(k);
    for (const k of keys) if (!held.has(k)) await page.keyboard.down(k);
    held = keys;
  };
  try {
    while (Date.now() - t0 < timeout) {
      const { pos: [px, , pz], yaw = Math.PI / 4 } = await page.evaluate(() => window.__scav);
      const dx = x - px, dz = z - pz, d = Math.hypot(dx, dz);
      if (d < near) return true;
      // screen right is (cos yaw, -sin yaw) in world x/z; screen up is (-sin yaw, -cos yaw)
      const right = dx * Math.cos(yaw) - dz * Math.sin(yaw), up = -dx * Math.sin(yaw) - dz * Math.cos(yaw);
      const keys = new Set(hurry ? ["ShiftLeft"] : []);
      if (right > 0.38 * d) keys.add("KeyD"); else if (right < -0.38 * d) keys.add("KeyA");
      if (up > 0.38 * d) keys.add("KeyW"); else if (up < -0.38 * d) keys.add("KeyS");
      await set(keys);
      await page.waitForTimeout(60);
    }
    return false;
  } finally {
    await set(new Set());
  }
}

/** Mash E at `perSecond` for `seconds`. */
async function mash(page, seconds, perSecond = 9) {
  const n = Math.round(seconds * perSecond);
  for (let i = 0; i < n; i++) { await page.keyboard.press("KeyE"); await page.waitForTimeout(1000 / perSecond); }
}
const scav = (page) => page.evaluate(() => window.__scav);

const slots = (page) => page.$$eval(".slot:not(.empty) span", (els) => els.map((e) => e.textContent));

async function open(hash) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
  page.on("pageerror", (e) => { console.log("pageerror", String(e)); failures++; });
  await page.goto(`${base}#${hash}`);
  await page.waitForFunction(() => window.__scav?.ready && window.__scav.frames > 40, null, { timeout: 90000 });
  return page;
}

if (want('the power brick sits on the kitchen floor at (-4.4, 0, 3.7); stand beside it, facing it')) {
  // the power brick sits on the kitchen floor at (-4.4, 0, 3.7); stand beside it, facing it
  const page = await open("at=-3.6,0,3.7&face=270");
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(1500);
  check((await slots(page)).includes("Power Brick"), "E picks up the power brick into the satchel");
  check(await page.$eval(".caption", (e) => !e.hidden && e.textContent.includes("power brick")), "narrator caption describes the pickup");
  check(await page.$eval(".balloon", (e) => !e.hidden && e.textContent.length > 0), "Bill says something in a speech balloon");
  await page.screenshot({ path: "shots/e2e-pickup.png" });
  await page.keyboard.press("KeyR");
  await page.waitForTimeout(800);
  check((await slots(page)).length === 0, "R drops it back out of the satchel");
  await page.close();
}
if (want('Stump Wrestle: E at the rooted stump starts the challenge; mashing uproots it into his hands')) {
  // Stump Wrestle: E at the rooted stump starts the challenge; mashing uproots it into his hands
  const page = await open("at=-3.0,0,9.6&face=0&zoom=close");
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(300);
  check((await scav(page)).challenge?.kind === "stump", "E at the rooted stump starts the Stump Wrestle");
  await page.screenshot({ path: "shots/e2e-stump-wrestle.png" });
  await mash(page, 2.2);
  await page.waitForTimeout(400);
  await page.screenshot({ path: "shots/e2e-stump-pop.png" });
  await page.waitForTimeout(1600);
  const s = await scav(page);
  check(!s.challenge && !s.rooted && (await slots(page)).includes("Stump"), "mashing uproots the stump and it lands in his hands");
  // walk a little while carrying it
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(1200);
  await page.keyboard.up("KeyD");
  await page.screenshot({ path: "shots/e2e-carry.png" });
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(800);
  check(!(await slots(page)).includes("Stump"), "E with nothing in reach puts the stump down");
  await page.close();
}
if (want('four satchel items already carried; the power brick on the kitchen floor should be refused')) {
  // four satchel items already carried; the power brick on the kitchen floor should be refused
  const page = await open("at=-3.6,0,3.7&face=270&give=dinCable,cableBundle,newspaperBundle,speakAndSpell");
  await page.waitForTimeout(800);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(700);
  check((await slots(page)).length === 4 && !(await slots(page)).includes("Power Brick"), "a full satchel refuses the power brick");
  check(await page.$eval(".balloon", (e) => e.textContent.includes("capacity")), "Bill consults counsel about capacity");
  await page.screenshot({ path: "shots/e2e-refuse.png" });
  await page.close();
}

if (want('down the stairs to the basement and back up again (world +X is screen right + down)')) {
  // down the stairs to the basement and back up again (world +X is screen right + down)
  const page = await open("at=0.1,-2.6,-3.7&face=90");
  await page.keyboard.down("KeyD");
  await page.keyboard.down("KeyS");
  await page.waitForTimeout(7000);
  await page.keyboard.up("KeyD");
  await page.keyboard.up("KeyS");
  const [x, y] = await page.evaluate(() => window.__scav.pos);
  check(y > -0.1 && x > 4.4, `climbs the basement stairs back up to the hall (ended at x ${x.toFixed(2)}, y ${y.toFixed(2)})`);
  await page.close();
}

if (want('Errand 1: carrying the DIN cable at the synth altar, E delivers it')) {
  // Errand 1: carrying the DIN cable at the synth altar, E delivers it
  const page = await open("at=-2.3,-2.6,-3.55&face=180&give=dinCable");
  await page.waitForTimeout(700);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(1500);
  const s = await page.evaluate(() => ({ stages: window.__scav.stages, active: window.__scav.active }));
  check(s.stages.cablePilgrimage === "complete", "delivering the DIN cable completes the Sacred Cable Pilgrimage");
  check(s.stages.stumpProphecy === "find" && s.stages.dumpsterDiplomacy === "locked" && s.active === "stumpProphecy", "it unlocks the stump errand next, and only that");
  await page.screenshot({ path: "shots/e2e-deliver.png" });
  await page.close();
}
if (want('Hoard Dive: the DIN cable is buried in the basement hoard; E starts the dig, mashing finds it')) {
  // Hoard Dive: the DIN cable is buried in the basement hoard; E starts the dig, mashing finds it
  const page = await open("at=-2.0,-2.6,1.75&face=180&zoom=close");
  const s0 = await scav(page);
  check(s0.buried && s0.poke === "hoard", `the cable starts buried and E is offered at the hoard (poke ${s0.poke})`);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(300);
  check((await scav(page)).challenge?.kind === "hoard", "E at the hoard starts the Hoard Dive");
  await mash(page, 1.2);
  await page.screenshot({ path: "shots/e2e-hoard-dive.png" });
  await mash(page, 2.8);
  await page.waitForTimeout(250);
  await page.screenshot({ path: "shots/e2e-hoard-geyser.png" });
  await page.waitForTimeout(1500);
  const s1 = await scav(page);
  check(!s1.challenge && !s1.buried && s1.inv.includes("dinCable"), `mashing digs out the DIN cable into the satchel (${s1.inv})`);
  await page.close();
}
for (const [name, hash, wait, slap, extra] of want("poke props toaster fridge adapters") ? [
  ["toaster", "at=-4.85,0,2.3&face=270&zoom=close", 3400, "stagger"],
  ["fridge", "at=-4.6,0,4.5&face=270&zoom=close", 1900, "buttflop", (a, b) => b.pos[0] - a.pos[0] > 0.8],
  ["adapters", "at=8.6,0,16.95&face=180&zoom=close", 2100, "faceplant"],
] : []) {
  // the props you can poke: each one ends with Bill on the floor
  const page = await open(hash);
  const a = await scav(page);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `shots/e2e-${name}.png` });
  const b = await scav(page);
  check(a.poke === name && b.slap === slap && (!extra || extra(a, b)), `E at the ${name} plays its gag (poke ${a.poke}, ${b.slap})`);
  await page.close();
}
if (want('the masterpiece: E, R, then E again, and the third note always goes wrong')) {
  // the masterpiece: E, R, then E again, and the third note always goes wrong
  const page = await open("at=2.1,0,3.7&face=0&zoom=close");
  const a = await scav(page);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(500);
  const b = await scav(page);
  for (const k of ["KeyE", "KeyR", "KeyE"]) { await page.keyboard.press(k); await page.waitForTimeout(450); }
  await page.screenshot({ path: "shots/e2e-jam.png" });
  const c = await scav(page);
  await page.waitForTimeout(3300);
  const d = await scav(page);
  check(a.poke === "synth" && b.jam.active && c.jam.step === 3 && !d.jam.active && d.jam.takes === 1, `E at a keyboard plays a three-note take that ends on a wrong note (step ${c.jam.step}, takes ${d.jam.takes})`);
  await page.close();
}
if (want('the soup: an ingredient in his pocket, a distillation at the stove, a photo to every contact')) {
  // the soup: an ingredient in his pocket, a distillation at the stove, a photo to every contact
  const page = await open("at=-4.75,0,0.6&face=270&zoom=close&soup=2");
  const a = await scav(page);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(4600);
  await page.screenshot({ path: "shots/e2e-soup-phone.png" });
  const replies = await page.$$eval(".phone li", (els) => els.length);
  await page.waitForTimeout(1500);
  const b = await scav(page);
  check(a.poke === "stove" && b.soup.distilled === 1 && b.soup.pocket === 1 && replies >= 2, `a distillation adds an ingredient and sends the photo (distilled ${b.soup.distilled}, ${replies} replies)`);
  await page.close();
}
if (want('walking up to an ingredient collects it')) {
  // walking up to an ingredient collects it
  const page = await open("at=-6.5,0,8.6&face=270&zoom=close");
  await walkTo(page, -7.2, 8.6, { timeout: 3000, near: 0.2 });
  await page.waitForTimeout(300);
  check((await scav(page)).soup.pocket === 1, "walking up to the backyard dandelion puts it in his pocket");
  await page.close();
}
if (want("photo: delivering the cable ends with a commemorative photo card")) {
  // photo: delivering the cable ends with a commemorative photo card
  const page = await open("at=-2.3,-2.6,-3.55&face=180&give=dinCable");
  await page.waitForTimeout(700);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(1900);
  await page.screenshot({ path: "shots/e2e-photo-pose.png" });
  await page.waitForTimeout(3300);
  await page.screenshot({ path: "shots/e2e-photo-card.png" });
  const a = await scav(page);
  const replies = await page.$$eval(".photocard li", (els) => els.length);
  check(a.card && a.album.includes("cablePilgrimage") && a.photoOk && replies >= 2, `a delivery ends in a photo card with a real frame from the game (${a.album}, ok ${a.photoOk}, ${replies} replies)`);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(400);
  check(!(await scav(page)).card, "E puts the photo card away");
  await page.close();
}
if (want("order: an errand done early is done")) {
  // order: an errand done early is done; delivering the Speak & Spell before its turn completes it
  const page = await open("at=-2.3,-2.6,-3.55&face=180&give=speakAndSpell");
  await page.waitForTimeout(700);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(1500);
  const s = await scav(page);
  check(s.stages.dumpsterDiplomacy === "complete" && s.active === "cablePilgrimage", `the Speak & Spell delivered early completes its errand, and the cable is still next (${s.stages.dumpsterDiplomacy}, ${s.active})`);
  await page.close();
}
if (want('Dumpster Duel, won: Gary goes in the bin, the Speak & Spell goes in the satchel')) {
  // Dumpster Duel, won: Gary goes in the bin, the Speak & Spell goes in the satchel
  const page = await open("at=25.1,0,14.05&face=180&skip=cablePilgrimage,stumpProphecy&zoom=game");
  await page.waitForTimeout(600);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(700);
  const s0 = await scav(page);
  check(s0.challenge?.kind === "duel" && s0.gary === "tug", "E at the guarded Speak & Spell starts the Dumpster Duel");
  await page.screenshot({ path: "shots/e2e-duel.png" });
  await mash(page, 1.0);
  await page.screenshot({ path: "shots/e2e-catfight.png" });
  await mash(page, 1.4);
  await page.waitForTimeout(900);
  await page.screenshot({ path: "shots/e2e-duel-won.png" });
  const s1 = await scav(page);
  check(!s1.challenge && s1.gary === "binned" && s1.stages.dumpsterDiplomacy === "deliver", `mashing wins the duel and bins Gary (gary ${s1.gary}, stage ${s1.stages.dumpsterDiplomacy})`);
  await page.close();
}
if (want('Dumpster Duel, lost: no mashing, Bill gets flung and the prize goes back on the heap')) {
  // Dumpster Duel, lost: no mashing, Bill gets flung and the prize goes back on the heap
  const page = await open("at=25.1,0,14.05&face=180&skip=cablePilgrimage,stumpProphecy&zoom=game");
  await page.waitForTimeout(600);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(3600);
  await page.screenshot({ path: "shots/e2e-duel-lost.png" });
  const s = await scav(page);
  check(!s.challenge && s.stages.dumpsterDiplomacy === "find" && s.pos[2] > 15.2, `losing the duel flings Bill into the lane (z ${s.pos[2].toFixed(2)}) and Gary keeps the prize`);
  await page.close();
}
if (want('the toot dash: a soup charge, a burst forward; the cloud makes Gary gag, and the prize is free')) {
  // the toot dash: a soup charge, a burst forward; the cloud makes Gary gag, and the prize is free
  const page = await open("at=25.1,0,15.3&face=0&skip=cablePilgrimage,stumpProphecy&zoom=game");
  await page.waitForTimeout(600);
  const before = await scav(page);
  await page.keyboard.press("Space");
  await page.waitForTimeout(250);
  await page.screenshot({ path: "shots/e2e-toot.png" });
  await page.waitForTimeout(500);
  const after = await scav(page);
  check(after.gas === before.gas - 1 && after.pos[2] - before.pos[2] > 1.0, `Space spends soup and dashes him forward (${(after.pos[2] - before.pos[2]).toFixed(2)} m)`);
  check(after.gary === "gag", `the toot cloud makes Gary gag (${after.gary})`);
  await walkTo(page, 25.1, 13.9, { hurry: true, timeout: 5000, near: 0.3 });
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(900);
  check((await scav(page)).stages.dumpsterDiplomacy === "deliver", "while Gary gags, E just takes the Speak & Spell");
  await page.close();
}
if (want('the rake on the path home from the dig patch')) {
  // the rake on the path home from the dig patch
  const page = await open("at=-3.25,0,7.3&face=0&zoom=close");
  // world +Z is screen down-left (S+A); stop the moment the rake fires and catch the smack
  await page.keyboard.down("KeyS"); await page.keyboard.down("KeyA");
  const t0 = Date.now();
  while (Date.now() - t0 < 4000 && !(await scav(page)).hits?.rake) await page.waitForTimeout(40);
  await page.keyboard.up("KeyS"); await page.keyboard.up("KeyA");
  await page.waitForTimeout(120);
  await page.screenshot({ path: "shots/e2e-rake.png" });
  const s = await scav(page);
  check(s.hits.rake === 1, `stepping on the rake smacks him in the face (hits ${s.hits.rake}, ${s.slap})`);
  await page.close();
}
if (want('the skateboard in the lane: he rides it east, then it shoots out from under him')) {
  // the skateboard in the lane: he rides it east, then it shoots out from under him
  const page = await open("at=3.6,0,17.6&face=90&zoom=game");
  await page.keyboard.down("KeyD"); await page.keyboard.down("KeyS");
  await page.waitForTimeout(1300);
  await page.keyboard.up("KeyD"); await page.keyboard.up("KeyS");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "shots/e2e-board.png" });
  await page.waitForTimeout(2600);
  const s = await scav(page);
  check(s.hits.board === 1 && s.pos[0] > 7.5 && !s.ride, `stepping on the skateboard rides him down the lane until he wipes out (x ${s.pos[0].toFixed(1)})`);
  await page.close();
}
const DONE3 = "skip=cablePilgrimage,stumpProphecy,dumpsterDiplomacy";
if (want('errand 4: grab the grate and Big Wanda gives chase; shuffle away and she catches him and throws him out')) {
  // errand 4: grab the grate and Big Wanda gives chase; shuffle away and she catches him and throws him out
  const page = await open(`at=54.5,0,8.3&face=180&zoom=game&${DONE3}`);
  await page.waitForTimeout(500);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(1200);
  const a = await scav(page);
  check(a.inv.includes("rustyGrate") && a.wanda === "chase", `picking up the grate sets Big Wanda chasing (${a.wanda})`);
  await page.screenshot({ path: "shots/e2e-wanda-chase.png" });
  // shuffle toward the gate: too slow with a grate in his hands
  await page.keyboard.down("KeyW");
  const t0 = Date.now();
  while (Date.now() - t0 < 12000 && !(await scav(page)).tossed) await page.waitForTimeout(100);
  await page.keyboard.up("KeyW");
  await page.waitForTimeout(250);
  await page.screenshot({ path: "shots/e2e-wanda-toss.png" });
  await page.waitForTimeout(1800);
  const b = await scav(page);
  check(!b.inv.includes("rustyGrate") && b.pos[2] > 16, `she catches a shuffling Bill, keeps the grate, and throws him into the lane (z ${b.pos[2].toFixed(1)})`);
  await page.close();
}
if (want('hurrying out of the gate with the grate: a winded Wanda gives up')) {
  // hurrying out of the gate with the grate: a winded Wanda gives up
  const page = await open(`at=48,0,13.2&face=0&zoom=game&${DONE3}&give=rustyGrate&wanda=winded`);
  await page.waitForTimeout(800);
  await walkTo(page, 47.5, 19.2, { hurry: true, timeout: 7000 });
  await page.waitForTimeout(2500);
  const s = await scav(page);
  check(s.inv.includes("rustyGrate") && s.wanda !== "chase", `a hurrying Bill gets out of the gate with the grate (Wanda ${s.wanda})`);
  await page.close();
}
if (want('the workbench: deliver the grate, hammer it into a shelf, pick the shelf up')) {
  // the workbench: deliver the grate, hammer it into a shelf, pick the shelf up
  const page = await open(`at=7.8,0,7.75&face=0&zoom=close&${DONE3}&give=rustyGrate`);
  await page.waitForTimeout(800);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(700);
  check((await scav(page)).challenge?.kind === "hammer", "delivering the grate to the workbench starts the hammering");
  await mash(page, 1.5);
  await page.screenshot({ path: "shots/e2e-hammer.png" });
  // mash until the shelf is done (headless frames are slow, so don't count presses)
  const t0 = Date.now();
  while (Date.now() - t0 < 10000 && (await scav(page)).challenge) await mash(page, 0.5);
  await page.waitForTimeout(1500);
  if (!(await scav(page)).inv.includes("grateShelf")) { await page.keyboard.press("KeyE"); await page.waitForTimeout(1200); }
  const b = await scav(page);
  check(b.stages.grateShelf === "complete" && b.stages.grateVault === "deliver" && b.inv.includes("grateShelf"), `the grate becomes a shelf on the bench, and he picks it up (${b.inv})`);
  await page.close();
}
if (want('the vault: the shelf goes on top of the antique vault')) {
  // the vault: the shelf goes on top of the antique vault
  const page = await open(`at=-3.7,0,-3.6&face=180&zoom=close&${DONE3},grateShelf&give=grateShelf`);
  await page.waitForTimeout(900);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "shots/e2e-vault.png" });
  check((await scav(page)).stages.grateVault === "complete", "delivering the shelf to the vault completes the Grate Shelf Revelation");
  await page.close();
}
const DONE5 = `${DONE3},grateShelf,grateVault`;
if (want("street: the camera turns round in the front yard, and the arrow goes via the doors")) {
  // street: the camera turns round in the front yard, and the arrow goes via the doors
  const page = await open("at=-0.7,0,-8&face=0&zoom=game");
  await page.waitForTimeout(600);
  const a = await scav(page);
  check(a.reversed === true, "in the front yard the camera turns round to show the front of the house");
  await page.close();
  const p2 = await open("at=-3,0,10&face=200&zoom=game");
  await p2.waitForTimeout(400);
  const b = await scav(p2);
  check(b.reversed === false && b.waypoint === "BACK DOOR", `from the back yard, the arrow to the basement goes via the back door (${b.waypoint})`);
  await p2.close();
}
if (want("street: the noise complaint, typed at the Legal Department and delivered to the Lug Nutz")) {
  // street: the noise complaint, typed at the Legal Department and delivered to the Lug Nutz
  const page = await open(`at=-3.3,0,-1.35&face=180&zoom=close&${DONE5}`);
  await page.waitForTimeout(500);
  const a = await scav(page);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(500);
  check(a.poke === "typewriter" && (await scav(page)).challenge?.kind === "legal", `E at the typewriter opens the Legal Department (poke ${a.poke})`);
  let t0 = Date.now();
  while (Date.now() - t0 < 12000 && (await scav(page)).challenge) await mash(page, 0.5);
  await page.waitForTimeout(1200);
  check((await scav(page)).inv.includes("complaint"), "mashing types the complaint into the satchel");
  await page.close();
  const p2 = await open(`at=35.4,0,11.6&face=180&zoom=game&${DONE5}&give=complaint`);
  await p2.waitForTimeout(700);
  await p2.keyboard.press("KeyE");
  await p2.waitForTimeout(600);
  check((await scav(p2)).challenge?.kind === "insults", "delivering the complaint at the gym starts the Insult Volley");
  await mash(p2, 1.2);
  await p2.screenshot({ path: "shots/e2e-insults.png" });
  t0 = Date.now();
  while (Date.now() - t0 < 12000 && (await scav(p2)).challenge) await mash(p2, 0.5);
  await p2.waitForTimeout(1500);
  check((await scav(p2)).stages.noiseComplaint === "complete", "the Lug Nutz accept the complaint (as a doormat)");
  await p2.close();
}
if (want("street: Kevin's parcels, protected")) {
  // street: Kevin's parcels, protected
  const page = await open(`at=0.2,0,-23.3&face=180&zoom=game&${DONE5},noiseComplaint`);
  await page.waitForTimeout(700);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(1200);
  check((await scav(page)).inv.includes("parcels"), "E on Kevin's stoop takes his parcels");
  await page.close();
  const p2 = await open(`at=-0.7,0,-6.6&face=0&zoom=game&${DONE5},noiseComplaint&give=parcels`);
  await p2.waitForTimeout(900);
  await p2.keyboard.press("KeyE");
  await p2.waitForTimeout(1500);
  check((await scav(p2)).stages.parcelProtection === "complete", "delivering them to Bill's own stoop protects them");
  await p2.close();
}
if (want("street: the pitch, sticky note by sticky note")) {
  // street: the pitch, sticky note by sticky note
  const page = await open(`at=0.2,0,-23.2&face=180&zoom=game&${DONE5},noiseComplaint,parcelProtection&give=movieIdeas`);
  await page.waitForTimeout(900);
  const a = await scav(page);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(600);
  check(a.kevin && (await scav(page)).challenge?.kind === "pitch", "Kevin is home, and E at his door starts The Pitch");
  await mash(page, 1.5);
  await page.screenshot({ path: "shots/e2e-pitch.png" });
  const t0 = Date.now();
  while (Date.now() - t0 < 12000 && (await scav(page)).challenge) await mash(page, 0.5);
  await page.waitForTimeout(1500);
  check((await scav(page)).stages.thePitch === "complete", "Kevin is pitched: The Pitch is complete");
  await page.close();
}
const DONE8 = `${DONE5},noiseComplaint,parcelProtection,thePitch`;
if (want("neighbours: Wanda's gate is locked until the cable and the stump are done")) {
  // neighbours: Wanda's gate is locked until the cable and the stump are done
  const page = await open("at=48,0,17.6&face=180&zoom=game");
  await page.waitForTimeout(400);
  check((await scav(page)).junkGate === "closed", "at the start, Big Wanda's gate is padlocked");
  await walkTo(page, 48, 12.5, { timeout: 3500 });
  check((await scav(page)).pos[2] > 14.8, "and Bill can't get through it");
  await page.close();
  const p2 = await open("at=48,0,17.6&face=180&zoom=game&skip=cablePilgrimage,stumpProphecy");
  await p2.waitForTimeout(1800);
  check((await scav(p2)).junkGate === "open", "with the cable and the stump done, it's open");
  await p2.close();
}
if (want("neighbours: the camera faces Bill's side of the street until he crosses the road")) {
  // neighbours: the camera faces Bill's side of the street until he crosses the road
  const page = await open("at=23.5,0,-12&face=0&zoom=game");
  await page.waitForTimeout(500);
  const a = await scav(page);
  await walkTo(page, 23.5, -21, { timeout: 8000 }); // between the parked cars
  await page.waitForTimeout(500);
  const b = await scav(page);
  check(a.reversed && !b.reversed, `on the sidewalk by the store it faces his side; across the road it turns back (${a.reversed} -> ${b.reversed})`);
  await page.close();
}
if (want("neighbours: Captain Caffeine to Kevin, then his pointless favours")) {
  // neighbours: Captain Caffeine to Kevin, then his pointless favours
  const page = await open(`at=0.2,0,-23.2&face=180&zoom=game&${DONE8}&give=manuscript`);
  await page.waitForTimeout(900);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(1500);
  const a = await scav(page);
  check(a.stages.theManuscript === "complete" && a.favours.stage === "doing", `the manuscript goes to Kevin, and Kevin asks a favour (${a.favours.stage})`);
  await page.close();
  const p2 = await open(`at=-0.7,0,-6.3&face=0&zoom=game&${DONE8},theManuscript&favour=0`);
  await p2.waitForTimeout(6000);
  await p2.screenshot({ path: "shots/e2e-favour-wait.png" });
  await p2.waitForTimeout(8000);
  check((await scav(p2)).favours.stage === "report", "standing on his stoop long enough counts as watching for Kevin's van");
  await p2.close();
  const p3 = await open(`at=0.2,0,-23.2&face=180&zoom=game&${DONE8},theManuscript&favour=0:report`);
  await p3.waitForTimeout(900);
  await p3.keyboard.press("KeyE");
  await p3.waitForTimeout(1200);
  const c = await scav(p3);
  check(c.favours.stage === "doing" && c.favours.n === 1, `reporting back gets him another favour (#${c.favours.n + 1})`);
  await p3.close();
}
if (want("neighbours: his former students, and life lessons")) {
  // neighbours: his former students, and life lessons
  const page = await open("at=28.3,0,-9.3&face=0&zoom=game");
  await page.waitForTimeout(800);
  const a = await scav(page);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(500);
  check(a.poke === "kids" && (await scav(page)).challenge?.kind === "lessons", `E by the kids starts LIFE LESSONS (poke ${a.poke})`);
  await mash(page, 1.2);
  await page.screenshot({ path: "shots/e2e-lessons.png" });
  const t0 = Date.now();
  while (Date.now() - t0 < 12000 && (await scav(page)).challenge) await mash(page, 0.5);
  await page.waitForTimeout(5500);
  check((await scav(page)).album.includes("kids"), "a grudging compliment, and a class photo");
  await page.close();
}
if (want("neighbours: Bill has something to say about where he is")) {
  // neighbours: Bill has something to say about where he is
  const page = await open("at=-3,0,2.4&face=270&zoom=close");
  await page.waitForTimeout(3500);
  const s = await scav(page);
  const said = await page.$eval(".balloon-bill", (e) => !e.hidden && e.textContent.length > 0).catch(() => false);
  check(s.zone === "kitchen" && said, `in the kitchen, he says something about the kitchen (${s.zone})`);
  await page.close();
}
if (want('the old way still works: lure Gary down the lane and beat him back to the prize')) {
  // the old way still works: lure Gary down the lane and beat him back to the prize
  const page = await open("at=25.1,0,14.05&face=180&skip=cablePilgrimage,stumpProphecy&zoom=game");
  await page.waitForTimeout(600);
  await walkTo(page, 24.9, 16.9);
  const followed = await page.evaluate(() => window.__scav.gary);
  await walkTo(page, 12.8, 17.6, { timeout: 25000 });
  await page.screenshot({ path: "shots/e2e-gary-lure.png" });
  const t0 = Date.now();
  while (Date.now() - t0 < 12000 && !["drift", "return"].includes(await page.evaluate(() => window.__scav.gary))) await page.waitForTimeout(200);
  const drifting = await page.evaluate(() => window.__scav.gary);
  check(followed === "follow" && ["drift", "return"].includes(drifting), `Gary follows Bill down the lane, then gives up (${followed} -> ${drifting})`);
  await walkTo(page, 25.0, 16.6, { hurry: true, timeout: 15000 });
  await walkTo(page, 25.1, 13.9, { hurry: true, timeout: 6000, near: 0.3 });
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(900);
  const got = await page.evaluate(() => window.__scav.stages.dumpsterDiplomacy);
  check(got === "deliver", `a hurrying Bill beats Gary back and grabs the Speak & Spell (stage ${got})`);
  await page.screenshot({ path: "shots/e2e-gary-won.png" });
  await page.close();
}

await browser.close();
await server.close();
console.log(failures ? `${failures} failure(s)` : "all interaction checks passed");
process.exit(failures ? 1 : 0);

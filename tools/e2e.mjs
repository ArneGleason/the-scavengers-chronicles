#!/usr/bin/env node
/**
 * End-to-end check of the game's interactions in headless Chrome: pickups and drops, the stairs,
 * deliveries, the two action challenges (Stump Wrestle, Dumpster Duel), the toot dash, the rake,
 * the skateboard, and luring Gary.
 *   node tools/e2e.mjs
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

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? "pass" : "FAIL"} ${msg}`); if (!ok) failures++; };
/** Steer Bill to (x, z) by holding the right keys (camera yaw 45°: D+S is +X, S+A is +Z). */
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
      const [px, , pz] = await page.evaluate(() => window.__scav.pos);
      const dx = x - px, dz = z - pz, d = Math.hypot(dx, dz);
      if (d < near) return true;
      const right = (dx - dz) * Math.SQRT1_2, up = (-dx - dz) * Math.SQRT1_2;
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

{
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
{
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
{
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

{
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

{
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
{
  // Dumpster Duel, won: Gary goes in the bin, the Speak & Spell goes in the satchel
  const page = await open("at=25.1,0,14.05&face=180&skip=cablePilgrimage,stumpProphecy&zoom=game");
  await page.waitForTimeout(600);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(700);
  const s0 = await scav(page);
  check(s0.challenge?.kind === "duel" && s0.gary === "tug", "E at the guarded Speak & Spell starts the Dumpster Duel");
  await page.screenshot({ path: "shots/e2e-duel.png" });
  await mash(page, 2.4);
  await page.waitForTimeout(900);
  await page.screenshot({ path: "shots/e2e-duel-won.png" });
  const s1 = await scav(page);
  check(!s1.challenge && s1.gary === "binned" && s1.stages.dumpsterDiplomacy === "deliver", `mashing wins the duel and bins Gary (gary ${s1.gary}, stage ${s1.stages.dumpsterDiplomacy})`);
  await page.close();
}
{
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
{
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
{
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
{
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
{
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

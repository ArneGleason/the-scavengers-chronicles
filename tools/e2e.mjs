#!/usr/bin/env node
/**
 * End-to-end check of the walking toy's interactions in headless Chrome:
 * pick up a satchel item, drop it, pick up the stump, and get refused when the satchel is full.
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
  const page = await open("at=-3.0,0,9.6&face=0&zoom=close");
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(1200);
  check((await slots(page)).includes("Stump"), "E lifts the stump into his hands");
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
  // four satchel items pre-filled (brick, Speak & Spell, newspapers, DIN cable);
  // the cable bundle left in the basement should be refused
  const page = await open("at=3.6,-2.6,1.45&face=0&satchel=4");
  await page.waitForTimeout(800);
  await page.keyboard.press("KeyE");
  await page.waitForTimeout(700);
  check((await slots(page)).length === 4 && !(await slots(page)).includes("Cable Bundle"), "a full satchel refuses the cable bundle");
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

await browser.close();
await server.close();
console.log(failures ? `${failures} failure(s)` : "all interaction checks passed");
process.exit(failures ? 1 : 0);

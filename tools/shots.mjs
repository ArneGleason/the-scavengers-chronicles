#!/usr/bin/env node
/**
 * Screenshot the walking toy in headless Chrome (system install, no browser download).
 *   node tools/shots.mjs            -> shots/*.png for the default set
 *   node tools/shots.mjs living     -> only shots whose name contains "living"
 * Uses the hash hooks documented in src/main.ts. Headless Chrome usually has no WebGPU,
 * so these exercise the WebGL2 fallback; check WebGPU in a real browser.
 */
import { createServer } from "vite";
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SHOTS = [
  ["living-room", "at=2.4,0,2.2&face=200&debug=1"],
  ["kitchen", "at=-3.4,0,4.0&face=150&expr=junklove"],
  ["back-hall", "at=-2.0,0,-2.0&face=225&satchel=2"],
  ["stairs", "at=3.2,-1.0,-3.7&face=270"],
  ["basement", "at=-1.5,-2.6,1.6&face=200&debug=1"],
  ["backyard-stump", "at=-2.0,0,9.6&face=250&carry=1&zoom=game"],
  ["backyard-walk", "at=0,0,9&walk=1&zoom=game"],
  ["behind-house", "at=-8,0,-8&face=45&zoom=game"],
  ["phone", "at=2.4,0,2.2&face=200", { width: 390, height: 844 }],
  ["route-gate", "at=0.5,0,16.8&face=90&debug=1"],
  ["route-dumpster", "at=24.5,0,17.4&face=0&skip=cablePilgrimage"],
  ["route-lot", "at=17.5,0,6&face=90"],
  ["route-street", "at=-2,0,-5.8&face=90"],
  // slapstick: [name, hash, viewport, extra wait in ms]
  ["gag-poop", "at=0.5,0,16.8&face=200&zoom=close&gag=poop", null, 1900],
  ["gag-gust", "at=0.5,0,12&face=200&zoom=close&gag=gust", null, 2100],
  ["gag-nose", "at=2.4,0,2.2&face=200&zoom=close&gag=nose", null, 1900],
  ["gag-burp", "at=2.4,0,2.2&face=200&zoom=close&gag=burp", null, 1500],
  ["stump-rooted", "at=-3.0,0,9.5&face=0&zoom=close"],
  ["junkyard", "at=48,0,17&face=160&skip=cablePilgrimage,stumpProphecy,dumpsterDiplomacy"],
  ["junkyard-wanda", "at=53,0,6&face=90&zoom=game&skip=cablePilgrimage,stumpProphecy,dumpsterDiplomacy", null, 2500],
  ["workbench", "at=7.8,0,7.6&face=20&zoom=close"],
  ["guide-house", "at=2.4,0,2.2&face=200"],
  ["guide-yard", "at=-3,0,10&face=200&zoom=game"],
  ["guide-street", "at=6,0,-16&face=90&zoom=game"],
  ["hood-legal", "at=-3.3,0,-1.3&face=180&zoom=close"],
  ["hood-lugnutz", "at=35.5,0,14&face=180&zoom=game", null, 1500],
  ["hood-kevin", "at=0.2,0,-22&face=180&zoom=game&skip=cablePilgrimage,stumpProphecy,dumpsterDiplomacy,grateShelf,grateVault,noiseComplaint,parcelProtection", null, 1500],
  ["hood-joggers", "at=-4,0,-12.5&face=90&zoom=game", null, 6000],
  ["front-yard", "at=-0.7,0,-8.5&face=0&zoom=game", null, 1200],
  ["front-street", "at=0,0,-16&face=180&zoom=game"],
  ["front-kevin", "at=0.2,0,-22.4&face=180&zoom=game"],
  ["gym-inside", "at=36,0,4&face=200&zoom=game"],
  ["gym-front", "at=36,0,-9&face=180&zoom=game"],
];

const filter = process.argv[2];
await mkdir("shots", { recursive: true });
const server = await createServer({ server: { port: 5199, strictPort: false }, logLevel: "error" });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
let failed = 0;
for (const [name, hash, viewport, wait] of SHOTS) {
  if (filter && !name.includes(filter)) continue;
  const page = await browser.newPage({ viewport: viewport ?? { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(String(e)));
  try {
    const crashed = new Promise((_, reject) => page.on("pageerror", (e) => reject(e)));
    await page.goto(`${base}${process.env.Q ?? ""}#${hash}`);
    await Promise.race([page.waitForFunction(() => window.__scav?.ready && window.__scav.frames > 90, null, { timeout: 90000 }), crashed]);
    if (wait) await page.waitForTimeout(wait);
    await page.screenshot({ path: `shots/${name}.png` });
    const backend = await page.evaluate(() => window.__scav.backend);
    console.log(`ok   ${name} (${backend})${errors.length ? `  [${errors.length} console errors]` : ""}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${name}: ${e.message.split("\n")[0]}`);
    await page.screenshot({ path: `shots/${name}-FAILED.png` }).catch(() => {});
  }
  for (const e of errors.slice(0, 20)) console.log(`     ${e.slice(0, 300)}`);
  await page.close();
}
await browser.close();
await server.close();
process.exit(failed ? 1 : 0);

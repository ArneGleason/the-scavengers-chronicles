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
for (const [name, hash, viewport] of SHOTS) {
  if (filter && !name.includes(filter)) continue;
  const page = await browser.newPage({ viewport: viewport ?? { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => errors.push(String(e)));
  try {
    await page.goto(`${base}${process.env.Q ?? ""}#${hash}`);
    await page.waitForFunction(() => window.__scav?.ready && window.__scav.frames > 90, null, { timeout: 90000 });
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

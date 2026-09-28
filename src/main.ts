/**
 * The Scavenger's Chronicles, walking toy (Phase 1 of docs/design/technical-design.md).
 * Gate: two minutes of aimless walking and carrying should feel good at 60 fps.
 *
 * Hash hooks for screenshots and tests (combine with &):
 *   #at=x,y,z  face=deg  zoom=game|close  ui=0  debug=1  walk=1 (autopilot)  hurry=1
 *   carry=1 (stump in hands)  satchel=n (pre-fill)  expr=junklove|suspicious|soupgrief|elvis
 */
import * as THREE from "three/webgpu";
import { createGfx } from "./render/renderer";
import { CameraRig, CAM } from "./render/cameraRig";
import { ensureInkNormals } from "./render/ink";
import { Physics } from "./world/physics";
import { buildEstate, HOUSE } from "./world/estate";
import { Items, type WorldItem } from "./world/items";
import { BillRig, type Expression } from "./actors/bill/billModel";
import { BillAnimator, ANIM } from "./actors/bill/animator";
import { Player, FEEL } from "./actors/player";
import { Input } from "./core/input";
import { FixedLoop } from "./core/loop";
import { clamp, damp, rng, DEG } from "./core/math";
import { newInventory, pickUp, drop as dropItem, carriedMass } from "./game/inventory";
import { pickTarget } from "./game/interact";
import { ITEMS, QUIPS, type ItemId, type Surface } from "./content/items";
import { LIGHTING } from "./content/palette";
import { GameAudio } from "./audio/audio";
import { Hud } from "./ui/hud";

const BILL_SAYS: Record<ItemId, string> = {
  dinCable: "Exhibit A.",
  powerBrick: "Basically parts.",
  cableBundle: "Almost-solutions. Dozens of them.",
  speakAndSpell: "Phonics integration.",
  newspaperBundle: "The archive stays together.",
  personalityStump: "It has presence.",
};

async function boot() {
  const hash = new URLSearchParams(location.hash.slice(1));
  const canvas = document.getElementById("game") as HTMLCanvasElement;
  const scene = new THREE.Scene();
  const cam = new CameraRig();
  const gfx = await createGfx(canvas, scene, cam.camera);
  const phys = await Physics.create();
  const estate = buildEstate(scene, phys);

  const key = new THREE.DirectionalLight(LIGHTING.estate.key, Math.PI);
  const amb = new THREE.AmbientLight(LIGHTING.estate.ambient, Math.PI);
  scene.add(key, key.target, amb);
  const lightKey = new THREE.Color(LIGHTING.estate.key), lightAmb = new THREE.Color(LIGHTING.estate.ambient);

  const bill = new BillRig();
  scene.add(bill.root);
  const anim = new BillAnimator(bill);
  const player = new Player(phys, estate.spawn);
  const items = new Items(scene, phys);
  for (const s of estate.itemSpawns) items.spawn(s.id, s.at);
  for (const j of estate.junkSpawns) items.spawnJunk(j.kind, j.at);
  ensureInkNormals(scene);
  const decor: THREE.Object3D[] = [];
  scene.traverse((o) => { if (o.userData.tag === "basement" && !estate.leds.includes(o as THREE.Mesh)) decor.push(o); });

  const inv = newInventory();
  const input = new Input();
  const audio = new GameAudio();
  const hud = new Hud(document.getElementById("hud")!);
  hud.setInventory(inv);
  input.onFirstGesture = () => audio.unlock();
  const pick = rng(11);
  const quip = (pool: readonly string[]) => pool[Math.floor(pick() * pool.length)];

  // ---------- hash hooks ----------
  const at = hash.get("at")?.split(",").map(Number);
  if (at?.length === 3) player.teleport(new THREE.Vector3(at[0], at[1], at[2]));
  if (hash.has("face")) player.teleport(player.pos.clone(), Number(hash.get("face")) * DEG);
  const zoom = hash.get("zoom");
  if (zoom === "game" || zoom === "close") cam.zoomMode = zoom;
  if (hash.get("ui") === "0") document.getElementById("hud")!.hidden = true;
  if (hash.get("debug") === "1") hud.showDebug = true;
  const autopilot = hash.get("walk") === "1";
  const inkOverride = Number(new URLSearchParams(location.search).get("inkpx") ?? 0);
  const autoHurry = hash.get("hurry") === "1";
  const forcedExpr = hash.get("expr") as Expression | null;
  if (hash.get("carry") === "1") {
    const stump = items.list.find((i) => i.id === "personalityStump")!;
    pickUp(inv, "personalityStump");
    items.beginPickup(stump, "hands");
    player.heavy = 1;
  }
  const preFill = Number(hash.get("satchel") ?? 0);
  for (const it of items.list.filter((i) => ITEMS[i.id].carry === "satchel").slice(0, preFill)) {
    pickUp(inv, it.id);
    items.beginPickup(it, "satchel");
  }
  hud.setInventory(inv);

  // ---------- interaction ----------
  let target: WorldItem | null = null;
  const now = () => performance.now() / 1000;

  function tryPickup(it: WorldItem) {
    const r = pickUp(inv, it.id);
    if (!r.ok) {
      audio.refuse();
      anim.flash("suspicious", 1.8, now());
      const line = r.reason === "satchelFull" ? "My satchel is at capacity. I am consulting counsel." : "My hands are committed.";
      hud.say(line, 2.6, now());
      audio.speak(line);
      hud.narrate(quip(r.reason === "satchelFull" ? QUIPS.inventoryFull : QUIPS.handsFull), 4.5, now());
      return;
    }
    items.beginPickup(it, r.to);
    if (r.to === "hands") bill.gripHalf = items.gripHalf(it.id);
    anim.flash("junklove", 1.5, now());
    anim.bump(r.to === "hands" ? -1.6 : -0.9);
    cam.zoomPunch(r.to === "hands" ? 0.07 : 0.045);
    audio.pickup(inv.satchel.length + (inv.hands ? 1 : 0));
    hud.say(BILL_SAYS[it.id], 2.2, now());
    audio.speak(BILL_SAYS[it.id]);
    hud.narrate(ITEMS[it.id].pickupText, 5, now());
    hud.setInventory(inv);
  }

  function doDrop() {
    if (items.list.some((i) => i.state === "flying")) return;
    const id = dropItem(inv);
    if (!id) {
      hud.narrate(quip(QUIPS.inventoryEmpty), 4, now());
      return;
    }
    const it = items.list.find((i) => i.id === id && (i.state === "satchel" || i.state === "hands"))!;
    const fromHands = it.state === "hands";
    items.drop(it, player.pos, player.facing, fromHands);
    const mass = ITEMS[id].mass;
    if (fromHands) {
      audio.thunk(mass);
      loop.hitStop(95);
      cam.zoomPunch(0.05);
      anim.bump(1.2);
    } else setTimeout(() => audio.thunk(mass), 260);
    hud.narrate(ITEMS[id].dropText, 4.5, now());
    hud.setInventory(inv);
  }

  // ---------- simulation ----------
  let autoT = 0;
  let lastSpeed = 0;
  function step(dt: number) {
    input.poll();
    let move = input.move, hurry = input.hurry, analog = input.analog;
    if (autopilot) {
      autoT += dt;
      move = { x: Math.cos(autoT * 0.6), y: Math.sin(autoT * 0.6) };
      hurry = autoHurry;
      analog = true;
    }
    if (Math.hypot(move.x, move.y) > 0.1) hud.hideHelp();
    player.heavy = damp(player.heavy, inv.hands ? 1 : 0, 10, dt);
    player.loadFactor = 1 - 0.12 * clamp(inv.satchel.reduce((m, id) => m + ITEMS[id].mass, 0) / 6, 0, 1);
    player.step(dt, move, analog, hurry, CAM.yaw);

    // satchel rattles on sudden starts and stops
    const sp = player.speed;
    if (Math.abs(sp - lastSpeed) / dt > 6 && inv.satchel.length > 0 && pick() < 0.25) audio.rattle(inv.satchel.length);
    lastSpeed = sp;

    const candidates = items.list
      .filter((i) => i.state === "world")
      .map((i) => ({ id: i, x: i.obj.position.x, z: i.obj.position.z, y: i.obj.position.y, reach: ITEMS[i.id].carry === "heavy" ? 1.25 : 1.05 }));
    target = pickTarget({ x: player.pos.x, y: player.pos.y + 0.3, z: player.pos.z, facing: player.facing }, candidates)?.id ?? null;

    if (input.consume("interact")) {
      if (target) tryPickup(target);
      else if (inv.hands) doDrop();
    }
    if (input.consume("drop")) doDrop();
    if (input.consume("zoom")) cam.zoomMode = cam.zoomMode === "auto" ? "game" : cam.zoomMode === "game" ? "close" : "auto";
    if (input.consume("debug")) hud.showDebug = !hud.showDebug;
    if (input.consume("mute")) audio.setMuted(!audio.muted);
    if (input.consume("tune")) void toggleTuning();

    phys.step(dt);
  }

  player.onSkid = (speed) => {
    audio.skid();
    anim.flash("suspicious", 0.6, now());
    cam.zoomPunch(0.02 * speed);
  };
  player.onLand = (speed) => {
    audio.land(speed);
    anim.bump(-speed * 0.3);
  };

  // ---------- presentation ----------
  const pos = new THREE.Vector3();
  const mouth = new THREE.Vector3();
  const headW = new THREE.Vector3();
  const headPx = { x: 0, y: 0 };
  const tgtPx = { x: 0, y: 0 };
  let mode: "ground" | "basement" = "ground";
  let sceneName: "ground" | "basement" | "outdoors" = "ground";
  let fpsAvg = 60;
  let surface: Surface = "carpet";

  function render(alpha: number, frameDt: number) {
    const t = now();
    player.renderPos(alpha, pos);
    bill.root.position.copy(pos);
    bill.root.rotation.y = player.renderFacing(alpha);
    if (forcedExpr) anim.flash(forcedExpr, 1, t);

    const planted = anim.update(
      {
        speed: player.speed,
        hurrying: player.hurrying,
        heavy: player.heavy,
        accel: player.accel,
        yawRate: player.yawRate,
        skidding: player.skidTimer > 0,
        idleTime: player.idleTime,
        satchelCount: inv.satchel.length,
      },
      frameDt,
      t,
    );
    surface = estate.surfaces.at(pos, "grass");
    for (const _ of planted) audio.footstep(surface, 1, player.hurrying);
    audio.shuffle(player.speed, player.hurrying, surface);

    bill.satchelMouth(mouth);
    const arrived = items.update(frameDt, t, mouth, bill.carry, target);
    for (const it of arrived) if (it.state === "satchel") anim.bump(-0.5);

    // ---- where is Bill, and what should be cut away? ----
    const inside = pos.x > HOUSE.x0 && pos.x < HOUSE.x1 && pos.z > HOUSE.z0 && pos.z < HOUSE.z1;
    const nextMode = pos.y < -1.3 ? "basement" : pos.y > -1.0 ? "ground" : mode;
    mode = nextMode;
    const behindHouse = (() => {
      if (inside) return false;
      const lo = Math.max(HOUSE.x0 - pos.x, HOUSE.z0 - pos.z), hi = Math.min(HOUSE.x1 - pos.x, HOUSE.z1 - pos.z);
      return lo <= hi && hi >= 0 && lo < 12;
    })();
    const g = estate.builder.groups;
    g.basement.visible = mode === "basement" || inside;
    g.ground.visible = mode === "ground";
    g.outdoors.visible = mode === "ground";
    g.roof.visible = mode === "ground" && !inside && !behindHouse;
    estate.walls.update(pos, mode, inside || mode === "basement", frameDt);
    for (const led of estate.leds) {
      const tag = led.userData.tag as string;
      led.visible = tag === "basement" ? g.basement.visible : g.ground.visible;
      led.scale.setScalar(0.8 + 0.4 * (Math.sin(t * 3 + (led.userData.phase as number)) > 0.2 ? 1 : 0));
    }
    for (const o of decor) o.visible = g.basement.visible;
    const onThisFloor = (y: number) => (mode === "basement" ? y < -1 : y > -1 || inside);
    for (const it of items.list) if (it.state === "world") it.obj.visible = onThisFloor(it.obj.position.y);
    items.setJunkVisibility(onThisFloor);

    // ---- lighting and music follow the scene ----
    const where = mode === "basement" ? "basement" : inside ? "ground" : "outdoors";
    if (where !== sceneName) { sceneName = where; audio.setScene(where); }
    const L = LIGHTING[where === "ground" ? "estate" : where];
    lightKey.lerp(_c.set(L.key), 1 - Math.exp(-4 * frameDt));
    lightAmb.lerp(_c.set(L.ambient), 1 - Math.exp(-4 * frameDt));
    key.color.copy(lightKey);
    amb.color.copy(lightAmb);
    const ly = CAM.yaw - 0.55;
    key.position.set(pos.x + Math.sin(ly) * 6, pos.y + 9, pos.z + Math.cos(ly) * 6);
    key.target.position.copy(pos);

    cam.update(frameDt, pos, player.vel, inside || mode === "basement");
    // art bible: ~2.5 px silhouettes at 1080p; environment materials carry lighter weights
    gfx.inkPx.value = (inkOverride || Math.max(1.6, (2.8 * innerHeight) / 1080)) * gfx.renderer.getPixelRatio();

    // ---- HUD ----
    bill.head.getWorldPosition(headW);
    headW.y += 0.28;
    cam.project(headW, headPx);
    let tgt: { x: number; y: number; label: string } | null = null;
    if (target) {
      cam.project(target.obj.position, tgtPx);
      const full = ITEMS[target.id].carry === "satchel" ? inv.satchel.length >= inv.capacity : !!inv.hands;
      tgt = { x: tgtPx.x, y: tgtPx.y, label: full ? `${ITEMS[target.id].shortName}: no room` : `E  Pick up ${ITEMS[target.id].name}` };
    }
    hud.update(t, headPx, tgt);
    fpsAvg = damp(fpsAvg, 1 / Math.max(frameDt, 1e-3), 3, frameDt);
    hud.setDebug(
      `${gfx.backend} · tier ${gfx.tier} · ${fpsAvg.toFixed(0)} fps · ${gfx.drawCalls} draws\n` +
        `speed ${player.speed.toFixed(2)} m/s ${player.hurrying ? "hurry" : "shuffle"}${player.skidTimer > 0 ? " SKID" : ""} · ${mode}${inside ? " inside" : ""} · ${surface}\n` +
        `satchel ${inv.satchel.length}/4 ${carriedMass(inv).toFixed(1)} kg · zoom ${cam.zoomMode}`,
    );

    gfx.render();
    frames++;
    w.__scav.frames = frames;
  }
  const _c = new THREE.Color();

  // ---------- tuning panel (T) ----------
  let gui: { destroy(): void } | null = null;
  async function toggleTuning() {
    if (gui) { gui.destroy(); gui = null; return; }
    const { default: GUI } = await import("lil-gui");
    const g = new GUI({ title: "Feel lab" });
    const mv = g.addFolder("Movement");
    mv.add(FEEL, "shuffleSpeed", 0.5, 3, 0.05); mv.add(FEEL, "hurrySpeed", 1, 5, 0.05); mv.add(FEEL, "accelTime", 0.02, 1, 0.01);
    mv.add(FEEL, "stopTime", 0.02, 1, 0.01); mv.add(FEEL, "hurryAccelTime", 0.02, 1, 0.01); mv.add(FEEL, "hurryStopTime", 0.02, 1, 0.01);
    mv.add(FEEL, "turnTime", 0.03, 0.6, 0.01); mv.add(FEEL, "isoForwardBoost", 1, 1.4, 0.01); mv.add(FEEL, "heavyFactor", 0.4, 1, 0.01);
    const an = g.addFolder("Body");
    an.add(ANIM, "turnLean", 0, 0.2, 0.005); an.add(ANIM, "accelLean", 0, 0.08, 0.002);
    const hair = { hz: 2.2, damping: 0.25 };
    const apply = () => bill.setSpringTuning(hair.hz, hair.damping);
    an.add(hair, "hz", 0.8, 6, 0.1).name("hair Hz").onChange(apply); an.add(hair, "damping", 0.05, 1, 0.01).name("hair damping").onChange(apply);
    const cm = g.addFolder("Camera");
    const deg = { pitch: CAM.pitch / DEG };
    cm.add(deg, "pitch", 20, 60, 0.5).onChange((v: number) => (CAM.pitch = v * DEG));
    cm.add(CAM, "lookahead", 0, 1, 0.01); cm.add(CAM, "follow", 1, 15, 0.1); cm.add(CAM, "deadZone", 0, 2, 0.05);
    cm.add(CAM, "gameFrac", 0.05, 0.3, 0.005).name("game zoom"); cm.add(CAM, "closeFrac", 0.05, 0.4, 0.005).name("indoor zoom");
    gui = g;
  }

  // ---------- go ----------
  const loop = new FixedLoop(step, render);
  let frames = 0;
  const w = window as unknown as { __scav: { ready: boolean; frames: number; backend: string } };
  w.__scav = { ready: false, frames: 0, backend: gfx.backend };
  cam.snap(pos.copy(player.pos));
  await gfx.renderer.compileAsync(scene, cam.camera);
  document.getElementById("loading")?.remove();
  hud.narrate("The masterpiece begins, naturally, with not making music and looking for a cord.", 6, now());
  w.__scav.ready = true;
  gfx.renderer.setAnimationLoop((ms) => loop.tick(ms ?? performance.now()));
  addEventListener("resize", () => gfx.resize());
}

boot().catch((err) => {
  console.error(err);
  const el = document.getElementById("loading");
  if (el) el.textContent = `Bill tripped over a cable: ${err instanceof Error ? err.message : String(err)}`;
});

/**
 * The Scavenger's Chronicles: the estate and the Route, with the three starter errands.
 *
 * Hash hooks for screenshots and tests (combine with &):
 *   #at=x,y,z  face=deg  zoom=game|close  ui=0  debug=1  walk=1 (autopilot)  hurry=1
 *   carry=1 (stump in hands)  satchel=n (pre-fill)  expr=junklove|suspicious|soupgrief|elvis
 *   skip=cablePilgrimage,stumpProphecy (complete errands at load)  give=dinCable (start carrying it)
 */
import * as THREE from "three/webgpu";
import { createGfx } from "./render/renderer";
import { CameraRig, CAM } from "./render/cameraRig";
import { ensureInkNormals } from "./render/ink";
import { Physics } from "./world/physics";
import { buildEstate, HOUSE } from "./world/estate";
import { buildRoute, GARY_POST, PRIZE_AT } from "./world/route";
import { occludes } from "./world/site";
import { POINTS, INSTALL } from "./world/points";
import { Items, type WorldItem } from "./world/items";
import { BillRig, type Expression } from "./actors/bill/billModel";
import { BillAnimator, ANIM } from "./actors/bill/animator";
import { Player, FEEL } from "./actors/player";
import { Gary } from "./actors/gary";
import { Input } from "./core/input";
import { FixedLoop } from "./core/loop";
import { clamp, damp, rng, DEG } from "./core/math";
import { newInventory, pickUp, drop as dropItem, carriedMass } from "./game/inventory";
import { pickTarget } from "./game/interact";
import { newMissionState, onPickup, onDrop, deliverable, deliver, objective, cycleActive, allDone, type MissionEvent } from "./game/missions";
import { isGuarded, type GaryMode } from "./game/gary";
import { ITEMS, QUIPS, type ItemId, type Surface } from "./content/items";
import { MISSIONS, MISSION_QUIPS, GARY_SAYS, type MissionId, type PointId } from "./content/missions";
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
  const route = buildRoute(scene, phys, estate.walls, estate.surfaces);

  const key = new THREE.DirectionalLight(LIGHTING.estate.key, Math.PI);
  const amb = new THREE.AmbientLight(LIGHTING.estate.ambient, Math.PI);
  scene.add(key, key.target, amb);
  const lightKey = new THREE.Color(LIGHTING.estate.key), lightAmb = new THREE.Color(LIGHTING.estate.ambient);

  const bill = new BillRig();
  scene.add(bill.root);
  const anim = new BillAnimator(bill);
  const player = new Player(phys, estate.spawn);
  const items = new Items(scene, phys);
  for (const s of [...estate.itemSpawns, ...route.itemSpawns]) items.spawn(s.id, s.at);
  for (const j of [...estate.junkSpawns, ...route.junkSpawns]) items.spawnJunk(j.kind, j.at);
  const gary = new Gary(scene, phys, GARY_POST);
  ensureInkNormals(scene);
  // loose decor tagged by the floor it belongs to (not part of the merged builder groups)
  const decor: { o: THREE.Object3D; tag: string }[] = [];
  scene.traverse((o) => {
    const tag = o.userData.tag as string | undefined;
    if (tag && !estate.leds.includes(o as THREE.Mesh)) decor.push({ o, tag });
  });

  const inv = newInventory();
  const ms = newMissionState();
  const input = new Input();
  const audio = new GameAudio();
  const hud = new Hud(document.getElementById("hud")!);
  hud.setInventory(inv);
  input.onFirstGesture = () => audio.unlock();
  const pick = rng(11);
  const quip = (pool: readonly string[]) => pool[Math.floor(pick() * pool.length)];
  const fill = (tpl: string, v: Record<string, string>) => tpl.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
  const now = () => performance.now() / 1000;
  const itemOf = (id: ItemId) => items.list.find((i) => i.id === id)!;

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
  for (const id of (hash.get("skip") ?? "").split(",").filter(Boolean) as MissionId[]) {
    const m = MISSIONS[id];
    if (!m) continue;
    const it = itemOf(m.item);
    if (it.body) { phys.remove(it.body); it.body = null; }
    it.state = "installed";
    it.obj.position.copy(INSTALL[m.item]!.at);
    it.obj.rotation.set(0, INSTALL[m.item]!.rotY, 0);
    onPickup(ms, m.item);
    deliver(ms, id);
  }
  for (const id of (hash.get("give") ?? "").split(",").filter(Boolean) as ItemId[]) {
    const r = pickUp(inv, id);
    if (r.ok) { items.beginPickup(itemOf(id), r.to); onPickup(ms, id); if (r.to === "hands") player.heavy = 1; }
  }
  if (hash.get("carry") === "1") {
    pickUp(inv, "personalityStump");
    items.beginPickup(itemOf("personalityStump"), "hands");
    onPickup(ms, "personalityStump");
    player.heavy = 1;
  }
  const preFill = Number(hash.get("satchel") ?? 0);
  for (const it of items.list.filter((i) => ITEMS[i.id].carry === "satchel" && i.state === "world").slice(0, preFill)) {
    pickUp(inv, it.id);
    items.beginPickup(it, "satchel");
  }
  hud.setInventory(inv);

  // ---------- missions ----------
  function refreshObjective() {
    const o = objective(ms);
    hud.setObjective(o ? MISSIONS[o.mission].title : allDone(ms) ? "Errands complete" : null, o?.guide ?? (allDone(ms) ? "The masterpiece is now only one adapter away." : ""));
  }
  function announce(events: MissionEvent[]) {
    for (const e of events) {
      if (e.type === "completed") {
        hud.narrate(MISSIONS[e.mission].completeText, 5.5, now());
      } else if (e.type === "selected") {
        const m = MISSIONS[e.mission], o = objective(ms);
        hud.narrate(fill(quip(MISSION_QUIPS.missionSelected), { mission: m.title, guide: o?.guide ?? "" }), 6, now(), true);
      }
    }
    refreshObjective();
  }
  refreshObjective();

  /** Is Bill standing where he can deliver the item for an open errand? */
  function deliveryHere(): { mission: MissionId; point: PointId } | null {
    const carrying = [...inv.satchel, ...(inv.hands ? [inv.hands] : [])];
    if (!carrying.length) return null;
    for (const [pid, p] of Object.entries(POINTS) as [PointId, (typeof POINTS)[PointId]][]) {
      if (Math.abs(p.at.y - player.pos.y) > 1.2) continue;
      if (Math.hypot(p.at.x - player.pos.x, p.at.z - player.pos.z) > p.reach) continue;
      const id = deliverable(ms, pid, carrying);
      if (id) return { mission: id, point: pid };
    }
    return null;
  }

  function doDeliver(d: { mission: MissionId }) {
    const m = MISSIONS[d.mission], it = itemOf(m.item);
    const from = new THREE.Vector3();
    if (inv.hands === m.item) { inv.hands = null; bill.carry.getWorldPosition(from); }
    else { inv.satchel.splice(inv.satchel.indexOf(m.item), 1); bill.satchelMouth(from); }
    const spot = INSTALL[m.item]!;
    items.beginInstall(it, from, spot.at, spot.rotY);
    hud.setInventory(inv);
    audio.jingle();
    anim.flash("elvis", 2, now());
    anim.bump(-1.0);
    cam.zoomPunch(0.06);
    hud.say("Another step toward the masterpiece. Which is going fine.", 3.2, now());
    audio.speak("Another step toward the masterpiece");
    announce(deliver(ms, d.mission));
    if (allDone(ms)) hud.narrate("All three errands done. No music has been written, but the altar has never looked more prepared.", 6, now(), true);
  }

  // ---------- interaction ----------
  let target: WorldItem | null = null;
  let delivery: { mission: MissionId; point: PointId } | null = null;
  let lastGaryLine = -99;

  function garySay(line: string, t = now()) {
    hud.say(line, 2.6, t, "gary");
    audio.speak(line, 132);
    lastGaryLine = t;
  }

  function tryPickup(it: WorldItem) {
    if (it.id === "speakAndSpell" && isGuarded(gary.brain, PRIZE_AT)) {
      audio.refuse();
      gary.block();
      anim.flash("suspicious", 1.8, now());
      garySay(quip(GARY_SAYS.block));
      hud.narrate(quip(MISSION_QUIPS.rummagerBlock), 5, now());
      return;
    }
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
    const picked = onPickup(ms, it.id);
    const forMission = picked.find((e) => e.type === "picked");
    hud.narrate(forMission && forMission.type === "picked" ? MISSIONS[forMission.mission].pickupText : ITEMS[it.id].pickupText, 5, now());
    if (it.id === "speakAndSpell") garySay(quip(GARY_SAYS.lost));
    refreshObjective();
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
    onDrop(ms, id);
    refreshObjective();
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
  let lastTaunt = -99;
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

    // Gary: the brain picks, the capsule walks, and he says something when his mind changes
    const brick = itemOf("powerBrick");
    const decoy = brick.state === "world" && brick.obj.position.y > -1 ? { x: brick.obj.position.x, z: brick.obj.position.z } : null;
    const billOnStreet = player.pos.y > -1 ? { x: player.pos.x, z: player.pos.z } : { x: -999, z: -999 };
    const changed: GaryMode | null = gary.step(dt, { bill: billOnStreet, decoy, prizeTaken: itemOf("speakAndSpell").state !== "world" });
    if (changed) {
      const t = now();
      if (changed === "follow" && t - lastGaryLine > 6) {
        garySay(quip(GARY_SAYS.follow), t);
        if (t - lastTaunt > 14) { hud.narrate(quip(MISSION_QUIPS.rummagerTaunt), 5, t); lastTaunt = t; }
      } else if (changed === "decoy") {
        garySay(quip(GARY_SAYS.decoy), t);
        hud.narrate("Gary abandons his post to investigate the humming brick. Some men cannot resist a transformer.", 5, t);
      }
    }

    const candidates = items.list
      .filter((i) => i.state === "world")
      .map((i) => ({ id: i, x: i.obj.position.x, z: i.obj.position.z, y: i.obj.position.y, reach: ITEMS[i.id].carry === "heavy" ? 1.3 : 1.2 }));
    target = pickTarget({ x: player.pos.x, y: player.pos.y + 0.3, z: player.pos.z, facing: player.facing }, candidates)?.id ?? null;
    delivery = deliveryHere();

    if (input.consume("interact")) {
      if (delivery) doDeliver(delivery);
      else if (target) tryPickup(target);
      else if (inv.hands) doDrop();
    }
    if (input.consume("drop")) doDrop();
    if (input.consume("mission")) {
      const id = cycleActive(ms);
      if (id) hud.narrate(fill(quip(MISSION_QUIPS.missionSelected), { mission: MISSIONS[id].title, guide: objective(ms)?.guide ?? "" }), 5, now());
      refreshObjective();
    }
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

  // ---------- ambient life: the streetcar and the raccoon ----------
  let streetcarT = 18;
  let raccoonFlee = 0;
  let raccoonAway = 0;
  let lastRaccoonLine = -99;
  function ambient(dt: number, t: number, pos: THREE.Vector3) {
    // a streetcar every ~45 s, rolling west along the main street
    streetcarT += dt;
    const cycle = 45, x = 62 - (streetcarT % cycle) * 5.5;
    route.streetcar.position.x = x;
    route.streetcar.visible = x > -24 && x < 58 && route.builder.groups.outdoors.visible;
    if (Math.abs(x - 42) < 5.5 * dt * 1.01 && pos.y > -1) audio.streetcarBell();
    // the raccoon sits on the bins until Bill gets close, then legs it down the lane
    const r = route.raccoon, home = route.raccoonHome;
    const d = Math.hypot(pos.x - home.x, pos.z - home.z);
    if (raccoonFlee <= 0 && raccoonAway <= 0 && d < 2.6) {
      raccoonFlee = 1.8;
      audio.chitter();
      if (t - lastRaccoonLine > 20) {
        hud.narrate("A raccoon evaluates Bill's satchel, finds it structurally inferior, and leaves.", 4.5, t);
        lastRaccoonLine = t;
      }
    }
    if (raccoonFlee > 0) {
      raccoonFlee -= dt;
      r.position.x += 4.5 * dt;
      r.position.y = Math.max(0, r.position.y - 3 * dt) + Math.abs(Math.sin(t * 16)) * 0.12;
      r.rotation.y = Math.PI / 2;
      if (raccoonFlee <= 0) { r.visible = false; raccoonAway = 14; }
    } else if (raccoonAway > 0) {
      raccoonAway -= dt;
      if (raccoonAway <= 0) { r.position.copy(home); r.rotation.y = -0.4; r.visible = true; }
    } else {
      (r.userData.tail as THREE.Object3D).rotation.y = Math.sin(t * 2.2) * 0.4;
      (r.userData.head as THREE.Object3D).rotation.y = Math.sin(t * 0.7) * 0.5;
    }
  }

  // ---------- presentation ----------
  const pos = new THREE.Vector3();
  const mouth = new THREE.Vector3();
  const headW = new THREE.Vector3();
  const headPx = { x: 0, y: 0 };
  const garyPx = { x: 0, y: 0 };
  const tgtPx = { x: 0, y: 0 };
  const goalPx = { x: 0, y: 0 };
  const goalW = new THREE.Vector3();
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
    gary.render(alpha, t, frameDt);

    bill.satchelMouth(mouth);
    const arrived = items.update(frameDt, t, mouth, bill.carry, delivery ? null : target);
    for (const it of arrived) if (it.state === "satchel") anim.bump(-0.5);

    // ---- where is Bill, and what should be cut away? ----
    const inside = pos.x > HOUSE.x0 && pos.x < HOUSE.x1 && pos.z > HOUSE.z0 && pos.z < HOUSE.z1;
    mode = pos.y < -1.3 ? "basement" : pos.y > -1.0 ? "ground" : mode;
    const g = estate.builder.groups;
    g.basement.visible = mode === "basement" || inside;
    g.ground.visible = mode === "ground";
    g.outdoors.visible = mode === "ground";
    g.roof.visible = mode === "ground" && !inside && !occludes(pos, { x0: HOUSE.x0, x1: HOUSE.x1, z0: HOUSE.z0, z1: HOUSE.z1 });
    route.builder.groups.outdoors.visible = mode === "ground";
    for (const r of route.roofs) r.obj.visible = mode === "ground" && !occludes(pos, r.rect);
    estate.walls.update(pos, mode, inside || mode === "basement", frameDt);
    for (const led of estate.leds) {
      const tag = led.userData.tag as string;
      led.visible = tag === "basement" ? g.basement.visible : g.ground.visible;
      led.scale.setScalar(0.8 + 0.4 * (Math.sin(t * 3 + (led.userData.phase as number)) > 0.2 ? 1 : 0));
    }
    for (const { o, tag } of decor) {
      if (o === route.raccoon || o === route.streetcar) continue;
      const roof = route.roofs.find((r) => r.obj === o);
      o.visible = tag === "basement" ? g.basement.visible : tag === "ground" ? g.ground.visible : roof ? roof.obj.visible : g.outdoors.visible;
    }
    const onThisFloor = (y: number) => (mode === "basement" ? y < -1 : y > -1 || inside);
    for (const it of items.list) if (it.state === "world" || it.state === "installed") it.obj.visible = onThisFloor(it.obj.position.y);
    items.setJunkVisibility(onThisFloor);
    gary.rig.root.visible = mode === "ground";
    ambient(frameDt, t, pos);
    if (mode !== "ground") route.raccoon.visible = false;

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
    gary.headWorld(headW);
    cam.project(headW, garyPx);
    let tgt: { x: number; y: number; label: string } | null = null;
    if (delivery) {
      const m = MISSIONS[delivery.mission];
      cam.project(POINTS[delivery.point].at.clone().setY(POINTS[delivery.point].at.y + 0.9), tgtPx);
      tgt = { x: tgtPx.x, y: tgtPx.y, label: `E  Deliver the ${ITEMS[m.item].shortName} to the ${m.dropLabel}` };
    } else if (target) {
      cam.project(target.obj.position, tgtPx);
      const full = ITEMS[target.id].carry === "satchel" ? inv.satchel.length >= inv.capacity : !!inv.hands;
      tgt = { x: tgtPx.x, y: tgtPx.y, label: full ? `${ITEMS[target.id].shortName}: no room` : `E  Pick up ${ITEMS[target.id].name}` };
    }
    let goal: { x: number; y: number } | null = null;
    const o = objective(ms);
    if (o) {
      const m = MISSIONS[o.mission], it = itemOf(m.item);
      if (ms.stages[o.mission] === "find" && it.state === "world") goalW.copy(it.obj.position);
      else goalW.copy(POINTS[o.point].at).setY(POINTS[o.point].at.y + 0.6);
      goal = cam.project(goalW, goalPx);
    }
    hud.update(t, { bill: headPx, gary: mode === "ground" ? garyPx : null }, tgt, goal);
    fpsAvg = damp(fpsAvg, 1 / Math.max(frameDt, 1e-3), 3, frameDt);
    hud.setDebug(
      `${gfx.backend} · tier ${gfx.tier} · ${fpsAvg.toFixed(0)} fps · ${gfx.drawCalls} draws\n` +
        `speed ${player.speed.toFixed(2)} m/s ${player.hurrying ? "hurry" : "shuffle"}${player.skidTimer > 0 ? " SKID" : ""} · ${mode}${inside ? " inside" : ""} · ${surface}\n` +
        `satchel ${inv.satchel.length}/4 ${carriedMass(inv).toFixed(1)} kg · zoom ${cam.zoomMode} · gary ${gary.brain.mode}`,
    );

    gfx.render();
    frames++;
    w.__scav.frames = frames;
    w.__scav.pos = [player.pos.x, player.pos.y, player.pos.z];
    w.__scav.gary = gary.brain.mode;
    w.__scav.stages = { ...ms.stages };
    w.__scav.active = ms.active;
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
  const w = window as unknown as {
    __scav: { ready: boolean; frames: number; backend: string; pos: number[]; gary: string; stages: Record<string, string>; active: string | null };
  };
  w.__scav = { ready: false, frames: 0, backend: gfx.backend, pos: [0, 0, 0], gary: "guard", stages: {}, active: null };
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

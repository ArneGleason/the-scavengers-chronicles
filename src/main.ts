/**
 * The Scavenger's Chronicles: the estate and the Route, with the three starter errands.
 *
 * Hash hooks for screenshots and tests (combine with &):
 *   #at=x,y,z  face=deg  zoom=game|close  ui=0  debug=1  walk=1 (autopilot)  hurry=1
 *   carry=1 (stump in hands)  satchel=n (pre-fill)  expr=junklove|suspicious|soupgrief|elvis
 *   skip=cablePilgrimage,stumpProphecy (complete errands at load)  give=dinCable (start carrying it)
 *   gag=poop|gust|nose|burp|trip|blurt|snag|paper (an ambient gag at frame 90)  gas=n (toot charges)
 *   soup=n (first n soup ingredients in his pocket)  distilled=n (soup distillations already done)
 */
import * as THREE from "three/webgpu";
import { createGfx } from "./render/renderer";
import { CameraRig, CAM } from "./render/cameraRig";
import { ensureInkNormals } from "./render/ink";
import { toonShared } from "./render/comicMaterial";
import { Physics } from "./world/physics";
import { buildEstate, HOUSE } from "./world/estate";
import { buildRoute, GARY_POST, PRIZE_AT } from "./world/route";
import { occludes, WALKABLE } from "./world/site";
import { Hazards } from "./world/hazards";
import { buildJunkyard, inJunkyard, GRATE_AT, WANDA_HOME, TOSS_TO } from "./world/junkyard";
import { Wanda } from "./actors/wanda";
import { applaudWanda, type WandaMode } from "./game/wanda";
import { buildProps, PaperTrain, Pantry, HOARD_AT, TOASTER_AT, FRIDGE_AT, ADAPTER_BOX_AT, WORKBENCH_AT } from "./world/props";
import { BASEMENT_Y } from "./world/stairs";
import { newJam, press as jamPress, nextKey, type Jam, type JamKey } from "./game/jam";
import { newSoup, collect, distill, canDistill, isReady, eat } from "./game/soup";
import { INGREDIENTS, DISTILLATIONS, CONTACTS, DISTILLED_LINES, SOUP_SAYS, REPLIES } from "./content/soup";
import { POINTS, INSTALL } from "./world/points";
import { Items, type WorldItem } from "./world/items";
import { BillRig, type Expression } from "./actors/bill/billModel";
import { BillAnimator, ANIM } from "./actors/bill/animator";
import { Player, FEEL } from "./actors/player";
import { Gary } from "./actors/gary";
import { Slapstick, type Fall } from "./actors/bill/slapstick";
import { Fx } from "./fx/fx";
import { Input } from "./core/input";
import { FixedLoop } from "./core/loop";
import { clamp, damp, dampAngle, rng, DEG } from "./core/math";
import { newInventory, pickUp, drop as dropItem, carriedMass } from "./game/inventory";
import { pickTarget } from "./game/interact";
import { newMissionState, onPickup, onDrop, deliverable, deliver, objective, cycleActive, allDone, syncCarrying, type MissionEvent } from "./game/missions";
import { PHOTOS, type PhotoKey } from "./content/photos";
import { isGuarded, gagGary, type GaryMode } from "./game/gary";
import { Tug, STUMP_WRESTLE, DUMPSTER_DUEL, HOARD_DIVE, HAMMER_TIME } from "./game/challenge";
import { GagDirector } from "./game/gags";
import { ITEMS, QUIPS, type ItemId, type Surface } from "./content/items";
import { MISSIONS, MISSION_QUIPS, GARY_SAYS, BILL_GAGS, JAM_LINES, WANDA_SAYS, type MissionId, type PointId } from "./content/missions";
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
  rustyGrate: "Shelf potential.",
  grateShelf: "Mid-century.",
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
  const junkyard = buildJunkyard(scene, phys, estate.surfaces);

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
  // errand 4: the grate waits in Big Wanda's Junkyard; the shelf it becomes waits, unseen, for the hammering
  const rusty = items.spawn("rustyGrate", GRATE_AT.clone().setY(0.3));
  const shelf = items.spawn("grateShelf", INSTALL.rustyGrate!.at.clone().setY(1.2));
  items.hold(shelf);
  let shelfHidden = true, rustyGone = false;
  const gary = new Gary(scene, phys, GARY_POST);
  const wanda = new Wanda(scene, phys, WANDA_HOME);
  const hazards = new Hazards(scene);
  const props = buildProps(scene, phys);
  const pantry = new Pantry(scene);
  ensureInkNormals(scene);
  const fx = new Fx(scene);
  const slap = new Slapstick();
  const paper = new PaperTrain(scene);
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
  if (ms.stages.grateShelf === "complete") {
    rustyGone = true;
    if (shelf.state === "world") { items.settle(shelf, INSTALL.rustyGrate!.at.clone().setY(1.1)); shelfHidden = false; }
  }
  if (shelf.state !== "world") shelfHidden = false;

  // the stump starts rooted in the dig patch: E starts the Stump Wrestle instead of a pickup
  const stump = itemOf("personalityStump");
  const STUMP_ROOT = new THREE.Vector3(-3.0, 0.035, 10.5);
  let stumpRoot: ReturnType<Physics["box"]> | null = null;
  if (stump.state === "world") {
    items.hold(stump);
    stump.obj.position.copy(STUMP_ROOT);
    stump.obj.rotation.set(0.08, 0.4, -0.06);
    stumpRoot = phys.box([-3.2, 0, 10.3], [-2.8, 0.2, 10.7]);
  }
  // the DIN cable is somewhere inside the basement hoard: E there starts the Hoard Dive
  const cable = itemOf("dinCable");
  let cableBuried = false;
  if (cable.state === "world") {
    items.hold(cable);
    cable.obj.position.copy(HOARD_AT).setY(HOARD_AT.y + 0.3);
    cableBuried = true;
  }

  // ---------- missions ----------
  function refreshObjective() {
    const o = objective(ms);
    hud.setObjective(o ? MISSIONS[o.mission].title : allDone(ms) ? "Errands complete" : null, o?.guide ?? (allDone(ms) ? "The masterpiece is now only one adapter away." : ""));
  }
  const carrying = () => [...inv.satchel, ...(inv.hands ? [inv.hands] : [])];
  function announce(events: MissionEvent[]) {
    for (const e of events) {
      if (e.type === "completed") {
        hud.narrate(MISSIONS[e.mission].completeText, 5.5, now());
        if (PHOTOS[e.mission]) commemorate(e.mission, MISSIONS[e.mission].title);
      } else if (e.type === "alreadyDone") {
        hud.narrate(`${MISSIONS[e.mission].title}: already done. He did it out of order and is calling it initiative.`, 5, now(), true);
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
    if (d.mission === "grateShelf") {
      // the grate goes on the bench, and then it has to be hammered into a shelf
      const from = new THREE.Vector3();
      bill.carry.getWorldPosition(from);
      inv.hands = null;
      hud.setInventory(inv);
      items.beginInstall(rusty, from, INSTALL.rustyGrate!.at, 0);
      startChallenge("hammer");
      return;
    }
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
    announce(deliver(ms, d.mission, carrying()));
    if (allDone(ms)) hud.narrate("Every errand is done. No music has been written, but the altar has never looked more prepared.", 6, now(), true);
  }

  // ---------- the commemorative photo at the end of each errand ----------
  const album: { key: PhotoKey; url: string }[] = [];
  let posing = 0, cardAge = -1, photoQueued = 0, photoOk = false;
  let capture: ((url: string) => void) | null = null;
  const photoCanvas = document.createElement("canvas");
  photoCanvas.width = 640; photoCanvas.height = 480;
  function commemorate(key: PhotoKey, title: string) {
    const p = PHOTOS[key]!;
    const wait = 1.1 + photoQueued * 9;
    photoQueued++;
    later(wait, () => {
      // he sets the self-timer and strikes a pose beside the evidence
      posing = 2.1;
      player.stun(2.4);
      player.vel.x = player.vel.y = 0;
      player.facing = Math.PI / 4; // toward the camera
      anim.flash("elvis", 2.2, now());
      billSay([p.pose], 1.5);
      ["3", "2", "1"].forEach((n, i) => later(0.45 + i * 0.4, () => { fx.letter(n, above(0.75), "#fff7e3", 0.55, 0.35); audio.bloop(i); }));
    });
    later(wait + 1.75, () => {
      hud.flash();
      audio.shutter();
      capture = (url) => {
        album.push({ key, url });
        later(0.45, () => {
          photoQueued = Math.max(0, photoQueued - 1);
          hud.showCard({ url, stamp: key === "soup" ? "SOUP COMPLETE!" : "ERRAND COMPLETE!", title, caption: p.caption, sent: `Sent to all ${CONTACTS} contacts \u2713` });
          cardAge = 0;
          audio.sting(true);
          p.replies.forEach(([from, text], i) => later(0.9 + i * 0.6, () => { if (hud.cardShown) { hud.cardReply(from, text); audio.bloop(i); } }));
          later(2.8, () => hud.narrate(p.narrator, 5, now(), true));
        });
      };
    });
  }
  /** Grab the photo from the frame just rendered: a 4:3 crop around Bill, warmed up, date-stamped. */
  function takeCapture() {
    const cb = capture!;
    capture = null;
    const src = gfx.renderer.domElement, k = src.width / innerWidth;
    const sh = Math.min(innerHeight * 0.46, innerWidth * 0.4), sw = (sh * 4) / 3;
    const cx = clamp(headPx.x, sw / 2, innerWidth - sw / 2), cy = clamp(headPx.y + sh * 0.28, sh / 2, innerHeight - sh / 2);
    const g = photoCanvas.getContext("2d")!;
    g.fillStyle = "#5f7f79";
    g.fillRect(0, 0, 640, 480);
    try { g.drawImage(src, (cx - sw / 2) * k, (cy - sh / 2) * k, sw * k, sh * k, 0, 0, 640, 480); } catch { /* not readable here */ }
    // did we get a picture? (some GPUs won't hand the frame over)
    const px = g.getImageData(0, 0, 640, 480).data;
    let varied = 0;
    for (let i = 0; i < px.length; i += 4 * 997) if (Math.abs(px[i] - 95) + Math.abs(px[i + 1] - 127) + Math.abs(px[i + 2] - 121) > 30) varied++;
    photoOk = varied >= 5;
    if (varied < 5) {
      g.fillStyle = "#e9dcc0"; g.fillRect(0, 0, 640, 480);
      g.fillStyle = "#1e1a18"; g.textAlign = "center"; g.font = "400 64px Bangers, Impact, sans-serif";
      g.fillText("BLURRY", 320, 220);
      g.font = "700 26px 'Shantell Sans', sans-serif";
      g.fillText("He calls it artistic.", 320, 280);
    }
    // warm it up like a drugstore print, then the orange date stamp
    g.globalCompositeOperation = "multiply";
    g.fillStyle = "#fff0d8"; g.fillRect(0, 0, 640, 480);
    g.globalCompositeOperation = "source-over";
    const v = g.createRadialGradient(320, 240, 180, 320, 240, 420);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(30,20,10,0.35)");
    g.fillStyle = v; g.fillRect(0, 0, 640, 480);
    g.font = "700 26px 'Courier New', monospace"; g.textAlign = "right";
    g.fillStyle = "#ff8a1f"; g.fillText("'26 9 29", 612, 452);
    cb(photoCanvas.toDataURL("image/jpeg", 0.88));
  }
  hud.onCardClick = () => closeCard();
  function closeCard() {
    if (!hud.cardShown) return;
    hud.hideCard();
    cardAge = -1;
    player.lockTimer = 0;
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
      startChallenge("duel");
      return;
    }
    if (it === stump && stumpRoot) {
      startChallenge("stump");
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

  // ---------- slapstick (docs/design/comedy.md) ----------
  const gags = new GagDirector<AmbientGag>(12);
  const timers: { at: number; fn: () => void }[] = [];
  const later = (sec: number, fn: () => void) => timers.push({ at: now() + sec, fn });
  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  const headAt = (out = new THREE.Vector3()) => bill.head.getWorldPosition(out);
  const above = (dy: number) => headAt(_a).setY(_a.y + dy).clone();
  const billSay = (pool: readonly string[], sec = 2.4) => {
    const line = quip(pool);
    hud.say(line, sec, now());
    audio.speak(line);
  };

  /** A pratfall: pose, lock, sound, lettering. */
  function fall(kind: Fall, then: Fall | null = null) {
    slap.start(kind, then);
    player.stun(Slapstick.lockFor(kind));
  }

  /** Stars and a THWACK on Bill's head. */
  function bonk(word: string, seconds = 2) {
    audio.thwack();
    loop.hitStop(110);
    cam.zoomPunch(0.08);
    fx.letter(word, above(0.35), "#f7d547", 1.0, 0.9);
    fx.daze(() => headAt(_b).setY(_b.y + 0.2), seconds, now());
    anim.flash("soupgrief", seconds, now());
  }

  // the toot dash: three charges of soup, one back every five seconds
  const GAS = { max: 3, refill: 5, speed: 7.2, time: 0.42 };
  let gas = Number(hash.get("gas") ?? GAS.max), gasFill = 0;
  const clouds: { at: THREE.Vector3; until: number }[] = [];
  let firstToot = true;
  function toot() {
    const t = now(), f = player.facing, fw = { x: Math.sin(f), z: Math.cos(f) };
    const butt = new THREE.Vector3(player.pos.x - fw.x * 0.3, player.pos.y + 0.55, player.pos.z - fw.z * 0.3);
    if (gas < 1) {
      audio.fart(0.04);
      fx.puff(butt, "#c9d68a", 2, { spread: 0.1, up: 0.2, size: 0.18, life: 0.7 });
      fx.letter("pft.", butt.clone().setY(butt.y + 0.5), "#c9d68a", 0.5, 0.6);
      if (pick() < 0.5) billSay(BILL_GAGS.noGas);
      return;
    }
    gas--;
    const k = 1 - 0.4 * player.heavy;
    player.force(fw.x * GAS.speed * k, fw.z * GAS.speed * k, GAS.time, 0.65);
    audio.fart(0.45 + 0.55 * pick());
    audio.whoosh(0.4);
    fx.puff(butt, "#a9c25a", 8, { spread: 0.3, up: 0.35, push: new THREE.Vector3(-fw.x * 1.4, 0, -fw.z * 1.4), size: 0.5, life: 1.8, grow: 2.2 });
    fx.letter(quip(["PFFRRT!", "BRAAAP!", "THPPPT!", "PFFT!", "BRRRT!"]), butt.clone().setY(butt.y + 0.8), "#c3dd5a", 0.95, 0.9);
    anim.flash("junklove", 0.9, t);
    anim.bump(0.9);
    cam.zoomPunch(0.035);
    clouds.push({ at: butt, until: t + 2.4 });
    gags.mark(t, "burp");
    if (firstToot) {
      firstToot = false;
      hud.narrate("Soup-powered locomotion. Science would be interested, if science could be convinced to come closer.", 5, t);
    }
  }

  // the rake and the skateboard
  let ride: { heading: number; t: number; speed: number } | null = null;
  const hits = { rake: 0, board: 0 };
  function rakeHit() {
    hits.rake++;
    later(0.08, () => {
      bonk("THWACK!", 2.2);
      audio.boing();
      fall("stagger");
      billSay(BILL_GAGS.rake);
      gags.mark(now(), "trip");
    });
  }
  function startRide() {
    const t = now();
    hits.board++;
    ride = { heading: player.facing, t: 0, speed: Math.max(5.2, player.speed * 1.7) };
    audio.whoosh(0.6);
    fx.letter("WHEEE!", above(0.4), "#8fd0f0", 0.9, 1.1);
    anim.flash("junklove", 2, t);
    billSay(BILL_GAGS.board, 1.8);
    gags.mark(t, "trip");
  }
  function stepRide(dt: number, move: { x: number; y: number }) {
    if (!ride) return;
    ride.t += dt;
    // gentle steering toward the stick, in world space (see Player.step for the mapping)
    const s = Math.sin(CAM.yaw), c = Math.cos(CAM.yaw);
    const wx = move.x * c - move.y * s, wz = -move.x * s - move.y * c;
    if (Math.hypot(wx, wz) > 0.2) ride.heading = dampAngle(ride.heading, Math.atan2(wx, wz), 1.6, dt);
    const v = ride.speed * (1 - 0.18 * ride.t);
    Object.assign(player.forced, { vx: Math.sin(ride.heading) * v, vz: Math.cos(ride.heading) * v, time: 0.1, total: 0.1, decay: 0 });
    player.facing = ride.heading;
  }
  function endRide(wall: boolean) {
    if (!ride) return;
    const h = ride.heading, v = ride.speed;
    ride = null;
    Object.assign(player.forced, { time: 0 });
    player.vel.x = player.vel.y = 0;
    if (wall) {
      hazards.kick(h + Math.PI, 2.5);
      bonk("BONK!", 2.4);
      fall("faceplant");
      later(0.28, () => audio.whump(0.8));
      billSay(BILL_GAGS.bonk);
    } else {
      // the board shoots out ahead; he goes up, and down, on his backside
      hazards.kick(h, v * 1.1);
      audio.slide(false, 0.45);
      fall("buttflop");
      later(0.18, () => {
        audio.whump();
        loop.hitStop(90);
        cam.zoomPunch(0.06);
        fx.letter("WHUMP!", above(0.1), "#f7d547", 0.9, 0.8);
        fx.puff(player.pos.clone().setY(player.pos.y + 0.1), "#d8cdb4", 6, { spread: 0.5, up: 0.3, size: 0.35, life: 0.9 });
      });
      later(0.6, () => billSay(BILL_GAGS.wipeout));
    }
    gags.mark(now(), "trip");
  }

  // ---------- action challenges: the Stump Wrestle and the Dumpster Duel ----------
  type ChallengeKind = "stump" | "duel" | "hoard" | "hammer";
  const TITLES: Record<ChallengeKind, string> = { stump: "STUMP WRESTLE!", duel: "DUMPSTER DUEL!", hoard: "HOARD DIVE!", hammer: "SHELF-IFY!" };
  const BENCH_TOP = INSTALL.rustyGrate!.at;
  let challenge: {
    kind: ChallengeKind; tug: Tug; title: string; mashes: number; jolt: number; surges: number;
    /** The cat fight: dust-cloud timer, slap-lettering timer, and the insult exchange. */
    brawl: number; slapT: number; insultT: number; billsTurn: boolean;
  } | null = null;
  const sns = itemOf("speakAndSpell");
  const DUMPSTER_TOP = new THREE.Vector3(26.9, 1.95, 12.9);
  function startChallenge(kind: ChallengeKind) {
    if (challenge || ride) return;
    const t = now();
    const cfg = { stump: STUMP_WRESTLE, duel: DUMPSTER_DUEL, hoard: HOARD_DIVE, hammer: HAMMER_TIME }[kind];
    challenge = { kind, tug: new Tug(cfg), title: TITLES[kind], mashes: 0, jolt: 0, surges: 0, brawl: 0, slapT: 0.4, insultT: 2.2, billsTurn: false };
    slap.start(kind === "hoard" || kind === "hammer" ? "dig" : "tug");
    player.stun(0.3);
    player.vel.x = player.vel.y = 0;
    audio.whoosh(0.3);
    if (kind === "stump") {
      billSay(BILL_GAGS.stumpStart);
      hud.narrate("The stump has roots, opinions, and no intention of leaving. Mash E.", 4.5, t);
    } else if (kind === "hoard") {
      billSay(BILL_GAGS.hoardStart);
      hud.narrate("Somewhere in the archive is the DIN sync cable. Mash E to dig. Mind the newspapers.", 4.5, t);
    } else if (kind === "hammer") {
      billSay(["Buying shelves is how they get you.", "Three minutes of hammering. Forty years of theory."], 2.2);
      hud.narrate("The grate is on the bench. Mash E to hammer it into a shelf. Mind the thumb.", 4.5, t);
    } else {
      // Gary shuffles up to arm's length and grabs the other end
      const dx = gary.pos.x - player.pos.x, dz = gary.pos.z - player.pos.z, d = Math.hypot(dx, dz) || 1;
      gary.startTug({ x: player.pos.x + (dx / d) * 1.15, z: player.pos.z + (dz / d) * 1.15 });
      items.hold(sns);
      billSay(BILL_GAGS.duelStart, 1.8);
      later(0.5, () => garySay(quip(GARY_SAYS.tug)));
      hud.narrate("Gary grabs the other end. It is now a matter of dumpster law, and dumpster law is mashing E.", 4.5, t);
    }
    gags.mark(t);
  }

  function stepChallenge(dt: number) {
    if (!challenge) return;
    const c = challenge, t = now();
    player.stun(0.2);
    // face what he's pulling on
    const face = c.kind === "stump" ? STUMP_ROOT : c.kind === "hoard" ? HOARD_AT : c.kind === "hammer" ? BENCH_TOP : gary.pos;
    player.facing = dampAngle(player.facing, Math.atan2(face.x - player.pos.x, face.z - player.pos.z), 10, dt);
    if (input.consume("interact")) {
      c.tug.mash();
      c.mashes++;
      audio.grunt(c.kind === "duel" ? 1.08 : 1);
      anim.bump(-0.35);
      cam.zoomPunch(0.008);
      if (c.kind === "stump") fx.puff(STUMP_ROOT.clone().setY(0.05), "#8a6446", 2, { spread: 0.35, up: 0.9, size: 0.2, life: 0.7 });
      if (c.kind === "hammer") {
        audio.tink();
        fx.puff(BENCH_TOP.clone().setY(BENCH_TOP.y + 0.08), "#f7d547", 2, { spread: 0.3, up: 1.6, size: 0.07, life: 0.35, grow: 0.3 });
        if (c.mashes % 3 === 1) fx.letter(quip(["BANG!", "KLANG!", "TINK!", "BONK!", "WHANG!"]), BENCH_TOP.clone().add(new THREE.Vector3((pick() - 0.5) * 0.8, 0.7, 0)), "#f7d547", 0.55, 0.5);
      } else if (c.kind === "hoard") {
        // archive flies out behind him, item by useless item
        audio.rustle();
        fx.puff(HOARD_AT.clone().setY(HOARD_AT.y + 0.8), "#ece2c8", 2, { spread: 0.5, up: 1.6, size: 0.24, life: 0.8 });
        if (c.mashes % 3 === 1) fx.letter(quip(BILL_GAGS.hoardFinds), HOARD_AT.clone().setY(HOARD_AT.y + 1.3 + pick() * 0.4), "#ece2c8", 0.5, 0.7);
      } else if (c.mashes % 4 === 1) fx.letter(quip(["HNNF!", "GRR!", "HUP!", "NNGH!", "HRRK!"]), above(0.45), "#fff7e3", 0.55, 0.5);
    }
    const state = c.tug.update(dt);
    slap.strain = c.tug.progress;
    c.jolt = Math.max(0, c.jolt - dt * 3);
    if (c.kind === "duel") catFight(c, dt);
    if (c.tug.sinceSurge === 0) {
      c.jolt = 1;
      c.surges++;
      anim.bump(0.8);
      if (c.kind === "hoard") {
        // the newspaper avalanche: it buries him a bit
        audio.rustle(2.5);
        audio.whump(0.5);
        fx.puff(above(0.2), "#ece2c8", 9, { spread: 0.7, up: -0.4, size: 0.34, life: 0.9 });
        fx.letter("FWUMP!", above(0.6), "#ece2c8", 0.8, 0.7);
        if (c.surges === 1) hud.narrate("The archive fights back.", 3, t);
      } else if (c.kind === "hammer") {
        // the thumb
        audio.thwack();
        audio.grunt(1.7);
        fx.letter("YEOWCH!", above(0.4), "#e0367a", 0.9, 0.8);
        anim.flash("soupgrief", 1.2, t);
        if (c.surges === 1) hud.narrate("He hits his thumb. The grate considers this progress.", 3.5, t);
      } else {
        audio.grunt(1.5);
        fx.letter("YOINK!", gary.headWorld(_a).clone(), "#f7d547", 0.7, 0.6);
      }
    }
    if (c.kind === "hammer") {
      rusty.obj.rotation.z = Math.sin(t * 50) * 0.02 * (0.2 + c.tug.progress);
    } else if (c.kind === "hoard") {
      props.hoard.rotation.z = Math.sin(t * 30) * 0.025 * (0.3 + c.tug.progress);
    } else if (c.kind === "stump") {
      stump.obj.position.set(STUMP_ROOT.x, STUMP_ROOT.y + 0.12 * c.tug.progress, STUMP_ROOT.z);
      stump.obj.rotation.z = -0.06 + Math.sin(t * 40) * 0.06 * c.tug.progress;
    } else {
      // the prize is between their hands, drifting toward whoever is winning
      const gh = gary.handsWorld(_a), bh = _b.set(player.pos.x + Math.sin(player.facing) * 0.45, player.pos.y + 0.95, player.pos.z + Math.cos(player.facing) * 0.45);
      sns.obj.position.lerpVectors(gh, bh, 0.25 + 0.5 * c.tug.progress);
      sns.obj.rotation.set(Math.sin(t * 31) * 0.15, player.facing, Math.sin(t * 23) * 0.1);
    }
    if (state === "won") finishChallenge(true);
    else if (state === "lost") finishChallenge(false);
  }

  /** The Dumpster Duel as a cat fight: a dust cloud, flying slaps, and insults both ways. */
  function catFight(c: NonNullable<typeof challenge>, dt: number) {
    const mid = gary.pos.clone().lerp(player.pos, 0.5);
    c.brawl -= dt;
    if (c.brawl <= 0) {
      // a proper cartoon fight cloud: a boiling ball of dust around both of them
      c.brawl = 0.05;
      for (let i = 0; i < 2; i++) {
        const a = pick() * Math.PI * 2, r = 0.35 + pick() * 0.45;
        fx.puff(mid.clone().add(new THREE.Vector3(Math.cos(a) * r, 0.3 + pick() * 1.3, Math.sin(a) * r)), pick() < 0.7 ? "#f4efe4" : "#d8cdb4", 1, { spread: 0.2, up: 0.3, size: 0.45 + pick() * 0.35, life: 0.55, grow: 0.7 });
      }
    }
    c.slapT -= dt;
    if (c.slapT <= 0) {
      c.slapT = 0.35 + pick() * 0.35;
      const at = mid.clone().add(new THREE.Vector3((pick() - 0.5) * 1.6, 1.0 + pick() * 0.9, (pick() - 0.5) * 1.6));
      fx.letter(quip(["SLAP!", "HSSS!", "RRRWR!", "BIFF!", "MRRAOW!", "POKE!", "FFT!", "YANK!", "SCRITCH!"]), at, quip(["#f7d547", "#fff7e3", "#e0367a", "#8fd0f0"]), 0.65, 0.5);
      audio.slap();
      cam.zoomPunch(0.01);
      if (pick() < 0.25) fx.daze(() => gary.headWorld(_b).setY(_b.y - 0.2), 0.8, now());
    }
    c.insultT -= dt;
    if (c.insultT <= 0) {
      c.insultT = 1.5;
      c.billsTurn = !c.billsTurn;
      if (c.billsTurn) billSay(BILL_GAGS.insults, 1.5);
      else garySay(quip(GARY_SAYS.insults));
    }
  }

  function finishChallenge(won: boolean) {
    const c = challenge!;
    challenge = null;
    slap.stop();
    bill.squash.position.set(0, 0, 0);
    player.lockTimer = 0;
    const t = now();
    gags.mark(t);
    audio.sting(won);
    if (c.kind === "hammer") {
      // TA-DAA: the grate is gone, and on the bench sits a shelf
      rustyGone = true;
      rusty.obj.rotation.z = 0;
      items.settle(shelf, BENCH_TOP.clone().setY(BENCH_TOP.y + 0.25));
      shelfHidden = false;
      audio.jingle();
      loop.hitStop(120);
      cam.zoomPunch(0.08);
      fx.puff(BENCH_TOP.clone().setY(BENCH_TOP.y + 0.2), "#f4efe4", 10, { spread: 0.6, up: 1.2, size: 0.3, life: 1 });
      fx.letter("TA-DAA!", BENCH_TOP.clone().setY(BENCH_TOP.y + 1.2), "#f2b632", 1.1, 1.3);
      anim.flash("elvis", 2, t);
      billSay(["Mid-century.", "Buying shelves is how they get you."], 2.4);
      announce(deliver(ms, "grateShelf", carrying()));
      return;
    }
    if (c.kind === "hoard") {
      // the excavation becomes a geyser of obsolete goods; the cable rides it into the satchel
      cableBuried = false;
      props.hoard.rotation.z = 0;
      props.hoard.scale.set(1.08, 0.72, 1.08);
      const top = HOARD_AT.clone().setY(HOARD_AT.y + 0.9);
      for (let i = 0; i < 5; i++) items.spawnJunk(i % 2 ? "bucket" : "box", top.clone().add(new THREE.Vector3((pick() - 0.5) * 0.5, 0.3 + i * 0.35, (pick() - 0.5) * 0.5)), new THREE.Vector3((pick() - 0.5) * 3, 5 + pick() * 2.5, (pick() - 0.5) * 3));
      audio.pop();
      audio.whoosh(0.6);
      loop.hitStop(130);
      cam.zoomPunch(0.09);
      fx.puff(top, "#ece2c8", 16, { spread: 0.8, up: 2.6, size: 0.36, life: 1.4 });
      fx.letter("KA-FWOOSH!", top.clone().setY(top.y + 1.2), "#f7d547", 1.1, 1.2);
      fall("buttflop");
      later(0.18, () => audio.whump());
      cable.obj.position.copy(top);
      tryPickup(cable);
      if (cable.state === "world") items.settle(cable, top.clone().add(new THREE.Vector3(0.9, 0, 0.9))); // the satchel was full
      return;
    }
    if (c.kind === "stump") {
      // it pops free and he goes over backwards; the stump lands in his arms
      if (stumpRoot) { phys.world.removeCollider(stumpRoot, false); stumpRoot = null; }
      stump.obj.rotation.set(0, 0.4, 0);
      audio.pop();
      loop.hitStop(140);
      cam.zoomPunch(0.09);
      fx.puff(STUMP_ROOT.clone().setY(0.1), "#76553b", 14, { spread: 0.7, up: 2.2, size: 0.4, life: 1.3 });
      fx.letter("SHLOOP!", STUMP_ROOT.clone().setY(1.3), "#f7d547", 1.1, 1.1);
      fall("buttflop");
      later(0.18, () => audio.whump());
      tryPickup(stump);
      if (stump.state === "world") items.settle(stump, STUMP_ROOT.clone().setY(0.4)); // his hands were full
      return;
    }
    if (won) {
      // Gary lets go all at once: he goes head-first into the dumpster, Bill onto his backside
      gary.endTug(true, DUMPSTER_TOP);
      audio.slide(true, 0.5);
      fx.letter("YOINK!", above(0.3), "#f7d547", 1.0, 0.8);
      fall("buttflop");
      later(0.18, () => audio.whump());
      later(0.62, () => {
        audio.clang();
        loop.hitStop(120);
        cam.zoomPunch(0.07);
        fx.letter("CLANG!", DUMPSTER_TOP.clone().setY(2.6), "#f7d547", 1.2, 1.2);
        fx.puff(DUMPSTER_TOP.clone().setY(1.5), "#d9d2bd", 10, { spread: 0.9, up: 1.2, size: 0.4, life: 1.2 });
        hud.narrate("Gary loses the tug-of-war and is filed, head first, under Recycling. The Speak & Spell says 'E.'", 5.5, now());
      });
      later(1.6, () => garySay(quip(GARY_SAYS.binned)));
      tryPickup(sns);
      if (sns.state === "world") items.settle(sns, PRIZE_AT.clone().setY(PRIZE_AT.y + 0.2)); // the satchel was full
    } else {
      // Bill loses: airborne, briefly, then the recycling
      gary.endTug(false, DUMPSTER_TOP);
      items.settle(sns, PRIZE_AT.clone().setY(PRIZE_AT.y + 0.2));
      const dir = new THREE.Vector3(-0.3, 0, 1).normalize();
      player.facing = Math.atan2(-dir.x, -dir.z);
      player.force(dir.x * 4.6, dir.z * 4.6, 0.75, 0.2);
      fall("flung", "buttflop");
      audio.slide(true, 0.6);
      fx.letter("YOINK!", gary.headWorld(_a).clone(), "#f7d547", 1.0, 0.8);
      later(0.75, () => {
        audio.whump();
        audio.rattle(4);
        loop.hitStop(100);
        cam.zoomPunch(0.07);
        fx.letter("CRUNCH!", player.pos.clone().setY(player.pos.y + 1.4), "#f7d547", 1.0, 0.9);
        fx.puff(player.pos.clone().setY(player.pos.y + 0.2), "#7fa7d9", 8, { spread: 0.7, up: 0.8, size: 0.35, life: 1 });
      });
      later(0.5, () => garySay(quip(GARY_SAYS.won)));
      later(1.9, () => billSay(BILL_GAGS.duelLost));
      hud.narrate("Bill loses the tug-of-war and is briefly airborne, which is more cardio than he's done since 1991. Mash harder, or let Gary smell the soup.", 6, t);
    }
  }

  // ---------- pokes: props that do something when Bill presses E beside them ----------
  interface Poke { id: string; at: THREE.Vector3; reach: number; label: string | (() => string); ready: () => boolean; use: () => void }
  let poke: Poke | null = null;
  let fridgeReady = true, toasterReady = true, adaptersReady = true;
  const toastFlights: { m: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3; t: number; dur: number; arc: number; spin: number; done?: () => void }[] = [];
  const pokes: Poke[] = [
    { id: "hoard", at: HOARD_AT, reach: 1.45, label: "E  Dive into the hoard for the DIN cable", ready: () => cableBuried, use: () => startChallenge("hoard") },
    { id: "fridge", at: FRIDGE_AT, reach: 1.1, label: "E  Open the last properly made fridge", ready: () => fridgeReady, use: fridgeGag },
    { id: "toaster", at: TOASTER_AT.clone().setY(0), reach: 1.0, label: "E  Make toast", ready: () => toasterReady, use: toasterGag },
    { id: "adapters", at: ADAPTER_BOX_AT, reach: 1.2, label: "E  Rummage in the box marked ADAPTERS", ready: () => adaptersReady, use: adapterGag },
    // his keyboards: always playable
    ...([[2.1, 0, 3.85, 0], [-3.5, BASEMENT_Y, -3.75, Math.PI], [-1.7, BASEMENT_Y, -3.75, Math.PI]] as const).map(([x, y, z, face]): Poke => ({
      id: "synth", at: new THREE.Vector3(x, y, z), reach: 0.85, label: "E  Play the masterpiece", ready: () => !jam, use: () => startJam(new THREE.Vector3(x, y, z), face),
    })),
    {
      id: "stove", at: new THREE.Vector3(-5.0, 0, 0.6), reach: 1.05,
      label: () => (isReady(soup) ? "E  Eat the soup" : `E  Distillation ${soup.distilled + 1} of ${DISTILLATIONS}: add the ${INGREDIENTS[soup.pocket[0]].name}`),
      ready: () => !soupBusy && (canDistill(soup) || (isReady(soup) && !soup.eaten)),
      use: () => (isReady(soup) ? eatSoup() : distillSoup()),
    },
  ];
  function nearestPoke() {
    let best: Poke | null = null, bd = 1e9;
    for (const p of pokes) {
      if (!p.ready() || Math.abs(p.at.y - player.pos.y) > 1.2) continue;
      const d = Math.hypot(p.at.x - player.pos.x, p.at.z - player.pos.z);
      if (d < p.reach && d < bd) { best = p; bd = d; }
    }
    return best ? { p: best, d: bd } : null;
  }

  /** The museum tour: the last properly made fridge, and what he archived in it. */
  function fridgeGag() {
    fridgeReady = false;
    const t = now();
    player.facing = -Math.PI / 2;
    anim.flash("junklove", 1.4, t);
    billSay(BILL_GAGS.fridge);
    gags.mark(t);
    later(1.3, () => {
      for (let i = 0; i < 5; i++) {
        items.spawnJunk(i % 3 === 2 ? "bucket" : "box", new THREE.Vector3(-4.9, 0.55 + i * 0.28, 4.3 + pick() * 0.45), new THREE.Vector3(3.5 + pick() * 2, 0.5 + pick() * 1.5, (pick() - 0.5) * 1.5));
      }
      audio.thunk(12);
      audio.rattle(4);
      audio.whoosh(0.5);
      loop.hitStop(110);
      cam.zoomPunch(0.08);
      fx.letter("KER-CHUNK!", FRIDGE_AT.clone().setY(2.3), "#f7d547", 1.0, 1.0);
      fx.puff(FRIDGE_AT.clone().setY(1.0), "#d9d2bd", 8, { spread: 0.5, up: 0.4, push: new THREE.Vector3(2, 0, 0), size: 0.35, life: 1 });
      // the archive carries him across the kitchen
      player.force(3.4, 0, 0.6, 0.5);
      fall("buttflop");
      later(0.2, () => audio.whump());
      later(1.7, () => {
        billSay(BILL_GAGS.fridgeAfter, 2.6);
        fx.letter("SEE?", above(0.35), "#fff7e3", 0.6, 1.0);
        hud.narrate("Bill recovers one small knob from the avalanche and holds it up as proof that the fridge was right to keep things.", 5, now());
      });
    });
    later(40, () => (fridgeReady = true));
  }

  /** A 1955 toaster: nothing, nothing, he leans in to check, PAP. */
  function toasterGag() {
    toasterReady = false;
    const t = now();
    const lever = props.toaster.getObjectByName("lever")!;
    player.facing = -Math.PI / 2;
    for (const m of props.toast) { props.toaster.attach(m); m.position.copy(m.userData.home as THREE.Vector3); m.rotation.set(0, Math.PI / 2, 0); }
    lever.position.y = 0.07;
    audio.thunk(0.3);
    billSay(BILL_GAGS.toast);
    gags.mark(t);
    later(1.5, () => { anim.flash("suspicious", 1.6, now()); fx.letter("...", above(0.45), "#fff7e3", 0.5, 0.9); });
    later(2.7, () => {
      lever.position.y = 0.13;
      audio.pop();
      audio.boing();
      const head = headAt(new THREE.Vector3());
      props.toast.forEach((m, i) => {
        const from = m.getWorldPosition(new THREE.Vector3());
        scene.attach(m);
        toastFlights.push({ m, from, to: head.clone().add(new THREE.Vector3(0, 0.05 * i, 0.08 * (i - 0.5))), t: 0, dur: 0.22 + i * 0.05, arc: 0.35, spin: 9 });
      });
      later(0.24, () => {
        bonk("PAP!", 1.8);
        fall("stagger");
        // and down they go, onto the lino
        props.toast.forEach((m, i) => toastFlights.push({ m, from: m.position.clone(), to: player.pos.clone().add(new THREE.Vector3(0.35 + i * 0.2, 0.012, (i - 0.5) * 0.4)), t: 0, dur: 0.45, arc: 0.3, spin: 6 }));
      });
    });
    later(20, () => (toasterReady = true));
  }

  /** A box marked ADAPTERS: fondue pot, vacuum, electric blanket. The blanket's cord trips him. */
  function adapterGag() {
    adaptersReady = false;
    const t = now();
    player.facing = Math.atan2(ADAPTER_BOX_AT.x - player.pos.x, ADAPTER_BOX_AT.z - player.pos.z);
    anim.flash("junklove", 1.6, t);
    billSay(BILL_GAGS.adapters, 1.6);
    slap.start("dig");
    player.stun(1.5);
    gags.mark(t);
    ["FONDUE POT", "VACUUM", "ELECTRIC BLANKET"].forEach((w, i) => later(0.35 + i * 0.4, () => {
      audio.rustle();
      fx.letter(w, ADAPTER_BOX_AT.clone().setY(1.1 + i * 0.25), "#ece2c8", 0.45, 0.9);
    }));
    later(1.5, () => {
      slap.stop();
      bill.squash.position.set(0, 0, 0);
      audio.slide(false, 0.35);
      fx.letter("YANK!", above(0), "#f7d547", 0.8, 0.8);
      fall("faceplant");
      later(0.28, () => { audio.whump(0.8); loop.hitStop(90); cam.zoomPunch(0.05); });
      hud.narrate("The box marked ADAPTERS holds adapters for a fondue pot, a vacuum and an electric blanket. The blanket's cord seizes its moment.", 5.5, now());
      later(1.8, () => billSay(BILL_GAGS.adaptersAfter));
    });
    later(30, () => (adaptersReady = true));
  }

  // Captain Caffeine ignition: sometimes a hurry from a standstill spins his wheels first
  let spin = 0, lastSpin = -99, wanted = false;
  function stepWheelspin(dt: number, move: { x: number; y: number }, hurry: boolean, busy: boolean) {
    const t = now(), wants = Math.hypot(move.x, move.y) > 0.5;
    if (spin > 0) {
      spin -= dt;
      if (pick() < 0.35) fx.puff(player.pos.clone().add(new THREE.Vector3(-Math.sin(player.facing) * 0.3, 0.08, -Math.cos(player.facing) * 0.3)), "#d8cdb4", 1, { spread: 0.2, up: 0.3, size: 0.2, life: 0.5 });
      if (spin <= 0) {
        const s = Math.sin(CAM.yaw), c = Math.cos(CAM.yaw);
        const wx = move.x * c - move.y * s, wz = -move.x * s - move.y * c;
        if (Math.hypot(wx, wz) > 0.2) player.facing = Math.atan2(wx, wz);
        player.force(Math.sin(player.facing) * 7.5, Math.cos(player.facing) * 7.5, 0.4, 0.5);
        audio.whoosh(0.4);
        fx.letter("ZOOM!", above(0.3), "#f7d547", 0.8, 0.7);
      }
    } else if (wants && !wanted && hurry && !busy && !inv.hands && player.speed < 0.2 && t - lastSpin > 35 && pick() < 0.4) {
      spin = 0.6;
      lastSpin = t;
      player.stun(0.6);
      audio.skid();
      fx.letter("SKREEE!", above(0.2), "#fff7e3", 0.7, 0.6);
      gags.mark(t);
    }
    wanted = wants;
  }

  // ---------- the masterpiece, performed: E and R, back and forth, and the third note goes wrong ----------
  let takes = 0;
  let jam: { j: Jam; at: THREE.Vector3; pressL: number; pressR: number; ending: boolean } | null = null;
  function startJam(at: THREE.Vector3, face: number) {
    takes++;
    jam = { j: newJam(), at, pressL: 0, pressR: 0, ending: false };
    player.stun(0.3);
    player.vel.x = player.vel.y = 0;
    player.facing = face;
    fx.letter(`TAKE ${takes}`, above(0.7), "#f2b632", 0.8, 1.1);
    later(0.35, () => { fx.letter("CRACK!", above(0.1), "#fff7e3", 0.45, 0.5); audio.thunk(0.2); });
    billSay(BILL_GAGS.jamStart, 1.8);
    gags.mark(now());
  }
  function stepJam() {
    if (!jam) return;
    const j = jam;
    player.stun(0.2);
    if (j.ending) { input.consume("interact"); input.consume("drop"); return; }
    const key: JamKey | null = input.consume("interact") ? "E" : input.consume("drop") ? "R" : null;
    if (!key) return;
    const r = jamPress(j.j, key);
    if (!r) { anim.bump(0.25); return; } // wrong key: a flinch, nothing else
    audio.synthNote(r.midi, r.sour);
    if (key === "E") j.pressL = 1; else j.pressR = 1;
    const top = j.at.clone().add(new THREE.Vector3((pick() - 0.5) * 0.6, 1.5 + pick() * 0.3, 0));
    if (!r.sour) { fx.letter(pick() < 0.5 ? "\u266A" : "\u266B", top, "#8fd0f0", 0.7, 0.8); return; }
    // the third note: wrong, however right the key was
    j.ending = true;
    fx.letter("BLORRNK?", top, "#b5d94a", 1.0, 1.4);
    anim.flash("suspicious", 2.5, now());
    cam.zoomPunch(0.05);
    loop.hitStop(120);
    later(1.5, () => {
      billSay(BILL_GAGS.jamExcuse, 3);
      hud.narrate(fill(quip(JAM_LINES), { n: String(takes) }), 5, now());
    });
    later(3.2, () => { jam = null; player.lockTimer = 0; });
  }

  // ---------- the soup: ten distillations, each one photographed and sent to everyone ----------
  const soup = newSoup();
  // hash hooks: soup=n puts the first n ingredients in his pocket; distilled=n skips ahead
  for (const id of (Object.keys(INGREDIENTS) as (keyof typeof INGREDIENTS)[]).slice(0, Number(hash.get("soup") ?? 0))) collect(soup, id);
  soup.distilled = Math.min(DISTILLATIONS, Number(hash.get("distilled") ?? 0));
  const POT = new THREE.Vector3(-5.62, 1.12, 0.6);
  let soupBusy = false, steamT = 0, blubT = 0;
  const phone = new THREE.Group();
  {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.14, 0.012), toonShared("#1e1a18", 0.8));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.11), toonShared("#8fd0f0", 0));
    screen.position.z = -0.007;
    screen.rotation.y = Math.PI;
    phone.add(body, screen);
    phone.visible = false;
    ensureInkNormals(phone);
    scene.add(phone);
  }
  function distillSoup() {
    const r = distill(soup);
    if (!r) return;
    const t = now(), n = r.n, ing = INGREDIENTS[r.ingredient];
    soupBusy = true;
    player.stun(5.5);
    player.vel.x = player.vel.y = 0;
    player.facing = -Math.PI / 2;
    billSay([`Distillation ${n}.`, ...SOUP_SAYS.distill], 1.8);
    // in it goes
    const bit = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), toonShared(ing.color, 0.8));
    bit.position.copy(headAt()).setY(player.pos.y + 1.0);
    scene.add(bit);
    toastFlights.push({ m: bit, from: bit.position.clone(), to: POT.clone(), t: 0, dur: 0.4, arc: 0.4, spin: 8, done: () => scene.remove(bit) });
    later(0.45, () => {
      fx.puff(POT, "#c8703f", 6, { spread: 0.2, up: 1.2, size: 0.18, life: 0.6 });
      fx.letter("PLOP!", POT.clone().setY(POT.y + 0.6), "#e39a55", 0.7, 0.8);
      audio.splat();
    });
    for (const k of [0, 1]) later(0.95 + k * 0.4, () => { fx.letter("STIR", POT.clone().add(new THREE.Vector3(0.3, 0.5 + k * 0.2, (k - 0.5) * 0.4)), "#fff7e3", 0.4, 0.5); audio.blub(); anim.bump(-0.3); });
    // the photograph
    later(1.9, () => { phone.visible = true; anim.flash("junklove", 1.2, now()); });
    later(2.4, () => { hud.flash(); audio.shutter(); fx.letter("KLIK!", above(0.45), "#fff7e3", 0.55, 0.6); });
    later(2.6, () => { hud.phoneShow(`Distillation ${n} of ${DISTILLATIONS}`, `Sending to ALL CONTACTS (${CONTACTS})...`); audio.whoosh(0.3); });
    later(3.45, () => hud.phoneSent(`Sent to ${CONTACTS} contacts \u2713`));
    const replies = [...REPLIES].sort(() => pick() - 0.5).slice(0, 3);
    replies.forEach(([from, text], i) => later(3.9 + i * 0.55, () => { hud.phoneReply(from, text); audio.bloop(i); }));
    later(5.5, () => {
      phone.visible = false;
      soupBusy = false;
      // the taste test tops up the soup gauge
      gas = GAS.max;
      gasFill = 0;
      hud.narrate(DISTILLED_LINES[n - 1] ?? `Distillation ${n}.`, 5, now());
      if (r.ready) later(5.2, () => hud.narrate("The soup is ready. It is thick enough to have opinions. Go and eat it at the stove.", 5, now(), true));
    });
    later(7.5, () => hud.phoneHide());
    gags.mark(t);
  }
  function eatSoup() {
    if (!eat(soup)) return;
    soupBusy = true;
    player.stun(3.2);
    player.vel.x = player.vel.y = 0;
    player.facing = -Math.PI / 2;
    slap.start("dig");
    audio.slurp();
    fx.letter("SLUUUURP!", POT.clone().setY(POT.y + 0.9), "#e39a55", 1.2, 1.4);
    fx.puff(POT, "#f4efe4", 8, { spread: 0.3, up: 1.4, size: 0.25, life: 1.2 });
    later(1.5, () => {
      slap.stop();
      bill.squash.position.set(0, 0, 0);
      audio.sting(true);
      fx.letter("SOUP FIRST.", above(0.9), "#f2b632", 0.9, 2.2);
      later(0.5, () => fx.letter("EVERYTHING ELSE LATER.", above(0.5), "#f2b632", 0.7, 2.0));
      billSay(SOUP_SAYS.eat, 3);
      later(1.8, () => audio.burp());
      // fully distilled soup: two extra toots, for good
      GAS.max = 5;
      gas = GAS.max;
      hud.narrate("The soup is eaten. Two hundred and fourteen people are relieved. The soup gauge is permanently larger.", 6, now());
      soupBusy = false;
      commemorate("soup", "The Ten Distillations");
    });
    gags.mark(now());
  }

  // ---------- Big Wanda ----------
  let lastWandaLine = -99, wandaChased = false;
  let toss: { from: THREE.Vector3; t: number } | null = null;
  function wandaSay(line: string, t = now()) {
    hud.say(line, 2.8, t, "wanda");
    audio.speak(line, 150);
    lastWandaLine = t;
  }
  function onWandaMode(m: WandaMode) {
    const t = now();
    if (m === "chase") {
      wandaSay(quip(WANDA_SAYS.chase), t);
      if (!wandaChased) {
        wandaChased = true;
        hud.narrate("Big Wanda has seen the grate. Hurry (Shift), or give her something to applaud (Space).", 5, t);
      }
    } else if (m === "admire" && t - lastWandaLine > 8) wandaSay(quip(WANDA_SAYS.admire), t);
    else if (m === "return" && inv.hands === "rustyGrate") {
      wandaSay(quip(WANDA_SAYS.gaveUp), t);
      hud.narrate("Bill escapes the junkyard with the grate. Big Wanda returns to her trailer with a measuring tape and hope.", 5, t);
      gags.mark(t);
    }
  }
  /** She catches him: the grate goes back on the pile, and he goes over the fence. */
  function wandaCatch() {
    const t = now();
    wanda.holding = 1.4;
    if (inv.hands === "rustyGrate") { inv.hands = null; onDrop(ms, "rustyGrate"); hud.setInventory(inv); refreshObjective(); }
    items.settle(rusty, GRATE_AT.clone().setY(0.4));
    player.stun(3.4);
    player.vel.x = player.vel.y = 0;
    loop.hitStop(160);
    cam.zoomPunch(0.1);
    audio.whoosh(0.3);
    anim.flash("soupgrief", 3, t);
    fx.letter("GOTCHA!", wanda.headWorld(_a).clone().setY(_a.y + 0.3), "#e0367a", 1.1, 1.0);
    wandaSay(quip(WANDA_SAYS.caught), t);
    later(0.8, () => { fx.letter("CATALOGUED!", above(0.5), "#f2b632", 0.9, 1.0); audio.thunk(3); });
    later(1.4, () => {
      toss = { from: player.pos.clone(), t: 0 };
      slap.start("flung");
      audio.slide(true, 0.9);
      audio.whoosh(0.9);
      wandaSay(quip(WANDA_SAYS.toss));
    });
    gags.mark(t);
  }
  function stepToss(dt: number) {
    if (!toss) return;
    toss.t = Math.min(1, toss.t + dt / 1.0);
    const k = toss.t;
    _a.lerpVectors(toss.from, TOSS_TO, k);
    _a.y = Math.sin(k * Math.PI) * 4.5;
    player.teleport(_a, Math.atan2(toss.from.x - TOSS_TO.x, toss.from.z - TOSS_TO.z));
    player.stun(0.3);
    if (k >= 1) {
      toss = null;
      player.teleport(TOSS_TO);
      fall("buttflop");
      audio.whump();
      loop.hitStop(100);
      cam.zoomPunch(0.07);
      fx.letter("WHUMP!", above(0.1), "#f7d547", 0.9, 0.8);
      fx.puff(TOSS_TO.clone().setY(0.1), "#d8cdb4", 8, { spread: 0.6, up: 0.4, size: 0.35, life: 0.9 });
      hud.narrate("Big Wanda keeps the grate for her collection and returns Bill to the lane by air. The grate is back on its pile. So, in a sense, is Bill.", 6, now());
      later(1.6, () => billSay(["She's very organised.", "Noted. My legal department will be in touch."]));
    }
  }

  // ---------- ambient gags: the gag clock fills quiet stretches ----------
  type AmbientGag = "poop" | "gust" | "nose" | "burp" | "trip" | "blurt" | "snag" | "paper";
  let splatUntil = 0, gustT = -1;
  function playGag(g: AmbientGag) {
    const t = now();
    switch (g) {
      case "poop":
        later(0.5, () => {
          bill.setSplat(true);
          splatUntil = now() + 14;
          audio.splat();
          fx.letter("SPLAT!", above(0.5), "#ffffff", 0.8, 0.8);
          fx.puff(above(0.15), "#ffffff", 3, { spread: 0.15, up: 0.3, size: 0.18, life: 0.5 });
          anim.flash("suspicious", 2.5, now());
          later(0.4, () => billSay(BILL_GAGS.poop));
          hud.narrate("A pigeon files a review of Bill's hair.", 4, now());
        });
        fx.letter("coo.", above(2.2), "#dfe6ea", 0.45, 0.7);
        break;
      case "gust": {
        gustT = 0;
        audio.whoosh(1.4);
        const w = new THREE.Vector3(1, 0, -0.4).normalize();
        for (let i = 0; i < 4; i++) later(i * 0.25, () => fx.puff(player.pos.clone().add(new THREE.Vector3(-2.2, 0.3 + pick(), (pick() - 0.5) * 2)), "#e8e0c8", 2, { spread: 0.3, up: 0.1, push: w.clone().multiplyScalar(5), size: 0.22, life: 1 }));
        player.force(w.x * 1.6, w.z * 1.6, 0.5, 1);
        later(0.3, () => billSay(BILL_GAGS.gust));
        hud.narrate("A gust exposes the comb-over's load-bearing structure.", 4, t);
        break;
      }
      case "nose":
        anim.pickNose(t);
        later(1.7, () => {
          audio.pop();
          fx.letter("FWIP!", above(0.3), "#c3dd5a", 0.5, 0.6);
          billSay(BILL_GAGS.nose, 1.8);
        });
        break;
      case "burp": {
        audio.burp();
        const m = above(-0.1);
        fx.puff(m, "#c3dd5a", 3, { spread: 0.15, up: 0.3, push: new THREE.Vector3(Math.sin(player.facing), 0, Math.cos(player.facing)).multiplyScalar(0.8), size: 0.25, life: 1.1 });
        fx.letter("BRRRAAP!", above(0.4), "#c3dd5a", 0.8, 1);
        later(0.8, () => billSay(BILL_GAGS.burp));
        break;
      }
      case "blurt":
        // the satchel plays one synth note at exactly the wrong moment
        audio.blurt();
        bill.satchelMouth(_a);
        fx.letter("BWAAMP!", _a.clone().setY(_a.y + 0.4), "#f2b632", 0.75, 0.9);
        anim.flash("suspicious", 2, t);
        later(0.8, () => billSay(BILL_GAGS.blurt));
        break;
      case "snag": {
        // a cable end catches on something and yanks him back like a bow
        const f = player.facing;
        player.force(-Math.sin(f) * 2.4, -Math.cos(f) * 2.4, 0.25, 1);
        audio.boing();
        fx.letter("TWANG!", above(0.3), "#f7d547", 0.8, 0.8);
        fall("stagger");
        later(0.9, () => billSay(BILL_GAGS.snag));
        break;
      }
      case "paper":
        paper.start(player.pos);
        audio.rustle(0.6);
        later(1.2, () => fx.letter("fwip", above(-0.9), "#ece2c8", 0.4, 0.6));
        break;
      case "trip":
        audio.slide(false, 0.35);
        fall("faceplant");
        later(0.28, () => {
          audio.whump(0.8);
          loop.hitStop(90);
          cam.zoomPunch(0.05);
          fx.letter("OOF!", above(-0.6), "#f7d547", 0.8, 0.8);
          fx.puff(player.pos.clone().setY(player.pos.y + 0.1), "#d8cdb4", 5, { spread: 0.6, up: 0.3, size: 0.3, life: 0.8 });
        });
        later(1.4, () => billSay(BILL_GAGS.trip));
        break;
    }
  }
  const forcedGag = hash.get("gag") as AmbientGag | null;


  // the raccoon, knocked out cold by soup
  let raccoonKO = 0;

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
    const t0 = now();
    for (let i = timers.length - 1; i >= 0; i--) if (t0 >= timers[i].at) { const f = timers[i].fn; timers.splice(i, 1); f(); }
    player.heavy = damp(player.heavy, inv.hands ? 1 : 0, 10, dt);
    player.loadFactor = 1 - 0.12 * clamp(inv.satchel.reduce((m, id) => m + ITEMS[id].mass, 0) / 6, 0, 1);
    if (cardAge >= 0) {
      cardAge += dt;
      player.stun(0.2);
      if ((input.consume("interact") || input.consume("toot") || cardAge > 12) && cardAge > 0.6) closeCard();
    }
    posing = Math.max(0, posing - dt);
    if (syncCarrying(ms, carrying())) refreshObjective();
    stepChallenge(dt);
    stepJam();
    const wr = wanda.step(dt, { bill: { x: player.pos.x, z: player.pos.z }, carryingGrate: inv.hands === "rustyGrate", billInside: player.pos.y > -1 && inJunkyard(player.pos) });
    if (wr.changed) onWandaMode(wr.changed);
    if (wr.caught && !toss && wanda.holding <= 0.01) wandaCatch();
    else if (wanda.brain.mode === "chase" && now() - lastWandaLine > 5) wandaSay(quip(WANDA_SAYS.chase));
    stepRide(dt, move);
    stepWheelspin(dt, move, hurry, !!challenge || !!ride || (player.lockTimer > 0 && spin <= 0));
    player.step(dt, move, analog, hurry, CAM.yaw);
    stepToss(dt);
    if (ride && ride.t > 0.15 && player.moveRatio < 0.45) endRide(true);
    else if (ride && ride.t > 2.3) endRide(false);
    else if (ride) hazards.ride(player.pos, ride.heading);

    // soup refills; the toot dash; clouds that gag Gary and floor raccoons
    if (gas < GAS.max) { gasFill += dt / GAS.refill; if (gasFill >= 1) { gas++; gasFill = 0; } } else gasFill = 0;
    const busy = !!challenge || !!ride || !!jam || soupBusy || !!toss || cardAge >= 0 || posing > 0 || player.lockTimer > 0;

    // soup ingredients: he collects them by walking up to them
    const got = pantry.update(dt, t0, player.pos);
    if (got && collect(soup, got)) {
      const d = INGREDIENTS[got];
      audio.pickup(soup.pocket.length);
      fx.letter("+ SOUP", above(0.5), "#e39a55", 0.6, 0.8);
      anim.flash("junklove", 1.2, t0);
      billSay(SOUP_SAYS.collect, 1.6);
      hud.narrate(d.line, 4.5, t0);
      gags.mark(t0);
    }
    // the pot steams and bubbles to itself
    steamT -= dt;
    if (steamT <= 0 && mode === "ground") { steamT = 0.45; fx.puff(POT.clone().add(new THREE.Vector3((pick() - 0.5) * 0.2, 0.05, (pick() - 0.5) * 0.2)), "#f4efe4", 1, { spread: 0.05, up: 0.45, size: 0.12, life: 1.4, grow: 2.2 }); }
    blubT -= dt;
    if (blubT <= 0) { blubT = 0.7 + pick() * 0.8; if (Math.hypot(player.pos.x - POT.x, player.pos.z - POT.z) < 3.5 && player.pos.y > -1) audio.blub(); }
    if (input.consume("toot") && !busy) toot();
    for (let i = clouds.length - 1; i >= 0; i--) {
      const c = clouds[i];
      if (t0 > c.until) { clouds.splice(i, 1); continue; }
      const wm = wanda.brain.mode;
      if ((wm === "chase" || wm === "admire") && Math.hypot(wanda.pos.x - c.at.x, wanda.pos.z - c.at.z) < 3.6) {
        applaudWanda(wanda.brain);
        fx.letter("CLAP CLAP!", wanda.headWorld(_a).clone(), "#f7d547", 0.8, 1.0);
        wandaSay(quip(WANDA_SAYS.applaud), t0);
        gags.mark(t0);
      }
      const gm = gary.brain.mode;
      if (gm !== "binned" && gm !== "tug" && gm !== "gag" && gary.rig.root.visible && Math.hypot(gary.pos.x - c.at.x, gary.pos.z - c.at.z) < 3.4) {
        gagGary(gary.brain, 4.5);
        audio.grunt(1.4);
        fx.letter("HURK!", gary.headWorld(_a).clone(), "#c3dd5a", 0.9, 0.9);
        garySay(quip(GARY_SAYS.gag), t0);
        hud.narrate("Gary inhales the soup cloud and reconsiders his relationship with air. The Speak & Spell is unguarded.", 5, t0);
        gags.mark(t0);
      }
      const r = route.raccoon;
      if (raccoonKO <= 0 && r.visible && Math.hypot(r.position.x - c.at.x, r.position.z - c.at.z) < 3.4) {
        raccoonKO = 7;
        audio.chitter();
        fx.letter("x_x", r.position.clone().setY(r.position.y + 0.7), "#ffffff", 0.6, 1.2);
        fx.daze(() => route.raccoon.position.clone().setY(route.raccoon.position.y + 0.35), 6.5, t0);
        hud.narrate("The raccoon, who has eaten from every bin on this lane, faints.", 4.5, t0);
        gags.mark(t0);
      }
    }

    // the newspaper train: when it's grown long enough he notices, and it goes everywhere
    const scattered = paper.update(dt, player.pos, t0);
    if (scattered) {
      audio.rustle(2);
      for (const p of scattered) fx.puff(p.setY(p.y + 0.1), "#ece2c8", 1, { spread: 0.2, up: 1.4, size: 0.3, life: 0.8 });
      fx.letter("FLAP-FLAP!", above(0.3), "#ece2c8", 0.6, 0.8);
      anim.flash("suspicious", 1.5, t0);
      billSay(BILL_GAGS.paper);
    }

    // stepping on things
    const hit = hazards.check(dt, { x: player.pos.x, y: player.pos.y, z: player.pos.z, facing: player.facing, speed: player.speed, busy });
    if (hit === "rake") rakeHit();
    else if (hit === "board") startRide();
    hazards.update(dt, WALKABLE);

    // the gag clock: if nothing funny has happened for a while, the world obliges
    if (!busy && !player.isForced) {
      const outside = sceneName === "outdoors" && mode === "ground";
      const g = gags.pick(t0, [
        { id: "poop", ok: outside && t0 > splatUntil, cooldown: 60 },
        { id: "gust", ok: outside, cooldown: 45 },
        { id: "nose", ok: player.speed < 0.2 && !inv.hands, cooldown: 30 },
        { id: "burp", ok: true, cooldown: 40 },
        { id: "trip", ok: player.speed > 1.2 && surface !== "stairs" && !inv.hands, cooldown: 50 },
        { id: "blurt", ok: inv.satchel.length > 0, cooldown: 45 },
        { id: "snag", ok: inv.satchel.length > 0 && player.speed > 0.8 && surface !== "stairs", cooldown: 50 },
        { id: "paper", ok: sceneName !== "outdoors" && player.speed > 0.6 && !paper.active, cooldown: 50 },
      ], pick);
      if (g) playGag(g);
    }

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
      .filter((i) => i.state === "world" && !(i === cable && cableBuried) && !(i === shelf && shelfHidden))
      .map((i) => ({ id: i, x: i.obj.position.x, z: i.obj.position.z, y: i.obj.position.y, reach: ITEMS[i.id].carry === "heavy" ? 1.3 : 1.2 }));
    target = pickTarget({ x: player.pos.x, y: player.pos.y + 0.3, z: player.pos.z, facing: player.facing }, candidates)?.id ?? null;
    delivery = deliveryHere();
    // a prop beats an item only if it's closer
    const np = delivery || challenge ? null : nearestPoke();
    poke = null;
    if (np) {
      const td = target ? Math.hypot(target.obj.position.x - player.pos.x, target.obj.position.z - player.pos.z) : 1e9;
      if (np.d < td) { poke = np.p; target = null; }
    }

    if (challenge || ride || jam || player.lockTimer > 0) input.consume("interact");
    else if (input.consume("interact")) {
      if (delivery) doDeliver(delivery);
      else if (poke) poke.use();
      else if (target) tryPickup(target);
      else if (inv.hands) doDrop();
    }
    if (input.consume("drop") && !challenge && !ride && !jam) doDrop();
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
    const cycle = 45, x = 86 - (streetcarT % cycle) * 5.5;
    route.streetcar.position.x = x;
    route.streetcar.visible = x > -24 && x < 70 && route.builder.groups.outdoors.visible;
    if (Math.abs(x - 62) < 5.5 * dt * 1.01 && pos.y > -1) audio.streetcarBell();
    // the raccoon sits on the bins until Bill gets close, then legs it down the lane
    const r = route.raccoon, home = route.raccoonHome;
    const d = Math.hypot(pos.x - home.x, pos.z - home.z);
    if (raccoonKO > 0) {
      // out cold on the bin lid, then up and away down the lane
      raccoonKO -= dt;
      r.rotation.z = damp(r.rotation.z, Math.PI / 2, 14, dt);
      if (raccoonKO <= 0) { r.rotation.z = 0; raccoonFlee = 1.8; audio.chitter(); }
      return;
    }
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
  const wandaPx = { x: 0, y: 0 };
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
        speed: spin > 0 ? 5 : player.speed,
        hurrying: player.hurrying || spin > 0,
        heavy: player.heavy,
        accel: player.accel,
        yawRate: player.yawRate,
        skidding: player.skidTimer > 0,
        idleTime: player.idleTime,
        satchelCount: inv.satchel.length,
        surfing: !!ride,
        tugging: !!challenge,
        playing: jam ? { pressL: jam.pressL, pressR: jam.pressR } : undefined,
        posing: posing > 0,
      },
      frameDt,
      t,
    );
    slap.apply(bill, frameDt, t);
    if (splatUntil && t > splatUntil) { bill.setSplat(false); splatUntil = 0; }
    if (gustT >= 0) {
      gustT += frameDt;
      bill.hairLift = Math.sin(Math.min(1, gustT / 2.6) * Math.PI) ** 0.5;
      if (gustT > 2.6) { gustT = -1; bill.hairLift = 0; }
    }
    fx.update(frameDt, t);
    if (jam) { jam.pressL = Math.max(0, jam.pressL - frameDt * 7); jam.pressR = Math.max(0, jam.pressR - frameDt * 7); }
    if (phone.visible) {
      // held up in front of his face, pointed at the pot
      headAt(_a);
      phone.position.set(_a.x + Math.sin(player.facing) * 0.3, _a.y - 0.08, _a.z + Math.cos(player.facing) * 0.3);
      phone.rotation.set(0, player.facing, 0);
    }
    surface = estate.surfaces.at(pos, "grass");
    if (!ride && !slap.state) for (const _ of planted) {
      audio.footstep(surface, 1, player.hurrying);
      // the shuffle: one scrape per step as the other loafer drags through, not a drone
      if (!player.hurrying && player.speed > 0.25) audio.scrape(surface, player.speed);
    }
    gary.render(alpha, t, frameDt);
    wanda.render(alpha, t, frameDt);

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
    junkyard.builder.groups.outdoors.visible = mode === "ground";
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
    for (const it of items.list) if (it.state === "world" || it.state === "installed") it.obj.visible = onThisFloor(it.obj.position.y) && !(it === cable && cableBuried) && !(it === shelf && shelfHidden) && !(it === rusty && rustyGone);
    for (const m of props.toast) if (m.parent === scene) m.visible = g.ground.visible;
    for (let i = toastFlights.length - 1; i >= 0; i--) {
      const f = toastFlights[i];
      f.t = Math.min(1, f.t + frameDt / f.dur);
      f.m.position.lerpVectors(f.from, f.to, f.t);
      f.m.position.y += Math.sin(f.t * Math.PI) * f.arc;
      f.m.rotation.x += f.spin * frameDt;
      if (f.t >= 1) { if (f.to.y < 0.1) f.m.rotation.set(-Math.PI / 2, 0, pick() * 3); toastFlights.splice(i, 1); f.done?.(); }
    }
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
    wanda.headWorld(headW);
    cam.project(headW, wandaPx);
    let tgt: { x: number; y: number; label: string } | null = null;
    if (delivery) {
      const m = MISSIONS[delivery.mission];
      cam.project(POINTS[delivery.point].at.clone().setY(POINTS[delivery.point].at.y + 0.9), tgtPx);
      tgt = { x: tgtPx.x, y: tgtPx.y, label: `E  Deliver the ${ITEMS[m.item].shortName} to the ${m.dropLabel}` };
    } else if (target) {
      cam.project(target.obj.position, tgtPx);
      const full = ITEMS[target.id].carry === "satchel" ? inv.satchel.length >= inv.capacity : !!inv.hands;
      const label =
        target === stump && stumpRoot ? "E  Wrestle the stump out of the ground"
        : target === sns && isGuarded(gary.brain, PRIZE_AT) ? "E  Fight Gary for it"
        : full ? `${ITEMS[target.id].shortName}: no room` : `E  Pick up ${ITEMS[target.id].name}`;
      tgt = { x: tgtPx.x, y: tgtPx.y, label };
    } else if (poke) {
      cam.project(poke.at.clone().setY(poke.at.y + 1.0), tgtPx);
      tgt = { x: tgtPx.x, y: tgtPx.y, label: typeof poke.label === "string" ? poke.label : poke.label() };
    }
    let goal: { x: number; y: number } | null = null;
    const o = objective(ms);
    if (o) {
      const m = MISSIONS[o.mission], it = itemOf(m.item);
      if (ms.stages[o.mission] === "find" && it.state === "world") goalW.copy(it.obj.position);
      else goalW.copy(POINTS[o.point].at).setY(POINTS[o.point].at.y + 0.6);
      goal = cam.project(goalW, goalPx);
    }
    if (challenge || posing > 0 || cardAge >= 0) tgt = null;
    hud.update(t, { bill: headPx, gary: mode === "ground" ? garyPx : null, wanda: mode === "ground" ? wandaPx : null }, tgt, challenge ? null : goal);
    hud.setGas(gas, GAS.max, gasFill);
    hud.setSoup({ distilled: soup.distilled, of: DISTILLATIONS, pocket: soup.pocket.length, ready: isReady(soup), eaten: soup.eaten });
    hud.setJam(jam ? { take: takes, played: jam.j.step, sour: jam.j.done, next: nextKey(jam.j) } : null);
    hud.setChallenge(challenge ? { title: challenge.title, progress: challenge.tug.progress, jolt: challenge.jolt, now: t } : null);
    nudge(t, o, goal);
    fpsAvg = damp(fpsAvg, 1 / Math.max(frameDt, 1e-3), 3, frameDt);
    hud.setDebug(
      `${gfx.backend} · tier ${gfx.tier} · ${fpsAvg.toFixed(0)} fps · ${gfx.drawCalls} draws\n` +
        `speed ${player.speed.toFixed(2)} m/s ${player.hurrying ? "hurry" : "shuffle"}${player.skidTimer > 0 ? " SKID" : ""} · ${mode}${inside ? " inside" : ""} · ${surface}\n` +
        `satchel ${inv.satchel.length}/4 ${carriedMass(inv).toFixed(1)} kg · zoom ${cam.zoomMode} · gary ${gary.brain.mode}\n` +
        `gags ${gags.perMinute(t)}/min · last ${gags.sinceLast(t).toFixed(0)} s ago · soup ${gas}${slap.state ? " · " + slap.state : ""}`,
    );

    gfx.render();
    if (capture) takeCapture();
    frames++;
    if (forcedGag && frames === 90) { playGag(forcedGag); gags.mark(t, forcedGag); }
    w.__scav.frames = frames;
    w.__scav.pos = [player.pos.x, player.pos.y, player.pos.z];
    w.__scav.gary = gary.brain.mode;
    w.__scav.stages = { ...ms.stages };
    w.__scav.active = ms.active;
    w.__scav.challenge = challenge ? { kind: challenge.kind, progress: challenge.tug.progress } : null;
    w.__scav.slap = slap.state;
    w.__scav.gas = gas;
    w.__scav.ride = !!ride;
    w.__scav.rooted = !!stumpRoot;
    w.__scav.inv = [...inv.satchel, ...(inv.hands ? [inv.hands] : [])];
    w.__scav.hits = { ...hits };
    w.__scav.buried = cableBuried;
    w.__scav.poke = poke?.id ?? null;
    w.__scav.jam = { active: !!jam, takes, step: jam?.j.step ?? 0 };
    w.__scav.soup = { distilled: soup.distilled, pocket: soup.pocket.length, eaten: soup.eaten };
    w.__scav.wanda = wanda.brain.mode;
    w.__scav.tossed = !!toss;
    w.__scav.album = album.map((a) => a.key);
    w.__scav.card = hud.cardShown;
    w.__scav.photoOk = photoOk;
  }

  // ---------- guidance: the narrator nags, with escalating sarcasm, when progress stalls ----------
  let progressKey = "", progressAt = 0, nudgeLevel = 0;
  const NUDGE_AT = [25, 50, 80];
  function nudge(t: number, o: ReturnType<typeof objective>, goal: { x: number; y: number } | null) {
    const key = JSON.stringify(ms.stages) + inv.satchel.join() + (inv.hands ?? "");
    if (key !== progressKey) { progressKey = key; progressAt = t; nudgeLevel = 0; }
    if (!o || !goal || challenge || nudgeLevel >= 3 || t - progressAt < NUDGE_AT[nudgeLevel]) return;
    nudgeLevel++;
    const m = MISSIONS[o.mission], finding = ms.stages[o.mission] === "find";
    let direction: string;
    if (goalW.y < -1 && pos.y > -1) direction = "downstairs";
    else if (goalW.y > -1 && pos.y < -1) direction = "upstairs";
    else {
      const dx = goal.x - headPx.x, dy = goal.y - headPx.y;
      const h = Math.abs(dx) > 60 ? (dx > 0 ? "right" : "left") : "", v = Math.abs(dy) > 60 ? (dy > 0 ? "down" : "up") : "";
      direction = v && h ? `${v} and to the ${h}` : v ? `${v} the screen` : h ? `to the ${h}` : "right here";
    }
    const paces = String(Math.max(1, Math.round(goalW.distanceTo(pos) / 0.75)));
    const line = fill(quip(MISSION_QUIPS.guidance[nudgeLevel as 1 | 2 | 3]), { direction, target: `the ${finding ? m.pickupLabel : m.dropLabel}`, paces });
    hud.narrate(line[0].toUpperCase() + line.slice(1), 6, t, true);
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
    __scav: {
      ready: boolean; frames: number; backend: string; pos: number[]; gary: string; stages: Record<string, string>; active: string | null;
      challenge?: { kind: string; progress: number } | null; slap?: string | null; gas?: number; ride?: boolean; rooted?: boolean; inv?: string[]; hits?: Record<string, number>; buried?: boolean; poke?: string | null;
      jam?: { active: boolean; takes: number; step: number }; soup?: { distilled: number; pocket: number; eaten: boolean }; wanda?: string; tossed?: boolean; album?: string[]; card?: boolean; photoOk?: boolean;
    };
  };
  w.__scav = { ready: false, frames: 0, backend: gfx.backend, pos: [0, 0, 0], gary: "guard", stages: {}, active: null };
  cam.snap(pos.copy(player.pos));
  await gfx.renderer.compileAsync(scene, cam.camera);
  document.getElementById("loading")?.remove();
  hud.narrate("The masterpiece begins, naturally, with not making music and looking for a cord.", 6, now());
  hud.narrate("On the stove, the soup is not ready. It needs at least ten distillations, and every one must be photographed and sent to everyone he knows.", 6, now(), true);
  gags.mark(now());
  w.__scav.ready = true;
  gfx.renderer.setAnimationLoop((ms) => loop.tick(ms ?? performance.now()));
  addEventListener("resize", () => gfx.resize());
}

boot().catch((err) => {
  console.error(err);
  const el = document.getElementById("loading");
  if (el) el.textContent = `Bill tripped over a cable: ${err instanceof Error ? err.message : String(err)}`;
});

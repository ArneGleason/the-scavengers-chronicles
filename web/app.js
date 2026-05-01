(() => {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");

  const modeLabel = document.querySelector("#modeLabel");
  const placeLabel = document.querySelector("#placeLabel");
  const missionLabel = document.querySelector("#missionLabel");
  const missionDockTitle = document.querySelector("#missionDockTitle");
  const inventoryLabel = document.querySelector("#inventoryLabel");
  const guideLabel = document.querySelector("#guideLabel");
  const toast = document.querySelector("#toast");
  const introOverlay = document.querySelector("#introOverlay");
  const introStart = document.querySelector("#introStart");
  const introScroll = document.querySelector("#introCopy");
  const missionButton = document.querySelector("#missionButton");
  const missionOverlay = document.querySelector("#missionOverlay");
  const missionList = document.querySelector("#missionList");
  const missionClose = document.querySelector("#missionClose");
  const checklistButton = document.querySelector("#checklistButton");
  const checklistOverlay = document.querySelector("#checklistOverlay");
  const checklistList = document.querySelector("#checklistList");
  const checklistClose = document.querySelector("#checklistClose");
  const checklistProgress = document.querySelector("#checklistProgress");
  const endingOverlay = document.querySelector("#endingOverlay");
  const endingClose = document.querySelector("#endingClose");
  const endingCanvas = document.querySelector("#endingCanvas");
  const endingCtx = endingCanvas.getContext("2d");

  const world = {
    minX: -760,
    maxX: 760,
    minY: -560,
    maxY: 1580,
    projection: 0.72,
    southGateY: 1105,
  };

  const locations = {
    livingRoom: { x: -110, y: -80, r: 82, name: "retro living room" },
    basementHoard: { x: -238, y: 145, r: 92, name: "basement hoard" },
    synthAltar: { x: -70, y: 178, r: 82, name: "synth altar" },
    basementRack: { x: -190, y: 215, r: 70, name: "rack of almost music" },
    vault: { x: 156, y: -74, r: 76, name: "rare antique vault" },
    shelfZone: { x: 18, y: -32, r: 70, name: "future shelf zone" },
    backyardDig: { x: -156, y: 430, r: 88, name: "backyard dig patch" },
    workbench: { x: -305, y: 360, r: 78, name: "basement-adjacent workbench" },
    alleyGate: { x: 60, y: 642, r: 66, name: "gated estate alley" },
    abandonedLot: { x: 280, y: 800, r: 86, name: "abandoned lot" },
    dumpster: { x: 505, y: 944, r: 76, name: "corner-store dumpster" },
    landfill: { x: -520, y: 1190, r: 105, name: "city landfill" },
    factory: { x: -150, y: 1350, r: 96, name: "old factory" },
    airfield: { x: 530, y: -420, r: 118, name: "private airfield" },
  };

  const player = {
    x: locations.livingRoom.x,
    y: locations.livingRoom.y,
    heading: Math.PI / 2,
    speed: 158,
    walkTime: 0,
    isWalking: false,
    panicUntil: 0,
    panicX: 0,
    panicY: 0,
  };

  const camera = {
    x: -65,
    y: 118,
  };

  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    run: false,
    actionQueued: false,
    dropQueued: false,
    useQueued: false,
    selectedQueued: null,
  };

  const itemTypes = {
    dinCable: {
      name: "Obscure DIN Sync Cable",
      shortName: "DIN Cable",
      tag: "DIN",
      color: "#30343d",
      accent: "#d8c783",
      useText: "The Scavenger holds the cable up to the light. Still no song, but the delay pedal looks nervous.",
      dropText: "He drops the DIN cable, then immediately calls the spot 'temporary cable staging.'",
    },
    personalityStump: {
      name: "Stump With Personality",
      shortName: "Stump",
      tag: "STP",
      color: "#7b5435",
      accent: "#d1a260",
      useText: "He turns the stump twice and whispers that it has 'presence.' It mostly has dirt.",
      dropText: "The stump lands with the confidence of furniture nobody asked for.",
    },
    powerBrick: {
      name: "Questionable Power Brick",
      shortName: "Power Brick",
      tag: "PWR",
      color: "#39414b",
      accent: "#b8d17b",
      useText: "The power brick hums in a way that suggests either voltage or a tiny lawsuit.",
      dropText: "He sets down the power brick and pretends the smell is vintage.",
    },
    rustyGrate: {
      name: "Rusty Floor Grate",
      shortName: "Rusty Grate",
      tag: "GRT",
      color: "#87624e",
      accent: "#c7a184",
      useText: "He squints through the grate and sees a shelf, a sculpture, and probably tetanus.",
      dropText: "The grate clanks down like industrial applause.",
    },
    grateShelf: {
      name: "Visionary Grate Shelf",
      shortName: "Grate Shelf",
      tag: "SLF",
      color: "#a27754",
      accent: "#ead5a7",
      useText: "The shelf is mostly sharp edges and conviction. Naturally, he calls it mid-century.",
      dropText: "He sets down the shelf with gallery-opening seriousness.",
    },
    rackRails: {
      name: "Factory Rack Rails",
      shortName: "Rack Rails",
      tag: "RCK",
      color: "#62696f",
      accent: "#d8d0b1",
      useText: "The rack rails are straight, heavy, and more organized than his last decade.",
      dropText: "He drops the rack rails. The floor files a complaint.",
    },
    cableBundle: {
      name: "Mystery Cable Bundle",
      shortName: "Cable Bundle",
      tag: "CBL",
      color: "#2f3438",
      accent: "#dc8e58",
      useText: "He finds three adapters inside the bundle and immediately postpones composing until Tuesday.",
      dropText: "The cable bundle sprawls into a small, judgemental nest.",
    },
  };

  const inventory = {
    capacity: 4,
    slots: [],
    selected: 0,
  };

  const missionDefs = {
    cablePilgrimage: {
      id: "cablePilgrimage",
      title: "Sacred Cable Pilgrimage",
      summary: "Find the obscure DIN sync cable so the masterpiece can continue not beginning.",
      item: "dinCable",
      pickup: { x: -272, y: 178, r: 72, label: "DIN sync cable", place: locations.basementHoard.name },
      drop: { x: locations.synthAltar.x, y: locations.synthAltar.y, r: locations.synthAltar.r, label: "synth altar", place: locations.synthAltar.name },
      pickupGuide: "Search the basement hoard for the obscure DIN sync cable.",
      returnGuide: "Bring the DIN cable to the synth altar. The masterpiece is now only several excuses away.",
      completeGuide: "The cable is installed. Press M to select the next obstacle to genius.",
      pickupText: "Picked up the Obscure DIN Sync Cable. He remembers buying it in 1986 and needing it since 1987.",
      completeText: "Mission complete: the cable fits. No music happens, but the excuse architecture improves.",
      unlocks: ["stumpProphecy", "dumpsterDiplomacy"],
    },
    stumpProphecy: {
      id: "stumpProphecy",
      title: "Stump of Destiny",
      summary: "Dig up a stump with personality and declare it the beginning of a furniture movement.",
      item: "personalityStump",
      pickup: { x: locations.backyardDig.x - 28, y: locations.backyardDig.y + 16, r: 76, label: "personality stump", place: locations.backyardDig.name },
      drop: { x: locations.shelfZone.x, y: locations.shelfZone.y, r: locations.shelfZone.r, label: "future shelf zone", place: locations.shelfZone.name },
      pickupGuide: "Go to the backyard dig patch and recover the stump with personality.",
      returnGuide: "Bring the stump to the living-room shelf zone before it becomes compost with opinions.",
      completeGuide: "The stump has arrived indoors, which history may not forgive.",
      pickupText: "Picked up the Stump With Personality. It is heavy with dirt and unearned confidence.",
      completeText: "Mission complete: the stump is now furniture-adjacent, which is legally different from garbage.",
      unlocks: [],
    },
    dumpsterDiplomacy: {
      id: "dumpsterDiplomacy",
      title: "Dumpster Power Diplomacy",
      summary: "Recover a suspicious power brick from the corner-store dumpster and pretend it is rare.",
      item: "powerBrick",
      pickup: { x: locations.dumpster.x, y: locations.dumpster.y, r: locations.dumpster.r, label: "questionable power brick", place: locations.dumpster.name },
      drop: { x: locations.synthAltar.x, y: locations.synthAltar.y, r: locations.synthAltar.r, label: "synth altar", place: locations.synthAltar.name },
      pickupGuide: "Walk through the estate alley to the corner-store dumpster and scavenge the power brick.",
      returnGuide: "Bring the power brick back to the synth altar without accepting modern safety standards.",
      completeGuide: "The power brick is home. The basement grid groans in several dialects.",
      pickupText: "Picked up the Questionable Power Brick. It has no label, which he calls 'universal compatibility.'",
      completeText: "Mission complete: the synth altar accepts the power brick and immediately smells warmer.",
      unlocks: [],
    },
    grateShelf: {
      id: "grateShelf",
      title: "Grate Shelf Revelation",
      summary: "Turn landfill metal into an antique-vault shelf because buying shelves is how they get you.",
      lockedText: "Locked until two starter errands prove The Scavenger is willing to leave the house repeatedly",
      legs: [
        {
          item: "rustyGrate",
          pickup: { x: locations.landfill.x, y: locations.landfill.y, r: locations.landfill.r, label: "rusty floor grate", place: locations.landfill.name },
          drop: { x: locations.workbench.x, y: locations.workbench.y, r: locations.workbench.r, label: "workbench", place: locations.workbench.name },
          pickupGuide: "The landfill route is open. Find a rusty floor grate with shelf potential.",
          returnGuide: "Bring the rusty grate to the workbench so he can convert danger into decor.",
          pickupText: "Picked up the Rusty Floor Grate. It has a pattern, a smell, and a tetanus narrative.",
          dropText: "Stage complete: the grate becomes a shelf after three minutes of hammering and forty years of theory.",
        },
        {
          item: "grateShelf",
          pickup: { x: locations.workbench.x + 34, y: locations.workbench.y - 18, r: 68, label: "grate shelf", place: locations.workbench.name },
          drop: { x: locations.vault.x, y: locations.vault.y, r: locations.vault.r, label: "antique vault", place: locations.vault.name },
          pickupGuide: "Pick up the visionary grate shelf from the workbench.",
          returnGuide: "Install the grate shelf in the antique vault, where sharp edges become provenance.",
          pickupText: "Picked up the Visionary Grate Shelf. It is mostly rust plus thesis statement.",
          dropText: "Mission complete: the antique vault gains one shelf and loses any claim to dignity.",
        },
      ],
      completeGuide: "The vault shelf is installed. Several antiques now fear for their finish.",
      completeText: "Mission complete: the grate shelf is installed with the confidence of a man banned from furniture stores.",
      unlocks: [],
    },
    rackRailRescue: {
      id: "rackRailRescue",
      title: "Rack Rail Rescue",
      summary: "Liberate rack rails from the old factory and return with a cable bundle that delays the masterpiece again.",
      lockedText: "Locked until two starter errands open the route past the municipal shame gate",
      legs: [
        {
          item: "rackRails",
          pickup: { x: locations.factory.x, y: locations.factory.y, r: locations.factory.r, label: "factory rack rails", place: locations.factory.name },
          drop: { x: locations.basementRack.x, y: locations.basementRack.y, r: locations.basementRack.r, label: "basement rack", place: locations.basementRack.name },
          pickupGuide: "Go to the old factory and recover rack rails before the building finishes becoming dust.",
          returnGuide: "Bring the rack rails back to the basement rack and call it infrastructure.",
          pickupText: "Picked up Factory Rack Rails. The old factory gives them up with a cough of brick powder.",
          dropText: "Stage complete: the rack rails fit, revealing a mystery cable bundle he forgot he owned.",
        },
        {
          item: "cableBundle",
          pickup: { x: locations.basementRack.x + 26, y: locations.basementRack.y + 20, r: 66, label: "mystery cable bundle", place: locations.basementRack.name },
          drop: { x: locations.synthAltar.x, y: locations.synthAltar.y, r: locations.synthAltar.r, label: "synth altar", place: locations.synthAltar.name },
          pickupGuide: "Collect the mystery cable bundle from the basement rack.",
          returnGuide: "Deliver the cable bundle to the synth altar, where composition may safely remain theoretical.",
          pickupText: "Picked up the Mystery Cable Bundle. He owns every adapter except the one that ends excuses.",
          dropText: "Mission complete: the cable bundle joins the altar. The masterpiece is now waiting on vibes.",
        },
      ],
      completeGuide: "The rack is improved. The music remains hypothetical, but with better cable management.",
      completeText: "Mission complete: the basement rack is structurally happier and artistically no closer to a song.",
      unlocks: [],
    },
  };

  const missionStates = {
    cablePilgrimage: { state: "pickup", unlocked: true, complete: false },
    stumpProphecy: { state: "locked", unlocked: false, complete: false },
    dumpsterDiplomacy: { state: "locked", unlocked: false, complete: false },
    grateShelf: { state: "locked", unlocked: false, complete: false, legIndex: 0 },
    rackRailRescue: { state: "locked", unlocked: false, complete: false, legIndex: 0 },
  };

  let activeMissionId = "cablePilgrimage";
  const starterMissionIds = ["cablePilgrimage", "stumpProphecy", "dumpsterDiplomacy"];
  const expandedMissionIds = ["grateShelf", "rackRailRescue"];
  const allMissionIds = Object.keys(missionDefs);

  const worldItems = [
    createWorldItem("dinCable", missionDefs.cablePilgrimage.pickup.x, missionDefs.cablePilgrimage.pickup.y, "mission", "cablePilgrimage"),
  ];

  const discoveries = [
    {
      id: "hairspray",
      kind: "can",
      x: 70,
      y: 34,
      label: "Ancient Hairspray",
      seen: false,
      color: "#9aa87d",
      accent: "#f0dca6",
      text: "He gives the long side hair a brave misting and pats the thinning top like a failing lawn.",
      repeatText: "The hairspray can rattles with the last fumes of follicle denial.",
    },
    {
      id: "newspaperHoard",
      kind: "stack",
      x: -305,
      y: 88,
      label: "Newspaper Hoard",
      seen: false,
      color: "#d8c9a3",
      accent: "#5e5545",
      text: "Stacks of newspapers sorted by year, weather event, and whether he was right about something.",
      repeatText: "The newspaper hoard remains searchable only by mood.",
    },
    {
      id: "synthWall",
      kind: "synth",
      x: -96,
      y: 236,
      label: "Synth Wall",
      seen: false,
      color: "#393e4a",
      accent: "#d48d5a",
      text: "A wall of synthesizers waits for the exact cable that will transform silence into paperwork.",
      repeatText: "The synth wall blinks patiently. No composition has been harmed.",
    },
    {
      id: "researchLog",
      kind: "book",
      x: -16,
      y: 90,
      label: "Research Log",
      seen: false,
      color: "#c28e52",
      accent: "#fff1bd",
      text: "The log contains forty years of track titles and zero tracks. One page just says 'needs better chair.'",
      repeatText: "The research log continues mistaking preparation for output.",
    },
    {
      id: "antiqueVault",
      kind: "safe",
      x: 168,
      y: -58,
      label: "Antique Vault",
      seen: false,
      color: "#7d6a54",
      accent: "#f1d27b",
      text: "A vault of rare antiques, none displayed because display requires dusting and emotional risk.",
      repeatText: "The antique vault smells like locked cabinets and postponed taste.",
    },
    {
      id: "digPatch",
      kind: "dig",
      x: -218,
      y: 462,
      label: "Backyard Dig Patch",
      seen: false,
      color: "#7b5435",
      accent: "#d8b06a",
      text: "The dig patch contains nails, roots, and a buried relic he calls 'wood with a past.'",
      repeatText: "The backyard remains one shovel away from archaeology or a utility bill.",
    },
    {
      id: "applianceLot",
      kind: "appliance",
      x: 300,
      y: 802,
      label: "Abandoned Appliance",
      seen: false,
      color: "#a8b0a3",
      accent: "#6a7367",
      text: "A dead washer sits in the lot. He sees storage, sculpture, and possibly a kick drum.",
      repeatText: "The appliance refuses to reveal whether it is furniture yet.",
    },
    {
      id: "copBlindSpot",
      kind: "sign",
      x: 374,
      y: 760,
      label: "Patrol Blind Spot",
      seen: false,
      color: "#f0c770",
      accent: "#39414b",
      text: "A perfect patrol blind spot, discovered by someone who has carried suspicious trash before.",
      repeatText: "The blind spot remains a triumph of route planning and poor lighting.",
    },
    {
      id: "landfillTotem",
      kind: "stack",
      x: -584,
      y: 1215,
      label: "Landfill Totem",
      seen: false,
      color: "#866a52",
      accent: "#d8c78e",
      text: "A tower of broken drawers and bent lamps. He calls it a materials library with ventilation.",
      repeatText: "The landfill totem leans toward accreditation.",
    },
    {
      id: "airfieldFence",
      kind: "sign",
      x: 430,
      y: -318,
      label: "Airfield Fence",
      seen: false,
      color: "#d8e0df",
      accent: "#2f4753",
      text: "A private airfield fence. He has a plan involving tools, confidence, and aviation vocabulary.",
      repeatText: "The airfield fence continues not endorsing the plan.",
    },
  ];

  const optionalGoals = [
    { id: "hairspray", requester: "Bathroom Mirror", title: "Aerosol Follicle Strategy", detail: "Inspect the old hairspray can and witness structural denial.", completeText: "The side hair has been reinforced." },
    { id: "newspaperHoard", requester: "The Archive", title: "Audit the Paper Mountain", detail: "Inspect the massive newspaper hoard.", completeText: "Nothing was thrown away. Scholarship survives." },
    { id: "synthWall", requester: "The Masterpiece", title: "Consult the Synth Wall", detail: "Inspect the basement synth wall that has waited forty years.", completeText: "The synths blinked. The music did not." },
    { id: "researchLog", requester: "Future Biographer", title: "Read the Research Log", detail: "Inspect the log of titles, plans, and almost-starts.", completeText: "Another page of preparation becomes evidence." },
    { id: "antiqueVault", requester: "Rare Things", title: "Check the Vault", detail: "Inspect the rare antique vault and its dust-protected self-importance.", completeText: "The antiques remain rare and under-lit." },
    { id: "digPatch", requester: "Backyard Soil", title: "Validate the Dig Patch", detail: "Inspect the backyard patch where roots become relics.", completeText: "The yard has been reclassified as a site." },
    { id: "applianceLot", requester: "Functional Trash", title: "Admire a Dead Appliance", detail: "Inspect the abandoned-lot appliance and imagine a future for it.", completeText: "The washer is now spiritually furniture." },
    { id: "copBlindSpot", requester: "Route Planning", title: "Find the Patrol Blind Spot", detail: "Inspect the safe-ish corner of the neighbourhood route.", completeText: "The blind spot has joined the mental map." },
    { id: "landfillTotem", requester: "Material Science", title: "Respect the Landfill Totem", detail: "Inspect the landfill tower of things with potential.", completeText: "The totem has granted permission to overpack." },
    { id: "airfieldFence", requester: "Escape Plan", title: "Touch the Airfield Dream", detail: "Inspect the private airfield fence.", completeText: "The fence did not say no in writing." },
  ];

  const optionalGoalById = Object.fromEntries(optionalGoals.map((goal) => [goal.id, goal]));

  const cops = [
    {
      name: "Officer Beige",
      x: 380,
      y: 695,
      speed: 72,
      target: 1,
      lastScoldAt: 0,
      path: [
        { x: 380, y: 695 },
        { x: 545, y: 760 },
        { x: 560, y: 970 },
        { x: 350, y: 1010 },
      ],
    },
    {
      name: "Officer Clipboard",
      x: 150,
      y: 880,
      speed: 58,
      target: 1,
      lastScoldAt: 0,
      path: [
        { x: 150, y: 880 },
        { x: 330, y: 910 },
        { x: 420, y: 1080 },
        { x: 210, y: 1060 },
      ],
    },
  ];

  let gameStarted = false;
  let introReady = false;
  let introSkipClicks = 0;
  let introLastSkipClickAt = 0;
  let introCheatBuffer = "";
  let introLastCheatAt = 0;
  let introUnlockTimer = 0;
  let introSkipResetTimer = 0;
  let lastTime = performance.now();
  let toastUntil = 0;
  let expandedUnlocked = false;
  let endgameReady = false;
  let dayEnded = false;
  let gameStartedAt = 0;
  let hairsprayGagDone = false;
  let lastGateScoldAt = 0;

  const audio = {
    context: null,
    disabled: false,
    master: null,
    humGain: null,
    humOsc: null,
  };

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (event) => {
    if (!gameStarted && tryHandleIntroCheat(event)) return;

    const key = normalizeKey(event);
    if (!key) return;
    event.preventDefault();

    if (!gameStarted) {
      if (key === "action") {
        if (introReady) startGame();
        else handleIntroImpatience();
      }
      return;
    }

    if (!endingOverlay.hidden) {
      if (key === "action" || key === "escape") closeEndingOverlay();
      return;
    }

    if (key === "mission") {
      toggleMissionBrowser();
      return;
    }

    if (key === "checklist") {
      toggleChecklist();
      return;
    }

    if (!missionOverlay.hidden || !checklistOverlay.hidden) {
      if (key === "escape") {
        closeMissionBrowser();
        closeChecklist();
      }
      return;
    }

    if (key === "action") {
      if (!event.repeat) input.actionQueued = true;
      return;
    }
    if (key === "drop") {
      if (!event.repeat) input.dropQueued = true;
      return;
    }
    if (key === "use") {
      if (!event.repeat) input.useQueued = true;
      return;
    }
    if (key.startsWith("slot")) {
      if (!event.repeat) input.selectedQueued = Number(key.slice(4));
      return;
    }
    input[key] = true;
  });

  window.addEventListener("keyup", (event) => {
    const key = normalizeKey(event);
    if (!key || key === "action" || key === "drop" || key === "use" || key === "mission" || key === "checklist" || key === "escape" || key.startsWith("slot")) return;
    event.preventDefault();
    if (!gameStarted) return;
    input[key] = false;
  });

  introStart.addEventListener("click", handleIntroStartClick);
  introScroll.addEventListener("animationend", unlockIntro, { once: true });
  missionButton.addEventListener("click", openMissionBrowser);
  missionClose.addEventListener("click", closeMissionBrowser);
  checklistButton.addEventListener("click", openChecklist);
  checklistClose.addEventListener("click", closeChecklist);
  endingClose.addEventListener("click", closeEndingOverlay);

  resize();
  introUnlockTimer = window.setTimeout(unlockIntro, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 900 : 23500);
  requestAnimationFrame(loop);

  function loop(now) {
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastTime = now;
    update(dt, now);
    draw(now);
    drawEndingScene(now);
    requestAnimationFrame(loop);
  }

  function normalizeKey(event) {
    if (event.code === "ArrowUp" || event.code === "KeyW") return "up";
    if (event.code === "ArrowDown" || event.code === "KeyS") return "down";
    if (event.code === "ArrowLeft" || event.code === "KeyA") return "left";
    if (event.code === "ArrowRight" || event.code === "KeyD") return "right";
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") return "run";
    if (event.code === "KeyE" || event.code === "Space" || event.code === "Enter") return "action";
    if (event.code === "KeyR") return "drop";
    if (event.code === "KeyF") return "use";
    if (event.code === "KeyM") return "mission";
    if (event.code === "KeyC") return "checklist";
    if (event.code === "Escape") return "escape";
    if (event.code === "Digit1") return "slot0";
    if (event.code === "Digit2") return "slot1";
    if (event.code === "Digit3") return "slot2";
    if (event.code === "Digit4") return "slot3";
    return "";
  }

  function resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function tryHandleIntroCheat(event) {
    const letter = event.key && event.key.length === 1 ? event.key.toUpperCase() : "";
    if (!letter) return false;

    const cheat = "END";
    const now = performance.now();
    if (now - introLastCheatAt > 1800) introCheatBuffer = "";
    introLastCheatAt = now;
    introCheatBuffer = `${introCheatBuffer}${letter}`.slice(-cheat.length);

    if (introCheatBuffer.endsWith(cheat)) {
      event.preventDefault();
      introCheatBuffer = "";
      triggerEndingCheat();
      return true;
    }

    const pendingCheat = cheat.startsWith(introCheatBuffer) || letter === cheat[0];
    if (pendingCheat) event.preventDefault();
    return pendingCheat;
  }

  function triggerEndingCheat() {
    window.clearTimeout(introUnlockTimer);
    window.clearTimeout(introSkipResetTimer);
    initAudio();
    gameStarted = true;
    introReady = true;
    introOverlay.hidden = true;
    closeMissionBrowser();
    closeChecklist();
    clearMovementInput();
    inventory.slots = [];
    inventory.selected = 0;
    expandedUnlocked = true;
    endgameReady = true;
    dayEnded = true;
    player.x = locations.airfield.x - 40;
    player.y = locations.airfield.y + 80;
    for (const [missionId, state] of Object.entries(missionStates)) {
      state.unlocked = true;
      state.complete = true;
      state.state = "complete";
      if (state.legIndex !== undefined) state.legIndex = missionLegCount(missionDefs[missionId]) - 1;
    }
    for (const item of worldItems) item.delivered = true;
    renderMissionBrowser();
    renderChecklist();
    playMissionCompleteSound();
    showEndingOverlay();
    say("END accepted: The Scavenger skips process and boards the escape plan with no music written.", 4.8);
  }

  function handleIntroStartClick() {
    if (introReady) {
      startGame();
      return;
    }
    handleIntroImpatience();
  }

  function handleIntroImpatience() {
    const now = performance.now();
    introSkipClicks = now - introLastSkipClickAt < 1250 ? introSkipClicks + 1 : 1;
    introLastSkipClickAt = now;
    window.clearTimeout(introSkipResetTimer);
    introSkipResetTimer = window.setTimeout(() => {
      introSkipClicks = 0;
    }, 1350);

    introStart.classList.remove("is-irritated");
    void introStart.offsetWidth;
    introStart.classList.add("is-irritated");
    speedUpIntroScroll(introSkipClicks);

    if (introSkipClicks >= 3) {
      introScroll.classList.add("is-skipped");
      introStart.textContent = "Fine. Begin the Hoard.";
      say("Fine. He skims the backstory like an instruction manual for a synth he will never read.", 3);
      unlockIntro({ skipped: true });
      return;
    }

    introStart.textContent = introSkipClicks === 1 ? "Nostalgia Requires Patience" : "Click Faster, Archivist";
    say(introSkipClicks === 1 ? "The intro opens another drawer of context." : "The text hurries. The cable pile remains unmoved.", 2.2);
  }

  function speedUpIntroScroll(clicks) {
    const animations = introScroll.getAnimations ? introScroll.getAnimations() : [];
    const animation = animations[0];
    if (animation && animation.playbackRate !== undefined) {
      animation.updatePlaybackRate(Math.min(4, 1 + clicks * 0.85));
    }
  }

  function unlockIntro(options = {}) {
    if (introReady) return;
    window.clearTimeout(introUnlockTimer);
    window.clearTimeout(introSkipResetTimer);
    introReady = true;
    introStart.classList.remove("is-reading", "is-irritated");
    introStart.textContent = options.skipped ? "Start Scavenging, You Menace" : "Start Scavenging";
    introStart.focus();
  }

  function startGame() {
    if (!introReady || gameStarted) return;
    initAudio();
    gameStarted = true;
    gameStartedAt = performance.now();
    introOverlay.hidden = true;
    renderMissionBrowser();
    renderChecklist();
    playTone({ frequency: 330, duration: 0.16, type: "triangle", gain: 0.08 });
    say("Mission: find the DIN sync cable before another decade gets classified as preparation.", 4.2);
  }

  function toggleMissionBrowser() {
    if (missionOverlay.hidden) openMissionBrowser();
    else closeMissionBrowser();
  }

  function openMissionBrowser() {
    if (!gameStarted) return;
    closeChecklist();
    clearMovementInput();
    renderMissionBrowser();
    missionOverlay.hidden = false;
    missionButton.textContent = "Close";
  }

  function closeMissionBrowser() {
    missionOverlay.hidden = true;
    missionButton.textContent = "Missions";
  }

  function toggleChecklist() {
    if (checklistOverlay.hidden) openChecklist();
    else closeChecklist();
  }

  function openChecklist() {
    if (!gameStarted) return;
    closeMissionBrowser();
    clearMovementInput();
    renderChecklist();
    checklistOverlay.hidden = false;
    checklistButton.textContent = "Close";
  }

  function closeChecklist() {
    checklistOverlay.hidden = true;
    checklistButton.textContent = "Checklist";
  }

  function renderMissionBrowser() {
    missionList.replaceChildren();
    for (const missionId of allMissionIds) {
      const def = missionDefs[missionId];
      const state = missionStates[missionId];
      const card = document.createElement("button");
      card.type = "button";
      card.className = "mission-card";
      if (missionId === activeMissionId) card.classList.add("is-active");
      if (state.complete) card.classList.add("is-complete");
      card.disabled = !state.unlocked || state.complete;

      const title = document.createElement("h3");
      title.textContent = def.title;
      const summary = document.createElement("p");
      summary.textContent = state.unlocked ? def.summary : def.lockedText || "Locked until The Scavenger generates more personal liability.";
      const status = document.createElement("span");
      status.textContent = missionCardStatus(missionId);

      card.append(title, summary, status);
      card.addEventListener("click", () => {
        if (!state.unlocked || state.complete) return;
        activeMissionId = missionId;
        closeMissionBrowser();
        playUseSound();
        say(`Active mission: ${def.title}. ${missionGuideText()}`, 4);
      });
      missionList.append(card);
    }
  }

  function renderChecklist() {
    checklistList.replaceChildren();
    const completed = optionalGoals.filter((goal) => goal.complete).length;
    checklistProgress.textContent = `${completed}/${optionalGoals.length} optional items completed`;

    for (const goal of optionalGoals) {
      const card = document.createElement("article");
      card.className = "checklist-item";
      if (goal.complete) card.classList.add("is-complete");

      const stamp = document.createElement("span");
      stamp.className = "checklist-stamp";
      stamp.textContent = goal.complete ? "DONE" : "OPEN";

      const body = document.createElement("div");
      const requester = document.createElement("span");
      requester.className = "checklist-requester";
      requester.textContent = `Requested by ${goal.requester}`;
      const title = document.createElement("h3");
      title.textContent = goal.title;
      const detail = document.createElement("p");
      detail.textContent = goal.detail;
      body.append(requester, title, detail);
      card.append(stamp, body);
      checklistList.append(card);
    }
  }

  function completeOptionalGoal(id, options = {}) {
    const goal = optionalGoalById[id];
    if (!goal || goal.complete) return false;
    goal.complete = true;
    renderChecklist();
    window.setTimeout(() => {
      say(`Checklist updated: ${goal.title}. ${goal.completeText}`, 3.8);
    }, options.delay || 0);
    return true;
  }

  function missionCardStatus(missionId) {
    const state = missionStates[missionId];
    if (!state.unlocked) return "locked";
    if (state.complete) return "complete";
    if (missionId === activeMissionId) return "active";
    return "available";
  }

  function update(dt, now) {
    if (!gameStarted) {
      clearQueuedInputs();
      updateHud(now);
      return;
    }

    handleInventoryShortcuts();
    updateCops(dt, now);
    updatePlayer(dt, now);
    maybeHairsprayGag(now);
    updateCamera(dt);
    updateHud(now);
    updateAudio(now);
    clearQueuedInputs();
  }

  function updatePlayer(dt, now) {
    if (player.panicUntil > now) {
      const speed = player.speed * 1.85;
      player.x += player.panicX * speed * dt;
      player.y += player.panicY * speed * dt;
      player.heading = Math.atan2(player.panicY, player.panicX);
      player.isWalking = true;
      player.walkTime += dt * 13;
      constrainPlayer(now);
      return;
    }

    let dx = 0;
    let dy = 0;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    const mag = Math.hypot(dx, dy);
    if (mag > 0) {
      dx /= mag;
      dy /= mag;
      const speed = player.speed * (input.run ? 1.42 : 1);
      player.x += dx * speed * dt;
      player.y += dy * speed * dt;
      player.heading = Math.atan2(dy, dx);
      player.isWalking = true;
      player.walkTime += dt * (input.run ? 15 : 10);
    } else {
      player.isWalking = false;
      player.walkTime += dt * 2;
    }

    constrainPlayer(now);

    if (input.actionQueued) {
      handleInteractionAction();
    }
  }

  function constrainPlayer(now) {
    player.x = clamp(player.x, world.minX, world.maxX);
    player.y = clamp(player.y, world.minY, world.maxY);
    if (!expandedUnlocked && player.y > world.southGateY) {
      player.y = world.southGateY;
      if (now - lastGateScoldAt > 2600) {
        lastGateScoldAt = now;
        say(`Landfill and factory route blocked: finish ${2 - completedStarterMissionCount()} more starter errand${2 - completedStarterMissionCount() === 1 ? "" : "s"} before escalating the mess.`, 3.2);
      }
    }
  }

  function handleInventoryShortcuts() {
    if (input.selectedQueued !== null) selectInventorySlot(input.selectedQueued);
    if (input.dropQueued) dropSelectedItem();
    if (input.useQueued) useSelectedItem();
  }

  function handleInteractionAction() {
    if (endgameReady && distance(player, locations.airfield) < locations.airfield.r) {
      finishGame();
      return true;
    }
    if (tryDeliverActiveMission()) return true;
    if (tryPickupNearbyItem()) return true;
    if (tryInspectNearbyDiscovery()) return true;
    say("He pats nearby surfaces and finds only dust, intent, and no useful adapter.", 2.5);
    return false;
  }

  function tryPickupNearbyItem() {
    const item = nearestWorldItem(player, 72);
    if (!item) return false;
    if (inventory.slots.length >= inventory.capacity) {
      say("Inventory full. He briefly considers wearing a cable as a belt, then calls that phase two.", 2.8);
      return true;
    }

    item.carried = true;
    inventory.slots.push(item.type);
    inventory.selected = inventory.slots.length - 1;
    playPickupSound();

    const relatedMission = item.missionId ? missionDefs[item.missionId] : missionForItem(item.type);
    const relatedState = relatedMission ? missionStates[relatedMission.id] : null;
    const relatedLeg = relatedMission ? currentMissionLeg(relatedMission, relatedState) : null;
    if (relatedMission && relatedState.unlocked && !relatedState.complete && relatedState.state === "pickup" && relatedLeg && relatedLeg.item === item.type) {
      relatedState.state = "return";
    }

    say(relatedMission && relatedLeg ? relatedLeg.pickupText : `Picked up ${itemTypes[item.type].name}.`, 3.4);
    return true;
  }

  function tryInspectNearbyDiscovery() {
    const discovery = nearestDiscovery(player, 66);
    if (!discovery) return false;
    const firstLook = !discovery.seen;
    discovery.seen = true;
    playUseSound();
    say(firstLook ? `Discovered ${discovery.label}: ${discovery.text}` : discovery.repeatText, firstLook ? 4.6 : 3.2);
    if (firstLook) completeOptionalGoal(discovery.id, { delay: 900 });
    return true;
  }

  function tryDeliverActiveMission() {
    const def = activeMissionDef();
    const state = activeMissionState();
    const leg = currentMissionLeg(def, state);
    if (!def || !state || !leg || state.complete || state.state !== "return") return false;
    if (distance(player, leg.drop) > leg.drop.r || !hasItem(leg.item)) return false;

    removeItemFromInventory(leg.item);

    if (state.legIndex !== undefined && state.legIndex < missionLegCount(def) - 1) {
      state.legIndex += 1;
      state.state = "pickup";
      ensureMissionItem(def.id);
      renderMissionBrowser();
      playUseSound();
      say(`${leg.dropText} ${missionGuideText()}`, 5.2);
      return true;
    }

    state.state = "complete";
    state.complete = true;
    playMissionCompleteSound();
    const unlocked = unlockMissions(def.unlocks || []);
    const openedExpanded = maybeUnlockExpandedRoute();
    const startedEndgame = maybeBeginEndgame();
    renderMissionBrowser();
    if (unlocked.length || openedExpanded) window.setTimeout(openMissionBrowser, 900);
    say(`${def.completeText}${openedExpanded ? " The shame gate opens toward landfill and factory opportunities, which is how hope becomes a route." : ""}${startedEndgame ? " The private airfield is now the final objective. Go prove the escape plan is at least drawable." : ""}`, openedExpanded || startedEndgame ? 6.4 : 5);
    return true;
  }

  function selectInventorySlot(index) {
    if (index >= inventory.capacity) return;
    inventory.selected = index;
    if (inventory.slots[index]) say(`Selected ${itemTypes[inventory.slots[index]].name}.`, 1.4);
  }

  function dropSelectedItem() {
    if (!inventory.slots.length) {
      say("Inventory empty. The Scavenger has only theories and several overdue projects.", 2.4);
      return;
    }
    const selected = clamp(inventory.selected, 0, inventory.slots.length - 1);
    const type = inventory.slots.splice(selected, 1)[0];
    inventory.selected = clamp(selected, 0, Math.max(0, inventory.slots.length - 1));
    const mission = missionForItem(type);
    worldItems.push(createWorldItem(type, player.x + 24, player.y + 18, "dropped", mission ? mission.id : ""));
    playDropSound();
    say(itemTypes[type].dropText, 2.8);
  }

  function useSelectedItem() {
    if (!inventory.slots.length) {
      say("He has nothing to use except certainty, and that is already over-applied.", 2.4);
      return;
    }
    const type = inventory.slots[clamp(inventory.selected, 0, inventory.slots.length - 1)];
    const active = activeMissionDef();
    const activeLeg = currentMissionLeg(active, activeMissionState());
    if (activeLeg && type === activeLeg.item && distance(player, activeLeg.drop) <= activeLeg.drop.r) {
      tryDeliverActiveMission();
      return;
    }
    playUseSound();
    say(itemTypes[type].useText, 3.4);
  }

  function clearQueuedInputs() {
    input.actionQueued = false;
    input.dropQueued = false;
    input.useQueued = false;
    input.selectedQueued = null;
  }

  function clearMovementInput() {
    input.up = false;
    input.down = false;
    input.left = false;
    input.right = false;
    input.run = false;
  }

  function updateCops(dt, now) {
    for (const cop of cops) {
      const target = cop.path[cop.target];
      const dx = target.x - cop.x;
      const dy = target.y - cop.y;
      const mag = Math.hypot(dx, dy) || 1;
      if (mag < 10) {
        cop.target = (cop.target + 1) % cop.path.length;
      } else {
        cop.x += (dx / mag) * cop.speed * dt;
        cop.y += (dy / mag) * cop.speed * dt;
      }

      if (distance(player, cop) < 58) {
        const awayX = player.x - cop.x;
        const awayY = player.y - cop.y;
        const awayMag = Math.hypot(awayX, awayY) || 1;
        player.panicX = awayX / awayMag;
        player.panicY = awayY / awayMag;
        player.panicUntil = Math.max(player.panicUntil, now + 650);
        if (now - cop.lastScoldAt > 2600) {
          cop.lastScoldAt = now;
          playDropSound();
          say(`${cop.name}: "Sir, why are you carrying municipal-looking trash with purpose?"`, 3.2);
        }
      }
    }
  }

  function updateCamera(dt) {
    camera.x += (player.x - camera.x) * Math.min(1, dt * 4);
    camera.y += (player.y - camera.y) * Math.min(1, dt * 4);
  }

  function updateHud(now) {
    const active = activeMissionDef();
    modeLabel.textContent = endgameReady && !dayEnded ? "Airfield Plan" : "Scavenging";
    placeLabel.textContent = placeName();
    missionLabel.textContent = active ? active.title : endgameReady ? "Private Airfield Escape" : "No active mission";
    missionDockTitle.textContent = active ? active.title : endgameReady ? "Private Airfield Escape" : "Errands Complete";
    guideLabel.textContent = currentGuideText();
    inventoryLabel.textContent = inventory.slots.length
      ? inventory.slots.map((type, index) => `${index === inventory.selected ? ">" : ""}${itemTypes[type].shortName}`).join(" / ")
      : "Empty";

    if (toast.hidden && toastUntil > now) toast.hidden = false;
    if (!toast.hidden && toastUntil <= now) toast.hidden = true;
  }

  function maybeHairsprayGag(now) {
    if (hairsprayGagDone || !gameStartedAt || now - gameStartedAt < 22000) return;
    hairsprayGagDone = true;
    say("He pauses to mist the long side hair with ancient hairspray. The top remains a negotiation.", 3.6);
  }

  function say(text, duration = 3) {
    toast.textContent = text;
    toast.hidden = false;
    toastUntil = performance.now() + duration * 1000;
  }

  function missionGuideText() {
    if (endgameReady && !dayEnded) return "All errands are complete. Go to the private airfield and press E near the jet.";
    const def = activeMissionDef();
    const state = activeMissionState();
    const leg = currentMissionLeg(def, state);
    if (!def || !state || !state.unlocked) return "Press M to select an available errand.";
    if (state.complete) return def.completeGuide;
    if (!leg) return "This errand has no instructions, which he considers an advanced workflow.";
    if (state.state === "return" && !hasItem(leg.item)) return `Pick ${itemTypes[leg.item].shortName} back up. He cannot deliver a concept.`;
    if (state.state === "return") return leg.returnGuide;
    return leg.pickupGuide;
  }

  function currentGuideText() {
    if (!gameStarted) return "Read the intro";
    const context = nearbyInteractionGuide();
    return context ? `${context} ${missionGuideText()}` : missionGuideText();
  }

  function nearbyInteractionGuide() {
    if (endgameReady && !dayEnded && distance(player, locations.airfield) < locations.airfield.r) return "The jet is right here. Press E to board the escape plan.";
    if (!expandedUnlocked && player.y > world.southGateY - 80) return `Route blocked: finish ${2 - completedStarterMissionCount()} more starter errand${2 - completedStarterMissionCount() === 1 ? "" : "s"} to open landfill and factory scavenging.`;
    if (canDeliverActiveMission()) return "Drop-off is right here.";
    const item = nearestWorldItem(player, 72);
    if (item) return `Pickup nearby: ${itemTypes[item.type].name}.`;
    const discovery = nearestDiscovery(player, 66);
    if (discovery) return discovery.seen ? `Nearby: re-inspect ${discovery.label}.` : `Nearby: inspect ${discovery.label}.`;
    return "";
  }

  function placeName() {
    let nearest = locations.livingRoom;
    let nearestDistance = Infinity;
    for (const loc of Object.values(locations)) {
      const locDistance = distance(player, loc);
      if (locDistance < nearestDistance) {
        nearest = loc;
        nearestDistance = locDistance;
      }
    }
    return nearestDistance < 180 ? nearest.name : player.y > 700 ? "neighbourhood route" : "estate grounds";
  }

  function canDeliverActiveMission() {
    const def = activeMissionDef();
    const state = activeMissionState();
    const leg = currentMissionLeg(def, state);
    return Boolean(def && state && leg && state.state === "return" && hasItem(leg.item) && distance(player, leg.drop) <= leg.drop.r);
  }

  function missionForItem(type) {
    for (const def of Object.values(missionDefs)) {
      for (const leg of missionLegs(def)) {
        if (leg.item === type) return def;
      }
    }
    return null;
  }

  function activeMissionDef() {
    return activeMissionId ? missionDefs[activeMissionId] : null;
  }

  function activeMissionState() {
    return activeMissionId ? missionStates[activeMissionId] : null;
  }

  function missionLegs(def) {
    if (!def) return [];
    return def.legs || [def];
  }

  function currentMissionLeg(def, state) {
    if (!def || !state) return null;
    const legs = missionLegs(def);
    return legs[state.legIndex || 0] || null;
  }

  function missionLegCount(def) {
    return missionLegs(def).length;
  }

  function completedStarterMissionCount() {
    return starterMissionIds.filter((id) => missionStates[id].complete).length;
  }

  function unlockMissions(ids) {
    const unlocked = [];
    for (const id of ids) {
      const state = missionStates[id];
      if (!state || state.unlocked) continue;
      state.unlocked = true;
      state.state = "pickup";
      ensureMissionItem(id);
      unlocked.push(id);
    }
    return unlocked;
  }

  function maybeUnlockExpandedRoute() {
    if (expandedUnlocked || completedStarterMissionCount() < 2) return false;
    expandedUnlocked = true;
    unlockMissions(expandedMissionIds);
    return true;
  }

  function maybeBeginEndgame() {
    if (endgameReady || !allMissionIds.every((id) => missionStates[id].complete)) return false;
    endgameReady = true;
    activeMissionId = "";
    return true;
  }

  function ensureMissionItem(missionId) {
    const def = missionDefs[missionId];
    const state = missionStates[missionId];
    const leg = currentMissionLeg(def, state);
    if (!leg) return;
    const hasWorldItem = worldItems.some((item) => item.type === leg.item && !item.delivered && item.missionId === missionId);
    const hasInventoryItem = inventory.slots.includes(leg.item);
    if (!hasWorldItem && !hasInventoryItem) {
      worldItems.push(createWorldItem(leg.item, leg.pickup.x, leg.pickup.y, "mission", missionId));
    }
  }

  function hasItem(type) {
    return inventory.slots.includes(type);
  }

  function removeItemFromInventory(type) {
    const index = inventory.slots.indexOf(type);
    if (index === -1) return false;
    inventory.slots.splice(index, 1);
    inventory.selected = clamp(inventory.selected, 0, Math.max(0, inventory.slots.length - 1));
    for (const item of worldItems) {
      if (item.type === type && item.carried) item.delivered = true;
    }
    return true;
  }

  function createWorldItem(type, x, y, source, missionId = "") {
    return {
      id: `${type}-${source}-${Math.random().toString(36).slice(2)}`,
      type,
      x,
      y,
      source,
      missionId,
      carried: false,
      delivered: false,
    };
  }

  function nearestWorldItem(actor, radius) {
    let nearest = null;
    let nearestDistance = radius;
    for (const item of worldItems) {
      if (item.carried || item.delivered) continue;
      const itemDistance = distance(actor, item);
      if (itemDistance < nearestDistance) {
        nearest = item;
        nearestDistance = itemDistance;
      }
    }
    return nearest;
  }

  function nearestDiscovery(actor, radius) {
    let nearest = null;
    let nearestDistance = radius;
    for (const discovery of discoveries) {
      const discoveryDistance = distance(actor, discovery);
      if (discoveryDistance < nearestDistance) {
        nearest = discovery;
        nearestDistance = discoveryDistance;
      }
    }
    return nearest;
  }

  function finishGame() {
    if (dayEnded) return;
    dayEnded = true;
    closeMissionBrowser();
    closeChecklist();
    clearMovementInput();
    playMissionCompleteSound();
    showEndingOverlay();
    say("Finale: The Scavenger boards the jet. No one asks if he knows what any switch does.", 5);
  }

  function showEndingOverlay() {
    endingOverlay.hidden = false;
    endingClose.focus();
  }

  function closeEndingOverlay() {
    endingOverlay.hidden = true;
    say("He remains near the airfield, reconsidering whether the masterpiece needs one more cable first.", 3.4);
  }

  function targetInfo() {
    if (endgameReady && !dayEnded) {
      return { x: locations.airfield.x, y: locations.airfield.y, label: "Jet" };
    }

    const def = activeMissionDef();
    const state = activeMissionState();
    const leg = currentMissionLeg(def, state);
    if (!def || !state || !leg || state.complete) return null;
    if (state.state === "return") {
      if (!hasItem(leg.item)) {
        const dropped = worldItems.find((item) => item.type === leg.item && !item.carried && !item.delivered);
        if (dropped) return { x: dropped.x, y: dropped.y, label: itemTypes[leg.item].shortName };
      }
      return { x: leg.drop.x, y: leg.drop.y, label: leg.drop.label };
    }
    return { x: leg.pickup.x, y: leg.pickup.y, label: leg.pickup.label };
  }

  function draw(now) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    ctx.clearRect(0, 0, width, height);

    drawBackground(width, height);
    drawWorld(now);
    drawTarget(now);
    drawPrompts(now);
    drawDusk(width, height);
  }

  function drawBackground(width, height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#88b0a4");
    gradient.addColorStop(0.55, "#788f68");
    gradient.addColorStop(1, "#5f735d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawWorld(now) {
    drawGroundPatches();
    drawRoads();
    drawEstate();
    drawBackyard();
    drawNeighbourhood();
    drawExpandedZones();
    drawAirfield();
    for (const discovery of discoveries) drawDiscovery(discovery, now);
    for (const item of worldItems) {
      if (!item.carried && !item.delivered) drawItem(item, now);
    }
    for (const cop of cops) drawCop(cop, now);
    drawScavenger(now);
  }

  function drawGroundPatches() {
    drawIsoRect(-120, 105, 600, 620, "#66845e", "#536b50");
    drawIsoRect(350, 870, 560, 520, "#697261", "#545d51");
    drawIsoRect(-360, 1270, 720, 430, expandedUnlocked ? "#6f695a" : "#596154", "#4d514a");
    drawIsoRect(530, -390, 410, 260, "#73817a", "#53676d");
  }

  function drawRoads() {
    drawPath([
      { x: -20, y: 505 },
      { x: 80, y: 650 },
      { x: 285, y: 760 },
      { x: 510, y: 940 },
      { x: 600, y: 1110 },
    ], "#454c4c", 96, "#c8c0a0");
    drawPath([
      { x: 120, y: 1080 },
      { x: -150, y: 1250 },
      { x: -520, y: 1190 },
    ], expandedUnlocked ? "#414845" : "#343b38", 92, "#b0aa91");
    drawPath([
      { x: -200, y: 1260 },
      { x: -150, y: 1350 },
      { x: 80, y: 1430 },
    ], expandedUnlocked ? "#373b39" : "#303633", 86, "#a9a08b");
  }

  function drawEstate() {
    drawIsoRect(-120, -64, 520, 330, "#b99570", "#6a4c3d");
    drawIsoRect(-258, 128, 230, 180, "#6c5d52", "#493e38");
    drawIsoRect(-62, 156, 220, 175, "#595f58", "#3e4540");
    drawIsoRect(144, -68, 180, 160, "#7b6552", "#4c3d34");
    drawIsoRect(-110, -80, 250, 150, "#c38b63", "#6d4434");
    drawStairs(-150, 62);

    drawSynthRack(-115, 205, 140, 46);
    drawSynthRack(-242, 142, 120, 42);
    drawNewspaperStacks(-326, 80, 5);
    drawSafe(154, -70);
    drawWorkbench(locations.workbench.x, locations.workbench.y);
    drawWorldLabel(-110, -183, "Retro estate");
    drawWorldLabel(-190, 256, "Basement synth hoard");
    drawWorldLabel(156, -168, "Antique vault");
  }

  function drawBackyard() {
    drawIsoRect(-158, 430, 270, 170, "#806143", "#5a432f");
    drawDigRows(-160, 430);
    drawWorldLabel(-150, 332, "Backyard dig");
  }

  function drawNeighbourhood() {
    drawIsoRect(266, 802, 240, 160, "#6e745d", "#525845");
    drawAppliance(300, 802);
    drawDumpster(locations.dumpster.x, locations.dumpster.y);
    drawGate(72, 644);
    drawWorldLabel(246, 700, "Gated estate alley");
    drawWorldLabel(508, 848, "Corner-store dumpster");
  }

  function drawExpandedZones() {
    const alpha = expandedUnlocked ? 1 : 0.45;
    ctx.save();
    ctx.globalAlpha = alpha;
    drawIsoRect(locations.landfill.x, locations.landfill.y, 320, 220, "#76695b", "#504943");
    drawTrashPile(-540, 1180);
    drawIsoRect(locations.factory.x, locations.factory.y, 280, 190, "#5a5850", "#3d3d39");
    drawFactory(-150, 1350);
    drawWorldLabel(-520, 1058, expandedUnlocked ? "City landfill" : "Locked landfill route");
    drawWorldLabel(-150, 1236, expandedUnlocked ? "Old factory" : "Locked factory route");
    ctx.restore();

    if (!expandedUnlocked) {
      const p = project(90, world.southGateY);
      ctx.fillStyle = "#d47a4a";
      ctx.strokeStyle = "#472f29";
      ctx.lineWidth = 2;
      roundedRect(p.x - 62, p.y - 26, 124, 42, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#2e241f";
      ctx.font = "800 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SHAME GATE", p.x, p.y - 2);
    }
  }

  function drawAirfield() {
    drawIsoRect(locations.airfield.x, locations.airfield.y, 430, 190, "#68756f", "#3e5157");
    drawPath([
      { x: 365, y: -420 },
      { x: 710, y: -420 },
    ], "#2f3437", 62, "#e4ddbf");
    drawJet(locations.airfield.x, locations.airfield.y - 16, 0.72);
    drawWorldLabel(locations.airfield.x, locations.airfield.y - 135, "Private airfield");
  }

  function drawTarget(now) {
    const target = targetInfo();
    if (!target) return;
    const p = project(target.x, target.y);
    const pulse = Math.sin(now / 180) * 4;
    ctx.save();
    ctx.strokeStyle = "#fff1a8";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 46 + pulse, 23 + pulse * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(47, 42, 32, 0.82)";
    roundedRect(p.x - 48, p.y - 58, 96, 24, 7);
    ctx.fill();
    ctx.fillStyle = "#fff5d7";
    ctx.font = "800 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(target.label.toUpperCase(), p.x, p.y - 42);
    ctx.restore();
    drawOffscreenArrow(target);
  }

  function drawPrompts(now) {
    const item = nearestWorldItem(player, 72);
    if (item) {
      drawPrompt(item.x, item.y - 48, "E", now);
      return;
    }
    if (canDeliverActiveMission()) {
      const leg = currentMissionLeg(activeMissionDef(), activeMissionState());
      drawPrompt(leg.drop.x, leg.drop.y - 48, "E", now);
      return;
    }
    const discovery = nearestDiscovery(player, 66);
    if (discovery) drawPrompt(discovery.x, discovery.y - 42, "E", now);
    if (endgameReady && !dayEnded && distance(player, locations.airfield) < locations.airfield.r) drawPrompt(locations.airfield.x, locations.airfield.y - 60, "E", now);
  }

  function drawDusk(width, height) {
    const alpha = expandedUnlocked ? 0.08 : 0;
    if (!alpha) return;
    ctx.fillStyle = `rgba(71, 55, 74, ${alpha})`;
    ctx.fillRect(0, 0, width, height);
  }

  function drawScavenger(now) {
    const p = project(player.x, player.y);
    const bob = player.isWalking ? Math.sin(player.walkTime * Math.PI * 2) * 2 : 0;
    const stride = player.isWalking ? Math.sin(player.walkTime * Math.PI * 2) : 0;
    const dirX = Math.cos(player.heading);
    const dirY = Math.sin(player.heading);

    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.fillStyle = "rgba(24, 20, 16, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 16, 17, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#2f2a24";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-7, 18);
    ctx.lineTo(-12 - stride * 5, 30);
    ctx.moveTo(7, 18);
    ctx.lineTo(13 + stride * 5, 30);
    ctx.stroke();

    ctx.fillStyle = "#2f3030";
    roundedRect(-13, -6, 26, 28, 7);
    ctx.fill();
    ctx.fillStyle = "#7b5a45";
    roundedRect(-16, -3, 32, 12, 5);
    ctx.fill();

    ctx.strokeStyle = "#c4946f";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-13, 2);
    ctx.lineTo(-22 - stride * 4, 12);
    ctx.moveTo(13, 2);
    ctx.lineTo(22 + stride * 4, 12);
    ctx.stroke();

    ctx.fillStyle = "#c4936d";
    ctx.beginPath();
    ctx.arc(0, -18, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#44372e";
    ctx.beginPath();
    ctx.ellipse(-12, -10, 5, 20, -0.14, 0, Math.PI * 2);
    ctx.ellipse(12, -10, 5, 20, 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d6a57c";
    ctx.beginPath();
    ctx.ellipse(0, -24, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#f2d88a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dirX * 10, -16 + dirY * 2);
    ctx.lineTo(dirX * 20, -16 + dirY * 8);
    ctx.stroke();
    ctx.restore();
  }

  function drawItem(item, now) {
    const type = itemTypes[item.type];
    const p = project(item.x, item.y);
    const bob = Math.sin(now / 260 + item.x) * 2;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.fillStyle = "rgba(30, 23, 18, 0.25)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = type.color;
    ctx.strokeStyle = "#2e2a25";
    ctx.lineWidth = 2;
    roundedRect(-16, -12, 32, 24, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = type.accent;
    ctx.font = "900 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(type.tag, 0, 4);
    ctx.restore();
  }

  function drawDiscovery(discovery, now) {
    const p = project(discovery.x, discovery.y);
    ctx.save();
    ctx.translate(p.x, p.y);
    if (!discovery.seen) {
      ctx.strokeStyle = "#fff1a8";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.ellipse(0, 2, 24 + Math.sin(now / 200) * 2, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = discovery.color;
    ctx.strokeStyle = "#2f2a25";
    ctx.lineWidth = 2;
    if (discovery.kind === "sign") {
      roundedRect(-20, -20, 40, 28, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = discovery.accent;
      ctx.fillRect(-2, 8, 4, 18);
    } else if (discovery.kind === "stack") {
      for (let i = 0; i < 4; i += 1) {
        roundedRect(-22 + i * 3, -18 + i * 7, 42, 10, 3);
        ctx.fill();
        ctx.stroke();
      }
    } else if (discovery.kind === "safe") {
      roundedRect(-22, -24, 44, 38, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = discovery.accent;
      ctx.beginPath();
      ctx.arc(0, -5, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (discovery.kind === "synth") {
      roundedRect(-28, -16, 56, 24, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = discovery.accent;
      for (let i = 0; i < 6; i += 1) ctx.fillRect(-21 + i * 8, -8, 4, 10);
    } else {
      roundedRect(-20, -18, 40, 28, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = discovery.accent;
      ctx.beginPath();
      ctx.arc(0, -4, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCop(cop, now) {
    const p = project(cop.x, cop.y);
    const angle = Math.atan2(cop.path[cop.target].y - cop.y, cop.path[cop.target].x - cop.x);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle * 0.25);
    ctx.fillStyle = "rgba(32, 38, 45, 0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#263f68";
    roundedRect(-12, -16, 24, 34, 7);
    ctx.fill();
    ctx.fillStyle = "#c89a72";
    ctx.beginPath();
    ctx.arc(0, -24, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1f2e4a";
    ctx.fillRect(-11, -32, 22, 6);
    ctx.fillStyle = "rgba(255, 241, 168, 0.18)";
    ctx.beginPath();
    ctx.moveTo(6, -12);
    ctx.lineTo(86, -32 + Math.sin(now / 300) * 14);
    ctx.lineTo(86, 30 + Math.sin(now / 300) * 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawIsoRect(cx, cy, w, h, fill, stroke) {
    const left = project(cx - w / 2, cy - h / 2);
    const right = project(cx + w / 2, cy - h / 2);
    const bottomRight = project(cx + w / 2, cy + h / 2);
    const bottomLeft = project(cx - w / 2, cy + h / 2);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function drawPath(points, color, width, stripeColor) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < points.length; i += 1) {
      const p = project(points[i].x, points[i].y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.strokeStyle = stripeColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 16]);
    ctx.beginPath();
    for (let i = 0; i < points.length; i += 1) {
      const p = project(points[i].x, points[i].y);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawWorldLabel(x, y, text) {
    const p = project(x, y);
    ctx.save();
    ctx.font = "800 12px sans-serif";
    ctx.textAlign = "center";
    const width = ctx.measureText(text).width + 16;
    ctx.fillStyle = "rgba(35, 31, 26, 0.76)";
    roundedRect(p.x - width / 2, p.y - 14, width, 24, 7);
    ctx.fill();
    ctx.fillStyle = "#fff5d7";
    ctx.fillText(text, p.x, p.y + 2);
    ctx.restore();
  }

  function drawPrompt(x, y, text, now) {
    const p = project(x, y);
    const lift = Math.sin(now / 180) * 3;
    ctx.save();
    ctx.translate(p.x, p.y + lift);
    ctx.fillStyle = "#fff5d7";
    ctx.strokeStyle = "#2f2a25";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2f2a25";
    ctx.font = "900 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 0, 1);
    ctx.restore();
  }

  function drawOffscreenArrow(target) {
    const p = project(target.x, target.y);
    const margin = 46;
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (p.x > margin && p.x < width - margin && p.y > margin && p.y < height - margin) return;

    const cx = width / 2;
    const cy = height / 2;
    const angle = Math.atan2(p.y - cy, p.x - cx);
    const x = clamp(cx + Math.cos(angle) * (width / 2 - margin), margin, width - margin);
    const y = clamp(cy + Math.sin(angle) * (height / 2 - margin), margin, height - margin);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "rgba(47, 42, 32, 0.84)";
    ctx.strokeStyle = "#fff1a8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -12);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawStairs(x, y) {
    const p = project(x, y);
    ctx.save();
    ctx.strokeStyle = "#4d3a2d";
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(p.x - 38 + i * 3, p.y + i * 8);
      ctx.lineTo(p.x + 38 + i * 3, p.y + i * 8);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSynthRack(x, y, w, h) {
    drawIsoRect(x, y, w, h, "#30343d", "#1e2228");
    const p = project(x, y);
    ctx.save();
    ctx.fillStyle = "#d48d5a";
    for (let i = 0; i < 7; i += 1) {
      ctx.fillRect(p.x - w * 0.34 + i * 13, p.y - 8, 5, 12);
    }
    ctx.restore();
  }

  function drawNewspaperStacks(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      drawIsoRect(x + i * 22, y + i * 14, 44, 26, "#d8c9a3", "#6f6250");
    }
  }

  function drawSafe(x, y) {
    const p = project(x, y);
    ctx.save();
    ctx.fillStyle = "#6d6557";
    ctx.strokeStyle = "#312d27";
    ctx.lineWidth = 3;
    roundedRect(p.x - 34, p.y - 38, 68, 64, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d8b56c";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 8, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawWorkbench(x, y) {
    drawIsoRect(x, y, 130, 60, "#8b5f3e", "#493625");
    const p = project(x, y);
    ctx.save();
    ctx.strokeStyle = "#d8c78e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x - 42, p.y - 8);
    ctx.lineTo(p.x + 38, p.y + 12);
    ctx.stroke();
    ctx.restore();
  }

  function drawDigRows(x, y) {
    const p = project(x, y);
    ctx.save();
    ctx.strokeStyle = "#513824";
    ctx.lineWidth = 5;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(p.x - 80, p.y + i * 15);
      ctx.quadraticCurveTo(p.x, p.y + i * 10 - 16, p.x + 80, p.y + i * 15);
      ctx.stroke();
    }
    ctx.fillStyle = "#c7a36a";
    ctx.fillRect(p.x + 55, p.y - 44, 8, 56);
    ctx.fillStyle = "#44413b";
    ctx.beginPath();
    ctx.ellipse(p.x + 60, p.y - 50, 13, 8, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawAppliance(x, y) {
    const p = project(x, y);
    ctx.save();
    ctx.fillStyle = "#a8b0a3";
    ctx.strokeStyle = "#4d554d";
    ctx.lineWidth = 3;
    roundedRect(p.x - 34, p.y - 34, 68, 54, 8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#6e766e";
    ctx.beginPath();
    ctx.arc(p.x, p.y - 8, 15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawDumpster(x, y) {
    const p = project(x, y);
    ctx.save();
    ctx.fillStyle = "#3e745a";
    ctx.strokeStyle = "#273f35";
    ctx.lineWidth = 3;
    roundedRect(p.x - 48, p.y - 24, 96, 46, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2e5d48";
    ctx.fillRect(p.x - 42, p.y - 32, 84, 12);
    ctx.fillStyle = "#d8c78e";
    ctx.font = "900 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FREE?", p.x, p.y + 4);
    ctx.restore();
  }

  function drawGate(x, y) {
    const p = project(x, y);
    ctx.save();
    ctx.strokeStyle = "#473b2f";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(p.x - 62, p.y - 18);
    ctx.lineTo(p.x + 62, p.y + 18);
    ctx.stroke();
    ctx.strokeStyle = "#c6b58d";
    ctx.lineWidth = 2;
    for (let i = -4; i <= 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(p.x + i * 14 - 12, p.y - 28);
      ctx.lineTo(p.x + i * 14 + 12, p.y + 28);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTrashPile(x, y) {
    const p = project(x, y);
    ctx.save();
    for (let i = 0; i < 18; i += 1) {
      ctx.fillStyle = ["#6d6254", "#8b745e", "#4f5a58", "#b49a6a"][i % 4];
      ctx.beginPath();
      ctx.ellipse(p.x - 80 + (i * 19) % 160, p.y - 22 + Math.floor(i / 8) * 24, 22, 12, i * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFactory(x, y) {
    const p = project(x, y);
    ctx.save();
    ctx.fillStyle = "#6c5b4d";
    ctx.strokeStyle = "#332d29";
    ctx.lineWidth = 3;
    roundedRect(p.x - 86, p.y - 68, 172, 95, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2f3437";
    for (let i = 0; i < 3; i += 1) {
      ctx.fillRect(p.x - 68 + i * 48, p.y - 52, 30, 24);
    }
    ctx.fillStyle = "#4d4a43";
    ctx.fillRect(p.x - 80, p.y - 112, 20, 48);
    ctx.fillRect(p.x - 48, p.y - 122, 20, 58);
    ctx.restore();
  }

  function drawJet(x, y, scale = 1) {
    const p = project(x, y);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#20262b";
    ctx.strokeStyle = "#0f1316";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 92, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-18, -8);
    ctx.lineTo(-82, -50);
    ctx.lineTo(6, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-22, 8);
    ctx.lineTo(-88, 48);
    ctx.lineTo(4, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d8c78e";
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(-35 + i * 18, -3, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEndingScene(now) {
    const rect = endingCanvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    if (!rect.width || !rect.height) return;
    endingCanvas.width = Math.floor(rect.width * dpr);
    endingCanvas.height = Math.floor(rect.height * dpr);
    endingCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;
    endingCtx.clearRect(0, 0, w, h);
    const sky = endingCtx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#6f8290");
    sky.addColorStop(0.55, "#d0a66e");
    sky.addColorStop(1, "#313a39");
    endingCtx.fillStyle = sky;
    endingCtx.fillRect(0, 0, w, h);

    endingCtx.fillStyle = "#394346";
    endingCtx.fillRect(0, h * 0.62, w, h * 0.38);
    endingCtx.strokeStyle = "rgba(255, 245, 215, 0.45)";
    endingCtx.lineWidth = 3;
    endingCtx.setLineDash([18, 18]);
    endingCtx.beginPath();
    endingCtx.moveTo(30, h * 0.78);
    endingCtx.lineTo(w - 30, h * 0.72);
    endingCtx.stroke();
    endingCtx.setLineDash([]);

    endingCtx.save();
    endingCtx.translate(w * 0.58, h * 0.52 + Math.sin(now / 360) * 2);
    endingCtx.scale(1.1, 1.1);
    endingCtx.fillStyle = "#20262b";
    endingCtx.beginPath();
    endingCtx.ellipse(0, 0, 120, 28, 0, 0, Math.PI * 2);
    endingCtx.fill();
    endingCtx.fillStyle = "#151a1e";
    endingCtx.beginPath();
    endingCtx.moveTo(-20, -12);
    endingCtx.lineTo(-110, -72);
    endingCtx.lineTo(22, -20);
    endingCtx.closePath();
    endingCtx.fill();
    endingCtx.beginPath();
    endingCtx.moveTo(-28, 12);
    endingCtx.lineTo(-118, 68);
    endingCtx.lineTo(20, 22);
    endingCtx.closePath();
    endingCtx.fill();
    endingCtx.fillStyle = "#e1c374";
    for (let i = 0; i < 6; i += 1) {
      endingCtx.beginPath();
      endingCtx.arc(-52 + i * 22, -4, 4, 0, Math.PI * 2);
      endingCtx.fill();
    }
    endingCtx.restore();

    endingCtx.save();
    endingCtx.translate(w * 0.25, h * 0.68);
    endingCtx.fillStyle = "#2f3030";
    endingCtx.fillRect(-18, -38, 36, 48);
    endingCtx.fillStyle = "#c4936d";
    endingCtx.beginPath();
    endingCtx.arc(0, -52, 15, 0, Math.PI * 2);
    endingCtx.fill();
    endingCtx.fillStyle = "#44372e";
    endingCtx.beginPath();
    endingCtx.ellipse(-15, -42, 6, 24, -0.14, 0, Math.PI * 2);
    endingCtx.ellipse(15, -42, 6, 24, 0.14, 0, Math.PI * 2);
    endingCtx.fill();
    endingCtx.fillStyle = "#d6a57c";
    endingCtx.beginPath();
    endingCtx.ellipse(0, -60, 9, 4, 0, 0, Math.PI * 2);
    endingCtx.fill();
    endingCtx.strokeStyle = "#d8c78e";
    endingCtx.lineWidth = 4;
    endingCtx.beginPath();
    endingCtx.moveTo(18, -26);
    endingCtx.lineTo(52, -14 + Math.sin(now / 220) * 4);
    endingCtx.stroke();
    endingCtx.fillStyle = "#39414b";
    endingCtx.fillRect(50, -24, 36, 22);
    endingCtx.fillStyle = "#e2b262";
    endingCtx.font = "900 9px sans-serif";
    endingCtx.fillText("ADPT", 56, -10);
    endingCtx.restore();

    endingCtx.fillStyle = "rgba(24, 20, 16, 0.64)";
    endingCtx.font = "800 14px sans-serif";
    endingCtx.fillText("Private Airfield: Escape Plan Pending Correct Adapter", 20, 28);
  }

  function roundedRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function project(x, y) {
    return {
      x: window.innerWidth / 2 + (x - camera.x),
      y: window.innerHeight / 2 + (y - camera.y) * world.projection,
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function initAudio() {
    if (audio.context || audio.disabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audio.context = new AudioContext();
      audio.master = audio.context.createGain();
      audio.master.gain.value = 0.22;
      audio.master.connect(audio.context.destination);

      audio.humGain = audio.context.createGain();
      audio.humGain.gain.value = 0.018;
      audio.humOsc = audio.context.createOscillator();
      audio.humOsc.type = "sawtooth";
      audio.humOsc.frequency.value = 52;
      audio.humOsc.connect(audio.humGain);
      audio.humGain.connect(audio.master);
      audio.humOsc.start();
    } catch (error) {
      audio.disabled = true;
    }
  }

  function playTone({ frequency, duration, type = "sine", gain = 0.06, slide = 0 }) {
    if (!audio.context || audio.disabled) return;
    const now = audio.context.currentTime;
    const osc = audio.context.createOscillator();
    const toneGain = audio.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slide) osc.frequency.linearRampToValueAtTime(frequency + slide, now + duration);
    toneGain.gain.setValueAtTime(0, now);
    toneGain.gain.linearRampToValueAtTime(gain, now + 0.015);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(toneGain);
    toneGain.connect(audio.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playPickupSound() {
    playTone({ frequency: 420, duration: 0.12, type: "triangle", gain: 0.08, slide: 140 });
  }

  function playDropSound() {
    playTone({ frequency: 160, duration: 0.18, type: "square", gain: 0.05, slide: -60 });
  }

  function playUseSound() {
    playTone({ frequency: 260, duration: 0.16, type: "triangle", gain: 0.06, slide: 80 });
  }

  function playMissionCompleteSound() {
    playTone({ frequency: 330, duration: 0.16, type: "triangle", gain: 0.08, slide: 110 });
    window.setTimeout(() => playTone({ frequency: 495, duration: 0.22, type: "triangle", gain: 0.08, slide: 80 }), 110);
  }

  function updateAudio() {
    if (!audio.context || audio.disabled || !audio.humGain) return;
    const distanceFromSynths = Math.min(420, distance(player, locations.synthAltar));
    const target = 0.012 + (1 - distanceFromSynths / 420) * 0.03;
    audio.humGain.gain.setTargetAtTime(target, audio.context.currentTime, 0.2);
  }
})();

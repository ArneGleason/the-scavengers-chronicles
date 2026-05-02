(() => {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");

  const modeLabel = document.querySelector("#modeLabel");
  const placeLabel = document.querySelector("#placeLabel");
  const missionLabel = document.querySelector("#missionLabel");
  const missionDockTitle = document.querySelector("#missionDockTitle");
  const inventoryLabel = document.querySelector("#inventoryLabel");
  const soupLabel = document.querySelector("#soupLabel");
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
  const narratorButton = document.querySelector("#narratorButton");
  const checklistOverlay = document.querySelector("#checklistOverlay");
  const checklistList = document.querySelector("#checklistList");
  const checklistClose = document.querySelector("#checklistClose");
  const checklistProgress = document.querySelector("#checklistProgress");
  const endingOverlay = document.querySelector("#endingOverlay");
  const endingClose = document.querySelector("#endingClose");
  const endingCanvas = document.querySelector("#endingCanvas");
  const endingCtx = endingCanvas.getContext("2d");
  const gameOverOverlay = document.querySelector("#gameOverOverlay");
  const gameOverClose = document.querySelector("#gameOverClose");

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
    kitchen: { x: -330, y: -86, r: 88, name: "shabby kitchen" },
    soupPot: { x: -344, y: -84, r: 58, name: "soup stove" },
    basementHoard: { x: -238, y: 145, r: 92, name: "basement hoard" },
    synthAltar: { x: -70, y: 178, r: 82, name: "synth altar" },
    basementRack: { x: -190, y: 215, r: 70, name: "rack of almost music" },
    vault: { x: 156, y: -74, r: 76, name: "rare antique vault" },
    shelfZone: { x: 18, y: -32, r: 70, name: "future shelf zone" },
    backyardDig: { x: -156, y: 430, r: 88, name: "backyard dig patch" },
    workbench: { x: -305, y: 360, r: 78, name: "basement-adjacent workbench" },
    alleyGate: { x: 60, y: 642, r: 66, name: "gated estate alley" },
    abandonedLot: { x: 280, y: 800, r: 86, name: "abandoned lot" },
    gym: { x: 368, y: 764, r: 92, name: "strip-mall gym" },
    dumpster: { x: 505, y: 944, r: 76, name: "corner-store dumpster" },
    landfill: { x: -520, y: 1190, r: 105, name: "city landfill" },
    wandaTrailer: { x: -676, y: 1112, r: 86, name: "Big Wanda's dump trailer" },
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
    ratChaseUntil: 0,
    ratChaseTarget: "",
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
    speakAndSpell: {
      name: "Antique Speak & Spell",
      shortName: "Speak & Spell",
      tag: "SAY",
      color: "#b64532",
      accent: "#f2d88a",
      useText: "It croaks one letter, judges his spelling, and makes the synthesizers feel undereducated.",
      dropText: "He sets down the Speak & Spell like a sacred oracle with leaking batteries.",
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
    finalAdapter: {
      name: "Final Adapter",
      shortName: "Final Adapter",
      tag: "END",
      color: "#d8c783",
      accent: "#2f3438",
      useText: "The final adapter fits three impossible sockets and one emotional vacancy.",
      dropText: "He drops the final adapter. The silence briefly becomes accusatory.",
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
      title: "Speak & Spell Salvage Duel",
      summary: "Distract a rival rummager and recover antique Speak & Spells from the corner-store dumpster.",
      item: "speakAndSpell",
      pickup: { x: locations.dumpster.x + 14, y: locations.dumpster.y - 8, r: locations.dumpster.r, label: "antique Speak & Spell", place: locations.dumpster.name },
      drop: { x: locations.synthAltar.x, y: locations.synthAltar.y, r: locations.synthAltar.r, label: "synth altar", place: locations.synthAltar.name },
      pickupGuide: "Go to the corner-store dumpster, lure the rival rummager away, then sprint back for the antique Speak & Spell.",
      returnGuide: "Bring the Speak & Spell to the synth altar so the masterpiece can be alphabetized before it is avoided.",
      completeGuide: "The Speak & Spell is home. It knows more songs than he has finished.",
      pickupText: "Picked up the Antique Speak & Spell. It says one busted syllable and immediately becomes essential studio gear.",
      completeText: "Mission complete: the synth altar gains a Speak & Spell and a new excuse called 'phonics integration.'",
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
      summary: "Liberate rack rails from the old factory, reveal the final adapter, and carry that terrible responsibility to the airfield.",
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
          returnGuide: "Deliver the cable bundle to the synth altar. If the final adapter exists, this is where it will make things worse.",
          pickupText: "Picked up the Mystery Cable Bundle. It wriggles with almost-solutions.",
          dropText: "Stage complete: the cable bundle joins the altar and coughs up the Final Adapter, ruining forty years of excuses.",
        },
        {
          item: "finalAdapter",
          pickup: { x: locations.synthAltar.x + 54, y: locations.synthAltar.y + 24, r: 66, label: "Final Adapter", place: locations.synthAltar.name },
          drop: { x: locations.airfield.x, y: locations.airfield.y, r: locations.airfield.r, label: "private airfield", place: locations.airfield.name },
          pickupGuide: "Pick up the Final Adapter at the synth altar. It is real, unfortunately.",
          returnGuide: "Take the Final Adapter to the private airfield. The escape plan has become mechanically specific.",
          pickupText: "Picked up the Final Adapter. He stares at it because a lifelong excuse just became cargo.",
          dropText: "Mission complete: the Final Adapter fits the jet panel. No one asks why a synth adapter starts aircraft.",
        },
      ],
      completeGuide: "The adapter is installed at the airfield. Press E near the jet to commit to this nonsense.",
      completeText: "Mission complete: the Final Adapter is installed. The jet is ready enough for someone with no visible standards.",
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
      x: 72,
      y: 612,
      speed: 66,
      target: 1,
      lastScoldAt: 0,
      gadget: "flashlight",
      path: [
        { x: 72, y: 612 },
        { x: 205, y: 705 },
        { x: 345, y: 790 },
        { x: 205, y: 855 },
      ],
    },
    {
      name: "Officer Clipboard",
      x: 465,
      y: 905,
      speed: 62,
      target: 1,
      lastScoldAt: 0,
      gadget: "clipboard",
      path: [
        { x: 465, y: 905 },
        { x: 620, y: 1035 },
        { x: 445, y: 1135 },
        { x: 125, y: 1045 },
        { x: -130, y: 1185 },
        { x: 210, y: 990 },
      ],
    },
  ];

  const rabbits = [
    { id: "rabbit-1", x: -245, y: 505, homeX: -245, homeY: 505, phase: 0.2, fleeUntil: 0, lastPanicAt: 0 },
    { id: "rabbit-2", x: 92, y: 665, homeX: 92, homeY: 665, phase: 1.9, fleeUntil: 0, lastPanicAt: 0 },
    { id: "rabbit-3", x: 385, y: 1085, homeX: 385, homeY: 1085, phase: 3.1, fleeUntil: 0, lastPanicAt: 0 },
  ];

  const birds = [
    { id: "bird-1", x: -125, y: 360, vx: 34, vy: -16, state: "flying", phase: 0.4, stunnedUntil: 0, lastCrashAt: 0 },
    { id: "bird-2", x: 545, y: 835, vx: -30, vy: 22, state: "flying", phase: 1.7, stunnedUntil: 0, lastCrashAt: 0 },
    { id: "bird-3", x: -420, y: 1220, vx: 42, vy: 12, state: "flying", phase: 2.8, stunnedUntil: 0, lastCrashAt: 0 },
  ];

  const rats = [
    { id: "rat-1", x: 560, y: 1010, homeX: 560, homeY: 1010, phase: 0.8, fleeUntil: 0, cooldownUntil: 0 },
    { id: "rat-2", x: -60, y: 1065, homeX: -60, homeY: 1065, phase: 2.2, fleeUntil: 0, cooldownUntil: 0 },
  ];

  const gymGuys = [
    { id: "gym-1", x: 285, y: 730, homeX: 285, homeY: 730, phase: 0.5, walkAwayUntil: 0, lastLaughAt: 0 },
    {
      id: "gym-2",
      x: 520,
      y: 845,
      homeX: 520,
      homeY: 845,
      phase: 1.6,
      walkAwayUntil: 0,
      lastLaughAt: 0,
      target: 1,
      routeSpeed: 48,
      path: [
        { x: 520, y: 845 },
        { x: 632, y: 980 },
        { x: 412, y: 1082 },
        { x: 238, y: 910 },
      ],
    },
  ];

  const rummager = {
    name: "Gary the Rummager",
    x: locations.dumpster.x - 34,
    y: locations.dumpster.y + 10,
    guardX: locations.dumpster.x - 34,
    guardY: locations.dumpster.y + 10,
    speed: 82,
    distractedUntil: 0,
    lastTauntAt: 0,
    lastBlockAt: 0,
    rummageTime: 0,
  };

  const bigWanda = {
    name: "Big Wanda",
    x: locations.wandaTrailer.x + 8,
    y: locations.wandaTrailer.y + 22,
    trailerX: locations.wandaTrailer.x,
    trailerY: locations.wandaTrailer.y,
    active: false,
    revealed: false,
    state: "hidden",
    speed: 112,
    target: 1,
    lastLineAt: 0,
    catchRadius: 44,
    path: [
      { x: locations.wandaTrailer.x + 18, y: locations.wandaTrailer.y + 24 },
      { x: -590, y: 1162 },
      { x: -470, y: 1215 },
      { x: -618, y: 1262 },
    ],
  };

  const areaCinematic = {
    active: false,
    startAt: 0,
    duration: 6800,
    fromX: 0,
    fromY: 0,
    targetX: locations.wandaTrailer.x + 32,
    targetY: locations.wandaTrailer.y + 40,
    line1: false,
    line2: false,
    line3: false,
  };

  const soupIngredientOptions = [
    { name: "Backyard Dandelion", shortName: "Dandelion", x: -238, y: 488, color: "#e3c545", accent: "#5f7d3f" },
    { name: "Assertive Lawn Weed", shortName: "Lawn Weed", x: -112, y: 472, color: "#8fbb4e", accent: "#415f35" },
    { name: "Fence-Line Sorrel", shortName: "Sorrel", x: -306, y: 405, color: "#9fc45e", accent: "#63483a" },
    { name: "Suspicious Yard Herb", shortName: "Yard Herb", x: -190, y: 548, color: "#6fb86c", accent: "#d8c78e" },
  ];

  const soup = {
    phase: "simmer",
    nextAt: 0,
    deadline: 0,
    ingredient: null,
    carrying: false,
    lastPullCommentAt: 0,
    ruinedUntil: 0,
    cryUntil: 0,
    cycle: 0,
    warnings: {},
  };

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
  let gameOver = false;
  let gameStartedAt = 0;
  let hairsprayGagDone = false;
  let lastGateScoldAt = 0;
  let guidanceTargetKey = "";
  let guidanceTargetStartedAt = performance.now();
  let guidanceSpokenLevel = 0;
  let lastRabbitCommentAt = 0;
  let lastRatCommentAt = 0;
  let lastBirdCrashCommentAt = 0;
  let lastGymTauntAt = 0;
  let ambientTextCooldownUntil = 0;
  const ambientTextCooldownMs = 5000;
  let lastToastChangeAt = 0;
  let pendingSayTimer = 0;

  const audio = {
    context: null,
    disabled: false,
    master: null,
    humGain: null,
    humOsc: null,
    nextHouseCreakAt: 0,
    nextSynthBurpAt: 0,
  };

  const narrator = {
    enabled: true,
    voice: null,
    lastText: "",
    lastAt: 0,
    soupWarnings: {},
    timer: 0,
    utterance: null,
    lastGestureAt: 0,
    needsGesture: false,
  };

  const quipMemory = new Map();
  const stickyQuipMemory = new Map();

  const quipPools = {
    introSkip: [
      "The intro reluctantly speeds up, like a tape deck under moral pressure.",
      "The backstory loosens its belt and waddles faster.",
      "The exposition has been asked to hurry, which it considers hostile.",
    ],
    introSkipFinal: [
      "Fine. He skims the backstory like an instruction manual for a synth he will never read.",
      "Fine. Context has been reduced to a suspicious stain and a strong opinion.",
      "Fine. The lore has been kicked into a box marked probably important.",
    ],
    start: [
      "Mission: find the DIN sync cable before another decade gets classified as preparation.",
      "First order of business: recover one cable, avoid one lifetime of follow-through.",
      "The masterpiece begins, naturally, with not making music and looking for a cord.",
    ],
    endCheat: [
      "END accepted: The Scavenger skips process and boards the escape plan with no music written.",
      "END accepted. Forty years of preparation have been compressed into one suspicious aviation decision.",
      "END accepted. The masterpiece is bypassed with the confidence of a man who fears verse two.",
    ],
    missionSelected: [
      "Active mission: {mission}. {guide}",
      "New official priority: {mission}. {guide}",
      "He has promoted {mission} from vague burden to current burden. {guide}",
    ],
    checklistComplete: [
      "Checklist updated: {title}. {complete}",
      "Optional decline documented: {title}. {complete}",
      "Self-assigned goal stamped with unnecessary seriousness: {title}. {complete}",
    ],
    gateBlocked: [
      "Route blocked: finish {count} more starter errand{plural} before escalating the mess.",
      "The shame gate declines him: complete {count} more starter errand{plural} before the landfill gets involved.",
      "Not yet. The southern route requires {count} more starter errand{plural} and a stronger alibi.",
    ],
    emptySearch: [
      "He pats nearby surfaces and finds only dust, intent, and no useful adapter.",
      "He investigates the air. The air refuses to be salvage.",
      "Nothing here but ambition, grit, and one hair stuck to his sleeve.",
      "He rummages heroically through nothing and discovers less.",
    ],
    inventoryFull: [
      "Inventory full. He briefly considers wearing a cable as a belt, then calls that phase two.",
      "Inventory full. His pockets reject the strategic vision.",
      "No room. He whispers, 'satchel expansion,' like that counts as engineering.",
      "Inventory full. One more object and the bag becomes a legal structure.",
    ],
    inventoryEmpty: [
      "Inventory empty. The Scavenger has only theories and several overdue projects.",
      "Nothing to drop. Even his cargo has abandoned the agenda.",
      "Inventory empty. He briefly tries to set down a thought, but it rolls away.",
    ],
    selectedItem: [
      "Selected {item}.",
      "{item} selected. It is now the active mistake.",
      "Hands mentally assigned to {item}.",
    ],
    genericPickup: [
      "Picked up {item}.",
      "{item} acquired with unnecessary ceremony.",
      "He adds {item} to the inventory and immediately imagines a system around it.",
    ],
    useEmpty: [
      "He has nothing to use except certainty, and that is already over-applied.",
      "Nothing equipped. He deploys confidence. It has no effect.",
      "He pats the empty satchel and finds a plan with no materials, which is basically his brand.",
    ],
    soupStart: [
      "Soup timer: forage {ingredient} from the backyard and get it into the pot before the photo opportunity dies.",
      "Soup emergency: acquire {ingredient} and return it before the pot loses its social media potential.",
      "The pot demands {ingredient}. He calls this cuisine because the yard was involved.",
      "Soup protocol activated: steal {ingredient} from nature and pretend it was a recipe.",
    ],
    soupPickup: [
      "Picked up {ingredient}. It is either garnish, medicine, or lawn evidence. Return to the soup pot.",
      "{ingredient} acquired. The soup accepts yard material without checking credentials.",
      "He pockets {ingredient}, which is either food, weed, or a warning from the soil. Back to the pot.",
      "{ingredient} secured. Somewhere, a normal kitchen quietly locks its doors.",
    ],
    soupFinish: [
      "{ingredient} added to the soup. He takes a photo no one asked for and resumes being interruptible.",
      "{ingredient} enters the pot with the confidence of unpaid garnish. Documentation can continue.",
      "Soup saved. {ingredient} has joined the broth and the group chat has been spared.",
      "The pot receives {ingredient}. He nods like a man who has advanced civilization.",
    ],
    soupRuin: [
      "The soup boils over. Photo ruined. He sobs like the group chat has lost a major work of culinary documentation.",
      "Soup failure. The pot ejects its thesis, and he mourns the unposted angle.",
      "The soup collapses into steam and shame. He cries because the lighting was almost perfect.",
      "Boil-over catastrophe. Dinner survives, but the narrative is dead.",
    ],
    soupPull: [
      "Soup compulsion intensifies. His feet begin consulting the pot without checking with you.",
      "The soup has seized partial control of the lower body.",
      "The pot emits command authority. The Scavenger's legs file immediate compliance.",
      "User input is now sharing custody with broth.",
    ],
    soupCountdown: {
      30: [
        "Soup countdown. 30 seconds. {target} would appreciate being treated like a crisis.",
        "Thirty seconds. Please redirect this man toward {target} before the soup becomes a memoir.",
      ],
      15: [
        "Fifteen seconds. {target} is now more important than dignity.",
        "Soup warning. Fifteen seconds until the pot begins publishing criticism.",
      ],
      8: [
        "Eight seconds. Run toward {target}; the broth has entered its grievance phase.",
        "Eight seconds. The soup is preparing a legal statement.",
      ],
    },
    soupGuide: {
      forage: [
        "SOUP INTERRUPT: pick {ingredient} in the backyard. {seconds} seconds before soup tragedy.",
        "SOUP INTERRUPT: backyard {ingredient}, now. {seconds} seconds until the broth writes him out of the will.",
        "SOUP INTERRUPT: recover {ingredient}. The pot has {seconds} seconds of patience and no hobbies.",
      ],
      return: [
        "SOUP INTERRUPT: return to the shabby kitchen pot. {seconds} seconds before the soup ruins its own press release.",
        "SOUP INTERRUPT: potward, immediately. {seconds} seconds before the photo becomes oral history.",
        "SOUP INTERRUPT: deliver the yard matter to the kitchen. {seconds} seconds before he calls this a setback for culture.",
      ],
      ruined: [
        "Soup status: ruined. He is grieving a photograph that never got to exist.",
        "Soup status: emotionally scalded. The group chat will never know what it missed.",
        "Soup status: lost to steam, hubris, and poor time management.",
      ],
    },
    copScold: [
      '{cop}: "Sir, why are you carrying municipal-looking trash with purpose?"',
      '{cop}: "That object has strong bylaw energy, sir."',
      '{cop}: "Please stop making the sidewalk look like an evidence table."',
      '{cop}: "Sir, the town does not recognize personal salvage sovereignty."',
    ],
    rabbitPanic: [
      "The rabbits adore him in theory, then remember the oat-milk bath incident and depart at professional speed.",
      "The rabbits see him, remember being called soup consultants, and choose distance.",
      "A rabbit clocks the satchel and immediately updates its will.",
      "The rabbits flee with the specific urgency of creatures who have heard his project pitch.",
    ],
    ratChase: [
      'The Scavenger lunges: "Come here, I wanna milk you for nutrition for my students!" The rat files for distance.',
      'He snaps toward the rat: "Tiny dairy colleague!" The rat rejects the curriculum.',
      'The rat appears. His brain announces, "field nutrition lab," and his feet become a lawsuit.',
      'He chases the rat with academic hunger. The rat declines enrollment.',
    ],
    birdBonk: [
      "A bird flies directly into him, reconsiders flight, and lies down for a brief career change.",
      "A bird hits him like nature forgot collision detection, then takes a short unpaid sabbatical.",
      "Bird impact. Feathers, regret, and one stunned silence enter the record.",
      "A bird chooses his torso as a destination and immediately questions the route.",
    ],
    rummagerTaunt: [
      'Gary the Rummager hisses, "Those talking calculators are mine." He follows just far enough to be exploitable.',
      'Gary snarls, "Back away from the educational plastic." His priorities are tragic but clear.',
      'Gary shadows him, muttering about phonics rights and dumpster jurisdiction.',
      'Gary takes the bait because nothing clouds judgment like a red toy that spells badly.',
    ],
    rummagerBlock: [
      'Gary the Rummager blocks the Speak & Spell: "Back off, phonics vulture." Lure him away, then sprint back.',
      'Gary plants himself in front of the Speak & Spell: "Find your own talking rectangle." Draw him away.',
      'Gary guards the prize with dumpster nobility. Lead him off, then double back.',
      'Gary refuses access to the alphabet. Distract the man, then rob the concept of learning.',
    ],
    gymTaunt: [
      'From a distance The Scavenger yells, "Nice sleeves, protein courthouse!" The gym guys laugh and walk away like adults.',
      'He shouts, "Enjoy your legal muscles!" The gym guys laugh, which somehow hurts more.',
      'The Scavenger calls them "cardio landlords" from a very safe distance. They laugh and leave.',
      'He yells, "Bench press a book sometime!" They laugh because they can lift both.',
    ],
    hairsprayIdle: [
      "He pauses to mist the long side hair with ancient hairspray. The top remains a negotiation.",
      "He reinforces the side curtains with aerosol hope. The bald spot remains unconvinced.",
      "A cloud of antique hairspray briefly gives the haircut zoning approval.",
      "He shellacs the long side hair like it is holding up a balcony.",
    ],
    finale: [
      "Finale: The Scavenger boards the jet. No one asks if he knows what any switch does.",
      "Finale: he enters the jet with the calm of a man who has confused adapters with training.",
      "Finale: the airfield plan becomes physical, which is unfortunate for everyone who prefers plans on paper.",
    ],
    endingClose: [
      "He remains near the airfield, reconsidering whether the masterpiece needs one more cable first.",
      "Back near the jet, he wonders if takeoff should wait for a better chair.",
      "He pauses at the airfield and considers postponing escape until the patch cables are emotionally ready.",
    ],
    bigWandaIntro: [
      "The southern route opens. Down by the landfill, a trailer door bangs like a warning made of plywood.",
      "Camera cut: the dump trailer wakes up. Something inside has smelled opportunity and old cable dust.",
      "The landfill unlocks, and so does a new municipal-scale personal problem.",
    ],
    bigWandaAdmiration: [
      'Big Wanda: "There he is, my magnificent little scrap prophet. Come let Wanda catalogue your pockets."',
      'Big Wanda: "Scavenger, you gorgeous disaster. I got a recliner, a hot plate, and room for your emotional cables."',
      'Big Wanda: "I admire a man who can look at garbage and see furniture. Get in the trailer, genius."',
    ],
    bigWandaWarning: [
      "Big Wanda now patrols the landfill. If she catches him, his day ends in decorative hubcap courtship.",
      "Avoid Big Wanda near the dump. Her affection has a catch radius and no respect for unfinished albums.",
      "New hazard: Big Wanda. Keep distance unless The Scavenger wants matching trailer towels.",
    ],
    bigWandaChase: [
      'Big Wanda calls, "Quit running, antique snack. I made soup with no identifiable base."',
      'Big Wanda: "I have a trailer, a label maker, and feelings bigger than zoning allows."',
      'Big Wanda stomps closer, promising to organize his cables by romantic significance.',
    ],
    bigWandaCaught: [
      "Big Wanda got him. The trailer door shuts. Somewhere, a wedding binder opens.",
      "Game over: The Scavenger has been romantically annexed by landfill management.",
      "Big Wanda succeeds. His future now contains decorative hubcaps and supervised rummaging.",
    ],
    bigWandaReset: [
      "He escapes the trailer with dignity damaged and shoelaces reclassified as keepsakes.",
      "The Scavenger flees Big Wanda's porch before she can laminate the relationship.",
      "He has escaped, barely. Big Wanda returns to the landfill with a measuring tape and hope.",
    ],
    guidance: {
      1: [
        'Helpful nudge: go {direction} toward {target}. The Scavenger calls this "field research" because "wandering" sounds taxable.',
        "The objective is {direction}: {target}. He has been circling it like a man testing carpet density.",
        "Small hint, enormous implication: {target} is {direction}.",
      ],
      2: [
        "Still looking? {target} remains {direction}. It has not moved; unlike his standards, it is stable.",
        "{target} continues being {direction}, about {paces} paces away, despite his commitment to avoidance.",
        "The guide would like to remind everyone that {target} is not a philosophical concept. It is {direction}.",
      ],
      3: [
        "The help system has escalated to theatre. {target} is {direction}, roughly {paces} paces away. The game is short. Help it end.",
        "Emergency clarity: {target}, {direction}, {paces} paces. Even the soup understands this route.",
        "At this point the glowing marker is basically doing community service. Go {direction} to {target}.",
      ],
    },
    navigation: {
      0: [
        "Head {direction} toward {target}, about {paces} clutter-paces away.",
        "Objective: {target}, {direction}, about {paces} clutter-paces from this very avoidable confusion.",
        "Go {direction} toward {target}. The distance is roughly {paces} paces, plus emotional resistance.",
      ],
      1: [
        "Aim {direction} toward {target}, about {paces} clutter-paces away. This is the guide being subtle, sadly.",
        "First official hint: {target} is {direction}, about {paces} paces away, glowing like an accusation.",
        "{target} is {direction}. The marker is trying to help without becoming a parent.",
      ],
      2: [
        "Still {direction}: {target}, about {paces} clutter-paces away. The glowing ring is doing emotional labour.",
        "Continue {direction} toward {target}. The guide has moved from hint to municipal signage.",
        "{target} remains {direction}. The paces are {paces}; the excuses are optional.",
      ],
      3: [
        "Follow the aggressively helpful marker {direction} to {target}; the game is very short and somehow still waiting.",
        "Maximum guidance: {target} is {direction}. The marker would point harder if physics allowed it.",
        "Go {direction} to {target}. This is no longer guidance; it is stage direction.",
      ],
    },
  };

  const discoveryRepeatLines = {
    hairspray: [
      "The hairspray can rattles with the last fumes of follicle denial.",
      "The can promises volume, control, and several environmental regrets.",
      "He weighs another blast of aerosol architecture and calls it maintenance.",
    ],
    newspaperHoard: [
      "The newspaper hoard remains searchable only by mood.",
      "The papers know every headline and absolutely no recycling schedule.",
      "A stack sighs, possibly from age, possibly from being considered research.",
    ],
    synthWall: [
      "The synth wall blinks patiently. No composition has been harmed.",
      "The synths wait for the cable that will finally make talent automatic.",
      "Several LEDs blink in a rhythm he refuses to call a song.",
    ],
    researchLog: [
      "The research log continues mistaking preparation for output.",
      "Another page explains why beginning would be premature and possibly rude.",
      "The log has more album titles than the world has asked for.",
    ],
    antiqueVault: [
      "The antique vault smells like locked cabinets and postponed taste.",
      "The antiques remain rare, dusty, and protected from the danger of being enjoyed.",
      "He nods at the vault like it contains evidence of refinement.",
    ],
    digPatch: [
      "The backyard remains one shovel away from archaeology or a utility bill.",
      "The dig patch offers dirt, roots, and the thrill of possible pipe damage.",
      "He studies the soil like it owes him furniture.",
    ],
    applianceLot: [
      "The appliance refuses to reveal whether it is furniture yet.",
      "The dead washer maintains a strong silence about becoming percussion.",
      "He circles the appliance, waiting for garbage to confess its higher purpose.",
    ],
    copBlindSpot: [
      "The blind spot remains a triumph of route planning and poor lighting.",
      "The patrol gap is still here, quietly doing more work than his planner.",
      "He respects the blind spot the way other men respect mentors.",
    ],
    landfillTotem: [
      "The landfill totem leans toward accreditation.",
      "The tower of debris continues applying for materials-library status.",
      "It is either junk or sculpture, depending on grant funding.",
    ],
    airfieldFence: [
      "The airfield fence continues not endorsing the plan.",
      "The fence remains silent, which he chooses to interpret as permission.",
      "He studies the airfield like aviation is a mood you can catch.",
    ],
  };

  const itemUseLines = {
    dinCable: [
      itemTypes.dinCable.useText,
      "He coils the DIN cable thoughtfully. The cable contains more structure than the album plan.",
      "The DIN cable is held aloft. Nothing begins, but everything feels almost justified.",
    ],
    personalityStump: [
      itemTypes.personalityStump.useText,
      "He knocks on the stump and calls the dull thud acoustic intelligence.",
      "The stump has grain, weight, and an alarming sense of entitlement.",
    ],
    speakAndSpell: [
      itemTypes.speakAndSpell.useText,
      "The Speak & Spell says one wounded syllable and immediately becomes a vocalist.",
      "He asks it to define masterpiece. It clicks, wheezes, and changes the subject.",
    ],
    rustyGrate: [
      itemTypes.rustyGrate.useText,
      "He taps the grate and hears industrial shelving begging not to happen.",
      "The grate sheds rust, which he describes as patina to anyone trapped nearby.",
    ],
    grateShelf: [
      itemTypes.grateShelf.useText,
      "The shelf has one level surface and six sharp objections.",
      "He admires the shelf like a man who has confused danger with design.",
    ],
    rackRails: [
      itemTypes.rackRails.useText,
      "The rack rails are straight enough to embarrass his filing system.",
      "He measures the rails by eye, which is how disasters get confidence.",
    ],
    cableBundle: [
      itemTypes.cableBundle.useText,
      "The bundle produces one adapter, two mysteries, and a fresh delay in the schedule.",
      "He untangles three inches and calls the day productive.",
    ],
    finalAdapter: [
      itemTypes.finalAdapter.useText,
      "The final adapter feels too real. He misses when problems were theoretical.",
      "It fits everything except his need for one more excuse.",
    ],
  };

  const itemDropLines = {
    dinCable: [itemTypes.dinCable.dropText, "The cable lands in a shape he immediately calls a workflow."],
    personalityStump: [itemTypes.personalityStump.dropText, "The stump hits the floor and becomes a room's problem."],
    speakAndSpell: [itemTypes.speakAndSpell.dropText, "The Speak & Spell lands with a plastic clack and an educational grudge."],
    rustyGrate: [itemTypes.rustyGrate.dropText, "The grate lands like a shelf threatening to become evidence."],
    grateShelf: [itemTypes.grateShelf.dropText, "He places the shelf down and waits for taste to catch up."],
    rackRails: [itemTypes.rackRails.dropText, "The rails clatter down with the dignity of stolen infrastructure."],
    cableBundle: [itemTypes.cableBundle.dropText, "The cable bundle spreads like a diagram of bad decisions."],
    finalAdapter: [itemTypes.finalAdapter.dropText, "The final adapter lands quietly, making the room feel accused."],
  };

  window.addEventListener("resize", resize);
  window.addEventListener("pointerdown", markNarratorGesture, true);
  window.addEventListener("click", markNarratorGesture, true);
  if ("speechSynthesis" in window && window.speechSynthesis.addEventListener) {
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      narrator.voice = chooseNarratorVoice();
    });
  }
  window.addEventListener("keydown", (event) => {
    markNarratorGesture();
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

    if (!gameOverOverlay.hidden) {
      if (key === "action" || key === "escape") resetFromWandaGameOver();
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
      if (key === "escape" || (key === "action" && !missionOverlay.hidden)) {
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
  narratorButton.addEventListener("click", toggleNarrator);
  endingClose.addEventListener("click", closeEndingOverlay);
  gameOverClose.addEventListener("click", resetFromWandaGameOver);

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
    activeMissionId = "";
    closeMissionBrowser();
    closeChecklist();
    clearMovementInput();
    inventory.slots = [];
    inventory.selected = 0;
    resetSoupSystem();
    expandedUnlocked = true;
    endgameReady = true;
    dayEnded = true;
    gameOver = false;
    gameOverOverlay.hidden = true;
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
    say(quip("endCheat", quipPools.endCheat), 4.8);
  }

  function handleIntroStartClick() {
    if (introReady) {
      startGame();
      return;
    }
    handleIntroImpatience();
  }

  function handleIntroImpatience() {
    initAudio();
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
      playTapeFastForwardSound();
      say(quip("introSkipFinal", quipPools.introSkipFinal), 3);
      unlockIntro({ skipped: true });
      return;
    }

    introStart.textContent = introSkipClicks === 1 ? "Nostalgia Requires Patience" : "Click Faster, Archivist";
    playPaperRustleSound();
    say(quip("introSkip", quipPools.introSkip), 2.2);
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
    initNarrator();
    gameStarted = true;
    gameStartedAt = performance.now();
    introOverlay.hidden = true;
    resetSoupSystem(gameStartedAt + 60000);
    ensureActiveMission();
    resetGuidanceTarget(performance.now());
    renderMissionBrowser();
    renderChecklist();
    playTone({ frequency: 330, duration: 0.16, type: "triangle", gain: 0.08 });
    say(quip("start", quipPools.start), 4.2);
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

  function toggleNarrator() {
    markNarratorGesture();
    if (narrator.enabled && narrator.needsGesture) {
      narrator.needsGesture = false;
      updateNarratorButton();
      unlockNarratorSpeech();
      initNarrator();
      narrate("Narrator restarted. The browser has been bribed with a direct click.", { force: true, immediate: true });
      return;
    }
    narrator.enabled = !narrator.enabled;
    updateNarratorButton();
    if (!narrator.enabled) {
      stopNarratorSpeech();
      return;
    }
    unlockNarratorSpeech();
    if (narrator.enabled) {
      initNarrator();
      narrate("Narrator online. He sounds calm because he does not have to smell the soup.", { force: true, immediate: true });
    }
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
        setActiveMission(missionId);
        closeMissionBrowser();
        playUseSound();
        say(quip("missionSelected", quipPools.missionSelected, { mission: def.title, guide: missionGuideText() }), 4);
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
      say(quip("checklistComplete", quipPools.checklistComplete, { title: goal.title, complete: goal.completeText }), 3.8);
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

    if (gameOver) {
      clearMovementInput();
      clearQueuedInputs();
      updateCamera(dt);
      updateHud(now);
      updateAudio(now);
      return;
    }

    handleInventoryShortcuts();
    updateSoup(now);
    updateAreaCinematic(now);
    updateCops(dt, now);
    updateComicNpcs(dt, now);
    updateBigWanda(dt, now);
    if (areaCinematic.active) {
      clearMovementInput();
      player.isWalking = false;
    } else {
      updatePlayer(dt, now);
    }
    maybeHairsprayGag(now);
    ensureActiveMission(now);
    updateGuidance(now);
    updateCamera(dt);
    updateHud(now);
    updateAudio(now);
    clearQueuedInputs();
  }

  function updatePlayer(dt, now) {
    const chaseRat = activeRatChase(now);
    if (chaseRat) {
      const dx = chaseRat.x - player.x;
      const dy = chaseRat.y - player.y;
      const mag = Math.hypot(dx, dy) || 1;
      const speed = player.speed * 1.72;
      player.x += (dx / mag) * speed * dt;
      player.y += (dy / mag) * speed * dt;
      player.heading = Math.atan2(dy, dx);
      player.isWalking = true;
      player.walkTime += dt * 17;
      constrainPlayer(now);
      return;
    }

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

    const soupPull = soupPullVector(now);
    dx += soupPull.x;
    dy += soupPull.y;

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
        playGateRattleSound();
        const count = 2 - completedStarterMissionCount();
        say(quip("gateBlocked", quipPools.gateBlocked, { count, plural: pluralSuffix(count) }), 3.2);
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
    if (tryHandleSoupAction()) return true;
    if (tryDeliverActiveMission()) return true;
    if (tryPickupNearbyItem()) return true;
    if (tryInspectNearbyDiscovery()) return true;
    playEmptySearchSound();
    say(quip("emptySearch", quipPools.emptySearch), 2.5);
    return false;
  }

  function tryPickupNearbyItem() {
    const item = nearestWorldItem(player, 72);
    if (!item) return false;
    if (isSpeakAndSpellGuarded(item)) {
      playRummagerBlockSound();
      if (performance.now() - rummager.lastBlockAt > 1400) {
        rummager.lastBlockAt = performance.now();
        say(quip("rummagerBlock", quipPools.rummagerBlock), 4);
      }
      return true;
    }
    if (inventory.slots.length >= inventory.capacity) {
      playBagRejectSound();
      say(quip("inventoryFull", quipPools.inventoryFull), 2.8);
      return true;
    }

    item.carried = true;
    inventory.slots.push(item.type);
    inventory.selected = inventory.slots.length - 1;
    playPickupSound(item.type);

    const relatedMission = item.missionId ? missionDefs[item.missionId] : missionForItem(item.type);
    const relatedState = relatedMission ? missionStates[relatedMission.id] : null;
    const relatedLeg = relatedMission ? currentMissionLeg(relatedMission, relatedState) : null;
    if (relatedMission && relatedState.unlocked && !relatedState.complete && relatedState.state === "pickup" && relatedLeg && relatedLeg.item === item.type) {
      relatedState.state = "return";
    }

    say(relatedMission && relatedLeg ? relatedLeg.pickupText : quip("genericPickup", quipPools.genericPickup, { item: itemTypes[item.type].name }), 3.4);
    return true;
  }

  function tryInspectNearbyDiscovery() {
    const discovery = nearestDiscovery(player, 66);
    if (!discovery) return false;
    const firstLook = !discovery.seen;
    discovery.seen = true;
    playDiscoverySound(discovery);
    say(firstLook ? `Discovered ${discovery.label}: ${discovery.text}` : discoveryRepeatText(discovery), firstLook ? 4.6 : 3.2);
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
      playMissionStepSound(leg.item);
      say(`${leg.dropText} ${missionGuideText()}`, 5.2);
      return true;
    }

    state.state = "complete";
    state.complete = true;
    playMissionCompleteSound();
    const unlocked = unlockMissions(def.unlocks || []);
    const openedExpanded = maybeUnlockExpandedRoute();
    const startedEndgame = maybeBeginEndgame();
    const autoSelected = ensureActiveMission();
    const nextMission = autoSelected ? activeMissionDef() : null;
    renderMissionBrowser();
    if (unlocked.length || openedExpanded) window.setTimeout(openMissionBrowser, openedExpanded ? 8200 : 900);
    say(`${def.completeText}${openedExpanded ? " The shame gate opens toward landfill and factory opportunities, which is how hope becomes a route." : ""}${startedEndgame ? " The private airfield is now the final objective. Go prove the escape plan is at least drawable." : ""}${nextMission ? ` Next compulsion auto-selected: ${nextMission.title}.` : ""}`, openedExpanded || startedEndgame || nextMission ? 6.4 : 5);
    return true;
  }

  function selectInventorySlot(index) {
    if (index >= inventory.capacity) return;
    inventory.selected = index;
    if (inventory.slots[index]) say(quip("selectedItem", quipPools.selectedItem, { item: itemTypes[inventory.slots[index]].name }), 1.4);
  }

  function dropSelectedItem() {
    if (!inventory.slots.length) {
      say(quip("inventoryEmpty", quipPools.inventoryEmpty), 2.4);
      return;
    }
    const selected = clamp(inventory.selected, 0, inventory.slots.length - 1);
    const type = inventory.slots.splice(selected, 1)[0];
    inventory.selected = clamp(selected, 0, Math.max(0, inventory.slots.length - 1));
    const mission = missionForItem(type);
    worldItems.push(createWorldItem(type, player.x + 24, player.y + 18, "dropped", mission ? mission.id : ""));
    playDropSound(type);
    say(itemDropText(type), 2.8);
  }

  function useSelectedItem() {
    if (!inventory.slots.length) {
      say(quip("useEmpty", quipPools.useEmpty), 2.4);
      return;
    }
    const type = inventory.slots[clamp(inventory.selected, 0, inventory.slots.length - 1)];
    const active = activeMissionDef();
    const activeLeg = currentMissionLeg(active, activeMissionState());
    if (activeLeg && type === activeLeg.item && distance(player, activeLeg.drop) <= activeLeg.drop.r) {
      tryDeliverActiveMission();
      return;
    }
    playUseSound(type);
    say(itemUseText(type), 3.4);
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

  function updateSoup(now) {
    if (!gameStarted || dayEnded) return;
    if (!soup.nextAt) resetSoupSystem(now + 60000);

    if (soup.phase === "simmer" && now >= soup.nextAt) {
      startSoupCycle(now);
      return;
    }

    if ((soup.phase === "forage" || soup.phase === "return") && now >= soup.deadline) {
      ruinSoup(now);
      return;
    }

    narrateSoupCountdown(now);

    if ((soup.phase === "forage" || soup.phase === "return") && soupTimeLeft(now) <= 14 && now - soup.lastPullCommentAt > 6800) {
      soup.lastPullCommentAt = now;
      playSoupAlarmSound();
      say(quip("soupPull", quipPools.soupPull), 3.8);
    }
  }

  function resetSoupSystem(nextAt = performance.now() + 60000) {
    soup.phase = "simmer";
    soup.nextAt = nextAt;
    soup.deadline = 0;
    soup.ingredient = null;
    soup.carrying = false;
    soup.lastPullCommentAt = 0;
    soup.ruinedUntil = 0;
    soup.warnings = {};
  }

  function startSoupCycle(now) {
    const source = soupIngredientOptions[soup.cycle % soupIngredientOptions.length];
    soup.cycle += 1;
    soup.phase = "forage";
    soup.deadline = now + 45000;
    soup.carrying = false;
    soup.ingredient = { ...source, picked: false };
    soup.lastPullCommentAt = now;
    soup.warnings = {};
    playSoupAlarmSound();
    say(quip("soupStart", quipPools.soupStart, { ingredient: source.name }), 5.2);
  }

  function tryHandleSoupAction() {
    if (soup.phase === "forage" && soup.ingredient && !soup.ingredient.picked && distance(player, soup.ingredient) < 62) {
      soup.ingredient.picked = true;
      soup.carrying = true;
      soup.phase = "return";
      soup.warnings = {};
      playSoupPickupSound();
      say(quip("soupPickup", quipPools.soupPickup, { ingredient: soup.ingredient.name }), 4.2);
      return true;
    }

    if (soup.phase === "return" && soup.carrying && distance(player, locations.soupPot) < locations.soupPot.r) {
      finishSoupCycle();
      return true;
    }

    return false;
  }

  function finishSoupCycle() {
    const name = soup.ingredient ? soup.ingredient.shortName : "yard matter";
    soup.phase = "simmer";
    soup.nextAt = performance.now() + 60000;
    soup.deadline = 0;
    soup.ingredient = null;
    soup.carrying = false;
    soup.warnings = {};
    playSoupPlopSound();
    say(quip("soupFinish", quipPools.soupFinish, { ingredient: name }), 4.4);
  }

  function ruinSoup(now) {
    soup.phase = "simmer";
    soup.nextAt = now + 60000;
    soup.deadline = 0;
    soup.ingredient = null;
    soup.carrying = false;
    soup.ruinedUntil = now + 7000;
    soup.cryUntil = now + 5200;
    soup.warnings = {};
    playSoupRuinSound();
    say(quip("soupRuin", quipPools.soupRuin), 5.2);
  }

  function soupTimeLeft(now = performance.now()) {
    if (soup.phase !== "forage" && soup.phase !== "return") return 0;
    return Math.max(0, Math.ceil((soup.deadline - now) / 1000));
  }

  function narrateSoupCountdown(now) {
    if (soup.phase !== "forage" && soup.phase !== "return") return;
    const timeLeft = soupTimeLeft(now);
    for (const threshold of [30, 15, 8]) {
      if (timeLeft <= threshold && !soup.warnings[threshold]) {
        soup.warnings[threshold] = true;
        const target = soup.phase === "forage" ? "the backyard ingredient" : "the soup pot";
        narrate(quip(`soupCountdown:${threshold}`, quipPools.soupCountdown[threshold], { target }), { force: true, rate: 1.05 });
        break;
      }
    }
  }

  function soupTarget() {
    if (soup.phase === "forage" && soup.ingredient && !soup.ingredient.picked) {
      return { x: soup.ingredient.x, y: soup.ingredient.y, label: soup.ingredient.shortName, kind: "ingredient" };
    }
    if (soup.phase === "return" && soup.carrying) {
      return { x: locations.soupPot.x, y: locations.soupPot.y, label: "Soup Pot", kind: "pot" };
    }
    return null;
  }

  function soupPullVector(now) {
    const target = soupTarget();
    if (!target) return { x: 0, y: 0 };
    const timeLeft = soupTimeLeft(now);
    if (timeLeft > 18) return { x: 0, y: 0 };

    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const mag = Math.hypot(dx, dy) || 1;
    const urgency = timeLeft <= 8 ? 1.25 : 0.62;
    return { x: (dx / mag) * urgency, y: (dy / mag) * urgency };
  }

  function updateCops(dt, now) {
    for (const cop of cops) {
      movePatrol(cop, cop.path, cop.speed, dt);

      if (distance(player, cop) < 58) {
        const awayX = player.x - cop.x;
        const awayY = player.y - cop.y;
        const awayMag = Math.hypot(awayX, awayY) || 1;
        player.panicX = awayX / awayMag;
        player.panicY = awayY / awayMag;
        player.panicUntil = Math.max(player.panicUntil, now + 650);
        if (now - cop.lastScoldAt > 2600) {
          if (sayAmbient(quip("copScold", quipPools.copScold, { cop: cop.name }), 3.2)) {
            cop.lastScoldAt = now;
            playCopScoldSound();
          }
        }
      }
    }
  }

  function updateComicNpcs(dt, now) {
    updateRabbits(dt, now);
    updateRats(dt, now);
    updateBirds(dt, now);
    updateRummager(dt, now);
    updateGymGuys(dt, now);
  }

  function updateRabbits(dt, now) {
    for (const rabbit of rabbits) {
      const dx = rabbit.x - player.x;
      const dy = rabbit.y - player.y;
      const playerDistance = Math.hypot(dx, dy) || 1;
      if (playerDistance < 126) {
        rabbit.fleeUntil = Math.max(rabbit.fleeUntil, now + 900);
        if (now - lastRabbitCommentAt > 6500) {
          if (sayAmbient(quip("rabbitPanic", quipPools.rabbitPanic), 4)) {
            lastRabbitCommentAt = now;
            rabbit.lastPanicAt = now;
            playRabbitSkitterSound();
          }
        }
      }

      if (rabbit.fleeUntil > now) {
        rabbit.x += (dx / playerDistance) * 232 * dt;
        rabbit.y += (dy / playerDistance) * 232 * dt;
      } else {
        const homeDx = rabbit.homeX + Math.sin(now / 900 + rabbit.phase) * 30 - rabbit.x;
        const homeDy = rabbit.homeY + Math.cos(now / 1100 + rabbit.phase) * 18 - rabbit.y;
        rabbit.x += homeDx * dt * 0.9;
        rabbit.y += homeDy * dt * 0.9;
      }

      rabbit.x = clamp(rabbit.x, world.minX + 30, world.maxX - 30);
      rabbit.y = clamp(rabbit.y, world.minY + 30, world.maxY - 30);
    }
  }

  function updateRats(dt, now) {
    for (const rat of rats) {
      const dx = rat.x - player.x;
      const dy = rat.y - player.y;
      const playerDistance = Math.hypot(dx, dy) || 1;
      if (playerDistance < 92 && now > rat.cooldownUntil && now > player.ratChaseUntil) {
        player.ratChaseUntil = now + 1500;
        player.ratChaseTarget = rat.id;
        rat.fleeUntil = now + 2400;
        rat.cooldownUntil = now + 11000;
        if (now - lastRatCommentAt > 5500) {
          if (sayAmbient(quip("ratChase", quipPools.ratChase), 4.4)) {
            lastRatCommentAt = now;
            playRatChaseSound();
          }
        }
      }

      if (rat.fleeUntil > now) {
        rat.x += (dx / playerDistance) * 188 * dt;
        rat.y += (dy / playerDistance) * 188 * dt;
      } else {
        rat.x += Math.sin(now / 520 + rat.phase) * 24 * dt;
        rat.y += Math.cos(now / 760 + rat.phase) * 18 * dt;
        rat.x += (rat.homeX - rat.x) * dt * 0.32;
        rat.y += (rat.homeY - rat.y) * dt * 0.32;
      }

      rat.x = clamp(rat.x, world.minX + 26, world.maxX - 26);
      rat.y = clamp(rat.y, world.minY + 26, world.maxY - 26);
    }
  }

  function updateBirds(dt, now) {
    for (const bird of birds) {
      if (bird.state === "stunned") {
        if (now > bird.stunnedUntil) {
          bird.state = "leaving";
          bird.vx = (bird.x < player.x ? -1 : 1) * (70 + Math.random() * 50);
          bird.vy = -70 - Math.random() * 45;
          playBirdFlapSound();
        }
        continue;
      }

      bird.x += bird.vx * dt;
      bird.y += bird.vy * dt;
      bird.vx += Math.sin(now / 700 + bird.phase) * 7 * dt;
      bird.vy += Math.cos(now / 820 + bird.phase) * 7 * dt;

      if (bird.x < world.minX + 40 || bird.x > world.maxX - 40) bird.vx *= -1;
      if (bird.y < world.minY + 40 || bird.y > world.maxY - 40) bird.vy *= -1;

      if (bird.state === "leaving" && now - bird.stunnedUntil > 2400) {
        bird.state = "flying";
        bird.vx *= 0.55;
        bird.vy = Math.abs(bird.vy) * 0.45;
      }

      if (bird.state === "flying" && distance(player, bird) < 34 && now - bird.lastCrashAt > 7000) {
        bird.state = "stunned";
        bird.stunnedUntil = now + 1350;
        bird.lastCrashAt = now;
        playBirdBonkSound();
        if (now - lastBirdCrashCommentAt > 5200) {
          if (sayAmbient(quip("birdBonk", quipPools.birdBonk), 3.8)) {
            lastBirdCrashCommentAt = now;
          }
        }
      }
    }
  }

  function updateRummager(dt, now) {
    const item = speakAndSpellItem();
    if (!item || item.carried || item.delivered || missionStates.dumpsterDiplomacy.complete) {
      moveToward(rummager, rummager.guardX, rummager.guardY, rummager.speed * 0.55, dt);
      return;
    }

    rummager.rummageTime += dt;
    const playerDistance = distance(player, rummager);
    const playerNearDumpster = distance(player, locations.dumpster) < 210;
    if ((playerDistance < 160 || playerNearDumpster) && distance(player, item) > 65) {
      rummager.distractedUntil = Math.max(rummager.distractedUntil, now + 3600);
      moveToward(rummager, player.x, player.y, rummager.speed, dt);
      if (now - rummager.lastTauntAt > 5200) {
        if (sayAmbient(quip("rummagerTaunt", quipPools.rummagerTaunt), 4.2)) {
          rummager.lastTauntAt = now;
          playRummagerTauntSound();
        }
      }
      return;
    }

    const returnSpeed = now < rummager.distractedUntil ? rummager.speed * 0.36 : rummager.speed * 0.72;
    moveToward(rummager, rummager.guardX, rummager.guardY, returnSpeed, dt);
  }

  function updateBigWanda(dt, now) {
    if (!bigWanda.active || dayEnded || gameOver) return;

    if (areaCinematic.active) {
      bigWanda.state = "intro";
      moveToward(bigWanda, locations.wandaTrailer.x + 58, locations.wandaTrailer.y + 42, 54, dt);
      return;
    }

    if (distance(player, bigWanda) < bigWanda.catchRadius) {
      triggerWandaGameOver();
      return;
    }

    const playerNearLandfill = player.y > world.southGateY - 40 || distance(player, locations.landfill) < 560;
    if (playerNearLandfill && distance(player, bigWanda) < 620) {
      bigWanda.state = "chase";
      moveToward(bigWanda, player.x, player.y, bigWanda.speed, dt);
      if (now - bigWanda.lastLineAt > 7600) {
        if (sayAmbient(quip("bigWandaChase", quipPools.bigWandaChase), 4.2)) {
          bigWanda.lastLineAt = now;
          playWandaSound();
        }
      }
      return;
    }

    bigWanda.state = "patrol";
    movePatrol(bigWanda, bigWanda.path, 58, dt);
  }

  function moveToward(actor, x, y, speed, dt) {
    const dx = x - actor.x;
    const dy = y - actor.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 2) return;
    actor.x += (dx / mag) * speed * dt;
    actor.y += (dy / mag) * speed * dt;
  }

  function movePatrol(actor, path, speed, dt) {
    if (!path || path.length < 2) return;
    if (actor.target === undefined) actor.target = 0;
    const target = path[actor.target] || path[0];
    const dx = target.x - actor.x;
    const dy = target.y - actor.y;
    const mag = Math.hypot(dx, dy) || 1;
    if (mag < 10) {
      actor.target = (actor.target + 1) % path.length;
      return;
    }
    actor.x += (dx / mag) * speed * dt;
    actor.y += (dy / mag) * speed * dt;
  }

  function speakAndSpellItem() {
    return worldItems.find((item) => item.type === "speakAndSpell" && !item.delivered && !item.carried) || null;
  }

  function isSpeakAndSpellGuarded(item) {
    if (!item || item.type !== "speakAndSpell") return false;
    return distance(rummager, item) < 132;
  }

  function updateGymGuys(dt, now) {
    for (const guy of gymGuys) {
      if (distance(player, guy) < 245 && now - lastGymTauntAt > 9000) {
        if (sayAmbient(quip("gymTaunt", quipPools.gymTaunt), 4.8)) {
          lastGymTauntAt = now;
          guy.walkAwayUntil = now + 3200;
          guy.lastLaughAt = now;
          for (const other of gymGuys) {
            other.walkAwayUntil = Math.max(other.walkAwayUntil, now + 2600);
            other.lastLaughAt = now;
          }
          playGymLaughSound();
        }
      }

      if (guy.walkAwayUntil > now) {
        const awayX = guy.x - player.x;
        const awayY = guy.y - player.y;
        const mag = Math.hypot(awayX, awayY) || 1;
        guy.x += (awayX / mag) * 52 * dt;
        guy.y += (awayY / mag) * 52 * dt;
      } else {
        if (guy.path) {
          movePatrol(guy, guy.path, guy.routeSpeed || 42, dt);
        } else {
          guy.x += (guy.homeX + Math.sin(now / 950 + guy.phase) * 14 - guy.x) * dt * 1.2;
          guy.y += (guy.homeY + Math.cos(now / 1040 + guy.phase) * 10 - guy.y) * dt * 1.2;
        }
      }
    }
  }

  function activeRatChase(now) {
    if (now > player.ratChaseUntil || !player.ratChaseTarget) return null;
    const rat = rats.find((candidate) => candidate.id === player.ratChaseTarget);
    if (!rat) return null;
    if (distance(player, rat) < 18) {
      player.ratChaseUntil = 0;
      player.ratChaseTarget = "";
      return null;
    }
    return rat;
  }

  function updateCamera(dt) {
    let targetX = player.x;
    let targetY = player.y;
    if (areaCinematic.active) {
      const progress = clamp((performance.now() - areaCinematic.startAt) / areaCinematic.duration, 0, 1);
      const eased = easeInOut(progress);
      targetX = lerp(areaCinematic.fromX, areaCinematic.targetX, eased);
      targetY = lerp(areaCinematic.fromY, areaCinematic.targetY, eased);
    } else if (gameOver) {
      targetX = bigWanda.x;
      targetY = bigWanda.y;
    }
    camera.x += (targetX - camera.x) * Math.min(1, dt * 4);
    camera.y += (targetY - camera.y) * Math.min(1, dt * 4);
  }

  function startBigWandaCinematic(now = performance.now()) {
    if (bigWanda.revealed) return;
    bigWanda.revealed = true;
    bigWanda.active = true;
    bigWanda.state = "intro";
    bigWanda.x = locations.wandaTrailer.x + 8;
    bigWanda.y = locations.wandaTrailer.y + 22;
    bigWanda.target = 1;
    bigWanda.lastLineAt = 0;

    areaCinematic.active = true;
    areaCinematic.startAt = now + 500;
    areaCinematic.fromX = camera.x;
    areaCinematic.fromY = camera.y;
    areaCinematic.targetX = locations.wandaTrailer.x + 24;
    areaCinematic.targetY = locations.wandaTrailer.y + 62;
    areaCinematic.line1 = false;
    areaCinematic.line2 = false;
    areaCinematic.line3 = false;

    closeMissionBrowser();
    closeChecklist();
    clearMovementInput();
    playGateRattleSound();
  }

  function updateAreaCinematic(now) {
    if (!areaCinematic.active) return;
    const elapsed = now - areaCinematic.startAt;
    if (elapsed < 0) return;

    if (!areaCinematic.line1 && elapsed > 650) {
      areaCinematic.line1 = true;
      playGateRattleSound();
      say(quip("bigWandaIntro", quipPools.bigWandaIntro), 4.2);
    }

    if (!areaCinematic.line2 && elapsed > 2850) {
      areaCinematic.line2 = true;
      playWandaSound();
      say(quip("bigWandaAdmiration", quipPools.bigWandaAdmiration), 5.2);
    }

    if (!areaCinematic.line3 && elapsed > 5450) {
      areaCinematic.line3 = true;
      playGuidanceNudgeSound(3);
      say(quip("bigWandaWarning", quipPools.bigWandaWarning), 4.8);
    }

    if (elapsed > areaCinematic.duration) {
      areaCinematic.active = false;
      bigWanda.state = "patrol";
      protectTextFocus();
    }
  }

  function updateHud(now) {
    const active = activeMissionDef();
    modeLabel.textContent = gameOver ? "Trailered" : areaCinematic.active ? "Landfill Cutaway" : bigWanda.active && !dayEnded ? "Wanda Alert" : endgameReady && !dayEnded ? "Airfield Plan" : "Scavenging";
    placeLabel.textContent = placeName();
    missionLabel.textContent = active ? active.title : endgameReady ? "Private Airfield Escape" : "No active mission";
    missionDockTitle.textContent = active ? active.title : endgameReady ? "Private Airfield Escape" : "Errands Complete";
    guideLabel.textContent = currentGuideText(now);
    soupLabel.textContent = soupHudText(now);
    inventoryLabel.textContent = inventory.slots.length
      ? inventory.slots.map((type, index) => `${index === inventory.selected ? ">" : ""}${itemTypes[type].shortName}`).join(" / ")
      : "Empty";

    if (toast.hidden && toastUntil > now) toast.hidden = false;
    if (!toast.hidden && toastUntil <= now) toast.hidden = true;
  }

  function maybeHairsprayGag(now) {
    if (hairsprayGagDone || !gameStartedAt || now - gameStartedAt < 22000) return;
    if (sayAmbient(quip("hairsprayIdle", quipPools.hairsprayIdle), 3.6)) {
      hairsprayGagDone = true;
      playHairspraySound();
    }
  }

  function quip(key, lines, values = {}) {
    const pool = Array.isArray(lines) ? lines.filter(Boolean) : [lines].filter(Boolean);
    if (!pool.length) return "";
    const last = quipMemory.get(key);
    const candidates = pool.length > 1 ? pool.filter((line) => line !== last) : pool;
    const choice = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
    quipMemory.set(key, choice);
    return formatQuip(choice, values);
  }

  function stickyQuip(key, lines, values = {}) {
    const pool = Array.isArray(lines) ? lines.filter(Boolean) : [lines].filter(Boolean);
    if (!pool.length) return "";
    let choice = stickyQuipMemory.get(key);
    if (!choice || !pool.includes(choice)) {
      const last = quipMemory.get(key);
      const candidates = pool.length > 1 ? pool.filter((line) => line !== last) : pool;
      choice = candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
      stickyQuipMemory.set(key, choice);
      quipMemory.set(key, choice);
    }
    return formatQuip(choice, values);
  }

  function formatQuip(template, values = {}) {
    return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
  }

  function pluralSuffix(count) {
    return count === 1 ? "" : "s";
  }

  function itemUseText(type) {
    return quip(`item-use:${type}`, itemUseLines[type] || [itemTypes[type].useText]);
  }

  function itemDropText(type) {
    return quip(`item-drop:${type}`, itemDropLines[type] || [itemTypes[type].dropText]);
  }

  function discoveryRepeatText(discovery) {
    return quip(`discovery-repeat:${discovery.id}`, discoveryRepeatLines[discovery.id] || [discovery.repeatText]);
  }

  function say(text, duration = 3, options = {}) {
    const now = performance.now();
    const gap = options.noGap ? 0 : 250;
    const activeDifferentToast = !toast.hidden && toastUntil > now && toast.textContent !== String(text);
    const tooSoonAfterChange = now - lastToastChangeAt < gap;
    if (gap && (activeDifferentToast || tooSoonAfterChange)) {
      window.clearTimeout(pendingSayTimer);
      toast.hidden = true;
      toastUntil = now + gap;
      pendingSayTimer = window.setTimeout(() => {
        showSay(text, duration, options);
      }, gap);
      return;
    }
    showSay(text, duration, options);
  }

  function showSay(text, duration = 3, options = {}) {
    const now = performance.now();
    window.clearTimeout(pendingSayTimer);
    toast.textContent = text;
    toast.hidden = false;
    toastUntil = now + duration * 1000;
    lastToastChangeAt = now;
    if (!options.skipAmbientCooldown) protectTextFocus(now);
    narrate(text);
  }

  function sayAmbient(text, duration = 3) {
    const now = performance.now();
    if (now < ambientTextCooldownUntil || toastUntil > now) return false;
    say(text, duration);
    return true;
  }

  function protectTextFocus(now = performance.now(), cooldown = ambientTextCooldownMs) {
    ambientTextCooldownUntil = Math.max(ambientTextCooldownUntil, now + cooldown);
  }

  function initNarrator() {
    if (!supportsNarratorSpeech()) {
      narrator.enabled = false;
      updateNarratorButton("Unavailable");
      return;
    }
    narrator.voice = chooseNarratorVoice();
    updateNarratorButton();
    unlockNarratorSpeech();
  }

  function chooseNarratorVoice() {
    if (!supportsNarratorSpeech()) return null;
    const voices = window.speechSynthesis.getVoices();
    const preferred = [
      "Samantha",
      "Google US English",
      "Microsoft Jenny",
      "Alex",
      "Daniel",
      "Karen",
    ];
    for (const name of preferred) {
      const match = voices.find((voice) => voice.name.includes(name));
      if (match) return match;
    }
    return voices.find((voice) => /^en[-_]/i.test(voice.lang)) || voices[0] || null;
  }

  function narrate(text, options = {}) {
    if (!narrator.enabled || !supportsNarratorSpeech()) return;
    const now = performance.now();
    const clean = narrationText(text);
    if (!clean) return;
    if (!options.force && clean === narrator.lastText && now - narrator.lastAt < 6000) return;
    narrator.lastText = clean;
    narrator.lastAt = now;
    if (!options.skipAmbientCooldown) protectTextFocus(now);
    window.clearTimeout(narrator.timer);
    const freshGesture = now - narrator.lastGestureAt < 900;
    const delay = options.immediate || options.force || freshGesture ? 0 : 180;
    if (!delay) {
      speakNarration(clean, options);
      return;
    }
    narrator.timer = window.setTimeout(() => {
      speakNarration(clean, options);
    }, delay);
  }

  function speakNarration(text, options = {}) {
    if (!narrator.enabled || !supportsNarratorSpeech()) return;
    unlockNarratorSpeech();
    const synth = window.speechSynthesis;
    const utterance = new window.SpeechSynthesisUtterance(text);
    narrator.utterance = utterance;
    if (!narrator.voice) narrator.voice = chooseNarratorVoice();
    if (narrator.voice) utterance.voice = narrator.voice;
    utterance.rate = options.rate || 1.02;
    utterance.pitch = options.pitch || 0.96;
    utterance.volume = options.volume || 0.82;
    utterance.onend = () => {
      if (narrator.utterance === utterance) narrator.utterance = null;
    };
    utterance.onerror = (event) => {
      if (narrator.utterance === utterance) narrator.utterance = null;
      const error = event && event.error ? event.error : "";
      if (!narrator.enabled || error === "canceled" || error === "interrupted") return;
      narrator.needsGesture = true;
      updateNarratorButton("Click");
    };

    const wasBusy = synth.speaking || synth.pending;
    if (wasBusy) synth.cancel();
    window.setTimeout(() => {
      if (!narrator.enabled) return;
      unlockNarratorSpeech();
      synth.speak(utterance);
      updateNarratorButton();
    }, wasBusy ? 90 : 0);
  }

  function stopNarratorSpeech() {
    window.clearTimeout(narrator.timer);
    narrator.utterance = null;
    if (supportsNarratorSpeech()) window.speechSynthesis.cancel();
    updateNarratorButton();
  }

  function unlockNarratorSpeech() {
    if (!supportsNarratorSpeech()) return;
    window.speechSynthesis.resume();
  }

  function markNarratorGesture() {
    narrator.lastGestureAt = performance.now();
  }

  function supportsNarratorSpeech() {
    return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  function updateNarratorButton(status = "") {
    if (!supportsNarratorSpeech()) {
      narratorButton.textContent = "Narrator: Off";
      narratorButton.title = "This browser does not expose text-to-speech.";
      return;
    }
    narratorButton.textContent = status ? `Narrator: ${status}` : `Narrator: ${narrator.enabled ? "On" : "Off"}`;
    narratorButton.title = narrator.enabled
      ? (narrator.needsGesture ? "Browser speech wants a direct click. Click to restart the narrator." : "Narrator is on. Click to silence the judgment.")
      : "Narrator is off. Click to restore spoken judgment.";
  }

  function narrationText(text) {
    return String(text)
      .replace(/\bSOUP INTERRUPT:\s*/g, "Soup interrupt. ")
      .replace(/\bE\b/g, "interact")
      .replace(/["]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 260);
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

  function currentGuideText(now = performance.now()) {
    if (!gameStarted) return "Read the intro";
    const context = nearbyInteractionGuide();
    const wandaText = wandaGuideText();
    const soupText = soupGuideText(now);
    const missionText = missionGuideText();
    const navText = navigationGuideText(targetInfo(), now);
    return [context, wandaText, soupText, missionText, navText].filter(Boolean).join(" ");
  }

  function wandaGuideText() {
    if (gameOver) return "Big Wanda got him. Press E or click Flee The Trailer to try escaping again.";
    if (areaCinematic.active) return "Landfill cutaway in progress: Big Wanda is entering the relationship without a permit.";
    if (!bigWanda.active || dayEnded) return "";
    const wandaDistance = distance(player, bigWanda);
    if (wandaDistance < 180) return "BIG WANDA ALERT: run. She is close enough to start discussing curtains.";
    if (player.y > world.southGateY - 40 && wandaDistance < 520) return "Big Wanda patrols the landfill route. Keep moving and do not accept trailer hospitality.";
    return "";
  }

  function soupHudText(now = performance.now()) {
    if (!gameStarted) return "Simmering";
    if (soup.phase === "forage") return `Forage ${soupTimeLeft(now)}s`;
    if (soup.phase === "return") return `Pot ${soupTimeLeft(now)}s`;
    if (soup.ruinedUntil > now) return "Ruined, emotionally";
    const wait = Math.max(0, Math.ceil((soup.nextAt - now) / 1000));
    return `Simmer ${wait}s`;
  }

  function soupGuideText(now = performance.now()) {
    if (soup.phase === "forage" && soup.ingredient) {
      return stickyQuip(`soupGuide:forage:${soup.cycle}:${soup.ingredient.shortName}`, quipPools.soupGuide.forage, { ingredient: soup.ingredient.name, seconds: soupTimeLeft(now) });
    }
    if (soup.phase === "return") {
      return stickyQuip(`soupGuide:return:${soup.cycle}`, quipPools.soupGuide.return, { seconds: soupTimeLeft(now) });
    }
    if (soup.ruinedUntil > now) return stickyQuip(`soupGuide:ruined:${Math.floor(soup.ruinedUntil / 1000)}`, quipPools.soupGuide.ruined);
    return "";
  }

  function updateGuidance(now) {
    const target = targetInfo();
    const key = target ? target.key : "";
    if (key !== guidanceTargetKey) {
      guidanceTargetKey = key;
      guidanceTargetStartedAt = now;
      guidanceSpokenLevel = 0;
      return;
    }

    if (!target || dayEnded) return;
    const targetDistance = distance(player, target);
    if (targetDistance < 110) return;

    const level = guidanceLevel(now);
    if (level > guidanceSpokenLevel) {
      guidanceSpokenLevel = level;
      say(guidanceSnideText(target, level), 3.5 + level * 0.6);
      playGuidanceNudgeSound(level);
    }
  }

  function resetGuidanceTarget(now = performance.now()) {
    guidanceTargetKey = "";
    guidanceTargetStartedAt = now;
    guidanceSpokenLevel = 0;
  }

  function guidanceLevel(now = performance.now()) {
    if (!guidanceTargetKey) return 0;
    const elapsed = now - guidanceTargetStartedAt;
    if (elapsed > 42000) return 3;
    if (elapsed > 26000) return 2;
    if (elapsed > 12000) return 1;
    return 0;
  }

  function navigationGuideText(target, now = performance.now()) {
    if (!target) return "";
    const targetDistance = distance(player, target);
    if (targetDistance < 95) return "";

    const direction = compassDirection(target.x - player.x, target.y - player.y);
    const paces = Math.max(10, Math.round(targetDistance / 10) * 10);
    const level = guidanceLevel(now);
    const navLevel = Math.min(3, level);
    return stickyQuip(`navigation:${target.key}:${navLevel}`, quipPools.navigation[navLevel], { direction, paces, target: target.label });
  }

  function guidanceSnideText(target, level) {
    const direction = compassDirection(target.x - player.x, target.y - player.y);
    const paces = Math.max(10, Math.round(distance(player, target) / 10) * 10);
    const guideLevel = Math.min(3, Math.max(1, level));
    return quip(`guidance:${target.key}:${guideLevel}`, quipPools.guidance[guideLevel], { direction, paces, target: target.label });
  }

  function compassDirection(dx, dy) {
    const vertical = Math.abs(dy) > 35 ? (dy < 0 ? "north" : "south") : "";
    const horizontal = Math.abs(dx) > 35 ? (dx < 0 ? "west" : "east") : "";
    if (vertical && horizontal) return `${vertical}${horizontal}`;
    return vertical || horizontal || "right here";
  }

  function nearbyInteractionGuide() {
    if (soup.phase === "forage" && soup.ingredient && !soup.ingredient.picked && distance(player, soup.ingredient) < 62) return `Soup ingredient nearby: press E to pick ${soup.ingredient.name}.`;
    if (soup.phase === "return" && soup.carrying && distance(player, locations.soupPot) < locations.soupPot.r) return "The soup pot is right here. Press E to add the backyard evidence.";
    if (endgameReady && !dayEnded && distance(player, locations.airfield) < locations.airfield.r) return "The jet is right here. Press E to board the escape plan.";
    if (!expandedUnlocked && player.y > world.southGateY - 80) return `Route blocked: finish ${2 - completedStarterMissionCount()} more starter errand${2 - completedStarterMissionCount() === 1 ? "" : "s"} to open landfill and factory scavenging.`;
    if (canDeliverActiveMission()) return "Drop-off is right here.";
    const item = nearestWorldItem(player, 72);
    if (isSpeakAndSpellGuarded(item)) return "Gary is guarding the Speak & Spell. Lead him away from the dumpster, then double back.";
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

  function setActiveMission(missionId, options = {}) {
    if (!missionId || !missionDefs[missionId]) return false;
    const state = missionStates[missionId];
    if (!state || !state.unlocked || state.complete) return false;
    if (missionId === activeMissionId) return false;
    activeMissionId = missionId;
    resetGuidanceTarget(options.now || performance.now());
    return true;
  }

  function findNextAvailableMission() {
    return allMissionIds.find((id) => {
      const state = missionStates[id];
      return state.unlocked && !state.complete;
    }) || "";
  }

  function ensureActiveMission(now = performance.now()) {
    if (!gameStarted || endgameReady) return false;
    const activeState = activeMissionState();
    if (activeMissionId && activeState && activeState.unlocked && !activeState.complete) return false;
    const nextMissionId = findNextAvailableMission();
    return nextMissionId ? setActiveMission(nextMissionId, { now }) : false;
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
    startBigWandaCinematic(performance.now());
    return true;
  }

  function maybeBeginEndgame() {
    if (endgameReady || !allMissionIds.every((id) => missionStates[id].complete)) return false;
    endgameReady = true;
    activeMissionId = "";
    resetGuidanceTarget(performance.now());
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
    playJetAttemptSound();
    showEndingOverlay();
    say(quip("finale", quipPools.finale), 5);
  }

  function triggerWandaGameOver() {
    if (gameOver || dayEnded) return;
    gameOver = true;
    areaCinematic.active = false;
    closeMissionBrowser();
    closeChecklist();
    clearMovementInput();
    bigWanda.state = "caught";
    player.x = bigWanda.x + 18;
    player.y = bigWanda.y + 12;
    playWandaCatchSound();
    gameOverOverlay.hidden = false;
    gameOverClose.focus();
    say(quip("bigWandaCaught", quipPools.bigWandaCaught), 5.4);
  }

  function resetFromWandaGameOver() {
    gameOver = false;
    gameOverOverlay.hidden = true;
    bigWanda.active = true;
    bigWanda.state = "patrol";
    bigWanda.x = locations.wandaTrailer.x + 18;
    bigWanda.y = locations.wandaTrailer.y + 24;
    bigWanda.target = 1;
    player.x = 118;
    player.y = world.southGateY - 64;
    player.panicUntil = 0;
    player.ratChaseUntil = 0;
    player.ratChaseTarget = "";
    clearMovementInput();
    resetGuidanceTarget(performance.now());
    say(quip("bigWandaReset", quipPools.bigWandaReset), 4.2);
  }

  function showEndingOverlay() {
    endingOverlay.hidden = false;
    endingClose.focus();
  }

  function closeEndingOverlay() {
    endingOverlay.hidden = true;
    say(quip("endingClose", quipPools.endingClose), 3.4);
  }

  function targetInfo() {
    if (endgameReady && !dayEnded) {
      return { x: locations.airfield.x, y: locations.airfield.y, label: "Jet", key: "endgame:airfield" };
    }

    const def = activeMissionDef();
    const state = activeMissionState();
    const leg = currentMissionLeg(def, state);
    if (!def || !state || !leg || state.complete) return null;
    if (state.state === "return") {
      if (!hasItem(leg.item)) {
        const dropped = worldItems.find((item) => item.type === leg.item && !item.carried && !item.delivered);
        if (dropped) return { x: dropped.x, y: dropped.y, label: itemTypes[leg.item].shortName, key: `${def.id}:retrieve:${leg.item}:${Math.round(dropped.x)}:${Math.round(dropped.y)}` };
      }
      return { x: leg.drop.x, y: leg.drop.y, label: leg.drop.label, key: `${def.id}:drop:${state.legIndex || 0}` };
    }
    return { x: leg.pickup.x, y: leg.pickup.y, label: leg.pickup.label, key: `${def.id}:pickup:${state.legIndex || 0}` };
  }

  function draw(now) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    ctx.clearRect(0, 0, width, height);

    drawBackground(width, height);
    drawWorld(now);
    drawTarget(now);
    drawSoupTarget(now);
    drawPrompts(now);
    drawDusk(width, height);
    drawCinematicOverlay(width, height, now);
  }

  function drawBackground(width, height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#88b0a4");
    gradient.addColorStop(0.55, "#788f68");
    gradient.addColorStop(1, "#5f735d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function drawCinematicOverlay(width, height, now) {
    if (!areaCinematic.active) return;
    const pulse = 0.5 + Math.sin(now / 220) * 0.5;
    ctx.save();
    ctx.fillStyle = "rgba(18, 18, 16, 0.72)";
    ctx.fillRect(0, 0, width, 58);
    ctx.fillRect(0, height - 58, width, 58);
    ctx.fillStyle = `rgba(255, 213, 125, ${0.62 + pulse * 0.2})`;
    ctx.font = "900 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LANDFILL ROUTE OPEN", width / 2, height - 24);
    ctx.restore();
  }

  function drawWorld(now) {
    drawGroundPatches();
    drawRoads();
    drawEstate(now);
    drawBackyard();
    drawNeighbourhood();
    drawExpandedZones();
    drawAirfield();
    for (const discovery of discoveries) drawDiscovery(discovery, now);
    drawSoupIngredient(now);
    for (const item of worldItems) {
      if (!item.carried && !item.delivered) drawItem(item, now);
    }
    for (const rabbit of rabbits) drawRabbit(rabbit, now);
    for (const rat of rats) drawRat(rat, now);
    for (const guy of gymGuys) drawGymGuy(guy, now);
    drawRummager(rummager, now);
    drawBigWanda(now);
    for (const cop of cops) drawCop(cop, now);
    drawScavenger(now);
    for (const bird of birds) drawBird(bird, now);
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

  function drawEstate(now) {
    drawIsoRect(-120, -64, 520, 330, "#b99570", "#6a4c3d");
    drawIsoRect(-258, 128, 230, 180, "#6c5d52", "#493e38");
    drawIsoRect(-62, 156, 220, 175, "#595f58", "#3e4540");
    drawIsoRect(144, -68, 180, 160, "#7b6552", "#4c3d34");
    drawIsoRect(-110, -80, 250, 150, "#c38b63", "#6d4434");
    drawFloorLines(-110, -80, 250, 150, "rgba(94, 57, 39, 0.24)", 24);
    drawFloorLines(-258, 128, 230, 180, "rgba(35, 30, 27, 0.2)", 22);
    drawFloorLines(-62, 156, 220, 175, "rgba(28, 36, 32, 0.28)", 20);
    drawFloorLines(144, -68, 180, 160, "rgba(46, 37, 31, 0.22)", 24);
    drawStairs(-150, 62);

    drawKitchen(locations.kitchen.x, locations.kitchen.y, now);
    drawRug(-110, -86, 118, 72, "#8a4f45", "#e0b36a");
    drawSofa(-108, -105);
    drawCoffeeTable(-58, -46);
    drawLamp(-8, -118);
    drawSynthRack(-115, 205, 140, 46);
    drawSynthRack(-242, 142, 120, 42);
    drawCableCoil(-42, 204, 22, "#d8c783");
    drawCableCoil(-172, 248, 18, "#d48d5a");
    drawNewspaperStacks(-326, 80, 5);
    drawNewspaperStacks(-268, 58, 3);
    drawSafe(154, -70);
    drawShelf(185, -112);
    drawCrate(114, -6, "#8a5b38");
    drawWorkbench(locations.workbench.x, locations.workbench.y);
    drawWorldLabel(-110, -183, "Retro estate");
    drawWorldLabel(-190, 256, "Basement synth hoard");
    drawWorldLabel(156, -168, "Antique vault");
  }

  function drawBackyard() {
    drawIsoRect(-158, 430, 270, 170, "#806143", "#5a432f");
    drawFenceLine(-315, 350, -2, 555, 12);
    drawShrubs(-26, 382, 6);
    drawDigRows(-160, 430);
    drawStump(-92, 510, 0.82);
    drawCrate(-246, 378, "#6b4d35");
    drawWorldLabel(-150, 332, "Backyard dig");
  }

  function drawNeighbourhood() {
    drawIsoRect(520, 872, 220, 145, "#a56e4d", "#5b3c32");
    drawIsoRect(266, 802, 240, 160, "#6e745d", "#525845");
    drawGym(locations.gym.x, locations.gym.y);
    drawFloorLines(266, 802, 240, 160, "rgba(43, 48, 39, 0.24)", 28);
    drawAppliance(300, 802);
    drawDumpster(locations.dumpster.x, locations.dumpster.y);
    drawCrate(422, 912, "#816247");
    drawCrate(585, 890, "#6e5947");
    drawGate(72, 644);
    drawShrubs(120, 622, 5);
    drawWorldLabel(246, 700, "Gated estate alley");
    drawWorldLabel(locations.gym.x, locations.gym.y - 100, "Strip-mall gym");
    drawWorldLabel(508, 848, "Corner-store dumpster");
  }

  function drawExpandedZones() {
    const alpha = expandedUnlocked ? 1 : 0.45;
    ctx.save();
    ctx.globalAlpha = alpha;
    drawIsoRect(locations.landfill.x, locations.landfill.y, 320, 220, "#76695b", "#504943");
    drawWandaTrailer(locations.wandaTrailer.x, locations.wandaTrailer.y);
    drawTrashPile(-540, 1180);
    drawAppliance(-440, 1238);
    drawStump(-610, 1128, 0.65);
    drawIsoRect(locations.factory.x, locations.factory.y, 280, 190, "#5a5850", "#3d3d39");
    drawFactory(-150, 1350);
    drawCableCoil(-54, 1372, 20, "#7e8991");
    drawWorldLabel(-520, 1058, expandedUnlocked ? "City landfill" : "Locked landfill route");
    drawWorldLabel(locations.wandaTrailer.x, locations.wandaTrailer.y - 96, expandedUnlocked ? "Big Wanda's trailer" : "Suspicious trailer");
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
    drawFenceLine(314, -312, 740, -310, 12);
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
    const level = guidanceLevel(now);
    if (level > 0) drawGuideBreadcrumbs(target, now, level);
    ctx.save();
    ctx.strokeStyle = level >= 2 ? "#ffd36d" : "#fff1a8";
    ctx.lineWidth = 3 + level;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 46 + pulse + level * 10, 23 + pulse * 0.4 + level * 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(47, 42, 32, 0.82)";
    ctx.font = "800 11px sans-serif";
    const label = level >= 2 ? `THIS WAY: ${target.label}` : target.label;
    const labelWidth = Math.min(190, Math.max(96, ctx.measureText(label.toUpperCase()).width + 18));
    roundedRect(p.x - labelWidth / 2, p.y - 58, labelWidth, 24, 7);
    ctx.fill();
    ctx.fillStyle = "#fff5d7";
    ctx.textAlign = "center";
    ctx.fillText(label.toUpperCase(), p.x, p.y - 42);
    ctx.restore();
    drawOffscreenArrow(target, level);
  }

  function drawGuideBreadcrumbs(target, now, level) {
    const start = project(player.x, player.y);
    const end = project(target.x, target.y);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (length < 110) return;

    const ux = dx / length;
    const uy = dy / length;
    const angle = Math.atan2(uy, ux);
    ctx.save();
    ctx.strokeStyle = level >= 3 ? "rgba(255, 211, 109, 0.8)" : "rgba(255, 241, 168, 0.54)";
    ctx.lineWidth = 2 + level;
    ctx.setLineDash([10, 18]);
    ctx.beginPath();
    ctx.moveTo(start.x + ux * 34, start.y + uy * 34);
    ctx.lineTo(end.x - ux * 48, end.y - uy * 48);
    ctx.stroke();
    ctx.setLineDash([]);

    const arrowCount = Math.min(7, Math.max(2, Math.floor(length / 145)));
    for (let i = 1; i <= arrowCount; i += 1) {
      const t = (i / (arrowCount + 1) + (now % 1200) / 1200 / (arrowCount + 1)) % 1;
      const x = start.x + dx * t;
      const y = start.y + dy * t;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = level >= 3 ? "rgba(255, 211, 109, 0.92)" : "rgba(255, 245, 215, 0.76)";
      ctx.beginPath();
      ctx.moveTo(13 + level * 2, 0);
      ctx.lineTo(-8, -7 - level);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, 7 + level);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawSoupTarget(now) {
    const target = soupTarget();
    if (!target) return;
    const p = project(target.x, target.y);
    const timeLeft = soupTimeLeft(now);
    const urgent = timeLeft <= 18;
    const pulse = Math.sin(now / 130) * (urgent ? 7 : 3);
    ctx.save();
    ctx.strokeStyle = urgent ? "#ff8f57" : "#ffd36d";
    ctx.lineWidth = urgent ? 5 : 3;
    ctx.setLineDash(urgent ? [5, 5] : [10, 8]);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 38 + pulse, 19 + pulse * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = urgent ? "rgba(92, 45, 32, 0.88)" : "rgba(47, 42, 32, 0.84)";
    const label = `${target.kind === "pot" ? "SOUP POT" : "SOUP WEED"} ${timeLeft}s`;
    ctx.font = "900 10px sans-serif";
    const labelWidth = Math.max(98, ctx.measureText(label).width + 18);
    roundedRect(p.x - labelWidth / 2, p.y - 54, labelWidth, 23, 7);
    ctx.fill();
    ctx.fillStyle = "#fff5d7";
    ctx.textAlign = "center";
    ctx.fillText(label, p.x, p.y - 39);
    ctx.restore();

    if (urgent) drawSoupOffscreenArrow(target, now);
  }

  function drawSoupOffscreenArrow(target, now) {
    const p = project(target.x, target.y);
    const margin = 58;
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
    ctx.fillStyle = "rgba(92, 45, 32, 0.88)";
    ctx.strokeStyle = "#ffbe63";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(24 + Math.sin(now / 120) * 3, 0);
    ctx.lineTo(-12, -14);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-12, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawPrompts(now) {
    const soupAction = soupTarget();
    if (soupAction && distance(player, soupAction) < 66) {
      drawPrompt(soupAction.x, soupAction.y - 48, "E", now);
      return;
    }

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
    const step = Math.sin(player.walkTime * Math.PI * 2);
    const bob = player.isWalking ? Math.abs(step) * -2.2 : Math.sin(now / 680) * 0.5;
    const stride = player.isWalking ? step : Math.sin(now / 820) * 0.12;
    const dirX = Math.cos(player.heading);
    const dirY = Math.sin(player.heading);
    const facing = dirX < -0.12 ? -1 : 1;
    const front = dirY > -0.35;
    const back = dirY < -0.65;
    const panic = player.panicUntil > now || player.ratChaseUntil > now;
    const armSwing = player.isWalking ? Math.sin(player.walkTime * Math.PI * 2 + Math.PI) * 6 : Math.sin(now / 520) * 1.2;
    const coatSwing = player.isWalking ? Math.sin(player.walkTime * Math.PI * 2) * 2.5 : 0;

    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.scale(facing, 1);
    const localDirX = Math.abs(dirX);

    drawCutoutShadow(21, 7, 18 - bob * 0.4, 0.28);
    drawCutoutLimb(-7, 15, -12 - stride * 6, 31, 6, "#25282a", "#141414");
    drawCutoutLimb(7, 15, 13 + stride * 6, 31, 6, "#323333", "#171717");
    drawCutoutShoe(-13 - stride * 6, 32, -1, "#1b1917");
    drawCutoutShoe(14 + stride * 6, 32, 1, "#24211e");

    drawCutoutLimb(-13, -1, -24 - armSwing * 0.45, 10 + armSwing, 5.5, "#c4936d", "#81563e");
    drawCutoutLimb(13, -1, 24 + armSwing * 0.45, 10 - armSwing, 5.5, "#d0a079", "#80573f");
    drawCutoutJoint(-25 - armSwing * 0.45, 10 + armSwing, 3.5, "#c4936d", "#7d523b");
    drawCutoutJoint(25 + armSwing * 0.45, 10 - armSwing, 3.5, "#d0a079", "#7d523b");

    ctx.fillStyle = "#4f3b30";
    roundedRect(-20, -3, 15, 24, 5);
    ctx.fill();
    ctx.fillStyle = "#2f3030";
    ctx.strokeStyle = "#3c3d38";
    ctx.lineWidth = 1.1;
    roundedRect(-14, -9, 29, 32, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#3c3d37";
    roundedRect(-11, -7, 12, 29, 5);
    ctx.fill();
    ctx.fillStyle = "#4d342a";
    ctx.beginPath();
    ctx.moveTo(1, -7);
    ctx.lineTo(16, -3 + coatSwing);
    ctx.lineTo(13, 22);
    ctx.lineTo(0, 19);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#7b5a45";
    roundedRect(-17, -5, 35, 13, 5);
    ctx.fill();
    ctx.fillStyle = "#c8a36f";
    ctx.beginPath();
    ctx.arc(-1, 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#5f6a52";
    roundedRect(8, 1, 18, 25, 6);
    ctx.fill();
    ctx.fillStyle = "#434b3c";
    roundedRect(11, 5, 12, 12, 3);
    ctx.fill();
    ctx.strokeStyle = "#8b6b4f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -8);
    ctx.lineTo(17, 24);
    ctx.stroke();

    ctx.fillStyle = "#c4936d";
    ctx.beginPath();
    ctx.arc(0, -20, 12, 0, Math.PI * 2);
    ctx.fill();

    if (front) {
      ctx.fillStyle = "#44372e";
      ctx.beginPath();
      ctx.ellipse(-13, -12, 6, 21, -0.16, 0, Math.PI * 2);
      ctx.ellipse(13, -12, 6, 21, 0.16, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#44372e";
      ctx.beginPath();
      ctx.ellipse(0, -17, 17, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#6b5646";
    ctx.beginPath();
    ctx.ellipse(0, -12, 10, 8, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = "#d6a57c";
    ctx.beginPath();
    ctx.ellipse(localDirX * 3, -27, 7, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5a4639";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-4, -31);
    ctx.quadraticCurveTo(-1, -35, 2, -31);
    ctx.moveTo(4, -31);
    ctx.quadraticCurveTo(7, -34, 9, -30);
    ctx.stroke();

    if (!back) {
      ctx.fillStyle = "#2d2823";
      ctx.beginPath();
      ctx.arc(-4 + localDirX * 2, -21, 1.45, 0, Math.PI * 2);
      ctx.arc(5 + localDirX * 2, -21, 1.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7d5d45";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(localDirX * 3, -19);
      ctx.lineTo(localDirX * 6, -16);
      ctx.stroke();
      ctx.strokeStyle = panic ? "#4b251f" : "#744d3a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (panic) {
        ctx.moveTo(-5, -14);
        ctx.lineTo(5, -13);
      } else {
        ctx.arc(1, -15, 4, 0.1, Math.PI - 0.1);
      }
      ctx.stroke();
    }

    ctx.strokeStyle = "#f2d88a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(localDirX * 9, -17 + dirY * 2);
    ctx.lineTo(localDirX * 20, -17 + dirY * 8);
    ctx.stroke();

    ctx.fillStyle = "rgba(226, 178, 98, 0.78)";
    ctx.beginPath();
    ctx.arc(localDirX * 21, -17 + dirY * 8, 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (soup.carrying) {
      ctx.strokeStyle = "#5f7d3f";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-22, 7);
      ctx.lineTo(-33, -8);
      ctx.stroke();
      ctx.fillStyle = "#8fbb4e";
      ctx.beginPath();
      ctx.ellipse(-33, -12, 5, 9, -0.6, 0, Math.PI * 2);
      ctx.ellipse(-27, -8, 4, 7, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d8c78e";
      ctx.beginPath();
      ctx.arc(-30, -17, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (soup.cryUntil > now) {
      ctx.strokeStyle = "#74b9d2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-5, -17);
      ctx.lineTo(-8, -8 + Math.sin(now / 90) * 2);
      ctx.moveTo(5, -17);
      ctx.lineTo(9, -7 + Math.cos(now / 90) * 2);
      ctx.stroke();
    }
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

  function drawSoupIngredient(now) {
    if (soup.phase !== "forage" || !soup.ingredient || soup.ingredient.picked) return;
    const p = project(soup.ingredient.x, soup.ingredient.y);
    const wobble = Math.sin(now / 150) * 2;
    ctx.save();
    ctx.translate(p.x, p.y + wobble);
    ctx.fillStyle = "rgba(24, 20, 16, 0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 12, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = soup.ingredient.accent;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.quadraticCurveTo(i * 8, -4, i * 7, -18 - Math.abs(i) * 2);
      ctx.stroke();
    }
    ctx.fillStyle = soup.ingredient.color;
    ctx.beginPath();
    ctx.arc(-7, -18, 5, 0, Math.PI * 2);
    ctx.arc(6, -22, 5, 0, Math.PI * 2);
    ctx.arc(10, -12, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(92, 45, 32, 0.86)";
    roundedRect(-40, -52, 80, 22, 7);
    ctx.fill();
    ctx.fillStyle = "#fff5d7";
    ctx.font = "900 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SOUP STUFF", 0, -37);
    ctx.restore();
  }

  function drawCutoutShadow(width, height, y = 18, alpha = 0.26) {
    ctx.fillStyle = `rgba(24, 20, 16, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(0, y, width, height, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCutoutLimb(x1, y1, x2, y2, width, fill, shade = "") {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = fill;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    if (shade) {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = shade;
      ctx.lineWidth = Math.max(1.5, width * 0.42);
      ctx.beginPath();
      ctx.moveTo(lerp(x1, x2, 0.52), lerp(y1, y2, 0.52));
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawCutoutJoint(x, y, radius, fill, shade = "") {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    if (shade) {
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(x + radius * 0.18, y + radius * 0.18, radius * 0.58, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawCutoutShoe(x, y, facing, fill = "#25201c") {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x + facing * 3, y, 8, 4, 0.08 * facing, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#fff5d7";
    ctx.beginPath();
    ctx.ellipse(x + facing * 1, y - 1, 4.5, 1.3, 0.08 * facing, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCutoutHead(x, y, radius, skin, hair, options = {}) {
    ctx.fillStyle = skin;
    ctx.strokeStyle = options.outline || "#2f2924";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (options.ears) {
      ctx.fillStyle = skin;
      ctx.beginPath();
      ctx.arc(x - radius + 2, y, 3, 0, Math.PI * 2);
      ctx.arc(x + radius - 2, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = hair;
    if (options.hair === "cap") {
      roundedRect(x - radius - 2, y - radius - 10, radius * 2 + 4, 9, 4);
      ctx.fill();
      roundedRect(x - radius * 0.68, y - radius - 17, radius * 1.36, 9, 4);
      ctx.fill();
    } else if (options.hair === "tufts") {
      ctx.beginPath();
      ctx.ellipse(x - 8, y - radius + 1, 9, 6, -0.35, 0, Math.PI * 2);
      ctx.ellipse(x + 5, y - radius, 10, 6, 0.22, 0, Math.PI * 2);
      ctx.ellipse(x + 12, y - radius + 5, 5, 8, 0.15, 0, Math.PI * 2);
      ctx.fill();
    } else if (options.hair === "wide") {
      ctx.beginPath();
      ctx.ellipse(x, y - radius + 1, radius + 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(x, y - radius + 2, radius + 1, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#1f1a17";
    ctx.beginPath();
    ctx.arc(x - 4, y - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(x + 4, y - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = options.mouthColor || "#5a3129";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (options.expression === "laugh") {
      ctx.arc(x, y + 3, 5, 0, Math.PI);
    } else if (options.expression === "scowl") {
      ctx.moveTo(x - 5, y + 5);
      ctx.lineTo(x + 5, y + 3);
    } else {
      ctx.moveTo(x - 4, y + 5);
      ctx.lineTo(x + 4, y + 5);
    }
    ctx.stroke();
  }

  function drawCutoutLabel(text, x, y, color = "#fff5d7") {
    ctx.fillStyle = color;
    ctx.font = "900 8px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(text, x, y);
  }

  function drawRabbit(rabbit, now) {
    const p = project(rabbit.x, rabbit.y);
    const hop = rabbit.fleeUntil > now ? Math.abs(Math.sin(now / 85 + rabbit.phase)) * 7 : Math.abs(Math.sin(now / 260 + rabbit.phase)) * 2;
    const kick = Math.sin(now / 95 + rabbit.phase) * (rabbit.fleeUntil > now ? 6 : 2);
    const facing = rabbit.x < player.x ? -1 : 1;
    ctx.save();
    ctx.translate(p.x, p.y - hop);
    ctx.scale(facing, 1);
    drawCutoutShadow(15, 6, 13 + hop, 0.2);
    drawCutoutLimb(-8, 6, -18 - kick, 13, 4, "#d7d0bf", "#6b6258");
    drawCutoutLimb(7, 7, 16 + kick, 13, 4, "#d7d0bf", "#6b6258");
    ctx.fillStyle = "#d7d0bf";
    ctx.strokeStyle = "#bfb7a7";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 11, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(14, -7, 9, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#bfb7a7";
    ctx.fillStyle = "#d7d0bf";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(14, -24, 4, 13, -0.25, 0, Math.PI * 2);
    ctx.ellipse(24, -22, 4, 12, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2e2923";
    ctx.beginPath();
    ctx.arc(18, -9, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff5d7";
    ctx.beginPath();
    ctx.arc(-17, -1, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawRat(rat, now) {
    const p = project(rat.x, rat.y);
    const wiggle = Math.sin(now / 120 + rat.phase) * 2;
    const scamper = Math.sin(now / 80 + rat.phase) * 4;
    const facing = rat.x < player.x ? -1 : 1;
    ctx.save();
    ctx.translate(p.x, p.y + wiggle);
    ctx.scale(facing, 1);
    drawCutoutShadow(13, 5, 9, 0.22);
    ctx.strokeStyle = "#8a6a66";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, 2);
    ctx.quadraticCurveTo(-30, -6, -42, 4 + wiggle);
    ctx.stroke();
    drawCutoutLimb(-7, 6, -14 - scamper, 12, 2.4, "#4a443f", "#26221f");
    drawCutoutLimb(7, 6, 14 + scamper, 12, 2.4, "#4a443f", "#26221f");
    ctx.fillStyle = "#4a443f";
    ctx.strokeStyle = "#57504a";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 9, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(14, -3, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#c48a83";
    ctx.strokeStyle = "#9f726e";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(13, -9, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(17, -4, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d8c8b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, -2);
    ctx.lineTo(29, -5);
    ctx.moveTo(20, 0);
    ctx.lineTo(30, 1);
    ctx.stroke();
    ctx.restore();
  }

  function drawBird(bird, now) {
    const p = project(bird.x, bird.y);
    const stunned = bird.state === "stunned";
    const altitude = stunned ? 0 : 34 + Math.sin(now / 180 + bird.phase) * 8;
    const flap = Math.sin(now / 80 + bird.phase) * 9;
    ctx.save();
    ctx.translate(p.x, p.y - altitude);
    ctx.fillStyle = "rgba(24, 20, 16, 0.18)";
    ctx.beginPath();
    ctx.ellipse(0, altitude + 10, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (stunned) {
      ctx.rotate(Math.sin(now / 100) * 0.08);
      ctx.fillStyle = "#67727a";
    ctx.strokeStyle = "#46535b";
    ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(0, 2, 17, 9, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#2f3437";
      ctx.font = "900 9px sans-serif";
      ctx.fillText("x", -6, 1);
      ctx.fillText("x", 4, 1);
      ctx.strokeStyle = "#ffd36d";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-8 + i * 8, -16);
        ctx.lineTo(-5 + i * 8, -22);
        ctx.lineTo(-2 + i * 8, -16);
        ctx.stroke();
      }
    } else {
      const angle = Math.atan2(bird.vy, bird.vx) * 0.35;
      ctx.rotate(angle);
      ctx.strokeStyle = "#4f5b62";
      ctx.lineWidth = 1.1;
      ctx.fillStyle = "#53636c";
      ctx.beginPath();
      ctx.ellipse(-16, -2 - flap * 0.35, 18, 6, -0.28, 0, Math.PI * 2);
      ctx.ellipse(16, -2 + flap * 0.35, 18, 6, 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#5f6970";
      ctx.strokeStyle = "#53616a";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#7a858c";
      ctx.beginPath();
      ctx.ellipse(-9, -2 - flap * 0.55, 11, 4, -0.35, 0, Math.PI * 2);
      ctx.ellipse(9, -2 + flap * 0.55, 11, 4, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d8b56c";
      ctx.beginPath();
      ctx.moveTo(14, -1);
      ctx.lineTo(24, 2);
      ctx.lineTo(14, 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWandaTrailer(x, y) {
    drawIsoRect(x, y, 145, 78, "#915c65", "#4a3238");
    const p = project(x, y);
    ctx.save();
    ctx.fillStyle = "#d8c783";
    ctx.strokeStyle = "#4a3238";
    ctx.lineWidth = 2;
    roundedRect(p.x - 58, p.y - 42, 35, 28, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#3a2e32";
    roundedRect(p.x + 13, p.y - 36, 34, 52, 4);
    ctx.fill();
    ctx.fillStyle = "#f2ca78";
    ctx.beginPath();
    ctx.arc(p.x + 38, p.y - 7, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff5d7";
    ctx.font = "900 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("WANDA", p.x - 6, p.y - 50);
    ctx.strokeStyle = "#62504a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x - 72, p.y + 28);
    ctx.lineTo(p.x + 74, p.y + 28);
    ctx.stroke();
    ctx.fillStyle = "#2f3437";
    ctx.beginPath();
    ctx.arc(p.x - 48, p.y + 29, 9, 0, Math.PI * 2);
    ctx.arc(p.x + 52, p.y + 29, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBigWanda(now) {
    if (!bigWanda.active && !bigWanda.revealed) return;
    const p = project(bigWanda.x, bigWanda.y);
    const chase = bigWanda.state === "chase";
    const stride = Math.sin(now / (chase ? 92 : 180) + bigWanda.x) * (chase ? 9 : 3);
    const armSwing = Math.sin(now / (chase ? 115 : 230) + bigWanda.y) * (chase ? 10 : 3);
    const bob = chase ? Math.abs(Math.sin(now / 92)) * 2 : Math.sin(now / 430) * 0.7;
    const facing = bigWanda.x < player.x ? 1 : -1;
    ctx.save();
    ctx.translate(p.x, p.y - bob);
    ctx.scale(facing, 1);

    drawCutoutShadow(31, 10, 23 + bob, 0.3);
    drawCutoutLimb(-11, 18, -20 - stride, 36, 7, "#33262b", "#1f171a");
    drawCutoutLimb(11, 18, 20 + stride, 36, 7, "#33262b", "#1f171a");
    drawCutoutShoe(-21 - stride, 37, -1, "#24191d");
    drawCutoutShoe(21 + stride, 37, 1, "#24191d");

    drawCutoutLimb(-22, -5, -39, 8 + armSwing, 8, "#d39a78", "#5f302e");
    drawCutoutLimb(22, -5, 41, 8 - armSwing, 8, "#d39a78", "#5f302e");
    drawCutoutJoint(-39, 8 + armSwing, 4.2, "#d39a78", "#5f302e");
    drawCutoutJoint(41, 8 - armSwing, 4.2, "#d39a78", "#5f302e");

    ctx.fillStyle = "#9a4f69";
    ctx.strokeStyle = "#7e4358";
    ctx.lineWidth = 1.2;
    roundedRect(-27, -18, 54, 45, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e0b15a";
    ctx.beginPath();
    ctx.arc(0, -2, 3, 0, Math.PI * 2);
    ctx.fill();

    drawCutoutHead(0, -33, 15, "#d39a78", "#4a2634", { hair: "wide", expression: chase ? "scowl" : "laugh", ears: true });
    drawCutoutLabel("WANDA", 0, 8);
    if (bigWanda.state === "chase") drawBubble(16, -62, "COME BACK");
    if (bigWanda.state === "intro") drawBubble(10, -62, "OH MY");
    ctx.restore();
  }

  function drawGymGuy(guy, now) {
    const p = project(guy.x, guy.y);
    const laughing = now - guy.lastLaughAt < 1700;
    const moving = guy.walkAwayUntil > now || guy.path;
    const stride = Math.sin(now / 115 + guy.phase) * (moving ? 6 : 2);
    const pump = laughing ? Math.sin(now / 90) * 5 : Math.sin(now / 260 + guy.phase) * 2;
    const facing = guy.id === "gym-2" && guy.path ? Math.sign((guy.path[guy.target]?.x || guy.x) - guy.x) || 1 : 1;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(facing, 1);

    drawCutoutShadow(23, 8, 19, 0.25);
    drawCutoutLimb(-8, 17, -16 - stride, 31, 6, "#2b2d32", "#15181c");
    drawCutoutLimb(8, 17, 16 + stride, 31, 6, "#2b2d32", "#15181c");
    drawCutoutShoe(-17 - stride, 32, -1, "#171719");
    drawCutoutShoe(17 + stride, 32, 1, "#171719");

    drawCutoutLimb(-17, -4, -33, 8 + pump, 8, "#d7a37d", "#5d3528");
    drawCutoutLimb(17, -4, 33, 8 - pump, 8, "#d7a37d", "#5d3528");
    drawCutoutJoint(-33, 8 + pump, 4.2, "#d7a37d", "#5d3528");
    drawCutoutJoint(33, 8 - pump, 4.2, "#d7a37d", "#5d3528");

    ctx.fillStyle = "#38536b";
    ctx.strokeStyle = "#30475c";
    ctx.lineWidth = 1.15;
    roundedRect(-20, -13, 40, 35, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#c8d6e6";
    ctx.beginPath();
    ctx.moveTo(-7, -11);
    ctx.lineTo(0, -2);
    ctx.lineTo(7, -11);
    ctx.closePath();
    ctx.fill();
    drawCutoutHead(0, -27, 12, "#d7a37d", "#23201d", { hair: "tufts", expression: laughing ? "laugh" : "neutral", ears: true });
    drawCutoutLabel("GYM", 0, 8);
    if (laughing) {
      drawBubble(18, -52, "HA");
    }
    ctx.restore();
  }

  function drawRummager(actor, now) {
    const p = project(actor.x, actor.y);
    const item = speakAndSpellItem();
    const guarding = item && isSpeakAndSpellGuarded(item);
    const rummage = Math.sin(now / 120 + actor.rummageTime) * 6;
    const lean = guarding ? -0.08 : Math.sin(now / 380 + actor.rummageTime) * 0.05;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(lean);

    drawCutoutShadow(21, 8, 19, 0.26);
    drawCutoutLimb(-7, 17, -12 - rummage * 0.4, 31, 5.5, "#3b332b", "#211a16");
    drawCutoutLimb(7, 17, 13 + rummage * 0.2, 31, 5.5, "#3b332b", "#211a16");
    drawCutoutShoe(-13 - rummage * 0.4, 32, -1, "#211a16");
    drawCutoutShoe(14 + rummage * 0.2, 32, 1, "#211a16");

    drawCutoutLimb(-14, -3, -29, 9 + rummage, 5.5, "#c4936d", "#5a3525");
    drawCutoutLimb(14, -3, 30, 9 - rummage, 5.5, "#c4936d", "#5a3525");
    drawCutoutJoint(-29, 9 + rummage, 3.4, "#c4936d", "#5a3525");
    drawCutoutJoint(30, 9 - rummage, 3.4, "#c4936d", "#5a3525");

    ctx.fillStyle = "#6a5842";
    ctx.strokeStyle = "#564735";
    ctx.lineWidth = 1.15;
    roundedRect(-17, -13, 34, 36, 7);
    ctx.fill();
    ctx.stroke();

    drawCutoutHead(0, -27, 11, "#c4936d", "#4a372b", { hair: "cap", expression: guarding ? "scowl" : "neutral", ears: true });
    ctx.fillStyle = "#2e2923";
    roundedRect(-10, -35, 20, 5, 2);
    ctx.fill();
    drawCutoutLabel("GARY", 0, 7);
    if (guarding) drawBubble(8, -52, "MINE");
    ctx.restore();
  }

  function drawCop(cop, now) {
    const p = project(cop.x, cop.y);
    const angle = Math.atan2(cop.path[cop.target].y - cop.y, cop.path[cop.target].x - cop.x);
    const stride = Math.sin(now / 130 + cop.x) * 5;
    const arm = Math.sin(now / 210 + cop.y) * 3;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle * 0.18);

    drawCutoutShadow(23, 8, 19, 0.23);
    drawCutoutLimb(-7, 16, -13 - stride, 31, 5.5, "#17253d", "#101722");
    drawCutoutLimb(7, 16, 13 + stride, 31, 5.5, "#17253d", "#101722");
    drawCutoutShoe(-14 - stride, 32, -1, "#101722");
    drawCutoutShoe(14 + stride, 32, 1, "#101722");

    drawCutoutLimb(-15, -5, -29, 5 + arm, 5.5, "#c89a72", "#56392b");
    drawCutoutLimb(15, -5, 29, 5 - arm, 5.5, "#c89a72", "#56392b");

    ctx.fillStyle = "#263f68";
    ctx.strokeStyle = "#20375c";
    ctx.lineWidth = 1.15;
    roundedRect(-17, -19, 34, 39, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f0c770";
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();

    drawCutoutHead(0, -27, 11, "#c89a72", "#1f2e4a", { hair: "cap", expression: "scowl", ears: true });
    ctx.fillStyle = "#1f2e4a";
    roundedRect(-14, -34, 28, 7, 3);
    ctx.fill();
    ctx.fillStyle = "#263f68";
    roundedRect(-9, -40, 18, 8, 3);
    ctx.fill();
    ctx.fillStyle = "#2b211b";
    ctx.beginPath();
    ctx.ellipse(0, -19, 6, 3, 0, 0, Math.PI);
    ctx.fill();
    if (cop.gadget === "clipboard") {
      ctx.fillStyle = "#d8c9a3";
      ctx.strokeStyle = "#564c3e";
      ctx.lineWidth = 2;
      roundedRect(25, -5, 20, 26, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#564c3e";
      ctx.fillRect(30, 1, 10, 2);
      ctx.fillRect(30, 7, 8, 2);
    } else {
      ctx.fillStyle = "rgba(255, 241, 168, 0.2)";
      ctx.beginPath();
      ctx.moveTo(10, -10);
      ctx.lineTo(96, -34 + Math.sin(now / 300) * 14);
      ctx.lineTo(96, 28 + Math.sin(now / 300) * 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#2f3437";
      roundedRect(23, -9, 18, 7, 3);
      ctx.fill();
    }
    drawCutoutLabel("BYLAW", 0, 8);
    ctx.restore();
  }

  function drawIsoRect(cx, cy, w, h, fill, stroke) {
    const left = project(cx - w / 2, cy - h / 2);
    const right = project(cx + w / 2, cy - h / 2);
    const bottomRight = project(cx + w / 2, cy + h / 2);
    const bottomLeft = project(cx - w / 2, cy + h / 2);
    ctx.fillStyle = "rgba(23, 20, 16, 0.16)";
    ctx.beginPath();
    ctx.moveTo(left.x + 6, left.y + 10);
    ctx.lineTo(right.x + 6, right.y + 10);
    ctx.lineTo(bottomRight.x + 6, bottomRight.y + 10);
    ctx.lineTo(bottomLeft.x + 6, bottomLeft.y + 10);
    ctx.closePath();
    ctx.fill();
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

  function drawOffscreenArrow(target, level = 0) {
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
    ctx.scale(1 + level * 0.18, 1 + level * 0.18);
    ctx.fillStyle = "rgba(47, 42, 32, 0.84)";
    ctx.strokeStyle = level >= 2 ? "#ffd36d" : "#fff1a8";
    ctx.lineWidth = 2 + level * 0.4;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -12);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (level >= 2) {
      ctx.rotate(-angle);
      ctx.fillStyle = "rgba(47, 42, 32, 0.84)";
      roundedRect(-34, -38, 68, 18, 6);
      ctx.fill();
      ctx.fillStyle = "#fff5d7";
      ctx.font = "900 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("THIS WAY", 0, -25);
    }
    ctx.restore();
  }

  function drawFloorLines(cx, cy, w, h, color, spacing) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    for (let offset = -h / 2 + spacing; offset < h / 2; offset += spacing) {
      const left = project(cx - w / 2 + 10, cy + offset);
      const right = project(cx + w / 2 - 10, cy + offset);
      ctx.beginPath();
      ctx.moveTo(left.x, left.y);
      ctx.lineTo(right.x, right.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFenceLine(x1, y1, x2, y2, posts) {
    const start = project(x1, y1);
    const end = project(x2, y2);
    ctx.save();
    ctx.strokeStyle = "#5a4633";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.strokeStyle = "#c0a879";
    ctx.lineWidth = 2;
    for (let i = 0; i <= posts; i += 1) {
      const t = i / posts;
      const px = start.x + (end.x - start.x) * t;
      const py = start.y + (end.y - start.y) * t;
      ctx.beginPath();
      ctx.moveTo(px, py - 16);
      ctx.lineTo(px, py + 16);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShrubs(x, y, count) {
    const base = project(x, y);
    ctx.save();
    for (let i = 0; i < count; i += 1) {
      const px = base.x + Math.cos(i * 1.7) * 28 + i * 12;
      const py = base.y + Math.sin(i * 1.1) * 10;
      ctx.fillStyle = i % 2 ? "#486c43" : "#547a49";
      ctx.beginPath();
      ctx.ellipse(px, py, 20, 12, i * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawKitchen(x, y, now) {
    drawIsoRect(x, y, 150, 118, "#9f7a5c", "#5f4534");
    const p = project(x, y);
    const pot = project(locations.soupPot.x, locations.soupPot.y);
    ctx.save();
    ctx.fillStyle = "#6d4a32";
    ctx.strokeStyle = "#3d2f25";
    ctx.lineWidth = 2;
    roundedRect(p.x - 60, p.y - 36, 118, 26, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d8c9a3";
    roundedRect(p.x + 26, p.y - 32, 22, 18, 3);
    ctx.fill();
    ctx.fillStyle = "#4d554d";
    roundedRect(p.x - 54, p.y + 2, 98, 36, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#242b2a";
    roundedRect(pot.x - 28, pot.y - 16, 56, 32, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = soup.ruinedUntil > now ? "#a65f3e" : "#7f6d46";
    ctx.beginPath();
    ctx.ellipse(pot.x, pot.y - 14, 26, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = soup.ruinedUntil > now ? "#d8a07a" : "#d8c78e";
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i += 1) {
      const sx = pot.x - 14 + i * 14;
      ctx.beginPath();
      ctx.moveTo(sx, pot.y - 24);
      ctx.bezierCurveTo(sx - 10, pot.y - 42 - Math.sin(now / 260 + i) * 8, sx + 9, pot.y - 48, sx, pot.y - 64);
      ctx.stroke();
    }
    if (soup.ruinedUntil > now) {
      ctx.fillStyle = "#a65f3e";
      ctx.beginPath();
      ctx.ellipse(pot.x + 34, pot.y + 15, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pot.x - 30, pot.y + 10, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fff5d7";
    ctx.font = "900 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SOUP", pot.x, pot.y + 5);
    ctx.restore();
  }

  function drawRug(x, y, w, h, fill, accent) {
    const p = project(x, y);
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    roundedRect(p.x - w / 2, p.y - h / 2, w, h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 245, 215, 0.34)";
    ctx.lineWidth = 2;
    roundedRect(p.x - w / 2 + 12, p.y - h / 2 + 10, w - 24, h - 20, 8);
    ctx.stroke();
    ctx.restore();
  }

  function drawSofa(x, y) {
    const p = project(x, y);
    ctx.save();
    ctx.fillStyle = "#cf7d54";
    ctx.strokeStyle = "#684231";
    ctx.lineWidth = 3;
    roundedRect(p.x - 58, p.y - 25, 116, 44, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e59a6a";
    roundedRect(p.x - 48, p.y - 38, 96, 24, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#9f543f";
    roundedRect(p.x - 48, p.y - 12, 26, 24, 6);
    ctx.fill();
    roundedRect(p.x - 13, p.y - 12, 26, 24, 6);
    ctx.fill();
    roundedRect(p.x + 22, p.y - 12, 26, 24, 6);
    ctx.fill();
    ctx.restore();
  }

  function drawCoffeeTable(x, y) {
    const p = project(x, y);
    ctx.save();
    ctx.fillStyle = "#8a5b38";
    ctx.strokeStyle = "#4c3325";
    ctx.lineWidth = 3;
    roundedRect(p.x - 42, p.y - 18, 84, 30, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#d8c783";
    ctx.beginPath();
    ctx.arc(p.x + 18, p.y - 3, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3b3430";
    ctx.fillRect(p.x - 30, p.y - 8, 24, 7);
    ctx.restore();
  }

  function drawLamp(x, y) {
    const p = project(x, y);
    ctx.save();
    ctx.strokeStyle = "#5a4938";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + 28);
    ctx.lineTo(p.x, p.y - 22);
    ctx.stroke();
    ctx.fillStyle = "#f4dfa4";
    ctx.strokeStyle = "#6f5940";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x - 22, p.y - 22);
    ctx.lineTo(p.x + 22, p.y - 22);
    ctx.lineTo(p.x + 14, p.y + 2);
    ctx.lineTo(p.x - 14, p.y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawCableCoil(x, y, radius, color) {
    const p = project(x, y);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, radius - i * 5, (radius - i * 5) * 0.56, 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = "#2d2823";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x + radius - 4, p.y);
    ctx.lineTo(p.x + radius + 22, p.y + 10);
    ctx.stroke();
    ctx.restore();
  }

  function drawShelf(x, y) {
    const p = project(x, y);
    ctx.save();
    ctx.fillStyle = "#6d4a32";
    ctx.strokeStyle = "#3f2c21";
    ctx.lineWidth = 2;
    roundedRect(p.x - 38, p.y - 34, 76, 68, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#af8258";
    ctx.fillRect(p.x - 30, p.y - 14, 60, 5);
    ctx.fillRect(p.x - 30, p.y + 10, 60, 5);
    ctx.fillStyle = "#d8c783";
    ctx.fillRect(p.x - 25, p.y - 26, 13, 12);
    ctx.fillStyle = "#5d6f78";
    ctx.fillRect(p.x + 8, p.y - 26, 14, 12);
    ctx.restore();
  }

  function drawCrate(x, y, color) {
    const p = project(x, y);
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = "#3d2f25";
    ctx.lineWidth = 2;
    roundedRect(p.x - 24, p.y - 20, 48, 34, 5);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255, 245, 215, 0.28)";
    ctx.beginPath();
    ctx.moveTo(p.x - 18, p.y - 4);
    ctx.lineTo(p.x + 18, p.y - 4);
    ctx.moveTo(p.x, p.y - 18);
    ctx.lineTo(p.x, p.y + 12);
    ctx.stroke();
    ctx.restore();
  }

  function drawStump(x, y, scale = 1) {
    const p = project(x, y);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#6e4a2f";
    ctx.strokeStyle = "#3b291d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 2, 28, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#a27750";
    ctx.beginPath();
    ctx.ellipse(0, -7, 25, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#6e4a2f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -7, 13, 6, 0, 0, Math.PI * 2);
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

  function drawGym(x, y) {
    drawIsoRect(x, y, 180, 132, "#7f5a5d", "#4a3337");
    const p = project(x, y);
    ctx.save();
    ctx.fillStyle = "#2f3437";
    ctx.strokeStyle = "#1b1f22";
    ctx.lineWidth = 2;
    roundedRect(p.x - 58, p.y - 52, 116, 32, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f2d88a";
    ctx.font = "900 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GYM", p.x, p.y - 30);
    ctx.fillStyle = "#a9c2cd";
    roundedRect(p.x - 62, p.y - 10, 38, 38, 4);
    ctx.fill();
    roundedRect(p.x + 25, p.y - 10, 38, 38, 4);
    ctx.fill();
    ctx.strokeStyle = "#2f3437";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(p.x - 36, p.y + 44);
    ctx.lineTo(p.x + 36, p.y + 44);
    ctx.stroke();
    ctx.fillStyle = "#2f3437";
    ctx.fillRect(p.x - 50, p.y + 35, 10, 18);
    ctx.fillRect(p.x + 40, p.y + 35, 10, 18);
    ctx.restore();
  }

  function drawBubble(x, y, text) {
    ctx.save();
    ctx.font = "900 10px sans-serif";
    const width = Math.max(32, ctx.measureText(text).width + 16);
    ctx.fillStyle = "rgba(255, 245, 215, 0.92)";
    ctx.strokeStyle = "#2f2a25";
    ctx.lineWidth = 2;
    roundedRect(x - width / 2, y - 14, width, 22, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#2f2a25";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y + 1);
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

  function lerp(start, end, t) {
    return start + (end - start) * t;
  }

  function easeInOut(t) {
    const clamped = clamp(t, 0, 1);
    return clamped < 0.5 ? 2 * clamped * clamped : 1 - ((-2 * clamped + 2) ** 2) / 2;
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
      audio.nextHouseCreakAt = performance.now() + 6000 + Math.random() * 8000;
      audio.nextSynthBurpAt = performance.now() + 3500 + Math.random() * 6500;
    } catch (error) {
      audio.disabled = true;
    }
  }

  function playTone({ frequency, duration, type = "sine", gain = 0.06, slide = 0, delay = 0 }) {
    if (!audio.context || audio.disabled) return;
    if (audio.context.state === "suspended") audio.context.resume();
    const now = audio.context.currentTime + delay;
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

  function playNoise({ duration = 0.12, gain = 0.04, filter = 900, filterType = "bandpass", delay = 0 }) {
    if (!audio.context || audio.disabled) return;
    if (audio.context.state === "suspended") audio.context.resume();
    const now = audio.context.currentTime + delay;
    const length = Math.max(1, Math.floor(audio.context.sampleRate * duration));
    const buffer = audio.context.createBuffer(1, length, audio.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      const fade = 1 - i / length;
      data[i] = (Math.random() * 2 - 1) * fade;
    }

    const source = audio.context.createBufferSource();
    const noiseFilter = audio.context.createBiquadFilter();
    const noiseGain = audio.context.createGain();
    source.buffer = buffer;
    noiseFilter.type = filterType;
    noiseFilter.frequency.setValueAtTime(filter, now);
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(gain, now + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audio.master);
    source.start(now);
    source.stop(now + duration + 0.02);
  }

  function playPickupSound(type = "") {
    const sounds = {
      dinCable: playCableSqueakSound,
      cableBundle: playCableSqueakSound,
      finalAdapter: playFinalAdapterSound,
      speakAndSpell: playSpeakAndSpellSound,
      personalityStump: playWoodThunkSound,
      powerBrick: playElectricalBuzzSound,
      rustyGrate: playMetalClankSound,
      grateShelf: playMetalClankSound,
      rackRails: playMetalClankSound,
    };
    (sounds[type] || playGenericPickupSound)();
  }

  function playGenericPickupSound() {
    playTone({ frequency: 420, duration: 0.12, type: "triangle", gain: 0.08, slide: 140 });
    playNoise({ duration: 0.07, gain: 0.025, filter: 1600 });
  }

  function playCableSqueakSound() {
    playTone({ frequency: 310, duration: 0.09, type: "sawtooth", gain: 0.045, slide: 240 });
    playTone({ frequency: 690, duration: 0.07, type: "triangle", gain: 0.035, slide: -190, delay: 0.055 });
    playNoise({ duration: 0.11, gain: 0.025, filter: 2300, filterType: "bandpass" });
  }

  function playWoodThunkSound() {
    playTone({ frequency: 112, duration: 0.18, type: "triangle", gain: 0.08, slide: -42 });
    playNoise({ duration: 0.11, gain: 0.045, filter: 420, filterType: "lowpass", delay: 0.025 });
  }

  function playElectricalBuzzSound() {
    playTone({ frequency: 58, duration: 0.2, type: "square", gain: 0.035, slide: 5 });
    playTone({ frequency: 121, duration: 0.17, type: "sawtooth", gain: 0.025, slide: -8, delay: 0.02 });
    playNoise({ duration: 0.12, gain: 0.02, filter: 3200, filterType: "highpass" });
  }

  function playMetalClankSound() {
    playNoise({ duration: 0.12, gain: 0.07, filter: 2400, filterType: "highpass" });
    playTone({ frequency: 710, duration: 0.08, type: "square", gain: 0.045, slide: -280 });
    playTone({ frequency: 430, duration: 0.12, type: "triangle", gain: 0.04, slide: -160, delay: 0.065 });
  }

  function playFinalAdapterSound() {
    playTone({ frequency: 523, duration: 0.1, type: "triangle", gain: 0.065 });
    playTone({ frequency: 659, duration: 0.1, type: "triangle", gain: 0.06, delay: 0.08 });
    playTone({ frequency: 784, duration: 0.18, type: "triangle", gain: 0.07, slide: 50, delay: 0.16 });
    playNoise({ duration: 0.08, gain: 0.018, filter: 4200, filterType: "highpass", delay: 0.02 });
  }

  function playSpeakAndSpellSound() {
    playTone({ frequency: 440, duration: 0.08, type: "square", gain: 0.035 });
    playTone({ frequency: 554, duration: 0.07, type: "square", gain: 0.03, delay: 0.09 });
    playTone({ frequency: 330, duration: 0.12, type: "square", gain: 0.026, slide: -40, delay: 0.18 });
    playNoise({ duration: 0.07, gain: 0.014, filter: 3600, filterType: "bandpass", delay: 0.05 });
  }

  function playDropSound(type = "") {
    if (type === "personalityStump") {
      playWoodThunkSound();
      playTone({ frequency: 72, duration: 0.22, type: "sine", gain: 0.05, slide: -18, delay: 0.08 });
      return;
    }
    if (type === "rustyGrate" || type === "grateShelf" || type === "rackRails") {
      playMetalClankSound();
      playNoise({ duration: 0.14, gain: 0.045, filter: 1100, filterType: "bandpass", delay: 0.08 });
      return;
    }
    playTone({ frequency: 160, duration: 0.18, type: "square", gain: 0.05, slide: -60 });
    playNoise({ duration: 0.1, gain: 0.03, filter: 650, filterType: "lowpass" });
  }

  function playUseSound(type = "") {
    if (type === "powerBrick") {
      playElectricalBuzzSound();
      playTone({ frequency: 980, duration: 0.05, type: "square", gain: 0.025, delay: 0.13 });
      return;
    }
    if (type === "finalAdapter") {
      playFinalAdapterSound();
      return;
    }
    if (type === "speakAndSpell") {
      playSpeakAndSpellSound();
      return;
    }
    if (type === "dinCable" || type === "cableBundle") {
      playCableSqueakSound();
      return;
    }
    playTone({ frequency: 260, duration: 0.16, type: "triangle", gain: 0.06, slide: 80 });
  }

  function playMissionCompleteSound() {
    playTone({ frequency: 330, duration: 0.13, type: "triangle", gain: 0.08, slide: 110 });
    playTone({ frequency: 495, duration: 0.13, type: "triangle", gain: 0.08, slide: 70, delay: 0.1 });
    playTone({ frequency: 660, duration: 0.22, type: "triangle", gain: 0.075, slide: -20, delay: 0.2 });
    playNoise({ duration: 0.08, gain: 0.018, filter: 5000, filterType: "highpass", delay: 0.08 });
  }

  function playMissionStepSound(type = "") {
    playUseSound(type);
    playTone({ frequency: 392, duration: 0.12, type: "triangle", gain: 0.055, delay: 0.15 });
    playTone({ frequency: 294, duration: 0.16, type: "triangle", gain: 0.04, slide: -30, delay: 0.25 });
  }

  function playDiscoverySound(discovery) {
    if (discovery.id === "hairspray") {
      playHairspraySound();
      return;
    }
    if (discovery.kind === "stack" || discovery.kind === "book") {
      playPaperRustleSound();
      return;
    }
    if (discovery.kind === "synth") {
      playSynthBurpSound();
      return;
    }
    if (discovery.kind === "safe") {
      playTone({ frequency: 135, duration: 0.16, type: "triangle", gain: 0.065, slide: -40 });
      playTone({ frequency: 540, duration: 0.08, type: "square", gain: 0.03, delay: 0.11 });
      return;
    }
    if (discovery.kind === "dig") {
      playShovelScrapeSound();
      return;
    }
    if (discovery.kind === "appliance") {
      playMetalClankSound();
      return;
    }
    playTone({ frequency: 260, duration: 0.08, type: "triangle", gain: 0.045, slide: 90 });
    playNoise({ duration: 0.08, gain: 0.018, filter: 1500 });
  }

  function playPaperRustleSound() {
    playNoise({ duration: 0.18, gain: 0.032, filter: 1800, filterType: "bandpass" });
    playNoise({ duration: 0.12, gain: 0.025, filter: 2600, filterType: "bandpass", delay: 0.08 });
  }

  function playTapeFastForwardSound() {
    playTone({ frequency: 760, duration: 0.13, type: "sawtooth", gain: 0.035, slide: 360 });
    playTone({ frequency: 980, duration: 0.13, type: "sawtooth", gain: 0.032, slide: 480, delay: 0.08 });
    playNoise({ duration: 0.28, gain: 0.018, filter: 3500, filterType: "highpass" });
  }

  function playGateRattleSound() {
    playMetalClankSound();
    playTone({ frequency: 118, duration: 0.16, type: "square", gain: 0.035, slide: -20, delay: 0.08 });
  }

  function playBagRejectSound() {
    playTone({ frequency: 92, duration: 0.12, type: "triangle", gain: 0.055, slide: -24 });
    playNoise({ duration: 0.14, gain: 0.035, filter: 700, filterType: "lowpass" });
    playTone({ frequency: 210, duration: 0.08, type: "square", gain: 0.025, slide: -70, delay: 0.1 });
  }

  function playEmptySearchSound() {
    playNoise({ duration: 0.15, gain: 0.026, filter: 1200, filterType: "bandpass" });
    playTone({ frequency: 190, duration: 0.09, type: "triangle", gain: 0.035, slide: -80, delay: 0.08 });
  }

  function playCopScoldSound() {
    playTone({ frequency: 880, duration: 0.07, type: "square", gain: 0.045 });
    playTone({ frequency: 740, duration: 0.08, type: "square", gain: 0.04, delay: 0.08 });
    playTone({ frequency: 520, duration: 0.1, type: "square", gain: 0.035, delay: 0.17 });
  }

  function playGuidanceNudgeSound(level = 1) {
    playTone({ frequency: 440 + level * 80, duration: 0.06, type: "triangle", gain: 0.035 });
    playTone({ frequency: 330 + level * 60, duration: 0.07, type: "square", gain: 0.026, delay: 0.08 });
    if (level >= 2) playNoise({ duration: 0.08, gain: 0.018, filter: 2200, filterType: "bandpass", delay: 0.12 });
    if (level >= 3) playTone({ frequency: 980, duration: 0.05, type: "square", gain: 0.025, delay: 0.19 });
  }

  function playRabbitSkitterSound() {
    playNoise({ duration: 0.08, gain: 0.018, filter: 2600, filterType: "highpass" });
    playTone({ frequency: 760, duration: 0.05, type: "triangle", gain: 0.025, slide: 160, delay: 0.02 });
    playTone({ frequency: 920, duration: 0.04, type: "triangle", gain: 0.02, slide: -120, delay: 0.1 });
  }

  function playRatChaseSound() {
    playTone({ frequency: 520, duration: 0.05, type: "square", gain: 0.03, slide: 170 });
    playTone({ frequency: 410, duration: 0.05, type: "square", gain: 0.026, slide: 120, delay: 0.08 });
    playNoise({ duration: 0.16, gain: 0.02, filter: 1900, filterType: "bandpass", delay: 0.03 });
  }

  function playBirdBonkSound() {
    playTone({ frequency: 180, duration: 0.1, type: "triangle", gain: 0.06, slide: -70 });
    playTone({ frequency: 780, duration: 0.05, type: "sine", gain: 0.025, delay: 0.08 });
    playNoise({ duration: 0.08, gain: 0.026, filter: 1500, filterType: "bandpass" });
  }

  function playBirdFlapSound() {
    playNoise({ duration: 0.09, gain: 0.02, filter: 2300, filterType: "bandpass" });
    playNoise({ duration: 0.08, gain: 0.016, filter: 2600, filterType: "bandpass", delay: 0.09 });
  }

  function playGymLaughSound() {
    playTone({ frequency: 142, duration: 0.08, type: "square", gain: 0.035, slide: -20 });
    playTone({ frequency: 170, duration: 0.08, type: "square", gain: 0.032, slide: -24, delay: 0.11 });
    playTone({ frequency: 128, duration: 0.1, type: "square", gain: 0.034, slide: -30, delay: 0.23 });
  }

  function playRummagerTauntSound() {
    playTone({ frequency: 250, duration: 0.08, type: "square", gain: 0.03, slide: -50 });
    playTone({ frequency: 310, duration: 0.07, type: "square", gain: 0.028, slide: -40, delay: 0.1 });
    playNoise({ duration: 0.09, gain: 0.018, filter: 1600, filterType: "bandpass", delay: 0.03 });
  }

  function playRummagerBlockSound() {
    playTone({ frequency: 118, duration: 0.12, type: "square", gain: 0.035, slide: -30 });
    playNoise({ duration: 0.1, gain: 0.026, filter: 700, filterType: "lowpass", delay: 0.04 });
  }

  function playWandaSound() {
    playTone({ frequency: 190, duration: 0.11, type: "triangle", gain: 0.045, slide: 80 });
    playTone({ frequency: 255, duration: 0.1, type: "sawtooth", gain: 0.032, slide: 60, delay: 0.09 });
    playNoise({ duration: 0.14, gain: 0.02, filter: 900, filterType: "bandpass", delay: 0.04 });
  }

  function playWandaCatchSound() {
    playTone({ frequency: 92, duration: 0.2, type: "sawtooth", gain: 0.045, slide: -30 });
    playTone({ frequency: 210, duration: 0.08, type: "square", gain: 0.026, delay: 0.15 });
    playNoise({ duration: 0.26, gain: 0.035, filter: 520, filterType: "lowpass", delay: 0.06 });
  }

  function playSoupAlarmSound() {
    playTone({ frequency: 880, duration: 0.07, type: "square", gain: 0.04 });
    playTone({ frequency: 660, duration: 0.08, type: "square", gain: 0.035, delay: 0.1 });
    playTone({ frequency: 880, duration: 0.07, type: "square", gain: 0.04, delay: 0.22 });
    playNoise({ duration: 0.16, gain: 0.018, filter: 1400, filterType: "bandpass", delay: 0.08 });
  }

  function playSoupPickupSound() {
    playNoise({ duration: 0.09, gain: 0.024, filter: 1700, filterType: "bandpass" });
    playTone({ frequency: 520, duration: 0.06, type: "triangle", gain: 0.035, slide: 130, delay: 0.04 });
  }

  function playSoupPlopSound() {
    playTone({ frequency: 138, duration: 0.13, type: "sine", gain: 0.06, slide: -38 });
    playNoise({ duration: 0.18, gain: 0.032, filter: 520, filterType: "lowpass", delay: 0.03 });
    playTone({ frequency: 392, duration: 0.07, type: "triangle", gain: 0.028, delay: 0.15 });
  }

  function playSoupRuinSound() {
    playNoise({ duration: 0.34, gain: 0.04, filter: 680, filterType: "lowpass" });
    playTone({ frequency: 104, duration: 0.36, type: "sawtooth", gain: 0.045, slide: -44, delay: 0.05 });
    playTone({ frequency: 230, duration: 0.18, type: "triangle", gain: 0.032, slide: -90, delay: 0.38 });
    playTone({ frequency: 180, duration: 0.2, type: "triangle", gain: 0.03, slide: -70, delay: 0.62 });
    playNoise({ duration: 0.18, gain: 0.022, filter: 240, filterType: "lowpass", delay: 0.52 });
  }

  function playHairspraySound() {
    playNoise({ duration: 0.42, gain: 0.035, filter: 4200, filterType: "highpass" });
    playTone({ frequency: 1400, duration: 0.08, type: "sine", gain: 0.018, slide: -240, delay: 0.34 });
  }

  function playShovelScrapeSound() {
    playNoise({ duration: 0.2, gain: 0.045, filter: 950, filterType: "bandpass" });
    playTone({ frequency: 155, duration: 0.1, type: "sawtooth", gain: 0.035, slide: -45, delay: 0.08 });
  }

  function playSynthBurpSound() {
    playTone({ frequency: 72, duration: 0.16, type: "sawtooth", gain: 0.035, slide: 22 });
    playTone({ frequency: 145, duration: 0.12, type: "square", gain: 0.022, slide: -16, delay: 0.06 });
    playTone({ frequency: 510, duration: 0.04, type: "triangle", gain: 0.018, delay: 0.18 });
  }

  function playHouseCreakSound() {
    playTone({ frequency: 96, duration: 0.35, type: "sawtooth", gain: 0.018, slide: -34 });
    playNoise({ duration: 0.28, gain: 0.012, filter: 520, filterType: "bandpass" });
  }

  function playJetAttemptSound() {
    playMissionCompleteSound();
    playTone({ frequency: 68, duration: 0.9, type: "sawtooth", gain: 0.045, slide: 90, delay: 0.25 });
    playNoise({ duration: 0.75, gain: 0.035, filter: 900, filterType: "lowpass", delay: 0.28 });
    playTone({ frequency: 740, duration: 0.08, type: "square", gain: 0.03, delay: 0.55 });
  }

  function updateAudio(now = performance.now()) {
    if (!audio.context || audio.disabled || !audio.humGain) return;
    const distanceFromSynths = Math.min(420, distance(player, locations.synthAltar));
    const target = 0.012 + (1 - distanceFromSynths / 420) * 0.03;
    audio.humGain.gain.setTargetAtTime(target, audio.context.currentTime, 0.2);

    if (now > audio.nextHouseCreakAt) {
      audio.nextHouseCreakAt = now + 8000 + Math.random() * 14000;
      playHouseCreakSound();
    }

    if (distanceFromSynths < 230 && now > audio.nextSynthBurpAt) {
      audio.nextSynthBurpAt = now + 6500 + Math.random() * 9500;
      playSynthBurpSound();
    }
  }
})();

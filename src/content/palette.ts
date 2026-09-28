/** Colour tokens from docs/design/art-bible.md and characters/bill.md. */
export const P = {
  ink: "#1e1a18",
  paper: "#efe9dc",
  caption: "#f9f5b0",
  salvage: "#f2b632",

  // 1955: the house
  mint: "#9cc9b4",
  cream: "#f2e8d5",
  rose: "#c9443f",
  leaf: "#6f8f4e",
  mustard: "#d9a441",
  chrome: "#c9cfd1",
  formica: "#c3c6b0",
  vinyl: "#3f8a86",
  walnut: "#6b4430",
  enamel: "#e8d9bf",
  wallpaper: "#e9dcc0",
  carpet: "#b9724f",
  hardwood: "#a8744a",
  lino1: "#efe6d2",
  lino2: "#6f9f8d",

  // 1986: Bill and the basement
  plastic: "#1f2226",
  led: "#ff7a1a",
  cassette: "#d8cfb4",
  silver: "#9aa3a8",
  syncred: "#c8312d",
  concrete: "#a39d92",
  basementWall: "#8b8a83",

  // 2026 / outdoors
  grass: "#8fb35a",
  grassDark: "#6f9444",
  dirt: "#8a6446",
  soil: "#6e4f38",
  fence: "#d9cdb0",
  asphalt: "#3a3f46",

  // Bill
  hairBase: "#4a2e22",
  hairLight: "#7a5238",
  hairGrey: "#8c8076",
  skin: "#d69474",
  stubble: "#7d5a4a",
  glasses: "#141213",
  flRed: "#b5452f",
  flRust: "#c8703f",
  flLine: "#3a2522",
  vest: "#2b2826",
  vestRib: "#3a3633",
  trousers: "#4a3b30",
  shoes: "#5a3a22",
  satchel: "#b99a6b",
  strap: "#7d6547",
  bark: "#6b4a2e",
  cut: "#dcb37d",
} as const;

/** Per-zone light colours. The ambient colour is the shadow tint (art bible: shadows are tinted, never grey). */
export const LIGHTING = {
  estate: { key: "#d2c0ae", ambient: "#a4c2bb" }, // warm afternoon, mint-teal shadows
  basement: { key: "#c9b8c8", ambient: "#8f93c4" }, // blue-violet shadows
  outdoors: { key: "#e0d0b4", ambient: "#a9bfc4" }, // flat daylight, cool slate shadows
} as const;

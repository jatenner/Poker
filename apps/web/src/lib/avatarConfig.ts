// ---------------------------------------------------------------------------
// Avatar Configuration Module
// Core data layer for the poker avatar builder using DiceBear v9 avataaars style.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export interface AvatarConfig {
  top: string;
  accessories: string;
  clothing: string;
  eyebrows: string;
  eyes: string;
  facialHair: string;
  mouth: string;
  clothingGraphic: string;
  skinColor: string;
  hairColor: string;
  clothesColor: string;
  facialHairColor: string;
  backgroundColor: string;
}

export interface AvatarOption {
  value: string;
  label: string;
}

export interface AvatarPreset {
  name: string;
  config: AvatarConfig;
}

export interface VibeCombo {
  name: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
}

// ---- Option Arrays --------------------------------------------------------

export const TOP_OPTIONS: AvatarOption[] = [
  { value: "shortFlat", label: "Short Flat" },
  { value: "shortCurly", label: "Short Curly" },
  { value: "shortRound", label: "Short Round" },
  { value: "shortWaved", label: "Short Waved" },
  { value: "longButNotTooLong", label: "Medium Length" },
  { value: "bigHair", label: "Big Hair" },
  { value: "bob", label: "Bob" },
  { value: "bun", label: "Bun" },
  { value: "curly", label: "Curly" },
  { value: "curvy", label: "Curvy" },
  { value: "dreads", label: "Dreads" },
  { value: "dreads01", label: "Dreads 01" },
  { value: "dreads02", label: "Dreads 02" },
  { value: "frida", label: "Frida" },
  { value: "fro", label: "Fro" },
  { value: "froBand", label: "Fro Band" },
  { value: "frizzle", label: "Frizzle" },
  { value: "shaggy", label: "Shaggy" },
  { value: "shaggyMullet", label: "Shaggy Mullet" },
  { value: "shavedSides", label: "Shaved Sides" },
  { value: "straight01", label: "Straight 01" },
  { value: "straight02", label: "Straight 02" },
  { value: "straightAndStrand", label: "Straight & Strand" },
  { value: "sides", label: "Sides" },
  { value: "theCaesar", label: "The Caesar" },
  { value: "theCaesarAndSidePart", label: "Caesar & Side Part" },
  { value: "miaWallace", label: "Mia Wallace" },
  { value: "hat", label: "Hat" },
  { value: "hijab", label: "Hijab" },
  { value: "turban", label: "Turban" },
  { value: "winterHat1", label: "Winter Hat 1" },
  { value: "winterHat02", label: "Winter Hat 02" },
  { value: "winterHat03", label: "Winter Hat 03" },
  { value: "winterHat04", label: "Winter Hat 04" },
];

export const ACCESSORIES_OPTIONS: AvatarOption[] = [
  { value: "", label: "None" },
  { value: "kurt", label: "Kurt" },
  { value: "prescription01", label: "Prescription 01" },
  { value: "prescription02", label: "Prescription 02" },
  { value: "round", label: "Round Glasses" },
  { value: "sunglasses", label: "Sunglasses" },
  { value: "wayfarers", label: "Wayfarers" },
  { value: "eyepatch", label: "Eyepatch" },
];

export const CLOTHING_OPTIONS: AvatarOption[] = [
  { value: "blazerAndShirt", label: "Blazer & Shirt" },
  { value: "blazerAndSweater", label: "Blazer & Sweater" },
  { value: "collarAndSweater", label: "Collar & Sweater" },
  { value: "graphicShirt", label: "Graphic Shirt" },
  { value: "hoodie", label: "Hoodie" },
  { value: "overall", label: "Overall" },
  { value: "shirtCrewNeck", label: "Crew Neck Shirt" },
  { value: "shirtScoopNeck", label: "Scoop Neck Shirt" },
  { value: "shirtVNeck", label: "V-Neck Shirt" },
];

export const CLOTHING_GRAPHIC_OPTIONS: AvatarOption[] = [
  { value: "", label: "None" },
  { value: "bat", label: "Bat" },
  { value: "bear", label: "Bear" },
  { value: "cumbia", label: "Cumbia" },
  { value: "deer", label: "Deer" },
  { value: "diamond", label: "Diamond" },
  { value: "hola", label: "Hola" },
  { value: "pizza", label: "Pizza" },
  { value: "resist", label: "Resist" },
  { value: "skull", label: "Skull" },
  { value: "skullOutline", label: "Skull Outline" },
];

export const EYEBROWS_OPTIONS: AvatarOption[] = [
  { value: "default", label: "Default" },
  { value: "defaultNatural", label: "Default Natural" },
  { value: "raisedExcited", label: "Raised Excited" },
  { value: "raisedExcitedNatural", label: "Raised Excited Natural" },
  { value: "angry", label: "Angry" },
  { value: "angryNatural", label: "Angry Natural" },
  { value: "upDown", label: "Up Down" },
  { value: "upDownNatural", label: "Up Down Natural" },
  { value: "unibrowNatural", label: "Unibrow Natural" },
  { value: "flatNatural", label: "Flat Natural" },
  { value: "frownNatural", label: "Frown Natural" },
  { value: "sadConcerned", label: "Sad Concerned" },
  { value: "sadConcernedNatural", label: "Sad Concerned Natural" },
];

export const EYES_OPTIONS: AvatarOption[] = [
  { value: "default", label: "Default" },
  { value: "happy", label: "Happy" },
  { value: "surprised", label: "Surprised" },
  { value: "squint", label: "Squint" },
  { value: "wink", label: "Wink" },
  { value: "winkWacky", label: "Wink Wacky" },
  { value: "hearts", label: "Hearts" },
  { value: "closed", label: "Closed" },
  { value: "side", label: "Side" },
  { value: "cry", label: "Cry" },
  { value: "eyeRoll", label: "Eye Roll" },
  { value: "xDizzy", label: "Dizzy" },
];

export const FACIAL_HAIR_OPTIONS: AvatarOption[] = [
  { value: "", label: "None" },
  { value: "beardLight", label: "Light Beard" },
  { value: "beardMedium", label: "Medium Beard" },
  { value: "beardMajestic", label: "Majestic Beard" },
  { value: "moustacheFancy", label: "Fancy Moustache" },
  { value: "moustacheMagnum", label: "Magnum Moustache" },
];

export const MOUTH_OPTIONS: AvatarOption[] = [
  { value: "default", label: "Default" },
  { value: "smile", label: "Smile" },
  { value: "serious", label: "Serious" },
  { value: "twinkle", label: "Twinkle" },
  { value: "grimace", label: "Grimace" },
  { value: "screamOpen", label: "Scream Open" },
  { value: "tongue", label: "Tongue" },
  { value: "sad", label: "Sad" },
  { value: "eating", label: "Eating" },
  { value: "disbelief", label: "Disbelief" },
  { value: "concerned", label: "Concerned" },
  { value: "vomit", label: "Vomit" },
];

export const SKIN_COLOR_OPTIONS: AvatarOption[] = [
  { value: "ffdbb4", label: "Light" },
  { value: "edb98a", label: "Light Tan" },
  { value: "f8d25c", label: "Yellow" },
  { value: "fd9841", label: "Warm" },
  { value: "d08b5b", label: "Tan" },
  { value: "ae5d29", label: "Brown" },
  { value: "614335", label: "Dark Brown" },
];

export const HAIR_COLOR_OPTIONS: AvatarOption[] = [
  { value: "2c1b18", label: "Black" },
  { value: "4a312c", label: "Dark Brown" },
  { value: "724133", label: "Brown" },
  { value: "a55728", label: "Auburn" },
  { value: "b58143", label: "Caramel" },
  { value: "c93305", label: "Red" },
  { value: "d6b370", label: "Blonde" },
  { value: "e8e1e1", label: "Platinum" },
  { value: "f59797", label: "Pastel Pink" },
];

export const CLOTHES_COLOR_OPTIONS: AvatarOption[] = [
  { value: "3c4f5c", label: "Dark Teal" },
  { value: "65c9ff", label: "Sky Blue" },
  { value: "25557c", label: "Navy" },
  { value: "e6e6e6", label: "Light Gray" },
  { value: "929598", label: "Gray" },
  { value: "a7ffc4", label: "Mint" },
  { value: "ff5c5c", label: "Red" },
  { value: "ff488e", label: "Hot Pink" },
  { value: "ffafb9", label: "Pink" },
  { value: "ffffb1", label: "Yellow" },
];

export const FACIAL_HAIR_COLOR_OPTIONS: AvatarOption[] = [
  { value: "2c1b18", label: "Black" },
  { value: "4a312c", label: "Dark Brown" },
  { value: "724133", label: "Brown" },
  { value: "a55728", label: "Auburn" },
  { value: "b58143", label: "Caramel" },
  { value: "c93305", label: "Red" },
  { value: "d6b370", label: "Blonde" },
  { value: "e8e1e1", label: "Platinum" },
  { value: "f59797", label: "Pastel Pink" },
];

export const BACKGROUND_COLOR_OPTIONS: AvatarOption[] = [
  { value: "b6e3f4", label: "Soft Blue" },
  { value: "c0aede", label: "Soft Purple" },
  { value: "d1d4f9", label: "Periwinkle" },
  { value: "ffd5dc", label: "Soft Pink" },
  { value: "ffdfbf", label: "Peach" },
  { value: "65c9ff", label: "Sky Blue" },
  { value: "1a1a2e", label: "Dark Navy" },
  { value: "2d3436", label: "Dark" },
  { value: "0abf53", label: "Emerald" },
  { value: "f368e0", label: "Magenta" },
];

/** Consolidated map of all option arrays keyed by AvatarConfig field name. */
export const AVATAR_OPTIONS: Record<keyof AvatarConfig, AvatarOption[]> = {
  top: TOP_OPTIONS,
  accessories: ACCESSORIES_OPTIONS,
  clothing: CLOTHING_OPTIONS,
  clothingGraphic: CLOTHING_GRAPHIC_OPTIONS,
  eyebrows: EYEBROWS_OPTIONS,
  eyes: EYES_OPTIONS,
  facialHair: FACIAL_HAIR_OPTIONS,
  mouth: MOUTH_OPTIONS,
  skinColor: SKIN_COLOR_OPTIONS,
  hairColor: HAIR_COLOR_OPTIONS,
  clothesColor: CLOTHES_COLOR_OPTIONS,
  facialHairColor: FACIAL_HAIR_COLOR_OPTIONS,
  backgroundColor: BACKGROUND_COLOR_OPTIONS,
};

// ---- Default Config -------------------------------------------------------

export const DEFAULT_CONFIG: AvatarConfig = {
  top: "shortFlat",
  accessories: "",
  clothing: "blazerAndShirt",
  clothingGraphic: "",
  eyebrows: "default",
  eyes: "default",
  facialHair: "",
  mouth: "smile",
  skinColor: "ffdbb4",
  hairColor: "4a312c",
  clothesColor: "25557c",
  facialHairColor: "4a312c",
  backgroundColor: "b6e3f4",
};

// ---- URL Helpers ----------------------------------------------------------

const DICEBEAR_BASE = "https://api.dicebear.com/9.x/avataaars/svg";

/**
 * Build a DiceBear avataaars SVG URL from the given config.
 * Parameters with empty / blank values are omitted.
 * When accessories or facialHair are "none"/empty, set their probability to 0
 * so DiceBear does not randomize them.
 */
export function buildAvatarUrl(config: AvatarConfig): string {
  const params = new URLSearchParams();

  // Enum params
  if (config.top) params.set("top", config.top);
  if (config.eyes) params.set("eyes", config.eyes);
  if (config.eyebrows) params.set("eyebrows", config.eyebrows);
  if (config.mouth) params.set("mouth", config.mouth);
  if (config.clothing) params.set("clothing", config.clothing);
  if (config.clothingGraphic) params.set("clothingGraphic", config.clothingGraphic);

  // Accessories: if empty, set probability to 0
  if (config.accessories && config.accessories.trim() !== "") {
    params.set("accessories", config.accessories);
    params.set("accessoriesProbability", "100");
  } else {
    params.set("accessoriesProbability", "0");
  }

  // Facial hair: if empty, set probability to 0
  if (config.facialHair && config.facialHair.trim() !== "") {
    params.set("facialHair", config.facialHair);
    params.set("facialHairProbability", "100");
  } else {
    params.set("facialHairProbability", "0");
  }

  // Hex color params (no # prefix)
  if (config.skinColor) params.set("skinColor", config.skinColor);
  if (config.hairColor) params.set("hairColor", config.hairColor);
  if (config.clothesColor) params.set("clothesColor", config.clothesColor);
  if (config.facialHairColor) params.set("facialHairColor", config.facialHairColor);
  if (config.backgroundColor) params.set("backgroundColor", config.backgroundColor);

  const qs = params.toString();
  return qs ? `${DICEBEAR_BASE}?${qs}` : DICEBEAR_BASE;
}

/**
 * Parse a DiceBear avataaars URL back into an AvatarConfig.
 * Returns null if the URL is not a valid avataaars URL.
 */
export function parseAvatarUrl(url: string): AvatarConfig | null {
  try {
    const parsed = new URL(url);

    // Verify it is a DiceBear avataaars URL
    if (
      !parsed.hostname.includes("dicebear.com") ||
      !parsed.pathname.includes("/avataaars/")
    ) {
      return null;
    }

    const p = parsed.searchParams;

    return {
      top: p.get("top") ?? "",
      accessories: p.get("accessories") ?? "",
      clothing: p.get("clothing") ?? "",
      clothingGraphic: p.get("clothingGraphic") ?? "",
      eyebrows: p.get("eyebrows") ?? "",
      eyes: p.get("eyes") ?? "",
      facialHair: p.get("facialHair") ?? "",
      mouth: p.get("mouth") ?? "",
      skinColor: p.get("skinColor") ?? "",
      hairColor: p.get("hairColor") ?? "",
      clothesColor: p.get("clothesColor") ?? "",
      facialHairColor: p.get("facialHairColor") ?? "",
      backgroundColor: p.get("backgroundColor") ?? "",
    };
  } catch {
    return null;
  }
}

// ---- Randomization --------------------------------------------------------

/** Pick a random element from an array. */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate a fully randomized AvatarConfig. */
export function randomizeConfig(): AvatarConfig {
  return {
    top: pickRandom(TOP_OPTIONS).value,
    accessories: pickRandom(ACCESSORIES_OPTIONS).value,
    clothing: pickRandom(CLOTHING_OPTIONS).value,
    clothingGraphic: pickRandom(CLOTHING_GRAPHIC_OPTIONS).value,
    eyebrows: pickRandom(EYEBROWS_OPTIONS).value,
    eyes: pickRandom(EYES_OPTIONS).value,
    facialHair: pickRandom(FACIAL_HAIR_OPTIONS).value,
    mouth: pickRandom(MOUTH_OPTIONS).value,
    skinColor: pickRandom(SKIN_COLOR_OPTIONS).value,
    hairColor: pickRandom(HAIR_COLOR_OPTIONS).value,
    clothesColor: pickRandom(CLOTHES_COLOR_OPTIONS).value,
    facialHairColor: pickRandom(FACIAL_HAIR_COLOR_OPTIONS).value,
    backgroundColor: pickRandom(BACKGROUND_COLOR_OPTIONS).value,
  };
}

/** Section groups that map a friendly section name to AvatarConfig keys. */
const SECTION_KEYS: Record<string, (keyof AvatarConfig)[]> = {
  face: ["eyes", "eyebrows", "mouth", "skinColor"],
  hair: ["top", "hairColor", "facialHair", "facialHairColor"],
  outfit: ["clothing", "clothesColor", "clothingGraphic"],
  extras: ["accessories"],
  vibe: ["eyes", "eyebrows", "mouth"],
};

/**
 * Randomize only one section of an AvatarConfig.
 * Supported sections: face, hair, outfit, extras, vibe.
 * Returns a new config object; the original is not mutated.
 */
export function randomizeSection(
  config: AvatarConfig,
  section: string,
): AvatarConfig {
  const keys = SECTION_KEYS[section];
  if (!keys) {
    return { ...config };
  }

  const next = { ...config };
  for (const key of keys) {
    const options = AVATAR_OPTIONS[key];
    next[key] = pickRandom(options).value;
  }
  return next;
}

// ---- Presets --------------------------------------------------------------

export const PRESETS: AvatarPreset[] = [
  {
    name: "High Roller",
    config: {
      top: "shortFlat",
      accessories: "sunglasses",
      clothing: "blazerAndShirt",
      clothingGraphic: "",
      eyebrows: "raisedExcited",
      eyes: "default",
      facialHair: "",
      mouth: "twinkle",
      skinColor: "ffdbb4",
      hairColor: "2c1b18",
      clothesColor: "3c4f5c",
      facialHairColor: "2c1b18",
      backgroundColor: "ffdfbf",
    },
  },
  {
    name: "Chaos Goblin",
    config: {
      top: "shaggy",
      accessories: "",
      clothing: "hoodie",
      clothingGraphic: "",
      eyebrows: "angry",
      eyes: "xDizzy",
      facialHair: "",
      mouth: "tongue",
      skinColor: "ffdbb4",
      hairColor: "c93305",
      clothesColor: "a7ffc4",
      facialHairColor: "c93305",
      backgroundColor: "ff5c5c",
    },
  },
  {
    name: "Old School Grinder",
    config: {
      top: "shortCurly",
      accessories: "prescription01",
      clothing: "collarAndSweater",
      clothingGraphic: "",
      eyebrows: "default",
      eyes: "default",
      facialHair: "beardLight",
      mouth: "serious",
      skinColor: "d08b5b",
      hairColor: "e8e1e1",
      clothesColor: "929598",
      facialHairColor: "e8e1e1",
      backgroundColor: "0abf53",
    },
  },
  {
    name: "Silent Assassin",
    config: {
      top: "shortFlat",
      accessories: "wayfarers",
      clothing: "blazerAndSweater",
      clothingGraphic: "",
      eyebrows: "flatNatural",
      eyes: "squint",
      facialHair: "",
      mouth: "serious",
      skinColor: "ae5d29",
      hairColor: "2c1b18",
      clothesColor: "3c4f5c",
      facialHairColor: "2c1b18",
      backgroundColor: "2d3436",
    },
  },
  {
    name: "Rich Villain",
    config: {
      top: "shortWaved",
      accessories: "",
      clothing: "blazerAndShirt",
      clothingGraphic: "",
      eyebrows: "raisedExcited",
      eyes: "default",
      facialHair: "moustacheFancy",
      mouth: "twinkle",
      skinColor: "ffdbb4",
      hairColor: "2c1b18",
      clothesColor: "3c4f5c",
      facialHairColor: "2c1b18",
      backgroundColor: "c0aede",
    },
  },
  {
    name: "Sleepy Degenerate",
    config: {
      top: "shaggy",
      accessories: "",
      clothing: "hoodie",
      clothingGraphic: "",
      eyebrows: "default",
      eyes: "closed",
      facialHair: "",
      mouth: "default",
      skinColor: "ffdbb4",
      hairColor: "4a312c",
      clothesColor: "929598",
      facialHairColor: "4a312c",
      backgroundColor: "b6e3f4",
    },
  },
  {
    name: "Casino Grandpa",
    config: {
      top: "shortRound",
      accessories: "",
      clothing: "shirtCrewNeck",
      clothingGraphic: "",
      eyebrows: "default",
      eyes: "happy",
      facialHair: "beardMajestic",
      mouth: "smile",
      skinColor: "d08b5b",
      hairColor: "e8e1e1",
      clothesColor: "ff5c5c",
      facialHairColor: "e8e1e1",
      backgroundColor: "ffdfbf",
    },
  },
  {
    name: "Lucky Maniac",
    config: {
      top: "bigHair",
      accessories: "round",
      clothing: "graphicShirt",
      clothingGraphic: "diamond",
      eyebrows: "raisedExcited",
      eyes: "surprised",
      facialHair: "",
      mouth: "screamOpen",
      skinColor: "f8d25c",
      hairColor: "d6b370",
      clothesColor: "ff488e",
      facialHairColor: "d6b370",
      backgroundColor: "f368e0",
    },
  },
];

// ---- Vibe Combos ----------------------------------------------------------

export const VIBE_COMBOS: VibeCombo[] = [
  { name: "Confident", eyes: "default", eyebrows: "raisedExcited", mouth: "smile" },
  { name: "Nervous", eyes: "surprised", eyebrows: "upDown", mouth: "grimace" },
  { name: "Maniac", eyes: "xDizzy", eyebrows: "angry", mouth: "screamOpen" },
  { name: "Chill", eyes: "happy", eyebrows: "default", mouth: "twinkle" },
  { name: "Angry", eyes: "squint", eyebrows: "angry", mouth: "serious" },
  { name: "Cocky", eyes: "wink", eyebrows: "raisedExcited", mouth: "twinkle" },
  { name: "Heartbreaker", eyes: "hearts", eyebrows: "flatNatural", mouth: "smile" },
  { name: "Crying", eyes: "cry", eyebrows: "sadConcerned", mouth: "sad" },
];

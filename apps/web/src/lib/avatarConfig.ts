// ---------------------------------------------------------------------------
// Avatar Configuration Module
// Core data layer for the poker avatar builder using DiceBear avataaars style.
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export interface AvatarConfig {
  top: string;
  hairColor: string;
  accessories: string;
  accessoriesColor: string;
  facialHair: string;
  facialHairColor: string;
  clothe: string;
  clotheColor: string;
  eyes: string;
  eyebrow: string;
  mouth: string;
  skinColor: string;
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
  eyebrow: string;
  mouth: string;
}

// ---- Option Arrays --------------------------------------------------------

export const TOP_OPTIONS: AvatarOption[] = [
  { value: "shortFlat", label: "Short Flat" },
  { value: "shortCurly", label: "Short Curly" },
  { value: "shortRound", label: "Short Round" },
  { value: "shortWaved", label: "Short Waved" },
  { value: "longButNotTooLong", label: "Medium Length" },
  { value: "bigHair", label: "Long Big Hair" },
  { value: "bob", label: "Bob" },
  { value: "bun", label: "Bun" },
  { value: "curly", label: "Curly" },
  { value: "curvy", label: "Curvy" },
  { value: "dreads01", label: "Dreads" },
  { value: "frida", label: "Frida" },
  { value: "mohawk", label: "Mohawk" },
  { value: "shaggy", label: "Shaggy" },
  { value: "shaggymullet", label: "Shaggy Mullet" },
  { value: "straightAndStrand", label: "Straight & Strand" },
];

export const HAIR_COLOR_OPTIONS: AvatarOption[] = [
  { value: "auburn", label: "Auburn" },
  { value: "black", label: "Black" },
  { value: "blonde", label: "Blonde" },
  { value: "brown", label: "Brown" },
  { value: "brownDark", label: "Dark Brown" },
  { value: "red", label: "Red" },
  { value: "platinum", label: "Platinum" },
  { value: "pastelPink", label: "Pastel Pink" },
  { value: "gray", label: "Gray" },
];

export const ACCESSORIES_OPTIONS: AvatarOption[] = [
  { value: "", label: "None" },
  { value: "prescription01", label: "Prescription 01" },
  { value: "prescription02", label: "Prescription 02" },
  { value: "round", label: "Round Glasses" },
  { value: "sunglasses", label: "Sunglasses" },
  { value: "wayfarers", label: "Wayfarers" },
];

export const ACCESSORIES_COLOR_OPTIONS: AvatarOption[] = [
  { value: "#000000", label: "Black" },
  { value: "#4A4A4A", label: "Dark Gray" },
  { value: "#8B4513", label: "Brown" },
  { value: "#C0C0C0", label: "Silver" },
  { value: "#FFD700", label: "Gold" },
  { value: "#1E3A5F", label: "Navy" },
  { value: "#8B0000", label: "Dark Red" },
];

export const FACIAL_HAIR_OPTIONS: AvatarOption[] = [
  { value: "", label: "None" },
  { value: "beardLight", label: "Light Beard" },
  { value: "beardMedium", label: "Medium Beard" },
  { value: "beardMajestic", label: "Majestic Beard" },
  { value: "moustacheFancy", label: "Fancy Moustache" },
  { value: "moustacheMagnum", label: "Magnum Moustache" },
];

export const FACIAL_HAIR_COLOR_OPTIONS: AvatarOption[] = [
  { value: "auburn", label: "Auburn" },
  { value: "black", label: "Black" },
  { value: "blonde", label: "Blonde" },
  { value: "brown", label: "Brown" },
  { value: "brownDark", label: "Dark Brown" },
  { value: "red", label: "Red" },
  { value: "platinum", label: "Platinum" },
  { value: "gray", label: "Gray" },
];

export const CLOTHE_OPTIONS: AvatarOption[] = [
  { value: "blazerAndShirt", label: "Blazer & Shirt" },
  { value: "blazerAndSweater", label: "Blazer & Sweater" },
  { value: "collarAndSweater", label: "Collar & Sweater" },
  { value: "hoodie", label: "Hoodie" },
  { value: "overall", label: "Overall" },
  { value: "shirtCrewNeck", label: "Crew Neck Shirt" },
  { value: "shirtVNeck", label: "V-Neck Shirt" },
  { value: "graphicShirt", label: "Graphic Shirt" },
];

export const CLOTHE_COLOR_OPTIONS: AvatarOption[] = [
  { value: "#DC2626", label: "Red" },
  { value: "#2563EB", label: "Blue" },
  { value: "#16A34A", label: "Green" },
  { value: "#171717", label: "Black" },
  { value: "#FFFFFF", label: "White" },
  { value: "#6B7280", label: "Gray" },
  { value: "#1E3A5F", label: "Navy" },
  { value: "#EC4899", label: "Pink" },
  { value: "#7C3AED", label: "Purple" },
  { value: "#D97706", label: "Gold" },
];

export const EYES_OPTIONS: AvatarOption[] = [
  { value: "default", label: "Default" },
  { value: "happy", label: "Happy" },
  { value: "surprised", label: "Surprised" },
  { value: "squint", label: "Squint" },
  { value: "wink", label: "Wink" },
  { value: "hearts", label: "Hearts" },
  { value: "dizzy", label: "Dizzy" },
  { value: "close", label: "Closed" },
  { value: "side", label: "Side" },
  { value: "cry", label: "Cry" },
  { value: "roll", label: "Eye Roll" },
];

export const EYEBROW_OPTIONS: AvatarOption[] = [
  { value: "default", label: "Default" },
  { value: "raisedExcited", label: "Raised Excited" },
  { value: "angry", label: "Angry" },
  { value: "angryNatural", label: "Angry Natural" },
  { value: "upDown", label: "Up Down" },
  { value: "unibrowNatural", label: "Unibrow Natural" },
  { value: "flatNatural", label: "Flat Natural" },
  { value: "sadConcerned", label: "Sad Concerned" },
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
];

export const SKIN_COLOR_OPTIONS: AvatarOption[] = [
  { value: "light", label: "Light" },
  { value: "pale", label: "Pale" },
  { value: "tanned", label: "Tanned" },
  { value: "yellow", label: "Yellow" },
  { value: "brown", label: "Brown" },
  { value: "darkBrown", label: "Dark Brown" },
  { value: "black", label: "Black" },
];

export const BACKGROUND_COLOR_OPTIONS: AvatarOption[] = [
  { value: "#A8D8EA", label: "Soft Blue" },
  { value: "#A8E6CF", label: "Soft Green" },
  { value: "#C3AED6", label: "Soft Purple" },
  { value: "#FFB7B2", label: "Soft Pink" },
  { value: "#FFEAA7", label: "Warm Yellow" },
  { value: "#B2BEC3", label: "Cool Gray" },
  { value: "#2D3436", label: "Dark" },
  { value: "#1B2838", label: "Navy" },
  { value: "#0B3D2E", label: "Emerald" },
  { value: "#E17055", label: "Coral" },
];

/** Consolidated map of all option arrays keyed by AvatarConfig field name. */
export const AVATAR_OPTIONS: Record<keyof AvatarConfig, AvatarOption[]> = {
  top: TOP_OPTIONS,
  hairColor: HAIR_COLOR_OPTIONS,
  accessories: ACCESSORIES_OPTIONS,
  accessoriesColor: ACCESSORIES_COLOR_OPTIONS,
  facialHair: FACIAL_HAIR_OPTIONS,
  facialHairColor: FACIAL_HAIR_COLOR_OPTIONS,
  clothe: CLOTHE_OPTIONS,
  clotheColor: CLOTHE_COLOR_OPTIONS,
  eyes: EYES_OPTIONS,
  eyebrow: EYEBROW_OPTIONS,
  mouth: MOUTH_OPTIONS,
  skinColor: SKIN_COLOR_OPTIONS,
  backgroundColor: BACKGROUND_COLOR_OPTIONS,
};

// ---- Default Config -------------------------------------------------------

export const DEFAULT_CONFIG: AvatarConfig = {
  top: "shortFlat",
  hairColor: "brown",
  accessories: "",
  accessoriesColor: "#000000",
  facialHair: "",
  facialHairColor: "brown",
  clothe: "blazerAndShirt",
  clotheColor: "#2563EB",
  eyes: "default",
  eyebrow: "default",
  mouth: "smile",
  skinColor: "light",
  backgroundColor: "#A8D8EA",
};

// ---- URL Helpers ----------------------------------------------------------

const DICEBEAR_BASE = "https://api.dicebear.com/9.x/avataaars/svg";

/**
 * Build a DiceBear avataaars SVG URL from the given config.
 * Parameters with empty / blank values are omitted.
 */
export function buildAvatarUrl(config: AvatarConfig): string {
  const params = new URLSearchParams();

  const entries: [string, string][] = [
    ["top", config.top],
    ["hairColor", config.hairColor],
    ["accessories", config.accessories],
    ["accessoriesColor", config.accessoriesColor],
    ["facialHair", config.facialHair],
    ["facialHairColor", config.facialHairColor],
    ["clothe", config.clothe],
    ["clotheColor", config.clotheColor],
    ["eyes", config.eyes],
    ["eyebrow", config.eyebrow],
    ["mouth", config.mouth],
    ["skinColor", config.skinColor],
    ["backgroundColor", config.backgroundColor],
  ];

  for (const [key, value] of entries) {
    if (value && value.trim() !== "") {
      params.set(key, value);
    }
  }

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
      hairColor: p.get("hairColor") ?? "",
      accessories: p.get("accessories") ?? "",
      accessoriesColor: p.get("accessoriesColor") ?? "",
      facialHair: p.get("facialHair") ?? "",
      facialHairColor: p.get("facialHairColor") ?? "",
      clothe: p.get("clothe") ?? "",
      clotheColor: p.get("clotheColor") ?? "",
      eyes: p.get("eyes") ?? "",
      eyebrow: p.get("eyebrow") ?? "",
      mouth: p.get("mouth") ?? "",
      skinColor: p.get("skinColor") ?? "",
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
    hairColor: pickRandom(HAIR_COLOR_OPTIONS).value,
    accessories: pickRandom(ACCESSORIES_OPTIONS).value,
    accessoriesColor: pickRandom(ACCESSORIES_COLOR_OPTIONS).value,
    facialHair: pickRandom(FACIAL_HAIR_OPTIONS).value,
    facialHairColor: pickRandom(FACIAL_HAIR_COLOR_OPTIONS).value,
    clothe: pickRandom(CLOTHE_OPTIONS).value,
    clotheColor: pickRandom(CLOTHE_COLOR_OPTIONS).value,
    eyes: pickRandom(EYES_OPTIONS).value,
    eyebrow: pickRandom(EYEBROW_OPTIONS).value,
    mouth: pickRandom(MOUTH_OPTIONS).value,
    skinColor: pickRandom(SKIN_COLOR_OPTIONS).value,
    backgroundColor: pickRandom(BACKGROUND_COLOR_OPTIONS).value,
  };
}

/** Section groups that map a friendly section name to AvatarConfig keys. */
const SECTION_KEYS: Record<string, (keyof AvatarConfig)[]> = {
  face: ["eyes", "eyebrow", "mouth", "skinColor"],
  hair: ["top", "hairColor", "facialHair", "facialHairColor"],
  outfit: ["clothe", "clotheColor"],
  extras: ["accessories", "accessoriesColor"],
  vibe: ["eyes", "eyebrow", "mouth"],
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
      hairColor: "black",
      accessories: "sunglasses",
      accessoriesColor: "#000000",
      facialHair: "",
      facialHairColor: "black",
      clothe: "blazerAndShirt",
      clotheColor: "#171717",
      eyes: "default",
      eyebrow: "raisedExcited",
      mouth: "twinkle",
      skinColor: "light",
      backgroundColor: "#D97706",
    },
  },
  {
    name: "Chaos Goblin",
    config: {
      top: "shaggy",
      hairColor: "red",
      accessories: "",
      accessoriesColor: "#000000",
      facialHair: "",
      facialHairColor: "brown",
      clothe: "hoodie",
      clotheColor: "#16A34A",
      eyes: "dizzy",
      eyebrow: "angry",
      mouth: "tongue",
      skinColor: "pale",
      backgroundColor: "#DC2626",
    },
  },
  {
    name: "Old School Grinder",
    config: {
      top: "shortCurly",
      hairColor: "gray",
      accessories: "prescription01",
      accessoriesColor: "#4A4A4A",
      facialHair: "beardLight",
      facialHairColor: "gray",
      clothe: "collarAndSweater",
      clotheColor: "#6B7280",
      eyes: "default",
      eyebrow: "default",
      mouth: "serious",
      skinColor: "tanned",
      backgroundColor: "#0B3D2E",
    },
  },
  {
    name: "Silent Assassin",
    config: {
      top: "shortFlat",
      hairColor: "black",
      accessories: "wayfarers",
      accessoriesColor: "#000000",
      facialHair: "",
      facialHairColor: "black",
      clothe: "blazerAndSweater",
      clotheColor: "#171717",
      eyes: "squint",
      eyebrow: "flatNatural",
      mouth: "serious",
      skinColor: "brown",
      backgroundColor: "#2D3436",
    },
  },
  {
    name: "Rich Villain",
    config: {
      top: "shortWaved",
      hairColor: "black",
      accessories: "",
      accessoriesColor: "#000000",
      facialHair: "moustacheFancy",
      facialHairColor: "black",
      clothe: "blazerAndShirt",
      clotheColor: "#7C3AED",
      eyes: "default",
      eyebrow: "raisedExcited",
      mouth: "twinkle",
      skinColor: "light",
      backgroundColor: "#C3AED6",
    },
  },
  {
    name: "Sleepy Degenerate",
    config: {
      top: "shaggy",
      hairColor: "brownDark",
      accessories: "",
      accessoriesColor: "#000000",
      facialHair: "",
      facialHairColor: "brown",
      clothe: "hoodie",
      clotheColor: "#6B7280",
      eyes: "close",
      eyebrow: "default",
      mouth: "default",
      skinColor: "pale",
      backgroundColor: "#A8D8EA",
    },
  },
  {
    name: "Casino Grandpa",
    config: {
      top: "shortRound",
      hairColor: "gray",
      accessories: "",
      accessoriesColor: "#000000",
      facialHair: "beardMajestic",
      facialHairColor: "gray",
      clothe: "shirtCrewNeck",
      clotheColor: "#DC2626",
      eyes: "happy",
      eyebrow: "default",
      mouth: "smile",
      skinColor: "tanned",
      backgroundColor: "#FFEAA7",
    },
  },
  {
    name: "Lucky Maniac",
    config: {
      top: "bigHair",
      hairColor: "blonde",
      accessories: "round",
      accessoriesColor: "#FFD700",
      facialHair: "",
      facialHairColor: "blonde",
      clothe: "graphicShirt",
      clotheColor: "#EC4899",
      eyes: "surprised",
      eyebrow: "raisedExcited",
      mouth: "screamOpen",
      skinColor: "yellow",
      backgroundColor: "#E17055",
    },
  },
];

// ---- Vibe Combos ----------------------------------------------------------

export const VIBE_COMBOS: VibeCombo[] = [
  { name: "Confident", eyes: "default", eyebrow: "raisedExcited", mouth: "smile" },
  { name: "Nervous", eyes: "surprised", eyebrow: "upDown", mouth: "grimace" },
  { name: "Maniac", eyes: "dizzy", eyebrow: "angry", mouth: "screamOpen" },
  { name: "Chill", eyes: "happy", eyebrow: "default", mouth: "twinkle" },
  { name: "Angry", eyes: "squint", eyebrow: "angry", mouth: "serious" },
  { name: "Cocky", eyes: "wink", eyebrow: "raisedExcited", mouth: "twinkle" },
  { name: "Heartbreaker", eyes: "hearts", eyebrow: "flatNatural", mouth: "smile" },
  { name: "Crying", eyes: "cry", eyebrow: "sadConcerned", mouth: "sad" },
];

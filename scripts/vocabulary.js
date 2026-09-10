/**
 * Controlled vocabularies shared by the runtime scorer and the offline data tools.
 *
 * Nothing in here may reference Foundry globals — `tools/` imports this file under
 * plain Node.
 */

/** The standard 5e terrain set. Region terrain is normalized onto exactly these. */
export const TERRAINS = [
  "arctic",
  "coastal",
  "desert",
  "forest",
  "grassland",
  "hill",
  "mountain",
  "swamp",
  "underdark",
  "underwater",
  "urban",
];

/** Region danger tiers, ordered from safest to deadliest. */
export const DANGER_LEVELS = ["low", "medium", "high", "extreme", "deadly"];

/** dnd5e creature types. */
export const CREATURE_TYPES = [
  "aberration",
  "beast",
  "celestial",
  "construct",
  "dragon",
  "elemental",
  "fey",
  "fiend",
  "giant",
  "humanoid",
  "monstrosity",
  "ooze",
  "plant",
  "undead",
];

/**
 * Maps the free-text terrain strings found in the original hand/AI-authored region
 * data onto the controlled set above. Keys are lowercased on lookup.
 *
 * The original 51 regions produced 57 distinct terrain strings, including near
 * duplicates ("Forest"/"Forests"/"Dense Forest") and values that are not terrain at
 * all ("Magical", "Trade Roads"). The latter are listed in NON_TERRAIN_FEATURES and
 * are preserved on the region as `features` rather than discarded.
 */
export const TERRAIN_ALIASES = {
  // coastal
  coastal: "coastal",
  coast: "coastal",
  coves: "coastal",
  "hidden coves": "coastal",
  peninsula: "coastal",
  islands: "coastal",
  island: "coastal",
  lakes: "coastal",

  // grassland
  plains: "grassland",
  grasslands: "grassland",
  steppe: "grassland",
  "open steppe": "grassland",
  "endless grass": "grassland",
  "tall grass": "grassland",
  savanna: "grassland",
  farmland: "grassland",
  farming: "grassland",
  "river valleys": "grassland",
  "river valley": "grassland",
  basin: "grassland",

  // mountain
  mountains: "mountain",
  cliffs: "mountain",
  plateau: "mountain",
  volcanic: "mountain",
  rocky: "mountain",
  canyon: "mountain",

  // hill
  hills: "hill",
  "broken lands": "hill",
  valley: "hill",

  // forest
  forest: "forest",
  forests: "forest",
  "dense forest": "forest",
  jungle: "forest",

  // desert
  desert: "desert",
  "sand dunes": "desert",
  "salt flats": "desert",
  oasis: "desert",
  "rocky wastes": "desert",
  wasteland: "desert",
  "volcanic ash": "desert",

  // swamp
  swamp: "swamp",
  bog: "swamp",
  bogs: "swamp",

  // arctic
  tundra: "arctic",
  glacier: "arctic",
  "frozen lakes": "arctic",

  // urban
  urban: "urban",
  "city-states": "urban",
  "fortified cities": "urban",
  "mining towns": "urban",

  // underdark
  subterranean: "underdark",
  "underground tunnels": "underdark",
};

/**
 * Strings that appeared in the source `terrain` arrays but describe a landmark or
 * flavour rather than a terrain type. Preserved as region `features`.
 */
export const NON_TERRAIN_FEATURES = new Set([
  "ruins",
  "ancient ruins",
  "trade roads",
  "magical",
  "weird",
]);

/**
 * Creature-type affinity per terrain, authored as weight tiers to keep the table
 * readable. Anything unlisted for a terrain scores 0.
 *
 * Deliberately setting-agnostic: this is about what lives in a swamp, not about
 * Faerûn, so a future non-Faerûn region pack reuses it unchanged.
 */
const AFFINITY_TIERS = {
  arctic: {
    3: ["beast", "giant"],
    2: ["monstrosity", "dragon", "elemental", "humanoid"],
    1: ["undead", "fey", "aberration"],
  },
  coastal: {
    3: ["beast", "humanoid", "monstrosity"],
    2: ["dragon", "elemental"],
    1: ["fey", "aberration", "giant", "undead", "plant"],
  },
  desert: {
    3: ["monstrosity", "elemental"],
    2: ["beast", "humanoid", "dragon", "undead"],
    1: ["giant", "construct", "fiend", "aberration"],
  },
  forest: {
    3: ["beast", "fey", "plant"],
    2: ["humanoid", "monstrosity", "giant"],
    1: ["dragon", "undead", "elemental", "celestial"],
  },
  grassland: {
    3: ["beast", "humanoid"],
    2: ["monstrosity", "giant"],
    1: ["dragon", "fey", "undead", "elemental", "plant"],
  },
  hill: {
    3: ["humanoid", "giant"],
    2: ["beast", "monstrosity", "dragon"],
    1: ["undead", "fey", "elemental"],
  },
  mountain: {
    3: ["giant", "dragon"],
    2: ["beast", "humanoid", "monstrosity", "elemental"],
    1: ["undead", "construct", "aberration", "celestial"],
  },
  swamp: {
    3: ["monstrosity", "undead", "plant"],
    2: ["beast", "ooze", "humanoid", "dragon", "fey"],
    1: ["aberration", "giant", "elemental", "fiend"],
  },
  underdark: {
    3: ["aberration", "monstrosity", "undead", "ooze"],
    2: ["humanoid", "beast", "elemental", "fiend"],
    1: ["giant", "dragon", "plant", "construct", "fey"],
  },
  underwater: {
    3: ["beast", "monstrosity"],
    2: ["aberration", "elemental", "humanoid", "dragon"],
    1: ["ooze", "undead", "plant", "fey", "giant"],
  },
  urban: {
    3: ["humanoid"],
    2: ["undead", "fiend", "construct", "beast"],
    1: ["monstrosity", "ooze", "aberration", "celestial", "fey", "dragon"],
  },
};

/** Expanded form: `TERRAIN_TYPE_AFFINITY[terrain][creatureType] -> 0..3`. */
export const TERRAIN_TYPE_AFFINITY = Object.fromEntries(
  Object.entries(AFFINITY_TIERS).map(([terrain, tiers]) => {
    const weights = Object.fromEntries(CREATURE_TYPES.map((t) => [t, 0]));
    for (const [weight, types] of Object.entries(tiers)) {
      for (const type of types) weights[type] = Number(weight);
    }
    return [terrain, weights];
  }),
);

/**
 * CR windows per danger tier. `peak` is the band a region is really "about";
 * `min`/`max` bound what is plausible at all. Scoring falls off between them
 * rather than cutting hard, so a slightly-too-tough monster ranks low instead of
 * vanishing.
 */
export const DANGER_CR_BANDS = {
  low: { min: 0, max: 4, peak: [0, 2] },
  medium: { min: 0, max: 8, peak: [1, 5] },
  high: { min: 2, max: 14, peak: [5, 11] },
  extreme: { min: 6, max: 20, peak: [10, 16] },
  deadly: { min: 8, max: 30, peak: [12, 20] },
};

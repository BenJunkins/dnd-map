/**
 * Region/monster affinity scoring.
 *
 * Pure functions only — no Foundry globals, no DOM. `tools/score-preview.js` and
 * the unit tests import this directly under Node, which is what makes tuning the
 * weights possible without launching Foundry.
 */

import { TERRAIN_TYPE_AFFINITY, DANGER_CR_BANDS } from "./vocabulary.js";

/** Maximum contribution of each signal. Tune here, not inline. */
export const WEIGHTS = {
  signature: 40,
  terrain: 25,
  cr: 20,
  traits: 10,
};

/** Terrains a given movement mode or sense argues for. */
const TRAIT_TERRAIN_HINTS = [
  { key: "swim", terrains: ["underwater", "coastal", "swamp"], label: "swims" },
  { key: "burrow", terrains: ["underdark", "desert"], label: "burrows" },
  { key: "climb", terrains: ["mountain", "hill", "forest"], label: "climbs" },
  { key: "fly", terrains: ["mountain", "coastal"], label: "flies" },
];

/** Sizes that sit awkwardly in tight terrain. */
const CRAMPED_TERRAINS = new Set(["urban", "forest", "underdark"]);
const BULKY_SIZES = new Set(["huge", "grg"]);

/**
 * Reduce a plural noun to something that will match a singular monster name.
 * Intentionally crude — it only has to handle the vocabulary in
 * `dominant_monsters` ("Goblins", "Bandits", "Harpies", "Green Dragons").
 */
export function singularize(term) {
  const word = term.trim().toLowerCase();
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("ss")) return word;
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * True when `haystack` contains `needle` on word boundaries, so that "goblin"
 * matches "Goblin Boss" but not "Hobgoblin".
 */
export function matchesOnWordBoundary(haystack, needle) {
  if (!needle) return false;
  return new RegExp(`\\b${escapeRegExp(needle)}\\b`, "i").test(haystack);
}

/**
 * Does this monster's name match one of the region's signature creatures?
 * Returns the matched term, or null.
 */
export function signatureMatch(monsterName, dominantMonsters = []) {
  const name = String(monsterName ?? "");
  for (const entry of dominantMonsters) {
    const term = singularize(String(entry));
    if (matchesOnWordBoundary(name, term)) return entry;
  }
  return null;
}

/**
 * Best creature-type affinity across the region's terrains, as a 0..1 fraction.
 * A region is scored by its most hospitable terrain, not its average — a coastal
 * forest should welcome both sharks and treants.
 */
export function terrainAffinity(creatureType, terrains = []) {
  if (!creatureType) return { fraction: 0, terrain: null };
  let best = 0;
  let bestTerrain = null;
  for (const terrain of terrains) {
    const weight = TERRAIN_TYPE_AFFINITY[terrain]?.[creatureType] ?? 0;
    if (weight > best) {
      best = weight;
      bestTerrain = terrain;
    }
  }
  return { fraction: best / 3, terrain: bestTerrain };
}

/**
 * How well a CR sits in a region's danger band, as -1..1.
 * Inside `peak` scores 1; between peak and the min/max bounds it falls off
 * linearly; outside the bounds it goes negative in proportion to how far out it
 * is, so an overwhelming monster sinks rather than disappearing.
 */
export function crFit(cr, danger) {
  const band = DANGER_CR_BANDS[danger];
  if (!band || cr === null || cr === undefined || Number.isNaN(cr)) return 0;
  const [peakLow, peakHigh] = band.peak;
  if (cr >= peakLow && cr <= peakHigh) return 1;

  if (cr < peakLow) {
    const span = peakLow - band.min;
    if (span <= 0) return cr < band.min ? -1 : 0;
    if (cr >= band.min) return (cr - band.min) / span;
    return Math.max(-1, -(band.min - cr) / Math.max(span, 1));
  }

  const span = band.max - peakHigh;
  if (span <= 0) return cr > band.max ? -1 : 0;
  if (cr <= band.max) return (band.max - cr) / span;
  return Math.max(-1, -(cr - band.max) / Math.max(span, 1));
}

/**
 * Movement modes and senses that argue for this region's terrain, plus a size
 * penalty for very large creatures in cramped terrain. Returns -1..1.
 */
export function traitFit(monster, terrains = []) {
  const reasons = [];
  const terrainSet = new Set(terrains);
  let hits = 0;

  const movement = monster.movement ?? {};
  for (const hint of TRAIT_TERRAIN_HINTS) {
    const speed = Number(movement[hint.key]) || 0;
    if (speed <= 0) continue;
    const match = hint.terrains.find((t) => terrainSet.has(t));
    if (match) {
      hits += 1;
      reasons.push(`${hint.label} — suits ${match}`);
    }
  }

  const darkvision = Number(monster.senses?.darkvision) || 0;
  const tremorsense = Number(monster.senses?.tremorsense) || 0;
  if (terrainSet.has("underdark") && (darkvision >= 120 || tremorsense > 0)) {
    hits += 1;
    reasons.push("darkvision or tremorsense — suits underdark");
  }

  let fraction = Math.min(hits / 2, 1);

  if (BULKY_SIZES.has(monster.size) && [...terrainSet].some((t) => CRAMPED_TERRAINS.has(t))) {
    fraction -= 0.5;
    reasons.push("very large for this terrain");
  }

  return { fraction: Math.max(-1, Math.min(1, fraction)), reasons };
}

/**
 * Score one monster against one region.
 *
 * @param {object} monster  { name, type, cr, size, movement, senses }
 * @param {object} region   { terrain[], danger, dominant_monsters[] }
 * @returns {{score:number, reasons:string[], signature:boolean}}
 */
export function scoreMonster(monster, region) {
  const reasons = [];
  let score = 0;

  const signature = signatureMatch(monster.name, region.dominant_monsters);
  if (signature) {
    score += WEIGHTS.signature;
    reasons.push(`listed among this region's known threats (${signature})`);
  }

  const affinity = terrainAffinity(monster.type, region.terrain);
  if (affinity.fraction > 0) {
    score += WEIGHTS.terrain * affinity.fraction;
    reasons.push(`${monster.type} suits ${affinity.terrain} terrain`);
  }

  const cr = crFit(monster.cr, region.danger);
  if (cr !== 0) {
    score += WEIGHTS.cr * cr;
    if (cr > 0.5) reasons.push(`CR ${monster.cr} fits a ${region.danger}-danger region`);
    else if (cr < 0) reasons.push(`CR ${monster.cr} is out of band for a ${region.danger}-danger region`);
  }

  const traits = traitFit(monster, region.terrain);
  if (traits.fraction !== 0) {
    score += WEIGHTS.traits * traits.fraction;
    reasons.push(...traits.reasons);
  }

  return {
    score: Math.round(score * 100) / 100,
    reasons,
    signature: Boolean(signature),
  };
}

/**
 * Score every candidate and return them ranked, highest first.
 * Ties break toward signature matches, then alphabetically, so output is stable.
 */
export function rankMonsters(monsters, region, { limit = null, minScore = 0 } = {}) {
  const scored = monsters
    .map((monster) => ({ monster, ...scoreMonster(monster, region) }))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.signature !== b.signature) return a.signature ? -1 : 1;
      return String(a.monster.name).localeCompare(String(b.monster.name));
    });
  return limit ? scored.slice(0, limit) : scored;
}

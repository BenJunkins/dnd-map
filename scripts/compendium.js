/**
 * Reads candidate monsters out of the compendiums the GM actually has.
 *
 * The module deliberately ships no monster data of its own. Everything offered to
 * a player is resolved from the GM's own packs, which is what lets homebrew and
 * non-SRD content work, and what keeps us from redistributing stat blocks.
 */

import { MODULE_ID, SETTINGS } from "./constants.js";

/**
 * Extra fields pulled into the compendium index so scoring never has to load a
 * full document. Each one costs index size, so keep this list tight.
 */
const INDEX_FIELDS = [
  "system.details.cr",
  "system.details.type.value",
  "system.traits.size",
  "system.attributes.movement",
  "system.attributes.senses",
];

/** Register the extra index fields. Must run before indexes are built. */
export function registerIndexFields() {
  const configured = CONFIG.Actor.compendiumIndexFields;
  for (const field of INDEX_FIELDS) {
    if (!configured.includes(field)) configured.push(field);
  }
}

/** Every Actor-type compendium visible to this client. */
export function actorPacks() {
  return game.packs.filter((pack) => pack.metadata.type === "Actor");
}

/** dnd5e usually stores CR as a number, but tolerate "1/4" and friends. */
export function parseCR(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text.includes("/")) {
    const [num, den] = text.split("/").map(Number);
    return den ? num / den : null;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Shape a compendium index entry into the profile the scorer expects. */
function toProfile(entry, pack) {
  const system = entry.system ?? {};
  return {
    name: entry.name,
    uuid: `Compendium.${pack.collection}.${entry._id}`,
    img: entry.img,
    type: system.details?.type?.value ?? null,
    cr: parseCR(system.details?.cr),
    size: system.traits?.size ?? null,
    movement: system.attributes?.movement ?? {},
    senses: system.attributes?.senses ?? {},
    packLabel: pack.metadata.label,
    packId: pack.collection,
  };
}

/**
 * Which pack ids the GM explicitly enabled.
 *
 * Pack ids contain a dot ("dnd5e.monsters"), so they must never round-trip
 * through anything with dot-path semantics. The `=== true` check is deliberate:
 * a setting saved in a malformed nested shape by an older build yields no
 * selection at all, which falls back to "use every pack" rather than silently
 * matching nothing.
 */
export function selectedPackIds(enabled) {
  return Object.entries(enabled ?? {})
    .filter(([, on]) => on === true)
    .map(([id]) => id);
}

/** Normalized key for duplicate detection: case- and whitespace-insensitive. */
function nameKey(name) {
  return String(name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** How much usable index data an entry carries, for picking between copies. */
function completeness(monster) {
  return (monster.type ? 1 : 0) + (monster.cr !== null && monster.cr !== undefined ? 1 : 0);
}

/**
 * Collapse the same creature appearing in several compendiums down to one entry.
 *
 * A GM with both the 2014 and 2024 SRD packs enabled has two "Goblin" entries;
 * without this the card lists each of them. Ties are broken toward the entry
 * with the most complete index data, then toward the pack encountered first, so
 * the result is stable across runs.
 */
export function dedupeCandidates(candidates) {
  const best = new Map();
  for (const monster of candidates) {
    const key = nameKey(monster.name);
    if (!key) continue;
    const existing = best.get(key);
    if (!existing || completeness(monster) > completeness(existing)) {
      best.set(key, monster);
    }
  }
  return [...best.values()];
}

/**
 * Build the candidate list from the packs the GM enabled. An empty or unset
 * selection means "every Actor pack".
 */
export async function buildCandidates() {
  const enabled = game.settings.get(MODULE_ID, SETTINGS.SOURCE_PACKS) ?? {};
  const selected = selectedPackIds(enabled);

  const candidates = [];
  for (const pack of actorPacks()) {
    if (selected.length && !selected.includes(pack.collection)) continue;
    let index;
    try {
      index = await pack.getIndex();
    } catch (error) {
      console.warn(`${MODULE_ID} | could not index ${pack.collection}`, error);
      continue;
    }
    for (const entry of index) {
      if (entry.type !== "npc") continue;
      candidates.push(toProfile(entry, pack));
    }
  }
  return dedupeCandidates(candidates);
}

/** Apply the GM's configured filters to an already-ranked list. */
export function applyGMFilters(ranked) {
  const get = (key) => game.settings.get(MODULE_ID, key);
  const crMin = Number(get(SETTINGS.CR_MIN));
  const crMax = Number(get(SETTINGS.CR_MAX));
  const maxResults = Number(get(SETTINGS.MAX_RESULTS)) || 10;
  const allowedTypes = get(SETTINGS.ALLOWED_TYPES) ?? {};
  const restrictTypes = Object.values(allowedTypes).some((v) => v === false);

  return ranked
    .filter(({ monster }) => {
      if (monster.cr !== null) {
        if (Number.isFinite(crMin) && monster.cr < crMin) return false;
        if (Number.isFinite(crMax) && monster.cr > crMax) return false;
      }
      if (restrictTypes && monster.type && allowedTypes[monster.type] === false) return false;
      return true;
    })
    .slice(0, maxResults);
}

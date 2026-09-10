/** Loads the shipped region profiles and exposes lookups. */

import { MODULE_ID } from "./constants.js";

let regions = [];

/** Fetch data/regions.json once, at `ready`. */
export async function loadRegions() {
  const response = await fetch(`modules/${MODULE_ID}/data/regions.json`);
  if (!response.ok) throw new Error(`Could not load region data (HTTP ${response.status})`);
  regions = await response.json();
  return regions;
}

export function allRegions() {
  return regions;
}

export function getRegion(regionId) {
  return regions.find((r) => r.region_id === regionId) ?? null;
}

/** Regions as `{value, label}`, sorted for a <select>. */
export function regionChoices() {
  return regions
    .map((r) => ({ value: r.region_id, label: r.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

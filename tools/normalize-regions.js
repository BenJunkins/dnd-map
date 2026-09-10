#!/usr/bin/env node
/**
 * One-time migration: src/regions.json (hand/AI-authored, free-text) ->
 * data/regions.json (normalized, shipped with the module).
 *
 * Not part of the runtime. Run with:  node tools/normalize-regions.js
 *
 * Fails loudly on any terrain string it does not recognise, so the controlled
 * vocabulary stays closed as regions are added.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TERRAIN_ALIASES,
  NON_TERRAIN_FEATURES,
  DANGER_LEVELS,
} from "../scripts/vocabulary.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputFile = process.argv[2] ?? path.join(root, "tools", "legacy-regions.json");
const outputFile = process.argv[3] ?? path.join(root, "data", "regions.json");

/** Split a terrain array into normalized terrains and preserved features. */
function normalizeTerrain(values, regionName, unmapped) {
  const terrains = new Set();
  const features = new Set();

  for (const raw of values ?? []) {
    const key = String(raw).trim().toLowerCase();
    if (NON_TERRAIN_FEATURES.has(key)) {
      features.add(String(raw).trim());
      continue;
    }
    const mapped = TERRAIN_ALIASES[key];
    if (mapped) terrains.add(mapped);
    else unmapped.push(`${regionName}: "${raw}"`);
  }

  return { terrains: [...terrains].sort(), features: [...features].sort() };
}

function normalizeDanger(value, regionName, warnings) {
  const key = String(value ?? "").trim().toLowerCase();
  if (DANGER_LEVELS.includes(key)) return key;
  warnings.push(`${regionName}: unknown danger_level "${value}", defaulting to "medium"`);
  return "medium";
}

function main() {
  const source = JSON.parse(fs.readFileSync(inputFile, "utf8"));
  const unmapped = [];
  const warnings = [];
  const seenIds = new Set();

  const regions = source.map((feature) => {
    const props = feature.properties ?? {};
    const name = props.name ?? "(unnamed)";

    if (!props.region_id) warnings.push(`${name}: missing region_id`);
    if (seenIds.has(props.region_id)) warnings.push(`${name}: duplicate region_id "${props.region_id}"`);
    seenIds.add(props.region_id);

    const { terrains, features } = normalizeTerrain(props.terrain, name, unmapped);

    return {
      region_id: props.region_id,
      name,
      terrain: terrains,
      climate: (props.climate ?? []).map((c) => String(c).trim().toLowerCase()),
      danger: normalizeDanger(props.danger_level, name, warnings),
      features,
      dominant_monsters: props.dominant_monsters ?? [],
      major_factions: props.major_factions ?? [],
    };
  });

  if (unmapped.length) {
    console.error(`\nUnmapped terrain strings (${unmapped.length}). Add them to TERRAIN_ALIASES or NON_TERRAIN_FEATURES:`);
    for (const entry of unmapped) console.error(`  - ${entry}`);
    process.exit(1);
  }

  for (const warning of warnings) console.warn(`warning: ${warning}`);

  regions.sort((a, b) => a.name.localeCompare(b.name));
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(regions, null, 2)}\n`);

  const terrainCounts = new Map();
  for (const region of regions) {
    for (const t of region.terrain) terrainCounts.set(t, (terrainCounts.get(t) ?? 0) + 1);
  }

  console.log(`Wrote ${regions.length} regions to ${path.relative(root, outputFile)}`);
  console.log(`Terrain vocabulary reduced to ${terrainCounts.size} values:`);
  for (const [terrain, count] of [...terrainCounts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${terrain.padEnd(12)} ${count}`);
  }
}

main();

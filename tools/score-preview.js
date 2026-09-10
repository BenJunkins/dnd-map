#!/usr/bin/env node
/**
 * Print the ranked monster list for a region without launching Foundry.
 *
 * This is the tuning loop for scripts/scoring.js — adjust WEIGHTS or the affinity
 * table, re-run this, and read the reasons. Uses the test fixtures as stand-in
 * compendium data.
 *
 *   node tools/score-preview.js                 # list region ids
 *   node tools/score-preview.js sword_coast     # ranked list for one region
 *   node tools/score-preview.js sword_coast 10  # ...limited to 10 results
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rankMonsters } from "../scripts/scoring.js";
import { SAMPLE_MONSTERS } from "../test/fixtures/monsters.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const regions = JSON.parse(fs.readFileSync(path.join(root, "data", "regions.json"), "utf8"));

const [regionId, limitArg] = process.argv.slice(2);
const limit = Number(limitArg) || 8;

if (!regionId) {
  console.log(`${regions.length} regions:\n`);
  for (const region of regions) {
    console.log(`  ${region.region_id.padEnd(28)} ${region.name}  [${region.danger}] ${region.terrain.join(", ")}`);
  }
  console.log(`\nUsage: node tools/score-preview.js <region_id> [limit]`);
  process.exit(0);
}

const region = regions.find((r) => r.region_id === regionId);
if (!region) {
  console.error(`No region "${regionId}". Run without arguments to list them.`);
  process.exit(1);
}

console.log(`\n${region.name}  [${region.danger}]`);
console.log(`terrain: ${region.terrain.join(", ")}`);
console.log(`known threats: ${region.dominant_monsters.join(", ") || "(none listed)"}`);
console.log(`${"-".repeat(72)}`);

for (const entry of rankMonsters(SAMPLE_MONSTERS, region, { limit })) {
  const mark = entry.signature ? "*" : " ";
  const cr = entry.monster.cr;
  console.log(`${mark} ${String(entry.score).padStart(6)}  ${entry.monster.name.padEnd(24)} ${entry.monster.type.padEnd(12)} CR ${cr}`);
  for (const reason of entry.reasons) console.log(`${" ".repeat(10)}- ${reason}`);
}
console.log(`\n* = listed among the region's known threats\n`);

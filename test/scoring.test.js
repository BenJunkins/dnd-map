import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  singularize,
  matchesOnWordBoundary,
  signatureMatch,
  terrainAffinity,
  crFit,
  scoreMonster,
  rankMonsters,
} from "../scripts/scoring.js";
import { TERRAINS, DANGER_LEVELS } from "../scripts/vocabulary.js";
import { SAMPLE_MONSTERS } from "./fixtures/monsters.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const regions = JSON.parse(fs.readFileSync(path.join(root, "data", "regions.json"), "utf8"));
const byId = Object.fromEntries(regions.map((r) => [r.region_id, r]));
const monster = (name) => SAMPLE_MONSTERS.find((m) => m.name === name);

test("singularize handles the plural forms used in dominant_monsters", () => {
  assert.equal(singularize("Goblins"), "goblin");
  assert.equal(singularize("Bandits"), "bandit");
  assert.equal(singularize("Harpies"), "harpy");
  assert.equal(singularize("Green Dragons"), "green dragon");
  assert.equal(singularize("Undead"), "undead");
});

test("word-boundary matching does not let goblin match hobgoblin", () => {
  assert.ok(matchesOnWordBoundary("Goblin Boss", "goblin"));
  assert.ok(!matchesOnWordBoundary("Hobgoblin", "goblin"));
});

test("signatureMatch finds region signature creatures", () => {
  const swordCoast = byId.sword_coast;
  assert.equal(signatureMatch("Goblin Boss", swordCoast.dominant_monsters), "Goblins");
  assert.equal(signatureMatch("Young Green Dragon", swordCoast.dominant_monsters), "Green Dragons");
  assert.equal(signatureMatch("Aboleth", swordCoast.dominant_monsters), null);
});

test("terrainAffinity picks the region's most hospitable terrain", () => {
  const { fraction, terrain } = terrainAffinity("aberration", ["underdark", "grassland"]);
  assert.equal(terrain, "underdark");
  assert.equal(fraction, 1);
  assert.equal(terrainAffinity("aberration", ["grassland"]).fraction, 0);
});

test("crFit peaks inside the band and goes negative outside it", () => {
  assert.equal(crFit(2, "medium"), 1);
  assert.ok(crFit(8, "medium") <= 0.01);
  assert.ok(crFit(20, "low") < 0);
  assert.equal(crFit(null, "medium"), 0);
  assert.equal(crFit(5, "not-a-tier"), 0);
});

test("a Sword Coast goblin outranks a Sword Coast aboleth", () => {
  const region = byId.sword_coast;
  const goblin = scoreMonster(monster("Goblin"), region);
  const aboleth = scoreMonster(monster("Aboleth"), region);
  assert.ok(goblin.score > aboleth.score, `${goblin.score} should beat ${aboleth.score}`);
  assert.ok(goblin.signature);
});

test("the same aboleth ranks far better in an underdark region", () => {
  const surface = scoreMonster(monster("Aboleth"), byId.sword_coast);
  const underdark = scoreMonster(monster("Aboleth"), {
    region_id: "test_underdark",
    terrain: ["underdark"],
    danger: "high",
    dominant_monsters: [],
  });
  assert.ok(underdark.score > surface.score);
});

test("arctic signatures surface for Icewind Dale", () => {
  const top = rankMonsters(SAMPLE_MONSTERS, byId.icewind_dale, { limit: 5 }).map((e) => e.monster.name);
  assert.ok(top.includes("Frost Giant"), `expected Frost Giant in ${top.join(", ")}`);
  assert.ok(top.includes("Yeti"), `expected Yeti in ${top.join(", ")}`);
  assert.ok(!top.includes("Commoner"));
});

test("swim speed lifts aquatic creatures on a coastal region", () => {
  const coastal = { region_id: "t", terrain: ["coastal"], danger: "medium", dominant_monsters: [] };
  const sahuagin = scoreMonster(monster("Sahuagin"), coastal);
  assert.ok(sahuagin.reasons.some((r) => r.includes("swims")));
});

test("every scored monster carries at least one reason", () => {
  for (const region of regions) {
    for (const entry of rankMonsters(SAMPLE_MONSTERS, region, { limit: 5 })) {
      assert.ok(entry.reasons.length > 0, `${entry.monster.name} in ${region.name} had no reasons`);
    }
  }
});

test("rankMonsters is deterministic and respects limit", () => {
  const a = rankMonsters(SAMPLE_MONSTERS, byId.chult, { limit: 6 }).map((e) => e.monster.name);
  const b = rankMonsters(SAMPLE_MONSTERS, byId.chult, { limit: 6 }).map((e) => e.monster.name);
  assert.deepEqual(a, b);
  assert.equal(a.length, 6);
});

test("normalized region data uses only the controlled vocabularies", () => {
  assert.equal(regions.length, 51);
  for (const region of regions) {
    assert.ok(region.region_id, `${region.name} is missing region_id`);
    assert.ok(DANGER_LEVELS.includes(region.danger), `${region.name} has danger "${region.danger}"`);
    for (const terrain of region.terrain) {
      assert.ok(TERRAINS.includes(terrain), `${region.name} has terrain "${terrain}"`);
    }
    assert.ok(region.terrain.length > 0, `${region.name} has no terrain`);
  }
});

test("region_ids are unique", () => {
  const ids = regions.map((r) => r.region_id);
  assert.equal(new Set(ids).size, ids.length);
});

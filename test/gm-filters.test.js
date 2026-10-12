/**
 * The GM-side half of scripts/compendium.js: reading packs and applying the GM's
 * filters. These are the functions that decide what a player may be told.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  applyGMFilters,
  buildCandidates,
  registerIndexFields,
} from "../scripts/compendium.js";
import { SETTINGS } from "../scripts/constants.js";
import { SAMPLE_MONSTERS } from "./fixtures/monsters.js";
import {
  fakePack,
  indexEntry,
  installFakeFoundry,
} from "./helpers/fake-foundry.js";

const monster = (name) => SAMPLE_MONSTERS.find((m) => m.name === name);
const entries = (...names) => names.map((name) => indexEntry(monster(name)));
const names = (list) => list.map((item) => (item.monster ?? item).name);

/** Every sample monster, already "ranked", in fixture order. */
const ranked = SAMPLE_MONSTERS.map((m) => ({
  monster: m,
  score: 50,
  reasons: [],
  signature: false,
}));

test("with the default settings nothing is filtered and ten results come back", () => {
  installFakeFoundry();
  assert.deepEqual(names(applyGMFilters(ranked)), names(ranked.slice(0, 10)));
});

test("Maximum Results cuts the list", () => {
  installFakeFoundry({ settings: { [SETTINGS.MAX_RESULTS]: 3 } });
  assert.equal(applyGMFilters(ranked).length, 3);
});

test("the CR bounds drop monsters outside them and keep the ones on the edge", () => {
  installFakeFoundry({
    settings: {
      [SETTINGS.CR_MIN]: 1,
      [SETTINGS.CR_MAX]: 5,
      [SETTINGS.MAX_RESULTS]: 50,
    },
  });
  const kept = applyGMFilters(ranked);

  assert.ok(kept.every(({ monster: m }) => m.cr >= 1 && m.cr <= 5));
  assert.ok(
    names(kept).includes("Goblin Boss"),
    "CR 1 is on the lower edge and should stay",
  );
  assert.ok(
    names(kept).includes("Troll"),
    "CR 5 is on the upper edge and should stay",
  );
});

test("an unticked creature type is never reported", () => {
  installFakeFoundry({
    settings: {
      [SETTINGS.ALLOWED_TYPES]: { undead: false, humanoid: true },
      [SETTINGS.MAX_RESULTS]: 50,
    },
  });
  const kept = applyGMFilters(ranked);

  assert.ok(kept.every(({ monster: m }) => m.type !== "undead"));
  assert.ok(names(kept).includes("Goblin"));
  assert.ok(
    names(kept).includes("Giant Ape"),
    "a type the setting never mentions stays allowed",
  );
});

test("the filters run before the cut, so filtered-out monsters do not use up places", () => {
  installFakeFoundry({
    settings: {
      [SETTINGS.ALLOWED_TYPES]: { humanoid: false },
      [SETTINGS.MAX_RESULTS]: 3,
    },
  });
  assert.deepEqual(names(applyGMFilters(ranked)), [
    "Troll",
    "Young Green Dragon",
    "Aboleth",
  ]);
});

test("candidates come from Actor packs, and only their NPCs", async () => {
  installFakeFoundry({
    packs: [
      fakePack("dnd5e.monsters", entries("Goblin", "Troll")),
      fakePack("dnd5e.items", entries("Orc"), { type: "Item" }),
      fakePack("dnd5e.heroes", [
        indexEntry(monster("Bandit"), { type: "character" }),
      ]),
    ],
  });
  const found = await buildCandidates();

  assert.deepEqual(names(found), ["Goblin", "Troll"]);
});

test("a candidate carries what the scorer and the chat card need", async () => {
  installFakeFoundry({
    packs: [
      fakePack("dnd5e.monsters", entries("Sahuagin"), {
        label: "Monsters (SRD)",
      }),
    ],
  });
  const [sahuagin] = await buildCandidates();

  assert.deepEqual(sahuagin, {
    name: "Sahuagin",
    uuid: "Compendium.dnd5e.monsters.sahuagin",
    img: "icons/svg/mystery-man.svg",
    type: "humanoid",
    cr: 0.5,
    size: "med",
    movement: { walk: 30, swim: 40 },
    senses: { darkvision: 120 },
    packLabel: "Monsters (SRD)",
    packId: "dnd5e.monsters",
  });
});

test("only the packs the GM ticked are searched", async () => {
  installFakeFoundry({
    settings: {
      [SETTINGS.SOURCE_PACKS]: {
        "dnd5e.monsters": true,
        "world.homebrew": false,
      },
    },
    packs: [
      fakePack("dnd5e.monsters", entries("Goblin")),
      fakePack("world.homebrew", entries("Aboleth")),
    ],
  });
  assert.deepEqual(names(await buildCandidates()), ["Goblin"]);
});

test("with no pack ticked, every Actor pack is searched", async () => {
  installFakeFoundry({
    settings: {
      [SETTINGS.SOURCE_PACKS]: {
        "dnd5e.monsters": false,
        "world.homebrew": false,
      },
    },
    packs: [
      fakePack("dnd5e.monsters", entries("Goblin")),
      fakePack("world.homebrew", entries("Aboleth")),
    ],
  });
  assert.deepEqual(names(await buildCandidates()), ["Goblin", "Aboleth"]);
});

test("a pack that cannot be indexed is skipped, and the rest still answer", async (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const broken = fakePack("world.broken", []);
  broken.getIndex = async () => {
    throw new Error("index unavailable");
  };
  installFakeFoundry({
    packs: [broken, fakePack("dnd5e.monsters", entries("Goblin"))],
  });

  assert.deepEqual(names(await buildCandidates()), ["Goblin"]);
  assert.equal(warn.mock.callCount(), 1);
});

test("the same creature in two packs is offered once", async () => {
  installFakeFoundry({
    packs: [
      fakePack("dnd5e.monsters", entries("Goblin", "Orc")),
      fakePack("dnd5e.monsters24", entries("Goblin")),
    ],
  });
  assert.deepEqual(names(await buildCandidates()), ["Goblin", "Orc"]);
});

test("registerIndexFields adds each field once, however often it runs", () => {
  installFakeFoundry();
  registerIndexFields();
  const afterFirstRun = [...globalThis.CONFIG.Actor.compendiumIndexFields];
  registerIndexFields();

  assert.ok(afterFirstRun.includes("system.details.cr"));
  assert.deepEqual(
    globalThis.CONFIG.Actor.compendiumIndexFields,
    afterFirstRun,
  );
});

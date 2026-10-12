/**
 * A player's question, start to finish, as the GM's client handles it: read the
 * packs, score, filter, render the card, whisper it.
 *
 * This is the module's one promise to a GM: a player learns only what the filters allow.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { SETTINGS, MODULE_ID } from "../scripts/constants.js";
import { loadRegions } from "../scripts/regions.js";
import { handleQuery, isActiveGM } from "../scripts/socket.js";
import { SAMPLE_MONSTERS } from "./fixtures/monsters.js";
import {
  GM,
  PLAYER,
  fakePack,
  indexEntry,
  installFakeFoundry,
} from "./helpers/fake-foundry.js";

const srdPack = () =>
  fakePack(
    "dnd5e.monsters",
    SAMPLE_MONSTERS.map((m) => indexEntry(m)),
    { label: "Monsters (SRD)" },
  );

/** Have `userId` ask about a region and return what the GM's client sent out. */
async function ask(
  regionId,
  { userId = PLAYER.id, packs = [srdPack()], settings = {} } = {},
) {
  const sent = installFakeFoundry({ packs, settings });
  await loadRegions();
  await handleQuery({ regionId, userId });
  return sent;
}

test("the answer is whispered to the GM and the player who asked, and nobody else", async () => {
  const { messages } = await ask("sword_coast");

  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0].whisper, [GM.id, PLAYER.id]);
});

test("when the GM asks, the whisper goes to the GM alone", async () => {
  const { messages } = await ask("sword_coast", { userId: GM.id });

  assert.deepEqual(messages[0].whisper, [GM.id]);
});

test("with details hidden, the card gives names and nothing more", async () => {
  const { messages } = await ask("sword_coast");
  const card = messages[0].content;

  assert.match(card, /<span>Goblin<\/span>/);
  assert.doesNotMatch(card, /rb-stats/, "the type and CR line is present");
  assert.doesNotMatch(card, /rb-reason/, "the reason line is present");
  assert.doesNotMatch(card, /CR \d|suits|known threats|Monsters \(SRD\)/);
});

test("with details revealed, the card adds type, CR, the reason and the pack", async () => {
  const { messages } = await ask("sword_coast", {
    settings: { [SETTINGS.REVEAL_DETAILS]: true },
  });
  const card = messages[0].content;

  assert.match(card, /giant &middot; CR 5/);
  assert.match(card, /known threats \(Trolls\)/);
  assert.match(card, /Monsters \(SRD\)/);
});

test("the card never names a monster outside the GM's CR bounds", async () => {
  const { messages } = await ask("sword_coast", {
    settings: { [SETTINGS.CR_MAX]: 1, [SETTINGS.MAX_RESULTS]: 50 },
  });
  const card = messages[0].content;

  assert.match(card, /<span>Goblin Boss<\/span>/);
  for (const tooStrong of SAMPLE_MONSTERS.filter((m) => m.cr > 1)) {
    assert.ok(
      !card.includes(`<span>${tooStrong.name}</span>`),
      `${tooStrong.name} is CR ${tooStrong.cr}`,
    );
  }
});

test("a region nothing fits still gets an answer, saying so", async () => {
  const { messages } = await ask("sword_coast", {
    settings: { [SETTINGS.MIN_SCORE]: 100 },
  });

  assert.match(
    messages[0].content,
    /Nothing in the available compendiums fits this region/,
  );
});

test("the message records the region, the asker and whether details were revealed", async () => {
  const { messages } = await ask("icewind_dale");

  assert.equal(messages[0].flavor, "Likely inhabitants of Icewind Dale");
  assert.deepEqual(messages[0].flags[MODULE_ID], {
    regionId: "icewind_dale",
    askedBy: PLAYER.id,
    reveal: false,
  });
});

test("a region id that is not in the shipped list sends nothing", async (t) => {
  t.mock.method(console, "warn", () => {});
  const { messages, warnings } = await ask("not_a_region");

  assert.equal(messages.length, 0);
  assert.equal(warnings.length, 0);
});

test("with no monsters to offer, the GM is warned and nothing is sent", async () => {
  const { messages, warnings } = await ask("sword_coast", { packs: [] });

  assert.equal(messages.length, 0);
  assert.deepEqual(warnings, [
    "Region Bestiary found no NPCs in the selected compendiums.",
  ]);
});

test("isActiveGM is true on the active GM's client and false on a player's", () => {
  installFakeFoundry({ user: GM });
  assert.equal(isActiveGM(), true);

  installFakeFoundry({ user: PLAYER });
  assert.equal(isActiveGM(), false);
});

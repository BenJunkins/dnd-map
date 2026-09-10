import test from "node:test";
import assert from "node:assert/strict";

import { selectedPackIds, parseCR } from "../scripts/compendium.js";

test("pack ids containing dots survive selection intact", () => {
  assert.deepEqual(selectedPackIds({ "dnd5e.monsters": true }), ["dnd5e.monsters"]);
  assert.deepEqual(
    selectedPackIds({ "dnd5e.monsters": true, "world.homebrew": true }),
    ["dnd5e.monsters", "world.homebrew"],
  );
});

test("unticked packs are excluded", () => {
  assert.deepEqual(selectedPackIds({ "dnd5e.monsters": true, "dnd5e.heroes": false }), [
    "dnd5e.monsters",
  ]);
});

test("nothing selected means nothing listed (caller falls back to every pack)", () => {
  assert.deepEqual(selectedPackIds({}), []);
  assert.deepEqual(selectedPackIds(undefined), []);
  assert.deepEqual(selectedPackIds({ "dnd5e.monsters": false }), []);
});

test("a malformed nested setting yields no selection rather than a bogus one", () => {
  // What an expandObject round-trip of "packs.dnd5e.monsters" used to produce.
  // Must not surface "dnd5e" as a selected pack id — that matches no pack and
  // would filter every candidate out.
  assert.deepEqual(selectedPackIds({ dnd5e: { monsters: true } }), []);
  assert.deepEqual(selectedPackIds({ dnd5e: { monsters: true, heroes: false } }), []);
});

test("truthy-but-not-true values do not count as selected", () => {
  assert.deepEqual(selectedPackIds({ a: "yes", b: 1, c: {}, d: true }), ["d"]);
});

test("parseCR handles numbers, fractions and junk", () => {
  assert.equal(parseCR(5), 5);
  assert.equal(parseCR(0), 0);
  assert.equal(parseCR("1/4"), 0.25);
  assert.equal(parseCR("1/8"), 0.125);
  assert.equal(parseCR("3"), 3);
  assert.equal(parseCR(null), null);
  assert.equal(parseCR(undefined), null);
  assert.equal(parseCR("not a cr"), null);
});

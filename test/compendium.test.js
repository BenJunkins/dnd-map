import test from "node:test";
import assert from "node:assert/strict";

import { selectedPackIds, parseCR, dedupeCandidates } from "../scripts/compendium.js";

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

const goblin = (over = {}) => ({
  name: "Goblin",
  type: "humanoid",
  cr: 0.25,
  packLabel: "Monsters (SRD)",
  ...over,
});

test("the same creature in several packs collapses to one entry", () => {
  const out = dedupeCandidates([
    goblin({ packLabel: "Monsters 2014" }),
    goblin({ packLabel: "Monsters 2024" }),
    goblin({ packLabel: "Homebrew" }),
  ]);
  assert.equal(out.length, 1);
});

test("duplicate detection ignores case and surrounding whitespace", () => {
  const out = dedupeCandidates([
    goblin({ name: "Goblin" }),
    goblin({ name: "  goblin  " }),
    goblin({ name: "GOBLIN" }),
  ]);
  assert.equal(out.length, 1);
});

test("distinct creatures are never merged", () => {
  const out = dedupeCandidates([
    goblin({ name: "Goblin" }),
    goblin({ name: "Goblin Boss" }),
    goblin({ name: "Hobgoblin" }),
  ]);
  assert.deepEqual(out.map((m) => m.name).sort(), ["Goblin", "Goblin Boss", "Hobgoblin"]);
});

test("the copy with the most complete index data wins", () => {
  const sparse = goblin({ type: null, cr: null, packLabel: "Sparse" });
  const full = goblin({ packLabel: "Complete" });
  assert.equal(dedupeCandidates([sparse, full])[0].packLabel, "Complete");
  assert.equal(dedupeCandidates([full, sparse])[0].packLabel, "Complete");
});

test("with equally complete copies the first pack encountered wins", () => {
  const out = dedupeCandidates([goblin({ packLabel: "First" }), goblin({ packLabel: "Second" })]);
  assert.equal(out[0].packLabel, "First");
});

test("cr 0 counts as present, not missing", () => {
  const withZero = goblin({ cr: 0, packLabel: "HasZero" });
  const withNull = goblin({ cr: null, packLabel: "HasNull" });
  assert.equal(dedupeCandidates([withNull, withZero])[0].packLabel, "HasZero");
});

test("entries without a usable name are dropped", () => {
  const out = dedupeCandidates([goblin(), goblin({ name: "" }), goblin({ name: "   " })]);
  assert.equal(out.length, 1);
  assert.equal(out[0].name, "Goblin");
});

test("dedupe is stable across repeated runs", () => {
  const input = [goblin({ packLabel: "A" }), goblin({ name: "Orc" }), goblin({ packLabel: "B" })];
  assert.deepEqual(
    dedupeCandidates(input).map((m) => m.name),
    dedupeCandidates(input).map((m) => m.name),
  );
});

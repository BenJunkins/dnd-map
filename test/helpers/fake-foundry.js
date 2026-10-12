/**
 * Just enough of Foundry for the GM-side code to run under Node.
 *
 * Only what scripts/compendium.js and scripts/socket.js actually touch is faked.
 * When one of them starts using something new, its test fails with "x is not a
 * function" or "cannot read properties of undefined". That is the cue to add it here.
 *
 * Templates are rendered with the real Handlebars from the real .hbs files, so a
 * test that reads a chat card is reading what Foundry would put on screen.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Handlebars from "handlebars";

import { MODULE_ID, SETTINGS } from "../../scripts/constants.js";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const strings = JSON.parse(
  fs.readFileSync(path.join(root, "lang", "en.json"), "utf8"),
);

/** Foundry serves the module's files under this prefix. */
const MODULE_URL = `modules/${MODULE_ID}/`;

function readModuleFile(url) {
  if (!url.startsWith(MODULE_URL))
    throw new Error(
      `fake Foundry was asked for "${url}", which is outside the module`,
    );
  return fs.readFileSync(path.join(root, url.slice(MODULE_URL.length)), "utf8");
}

/** The defaults registered in scripts/settings.js. */
const DEFAULT_SETTINGS = {
  [SETTINGS.SOURCE_PACKS]: {},
  [SETTINGS.ALLOWED_TYPES]: {},
  [SETTINGS.CR_MIN]: 0,
  [SETTINGS.CR_MAX]: 30,
  [SETTINGS.MAX_RESULTS]: 10,
  [SETTINGS.MIN_SCORE]: 15,
  [SETTINGS.REVEAL_DETAILS]: false,
};

const localize = (key) => strings[key] ?? key;
const format = (key, data) =>
  localize(key).replace(/\{(\w+)\}/g, (_, name) => data[name]);

const handlebars = Handlebars.create();
handlebars.registerHelper("localize", localize);

export const GM = { id: "gm-user", isGM: true, active: true };
export const PLAYER = { id: "player-user", isGM: false, active: true };

/** A monster from test/fixtures, as the compendium index entry dnd5e would hold for it. */
export function indexEntry(monster, { type = "npc" } = {}) {
  return {
    _id: monster.name.toLowerCase().replaceAll(" ", "-"),
    name: monster.name,
    type,
    img: "icons/svg/mystery-man.svg",
    system: {
      details: { cr: monster.cr, type: { value: monster.type } },
      traits: { size: monster.size },
      attributes: { movement: monster.movement, senses: monster.senses },
    },
  };
}

export function fakePack(
  collection,
  entries,
  { type = "Actor", label = collection } = {},
) {
  return {
    collection,
    metadata: { type, label },
    getIndex: async () => entries,
  };
}

/**
 * Put the fakes in place as globals. Returns what the code under test sent out:
 * chat messages created and warnings shown.
 *
 * Call it at the start of each test, so no test sees another's settings.
 */
export function installFakeFoundry({
  settings = {},
  packs = [],
  user = GM,
} = {}) {
  const values = { ...DEFAULT_SETTINGS, ...settings };
  const users = [GM, PLAYER];
  const sent = { messages: [], warnings: [] };

  globalThis.game = {
    user,
    users: {
      activeGM: GM,
      get: (id) => users.find((candidate) => candidate.id === id),
      find: (test) => users.find(test),
    },
    packs,
    settings: {
      get(moduleId, key) {
        if (moduleId !== MODULE_ID || !(key in values))
          throw new Error(`no setting ${moduleId}.${key}`);
        return values[key];
      },
    },
    i18n: { localize, format },
  };

  globalThis.CONFIG = { Actor: { compendiumIndexFields: [] } };
  globalThis.ui = {
    notifications: { warn: (message) => sent.warnings.push(message) },
  };
  globalThis.ChatMessage = {
    implementation: { create: async (data) => sent.messages.push(data) },
  };
  globalThis.foundry = {
    applications: {
      handlebars: {
        renderTemplate: async (url, data) =>
          handlebars.compile(readModuleFile(url))(data),
      },
    },
  };
  globalThis.fetch = async (url) => ({
    ok: true,
    json: async () => JSON.parse(readModuleFile(url)),
  });

  return sent;
}

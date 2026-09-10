/**
 * Region Bestiary — entry point.
 *
 * Hook order matters here: settings must exist before anything reads them, and
 * the extra compendium index fields must be registered at `setup`, before any
 * pack index is built.
 */

import { MODULE_ID, TEMPLATES } from "./constants.js";
import { registerSettings } from "./settings.js";
import { registerIndexFields } from "./compendium.js";
import { registerSocket } from "./socket.js";
import { loadRegions, allRegions, getRegion } from "./regions.js";
import { openQuery, RegionQuery } from "./apps/region-query.js";
import { rankMonsters, scoreMonster } from "./scoring.js";

function loadTemplatesCompat(paths) {
  const fn = foundry.applications?.handlebars?.loadTemplates ?? globalThis.loadTemplates;
  return fn(paths);
}

Hooks.once("init", () => {
  registerSettings();
});

Hooks.once("setup", () => {
  registerIndexFields();
});

Hooks.once("ready", async () => {
  try {
    await loadRegions();
  } catch (error) {
    console.error(`${MODULE_ID} | region data failed to load`, error);
    ui.notifications.error(game.i18n.localize("REGION_BESTIARY.Notifications.NoRegions"));
    return;
  }

  await loadTemplatesCompat(Object.values(TEMPLATES));
  registerSocket();

  game.modules.get(MODULE_ID).api = {
    openQuery,
    RegionQuery,
    allRegions,
    getRegion,
    rankMonsters,
    scoreMonster,
  };

  console.log(`${MODULE_ID} | ready with ${allRegions().length} regions`);
});

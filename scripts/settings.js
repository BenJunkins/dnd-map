/** GM-configured filters. World-scoped: the GM sets them once, every query uses them. */

import { MODULE_ID, SETTINGS } from "./constants.js";
import { FilterConfig } from "./apps/filter-config.js";

export function registerSettings() {
  game.settings.registerMenu(MODULE_ID, "filterConfig", {
    name: "REGION_BESTIARY.Settings.FilterMenu.Name",
    label: "REGION_BESTIARY.Settings.FilterMenu.Label",
    hint: "REGION_BESTIARY.Settings.FilterMenu.Hint",
    icon: "fa-solid fa-filter",
    type: FilterConfig,
    restricted: true,
  });

  // Managed by the FilterConfig menu rather than the settings sheet.
  game.settings.register(MODULE_ID, SETTINGS.SOURCE_PACKS, {
    scope: "world",
    config: false,
    type: Object,
    default: {},
  });

  game.settings.register(MODULE_ID, SETTINGS.ALLOWED_TYPES, {
    scope: "world",
    config: false,
    type: Object,
    default: {},
  });

  game.settings.register(MODULE_ID, SETTINGS.CR_MIN, {
    name: "REGION_BESTIARY.Settings.CrMin.Name",
    hint: "REGION_BESTIARY.Settings.CrMin.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 0,
    range: { min: 0, max: 30, step: 1 },
  });

  game.settings.register(MODULE_ID, SETTINGS.CR_MAX, {
    name: "REGION_BESTIARY.Settings.CrMax.Name",
    hint: "REGION_BESTIARY.Settings.CrMax.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 30,
    range: { min: 0, max: 30, step: 1 },
  });

  game.settings.register(MODULE_ID, SETTINGS.MAX_RESULTS, {
    name: "REGION_BESTIARY.Settings.MaxResults.Name",
    hint: "REGION_BESTIARY.Settings.MaxResults.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 10,
    range: { min: 1, max: 50, step: 1 },
  });

  game.settings.register(MODULE_ID, SETTINGS.MIN_SCORE, {
    name: "REGION_BESTIARY.Settings.MinScore.Name",
    hint: "REGION_BESTIARY.Settings.MinScore.Hint",
    scope: "world",
    config: true,
    type: Number,
    default: 15,
    range: { min: 0, max: 100, step: 5 },
  });

  game.settings.register(MODULE_ID, SETTINGS.REVEAL_DETAILS, {
    name: "REGION_BESTIARY.Settings.RevealDetails.Name",
    hint: "REGION_BESTIARY.Settings.RevealDetails.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });
}

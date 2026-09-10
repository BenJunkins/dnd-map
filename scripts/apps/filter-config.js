/**
 * Settings menu for the two filters that need more than a single input:
 * which compendiums to draw from, and which creature types are allowed.
 */

import { MODULE_ID, SETTINGS, TEMPLATES } from "../constants.js";
import { CREATURE_TYPES } from "../vocabulary.js";
import { actorPacks } from "../compendium.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class FilterConfig extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "region-bestiary-filters",
    tag: "form",
    window: {
      title: "REGION_BESTIARY.Settings.FilterMenu.Name",
      icon: "fa-solid fa-filter",
      contentClasses: ["region-bestiary", "filter-config"],
    },
    position: { width: 480, height: "auto" },
    form: {
      handler: FilterConfig.#onSubmit,
      closeOnSubmit: true,
    },
  };

  static PARTS = {
    form: { template: TEMPLATES.FILTERS, scrollable: [".rb-scroll"] },
    footer: { template: "templates/generic/form-footer.hbs" },
  };

  async _prepareContext() {
    const enabledPacks = game.settings.get(MODULE_ID, SETTINGS.SOURCE_PACKS) ?? {};
    const allowedTypes = game.settings.get(MODULE_ID, SETTINGS.ALLOWED_TYPES) ?? {};
    const packs = actorPacks();
    const nothingSelected = !Object.values(enabledPacks).some(Boolean);

    return {
      packs: packs.map((pack) => ({
        id: pack.collection,
        label: pack.metadata.label,
        // With no explicit selection, every pack is in play.
        enabled: nothingSelected ? true : Boolean(enabledPacks[pack.collection]),
      })),
      types: CREATURE_TYPES.map((type) => ({
        id: type,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        enabled: allowedTypes[type] !== false,
      })),
      buttons: [{ type: "submit", icon: "fa-solid fa-save", label: "REGION_BESTIARY.Save" }],
    };
  }

  static async #onSubmit(_event, _form, formData) {
    const data = foundry.utils.expandObject(formData.object);
    await game.settings.set(MODULE_ID, SETTINGS.SOURCE_PACKS, data.packs ?? {});
    await game.settings.set(MODULE_ID, SETTINGS.ALLOWED_TYPES, data.types ?? {});
    ui.notifications.info(game.i18n.localize("REGION_BESTIARY.Notifications.FiltersSaved"));
  }
}

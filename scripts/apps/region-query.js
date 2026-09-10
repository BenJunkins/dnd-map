/**
 * The player-facing picker. Selection is constrained to the shipped region list —
 * the text box only narrows the dropdown, it never becomes the query itself.
 */

import { MODULE_ID, SOCKET, MSG, TEMPLATES } from "../constants.js";
import { regionChoices } from "../regions.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class RegionQuery extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "region-bestiary-query",
    tag: "form",
    window: {
      title: "REGION_BESTIARY.Query.Title",
      icon: "fa-solid fa-dragon",
      contentClasses: ["region-bestiary", "region-query"],
    },
    position: { width: 400, height: "auto" },
    form: {
      handler: RegionQuery.#onSubmit,
      closeOnSubmit: true,
    },
  };

  static PARTS = {
    form: { template: TEMPLATES.QUERY },
    footer: { template: "templates/generic/form-footer.hbs" },
  };

  async _prepareContext() {
    return {
      regions: regionChoices(),
      buttons: [{ type: "submit", icon: "fa-solid fa-magnifying-glass", label: "REGION_BESTIARY.Query.Submit" }],
    };
  }

  /** Narrow the visible options as the player types. */
  _onRender(context, options) {
    super._onRender(context, options);
    const search = this.element.querySelector("[data-rb-search]");
    const select = this.element.querySelector("[name=regionId]");
    if (!search || !select) return;

    search.addEventListener("input", () => {
      const needle = search.value.trim().toLowerCase();
      let firstVisible = null;
      for (const option of select.options) {
        const match = !needle || option.textContent.toLowerCase().includes(needle);
        option.hidden = !match;
        if (match && !firstVisible) firstVisible = option;
      }
      // Keep the selection valid when the current pick is filtered away.
      if (firstVisible && select.selectedOptions[0]?.hidden) select.value = firstVisible.value;
    });
  }

  static async #onSubmit(_event, _form, formData) {
    const regionId = formData.object.regionId;
    if (!regionId) return;

    // A GM asking doesn't need to round-trip through the socket.
    if (game.user.isGM) {
      const { handleQuery } = await import("../socket.js");
      return handleQuery({ regionId, userId: game.user.id });
    }

    if (!game.users.activeGM) {
      return ui.notifications.warn(game.i18n.localize("REGION_BESTIARY.Notifications.NoGM"));
    }

    game.socket.emit(SOCKET, { type: MSG.QUERY, regionId, userId: game.user.id });
    ui.notifications.info(game.i18n.localize("REGION_BESTIARY.Notifications.Asked"));
  }
}

/** Open the picker. Also reachable as the module API for macros. */
export function openQuery() {
  return new RegionQuery().render({ force: true });
}

Hooks.on("getSceneControlButtons", (controls) => {
  const tokens = controls.tokens ?? controls.token;
  if (!tokens?.tools) return;
  tokens.tools[MODULE_ID] = {
    name: MODULE_ID,
    title: "REGION_BESTIARY.Query.Title",
    icon: "fa-solid fa-dragon",
    button: true,
    onChange: () => openQuery(),
    onClick: () => openQuery(),
  };
});

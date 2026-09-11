/**
 * Makes the monsters on a result card openable.
 *
 * Clicking one renders that compendium actor's sheet — in dnd5e that sheet is
 * the stat block, so there is nothing more to build. Dragging one onto the
 * canvas drops a token, which is the move a GM actually wants mid-session.
 *
 * Both are wired client-side rather than baked into the card HTML, because the
 * card is authored once on the GM's machine and whispered to two viewers with
 * different permissions.
 */

import { MODULE_ID } from "./constants.js";

/**
 * May this client open the linked stat blocks?
 *
 * The GM always can. A player only when the GM chose to reveal details —
 * otherwise the card deliberately shows bare names, and a working link would
 * hand over the whole stat block anyway.
 */
function mayInspect(message) {
  if (game.user.isGM) return true;
  return Boolean(message?.getFlag(MODULE_ID, "reveal"));
}

async function openSheet(uuid) {
  const doc = await fromUuid(uuid);
  if (!doc) {
    ui.notifications.warn(game.i18n.localize("REGION_BESTIARY.Notifications.MissingActor"));
    return;
  }
  doc.sheet?.render(true);
}

/**
 * Standard Foundry drop payload. If a future version changes the shape this
 * degrades to "dragging does nothing", never to an error.
 */
function onDragStart(event, uuid) {
  event.dataTransfer?.setData("text/plain", JSON.stringify({ type: "Actor", uuid }));
}

export function registerChatHooks() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    const links = html.querySelectorAll("[data-rb-uuid]");
    if (!links.length) return;

    const allowed = mayInspect(message);

    for (const link of links) {
      const uuid = link.dataset.rbUuid;
      if (!uuid) continue;

      if (!allowed) {
        // Leave the name as plain text rather than a link that refuses to work.
        link.classList.remove("rb-link");
        link.removeAttribute("draggable");
        continue;
      }

      link.classList.add("rb-link");
      link.setAttribute("draggable", "true");

      // Chat messages re-render (edits, scrollback rebuilds). Without this guard
      // each pass stacks another listener and one click opens the sheet twice.
      if (link.dataset.rbWired === "true") continue;
      link.dataset.rbWired = "true";

      link.addEventListener("click", (event) => {
        event.preventDefault();
        openSheet(uuid);
      });
      link.addEventListener("dragstart", (event) => onDragStart(event, uuid));
    }
  });
}

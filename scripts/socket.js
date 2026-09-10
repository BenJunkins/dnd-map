/**
 * Player asks -> the active GM's client answers.
 *
 * Only the GM's client reads compendiums and scores, so the answer is always
 * bounded by what that GM actually owns and by the filters they configured. The
 * reply goes back as a whispered ChatMessage rather than a second socket message:
 * one-way sockets, and the result persists in the log.
 */

import { MODULE_ID, SOCKET, MSG, SETTINGS, TEMPLATES } from "./constants.js";
import { getRegion } from "./regions.js";
import { rankMonsters } from "./scoring.js";
import { buildCandidates, applyGMFilters } from "./compendium.js";

/** v13 namespaced this; keep a fallback so v13.0 and v14 both work. */
function renderTemplateCompat(path, data) {
  const fn = foundry.applications?.handlebars?.renderTemplate ?? globalThis.renderTemplate;
  return fn(path, data);
}

/** Is this client the one GM designated to act on shared requests? */
export function isActiveGM() {
  const active = game.users.activeGM ?? game.users.find((u) => u.isGM && u.active);
  return active?.id === game.user.id;
}

export function registerSocket() {
  game.socket.on(SOCKET, async (payload) => {
    if (payload?.type !== MSG.QUERY) return;
    if (!isActiveGM()) return;
    await handleQuery(payload);
  });
}

/**
 * Score the GM's monsters against a region and whisper the result to the asker.
 * Runs on the GM's client only.
 */
export async function handleQuery({ regionId, userId }) {
  const region = getRegion(regionId);
  const asker = game.users.get(userId);
  if (!region) {
    console.warn(`${MODULE_ID} | unknown region "${regionId}"`);
    return;
  }

  const candidates = await buildCandidates();
  if (!candidates.length) {
    ui.notifications.warn(game.i18n.localize("REGION_BESTIARY.Notifications.NoCandidates"));
    return;
  }

  const minScore = Number(game.settings.get(MODULE_ID, SETTINGS.MIN_SCORE)) || 0;
  const ranked = applyGMFilters(rankMonsters(candidates, region, { minScore }));
  const reveal = game.settings.get(MODULE_ID, SETTINGS.REVEAL_DETAILS);

  const content = await renderTemplateCompat(TEMPLATES.RESULT, {
    region,
    reveal,
    empty: ranked.length === 0,
    terrain: region.terrain.join(", "),
    entries: ranked.map(({ monster, score, reasons, signature }) => ({
      name: monster.name,
      uuid: monster.uuid,
      img: monster.img,
      type: monster.type,
      cr: monster.cr,
      score,
      signature,
      reason: reasons[0] ?? "",
    })),
  });

  const whisper = [game.user.id];
  if (asker && asker.id !== game.user.id) whisper.push(asker.id);

  await ChatMessage.implementation.create({
    content,
    whisper,
    flavor: game.i18n.format("REGION_BESTIARY.Chat.Flavor", { region: region.name }),
    speaker: { alias: game.i18n.localize("REGION_BESTIARY.Chat.Speaker") },
    flags: { [MODULE_ID]: { regionId, askedBy: userId } },
  });
}

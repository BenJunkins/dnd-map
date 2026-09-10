/** Module-wide constants. The id is permanent — changing it breaks every install. */
export const MODULE_ID = "region-bestiary";

/** Namespaced socket channel. Requires `"socket": true` in module.json. */
export const SOCKET = `module.${MODULE_ID}`;

/** Socket message types. */
export const MSG = {
  QUERY: "query",
};

export const SETTINGS = {
  SOURCE_PACKS: "sourcePacks",
  ALLOWED_TYPES: "allowedTypes",
  CR_MIN: "crMin",
  CR_MAX: "crMax",
  MAX_RESULTS: "maxResults",
  MIN_SCORE: "minScore",
  REVEAL_DETAILS: "revealDetails",
};

export const TEMPLATES = {
  QUERY: `modules/${MODULE_ID}/templates/region-query.hbs`,
  FILTERS: `modules/${MODULE_ID}/templates/filter-config.hbs`,
  RESULT: `modules/${MODULE_ID}/templates/result-card.hbs`,
};

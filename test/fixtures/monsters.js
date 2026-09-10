/**
 * A small hand-built sample of SRD monsters in the shape `compendium.js` produces
 * from a Foundry index entry. Used by the unit tests and by tools/score-preview.js
 * so both can run without Foundry.
 */

export const SAMPLE_MONSTERS = [
  { name: "Goblin", type: "humanoid", cr: 0.25, size: "sm", movement: { walk: 30 }, senses: { darkvision: 60 } },
  { name: "Goblin Boss", type: "humanoid", cr: 1, size: "sm", movement: { walk: 30 }, senses: { darkvision: 60 } },
  { name: "Hobgoblin", type: "humanoid", cr: 0.5, size: "med", movement: { walk: 30 }, senses: { darkvision: 60 } },
  { name: "Orc", type: "humanoid", cr: 0.5, size: "med", movement: { walk: 30 }, senses: { darkvision: 60 } },
  { name: "Bandit", type: "humanoid", cr: 0.125, size: "med", movement: { walk: 30 }, senses: {} },
  { name: "Troll", type: "giant", cr: 5, size: "lg", movement: { walk: 30 }, senses: { darkvision: 60 } },
  { name: "Young Green Dragon", type: "dragon", cr: 8, size: "lg", movement: { walk: 40, fly: 80, swim: 40 }, senses: { darkvision: 120 } },
  { name: "Aboleth", type: "aberration", cr: 10, size: "lg", movement: { walk: 10, swim: 40 }, senses: { darkvision: 120 } },
  { name: "Giant Ape", type: "beast", cr: 7, size: "huge", movement: { walk: 40, climb: 40 }, senses: {} },
  { name: "Frost Giant", type: "giant", cr: 8, size: "huge", movement: { walk: 40 }, senses: {} },
  { name: "Yeti", type: "monstrosity", cr: 3, size: "lg", movement: { walk: 40, climb: 40 }, senses: { darkvision: 60 } },
  { name: "Adult White Dragon", type: "dragon", cr: 13, size: "huge", movement: { walk: 40, burrow: 30, fly: 80, swim: 40 }, senses: { darkvision: 120 } },
  { name: "Zombie", type: "undead", cr: 0.25, size: "med", movement: { walk: 20 }, senses: { darkvision: 60 } },
  { name: "Ghoul", type: "undead", cr: 1, size: "med", movement: { walk: 30 }, senses: { darkvision: 60 } },
  { name: "Shrieker", type: "plant", cr: 0, size: "med", movement: {}, senses: { blindsight: 30 } },
  { name: "Gelatinous Cube", type: "ooze", cr: 2, size: "lg", movement: { walk: 15 }, senses: { blindsight: 60 } },
  { name: "Drow", type: "humanoid", cr: 0.25, size: "med", movement: { walk: 30 }, senses: { darkvision: 120 } },
  { name: "Giant Crab", type: "beast", cr: 0.125, size: "med", movement: { walk: 30, swim: 30 }, senses: { blindsight: 30 } },
  { name: "Sahuagin", type: "humanoid", cr: 0.5, size: "med", movement: { walk: 30, swim: 40 }, senses: { darkvision: 120 } },
  { name: "Ankheg", type: "monstrosity", cr: 2, size: "lg", movement: { walk: 30, burrow: 10 }, senses: { darkvision: 60, tremorsense: 60 } },
  { name: "Tyrannosaurus Rex", type: "beast", cr: 8, size: "huge", movement: { walk: 50 }, senses: {} },
  { name: "Commoner", type: "humanoid", cr: 0, size: "med", movement: { walk: 30 }, senses: {} },
];

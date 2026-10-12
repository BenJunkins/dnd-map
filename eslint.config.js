import js from "@eslint/js";
import globals from "globals";

/** Foundry globals available to module scripts at runtime. */
const foundryGlobals = {
  foundry: "readonly",
  game: "readonly",
  ui: "readonly",
  CONFIG: "readonly",
  Hooks: "readonly",
  ChatMessage: "readonly",
  Handlebars: "readonly",
  fromUuid: "readonly",
  renderTemplate: "readonly",
  loadTemplates: "readonly",
};

/**
 * Files that tools/ and test/ import under plain Node. They get no browser or
 * Foundry globals, so reaching for `game` in one of them is a lint error.
 */
const pureScripts = ["scripts/scoring.js", "scripts/vocabulary.js"];

const rules = {
  "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  eqeqeq: "error",
  "no-shadow": "error",
  "no-var": "error",
  "prefer-const": "error",
};

export default [
  { ignores: ["node_modules/**", "data/**", "tools/legacy-regions.json"] },
  js.configs.recommended,
  {
    files: ["scripts/**/*.js"],
    ignores: pureScripts,
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.browser, ...foundryGlobals },
    },
    rules,
  },
  {
    files: pureScripts,
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
    },
    rules,
  },
  {
    files: ["tools/**/*.js", "test/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules,
  },
];

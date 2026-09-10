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

export default [
  { ignores: ["node_modules/**", "data/**", "tools/legacy-regions.json"] },
  js.configs.recommended,
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.browser, ...foundryGlobals },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["tools/**/*.js", "test/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];

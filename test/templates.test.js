import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Templates used as ApplicationV2 `PARTS`. Each of these MUST render exactly one
 * root element — Foundry throws "Template part must render a single HTML element"
 * at render time otherwise, which only surfaces inside a live world.
 *
 * result-card.hbs is deliberately absent: it is rendered for chat content, which
 * has no single-root constraint.
 */
const PART_TEMPLATES = ["templates/region-query.hbs", "templates/filter-config.hbs"];

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img",
  "input", "link", "meta", "source", "track", "wbr",
]);

/** Count top-level HTML elements, ignoring Handlebars expressions and comments. */
export function countRootElements(source) {
  const html = source
    .replace(/\{\{![\s\S]*?\}\}/g, "")
    .replace(/\{\{[\s\S]*?\}\}/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  let depth = 0;
  let roots = 0;
  for (const match of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
    const [, closing, tag, , selfClosing] = match;
    if (VOID_ELEMENTS.has(tag.toLowerCase()) || selfClosing) {
      if (depth === 0) roots += 1;
      continue;
    }
    if (closing) depth -= 1;
    else {
      if (depth === 0) roots += 1;
      depth += 1;
    }
  }
  return roots;
}

test("countRootElements distinguishes single and multiple roots", () => {
  assert.equal(countRootElements("<div><p>a</p><p>b</p></div>"), 1);
  assert.equal(countRootElements("<p>a</p><p>b</p>"), 2);
  assert.equal(countRootElements("{{#if x}}<div>a</div>{{/if}}"), 1);
  assert.equal(countRootElements("<div><input name='a'></div>"), 1);
});

for (const relative of PART_TEMPLATES) {
  test(`${relative} renders a single root element`, () => {
    const source = fs.readFileSync(path.join(root, relative), "utf8");
    const roots = countRootElements(source);
    assert.equal(
      roots,
      1,
      `${relative} has ${roots} root elements. ApplicationV2 PARTS templates must have exactly one.`,
    );
  });
}

test("every template referenced in constants.js exists on disk", async () => {
  const constants = fs.readFileSync(path.join(root, "scripts", "constants.js"), "utf8");
  const paths = [...constants.matchAll(/\$\{MODULE_ID\}\/(templates\/[\w-]+\.hbs)/g)].map((m) => m[1]);
  assert.ok(paths.length >= 3, `expected to find template paths, found ${paths.length}`);
  for (const relative of paths) {
    assert.ok(fs.existsSync(path.join(root, relative)), `${relative} is referenced but missing`);
  }
});

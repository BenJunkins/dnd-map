/**
 * Checks on the files Foundry reads, rather than on the code's behaviour: the
 * manifest, the translations, the templates and the generated region data.
 *
 * Each of these fails in a live world with an error that is easy to misread, or
 * with no error at all. Catching it here costs milliseconds.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import Handlebars from "handlebars";

import { MODULE_ID } from "../scripts/constants.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const readJSON = (relative) => JSON.parse(read(relative));

/** Every file under a folder, as paths relative to the repo root. */
function filesIn(folder) {
  return fs
    .readdirSync(path.join(root, folder), {
      recursive: true,
      withFileTypes: true,
    })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(root, path.join(entry.parentPath, entry.name)),
    );
}

const manifest = readJSON("module.json");
const pkg = readJSON("package.json");

test("the manifest id is the id the code uses", () => {
  assert.equal(manifest.id, MODULE_ID);
});

test("module.json and package.json agree on the version", () => {
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(pkg.version, manifest.version);
});

test("every file the manifest names exists", () => {
  const named = [
    ...manifest.esmodules,
    ...manifest.styles,
    ...manifest.languages.map((language) => language.path),
    manifest.license,
    manifest.readme,
  ];
  for (const relative of named) {
    assert.ok(
      fs.existsSync(path.join(root, relative)),
      `module.json names ${relative}, which does not exist`,
    );
  }
});

test("the manifest turns sockets on, because players reach the GM through one", () => {
  assert.equal(manifest.socket, true);
});

test("every translation key the code uses is defined, and none is left over", () => {
  const defined = Object.keys(readJSON("lang/en.json")).sort();
  const source = [...filesIn("scripts"), ...filesIn("templates")]
    .map(read)
    .join("\n");
  const used = [
    ...new Set(source.match(/REGION_BESTIARY\.[A-Za-z.]+/g)),
  ].sort();

  assert.deepEqual(used, defined);
});

test("every template is valid Handlebars", () => {
  for (const relative of filesIn("templates")) {
    assert.doesNotThrow(
      () => Handlebars.precompile(read(relative)),
      `${relative} does not compile`,
    );
  }
});

test("data/regions.json is what the normalizer makes from the archived source", () => {
  const output = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "region-bestiary-")),
    "regions.json",
  );
  execFileSync(
    process.execPath,
    ["tools/normalize-regions.js", "tools/legacy-regions.json", output],
    {
      cwd: root,
      stdio: "pipe",
    },
  );

  assert.equal(
    fs.readFileSync(output, "utf8"),
    read("data/regions.json"),
    "data/regions.json is out of date. Run: npm run normalize-regions",
  );
});

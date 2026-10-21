# Region Bestiary

[![CI](https://github.com/BenJunkins/dnd-map/actions/workflows/ci.yml/badge.svg)](https://github.com/BenJunkins/dnd-map/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/BenJunkins/dnd-map)](https://github.com/BenJunkins/dnd-map/releases/latest)

**A Foundry VTT module that answers "what lives here?" using the compendiums your GM already has.**

A player picks a region. The GM's client scores every NPC in the GM's own compendiums
against that region's terrain, danger level and known threats, applies the filters the GM
configured, and whispers the result back.

- Requires **Foundry VTT v13+** (verified on v13) and the **dnd5e** system.
- Ships **no monster data**. Everything offered comes from your own compendiums, so
  homebrew and non-SRD content work out of the box.
- 51 Faerûn regions included.

---

## How it works

```
[Player] Region Bestiary picker
    │  socket: { type: "query", regionId }
    ▼
[Active GM's client only]
    ├─ read the enabled Actor compendiums (index only — no full document loads)
    ├─ score each NPC against the region
    ├─ apply the GM's filters
    ▼
whispered ChatMessage → the asking player and the GM
```

Scoring never runs on a player's machine, so a player can only ever learn what the GM's
filters permit. Monsters are linked by UUID, so clicking one opens the GM's own stat block.

### What the score is made of

| Signal                                    | Weight | Source                        |
| :---------------------------------------- | -----: | :---------------------------- |
| Named among the region's known threats    |     40 | region `dominant_monsters`    |
| Creature type suits the terrain           |     25 | terrain × type affinity table |
| CR fits the region's danger band          |    ±20 | region `danger`               |
| Movement / senses / size suit the terrain |    ±10 | actor's own data              |

Every result carries the reasons it scored, which is what makes the output auditable
rather than a black box.

---

## Installation

Paste this manifest URL into Foundry's **Add-on Modules → Install Module**:

```
https://github.com/BenJunkins/dnd-map/releases/latest/download/module.json
```

Or clone into your Foundry `Data/modules/` directory as `region-bestiary`.

## GM configuration

**Settings → Module Settings → Region Bestiary**

| Setting                       | Effect                                                                             |
| :---------------------------- | :--------------------------------------------------------------------------------- |
| Configure Filters             | Which compendiums to draw from, and which creature types players may be told about |
| Minimum / Maximum CR          | Hard bounds on what is ever reported                                               |
| Maximum Results               | How many monsters a single answer lists                                            |
| Minimum Match Score           | Raise for strong regional matches only, lower for looser ones                      |
| Reveal Type, CR and Reasoning | Off by default — players see only names                                            |

Players open the picker from the token-layer scene controls, or via a macro:

```js
game.modules.get("region-bestiary").api.openQuery();
```

---

## Development

No build step — Foundry loads the ES modules directly. The dev tools need Node 24, which
`.nvmrc` pins.

```bash
nvm use
npm ci
npm run check                         # lint, then every test with a coverage floor (what CI runs)
npm test                              # tests only
npm run score -- sword_coast          # ranked list for a region, no Foundry needed
npm run score                         # list every region id
npm run normalize-regions             # regenerate data/regions.json from the archived source
npm run package                       # build module.zip exactly as a release does
```

`npm run score` is the tuning loop. Adjust `WEIGHTS` or the affinity table in
`scripts/vocabulary.js`, re-run it, and read the reasons — no Foundry restart required.

GitHub Actions runs `npm run check` and builds the zip on every pull request, and publishes
a release when a version tag is pushed. [CONTRIBUTING.md](CONTRIBUTING.md) covers the
workflow, the Foundry smoke test and the release steps.

### Layout

```
module.json                 manifest
scripts/
  main.js                   hook wiring (init / setup / ready)
  scoring.js                pure scorer — no Foundry globals, unit-tested
  vocabulary.js             terrain set, type affinity, CR bands
  compendium.js             reads the GM's Actor packs via the compendium index
  socket.js                 player request → active GM → whispered result
  settings.js               GM filter settings
  apps/                     ApplicationV2 windows
data/regions.json           normalized region profiles (shipped)
tools/                      offline data + tuning scripts (not shipped behaviour)
test/                       node:test suites, with a fake Foundry for the GM-side code
.github/                    CI and release workflows, Dependabot settings
```

### Adding a region

Append to `tools/legacy-regions.json` and run `npm run normalize-regions`. Terrain strings
must map to the controlled 5e set (`arctic, coastal, desert, forest, grassland, hill,
mountain, swamp, underdark, underwater, urban`) — the normalizer fails loudly on anything
it does not recognise, which is what keeps the vocabulary closed.

---

## Roadmap

[ROADMAP.md](ROADMAP.md) has the plan in order, with the reason for the order. In short:
make it installable, verify it in a live world, make the known-threat data mean what it
says, then RollTable output, map selection and per-character knowledge.

---

## Licence and attribution

Module code is MIT licensed — see [LICENSE](LICENSE).

Region data is original fan content. **No stat blocks, artwork, or published text are
included or redistributed** — monsters are resolved by reference from compendiums the
user already owns.

This work includes material from the System Reference Document 5.1 ("SRD 5.1") by Wizards
of the Coast LLC, available at
<https://dnd.wizards.com/resources/systems-reference-document>. The SRD 5.1 is licensed
under the Creative Commons Attribution 4.0 International License, available at
<https://creativecommons.org/licenses/by/4.0/legalcode>.

Region Bestiary is unofficial Fan Content permitted under the Fan Content Policy. Not
approved/endorsed by Wizards. Portions of the materials used are property of Wizards of
the Coast. ©Wizards of the Coast LLC.

Built by **Benjamin Junkins** — [LinkedIn](https://linkedin.com/in/benjamin-junkins/)

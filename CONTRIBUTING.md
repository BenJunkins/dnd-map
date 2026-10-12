# Contributing

How a change gets from an idea to a release. It is written for future me as much as for
anyone else.

## Set up

```bash
nvm use        # the Node version in .nvmrc
npm ci         # the dev tools, at the exact versions in package-lock.json
```

## Making a change

1. Branch from an up-to-date `main`.
2. Make the change. If it changes behaviour, change or add a test in the same commit.
3. Run `npm run check`. It is the same command CI runs.
4. Push and open a pull request. Two checks run: **Lint and test**, then **Build the module zip**.
5. Merge when both are green.

## What the checks cover

| Check                     | What it catches                                                                                                                                             |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`            | Unused variables, loose equality, and any Foundry global used in `scripts/scoring.js` or `scripts/vocabulary.js`, which must stay runnable under plain Node |
| `test/scoring.test.js`    | The scorer: plurals, word boundaries, terrain, CR bands, ranking order                                                                                      |
| `test/compendium.test.js` | Pack selection, CR parsing, duplicate handling                                                                                                              |
| `test/gm-filters.test.js` | Reading packs and applying the GM's filters, against a fake Foundry                                                                                         |
| `test/query.test.js`      | A whole question: who receives the whisper, and what the card shows with details hidden or revealed                                                         |
| `test/shipped.test.js`    | The manifest, version numbers, translation keys, templates, and that `data/regions.json` is up to date                                                      |
| `test/templates.test.js`  | Each window template has the single root element ApplicationV2 requires                                                                                     |
| Coverage floor            | `npm run coverage` fails if fewer than 90% of lines in the files the tests load are run                                                                     |

## What the checks cannot cover

Nothing here starts Foundry. These files are never loaded by a test: `scripts/main.js`,
`scripts/settings.js`, `scripts/chat.js` and both files in `scripts/apps/`. The coverage
figure only counts files the tests load, so it says nothing about them.

That gap is closed by hand, with the list below.

## Smoke test in Foundry

Run this before every release, on the oldest Foundry version `module.json` supports and on
the one it names as verified.

Get the build first. Open the pull request's CI run on GitHub, download the **module**
artifact, and unzip `module.zip` into `Data/modules/region-bestiary/`.

- [ ] The module enables in a dnd5e world, and the console logs `region-bestiary | ready with 51 regions`
- [ ] **Configure Filters** opens, lists the Actor compendiums, saves, and shows the same ticks when reopened
- [ ] As GM, the dragon button in the token controls opens the picker, and typing narrows the list
- [ ] As GM, asking about a region puts a card in chat, whispered to you alone
- [ ] As a player in a second browser, asking shows "Your question has been sent to the GM", and the card reaches that player and the GM
- [ ] With **Reveal Type, CR and Reasoning** off, the player sees names only, and the names are not clickable
- [ ] With it on, the player sees type, CR and a reason, and clicking a name opens the stat block
- [ ] As GM, dragging a name from the card onto the canvas drops a token
- [ ] Setting **Maximum CR** to 1 and asking again removes everything stronger from the card
- [ ] With no GM logged in, a player who asks is told no GM is connected

## Releasing

Versions follow [semantic versioning](https://semver.org): a fix raises the last number, a
new feature the middle one.

1. Raise the version in `package.json` and `package-lock.json`:
   ```bash
   npm version 0.2.0 --no-git-tag-version
   ```
2. In `module.json`, change `version` and the version inside the `download` link to match.
3. In `CHANGELOG.md`, move what is under **Unreleased** to a heading for the new version.
4. Run `npm run check`. It fails if step 2 was missed.
5. Open a pull request, run the smoke test on its build, and merge.
6. Tag the merged commit and push the tag:
   ```bash
   git switch main
   git pull
   git tag v0.2.0
   git push origin v0.2.0
   ```

The tag starts the **Release** workflow. It checks the tag against `module.json`, runs the
checks again, builds `module.zip` and publishes a GitHub release with `module.json` and
`module.zip` attached. Foundry installs and updates from those two files.

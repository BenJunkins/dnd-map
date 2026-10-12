# Roadmap

The order matters more than the dates. Each milestone makes the next one cheaper or safer,
and the reason is given with each.

## v0.1.0: Installable

_The manifest link in the README works for a stranger._

- [ ] Lint and tests run on every pull request
- [ ] A version tag builds the zip and publishes a release
- [ ] Known threats written as irregular plurals or with a bracketed note match their monsters

**Why first:** until a release exists, the install link returns a 404 and nobody else can
try the module.

## v0.1.x: Verified in a live world

_No new features. Everything the tests cannot reach is checked by hand, and the small
known problems are fixed or consciously kept._

- [ ] Run the smoke test in `CONTRIBUTING.md` on Foundry v13 and v14
- [ ] A CR 0 creature shows no CR on a revealed card, because the template treats 0 as "missing"
- [ ] Fractional CRs print as `0.25` where a GM expects `1/4`
- [ ] Reasons read "a extreme-danger region"
- [ ] Decide: known threats are bold on the card even when details are hidden. Is that a detail?
- [ ] Decide: a monster with no CR or no type in the index passes the CR and type filters.
      Should "unknown" be hidden when a filter is set?
- [ ] Decide: the GM's client trusts the `userId` in a socket message. A player could ask on
      another player's behalf.

**Why second:** every later feature shows these results to players. Trust in what is
already there comes before adding to it.

## v0.2.0: Threats that mean what they say

_A region's known threats are its strongest signal, worth 40 of 95 points, and a good part
of them cannot fire._

- [ ] 27 of the 188 threat entries name a creature type ("Undead", "Dragons", "Giants").
      They are matched against names today, so "Undead" matches nothing and "Giants" matches
      Giant Ape. Match these against the creature's type.
- [ ] Review entries that name no monster at all ("Sea Monsters", "Adventurers", "Zhentarim")
      and move them to `features` or `major_factions`
- [ ] Add a report, next to `npm run score`, that lists every threat entry matching nothing
      in the sample monsters, so data quality is a number that can go down
- [ ] Grow the 22 sample monsters toward the SRD list. They are test data and are not in the zip.
- [ ] Curated region-to-monster links layered over the heuristic, for the cases rules cannot reach

**Why here:** it changes rankings, so it should land before features that present rankings
in new ways.

## v0.3.0: RollTable output

- [ ] A GM button on the card that turns the result into a Foundry RollTable, weighted by score

**Why here:** it is self-contained, uses data the card already carries, and connects the
module to how GMs already build encounters. The table-building part can be a pure function
with tests. Only the last step needs Foundry.

## v0.4.0: Pick a region from a map

- [ ] Click a region on a map instead of choosing from a list

`tools/legacy-regions.json` still holds a polygon for each of the 51 regions, from the
original web map.

**Open question to answer first:** the polygons are pixel positions on one particular map
image. Either the module ships an image it has the right to ship, or the GM lines the
regions up with their own scene.

## v0.5.0: What this character would know

- [ ] Filter an answer by the asking character: Nature or Arcana proficiency, a ranger's
      favoured terrain, background, regions already visited

**Why last:** it has the most design questions, depends on the dnd5e actor data model, and
is the easiest to get subtly wrong. It benefits most from everything above being settled.

## v1.0.0: Listed

- [ ] Submitted to the Foundry package directory
- [ ] The release workflow also notifies Foundry of each new version
- [ ] Compatibility verified on the current Foundry release
- [ ] A second language file, to prove the translation path works

## The pipeline, alongside

| When   | Addition                                                                                                                      |
| :----- | :---------------------------------------------------------------------------------------------------------------------------- |
| v0.1.0 | Lint, tests, coverage floor, zip built on every pull request, release on a tag, monthly dependency updates                    |
| Next   | Refuse to release from a tag that is not on `main`                                                                            |
| Next   | A formatting check. It would reformat 9 existing files, so it gets a pull request of its own                                  |
| Later  | Start a real Foundry in CI and run the smoke test automatically. It needs a licence key stored as a secret, so it is optional |

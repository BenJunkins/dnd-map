# Changelog

Notable changes to Region Bestiary. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[semantic versioning](https://semver.org).

## [Unreleased]

## [0.1.0] - 2026-10-12

The first release as a Foundry VTT module. Earlier commits in this repository are a
standalone web map, which this replaces.

### Added

- A region picker for players, opened from the token controls or a macro.
- Scoring on the GM's client only. Every NPC in the GM's Actor compendiums is scored against
  the region's known threats, terrain and danger level, plus the creature's own movement,
  senses and size.
- GM filters: source compendiums, creature types, minimum and maximum CR, number of results,
  minimum score, and whether players see type, CR and reasoning.
- A result card whispered to the asker and the GM. Names open the stat block and can be
  dragged to the canvas, for the GM always and for players when details are revealed.
- 51 Faerûn regions.

### Fixed

- Known threats written as an irregular plural or with a bracketed note now match their
  monsters. "Zombies", "Wolves", "Liches" and "Goblins (Sythillis)" are examples. Fourteen
  threat entries in fourteen regions could never match before.

[Unreleased]: https://github.com/BenJunkins/dnd-map/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/BenJunkins/dnd-map/releases/tag/v0.1.0

# Interface Contracts: Visual Refresh

The game has **no backend and no public API**. Feature 001's [core/render contracts](../../001-space-asteroid-game/contracts/README.md), feature 002's [split contract](../../002-fix-asteroid-splitting/contracts/split-contract.md), feature 003's [power-up contract](../../003-double-shot-powerup/contracts/powerup-contract.md) and feature 004's [guaranteed-drop contract](../../004-guaranteed-fragment-drop/contracts/guaranteed-drop-contract.md) remain fully in force for gameplay behaviour.

This feature amends **only the presentation layer**: it supersedes §1 (palette), §4 (draw order/background) and §6 (required glyphs / fonts) of feature 001's [render-contract.md](../../001-space-asteroid-game/contracts/render-contract.md), and adds the bundled-asset manifest and fallback rules. Everything about game state, collision, scoring, spawning, firing and termination is unchanged.

| Contract | Interface exposed to | File |
|---|---|---|
| Visual asset manifest, entity→asset mapping, render transforms, font application, fallbacks and provenance | every renderer consumer (`src/render/*`), the boot path (`src/main.js`) and the `node --test` manifest check | [visual-assets-contract.md](./visual-assets-contract.md) |

Anything not covered here — and anything not restated from features 001–004 — is internal and may change freely.

# Interface Contracts: Guaranteed Drop From Medium Fragments

The game has **no backend and no public API**: feature-001's [contracts README](../../001-space-asteroid-game/contracts/README.md) stays authoritative for the core API, feature-002's [split-contract.md](../../002-fix-asteroid-splitting/contracts/split-contract.md) for split/fragment behaviour, and feature-003's [powerup-contract.md](../../003-double-shot-powerup/contracts/powerup-contract.md) **stays fully in force** for everything about the POWERUP entity itself, its collection rules, the double-shot firing chain and effect termination. This feature amends exactly one clause of the 003 contract (the drop rule), so it ships one delta contract:

| Contract | Interface exposed to | File |
|---|---|---|
| Fragment-origin tagging and the guaranteed drop amendment | every consumer of `applySizeRule` / `resolveCollisions` and the `node --test` suite | [guaranteed-drop-contract.md](./guaranteed-drop-contract.md) |

Anything not covered here — and anything not restated from features 001/002/003 — is internal and may change freely.

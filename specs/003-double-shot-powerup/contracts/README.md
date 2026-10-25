# Interface Contracts: Double Shot Power-Up

The game has **no backend and no public API** (see `specs/001-space-asteroid-game/contracts/README.md`, which stays authoritative for input, rendering and the general core API), and feature-002's [split-contract.md](../../002-fix-asteroid-splitting/contracts/split-contract.md) stays authoritative for split/fragment-protection behaviour. This feature extends the destruction loop and the firing path with one reward mechanic, so it adds one behavioural contract:

| Contract | Interface exposed to | File |
|---|---|---|
| Power-up drop, collection, double-shot firing and termination rules | the render/loop layer and `node --test` unit tests (i.e. every consumer of `applySizeRule` / `resolveCollisions` / `update`) | [powerup-contract.md](./powerup-contract.md) |

Anything not covered here — and anything not restated from features 001/002 — is internal and may change freely.

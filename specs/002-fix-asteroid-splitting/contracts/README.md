# Interface Contracts: Fix Asteroid Splitting

The game has **no backend and no public API** (see `specs/001-space-asteroid-game/contracts/README.md`, which stays authoritative for input, rendering and the general core API). This feature only changes the **destruction/split behaviour of the core**, so it adds one behavioural contract:

| Contract | Interface exposed to | File |
|---|---|---|
| Split & fragment-protection rules | the render/loop layer and `node --test` unit tests (i.e. every consumer of `resolveCollisions` / `update`) | [split-contract.md](./split-contract.md) |

Anything not covered here — and anything not restated from feature 001 — is internal and may change freely.

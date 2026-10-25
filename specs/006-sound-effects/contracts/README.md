# Interface Contracts: Sound Effects for Game Events

The game has **no backend and no public API**. The core/render contracts of feature 001, the split contract of feature 002, the power-up contract of feature 003, the guaranteed-drop contract of feature 004 and the visual-assets contract of feature 005 remain fully in force. This feature adds one internal boundary: **semantic game events emitted by the DOM-free core and consumed by a browser-only audio engine**. It also amends the presentation/audio scope only; it does not change gameplay behaviour.

| Contract | Interface exposed to | File |
|---|---|---|
| Semantic event ids, emission points and counts; cue catalog; audio engine lifecycle and fallback | `src/events.js`, the core emitters (`update`, `collision`, `score`), `src/main.js`, `src/audio/*`, and the `node --test` event/catalog suites | [sound-effects-contract.md](./sound-effects-contract.md) |

Anything not covered here — and anything not restated from features 001–005 — is internal and may change freely. Sound is a new, explicitly scoped feature of spec 006; the constitution's simplicity boundary is amended accordingly.

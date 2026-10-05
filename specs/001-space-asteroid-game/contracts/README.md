# Interface Contracts: Space Asteroid Game

The game is a static page with **no backend and no public API**, so its external interfaces are:

| Contract | Interface exposed to | File |
|---|---|---|
| Keyboard input | the player (browser `KeyboardEvent`s) | [input-contract.md](./input-contract.md) |
| Canvas rendering & scaling | the player / display (Canvas 2D + CSS sizing) | [render-contract.md](./render-contract.md) |
| Core logic API | the render/loop layer and `node --test` unit tests | [core-api.md](./core-api.md) |

Anything not covered here is internal and may change freely.

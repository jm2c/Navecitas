# Contract: Core Logic API

**Consumers**: `src/main.js` / `src/loop.js` (runtime) and `tests/*.test.js` via `node --test`.  
**Guarantee**: everything exported from `state.js`, `entities.js`, `update.js`, `collision.js`, `spawn.js`, `score.js`, `config.js` is **pure ESM with zero browser references** (no `window`, `document`, `performance`, `navigator`, canvas) so it loads in Node ≥ 20 unchanged.

## `src/config.js`

```js
export const BASE_SPEED = 200;          // px/s, reference for every ratio
export const WORLD = { W: 800, H: 600 };
export const DT_MS = 1000 / 60;         // the only timestep
export const LIMITS = { fwd: 260, back: 60, recoil: 30, projSpeed: 300, maxProjectiles: 5 };
export const PALETTE = { bg: '#000000', fg: '#FFFFFF', special: '#7ED9A0' };
export const TIMINGS = { shotInterval: 160, spawnCadence: 1400, deathDelay: 500,
                         immunity: 2000, countdownHold: 500, /* … */ };
export const TIERS = [ /* FR-010 table + R6 spawn weights */ ];
export const MAX_LIVES = 6, MAX_RESERVE_ICONS = 5;
```

## `src/state.js`

```js
createGame(): GameState          // phase 'START', score 0, lives 3, ship at 400,300 angle -π/2
tierFor(score): Tier             // { smallMul, mediumMul, largeMul, weights, max }
```

## `src/entities.js`

```js
createShip(): Ship
createProjectile(ship): Projectile        // at ship pos, velocity 300 px/s along ship.angle
createAsteroid(kind, x, y, heading, tier): Asteroid   // speed fixed from tier here
createSpecial(x, y, heading): Asteroid    // kind 'SPECIAL', speed 200 always
```

## `src/update.js`

```js
update(state, dtMs, input): void
```
- **One simulation step.** `dtMs` is always `DT_MS` in production; tests may pass any value.
- `input` is a plain object `{ left, right, up, down, fire }` — booleans; no event objects.
- Mutates `state` in place; returns nothing. Order: phase machine → ship physics → firing → projectile motion → asteroid motion → spawning → collisions → cleanup (dead filtering) → timers.
- Must be idempotent w.r.t. clocks: it never reads real time.
- **Freeze (FR-033/SC-016)**: the caller MUST NOT invoke `update` while the tab is hidden; freezing is the loop's responsibility, so the core stays clock-free and every timer simply keeps its value.

## `src/collision.js`

```js
resolveCollisions(state): void   // order per research R8:
                                 // 1 projectile×asteroid  2 ship×special
                                 // 3 ship×regular (alive, !immune, phase PLAYING)
                                 // 4 regular×regular (no score, pair once)
```

## `src/spawn.js`

```js
tickSpawn(state, dtMs): void     // cadence + tier cap; creates edge spawns
spawnSpecialIfCrossed(state, prevScore, nextScore): void   // floor(prev/500) < floor(next/500) && icons < 5
```

## `src/score.js`

```js
addScore(state, pts): void       // monotonic; triggers spawnSpecialIfCrossed
grantLife(state): void           // lives = min(lives+1, 6)
reserveIcons(lives): number      // max(0, lives - 1)
applySizeRule(state, asteroid, awardPoints): Asteroid[]  // children to insert (R9/data-model §4)
```

## Invariants any consumer/test may rely on

1. `state.projectiles.length ≤ 5` after every `update`.
2. `state.score` never decreases; values only reachable by adding 50 / 200.
3. `state.lives ∈ [3, 6]` while `phase !== 'GAME_OVER'`; `reserveIcons ≤ 5` always.
4. `ship.speed ∈ [−60, 260]` after every step; input alone can never make it negative.
5. Asteroid speed is written **only** in `createAsteroid`/`applySizeRule` — never re-read from the tier.
6. `SPECIAL` asteroids never appear in a tier-capped spawn and never carry a score award.
7. `phase === 'GAME_OVER' ⇒ state.ship === null`, and the phase never changes again.
8. Wrap-around preserves the untouched axis exactly: `x < 0 ⇒ x += 800` (y unchanged).

## Non-guarantees

Render layer, DOM event wiring, CSS sizing and visual timing of overlays are **not** covered by this contract and are validated manually in `quickstart.md`.

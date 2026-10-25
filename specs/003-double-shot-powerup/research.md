# Research: Double Shot Power-Up (Phase 0)

**Feature**: `003-double-shot-powerup` | Resolves every open question of plan.md §Technical Context; all decisions respect constitution v1.0.0. Empirical grounding: the real core modules were read in full (`state/entities/score/collision/spawn/update/config`); no NEEDS CLARIFICATION remained after the `/speckit.clarify` session (2026-10-24, Q1 geometry → B, Q2 recoil → A, Q3 capacity → B-1).

---

## R1 — Where the 10% drop roll lives, and how to make it testable

**Decision**: The roll is performed inside `applySizeRule(state, asteroid, awardPoints, random = Math.random)` in `src/score.js`, at the moment the destroyed asteroid is confirmed to be `SMALL`, on **both** the award path (projectile hit) and the no-award path (regular×regular collision, ship impact, any future cause) — the spec makes the drop independent of the destruction cause (FR-001, Edge Cases). Roll convention: `random() < POWERUP_DROP_CHANCE` (0.1). The `random` parameter is passed down from `resolveCollisions(state, random = Math.random)` in `src/collision.js`, which `update.js` calls with the default.

**Rationale**: `applySizeRule` is already the single choke point through which every small-asteroid destruction flows (contract §2 of feature 002), so the drop cannot be missed by any cause; the injectable `random` replicates the pattern already used by `pickKind`/`tickSpawn`/`edgeSpawn` in `src/spawn.js` (established in feature 001 research R6), enabling deterministic red-green tests without monkey-patching `Math.random`.

**Alternatives considered**:
- Roll inside each caller of `applySizeRule` — rejected: duplicates logic, invites one cause forgetting the drop.
- Roll inside `moveAsteroids`/`update.js` after cleanup — rejected: destroyed asteroids are `dead`-filtered before any post-collision hook; the destruction instant would be lost.
- Readable PRNG seed stored on state — rejected: YAGNI; the injectable parameter already satisfies determinism for tests and gameplay uses `Math.random`.

Determinism note: a fake `random` returning `0.0` forces a drop, `0.2` forces no-drop; a uniform sequence `0.00…0.99` yields exactly 10 drops per 100 destructions (spec SC-001 boundary).

---

## R2 — Power-up object representation

**Decision**: The power-up is a new entity kind **`'POWERUP'`** living in the existing `state.asteroids` collection, created by a new factory `createPowerup(x, y, heading, speed)` in `src/entities.js`, with `radius: RADII.POWERUP = 14` and velocity `vx = cos(heading)·speed`, `vy = sin(heading)·speed`. It is a member of the existing **non-regular family** alongside `'SPECIAL'`: every `kind !== 'SPECIAL'` regularity check in `src/collision.js` and `src/spawn.js` is generalized to exclude `POWERUP` too (a single `isRegular(asteroid)` helper in `config.js` or `entities.js` keeps the two lists per-file coherent).

**Rationale**: reuse for free — motion and border despawn (FR-013) are already implemented generically for every asteroid in `moveAsteroids`; cap exclusion and non-interaction are already implemented as `SPECIAL` exclusions; rendering flows through the existing per-asteroid pass. A separate top-level collection would re-implement motion/despawn/filtering for zero benefit and risk divergent behaviour.

**Alternatives considered**:
- Its own `state.powerups[]` array with its own update loop — rejected: duplicates border checks and render iteration; more save points for the same behaviour.
- Reusing kind `'SPECIAL'` with extra fields — rejected: mixes two unrelated rewards; the interaction matrix of feature 001 §4 keys on kinds.

**Invariants** (per data-model.md §3): the power-up never receives a `birthStep` tag (only split fragments do — feature 002 data-model §2), never created by `tickSpawn`, never counted by the tier cap, ignored by regular×regular rules and ignored by the ship-damage pass.

---

## R3 — The delegated V half-angle of the double-shot pair (spec FR-007)

**Decision**: `POWERUP_SPREAD_HALF_ANGLE = 10°` (`Math.PI / 18`) in `src/config.js`. Each projectile of the pair is created at the ship's position with `ship.angle ± 10°` and the normal projectile speed (`LIMITS.projSpeed = 300` px/s).

**Rationale**: the spec delegates the exact angle to planning with the constraint "small enough that both shots stay near the aim line" (FR-007, clarification Q1 → B: same origin, slight symmetric V divergence). 0° would fail "non-overlapping pair" visibility (two overlapping 7×3 rects look like one shot — unacceptable for the reward to read as doubled); the existing split half-angle (25°, `V_HALF_ANGLE`) would make the aimed target frequently missed — the power-up would punish aiming; 10° keeps both shots on a small asteroid-sized target within mid-field ranges while making the pair clearly two distinct trajectories within a fraction of a second of divergence.

**Alternatives considered**:
- 0° (identical trajectories) — rejected: pair indistinguishable from one shot; contradicts the clarification Q1 choice.
- ±25° (reuse `V_HALF_ANGLE`) — rejected: too wide for a weapon the player aims with; makes the reward feel like a penalty at range.
- ±15° or ±20° — viable middle grounds; 10° chosen as the conservative "stay near the aim line" bound most sympathetic to the existing combat ranges (small asteroids, radius 14, hit-detection is circle-based so wider spread also wastes a projectile on near-misses).

This is the **only** new numeric in the feature that the spec did not bind (constitution III: spec-delegated slot, explicitly allowed).

---

## R4 — Effect storage and lifecycle

**Decision**: One boolean field `state.doubleShot` (default `false`) on `createGame()` in `src/state.js`. Set to `true` at the instant of any collection (ship or projectile contact with a `POWERUP`). Cleared to `false` at the **completion of the death sequence**: (a) in the `DYING` resolution branch of `update.js` right where `state.lives -= 1` executes, and (b) in `hitShip()`'s `GAME_OVER` branch in `src/collision.js` (the final life loss). No timer, no countdown — the effect's only terminator is life loss (FR-015, FR-010).

**Rationale**: the flag lives on state rather than on the ship object because the ship is recreated (not mutated) at respawn — a ship-bound flag would accidentally reset as soon as the new ship object is created *before* life loss is counted in `GAME_OVER`, and conversely must persist across respawn only to vanish exactly at the `lives -= 1` instant. A single boolean makes FR-014 (no stacking) automatic and is the simplest possible implementation (YAGNI). FR-011 (in-flight projectiles retained) is satisfied for free: the flag only gates the emission of new shots, never mutates existing projectiles.

**Alternatives considered**:
- Flag on `ship` — rejected: lifecycle collisions with ship recreation (see Rationale).
- Counter + duration timer — rejected: spec FR-015 forbids time-based termination; timer is dead complexity.
- Storing per-ship-double-shot — rejected: needs the same state-level decode anyway.

---

## R5 — Firing path and the B-1 capacity rule

**Decision**: `fire(state, input)` in `src/update.js` becomes:
1. Baseline gate: `!input.fire || state.shotT > 0` → return (unchanged).
2. If `state.doubleShot` → push **two** projectiles (`ship.angle ± POWERUP_SPREAD_HALF_ANGLE`) and apply **once** the normal recoil (`ship.speed = max(ship.speed − 30, −60)`, `LIMITS` reused) — no population refusal at all (clarification Q3 → B-1).
3. Else → push one projectile with the existing refusal `state.projectiles.length >= LIMITS.maxProjectiles` and the same single recoil (behaviour identical to today).
4. `state.shotT = TIMINGS.shotInterval` in both cases (cadence unchanged, FR-008).

The doubled limit (10) is a **soft operating point**: no code enforces it — it documents the nominal capacity burst the mechanic produces. `LIMITS.maxProjectiles` stays `5` (binding 5-projectile cap of feature 001 untouched).

**Rationale**: B-1 (user-accepted) forbids splitting or refusing the pair while the effect lasts; any transient over-count reabsorbs as the border-damage filter removes expired projectiles at end of step. Keeping the normal path's refusal untouched guarantees the post-effect restoration is exactly the pre-feature behaviour (FR-010, quickstart V5).

**Alternatives considered**:
- Enforcing a hard doubled refusal `>= 2 × max` — rejected: that is the rejected B-2/Option-A semantics (user chose B-1: "el par se dispara de todos modos… sin techo duro adicional").
- Recoil twice — rejected: clarification Q2 → A binds one recoil of normal magnitude per shot.

---

## R6 — Red-green test strategy

**Decision**: two new pure-logic files, written **before** implementation and observed failing (constitution II):
- `tests/powerup.test.js` — drives `resolveCollisions()` (with injected fake `random`) and `update()`: drop fires exactly when `random() < 0.1` and never otherwise; 100 uniform rolls → exactly 10 drops (SC-001); the power-up inherits the destroyed small's exact position and `vx/vy` (SC-002); projectile×POWERUP and ship×POWERUP both activate the effect with no score/life change (SC-003, SC-006); activation works while `shieldT > 0` (Edge case); POWERUP despawns at borders; POWERUP never counted in the tier cap and never collides with regulars (FR-012); duplicate collection leaves the flag `true` (FR-014).
- `tests/double-shot.test.js` — drives `update()` over multi-frame sequences: an active effect emits exactly 2 projectiles per tap as a symmetric V around the current `ship.angle`, each at 300 px/s (SC-003); one recoil of normal magnitude per double shot (SC/Q2-A); burst cadence unchanged, pair present per tick; while active no shot is refused for space (B-1) and the count reabsorbs as projectiles expire; effect ends exactly at the death-sequence completion (flag `false` after respawn with `lives` decremented) and at game over; after termination each tap yields one projectile and the normal refusal resumes while in-flight excess persists (FR-010/FR-011, SC-005).

Multi-frame framing reuses the pattern of `tests/split-projectile.test.js` (aligned steps of `update(DT_MS)` at 60 Hz). All numerics asserted exactly (constitution III).

**Alternatives considered**:
- Browser automation — rejected: constitution II tests are DOM-free; visual identity is only checked manually (quickstart V1/V2).
- Distribution/statistical tests with the real `Math.random` — rejected: useless for red-green (nondeterministic); the seeded 10-in-100 check is deterministic and exact.

---

## R7 — Visual identity of the power-up (FR-003)

**Decision**: the power-up is drawn as a **gold double-bar glyph**: two short parallel projectile-shaped bars (the game's projectile rectangle, doubled side by side) inside/over a rotated gold square, fill `PALETTE.powerup = '#F2C14E'` with highlight `PALETTE.powerupHighlight = '#F8D089'`, rotation animated from its `heading`/`rot`. It reuses the draw style family of `drawSpecial` (fill + highlight layering) so the render pass stays consistent.

**Rationale**: the glyph literally depicts the reward (two projectiles side by side) — it is distinguishable at a glance from every existing actor (white polygon asteroids, white ship, soft-green special, white rects) using a colour not present anywhere in the current palette; the internal drawing requires no new primitives beyond one `drawPowerup(ctx, powerup)` in `src/render/shapes.js`.

**Alternatives considered**:
- Diamond alone — distinct but does not communicate the reward; text-free label needed (no text HUD per spec Assumption).
- New colour alone on the ship silhouette — risks confusion with the green bonus-life ship (same shape); gold + double-bar avoids it.

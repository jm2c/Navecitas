# Data Model: Double Shot Power-Up (Phase 1)

**Feature**: `003-double-shot-powerup` | Derived from `spec.md` §Key Entities + FRs and research.md R1–R7; spec numbers 10% / doubled capacity / once-recoil / termination-at-life-loss are binding; the pair's V half-angle is the spec-delegated slot (FR-007 → 10°, research.md R3).

All entities remain plain objects created by factories in `src/entities.js` / `src/state.js`. Coordinates are **logical pixels in the fixed 800×600 play area**; angles in radians (`0` = right, clockwise on screen); speeds in px/s. Feature-001's data-model (§1–§8) stays authoritative wherever not restated or modified here.

---

## 1. GameState changes (`createGame()`)

| Field | Change | Type | Default | Notes |
|---|---|---|---|---|
| `doubleShot` | **NEW** | boolean | `false` | the double-shot effect flag (research.md R4); set on any POWERUP collection, cleared exactly at life loss (§4) |

All other fields unchanged (`projectiles` breaching the normal cap of 5 is legal only while `doubleShot` is `true` — see §5).

**Validation rules**
- `doubleShot` only changes through collection (`→ true`) and the life-loss terminators (`→ false`); no other writer exists.
- Invariant: `doubleShot === true ⇒ at least one collection happened since the last life loss` (no way to activate without a POWERUP being consumed).

## 2. Projectile changes (`createProjectile(ship, headingOffset = 0)`)

| Aspect | Change |
|---|---|
| New optional parameter | `headingOffset` (radians, default `0`) — the launcher heading becomes `ship.angle + headingOffset` |

The projectile rectangle, speed (300 px/s) and border-removal behaviour are unchanged. Normal single shots are `createProjectile(ship)` (offset `0`), so firing code today is untouched in behaviour.

## 3. PowerUp entity (NEW kind `'POWERUP'` in `state.asteroids`)

Factory: `createPowerup(x, y, heading, speed)` in `src/entities.js`.

| Field | Type | Value / Range | Notes |
|---|---|---|---|
| `kind` | enum | `'POWERUP'` | member of the **non-regular family** (like `'SPECIAL'`) |
| `x`, `y` | number | the destroyed small asteroid's position at its destruction instant (FR-002) | despawns at any border crossing, like every asteroid |
| `heading` | number (rad) | the destroyed small's heading at the destruction instant | never mutated afterwards |
| `vx`, `vy` | number (px/s) | `cos(heading)·speed`, `sin(heading)·speed`; speed = the destroyed small's speed **at that instant** (FR-002) | i.e. exactly the parent's velocity vector |
| `radius` | number | `14` (`RADII.POWERUP`) | collision circle, same size class as small/special |
| `rot` | number | `heading` at creation | used for the glyph's spin-up orientation |
| `spin` | number | small visual rotation (like asteroids' 0.4–1.2 rad/s) | cosmetic only (FR-003) |
| `seed` | number | fresh random seed | cosmetic only |
| `dead` | boolean | `false` → `true` on border crossing or collection | standard end-of-step filter |

**Lifecycle**

```
destroyed SMALL (any cause)  --random() < 0.1-->  born at parent pos/velocity
   --ship contact (any alive state, immunity included)-->  collected: dead, doubleShot = true
   --projectile contact-->  both dead: collected: doubleShot = true
   --border crossing-->  dead (FR-013)
```

**Interaction matrix (delta on feature-001 data-model §4; third column = `'POWERUP'`)**

| Interaction | SMALL/MEDIUM/LARGE | SPECIAL | POWERUP |
|---|---|---|---|
| Projectile hits | size rule + score | consumed, +1 life | **both consumed, activate double shot, 0 score** |
| Ship touches | damage (when not immune) | consumed, +1 life | **consumed, activate double shot, ship never harmed (immunity included)** |
| Regular×regular | size rule, no score | ignored | **ignored** |
| Tier population cap (`tickSpawn`) | counted | not counted | **not counted** (and never edge-spawned) |
| Border | despawn | despawn | **despawn** (FR-013) |

**Validation rules**
- Exactly one roll per destroyed SMALL per destruction instant; independent across events (FR-001).
- The POWERUP **never** receives a `birthStep` tag (feature-002 invariant: only split fragments are tagged; research.md R2).
- A collection sets `doubleShot = true` even if it was already `true` (FR-014 no-stacking: duplicate is consumed, flag stays `true`).

## 4. Termination points of `doubleShot` (FR-010)

| Path | Where the flag clears |
|---|---|
| Ship hit with `reserveIcons ≥ 1` | `update.js` `DYING` completion branch — at the same statement as `state.lives -= 1` (death-sequence completion) |
| Ship hit with `reserveIcons === 0` | `collision.js` `hitShip()` `GAME_OVER` branch (final life loss) |

No other path ever writes `false`. During the 500 ms `DYING` window the flag **stays `true`** (the life is not lost until the sequence completes — FR-010 wording "at the completion of the death sequence").

## 5. Firing rules (delta on feature-001 rules)

| Rule | Normal (`doubleShot === false`) | Active (`doubleShot === true`) |
|---|---|---|
| Refusal for space | `projectiles.length >= 5` → refuse | **never for space** (B-1: pair always fired) |
| Rounds per firing tick | 1 projectile at `ship.angle` | **2** projectiles at `ship.angle ± 10°` (`POWERUP_SPREAD_HALF_ANGLE`, research.md R3) |
| Recoil | once, `−30`, backward clamp `≥ −60` | **once** (same values) — never twice per pair (FR-008, clarification Q2 → A) |
| Cadence | `shotT = 160 ms` | identical (FR-008) |
| After termination | normal rule resumes immediately; existing in-flight projectiles are never removed (FR-011) | — |

New constants (`src/config.js`): `POWERUP_DROP_CHANCE = 0.1`, `POWERUP_SPREAD_HALF_ANGLE = (10 × π)/180`, `RADII.POWERUP = 14`, `PALETTE.powerup = '#F2C14E'`, `PALETTE.powerupHighlight = '#F8D089'`. Existing constants (including `LIMITS.maxProjectiles = 5`, `V_HALF_ANGLE`) untouched — constitution III.

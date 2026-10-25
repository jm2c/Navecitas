# Data Model: Fix Asteroid Splitting (Phase 1)

**Feature**: `002-fix-asteroid-splitting` | Derived from `spec.md` §Key Entities + FR-001…FR-009 and `research.md` decisions. This document lists only the **deltas** to the feature-001 data model (`specs/001-space-asteroid-game/data-model.md`), which remains authoritative for everything else.

All entities are plain objects; coordinates are logical pixels in the fixed 800×600 play area, angles in radians, speeds in px/s.

---

## 1. GameState (root, created by `createGame()`) — delta

| Field | Type | Range / Default | Change |
|---|---|---|---|
| `stepCount` | integer | ≥ 0, default `0` | **NEW** — monotonic simulation-step counter; the "instant" clock for fragment protection (research R3) |

- `stepCount` increments exactly once per `update()` call, before collisions are resolved.
- It never resets during a session; it is not rendered, not persisted, not read by the renderer.
- While the tab is hidden `update()` is not called at all (feature-001 FR-033), so `stepCount` freezes with the rest of the simulation.

### Validation rules (new)
- `stepCount` changes only through `update()`; no other module writes it.
- Two fragments are mutually protected **iff** both carry `birthStep === stepCount` of the same step (equal, defined integers) — see §2.

---

## 2. Asteroid / Fragment — delta

The asteroid object (feature-001 §3) gains one optional field:

| Field | Type | Range / Default | Notes |
|---|---|---|---|
| `birthStep` | integer \| absent | absent for edge-spawned asteroids | **NEW** — set only on fragments created by a destruction event; equal values ⇒ mutual protection (FR-005) |

- **Edge-spawned asteroids**: `birthStep` is **absent** (never tagged) ⇒ they never receive protection and are treated as "existed before the birth instant" by the rule in FR-005/US3-3.
- **Fragments** (medium → 2 small, large → 2 medium, from any trigger: projectile hit, ship collision, asteroid-vs-asteroid): `birthStep = state.stepCount` at the moment of creation.
- All other fields (`kind`, `x`, `y`, `heading`, `vx`, `vy`, `radius`, `rot`, `spin`, `seed`, `dead`) are unchanged — fragments are born at the parent's position with headings `parent ± 25°` and the tier speed for their own size.

### Destruction-event state transitions (unchanged rules, now observable)

```
projectile hits MEDIUM  ⇒  MEDIUM removed, +50,  2 SMALL fragments  (birthStep = stepCount)
projectile hits LARGE   ⇒  LARGE  removed, +50,  2 MEDIUM fragments (birthStep = stepCount)
projectile hits SMALL   ⇒  SMALL  removed, +200, no fragments
ship hits MEDIUM/LARGE  ⇒  parent removed, +0,   2 fragments        (birthStep = stepCount)
ship hits SMALL         ⇒  SMALL  removed, +0,   no fragments
MEDIUM vs MEDIUM        ⇒  both removed, +0,     4 SMALL fragments  (same birthStep)
LARGE vs SMALL          ⇒  LARGE→2 MEDIUM, SMALL removed, +0        (same birthStep)
SPECIAL (any trigger)   ⇒  removed, +0/+life, never splits, never tagged
```

### Collision-pair rules (the actual fix)

| Pair | Rule |
|---|---|
| fragment ↔ fragment, `birthStep` equal | **never collide** (pass through; FR-005) |
| fragment ↔ fragment, different `birthStep` | normal size rules |
| fragment ↔ edge-spawned / untagged asteroid | normal size rules (may destroy/split the newborn — accepted) |
| projectile ↔ any regular asteroid | unchanged: projectile consumed, size rule, scoring per trigger |
| ship ↔ regular asteroid | unchanged: FR-004 removal + split, no points; immunity rules untouched |
| special ↔ anything regular | unchanged: no interaction |
| any asteroid ↔ screen border | unchanged: disappears (no wrap) |

### Validation rules (new)
- A destruction event never leaves fewer regular asteroids than the size rules owe, provided a fragment does not later cross a border itself (FR-007).
- The tier cap is enforced **only** at edge spawn (`regular.length < tier.max`); fragments are always created and kept even above the cap, and edge spawns stay blocked until the count falls below it (FR-009). No field is added for this — it is a property of `tickSpawn`.
- Score arithmetic untouched: `addScore` still accepts only 50 or 200; mutual/ship removals award 0 (FR-008, SC-006).

---

## 3. Untouched entities

Ship, Projectile, Score, Life reserve, Difficulty tier, Special asteroid, and all constants (radii, multipliers, V half-angle = 25°, caps 3/3/5/7, 800×600 area) carry over from feature 001 unchanged.

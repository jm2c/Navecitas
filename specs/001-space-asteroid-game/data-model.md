# Data Model: Space Asteroid Game (Phase 1)

**Feature**: `001-space-asteroid-game` | Derived from `spec.md` §Key Entities + FRs; constants from `research.md`.

All entities are plain objects (no classes) created by factories in `src/entities.js` / `src/state.js`. Coordinates are **logical pixels in the fixed 800×600 play area**; angles are radians, `0` = pointing right, increasing clockwise on screen; speeds in px/s.

---

## 1. GameState (root, created once by `createGame()`)

| Field | Type | Range / Default | Notes |
|---|---|---|---|
| `phase` | enum | `START \| COUNTDOWN \| PLAYING \| DYING \| GAME_OVER` | starts `START` (FR-030) |
| `countdownStep` | enum \| null | `3 \| 2 \| 1 \| GO` \| `null` | only during `COUNTDOWN` |
| `countdownT` | number (ms) | ≥ 0 | elapsed in the current step |
| `score` | integer | ≥ 0, default `0` | never decreases (FR-016) |
| `lives` | integer | 3…6, default `3` | total ships; HUD icons = `lives − 1` (2…5) |
| `ship` | Ship \| null | `null` after game over | see §2 |
| `projectiles` | Projectile[] | length 0…5 | cap 5 (FR-007) |
| `asteroids` | Asteroid[] | regular ≤ 3/3/5/7 by tier | special excluded from cap |
| `spawnT` | number (ms) | 0…1400±300 | countdown to next spawn attempt |
| `explosionT` | number (ms) | 0…500 | >0 only while `phase === DYING` |
| `shieldT` | number (ms) | 0…2000 | immunity remaining |
| `lastTime` / `acc` | number | loop bookkeeping | owned by `loop.js`, not by logic |

**Derived (never stored):** `tier = tierFor(score)`; `icons = max(0, lives − 1)`.

**Visibility gate (FR-033)**: while the tab is hidden the simulation is frozen — `update` is not called at all, so every timer field above keeps its exact value; on return the loop resets its accumulator and continues (SC-016: 0 s of hidden time consumed).

### Validation rules
- `score` only changes through `addScore(state, pts)` with `pts ∈ {0, 50, 200}`.
- `lives` only changes through `grantLife(state)` (`min(lives+1, 6)`) and the death rule (`lives − 1` when `icons ≥ 1`).
- `projectiles.length ≤ 5` enforced at fire time; `spawn` respects the tier cap.
- Invariant: `phase === GAME_OVER ⇒ ship === null`.

---

## 2. Ship (player)

| Field | Type | Range / Default | Notes |
|---|---|---|---|
| `x`, `y` | number | 0…800 / 0…600 | wraps on exit (FR-004) |
| `angle` | number (rad) | any, default `-π/2` (points up) | respawn always `-π/2` |
| `speed` | number | **−60 … 260** (−0.3× … 1.3× base) | scalar along `angle`; + forward, − backward |
| `alive` | boolean | `true` | `false` during `DYING` / after game over |
| `radius` | number | `16` | collision circle |

**State transitions**

```
START ──space──► COUNTDOWN("3"→"2"→"1") ──► COUNTDOWN("GO" exit) ──► PLAYING
PLAYING ──regular asteroid hit, icons ≥ 1──► DYING (explosion, ship absent, 500 ms)
DYING ──500 ms elapsed──► PLAYING (centre 400,300, angle −π/2, speed 0, shield 2000 ms)
PLAYING ──regular asteroid hit, icons = 0──► GAME_OVER (ship = null, terminal)
any phase ──immune hit──► unchanged (FR-019)
```

**Movement rules (validated by update)**
- `ArrowLeft/Right`: `angle ∓= π · DT/1000`; `speed` magnitude untouched (SC-001).
- `ArrowUp`: `speed = min(speed + 180·dt, 260)`; `ArrowDown`: `speed = max(speed − 260·dt, 0)` — braking never produces negative speed (FR-001).
- No input ⇒ `speed` unchanged (FR-002, no friction).
- Position integrates as `x += cos(angle)·speed·dt`, `y += sin(angle)·speed·dt`, then wraps: `x < 0 → x += 800` etc., other axis untouched (SC-003).

---

## 3. Projectile

| Field | Type | Range / Default | Notes |
|---|---|---|---|
| `x`, `y` | number | 0…800 / 0…600 | spawned at ship position (FR-005) |
| `vx`, `vy` | number | magnitude = **300** (1.5× base) | straight line, never changes |
| `radius` | number | `3.5` | collision circle |
| `dead` | boolean | `false` | set on hit or border exit (FR-015) |

**Transitions**: created by fire → `dead` when it touches *any* asteroid (consuming itself) **or** when `x<0 ∨ x>800 ∨ y<0 ∨ y>600`. Filtered out of the array at the end of the step. Burst interval 160 ms while Space is held; a single tap = one shot.

---

## 4. Asteroid

| Field | Type | Range / Default | Notes |
|---|---|---|---|
| `kind` | enum | `SMALL \| MEDIUM \| LARGE \| SPECIAL` | `SPECIAL` = life-granting variant |
| `x`, `y` | number | spawn on a border | |
| `vx`, `vy` | number | speed fixed **at creation** by current tier (FR-010) | never re-computed later |
| `radius` | number | 14 / 26 / 44 / 14 | circles |
| `rot` / `spin` | number (rad, rad/s) | visual only | |
| `seed` | integer | 0…N | procedural rock polygon shape |
| `dead` | boolean | `false` | |

**Speed at creation** (from tier of the *current* score):

| Tier | SMALL | MEDIUM | LARGE | SPECIAL |
|---|---|---|---|---|
| 0–1000 | 200 | — | — | 200 |
| >1000–2000 | 220 | 200 | — | 200 |
| >2000–3000 | 240 | 220 | 200 | 200 |
| >3000 | 260 | 240 | 220 | 200 |

`SPECIAL` is **always 200** (base speed, FR-021) and is never tier-scaled.

**Size rule (shared by every removal path)** — `splitOrDestroy(asteroid, awardPoints)`:

| Kind | Result | Score if `awardPoints` |
|---|---|---|
| SMALL | destroyed | +200 (FR-011) |
| MEDIUM | destroyed → 2 SMALL children in a V (±25° about parent heading) at parent position | +50 (FR-012) |
| LARGE | destroyed → 2 MEDIUM children in a V, same rule | +50 (FR-013) |
| SPECIAL | destroyed → **no children**, grants `+1 life` (cap 6), **0 points** (FR-022) |

`awardPoints = false` for asteroid↔asteroid and ship↔asteroid collisions (FR-014, edge case) and always `false` for `SPECIAL`.

**Removal paths**: leaves any border (`x<0 ∨ x>800 ∨ y<0 ∨ y>600`) → gone silently (FR-009). `SPECIAL` has no other removal path except projectile hit / ship contact.

**Interaction matrix**

| | projectile | ship (alive) | regular asteroid | special |
|---|---|---|---|---|
| **regular asteroid** | size rule + score | size rule, no score (unless immune → nothing) | size rule, no score | *no interaction* |
| **SPECIAL** | +1 life, 0 pts | +1 life, never harms | *no interaction* | *no interaction* |

Children count toward the tier cap; `SPECIAL` never does (spec Assumptions).

---

## 5. Score (value object)

`score: integer ≥ 0`. Rules: small +200, medium/large +50, asteroid-vs-asteroid 0, special 0 (FR-011…FR-014, FR-022). Displayed top-right of the 800×600 area at all times (FR-016).

**Bonus-spawn trigger** (evaluated after every score change): `m1 = floor(prev/500)`, `m2 = floor(next/500)`; if `m2 > m1` and `icons < 5` → spawn one `SPECIAL`; if `m2 > m1` and `icons = 5` → **nothing, never queued**. Jump 400→600 ⇒ exactly one spawn; collecting a special never changes score ⇒ never chains (edge cases).

---

## 6. Life reserve (value object)

| State | `lives` (total) | HUD icons (top-left) |
|---|---|---|
| start | 3 | 2 |
| after 1st death | 2 | 1 |
| after 2nd death | 1 | 0 |
| next death | — | **GAME OVER** (FR-020) |
| cap | 6 | 5 (FR-023) |

Icons are static white ship glyphs, one per reserve life (FR-017); they are HUD-only shapes drawn by `render/overlays.js` and have no collision.

---

## 7. Difficulty tier (derived value)

`tierFor(score)` → `{ smallMul, mediumMul, largeMul, weights, maxAsteroids }`, boundaries **exclusive** at 1000/2000/3000 (spec Assumptions): `score ≤ 1000 → T1`, `≤ 2000 → T2`, `≤ 3000 → T3`, else `T4`. Applied **only at spawn/split time**; asteroids already in flight keep their speed (edge case).

Spawn-size probabilities per tier (FR-010, confirmed by clarification 2026-10-04):

| Tier | Small | Medium | Large |
|---|---|---|---|
| T1 (0–1000) | 100 % | 0 % | 0 % |
| T2 (>1000–2000) | 60 % | 40 % | 0 % |
| T3 (>2000–3000) | 40 % | 35 % | 25 % |
| T4 (>3000) | 30 % | 35 % | 35 % |

---

## 8. UI / overlay entities (render-only, never collide)

| Entity | Content | Behaviour |
|---|---|---|
| Start prompt | "Press spacebar to start" | bottom-centre, slow blink 600/600 ms, phase `START` |
| Countdown item | `3`,`2`,`1`,`GO` | shrink 1400→64 px in 350 ms, hold 500 ms, below ship (y≈380); `GO` alone exits by growing to 2400 px while fading over 450 ms |
| Explosion | 8-frame radial burst | drawn at ship position during the 500 ms `DYING` window |
| "Game Over" | bold 140 px, centred | drawn last → world never interacts with it (FR-025) |
| Score HUD | integer | top-right, always visible |
| Life icons | `lives − 1` glyphs | top-left, always visible |

---

## Entity relationship summary

```
GameState 1──1 Ship (nullable after game over)
GameState 1──* Projectile   (≤5)
GameState 1──* Asteroid     (regular ≤ tier cap; SPECIAL uncapped)
GameState 1──1 Score        (integer field, rules in score.js)
GameState 1──1 Life reserve (integer field `lives`, HUD derived)
Score ──triggers──► SPECIAL spawn (per crossed 500 multiple)
Tier (derived from Score) ──gates──► spawn mix, speeds, cap
```

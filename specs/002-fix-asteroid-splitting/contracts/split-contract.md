# Contract: Split & Fragment-Protection Rules

**Feature**: `002-fix-asteroid-splitting` | **Consumers**: `src/update.js` (caller), `tests/*.test.js` (asserters), the renderer (indirectly, via the asteroid list it draws).

This contract formalises the behaviour required by `spec.md` FR-001…FR-009. All numbers are binding (constitution III) and inherited unchanged from feature 001.

---

## 1. Inputs / outputs

```
resolveCollisions(state)  →  mutates state.asteroids, state.projectiles, state.score,
                             state.phase / state.ship (death), may append fragments
update(state, dtMs, input) →  one simulation step; increments state.stepCount exactly
                             once, before collisions are resolved
```

No new exported functions are required by this feature; the contract constrains observable behaviour of existing ones.

## 2. Destruction table (unchanged numbers, now guaranteed observable)

| Trigger | Small | Medium | Large | Score |
|---|---|---|---|---|
| Projectile hit | removed | removed → **2 small** fragments | removed → **2 medium** fragments | +200 / +50 / +50 |
| Asteroid ↔ asteroid | removed | removed → **2 small** each | removed → **2 medium** each | **0** |
| Ship collision (outside immunity) | removed | removed → **2 small** | removed → **2 medium** | **0** |
| Special asteroid (projectile or ship) | removed, grants 1 life | — (never splits) | — (never splits) | **0** |

- Fragments are born at the parent's position with headings `parent heading ± 25°` (V half-angle, binding).
- Fragments receive the tier-appropriate speed **for their own size** at creation (feature-001 FR-010 table).

## 3. Fragment protection (the fix)

- Every fragment carries `birthStep = state.stepCount` at creation; edge-spawned asteroids carry no `birthStep`.
- **Invariant (FR-005)**: while `first.birthStep` and `second.birthStep` are both defined and equal, the asteroid↔asteroid pass MUST NOT destroy, damage or split either one — regardless of which destruction event created them (single split or two collisions resolved in the same step).
- Every other pair (fragment vs untagged asteroid, fragments of different steps, projectile pairs, ship pairs, special pairs) follows the rules in §2 and feature 001.
- Consequence asserted by tests: after a destruction event in an empty mid-field, the fragments it owes are still present on subsequent steps (they never annihilate each other).

## 4. Population cap (FR-006 / FR-009)

- The tier cap (`3 / 3 / 5 / 7` regular asteroids) gates **only** edge spawn attempts: while `regularCount ≥ cap`, `tickSpawn` creates nothing.
- A destruction event always creates all of its fragments, even if this pushes `regularCount` above the cap; nothing in the core ever removes or suppresses a fragment to respect the cap.
- Spawning resumes only once `regularCount < cap` again.

## 5. Scoring (unchanged, FR-008)

- `state.score` is non-decreasing; the only possible increments are **50** (medium/large removed by projectile) and **200** (small removed by projectile); all other removals change it by **0**.
- Score changes happen atomically with the destruction event, before fragments are appended.

## 6. Non-goals / out of scope

- No change to rendering, input, HUD, timing constants, spawn tables, special-asteroid behaviour, wrap-around rules or the `server.js` delivery path.
- No new dependencies, no browser APIs in the core (constitution I/II).

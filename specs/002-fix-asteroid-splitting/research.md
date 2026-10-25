# Research: Fix Asteroid Splitting (Phase 0)

**Feature**: `002-fix-asteroid-splitting` | **Date**: 2026-10-05

No `NEEDS CLARIFICATION` items were open in the Technical Context; this research records the root-cause diagnosis (R1), the fix mechanism and rejected alternatives (R2, R3), the cap-overflow confirmation (R4), the test strategy (R5) and the exact protection scope (R6). Decisions are binding for implementation.

---

## R1 — Root cause of "split asteroids vanish"

**Decision**: The defect is **mutual annihilation of co-born fragments**, not a failure to create them. Fragments are created at the parent's exact position; on the next simulation step they have moved only ~3.3 px each (200 px/s ÷ 60), while the sum of their collision radii is 28 px (small+small), 40 px (small+medium) or 52 px (medium+medium) — so they are still colliding and the size rule destroys them both (smalls have no children ⇒ screen goes empty).

**Evidence** (multi-frame run of the real core modules, `createGame` + `update(1000/60)` with the ship parked away from the action and spawning disabled):

| Scenario | Frame-by-frame asteroid list | Score |
|---|---|---|
| small + projectile | `SMALL,SMALL` → `EMPTY` (correct: smalls never split) | 200 |
| **medium + projectile** | `SMALL,SMALL` → **`EMPTY`** | 50 |
| **large + projectile** | `MEDIUM,MEDIUM` → `SMALL×4` → **`EMPTY`** | 50 |
| **medium vs medium** | `SMALL×4` → **`EMPTY`** | 0 |
| **large vs small** | `MEDIUM,MEDIUM` → `SMALL×4` → **`EMPTY`** | 0 |

This matches the report exactly: correct points, zero surviving fragments, both triggers (projectile and asteroid-vs-asteroid), and it also explains why the unit tests never caught it — `tests/collision.test.js` asserts the state immediately after a single `resolveCollisions()` call and never advances a second step.

**Rationale**: Diagnosing before designing avoids "fixing" the wrong layer — creation (`score.js` `applySizeRule`), scoring and the ± 25° V are all already correct.

**Alternatives considered**: "Fragments are never created" — falsified by the trace (they exist for exactly 1–2 frames); "border removal eats them" — falsified (splits happened mid-field at 400,300); "cap culls them" — falsified (no culling code exists).

---

## R2 — Fix mechanism: same-instant fragment protection

**Decision**: **Birth-instant tagging.** Every fragment is tagged with the simulation step it was born in (`birthStep`); in the asteroid-vs-asteroid pass, a pair in which **both** asteroids are fragments with the **same** `birthStep` is skipped — they pass through each other forever (in practice they separate in a V and never meet again). All other collisions (projectile, ship, fragment vs unrelated asteroid, fragment vs fragment of a different step) keep the existing rules.

**Rationale**: Directly implements FR-005 ("every fragment born in the same instant MUST be mutually protected … no matter which destruction event created it"), is deterministic under `node --test`, adds one integer comparison per asteroid pair, and touches no numeric constant (constitution III).

**Alternatives considered**:

| Alternative | Why rejected |
|---|---|
| Spawn children offset apart (e.g. ±radius along the V) | Changes the specified birth position ("children spawn at the parent's position", feature-001 binding) and still fails for 2 large children (88 px of separation needed) near other rocks |
| Grace period: fragments immune to everything for N ms | Adds a new tuning constant not delegated by any spec, and blocks legitimate interactions (fragment vs ship/projectile) that the spec does not exempt |
| Event-id tagging (one id per destruction event) | Cannot express clarification Q1→A (fragments of *different* events born in the same instant are also protected); a step id covers both cases with one field |
| Resolve collisions before movement in `update` | Does not fix it: children are created after the pair pass and are already within range on the next frame regardless of order |
| Never let asteroids born at identical coordinates collide | Too broad: it would also protect unrelated pairs and reads as a hack rather than a stated rule |

---

## R3 — Where the "same instant" clock comes from

**Decision**: A monotonic **`stepCount`** integer on the game state, incremented exactly once per `update()` simulation step (in `src/update.js`, before collisions are resolved). Fragments capture `stepCount` at creation. Because the simulation is a fixed-timestep, tab-hidden-freezing loop, `stepCount` advances only when the game actually simulates — it is the definition of a game "instant".

**Rationale**: Pure state ⇒ DOM-free and trivially testable (constitution II); immune to wall-clock skew, refresh rate and tab visibility (feature-001 FR-033 already freezes `update` entirely, so no counter drift); works identically for projectile hits, ship collisions and mutual collisions in the same step.

**Alternatives considered**: `performance.now()` timestamp — non-deterministic, breaks reproducible tests, keeps advancing semantics tied to the wall clock; a counter in `loop.js` — puts logic state in the platform layer (browser-only, untestable under `node --test`); comparing fragment coordinates for equality — fragile (floats, unrelated coincidences) and cannot distinguish "born together" from "drifted together".

---

## R4 — Population cap vs fragments (FR-009)

**Decision**: **No code change needed — confirm and lock with a regression test.** `src/spawn.js` `tickSpawn()` only creates an edge asteroid while `regular.length < tier.max`, and nothing in `update.js` ever culls asteroids to enforce the cap. Therefore fragments created while at (or above) the cap are kept, the count may exceed the cap, and further edge spawns stay blocked until it falls back below — exactly clarification Q1→A/FR-009.

**Rationale**: The dangerous "obvious fix" would be to add culling to respect the cap; that would recreate the reported disappearing defect. Making the existing behaviour an explicit test prevents a future refactor from reintroducing it.

**Alternatives considered**: hard cap enforcement by removal — rejected (contradicts FR-009 and the bug report); excluding fragments from the count — rejected (FR-006 says fragments count like any asteroid).

---

## R5 — Test strategy (red-green, multi-frame)

**Decision**: New tests **drive `update()` for multiple frames** (the pattern already in `tests/loop.test.js`: `startGame()` / `steps()` helpers) so they reproduce the real failure; they are written first and must fail against the current code, then pass after the fix. Planned failing-first cases:

1. **T1 medium split survives** — projectile hits a mid-field medium, advance ~5 steps: exactly 2 smalls still present, score 50 (currently: 0 smalls) → SC-001, FR-001.
2. **T2 large split survives** — projectile hits a mid-field large, advance ~5 steps: exactly 2 mediums present, score 50 (currently: 0) → SC-002, FR-002.
3. **T3 full chain** — destroy large → both mediums → all 4 smalls with projectiles, score exactly 950 (currently impossible: children die on their own) → SC-005.
4. **T4 asteroid-vs-asteroid** — two mediums collide mid-field, advance ~5 steps: 4 smalls present, score unchanged (currently: 0) → SC-003, SC-006, FR-003.
5. **T5 cross-event same instant** — two destruction events in the same step produce fragments that overlap: none of them die → FR-005 (clarification Q1→A).
6. **T6 cap overflow** — at tier cap, a destruction event still creates all fragments; while count ≥ cap no new edge spawn appears; below cap spawning resumes → FR-009, FR-006.
7. **T7 no regression** — existing 50 tests stay green (score arithmetic, spawn tables, ship/special interactions).

**Rationale**: Constitution II demands tests that fail before implementation; the original suite missed the bug precisely because it never advanced a second frame.

**Alternatives considered**: asserting only the immediate post-collision state (misses the bug — the original gap); browser-only manual testing (violates the test-first gate and is slower to iterate).

---

## R6 — Protection scope boundaries

**Decision**: Protection is **fragment-vs-fragment only, same `birthStep` only**:

- projectile and ship collisions are unchanged (a projectile is consumed by the parent's hit; the ship's own removal rule is FR-004);
- a fragment vs an asteroid that existed before that instant ⇒ normal rules (may be destroyed/split immediately — accepted in spec Assumptions);
- an edge-spawned asteroid is never tagged, so it never enjoys protection;
- a fragment of step N vs a fragment of step N+1 ⇒ normal rules;
- the special life-granting asteroid is untouched (never splits, never interacts with regulars).

**Rationale**: Matches spec FR-005 and User Story 3 scenarios 1–3 verbatim; keeps the rule testable (T5 covers the cross-event case, an explicit scenario covers the pre-existing-asteroid case).

**Alternatives considered**: protecting all newborns against everything for one step — broader than the spec, would swallow legitimate ship/projectile interactions; protecting only same-event siblings — contradicts clarification Q1→A.

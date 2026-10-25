---

description: "Task list template for feature implementation"
---

# Tasks: Double Shot Power-Up

**Input**: Design documents from `/specs/003-double-shot-powerup/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included because the specification requires measurable drop-chance and firing behaviour delivered test-first (plan.md constitution II gate, quickstart.md "Red-green gate", contracts/powerup-contract.md §8 RNG). Tests are pure-logic `node --test` runs with injectable fake `random` (research.md R1/R6) — no browser automation, zero dependencies.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project at repository root: `index.html`, `server.js`, `src/`, `tests/` (per plan.md §Project Structure). Vanilla JavaScript ES modules, zero npm dependencies, Canvas 2D only. The feature extends the existing modules (`src/config.js`, `src/entities.js`, `src/state.js`, `src/score.js`, `src/collision.js`, `src/spawn.js`, `src/update.js`, `src/render/shapes.js`, `src/render/index.js`); `server.js`, `index.html`, `src/input.js`, `src/loop.js`, `src/main.js` and `src/render/overlays.js` stay out of scope.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline this feature builds on

- [X] T001 Run `npm test` at the repository root and confirm the current 62 tests are green, and confirm `package.json` still declares zero runtime dependencies — record the baseline before touching `src/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The power-up entity, the effect flag and the non-regular exclusion that every story depends on (research.md R2, data-model.md §1/§3, contracts/powerup-contract.md §1/§7)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. Constitution II (test-first) applies.

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T002 [P] Failing-first test: a hand-built POWERUP entity pushed into `state.asteroids` is (a) excluded from `tickSpawn`'s regular-cap count (edge spawns proceed with the cap full), (b) ignored by the regular×regular collision pass (no destruction/split/score against regulars) and by the ship-damage pass (ship touching it is unharmed), and (c) despawned on any border crossing (contract §7 NI-1/NI-2, FR-012, FR-013), in `tests/powerup.test.js`
- [X] T003 [P] Create the spec-bound constants in `src/config.js`: `POWERUP_DROP_CHANCE = 0.1`, `POWERUP_SPREAD_HALF_ANGLE = (10 * Math.PI) / 180` (research.md R3 — the only spec-delegated numeric), `RADII.POWERUP = 14`, `PALETTE.powerup = '#F2C14E'`, `PALETTE.powerupHighlight = '#F8D089'`; do not touch any existing constant (constitution III)
- [X] T004 [P] Create `createPowerup(x, y, heading, speed)` in `src/entities.js` per data-model.md §3 (kind `'POWERUP'`, `radius: RADII.POWERUP`, `vx/vy` from heading/speed, `rot` seeded from heading, cosmetic `spin` 0.4–1.2 rad/s, fresh `seed`, `dead: false`, **no** `birthStep` tag), and add the optional `headingOffset = 0` parameter to `createProjectile(ship)` (launcher heading becomes `ship.angle + headingOffset`; normal callers unchanged)
- [X] T005 Generalize the non-regular exclusion: add `doubleShot: false` to `createGame()` in `src/state.js` and introduce the shared regular check (`kind !== 'SPECIAL' && kind !== 'POWERUP'`) applied to the regular-count filter in `tickSpawn` in `src/spawn.js` and to the regular×regular pass and the ship-damage pass in `src/collision.js` (research.md R2, contract §7 NI-1/NI-2)
- [X] T006 Run `npm test` in `tests/` — the new T002 assertions pass and all 62 pre-existing tests stay green (the entity/flag/exclusion alone must change no observable behaviour)

**Checkpoint**: The simulation can host a POWERUP safely; no story behaviour has landed yet.

---

## Phase 3: User Story 1 - Power-up drops from destroyed small asteroids and is collectible (Priority: P1) 🎯 MVP

**Goal**: Destroying a small asteroid (by any cause) rolls an independent 10% chance that one gold, visually distinct POWERUP appears at the destroyed asteroid's exact position and velocity; touching it with the ship (immunity included) or any projectile activates the double shot with zero score/life change (spec FR-001…FR-006, FR-012…FR-014).

**Independent Test**: quickstart **V1–V2/V6**: destroy smalls repeatedly → roughly 1 in 10 emits the gold double-bar glyph continuing the asteroid's exact course; touching it with ship or projectile consumes it, activates the effect, and never changes score, lives or ship health; duplicates and immunity behave per contract §3; automated mirror in `tests/powerup.test.js`.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (constitution II, research.md R6)**

- [X] T007 [US1] Failing-first tests in `tests/powerup.test.js`: (a) drop fires exactly when the injected `random() < 0.1` and never at `0.2`, through the award path (projectile×SMALL) and the no-award path (regular×regular) — contract §2 DR-1; (b) a uniform `0.00…0.99` sequence over 100 destroyed smalls yields exactly 10 drops (SC-001); (c) the POWERUP is created at the parent's exact `x, y` with `vx, vy` exactly equal to the parent's velocity, untagged (`birthStep === undefined`) — contract §2 DR-2/DR-3, SC-002; (d) projectile×POWERUP and ship×POWERUP both set `doubleShot = true` with 0 score change, no life change, no ship damage, both bodies consumed — contract §3 CR-1/CR-2, SC-006; (e) collection works while `shieldT > 0`; (f) collecting a second POWERUP leaves the flag `true` (no stack) while consuming the duplicate — FR-014; (g) a duplicated small destroyed in one step performs two independent rolls (contract §2 DR-4)

### Implementation for User Story 1

- [X] T008 [US1] Implement the drop roll in `src/score.js`: add the optional `random = Math.random` parameter to `applySizeRule(state, asteroid, awardPoints, random)`; when the destroyed asteroid is SMALL (both award and no-award paths), roll `random() < POWERUP_DROP_CHANCE` once and on success return the foreign entity to be appended: `createPowerup` seeded from the parent's exact velocity (heading = `atan2(vy, vx)`, speed = `hypot(vx, vy)`), position = parent's `x, y`, never `birthStep`-tagged, never tier-valued (research.md R1, contract §2)
- [X] T009 [US1] Implement collection in `src/collision.js`: add the `random = Math.random` passthrough on `resolveCollisions(state, random)` flowing into `applySizeRule`; in the projectile pass, a hit on kind `'POWERUP'` marks projectile and POWERUP dead and sets `state.doubleShot = true` with **no** `addScore` call; in the ship pass, add the POWERUP branch beside the SPECIAL one (alive ship, `phase === 'PLAYING'`, any `shieldT`): consume, `state.doubleShot = true`, ship unharmed, no life change (research.md R4, contract §3)
- [X] T010 [US1] Wire power-up rendering: create `drawPowerup(ctx, powerup)` in `src/render/shapes.js` — gold double-bar glyph (two short parallel projectile-shaped bars over a rotated gold square, fill `PALETTE.powerup`, highlight `PALETTE.powerupHighlight`, radius 14, rotated by `rot`) — and render kind `'POWERUP'` through it in the asteroids pass of `src/render/index.js` (FR-003, research.md R7)

**Checkpoint**: At this point the drop, collection and the (visible) flag are functional — the effect has a source; quickstart V1/V2/V6 cover it.

---

## Phase 4: User Story 2 - Active double shot fires two projectiles at once with doubled soft capacity (Priority: P1)

**Goal**: While `doubleShot` is active, every firing tick emits exactly two projectiles at `ship.angle ± 10°` at normal speed, with exactly one normal-magnitude recoil per pair, unchanged 160 ms cadence, never any space-based refusal or split pair (B-1), with the doubled limit (10) as the nominal operating capacity (spec FR-007…FR-009, clarifications Q1 → B / Q2 → A / Q3 → B-1).

**Independent Test**: quickstart **V3–V4**: activate the effect (via US1 or a staged setup), single-tap and hold fire, count and track projectiles (pair per tick, symmetric V around the current heading, one recoil), stack projectiles to observe no refusal while the effect lasts and natural reabsorption afterwards; automated mirror in `tests/double-shot.test.js`.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T011 [US2] Failing-first tests in `tests/double-shot.test.js` (staged setup: set `state.doubleShot = true`, play through `update()` frames): (a) a single fire tap during an active effect creates exactly 2 projectiles, at headings `ship.angle ± POWERUP_SPREAD_HALF_ANGLE`, each at 300 px/s along its own heading, both born at the ship's position — contract §4 FS-1; (b) after rotating the ship one frame, the pair spreads around the **new** heading (FS-2); (c) recoil per double shot is exactly one step of `LIMITS.recoil` (−30, backward clamp −60) — never two (FR-008, Q2 → A); (d) held fire produces one pair per 160 ms tick (cadence unchanged); (e) while active, firing is never refused for space even when the count exceeds `LIMITS.maxProjectiles` (B-1, CP-1/CP-2), and dead-projectile filtering reabsorbs the exceedance at end of step; (f) the single-shot path (flag `false`) is untouched: 1 projectile, refusal at 5, same recoil

### Implementation for User Story 2

- [X] T012 [US2] Implement double-shot firing in `src/update.js`: rework `fire()` so that while `state.doubleShot` is `true` the baseline gate (`!input.fire || state.shotT > 0`) is followed by an **unconditional pair emission** — `createProjectile(ship, −POWERUP_SPREAD_HALF_ANGLE)` and `createProjectile(ship, +POWERUP_SPREAD_HALF_ANGLE)` — then exactly one `LIMITS.recoil` step (backward clamp `−LIMITS.back`) and `state.shotT = TIMINGS.shotInterval`; when the flag is `false`, keep the current single-projectile emission with the `>= LIMITS.maxProjectiles` refusal and the same single recoil (research.md R5, contract §4/§5)

**Checkpoint**: The reward is complete and feels doubled; US2 is independently testable via quickstart V3–V4.

---

## Phase 5: User Story 3 - The effect ends when the player loses a life (Priority: P2)

**Goal**: `doubleShot` clears exactly at the completion of the death sequence (`DYING` resolution, the instant `lives -= 1`) and in the `GAME_OVER` branch; in-flight projectiles are never removed by the transition; nothing else (time, phases, freezes, extra collections) can end it (spec FR-010/FR-011/FR-015).

**Independent Test**: quickstart **V5**: activate the effect, get destroyed, verify from the first shot after respawn exactly one projectile per tap and the normal refusal; projectiles in flight before the death are seen flying their natural course afterwards; automated mirror in `tests/double-shot.test.js`.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T013 [US3] Failing-first tests in `tests/double-shot.test.js`: (a) with the effect active, a ship hit with reserve icons runs the full 500 ms `DYING` window (flag stays `true` throughout) and reaches the branch where `lives -= 1` executes — from that instant `doubleShot === false` and a subsequent tap yields a single projectile with the normal refusal (TR-1a/Tr-4); (b) a hit with `reserveIcons === 0` transitions to `GAME_OVER` with `doubleShot === false` (TR-1b); (c) projectiles in flight at the death instant are still present after the respawn and expire naturally (FR-011, CP-3); (d) an active effect survives ≥ 10 simulated seconds with no input other than ship movement, and survives a hidden-tab-style freeze (no `update` calls for a gap, then resumption) — only a life loss clears the flag (TR-3)

### Implementation for User Story 3

- [X] T014 [US3] Implement the life-loss terminators: in the `DYING` completion branch of `update()` in `src/update.js`, clear `state.doubleShot = false` at the same statement group as `state.lives -= 1` (respawn/immunity untouched); in `hitShip()` in `src/collision.js`, clear `state.doubleShot = false` in the `GAME_OVER` branch (`state.ship = null`); verify no other write of `false` exists (research.md R4, contract §6)

**Checkpoint**: All user stories independently functional — acquisition, firing and termination are locked down.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Whole-suite validation and sign-off (constitution Development Workflow gates)

- [X] T015 [P] Run `npm test` and fix any failing assertion across all of `tests/` (including the new `tests/powerup.test.js` and `tests/double-shot.test.js`) until the whole suite is green
- [ ] T016 Run the full manual checklist `quickstart.md` **V1–V6** in a browser against `node server.js` (drop rate and visuals, both collection paths, V geometry and once-recoil, B-1 capacity, termination/retention, no-stack/immunity/non-interaction) and fix any deviation; fill the sign-off table
- [ ] T017 [P] Regression sweep: run the feature-001 checklist `specs/001-space-asteroid-game/quickstart.md` **V1–V10** once to prove nothing outside the power-up changed (constitution V); feature-002's V1–V7 stays green within that sweep
- [X] T018 [P] Zero-dependency confirmation: `package.json` unchanged with no runtime dependencies, no new files outside `src/`, `tests/` and `specs/003-double-shot-powerup/`
- [X] T019 Review the final diff for codebase conventions (existing style, no added comments, no debug leftovers) and for spec compliance against `contracts/powerup-contract.md`
- [ ] T020 Commit the changes in `src/`, `tests/` and `specs/003-double-shot-powerup/` on branch `003-double-shot-powerup` once T015–T019 are green

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories (the POWERUP entity, the `doubleShot` flag and the non-regular exclusion are required by every story)
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US2 (P1) technically depends on US1 only for *activation by gameplay* — its tests stage `state.doubleShot = true` directly, so US2 code can be built right after Foundational; US1 should land first as the mechanic's entry point
  - US3 (P2) depends on US2's flag being activatable and read by `fire()` to prove restoration
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — tests stage the flag directly; sequencing after US1 is a delivery choice, not a code dependency
- **User Story 3 (P2)**: Can start after US2 (its restoration assertions need `fire()` reading the flag)

### Within Each User Story

- Tests written FIRST and observed FAILING before implementation (constitution II)
- Core mechanics (`src/score.js` → `src/collision.js` → `src/update.js`) before rendering
- Core implementation before the story's `npm test` run
- Story complete before moving to next priority

### Parallel Opportunities

- T002, T003, T004 are parallel ([P]: different files `tests/powerup.test.js` / `src/config.js` / `src/entities.js`)
- T008 (`src/score.js`) and the T009 collision additions touch different files — but T009 depends on T008's `random` parameter signature, keep sequential
- T010 (`src/render/`) can run in parallel with T011/T012 core work in `src/update.js`
- T011 (`tests/double-shot.test.js`) can be written in parallel with T010 rendering
- Polish T015 ∥ T017 ∥ T018 run in parallel (different artefacts)

---

## Parallel Example: User Story 1

```bash
# Test first, then implementation:
Task: "T007 failing-first collection/drop tests in tests/powerup.test.js"
# then (sequential where signatures depend):
Task: "T008 drop roll in src/score.js (applySizeRule random parameter)"
Task: "T009 collection rules in src/collision.js (random passthrough)"
# in parallel with the core work:
Task: "T010 drawPowerup in src/render/shapes.js + wire in src/render/index.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (baseline green)
2. Complete Phase 2: Foundational (entity + flag + exclusion)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: quickstart V1–V2/V6 + `npm test` — drops appear, collectible, effect flag visible via doubled pairs staged by hand
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → the sim can host a POWERUP safely
2. Add User Story 1 → test independently → demo (drops + collection MVP!)
3. Add User Story 2 → test independently → demo (full reward: doubled fire)
4. Add User Story 3 → test independently → demo (temporary, balanced)
5. Polish → full V1–V6 + feature-001 regression sign-off

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Developer A: User Story 1 (drop + collection) — must land first to activate the mechanic by gameplay
3. Once US1 lands: Developer B: User Story 2 (firing path); Developer C: User Story 3 tests (staged) — T013 can be red-written against the staged flag before T014
4. T015–T019 polish/validation run together at the end

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable (quickstart V1–V2/V6 / V3–V4 / V5)
- Verify tests fail before implementing (red-green gate: `npm test` must show T002, T007, T011, T013 failing before their implementation tasks land)
- Never remove or "tune" a numeric constant to make a test pass (constitution III) — `0.1`, the once-recoil values, the ±10° pair spread and the 160 ms cadence are binding
- The POWERUP is a plain asteroid-family entity: **ignore every regular-asteroid rule for it** (exclusions, cap counting, ship damage, split protection tagging); treat it as you treat `'SPECIAL'`
- `POWERUP_SPREAD_HALF_ANGLE` (10°) is the only spec-delegated numeric — fix it in `src/config.js` exactly once and never retune it
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

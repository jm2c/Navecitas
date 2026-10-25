# Tasks: Guaranteed Drop From Medium Fragments

**Input**: Design documents from `/specs/004-guaranteed-fragment-drop/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: INCLUDED — constitution II mandates red-first, DOM-free `node --test` coverage for the logic core. US1's new behavior is written to fail before implementation; US2's are regression locks (assertions on behavior that must NOT change) and are expected green once US1 is implemented.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. This is an amendment feature: the only production file touched is `src/score.js` (research.md R4 scope firewall).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (matches plan.md structure)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the green baseline and confirm scope (no initialization needed — zero-dependency project already stands)

- [X] T001 Run `npm test` from the repository root and confirm the full suite (all 62 pre-existing tests incl. feature-003's `tests/powerup.test.js` and `tests/double-shot.test.js`, feature-002's `tests/split-*.test.js`) is currently green — record the baseline count

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: None required — this feature adds no state fields, no constants, no entities and no shared infrastructure (data-model.md §1 scope; constitution gates I/III/IV pre-satisfied). No task in this phase; user story work may begin immediately after T001.

---

## Phase 3: User Story 1 - Destroying a small asteroid born from a medium's split always releases the power-up (Priority: P1) 🎯 MVP

**Goal**: A medium-fragment small asteroid, when destroyed (any cause), releases exactly one POWERUP — guaranteed, with the probability roll bypassed entirely; non-guaranteed behaviour untouched.

**Independent Test**: With `resolveCollisions()` driven by an injected fake `random` that always refuses a 10% drop (returns 1.0), destroying a small fragment born from a destroyed medium still yields a POWERUP at the fragment's position with its exact velocity vector — 100% of trials (spec US1, SC-001, contract GD-1/GD-2).

### Tests for User Story 1 ⚠️ (write FIRST, ensure they FAIL before implementation — constitution II)

- [X] T002 [P] [US1] Create `tests/guaranteed-drop.test.js` with failing assertions (import `applySizeRule` from `src/score.js`, `resolveCollisions` from `src/collision.js`, helpers from `src/entities.js`/`src/state.js`; use the injected-`random` pattern): (a) a MEDIUM destroyed via `applySizeRule` returns two SMALL children each with `mediumFragment === true` (data-model §1, OF-1); (b) LARGE children have no `mediumFragment`, `createAsteroid`/spawned asteroids have no `mediumFragment` (OF-2); (c) destroying a `mediumFragment` child with even a `random` that returns 1.0 returns exactly one POWERUP (GD-1) — with position/`vx`/`vy` equal to the destroyed fragment's (GD-2) — repeated across many trials; (d) the powerup returned on the guaranteed path carries no `mediumFragment` and no `birthStep` tag (OF-3, feature-003 invariant); (e) same guarantee on a no-award-path destruction (regulars colliding: equip two affected fragments through `resolveCollisions` with award=false) (GD-1); (f) the injected `random` records ZERO invocations during a guaranteed-path destruction (GD-3 short-circuit); (g) POWERUP spawn position uses the fragment's `x, y` and velocity verbatim `Math.atan2`/`Math.hypot` inheritance (FR-002)
- [X] T003 [US1] Run `npm test` and observe ONLY the new `tests/guaranteed-drop.test.js` assertions failing while every pre-existing suite stays green (red-gate)

### Implementation for User Story 1

- [X] T004 [US1] In `src/score.js` split branch: after `child.birthStep = state.stepCount;` add setting `child.mediumFragment = true;` ONLY when the destroyed asteroid's `kind === 'MEDIUM'` (i.e. `childKind === 'SMALL'` case of data-model §1) — LARGE's MEDIUM children must not receive the flag (OF-1/OF-2)
- [X] T005 [US1] In `src/score.js` SMALL branch (`applySizeRule`): change the drop condition to `asteroid.mediumFragment === true || random() < POWERUP_DROP_CHANCE` keeping the exact same `createPowerup(asteroid.x, asteroid.y, heading, speed)` call with heading `Math.atan2(asteroid.vy, asteroid.vx)` and speed `Math.hypot(asteroid.vx, asteroid.vy)` — the short-circuit ensures the roll is never consulted on the guaranteed path (GD-1/GD-3/GD-4; research R2). No other file may change (RL-3)
- [X] T006 [US1] Run `npm test`: ALL of `tests/guaranteed-drop.test.js` green (US1 assertions a–g) with every pre-existing suite still green (constitution II gate)

**Checkpoint**: User Story 1 is fully functional and independently testable (guaranteed drop live); feature-003's dropped/collection/firing behaviour untouched.

---

## Phase 4: User Story 2 - Small asteroids that are NOT medium fragments keep the unmodified 10% chance (Priority: P2)

**Goal**: The pre-existing independent 10% roll is provably intact for non-fragment smalls; the guaranteed rule extends to nothing else. (Regression lock — assertions added after US1's implementation, expected passing immediately.)

**Independent Test**: Over many simulated destructions of spawned small asteroids, a uniform 0.00–0.99 fake `random` yields exactly 1 drop per 10 destructions, and a 1.0-returning fake yields none — the same convention as feature-003 RNG-2 (spec US2, SC-003, contract GD-4/RL-1).

### Tests for User Story 2 (regression locks — written to PASS in the same red-green file)

- [X] T007 [US2] Extend `tests/guaranteed-drop.test.js` with passing regression assertions: (a) a spawned SMALL (no `mediumFragment`) destroyed with `random = () => 1.0` produces NO powerup and `random` IS consulted exactly once (GD-4); (b) a spawned SMALL destroyed 10 times with the uniform 0.00–0.99 fake produces exactly 1 drop in 10 events (FR-003/SC-003; GD-4); (c) a non-fragment small with `random = () => 0.0` produces one powered drop (boundary convention of feature-003 RNG-2 intact)
- [X] T008 [US2] Run `npm test` from the repository root: full green — including feature-003's `tests/powerup.test.js` (10-in-100 seeded distribution, collection rules) and `tests/double-shot.test.js` (pair geometry, termination) unchanged (RL-1/RL-3)

**Checkpoint**: User Stories 1 AND 2 both hold: guaranteed for medium fragments, untouched 10% otherwise.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Constitution quality gates and end-to-end manual validation

- [ ] T009 Run feature-003's quickstart V1–V5 and features 001/002 sweeps, plus its NEW V1–V6 manual scenarios from `specs/004-guaranteed-fragment-drop/quickstart.md` in a browser (`node server.js` → http://localhost:8000) — in particular V3 (two fragments ⇒ two independent drops), V4 (non-fragment luck rate), and V6 (feature-002 split protection unaffected: fragments never self-destruct because they now carry an extra tag)
- [X] T010 [P] Confirm zero runtime dependencies and no browser APIs in the core diff (`src/score.js` only; constitution I/II) and that every spec numeric is untouched: `POWERUP_DROP_CHANCE = 0.1` remains the sole rate constant; no new constants or state fields (RL-2); update no spec/plan files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately (T001)
- **Foundational (Phase 2)**: Empty — nothing blocks user story work beyond T001
- **User Story 1 (Phase 3)**: Depends only on T001 (baseline)
- **User Story 2 (Phase 4)**: Depends on US1's implementation (T004–T006) because its assertions reuse `src/score.js`'s new field; its lock must be written only after the guarantee exists
- **Polish (Phase 5)**: Depends on US1 + US2 both complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent — the whole MVP lives in `src/score.js` + one test file
- **User Story 2 (P2)**: Sequenced after US1 by file dependency (same test file, same code path), not by logic coupling — its verification intent is "US1 changed nothing it must not"

### Within Each User Story

- US1: tests written and observed FAILING (T002–T003) → tag (T004) → condition (T005) → green (T006)
- US2: locks written (T007) → full-suite pass (T008)

### Parallel Opportunities

- T002 (new test file) is parallel-ready vs anything except T003's red-gate run
- T010 is parallel-ready vs T009 (different concerns: code audit vs manual play)
- Only one production file changes overall (`src/score.js`, tasks T004–T005 sequential) — no other parallel lanes exist for implementation

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001 baseline green)
2. Complete Phase 3 (T002–T006): tests red → implement tag + condition → tests green
3. **STOP and VALIDATE**: play through quickstart V1/V2 — every medium fragment destroyed releases its power-up
4. MVP is the complete functional rule; US2 only secures what did not change

### Incremental Delivery

1. T001 → baseline documented
2. US1 (T002–T006) → guaranteed-drop rule live and red-green proven
3. US2 (T007–T008) → 10%-rate preservation proven, full suite green
4. Polish (T009–T010) → manual end-to-end validation + constitution audit

### Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- The production diff is intentionally tiny (`src/score.js` only — research R4); resist any temptation to touch `config.js`, `collision.js`, `entities.js`, `state.js` or the render layer (RL-3)
- Verify tests fail before implementing (T003 red-gate is mandatory, constitution II)
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
- Avoid: vague tasks, same-file conflicts (US1→US2 sequence resolves them), cross-story dependencies that break independence

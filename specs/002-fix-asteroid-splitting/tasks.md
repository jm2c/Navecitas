---

description: "Task list template for feature implementation"
---

# Tasks: Fix Asteroid Splitting

**Input**: Design documents from `/specs/002-fix-asteroid-splitting/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included because the specification explicitly requires them — spec.md Assumptions ("tests written to fail before the fix is written, every existing and new test passes afterwards"), constitution II (test-first for the DOM-free core) and research.md R5 (T1–T6 failing-first cases). Tests are pure-logic `node --test` runs driving `update()` over multiple frames — no browser automation, zero dependencies.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project at repository root: `index.html`, `server.js`, `src/`, `tests/` (per plan.md §Project Structure). Vanilla JavaScript ES modules, zero npm dependencies, Canvas 2D only. This is a behaviour repair: `server.js`, `index.html`, `src/render/`, `src/input.js`, `src/main.js`, `src/config.js`, `src/spawn.js` and `src/score.js` scoring logic stay out of scope except where a task names them.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline this fix builds on

- [X] T001 Run `npm test` at the repository root and confirm the 50 existing tests in `tests/` are green, and confirm `package.json` still declares zero runtime dependencies — record the baseline before touching `src/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The birth-instant clock that every user story depends on (research.md R3, data-model.md §1, contracts/split-contract.md §1)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T002 [P] Failing-first test: assert `state.stepCount` starts at `0` and increments by exactly 1 per `update()` call (including while frozen phases advance) in `tests/loop.test.js`
- [X] T003 Add `stepCount` field, default `0`, to `createGame()` in `src/state.js`
- [X] T004 Increment `state.stepCount` exactly once per `update()` call, before `resolveCollisions(state)`, in `src/update.js`
- [X] T005 Run `npm test` in `tests/` — the new T002 assertion passes and all 50 pre-existing tests stay green (the clock alone must change no behaviour)

**Checkpoint**: The simulation now has a deterministic "instant" counter; no story behaviour has changed yet.

---

## Phase 3: User Story 1 - Medium and large asteroids visibly split when shot (Priority: P1)

**Goal**: A projectile hit on a medium leaves 2 small fragments and a hit on a large leaves 2 medium fragments that visibly survive and separate (V at ± 25°), awarding exactly +50 each (spec FR-001, FR-002).

**Independent Test**: quickstart.md **V1–V3**: shoot a mid-field medium → exactly 2 smalls still present 3–5 s later with +50; shoot a mid-field large → exactly 2 mediums with +50; run the full chain large → 2 mediums → 4 smalls for exactly +950 total (SC-001, SC-002, SC-005); automated mirror in `tests/split-projectile.test.js`.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (research.md R5 T1–T3)**

- [X] T006 [US1] Failing-first test: projectile hits a mid-field medium (ship parked away, spawn disabled), advance 5× `update(DT_MS)` → exactly 2 `SMALL` asteroids still present and score `50` (currently reproduces `SMALL,SMALL → EMPTY`) in `tests/split-projectile.test.js`
- [X] T007 [US1] Failing-first test: projectile hits a mid-field large, advance 5 steps → exactly 2 `MEDIUM` asteroids present and score `50` (currently reproduces `MEDIUM,MEDIUM → SMALL×4 → EMPTY`) in `tests/split-projectile.test.js`
- [X] T008 [US1] Failing-first test: destroy one large, then both medium children, then all 4 small grandchildren with projectiles → score exactly `950` and no fragment ever disappears on its own in `tests/split-projectile.test.js`

### Implementation for User Story 1

- [X] T009 [US1] Tag every fragment with `birthStep = state.stepCount` at creation in `applySizeRule()` in `src/score.js` (both the award and no-award paths); edge-spawned asteroids must receive no tag (data-model.md §2)
- [X] T010 [US1] In the asteroid-vs-asteroid pass of `resolveCollisions()` in `src/collision.js`, skip a pair when both asteroids are fragments with the same defined `birthStep` (FR-005, contracts/split-contract.md §3); leave every other pair rule untouched
- [X] T011 [US1] Run `npm test` — T006–T008 now pass with the 50 baseline tests still green; verify the reproduction trace from research.md R1 no longer ends in `EMPTY` (SC-001, SC-002)

**Checkpoint**: User Story 1 is fully functional — projectile splits survive and score correctly, independently testable via quickstart V1–V3.

---

## Phase 4: User Story 2 - Asteroid-vs-asteroid collisions fragment instead of erasing (Priority: P1)

**Goal**: Two colliding regular asteroids are each replaced by their owed fragments (medium+medium ⇒ 4 smalls), all present on screen, with zero score change (spec FR-003, SC-003, SC-006).

**Independent Test**: quickstart.md **V4**: watch/lure two regular asteroids together → every fragment owed by both parents exists right after the collision and the score is byte-identical before and after; automated mirror in `tests/split-collision.test.js`.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (research.md R5 T4)**

- [X] T012 [US2] Failing-first test: two `MEDIUM` asteroids touching mid-field, advance 5 steps → exactly 4 `SMALL` asteroids present, score unchanged at `0` (currently reproduces `SMALL×4 → EMPTY`) in `tests/split-collision.test.js`
- [X] T013 [US2] Failing-first test: `LARGE` + `SMALL` touching mid-field, advance 5 steps → exactly 2 `MEDIUM` fragments present and no others, score unchanged at `0` in `tests/split-collision.test.js`

### Implementation for User Story 2

- [X] T014 [US2] Verify the no-award path of `applySizeRule(state, asteroid, false)` in `src/score.js` tags its returned children with the same `state.stepCount` as the award path, and that `resolveCollisions()` in `src/collision.js` applies the size rule to *both* parents of a mutual collision before appending (share one birth instant) — adjust only if T012/T013 show a gap
- [ ] T015 [US2] Run `npm test` including the untouched FR-014 case in `tests/collision.test.js` (score stays 0 on repeated resolution), then walk quickstart **V4** — all green (SC-003, SC-006)

**Checkpoint**: User Stories 1 AND 2 both work independently — both triggers of the original defect are fixed.

---

## Phase 5: User Story 3 - Fragments behave as ordinary asteroids afterwards (Priority: P2)

**Goal**: Fragments are ordinary asteroids afterwards — protected only against co-born fragments (FR-005, including cross-event same-instant pairs), normal rules against everything older, counted toward the cap with cap enforced on edge spawns only (FR-006, FR-009, SC-007).

**Independent Test**: quickstart.md **V5–V6**: let fragments drift → tier speed, border removal, +200/+50 when shot; at the tier cap a destruction event still creates all fragments while no new border spawn appears, and spawning resumes below the cap; automated mirrors in `tests/split-protection.test.js` and `tests/split-cap.test.js`.

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation where behaviour is currently broken (research.md R5 T5–T6); T017 is a regression guard that may already pass — keep it anyway**

- [X] T016 [P] [US3] Protection-scope tests: (a) fragments from two *different* destruction events resolved in the same step and overlapping survive each other (FR-005 clarification Q1); (b) a fragment vs an untagged asteroid that existed before that instant follows normal size rules; (c) fragments born in consecutive steps follow normal size rules in `tests/split-protection.test.js`
- [X] T017 [P] [US3] Cap-overflow tests: with regular count at the tier cap, a destruction event still creates every fragment (count may exceed the cap), `tickSpawn` creates nothing while count ≥ cap, and edge spawning resumes once count < cap (FR-009, FR-006, contracts/split-contract.md §4) in `tests/split-cap.test.js`
- [X] T018 [US3] Fragment-as-ordinary test: a fragment later hit by a projectile awards its own size points (200 small / 50 medium) and any fragment crossing a border disappears (FR-006, FR-008) in `tests/split-protection.test.js`

### Implementation for User Story 3

- [X] T019 [US3] Confirm in `src/entities.js` / `src/spawn.js` that edge-spawned and special asteroids never receive a `birthStep` tag and that only `applySizeRule()` in `src/score.js` creates tags — fix any leak so untagged asteroids can never hide behind the protection rule (data-model.md §2)
- [ ] T020 [US3] Run `npm test` — T016–T018 pass alongside everything else, then walk quickstart **V5–V6** (SC-007)

**Checkpoint**: All user stories independently functional — the fix, its collision trigger, its protection scope and its cap interaction are all locked down.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Whole-suite validation and sign-off (constitution Development Workflow gates)

- [X] T021 [P] Run `npm test` and fix any failing assertion across all of `tests/loop.test.js`, `tests/score.test.js`, `tests/collision.test.js`, `tests/spawn.test.js`, `tests/lives.test.js`, `tests/bonus.test.js`, `tests/split-projectile.test.js`, `tests/split-collision.test.js`, `tests/split-protection.test.js`, `tests/split-cap.test.js` until the whole suite is green
- [ ] T022 Run the full manual checklist `quickstart.md` **V1–V7** in a browser against `node server.js` (medium split, large split, 950-point chain, asteroid-vs-asteroid, fragment behaviour, cap overflow, regression sweep) and fix any deviation; fill the sign-off table
- [ ] T023 [P] Regression sweep: run the feature-001 checklist `specs/001-space-asteroid-game/quickstart.md` **V1–V10** once to prove nothing outside splitting changed (constitution V)
- [X] T024 [P] Zero-dependency confirmation: `package.json` unchanged with no runtime dependencies, no new files outside `src/`, `tests/` and `specs/002-fix-asteroid-splitting/`
- [X] T025 Review the final diff for codebase conventions (existing style, no added comments, no debug leftovers) and for spec compliance against `contracts/split-contract.md`
- [ ] T026 Commit the changes in `src/`, `tests/` and `specs/002-fix-asteroid-splitting/` on branch `002-fix-asteroid-splitting` once T021–T025 are green

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories (the `stepCount` clock is required by the fragment tag)
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1) first — it delivers the reported defect's primary trigger
  - US2 (P1) next — same fix path, different trigger, independent tests
  - US3 (P2) last — protection scope + cap regression guards
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - reuses the US1 tagging/protection code but is independently testable via `tests/split-collision.test.js` and quickstart V4
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - its scope-boundary and cap tests validate the same core from different angles

### Within Each User Story

- Tests written FIRST and observed FAILING before implementation (constitution II, research.md R5)
- Tagging (`src/score.js`) before protection (`src/collision.js`)
- Core implementation before the story's `npm test` + quickstart run
- Story complete before moving to next priority

### Parallel Opportunities

- T002 runs parallel with any other file work (different file: `tests/loop.test.js`)
- Once US1 lands, the three new test files are independent: `tests/split-protection.test.js` (T016, T018) ∥ `tests/split-cap.test.js` (T017) — different files, no shared state
- Polish tasks T021 ∥ T023 ∥ T024 run in parallel (different artefacts)
- T006→T007→T008 share one file (`tests/split-projectile.test.js`) and must stay sequential

---

## Parallel Example: User Story 1

```bash
# Tests first (same file → sequential):
Task: "T006 red test: medium split survives in tests/split-projectile.test.js"
Task: "T007 red test: large split survives in tests/split-projectile.test.js"
Task: "T008 red test: 950-point chain in tests/split-projectile.test.js"

# Then implementation (different files → parallelizable):
Task: "T009 tag fragments with birthStep in src/score.js"
Task: "T010 skip same-birthStep pairs in src/collision.js"
# (T009 and T010 touch different files; run npm test after both land)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (baseline green)
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: quickstart V1–V3 + `npm test` — the reported defect (projectile → no split) is fixed
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → clock in place, behaviour unchanged
2. Add User Story 1 → test independently → demo (MVP! projectile splits work)
3. Add User Story 2 → test independently → demo (both triggers fixed)
4. Add User Story 3 → test independently → demo (scope + cap locked)
5. Polish → full V1–V7 + feature-001 regression sign-off

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Developer A: User Story 1 (core fix) — must land first since US2/US3 validate it
3. Once US1 lands: Developer B writes `tests/split-collision.test.js` + verification (US2); Developer C writes `tests/split-protection.test.js` + `tests/split-cap.test.js` (US3)
4. T021–T025 polish/validation run together at the end

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable (quickstart V1–V3 / V4 / V5–V6)
- Verify tests fail before implementing (red-green gate: `npm test` must show T006–T008, T012–T013, T016 failing before the fix)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
- Never remove or "tune" a numeric constant to make a test pass (constitution III) — the fix is structural (same-instant protection), not numeric

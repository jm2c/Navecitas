---
description: "Task list for sound effects feature 006"
---

# Tasks: Sound Effects for Game Events

**Input**: Design documents from `/specs/006-sound-effects/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included because constitution Principle II requires test-first for the DOM-free core and plan.md specifies red-first `node --test` suites. Write each test task before its implementation task and confirm it fails for the expected reason.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested and demonstrated independently. All gameplay rules, the 800×600 world and the visual layer are frozen; the only code delta is semantic event emission plus the browser-only audio layer.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Which user story the task belongs to (`US1`, `US2`, `US3`)
- Include exact file paths in descriptions

## Path Conventions

- Single project: `src/` and `tests/` at the repository root
- Feature docs: `specs/006-sound-effects/`
- No build step, no packages, no audio assets

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing zero-dependency baseline and prepare the audio module location.

- [X] T001 Verify the pre-change baseline from the repository root: run `npm test` (expect 100 passing), confirm `package.json` has empty `dependencies`/`devDependencies`, and confirm `assets/` contains no `.wav`/`.mp3`/`.ogg`/`.m4a`/`.flac`/`.aac`/`.opus` files; record the result in the working notes.
- [X] T002 [P] Create the `src/audio/` directory for the new cue catalog and engine (it does not exist yet).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure event infrastructure, cue catalog and browser audio engine that every user story consumes.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

### Tests first (write and confirm red)

- [X] T003 [P] Write `tests/audio-cues.test.js` red-first: assert `CUE_CATALOG` keys equal `Object.values(GAME_EVENTS)` exactly; every recipe is unique; `countdown:go` differs from the three digit recipes; every `durationMs > 0` and `<= CUE_DURATION_LIMIT_MS` (1500), with the game-over cue `<= 1000`; every layer gain is in `0.02–0.10`; no URL/file path/`src`/audio-asset field exists in the catalog. It must fail because `src/audio/cues.js` does not exist yet.
- [X] T004 [P] Write `tests/events.test.js` red-first: import `GAME_EVENTS`, `emitEvent`, `drainEvents`, `clearEvents`; assert the 11 exact ids; assert `emitEvent` appends, `drainEvents` returns in order and clears, `clearEvents` discards; assert `createGame()` starts with `events: []`. It must fail because `src/events.js` and the `events` field do not exist yet.

### Implementation

- [X] T005 [P] Create `src/events.js` with the frozen `GAME_EVENTS` object containing exactly the 11 ids from `contracts/sound-effects-contract.md` §SE-1, plus pure `emitEvent(state, id)`, `drainEvents(state)` and `clearEvents(state)` helpers; no browser/DOM APIs.
- [X] T006 [P] Add the transient `events: []` field to `createGame()` in `src/state.js`; do not change any other field or value.
- [X] T007 Create `src/audio/cues.js` with `CUE_DURATION_LIMIT_MS = 1500` and a frozen `CUE_CATALOG` covering all 11 event ids with the recipes and durations in `data-model.md` §3; every cue is pure data (no DOM, no URLs, no assets) and uniquely identifiable.
- [X] T008 Create `src/audio/engine.js` implementing `createAudioEngine()` per `contracts/sound-effects-contract.md` §AE: lazy `AudioContext`/`webkitAudioContext` on first deliberate `keydown`/`pointerdown`; master gain + dynamics compressor; one reusable ~1 s noise buffer; tracked active sources; `playEvents(ids)` with a bounded timestamped pending list (max 32, drop entries older than 300 ms); `unlock()`, `suspend()` (stop active sources + clear pending), `resume()`; silent retry/fallback on failure; no async throw escapes.
- [X] T009 Integrate the engine in `src/main.js`: import `createAudioEngine`, `drainEvents` and `clearEvents`; create one engine; call `audio.playEvents(drainEvents(state))` once per render before `render(...)`; clear `state.events` on `visibilitychange` when hidden; keep `src/loop.js` and `src/input.js` unchanged.

**Checkpoint**: `npm test` is green for the cue/queue suites and all existing suites; importing `src/main.js` in a browser creates no AudioContext until the first key/pointer input and produces no console errors.

---

## Phase 3: User Story 1 - Combat actions give immediate audio feedback (Priority: P1) 🎯 MVP

**Goal**: Firing, asteroid destruction and asteroid splitting each emit exactly one semantic event and play their own distinct synthesized cue.

**Independent Test**: After this phase, start a game, fire once, shoot a small asteroid and split a medium asteroid; `tests/events.test.js` proves the exact event counts and quickstart V2–V3 proves the three cues are audible and distinct. This works without US2/US3.

### Tests for User Story 1 (write first, confirm red)

- [X] T010 [US1] Add failing tests to `tests/events.test.js`: one `shot` per successful trigger; zero `shot` when the cooldown or projectile limit blocks; exactly one `shot` for a double-shot trigger; one `asteroid:destroyed` per small asteroid; one `asteroid:split` per medium/large parent; correct counts when several asteroids resolve in one update; no combat event for a non-hit/overlap that does not resolve.

### Implementation for User Story 1

- [X] T011 [P] [US1] Emit `GAME_EVENTS.SHOT` exactly once in `src/update.js` `fire()` after projectile creation and state updates; return before emitting when `state.shotT > 0` or the non-double-shot projectile limit blocks; do not emit per projectile in double-shot mode.
- [X] T012 [P] [US1] Emit `GAME_EVENTS.ASTEROID_DESTROYED` for a `SMALL` asteroid and `GAME_EVENTS.ASTEROID_SPLIT` for a `MEDIUM`/`LARGE` parent in `src/score.js` `applySizeRule`, once per affected asteroid, for projectile, ship and asteroid–asteroid causes; leave scoring, drops and fragment construction unchanged.
- [ ] T013 [US1] Run `npm test`, fix US1 tests, then validate quickstart V2 (firing, blocked shot, double shot) and V3 (destruction vs split) in the browser; tune only shot/destruction/split recipes in `src/audio/cues.js` if they are not distinct or are too loud.

**Checkpoint**: US1 is independently playable with combat sound; existing gameplay tests remain green.

---

## Phase 4: User Story 2 - Life and reward changes are audible (Priority: P1)

**Goal**: Losing a life, gaining/collecting a life and collecting the double-shot power-up each emit exactly one semantic event and play their own distinct synthesized cue.

**Independent Test**: After this phase, force a non-final hit, obtain a life pickup by ship and by projectile, obtain it at maximum lives, and collect/shoot a double-shot power-up; `tests/events.test.js` proves the counts and quickstart V4–V6 proves the cues are immediate and distinct. This works without US1/US3.

### Tests for User Story 2 (write first, confirm red)

- [X] T014 [US2] Add failing tests to `tests/events.test.js`: exactly one `life:lost` when a hit starts the death sequence (including the final hit) and none on a shielded hit; exactly one `life:gained` for a life pickup by projectile and by ship contact, including at `MAX_LIVES`; exactly one `powerup:collected` for a power-up by projectile and by ship contact; no collection event for an overlap that does not resolve.

### Implementation for User Story 2

- [X] T015 [P] [US2] Emit `GAME_EVENTS.LIFE_LOST` exactly once in `src/collision.js` `hitShip` when a non-shielded hit is confirmed, before the respawn-counter delay, for both the reserve-life branch and the final-life branch; also emit `GAME_EVENTS.POWERUP_COLLECTED` exactly once in both the projectile-hit and ship-contact power-up branches. Do not emit on shield blocks or uncollected overlaps.
- [X] T016 [P] [US2] Emit `GAME_EVENTS.LIFE_GAINED` exactly once in `src/score.js` `grantLife`, whether the pickup was obtained by ship contact or projectile and whether or not the life total is capped at `MAX_LIVES`; leave the cap behavior unchanged.
- [ ] T017 [US2] Run `npm test`, fix US2 tests, then validate quickstart V4 (life loss timing, final-hit life loss), V5 (life gain by contact/projectile and at max) and V6 (power-up by contact/projectile) in the browser; tune only life/power-up recipes in `src/audio/cues.js` if needed.

**Checkpoint**: US1 and US2 both work independently; existing gameplay tests remain green.

---

## Phase 5: User Story 3 - The match is framed by countdown and game-over cues (Priority: P2)

**Goal**: Each countdown step ("3", "2", "1", "GO") emits exactly one cue, and the transition to game over emits exactly one distinct game-over cue.

**Independent Test**: After this phase, start a match and listen through the countdown, then lose all lives; `tests/events.test.js` proves the countdown/final-hit events and quickstart V1/V7 proves the cues play once and are distinct. This works without US1/US2 (the final-hit `LIFE_LOST` sequence is covered by US2 and integrated in polish).

### Tests for User Story 3 (write first, confirm red)

- [X] T018 [US3] Add failing tests to `tests/events.test.js`: `countdown:3`, `countdown:2`, `countdown:1`, `countdown:go` each appear exactly once in order when their steps first appear, with no countdown event before the match starts and no repeat within a step; the final hit emits exactly one `game:over`; no further `game:over` is emitted while the screen remains over; the game-over event is distinct from the life-loss event.

### Implementation for User Story 3

- [X] T019 [P] [US3] Emit `GAME_EVENTS.COUNTDOWN_3` when `phaseMachine` in `src/update.js` sets the first step on `START → COUNTDOWN`, then `COUNTDOWN_2`, `COUNTDOWN_1` and `COUNTDOWN_GO` exactly once when each new step first appears; emit nothing on `GO → PLAYING` and do not change the existing step durations.
- [X] T020 [P] [US3] Emit `GAME_EVENTS.GAME_OVER` exactly once in `src/collision.js` `hitShip` in the final-life branch, after the `LIFE_LOST` emission from US2; do not emit it while the game continues and do not repeat it on subsequent updates.
- [ ] T021 [US3] Run `npm test`, fix US3 tests, then validate quickstart V1 (countdown steps, no pre-start cue) and V7 (one game-over cue, distinct from life loss) in the browser; tune only countdown/GO/game-over recipes in `src/audio/cues.js` if needed.

**Checkpoint**: All three user stories work independently and together; existing gameplay tests remain green.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final acceptance, governance, static guarantees and audible quality.

- [X] T022 [P] Run the static checks from `specs/006-sound-effects/quickstart.md`: no audio files under `assets/`, no `AudioContext` reference outside `src/audio/engine.js`, no URL/file audio reference in `src/audio/` or `src/events.js`, and empty `dependencies`/`devDependencies` in `package.json`.
- [X] T023 [P] Amend `.specify/memory/constitution.md` Principle V: remove "sound" from the excluded-features parenthetical, state that event sound effects are allowed per spec 006, bump the version to `1.1.0`, and record the amendment date; keep all other principles unchanged.
- [ ] T024 Perform the quickstart listening distinguishability check (SC-002): identify each cue without visual context, covering countdown, shot, destruction, split, life loss, life gain, power-up and game over; if any pair is confused, adjust only the recipe data in `src/audio/cues.js` and repeat until at least 90% correct with no cross-category confusion.
- [ ] T025 Validate performance and mixing (quickstart V10/V12): dense wave with rapid fire, chain splits and pickups; confirm < 100 ms perceived latency, no missing/duplicate shots, no clipping or cut-offs, and no frame-rate regression; adjust only cue gains in `src/audio/cues.js` if needed.
- [ ] T026 Run the complete quickstart V1–V13 (`specs/006-sound-effects/quickstart.md`) and the existing feature 003–005 manual checklists; confirm every sound behavior and every gameplay regression check passes, including offline play, hidden-tab behavior, silent fallback and zero audio network requests.
- [X] T027 Review the final diff (`git diff --stat`): only `src/events.js`, `src/audio/cues.js`, `src/audio/engine.js`, `src/state.js`, `src/update.js`, `src/collision.js`, `src/score.js`, `src/main.js`, `tests/events.test.js`, `tests/audio-cues.test.js` and `.specify/memory/constitution.md` changed; `assets/`, `index.html`, `server.js`, `package.json`, `src/loop.js`, `src/input.js`, `src/entities.js`, `src/spawn.js`, `src/config.js` and `src/render/*` are untouched.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies; T001 and T002 can run in parallel.
- **Foundational (Phase 2)**: depends on Setup; T003/T004 (tests) first, then T005/T006, then T007 → T008 → T009. Blocks all user stories.
- **User Stories (Phases 3–5)**: each depends only on Foundational. Functionally, US1, US2 and US3 are independent.
- **Polish (Phase 6)**: depends on all desired user stories; T024/T025 may tune the shared cue file, so run them sequentially; T026 depends on T022–T025; T027 is the final diff review.

### Within Each User Story

- Tests first; confirm red.
- Emit events in the named core file.
- Run `npm test`, then browser quickstart scenarios.
- Tune only audio recipe data, never gameplay constants.

### Shared-File Note

`tests/events.test.js`, `src/audio/cues.js` and (for US2→US3) `src/collision.js` are shared across stories. A single implementer should follow US1 → US2 → US3. Parallel teams may split US1/US2/US3 only if they coordinate those three files; otherwise the stories are functionally independent but not file-independent.

### Task ID Dependency Chain

```text
T001 ─┐
T002 ─┴─> T003/T004 ─> T005/T006 ─> T007 ─> T008 ─> T009
                                                     │
          ┌──────────────────────────────────────────┤
          ▼                    ▼                     ▼
   T010 ─> T011/T012 ─> T013   T014 ─> T015/T016 ─> T017   T018 ─> T019/T020 ─> T021
          └────────────────────┴─────────────────────┴─────────────┘
                                      │
                                      ▼
                    T022/T023 ─> T024 ─> T025 ─> T026 ─> T027
```

---

## Parallel Examples

### Foundational

```text
Task: "Write tests/audio-cues.test.js red-first for catalog coverage/uniqueness/durations"
Task: "Write tests/events.test.js red-first for the queue helpers and initial events field"
```

### User Story 1

```text
Task: "Emit SHOT in src/update.js fire()"
Task: "Emit ASTEROID_DESTROYED/ASTEROID_SPLIT in src/score.js applySizeRule"
```

### User Story 2

```text
Task: "Emit LIFE_LOST/POWERUP_COLLECTED in src/collision.js"
Task: "Emit LIFE_GAINED in src/score.js grantLife"
```

### User Story 3

```text
Task: "Emit countdown events in src/update.js phaseMachine"
Task: "Emit GAME_OVER in src/collision.js hitShip final-life branch"
```

### Polish

```text
Task: "Run static checks for no audio files/core API leaks/dependencies"
Task: "Amend constitution Principle V and bump to v1.1.0"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (baseline + `src/audio/`).
2. Complete Phase 2 (event queue, cue catalog, engine, main integration).
3. Complete Phase 3 / US1 (shot, destruction, split).
4. **STOP and VALIDATE**: run US1 tests and quickstart V2–V3. This is the first audible combat slice.

### Incremental Delivery

1. Setup + Foundational → engine and catalog ready, no gameplay change.
2. US1 → combat cues; validate and demo.
3. US2 → life/power-up cues; validate and demo.
4. US3 → countdown/game-over cues; validate and demo.
5. Polish → listening/performance/static/governance checks; full quickstart.

### Notes

- Tests are mandatory for the DOM-free event core; the browser audio engine is validated manually because the project forbids browser/DOM test dependencies.
- Never change `src/config.js` gameplay constants, `RADII`, timings, scoring, spawn cadence, phases or the render layer.
- No audio files, packages, build steps or external services.
- Keep `state.events` transient; it is never read by gameplay rules.

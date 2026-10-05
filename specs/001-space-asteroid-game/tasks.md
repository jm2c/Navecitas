---

description: "Task list template for feature implementation"
---

# Tasks: Space Asteroid Game

**Input**: Design documents from `/specs/001-space-asteroid-game/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included because plan.md §Project Structure and research.md R5 explicitly specify `node --test` test files (`tests/loop.test.js`, `tests/score.test.js`, `tests/collision.test.js`, `tests/spawn.test.js`, `tests/lives.test.js`, `tests/bonus.test.js`) and quickstart.md runs `npm test`. Tests are pure-logic only (no browser automation, zero dependencies).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single project at repository root: `index.html`, `server.js`, `src/`, `tests/` (per plan.md §Project Structure). Vanilla JavaScript ES modules, zero npm dependencies, Canvas 2D only.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per plan.md: `src/`, `src/render/`, `tests/` directories at repository root
- [ ] T002 Create `package.json` at repository root with `"type": "module"`, zero dependencies, and `"test": "node --test tests/"`
- [ ] T003 [P] Create zero-dependency static file server in `server.js` using built-in `node:http` only (serves `index.html`, `src/**`, default port 8000; started with `node server.js`; never Python — research.md R4)
- [ ] T004 [P] Create `index.html` at repository root: black page, `<canvas>` host, `<script type="module" src="./src/main.js">`, body `min-width: 800px; min-height: 600px; background: #000`
- [ ] T005 [P] Create `src/config.js` with all tuning constants per contracts/core-api.md and research.md R1/R6/R7: `BASE_SPEED = 200`, `WORLD = { W: 800, H: 600 }`, `DT_MS = 1000/60`, `LIMITS = { fwd: 260, back: 60, recoil: 30, projSpeed: 300, maxProjectiles: 5 }`, `PALETTE = { bg: '#000000', fg: '#FFFFFF', special: '#7ED9A0' }`, `TIMINGS` (shotInterval 160, spawnCadence 1400 ±300, deathDelay 500, immunity 2000, countdownHold 500, countdownShrink 350, goExit 450, startBlink 600, blinkPeriod 160), `TIERS` (FR-010 speed multipliers, caps 3/3/5/7 and spawn weights 100/0/0, 60/40/0, 40/35/25, 30/35/35), `MAX_LIVES = 6`, `MAX_RESERVE_ICONS = 5`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create `src/state.js`: `createGame()` factory returning GameState (`phase: 'START'`, `countdownStep: null`, `countdownT: 0`, `score: 0`, `lives: 3`, `ship` at 400,300 angle −π/2, empty `projectiles`/`asteroids`, `spawnT: 0`, `explosionT: 0`, `shieldT: 0`) and `tierFor(score)` returning `{ smallMul, mediumMul, largeMul, weights, max }` with exclusive boundaries (≤1000 → T1, ≤2000 → T2, ≤3000 → T3, else T4) per data-model.md §7
- [ ] T007 [P] Create `src/entities.js` factories per contracts/core-api.md: `createShip()`, `createProjectile(ship)` (at ship pos, velocity 300 px/s along `ship.angle`), `createAsteroid(kind, x, y, heading, tier)` (speed fixed from tier at creation, radii 14/26/44, random `seed`, `spin` 0.4–1.2 rad/s), `createSpecial(x, y, heading)` (kind `'SPECIAL'`, speed 200 always, radius 14)
- [ ] T008 [P] Create `src/input.js` per contracts/input-contract.md: track pressed `event.code`s in a `Set`, read only `ArrowLeft/ArrowRight/ArrowUp/ArrowDown/Space`, `preventDefault()` on those keys, ignore `event.repeat` for edge-triggered actions, clear state on `blur`/`visibilitychange`, export `getInput()` returning `{ left, right, up, down, fire }` booleans and `onStartKey(cb)` for the START-phase space press
- [ ] T009 [P] Create `src/loop.js` per research.md R2: fixed-timestep accumulator driven by `requestAnimationFrame`, `delta = min(now − last, 250)`, `while (acc >= DT_MS) { update(state, DT_MS, input); acc -= DT_MS; }`, render at most once per rAF and only if ≥1 update ran, `visibilitychange` pauses everything (no update, no render, accumulator reset to 0, `last` re-baselined on return) per FR-033/SC-016
- [ ] T010 Create `src/main.js`: acquire canvas, set backing store `800·dpr × 600·dpr` with `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`, compute display scale `s = max(1, min(innerWidth/800, innerHeight/600))` on `resize` and apply the same `s` to both CSS axes (never below 1) per contracts/render-contract.md §3 and research.md R3, then wire `input.js` + `loop.js` and start the loop
- [ ] T011 [P] Create `src/render/shapes.js` per contracts/render-contract.md §6: procedural white polygon/rect drawing helpers — ship isoceles triangle (nose along angle, radius 16), projectile 7×3 px rect oriented by velocity, asteroid 10-vertex polygon from `seed` (radii 14/26/44) rotated by `rot`, special ship silhouette (same geometry as ship, radius 14) in soft green `#7ED9A0` with `#A8EBC4` highlight, life-icon glyph (12 px ship triangle), explosion burst segments
- [ ] T012 Create `src/render/index.js`: `render(ctx, state, now)` frame composition per contracts/render-contract.md §4 — `fillRect(0,0,800,600)` black clear, then world (projectiles → asteroids → explosion → ship), then HUD, then overlays; ship skipped when destroyed and blink-hidden while immune (blink state may be stubbed until US4)
- [ ] T013 [P] Create `src/render/overlays.js` start-screen and countdown drawing per FR-030/031/032 and research.md R7: slowly blinking "Press spacebar to start" (600/600 ms) at bottom-centre for phase `START`; countdown items `3`,`2`,`1`,`Go` shrink 1400→64 px in 350 ms (ease-out), hold 500 ms at y≈380 (below ship), only `Go` exits by growing to 2400 px while alpha 1→0 over 450 ms; all strings English exactly as written
- [ ] T014 Create `src/update.js` phase machine per research.md R10 and data-model.md §2: `START` — only Space starts `COUNTDOWN("3")`; `COUNTDOWN` — advance `3→2→1→GO` with shrink/hold/Go-exit timing driven by simulated ms, ship input ignored, no spawning; on Go exit finish → `PLAYING` (grant control, enable spawn); `PLAYING` — full gates open; `update(state, dtMs, input)` mutates state in place, never reads real time, order: phase machine → ship physics → firing → projectiles → asteroids → spawning → collisions → cleanup → timers

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Pilot the ship and shoot (Priority: P1) 🎯 MVP

**Goal**: Full ship control — rotate/thrust/brake along the nose, zero friction, wrap-around, burst fire with recoil and the 5-projectile cap

**Independent Test**: quickstart.md **V2** and **V3**: start a round through the start screen and countdown, hold ↑ until speed plateaus at 260 px/s (1.3× base), release keys and verify speed/direction unchanged after 10 s, brake to a stop without ever going backwards, cross all 4 edges preserving the other axis/angle/speed, single-tap fire one projectile at 300 px/s (1.5× base) from the ship's position with −30 px/s recoil (SC-012: 260 → 230 → 200 …, backward clamped at 60), hold Space for a ~160 ms burst that stops at 5 projectiles and resumes when one disappears, projectiles vanish at borders

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T015 [P] [US1] Create pure-logic tests in `tests/loop.test.js` (`node --test`): rotate preserves speed magnitude, thrust clamps at 260, brake never goes below 0, no friction over simulated steps, wrap-around preserves the untouched axis exactly (SC-003), recoil steps of exactly 30 with backward clamp at 60 (SC-012), projectile speed 300, cap of 5 projectiles, projectile border removal (FR-001…FR-007)

### Implementation for User Story 1

- [ ] T016 [US1] Implement ship physics in `src/update.js`: `ArrowLeft/Right` rotate `angle ∓= π·dt/1000` leaving `speed` untouched, `ArrowUp` `speed = min(speed + 180·dt, 260)`, `ArrowDown` `speed = max(speed − 260·dt, 0)` (brake never reverses), no input ⇒ speed unchanged, integrate `x += cos(angle)·speed·dt`, `y += sin(angle)·speed·dt`, then wrap (`x < 0 ⇒ x += 800` etc., other axis untouched)
- [ ] T017 [US1] Implement firing in `src/update.js`: Space creates a projectile at the ship's current position travelling at 300 px/s along `ship.angle`, every shot applies `speed -= 30` with the crossing remainder becoming backward speed clamped to `speed ≥ −60`, burst while held at 160 ms interval, single tap = exactly one shot, refuse new shots while `projectiles.length === 5` (FR-005/006/007)
- [ ] T018 [US1] Implement projectile motion and border removal in `src/update.js`: `x += vx·dt`, `y += vy·dt`, mark `dead` when `x<0 ∨ x>800 ∨ y<0 ∨ y>600`, filter dead projectiles at end of step (FR-015, no wrap)
- [ ] T019 [US1] Wire ship and projectile rendering: use shape helpers from `src/render/shapes.js` and draw projectiles then ship in `src/render/index.js` world layer (ship skipped while destroyed, white on black)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Asteroids appear and follow the difficulty curve (Priority: P1)

**Goal**: Three asteroid sizes spawn from screen edges with score-gated mix, speeds and population caps across four tiers, despawning at borders

**Independent Test**: quickstart.md **V4**: play through each score tier — tier 1 only smalls at 200 px/s max 3; tier 2 adds mediums and smalls at 220 (max 3); tier 3 adds larges, smalls 240 / mediums 220 / larges 200 (max 5); tier 4 smalls 260 / mediums 240 / larges 220 (max 7), spawn attempts stop at the cap, any asteroid crossing a border disappears, in-flight asteroids keep their birth speed when the tier changes, spawn mix matches FR-010 weights

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T020 [P] [US2] Create pure-logic tests in `tests/spawn.test.js` (`node --test`): `tierFor` boundaries exclusive at 1000/2000/3000, per-tier speed multipliers and caps 3/3/5/7, weighted size pick excludes not-spawned sizes, spawn stops at the cap, edge spawn position lies on a border with an in-bounds heading, border crossing marks the asteroid dead (FR-008/009/010)

### Implementation for User Story 2

- [ ] T021 [US2] Create `src/spawn.js`: `tickSpawn(state, dtMs)` counting down `spawnT` (1400 ms ± 300 ms per attempt), skipping attempts while regular asteroid count ≥ `tier.max`, picking a border edge and random inward heading, weighted size choice from `TIERS` weights, creating the asteroid with the tier speed fixed at creation (data-model.md §4/§7, research.md R6)
- [ ] T022 [US2] Implement asteroid motion in `src/update.js`: integrate `vx/vy` for all asteroids, rotate `rot` by `spin·dt`, mark `dead` on any border crossing (`x<0 ∨ x>800 ∨ y<0 ∨ y>600`, no wrap), call `tickSpawn(state, dtMs)` during `PLAYING`/`DYING`/`GAME_OVER` phases only (never in `START`/`COUNTDOWN`), filter dead asteroids at end of step
- [ ] T023 [US2] Wire asteroid rendering in `src/render/index.js`: draw regular asteroids from `src/render/shapes.js` (10-vertex seeded polygon, white, rotated by `rot`) between projectiles and the ship in the world layer

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Hits, splitting and scoring (Priority: P1)

**Goal**: Projectile/asteroid and asteroid/asteroid collisions with size-based destroy/split rules, V-shaped children, exact scoring and a permanent top-right score display

**Independent Test**: quickstart.md **V5**: destroy a small → +200 (5 smalls = exactly 1000), destroy a medium → +50 with two smalls flying apart in a V, destroy a large → +50 with two mediums in a V, force two regular asteroids together → same split/vanish with score unchanged, a projectile that hits is consumed, split children near an edge spawn at the parent position and die normally if already outside; score visible top-right at all times

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T024 [P] [US3] Create pure-logic tests in `tests/score.test.js` (`node --test`): `addScore` monotonic with only 50/200 increments, small +200, medium/large +50, asteroid-vs-asteroid 0, special 0, `reserveIcons(lives) = max(0, lives − 1)`, `applySizeRule` returns children per kind (FR-011…FR-014, SC-004)
- [ ] T025 [P] [US3] Create pure-logic tests in `tests/collision.test.js` (`node --test`): projectile×asteroid consumes the projectile and applies the size rule with score, regular×regular applies the size rule with NO score and each pair resolves once, ship×regular only in `PLAYING` outside immunity, resolution order per research.md R8 (FR-011…FR-015)

### Implementation for User Story 3

- [ ] T026 [US3] Create `src/score.js`: `addScore(state, pts)` (monotonic, `pts ∈ {0, 50, 200}`), `reserveIcons(lives)`, and `applySizeRule(state, asteroid, awardPoints)` per data-model.md §4 — SMALL destroyed (+200 if awarded), MEDIUM destroyed → 2 SMALL children, LARGE destroyed → 2 MEDIUM children, children spawned at the parent position symmetrically around the parent heading at ±25° so directions form a V, using the current tier speed for their own size, `awardPoints = false` for asteroid↔asteroid and ship↔asteroid paths
- [ ] T027 [US3] Create `src/collision.js`: `resolveCollisions(state)` executing in fixed order — 1) projectile×asteroid (consumes the projectile, regular → `applySizeRule` with score, special → life, no score), 2) ship×special (handled in US5 — skip for now), 3) ship×regular (alive, not immune, `phase === 'PLAYING'` — death handling in US4), 4) regular×regular (size rule, no score, each pair once) per research.md R8
- [ ] T028 [US3] Integrate collisions into `src/update.js`: call `resolveCollisions(state)` after motion and before cleanup, filter `dead` projectiles/asteroids and insert split children at the end of the step
- [ ] T029 [US3] Implement score HUD in `src/render/overlays.js`: draw `state.score` permanently in the top-right corner (right-aligned at x 784 / y 36, white, system sans-serif) — score and life icons are the entire HUD, no FPS counter

**Checkpoint**: At this point, User Stories 1, 2 AND 3 should work independently

---

## Phase 6: User Story 4 - Lives, destruction and respawn (Priority: P2)

**Goal**: 3-life reserve shown as ship icons, explosion → 500 ms → centre respawn → 2 s blinking immunity, and terminal giant centred "Game Over" while the simulation keeps running behind it

**Independent Test**: quickstart.md **V6** and **V8**: fly into regular asteroids and verify explosion, exactly 500 ms absence, respawn at centre pointing up, 2 s fast blinking, icon counter 2 → 1 → 0, immune ship takes no damage, final hit shows giant centred "Game Over" with no in-game restart, and for ≥60 s afterwards asteroids keep spawning/moving/splitting with zero interaction with the letters

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T044 [P] [US4] Create pure-logic tests in `tests/lives.test.js` (`node --test`): hit only in PLAYING when alive/not immune → DYING with 500 ms simulated delay → `lives--`, respawn at 400,300 angle −π/2 with `shieldT = 2000`; hit with 0 reserve → `GAME_OVER` and `ship === null`; immunity blocks regular-asteroid damage but not special-asteroid collection (FR-018/019/020, SC-006)

### Implementation for User Story 4

- [ ] T030 [US4] Implement the death sequence in `src/update.js`: regular-asteroid hit while alive, not immune and `phase === 'PLAYING'` with `reserveIcons ≥ 1` → `phase = 'DYING'`, `ship.alive = false`, `explosionT = 500`; after 500 ms → `lives--`, recreate ship at 400,300 angle −π/2 speed 0, `shieldT = 2000`, `phase = 'PLAYING'` (FR-018, data-model.md §2 transitions)
- [ ] T031 [US4] Implement immunity and game over in `src/update.js` and `src/collision.js`: while `shieldT > 0` regular-asteroid contacts have no effect (FR-019) while special contacts are still collected; a hit while `reserveIcons === 0` → `phase = 'GAME_OVER'`, `state.ship = null`, terminal (FR-020, invariant `phase === 'GAME_OVER' ⇒ ship === null`); during `GAME_OVER` spawning, motion, splitting and scoring logic keep running exactly as in play (FR-025), and no gameplay input is read
- [ ] T032 [US4] Implement life-icon HUD in `src/render/overlays.js`: draw `reserveIcons(lives)` small white 12 px ship glyphs from x 16 / y 16 in the top-left corner (2 at start, FR-017)
- [ ] T033 [US4] Implement explosion and immunity blinking in `src/render/index.js` and `src/render/overlays.js`: 8-frame radial white burst fading over the 500 ms `DYING` window at the ship position; ship blink-hidden on a 160 ms period (80/80) while `shieldT > 0` (FR-018, research.md R7)
- [ ] T034 [US4] Implement the "Game Over" overlay in `src/render/overlays.js`: bold 140 px white "Game Over" centred, drawn last after the world so asteroids never collide with, bounce off or are blocked by the letters (FR-024/FR-025); no restart key exists — only a page reload (FR-029)

**Checkpoint**: All user stories 1–4 should now be independently functional

---

## Phase 7: User Story 5 - Bonus life asteroid (Priority: P3)

**Goal**: Soft-green ship-shaped asteroid spawning on every crossed 500-point multiple, granting a life when shot or touched, ignoring regular asteroids, capped at 5 reserve icons

**Independent Test**: quickstart.md **V7**: cross 500 points → exactly one soft-green ship-shaped asteroid at base speed; shoot it or fly into it → disappears, +1 icon, score unchanged, ship never harmed (even while immune); it passes straight through regular asteroids with no destruction/split/score; it vanishes at the border; with 5 reserve icons the next 500 multiple spawns nothing (not queued); a 400 → 600 jump spawns exactly one

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T045 [P] [US5] Create pure-logic tests in `tests/bonus.test.js` (`node --test`): `spawnSpecialIfCrossed` fires exactly once per crossed 500 multiple, suppressed with no queue at reserve 5 (400→600 edge case), `grantLife` caps at 6, projectile×special and ship×special grant +1 reserve with 0 score and no ship damage (FR-021/022/023, SC-007)

### Implementation for User Story 5

- [ ] T035 [US5] Implement the bonus-spawn trigger in `src/spawn.js` and `src/score.js`: `spawnSpecialIfCrossed(state, prevScore, nextScore)` firing when `floor(prev/500) < floor(next/500)` and `reserveIcons < 5` (suppressed with no queue when the reserve is full), invoked from `addScore`; one spawn maximum per crossed multiple (data-model.md §5, FR-021/FR-023, edge case 400→600)
- [ ] T036 [US5] Implement `grantLife(state)` in `src/score.js`: `lives = min(lives + 1, 6)` (FR-022, research.md R9)
- [ ] T037 [US5] Implement special-asteroid interactions in `src/collision.js`: projectile×special → consume projectile and special, `grantLife`, 0 points; ship×special (alive, any immunity state) → consume special, `grantLife`, ship never harmed, no explosion, no life lost; special is skipped by every regular×regular rule and by the tier cap (passes over regular asteroids) per the interaction matrix in data-model.md §4
- [ ] T038 [US5] Implement special-asteroid spawning and despawn in `src/spawn.js` and `src/update.js`: created at a border at base speed 200 regardless of the regular cap and never counted toward it, removed when it crosses any border, never tier-scaled (FR-021, data-model.md §4 speed table)
- [ ] T039 [US5] Wire special-asteroid rendering in `src/render/index.js` using the soft-green ship silhouette from `src/render/shapes.js` (`#7ED9A0` fill, `#A8EBC4` highlight, radius 14), drawn with the other asteroids in the world layer

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T040 [P] Run `npm test` and fix any failing assertions in `tests/loop.test.js`, `tests/spawn.test.js`, `tests/score.test.js`, `tests/collision.test.js`, `tests/lives.test.js`, `tests/bonus.test.js` until the whole pure-logic suite is green
- [ ] T041 Run the full manual validation checklist `quickstart.md` V1–V10 in a browser against `node server.js` (start sequence, flight, firing, tiers, hits/splits, lives/death, bonus life, game over, display scaling, hidden-tab freeze) and fix any deviation
- [ ] T042 [P] Verify performance per SC-009 and SC-014: constant 60 FPS with 7 asteroids + 5 projectiles using browser performance tools (no FPS widget in the HUD), exact 4:3 upscale with no distortion, scrollbars instead of downscaling under 800×600
- [ ] T043 Code cleanup pass across `src/`: remove dead code, confirm zero npm dependencies, confirm no browser APIs leak into the DOM-free core (`state/entities/update/collision/spawn/score/config`) and that all HUD strings are English exactly as in the spec

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
  - T006 → T007 → T014 (state → entities → update phase machine); T008, T009, T010, T011, T012, T013 parallelizable within the phase once T005 exists (T012 needs T011; T014 needs T006/T007)
- **User Story 1 (Phase 3)**: Depends on Foundational completion only
- **User Story 2 (Phase 4)**: Depends on Foundational completion only (integrates with US1 ship/projectiles already present)
- **User Story 3 (Phase 5)**: Depends on Foundational + US1 (projectiles) + US2 (asteroids) — its collisions need both bodies
- **User Story 4 (Phase 6)**: Depends on US3 (regular-asteroid size rule on ship hits)
- **User Story 5 (Phase 7)**: Depends on US3 (score trigger) + US4 (life reserve/death machinery)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - in parallel with US1 (touches `spawn.js` + asteroid motion; US1 touches ship/projectile paths in `update.js`)
- **User Story 3 (P1)**: Needs US1 projectiles and US2 asteroids as collision participants
- **User Story 4 (P2)**: Needs US3 size rules for ship-impact resolution
- **User Story 5 (P3)**: Needs US3 score changes and US4 life reserve

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models/entities before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] (T003, T004, T005) can run in parallel
- Foundational [P] tasks: T007, T008, T009, T011, T013 (different files)
- US1: test task T015 can be written in parallel with other story work
- US2: test task T020 parallel; US2 implementation runs in parallel with US1 (different responsibilities inside `update.js` — coordinate if working in the same file)
- US3: T024 and T025 (two test files) run in parallel; T026 (`score.js`) and T027 (`collision.js`) run in parallel after tests
- US4/US5 tasks are mostly sequential within their story but US5's T035/T036 (`spawn.js`/`score.js`) can run in parallel with T037 (`collision.js`)
- Polish T040 and T042 can run in parallel

---

## Parallel Example: User Story 3

```bash
# Launch both test files for User Story 3 together:
Task: "Create pure-logic tests in tests/score.test.js"
Task: "Create pure-logic tests in tests/collision.test.js"

# Then launch the two implementation modules together:
Task: "Create src/score.js (addScore, applySizeRule, reserveIcons)"
Task: "Create src/collision.js (resolveCollisions order per R8)"
```

---

## Parallel Example: User Story 1

```bash
# Test first, then implementation (single file src/update.js → sequential):
Task: "Create tests/loop.test.js (physics, wrap, recoil, cap)"
# then:
Task: "Ship physics in src/update.js"
Task: "Firing in src/update.js"
Task: "Projectile motion in src/update.js"
Task: "Wire ship/projectile rendering in src/render/index.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (quickstart V1–V3 + `npm test`)
5. Deploy/demo if ready (`node server.js` → http://localhost:8000)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (start screen + countdown playable)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo (full core loop)
5. Add User Story 4 → Test independently → Deploy/Demo (stakes + fail state)
6. Add User Story 5 → Test independently → Deploy/Demo (bonus recovery)
7. Polish phase → full quickstart V1–V10 sign-off

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (ship + firing)
   - Developer B: User Story 2 (spawning + tiers)
   - Developer C: tests + render polish scaffolding
3. US3 merges the work of A and B (collisions); US4 and US5 follow in priority order

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All numeric relationships from the spec are binding (1.3× / 0.3× / 0.15× / 1.5× / 10-20-30% multipliers) — never retune them
- `.specify/memory/constitution.md` is ratified at v1.0.0 (2026-10-04); its principles I–V apply to this feature (plan.md Constitution Check)

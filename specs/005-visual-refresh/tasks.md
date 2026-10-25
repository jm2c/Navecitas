---
description: "Task list for Visual Refresh — Emoji Ship/Collectibles, Textured Asteroids & Background, Audiowide Type"
---

# Tasks: Visual Refresh — Emoji Ship/Collectibles, Textured Asteroids & Background, Audiowide Type

**Input**: Design documents from `/specs/005-visual-refresh/`

**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: One new DOM-free test is included because `research.md` R5 and `plan.md` mandate it: `tests/asset-manifest.test.js`, written red-first. No other automated test is added. The existing 13 `node --test` suites (96 tests) are the gameplay regression gate and MUST stay green with unchanged expectations. Manual browser validation is defined in `quickstart.md` V1–V12.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently after the shared foundation. US1 and US2 are both P1; US3 and US4 are P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task).
- **[Story]**: Maps to `spec.md` user stories (`US1`–`US4`).
- Every task includes exact repository-relative file paths.

## Path Conventions

Single-project static browser game. Paths are relative to the repository root: `src/`, `tests/`, `assets/`, `index.html`, `server.js`.

---

## Phase 1: Setup (Shared Asset Infrastructure)

**Purpose**: Materialize the approved, license-clean asset set before any code changes.

- [X] T001 Create the asset directory tree `assets/background/`, `assets/asteroids/`, `assets/emoji/`, `assets/fonts/`, and `assets/licenses/` at the repository root; do not create files yet.
- [X] T002 [P] Fetch the three Twemoji 72×72 PNGs from `https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/<codepoint>.png` to `assets/emoji/rocket.png` (`1f680`), `assets/emoji/bolt.png` (`26a1`) and `assets/emoji/heart.png` (`2764`), and save `https://raw.githubusercontent.com/twitter/twemoji/master/LICENSE-GRAPHICS` as `assets/licenses/Twemoji-CC-BY-4.0.txt`; verify each PNG is 72×72 and not an HTML error page.
- [X] T003 [P] Download `https://opengameart.org/sites/default/files/SpaceShooterRedux.zip` to a temporary path, extract `PNG/Meteors/meteorBrown_small1.png` to `assets/asteroids/small.png` (28×28), `PNG/Meteors/meteorBrown_med1.png` to `assets/asteroids/medium.png` (43×43) and `PNG/Meteors/meteorBrown_big3.png` to `assets/asteroids/large.png` (89×82), copy the pack's root `License.txt` to `assets/licenses/Kenney-CC0.txt`, and delete the temporary zip; verify the dimensions.
- [X] T004 [P] Download the Sauer2 800×600 starfield from `https://opengameart.org/sites/default/files/bg_1_1.png` to `assets/background/starfield.png`; verify it is a real PNG, 800×600, and not an HTML/error response.
- [X] T005 [P] Download the Audiowide v22 latin woff2 from `https://fonts.gstatic.com/s/audiowide/v22/l7gdbjpo0cum0ckerWCdlg_O.woff2` to `assets/fonts/audiowide-latin.woff2`, and save `https://raw.githubusercontent.com/google/fonts/main/ofl/audiowide/OFL.txt` as `assets/licenses/Audiowide-OFL-1.1.txt`; verify the `wOF2` signature and that the license text is present.
- [X] T006 Write `assets/CREDITS.md` covering every manifest asset (key, file path, author, source URL, license and attribution), explicitly crediting Twemoji under CC-BY 4.0 with its license link, and recording Kenney/Sauer2 as CC0 and Audiowide as OFL 1.1. Depends on T002–T005.
- [X] T007 [P] Verify every downloaded file in `assets/` is a valid PNG/woff2 of the expected intrinsic size (72×72 emoji, 28×28 / 43×43 / 89×82 asteroids, 800×600 background, `wOF2` font signature) using `file` plus a small Node header check; replace any HTML error page or wrong-size file.

**Checkpoint**: The 7 images, 1 font, 3 license texts and `assets/CREDITS.md` exist and are valid.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared manifest, loader and boot path required by every user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T008 Write `tests/asset-manifest.test.js` first, importing `../src/render/asset-manifest.js` and using only Node built-ins (`node:test`, `node:assert/strict`, `node:fs`, `node:path`, `node:url`). Assert: (a) the required asset keys are exactly `rocket`, `bolt`, `heart`, `asteroidSmall`, `asteroidMedium`, `asteroidLarge`, `background`, `font`; (b) the mapping is `ship→rocket`, `POWERUP→bolt`, `SPECIAL→heart`, `SMALL→asteroidSmall`, `MEDIUM→asteroidMedium`, `LARGE→asteroidLarge`, the HUD life icon uses `heart`, and `POWERUP` and `SPECIAL` resolve to different keys; (c) every manifest `path` is local/relative and does **not** start with `http://` or `https://`; (d) every path exists on disk under the repository root; (e) every entry has non-empty `source`, `author`, `license` and `type`, every image entry has positive `width`/`height`, and every `CC-BY-4.0` entry has non-empty `attribution`; (f) `assets/licenses/Kenney-CC0.txt`, `assets/licenses/Twemoji-CC-BY-4.0.txt`, `assets/licenses/Audiowide-OFL-1.1.txt` and `assets/CREDITS.md` exist. Run `node --test tests/asset-manifest.test.js` and confirm it fails because `src/render/asset-manifest.js` does not exist yet (red).
- [X] T009 Implement `src/render/asset-manifest.js` as pure data (no DOM, no `fs`) exporting `ASSETS`, `ASSET_KEYS`, `ENTITY_ASSET_KEYS`, `assetKeyForAsteroid(kind)` and `REQUIRED_LICENSE_FILES`. Each `ASSETS` row MUST contain `key`, `type` (`'image'`/`'font'`), local repo-relative `path` under `assets/` (never `http://`/`https://`), `source`, `author`, `license` (`CC0-1.0`/`CC-BY-4.0`/`OFL-1.1`), `attribution` where required, `width`/`height` for images, and `fallback`. Use the exact rows/sizes from `data-model.md` §1 and the mapping from §2: rocket/bolt/heart 72×72, asteroidSmall 28×28, asteroidMedium 43×43, asteroidLarge 89×82, background 800×600, font woff2.
- [X] T010 Implement `src/render/assets.js` as a browser-only cached loader exporting `loadAssets({ timeoutMs = 1500 } = {})`, `getAsset(key)`, `assetsReady()`, `missingAssets()`, and `isFontLoaded()`. Create each image once from the manifest, await load/`decode()`, cache the `HTMLImageElement` in a `Map`, mark failures in a `Set` without throwing, load Audiowide with `document.fonts.load('16px Audiowide')` plus `document.fonts.ready`, and resolve after `Promise.allSettled` with a bounded timeout so a missing/slow asset never blocks the game. Resolve image URLs with `new URL('../../' + entry.path, import.meta.url)`; never fetch per frame.
- [X] T011 Wire `src/main.js` to `await loadAssets()` (bounded) before `startLoop`, keeping the existing canvas DPR setup, `resize()`, `attachInput()`, `onStartKey()`, `createGame()` and the `startLoop({...})` call unchanged. On failure/timeout the game MUST still start and use the vector/text fallbacks; do not add browser APIs to the gameplay core.
- [X] T012 Gate: run `node --test tests/asset-manifest.test.js` and `npm test`; confirm the new manifest test is green and all 13 pre-existing suites (96 tests) still pass unchanged. Fix only manifest/loader wiring and asset files; do not change gameplay tests or expectations.

**Checkpoint**: Manifest test green, all existing tests green, boot loads assets with fallback-safe behavior.

---

## Phase 3: User Story 1 - Ship and collectibles read as recognizable emoji icons (Priority: P1) 🎯 MVP

**Goal**: The ship is a rocket pointing along its heading; the double-shot power-up is a bolt; the extra-life pickup and HUD reserve icons use the heart image, with visible vector fallbacks.

**Independent Test**: Start the game, rotate/thrust, force/collect each drop, and execute quickstart V2, V4, V5 and the US1 portion of V8. The ship, bolt and heart are recognizable and distinct from asteroids and each other; missing emoji images fall back to visible legacy shapes.

### Implementation for User Story 1

- [X] T013 [US1] In `src/render/shapes.js` `drawShip`, import `getAsset` from `./assets.js`, add `const SHIP_EMOJI_ROTATION_OFFSET = Math.PI / 4;`, and when `getAsset('rocket')` is present draw it centered on `(x, y)`, rotated by `angle + SHIP_EMOJI_ROTATION_OFFSET`, at a display size of `radius * 2.5` (≈40 px) preserving aspect ratio, then return early. If the asset is missing/failed, keep the existing white triangle vector path unchanged (SR-1…SR-4). Do not change `RADII.ship`, position, velocity or rotation logic.
- [X] T014 [US1] In `src/render/shapes.js`, make `drawPowerup` use `getAsset('bolt')` centered and rotated by `asteroid.rot`, fitted to `2 * asteroid.radius` (≈28 px), returning early when drawn; make `drawSpecial` use `getAsset('heart')` centered and rotated by `asteroid.heading`, fitted to `2 * asteroid.radius` (≈28 px), returning early when drawn. Preserve the existing gold-diamond / green-ship vector fallbacks when the image is missing (CR-1, CR-2, CR-4).
- [X] T015 [US1] In `src/render/shapes.js` `drawLifeIcon`, when `getAsset('heart')` is present draw it upright (no rotation) centered on `(x, y)` at `size` (12 px), preserving aspect ratio and returning early; otherwise keep the existing small-ship triangle fallback (CR-3). The HUD MUST use the same `heart` key as the extra-life pickup (EM-3).
- [X] T016 [US1] Validate US1 independently: run `node server.js`, open the game, and execute quickstart V2 (rocket/heading/footprint), V4 (bolt), V5 (heart pickup + HUD heart) and the US1 portion of V8 (rename `assets/emoji/rocket.png`, `assets/emoji/bolt.png` and `assets/emoji/heart.png` one at a time and confirm visible vector fallbacks); record results in `specs/005-visual-refresh/quickstart.md` or the PR notes.

**Checkpoint**: US1 fully functional and independently testable; no other object's rendering changed.

---

## Phase 4: User Story 2 - Asteroids read as textured space rocks at every size (Priority: P1)

**Goal**: Small, medium and large asteroids use size-matched cartoon rock textures that rotate with their existing spin, and split fragments immediately use their new size's texture.

**Independent Test**: Execute quickstart V3 and the asteroid portion of V8. Three sizes are distinguishable, rotation is continuous, split fragments use the correct texture, and a missing texture falls back to the seeded polygon with unchanged collisions.

### Implementation for User Story 2

- [X] T017 [US2] In `src/render/shapes.js` `drawAsteroid`, import `assetKeyForAsteroid` from `./asset-manifest.js`, map `asteroid.kind` through it (`SMALL→asteroidSmall`, `MEDIUM→asteroidMedium`, `LARGE→asteroidLarge`), draw the cached image centered and rotated by `asteroid.rot`, fitted inside a `2 * asteroid.radius` square with aspect ratio preserved (28/52/88 px logical), and return early. Keep the existing seeded polygon as the fallback when the asset is missing (AR-1…AR-5); split fragments must automatically use their new kind's texture. Do not change `seed`, `rot`, `spin`, `radius` or any collision rule.
- [X] T018 [US2] Validate US2 independently via quickstart V3: three distinguishable brown rock sizes, continuous rotation, medium→small and large→medium fragment textures after shooting, and the asteroid portion of V8 (rename `assets/asteroids/small.png` and confirm the seeded polygon fallback); record results.

**Checkpoint**: US2 fully functional and independently testable; US1 still passes.

---

## Phase 5: User Story 3 - The playfield sits on a space background (Priority: P2)

**Goal**: A static, free-to-use starfield covers the entire logical playfield behind all objects, with a plain dark fallback.

**Independent Test**: Execute quickstart V1 at the minimum 800×600 window, maximized and on a high-DPI display; the background covers 100% of the play area with no bands/black borders, all gameplay elements remain legible, and a missing background falls back to black.

### Implementation for User Story 3

- [X] T019 [P] [US3] In `src/render/index.js`, import `getAsset` from `./assets.js` and, before drawing projectiles, draw `getAsset('background')` at `(0, 0)` with `WORLD.W × WORLD.H` (800×600); if the asset is missing, keep the existing `PALETTE.bg` `fillRect`. No scroll, drift or parallax (BR-1…BR-3). This file is independent of `shapes.js`, so it can run in parallel with US1/US2.
- [X] T020 [US3] Validate US3 independently via quickstart V1: at the minimum 800×600 window, maximized, and a high-DPI display, confirm the starfield fills 100% of the play area with no bands/black borders, all objects/text remain legible, and renaming `assets/background/starfield.png` falls back to black; record results.

**Checkpoint**: US3 fully functional and independently testable; US1/US2 still pass.

---

## Phase 6: User Story 4 - All on-screen text uses Audiowide and stays legible (Priority: P2)

**Goal**: Every string uses self-hosted Audiowide with a legible fallback; countdown and game-over text are width-fitted and never clip.

**Independent Test**: Execute quickstart V6/V7 and the font portion of V8. Start prompt, countdown, score and game-over render in Audiowide; large animated strings fit within 720 px; all requests are local; a missing font falls back legibly.

### Implementation for User Story 4

- [X] T021 [P] [US4] Add `.woff2` → `font/woff2` to the `MIME` map in `server.js` so the bundled Audiowide font is served with the correct content type; make no other server changes (RL-3).
- [X] T022 [P] [US4] Update `index.html` with `@font-face { font-family: 'Audiowide'; font-style: normal; font-weight: 400; font-display: swap; src: url('./assets/fonts/audiowide-latin.woff2') format('woff2'); }` and a `<link rel="preload" href="./assets/fonts/audiowide-latin.woff2" as="font" type="font/woff2" crossorigin>`; do not add any live Google Fonts request.
- [X] T023 [P] [US4] Add `export const FONT_FAMILY = "'Audiowide', 'Trebuchet MS', sans-serif";` to `src/config.js`; do not change `RADII`, `POWERUP_DROP_CHANCE`, tier weights, timings or any other gameplay constant (RL-2).
- [X] T024 [US4] Update `src/render/overlays.js`: import `FONT_FAMILY`; set every `ctx.font` (start prompt 24 px, score 28 px, countdown, game over) to `${size}px ${FONT_FAMILY}` with no `bold`; add `fitFontSize(ctx, text, maxWidth, desiredPx)` that measures once at `desiredPx`, scales down proportionally when `measureText(text).width > maxWidth`, and returns a size fitting `0.9 * WORLD.W` (720 px); apply it to the countdown label and `"Game Over"` while keeping existing alignments/baselines and all timing logic untouched (TR-1…TR-5).
- [X] T025 [US4] Validate US4 independently via quickstart V6/V7 and the font portion of V8: every string uses Audiowide, countdown/game-over stay inside 720 px at all animated sizes, a 5–6 digit score is readable, devtools shows only local woff2/image requests, and renaming `assets/fonts/audiowide-latin.woff2` falls back to the sans-serif stack without invisible/clipped text; record results.

**Checkpoint**: US4 fully functional and independently testable; all prior stories still pass.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final regression, performance, offline and scope verification across all stories.

- [X] T026 [P] Run the full `npm test` suite (`tests/`) and confirm all 13 pre-existing suites (96 tests) plus `tests/asset-manifest.test.js` pass; record the exact counts. No test expectations about gameplay may change.
- [X] T027 [P] Execute the complete manual quickstart V1–V12 from `specs/005-visual-refresh/quickstart.md` (including V8 asset-removal fallbacks, V9 offline/zero-dependency, V10 gameplay regression and V12 provenance) and record pass/fail for each scenario.
- [X] T028 [P] Run the V11 performance check from `specs/005-visual-refresh/quickstart.md`: play a dense wave with the browser performance panel and compare against the pre-refresh build; confirm no visible frame-rate regression, stutter, flicker or asset-loading stall.
- [X] T029 [P] Final scope audit: confirm `package.json` `dependencies`/`devDependencies` remain empty, no `node_modules` is required, and `git status --short` plus `git diff --stat` show changes only to `index.html`, `server.js`, `src/main.js`, `src/config.js` (FONT_FAMILY only), `src/render/*`, `tests/asset-manifest.test.js` and `assets/`; grep `src/render/asset-manifest.js` and `index.html` for runtime `http://`/`https://` paths and confirm none; confirm `src/state.js`, `src/entities.js`, `src/update.js`, `src/collision.js`, `src/spawn.js`, `src/score.js`, `src/input.js` and `src/loop.js` are unchanged.

**Checkpoint**: All automated tests green, V1–V12 signed off, performance/offline/licensing confirmed, and the diff contains no gameplay changes.

## Validation Record

- 2026-10-24 — `npm test`: 100/100 pass (96 gameplay + 4 manifest). One earlier run hit a pre-existing RNG flake in `tests/split-cap.test.js`: a random edge spawn can hit the ship at `(10, 10)` during the final update; rerun was green.
- 2026-10-24 — Static render harness (fake DOM/canvas): all image paths, asteroid size mapping, rotations, background, vector fallbacks and Audiowide width fitting validated.
- 2026-10-24 — `loadAssets()` verified with a fake DOM: all images load, Audiowide reports loaded, `missingAssets()` is empty, `assetsReady()` is true.
- 2026-10-24 — Server MIME check on port 8123: HTML, PNG, JS and `font/woff2` all correct.
- Manual quickstart V1–V12: executed manually by the user (reported); no failures reported. This automation environment has no browser installed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately. T002/T003/T004/T005 are parallel; T006/T007 depend on them.
- **Foundational (Phase 2)**: Depends on Setup. T008 → T009 → T010 → T011 → T012. **BLOCKS all user stories.**
- **User Stories (Phases 3–6)**: All depend on T012.
  - **US1 (P1, Phase 3)**: T013 → T014 → T015 → T016, all on `src/render/shapes.js`.
  - **US2 (P1, Phase 4)**: T017 → T018. Takes `src/render/shapes.js` after US1; functionally depends only on T012, but file order is US1 → US2.
  - **US3 (P2, Phase 5)**: T019 → T020. `src/render/index.js` is independent, so T019 can run in parallel with US1/US2.
  - **US4 (P2, Phase 6)**: T021/T022/T023 in parallel → T024 → T025. Independent of US1–US3.
- **Polish (Phase 7)**: T026–T029 depend on all desired stories.

### User Story Dependencies

- **US1**: No functional dependency on US2–US4 after the foundation. It is the recommended MVP.
- **US2**: No functional dependency on US1, but both edit `src/render/shapes.js`, so merge US1 before US2.
- **US3**: No dependency on US1/US2/US4; only touches `src/render/index.js`.
- **US4**: No dependency on US1–US3; touches `server.js`, `index.html`, `src/config.js`, `src/render/overlays.js`.

### Within Each User Story

- Tests (only the shared manifest test in Phase 2) are written first and must fail before implementation.
- T008 must be red before T009.
- T012 must be green before any story phase.
- Implementation tasks inside a story are sequential where they share a file (`shapes.js`).
- Manual validation follows the story's implementation.
- No story may modify gameplay modules or `RADII`, timings, scores, spawn rules, phases or terminal states.

### Parallel Opportunities

- Setup: T002, T003, T004, T005 (and T007 once downloads finish).
- After T012: US1, US3 and US4 can run in parallel by different developers; US2 waits for US1's `shapes.js` edits.
- US4: T021 (`server.js`), T022 (`index.html`) and T023 (`src/config.js`) in parallel; T024 (`overlays.js`) after T023.
- Polish: T026–T029 can be reviewed in parallel.

---

## Parallel Example: Setup

```bash
# Launch the four independent downloads together:
Task: "T002 fetch Twemoji PNGs to assets/emoji/"
Task: "T003 extract Kenney meteor sprites to assets/asteroids/"
Task: "T004 fetch Sauer2 background to assets/background/"
Task: "T005 fetch Audiowide woff2 to assets/fonts/"
```

## Parallel Example: After Foundation

```bash
# Three stories touch non-overlapping files:
Task: "T013–T016 implement US1 ship/collectibles in src/render/shapes.js"
Task: "T019–T020 implement US3 background in src/render/index.js"
Task: "T021–T025 implement US4 Audiowide in server.js, index.html, src/config.js, src/render/overlays.js"

# US2 then applies asteroid textures in src/render/shapes.js after US1 is merged:
Task: "T017–T018 implement and validate US2 asteroid textures"
```

## Parallel Example: US4

```bash
# Different files, no dependencies:
Task: "T021 add .woff2 MIME in server.js"
Task: "T022 add @font-face/preload in index.html"
Task: "T023 add FONT_FAMILY in src/config.js"

# Then, dependent on T023:
Task: "T024 apply FONT_FAMILY and fitFontSize in src/render/overlays.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (all assets and licenses).
2. Complete Phase 2: Foundational (manifest, loader, boot, manifest test).
3. Complete Phase 3: US1 (ship, bolt, heart, HUD heart).
4. **STOP and VALIDATE**: run `npm test` and quickstart V2/V4/V5 plus the US1 portion of V8.
5. Demo the emoji ship/collectibles as the MVP increment.

US1 is the recommended MVP because the ship and collectibles are the objects the player sees and recognizes continuously. US2 is the other P1 and should follow immediately.

### Incremental Delivery

1. Setup + Foundational → asset pipeline ready.
2. US1 → validate → demo (MVP).
3. US2 → validate → demo (full P1 visual set).
4. US3 → validate → demo (background).
5. US4 → validate → demo (typography).
6. Polish → full V1–V12 sign-off.

### Parallel Team Strategy

1. One developer/agent completes Setup + Foundational.
2. Once T012 is green:
   - Developer A: US1 (`src/render/shapes.js`).
   - Developer B: US3 (`src/render/index.js`) and US4 (`server.js`, `index.html`, `src/config.js`, `src/render/overlays.js`).
   - Developer C: waits for US1's `shapes.js` merge, then US2.
3. Merge and run the shared manifest test plus all existing suites after each story.

---

## Notes

- `[P]` means different files and no dependency on an incomplete task.
- Story labels map every story-phase task to `spec.md`.
- The shared manifest test is the only new automated test; all gameplay tests remain unchanged.
- Manual quickstart tasks require a browser and are not automated.
- Do not modify `src/state.js`, `src/entities.js`, `src/update.js`, `src/collision.js`, `src/spawn.js`, `src/score.js`, `src/input.js` or `src/loop.js`.
- Do not add npm dependencies, frameworks, bundlers or transpilers.
- Do not add sound, persistence, mobile controls, leaderboards or new mechanics.
- Do not commit unless the user explicitly asks.
- Stop at each checkpoint to validate the story independently.

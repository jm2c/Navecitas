# Quickstart & Validation: Visual Refresh

How to run the game and prove the visual refresh end-to-end. Implementation details live in [data-model.md](./data-model.md) and [contracts/visual-assets-contract.md](./contracts/visual-assets-contract.md); the *how* belongs to `tasks.md`. The gameplay checklists and contracts from features 001–004 remain authoritative for behaviour and must still pass.

## Prerequisites

- A desktop browser (Chromium / Firefox / Safari — last 2 major versions) with a keyboard.
- Node.js ≥ 20 — it serves the game and runs the tests. **No `npm install` — there are zero dependencies.**
- The bundled assets under `assets/` (already committed; no downloads at runtime).

## Run

```bash
# from the repository root
node server.js
# open http://localhost:8000
```

## Test

```bash
npm test          # = node --test   (DOM-free core + asset-manifest test)
```

**Red-green gate**: `tests/asset-manifest.test.js` must be written first and fail before the manifest/assets exist, then pass once the bundled assets and mapping are in place. All pre-existing suites (features 001–004) must stay green throughout; no test expectation about gameplay may change.

Expected after implementation: every assertion green, including manifest completeness, local-only paths, on-disk asset files and license records.

## Asset integrity pre-checks

```bash
# every asset and license file is present and local
find assets -type f | sort
# no runtime asset path points at a remote host; provenance `source` URLs are allowed
grep -nE "path: *['\"]https?://" src/render/asset-manifest.js && echo "FAIL: remote asset path" || echo "OK: local manifest paths"
grep -nE "(src|href)=['\"]https?://" index.html && echo "FAIL: remote index asset" || echo "OK: local index assets"
# Twemoji attribution is recorded
grep -i "Twemoji" assets/CREDITS.md
```

Expected: the 7 images, the woff2 font, the three license texts and `CREDITS.md` exist; the manifest's runtime paths are local; the CC-BY attribution is present.

---

## Manual validation scenarios

Legend: **[FR]** requirement covered · **[SC]** measurable outcome · **[VA]** contract clause.

### V1 — Boot, background and overall composition (FR-008, FR-009, FR-018, SC-004, BR-1…BR-3)

1. Run `node server.js`, open the game at 800×600 (or a window at least that size), and press space to start.
2. **Expect**: the starfield fills the whole play area edge to edge; no black bands, seams or obvious repeats; ship, asteroids, projectiles, HUD and text are all clearly visible against it.
3. Resize the window to the minimum 800×600, then maximize it and (on a high-DPI display) check the same.
4. **Expect**: the starfield always covers the play area with no gaps, stretching artifacts or black borders; the game stays smooth.

### V2 — Ship emoji and heading (FR-001, SC-001, SR-1…SR-4)

1. Rotate and thrust in all directions.
2. **Expect**: the ship is the Twemoji rocket, centered on its position; its nose points in the direction of travel and follows the heading continuously (calibrate the `π/4` offset here if a different Twemoji orientation is observed).
3. Judge near misses/hits against asteroids.
4. **Expect**: the visible rocket footprint still feels fair relative to the unchanged 16 px collision radius.

### V3 — Asteroid textures and sizes (FR-005…FR-007, SC-002, AR-1…AR-5)

1. Play until small, medium and large asteroids are visible together.
2. **Expect**: each is a brown cartoon rock; the three sizes are clearly distinguishable at a glance; no asteroid looks like a collectible.
3. Watch a tumbling asteroid for several seconds.
4. **Expect**: its texture rotates smoothly with its spin, with no snapping, seams or clipped corners.
5. Shoot a medium and a large.
6. **Expect**: each fragment immediately uses the texture for its new size (medium → smalls, large → mediums).

### V4 — Double-shot power-up (FR-002, SC-001, CR-1, CR-4)

1. Destroy small asteroids until a power-up appears (10 % rate; medium fragments always drop per feature 004).
2. **Expect**: the gold power-up is now the Twemoji high-voltage bolt; it is instantly distinguishable from the ship, the heart and every asteroid; it moves in the destroyed asteroid's direction and spins as before.
3. Let one reach a screen edge.
4. **Expect**: it despawns exactly as before; no score/life change.

### V5 — Extra-life pickup and HUD icons (FR-003, FR-004, SC-001, CR-2, CR-3)

1. Score past a 500-point bonus threshold until the soft-green special appears.
2. **Expect**: it is the Twemoji red heart (oriented as before), clearly distinct from the bolt and the ship; collecting it (ship or projectile) grants a life exactly as before.
3. Look at the top-left HUD reserve icons.
4. **Expect**: they use the same heart image, upright, one per reserve life; the count matches the previous ship-icon behaviour.

### V6 — Audiowide on every string (FR-010, FR-011, SC-003, TR-1…TR-5)

1. Go through the start screen, countdown, gameplay and game over.
2. **Expect**: "Press spacebar to start", "3", "2", "1", "Go", the score and "Game Over" all render in Audiowide.
3. Watch the giant countdown and game-over animations.
4. **Expect**: they shrink/expand without clipping the playfield edges or overlapping other text; the game-over message stays centered.
5. Play until the score is large (5–6 digits).
6. **Expect**: the score remains readable at the top-right with no clipping.

### V7 — Self-hosted font, no external request (FR-014, TR-1, SC-008)

1. Open the browser devtools Network panel, reload, and play.
2. **Expect**: the woff2 and all images load from the local origin; there are zero requests to Google Fonts, Twemoji, OpenGameArt, Kenney or any other third-party host.
3. Stop the server after the page has loaded, or switch devtools to offline.
4. **Expect**: the game remains fully styled and playable (textures, emoji, font, HUD).

### V8 — Fallback when an asset is missing (FR-012, LF-1/LF-2)

1. Temporarily rename one image (e.g. `assets/emoji/rocket.png`) and reload; repeat for an asteroid texture and the background.
2. **Expect**: the affected object renders as its legacy vector shape (white ship triangle / seeded polygon / black background); the game never crashes, shows an invisible object or blocks startup.
3. Restore the file; reload and confirm the image returns.
4. Temporarily rename the font file and reload.
5. **Expect**: all text falls back to the legible sans-serif stack; text is never invisible or clipped.

### V9 — Offline and zero-dependency confirmation (FR-014, FR-016, SC-008)

1. Confirm there is no `node_modules` requirement and no new package: `npm test` runs with the built-in runner; `package.json` dependencies/devDependencies stay empty.
2. Confirm `node server.js` is the only delivery process and it still serves the game from static files.
3. **Expect**: the game runs without any install step and offline after the initial load.

### V10 — Gameplay regression (FR-015, SC-009, RL-1…RL-5)

1. Run `npm test`.
2. **Expect**: all pre-existing suites pass unchanged (collision, spawn, split, lives, bonus, score, loop, double shot, guaranteed drop).
3. Re-run the manual checklists from features 001–004 (especially `specs/003-double-shot-powerup/quickstart.md` and `specs/004-guaranteed-fragment-drop/quickstart.md`).
4. **Expect**: no behavioural difference — same movement, firing, splits, drops, scoring, lives, countdown timings and terminal states.

### V11 — Performance (FR-018, SC-006, LF-3)

1. Play a dense wave with several asteroids and projectiles on screen while recording performance in the browser devtools.
2. **Expect**: no visible frame-rate degradation versus the pre-refresh game; no stutter, flicker or asset-loading stall during play.

### V12 — Provenance and licensing (FR-013, SC-007, AM-1…AM-5)

1. Inspect `assets/CREDITS.md` and `assets/licenses/`.
2. **Expect**: all eight assets are listed with source, author and license; the three license texts are present; Twemoji's CC-BY 4.0 attribution is explicitly included; every asset path in the manifest is local.
3. Run `npm test` and confirm the manifest/license assertions pass.

---

## Acceptance traceability

| Spec outcome | Primary checks |
|---|---|
| SC-001 (emoji identity) | V2, V4, V5 |
| SC-002 (asteroid size identity) | V3 |
| SC-003 (Audiowide/legibility) | V6 |
| SC-004 (background coverage) | V1 |
| SC-005 (at-a-glance rewards/sizes) | V3, V4, V5 |
| SC-006 (performance) | V11 |
| SC-007 (asset provenance) | V12, asset pre-checks |
| SC-008 (offline) | V7, V9 |
| SC-009 (no gameplay change) | V10 + `npm test` |

A green `npm test`, a clean V1–V12 pass and the existing feature 001–004 checklists are the definition of done for this feature.

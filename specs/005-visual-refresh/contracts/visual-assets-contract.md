# Contract: Visual Assets, Rendering and Typography

**Audience**: every consumer of `src/render/*`, the boot path in `src/main.js`, and the `node --test` manifest check. Spec source: `spec.md` FR-001…FR-019. This contract supersedes the palette, background, glyph and font clauses of feature 001's [render-contract.md](../../001-space-asteroid-game/contracts/render-contract.md); all gameplay contracts of features 001–004 remain binding.

## §1 Asset manifest (spec FR-013, FR-014, FR-019)

- **AM-1** — Every bundled visual asset MUST be described by a row in `src/render/asset-manifest.js` with: `key`, `type` (`image`/`font`), local `path`, `source`, `author`, `license`, and `attribution` where the license requires it.
- **AM-2** — All runtime `path` values MUST be local and relative to the repository root (e.g. `assets/emoji/rocket.png`). No runtime asset URL may reference a third-party host; the game MUST remain fully styled and playable offline after it has been served.
- **AM-3** — The required keys are exactly: `rocket`, `bolt`, `heart`, `asteroidSmall`, `asteroidMedium`, `asteroidLarge`, `background`, `font`. Every render target in §3–§6 MUST map to one of these keys.
- **AM-4** — The bundled files and their licenses MUST match the approved selection: Twemoji 72×72 PNGs for `rocket`/`bolt`/`heart` (CC-BY 4.0), Kenney `meteorBrown_*` sprites for the three asteroid keys (CC0), Sauer2 `bg_1_1.png` for `background` (CC0), and Audiowide latin woff2 for `font` (OFL 1.1).
- **AM-5** — Verbatim license texts MUST exist at `assets/licenses/Kenney-CC0.txt`, `assets/licenses/Twemoji-CC-BY-4.0.txt` and `assets/licenses/Audiowide-OFL-1.1.txt`; `assets/CREDITS.md` MUST list every source URL, author, license and the required Twemoji attribution.

## §2 Entity → asset mapping (spec FR-002…FR-007, FR-017)

- **EM-1** — The mapping MUST be exhaustive and one-to-one for the player-facing roles:

  | Target | Condition | Asset key |
  |---|---|---|
  | Ship | active/visible ship | `rocket` |
  | Small asteroid | `asteroid.kind === 'SMALL'` | `asteroidSmall` |
  | Medium asteroid | `asteroid.kind === 'MEDIUM'` | `asteroidMedium` |
  | Large asteroid | `asteroid.kind === 'LARGE'` | `asteroidLarge` |
  | Double-shot power-up | `asteroid.kind === 'POWERUP'` | `bolt` |
  | Extra-life pickup | `asteroid.kind === 'SPECIAL'` | `heart` |
  | HUD reserve life | one icon per reserve life | `heart` |

- **EM-2** — `POWERUP` and `SPECIAL` MUST NOT share an image asset; the player must be able to distinguish the reward types at a glance (FR-002/FR-003).
- **EM-3** — The HUD reserve-life icon MUST use the same `heart` image as the extra-life pickup (FR-004).

## §3 Ship rendering (spec FR-001)

- **SR-1** — The ship MUST be drawn from the bundled `rocket` image, centered on `ship.x/ship.y`, at a display size of approximately `2.5 × RADII.ship` (≈40 logical px), preserving the image aspect ratio.
- **SR-2** — The image MUST rotate with the ship's heading so its nose points in the direction of travel. The rotation is `ship.angle + SHIP_EMOJI_ROTATION_OFFSET`, with `SHIP_EMOJI_ROTATION_OFFSET = Math.PI / 4` for the Twemoji rocket (which points up-right); the offset is calibrated visually in quickstart V2.
- **SR-3** — The draw MUST remain in the existing logical coordinate space and MUST NOT change `RADII.ship`, collisions or the ship's position/velocity.
- **SR-4** — If the `rocket` image is missing or fails to decode, the existing white triangle `drawShip` path MUST render instead (FR-012).

## §4 Asteroid rendering (spec FR-005, FR-006, FR-007)

- **AR-1** — Small, medium and large asteroids MUST use `asteroidSmall`, `asteroidMedium` and `asteroidLarge` respectively, preserving the same rock family while keeping the sizes visually distinguishable.
- **AR-2** — Each asteroid image MUST be drawn centered on `asteroid.x/y`, rotated by `asteroid.rot`, fitted inside a square of `2 × RADII[kind]` logical px with aspect ratio preserved.
- **AR-3** — The visible footprint MUST correspond to the existing collision radii: the small image is drawn at 28 px for a 14 px radius, the medium at 52 px for a 26 px radius, and the large fitted to 88 px for a 44 px radius (89×82 source → 88×81 drawn). No collision radius changes.
- **AR-4** — On split, children MUST immediately use the texture for their resulting kind (FR-007).
- **AR-5** — If an asteroid image is missing or fails to decode, the existing seeded procedural polygon MUST render instead (FR-012).

## §5 Collectible rendering (spec FR-002, FR-003, FR-004)

- **CR-1** — The double-shot power-up MUST use the `bolt` image, centered on `asteroid.x/y`, rotated by `asteroid.rot` (preserving the existing spin), at about `2 × RADII.POWERUP` (≈28 logical px).
- **CR-2** — The extra-life pickup MUST use the `heart` image, centered on `asteroid.x/y`, rotated by `asteroid.heading` (preserving the existing orientation behaviour), at about `2 × RADII.SPECIAL` (≈28 logical px).
- **CR-3** — The HUD reserve-life icon MUST use the `heart` image, upright (no rotation), at `HUD.lifeGlyph` (12 logical px).
- **CR-4** — If a collectible image is missing or fails to decode, the existing vector glyph (`drawPowerup` gold diamond / `drawSpecial` green ship / `drawLifeIcon` triangle) MUST render instead (FR-012).

## §6 Background rendering (spec FR-008, FR-009)

- **BR-1** — The playfield MUST use the bundled `background` image (Sauer2 starfield, 800×600) drawn at `(0, 0)` covering the full logical play area; it MUST be static (no scroll, drift or parallax).
- **BR-2** — The background MUST be drawn before all world objects, HUD and overlays. If the image is missing or fails to decode, the existing solid `PALETTE.bg` fill MUST remain (FR-012).
- **BR-3** — The background MUST NOT camouflage or reduce the legibility of the ship, projectiles, asteroids, collectibles, HUD or text; the selected starfield has measured average luminance 37.6/255 with only 0.004 % of pixels above 180 (research R1/R6).

## §7 Typography (spec FR-010, FR-011)

- **TR-1** — Audiowide MUST be self-hosted at `assets/fonts/audiowide-latin.woff2` and declared with `@font-face` (`font-weight: 400`, `font-style: normal`, `font-display: swap`). No live third-party font request is permitted.
- **TR-2** — Every on-screen string — score, start prompt, countdown ("3", "2", "1", "Go") and game-over message — MUST use `FONT_FAMILY = "'Audiowide', 'Trebuchet MS', sans-serif"`.
- **TR-3** — If Audiowide cannot be loaded, the fallback stack MUST render legibly; text MUST never become invisible, clipped or unreadable (FR-011).
- **TR-4** — The countdown and game-over strings MUST be width-fitted (max 90 % of `WORLD.W` = 720 px) so Audiowide's wider metrics never clip the playfield at any animated size. The start prompt and score MUST remain within the existing HUD/overlay bounds; long scores MUST remain readable.
- **TR-5** — Font sizes and the width-fitting helper are visual only; no timing, score, spawn or collision value may change.

## §8 Loading, fallback and performance (spec FR-012, FR-018, FR-019)

- **LF-1** — Images and the font MUST be loaded through a cached browser-side loader before or shortly after boot; each asset is loaded at most once. A failed/slow asset MUST NOT block the game indefinitely (bounded wait) or throw an unhandled error.
- **LF-2** — Every draw path in §3–§6 MUST check for a cached asset and fall back to its legacy vector/text rendering when absent. No gameplay object may become invisible (FR-012).
- **LF-3** — All image drawing uses the cached `HTMLImageElement`s with `drawImage`; no per-frame image creation, network fetch, filter or blend mode may be introduced (FR-018).
- **LF-4** — Asset loading and drawing MUST NOT introduce browser/DOM APIs into the gameplay core (`state/entities/update/collision/spawn/score/input/loop`).

## §9 Regression locks (spec FR-015…FR-018)

- **RL-1** — The 800×600 logical world, all collision radii and rules, movement, firing, spawn cadence, splitting, scoring, lives, drop chances, timings, phases and terminal states MUST remain exactly as in features 001–004.
- **RL-2** — No gameplay constant in `src/config.js` may change; only the new `FONT_FAMILY` constant and visual-only sizes are added. `RADII`, `POWERUP_DROP_CHANCE`, tier weights and all timings stay frozen.
- **RL-3** — No npm runtime dependency, framework, bundler or transpiler may be added. `server.js` remains the project-owned zero-dependency Node static server; adding the `.woff2` MIME mapping is the only server change authorized.
- **RL-4** — The existing `node --test` suites MUST stay green without expectation changes. The new manifest test (`tests/asset-manifest.test.js`) is the only added automated test.
- **RL-5** — Projectiles and the explosion keep their existing renderings; no sound, persistence, mobile controls, leaderboard or new mechanics may be added.

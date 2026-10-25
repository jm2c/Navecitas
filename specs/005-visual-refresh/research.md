# Research: Visual Refresh — Emoji Ship/Collectibles, Textured Asteroids & Background, Audiowide Type (Phase 0)

**Feature**: `005-visual-refresh` | Resolves every open question in plan.md §Technical Context; all decisions respect constitution v1.0.0. Empirical grounding: the existing source (`src/render/*`, `src/main.js`, `index.html`, `server.js`, `src/config.js`) and the spec/clarification session (2026-10-24) were read in full. The spec left **no** NEEDS CLARIFICATION; this phase resolves the remaining asset, rendering and delivery decisions.

---

## R1 — Which free-to-use assets are selected, and why

**Decision**:

| Role | Asset | Source (verified 2026-10-24) | License | Why this file |
|---|---|---|---|---|
| Ship | `assets/emoji/rocket.png` — Twemoji `1f680.png`, 72×72 | `https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/1f680.png` | CC-BY 4.0 (graphics) | Recognizable rocket; bundled image gives identical look on every OS; 1,064 bytes |
| Double-shot power-up | `assets/emoji/bolt.png` — Twemoji `26a1.png`, 72×72 | `https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/26a1.png` | CC-BY 4.0 | "Power" symbol, clearly distinct from ship/heart; 446 bytes |
| Extra-life pickup | `assets/emoji/heart.png` — Twemoji `2764.png`, 72×72 | `https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/2764.png` | CC-BY 4.0 | "Life" symbol, distinct from bolt; 498 bytes |
| Small asteroid | `assets/asteroids/small.png` — Kenney `meteorBrown_small1.png`, 28×28 | `SpaceShooterRedux.zip` from `https://opengameart.org/sites/default/files/SpaceShooterRedux.zip` (mirror of `https://opengameart.org/content/space-shooter-redux`) | CC0 | 28 px matches the 2×14 logical diameter almost exactly (1:1) |
| Medium asteroid | `assets/asteroids/medium.png` — Kenney `meteorBrown_med1.png`, 43×43 | same | CC0 | Closest to the 2×26 = 52 logical diameter; only 1.21× upscale |
| Large asteroid | `assets/asteroids/large.png` — Kenney `meteorBrown_big3.png`, 89×82 | same | CC0 | 89×82 fits the 2×44 = 88 logical diameter with almost no scaling |
| Background | `assets/background/starfield.png` — Sauer2 `bg_1_1.png`, 800×600 | `https://opengameart.org/sites/default/files/bg_1_1.png` (page: `https://opengameart.org/content/starfield-background`) | CC0 | Exactly the 800×600 playfield, 15,133 bytes, starry and dark; no tiling seams |
| Typeface | `assets/fonts/audiowide-latin.woff2` — Audiowide v22 latin subset, 14,132 bytes | `https://fonts.gstatic.com/s/audiowide/v22/l7gdbjpo0cum0ckerWCdlg_O.woff2` (family page: `https://fonts.google.com/specimen/Audiowide`) | SIL OFL 1.1 | User-requested family; woff2 keeps the bundle small and is self-hosted for offline play |

**Rationale**:
- The user explicitly chose **bundled Twemoji images** over platform emoji fonts (clarification 2026-10-24), so the three character assets are Twemoji 72×72 PNGs. PNG avoids SVG intrinsic-size/`drawImage` edge cases in Canvas across browsers; 72×72 is sufficient for the ship's ~40 logical-px display and the ~28 logical-px collectibles (even at DPR 2 the upscale is small).
- The user chose a **cartoon/semi-realistic** style. Kenney's brown meteor family is cartoon/semi-realistic and, unusually, already ships at sizes matching this game's three logical diameters. Using the brown family for all three keeps a single coherent rock family while size remains obvious.
- The Sauer2 starfield is the best background fit: it is **already 800×600** (no tiling or distortion), is only 15 KB, and was empirically checked: average luminance **37.6/255**, maximum 255, and only **0.004 %** of pixels above 180 luminance. That is a dark backdrop with sparse bright stars — high contrast for white projectiles, HUD text, the ship and the colored collectibles, without the repeated-tile look of a 256×256 background.
- All selected sources are free to use and redistributable with the game: CC0 (Kenney/Sauer2), CC-BY 4.0 (Twemoji) and OFL 1.1 (Audiowide). Required Twemoji attribution and the full license texts are bundled in `assets/licenses/` and `assets/CREDITS.md` (FR-013).

**Alternatives considered**:
- **Native platform emoji** — rejected by the clarification: appearance varies by OS/browser and cannot be guaranteed.
- **Twemoji SVG** — viable and crisper, but SVGs without explicit intrinsic width/height can behave inconsistently when loaded into `Image` and drawn to Canvas; the 72×72 PNGs are simpler and already adequate. Could be revisited if a DPR-2 quality issue appears.
- **Kenney Space Shooter Redux background** (`Backgrounds/darkPurple.png` etc., 256×256) — rejected for the playfield: tiling an 800×600 area repeats a small tile; measured average luminance is also very low (16–77/255) but the pattern repeats visibly. It remains a fallback option if the starfield is judged too busy.
- **Rawdanitsu "Space Backgrounds 9"** (`Starfield-7-tiled.png`, 3000×2600, ~10 MB) — rejected: 9–10 MB for a single static backdrop is disproportionate for a zero-dependency game.
- **OpenGameArt "Asteroid Tileset 01"** (CC0, three sizes + 8 rotation frames each) — rejected: animation frames are unnecessary because the engine rotates the sprite itself; the extra atlas/slicing would add complexity without a visual gain.
- **Kenney ships/power-ups** — rejected because the user explicitly requested emojis for the ship and power-ups.

**Provenance actions**: keep Kenney's `license.txt`, Twemoji's `LICENSE-GRAPHICS`, and Audiowide's `OFL.txt` under `assets/licenses/`; write `assets/CREDITS.md` with the exact source URLs, authors, licenses and the required CC-BY 4.0 attribution.

---

## R2 — How the assets are integrated into the Canvas renderer

**Decision**:
- Add a pure-data `src/render/asset-manifest.js` exporting local paths, source/license metadata, and the entity→asset-key mapping. No DOM APIs in this module, so the Node test can import it.
- Add a browser-only `src/render/assets.js` that creates one `Image` per manifest entry, calls `img.decode()`/waits for `load`, caches the `HTMLImageElement`s, and exposes `getAsset(key)`, `assetsReady()` and a missing-asset set. Loading uses `Promise.allSettled`; a failed image is marked missing, never fatal.
- **Boot** (`src/main.js`): resolve image and font loading before `startLoop`, with a bounded wait; if anything fails or times out, start immediately and render fallbacks. No loading stall, no blank/broken objects.
- **Background**: draw the cached starfield at `(0, 0, WORLD.W, WORLD.H)` as step 1 of `render`, before any object; if missing, keep the existing black `fillRect`. It is static (clarification) and never scrolls or parallaxes.
- **Asteroids**: translate to `(x, y)`, rotate by `asteroid.rot`, draw the size-mapped texture fitted inside a `2*radius` square preserving aspect ratio; fallback to the existing procedural polygon if the image is missing. The existing `seed`/spin/id fields remain untouched.
- **Ship**: rotate by `ship.angle + SHIP_EMOJI_ROTATION_OFFSET` (initially `Math.PI / 4`, because the Twemoji rocket points up-right at ~45°), draw the rocket centered at a display size of about `2.5 × RADII.ship` (≈40 logical px), fallback to the existing white triangle. The offset is a named visual constant and is calibrated once in quickstart V2; the collision radius stays 16.
- **Double-shot power-up**: rotate by `asteroid.rot` (preserving the existing spin), draw the bolt at about `2 × RADII.POWERUP`, fallback to the existing gold diamond.
- **Extra-life pickup**: rotate by `asteroid.heading` (preserving the existing orientation behaviour), draw the heart at about `2 × RADII.SPECIAL`, fallback to the existing green ship silhouette.
- **HUD reserve-life icon**: draw the same heart image upright at `HUD.lifeGlyph` size; fallback to the existing small ship triangle. This ties the reserve icon to the life pickup (FR-004).
- **Projectiles and explosion**: unchanged (the user only requested ship/power-ups/asteroids/background; keeping these avoids scope creep and preserves visibility).
- **Scaling/DPR**: all draw calls stay in logical 800×600 coordinates; the existing `ctx.setTransform(dpr, …)` handles device pixels. The 800×600 starfield is drawn 1:1 in logical units; at DPR 2 it is upscaled by the canvas transform (acceptable for a starfield), while the 28–89 px meteor textures cover the largest asteroid at near 1:1 source pixels. `imageSmoothingEnabled` stays at its default (true) to avoid jagged upscales.
- **Failure mode**: every new draw path checks `getAsset(key)` and falls back to the pre-existing vector drawing. This satisfies FR-012 and keeps the game playable if an asset is missing, corrupt or fails to decode.

**Rationale**: The existing renderer already isolates all drawing behind `src/render/` and receives plain state objects. Injecting images at the same draw functions is the smallest possible change and keeps the gameplay core untouched (constitution II/IV). Preloading + caching means no per-frame network/decoding work and therefore no 60 FPS regression. Preserving the existing rotations for the collectibles honours the spec's "rotate/track movement the same way the old shapes did" wording and avoids surprising visual behaviour changes.

**Alternatives considered**:
- **Pass an asset bag through every draw function** — rejected: more plumbing for a global, read-only cache; the module-level cache is simpler and testable enough.
- **Replace the vector functions entirely** — rejected: the spec requires visible fallbacks when an asset is unavailable.
- **CSS/DOM `<img>` overlays positioned over the canvas** — rejected: breaks the single Canvas render surface, complicates DPR/scaling and is unnecessary.
- **Upright collectibles (no rotation)** — considered for glyph legibility, but rejected in favour of preserving the existing spin/heading transforms; both Twemoji symbols remain recognizable when rotated.
- **SVG emoji** — see R1; PNG chosen for Canvas reliability.

---

## R3 — How Audiowide is delivered and applied without clipping

**Decision**:
- Self-host the Audiowide v22 **latin woff2** (14,132 bytes) at `assets/fonts/audiowide-latin.woff2`; declare it in `index.html` with `@font-face` (`font-family: 'Audiowide'`, `font-weight: 400`, `font-style: normal`, `font-display: swap`) and add a conditional preload hint.
- Add `FONT_FAMILY = "'Audiowide', 'Trebuchet MS', sans-serif"` to `src/config.js` and use it in every `ctx.font` assignment in `src/render/overlays.js` (score, start prompt, countdown, game over). Audiowide only ships weight 400, so the explicit `bold` weight is removed and emphasis is carried by size; this avoids synthetic-bold distortion.
- Boot preloads the font with `document.fonts.load('16px Audiowide')` (and `document.fonts.ready`) alongside the image loader, with a bounded wait; on failure the fallback stack renders immediately. Because the canvas redraws every frame, the font swaps in automatically when it becomes available.
- Add a small `fitFontSize(ctx, text, maxWidthPx, desiredPx)` helper (in `overlays.js` or a tiny render utility) used by the countdown and game-over strings. It reduces the font size until `measureText(text).width` fits inside a safe width (90 % of `WORLD.W` = 720 px) and never exceeds the existing desired size. This guarantees the spec's no-clipping requirement even though Audiowide is wider than the old sans-serif at the giant 1400 px/140 px sizes.
- Existing alignments/baselines stay unchanged: score right-aligned at `HUD.scoreX/scoreY` (28 px), start prompt centered at `(400, 560)` (24 px), countdown centered at `(400, 380)`, game over centered at `(400, 300)`.
- Text remains English exactly as before ("Press spacebar to start", "3", "2", "1", "Go", "Game Over") — this feature changes typeface, not copy.

**Rationale**: Self-hosting is required for the spec's offline guarantee and avoids a live third-party request (FR-014). OFL 1.1 explicitly permits bundling and embedding the font with the game. The width-fitting helper is the lowest-risk way to satisfy SC-003/FR-010/FR-011 without hand-tuning every animated countdown size; `measureText` is cheap and only called for the two large overlay strings. Removing synthetic bold keeps the intended Audiowide letterforms.

**Alternatives considered**:
- **Google Fonts CDN `<link>`** — rejected: requires network at play time, violating FR-014 and the offline success criterion.
- **Keep `bold` with Audiowide 400** — rejected: browsers synthesize a faux bold that can smear the techno letterforms; a larger 400 weight is cleaner.
- **Hard-code smaller countdown/game-over sizes** — viable but brittle for different text metrics; the fit helper is more robust and still simple.
- **TTF instead of woff2** — rejected: woff2 is smaller and supported by every target browser.

---

## R4 — Static delivery and server changes

**Decision**: Keep the existing zero-dependency `node:http` server. Add `.woff2` → `font/woff2` (and `.ttf` → `font/ttf` defensively) to the MIME map in `server.js`. Existing `.png`/`.jpg`/`.svg` mappings already cover every image. Assets are referenced with local relative paths from `index.html`/the manifest (`./assets/...`), so they work both via `node server.js` and any static host. No new routes, no build step, no `npm install`.

**Rationale**: The server already serves arbitrary static files from the repo root with path-traversal protection and `Cache-Control: no-cache`; only the font MIME type is missing. Adding two map entries is the complete delivery change and preserves constitution I.

**Alternatives considered**:
- **Inline base64 assets** — rejected: bloats JS/HTML, hurts caching and readability, and complicates license/credits handling.
- **A build copy step** — rejected: the project intentionally has no build/transpiler.
- **External CDN for fonts/emoji** — rejected by FR-014 (offline) and constitution I/V.

---

## R5 — Test-first and verification strategy

**Decision**:
- The gameplay core is **not modified**, so its existing 13 `node --test` files are the behavioral regression gate and must stay green without expectation changes.
- Add one new **DOM-free** test file, `tests/asset-manifest.test.js`, written before the assets/manifest exist (red first). It imports the pure `src/render/asset-manifest.js` and asserts:
  1. every required role exists (`ship`, `powerup`, `life`, `asteroidSmall`, `asteroidMedium`, `asteroidLarge`, `background`, `font`);
  2. every entity kind the renderer draws maps to a manifest key;
  3. every manifest path is local/relative (no `http://`/`https://`) and exists on disk;
  4. every entry carries a source, license and (for CC-BY) attribution text;
  5. the three license files exist under `assets/licenses/`.
  This is a red-green test for the asset wiring, not a core-logic test; it intentionally uses `node:fs`/`node:path` and never a browser API.
- Manual browser validation lives in `quickstart.md` (V1–V12): visual checks for emoji identity/orientation, asteroid size readability, background coverage/contrast at 800×600 and maximized/DPR, Audiowide on every string, long-score/game-over fit, fallback behavior with assets blocked, offline play, and a gameplay-regression pass using the existing feature 001/003/004 checklists.
- Run `npm test` (equivalent to `node --test`) after every change; run the manual checklist before declaring done.

**Rationale**: Constitution II mandates test-first for the DOM-free core; this feature has no core delta, so adding artificial core tests would be noise. The manifest test catches the realistic failure modes of a visual-only change (missing file, wrong mapping, accidental external URL, missing license) without pulling DOM/browser APIs into the test environment. Manual checks cover the inherently visual acceptance criteria (SC-001…SC-008).

**Alternatives considered**:
- **No new tests** — rejected: a manifest/path/license regression would otherwise be invisible until runtime.
- **Browser automation (Playwright/Puppeteer)** — rejected: new dependencies and against constitution I; the visual checks stay manual as in features 001–004.
- **Canvas snapshot tests** — rejected: no dependencies for image diffing, and font/emoji rendering is platform-dependent; manual review is more honest here.

---

## R6 — Visual contrast and performance

**Decision**:
- Use the measured Sauer2 starfield (avg luminance 37.6/255; 0.004 % pixels >180) as the only background. Keep the ship/collectibles fully opaque Twemoji images and the brown meteors, which contrast with the dark field. No filters, shadows or blend modes.
- Preload the 7 images and font once; cache `HTMLImageElement`s; all per-frame drawing is `drawImage`/text with no allocations of images or decoders.
- Keep the existing render cadence: at most one render per update tick; no extra rAF loop, no per-frame `fetch`.
- The asteroid images map to the existing logical diameters (28/52/88 px), minimizing scaling; the ship/collectible images are drawn at 28–40 logical px. At DPR 2 the starfield is upscaled by the canvas transform, which is acceptable for a soft starfield and avoids a multi-megabyte high-res asset.
- Verify 60 FPS with the browser performance tools during the quickstart; the visual layer adds a handful of `drawImage` calls per frame, not a new simulation cost.

**Rationale**: The empirical luminance check makes the "background must not camouflage gameplay" requirement (FR-009) concrete. The asset sizes and preloading keep the change within the existing performance envelope. No new animation means no new per-frame work beyond the image draws.

**Alternatives considered**:
- High-resolution background (3000×2500) — rejected for size and decode cost; 800×600 is the logical resolution and the starfield is soft by nature.
- Animated/parallax background — explicitly rejected by the user clarification and constitution V.
- Real-time filters/tints — rejected: unnecessary cost, and would alter the licensed artwork.

---

## R7 — Scope firewall (what must not change)

**Decision**: Do **not** modify `src/state.js`, `src/entities.js`, `src/update.js`, `src/collision.js`, `src/spawn.js`, `src/score.js`, `src/input.js` or `src/loop.js`. Do not change any gameplay constant in `src/config.js`; only add the font-family constant. Do not restyle projectiles or the explosion. Do not add sound, persistence, mobile controls, leaderboards or new mechanics. The only files that change are `index.html`, `server.js`, `src/main.js`, `src/config.js` (font family only), `src/render/{asset-manifest.js,assets.js,index.js,shapes.js,overlays.js}` and the new `tests/asset-manifest.test.js`, plus the bundled `assets/` tree.

**Rationale**: The spec is presentation-only (FR-015) and the constitution freezes the numeric relationships and core behavior. Keeping the diff inside the render boundary makes the "no gameplay change" claim auditable and lets all existing tests pass unchanged.

**Alternatives considered**: none — anything outside the render boundary would violate the feature scope.

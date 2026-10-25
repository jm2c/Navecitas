# Data Model: Visual Refresh (Phase 1)

**Feature**: `005-visual-refresh` | Derived from `spec.md` §Key Entities + FRs and research.md R1–R7. This is a **presentation-only** feature: no gameplay entity, field, number or state transition changes. The model below describes the new static asset metadata, the render mapping and the non-persistent load state. The gameplay data model from features 001–004 remains authoritative.

---

## 1. Asset entry (new, static/bundled)

Each visual asset is described by one immutable entry in `src/render/asset-manifest.js`:

| Field | Type | Required | Notes |
|---|---|---|---|
| `key` | string | yes | Stable cache/manifest identifier, e.g. `rocket`, `asteroidSmall`, `background`, `font` |
| `type` | `'image'` \| `'font'` | yes | Selects the loader path |
| `path` | string | yes | Local repo-relative path under `assets/`; **must not** start with `http://` or `https://` (offline rule, FR-014) |
| `source` | string | yes | Original page/download URL, for provenance (not fetched at runtime) |
| `author` | string | yes | Author/credit line |
| `license` | string | yes | `CC0-1.0`, `CC-BY-4.0` or `OFL-1.1` |
| `attribution` | string | only for CC-BY | Required credit text; empty/omitted for CC0/OFL where not required by the license |
| `width` / `height` | number | for images | Intrinsic pixel dimensions of the bundled file |
| `fallback` | string | yes | Vector/legacy draw path or system font used when loading fails |

**Manifest rows (binding selection, research R1)**

| `key` | `type` | `path` | Intrinsic size | License | Source |
|---|---|---|---|---|---|
| `rocket` | image | `assets/emoji/rocket.png` | 72×72 | CC-BY-4.0 | Twemoji `assets/72x72/1f680.png` |
| `bolt` | image | `assets/emoji/bolt.png` | 72×72 | CC-BY-4.0 | Twemoji `assets/72x72/26a1.png` |
| `heart` | image | `assets/emoji/heart.png` | 72×72 | CC-BY-4.0 | Twemoji `assets/72x72/2764.png` |
| `asteroidSmall` | image | `assets/asteroids/small.png` | 28×28 | CC0-1.0 | Kenney `meteorBrown_small1.png` |
| `asteroidMedium` | image | `assets/asteroids/medium.png` | 43×43 | CC0-1.0 | Kenney `meteorBrown_med1.png` |
| `asteroidLarge` | image | `assets/asteroids/large.png` | 89×82 | CC0-1.0 | Kenney `meteorBrown_big3.png` |
| `background` | image | `assets/background/starfield.png` | 800×600 | CC0-1.0 | Sauer2 `bg_1_1.png` |
| `font` | font | `assets/fonts/audiowide-latin.woff2` | — | OFL-1.1 | Audiowide v22 latin subset (Google Fonts) |

**Validation rules (FR-013/FR-014, research R5)**
- Every path is relative and local; no runtime URL may point at a third-party host.
- Every path exists on disk in the repository.
- Every row has `source`, `author` and `license`; every CC-BY row has a non-empty `attribution`.
- The three license texts exist at `assets/licenses/Kenney-CC0.txt`, `assets/licenses/Twemoji-CC-BY-4.0.txt`, `assets/licenses/Audiowide-OFL-1.1.txt`; `assets/CREDITS.md` lists all sources and the Twemoji attribution.

---

## 2. Entity → asset mapping (new, pure data)

`src/render/asset-manifest.js` also exports the mapping the renderer consumes:

| Render target | Game kind / condition | Asset key | Draw transform | Display size (logical px) | Fallback |
|---|---|---|---|---|---|
| Ship | `state.ship` | `rocket` | rotate `ship.angle + π/4` (Twemoji rocket points up-right) | ≈ `2.5 × RADII.ship` ≈ 40 | existing white triangle (`drawShip` vector path) |
| Small asteroid | `kind === 'SMALL'` | `asteroidSmall` | rotate `asteroid.rot` | 2 × 14 = 28 (1:1) | existing seeded polygon |
| Medium asteroid | `kind === 'MEDIUM'` | `asteroidMedium` | rotate `asteroid.rot` | 2 × 26 = 52 (1.21× upscale) | existing seeded polygon |
| Large asteroid | `kind === 'LARGE'` | `asteroidLarge` | rotate `asteroid.rot` | 2 × 44 = 88 (fit 89×82 → 88×81) | existing seeded polygon |
| Double-shot power-up | `kind === 'POWERUP'` | `bolt` | rotate `asteroid.rot` (preserve existing spin) | 2 × 14 = 28 | existing gold diamond |
| Extra-life pickup | `kind === 'SPECIAL'` | `heart` | rotate `asteroid.heading` (preserve existing orientation) | 2 × 14 = 28 | existing green ship silhouette |
| HUD reserve life | `reserveIcons(state.lives)` | `heart` | no rotation (upright) | `HUD.lifeGlyph` = 12 | existing small ship triangle |
| Playfield background | always | `background` | none; draw at `(0,0)` | 800×600 | plain `PALETTE.bg` fill |
| All text | overlays | `font` | — | existing px sizes, width-fitted | `'Trebuchet MS', sans-serif` stack |
| Projectiles | `state.projectiles` | — (unchanged) | — | existing 7×3 rect | — |
| Explosion | death window | — (unchanged) | — | existing burst | — |

**Consistency rules**
- The mapping is exhaustive for the three asteroid kinds and the two collectible kinds; `POWERUP` and `SPECIAL` must never share an asset key (FR-002/FR-003).
- The HUD life icon uses the same `heart` key as the extra-life pickup (FR-004).
- Images are drawn with their aspect ratio preserved inside the logical size square; no stretching that changes the perceived footprint materially.
- No image is loaded or decoded more than once; the cache is keyed by `key`.

---

## 3. Font configuration (new, visual-only)

| Field | Value | Notes |
|---|---|---|
| `FONT_FAMILY` | `"'Audiowide', 'Trebuchet MS', sans-serif"` | Single source of truth in `src/config.js` |
| Font face | `@font-face` in `index.html` | `font-weight: 400`, `font-style: normal`, `font-display: swap`, `src: url('./assets/fonts/audiowide-latin.woff2') format('woff2')` |
| Loading | `document.fonts.load('16px Audiowide')` + `document.fonts.ready` | Awaited with a bounded wait; failure is non-fatal |
| Applied to | score, start prompt, countdown steps, game-over message | FR-010 |
| Fallback | `'Trebuchet MS', sans-serif` | FR-011; text never invisible |
| Width fitting | `fitFontSize(ctx, text, 0.9 × WORLD.W, desiredPx)` | Countdown + game over; prevents clipping with the wider Audiowide |
| Weight | 400 (no synthetic bold) | Audiowide ships one weight; emphasis by size |

---

## 4. Runtime load state (new, browser-only, not game state)

| Field | Type | Notes |
|---|---|---|
| `images` | `Map<string, HTMLImageElement>` | Loaded image cache, keyed by manifest key |
| `missing` | `Set<string>` | Keys whose load/decode failed; triggers vector/text fallback |
| `fontLoaded` | boolean | Whether the Audiowide face is available |
| `started` | boolean | Guards one-time boot/load |

These live in `src/render/assets.js`, never in `GameState`, and are not serialized. They do not affect scoring, spawning, collision, phases or timings.

**Boot transition**

```
page load
  → loadAssets() / loadFont() (parallel, bounded wait)
  → all settled (success or failure)
  → startLoop() (existing fixed-timestep loop)
  → every render: draw background → world → HUD → overlays
       each draw uses cached image if present, otherwise its legacy fallback
```

A failed/slow asset never blocks the game beyond the bounded wait; it simply resolves to the fallback path.

---

## 5. GameState and gameplay entities — UNCHANGED

No field is added, removed or reinterpreted in `GameState`, `ship`, `projectile`, `asteroid`, `special`, `powerup` or `score`/tier data. In particular:
- `asteroid.seed`, `asteroid.rot`, `asteroid.spin`, `asteroid.heading` keep their existing meanings; the renderer only reads them.
- `RADII`, `SPECIAL_SPEED`, `POWERUP_DROP_CHANCE`, tier weights, timings and the 800×600 world are untouched.
- No `rendering`/`asset` field is added to gameplay objects; the asset mapping is derived from `kind` and from the fixed entity role at draw time.
- The `mediumFragment`/`birthStep` tags from features 002/004 are irrelevant to rendering and remain untouched.

**Interaction matrix (no delta)**: every collision, scoring, spawn, firing and terminal-state rule from features 001–004 is unchanged. The visual refresh cannot alter which object is hit, what it scores, when it drops or when the game ends.

---

## 6. Provenance record

`assets/CREDITS.md` (human-readable) and `assets/licenses/*` (verbatim license texts) form the provenance record:

| Asset group | Author | License | Attribution requirement |
|---|---|---|---|
| Twemoji rocket/bolt/heart | Twitter/X Twemoji contributors | CC-BY 4.0 | Yes — credit "Twemoji" and link the license |
| Kenney meteor sprites | Kenney Vleugels (kenney.nl) | CC0 1.0 | Not required (credit appreciated) |
| Sauer2 starfield | Sauer2 (OpenGameArt) | CC0 1.0 | Not required |
| Audiowide font | Brian J. Bonislawsky / Astigmatic | SIL OFL 1.1 | Preserve the OFL text and copyright notice |

**Validation**: the manifest test asserts that every asset row has source/license and that the three license files exist; the manual quickstart checks `assets/CREDITS.md` for the Twemoji attribution.

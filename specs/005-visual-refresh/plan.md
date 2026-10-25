# Implementation Plan: Visual Refresh — Emoji Ship/Collectibles, Textured Asteroids & Background, Audiowide Type

**Branch**: `005-visual-refresh` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-visual-refresh/spec.md`

## Summary

Replace the game's flat vector presentation with a bundled, license-clean visual set while leaving every gameplay rule untouched: the ship and the two collectibles become Twemoji images (rocket, high-voltage bolt, red heart), asteroids use size-matched cartoon rock sprites from Kenney's CC0 Space Shooter Redux pack, the playfield sits on Sauer2's CC0 800×600 starfield, and every on-screen string uses a locally bundled Audiowide (SIL OFL 1.1) web font. A small browser-only asset loader preloads the images/font, caches them, and falls back to the existing vector shapes and a legible system sans-serif if anything fails. Rendering is isolated in `src/render/`; the DOM-free gameplay core is not touched, the zero-dependency stack is preserved, and the game remains fully playable offline after it is served.

## Technical Context

**Language/Version**: JavaScript (ES modules, Node.js ≥ 20 runtime)

**Primary Dependencies**: **None (0 npm packages)** — platform `Image`, Canvas 2D, `FontFace`/CSS Font Loading APIs; bundled static assets only

**Storage**: N/A (in-memory game state only; no persistence)

**Testing**: `node --test` (built-in, DOM-free) for existing core suites plus a new DOM-free asset-manifest test; manual browser visual checklist in `quickstart.md`

**Target Platform**: Desktop browsers (Chromium, Firefox, Safari — last 2 major versions), keyboard, Canvas 2D; served by the project-owned zero-dependency `server.js`

**Project Type**: Single-project static browser game (frontend only, no build step, no transpiler)

**Performance Goals**: Unchanged constant 60 FPS; all seven images and the font are preloaded once and drawn from cache (`drawImage` only), with no per-frame image creation or filters

**Constraints**:
- Zero-dependency vanilla stack (constitution I) — no packages, frameworks, bundlers or transpilers.
- Fixed 800×600 logical world and all gameplay numbers unchanged (constitution III/IV); this is a presentation-only change.
- No browser/DOM APIs in the logic core (constitution II); all new loading/rendering code stays in `src/render/` and `main.js`.
- Bundled, free-to-use assets only: CC0 for textures/background, CC-BY 4.0 for Twemoji (attribution required), OFL 1.1 for Audiowide.
- Fully offline after serving: no live third-party requests for textures, emoji or fonts.
- Emojis are bundled Twemoji images (user clarification), not the platform emoji font; background is static (user clarification); texture style is cartoon/semi-realistic (user clarification).
- Ship emoji rotates with the heading (user clarification).
- The zero-dependency contract and 800×600 logical area are non-negotiable; only visual constants (font sizes, emoji display sizes) may be tuned.

**Scale/Scope**: One visual layer swap: 7 image assets (3 emoji + 3 asteroid textures + 1 background), 1 font, 3 license texts, 1 credits file. Modified files are limited to `index.html`, `server.js`, `src/main.js`, `src/config.js` (font family only) and `src/render/*`; no gameplay module changes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Zero-Dependency Vanilla Stack | PASS | No npm packages, frameworks, bundlers or transpilers. Assets are plain files served by the existing `server.js`; rendering uses Canvas 2D `drawImage` and the CSS Font Loading API. |
| II. Test-First for the DOM-Free Core | PASS | `state/entities/update/collision/spawn/score` are not modified. Existing `node --test` suites stay green; the only new test is a DOM-free asset-manifest check written first (research R5). Asset loading is browser-only and stays out of the core. |
| III. Binding Numeric Relationships | PASS | All gameplay constants, rates, radii, speeds, timings and the 800×600 area are untouched. Only visual sizes (font px, emoji display px) are chosen, which the spec delegates to presentation. |
| IV. Single Logical Coordinate Space | PASS | Images are drawn in the existing logical space; the canvas `dpr` transform still handles device pixels. The background is drawn at `0,0,800,600`; no world coordinates are redefined. |
| V. Simplicity / YAGNI | PASS | Exactly the requested visual swap plus mandatory fallbacks/licensing. No parallax, no animated background, no projectile restyling, no new features. |
| Assistive: offline / licensing | PASS | All assets are bundled locally; licenses and attribution are recorded; no external runtime asset host is used. |

**Post-Phase-1 re-check**: PASS — the design adds only a cached asset loader, image drawing paths with vector fallbacks, a local font face, visual fitting helpers, and an asset-provenance record. No principle is violated; no core API or gameplay state changes.

## Project Structure

### Documentation (this feature)

```text
specs/005-visual-refresh/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── README.md
│   └── visual-assets-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
index.html               # MODIFIED: local @font-face + font preload; existing canvas host
server.js                # MODIFIED: add .woff2 MIME type for the bundled font

assets/                  # NEW: all bundled visual assets (no external requests)
├── background/
│   └── starfield.png                     # Sauer2 bg_1_1.png (CC0, 800×600)
├── asteroids/
│   ├── small.png                         # Kenney meteorBrown_small1.png (CC0, 28×28)
│   ├── medium.png                        # Kenney meteorBrown_med1.png (CC0, 43×43)
│   └── large.png                         # Kenney meteorBrown_big3.png (CC0, 89×82)
├── emoji/
│   ├── rocket.png                        # Twemoji 1f680.png (CC-BY 4.0, 72×72)
│   ├── bolt.png                          # Twemoji 26a1.png (CC-BY 4.0, 72×72)
│   └── heart.png                         # Twemoji 2764.png (CC-BY 4.0, 72×72)
├── fonts/
│   └── audiowide-latin.woff2             # Audiowide v22 latin subset (OFL 1.1)
├── licenses/
│   ├── Kenney-CC0.txt
│   ├── Twemoji-CC-BY-4.0.txt
│   └── Audiowide-OFL-1.1.txt
└── CREDITS.md                            # source URLs, authors, licenses, attribution

src/
├── main.js              # MODIFIED: preload assets/font, then start loop (fallback-safe)
├── config.js            # MODIFIED: FONT_FAMILY constant only (no gameplay values)
└── render/
    ├── asset-manifest.js # NEW: pure data mapping entity kinds → local asset entries
    ├── assets.js         # NEW: browser-only Image/font preloader + cache + ready flags
    ├── index.js          # MODIFIED: draw background first; compose as before
    ├── shapes.js         # MODIFIED: image drawing with existing vector fallbacks
    └── overlays.js       # MODIFIED: Audiowide on all text; fit-to-width helper

tests/
└── asset-manifest.test.js  # NEW (red-first): manifest completeness, local paths, license records

# UNCHANGED gameplay core:
src/state.js  src/entities.js  src/update.js  src/collision.js
src/spawn.js  src/score.js    src/input.js    src/loop.js
```

**Structure Decision**: The single-project layout from features 001–004 is preserved. All new visual code is isolated in `src/render/` plus a small boot change in `main.js`; the DOM-free core and its tests are untouched. Assets live under a top-level `assets/` tree served as static files by the existing Node server. This keeps the visual layer replaceable and the gameplay layer auditable, exactly as the constitution requires.

## Complexity Tracking

> Empty — no Constitution Check violations to justify.

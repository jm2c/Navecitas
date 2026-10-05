# Implementation Plan: Space Asteroid Game

**Branch**: `001-space-asteroid-game` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-space-asteroid-game/spec.md`

## Summary

Build a 2D space shooter as a **static, single-page web game written exclusively in vanilla JavaScript and rendered with the Canvas 2D API**, driven by a **fixed-timestep 60 FPS loop** that freezes completely while the browser tab is hidden. The ship rotates/thrusts with the arrow keys (no friction, wrap-around screen), fires burst projectiles with recoil, and fights three sizes of edge-spawning asteroids that split and score. Score gates four difficulty tiers (with fixed per-tier spawn-size probabilities) and the spawn of a **soft-green, ship-shaped bonus-life asteroid** every 500 points. Lives are shown as reserve ship icons; death = explosion → 500 ms → centre respawn → 2 s blinking immunity; the last life triggers a giant centred "Game Over" while the simulation keeps running behind it. Visual palette is minimal: **black background, white objects, soft green for the special asteroid**; the HUD holds only score and life icons (English strings, no debug overlay). Logical play area is a fixed 800×600 (4:3), scaled up uniformly on larger viewports and never scaled down; delivery is a zero-dependency Node.js `server.js`.

## Technical Context

**Language/Version**: JavaScript (ES2022 modules), vanilla — no TypeScript, no transpiler, no framework, no bundler.

**Primary Dependencies**: **None (0 npm packages)**. Platform APIs only: Canvas 2D (`CanvasRenderingContext2D`), DOM events (`keydown`/`keyup`), `requestAnimationFrame`, `performance.now()`.

**Storage**: N/A — no persistence, no backend, no leaderboard; restart only by reloading the page (FR-029).

**Testing**: `node --test` (Node ≥ 20 built-in runner, zero dependencies) for pure-logic unit tests of the DOM-free core, plus a manual browser checklist in `quickstart.md`. No test framework dependency is added. *(was NEEDS CLARIFICATION — resolved in research.md R5)*

**Target Platform**: Desktop web browsers (Chromium, Firefox, Safari — last 2 major versions), physical keyboard, served as static files over HTTP by the project's own Node.js server.

**Project Type**: Static single-page web game (frontend only; no backend/app code) plus a zero-dependency `server.js` (Node `node:http`) that only delivers the static files.

**Performance Goals**: **Constant 60 FPS** — fixed simulation timestep of 16.6667 ms, render gated to the same cadence (no stutter, no speed-up on 120/144 Hz displays); the whole simulation freezes while the tab is hidden (FR-033).

**Constraints** (from user input + spec):
- Vanilla JavaScript only; rendering via the Canvas API (no SVG/DOM sprites for game objects).
- Fondo negro (black background), objetos blancos (white objects), special life-granting asteroid in **soft green**.
- Fixed logical play area exactly 800×600; uniform 4:3 upscale only, never scale below 800×600 (scrollbars instead).
- All numeric relationships from the spec are binding (1.3× / 0.3× / 0.15× / 1.5× / 10-20-30 % asteroid multipliers).
- **The local server must be Node.js, never Python**: project-owned `server.js` on the built-in `node:http` module, zero dependencies, started with `node server.js`.
- No FPS counter in the HUD (score + life icons only); frame rate is checked with the browser's performance tools.

**Scale/Scope**: 1 page, 5 user stories, 33 functional requirements, ~10 source modules, single-player only.

**Open items resolved in Phase 0** (formerly NEEDS CLARIFICATION): base-speed value & tuning constants → R1; 60 FPS loop technique → R2; viewport scaling technique → R3; module loading / how to run → R4; test strategy → R5; spawn-mix proportions per tier → R6; animation timings not fixed by spec → R7. **Phase 0.5 clarifications (2026-10-04)**: Node.js `server.js` (no Python) → R4; per-tier spawn mix confirmed → R6; freeze on hidden tab → FR-033/SC-016; English UI strings and no FPS widget → spec Assumptions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status: PASS — constitution ratified at v1.0.0 (2026-10-04).**

`.specify/memory/constitution.md` now holds five ratified principles (Version 1.0.0, Ratified 2026-10-04):

- **I. Zero-Dependency Vanilla Stack (NON-NEGOTIABLE)** — satisfied: 0 npm packages, vanilla ES modules + Canvas 2D, Node-only `server.js` (Technical Context, Constraints).
- **II. Test-First for the DOM-Free Core** — satisfied: `node --test` suite (`tests/*.test.js`) written to fail before implementation; core modules stay DOM-free (Structure Decision, tasks.md test-first notes).
- **III. Binding Numeric Relationships** — satisfied: all spec relationships locked (1.3× / 0.3× / 0.15× / 1.5× / 10-20-30% multipliers, 800×600); only delegated tuning constants chosen (Constraints, tasks.md T005).
- **IV. Single Logical Coordinate Space** — satisfied: single 800×600 logical space; uniform scaling only (`contracts/render-contract.md` §2-3).
- **V. Simplicity / YAGNI** — satisfied: no out-of-scope features (no sound, persistence, mobile controls, leaderboards; spec Assumptions).

Development Workflow gates (tests green, `quickstart.md` V1–V10 sign-off, zero-dependency confirmation, no browser APIs in the core) map to tasks.md T040–T043.

**Re-check after Phase 1 design: PASS (v1.0.0, unchanged).** No design artifact (`research.md`, `data-model.md`, `contracts/`, `quickstart.md`) conflicts with principles I–V: zero-dependency stack confirmed in R4/R5 (including the Node-only server), DOM-free core guaranteed by `contracts/core-api.md`, single logical coordinate space fixed in `contracts/render-contract.md` §2, and `quickstart.md` maps every SC (SC-001…SC-016) to a runnable check.

Self-imposed quality gates applied to this plan in addition to the constitution: single 800×600 logical coordinate space, all spec acceptance scenarios traceable to a module.

## Project Structure

### Documentation (this feature)

```text
specs/001-space-asteroid-game/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── README.md
│   ├── input-contract.md
│   ├── render-contract.md
│   └── core-api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
index.html               # Canvas host + module entry (<script type="module">)
server.js                # zero-dependency static server (node:http), run: node server.js

src/
├── main.js              # boot: canvas, scaling, input wiring, start loop
├── config.js            # all tuning constants + palette (black/white/green)
├── loop.js              # fixed-timestep 60 FPS accumulator loop
├── input.js             # keyboard state (arrows, space), preventDefault
├── state.js             # game state factory + phase machine (start→countdown→play→gameover)
├── entities.js          # factories: ship, projectile, asteroid (3 sizes), special
├── update.js            # one 16.6667 ms simulation step (physics, timers, phases)
├── collision.js         # projectile/ship/asteroid & asteroid/asteroid resolution
├── spawn.js             # edge spawning, tier table, 500-multiple bonus spawns
├── score.js             # score/lives rules, tier lookup, bonus-spawn trigger
└── render/
    ├── index.js         # frame compose: clear → entities → HUD → overlays
    ├── shapes.js        # procedural polygons (ship, rocks, special, explosion)
    └── overlays.js      # start text, countdown, Game Over, score, life icons

tests/                   # node --test, imports src/*.js directly (no DOM APIs)
├── loop.test.js
├── score.test.js
├── collision.test.js
├── spawn.test.js
├── lives.test.js
└── bonus.test.js
```

**Structure Decision**: Single-project static web game (no backend): a static page plus a zero-dependency `server.js` that only serves it. The logic core (`state/entities/update/collision/spawn/score`) is **pure and DOM-free** so it runs unmodified under `node --test`; only `main.js`, `input.js`, `loop.js`, `render/` and `server.js` touch the platform. Rendering is isolated behind `render/index.js(ctx, state)` so the Canvas API is the sole drawing surface.

## Complexity Tracking

No constitution violations to justify (Constitution Check: PASS against ratified v1.0.0, 2026-10-04).

# Implementation Plan: Double Shot Power-Up

**Branch**: `003-double-shot-powerup` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-double-shot-powerup/spec.md`

## Summary

Add a rare reward to the destruction loop: when a small asteroid is destroyed (by any cause) there is an independent 10% chance that a **power-up object** is released at the destroyed asteroid's exact position and velocity (direction inherited verbatim from the asteroid's `vx/vy` at the destruction instant). The power-up flies like an ordinary transient object — it despawns at borders, ignores regular asteroids entirely (same "non-regular" family as the existing bonus-life ship) and is **collected** either by ship contact (harmless, immunity included) or by projectile contact (both consumed) — with **zero score/life change**. Collection activates the **double shot**: every firing input now emits a pair of projectiles launched together from the ship's position in a slight symmetric V around the ship's heading (one projectile each side of the aim line, at the normal projectile speed), with **one normal recoil per shot** and unchanged cadence. While the effect lasts, projectile capacity operates at **twice the normal value as a soft operating point** — the pair is never split or refused for space (clarification 2026-10-24 Q3 → B-1), so the count may transiently exceed the doubled limit and is reabsorbed as projectiles expire. The effect ends **exactly when a life is lost** (death-sequence completion or game over), restoring single-shot firing and the normal capacity for all subsequent shots; projectiles already in flight are never removed (FR-011). Pure DOM-free core change (`state/entities/collision/score/spawn/update/config`) + a distinct gold rendering; red-green `node --test` coverage; no new dependencies; no existing numeric relationship touched.

## Technical Context

**Language/Version**: JavaScript (ES2022 modules), vanilla — no TypeScript, no transpiler, no framework, no bundler (unchanged from features 001/002).

**Primary Dependencies**: **None (0 npm packages)**. Platform APIs only: Canvas 2D, DOM events, `requestAnimationFrame`, `performance.now()` — the render layer is the only one touched outside the core, and only to draw the new kind visually distinct.

**Storage**: N/A — no persistence, no backend; the feature changes only in-memory simulation state. (Reload loses everything, as today — out of scope per spec Assumptions.)

**Testing**: `node --test` (Node ≥ 20 built-in runner, zero dependencies) for the DOM-free core, driven with multi-frame `update()` sequences and directly injected fake `random` functions for deterministic drop rolls (injectable-random pattern already used in `src/spawn.js` — `pickKind(weights, random)`); plus the manual browser checklist in `quickstart.md`. Tests are written to fail first (constitution II).

**Target Platform**: Desktop web browsers (Chromium, Firefox, Safari), served as static files by the project's own zero-dependency `server.js`.

**Project Type**: Static single-page web game (frontend only) + zero-dependency `server.js`. This feature extends the existing single project — one new entity kind, one state flag, a few config constants; no new modules.

**Performance Goals**: Constant 60 FPS fixed-timestep simulation (16.6667 ms) sustained under double-shot fire. Worst case while the effect lasts: a held burst adds 2 projectiles per 160 ms ≈ 12.5 pairs/s; with projectile lifetime of ~2–3.7 s until border despawn this peaks at roughly 25–70 simultaneous projectiles plus the regular population — all plain circles to the pair loop, i.e. O(n) per frame, comfortably inside the frame budget. The extra per-step cost of the feature is one floating compare per small-asteroid destruction and one boolean check in the firing path.

**Constraints** (from constitution + spec):
- Zero-dependency vanilla stack (non-negotiable); no new packages.
- DOM-free, test-first core (red-green before implementation).
- Binding numerics from the spec: **10% drop probability** (FR-001, independent per destroyed small asteroid), normal projectile speed per projectile of the pair, **once** the normal recoil magnitude per double shot (FR-008, clarification Q2 → A), **twice the normal projectile limit** as the nominal operating capacity (FR-009), effect termination **exactly at life loss** (FR-010). The symmetric V half-angle of the pair is the one numeric the spec **explicitly delegates** to this plan (FR-007) — resolved to 10° in research.md R3; no pre-existing constant is retuned (constitution III).
- The power-up must never be counted toward the tier cap nor interact with regular asteroids (FR-012), mirroring the existing `SPECIAL` exclusions.
- A collected duplicate must not stack the effect (FR-014) — the boolean flag makes this the natural default.

**Scale/Scope**: 1 feature; 15 functional requirements; ~7 source modules touched (`src/config.js`, `src/state.js`, `src/entities.js`, `src/score.js`, `src/collision.js`, `src/spawn.js`, `src/update.js` + `src/render/shapes.js` for the visual identity); 2 new test files; no server, input, loop, main or HUD changes.

**Open items resolved in Phase 0**: none flagged as NEEDS CLARIFICATION in Technical Context; research.md documents the injectable-random drop mechanism (R1), the power-up representation (R2), the delegated V half-angle decision (R3), the effect's storage/lifecycle (R4), the B-1 capacity implementation (R5), the red-green test strategy (R6) and the visual identity choice (R7).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status: PASS — constitution v1.0.0 (Ratified 2026-10-04, Last Amended 2026-10-04).**

- **I. Zero-Dependency Vanilla Stack (NON-NEGOTIABLE)** — satisfied: 0 npm packages added; change confined to existing vanilla ES modules plus `Canvas 2D` drawing in the existing render layer; `server.js` untouched.
- **II. Test-First for the DOM-Free Core** — satisfied: new `tests/` cases drive the pure `update()`/`resolveCollisions()`/`applySizeRule()` core and are written red before implementation (research.md R6, quickstart.md V1–V6; `npm test` gate).
- **III. Binding Numeric Relationships** — satisfied: every existing relationship (± 25° split V, 200/50/0 points, 1.3×/0.3×/0.15×/1.5× multipliers, tier caps 3/3/5/7, 800×600 area, 5-projectile cap, 160 ms cadence, 30-recoil magnitude) is untouched. The two new numerics come from the spec itself (10% drop, doubled capacity, once-recoil) or from the slot the spec explicitly delegated (the pair's V half-angle → 10°, research.md R3); a collected-duplicate no-op needs no new numerics.
- **IV. Single Logical Coordinate Space** — satisfied: the power-up is born at the destroyed asteroid's former position in the 800×600 space and uses the same wrap/despawn conventions; no coordinate or scaling change (data-model.md §3).
- **V. Simplicity / YAGNI** — satisfied: no HUD indicator (spec Assumption), no sound, no persistence, no stacking/timer machinery — a single boolean state flag governs the whole effect; the drop is a plain bounded filter (one float compare).

Development Workflow gates: `npm test` green, `quickstart.md` V1–V6 sign-off + feature-001 V1–V10 regression sweep, zero-dependency confirmation (`npm ls --omit=dev` empty), no browser APIs in the core — mapped in quickstart.md.

**Re-check after Phase 1 design: PASS (v1.0.0, unchanged).** No design artifact conflicts with principles I–V: `research.md` R1/R6 keep the core pure, dependency-free and red-green testable through an injectable `random` (the same established pattern as `pickKind`), `data-model.md` adds only one boolean state field and one non-regular entity kind inside the existing 800×600 model, `contracts/powerup-contract.md` restates the spec numbers verbatim (10% / doubled capacity / once-recoil / termination-at-life-loss) and fixes the delegated half-angle at 10°, and `quickstart.md` maps SC-001…SC-006 to runnable checks.

## Project Structure

### Documentation (this feature)

```text
specs/003-double-shot-powerup/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── README.md
│   └── powerup-contract.md
├── checklists/
│   └── requirements.md  # (created by /speckit.specify)
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
index.html               # unchanged
server.js                # unchanged (zero-dependency static server)

src/
├── config.js            # + POWERUP_DROP_CHANCE, POWERUP_SPREAD_HALF_ANGLE, PALETTE.powerup(+Highlight), RADII.POWERUP
├── state.js             # + doubleShot field (boolean, default false) on the game state
├── entities.js          # + createPowerup(x, y, heading, speed); createProjectile gains an optional heading offset
├── score.js             # + 10% drop roll in applySizeRule (both award and no-award paths) with injectable random
├── collision.js         # + collection rules (projectile×POWERUP, ship×POWERUP); POWERUP excluded from regular passes; random passthrough
├── spawn.js             # + regular-cap counting excludes POWERUP (besides SPECIAL)
├── update.js            # + double-shot firing (pair, once-recoil, no space refusal while active) + flag cleared at life loss
└── render/
    ├── shapes.js        # + gold power-up glyph (visually distinct, FR-003)
    ├── index.js         # renders POWERUP with the other asteroids' pass (no structural change)
    └── (overlays.js unchanged — no HUD indicator)

tests/
├── powerup.test.js      # NEW: drop roll, spawn position/velocity, collection paths, immunity, despawn, no-regular-interaction
├── double-shot.test.js  # NEW: pair geometry, once-recoil, cadence, capacity B-1, no-stacking, termination & retention
└── (existing 10 files unchanged)
```

**Structure Decision**: Continue the single-project layout of features 001/002 (constitution I): all logic in the existing DOM-free core modules under `src/`, one new entity kind in the existing `asteroids` collection, one boolean on the existing game state, and new pure-logic tests alongside the existing suite. No new directories, no new modules beyond the factory, no test harness changes.

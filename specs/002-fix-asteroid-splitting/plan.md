# Implementation Plan: Fix Asteroid Splitting

**Branch**: `002-fix-asteroid-splitting` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-fix-asteroid-splitting/spec.md`

## Summary

Restore the size-based splitting that the game already promises: a medium hit by a projectile must leave 2 small fragments, a large must leave 2 medium fragments, and asteroid-vs-asteroid collisions must fragment both parents without scoring. **Root cause (empirically reproduced with the real core modules over multiple frames)**: fragments are created at the parent's exact position, so on the very next simulation step two co-born fragments are still within collision range (small+small = 28 px needed vs ~5.7 px separation after one 60 Hz step; medium+medium = 52 px needed) and destroy each other — the screen ends up empty, exactly the reported symptom (medium+projectile → `SMALL,SMALL → EMPTY`; large → `MEDIUM,MEDIUM → SMALL×4 → EMPTY`; medium-vs-medium → `SMALL×4 → EMPTY`). **Fix**: tag every fragment with the simulation step it was born in and never let two fragments born in the same instant collide with each other (spec FR-005, clarification 2026-10-05 Q1→A), while the tier population cap stays enforced on new edge spawns only (FR-009 — already the behaviour; locked in with a regression test). Pure DOM-free core change in `state/entities/collision/update` plus red-green `node --test` coverage; no new dependencies, no numeric relationship touched.

## Technical Context

**Language/Version**: JavaScript (ES2022 modules), vanilla — no TypeScript, no transpiler, no framework, no bundler (unchanged from feature 001).

**Primary Dependencies**: **None (0 npm packages)**. Platform APIs only: Canvas 2D, DOM events, `requestAnimationFrame`, `performance.now()` — none of them touched by this fix.

**Storage**: N/A — no persistence, no backend; the fix changes only in-memory simulation state.

**Testing**: `node --test` (Node ≥ 20 built-in runner, zero dependencies) for the DOM-free core, driven with multi-frame `update()` sequences (pattern already used in `tests/loop.test.js`), plus the manual browser checklist in `quickstart.md`. Tests are written to fail first (constitution II). *(No NEEDS CLARIFICATION — strategy inherited from feature 001 R5.)*

**Target Platform**: Desktop web browsers (Chromium, Firefox, Safari), served as static files by the project's own zero-dependency `server.js`.

**Project Type**: Static single-page web game (frontend only) + zero-dependency `server.js`. This feature is a behaviour repair inside the existing single project — no new modules, no new pages.

**Performance Goals**: Constant 60 FPS fixed-timestep simulation (16.6667 ms) sustained with the worst-case population (tier cap + fragments that temporarily exceed it — FR-009); the fix adds one integer comparison per asteroid pair, i.e. O(1) extra work per pair.

**Constraints** (from constitution + spec):
- Zero-dependency vanilla stack (non-negotiable); no new packages.
- DOM-free, test-first core (red-green before implementation).
- Binding numeric relationships unchanged: ± 25° V half-angle, 200/50/0 points, 1.3×/0.3×/0.15×/1.5× multipliers, 10-20-30% tier multipliers, 800×600 logical area, caps 3/3/5/7.
- Splits must never be suppressed or culled to respect the cap (FR-009).
- Special life-granting asteroid out of scope (never splits, never collides with regulars).

**Scale/Scope**: 1 bug-fix feature; 9 functional requirements; ~4 source modules touched (`src/state.js`, `src/entities.js`, `src/collision.js`, `src/update.js`); ~6 new tests; no UI, rendering or server changes.

**Open items resolved in Phase 0**: none flagged as NEEDS CLARIFICATION in Technical Context; research.md documents the root-cause diagnosis (R1), the chosen fix mechanism and rejected alternatives (R2, R3), the cap-overflow confirmation (R4), the multi-frame test strategy (R5) and the exact protection scope (R6).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status: PASS — constitution v1.0.0 (Ratified 2026-10-04, Last Amended 2026-10-04).**

- **I. Zero-Dependency Vanilla Stack (NON-NEGOTIABLE)** — satisfied: 0 npm packages added; change is confined to existing vanilla ES modules; `server.js` untouched (Technical Context, Structure Decision).
- **II. Test-First for the DOM-Free Core** — satisfied: new `tests/` cases drive the pure `update()`/`resolveCollisions()` core and are written red before the fix (research.md R5, quickstart.md V1–V5; `npm test` gate).
- **III. Binding Numeric Relationships** — satisfied: no constant changes — ± 25° V half-angle, point values, tier multipliers, caps and the 800×600 area are untouched; the fix introduces a structural rule (same-instant fragment protection), not a numeric one (research.md R2).
- **IV. Single Logical Coordinate Space** — satisfied: fragments are still born at the parent's position in the 800×600 space; no coordinate or scaling change (data-model.md §2).
- **V. Simplicity / YAGNI** — satisfied: no new features (no effects, no sound, no new UI); only the behaviour the existing spec already requires (spec Assumptions, FR-005/FR-009).

Development Workflow gates: `npm test` green, `quickstart.md` V1–V7 sign-off, zero-dependency confirmation (`npm ls --omit=dev` empty), no browser APIs in the core — mapped in quickstart.md.

**Re-check after Phase 1 design: PASS (v1.0.0, unchanged).** No design artifact conflicts with principles I–V: `research.md` R2/R3 keep the core pure and dependency-free, `data-model.md` adds only a step counter and a birth tag inside the existing 800×600 model, `contracts/split-contract.md` restates spec numbers verbatim, and `quickstart.md` maps SC-001…SC-007 to runnable checks.

## Project Structure

### Documentation (this feature)

```text
specs/002-fix-asteroid-splitting/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── README.md
│   └── split-contract.md
├── checklists/
│   └── requirements.md  # (created by /speckit.specify)
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
index.html               # unchanged
server.js                # unchanged (zero-dependency static server)

src/
├── state.js             # + stepCount field on the game state (birth-instant clock)
├── entities.js          # + birth tag on fragments created by a destruction event
├── collision.js         # + skip fragment-vs-fragment pairs born in the same instant
├── update.js            # + increment stepCount once per simulation step
├── config.js            # unchanged (all constants stay put)
├── spawn.js             # unchanged (cap already enforced on edge spawns only)
├── score.js             # unchanged (size rules, ±25° V, 200/50/0 already correct)
├── input.js             # unchanged
├── main.js              # unchanged
└── render/              # unchanged

tests/                   # node --test, imports src/*.js directly (no DOM APIs)
├── collision.test.js    # + failing-first split-survival cases (multi-frame)
├── loop.test.js         # + cap-overflow regression case (or new split.test.js)
├── score.test.js        # unchanged, must stay green
├── spawn.test.js        # unchanged, must stay green
├── lives.test.js        # unchanged, must stay green
└── bonus.test.js        # unchanged, must stay green
```

**Structure Decision**: Keep the existing single-project layout — this is a repair inside the DOM-free core, so no new directories or modules are introduced. The birth-instant clock (`stepCount`) lives on the game state so it stays pure and deterministic under `node --test`; only `update.js` advances it, exactly once per simulation step, before collisions are resolved. Fragments are tagged at creation in the factory/size-rule path, and `resolveCollisions` skips only fragment-vs-fragment pairs with an equal birth tag — every other collision rule (projectile, ship, unrelated asteroids, borders, scoring) is untouched.

## Complexity Tracking

No constitution violations to justify (Constitution Check: PASS against ratified v1.0.0, 2026-10-04).

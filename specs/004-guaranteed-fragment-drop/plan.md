# Implementation Plan: Guaranteed Drop From Medium Fragments

**Branch**: `004-guaranteed-fragment-drop` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-guaranteed-fragment-drop/spec.md`

## Summary

Amends feature 003's drop rule: a small asteroid born from a medium asteroid's split (a "medium-fragment small") ALWAYS releases the double-shot power-up when destroyed (100%), while all other small asteroids keep feature 003's independent 10% roll. Technical approach: tag fragments at birth with their parent size in `applySizeRule` (`src/score.js`), then make the SMALL-destruction branch bypass the probability roll when the destroyed asteroid is a medium fragment — everything else about the power-up (spawn position, velocity inheritance, collection, activation, termination) is untouched feature-003 behaviour.

## Technical Context

**Language/Version**: JavaScript (ES modules, Node.js ≥ 20 runtime)

**Primary Dependencies**: None — zero-dependency vanilla stack (constitution I); `node:http` serves static files

**Storage**: N/A (in-memory game state only)

**Testing**: `node --test` (built-in test runner, DOM-free pure-logic core)

**Target Platform**: Desktop browser (Canvas 2D), served by project-owned `server.js`

**Project Type**: Single-project browser game (no build step, no transpiler)

**Performance Goals**: Unchanged from feature 001 (60 fps fixed logical space 800×600)

**Constraints**: DOM/browser APIs never enter the logic core (constitution II); all spec numerics binding (constitution III): 100% guaranteed rate, 10% retained rate, direction/speed inheritance, score/life-neutral drops

**Scale/Scope**: One rule amendment on top of features 001–003; no new entities, no new constants

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Zero-Dependency Vanilla Stack | PASS | Pure rule change in existing modules; no deps, no tooling added |
| II. Test-First for the DOM-Free Core | PASS | New tests written red-first against `applySizeRule`/`resolveCollisions` (research R3); core stays pure and DOM-free |
| III. Binding Numeric Relationships | PASS | Spec binds the rates (100% / 10%); the feature introduces **no** new numeric constants — the guaranteed drop bypasses the roll entirely (research R2) |
| IV. Single Logical Coordinate Space | PASS | Drop spawn reuses the destroyed asteroid's 800×600 logical position/velocity verbatim |
| V. Simplicity / YAGNI | PASS | One boolean origin tag + one branch condition; no new entity kinds, collections, HUD or visuals beyond feature 003's existing glyph |

**Post-Phase-1 re-check**: PASS — design adds `mediumFragment` flag on split children + one conditional in the SMALL branch; INVs in data-model.md keep feature-002's `birthStep` protection and feature-003's power-up invariants intact.

## Project Structure

### Documentation (this feature)

```text
specs/004-guaranteed-fragment-drop/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── README.md
│   └── guaranteed-drop-contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── config.js            # (unchanged — no new constants)
├── entities.js          # (unchanged — power-up/reclaim factories reused)
├── score.js             # MODIFIED: set `mediumFragment` on split children; guaranteed-drop branch in the SMALL rule
├── collision.js         # (unchanged — resolveCollisions already funnels every destruction cause into applySizeRule)
├── state.js             # (unchanged — no state field added; drops are events, not state)
├── spawn.js  update.js  input.js  loop.js  main.js   # (unchanged)
└── render/              # (unchanged — power-up glyph from feature 003 reused)

tests/
└── guaranteed-drop.test.js   # NEW (red-first, node --test)
```

**Structure Decision**: Single project layout carried over from features 001–003; only `src/score.js` gains code, only `tests/` gains a new red-first test file.

## Complexity Tracking

> Empty — no Constitution Check violations to justify.

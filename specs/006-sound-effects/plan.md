# Implementation Plan: Sound Effects for Game Events

**Branch**: `006-sound-effects` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-sound-effects/spec.md`

## Summary

Add short, distinct **synthesized retro/arcade** cues for the eight requested events — countdown, firing, asteroid destruction, asteroid split, losing a life, gaining a life, collecting the double-shot power-up and game over — without changing any gameplay rule, number or visual. The DOM-free core emits semantic events into a transient `state.events` queue at the exact mutation points; `src/main.js` drains that queue once per rendered frame and hands it to a browser-only Web Audio engine. The cue catalog is pure data; the engine uses oscillators, gain envelopes, a reusable noise buffer, a master gain and a compressor. No audio files, packages, external services, music, voice or in-game volume UI are added. The feature explicitly amends constitution Principle V's "no sound" boundary; the constitution must be updated to v1.1.0 per its governance rule.

## Technical Context

**Language/Version**: JavaScript ES modules (Node.js ≥ 20 for tests/server; browser ES modules for runtime)

**Primary Dependencies**: **None (0 npm packages)** — platform Web Audio API for synthesis, Canvas 2D for the existing renderer; no audio assets

**Storage**: N/A — in-memory transient event queue and audio-engine state only; no persistence

**Testing**: `node --test` (built-in, DOM-free) for existing suites plus new `tests/events.test.js` and `tests/audio-cues.test.js`; manual browser listening/behavior checklist in `quickstart.md`

**Target Platform**: Desktop browsers (Chromium, Firefox, Safari — last 2 major versions), keyboard input, Web Audio API; graceful silence when audio is unsupported/blocked; served by the existing zero-dependency `node:http` server

**Project Type**: Single-project static browser game (frontend only, no build step, no transpiler)

**Performance Goals**: Unchanged constant 60 FPS; cue latency < 100 ms; no clipping when cues overlap; no per-frame audio work beyond iterating a small drained event array

**Constraints**:
- Zero-dependency vanilla stack (constitution I) — no packages, frameworks, bundlers, transpilers or audio files.
- Gameplay core (`state/entities/update/collision/spawn/score`) stays DOM-free (constitution II); the only core delta is semantic event emission into a transient queue.
- All gameplay numbers, timings, radii, scoring, spawning, phases and the 800×600 logical world are frozen (constitution III/IV). Audio recipe values are audio-only tuning.
- No music, voice-over, ambient loop, in-game mute/volume control, audio settings or persistence (FR-021).
- Every cue is synthesized locally; zero audio files, zero audio network requests, fully offline (FR-015, FR-022).
- First audio only after a deliberate input gesture (FR-018); hidden tab stops active sources, suspends audio and discards queued cues with no backlog (FR-019). All cues are finite/one-shot; the intentional game-over cue plays once at the transition, and no cue loops or remains queued.
- Full silent, error-free fallback and automatic recovery when audio is unavailable (FR-017).
- Cues are non-looping and ≤ 1.5 s each; countdown digits may share a family, GO is distinct (FR-002, FR-012).
- The user chose synthesized retro/arcade cues and no in-game mute/volume control (clarifications 2026-10-24).
- The `.specify/memory/constitution.md` Principle V wording must be amended (sound removed from the excluded list) and version bumped to `1.1.0` with the amendment date.

**Scale/Scope**: 11 semantic event ids covering the 8 requested categories; 11 cue recipes; 3 new source modules (`src/events.js`, `src/audio/cues.js`, `src/audio/engine.js`); 6 modified files (`src/state.js`, `src/update.js`, `src/collision.js`, `src/score.js`, `src/main.js`, `.specify/memory/constitution.md`); 2 new test suites; no asset, server, HTML or render changes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Zero-Dependency Vanilla Stack | PASS | No npm packages, frameworks, bundlers or transpilers. Web Audio is a platform API; cues are synthesized at runtime. No audio files. |
| II. Test-First for the DOM-Free Core | PASS | `src/events.js` and the event emission are pure/DOM-free and covered by a new `node --test` suite written first. The audio engine is browser-only and never imported by the core. Existing core suites stay green. |
| III. Binding Numeric Relationships | PASS | No gameplay constant, 1.3×/0.3×/0.15×/1.5×/drop-chance/tier value, timing or the 800×600 area changes. Cue frequencies/gains/durations are new audio-only tuning data. |
| IV. Single Logical Coordinate Space | PASS | Audio has no world coordinates; the renderer and 800×600 logical space are untouched. |
| V. Simplicity / YAGNI | PASS with amendment | Spec 006 explicitly adds sound and excludes music, voice, mute/volume UI, settings and persistence. Principle V's parenthetical still lists "no sound", so implementation MUST amend the constitution Principle V and bump the version to **1.1.0** with the amendment date, as Governance requires. This is a documented scope amendment, not an unjustified violation. |
| Assistive: offline / provenance | PASS | No recorded audio assets or network requests; FR-016 is vacuously satisfied and the existing visual asset records are untouched. |

**Post-Phase-1 re-check**: PASS — the design adds only a pure event queue/catalog, a browser-only synth engine, event emission at existing mutation points and a boot-time drain. No gameplay state, constant, coordinate, render output or asset changes. The constitution amendment is the only governance action.

## Project Structure

### Documentation (this feature)

```text
specs/006-sound-effects/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── README.md
│   └── sound-effects-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── events.js            # NEW: frozen GAME_EVENTS ids + emit/drain/clear (DOM-free)
├── audio/
│   ├── cues.js          # NEW: pure frozen CUE_CATALOG (recipes, no DOM/no assets)
│   └── engine.js        # NEW: browser-only Web Audio synth, unlock/resume/suspend, fallback
├── state.js             # MODIFIED: createGame() adds transient events: []
├── update.js            # MODIFIED: emit countdown:3/2/1/go + one shot on successful fire
├── collision.js         # MODIFIED: emit life:lost, game:over, powerup:collected
├── score.js             # MODIFIED: emit asteroid:destroyed/split, life:gained
├── main.js              # MODIFIED: create engine, drain events before render, clear on hide
├── entities.js          # UNCHANGED
├── spawn.js             # UNCHANGED
├── input.js             # UNCHANGED (engine owns its own unlock listeners)
├── loop.js              # UNCHANGED (main's render wrapper drains audio)
├── config.js            # UNCHANGED (no audio tuning in gameplay constants)
└── render/              # UNCHANGED (visual refresh from 005 stays as is)

tests/
├── events.test.js       # NEW (red-first): exact event ids, counts and conditions
├── audio-cues.test.js   # NEW (red-first): catalog coverage, uniqueness, duration/asset rules
└── existing *.test.js   # UNCHANGED: all features 001–005 behavior locks

.specify/memory/constitution.md  # MODIFIED: Principle V amendment, version 1.1.0, date
```

**Structure Decision**: The single-project layout from features 001–005 is preserved. The semantic event boundary lives in a pure `src/events.js`; the audio implementation is isolated in `src/audio/`, with only `main.js` bridging the DOM-free queue to the browser engine. `update`/`collision`/`score` change only by adding emit calls at existing mutation points, so the gameplay rules remain auditable and the existing tests remain the regression net. No `assets/`, `index.html`, `server.js` or render changes are needed.

## Complexity Tracking

> Empty — no Constitution Check violations to justify. The Principle V amendment is recorded above as a governance action, not a complexity exception.

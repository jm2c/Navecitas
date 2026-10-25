# Contract: Semantic Sound Events, Cue Catalog and Audio Engine

**Audience**: the core emitters (`src/update.js`, `src/collision.js`, `src/score.js`), `src/events.js`, `src/audio/cues.js`, `src/audio/engine.js`, the boot path in `src/main.js`, and the `node --test` event/catalog suites. Spec source: `spec.md` FR-001…FR-022. This contract adds an internal event/audio boundary; all gameplay contracts of features 001–005 remain binding.

## §1 Semantic events (spec FR-001…FR-009)

- **SE-1** — `src/events.js` MUST export a frozen `GAME_EVENTS` object with exactly these ids and string values:

  | Constant | Value |
  |---|---|
  | `COUNTDOWN_3` | `countdown:3` |
  | `COUNTDOWN_2` | `countdown:2` |
  | `COUNTDOWN_1` | `countdown:1` |
  | `COUNTDOWN_GO` | `countdown:go` |
  | `SHOT` | `shot` |
  | `ASTEROID_DESTROYED` | `asteroid:destroyed` |
  | `ASTEROID_SPLIT` | `asteroid:split` |
  | `LIFE_LOST` | `life:lost` |
  | `LIFE_GAINED` | `life:gained` |
  | `POWERUP_COLLECTED` | `powerup:collected` |
  | `GAME_OVER` | `game:over` |

- **SE-2** — `emitEvent(state, id)` MUST append the id to `state.events`; `drainEvents(state)` MUST return the current array in order and replace it with a new empty array; `clearEvents(state)` MUST discard the queue. These functions MUST be pure JavaScript with no browser/DOM APIs.
- **SE-3** — `createGame()` MUST initialise `events` to `[]`. The queue is transient, never serialized, and never read by gameplay rules.
- **SE-4** — A successful shot MUST emit exactly one `shot`, including a double-shot trigger pull (two projectiles, one event). A shot blocked by the cooldown or the projectile limit MUST emit none.
- **SE-5** — A `SMALL` asteroid removed by `applySizeRule` MUST emit exactly one `asteroid:destroyed`. A `MEDIUM` or `LARGE` parent that creates two fragments MUST emit exactly one `asteroid:split` per parent. This applies to projectile, ship and asteroid–asteroid causes.
- **SE-6** — A confirmed non-shielded ship hit MUST emit exactly one `life:lost` at the hit instant, independent of the 500 ms respawn counter update. The final hit MUST emit `life:lost` immediately followed by exactly one `game:over`. The game-over id MUST NOT be emitted again while the match remains over.
- **SE-7** — Obtaining a life pickup by ship contact or projectile MUST emit exactly one `life:gained`, including when `lives` is already at `MAX_LIVES` (the count stays capped; the cue still acknowledges the pickup).
- **SE-8** — Obtaining a `POWERUP` by ship contact or projectile MUST emit exactly one `powerup:collected`.
- **SE-9** — The countdown MUST emit `countdown:3`, `countdown:2`, `countdown:1`, `countdown:go` exactly once each, in that order, when each step first appears. No countdown event may be emitted before the match starts, and no step may emit more than once.

## §2 Cue catalog (spec FR-010…FR-012, FR-022)

- **CC-1** — `src/audio/cues.js` MUST export a frozen `CUE_CATALOG` whose keys equal `Object.values(GAME_EVENTS)` exactly; every event id has exactly one cue and no other keys exist.
- **CC-2** — All cue recipes MUST be unique; no two events share a recipe. `countdown:go` MUST be distinct from the three digit cues (the digits may share a waveform family but must differ in pitch).
- **CC-3** — The cue contours/timbres MUST follow the approved families: short beeps (countdown digits), longer two-tone GO, fast downward shot, low noise/thump destruction, bright crack + double blip split, long falling life-loss, rising triad life-gain, fast rising power-up zap, slow falling game-over triad. These families are the basis for the mutual-distinguishability requirement (SC-002).
- **CC-4** — Every recipe MUST be non-looping and have `durationMs > 0` and `durationMs <= 1500` (`CUE_DURATION_LIMIT_MS`). The game-over cue MUST be ≤ 1000 ms.
- **CC-5** — Every layer MUST have a positive gain in the safe 0.02–0.10 range. The engine MUST mix through a master gain and a dynamics compressor so overlapping cues do not clip (SC-004).
- **CC-6** — The catalog MUST contain no URL, file path, `src` field, recorded asset, or network reference. Every cue is synthesized by the engine (FR-022, SC-011).
- **CC-7** — Recipe values are audio-only tuning data; they may be adjusted during listening review without changing gameplay, tests about event counts, or any numeric gameplay constant.

## §3 Audio engine (spec FR-015, FR-017…FR-020)

- **AE-1** — `src/audio/engine.js` is browser-only. It MUST NOT be imported by `state`, `entities`, `update`, `collision`, `spawn`, `score` or `loop`, and the core MUST remain DOM-free.
- **AE-2** — `createAudioEngine()` MUST create no `AudioContext` at construction. `unlock()` MUST be idempotent and create the context (with the `webkitAudioContext` fallback), the master gain/compressor chain and the reusable noise buffer on the first deliberate `keydown`/`pointerdown`, then resume if suspended.
- **AE-3** — `playEvents(ids)` MUST schedule each cue immediately when the context is running, at `currentTime + ~5 ms`. When the context is not running yet, it MAY keep a bounded pending list (max 32) with timestamps and MUST discard entries older than 300 ms on flush, so a late unlock cannot replay a stale backlog. It MUST NOT throw.
- **AE-4** — On `visibilitychange` hidden, the engine MUST stop all active source nodes, suspend the context and clear pending events; `main.js` MUST clear `state.events`. On visible, it MUST resume only if a context was already unlocked and MUST NOT replay hidden-period events or continue a partially played cue (FR-019, SC-010). All cues are finite and one-shot: the intentional game-over cue plays once at the transition and finishes, and no cue loops or remains queued. Residual collisions after game over are existing gameplay events allowed by US3 #5.
- **AE-5** — If Web Audio is unsupported, the engine MUST mark itself unavailable and skip cues without throwing. If context construction throws or resume rejects, it MUST stay silent without throwing and MUST retry on a later deliberate gesture (construction failure is not permanent). The game MUST continue normally. When a later gesture successfully creates or resumes a context, cues MUST resume without restarting the game (FR-017).
- **AE-6** — The first audible cue MUST occur only after a deliberate start/input gesture; the engine MUST not create or resume audio at page load (FR-018).
- **AE-7** — The engine MUST NOT fetch, decode or stream audio files. It MUST make zero network requests and MUST work offline after the game is served (FR-015, SC-006).
- **AE-8** — Engine runtime state (context, pending, hidden, unavailable) MUST live only in the engine and MUST NOT be added to `GameState`.

## §4 Integration (spec FR-003, FR-013, FR-019)

- **IN-1** — `src/main.js` MUST drain `state.events` once per rendered frame, before drawing, and pass the ids to `engine.playEvents(ids)`.
- **IN-2** — `main.js` MUST clear `state.events` when the document becomes hidden, so no hidden-period events survive to the next visible frame.
- **IN-3** — `src/loop.js`, `src/input.js`, `src/entities.js`, `src/spawn.js`, `src/config.js`, `src/render/*`, `index.html`, `server.js`, `package.json` and `assets/` MUST remain unchanged. `src/state.js` changes only by adding `events: []`; `update`, `collision` and `score` change only by emitting events.
- **IN-4** — The existing gameplay signatures `update(state, dtMs, input, random)`, `resolveCollisions(state, random)`, `applySizeRule(state, asteroid, awardPoints, random)` and `grantLife(state)` MUST remain unchanged.

## §5 Regression locks (spec FR-013, FR-014, FR-021, SC-009)

- **RL-1** — The 800×600 world, all collision radii/rules, movement, firing cooldown/cap, spawn cadence, splitting, scoring, lives, drop chances, timings, phases and terminal states MUST remain exactly as in features 001–005.
- **RL-2** — No gameplay constant in `src/config.js` may change; no audio tuning value may be placed in a gameplay constant.
- **RL-3** — No npm runtime dependency, framework, bundler, transpiler, audio file or external service may be added. The project remains a zero-dependency vanilla ES-module game.
- **RL-4** — All existing `node --test` suites MUST stay green without expectation changes. The new `tests/events.test.js` and `tests/audio-cues.test.js` are the only added automated suites.
- **RL-5** — No music, voice-over, ambient loop, in-game mute/volume control, audio settings or persistence may be added (FR-021).
- **RL-6** — Constitution Principle V MUST be amended (sound removed from the excluded list) and the version bumped to `1.1.0` with the amendment date, per the constitution's Governance section; the feature is explicitly in spec scope.

## §6 Acceptance traceability

| Spec outcome | Contract clauses | Validation |
|---|---|---|
| All requested events have distinct cues | SE-4…SE-9, CC-1…CC-3 | `tests/events.test.js`, `tests/audio-cues.test.js`, quickstart V2–V7 |
| Correct counts (no missing/duplicate) | SE-4…SE-9 | `tests/events.test.js`, quickstart V2–V7 |
| Prompt cue (<100 ms), no clipping | AE-3, CC-5 | quickstart V10 |
| No gameplay change | IN-3, IN-4, RL-1…RL-2 | existing suites, quickstart V13 |
| Silent, error-free fallback | AE-3, AE-5 | quickstart V8 |
| Autoplay-compliant first cue | AE-2, AE-6 | quickstart V1/V8 |
| No hidden-tab backlog | AE-4, IN-2 | quickstart V9 |
| No audio files/network | CC-6, AE-7, RL-3 | `tests/audio-cues.test.js`, quickstart V11 |
| Performance | AE-3, CC-4/CC-5 | quickstart V12 |

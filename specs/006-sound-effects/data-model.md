# Data Model: Sound Effects for Game Events (Phase 1)

**Feature**: `006-sound-effects` | Derived from `spec.md` §Key Entities, FR-001…FR-022 and research R1–R7. This is an **event-reporting and audio-playback** feature: no gameplay entity, field, number, timing or transition changes. The model below adds one transient event queue, one pure event catalog and one browser-only cue catalog. The gameplay data model from features 001–005 remains authoritative.

---

## 1. Semantic event queue (new, transient)

`GameState` gains exactly one field:

| Field | Type | Initial | Notes |
|---|---|---|---|
| `events` | `string[]` | `[]` | Ordered semantic event ids emitted by the core during an update; transient, never read by gameplay rules, never serialized |

Operations (pure, in `src/events.js`):

| Function | Behaviour |
|---|---|
| `emitEvent(state, id)` | Appends `id` to `state.events`; no validation beyond the frozen id set |
| `drainEvents(state)` | Returns the current array and replaces `state.events` with a new empty array; preserves order |
| `clearEvents(state)` | Discards queued events without returning them; used when the tab hides |

**Rules**
- The queue is append-only during an update; the browser drains it once per rendered frame.
- No gameplay logic may read `state.events`; it is an output channel only.
- The queue is not persisted and has no schema/versioning.
- In a headless test, events accumulate until drained; this has no effect on gameplay assertions.

---

## 2. Event catalog (new, semantic)

`src/events.js` exports a frozen `GAME_EVENTS` object. The string values are the wire format between the core and the audio layer.

| Constant | Value | Emitted when | Expected count |
|---|---|---|---|
| `COUNTDOWN_3` | `countdown:3` | `START → COUNTDOWN` sets step `3` | exactly 1 per match |
| `COUNTDOWN_2` | `countdown:2` | countdown advances `3 → 2` | exactly 1 per match |
| `COUNTDOWN_1` | `countdown:1` | countdown advances `2 → 1` | exactly 1 per match |
| `COUNTDOWN_GO` | `countdown:go` | countdown advances `1 → GO` | exactly 1 per match |
| `SHOT` | `shot` | `fire()` successfully creates projectile(s) | 1 per trigger pull; 0 when blocked; 1 for a double-shot pull |
| `ASTEROID_DESTROYED` | `asteroid:destroyed` | `applySizeRule` removes a `SMALL` asteroid | 1 per destroyed small asteroid |
| `ASTEROID_SPLIT` | `asteroid:split` | `applySizeRule` creates two fragments from `MEDIUM`/`LARGE` | 1 per split parent |
| `LIFE_LOST` | `life:lost` | `hitShip` confirms a non-shielded hit (including the final hit) | 1 per hit |
| `LIFE_GAINED` | `life:gained` | `grantLife` runs for a life pickup (ship contact or projectile), including at `MAX_LIVES` | 1 per obtained pickup |
| `POWERUP_COLLECTED` | `powerup:collected` | `POWERUP` obtained by ship contact or projectile | 1 per obtained pickup |
| `GAME_OVER` | `game:over` | `hitShip` loses the final life and sets `GAME_OVER` | exactly 1 per match |

**Ordering rules**
- Countdown events are emitted in step order; no countdown event before the match starts.
- On the final hit, `LIFE_LOST` is emitted before `GAME_OVER`.
- A single trigger pull with double shot emits one `SHOT`, never two.
- Multiple asteroids resolved in one update emit one event per asteroid in collision resolution order.
- Events from different categories may interleave; the audio layer preserves the queue order but cues may overlap in time.

**Non-events (must stay silent)**
- A blocked shot (cooldown or projectile limit) emits nothing.
- An asteroid merely leaving the screen, a collectible despawning, a shield block, or an overlap that does not resolve a pickup emits nothing.
- Game-over state does not re-emit `GAME_OVER`; residual projectile/asteroid collisions keep their existing rules and may still emit destruction/split events.

---

## 3. Cue catalog (new, pure data)

`src/audio/cues.js` exports a frozen `CUE_CATALOG` keyed by every `GAME_EVENTS` value, plus `CUE_DURATION_LIMIT_MS = 1500`.

### Recipe shape

| Field | Type | Required | Notes |
|---|---|---|---|
| `durationMs` | number | yes | Total cue length; ≤ 1500 |
| `layers` | array | yes | At least one layer; scheduled together or with `delayMs` offsets |

Layer shapes:

| Layer kind | Fields |
|---|---|
| `tone` | `kind: 'tone'`, `wave` (`sine`/`square`/`triangle`/`sawtooth`), `freq`, optional `endFreq`, `delayMs`, `durationMs`, `gain`, optional `attackMs`/`releaseMs` |
| `noise` | `kind: 'noise'`, `filter` (`lowpass`/`highpass`/`bandpass`), `freq`, optional `endFreq`, `q`, `delayMs`, `durationMs`, `gain`, optional `attackMs`/`releaseMs` |

### Binding cue mapping

| Event | Cue character | Proposed duration |
|---|---|---|
| `countdown:3` | short square beep at 440 Hz | 90 ms |
| `countdown:2` | short square beep at 523.25 Hz | 90 ms |
| `countdown:1` | short square beep at 659.25 Hz | 90 ms |
| `countdown:go` | two-tone bright start signal (880 Hz triangle + delayed 1174.66 Hz square) | 320 ms |
| `shot` | fast downward square sweep 920→300 Hz with a tiny noise click | 90 ms |
| `asteroid:destroyed` | low-pass noise 1200→180 Hz plus low sine thump 110→50 Hz | 220 ms |
| `asteroid:split` | high-pass noise crack 2200→900 Hz plus two short square blips (700/950 Hz) | 130 ms |
| `life:lost` | long descending sawtooth 440→110 Hz plus low triangle 220→55 Hz | 520 ms |
| `life:gained` | ascending triangle triad 523.25 / 659.25 / 783.99 Hz | 340 ms |
| `powerup:collected` | fast rising square zap 600→1400 Hz plus triangle shimmer 1200→1800 Hz | 200 ms |
| `game:over` | slow descending triangle triad 392 / 329.63 / 261.63 / 196 Hz | 1000 ms |

**Validation rules**
- `Object.keys(CUE_CATALOG)` equals `Object.values(GAME_EVENTS)` exactly (no missing, no extra).
- Every cue has a unique recipe signature; no two events share the same data.
- `countdown:go` is a distinct recipe from the three digit cues; the digits may share a waveform family but differ in pitch.
- Every `durationMs` is positive and ≤ `CUE_DURATION_LIMIT_MS`; every layer duration is positive and does not exceed the cue duration materially.
- Every layer has a positive `gain` in the safe 0.02–0.10 range.
- No recipe contains a URL, file path, `src`, or any reference to a recorded asset.
- Recipe values are audio-only tuning data; changing them does not change gameplay and is allowed during listening review.

---

## 4. Audio engine runtime state (new, browser-only)

`src/audio/engine.js` owns a `createAudioEngine()` instance. None of this is part of `GameState`.

| Field | Type | Notes |
|---|---|---|
| `context` | `AudioContext \| null` | Created lazily on first deliberate input; vendor fallback supported |
| `master` | `GainNode \| null` | Master gain in the chain |
| `compressor` | `DynamicsCompressorNode \| null` | Prevents clipping on overlapping cues |
| `noiseBuffer` | `AudioBuffer \| null` | One generated ~1 s white-noise buffer, created once |
| `activeSources` | `Set<AudioScheduledSourceNode>` | Sources currently playing; stopped on visibility hidden so no cue resumes on return |
| `pending` | `{ id, at }[]` | Bounded (32) list of events awaiting a running context; stale entries (>300 ms) are dropped on flush |
| `unlocked` | boolean | A context exists and has been resumed at least once |
| `hidden` | boolean | Mirrors `document.hidden` |
| `unavailable` | boolean | Web Audio is unsupported (permanent); construction/resume failure is not permanent and is retried on a later gesture |

**Engine API**

| Method | Behaviour |
|---|---|
| `playEvents(ids)` | For each id, schedule its cue if the context is running; otherwise enqueue with a timestamp. No-op when `unavailable` or `hidden`. Never throws. |
| `unlock()` | Idempotent; creates the context/chain on first call, resumes if suspended, flushes fresh pending events. Called from `keydown`/`pointerdown`. |
| `suspend()` | Stops all active sources, suspends the context if present, clears pending; used on visibility hidden. |
| `resume()` | Resumes if a context exists and the document is visible; used on visibility visible. |
| `isRunning()` | Diagnostic only; not used by gameplay. |

**Lifecycle**

```
page load
  → engine created, no AudioContext
  → first keydown/pointerdown
       → unlock(): create context + master chain + noise buffer, resume()
       → run pending cues younger than 300 ms
  → each rendered frame
       → drainEvents(state) → engine.playEvents(ids)
            running  → schedule at currentTime + 5 ms
            pending  → enqueue (bounded, timestamped)
  → document hidden
       → stop active sources, suspend(), clear pending; main.js clearEvents(state)
  → document visible
       → resume() if unlocked; no backlog
  → Web Audio API missing
       → unavailable = true; silent for the rest of the session
  → construction or resume failure
       → stay silent; retry on the next deliberate gesture
```

---

## 5. State transitions and timing

### Countdown

```
START --fire--> COUNTDOWN(step=3, emit countdown:3)
COUNTDOWN(3) --stepDuration--> COUNTDOWN(step=2, emit countdown:2)
COUNTDOWN(2) --stepDuration--> COUNTDOWN(step=1, emit countdown:1)
COUNTDOWN(1) --stepDuration--> COUNTDOWN(step=GO, emit countdown:go)
COUNTDOWN(GO) --goExit duration--> PLAYING (no event)
```

Each step's event fires exactly once when the step first appears. The existing step durations (`countdownShrink + countdownHold`, plus `goExit` for GO) are unchanged.

### Lifecycle of a queue entry

```
emitted by core (string id)
  → state.events
  → drained by main.js before the next render
  → cue scheduled (if audio running) OR pending (if not)
  → oscillator/noise nodes end; entry gone
```

If the game is hidden before the drain, `clearEvents` discards the queue. If audio is unavailable, `playEvents` discards the ids without affecting gameplay.

---

## 6. Validation rules and acceptance mapping

| Rule | Source |
|---|---|
| One cue per successful shot; none when cooldown/projectile cap blocks; one per double-shot pull | FR-003 |
| One destruction cue per destroyed asteroid; one split cue per split parent; any collision cause | FR-004, FR-005 |
| One life-loss cue per hit, at hit confirmation, not at the respawn counter update; final hit also emits game over | FR-006, FR-009 |
| Life pickup emits `life:gained` by ship contact or projectile, at max lives too | FR-007 |
| Power-up emits `powerup:collected` by ship contact or projectile | FR-008 |
| Countdown emits exactly one cue per step, no pre-start cue, no repeat within a step | FR-002 |
| All eight requested event types have distinct cues | FR-010, SC-002 |
| Cue latency < 100 ms; no clipping; ≤ 1.5 s per cue | FR-011, FR-012, SC-003, SC-004 |
| No gameplay rule/constant change | FR-013, SC-009 |
| No dependency, no build step, no external service | FR-014 |
| No audio files/network; synthesized locally | FR-015, FR-022, SC-011 |
| Silent, error-free fallback when audio is unavailable | FR-017, SC-007 |
| First cue after deliberate input; no autoplay violation | FR-018 |
| Hidden tab: suspended, no backlog | FR-019, SC-010 |
| No music/voice/mute/volume UI | FR-021 |
| Existing tests pass unchanged | SC-009 |

---

## 7. Gameplay model — UNCHANGED

No gameplay field is added, removed or reinterpreted beyond the transient `events` queue. Specifically:

- `phase`, `countdownStep`, `countdownT`, `score`, `lives`, `ship`, `projectiles`, `asteroids`, `spawnT`, `stepCount`, `doubleShot`, `explosionT`, `shieldT`, `blinkT` and `shotT` keep their existing meanings and values.
- `RADII`, speeds, accelerations, timings, tier weights, `POWERUP_DROP_CHANCE`, `SPECIAL_SPAWN_INTERVAL`, `MAX_LIVES`, `MAX_RESERVE_ICONS`, the 800×600 world and all score values are frozen.
- `asteroid.seed/rot/spin/heading`, `mediumFragment` and `birthStep` are untouched.
- The render layer, assets, `index.html`, `server.js` and `package.json` are untouched.
- `state.events` is never read by `state`, `entities`, `update`, `collision`, `spawn`, `score` or `loop` logic; it is only appended by emitters and drained by `main.js`.

**Interaction matrix (no delta)**: every collision, scoring, spawn, firing, split and terminal-state rule from features 001–005 is unchanged. The audio feature cannot alter which object is hit, what it scores, when it drops, how it moves, or when the match ends.

---

## 8. Provenance and assets

- **No recorded audio assets are introduced.** The delivered game contains zero audio files; every cue is generated by the engine at runtime (FR-022, SC-011).
- `assets/` is unchanged; no sound license texts or credits are required for this feature.
- If a recorded sound is ever introduced later, FR-016 would require its source, license and any attribution to be recorded; that is outside this feature.
- The existing visual asset manifest, licenses and credits are untouched.

# Quickstart & Validation: Sound Effects for Game Events

How to run the game and prove the sound feature end-to-end. Implementation details live in [data-model.md](./data-model.md), [research.md](./research.md) and [contracts/sound-effects-contract.md](./contracts/sound-effects-contract.md); the *how* belongs to `tasks.md`. The gameplay checklists and contracts from features 001–005 remain authoritative and must still pass.

## Prerequisites

- A desktop browser (Chromium / Firefox / Safari — last 2 major versions) with a keyboard and working speakers/headphones.
- Node.js ≥ 20 — it serves the game and runs the tests. **No `npm install` — there are zero dependencies.**
- No audio files are needed: every cue is synthesized at runtime.
- A quiet-enough listening environment to judge short arcade cues; system/tab volume audible but not at maximum.

## Run

```bash
# from the repository root
node server.js
# open http://localhost:8000
```

Press **Space** on the start screen. The countdown should be audible immediately; the first cue is the "3".

## Test

```bash
npm test          # = node --test   (DOM-free core + new event/catalog suites)
```

**Red-green gate**: `tests/audio-cues.test.js` and `tests/events.test.js` must be written first and fail before `src/audio/cues.js` and the event emission exist, then pass once implemented. All pre-existing suites (features 001–005) must stay green throughout; no test expectation about gameplay may change.

Expected after implementation: every assertion green, including cue coverage/uniqueness/duration limits and exact event counts/conditions.

## Static checks

```bash
# no audio assets were added
find assets -type f | grep -Ei '\.(wav|mp3|ogg|m4a|flac|aac|opus)$' && echo "FAIL: audio file found" || echo "OK: no audio files"

# Web Audio is confined to the browser-only engine
grep -R "AudioContext" src --include='*.js' | grep -v "src/audio/engine.js" && echo "FAIL: browser audio API leaked" || echo "OK: audio only in src/audio/engine.js"

# no remote audio source or audio URL in the cue data
grep -nE "https?://|\.wav|\.mp3|\.ogg" src/audio src/events.js && echo "FAIL: remote/file audio reference" || echo "OK: synth-only catalog"

# zero dependencies
node -e "const p=require('./package.json'); if((p.dependencies&&Object.keys(p.dependencies).length)||(p.devDependencies&&Object.keys(p.devDependencies).length)) { console.error('FAIL: dependencies present'); process.exit(1); } console.log('OK: zero dependencies');"
```

Expected: no audio files, no browser audio API in the core, no remote/file references, and empty dependency maps.

---

## Manual validation scenarios

Legend: **[FR]** requirement covered · **[SC]** measurable outcome · **[SE/CC/AE/IN/RL]** contract clause.

### V1 — Countdown (FR-002, SC-001, SE-9)

1. Load the game and do **not** press anything for several seconds.
2. **Expect**: silence; no console autoplay warnings; no cue before the match starts.
3. Press Space and listen through the full countdown.
4. **Expect**: one short beep when "3" appears, one higher beep for "2", one higher for "1", and a clearly different, longer two-tone start signal for "GO". Each step sounds exactly once; nothing repeats while a step is held on screen.
5. Reload and repeat once to confirm the behavior is stable.

### V2 — Firing (FR-003, SC-001, SE-4)

1. In active play, tap fire once.
2. **Expect**: exactly one shot cue, simultaneous with the projectile appearing.
3. Hold fire for several seconds.
4. **Expect**: one cue per shot at the existing 160 ms cadence, not a continuous drone and not one cue per rendered frame; no cue on the frames where the cooldown blocks a shot.
5. Collect the double-shot power-up, then tap fire once.
6. **Expect**: one shot cue for the trigger pull even though two projectiles appear.
7. Fill the projectile limit (five projectiles) and press fire.
8. **Expect**: no shot cue while the limit blocks the shot.

### V3 — Asteroid destruction vs split (FR-004, FR-005, SC-001/SC-002, SE-5)

1. Shoot a small asteroid.
2. **Expect**: a dull impact/boom cue at the moment it disappears; it is clearly different from the shot cue.
3. Shoot a medium asteroid; then a large one.
4. **Expect**: a sharp crack + double-blip split cue (distinct from the destruction cue) each time the two fragments appear. The two fragments immediately get their own sounds only when later destroyed/split.
5. Cause an asteroid–asteroid collision.
6. **Expect**: the split cue follows the same rule; no score change or gameplay difference.
7. Let a regular asteroid hit the ship while it has reserve lives.
8. **Expect**: the destruction/split cue for the asteroid and the life-loss cue both play; the game-over cue does not.

### V4 — Losing a life (FR-006, SC-003, SE-6)

1. Play with at least two lives and let a regular asteroid hit the ship.
2. **Expect**: a long, descending, negative-sounding cue at the instant of the hit / start of the explosion, not 500 ms later when the reserve icon updates; the game-over cue does not play.
3. Let the ship respawn and verify the game continues normally.
4. On the final life, take a hit.
5. **Expect**: the life-loss cue immediately followed by the game-over cue; the game-over cue is distinct and does not repeat while the Game Over screen remains.

### V5 — Gaining a life (FR-007, SE-7)

1. Score past a 500-point threshold until the extra-life pickup appears; collect it with the ship.
2. **Expect**: an ascending, positive cue at pickup; the life total increases by one (up to the cap).
3. Repeat, but destroy the pickup with a projectile instead of touching it.
4. **Expect**: the same life-gain cue; the life still increases.
5. Reach the maximum of 6 lives, then collect another life pickup (ship or projectile).
6. **Expect**: the same pickup cue plays as acknowledgement; the displayed life total stays at 6 and no extra reserve icon appears.

### V6 — Double-shot power-up (FR-008, SE-8)

1. Destroy small asteroids until a power-up appears (10 %, and guaranteed from medium fragments per feature 004); collect it with the ship.
2. **Expect**: a distinct fast rising reward cue, clearly different from life-gain and life-loss.
3. Repeat, but shoot the power-up instead of touching it.
4. **Expect**: the same power-up cue; the double-shot effect activates exactly as before.
5. Verify the cue does not play when a power-up is on screen but not obtained.

### V7 — Game over (FR-009, SC-010, SE-6)

1. Lose all lives.
2. **Expect**: exactly one game-over cue at the transition; it is distinct from life-loss and does not repeat for the rest of the screen.
3. If residual projectiles destroy asteroids after game over, those existing collisions may still emit their own cues; the game-over cue itself never repeats.
4. Reload and repeat to confirm.

### V8 — Audio unavailable / autoplay safety (FR-017, FR-018, SC-007, AE-2/AE-5/AE-6)

1. Reload the page and, before pressing anything, open the devtools console.
2. **Expect**: no autoplay warning, no AudioContext created, and the game waits on the start screen normally.
3. Press Space and verify the countdown is audible (the gesture unlocks audio).
4. Optionally simulate unavailable audio: in a throwaway browser profile or via a devtools override, make the Web Audio constructor unavailable, then play.
5. **Expect**: the game remains fully playable and silent, with no uncaught errors and no stalled state; if audio becomes available after a later gesture, cues resume without restarting the match.
6. Mute the tab/site and verify the game still plays normally; unmute and verify cues return.

### V9 — Hidden tab and visibility (FR-019, SC-010, AE-4/IN-2)

1. Start a match and trigger a cue, then immediately switch to another tab for several seconds.
2. **Expect**: no cue continues playing in the background and no burst of queued cues plays when you return.
3. Return to the game and fire/shoot again.
4. **Expect**: new cues play normally; the game state and timing are unchanged.

### V10 — Rapid fire, overlapping cues and latency (FR-011, FR-012, SC-003/SC-004, AE-3/CC-5)

1. Play a dense wave: hold fire continuously, split several asteroids in quick succession, and collect pickups.
2. **Expect**: every shot, destruction/split and pickup remains audible; cues overlap without hard cut-offs, distortion or clipping; no audible lag relative to the action.
3. Listen for the cue families remaining distinguishable even while overlapping (shot vs destruction vs split vs pickup).
4. If clipping is heard, lower the per-layer gains in `src/audio/cues.js` (audio-only tuning) and repeat; do not change gameplay constants.

### V11 — Synthesized-only, offline and zero dependency (FR-015, FR-022, SC-006/SC-011, CC-6/AE-7/RL-3)

1. Run the static checks above.
2. Open the devtools Network panel, reload, and play through a full match.
3. **Expect**: zero audio/media requests and zero third-party requests; the only requests are the local HTML/JS/font/image files.
4. Stop the server after the page has loaded (or switch devtools to offline) and keep playing.
5. **Expect**: all cues still play and the game remains fully playable; no audio file is needed.
6. Confirm `package.json` still has empty `dependencies`/`devDependencies` and no build step exists.

### V12 — Performance (FR-020, SC-005, AE-3)

1. Record a performance profile in the browser devtools during a dense wave with rapid fire and several splits.
2. **Expect**: no visible frame-rate degradation or stutter versus the pre-feature game; audio scheduling does not block rendering; the fixed 60 FPS loop is unaffected.
3. Leave the game idle on the start or game-over screen and confirm no background audio work or repeated cues.

### V13 — Gameplay regression (FR-013, FR-014, SC-009, IN-3/IN-4/RL-1…RL-5)

1. Run `npm test`.
2. **Expect**: all pre-existing suites pass unchanged (collision, spawn, split, lives, bonus, score, loop, double shot, guaranteed drop, split protection/cap, asset manifest, etc.) plus the new event and cue suites.
3. Re-run the manual checklists from features 001–005 (especially `specs/003-double-shot-powerup/quickstart.md`, `specs/004-guaranteed-fragment-drop/quickstart.md` and `specs/005-visual-refresh/quickstart.md`).
4. **Expect**: no behavioural difference — same movement, firing, splits, drops, scoring, lives, countdown timings, visuals and terminal states; the only new behaviour is audible feedback.
5. Confirm the constitution's Principle V amendment was applied (sound removed from the excluded list, version `1.1.0`, amendment date recorded).

---

## Listening distinguishability check (SC-002)

1. Play a session and, without looking at the screen for a few events at a time, have a second person trigger or narrate the event while you identify the cue.
2. Cover all eight requested categories: countdown (including GO), shot, destruction, split, life loss, life gain, power-up, game over.
3. **Expect**: at least 90 % correct identifications, with no confusion among destruction, split, life-loss, life-gain, power-up and game-over. Repeat any confused pair and adjust the cue recipe (audio-only) until distinct.

---

## Acceptance traceability

| Spec outcome | Primary checks |
|---|---|
| SC-001 (all events cue; exact counts) | V1–V7, `tests/events.test.js` |
| SC-002 (mutual distinguishability) | Listening check, V3, V5, V6, V7 |
| SC-003 (cue latency <100 ms) | V2, V4, V10 |
| SC-004 (no drops/clipping at speed) | V10, `tests/events.test.js` |
| SC-005 (no frame-rate regression) | V12 |
| SC-006 (offline) | V11 |
| SC-007 (silent, error-free fallback; recovery) | V8 |
| SC-008 (provenance) | V11 (no recorded sounds; vacuously satisfied) |
| SC-009 (no gameplay change) | V13 + `npm test` |
| SC-010 (no hidden-tab backlog) | V9 |
| SC-011 (zero audio files/network; synthesized) | V11, static checks |

A green `npm test`, a clean V1–V13 pass, the listening check and the existing feature 001–005 checklists are the definition of done for this feature.

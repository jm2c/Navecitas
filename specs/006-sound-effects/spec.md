# Feature Specification: Sound Effects for Game Events

**Feature Branch**: `006-sound-effects`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Hay que agregar efectos de sonido, en el conteo inicial, al disparar, al destruir un asteroide, al partir en dos un asteroide, al perder unna vida, al ganar una vida, al atrapar un powerup de disparo, al finalizar la partida"

## Context

The game currently runs in complete silence: every event — the opening countdown, firing, asteroid impacts, splits, life changes, power-up collection and game over — is communicated only visually. This feature adds a short, distinct synthesized retro/arcade sound effect for each of those player-facing events so that actions and consequences are audible without looking at the screen, while leaving every rule, timing, hitbox, score, spawn, and visual behavior exactly as it is today. The feature covers sound effects only; music, voice, and persistent audio settings are not part of the request.

## Clarifications

### Session 2026-10-24

- Q: ¿Cómo prefieres que suenen los efectos del juego (conteo, disparo, asteroides, vidas, power-up y fin de partida)? → A: Efectos sintetizados retro/arcade, generados por el propio juego.
- Q: ¿Quieres que el juego incluya algún control para silenciar o ajustar el volumen de los efectos? → A: Sin control dentro del juego; el volumen se maneja desde el dispositivo o la pestaña.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Combat actions give immediate audio feedback (Priority: P1)

As a player, when I press fire I hear a shot, when my shot destroys an asteroid I hear a destruction cue, and when an asteroid breaks into two fragments I hear a distinct split cue. The feedback is immediate and matches what I see, so I can follow the action without staring at the screen.

**Why this priority**: Firing, destroying and splitting are the actions the player repeats constantly. They are the core of the requested feature and deliver value even if no other cue is implemented.

**Independent Test**: Start a game, fire repeatedly, destroy a small asteroid, and shoot a medium or large asteroid to split it. Verify that firing, destruction and splitting each produce their own immediate, clearly different sound, that a double-shot trigger pull produces one firing cue (not two), and that no shot or hit is silent.

**Acceptance Scenarios**:

1. **Given** the game is in active play, **When** the player fires a shot, **Then** exactly one firing sound plays at the moment the shot is created, and no firing sound plays when firing is blocked by the shot cooldown or the projectile limit.
2. **Given** the player has the double-shot power-up active, **When** the player fires once, **Then** one firing sound plays for that trigger pull even though two projectiles are created.
3. **Given** a projectile destroys an asteroid, **When** the asteroid is removed, **Then** the asteroid-destruction sound plays once for that asteroid.
4. **Given** a medium or large asteroid breaks into two fragments, **When** the fragments appear, **Then** the asteroid-split sound plays once for that split, and it is clearly different from the destruction sound.
5. **Given** several asteroids are destroyed or split in quick succession, **When** the events occur close together, **Then** each event is still audible as its own cue and the cues do not cut each other off or become an unintelligible burst.

---

### User Story 2 - Life and reward changes are audible (Priority: P1)

As a player, I hear a distinct, negative-sounding cue when I lose a life, a distinct, positive-sounding cue when I gain a life, and a distinct reward cue when I collect the double-shot power-up. These sounds let me know what happened even if the action is at the edge of the screen.

**Why this priority**: Losing and gaining lives and collecting the power-up are the highest-stakes events in the game. They must be unmistakable and must not be confused with combat or countdown cues.

**Independent Test**: Force each life state change and collect a double-shot power-up, then verify that losing a life, gaining a life and collecting the power-up each play their own cue, that the cues are distinguishable from each other and from combat cues, and that no cue plays when the corresponding event does not happen.

**Acceptance Scenarios**:

1. **Given** the ship is hit and the game continues with one fewer life, **When** the hit is confirmed and the destruction sequence begins, **Then** the life-loss sound plays immediately, and the game-over sound does not play.
2. **Given** the player obtains an extra-life pickup by ship contact or by shooting it and the life total increases, **When** the pickup is obtained, **Then** the life-gain sound plays.
3. **Given** the player is already at the maximum number of lives, **When** an extra-life pickup is collected by ship contact or shot, **Then** the pickup is acknowledged with the same life pickup cue while the displayed life total stays at the maximum.
4. **Given** the player collects or shoots a double-shot power-up, **When** the power-up is obtained, **Then** the power-up sound plays, and it is distinct from the life-gain and life-loss sounds.
5. **Given** the ship or a projectile overlaps a collectible but no collection occurs, **When** the frame is processed, **Then** no collection sound plays.

---

### User Story 3 - The match is framed by countdown and game-over cues (Priority: P2)

As a player, I hear a cue for each step of the opening countdown ("3", "2", "1", "GO") and a clear end-of-game cue when the match finishes. The beginning and end of a run are obvious from sound alone.

**Why this priority**: These cues frame the experience and complete the requested set, but the game is fully playable without them, so they rank after the action and life cues.

**Independent Test**: Start a match and listen through the full countdown, then play until game over. Verify that each countdown step has exactly one cue, that "GO" is distinguishable from the digits, and that the game-over cue plays once when the match ends.

**Acceptance Scenarios**:

1. **Given** the start screen is shown, **When** the player starts the game, **Then** a countdown cue plays at the moment each of "3", "2", "1" and "GO" first appears, exactly once per step, and no cue plays before the game starts.
2. **Given** the countdown is running, **When** a step remains on screen for its full duration, **Then** its cue does not repeat or loop during that step.
3. **Given** the countdown reaches "GO", **When** "GO" appears, **Then** its cue is clearly different from the digit cues.
4. **Given** the player loses the last life, **When** the match transitions to game over, **Then** the game-over sound plays once, and it is distinct from the life-loss sound.
5. **Given** the game is over, **When** no further gameplay events occur, **Then** no additional gameplay cue plays until a new match starts.

---

### Edge Cases

- **Final life**: the last hit both removes the last life and ends the match; the life-loss cue and the game-over cue must both be handled without one silently swallowing the other, and the game-over cue must not be repeated.
- **Rapid fire**: repeated shots under the cooldown and near-simultaneous impacts must not cause missing cues, double cues, hard cut-offs, or unpleasant clipping.
- **Double-shot**: one trigger pull fires two projectiles, but must produce a single firing cue.
- **Chain reactions**: when several asteroids are destroyed or split in the same update, each event gets its own cue, mixed without cutting other cues short.
- **Asteroid-asteroid collision and ship collision**: splits caused by any collision follow the same split cue rule; destruction caused by any collision follows the same destruction cue rule.
- **Extra life at maximum**: the pickup, whether collected by ship contact or shot, still acknowledges the action but the life total does not increase.
- **Audio not available or not yet permitted**: if audio cannot play (unsupported, blocked by the environment, no output device, or content not yet loaded), the game continues normally, silently and without errors; it must recover automatically if audio becomes available.
- **Autoplay restrictions**: the first audible cue must be possible only after a deliberate player action (starting the game), and the game must not fail if the environment forbids audio before that action.
- **Tab hidden or game paused**: audio must not continue playing or queue up while the game is not visible, and must not replay a backlog when the game resumes.
- **Audio synthesis failure**: because the cues are generated by the game, if a cue cannot be generated on a given device the game must continue normally and that event falls back to silence or an available substitute, without breaking the event or the match.
- **Volume and duration**: cues are short and non-looping; none is disproportionately loud or long, and overlapping cues do not distort.
- **Offline play**: once the game has been served, every cue must work without a live third-party request.
- **Licensing**: no pre-recorded sound assets are included; if any recorded sound is ever introduced later, it must be free to use and redistributable, with its source and license documented.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST play a distinct sound effect for each of the following events: opening countdown step, firing, asteroid destruction, asteroid split, losing a life, gaining/collecting a life, collecting the double-shot power-up, and game over.
- **FR-002**: The countdown MUST produce one cue when each of "3", "2", "1" and "GO" first appears, with no cue before the game starts, no repetition within a step, and a "GO" cue distinguishable from the digit cues.
- **FR-003**: A successful shot MUST produce exactly one firing cue at the moment the projectile is created; a blocked shot (cooldown or projectile limit) MUST NOT produce a cue; a double-shot trigger pull MUST produce a single firing cue.
- **FR-004**: Destroying an asteroid MUST produce exactly one destruction cue for that asteroid, whether the destruction results from a projectile or a collision.
- **FR-005**: Splitting an asteroid into two fragments MUST produce exactly one split cue for that split, whether the split results from a projectile or a collision, and the split cue MUST be clearly different from the destruction cue.
- **FR-006**: Losing a life MUST produce a life-loss cue at the moment the hit is confirmed and the ship-destruction sequence begins, without waiting for the reserve counter to update; the game-over cue MUST NOT play while the game continues.
- **FR-007**: Obtaining an extra-life pickup by ship contact or by projectile MUST produce a life-gain cue when the life total increases; when the total is already at its maximum, the same pickup cue MUST play as acknowledgement while the total stays unchanged.
- **FR-008**: Collecting or shooting a double-shot power-up MUST produce a power-up cue that is distinct from all life cues.
- **FR-009**: The transition to game over MUST produce exactly one game-over cue, distinct from the life-loss cue, and it MUST NOT repeat for the remainder of that game-over screen.
- **FR-010**: All eight requested cue types MUST be mutually distinguishable by ear when heard without visual context.
- **FR-011**: Each cue MUST start promptly enough that it is perceived as belonging to the event that caused it; the feature must not introduce noticeable audio lag relative to the action.
- **FR-012**: Cues MUST be non-looping and each MUST finish within 1.5 seconds, and overlapping cues must be mixed so that each remains audible and the output does not clip or distort.
- **FR-013**: The audio feature MUST NOT change any gameplay behavior, including the 800×600 logical world, controls, movement, collision rules, firing cooldown and projectile cap, asteroid splitting, spawn cadence, scoring, lives, drop chances, timings, phases and terminal states.
- **FR-014**: The audio feature MUST NOT introduce any new runtime dependency, framework, build step or external service; the game remains dependency-free as defined by the project constitution.
- **FR-015**: All sound content MUST be available locally with the game so that every cue works offline, with no live third-party request at play time.
- **FR-016**: Any recorded sound asset MUST be free to use and redistributable as part of this game, and its source, license and any required attribution MUST be documented in the project; attribution required by a license MUST be included.
- **FR-017**: If audio is unavailable, blocked, not yet loaded, or fails for any reason, the game MUST continue normally and silently without errors, and MUST recover automatically when audio becomes available.
- **FR-018**: The first audible cue MUST occur only after a deliberate player action that starts the game, so the feature complies with environment restrictions on automatic audio.
- **FR-019**: When the game is hidden or paused, audio MUST NOT continue playing or accumulate a queue that replays on return.
- **FR-020**: The feature MUST keep the game smooth at its current frame rate; producing cues must not cause visible stutter, flicker or loading stalls during normal play.
- **FR-021**: The feature MUST add no music, voice-over, ambient loop, in-game mute/volume control or audio-settings screen; volume is controlled through the device or browser tab, and the scope is event sound effects only.
- **FR-022**: All cues MUST have a retro/arcade synthesized character and MUST be produced locally by the game itself, with no pre-recorded audio files, external audio assets or network retrieval.

### Key Entities *(include if data involved)*

- **Sound cue**: a short, non-looping retro/arcade synthesized audio event identified by the game event it represents (countdown digit, countdown GO, firing, asteroid destruction, asteroid split, life loss, life gain, power-up collection, game over), generated locally by the game with no recorded source file.
- **Cue catalog**: the complete mapping from each supported game event to exactly one cue, including the rule that each event maps to a distinct sound and each cue is triggered once per occurrence.
- **Audio availability state**: whether the environment can currently play sounds (supported, permitted, loaded); it determines whether cues are heard or silently skipped without affecting gameplay.
- **Asset provenance record**: the project-level record identifying any recorded sound's source, license and required attribution; with synthesized cues, no sound asset files are included, so this record remains empty unless recorded sounds are introduced later.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a scripted verification run, 100% of the eight requested event types produce an audible cue, and each occurrence produces exactly one cue with zero missing and zero duplicated cues.
- **SC-002**: When cues are played without visual context, listeners correctly identify the causing event for at least 90% of presentations, and no listener confuses the destruction, split, life-loss, life-gain, power-up and game-over cues with one another.
- **SC-003**: Every cue is perceived as immediate: the delay between the event and the audible cue stays below 100 ms in normal play, including during rapid firing and simultaneous impacts.
- **SC-004**: During a 60-second session with continuous firing, splits and pickups, the number of audible cues matches the number of qualifying events (no drops, no double triggers), with no audible clipping or cut-off.
- **SC-005**: The game shows no measurable frame-rate degradation or visible stutter compared with the current silent version during a representative play session.
- **SC-006**: With the network disconnected after the game has been served, 100% of cues still play correctly and the game remains fully playable.
- **SC-007**: The game remains fully playable, with no errors and no stalled states, in an environment where audio is unavailable or blocked; after audio becomes available, cues resume without restarting the game.
- **SC-008**: 100% of included recorded sounds have a documented, verified free-to-use license and source; zero included sounds lack provenance.
- **SC-009**: All existing automated tests pass unchanged after the feature is added, and the complete manual gameplay checklist shows no behavioral difference from the current game.
- **SC-010**: During a full match, no cue continues after the game is hidden or after game over, and no backlog of cues plays when the game becomes visible again.
- **SC-011**: The delivered game contains zero pre-recorded audio files and makes zero audio-related network requests; 100% of cues are produced by the game itself, and the retro/arcade character is confirmed in listening review.

## Assumptions

- The countdown cue plays on each of the four steps ("3", "2", "1", "GO"); the digits may share a cue family, while "GO" is clearly distinct.
- Sound effects are short (no longer than 1.5 seconds each) and non-looping; background music, voice announcements and ambient loops are out of scope.
- There is no in-game volume or mute control in this feature; players rely on their device/tab volume controls. Adding an audio settings screen would be a separate feature.
- Sound effects will be synthesized locally by the game in a retro/arcade style; no recorded audio files are included, so no sound-asset licenses or audio downloads are required and the game remains fully offline.
- The player's deliberate start action (pressing fire on the start screen) is the gesture that permits audio, satisfying common environment restrictions on automatic playback.
- The destruction cue applies to an asteroid being removed, and the split cue applies to an asteroid creating two fragments; these are separate events and therefore separate sounds.
- A double-shot trigger pull is one player action and gets one firing cue.
- On the final life, the life-loss cue is followed by the game-over cue; the game-over cue does not replace or repeat the life-loss cue.
- Collecting a life pickup at the maximum life total still acknowledges the pickup with the life pickup cue, even though the count does not change.
- This feature amends the project constitution's simplicity boundary to explicitly allow sound effects; no other previously excluded feature (persistence, mobile controls, leaderboards, music) is introduced.
- All existing gameplay rules and timings are frozen; the current automated test suite and manual checklist remain the behavioral safety net.

# Contract: Power-Up Drop, Double Shot & Termination

**Audience**: every consumer of the DOM-free core (`applySizeRule`, `resolveCollisions`, `update`, `fire`) and the `node --test` suite. Spec source: `spec.md` FR-001…FR-015, clarifications 2026-10-24 (Q1 → B geometry, Q2 → A once-recoil, Q3 → B-1 capacity). All numbers are binding (constitution III) except the pair's V half-angle, which spec FR-007 delegates to this plan (research.md R3 → **10°**).

## §1 Definitions

- **POWERUP**: a new asteroid-family entity of kind `'POWERUP'`, born from a destroyed small asteroid. Non-regular family member (like `'SPECIAL'`): it is skipped by every regular-asteroid rule and never counted by the tier cap.
- **doubleShot**: one boolean on the game state (default `false`). It is the *entire* state of the effect — no timer, no counter, no stacking.
- **Drop instant**: the simulation step in which a SMALL asteroid is destroyed, immediately after the size rule is applied to it.

## §2 Drop rule (FR-001, FR-002)

- **DR-1** — Each destroyed SMALL asteroid gets an independent roll, performed inside `applySizeRule` on both the award path (projectile hit, points awarded) and the no-award path (regular×regular collision / ship impact / any cause). Contract: `drop ⇔ random() < 0.1` (`POWERUP_DROP_CHANCE`).
- **DR-2** — On a successful roll exactly **one** POWERUP is created at the destroyed asteroid's `x, y` with `vx, vy` **exactly equal** to the destroyed asteroid's velocity at the destruction instant (direction and speed both inherited verbatim — FR-002; destroyed smalls have fixed velocity from creation).
- **DR-3** — The POWERUP never receives a `birthStep` tag and is never created by `tickSpawn` or `edgeSpawn`.
- **DR-4** — Two smalls destroyed in the same step are two independent rolls (two drops are possible).

## §3 Collection rules (FR-004, FR-005, FR-006, FR-014)

- **CR-1** — Any projectile touching a POWERUP: both `dead = true`, `doubleShot = true`, **0 score** (neither `addScore(…50)` nor `addScore(…200)` may run).
- **CR-2** — The alive ship touching a POWERUP, in `phase === 'PLAYING'`, **any immunity state** (`shieldT > 0` included): POWERUP consumed, `doubleShot = true`, ship never harmed, no explosion, no life change.
- **CR-3** — Collection while `doubleShot === true`: the POWERUP is consumed, the flag stays `true` — no stacking, no extension, no reset (FR-014).
- **CR-4** — Collection never changes `state.score` or `state.lives`.

## §4 Double-shot firing (FR-007, FR-008; clarifications Q1 → B, Q2 → A)

- **FS-1** — While `doubleShot === true`, every firing tick emits **exactly 2 projectiles**, both created at the ship's position, one at `ship.angle − POWERUP_SPREAD_HALF_ANGLE` (10°) and one at `ship.angle + POWERUP_SPREAD_HALF_ANGLE`, each at the normal projectile speed **along its own heading** (300 px/s, `LIMITS.projSpeed` reused).
- **FS-2** — The pair always leaves around the ship's **current** heading — never an old one.
- **FS-3** — Exactly **one recoil** of the normal magnitude per double shot: `speed = max(speed − 30, −60)` once per firing tick, never twice for the pair (Q2 → A).
- **FS-4** — Cadence unchanged: `shotT = TIMINGS.shotInterval` (160 ms) per firing tick, single tap = exactly one pair.

## §5 Capacity rule (FR-009; clarification Q3 → B-1)

- **CP-1** — While `doubleShot === true`, firing is **never refused for space** and the pair is **never split**: the full pair is always emitted regardless of the current projectile count.
- **CP-2** — The doubled limit (2 × `LIMITS.maxProjectiles` = 10) is the **nominal operating capacity** — a documentation/soft concept, not an enforced ceiling. Any transient exceedance beyond it self-resolves as projectiles are removed by the standard border/impact filter at end of step. No additional hard ceiling is introduced while the effect lasts.
- **CP-3** — When `doubleShot` becomes `false`, the normal refusal (`length >= 5`) resumes immediately for new shots; projectiles already in flight are **never removed or altered** by the transition (FR-011).

## §6 Termination (FR-010, FR-015)

- **TR-1** — `doubleShot` is cleared to `false` **exactly** at life loss: (a) the `DYING` completion branch of `update()` at the same instant as `lives -= 1`; (b) the `GAME_OVER` branch of `hitShip()` (final life).
- **TR-2** — During the 500 ms `DYING` window (before sequence completion) the flag stays `true`; no collection during that window is possible (ship destroyed, ship contact gated to alive ships in `PLAYING`).
- **TR-3** — No elapsed time, phase change, hidden-tab freeze (loop never calls `update` at all), border event or additional collection terminates the effect. Only a life loss can.
- **TR-4** — After termination every firing tick yields exactly one projectile and the normal refusal applies (restoration within one firing tick of the loss).

## §7 Non-interaction invariants (FR-012, FR-013; feature-001 interaction matrix delta)

- **NI-1** — POWERUP vs any regular asteroid: no destruction, no split, no deflection, no score — ignored by both sides in every pass (it is not a `regular×regular` pair participant).
- **NI-2** — POWERUP is excluded from the regular-count filter used by `tickSpawn`'s cap gate (like `'SPECIAL'`), so it never blocks or unblocks edge spawns.
- **NI-3** — POWERUP despawns on any border crossing (`x<0 ∨ x>800 ∨ y<0 ∨ y>600`), same as every asteroid-family entity.

## §8 RNG contract

- **RNG-1** — The drop roll MUST take an injectable `random` (`=random` default) flowing `resolveCollisions(state, random)` → `applySizeRule(state, asteroid, awardPoints, random)`, following the established pattern of `pickKind`/`tickSpawn`/`edgeSpawn` (feature 001). Gameplay uses `Math.random`; tests use fakes (red-green determinism, research.md R6).
- **RNG-2** — The exact comparison is `random() < POWERUP_DROP_CHANCE` with `POWERUP_DROP_CHANCE = 0.1`; the boundary convention is binding (a uniform 0.00–0.99 sequence yields exactly 10 drops per 100 destroyed smalls — spec SC-001).

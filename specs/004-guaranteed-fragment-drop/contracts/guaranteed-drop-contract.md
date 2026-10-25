# Contract: Fragment Origin & Guaranteed Drop (amendment)

**Audience**: every consumer of the DOM-free core (`applySizeRule`, `resolveCollisions`) and the `node --test` suite. Spec source: `spec.md` FR-001…FR-007. This contract **amends §2 (DR-1) of feature-003's [powerup-contract.md](../../003-double-shot-powerup/contracts/powerup-contract.md)**; every other clause of that contract (§3–§8) remains binding verbatim. All rates bound by constitution III: guaranteed 100% (expressed as logic — R2 in research.md), retained 10% roll.

## §1 Definitions

- **Medium-fragment small**: a SMALL asteroid created by the split branch of `applySizeRule` when the destroyed asteroid is `MEDIUM` (i.e. `childKind === 'SMALL'`). It carries the new field `mediumFragment = true` from birth.
- **Guaranteed drop**: a POWERUP release that happens with probability 1 — the roll is bypassed entirely (research R2), so the injectable `random` is never consulted on this path.
- **Fragment birth instant**: the step in which a MEDIUM asteroid is destroyed and replaced by its two SMALL children (feature-002 contract §2).

## §2 Origin tagging (spec FR-004)

- **OF-1** — Whenever `applySizeRule` destroys a `MEDIUM` asteroid, both created SMALL children MUST be created with `mediumFragment = true` set at birth: this covers the projectile-split path (scored, +50) and the regular×regular collision path (unscored) alike, because both flow through the same split branch.
- **OF-2** — The flag MUST NOT be set on: SMALL children of a LARGE (there are none — LARGE yields MEDIUM children), MEDIUM children of a LARGE, or asteroids created by `tickSpawn`/`edgeSpawn`. Absence of the field (not `false`) marks a non-fragment.
- **OF-3** — The flag MUST be immutable after birth and MUST NOT be copied to: the destroyed parent's POWERUP, or any other object. It is read by exactly one expression (the drop condition of §3; research R4 firewall).
- **OF-4** — Feature-002's `birthStep` tag and its collision self-protection (`src/collision.js` `birthStep` equality) MUST remain untouched and MUST NOT read or depend on `mediumFragment`. A medium's child carries both tags (`birthStep` + `mediumFragment`), serving disjoint concerns.

## §3 Guaranteed drop rule (spec FR-001, FR-002, FR-003 — **amends feature-003 DR-1/DR-2**)

- **GD-1** — When a SMALL asteroid with `mediumFragment === true` is destroyed (ANY cause that flows through `applySizeRule`: projectile hit with points, regular×regular collision without points, ship impact, any future cause), `applySizeRule` MUST return exactly one POWERUP — release probability is 1, with **no roll performed**.
- **GD-2** — The guaranteed POWERUP is created by the same call as feature-003's rolled drop (`createPowerup(x, y, heading, speed)`), with `x, y`, and velocity inherited verbatim from the destroyed fragment at its destruction instant. Every feature-003 contract clause about POWERUP behaviour afterwards applies unchanged (collection ⇒ `doubleShot = true`, 0 score, border despawn, non-interaction, no stacking).
- **GD-3 — Implementing the guarantee MUST NOT reference the injectable `random` on the guaranteed path** — the condition short-circuits before the roll (research R2). Tests may assert this observable behaviour (a fake that counts invocations sees zero calls on fragment destructions).
- **GD-4** — Non-fragment SMALL destructions (no `mediumFragment`) MUST keep the unchanged independent roll `random() < POWERUP_DROP_CHANCE` (0.1), with the same 0.00–0.99 uniform convention as feature-003 RNG-2. Nothing in this feature may tighten, extend or otherwise alter that rate.
- **GD-5** — A medium-fragment small that leaves the screen (border despawn, no destruction event) MUST produce no drop — destruction is the trigger (FR-005).
- **GD-6** — Each destroyed medium-fragment small produces its own guaranteed drop (dragged from feature-003 DR-4's independence principle): both children of one medium destroyed in the same step ⇒ two distinct POWERUPs, each from its own fragment's position/velocity (FR-006).

## §4 Regression locks (spec FR-003, FR-007; constitution III/IV/V)

- **RL-1** — All feature-003 contract clauses (§3–§8: collection rules, firing sequence, capacity, termination, non-interaction, RNG conventions) MUST keep passing: the pre-existing suites `tests/powerup.test.js`, `tests/double-shot.test.js`, `tests/split-*.test.js` stay green throughout.
- **RL-2** — No new numeric constants are introduced (`POWERUP_DROP_CHANCE = 0.1` remains the sole rate constant; the 100% is logic, R2). No new state fields on `GameState` (a guaranteed drop is an event, not state).
- **RL-3** — No `src/config.js`, `src/collision.js`, `src/entities.js`, `src/state.js` change is authorized by this feature beyond (research R4): `src/score.js` gains the tag + branch, `tests/` gains `guaranteed-drop.test.js`. Render, spawn, update, firing, termination chains are untouched.

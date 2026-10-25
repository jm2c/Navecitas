# Research: Guaranteed Drop From Medium Fragments (Phase 0)

**Feature**: `004-guaranteed-fragment-drop` | Resolves every open question of plan.md §Technical Context; all decisions respect constitution v1.0.0. Empirical grounding: `src/score.js`, `src/collision.js`, `src/entities.js` and feature-002/003 artifacts were read in full; the spec left **no** NEEDS CLARIFICATION (clarify session found full coverage, 2026-10-24).

---

## R1 — How to identify "a small asteroid born from a medium's split" (spec FR-004)

**Decision**: A new boolean field **`mediumFragment`** is set on fragment children at their creation in `applySizeRule` (`src/score.js`), in the existing MEDIUM/LARGE split branch: when the destroyed asteroid is `MEDIUM`, both SMALL children get `child.mediumFragment = true`. Asteroids born by `tickSpawn`/`edgeSpawn` have no such field (absent ⇒ not a fragment). The flag is set once at birth and never changes for the fragment's lifetime on screen — exactly the spec's fixed-origin rule (FR-004).

**Rationale**: `applySizeRule` is the single choke point where every fragment is born (feature-002 contract §2), so every medium→small path (projectile split AND regular×regular collision split) is covered by one statement. The existing `birthStep` tag deliberately does NOT record the parent's size (it only marks "I am a fragment" for split self-protection, `src/collision.js:80–82`), so a new field is required — the collision code compares `birthStep` values and must not be overloaded with parent-size semantics.

**Alternatives considered**:
- Extend `birthStep` to encode the parent (e.g. store an object or a size-derived value) — rejected: it would change/complicate the collision comparison that feature-002 tests bind (`first.birthStep === second.birthStep`); a sibling field keeps both concerns orthogonal.
- Store `parentKind` string ('MEDIUM'/'LARGE') on every fragment — viable but richer than the spec needs: the rule keys only on "parent was a MEDIUM and child is SMALL". YAGNI (constitution V) → plain boolean; the LARGE→MEDIUM case needs no tag because mediums never satisfy the drop rule.
- Detect the fragment post-hoc by geometry (angle ± 25° from a step-recorded parent) — rejected: fragile, order-dependent; a mutable-instant origin cannot be reconstructed reliably after drift.
- Scan a registry of "current medium children" — rejected: extra state, cleanup burden on border despawn, no benefit over a field on the asteroid.

**Invariants**: POWERUP never receives `mediumFragment` (or it could recursively re-tag); `mediumFragment` never copied on split (smalls don't split, so unreachable anyway); the field is absent (not `false`) on non-fragment smalls — tests assert `=== true` only on mediums' children.

---

## R2 — How the 100% rule integrates with feature 003's 10% roll (spec FR-001, FR-003)

**Decision**: In the SMALL branch of `applySizeRule`, the drop condition becomes:
`asteroid.mediumFragment === true || random() < POWERUP_DROP_CHANCE`.
A medium-fragment small's destruction **skips the roll entirely** and always creates exactly one POWERUP; all other smalls keep the unchanged `random() < 0.1` (0.0 forces a drop, ≥ 0.1 none — same convention as feature-003 contract RNG-2). The short-circuit means the injectable `random` is never even consulted on the guaranteed path (observable in tests: a fake random that throws or returns 1 still yields the drop).

**Rationale**: the guaranteed path needs no numeric constant — there is no 1.0 probability to bind (constitution III satisfied with zero new numerics; "100%" is expressed as logic, not as a magic constant that tuners could drift). Reusing the same `createPowerup(asteroid.x, asteroid.y, heading, speed)` call preserves feature-003 FR-002 semantics verbatim (position + velocity inheritance), which the spec demands unchanged (FR-002).

**Alternatives considered**:
- `random() < 1.0` when fragment — rejected: pointless indirection; keeps RNG dependency on a path that is deterministic by spec.
- Separate function `dropRequired(state, asteroid)` returning `{drop: 'guaranteed'|'rolled'}` — rejected: over-abstraction for one conditional; the boolean branch is the simplest complete expression.
- Applying the guarantee only on the projectile-award path — rejected: spec FR-005 binds "any cause of destruction", and `applySizeRule` is shared by both paths (scored and unscored) so the single condition covers both for free.

---

## R3 — Red-green test strategy (constitution II)

**Decision**: one new DOM-free test file, written **before** implementation and observed failing:
`tests/guaranteed-drop.test.js` — drives `resolveCollisions()` (with injected fake `random`) and direct `applySizeRule` calls:
- Destroy a medium (projectile path ⇒ split), then destroy each CHILD small with projectiles while `random` always yields 1.0 (would refuse a 10% drop): POWERUP still appears **every** time, in every simulated trial, from the child fragment (spec SC-001 100% / US1 scenario 1).
- Same guarantee on the no-award path (fragment destroyed in an asteroid-vs-asteroid collision, points not awarded): drop still appears (FR-005 / edge case "cause of destruction does not matter").
- Both fragments of one medium exist; each is destroyed → **two** independent POWERUPs, each with its own parent's position/velocity (FR-006 / SC-004).
- `random` is never called on the guaranteed path (a record-keeping fake asserts zero invocations) — R2's short-circuit is testable behaviour.
- Non-fragment smalls (spawned asteroids) with `random = 1.0` produce no drop; with the 0.00–0.99 uniform fake they still produce exactly 1 drop per 10 destructions (FR-003 / SC-003 — feature-003's rate untouched).
- Fragment small that simply crosses a border (`moveAsteroids` despawn): **no** drop — destruction is the trigger (FR-005).
- The dropped POWERUP carries no extra tags: verified untouched feature-003 invariants reused — no points on collection, `doubleShot = true` on collection (FR-007 covered by existing `tests/powerup.test.js`, which must stay green).
- `mediumFragment` flag location checks: children of a MEDIUM have it, children of a LARGE don't, spawned asteroids don't (FR-004).

**Rationale**: red-green requires observable failures today (currently fragments never guarantee a drop and no `mediumFragment` field exists); every assertion uses the established injected-`random` determinism pattern; multi-step sequences reuse the aligned-`update(DT_MS)` framing of `tests/split-projectile.test.js`.

**Alternatives considered**:
- Putting the new assertions inside feature-003's `tests/powerup.test.js` — rejected: amendment belongs to its own feature review unit; a separate file keeps each feature's gate auditable (002 precedent: `split-*.test.js` files).
- Statistical/probabilistic verification with real `Math.random` — rejected: nondeterministic ( unconstitutional for red-green); deterministic fakes assert exact counts.
- Browser automation for the 100% claim — rejected: constitution II; the core guarantee is pure logic.

---

## R4 — What the design leaves untouched (scope firewall)

**Decision**: verified unchanged: `src/config.js` (no new constants — R2), `src/entities.js` (`createPowerup` reused as-is), `src/collision.js` (its `applySizeRule` funnel and POWERUP collection rules unchanged), `src/state.js` (no new state field — a guaranteed drop is an event like a rolled drop, not state), `src/render/` (feature-003 gold double-bar glyph identifies the drop; spec makes no visual distinction for fragment-sourced drops — Assumption), the entire feature-003 firing chain (`update.js` fire path, termination points).

**Rationale**: the feature exclusively changes **when** a drop must occur; the feature-003 data-model's own statement ("this feature exclusively changes when the drop occurs, not what the drop is") becomes the design contract. The `birthStep` split-protection mechanism (feature-002) is untouched by the sibling flag addition.

**Alternatives considered**: none — anything beyond the tag + branch would violate constitution V.

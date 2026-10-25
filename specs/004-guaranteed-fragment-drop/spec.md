# Feature Specification: Guaranteed Drop From Medium Fragments

**Feature Branch**: `004-guaranteed-fragment-drop`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Nueva regla, la mejora del disparo doble aparecerá el 100% de las ocaciones si es destruido un asteroide pequeño que haya sido producto de la división de uno mediano"

## Context: How This Rule Relates to Feature 003

Feature 003 (Double Shot Power-Up, `specs/003-double-shot-powerup`) defines the drop rule: any destroyed small asteroid has an independent 10% probability of releasing the power-up (FR-001 of that spec). This feature adds a new, more specific rule that **supersedes the 10% chance for one class of small asteroids**: a small asteroid that was born from the split of a medium asteroid ALWAYS releases the power-up when destroyed (100% of the time). For small asteroids that did NOT come from a medium's split, the existing 10% chance continues to apply unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Destroying a small asteroid born from a medium's split always releases the power-up (Priority: P1)

As a player, when I shoot down a small asteroid that was created as a fragment of a destroyed medium asteroid, I know the double-shot power-up ALWAYS comes out of it — every single time, no luck involved. It emerges from the fragment's position and flies on, exactly as the existing rule describes. This turns the medium → small chain into a guaranteed reward moment that reliably feels earned.

**Why this priority**: This is the entire point of the requested rule; without it nothing changes from the player's perspective.

**Independent Test**: Spawn or stage a medium asteroid, destroy it (it splits), then destroy one of its small fragments with a projectile and verify that a power-up object appears at that fragment's position continuing its direction of travel — repeat several times and observe it happens in every trial, 100% of them.

**Acceptance Scenarios**:

1. **Given** a small asteroid exists on screen that was born as a fragment of a destroyed medium asteroid, **When** it is destroyed (by any cause: projectile, asteroid collision, or any other destruction), **Then** exactly one power-up object appears at its position at the instant of destruction and travels in the direction that small asteroid was moving at that moment, with the same collection/activation semantics as defined in feature 003 (ship or projectile contact consumes it and activates the double shot).
2. **Given** many small-asteroid destructions are observed where every destroyed asteroid was a fragment born from a medium's split, **When** the outcomes are compared, **Then** the power-up appeared in 100% of those destructions — no exceptions, never zero drops.
3. **Given** a small asteroid destroyed while the double-shot effect is already active, **When** the asteroid is a medium fragment and the drop rule fires, **Then** the power-up still appears on screen (existing consumption/no-stacking semantics apply: if collected it is simply consumed).

---

### User Story 2 - Small asteroids that are NOT medium fragments keep the unmodified 10% chance (Priority: P2)

As a player, the guaranteed reward is special because it belongs to the medium-split chain only. Small asteroids that were not produced by a medium's split — for example the small asteroids that spawn as part of ordinary waves — behave exactly as before feature 003's rate: a rare, lucky drop (roughly 1 in 10), not a guaranteed one. The guaranteed rule never fires for them, so I can still tell the two situations apart by what happens on screen.

**Why this priority**: It guards the balance and meaning of the new rule — without the distinction, every small kill would guarantee a power-up and the reward mechanic would lose its sense of progression. The game is already playable with US1 alone; this slice completes it.

**Independent Test**: Destroy (repeatedly, in large numbers) small asteroids that never came from a medium split and record how often a power-up appears: it must occur in only a small minority of events (approximately 1 in 10, per feature 003), never in every single event.

**Acceptance Scenarios**:

1. **Given** a small asteroid that was never a fragment of a split medium asteroid (e.g., one spawned by an ordinary wave) is destroyed, **When** its drop is evaluated, **Then** the result follows feature 003's original independent 10% chance — sometimes a power-up appears, sometimes nothing appears (in the no-drop cases nothing spawns from its position, exactly as before).
2. **Given** a mix of destructions is observed (fragments of mediums and non-fragment smalls destroyed in the same session), **When** the outcomes are grouped by origin, **Then** all medium-fragment destructions yielded a drop (100%) while non-fragment destructions yielded no drop in the clear majority of events.

---

### Edge Cases

- What happens when a mid-sized chain is destroyed in one event — a large splits into two mediums and each medium is destroyed by hits that also destroy its small fragments in quick succession? Each destroyed medium drops nothing, and each small fragment it spawned releases a power-up at its own destruction instant: 100% per fragment that is destroyed, independent per event.
- What happens when one projectile simultaneously destroys both small fragments born from the same medium? Both power-ups appear (one per destroyed fragment, each from its fragment's position), and each behaves per the regular power-up rules.
- What happens when a medium asteroid's two small fragments are destroyed by an asteroid collision (no points)? The cause of destruction does not matter: a medium-fragment small destroyed by a collision also releases its power-up 100% of the time, exactly as if shot.
- What happens when the small fragment leaves the screen without being destroyed? No drop occurs — destruction of the small asteroid is the trigger; simply despawning at a border produces no power-up.
- What happens when a medium-fragment small asteroid is destroyed but the player already has the double-shot effect active? The drop still appears; if collected, it consumed with no stacking (mirrors feature 003's no-stacking rule).
- What happens when the game is over (no lives left)? No further significance — drops would still occur at the instant of destruction, but nothing can collect them (all existing terminal-state semantics of feature 003 remain).
- How is "product of a medium's split" tracked through the game? The origin is an inherent property the small asteroid carries from its birth as a fragment: any small asteroid created by the destruction of a medium asteroid (however the medium was destroyed — projectile or asteroid collision) is a medium fragment for the whole of its life on screen. The origin does not change with time, movement, or screen edges; the asteroid either is a fragment from birth or is not.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST release exactly one power-up object (as defined in feature 003) from a destroyed small asteroid in 100% of destruction events of small asteroids that were born from the split of a medium asteroid — the release probability for these fragment smalls is guaranteed, not probabilistic (this rule supersedes feature 003's FR-001 10% rate specifically for medium-fragment small asteroids).
- **FR-002**: The released power-up MUST follow all of feature 003's existing power-up semantics: it appears at the destroyed small asteroid's position at the instant of destruction, travels in the direction (and speed) that small asteroid had at that moment, is collectible by the ship or by a projectile, activates the double shot on collection, despawns at screen edges, and ignores regular asteroids.
- **FR-003**: System MUST retain feature 003's original independent 10% drop probability for the destruction of small asteroids that were NOT born from a medium's split; the guaranteed rule MUST NOT extend to them.
- **FR-004**: System MUST treat as a medium-fragment small any small asteroid created when a medium asteroid was destroyed and replaced by its two fragments (medium → two smalls), regardless of what caused the medium's destruction (projectile hit or asteroid collision); the origin condition MUST be determined at the fragment's creation and remain fixed for the fragment's lifetime on screen.
- **FR-005**: The guaranteed release MUST apply to any medium-fragment small destroyed by any cause that destroys it (projectile, asteroid collision, or any other destruction mechanism), with the drop still requiring actual destruction — simply leaving the screen (border despawn) MUST NOT produce a drop.
- **FR-006**: When both small fragments of the same medium are destroyed (even by the same event), each destroyed fragment MUST independently produce its own power-up drop.
- **FR-007**: The guaranteed drop MUST represent no change to the drop's nature or effects — no points, no lives lost, no harm; the drop and its collection remain score-neutral and life-neutral exactly as in feature 003.

### Key Entities *(include if data involved)*

- **Medium-fragment small asteroid**: A small asteroid whose birth was a fragment of a destroyed medium asteroid (created by that medium splitting into two smalls). It carries a fixed origin property from birth ("medium fragment") that lasts its whole life on screen and is the trigger condition for the guaranteed drop rule. Otherwise an ordinary asteroid: normal speed, collisions, scoring and border despawn.
- **Power-up object (existing, from feature 003)**: Unchanged: transient collectible that flies on from the destroyed asteroid's position and direction, collectible by ship or projectile, activates the double shot, despawns at edges, ignores regular asteroids.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Across many repeated trials of destroying small asteroids that are medium fragments, a power-up appears after every single destruction — a 100% rate (zero exceptions over any number of trials).
- **SC-002**: In every guaranteed drop, the power-up's position and travel direction match the destroyed fragment's position and movement at the instant of its destruction, and its collection behaves exactly as in feature 003 (ship or projectile contact activates the double shot, no score or life change).
- **SC-003**: Across a large number of observed destructions of non-fragment small asteroids, the clear majority of events produce no drop (drops appear in roughly 1 in 10 such events, per the unmodified feature 003 rate) — the guaranteed rule is never observed to apply to them.
- **SC-004**: A medium asteroid and its two small fragments destroyed against a full two-fragment destruction chain produce two distinct power-up drops (one per fragment), each traceable to its own fragment's position — never one drop for two fragments and never two drops from one destroyed fragment.
- **SC-005**: The game's score, lives and difficulty are unaffected by the new rule itself: the only observable change versus feature 003 is a higher drop frequency for medium-fragment smalls (every drop remains score- and life-neutral, and the double shot still ends only on life loss).

## Assumptions

- "Producto de la división de uno mediano" means exactly the small asteroids created when a medium asteroid is destroyed and splits into two small fragments (the game's medium → two-smalls rule); it does NOT include small asteroids spawned by regular waves, and it does not extend one generation further back (fragments' own parent being a large asteroid matters only insofar as a large → two mediums, whose fragments — the smalls — still qualify because their immediate parent was a medium).
- The destruction trigger works with any cause of destruction (projectile hit or asteroid-vs-asteroid collision), consistent with feature 003's treatment of destruction cause.
- The power-up's position/direction/speed and all its interactions are inherited unchanged from feature 003 — this feature exclusively changes **when** the drop must occur (probability), not **what** the drop is.
- Feature 003's 10% rate continues to hold for non-fragment smalls, including independence between events and no memory of previous outcomes.
- No visual change is required to distinguish "fragment" smalls from other smalls in this feature (the drop guarantee itself is the observable difference; adding a visual marker would be out of scope under the simplicity principle unless evidence demands it).

---

*This feature shares its object and effect definitions with `specs/003-double-shot-powerup/spec.md`; the 10% rate of that feature remains in force except where superseded here (medium-fragment smalls: 100% guaranteed drop).*

*Assumptions above cover the input's silences with defaults consistent with the existing game and feature 003; they can be revisited via clarification before planning.*

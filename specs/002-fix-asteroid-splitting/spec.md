# Feature Specification: Fix Asteroid Splitting

**Feature Branch**: `002-fix-asteroid-splitting`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "Se ha detectado que cuando un proyectil impacta un asteroide mediano o grande, estos no se dividen, sino que desaparecen, mismo resultado cuando colisionan entre asteroides"

## Clarifications

### Session 2026-10-05

- Q: Which asteroids should be exempt from destroying a newborn fragment right after a split? → A: Every fragment born in the same instant is mutually protected, no matter which event created them (single split or two asteroids colliding at once).
- Q: If a split or collision pushes the number of asteroids above the current tier's maximum, what should happen? → A: Allowed — the count may exceed the cap; new edge spawns stay blocked until it falls back below the cap.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Medium and large asteroids visibly split when shot (Priority: P1)

As a player, when I shoot a medium asteroid I expect to see it break into two small asteroids that fly apart in a V, and when I shoot a large asteroid I expect two medium asteroids flying apart in a V — exactly as the game always promised. Today the hit asteroid simply vanishes and nothing appears in its place, so the reward for shooting bigger asteroids is lost and the screen empties instead of filling with fragments.

**Why this priority**: Splitting is the core reward mechanic of the game and the source of every point beyond the first small kills; without it the game is broken for the player, not merely degraded.

**Independent Test**: Start a round, reach a score tier where medium asteroids spawn, shoot a medium and count the asteroids on screen before/after (must go from 1 to 2 small ones flying apart in a V while the score grows by exactly 50); do the same with a large asteroid (must yield 2 medium ones).

**Acceptance Scenarios**:

1. **Given** a medium asteroid on screen and a clear shot, **When** a projectile hits it, **Then** the medium disappears, exactly two small asteroids appear at its former position moving apart in a V (headings ± 25° from the parent's heading), and the score increases by exactly 50.
2. **Given** a large asteroid on screen and a clear shot, **When** a projectile hits it, **Then** the large disappears, exactly two medium asteroids appear at its former position moving apart in a V (headings ± 25° from the parent's heading), and the score increases by exactly 50.
3. **Given** the two fragments created by a split, **When** the moments immediately after the split pass, **Then** both fragments are still present on screen and visibly separating — the split never results in an empty screen where the parent used to be.
4. **Given** a split performed at least 300 logical pixels away from every screen border in an otherwise empty play area, **When** 1 second passes, **Then** both fragments are still on screen and still moving apart.

---

### User Story 2 - Asteroid-vs-asteroid collisions fragment instead of erasing (Priority: P1)

As a player I expect two regular asteroids that crash into each other to break apart following the same size rules as when I shoot them (small vanishes, medium → two smalls, large → two mediums), just without awarding points. Right now the colliding asteroids disappear and their fragments never show up, so asteroid traffic thins out on its own.

**Why this priority**: It is the same defect as User Story 1 seen from the other trigger; both must work for the game's population dynamics to match the rules.

**Independent Test**: Force two medium asteroids into each other (or wait for a natural collision) and verify that four small asteroids are left behind with the score unchanged.

**Acceptance Scenarios**:

1. **Given** two medium asteroids touching, **When** they collide, **Then** each of them is replaced by two small asteroids (four fragments in total), all four are present on screen immediately after the collision, and the score does not change.
2. **Given** a large and a small asteroid touching, **When** they collide, **Then** the large is replaced by two medium fragments and the small simply disappears, all three surviving fragments are present on screen, and the score does not change.
3. **Given** any asteroid-vs-asteroid collision, **When** the collision is resolved, **Then** no points are added or removed at any moment.

---

### User Story 3 - Fragments behave as ordinary asteroids afterwards (Priority: P2)

As a player, once the fragments exist they are regular asteroids: they move at the tier-appropriate speed for their size, can be shot for their own points, can collide with other asteroids or the ship, and disappear at the screen border. Fragments born in the same instant must never wipe each other out just because they were born at the same spot.

**Why this priority**: Without this, a "successful" split could still collapse into nothing a moment later, reproducing the original defect; but it depends on fragments existing at all (User Stories 1 and 2).

**Independent Test**: Split a medium near the middle of the screen and observe the two small fragments coexisting and separating; then shoot each fragment and verify 200 points each; repeat after letting fragments drift and confirm nothing self-destructs.

**Acceptance Scenarios**:

1. **Given** two or more fragments born in the same instant, **When** they overlap because they were born at the same position, **Then** they do not destroy, damage or split each other — they simply move apart.
2. **Given** a surviving fragment, **When** it drifts across the screen, **Then** it behaves like any spawned asteroid of its size: same speed for the current tier, collides with asteroids and the ship, awards points when shot, and disappears at a border.
3. **Given** a newborn fragment and an unrelated asteroid that existed before the birth instant, **When** they touch, **Then** the normal collision rules apply to that pair (only fragments born in the same instant are mutually protected).

---

### Edge Cases

- A split happens close to a screen border: fragments may cross a border right after being created and disappear normally — that is allowed, but a split away from borders must still leave visible fragments.
- A projectile hits a medium at the same instant two other asteroids collide: both destruction events apply and every fragment they produce survives their birth.
- A large asteroid is shot repeatedly: large → 2 mediums → 4 smalls, each level of the chain producing living fragments as specified.
- The asteroid removed by a ship collision also splits (medium/large): its fragments must survive their birth too, and they award no points for that removal.
- Fragments from two different destruction events born overlapping each other in the same instant are mutually protected too: neither destroys the other, regardless of which event created them.
- A split occurs while the population cap for the current tier is already reached: fragments still appear (they are the result of an existing asteroid's removal, not a fresh spawn attempt), the count may exceed the cap, and new edge spawns stay blocked until it falls back below the cap.
- A split happens right after game over or during the death sequence: the simulation keeps applying the same rules, fragments included.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a projectile hits a medium asteroid, the medium MUST disappear and exactly two small fragments MUST appear at its former position with headings of parent heading ± 25°, both fragments present on screen after the event, and the score MUST increase by exactly 50.
- **FR-002**: When a projectile hits a large asteroid, the large MUST disappear and exactly two medium fragments MUST appear at its former position with headings of parent heading ± 25°, both fragments present on screen after the event, and the score MUST increase by exactly 50.
- **FR-003**: When two regular asteroids collide, the identical size-based rules MUST be applied to each of them (small → disappears, medium → two small fragments, large → two medium fragments), every fragment MUST be present on screen after the event, and the score MUST NOT change.
- **FR-004**: When a regular asteroid is removed by colliding with the ship, the same size-based split MUST occur for medium and large asteroids, the fragments MUST be present on screen after the event, and no points MUST be awarded for that removal.
- **FR-005**: Every fragment born in the same instant MUST be mutually protected — no fragment may destroy, damage or split another fragment born at that same instant, no matter which destruction event created it (a single asteroid splitting, or two asteroids colliding in the same instant); such fragments MUST be observable as separate asteroids moving apart.
- **FR-006**: Fragments MUST be ordinary asteroids from the moment they are created: they move at the tier-appropriate speed for their own size, count toward the current tier's maximum simultaneous population, collide with unrelated asteroids and the ship under the normal rules, award their normal points when later destroyed by a projectile (200 small / 50 medium), and disappear when crossing a screen border.
- **FR-007**: A destruction event MUST NOT leave fewer regular asteroids than the size rules owe: a projectile hit on a medium or large replaces 1 asteroid with 2 fragments (net +1 on screen), and an asteroid-vs-asteroid collision replaces both parents with every fragment owed by each of them — provided a fragment does not subsequently leave the play area on its own.
- **FR-008**: A projectile that hits a medium or large MUST be consumed exactly as with any other hit, and the score arithmetic for all destruction events MUST remain exact (200 / 50 / 0 as specified for each trigger).
- **FR-009**: The tier's maximum simultaneous population MUST be enforced only on new edge spawns: when a destruction event's fragments push the regular-asteroid count above the cap, every fragment MUST still be created and kept, and edge spawn attempts MUST remain blocked until the count falls back below the cap. Fragments MUST NEVER be removed or suppressed in order to respect the cap.

### Key Entities

- **Asteroid**: Enemy object of size small, medium or large (plus the special variant, out of scope here). Attributes: position, heading, speed, size, alive state. A medium or large asteroid that is destroyed is replaced by two fragments of the next smaller size, born at the destroyed asteroid's position.
- **Fragment**: An asteroid created by a destruction event rather than by an edge spawn. It is indistinguishable from a spawned asteroid of its size except that no other fragment born in the same instant may destroy it.
- **Destruction event**: The single instant in which one asteroid (projectile hit, ship collision) or two asteroids (mutual collision) are removed and their fragments are created. Fragments born in the same instant are mutually protected even if they come from different destruction events.
- **Score**: Cumulative, non-decreasing points counter; splits award 50 per medium/large removed by a projectile and 0 for fragments involved in asteroid-vs-asteroid or ship collisions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of manual trials, shooting a medium asteroid leaves exactly 2 small asteroids on screen separating in a V and increases the score by exactly 50 — never 0 fragments.
- **SC-002**: In 100% of manual trials, shooting a large asteroid leaves exactly 2 medium asteroids on screen separating in a V and increases the score by exactly 50 — never 0 fragments.
- **SC-003**: In 100% of observed asteroid-vs-asteroid collisions, every fragment owed by both parents exists on screen immediately after the collision and the score is unchanged before and after.
- **SC-004**: For a split performed at least 300 logical pixels from every border with no other asteroids present, both fragments are still present and separating 1 second later, in 100% of trials (0% self-annihilation rate).
- **SC-005**: A single large asteroid destroyed through its full chain (large → 2 medium → 4 small, all destroyed by projectiles) awards exactly 50 + 50 + 50 + 4×200 = 950 points, proving every generation of fragments really existed and could be shot.
- **SC-006**: An asteroid-vs-asteroid collision never changes the score by any amount in any observed case (0 point drift).
- **SC-007**: Population behaviour matches the rules again: the total number of regular asteroids after any destruction event equals exactly the survivors owed by the size rules with no unexplained losses, the count may temporarily exceed the tier cap as a result of a destruction event, and new edge spawns resume only once the count is back below the cap.

## Assumptions

- The intended behaviour is exactly the one already specified for the original game (medium → 2 smalls, large → 2 mediums, V of ± 25°, 50 points on projectile hits, 0 points on asteroid-vs-asteroid and ship-collision removals); this feature restores that behaviour and adds nothing new.
- Observed defect: hit or colliding medium/large asteroids leave no fragments visible — the fragments appear to cease to exist almost immediately after being created, which is consistent with fragments born at the same position destroying each other. The rule adopted here is that every fragment born in the same instant never destroys another one, regardless of which event created it.
- Fragments born in the same instant ignore one another permanently; in practice they separate in a V and rarely meet again, so this exemption mainly matters at the birth instant.
- An asteroid that existed before the birth instant (not a fragment of that instant) follows the normal collision rules against a newborn and may be destroyed or split immediately — an accepted, rare consequence of the birth position.
- No numeric relationship from the original specification changes: base speed, tier multipliers, the ± 25° V half-angle, point values (200 / 50 / 0), population caps, and the 800×600 play area remain binding.
- The special life-granting asteroid is out of scope: it never splits and never interacts with regular asteroids.
- Verification must follow the project's quality gates: the game logic responsible for splits and scoring is covered by tests written to fail before the fix is written, every existing and new test passes afterwards, and no new dependencies are introduced.

# Feature Specification: Space Asteroid Game

**Feature Branch**: `001-space-asteroid-game`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "Crea un juego 2D para la web, es de una nave que se puede mover por la pantalla, usando las flechas izquierda y derecha cambia el ángulo de la nave y con las flecha de arriba y abajo acelera o frena, no está permitido que la nave vaya hacia atrás usando las flechas, pero sí puede por efecto de la inercia. Con la barra espaciadora lanzará un proyectil en línea recta con una velocidad moderada en la misma dirección en la que apunta la nave, este proyectil debe inicializar en la posición en que se encuentra actualmente la nave y cuando la nave dispare tendrá un retroceso y esto la puede desacelerar o hacer que vaya hacia atrás, la nave espacial no debe verse frenada por la fricción que es inexistente en el espacio. De manera aleatoria deben ir saliendo asteroides de las orillas de la pantalla en direcciones aleatorias, deben de existir 3 tamaños de asteroides chicos, medianos y grandes. Cuando un asteroide chico sea impactado por un proyectil de la nave este desaparecerá y se sumarán 200pts al score del jugador visible en la esquina superior derecha de la pantalla, cuando el asteroide sea mediano debe separarse en dos asteroides chicos y sus direcciones nuevas formaran una V, para los asteroides grandes saldrán dos medianos y en ambos casos sólo se sumarán 50pts al score del jugador. Si dos asteroides colisionan entre sí aplica la misma lógica de desaparición o separación, pero sin sumar puntos al jugador. Si la nave del jugador deja la pantalla debe reaparecer del otro lado... El juego termina cuando el jugador es impactado por un asteroide y ya no tiene más vidas en la reserva. Cuando el juego termina hay que colocar unas letras muy grandes centradas en la pantalla que digan 'Game Over', pero por detrás los asteroides seguiran saliendo y comportandose como si el juego continuara. Los asterooides no interactuan con las letras de Game Over"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pilot the ship and shoot (Priority: P1)

As a player I steer a spaceship with the arrow keys: left/right rotate it, up accelerates it along the direction it points, and down slows it down but never drives it backwards. The ship keeps gliding at its current speed when I stop pressing keys (space has no friction), it wraps around the screen edges reappearing on the opposite side with the same height/position and the same speed, and pressing the space bar fires a projectile straight ahead from the ship's current position, pushing the ship back with recoil.

**Why this priority**: Without movement, inertia and shooting there is no game at all; this is the core loop every other feature builds on.

**Independent Test**: Launch the game, rotate and accelerate the ship, release all keys and verify the ship keeps its speed and direction, cross each screen edge and verify wrap-around preserves position on the other axis and speed, then fire and verify the projectile leaves from the ship's nose along its heading and that the ship is decelerated or pushed backwards by the recoil.

**Acceptance Scenarios**:

1. **Given** a ship at rest pointing up, **When** the left/right arrows are pressed, **Then** only the ship's angle changes while its position and speed stay the same.
2. **Given** a ship moving, **When** the up arrow is pressed, **Then** the ship accelerates in the direction it is pointing; **When** the down arrow is pressed, **Then** the speed decreases toward zero but the ship never starts moving backwards because of input.
3. **Given** a ship moving with no keys pressed, **When** 10 seconds pass, **Then** its speed and direction are unchanged (no friction).
4. **Given** a ship exiting through the left edge, **When** it crosses it, **Then** it reappears on the right edge at the same vertical position and with the same speed vector it had at the moment it crossed; the same wrap applies vertically (top → bottom preserving horizontal position and speed).
5. **Given** a ship at any position/angle, **When** the space bar is pressed, **Then** one projectile is created at the ship's current position travelling in a straight line at a moderate speed in the ship's facing direction, and the ship immediately loses speed or is pushed backwards by the recoil.

---

### User Story 2 - Asteroids appear and follow the difficulty curve (Priority: P1)

Asteroids of three sizes (small, medium, large) spawn randomly from the screen edges heading in random directions and simply vanish when they leave the screen. The mix, speed and maximum simultaneous count of asteroids depend on the player's score across four tiers (0–1000, >1000, >2000, >3000).

**Why this priority**: The enemies and their escalation create the challenge; without them score, lives and splitting have no source.

**Independent Test**: Play through each score tier and observe the spawn mix, speeds and maximum simultaneous asteroid counts against the tier table.

**Acceptance Scenarios**:

1. **Given** a score of 0–1000, **When** asteroids spawn, **Then** only small ones appear, at base speed, and no more than 3 asteroids coexist on screen.
2. **Given** a score above 1000, **When** asteroids spawn, **Then** medium asteroids appear at base speed and newly spawned small ones are 10% faster than base speed.
3. **Given** a score above 2000, **When** asteroids spawn, **Then** large asteroids start appearing at base speed, small ones run 20% faster than base and medium ones 10% faster than base, with at most 5 asteroids on screen.
4. **Given** a score above 3000, **When** asteroids spawn, **Then** at most 7 asteroids coexist, small ones run 30% faster than base, medium 20% faster and large 10% faster, with no further increases afterwards.
5. **Given** any asteroid, **When** it crosses a screen border, **Then** it disappears (no wrap-around for asteroids).

---

### User Story 3 - Hits, splitting and scoring (Priority: P1)

Projectiles destroy asteroids according to their size: small ones disappear for 200 points, medium ones split into two small ones whose directions form a V for 50 points, large ones split into two medium ones for 50 points. When two asteroids collide with each other the same disappearance/splitting logic applies but no points are awarded. The score is always visible in the top-right corner.

**Why this priority**: This is the reward mechanism of the game and the trigger for the whole difficulty curve and life pickups.

**Independent Test**: Shoot asteroids of each size and check points and fragmentation; force two asteroids into each other and check that fragmentation happens with no score change.

**Acceptance Scenarios**:

1. **Given** a score of 0, **When** a small asteroid is hit by a projectile, **Then** it disappears and the score shown in the top-right corner increases by 200.
2. **Given** any score, **When** a medium asteroid is hit by a projectile, **Then** it disappears, two small asteroids appear moving apart in a V pattern, and the score increases by 50.
3. **Given** any score, **When** a large asteroid is hit by a projectile, **Then** it disappears, two medium asteroids appear moving apart in a V pattern, and the score increases by 50.
4. **Given** two asteroids touching, **When** they collide, **Then** the same size-based disappearance/splitting rules apply and the score does not change.
5. **Given** a projectile in flight, **When** it hits an asteroid, **Then** the projectile is consumed by that hit.

---

### User Story 4 - Lives, destruction and respawn (Priority: P2)

The player starts with 3 lives; the top-left corner shows 2 small static ship icons (the reserve, i.e. total minus the ship currently in play). When an asteroid hits the ship, the ship explodes, 500 ms later it reappears at the centre of the screen pointing up with 2 seconds of immunity shown by fast blinking, and one icon is removed from the reserve. The game ends when a hit occurs while the reserve is empty.

**Why this priority**: Gives the game stakes and a fail state; it depends on movement and asteroids existing, so it ranks below them.

**Independent Test**: Fly into asteroids repeatedly and verify the explosion, the 500 ms delay, the centre respawn pointing up, the blinking immunity lasting 2 seconds, the shrinking icon counter and the end of the game on the final hit.

**Acceptance Scenarios**:

1. **Given** a fresh game, **When** it starts, **Then** the score is 0, there are 2 reserve ship icons in the top-left corner, and the ship begins at the centre pointing up.
2. **Given** a ship with reserve icons remaining, **When** an asteroid touches it outside of immunity, **Then** an explosion animation plays, the ship vanishes for 500 ms, then reappears at screen centre pointing up, blinks fast for 2 seconds of immunity, and one reserve icon disappears.
3. **Given** an immune (blinking) ship, **When** it touches an asteroid, **Then** nothing happens: no explosion, no life lost, no respawn.
4. **Given** a reserve of 0 icons, **When** an asteroid touches the ship, **Then** the game ends and the words "Game Over" appear in very large letters centred on the screen.
5. **Given** the game has ended, **When** time passes, **Then** asteroids keep spawning, moving, splitting and disappearing exactly as during play, and they never collide with, bounce off or are blocked by the "Game Over" letters.

---

### User Story 5 - Bonus life asteroid (Priority: P3)

Every time the score crosses a multiple of 500 (500, 1000, 1500, …) a special small asteroid shaped like a spaceship but in a different colour spawns at base speed. Destroying it grants one extra life. If the reserve already shows 5 ship icons, no special asteroid is created, so the player can never exceed 5 reserve icons plus the ship in play (6 lives total).

**Why this priority**: A bonus recovery mechanic; the game is fully playable without it, so it comes last.

**Independent Test**: Reach 500 points, confirm the special asteroid appears; destroy it and confirm the icon counter grows; repeat with a full 5-icon reserve and confirm nothing spawns.

**Acceptance Scenarios**:

1. **Given** a reserve of fewer than 5 icons, **When** the score crosses a multiple of 500, **Then** one special ship-shaped small asteroid of a different colour appears, moving at base speed.
2. **Given** a special asteroid on screen, **When** it is destroyed by a projectile, **Then** one life is added to the reserve (up to the 5-icon cap).
3. **Given** a reserve of 5 icons, **When** the score crosses a multiple of 500, **Then** no special asteroid is created.
4. **Given** a special asteroid on screen, **When** it collides with a regular asteroid, **Then** normal asteroid-vs-asteroid logic applies (no life granted, no points awarded for the special one).

---

### Edge Cases

- The score jumps across a 500 multiple in one hit (e.g. 400 → 600): exactly one special asteroid spawns for the crossed multiple.
- The score crosses a 500 multiple while the reserve already holds 5 icons: no special asteroid is created and it is not queued for later.
- A hit occurs while the ship is immune: no effect at all.
- A hit occurs during the 500 ms post-explosion wait: the ship is not present, so no further collision is possible.
- The ship fires on the exact frame it crosses a screen edge: the projectile starts from the ship's post-wrap position.
- A projectile hits two asteroids in the same instant: each asteroid applies its own size rule.
- The asteroid that collides with the ship: it is removed following the normal size rule (split or vanish) but awards no points; if that removal creates children, they behave as normal asteroids.
- Splitting near a screen edge: children spawn at the parent's position and disappear normally if they immediately cross a border.
- Difficulty tier changes while asteroids are already on screen: speed and cap rules apply from the moment an asteroid is created (spawn or split); asteroids already in flight keep their speed, and the cap applies to how many are allowed to exist from that moment on.
- Game over while a special asteroid or projectiles are in flight: the simulation continues; the ship no longer exists and cannot score or gain lives.

## Requirements *(mandatory)*

### Functional Requirements

**Ship control and physics**

- **FR-001**: The left and right arrow keys MUST rotate the ship (change only its angle); the up arrow MUST accelerate the ship along its current facing direction; the down arrow MUST only decelerate it and MUST NEVER make it move backwards through input.
- **FR-002**: The ship MUST NOT experience any friction or passive deceleration; with no input it must keep its speed and direction indefinitely.
- **FR-003**: When input stops, the ship MUST keep moving with the inertia it had.
- **FR-004**: When the ship crosses a screen edge it MUST wrap to the opposite edge preserving the coordinate of the other axis and its full speed vector (leaving left ⇒ reappears right at the same height and speed; leaving top ⇒ reappears bottom at the same horizontal position and speed).
- **FR-005**: The space bar MUST fire a projectile that starts at the ship's current position and travels in a straight line at a moderate speed in the direction the ship is pointing.
- **FR-006**: Firing MUST apply a recoil impulse to the ship that can reduce its speed to zero or push it in the opposite direction of travel.
- **FR-007**: Shots MUST be rate-limited by a short minimum interval so a single press cannot flood the screen with projectiles.

**Asteroids**

- **FR-008**: Asteroids MUST spawn randomly from the screen edges heading in random directions, and MUST exist in three sizes: small, medium and large.
- **FR-009**: An asteroid that crosses any screen border MUST disappear; asteroids MUST NOT wrap around.
- **FR-010**: The game MUST apply this difficulty table based on the current score:

  | Score | Small | Medium | Large | Max on screen |
  |-------|-------|--------|-------|---------------|
  | 0 – 1000 | base speed | not spawned | not spawned | 3 |
  | > 1000 – 2000 | base × 1.1 | base speed | not spawned | 3 |
  | > 2000 – 3000 | base × 1.2 | base × 1.1 | base speed | 5 |
  | > 3000 | base × 1.3 | base × 1.2 | base × 1.1 | 7 |

  No speed or population increases occur beyond the last tier. The cap is a cap on simultaneous existence; spawn attempts must stop while the cap is reached.

- **FR-011**: When a projectile hits a small asteroid, the asteroid MUST disappear and the score MUST increase by 200.
- **FR-012**: When a projectile hits a medium asteroid, it MUST disappear and spawn two small asteroids whose directions form a V, and the score MUST increase by 50.
- **FR-013**: When a projectile hits a large asteroid, it MUST disappear and spawn two medium asteroids whose directions form a V, and the score MUST increase by 50.
- **FR-014**: When two asteroids collide with each other, the identical size-based disappearance/splitting rules MUST apply with NO score awarded.
- **FR-015**: A projectile MUST be consumed when it hits an asteroid.

**Score and lives**

- **FR-016**: The current score MUST be displayed permanently in the top-right corner of the screen; the score never decreases.
- **FR-017**: The player starts with 3 lives; the top-left corner MUST show the reserve as small static ship icons, one icon per reserve life (2 icons at the start).
- **FR-018**: When an asteroid hits the ship (outside immunity), the system MUST: play an explosion animation on the ship, wait 500 ms, remove one reserve icon, recreate the ship at the centre of the screen pointing up, and grant 2 seconds of immunity during which the ship blinks fast.
- **FR-019**: While immune, asteroid collisions MUST have no effect on the ship or the lives.
- **FR-020**: When a hit occurs while the reserve has no icons left, the game MUST end.

**Bonus life asteroid**

- **FR-021**: When the score crosses a multiple of 500 (500, 1000, 1500, …), the system MUST spawn a small asteroid drawn with a spaceship shape in a different colour, always at base speed.
- **FR-022**: Destroying that special asteroid with a projectile MUST add one life to the reserve.
- **FR-023**: If the reserve already shows 5 icons, the special asteroid MUST NOT be spawned, keeping the total at no more than 6 lives (5 reserve + the ship in play).

**Game over**

- **FR-024**: On game over, the words "Game Over" MUST be displayed in very large letters centred on the screen.
- **FR-025**: After game over the asteroids MUST keep spawning and behaving exactly as during play (movement, splitting, scoring logic for score display, border removal), and asteroids MUST NOT interact with the "Game Over" letters in any way.

### Key Entities

- **Ship (player)**: The controllable spacecraft. Attributes: position, angle, speed vector, lives-in-play, immunity timer, alive/destroyed state.
- **Projectile**: Ammunition fired by the ship. Attributes: position, direction, speed, active state. Created at the ship's position, consumed on the first asteroid hit.
- **Asteroid**: Enemy object with sizes small / medium / large plus a special variant (small, ship-shaped, different colour). Attributes: position, direction, speed, size/variant. Regular asteroids despawn at borders; the special one grants a life when destroyed.
- **Score**: Cumulative, non-decreasing points counter (200 for a small, 50 for a medium or large) that drives the difficulty tiers and the 500-multiple bonus spawns. Displayed top-right.
- **Life reserve**: Counter of spare ships, shown as static ship icons top-left (initially 2 for a total of 3 lives, capped at 5 icons / 6 total lives).
- **Difficulty tier**: Derived from the current score (0–1000 / >1000–2000 / >2000–3000 / >3000); determines spawn mix, speed multipliers and maximum simultaneous asteroids.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can rotate, accelerate, brake and fire using only the four arrow keys and the space bar, with every input reflected on screen within the same instant it is pressed, in 100% of manual test runs.
- **SC-002**: With no input, a moving ship's speed varies by less than 1% over 10 seconds (zero friction), and the ship never moves backwards as a result of pressing the down arrow.
- **SC-003**: Wrap-around preserves the ship's untouched axis coordinate and its full speed vector with 0 pixel error in all four directions.
- **SC-004**: Score arithmetic is exact: destroying 5 small asteroids yields exactly 1000 points, and destroying a medium or large always yields exactly 50 with asteroid-vs-asteroid collisions yielding 0.
- **SC-005**: The four difficulty tiers switch at the specified score boundaries with the specified speed multipliers (±0%) and maximum simultaneous asteroid counts (3 / 3 / 5 / 7) verified in all four tiers.
- **SC-006**: The death sequence timings match the specification: explosion → 500 ms delay → centre respawn pointing up → 2 s of visible fast blinking, in every death.
- **SC-007**: In a session where the score passes 500, 1000 and 1500 with a reserve below 5 icons, exactly one special asteroid appears per crossed multiple, and destroying it increases the reserve by exactly 1 without ever exceeding 5 icons.
- **SC-008**: After game over, the "Game Over" text remains centred and fully readable while asteroids keep spawning, moving, splitting and disappearing for at least 60 further seconds, with zero collisions or deflections caused by the text.
- **SC-009**: The game stays visually smooth (no perceptible stutter) at the maximum asteroid population of 7 plus projectiles and effects, on a typical modern laptop.

## Assumptions

- Exact numeric values for base speeds, acceleration, rotation rate, projectile speed, shot interval, spawn cadence and animation timings (other than the 500 ms and 2 s explicitly stated) are design-time tuning constants; the specified *relationships* (10% / 20% / 30% multipliers, relative sizes, ordering) are binding.
- "Score above 1000 / 2000 / 3000" is interpreted as exclusive: the tier applies when the score strictly exceeds the threshold, so 1000 belongs to the first tier, 2000 to the second and 3000 to the third.
- The maximum simultaneous asteroid count stays at 3 while the score is above 1000 but not above 2000 (only the >2000 and >3000 steps raise it).
- Asteroid speed is fixed at creation time (edge spawn or split) according to the tier active at that moment; asteroids already on screen keep the speed they were created with.
- Asteroids produced by a split use the tier-appropriate speed for their own size and are launched from the parent's position symmetrically around the parent's heading so their directions form a V.
- A projectile hits at most one asteroid per instant and is consumed by it.
- The asteroid that collides with the ship is removed with normal size-based logic but awards no points; other asteroids are unaffected.
- While the ship is destroyed or after game over it cannot collide, shoot or score; projectiles in flight at game over simply continue until they hit something or leave the screen.
- The special asteroid awards 200 points like any small asteroid when destroyed by a projectile (in addition to the extra life) and spawns at most one per crossed 500 multiple, never queued if suppressed by the full reserve.
- The "Game Over" screen is terminal: the session can be restarted by reloading/starting the game again; no leaderboard, persistence, sound, mobile controls or multiplayer are in scope for this version.
- The game runs in a browser window sized to the viewport; the screen boundaries are the visible play area.

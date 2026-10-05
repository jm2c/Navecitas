# Feature Specification: Space Asteroid Game

**Feature Branch**: `001-space-asteroid-game`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "Crea un juego 2D para la web, es de una nave que se puede mover por la pantalla, usando las flechas izquierda y derecha cambia el ángulo de la nave y con las flecha de arriba y abajo acelera o frena, no está permitido que la nave vaya hacia atrás usando las flechas, pero sí puede por efecto de la inercia. Con la barra espaciadora lanzará un proyectil en línea recta con una velocidad moderada en la misma dirección en la que apunta la nave, este proyectil debe inicializar en la posición en que se encuentra actualmente la nave y cuando la nave dispare tendrá un retroceso y esto la puede desacelerar o hacer que vaya hacia atrás, la nave espacial no debe verse frenada por la fricción que es inexistente en el espacio. De manera aleatoria deben ir saliendo asteroides de las orillas de la pantalla en direcciones aleatorias, deben de existir 3 tamaños de asteroides chicos, medianos y grandes. Cuando un asteroide chico sea impactado por un proyectil de la nave este desaparecerá y se sumarán 200pts al score del jugador visible en la esquina superior derecha de la pantalla, cuando el asteroide sea mediano debe separarse en dos asteroides chicos y sus direcciones nuevas formaran una V, para los asteroides grandes saldrán dos medianos y en ambos casos sólo se sumarán 50pts al score del jugador. Si dos asteroides colisionan entre sí aplica la misma lógica de desaparición o separación, pero sin sumar puntos al jugador. Si la nave del jugador deja la pantalla debe reaparecer del otro lado... El juego termina cuando el jugador es impactado por un asteroide y ya no tiene más vidas en la reserva. Cuando el juego termina hay que colocar unas letras muy grandes centradas en la pantalla que digan 'Game Over', pero por detrás los asteroides seguiran saliendo y comportandose como si el juego continuara. Los asterooides no interactuan con las letras de Game Over"

## Clarifications

### Session 2026-10-04

- Q: ¿Puede el asteroide especial (el que otorga una vida) chocar con los demás asteroides? → A: No; no interactúa con ellos, pasa por encima y desaparece cuando llega al borde de la pantalla.
- Q: ¿Cuándo desaparece un proyectil? → A: Cuando colisiona con cualquier asteroide o cuando sale de la pantalla.
- Q: ¿Cuántos proyectiles puede haber en pantalla al mismo tiempo? → A: Un máximo de 5; mientras haya 5 proyectiles en pantalla no se puede disparar, hay que esperar a que al menos uno desaparezca.
- Q: ¿A qué velocidad viaja el proyectil? → A: 50% más rápido que la velocidad base (velocidad base × 1.5).
- Q: ¿Hasta qué velocidad puede acelerar la nave con la flecha arriba? → A: Velocidad límite de 30% más rápido que la velocidad base (velocidad base × 1.3).
- Q: Al girar con las flechas izquierda/derecha, ¿la velocidad de la nave gira con ella o mantiene su dirección original? → A: La velocidad está siempre alineada con la nave: ésta solo viaja hacia adelante o hacia atrás según su ángulo actual (velocidad escalar en el eje de la nave).
- Q: ¿Cómo cambia la velocidad de la nave cada disparo cuando va hacia atrás por inercia? → A: Un solo paso de 15% por disparo: cada disparo resta 15% de la velocidad base al valor de velocidad de la nave; si cruza cero el exceso queda como marcha atrás y ésta nunca supera el 30% de la velocidad base.
- Q: ¿Puede el asteroide especial dañar a la nave o cómo se gana la vida con él? → A: Otorga una vida tanto si se destruye con un proyectil como si la nave colisiona contra éste; el contacto con la nave es beneficioso y no le resta vidas.
- Q: ¿Cómo se usa la barra espaciadora para disparar? → A: Mantenerla pulsada dispara en ráfaga con un intervalo corto entre disparos, además del tope de 5 proyectiles en pantalla.
- Q: ¿Se suman puntos al recoger el asteroide especial? → A: No; nunca suma puntos, sólo otorga la vida.
- Q: When the browser window is larger than 800×600, should the play area grow or stay fixed? → A: Fixed 800×600 logical play area, rendered scaled up to fit larger windows (the world size never changes).
- Q: When the browser window is smaller than 800×600, what happens? → A: The page keeps a minimum size of 800×600 and the browser shows scrollbars; the game never scales down.
- Q: When the window's shape isn't 4:3, should the 800×600 image keep its proportions or stretch? → A: Keep the 4:3 proportions (uniform scale); the leftover window space is filled with a plain background bar.
- Q: After Game Over, how does the player start a new game? → A: Only by reloading the page; there is no in-game restart control.
- Q: Does the game begin playing immediately when the page loads, or does it wait behind a start screen until the player presses a key? → A: Start screen first: the ship sits centred and non-interactive with slowly blinking "Press spacebar to start" at bottom-centre; pressing space plays a 3‑2‑1‑Go countdown (each item starts bigger than the screen, shrinks very fast to about the ship's size placed slightly below it, holds 0.5 s, then the next appears; only "Go" exits by growing to giant size while turning transparent quickly). After the "Go" animation the player takes control and asteroids start spawning.
- Q: ¿Qué forma debe tener el servidor Node.js que entrega el juego al navegador? → A: Un `server.js` propio del proyecto, sin dependencias, arrancado con `node server.js` (el servidor es Node.js, nunca Python).
- Q: ¿Con qué proporción deben aparecer los distintos tamaños de asteroide cuando la tabla de dificultad permite más de un tamaño? → A: Rampa por nivel — nivel 2 (>1000–2000): 60% pequeño / 40% mediano; nivel 3 (>2000–3000): 40% pequeño / 35% mediano / 25% grande; nivel 4 (>3000): 30% / 35% / 35%. El nivel 1 sigue siendo 100% pequeño.
- Q: ¿Debe congelarse el juego cuando el jugador cambia a otra pestaña o ventana y retomar exactamente donde quedó al volver? → A: Sí; se congela toda la simulación (movimiento, cronómetros de muerte, inmunidad y cuenta atrás incluidos) mientras la pestaña está oculta, y se reanuda exactamente donde quedó.
- Q: ¿En qué idioma deben mostrarse los textos en pantalla, como "Game Over" o "Press spacebar to start"? → A: Inglés, exactamente como están escritos hoy en la especificación.
- Q: ¿Debe mostrarse en pantalla un contador de FPS para poder verificar el framerate constante de 60? → A: No; el HUD se limita al marcador y a los iconos de vidas, y el framerate se verifica con las herramientas de rendimiento del navegador.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pilot the ship and shoot (Priority: P1)

As a player I steer a spaceship with the arrow keys: left/right rotate it, up accelerates it along the direction it points up to a speed limit of 1.3× the base speed, and down slows it down but never drives it backwards. The ship always travels along its own nose — rotating re-points the direction of travel, so it only ever moves forward or backward along its current angle. The ship keeps gliding at its current speed when I stop pressing keys (space has no friction), it wraps around the screen edges reappearing on the opposite side with the same height/position and the same speed, and pressing the space bar fires a projectile straight ahead from the ship's current position at 1.5× the base speed, pushing the ship back with recoil. At most 5 projectiles can be in flight at once.

**Why this priority**: Without movement, inertia and shooting there is no game at all; this is the core loop every other feature builds on.

**Independent Test**: Launch the game, start a round through the start screen and countdown, then rotate and accelerate the ship to verify it stops at 1.3× base speed, release all keys and verify the ship keeps its speed and direction, cross each screen edge and verify wrap-around preserves position on the other axis and speed, then fire and verify the projectile leaves from the ship's nose at 1.5× base speed, that the ship recoils, that a 6th shot is refused while 5 projectiles are on screen, and that projectiles vanish at the border.

**Acceptance Scenarios**:

1. **Given** a moving ship, **When** the left/right arrows are pressed, **Then** the ship's angle and its direction of travel change together while its speed magnitude stays exactly the same.
2. **Given** a ship moving, **When** the up arrow is pressed, **Then** the ship accelerates in the direction it is pointing until it reaches the speed limit of 1.3× the base speed and never exceeds it; **When** the down arrow is pressed, **Then** the speed decreases toward zero but the ship never starts moving backwards because of input.
3. **Given** a ship moving with no keys pressed, **When** 10 seconds pass, **Then** its speed and direction are unchanged (no friction).
4. **Given** a ship exiting through the left edge, **When** it crosses it, **Then** it reappears on the right edge at the same vertical position and with the same speed (magnitude and forward/backward direction) it had at the moment it crossed; the same wrap applies vertically (top → bottom preserving horizontal position and speed).
5. **Given** a ship at any position/angle, **When** the space bar is pressed, **Then** one projectile is created at the ship's current position travelling in a straight line at 1.5× the base speed in the ship's facing direction, and the ship immediately loses speed or is pushed backwards by the recoil.
6. **Given** 5 projectiles already on screen, **When** the space bar is pressed, **Then** no new projectile is created; **When** at least one of those projectiles disappears, **Then** firing becomes possible again.
7. **Given** a projectile in flight, **When** it crosses a screen border, **Then** it disappears (no wrap-around for projectiles).
8. **Given** a ship drifting backwards at 0.15× the base speed, **When** the space bar is pressed, **Then** its backward speed becomes 0.3× the base speed; **When** it fires again at that cap, **Then** the backward speed stays at 0.3× the base speed and never grows beyond it.
9. **Given** the space bar held down, **When** time passes, **Then** shots leave one after another with a short fixed interval between them until 5 projectiles are on screen, and no further projectile is created while the cap is reached; **When** one disappears, **Then** the next shot of the burst goes through.

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

Projectiles destroy asteroids according to their size: small ones disappear for 200 points, medium ones split into two small ones whose directions form a V for 50 points, large ones split into two medium ones for 50 points. When two regular asteroids collide with each other the same disappearance/splitting logic applies but no points are awarded. The score is always visible in the top-right corner.

**Why this priority**: This is the reward mechanism of the game and the trigger for the whole difficulty curve and life pickups.

**Independent Test**: Shoot asteroids of each size and check points and fragmentation; force two regular asteroids into each other and check that fragmentation happens with no score change.

**Acceptance Scenarios**:

1. **Given** a score of 0, **When** a small asteroid is hit by a projectile, **Then** it disappears and the score shown in the top-right corner increases by 200.
2. **Given** any score, **When** a medium asteroid is hit by a projectile, **Then** it disappears, two small asteroids appear moving apart in a V pattern, and the score increases by 50.
3. **Given** any score, **When** a large asteroid is hit by a projectile, **Then** it disappears, two medium asteroids appear moving apart in a V pattern, and the score increases by 50.
4. **Given** two regular asteroids touching, **When** they collide, **Then** the same size-based disappearance/splitting rules apply and the score does not change.
5. **Given** a projectile in flight, **When** it hits an asteroid, **Then** the projectile is consumed by that hit.

---

### User Story 4 - Lives, destruction and respawn (Priority: P2)

The player starts with 3 lives; the top-left corner shows 2 small static ship icons (the reserve, i.e. total minus the ship currently in play). When a regular asteroid hits the ship, the ship explodes, 500 ms later it reappears at the centre of the screen pointing up with 2 seconds of immunity shown by fast blinking, and one icon is removed from the reserve. The game ends when a hit occurs while the reserve is empty.

**Why this priority**: Gives the game stakes and a fail state; it depends on movement and asteroids existing, so it ranks below them.

**Independent Test**: Fly into asteroids repeatedly and verify the explosion, the 500 ms delay, the centre respawn pointing up, the blinking immunity lasting 2 seconds, the shrinking icon counter and the end of the game on the final hit.

**Acceptance Scenarios**:

1. **Given** a fresh game, **When** the page loads, **Then** the score is 0, there are 2 reserve ship icons in the top-left corner, the ship is at the centre pointing up and non-interactive, the text "Press spacebar to start" blinks slowly at bottom-centre, and no asteroids are on screen; **When** the space bar is pressed, **Then** the 3‑2‑1‑Go countdown plays (each item shrinks fast from bigger-than-screen to about the ship's size just below it, holds 0.5 s; only "Go" grows out of the screen while turning transparent) and only after it finishes does the ship respond to input and asteroids begin to spawn.
2. **Given** a ship with reserve icons remaining, **When** a regular asteroid touches it outside of immunity, **Then** an explosion animation plays, the ship vanishes for 500 ms, then reappears at screen centre pointing up, blinks fast for 2 seconds of immunity, and one reserve icon disappears.
3. **Given** an immune (blinking) ship, **When** it touches a regular asteroid, **Then** nothing happens: no explosion, no life lost, no respawn.
4. **Given** a reserve of 0 icons, **When** a regular asteroid touches the ship, **Then** the game ends and the words "Game Over" appear in very large letters centred on the screen.
5. **Given** the game has ended, **When** time passes, **Then** asteroids keep spawning, moving, splitting and disappearing exactly as during play, and they never collide with, bounce off or are blocked by the "Game Over" letters.

---

### User Story 5 - Bonus life asteroid (Priority: P3)

Every time the score crosses a multiple of 500 (500, 1000, 1500, …) a special small asteroid shaped like a spaceship but in a different colour spawns at base speed. It grants one extra life when it is destroyed by a projectile **or** when the ship collides with it — that contact never harms the ship. The special asteroid ignores regular asteroids — it passes over them — and disappears when it reaches the screen border. If the reserve already shows 5 ship icons, no special asteroid is created, so the player can never exceed 5 reserve icons plus the ship in play (6 lives total).

**Why this priority**: A bonus recovery mechanic; the game is fully playable without it, so it comes last.

**Independent Test**: Reach 500 points, confirm the special asteroid appears; collect it with a projectile or with the ship and confirm the icon counter grows without any damage; watch it cross a regular asteroid without any effect and disappear at the border; repeat with a full 5-icon reserve and confirm nothing spawns.

**Acceptance Scenarios**:

1. **Given** a reserve of fewer than 5 icons, **When** the score crosses a multiple of 500, **Then** one special ship-shaped small asteroid of a different colour appears, moving at base speed.
2. **Given** a special asteroid on screen, **When** it is destroyed by a projectile **or** the ship collides with it, **Then** the special asteroid disappears, one life is added to the reserve (up to the 5-icon cap), the score stays exactly the same, and the ship loses no life, plays no explosion and keeps its current state.
3. **Given** a reserve of 5 icons, **When** the score crosses a multiple of 500, **Then** no special asteroid is created.
4. **Given** a special asteroid and a regular asteroid crossing paths, **When** they touch, **Then** nothing happens: the special asteroid passes over the regular one, and neither is destroyed, split or scored.
5. **Given** a special asteroid, **When** it reaches the screen border, **Then** it disappears.

---

### Edge Cases

- The score jumps across a 500 multiple in one hit (e.g. 400 → 600): exactly one special asteroid spawns for the crossed multiple.
- The score crosses a 500 multiple while the reserve already holds 5 icons: no special asteroid is created and it is not queued for later.
- The player presses fire while 5 projectiles are already on screen: no projectile is created; the next shot becomes possible as soon as one projectile is consumed or leaves the screen.
- A projectile and a special asteroid reach the border at the same moment: both disappear independently.
- A hit from a regular asteroid occurs while the ship is immune: no effect at all (the special asteroid, by contrast, is still collected).
- A hit occurs during the 500 ms post-explosion wait: the ship is not present, so no further collision is possible.
- The ship fires on the exact frame it crosses a screen edge: the projectile starts from the ship's post-wrap position.
- A projectile hits two asteroids in the same instant: each asteroid applies its own size rule.
- A regular asteroid that collides with the ship: it is removed following the normal size rule (split or vanish) but awards no points; if that removal creates children, they behave as normal asteroids.
- Splitting near a screen edge: children spawn at the parent's position and disappear normally if they immediately cross a border.
- Difficulty tier changes while asteroids are already on screen: speed and cap rules apply from the moment an asteroid is created (spawn or split); asteroids already in flight keep their speed, and the cap applies to how many are allowed to exist from that moment on.
- The ship reaches the 1.3× base speed limit while thrusting: further up-arrow input adds no speed; firing still applies its recoil.
- The ship is at the 0.3× base backward cap and fires: the shot's recoil is clamped, so the backward speed remains 0.3× base instead of growing.
- The ship touches the special asteroid while the reserve already holds 5 icons: the special asteroid is consumed and no life is added (the cap is never exceeded).
- The ship touches the special asteroid during its 2-second immunity: the life is still granted; immunity only blocks damage from regular asteroids.
- Collecting the special asteroid never changes the score, so it can never itself push the score across a 500 multiple or chain another special spawn.
- Game over while a special asteroid or projectiles are in flight: the simulation continues; the ship no longer exists and cannot score or gain lives.
- Any key pressed on the start screen other than the space bar: no effect; only the space bar starts the countdown.
- Arrow keys or held space bar during the countdown: no effect — the ship cannot move or fire and no projectile exists until the "Go" exit animation finishes (if the space bar is still held then, the normal burst-fire rules apply from that moment).
- Asteroid spawn timer before the countdown ends: no spawn attempts are made, so the first asteroid can only appear after the player gains control.
- The tab or window is hidden during the countdown: the current step (including its 0.5 s hold) and the "Go" exit animation keep their exact remaining time and finish after the player returns, never skipping an item or granting control early.
- The tab or window is hidden while the ship is immune or during the 500 ms post-explosion wait: the remaining immunity or wait time is preserved and continues counting only once the game is visible again.
- The tab or window is hidden with asteroids in flight: nothing on screen moves, spawns or collides while hidden; on return the simulation continues from the frozen state (FR-033).

## Requirements *(mandatory)*

### Functional Requirements

**Ship control and physics**

- **FR-001**: The left and right arrow keys MUST rotate the ship (change only its angle, which also re-points the direction of travel); the ship's motion MUST always follow its nose, i.e. its speed is a single forward/backward value along the current angle (positive = forward, negative = backward); the up arrow MUST accelerate the ship along its current facing direction up to a speed limit of 1.3× the base speed, never beyond it; the down arrow MUST only decelerate it and MUST NEVER make it move backwards through input.
- **FR-002**: The ship MUST NOT experience any friction or passive deceleration; with no input it must keep its speed and direction indefinitely.
- **FR-003**: When input stops, the ship MUST keep moving with the inertia it had.
- **FR-004**: When the ship crosses a screen edge it MUST wrap to the opposite edge preserving the coordinate of the other axis, its angle and its speed (leaving left ⇒ reappears right at the same height and speed; leaving top ⇒ reappears bottom at the same horizontal position and speed).
- **FR-005**: The space bar MUST fire a projectile that starts at the ship's current position and travels in a straight line at 1.5× the base speed in the direction the ship is pointing.
- **FR-006**: Every shot MUST apply a recoil worth exactly 15% of the base speed to the ship's speed value along its nose (a change of −0.15× base per shot): the forward speed is decremented first and, if that crosses zero, the remainder becomes backward speed. Backward speed MUST NEVER exceed 0.3× the base speed — shots fired at that cap keep the ship pinned at 0.3× base backwards.
- **FR-007**: A maximum of 5 projectiles MAY exist on screen at the same time; while 5 projectiles are present the ship MUST NOT create new ones, and firing MUST become possible again as soon as at least one projectile disappears. Holding the space bar MUST fire repeatedly with a short minimum interval between consecutive shots; a single tap fires exactly one projectile.

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

  When a spawn attempt is allowed to create more than one size, the size MUST be chosen with these fixed probabilities:

  | Score | Small | Medium | Large |
  |-------|-------|--------|-------|
  | 0 – 1000 | 100% | 0% | 0% |
  | > 1000 – 2000 | 60% | 40% | 0% |
  | > 2000 – 3000 | 40% | 35% | 25% |
  | > 3000 | 30% | 35% | 35% |

- **FR-011**: When a projectile hits a small asteroid, the asteroid MUST disappear and the score MUST increase by 200. The special life-granting variant of the small asteroid is exempt: it NEVER awards points (see FR-022).
- **FR-012**: When a projectile hits a medium asteroid, it MUST disappear and spawn two small asteroids whose directions form a V (headings = parent heading ± 25°), and the score MUST increase by 50.
- **FR-013**: When a projectile hits a large asteroid, it MUST disappear and spawn two medium asteroids whose directions form a V (headings = parent heading ± 25°), and the score MUST increase by 50.
- **FR-014**: When two regular asteroids collide with each other, the identical size-based disappearance/splitting rules MUST apply with NO score awarded; the special life-granting asteroid is exempt (see FR-021).
- **FR-015**: A projectile MUST be consumed when it hits an asteroid (regular or special) and MUST also disappear when it crosses any screen border.

**Score and lives**

- **FR-016**: The current score MUST be displayed permanently in the top-right corner of the screen; the score never decreases.
- **FR-017**: The player starts with 3 lives; the top-left corner MUST show the reserve as small static ship icons, one icon per reserve life (2 icons at the start).
- **FR-018**: When a regular asteroid hits the ship (outside immunity), the system MUST: play an explosion animation on the ship, wait 500 ms, remove one reserve icon, recreate the ship at the centre of the screen pointing up, and grant 2 seconds of immunity during which the ship blinks fast.
- **FR-019**: While immune, collisions with regular asteroids MUST have no effect on the ship or the lives; the special life-granting asteroid is still collected on contact (see FR-022).
- **FR-020**: When a hit from a regular asteroid occurs while the reserve has no icons left, the game MUST end.

**Bonus life asteroid**

- **FR-021**: When the score crosses a multiple of 500 (500, 1000, 1500, …), the system MUST spawn a small asteroid drawn with a spaceship shape in a different colour, always at base speed. This special asteroid MUST NOT interact with regular asteroids (it passes over them without either being destroyed, split or scored) and MUST disappear when it reaches the screen border. Touching it with the ship MUST NOT harm the ship in any way.
- **FR-022**: The special asteroid MUST add one life to the reserve (never exceeding the 5-icon cap) both when it is destroyed by a projectile and when the ship collides with it, MUST be removed from the screen in either case, and MUST NOT award any points.
- **FR-023**: If the reserve already shows 5 icons, the special asteroid MUST NOT be spawned, keeping the total at no more than 6 lives (5 reserve + the ship in play).

**Game over**

- **FR-024**: On game over, the words "Game Over" MUST be displayed in very large letters — font size ≥ 120 logical pixels (≈20% of the 600 px play-area height) — centred on the screen.
- **FR-025**: After game over the asteroids MUST keep spawning and behaving exactly as during play (movement, splitting, scoring logic for score display, border removal), and asteroids MUST NOT interact with the "Game Over" letters in any way.

**Display**

- **FR-026**: The game MUST use a fixed logical play area of exactly 800×600 pixels: screen edges for ship wrap-around, asteroid spawn/despawn borders and the UI corners (score top-right, lives top-left) are all defined by this area. On viewports larger than 800×600 the display MUST be scaled up to fit; the logical play area MUST stay 800×600 and scaling MUST never reduce it below 800×600.
- **FR-027**: When the browser viewport is smaller than 800×600, the game MUST NOT scale down: the page keeps a minimum size of 800×600 pixels and the browser shows scrollbars so the player can scroll to the rest of the play area; the game stays fully playable at its fixed size.
- **FR-028**: Scaling MUST preserve the 800×600 aspect ratio (4:3) exactly: the same scale factor is applied to width and height, with no stretching or squashing; any leftover window space around the scaled play area MUST be filled with a plain background.
- **FR-029**: After game over, the ONLY way to start a new session MUST be reloading the page; the game MUST NOT provide any in-game restart key, button or control.

**Game start**

- **FR-030**: On page load the game MUST show a start screen: the ship sits at the centre of the play area pointing up, completely non-interactive, and at the bottom-centre the text "Press spacebar to start" blinks slowly. On this screen the score is 0 with 2 reserve icons, no asteroids spawn, and no gameplay key (arrows or firing) has any effect.
- **FR-031**: When the player presses the space bar on the start screen, a countdown of "3", "2", "1", "Go" MUST play in that order: each item appears larger than the screen, shrinks very fast down to a readable size of roughly the ship's size, positioned slightly below the ship so they never overlap, then holds there for 0.5 seconds before disappearing so the next item can appear. The shrink speed is a design-time tuning constant.
- **FR-032**: Only the "Go" item has an exit animation: it grows from its readable size up to giant size, leaving the screen while becoming transparent very quickly. During the start screen and the whole countdown the ship stays non-interactive and no asteroids spawn; immediately after the "Go" exit animation finishes, the player gains control of the ship and asteroid spawning begins.

**Visibility and timing**

- **FR-033**: While the browser tab or window containing the game is hidden, the entire simulation MUST freeze: no movement, no spawns, no collisions and no timers advance (death delay, immunity, countdown hold and blink timers included). When the tab becomes visible again the game MUST resume exactly where it stopped, with no time lost or skipped while hidden.

### Key Entities

- **Ship (player)**: The controllable spacecraft. Attributes: position, angle, speed, lives-in-play, immunity timer, alive/destroyed state, control state (awaiting start on the start screen / frozen during the countdown / active). Speed is a single forward/backward value along the ship's nose (capped at 1.3× base forward and 0.3× base backward), and rotation always re-points the direction of travel.
- **Projectile**: Ammunition fired by the ship. Attributes: position, direction, speed (1.5× the base speed), active state. Created at the ship's position, at most 5 in flight at once, consumed on the first asteroid hit or when leaving the screen.
- **Asteroid**: Enemy object with sizes small / medium / large plus a special variant (small, ship-shaped, different colour). Attributes: position, direction, speed, size/variant. Regular asteroids collide with each other and despawn at borders; the special one passes over regular asteroids, despawns at borders and grants a life when destroyed by a projectile or touched by the ship (never harming it).
- **Score**: Cumulative, non-decreasing points counter (200 for a small, 50 for a medium or large, 0 for the special life-granting asteroid) that drives the difficulty tiers and the 500-multiple bonus spawns. Displayed top-right.
- **Life reserve**: Counter of spare ships, shown as static ship icons top-left (initially 2 for a total of 3 lives, capped at 5 icons / 6 total lives).
- **Difficulty tier**: Derived from the current score (0–1000 / >1000–2000 / >2000–3000 / >3000); determines spawn mix, speed multipliers and maximum simultaneous asteroids.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can rotate, accelerate, brake and fire using only the four arrow keys and the space bar, with every input reflected on screen within the same instant it is pressed, in 100% of manual test runs.
- **SC-002**: With no input, a moving ship's speed varies by less than 1% over 10 seconds (zero friction), and the ship never moves backwards as a result of pressing the down arrow.
- **SC-003**: Wrap-around preserves the ship's untouched axis coordinate, its angle and its speed with 0 pixel error in all four directions.
- **SC-004**: Score arithmetic is exact: destroying 5 regular small asteroids yields exactly 1000 points, destroying a medium or large always yields exactly 50, asteroid-vs-asteroid collisions yield 0, and collecting the special asteroid yields 0.
- **SC-005**: The four difficulty tiers switch at the specified score boundaries with the specified speed multipliers (±0%) and maximum simultaneous asteroid counts (3 / 3 / 5 / 7) verified in all four tiers.
- **SC-006**: The death sequence timings match the specification: explosion → 500 ms delay → centre respawn pointing up → 2 s of visible fast blinking, in every death.
- **SC-007**: In a session where the score passes 500, 1000 and 1500 with a reserve below 5 icons, exactly one special asteroid appears per crossed multiple, collecting it (by projectile or by ship contact) increases the reserve by exactly 1 without ever exceeding 5 icons or costing the ship a life, and the score stays unchanged on collection.
- **SC-008**: After game over, the "Game Over" text remains centred and fully readable while asteroids keep spawning, moving, splitting and disappearing for at least 60 further seconds, with zero collisions or deflections caused by the text.
- **SC-009**: The simulation sustains its fixed 60 FPS step (frame time ≤ 16.67 ms) at the maximum asteroid population of 7 plus 5 projectiles and the explosion animation, with no more than 1 dropped frame per second over any 10-second window measured with the browser's performance tools on a typical modern laptop.
- **SC-010**: Projectiles travel at exactly 1.5× the base speed, never exceed 5 on screen at once (the 6th shot attempt produces no projectile until one disappears), each one disappears on its first asteroid hit or on leaving the screen, and holding the space bar produces a steady burst at a fixed short interval that never breaks the 5-projectile cap.
- **SC-011**: Thrusting with the up arrow never raises the ship's speed above 1.3× the base speed, no matter how long it is held.
- **SC-012**: Each shot changes the ship's speed along its nose by exactly 0.15× base towards the tail (from full forward 1.3× base: 1.15, 1.00, 0.85, … in successive shots) and the backward speed never goes below −0.3× base, with 0 tolerance in either direction.
- **SC-013**: The logical play area is exactly 800×600 pixels in every session: the ship wraps at x = 0/800 and y = 0/600 with 0 px error, the score sits in the top-right corner and the life icons in the top-left corner of that area, and the rendered output is never scaled below 800×600 (on a viewport under 800×600 the page stays 800×600 and scrollbars appear instead of shrinking).
- **SC-014**: On any enlarged viewport the 4:3 proportions are preserved with 0 distortion: horizontal and vertical scale factors are identical, so a circle drawn in the game stays a circle on screen, and leftover space shows only the plain background.
- **SC-015**: The start sequence behaves exactly as specified in every session: the start screen shows the centred ship with the slowly blinking "Press spacebar to start" text and zero asteroid spawns, each countdown item holds for 0.5 s (±50 ms) at a size of roughly the ship's size positioned below it, the "Go" exit animation removes it from the screen while fading, control and asteroid spawning begin only after that animation, and no gameplay input has any effect beforehand.
- **SC-016**: Hiding the tab for 10 seconds at any moment (during the countdown, the 500 ms death delay, the 2 s immunity or normal flight) consumes 0 s of game time: on return the remaining hold/delay/immunity times are exactly what they were when the tab was hidden, no asteroid has moved, spawned or collided, and nothing on screen advanced.

## Assumptions

- A single shared "base speed" constant is the reference for asteroid speeds, the ship's speed limits and projectile speed; exact values for base speed, acceleration, rotation rate, minimum shot interval, spawn cadence and animation timings (other than the 500 ms death delay, the 2 s immunity and the 0.5 s countdown hold explicitly stated) are design-time tuning constants. The specified *relationships* are binding: 10% / 20% / 30% asteroid multipliers, projectile = 1.5× base, ship forward limit = 1.3× base, backward limit = 0.3× base, recoil = 0.15× base per shot.
- "Score above 1000 / 2000 / 3000" is interpreted as exclusive: the tier applies when the score strictly exceeds the threshold, so 1000 belongs to the first tier, 2000 to the second and 3000 to the third.
- The maximum simultaneous asteroid count stays at 3 while the score is above 1000 but not above 2000 (only the >2000 and >3000 steps raise it).
- Asteroid speed is fixed at creation time (edge spawn or split) according to the tier active at that moment; asteroids already on screen keep the speed they were created with.
- Asteroids produced by a split use the tier-appropriate speed for their own size and are launched from the parent's position symmetrically around the parent's heading so their directions form a V; the V half-angle is 25° each side of the parent's heading (a binding constant, not a tuning value).
- The special life-granting asteroid spawns regardless of the regular-asteroid population cap and does not count toward the 3 / 5 / 7 limit.
- A projectile hits at most one asteroid per instant and is consumed by it.
- The regular asteroid that collides with the ship is removed with normal size-based logic but awards no points; other asteroids are unaffected. The special asteroid colliding with the ship is the one exception: it is consumed and grants a life.
- While the ship is destroyed or after game over it cannot collide, shoot or score; projectiles in flight at game over simply continue until they hit something or leave the screen.
- The special asteroid never awards points (neither on a projectile hit nor on ship contact); it only grants the life. It spawns at most one per crossed 500 multiple, never queued if suppressed by the full reserve.
- The "Game Over" screen is terminal: the session can be restarted only by reloading the page (no in-game restart control, FR-029); no leaderboard, persistence, sound, mobile controls or multiplayer are in scope for this version.
- The play area is a fixed logical 800×600 pixel field (FR-026); the display scales it up on viewports larger than 800×600 but never scales it down.
- Delivery environment (stakeholder constraint): the game is served locally by a Node.js static server — a project-owned `server.js` with no dependencies, started with `node server.js`; Python-based servers are not used.
- The HUD contains only the score (top-right) and the reserve life icons (top-left); no FPS counter or other debug overlay is displayed (the frame rate is verified with the browser's performance tools).

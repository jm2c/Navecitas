# Feature Specification: Double Shot Power-Up

**Feature Branch**: `003-double-shot-powerup`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "cuando un asteroide pequeño sea destruido existe una probabilidad del 10% de conseguir una mejora, del asteroide destruido va a salir en la misma dirección que iba un objeto nuevo. Al hacer contacto con la nave o con un misil el jugador obtendrá un doble disparo, es decir, cada vez que dispare saldrán dos proyectiles en lugar de uno. Este cambio también aumenta temporalmente la cantidad de proyectiles por pantalla al doble. El efecto termina cuando el jugador pierde una vida"

## Clarifications

### Session 2026-10-24

- Q: ¿Qué geometría debe tener el par de proyectiles del doble disparo en cada disparo? → A: Dos proyectiles desde el mismo punto con leve divergencia en V simétrica alrededor del rumbo de la nave en el instante del disparo.
- Q: Cuando el doble disparo está activo y el jugador dispara, ¿cuánto retroceso debe recibir la nave? → A: Un solo retroceso normal por disparo, exactamente igual que el disparo simple (una única vez por cada disparo doble, sin duplicar la magnitud).
- Q: Si el doble disparo está activo y quedan menos de dos espacios libres para proyectiles, ¿qué debe hacer el siguiente disparo? → A: B-1 — el par completo se dispara siempre que el efecto esté activo (nunca se divide ni se rechaza por espacio), y el sobrecupo se reabsorbe al desaparecer los proyectiles más viejos, sin techo duro adicional.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Power-up drops from destroyed small asteroids and is collectible (Priority: P1)

As a player, when I destroy a small asteroid, occasionally (about 1 in 10 times) a special power-up object should come out of it and keep flying in the direction the asteroid was heading. If I catch it with my ship or shoot it, I know the reward landed: my ship becomes double-armed. The drop should feel like a lucky, visible prize — not a hidden countdown — and the object should be clearly distinguishable from ordinary small asteroids so I can decide to chase it.

**Why this priority**: Without a drop and a pickup the rest of the feature cannot exist; this is the entry point of the whole mechanic and delivers the "lucky reward" moment the player notices first.

**Independent Test**: Force several small-asteroid destructions and verify that roughly one in ten produces a distinct new object continuing the destroyed asteroid's direction; then make the ship (or a projectile) touch that object exactly once and observe that the ship immediately enters the double-shot state with no points, no explosion and no life change.

**Acceptance Scenarios**:

1. **Given** a small asteroid travelling in some direction is destroyed (by any cause), **When** the 10% drop occurs, **Then** exactly one new power-up object appears at the destroyed asteroid's position and travels along the same direction the small asteroid was moving at the moment of destruction.
2. **Given** a power-up object on screen with an active, alive ship, **When** the ship touches it, **Then** the power-up disappears, the ship is not harmed, no life is lost, no points are awarded or deducted, and the double-shot effect becomes active from that instant.
3. **Given** a power-up object on screen, **When** any projectile touches it, **Then** both the projectile and the power-up disappear, no points change, and the double-shot effect becomes active.
4. **Given** the drop chance evaluated over many small-asteroid destructions, **When** a large number of identical destruction events occur, **Then** drops happen in approximately 1 of every 10 destructions (independent per event, no memory of previous outcomes).
5. **Given** a small asteroid is destroyed, **When** the drop does not occur (the other 90% of cases), **Then** nothing new spawns from its position — destruction behaves exactly as before this feature.
6. **Given** a medium or large asteroid is destroyed, **When** its split finishes, **Then** no power-up ever drops from it — drops come from small asteroids only.
7. **Given** a power-up object on screen, **When** it is observed next to an ordinary small asteroid, **Then** the two are visibly distinguishable at a glance (the power-up has its own distinct look).

---

### User Story 2 - Active double shot fires two projectiles at once and doubles the on-screen projectile capacity (Priority: P1)

As a player with the double-shot effect active, every time I press the fire key — single tap or held burst — two projectiles leave the ship at once instead of one, and the game lets me keep up to twice as many projectiles on screen as normal. This makes my armed ship feel clearly more powerful and lets me sustain a denser wall of fire, without changing my ship's movement or the fire rhythm I already know.

**Why this priority**: The doubled output is the actual reward of the mechanic — the moment the player feels the power-up working. It's the core promised change ("cada vez que dispare saldrán dos proyectiles en lugar de uno") together with the doubled capacity ("aumenta temporalmente la cantidad de proyectiles por pantalla al doble").

**Independent Test**: Activate the effect (via US1 or a staged setup), then single-tap fire and count projectiles (exactly two per tap, both leaving in a symmetric V around the ship's heading at normal projectile speed); hold fire and verify the burst cadence is unchanged; fill the screen with projectiles and verify the pair is never split or refused for space while the effect lasts, with the doubled limit acting as the nominal operating capacity.

**Acceptance Scenarios**:

1. **Given** the double-shot effect is active and the ship is not at the projectile limit, **When** the player single-taps fire, **Then** exactly two projectiles are created simultaneously from the ship's position, diverging slightly in a symmetric V around the ship's heading (each at the normal projectile speed along its own heading, one each side of the aim line), and the recoil per shot behaves as in normal firing.
2. **Given** the effect is active and the fire key is held, **When** the burst continues, **Then** each firing tick of the same burst rhythm produces exactly two projectiles — the cadence and interval feel identical to normal firing.
3. **Given** the effect is active, **When** on-screen projectiles reach the doubled limit, **Then** shots continue: the full pair always fires (never split or refused for space while the effect lasts) and the count may briefly exceed the doubled limit — the excess is transient and the count settles back as projectiles disappear at borders or on impact.
4. **Given** the effect is active with several projectiles already flying, **When** the player compares capacity with the normal game, **Then** the nominal operating capacity is exactly twice the normal limit (a soft operating point: exceedances beyond it are transient and resolved only by natural projectile expiry, never by refusing or splitting a fired pair).
5. **Given** the effect is active, **When** the ship flies and rotates, **Then** the two projectiles of each shot always spread symmetrically around the ship's heading at the instant of firing — the pair is never launched around an old heading.

---

### User Story 3 - The effect ends when the player loses a life (Priority: P2)

As a player, the double shot is a temporary advantage, not a permanent upgrade: the moment I lose a life the effect ends. From my next firing input onward I'm back to the ordinary single shot and the ordinary projectile capacity, exactly as before I picked the power-up up. This keeps the game's difficulty meaningful — every reward has a cost if I get hit right after.

**Why this priority**: Termination defines the "temporary" nature the input explicitly requires ("El efecto termina cuando el jugador pierde una vida"); the game is complete and balanced even before this slice is polished, so it sits after the acquisition and firing slices.

**Independent Test**: Activate the effect, cause the ship to be destroyed and respawn (one life is lost), then fire again and verify a single projectile per shot and the normal refusal limit — restoration happens with no extra input beyond the death/respawn cycle.

**Acceptance Scenarios**:

1. **Given** the effect is active, **When** the ship is destroyed and the life is lost (death resolution completes), **Then** the double-shot effect ends at that instant.
2. **Given** the effect just ended by life loss and the ship has respawned, **When** the player fires, **Then** each shot produces exactly one projectile again and the on-screen projectile limit is back to the normal value.
3. **Given** projectile(s) still in flight when the life is lost, **When** the effect ends, **Then** those already-flying projectiles are not removed — they finish their normal life (disappear at borders or on impact); only new shots are single again.
4. **Given** the effect is active, **When** anything happens other than losing a life (time passing, picking more power-ups, borders, deaths of asteroids), **Then** the effect continues without interruption.

---

### Edge Cases

- What happens when the power-up object reaches a screen edge? It disappears, exactly like every other moving object (no wrap-around).
- What happens when the power-up overlaps a regular asteroid? Neither is destroyed, deflected or split by the other; the power-up is ignored by all regular-asteroid collision rules and does not count toward the asteroid population limit.
- What happens when the ship is immune (respawn blinking) and touches a power-up? It is still collected and activates the effect — immunity never protects against rewards, only against damage.
- What happens when a second power-up is collected while the effect is already active? No stacking: the effect simply remains active until the next life loss (a collected duplicate is just consumed).
- What happens when the effect ends while more than the normal number of projectiles are on screen? The excess projectiles already in flight stay until they naturally disappear; new shots only refuse once the count reaches the normal limit.
- What happens when the ship is destroyed while the effect is active but the player still earns a game over (last life)? The effect ends with the final life loss; nothing special persists beyond it.
- What happens when the drop happens during an asteroid-vs-asteroid collision or any other destruction that awards no points? The cause of destruction does not matter: a destroyed small asteroid can drop a power-up regardless of what destroyed it, and points are never involved in the drop.
- What happens when the player pauses the game (switches away) with the effect active? The effect is untouched by pauses — it continues when play resumes, and only a life loss can end it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST give each destroyed small asteroid an independent 10% probability of releasing one power-up object at that instant (approximately 1 drop per 10 destroyed small asteroids over many events).
- **FR-002**: System MUST release the power-up from the destroyed small asteroid's position, travelling in the same direction the small asteroid was moving at the moment of destruction, at that asteroid's current speed.
- **FR-003**: System MUST make the power-up object visually distinct from ordinary small asteroids so players can identify it at a glance.
- **FR-004**: System MUST let the ship collect the power-up by touching it (in any alive state, including post-respawn immunity), with no harm, no life change and no point change; collection consumes the power-up.
- **FR-005**: System MUST let any projectile collect the power-up by touching it, consuming both the projectile and the power-up, with no point change.
- **FR-006**: System MUST activate the double-shot effect at the instant of collection (by ship or by projectile).
- **FR-007**: While the effect is active, the system MUST fire exactly two projectiles simultaneously on every firing input, both created at the ship's position with a slight symmetric V-divergence around the ship's heading at the firing instant (one each side of the aim line, each travelling at the normal projectile speed along its own heading, never along the ship's old heading); the exact symmetric half-angle of the V is delegated to planning, small enough that both shots stay near the aim line.
- **FR-008**: While the effect is active, the system MUST keep the firing rhythm identical to normal firing (same cadence and burst behaviour) and MUST apply exactly one recoil of the normal magnitude per double shot — the fired pair costs the ship the same backward push as a single normal shot, never twice.
- **FR-009**: While the effect is active, the system MUST operate with a projectile capacity of twice the normal limit; the full pair is always fired (never split or refused for space while the effect lasts), so the count may transiently exceed the doubled limit and the excess is reabsorbed as the oldest projectiles disappear at borders or on impact — no additional hard ceiling is introduced while the effect lasts.
- **FR-010**: The effect MUST end exactly when the player loses a life (at the completion of the death sequence), restoring single-shot firing and the normal projectile limit immediately for all subsequent shots.
- **FR-011**: The system MUST keep projectiles already in flight when the effect ends until they naturally disappear; ending the effect never removes or converts them.
- **FR-012**: The power-up MUST ignore and be ignored by regular asteroids: no destruction, splitting, deflection or scoring with them, and it MUST NOT count toward the asteroid population limit nor affect spawn gating.
- **FR-013**: The power-up MUST disappear when it crosses any screen edge.
- **FR-014**: Collecting a power-up while the effect is already active MUST NOT stack the effect; the on-screen power-up is simply consumed and the active effect continues until the next life loss.
- **FR-015**: The double-shot effect MUST only end through life loss — it is unaffected by elapsed time, phase changes, screen pauses or additional collections.

### Key Entities *(include if feature involves data)*

- **Power-up object**: A transient, collectible screen object that appears rarely from destroyed small asteroids. Attributes: position, travel direction and speed (inherited from the destroyed asteroid at that instant), a distinct visual identity, and a state of either in-flight or collected. It despawns at borders and ignores regular asteroids.
- **Double-shot effect (ship state)**: A temporary condition of the player's ship bound to collection and cleared by life loss. While on, it changes firing output (two projectiles per shot) and capacity (doubled on-screen projectile limit). It has no score, life or movement side effects.
- **Small asteroid (existing)**: The sole drop source; its destruction instant and direction determine the power-up's spawn position and heading.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Over a large series of identical small-asteroid destructions, drops occur in approximately 1 in 10 events (no drifting rate, no memory between events).
- **SC-002**: In every drop event, the power-up appears at the former asteroid position and continues on the asteroid's exact direction of travel at the moment of destruction — never at another location or heading.
- **SC-003**: A player can obtain the double shot both by flying into the power-up and by shooting it; in both cases, from that instant forward, each firing input yields exactly two projectiles.
- **SC-004**: While the effect is active, 100% of firing inputs produce the full two-projectile pair (never split or refused for space); the nominal operating capacity is twice the normal value and any transient exceedance beyond it is reabsorbed only as projectiles disappear naturally.
- **SC-005**: In a playthrough where the player collects the power-up and then loses a life, firing after the respawn yields exactly one projectile per shot and the normal limit again — 100% of the time, with no leftover double shots after the loss.
- **SC-006**: The power-up's presence, collection and its activation/termination of the double shot never change the score, never harm the ship and never reduce lives by themselves.

## Assumptions

- The 10% probability is independent per destroyed small asteroid (no pity counter, no guarantee after N misses); the drop applies regardless of what caused the destruction (projectile, asteroid collision, any future cause).
- The power-up travels at the same speed the destroyed small asteroid had at the moment of destruction (the direction requirement in the input is honoured exactly; same speed is the natural companion since destroyed small-asteroid speeds are fixed by design).
- The power-up does not interact with regular asteroids at all (it passes over/through them, like the existing bonus-life ship does), does not count toward the tier cap and cannot be destroyed by them.
- The pair of projectiles in a double shot is launched from the ship's position with a slight symmetric V-divergence around the ship's heading (clarified: one projectile each side of the aim line); the exact half-angle is delegated to planning within the existing firing geometry.
- Re-collection while the effect is active does not stack or extend it: the duplicate is consumed with no additional effect (the effect's lifetime is tied purely to life loss).
- Power-ups are collectible through ship immunity (post-respawn blinking) and work during all active play phases; during the terminal game-over state no further collection matters since no life can be lost afterwards.
- No HUD indicator is added for the active effect in this feature: the doubled visible fire output itself communicates its state (extra meters/icons are out of scope under the simplicity principle unless evidence demands them).
- The effect's state resets cleanly only on life loss per the input; the existing pause/freeze behaviour (hidden tab) never activates or deactivates it.

---

*Assumptions above were made where the input was silent; they are reasonable defaults consistent with the game's existing bonus-life object behaviour and can be revisited before planning via clarification.*

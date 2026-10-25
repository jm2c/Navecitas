# Feature Specification: Visual Refresh — Emoji Ship/Collectibles, Textured Asteroids & Background, Audiowide Type

**Feature Branch**: `005-visual-refresh`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Hay que cambiar los gráficos del juego, para la nave y los powerups se pueden usar emojis, pero para los asterorides y el fondo hay que buscar po rinternet por texturas gratuitas que se puedan utilizar. La fuente también debe cambiar, puedes usar Audiowide de Google fonts"

## Context

The game is currently rendered with flat, monochrome vector silhouettes: the ship, asteroids, the double-shot power-up and the extra-life pickup all share the same white/green/gold geometric language, and every on-screen text uses the browser's default sans-serif. The requested change is a visual-only refresh: keep the game exactly as it plays, but replace the presentation so the ship and the collectibles read as recognizable emoji, the asteroids read as textured space rock, the playfield sits on a real space backdrop, and all typography uses Audiowide. No rule, hitbox, speed, score, spawn rate, timing or game state may change. This feature also establishes the asset-provenance rule that every imported texture/font must be free to use and its license recorded.

## Clarifications

### Session 2026-10-24

- Q: ¿Qué estilo visual deben tener las texturas de asteroides y fondo para que combinen con la nave y los power-ups en emoji? → A: Cartoon/semi-realista (pack CC0 tipo Kenney), coherente con los emojis y con buena legibilidad.
- Q: ¿La nave en emoji debe rotar con el rumbo de la nave o mantenerse siempre en la misma orientación? → A: Rotar con el rumbo, de modo que la punta del emoji apunte siempre hacia donde se mueve la nave.
- Q: ¿Los emojis de la nave y los power-ups deben mostrarse con la fuente de emojis nativa de cada sistema o con imágenes de emoji incluidas en el juego? → A: Imágenes emoji incluidas (Twemoji), para que el aspecto sea idéntico en todas las plataformas y funcione sin conexión.
- Q: ¿El fondo espacial debe quedarse quieto o moverse para dar sensación de desplazamiento? → A: Estático, sin desplazamiento ni parallax.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ship and collectibles read as recognizable emoji icons (Priority: P1)

As a player, when I look at the playfield I immediately recognize my ship as a rocket that points where I am heading, the double-shot reward as a distinct "power" symbol, and the extra-life pickup as a distinct "life" symbol. Their icons rotate/track movement the same way the old shapes did, and they never become confused with an asteroid.

**Why this priority**: The ship is the object the player controls every second of the game, and the collectibles are the objects the player must recognize in motion to decide whether to chase them. This is the most visible part of the requested change.

**Independent Test**: Start a game and observe the ship while rotating and thrusting; then force or collect each drop type and verify that the ship, the double-shot item and the life item are each displayed as their own recognizable emoji, oriented correctly and distinguishable from asteroids and from each other.

**Acceptance Scenarios**:

1. **Given** the game is running, **When** the ship moves or rotates, **Then** it is drawn as a rocket-style emoji that stays aligned with the ship's current heading (the rocket's nose points in the direction the ship is facing) and remains centered on the ship's position.
2. **Given** the ship is active, **When** the player looks at the ship, **Then** the icon's size matches the ship's current visual footprint closely enough that contact with asteroids and collectibles still looks fair and unchanged.
3. **Given** a double-shot power-up is on screen, **When** the player sees it, **Then** it is drawn with its own emoji symbol, distinct from the ship's emoji, from the life pickup's emoji, and from every asteroid size.
4. **Given** an extra-life pickup is on screen, **When** the player sees it, **Then** it is drawn with its own emoji symbol, distinct from the double-shot item and from the ship, and is recognizable at a glance.
5. **Given** the player has collected double-shot or life items and the ship respawns, **When** the HUD reserve-life icons are displayed, **Then** they use the same life-symbol visual language so the player can relate them to the life pickup.
6. **Given** a bundled emoji image fails to load or is unavailable for any reason, **When** the game is displayed, **Then** the affected object falls back to a clearly visible alternative and remains distinguishable from every other object (the game never shows an empty or invisible ship/collectible).

---

### User Story 2 - Asteroids read as textured space rocks at every size (Priority: P1)

As a player, each asteroid looks like a real piece of space rock rather than a flat white polygon. I can still tell small, medium and large asteroids apart by appearance, and the rock rotates as it tumbles so the field feels alive. The visual change must not make asteroids harder to see or to judge for collisions.

**Why this priority**: Asteroids are the main obstacle and the main target of the game. Replacing their look while keeping them readable is the core of the "change the graphics" request.

**Independent Test**: Spawn or stage one asteroid of each size, observe them while they rotate and travel, shoot them to confirm the existing split chain still produces visually corresponding fragments, and verify that the small/medium/large identities remain distinguishable and that collision outcomes are unchanged.

**Acceptance Scenarios**:

1. **Given** any asteroid is on screen, **When** it is displayed, **Then** it is rendered with a free-to-use rock texture image rather than a flat geometric silhouette.
2. **Given** a small, a medium and a large asteroid are on screen together, **When** the player compares them, **Then** all three look like the same family of space rock but remain clearly distinguishable by size (and, if desired, by variant) at a glance.
3. **Given** an asteroid is tumbling, **When** time passes, **Then** its texture rotates with it at the same rotation speed the old shape used, and the rotation looks continuous (no snapping, shimmering or visible seams).
4. **Given** a medium or large asteroid is destroyed and splits, **When** the fragments appear, **Then** each fragment uses the textured appearance appropriate to its new size, so the split chain is visually obvious.
5. **Given** any asteroid, **When** the player judges a near miss or a hit, **Then** the visible rock footprint matches the existing collision behavior: the refresh does not make hits or misses look unfair, and no collision rule changes.
6. **Given** the asteroid texture fails to load for any reason, **When** the game is displayed, **Then** asteroids still appear as a clearly visible placeholder and the game continues normally.

---

### User Story 3 - The playfield sits on a space background (Priority: P2)

As a player, the black void is replaced by a space backdrop — stars and/or a nebula — that gives depth to the scene without competing with the ship, asteroids, projectiles or HUD. It fills the entire play area at any window size and keeps the game playable and readable.

**Why this priority**: The background sets the mood and completes the visual overhaul, but the game is fully playable without it, so it ranks after the objects the player interacts with.

**Independent Test**: Load the game at several window sizes (including the minimum 800×600 window and a maximized window) and verify that the backdrop covers the whole visible playfield with no gaps, bands, stretching artifacts or black borders, and that all gameplay objects remain easy to see against it.

**Acceptance Scenarios**:

1. **Given** the game is displayed, **When** the backdrop is shown, **Then** it is a space-themed texture (starfield/nebula or similar) sourced from a free-to-use asset, not a flat solid color.
2. **Given** the player resizes the browser window or the game canvas scales, **When** the new size is drawn, **Then** the backdrop covers the entire play area uniformly, maintaining its intended appearance and without distortion that makes it look broken.
3. **Given** the backdrop is behind the action, **When** the player tracks the ship, asteroids, projectiles, collectibles and text, **Then** every gameplay element and every text remains clearly legible; the backdrop does not hide, camouflage or visually merge with them.
4. **Given** the background asset fails to load, **When** the game is displayed, **Then** the playfield falls back to a plain dark background and the game remains fully playable.

---

### User Story 4 - All on-screen text uses Audiowide and stays legible (Priority: P2)

As a player, every piece of text in the game — score, start prompt, countdown numbers/GO, and game-over message — is displayed in the Audiowide typeface. It feels consistent with the refreshed sci-fi look and remains readable at every size used by the game, including long scores.

**Why this priority**: Typography completes the identity of the refresh and is explicitly requested, but it does not affect whether the game can be played.

**Independent Test**: Play from start screen through countdown, gameplay and game over, and verify that each text element is visually rendered in Audiowide (or the provided fallback when the font cannot be loaded), with no clipping, overlap or unreadable sizing.

**Acceptance Scenarios**:

1. **Given** the start screen is displayed, **When** the prompt is visible, **Then** it is rendered in Audiowide.
2. **Given** a countdown is running, **When** "3", "2", "1" and "GO" are shown at their animated sizes, **Then** they are rendered in Audiowide and remain fully inside the playfield without clipping.
3. **Given** gameplay is in progress, **When** the score and reserve-life indicators are shown, **Then** the score text is rendered in Audiowide and remains readable as the score grows (including the largest score values the game can produce).
4. **Given** the game is over, **When** the game-over message is shown, **Then** it is rendered in Audiowide and remains centered and legible.
5. **Given** Audiowide cannot be loaded in the player's environment, **When** any text is displayed, **Then** a legible fallback typeface is used automatically; text never becomes invisible, clipped or unreadable because of the font change.

---

### Edge Cases

- **Emoji image load failure**: because the emojis are bundled image assets, a missing or failed image must fall back to a clearly visible alternative; the game must never render an invisible or unidentifiable ship, power-up or life pickup.
- **Emoji color/contrast**: full-color bundled emoji images can visually clash with or disappear into the background. The ship and collectibles must remain clearly visible against the chosen backdrop, and the backdrop must not contain bright regions that camouflage them.
- **Texture load failure or slow load**: if a texture cannot be loaded, the game must continue with a visible placeholder/fallback rather than showing invisible or broken objects.
- **Window resize / DPR scaling**: the backdrop and textured asteroids must remain crisp and correctly positioned at the minimum 800×600 window, on high-DPI screens, and when the canvas is scaled up or down.
- **Rotation seams and clipping**: an asteroid texture rotated arbitrarily must not show gaps, hard seams or clipped corners, and must not overflow its collision footprint noticeably.
- **Font loading failure or slow load**: text must use a fallback immediately and switch to Audiowide when available, without ever disappearing or reflowing into clipping.
- **Audiowide is wider than the current font**: score, countdown, prompt and game-over text must fit their positions and not overlap each other or the playfield edges at any supported size.
- **Long score values**: the score area must remain readable for the full range of scores the game can reach.
- **Collectible vs. asteroid confusion**: with two emoji collectibles and textured asteroids, every type must remain instantly distinguishable in motion.
- **Offline availability**: once the game is served, it must remain fully playable and correctly styled without requiring a live third-party asset request.
- **Asset licensing**: no asset may be used unless its license permits free use (including redistribution with the game); required attribution must be recorded where the license demands it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The player ship MUST be rendered as a bundled rocket emoji image that rotates together with the ship, aligned so its nose follows the ship's current heading, centered on the ship's position, and sized so it matches the existing ship footprint closely enough that collision perception is unchanged.
- **FR-002**: The double-shot power-up MUST be rendered as its own bundled emoji image, visually distinct from the ship, from the extra-life pickup and from all asteroid sizes.
- **FR-003**: The extra-life pickup (the existing special object) MUST be rendered as its own bundled emoji image, visually distinct from the double-shot power-up and from the ship.
- **FR-004**: The reserve-life HUD icons MUST use the same bundled life-symbol image language as the extra-life pickup so the relationship is obvious.
- **FR-005**: All regular asteroids MUST be rendered with free-to-use rock texture imagery in a cartoon/semi-realistic style (coherent with the emoji ship and collectibles) instead of flat geometric silhouettes, and the visible rock footprint MUST correspond to the existing collision radii for small, medium and large asteroids.
- **FR-006**: Each asteroid size (small, medium, large) MUST remain visually distinguishable from the other sizes at a glance, and the texture MUST rotate together with the asteroid's existing spin.
- **FR-007**: When an asteroid is destroyed and splits, each fragment MUST be rendered with the textured appearance appropriate to its resulting size.
- **FR-008**: The playfield MUST use a static, free-to-use space-themed background texture (starfield and/or nebula) in the same cartoon/semi-realistic style that covers the entire visible play area at every supported window size, including the minimum 800×600 window and scaled/high-DPI displays; no scrolling, drift or parallax effect is required.
- **FR-009**: The background MUST NOT reduce the legibility of the ship, asteroids, projectiles, collectibles, HUD or text; gameplay elements must remain clearly visible against it.
- **FR-010**: All on-screen text — score, start prompt, countdown ("3", "2", "1", "GO") and game-over message — MUST be rendered in the Audiowide typeface.
- **FR-011**: The game MUST provide an automatic legible fallback typeface when Audiowide cannot be loaded, so no text ever becomes invisible, clipped or unreadable.
- **FR-012**: The game MUST display a visible fallback (placeholder shape or equivalent) for any ship, collectible, asteroid or background whose emoji/texture cannot be rendered or loaded; no gameplay element may become invisible or unusable.
- **FR-013**: Every imported visual asset (asteroid textures, background texture, emoji images, Audiowide font) MUST be free to use, including redistribution as part of this game, and its source plus license MUST be documented in the project; any attribution required by a license (e.g., CC-BY 4.0 for Twemoji) MUST be included.
- **FR-014**: Once served, the game MUST remain fully playable and correctly styled offline, without requiring a live request to a third-party asset host for textures, emoji images or fonts.
- **FR-015**: The visual refresh MUST NOT change any gameplay behavior: the 800×600 logical world, collision radii and rules, movement, speeds, firing, spawn cadence, asteroid splitting, scoring, lives, drop chances, timings, phases and terminal states MUST remain exactly as they are today.
- **FR-016**: The visual refresh MUST NOT introduce any new runtime dependency, framework or build/transpilation step; the game remains dependency-free as defined by the project constitution.
- **FR-017**: The refresh MUST preserve the existing distinction between regular asteroids and collectibles so that, in motion, the player can tell at a glance which objects are dangerous and which are rewards.
- **FR-018**: The game MUST remain smooth at its current frame rate after the refresh; no visible stutter, flicker or loading stall may be introduced during normal play.
- **FR-019**: The ship and collectible emojis MUST be delivered as bundled image assets (Twemoji or equivalent) so their appearance is identical across operating systems and browsers and does not depend on the platform's emoji font.

### Key Entities *(include if data involved)*

- **Emoji visual mapping**: the chosen bundled emoji image for each of the three player-facing objects (ship, double-shot power-up, extra-life pickup), plus the HUD reserve-life icon; each mapping must be unambiguous and visually distinct from the others, with the same image used on every platform.
- **Asteroid texture asset**: a free-to-use rock image (or set of size-specific images) with recorded source and license; it is rotated and scaled to the existing small/medium/large collision footprints.
- **Background texture asset**: a free-to-use space backdrop with recorded source and license; it fills the whole play area without introducing gameplay effects.
- **Audiowide font asset**: the display typeface used for all text, with its license (SIL Open Font License 1.1) documented; a fallback typeface covers unavailable/failed loading.
- **Asset provenance record**: a project-level record identifying each imported asset's source, license and any required attribution.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a visual review of normal play, the ship, the double-shot power-up and the extra-life pickup are each identifiable as their intended emoji in 100% of observations, with zero cases of one being mistaken for another.
- **SC-002**: In a visual review containing small, medium and large asteroids together, the three sizes are correctly identified in at least 95% of observations, and no asteroid is mistaken for a collectible.
- **SC-003**: 100% of on-screen text locations (start prompt, countdown, score, game over) render in Audiowide when it is available, and remain readable with no clipping or overlap at the minimum 800×600 window.
- **SC-004**: The background fills 100% of the visible playfield at the minimum window, at a maximized window, and on a high-DPI display, with no uncovered bands, black borders or visible stretching artifacts.
- **SC-005**: At least 95% of players/reviewers can correctly answer "which asteroid is largest?" and "which object is a reward?" within one second of looking at a screenshot of active play.
- **SC-006**: The refreshed game shows no visible frame-rate degradation compared with the current version during a representative play session.
- **SC-007**: 100% of imported assets have a documented, verified free-to-use license and source; zero assets lack provenance.
- **SC-008**: With the network disconnected after the game has been served, 100% of textures, emojis/fallbacks and typography still display correctly and the game remains fully playable.
- **SC-009**: All existing automated tests pass unchanged after the visual refresh, and the complete manual gameplay checklist shows no behavioral difference from the pre-refresh game.

## Asset Sourcing Notes (Research Findings)

The following free-to-use sources were identified while researching the request. Final selection happens during planning; the binding rule is the license/provenance requirement (FR-013), not any single source.

- **Kenney — Space Shooter Redux / Space Shooter Extension**: CC0 1.0; large 2D space pack including asteroid sprites, backgrounds and effects; commercial use allowed, attribution not required. Good candidate for a coherent asteroid + background style.
- **OpenGameArt — "Asteroid Tileset 01" (OhjiroChan)**: CC0; asteroid sprites in three sizes with rotation frames, well suited to the existing small/medium/large geometry.
- **OpenGameArt — "Starfield background" (Sauer2)**: CC0; horizontally seamless starfield.
- **OpenGameArt — "Space Backgrounds 7/8/9" (Rawdanitsu)**: CC0/public domain; starfields and nebulae, several tiled variants.
- **OpenGameArt — "Pixel Space Background" (ZaninDevelopers)**: CC0; small, tileable, lightweight space background.
- **NASA SVS starfield imagery**: public domain (per NASA media usage guidelines); suitable as a backdrop source.
- **Audiowide (Astigmatic / Brian J. Bonislawsky), Google Fonts**: SIL Open Font License 1.1; free to bundle and redistribute with the game; attribution/license text must be preserved.
- **Twemoji (Twitter Emoji), open-source emoji artwork**: CC-BY 4.0; bundled SVG/PNG images give identical emoji appearance across platforms and work offline; attribution must be included in the project's asset credits.

**Selected direction**: cartoon/semi-realistic assets, preferring a single CC0 source (e.g., Kenney) for asteroids and background to keep the art style coherent with the emoji ship and collectibles, with the OpenGameArt CC0 options as fallbacks if the chosen files do not fit the 800×600 playfield or the required size distinction.

---

## Assumptions

- "Powerups" includes both existing collectible types — the double-shot power-up and the extra-life pickup — so both get emoji treatment; the HUD reserve-life icons follow the life symbol.
- Default emoji choices are: rocket for the ship, a lightning/spark symbol for the double-shot power-up, and a heart symbol for the extra-life pickup. These are defaults, not hard requirements; they may be swapped for clearer alternatives without changing the feature.
- Projectiles keep their current simple appearance; the request named the ship and power-ups for emoji and asteroids/background for textures, so projectile restyling is out of scope.
- The background is a static space texture (fixed, possibly seamlessly tiled to fill the play area); scrolling, drift and parallax animation are explicitly out of scope.
- The ship and collectible emojis will be bundled Twemoji (CC-BY 4.0) image assets rather than platform emoji-font glyphs, guaranteeing the same appearance on every platform and offline; attribution is included in the project's asset credits.
- The Audiowide font will be bundled with the game (from Google Fonts, under the SIL Open Font License) so that the game remains fully playable offline; an external live font request is not required at play time.
- Texture assets will be CC0/public-domain by preference; if a CC-BY asset is chosen, the required attribution will be recorded in the project.
- The existing 800×600 logical world and all gameplay rules are frozen; this is a presentation-only change.
- The current automated test suite and manual checklist remain the behavioral safety net; no test expectations about gameplay should need to change.
- No audio, persistence, mobile controls or other features are added; the simplicity principle remains in force.

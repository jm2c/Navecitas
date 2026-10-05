# Research: Space Asteroid Game (Phase 0)

**Feature**: `001-space-asteroid-game` | **Date**: 2026-10-04

All `NEEDS CLARIFICATION` items from the Technical Context are resolved below. Decisions are binding for implementation.

---

## R1 — Base speed and tuning constants

**Decision**: Single shared `BASE_SPEED = 200 px/s` in `src/config.js`, with every spec ratio derived from it:

| Constant | Value | Derivation |
|---|---|---|
| `BASE_SPEED` | 200 px/s | reference unit |
| Ship forward cap | 260 px/s | 1.3 × base (FR-001) |
| Ship backward cap | 60 px/s | 0.3 × base (FR-006) |
| Recoil step | 30 px/s | 0.15 × base (FR-006) |
| Projectile speed | 300 px/s | 1.5 × base (FR-005) |
| Thrust accel | 180 px/s² | reaches cap in ≈1.44 s |
| Brake decel | 260 px/s² | braking is snappier than thrusting |
| Rotation speed | π rad/s | 180°/s → half turn per second |
| Burst shot interval | 160 ms | "short fixed interval" (FR-007) |
| Spawn attempt cadence | 1400 ms ± 300 ms | "spawn cadence" tuning constant |
| Asteroid spin | 0.4–1.2 rad/s random | visual only |
| Radii | ship 16, proj 3.5, small 14, medium 26, large 44, special 14 | collision circles |

**Rationale**: 200 makes all spec multiples exact integers (30 / 60 / 260 / 300) so SC-012 (`0.15×` steps) is verifiable by inspection; crossing the 800 px field at cap takes ~3 s — fast enough to feel responsive, slow enough to aim.

**Alternatives considered**: 240 px/s (feels livelier, but 1.3×/0.15× produce non-round numbers → harder to assert in tests); 150 px/s (too sluggish at 60 FPS).

---

## R2 — Constant 60 FPS loop

**Decision**: **Fixed-timestep accumulator driven by `requestAnimationFrame`** in `src/loop.js`:

- `DT = 1000/60` ms is the only timestep the simulation ever sees (`update(DT)`).
- Each `rAF` callback: `delta = min(now − last, 250)` (clamp guards tab-switch spikes → no spiral of death), add to accumulator, `while (acc >= DT) { update(DT); acc -= DT; }`.
- **Render exactly once per rAF only if ≥1 update ran** → on a 120/144 Hz display the simulation still advances at exactly 60 Hz and the output cadence is 60 FPS, not 120/144.
- All gameplay timers (500 ms death, 2 s immunity, 0.5 s countdown hold, 160 ms burst) accumulate in simulated milliseconds inside `update`, so they stay correct regardless of display refresh rate.
- **Freeze while hidden (FR-033)**: a `visibilitychange` listener pauses the loop (no `update`, no render, accumulator reset to 0 and `last` re-baselined on return) → 0 s of game time is consumed while the tab is hidden, so countdown holds, the death delay and immunity keep their exact remaining time (SC-016).

**Rationale**: Gives a *constant* 60 FPS simulation — the requirement — while riding the browser's vsync; physics is deterministic and unit-testable (pure `update(DT)` calls with no clock).

**Alternatives considered**: `setInterval(16.67)` — throttled in background tabs, drifts, no vsync sync; variable `dt` per frame — non-deterministic, breaks exact-timing scenarios (SC-006, SC-015); rendering every rAF without gating — visible speed-up on 144 Hz displays (violates "constante de 60FPS").

---

## R3 — Viewport scaling (FR-026…FR-028, SC-013, SC-014)

**Decision**: **Fixed-ratio bitmap + uniform CSS scale**:

- Canvas **backing store is always `800·dpr × 600·dpr`** device pixels (`dpr = devicePixelRatio`), drawn with `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` so all game code works in exact 800×600 logical units.
- Display scale `s = max(1, min(innerWidth/800, innerHeight/600))`; CSS size = `800·s × 600·s` px. Recomputed on `resize`.
- `s` is one scalar applied to both axes → **0 % distortion, 4:3 always exact** (SC-014).
- `s ≥ 1` always: larger windows upscale, windows smaller than 800×600 keep `s = 1` and the `body` has `min-width: 800px; min-height: 600px` → browser shows scrollbars (FR-027).
- Leftover window space = the `body` background (**plain black**, same as the game background) — no letterbox stripes of a different colour.

**Rationale**: Deriving both CSS dimensions from a single scalar makes distortion mathematically impossible; keeping the bitmap at a fixed 4:3 avoids the sub-pixel rounding that integer device-pixel rounding would introduce.

**Alternatives considered**: scaling the backing store to `round(800·s·dpr)` — introduces ≤0.02 % aspect error (technically violates SC-014's "0 distortion"); `ctx.scale(s)` in logical units only (bitmap stays 800×600 CSS-px) — blurry on large screens; CSS `transform: scale()` — same blur, plus it complicates coordinate/hit testing.

---

## R4 — How the game is served / module loading

**Decision**: **Native ES modules** (`<script type="module" src="./src/main.js">`) served by a **project-owned Node.js static server**: `server.js` built on the built-in `node:http` module (zero dependencies), started with `node server.js`. `package.json` declares **zero dependencies** (only `"type": "module"` and a `test` script).

Stakeholder constraint: **the server must be Node.js, never Python** (clarified 2026-10-04); Python's `http.server`, `npx serve` and any other external package server are excluded.

**Rationale**: Modules keep the logic/render split enforced by the file system; browsers block module loading over `file://`, so a 5-line Node static server is the cheapest correct answer and keeps the whole toolchain inside the one runtime the stakeholder mandated. No build step, no `npm install` → the user's "sólo JavaScript vainilla" constraint holds literally.

**Alternatives considered**: `python3 -m http.server` — rejected by explicit stakeholder constraint; single concatenated `<script>` file — no module boundaries, unmaintainable at ~10 files; a bundler (esbuild/vite) or `npx serve` — adds a dependency and a build/install step; `file://` with classic scripts — cannot import, would force one giant file.

---

## R5 — Test strategy (was NEEDS CLARIFICATION)

**Decision**: **`node --test` (Node ≥ 20 built-in runner) against the pure core**, plus a manual browser checklist.

- `src/state.js`, `entities.js`, `update.js`, `collision.js`, `spawn.js`, `score.js` import **no browser API** (no `window`, `document`, `performance`, `canvas`) → they load directly in Node as ESM.
- Tests drive the simulation by calling `update(state, DT)` N times and asserting on state — deterministic, no clock, no rendering.
- `render/`, `input.js`, `loop.js`, `main.js` are browser-only and validated manually via `quickstart.md`.
- `npm test` → `node --test tests/`.

**Rationale**: Full coverage of the rules-heavy requirements (score arithmetic, tiers, caps, recoil clamping, bonus spawns) at zero dependency cost; the visual layer has no meaningful headless assertion surface without pulling in a browser automation dependency, which is forbidden.

**Alternatives considered**: Jest/Vitest — npm dependencies (violates constraint); Playwright/Puppeteer — heavy dependency + browser download; tests only in the browser — no automation, no regression safety.

---

## R6 — Spawn-mix proportions per tier (spec silent → design constant)

**Decision**: Weighted random pick at each spawn attempt (does not affect any specified number — only *which* sizes appear):

| Tier (score) | Small | Medium | Large | Cap |
|---|---|---|---|---|
| 0 – 1000 | 100 % | — | — | 3 |
| > 1000 – 2000 | 60 % | 40 % | — | 3 |
| > 2000 – 3000 | 40 % | 35 % | 25 % | 5 |
| > 3000 | 30 % | 35 % | 35 % | 7 |

Speed multipliers and caps are exactly FR-010; "not spawned" sizes get weight 0. The special asteroid is excluded from this table and from the cap (spec Assumptions).

**Rationale**: Smooth ramp — the player meets medium asteroids shortly after 1000 and large ones after 2000, matching the tier narrative; weights are a single config object, trivially tunable. **Confirmed by clarification on 2026-10-04** (option A) and now binding in FR-010.

**Alternatives considered**: equal weights — floods the screen with large rocks immediately at 2001; sequential spawn (small→medium→large) — reads as a phase change rather than a curve.

---

## R7 — Animation timings not fixed by the spec

**Decision** (all in `config.js`; only 500 ms / 2000 ms / 0.5 s are spec-fixed):

| Timing | Value | Where |
|---|---|---|
| Start text slow blink | 600 ms on / 600 ms off | FR-030 |
| Countdown shrink | 350 ms, ease-out cubic, from font 1400 px (bigger than screen) → 64 px | FR-031 "shrinks very fast" |
| Countdown hold | **500 ms** (spec) | FR-031 |
| Countdown item position | centred, baseline ≈ y 380 (ship centre 300 + 80 → below the ship, no overlap) | FR-031 |
| "Go" exit | 450 ms: 64 px → 2400 px while alpha 1 → 0 (linear fade) | FR-032 |
| Explosion | plays during the **500 ms** ship-absence window (8 radial-burst frames) | FR-018 |
| Immunity blink | 160 ms period (80 visible / 80 hidden), **2000 ms** total | FR-018 |
| Game Over type | bold 140 px, centred, white | FR-024 |

**Rationale**: 350 ms shrink reads as "very fast" at 60 FPS (21 frames) while remaining visible; 64 px is roughly the ship's 32 px length ×2 so it is legible without covering the ship at y 380.

**Alternatives considered**: linear shrink (harsh stop at the end); shrinking to 32 px (too small to read); overlapping the ship (spec forbids it).

---

## R8 — Collision model

**Decision**: **Circle-vs-circle** bounding radii (table in R1), resolved once per simulation step in a fixed order:

1. projectiles × asteroids (first hit consumes the projectile; regular → size rule + score, special → life, no score)
2. ship × special (always collected, never harmful)
3. ship × regular (only if alive, not immune, not in the 500 ms death window)
4. regular × regular (same size rule, **no** score; each colliding pair processed once, both members may resolve)

The special asteroid is skipped by every asteroid-asteroid and ship-damage rule (passes over everything). Multi-hit edge case: a projectile may only consume one asteroid per instant (spec Assumption), but the *next* projectile in the same step may hit another.

**Rationale**: Circular bounds are exact enough for procedural rocks/ships, O(n²) is trivial at ≤7 asteroids + 5 projectiles + 1 special (≤13 bodies), and the fixed order makes outcomes deterministic for tests.

**Alternatives considered**: separating-axis / polygon collision — needless complexity for round-ish shapes; spatial partitioning — overkill at ≤13 bodies.

---

## R9 — Score, lives and bonus-spawn bookkeeping

**Decision**:
- `score` is monotonically non-decreasing; helpers `addScore(state, pts)` return the newly crossed 500-multiple flag: `floor(prev/500) < floor(next/500)` → spawn **at most one** special asteroid (max single award is 200 < 500, so at most one multiple can be crossed per event).
- `lives` = total ships (start **3**, hard cap **6**); HUD icons = `lives − 1` (start **2**, cap **5**) — FR-017.
- Death with `lives − 1 ≥ 1` → `lives--`, respawn sequence; death with icons already 0 → **game over**.
- If reserve is already at 5 icons when a 500 multiple is crossed → **no spawn, no queue** (spec edge case).
- Special grant is `lives = min(lives + 1, 6)` — also applies when the 5-icon cap is already reached by contact (consumed, life not added beyond cap).

**Rationale**: `floor(Δ/500)` comparison is branch-free and directly encodes the "400 → 600 spawns exactly one" edge case; keeping `lives` as the source of truth with icons derived avoids off-by-one drift between HUD and rules.

**Alternatives considered**: storing `reserve` separately and deriving total — two sources of truth that can desync with the 6-life cap.

---

## R10 — Game-phase machine

**Decision**: `state.phase ∈ {START, COUNTDOWN, PLAYING, DYING, GAME_OVER}` with `state.countdown ∈ {3,2,1,GO}` and per-phase update gates:

| Phase | Ship input | Asteroid spawn | Asteroids simulate | Collisions w/ ship |
|---|---|---|---|---|
| START | ignored (only Space → COUNTDOWN) | no | none exist | no |
| COUNTDOWN ("3","2","1") | ignored | no | none exist | no |
| COUNTDOWN ("GO" exit anim) | ignored until anim ends | no | none exist | no |
| PLAYING | yes | yes (cadence + cap) | yes | yes |
| DYING (500 ms) | no | yes | yes | no (ship absent) |
| GAME_OVER | no (reload only) | yes | yes | ship gone |

"Game Over" text and the start/countdown overlays are drawn *after* the world, purely in the render layer → they can never be collided with (FR-025).

**Visibility gate (FR-033, clarification 2026-10-04)**: the table above only applies while the document is visible. When the tab is hidden the loop stops calling `update()` entirely, so **every phase freezes where it is** (a countdown mid-hold keeps its remaining time, `DYING` keeps its remaining 500 ms, immunity keeps its remaining seconds) and resumes unchanged on return — 0 s of game time is consumed while hidden (SC-016).

**Rationale**: Makes FR-030/FR-031/FR-032/FR-025 enforceable by construction — the update gates, not the renderer, decide what runs.

**Alternatives considered**: boolean flags (`started`, `gameOver`, `frozen`) — overlapping flags invite contradictory states (e.g. game over + countdown).

---

## Open items: none

Every `NEEDS CLARIFICATION` in the Technical Context has a decision above (R1–R10). The `/speckit.clarify` session of 2026-10-04 raised five further points — Node.js `server.js` (R4), per-tier spawn mix (R6), freeze on hidden tab (R2/R10), English UI strings and no FPS widget (render contract) — and all five are now resolved and reflected in this document, the spec and the design artifacts. No external integrations exist (static page, no APIs), so no integration-pattern research is required.

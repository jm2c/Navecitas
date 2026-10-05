# Contract: Keyboard Input

**Consumer**: player. **Producer**: `src/input.js`. Target: physical keyboard, desktop browsers.

## Keys

| Key | `event.code` | Effect in `START` | Effect in `COUNTDOWN` | Effect in `PLAYING` / `DYING` | Effect in `GAME_OVER` |
|---|---|---|---|---|---|
| ← | `ArrowLeft` | ignored | ignored | rotate ship counter-clockwise (π rad/s) | ignored |
| → | `ArrowRight` | ignored | ignored | rotate ship clockwise (π rad/s) | ignored |
| ↑ | `ArrowUp` | ignored | ignored | thrust along nose, clamp 260 px/s | ignored |
| ↓ | `ArrowDown` | ignored | ignored | brake toward 0, **never below 0** | ignored |
| Space | `Space` | starts the 3‑2‑1‑GO countdown | ignored (holding it is remembered; burst fire begins after "Go") | burst-fire: one shot per 160 ms while held, max 5 projectiles on screen; a single tap = exactly 1 shot | ignored (reload the page only) |
| any other key | — | no effect | no effect | no effect | no effect |

## Rules

1. **Only `event.code` is read** — layout-independent (works on non-US keyboards).
2. `keydown` with `event.repeat === true` is ignored for edge-triggered actions (starting the countdown, a single tap shot); held state is tracked by a `Set` of pressed codes.
3. `ArrowLeft/Right/Up/Down` and `Space` **always call `preventDefault()`** so the page never scrolls (essential because the page may show scrollbars, FR-027).
4. Key state is cleared (`blur`/`visibilitychange`) so a released key held while switching tabs does not stick.
5. Input is polled **once per simulation step** (`update(DT)`), never inside the renderer → identical behaviour at any display refresh rate.
6. There is no restart key — after `GAME_OVER` only a page reload starts a new session (FR-029).

## Out of scope

Mouse, touch, gamepad, remapping, mobile controls (spec Assumptions).

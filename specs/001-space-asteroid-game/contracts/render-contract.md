# Contract: Canvas Rendering & Display Scaling

**Consumer**: the browser/display. **Producer**: `src/main.js` (sizing) + `src/render/*` (pixels). API used: Canvas 2D only — no SVG, no DOM elements for game objects.

## 1. Colour palette (fixed)

| Element | Colour | Where |
|---|---|---|
| Page background + canvas clear | `#000000` (black) | whole viewport, play area |
| Ship, projectiles, asteroids, HUD text, life icons, "Game Over", countdown, start prompt | `#FFFFFF` (white) | all game objects |
| **Special life-granting asteroid** | soft green `#7ED9A0` (fill) with `#A8EBC4` highlight | ship-shaped variant only |
| Explosion flash (transient) | white, alpha 1 → 0 | 500 ms death window |

No other colours are drawn. Objects are solid white procedural polygons/rects on pure black.

## 2. Logical space

- **Every coordinate in game code is logical**: `x ∈ [0, 800]`, `y ∈ [0, 600]`. The play area, wrap edges, spawn/despawn borders and HUD corners are all defined in this space (FR-026).
- The canvas backing store is exactly `800·dpr × 600·dpr` device pixels with `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`, so drawing code never knows about `dpr`.

## 3. Sizing & scaling (must hold at all times)

```
dpr = devicePixelRatio                                  (≥1)
s   = max(1, min(window.innerWidth / 800,
                 window.innerHeight / 600))             recomputed on resize
canvas.width  = 800 * dpr      (backing store, constant ratio 4:3)
canvas.height = 600 * dpr
canvas.style.width  = (800 * s) + "px"
canvas.style.height = (600 * s) + "px"
body { min-width: 800px; min-height: 600px; background: #000; }
```

Guarantees:
- **Same `s` on both axes → aspect ratio stays exactly 4:3, 0 % distortion** (SC-014).
- `s ≥ 1` → the display is never smaller than 800×600; on a smaller viewport the page keeps its minimum size and the browser shows scrollbars (FR-027).
- Leftover window space is filled by the plain black body background (FR-028).

## 4. Draw order (per rendered frame)

1. `fillRect(0, 0, 800, 600)` with `#000000` (full clear, no trails).
2. World: projectiles → asteroids (regular + special) → explosion → ship (skipped when destroyed; blink-hidden while immune).
3. HUD: score (top-right, right-aligned at x 784 / y 36), life icons (top-left from x 16 / y 16). **These two elements are the entire HUD** — no FPS counter, no debug overlay (spec Assumptions; frame rate is measured with the browser's performance tools).
4. Overlays last: start prompt / countdown item / "Game Over". All overlay strings are English exactly as written in the spec ("Press spacebar to start", "Game Over", "3", "2", "1", "Go").

Overlays are drawn **after** the world and are never registered in collision data → they can neither block nor be deflected by asteroids (FR-025).

## 5. Frame cadence

- Render happens at most once per `requestAnimationFrame`, and **only when at least one 16.6667 ms update ran** → constant 60 FPS output on 60/120/144 Hz displays.
- **While the tab is hidden nothing runs at all**: no `update`, no render, no timers (FR-033) — the renderer is re-invoked only after `visibilitychange` makes the page visible again.
- No `setInterval`, no variable-dt animation: every animation timer is simulated milliseconds inside `update()`.

## 6. Required glyphs

| Glyph | Representation |
|---|---|
| Ship | white isoceles triangle (nose along `angle`), radius 16 |
| Projectile | white 7×3 px rectangle oriented by its velocity vector |
| Asteroid S/M/L | procedural 10-vertex polygon from `seed`, radius 14/26/44, rotated by `rot` |
| Special | ship silhouette in soft green (same geometry as ship), radius 14 |
| Life icon | small white ship triangle (12 px), one per reserve life |
| Explosion | 8 white segments/burst polygons fading over the 500 ms window |

Fonts: system sans-serif, `bold` for countdown / "Game Over", regular for HUD — no web fonts, no external assets.

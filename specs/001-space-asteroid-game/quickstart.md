# Quickstart & Validation: Space Asteroid Game

How to run the game and prove each requirement end-to-end. No implementation details — see [data-model.md](./data-model.md) and [contracts/](./contracts/) for the *what*, [tasks.md](./tasks.md) for the *how*.

## Prerequisites

- A desktop browser (Chromium / Firefox / Safari, last 2 major versions) with a keyboard.
- Node.js ≥ 20 — it serves the game **and** runs the tests (stakeholder constraint: the server is Node.js, never Python). **No `npm install` — there are zero dependencies.**

## Run

```bash
# from the repository root
node server.js       # zero-dependency node:http static server
# open http://localhost:8000
```

## Test

```bash
npm test          # = node --test tests/   (pure-logic core, no browser needed)
```

Expected: all assertions green; covers score arithmetic, tier lookup, recoil clamping, projectile cap, bonus-spawn trigger, wrap-around and size rules (contract in [core-api.md](./contracts/core-api.md)).

---

## Manual validation scenarios

Legend: **[FR]** requirement covered · **[SC]** measurable outcome · **[C]** contract clause.

### V1 — Boot & start sequence (FR-030/031/032, SC-015)

1. Load the page. **Expect**: black screen, white ship centred pointing up, `0` score top-right, **2** life icons top-left, "Press spacebar to start" blinking slowly at bottom-centre, **no** asteroids.
2. Press `A` / any arrow / click. **Expect**: nothing happens.
3. Press Space. **Expect**: `3` shrinks from larger-than-screen to a readable size just below the ship and holds 0.5 s, then `2`, then `1`, then `Go` (which alone grows off-screen while fading). Arrows/space do nothing during this.
4. **Expect**: control and the first asteroid appear only *after* the `Go` animation ends.

### V2 — Flight model (FR-001…FR-004, SC-001…SC-003, SC-011)

1. Hold ↑ ~1.5 s → speed visibly plateaus (never exceeds 1.3× base = 260 px/s).
2. Release all keys, wait 10 s → **speed and direction unchanged** (no friction).
3. Hold ↓ → ship slows to a stop and **never** starts moving backwards.
4. Cross each of the 4 edges → reappears on the opposite side at the **same** coordinate on the other axis, same angle, same speed.
5. Turn while moving → direction of travel rotates with the nose, speed magnitude identical (±0 %).

### V3 — Firing (FR-005/006/007, SC-010, SC-012)

1. Single tap Space → exactly 1 white projectile from the ship's position, visibly faster than the ship (1.5× base), straight ahead.
2. Ship kicks backwards on every shot; from full speed successive shots drop by exactly 0.15× base (260 → 230 → 200 …).
3. Fire until drifting back at 0.3× base (60 px/s) → further shots keep it pinned there, never beyond.
4. Hold Space → steady burst (~160 ms apart) that stops at **5** projectiles; the 6th attempt creates nothing; as soon as one leaves/hits, the next shot fires.
5. Shoot past every edge → projectile vanishes at the border (no wrap).

### V4 — Asteroids & difficulty tiers (FR-008/009/010, SC-005)

1. Score 0–1000 → only small rocks, base speed, never more than **3** on screen (spawn attempts stop at the cap).
2. Score >1000 → medium rocks appear; new smalls ~10 % faster; still max 3.
3. Score >2000 → large rocks appear; small ×1.2, medium ×1.1; max **5**.
4. Score >3000 → small ×1.3, medium ×1.2, large ×1.1; max **7**; no further increase after this.
5. Any asteroid crossing a border disappears (no wrap). Rocks already in flight keep the speed they were born with when the tier changes.
6. Spawn mix matches the FR-010 weights (tier 2 ≈ 60 % small / 40 % medium; tier 3 ≈ 40/35/25; tier 4 ≈ 30/35/35) over a few dozen spawns.

### V5 — Hits, splits, scoring (FR-011…FR-015, SC-004)

1. Destroy a small → vanishes, score **+200** (5 smalls = exactly 1000).
2. Destroy a medium → **+50**, two smalls fly apart in a V.
3. Destroy a large → **+50**, two mediums fly apart in a V.
4. Force two regular asteroids into each other → same split/vanish rule, score **unchanged**.
5. A projectile that hits is consumed; a projectile that hits two asteroids "at once" resolves each one's own size rule.
6. Split near an edge → children spawn at the parent's spot and vanish normally if already outside.

### V6 — Lives, death, respawn (FR-017…FR-020, SC-006)

1. Fly into a regular asteroid → explosion at the ship, ship absent **500 ms**, then reappears at centre pointing up, blinking fast for **2 s**; one life icon disappears (2 → 1 → 0).
2. While blinking, touching a regular asteroid → **nothing** happens.
3. With 0 icons, one more regular hit → giant centred **"Game Over"**; no in-game restart key works; only a page reload restarts (FR-029).

### V7 — Bonus life asteroid (FR-021/022/023, SC-007)

1. Cross 500 points → a **soft-green ship-shaped** asteroid spawns at base speed (colour contract [render-contract.md](./contracts/render-contract.md) §1).
2. Shoot it **or** fly into it → it disappears, **+1 life icon**, score **unchanged**, ship never harmed (even while immune).
3. It passes straight through regular asteroids — no destruction, no split, no score either way.
4. It disappears at the screen border.
5. Reach 5 reserve icons → crossing the next 500 multiple spawns **nothing** (and it is not queued).
6. A jump like 400 → 600 spawns **exactly one**.

### V8 — Game Over simulation (FR-024/025, SC-008)

1. After "Game Over" appears, keep watching ≥ 60 s → asteroids keep spawning, moving, splitting, vanishing.
2. The letters are never hit, never bounce anything, never block anything; the ship is gone (no scoring, no life gain).

### V9 — Display & performance (FR-026…FR-028, SC-009, SC-013, SC-014)

1. Window ≫ 800×600 → game scales up; a drawn circle stays a circle (identical x/y scale, 4:3 exact); leftover space is plain black.
2. Window < 800×600 → page stays 800×600 with scrollbars, nothing shrinks, the whole play area is reachable by scrolling.
3. With 7 asteroids + 5 projectiles + effects on screen → motion stays smooth (constant 60 FPS, no stutter, no speed-up on a high-Hz display).

### V10 — Hidden tab freeze (FR-033, SC-016)

1. During the countdown, switch to another tab for 10 s and come back → the current item keeps its exact remaining hold time (nothing is skipped, control is not granted early).
2. Right after losing a life, hide the tab for 10 s → on return the explosion/wait still has the time it had left, and the 2 s immunity still lasts 2 s from when it actually started.
3. With asteroids in flight, hide the tab for 10 s → nothing has moved, spawned or collided; the game continues from the frozen frame.

---

## Traceability shortcut

| Quickstart section | Primary spec items |
|---|---|
| V1 | FR-030/031/032, SC-015 |
| V2 | FR-001…004, SC-001…003, SC-011 |
| V3 | FR-005/006/007, SC-010, SC-012 |
| V4 | FR-008/009/010, SC-005 |
| V5 | FR-011…015, SC-004 |
| V6 | FR-017…020, SC-006 |
| V7 | FR-021/022/023, SC-007 |
| V8 | FR-024/025, SC-008 |
| V9 | FR-026…028, SC-009, SC-013, SC-014 |
| V10 | FR-033, SC-016 |

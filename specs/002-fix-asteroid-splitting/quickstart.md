# Quickstart & Validation: Fix Asteroid Splitting

How to run the game and prove the fix end-to-end. No implementation details — see [data-model.md](./data-model.md) and [contracts/split-contract.md](./contracts/split-contract.md) for the *what*, [tasks.md](./tasks.md) for the *how*. Feature-001's [quickstart](../001-space-asteroid-game/quickstart.md) (V1–V10) remains the full-game regression checklist and must still pass.

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

**Red-green gate (constitution II)**: the new multi-frame split tests (research.md R5: T1–T6) must be written **first** and fail against the current code — reproducing `SMALL,SMALL → EMPTY` — then pass after the fix, with all 50 pre-existing tests staying green throughout.

Expected after the fix: every assertion green, including score arithmetic, tier lookup, spawn tables and the new split-survival cases (contract in [split-contract.md](./contracts/split-contract.md)).

---

## Manual validation scenarios

Legend: **[FR]** requirement covered · **[SC]** measurable outcome · **[C]** contract clause.

### V1 — Medium asteroid split survives (FR-001, SC-001, C §2–§3)

1. Play until the score is > 1000 so medium asteroids spawn; note the score.
2. Shoot a medium asteroid away from the screen borders. **Expect**: it disappears, **exactly 2 small asteroids** appear at its position and fly apart in a V, score **+50**.
3. Keep watching 3–5 seconds. **Expect**: both smalls are still on screen and separating (before the fix they vanish on the very next frame).

### V2 — Large asteroid split survives (FR-002, SC-002, C §2–§3)

1. Play past 2000 points so large asteroids spawn; note the score.
2. Shoot a large asteroid mid-field. **Expect**: it disappears, **exactly 2 medium asteroids** fly apart in a V, score **+50**.
3. Watch 3–5 seconds. **Expect**: both mediums persist (before the fix the pair annihilates within two frames).

### V3 — Full destruction chain worth 950 points (SC-005, C §2)

1. Note the score; shoot one large, then both of its medium children, then all four small grandchildren.
2. **Expect**: every generation actually appears and can be shot; total gain **exactly 950** (50 + 50 + 50 + 4×200), and no fragment disappears on its own before you shoot it.

### V4 — Asteroid-vs-asteroid collision fragments (FR-003, SC-003, SC-006, C §2)

1. Watch for two regular asteroids colliding (or lure them together with the ship's wake). **Expect**: every fragment owed by both parents exists right after the collision (medium+medium ⇒ **4 smalls**; large+small ⇒ **2 mediums + nothing else**).
2. **Expect**: the score is **identical** before and after the collision (0 drift).

### V5 — Fragments behave like ordinary asteroids (FR-006, US3, C §2)

1. After any split, let the fragments drift. **Expect**: normal movement at the tier speed for their size, rotation, disappearance at borders, collision with the ship, and **+200 / +50** when you shoot a small / medium fragment.
2. A fragment born overlapping an unrelated older asteroid may be destroyed or split by it — that is allowed (spec Assumptions).

### V6 — Cap overflow keeps fragments, blocks spawns (FR-009, FR-007, SC-007, C §4)

1. Reach a tier where the cap is 5 or 7 and fill the screen to the cap.
2. Cause a destruction event (shot or collision) at the cap. **Expect**: all fragments appear — the count may exceed the cap; **no new asteroid enters from a border** while it is at/above the cap.
3. Destroy asteroids until the count drops below the cap. **Expect**: border spawns resume.

### V7 — Regression sweep (feature-001, constitution V)

1. `npm test` → all tests green (old and new).
2. Run the feature-001 checklist V1–V10 once: start screen, flight model, scoring, tiers, lives/death, bonus asteroid, Game Over — **no behaviour change** outside splitting.
3. Zero-dependency confirmation: no `npm install` was performed; `package.json` still has no runtime dependencies.

---

## Sign-off

| Scenario | Covers | Verified (date / initials) |
|---|---|---|
| V1 | FR-001, SC-001 | |
| V2 | FR-002, SC-002 | |
| V3 | SC-005 | |
| V4 | FR-003, SC-003, SC-006 | |
| V5 | FR-006, US3 | |
| V6 | FR-007, FR-009, SC-007 | |
| V7 | all tests + feature-001 V1–V10 + zero deps | |

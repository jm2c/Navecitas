# Quickstart & Validation: Guaranteed Drop From Medium Fragments

How to run the game and prove the amendment end-to-end. No implementation details — see [data-model.md](./data-model.md) and [contracts/guaranteed-drop-contract.md](./contracts/guaranteed-drop-contract.md) for the *what*, [tasks.md](./tasks.md) for the *how*. Feature-003's [quickstart](../003-double-shot-powerup/quickstart.md) (V1–V5) remains the power-up regression checklist and must still pass; features 001/002's sweeps stay green as part of the same run.

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

**Red-green gate (constitution II)**: the new test file (`tests/guaranteed-drop.test.js`, research.md R3) must be written **first** and fail against the current code — today a medium-fragment small never guarantees a drop and no origin field exists — then pass after implementation, with all pre-existing suites (including feature-003's `powerup.test.js` and `double-shot.test.js`) staying green throughout.

Expected after implementation: every assertion green, including the 100%-per-fragment guarantee under an injected random that never rolls a drop, the two-drops-for-two-fragments independence, the untouched 10% rate for non-fragment smalls, and the no-drop-on-border-despawn rule (contract in [guaranteed-drop-contract.md](./contracts/guaranteed-drop-contract.md)).

---

## Manual validation scenarios

Legend: **[FR]** requirement covered · **[SC]** measurable outcome · **[GD]** contract clause.

### V1 — Destroying a medium's fragment ALWAYS gives the power-up (FR-001, FR-002, FR-005, SC-001, GD-1, GD-2)

1. Start a round and shoot a **medium** asteroid (below 1000 points wait for spawn scaling; mediums with 20-point collisions appear under the current tier rules — any duel with a medium works).
2. **Expect**: it splits into two small fragments flying apart in the familiar V.
3. Destroy the first fragment (shoot it). **Expect**: a **gold power-up** (feature-003's double-bar glyph) appears from the fragment's position, flying how the fragment was flying — with every single destroyed fragment you try (100%, no "huh, not this time").
4. Repeat on the second fragment and on further mediums over the session. **Expect**: every fragment destroyed by a projectile releases its power-up each time (V2 below covers the non-projectile cause).

### V2 — Collision destruction also counts (FR-005, SC-001, GD-1)

1. Create a medium fragment and let it collide into another asteroid (or herd two fragments together) so the fragment is destroyed **without a shot** (no points awarded).
2. **Expect**: the guaranteed power-up appears exactly as in V1 — the cause of destruction does not matter.

### V3 — Two fragments, two drops (FR-006, SC-004, GD-6)

1. Quickly destroy a medium and then destroy **both** of its fragments in rapid succession (or in one volley).
2. **Expect**: distinct power-ups appear in every case (per destroyed fragment, each from its own position and direction) — never a single merged drop and never two drops from one fragment.

### V4 — Non-fragment smalls keep the old luck rate (FR-003, SC-003, GD-4)

1. Destroy wave-spawned small asteroids (the ones that never came from a medium) ~10 times each over Tier-1 play.
2. **Expect**: most such kills produce **no** drop (only the familiar ~1 in 10 lucky ones appear, per feature 003) — the guaranteed never-should-happen for these smalls shows its absence.

### V5 — Dropped power-up behaves exactly as feature 003's (FR-002, FR-007, SC-002, SC-005)

1. Collect any guaranteed drop by touching it with the ship. **Expect**: score and lives unchanged; the double shot activates (two projectiles per tap, per feature-003's geometry).
2. Lose a life. **Expect**: the effect ends after the death sequence exactly as in feature 003.
3. Then shoot a guaranteed drop with a projectile. **Expect**: projectile and object consumed, no score change, double shot activates.
4. Let a remaining fragment fly out of the screen without shooting it. **Expect**: no drop, no lingering power-up, no double-shot activation.

### V6 — Splitting protection unaffected (feature-002 regression)

1. Destroy a medium between asteroids so both fragments are near a still-alive asteroid (or shoot two mediums quickly at close range and watch the fragments coexist).
2. **Expect**: fragments never self-destruct from sibling overlap just because they now carry an extra tag — the familiar birth protection behaviour is intact.

A fragment's guarantee never changes what it looks like **before** destruction: no visual distinction is expected for fragment smalls (spec Assumption), so no visual check exists beyond feature-003's glyph checks.

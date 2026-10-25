# Quickstart & Validation: Double Shot Power-Up

How to run the game and prove the feature end-to-end. No implementation details — see [data-model.md](./data-model.md) and [contracts/powerup-contract.md](./contracts/powerup-contract.md) for the *what*, [tasks.md](./tasks.md) for the *how*. Feature-001's [quickstart](../001-space-asteroid-game/quickstart.md) (V1–V10) remains the full-game regression checklist and must still pass; feature-002's V1–V7 stays green as part of that sweep.

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

**Red-green gate (constitution II)**: the new tests (research.md R6: `tests/powerup.test.js`, `tests/double-shot.test.js`) must be written **first** and fail against the current code — no drop ever emitted, no second projectile per shot, no doubled capacity — then pass after implementation, with all 62 pre-existing tests staying green throughout.

Expected after implementation: every assertion green, including the exact 10-in-100 seeded drop distribution, the V geometry of the pair, the once-recoil rule, the never-refused-pair capacity rule (B-1) and the life-loss terminators (contract in [powerup-contract.md](./contracts/powerup-contract.md)).

---

## Manual validation scenarios

Legend: **[FR]** requirement covered · **[SC]** measurable outcome · **[C]** contract clause.

### V1 — Power-up drops and is recognisable (FR-001, FR-002, FR-003, SC-001, SC-002, C §2)

1. Start a round and destroy small asteroids repeatedly (only smalls exist below 1000 points, so Tier 1 is the natural setting).
2. **Expect**: roughly 1 in 10 destroyed smalls releases a **gold, clearly distinct** flying object (two-bar glyph — no text needed) at the destroyed asteroid's position, continuing to fly exactly where and how the small was flying at that instant.
3. **Expect**: the other 9 of 10 destructions leave the screen exactly as before the feature.

### V2 — Collection by ship and by projectile (FR-004, FR-005, FR-006, SC-003, SC-006, C §3)

1. Chase a drop with the ship and touch it. **Expect**: the object disappears, the ship is unharmed, no life is lost, the score does not change, and from that instant each shot visibly fires **two** projectiles.
2. Let the effect end (lose a life), then collect a new drop with a **projectile** (shoot the gold object). **Expect**: projectile and object both disappear, no score change, and the double shot activates immediately.

### V3 — Active double shot geometry and rhythm (FR-007, FR-008, SC-003, SC-004, C §4)

1. With the effect active, single-tap fire. **Expect**: exactly **two** projectiles leave together from the ship, separating symmetrically in a slight V around the ship's nose direction (aim stays usable — both shots stay near the aim line).
2. Rotate the ship, then fire. **Expect**: the pair spreads around the **new** heading.
3. Hold fire for a burst. **Expect**: the burst rhythm feels identical to normal firing; each tick emits a full pair; the ship is pushed back no more than with a normal shot (one recoil per pair, never two).

### V4 — Doubled capacity, no pair split (FR-009, SC-004, C §5)

1. With the effect active, keep firing at close range to stack projectiles (~10 on screen). **Expect**: pairs keep coming out — never a lone half-pair fired "because there was room for only one", never a refused tap you can hear "click" while the effect lasts.
2. Watch 1–2 seconds. **Expect**: the count settles back as the oldest projectiles vanish at borders; nothing lingers unnaturally.

### V5 — Termination at life loss (FR-010, FR-011, SC-005, C §6)

1. With the effect active, fly into a regular asteroid. **Expect**: during the 500 ms explosion and respawn blinking the effect state is irrelevant to you; from your **first shot after the respawn**, each tap yields exactly **one** projectile again.
2. While several projectiles are in flight when you get hit, note them. **Expect**: they are **not removed** by the death — they fly their course (border or impact) and vanish naturally.
3. Collect a drop in the ≥ 5-projectile-overflowing state beforehand (possible in Tier-1) and then end the effect: **Expect**: the normal refusal resumes only once the count naturally falls below 5, then the familiar refusal behaviour is back.

### V6 — No stacking, immunity pass-through, non-interaction (FR-012, FR-013, FR-014, SC-006, C §3/§7)

1. With the effect active, collect a second drop. **Expect**: it is consumed with no visible or audible change to rate, rhythm or capacity — the effect just continues until your next life loss.
2. Right after a respawn (blinking immunity), touch a drop. **Expect**: it is still collected and activates (immunity protects against damage, never against rewards).
3. Watch a drop drift into a regular asteroid; watch drops pass next to the green bonus-life ship (should it be on screen). **Expect**: no destruction, no split, no deflection, no score anywhere.
4. Let a drop reach a screen edge. **Expect**: it disappears exactly like every other moving object.

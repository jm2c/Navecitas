# Data Model: Guaranteed Drop From Medium Fragments (Phase 1)

**Feature**: `004-guaranteed-fragment-drop` | Derived from `spec.md` §Key Entities + FRs and research.md R1–R4. Binding numerics (constitution III): guaranteed rate 100% (expressed as logic — research R2), retained rate 10% (`POWERUP_DROP_CHANCE`, feature-003). **No new constants and no new state fields** — this feature only adds one origin tag on fragment births and one branch condition on small-asteroid destruction.

Feature-001/002/003 data-models remain authoritative wherever not restated here. All entities stay plain objects from factories; coordinates are logical pixels in the fixed 800×600 area; velocities in px/s.

---

## 1. Small asteroid — new origin field

| Field | Applies to | Type | Default | Notes |
|---|---|---|---|---|
| `mediumFragment` | SMALL asteroids born from a MEDIUM's split | boolean | **field absent** on all non-fragment asteroids | research R1: set in `applySizeRule`'s split branch exactly when the destroyed asteroid is `MEDIUM` and `childKind === 'SMALL'` |

**Validation rules (spec FR-004)**
- Set at the fragment's creation instant; never mutated, never copied to any other object afterwards — carrier of the fixed origin the whole of the fragment's life on screen.
- `mediumFragment === true` only ever on children of a MEDIUM; `LARGE`'s children (`MEDIUM`) never receive it; `tickSpawn`/`edgeSpawn` asteroids never receive it.
- Orthogonal to `birthStep` (feature-002): a medium's fragment carries **both** `birthStep` (split self-protection) and `mediumFragment` (drop origin). The collision-protection comparison (`birthStep` equality) is untouched and never reads `mediumFragment` (research R1).
- A POWERUP created from a fragment leans none of these tags (feature-003 invariant preserved).

## 2. Destruction rule delta in `applySizeRule` (`src/score.js`, SMALL branch)

| Destroyed asteroid | Drop condition | Power-up produced |
|---|---|---|
| SMALL with `mediumFragment === true` | **always** (probability bypassed; injectable `random` not consulted) | exactly one, guaranteed |
| SMALL without the field | unchanged: `random() < POWERUP_DROP_CHANCE` (independent per event, no memory — feature-003 FR-001) | at most one |
| MEDIUM / LARGE | never drops (only splits into children — it is the children's later destruction that qualifies for the rule) | never |

**State transitions of a medium-fragment small**

```
born (MEDIUM destroyed → 2 SMALL children, each mediumFragment = true)
   → lives/drifts under feature-001 motion & feature-002 protection rules
   → destroyed (any cause: projectile hit / regular×regular collision / any future cause)
        ⇒ exactly one POWERUP at (x, y) with the fragment's exact velocity vector
   → OR despawns at a screen border without destruction
        ⇒ no drop (FR-005; destruction is the trigger)
```

**Validation rules**
- Exactly one POWERUP per destroyed medium-fragment small, per destruction instant — never zero, never two for one fragment (SC-001, SC-004).
- Both children of the same medium: two independent guaranteed drops when both are destroyed (FR-006); same-step destruction still yields two distinct drops.
- Guaranteed drops are identical objects to rolled drops (same factory call, feature-003 FR-002 inheritance verbatim) — the sequence behaves afterwards as in feature 003 (collection ⇒ `doubleShot = true`, no score change, no life change).
- A guaranteed drop sets `doubleShot = true` on collection even if already `true` (feature-003 FR-014 no-stacking, unchanged).

## 3. PowerUp entity — UNCHANGED

Field-for-field as feature-003 data-model §3 (`kind: 'POWERUP'`, position/velocity inherited at destruction instant, radius 14, glyph spin, border despawn). The guaranteed rule changes only the **frequency** with which it is born, never its shape, motion or effects.

## 4. GameState — UNCHANGED

`doubleShot` boolean and every other field as feature-003 data-model §1. A guaranteed drop introduces no writers to state other than the existing collection path.

---

## Interaction matrix (no delta)

Feature 001's interaction matrix and feature-003's POWERUP column remain identical to before: the fragment origin influences only the *appearance* of a POWERUP, not any interaction. (Consistency check: `mediumFragment` is read by exactly one expression in `src/score.js`; no other module may branch on it — constitution V.)

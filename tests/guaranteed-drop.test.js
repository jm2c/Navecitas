import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame, tierFor } from '../src/state.js';
import { createAsteroid } from '../src/entities.js';
import { applySizeRule } from '../src/score.js';
import { resolveCollisions } from '../src/collision.js';

const ALWAYS_NO_DROP_RANDOM = () => 1;

function playingState(score) {
  const state = createGame();
  state.phase = 'PLAYING';
  state.spawnT = 1e9;
  state.score = score;
  return state;
}

function spawnMedium(state, x, y, heading) {
  const medium = createAsteroid('MEDIUM', x, y, heading, tierFor(state.score));
  state.asteroids.push(medium);
  return medium;
}

test('children born from a MEDIUM split carry mediumFragment = true (OF-1)', () => {
  const state = playingState(0);
  const medium = spawnMedium(state, 400, 300, 0);
  const children = applySizeRule(state, medium, true, ALWAYS_NO_DROP_RANDOM);

  assert.equal(children.length, 2);
  for (const child of children) {
    assert.equal(child.kind, 'SMALL');
    assert.equal(child.mediumFragment, true, 'every SMALL fragment of a MEDIUM gets the tag');
  }
});

test('children of a LARGE split have no mediumFragment tag (OF-2)', () => {
  const state = playingState(0);
  const large = createAsteroid('LARGE', 400, 300, 0, tierFor(0));
  const children = applySizeRule(state, large, true, ALWAYS_NO_DROP_RANDOM);

  for (const child of children) {
    assert.equal(child.kind, 'MEDIUM');
    assert.ok(!('mediumFragment' in child));
  }
});

test('spawned asteroids have no mediumFragment tag (OF-2)', () => {
  const small = createAsteroid('SMALL', 100, 100, 0, tierFor(0));
  assert.ok(!('mediumFragment' in small));
});

test('a medium-fragment small ALWAYS drops a powerup, regardless of the roll (GD-1)', () => {
  const state = playingState(0);
  const medium = spawnMedium(state, 400, 300, 0);
  const [child] = applySizeRule(state, medium, true, ALWAYS_NO_DROP_RANDOM);
  child.x = 123;
  child.y = 321;
  child.vx = -40;
  child.vy = 60;

  for (let trial = 0; trial < 20; trial += 1) {
    const result = applySizeRule(state, child, true, ALWAYS_NO_DROP_RANDOM);
    assert.equal(result.length, 1, 'trial ' + trial + ': single guaranteed POWERUP');
    assert.equal(result[0].kind, 'POWERUP');
  }
});

test('the guaranteed powerup inherits the fragment position/velocity verbatim (GD-2/FR-002)', () => {
  const state = playingState(0);
  const medium = spawnMedium(state, 400, 300, 0);
  const [child] = applySizeRule(state, medium, true, ALWAYS_NO_DROP_RANDOM);
  child.x = 50;
  child.y = 550;
  child.vx = -70;
  child.vy = 90;

  const [powerup] = applySizeRule(state, child, false, ALWAYS_NO_DROP_RANDOM);
  assert.equal(powerup.x, 50);
  assert.equal(powerup.y, 550);
  assert.equal(Math.round(powerup.heading), Math.round(Math.atan2(90, -70)));
});

test('the guaranteed path never consults the injectable random (GD-3)', () => {
  const state = playingState(0);
  const medium = spawnMedium(state, 400, 300, 0);
  const [child] = applySizeRule(state, medium, true, ALWAYS_NO_DROP_RANDOM);

  let calls = 0;
  const countingRandom = () => {
    calls += 1;
    return 1;
  };
  const result = applySizeRule(state, child, true, countingRandom);
  assert.equal(result.length, 1);
  assert.equal(calls, 0, 'guaranteed drop short-circuits the roll');
});

test('no-award path (asteroid collision) still guarantees the drop (GD-1/FR-005)', () => {
  const state = playingState(0);
  state.spawnT = 1e9;
  const medium = spawnMedium(state, 400, 300, 0);
  const [fragment] = applySizeRule(state, medium, true, ALWAYS_NO_DROP_RANDOM);

  const other = createAsteroid('SMALL', 0, 0, 1.2, tierFor(0));
  other.x = fragment.x;
  other.y = fragment.y;
  state.asteroids = [fragment, other];

  const randomCalls = [];
  const trackingRandom = () => {
    randomCalls.push(1);
    return 1;
  };

  resolveCollisions(state, trackingRandom);

  const survivors = state.asteroids.filter((asteroid) => !asteroid.dead);
  const powerups = survivors.filter((asteroid) => asteroid.kind === 'POWERUP');
  assert.equal(powerups.length, 1, 'the fragment still released its powerup');
  assert.equal(randomCalls.length, 0, 'the guaranteed path skipped the roll');
});

test('the powerup produced by a fragment carries no origin tags (OF-3)', () => {
  const state = playingState(0);
  const medium = spawnMedium(state, 400, 300, 0);
  const [child] = applySizeRule(state, medium, true, ALWAYS_NO_DROP_RANDOM);
  const [powerup] = applySizeRule(state, child, true, ALWAYS_NO_DROP_RANDOM);

  assert.ok(!('mediumFragment' in powerup));
  assert.ok(!('birthStep' in powerup));
});

test('both fragments of one medium each guarantee their own drop (GD-6)', () => {
  const state = playingState(0);
  const medium = spawnMedium(state, 400, 300, 0);
  const children = applySizeRule(state, medium, true, ALWAYS_NO_DROP_RANDOM);

  const [first, second] = children.map((child) => {
    const popped = applySizeRule(state, child, true, ALWAYS_NO_DROP_RANDOM);
    return popped[0];
  });

  assert.equal(first.kind, 'POWERUP');
  assert.equal(second.kind, 'POWERUP');
});

test('spawned (non-fragment) smalls keep the unchanged 10% roll — no drop at 1.0 (GD-4)', () => {
  const state = playingState(0);
  const small = createAsteroid('SMALL', 10, 10, 0.3, tierFor(0));

  let calls = 0;
  const one = () => {
    calls += 1;
    return 1;
  };
  const result = applySizeRule(state, small, true, one);

  assert.equal(result.length, 0, 'only the guarantee bypasses the roll');
  assert.equal(calls, 1, 'the roll IS consulted on the non-guaranteed path');
});

test('spawned smalls under a uniform 0.00–0.99 fake drop exactly 1 in 10 (GD-4/SC-003)', () => {
  const state = playingState(0);
  let drops = 0;
  for (let i = 0; i < 10; i += 1) {
    const small = createAsteroid('SMALL', 10, 10, 0.3, tierFor(state.score));
    const negativeRoll = () => i / 10;
    const result = applySizeRule(state, small, true, negativeRoll);
    if (result.length === 1 && result[0].kind === 'POWERUP') drops += 1;
  }
  assert.equal(drops, 1, 'feature-003 rate intact: 1 drop per 10 destructions');
});

test('boundary convention intact: a 0.0 roll indicates a drop for spawned smalls (RNG-2)', () => {
  const state = playingState(0);
  const small = createAsteroid('SMALL', 10, 10, 0.3, tierFor(0));
  const result = applySizeRule(state, small, true, () => 0);
  assert.equal(result.length, 1);
  assert.equal(result[0].kind, 'POWERUP');
});

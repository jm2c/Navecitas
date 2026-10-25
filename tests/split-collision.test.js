import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame, tierFor } from '../src/state.js';
import { createAsteroid } from '../src/entities.js';
import { update } from '../src/update.js';
import { DT_MS, WORLD } from '../src/config.js';

const NONE = { left: false, right: false, up: false, down: false, fire: false };
const NO_DROP = () => 1;

function playingState(score) {
  const state = createGame();
  state.phase = 'PLAYING';
  state.spawnT = 1e9;
  state.score = score;
  state.ship.x = 10;
  state.ship.y = 10;
  return state;
}

function steps(state, count) {
  for (let i = 0; i < count; i += 1) update(state, DT_MS, NONE, NO_DROP);
}

function onScreen(a) {
  return a.x > 0 && a.x < WORLD.W && a.y > 0 && a.y < WORLD.H;
}

test('two colliding medium asteroids leave all four small fragments alive with no score change (FR-003, SC-003, SC-006)', () => {
  const state = playingState(1500);
  state.asteroids.push(
    createAsteroid('MEDIUM', 400, 300, 0, tierFor(state.score)),
    createAsteroid('MEDIUM', 410, 305, Math.PI, tierFor(state.score)),
  );

  update(state, DT_MS, NONE, NO_DROP);

  assert.equal(state.score, 1500, 'mutual collisions never award points');
  let smalls = state.asteroids.filter((a) => a.kind === 'SMALL');
  assert.equal(smalls.length, 4, 'both parents owe two small fragments each');

  steps(state, 60);

  smalls = state.asteroids.filter((a) => a.kind === 'SMALL');
  assert.equal(smalls.length, 4, 'all four fragments survive a full second');
  assert.ok(smalls.every(onScreen), 'all four fragments are still inside the play area');
  assert.equal(state.score, 1500, 'score never drifts');
});

test('a large colliding with a small leaves exactly two medium fragments and no score change (FR-003, SC-003)', () => {
  const state = playingState(2500);
  state.asteroids.push(
    createAsteroid('LARGE', 400, 300, 0, tierFor(state.score)),
    createAsteroid('SMALL', 420, 305, Math.PI, tierFor(state.score)),
  );

  update(state, DT_MS, NONE, NO_DROP);

  assert.equal(state.score, 2500, 'mutual collisions never award points');
  let mediums = state.asteroids.filter((a) => a.kind === 'MEDIUM');
  assert.equal(mediums.length, 2, 'the large owes two mediums, the small owes none');

  steps(state, 60);

  mediums = state.asteroids.filter((a) => a.kind === 'MEDIUM');
  assert.equal(mediums.length, 2, 'both medium fragments survive a full second');
  assert.ok(mediums.every(onScreen), 'both fragments are still inside the play area');
  assert.equal(state.score, 2500, 'score never drifts');
});

test('a medium removed by a ship collision still splits, with surviving fragments and no points (FR-004)', () => {
  const state = playingState(1500);
  state.ship.x = 400;
  state.ship.y = 300;
  const medium = createAsteroid('MEDIUM', 400, 300, 0, tierFor(state.score));
  state.asteroids.push(medium);

  update(state, DT_MS, NONE, NO_DROP);

  assert.equal(state.phase, 'DYING');
  assert.equal(state.score, 1500, 'ship-collision removal awards no points');

  steps(state, 5);

  const smalls = state.asteroids.filter((a) => a.kind === 'SMALL');
  assert.equal(smalls.length, 2, 'the split fragments survive their birth');
  assert.equal(state.score, 1500, 'score stays untouched');
});

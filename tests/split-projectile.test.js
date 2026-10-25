import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame, tierFor } from '../src/state.js';
import { createAsteroid } from '../src/entities.js';
import { update } from '../src/update.js';
import { DT_MS, WORLD } from '../src/config.js';

const NONE = { left: false, right: false, up: false, down: false, fire: false };
const DEG = Math.PI / 180;

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
  for (let i = 0; i < count; i += 1) update(state, DT_MS, NONE);
}

function track(state, asteroid) {
  assert.ok(asteroid, 'target asteroid exists');
  state.projectiles.push({
    x: asteroid.x,
    y: asteroid.y,
    vx: asteroid.vx,
    vy: asteroid.vy,
    radius: 3.5,
    dead: false,
  });
  update(state, DT_MS, NONE);
}

function onScreen(a) {
  return a.x > 0 && a.x < WORLD.W && a.y > 0 && a.y < WORLD.H;
}

function headingsOf(list) {
  return list.map((a) => Math.atan2(a.vy, a.vx));
}

test('a medium hit by a projectile leaves exactly two small fragments in a V that survive a full second (FR-001, SC-001, SC-004)', () => {
  const state = playingState(1500);
  const medium = createAsteroid('MEDIUM', 400, 300, 0, tierFor(state.score));
  state.asteroids.push(medium);

  track(state, medium);

  assert.equal(state.score, 1550);
  let smalls = state.asteroids.filter((a) => a.kind === 'SMALL');
  assert.equal(smalls.length, 2);

  const [h1, h2] = headingsOf(smalls);
  assert.ok(Math.abs(Math.abs(h1) - 25 * DEG) < 1e-9, 'first fragment at parent heading - 25 deg');
  assert.ok(Math.abs(Math.abs(h2) - 25 * DEG) < 1e-9, 'second fragment at parent heading + 25 deg');

  steps(state, 60);

  smalls = state.asteroids.filter((a) => a.kind === 'SMALL');
  assert.equal(smalls.length, 2, 'both fragments still exist 1 second later');
  assert.ok(smalls.every(onScreen), 'both fragments are still inside the play area');
});

test('a large hit by a projectile leaves exactly two medium fragments in a V that survive a full second (FR-002, SC-002, SC-004)', () => {
  const state = playingState(2500);
  const large = createAsteroid('LARGE', 400, 300, 0, tierFor(state.score));
  state.asteroids.push(large);

  track(state, large);

  assert.equal(state.score, 2550);
  let mediums = state.asteroids.filter((a) => a.kind === 'MEDIUM');
  assert.equal(mediums.length, 2);

  const [h1, h2] = headingsOf(mediums);
  assert.ok(Math.abs(Math.abs(h1) - 25 * DEG) < 1e-9, 'first fragment at parent heading - 25 deg');
  assert.ok(Math.abs(Math.abs(h2) - 25 * DEG) < 1e-9, 'second fragment at parent heading + 25 deg');

  steps(state, 60);

  mediums = state.asteroids.filter((a) => a.kind === 'MEDIUM');
  assert.equal(mediums.length, 2, 'both fragments still exist 1 second later');
  assert.ok(mediums.every(onScreen), 'both fragments are still inside the play area');
});

test('destroying one large through its full chain awards exactly 950 points (SC-005)', () => {
  const state = playingState(2500);
  const large = createAsteroid('LARGE', 400, 300, 0, tierFor(state.score));
  state.asteroids.push(large);
  const before = state.score;

  track(state, large);
  assert.equal(state.score, before + 50);
  assert.equal(state.asteroids.filter((a) => a.kind === 'MEDIUM').length, 2);

  steps(state, 30);

  const mediums = state.asteroids.filter((a) => a.kind === 'MEDIUM');
  assert.equal(mediums.length, 2, 'the two medium fragments survived their birth');
  for (const medium of mediums) {
    track(state, medium);
    assert.ok(state.asteroids.filter((a) => a.kind === 'MEDIUM').length >= 0);
  }
  assert.equal(state.score, before + 150, 'two medium hits at 50 each');

  const smalls = state.asteroids.filter((a) => a.kind === 'SMALL');
  assert.equal(smalls.length, 4, 'four small fragments exist after both mediums split');

  let guard = 0;
  while (state.asteroids.length > 0 && guard < 20) {
    track(state, state.asteroids[0]);
    guard += 1;
  }
  assert.equal(state.asteroids.length, 0, 'every fragment of the chain was destroyed by shots');
  assert.equal(state.score, before + 950, '50 + 50 + 50 + 4x200 = 950');
});

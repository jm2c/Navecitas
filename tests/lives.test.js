import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame, tierFor } from '../src/state.js';
import { update } from '../src/update.js';
import { resolveCollisions } from '../src/collision.js';
import { createAsteroid } from '../src/entities.js';
import { DT_MS, TIMINGS } from '../src/config.js';

const NONE = { left: false, right: false, up: false, down: false, fire: false };

function input(overrides = {}) {
  return { ...NONE, ...overrides };
}

function playingState() {
  const state = createGame();
  state.phase = 'PLAYING';
  state.spawnT = 1e9;
  state.ship.x = 10;
  state.ship.y = 10;
  return state;
}

function steps(state, count, overrides = {}) {
  for (let i = 0; i < count; i += 1) {
    update(state, DT_MS, input(overrides));
  }
}

function killShip(state) {
  const small = createAsteroid('SMALL', state.ship.x, state.ship.y, 0, tierFor(0));
  state.asteroids.push(small);
  resolveCollisions(state);
  return small;
}

test('a hit in PLAYING starts the 500 ms death delay, then respawns with immunity (FR-018, SC-006)', () => {
  const state = playingState();
  const killer = killShip(state);

  assert.equal(state.phase, 'DYING');
  assert.equal(state.ship.alive, false);
  assert.equal(state.explosionT, TIMINGS.deathDelay);
  assert.equal(state.lives, 3);
  assert.equal(killer.dead, true);
  assert.equal(state.score, 0);

  steps(state, 29);
  assert.equal(state.phase, 'DYING');
  assert.ok(state.explosionT > 0);

  steps(state, 1);
  assert.equal(state.phase, 'PLAYING');
  assert.equal(state.lives, 2);
  assert.equal(state.ship.alive, true);
  assert.equal(state.ship.x, 400);
  assert.equal(state.ship.y, 300);
  assert.equal(state.ship.angle, -Math.PI / 2);
  assert.equal(state.ship.speed, 0);
  assert.equal(state.shieldT, TIMINGS.immunity);
});

test('the ship cannot be hit again while destroyed during the 500 ms window', () => {
  const state = playingState();
  killShip(state);
  assert.equal(state.phase, 'DYING');

  const second = createAsteroid('SMALL', 10, 10, 0, tierFor(0));
  state.asteroids.push(second);
  resolveCollisions(state);

  assert.equal(second.dead, false);
  assert.equal(state.phase, 'DYING');
  assert.equal(state.lives, 3);
});

test('immunity blocks regular-asteroid damage entirely (FR-019)', () => {
  const state = playingState();
  state.shieldT = 1000;
  const small = createAsteroid('SMALL', 10, 10, 0, tierFor(0));
  state.asteroids.push(small);

  resolveCollisions(state);

  assert.equal(state.phase, 'PLAYING');
  assert.equal(state.ship.alive, true);
  assert.equal(small.dead, false);
  assert.equal(state.lives, 3);
  assert.equal(state.score, 0);
});

test('immunity lasts exactly 2 simulated seconds', () => {
  const state = playingState();
  state.shieldT = TIMINGS.immunity;
  steps(state, 100);
  assert.ok(state.shieldT < TIMINGS.immunity);
  assert.ok(state.shieldT > 0);
  steps(state, 100);
  assert.equal(state.shieldT, 0);
});

test('a hit with no reserve icons ends the game and removes the ship (FR-020)', () => {
  const state = playingState();
  state.lives = 1;
  const small = createAsteroid('SMALL', 10, 10, 0, tierFor(0));
  state.asteroids.push(small);

  resolveCollisions(state);

  assert.equal(state.phase, 'GAME_OVER');
  assert.equal(state.ship, null);
  assert.equal(state.lives, 1);
  assert.equal(small.dead, true);
  assert.equal(state.score, 0);
});

test('game over is terminal and the simulation keeps running behind it (FR-025, FR-029)', () => {
  const state = playingState();
  state.lives = 1;
  killShip(state);
  assert.equal(state.phase, 'GAME_OVER');

  const rock = createAsteroid('SMALL', 400, 300, 0, tierFor(0));
  state.asteroids.push(rock);
  state.spawnT = 0;

  steps(state, 5, { fire: true, up: true, left: true });

  assert.equal(state.phase, 'GAME_OVER');
  assert.equal(state.ship, null);
  assert.ok(rock.x > 400);
  assert.ok(state.asteroids.length >= 1);

  steps(state, 200, { fire: true });
  assert.equal(state.phase, 'GAME_OVER');
  assert.equal(state.ship, null);
});

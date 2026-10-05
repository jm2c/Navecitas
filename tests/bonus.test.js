import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame, tierFor } from '../src/state.js';
import { update } from '../src/update.js';
import { resolveCollisions } from '../src/collision.js';
import { addScore, grantLife } from '../src/score.js';
import { spawnSpecialIfCrossed, tickSpawn } from '../src/spawn.js';
import { createAsteroid, createSpecial } from '../src/entities.js';
import { DT_MS, SPECIAL_SPEED, MAX_LIVES, MAX_RESERVE_ICONS, RADII } from '../src/config.js';

const NONE = { left: false, right: false, up: false, down: false, fire: false };

function input(overrides = {}) {
  return { ...NONE, ...overrides };
}

function playingState() {
  const state = createGame();
  state.phase = 'PLAYING';
  state.spawnT = 1e9;
  state.ship.x = 400;
  state.ship.y = 400;
  return state;
}

function steps(state, count, overrides = {}) {
  for (let i = 0; i < count; i += 1) {
    update(state, DT_MS, input(overrides));
  }
}

function specials(state) {
  return state.asteroids.filter((asteroid) => asteroid.kind === 'SPECIAL' && !asteroid.dead);
}

test('spawnSpecialIfCrossed fires exactly once per crossed 500 multiple', () => {
  const state = createGame();
  state.spawnT = 1e9;

  spawnSpecialIfCrossed(state, 0, 499);
  assert.equal(specials(state).length, 0);

  spawnSpecialIfCrossed(state, 499, 500);
  assert.equal(specials(state).length, 1);

  spawnSpecialIfCrossed(state, 500, 700);
  assert.equal(specials(state).length, 1);

  spawnSpecialIfCrossed(state, 700, 1000);
  assert.equal(specials(state).length, 2);

  const special = specials(state)[0];
  assert.equal(special.radius, RADII.SPECIAL);
  assert.ok(Math.abs(Math.hypot(special.vx, special.vy) - SPECIAL_SPEED) < 1e-9);
});

test('the 400 to 600 jump spawns exactly one special', () => {
  const state = createGame();
  state.spawnT = 1e9;
  spawnSpecialIfCrossed(state, 400, 600);
  assert.equal(specials(state).length, 1);
});

test('a full reserve of 5 icons suppresses the spawn without queueing it (FR-023)', () => {
  const state = createGame();
  state.spawnT = 1e9;
  state.lives = MAX_LIVES;

  spawnSpecialIfCrossed(state, 400, 600);
  assert.equal(specials(state).length, 0);

  state.lives = 3;
  spawnSpecialIfCrossed(state, 600, 700);
  assert.equal(specials(state).length, 0);
});

test('grantLife caps the total at 6 lives', () => {
  const state = createGame();
  state.lives = MAX_LIVES - 1;
  grantLife(state);
  assert.equal(state.lives, MAX_LIVES);
  grantLife(state);
  assert.equal(state.lives, MAX_LIVES);
  assert.equal(Math.max(0, state.lives - 1), MAX_RESERVE_ICONS);
});

test('crossing 500 multiples through addScore spawns the specials (SC-007)', () => {
  const state = createGame();
  state.spawnT = 1e9;

  for (let i = 0; i < 8; i += 1) {
    addScore(state, 200);
  }

  assert.equal(state.score, 1600);
  assert.equal(specials(state).length, 3);
});

test('the special spawns even at the regular cap and never counts toward it', () => {
  const state = createGame();
  state.spawnT = 1e9;
  for (let i = 0; i < 3; i += 1) {
    state.asteroids.push(createAsteroid('SMALL', 400, 200 + i * 60, 0, tierFor(0)));
  }

  spawnSpecialIfCrossed(state, 400, 600);
  assert.equal(specials(state).length, 1);
  assert.equal(state.asteroids.length, 4);

  tickSpawn(state, 0, () => 0.5);
  assert.equal(state.asteroids.filter((a) => a.kind !== 'SPECIAL').length, 3);
});

test('a projectile hit on the special grants one life, no points, and harms nobody (FR-022)', () => {
  const state = playingState();
  const special = createSpecial(700, 500, Math.PI);
  const projectile = { x: 700, y: 500, vx: -300, vy: 0, radius: 3.5, dead: false };
  state.asteroids.push(special);
  state.projectiles.push(projectile);

  resolveCollisions(state);

  assert.equal(special.dead, true);
  assert.equal(projectile.dead, true);
  assert.equal(state.lives, 4);
  assert.equal(state.score, 0);
  assert.equal(state.phase, 'PLAYING');
  assert.equal(state.ship.alive, true);
  assert.equal(state.explosionT, 0);
});

test('the ship collecting the special grants a life even while immune, never taking damage', () => {
  const state = playingState();
  state.shieldT = 1500;
  state.asteroids.push(createSpecial(400, 400, 0));

  resolveCollisions(state);

  assert.equal(specials(state).length, 0);
  assert.equal(state.lives, 4);
  assert.equal(state.score, 0);
  assert.equal(state.phase, 'PLAYING');
  assert.equal(state.ship.alive, true);
  assert.equal(state.explosionT, 0);
  assert.equal(state.shieldT, 1500);
});

test('the special passes through regular asteroids with no effect on either', () => {
  const state = playingState();
  state.ship.x = 10;
  state.ship.y = 10;
  const special = createSpecial(400, 400, Math.PI);
  const medium = createAsteroid('MEDIUM', 410, 405, 0, tierFor(0));
  state.asteroids.push(special, medium);

  resolveCollisions(state);

  assert.equal(special.dead, false);
  assert.equal(medium.dead, false);
  assert.equal(state.score, 0);
  assert.equal(state.lives, 3);
  assert.equal(state.asteroids.length, 2);
});

test('the special disappears when it crosses the border', () => {
  const state = playingState();
  state.asteroids.push(createSpecial(5, 100, Math.PI));

  steps(state, 10);

  assert.equal(state.asteroids.length, 0);
  assert.equal(state.lives, 3);
});

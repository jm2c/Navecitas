import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame, tierFor } from '../src/state.js';
import { createAsteroid } from '../src/entities.js';
import { update } from '../src/update.js';
import { DT_MS, LIMITS, POWERUP_SPREAD_HALF_ANGLE, TIMINGS } from '../src/config.js';

const FIRE = { left: false, right: false, up: false, down: false, fire: true };
const NONE = { left: false, right: false, up: false, down: false, fire: false };

const BACK_SEAM = Math.PI / 2;

function firingState(score, turn = 0) {
  const state = createGame();
  state.phase = 'PLAYING';
  state.spawnT = 1e9;
  state.score = score;
  state.doubleShot = true;
  state.ship.x = 400;
  state.ship.y = 300;
  if (turn) state.ship.angle = turn;
  return state;
}

function steps(state, count, input = NONE) {
  for (let i = 0; i < count; i += 1) update(state, DT_MS, input);
}

function expectVelocity(projectile, angle) {
  assert.ok(
    Math.abs(projectile.vx - Math.cos(angle) * LIMITS.projSpeed) < 1e-9,
    'the projectile keeps the exact normal speed along its own heading',
  );
  assert.ok(
    Math.abs(projectile.vy - Math.sin(angle) * LIMITS.projSpeed) < 1e-9,
  );
}

test('a single tap with the effect active emits exactly a symmetric V pair around the current heading (FR-007, FS-1)', () => {
  const state = firingState(0);
  const before = state.ship.angle;

  update(state, DT_MS, FIRE);

  assert.equal(state.projectiles.length, 2, 'exactly two projectiles for one tap');
  expectVelocity(state.projectiles[0], before - POWERUP_SPREAD_HALF_ANGLE);
  expectVelocity(state.projectiles[1], before + POWERUP_SPREAD_HALF_ANGLE);
});

test('the pair always spreads around the ship heading at the firing instant (FR-007, FS-2)', () => {
  const state = firingState(0, -BACK_SEAM);

  update(state, DT_MS, { ...FIRE, right: true });

  const heading = -BACK_SEAM + Math.PI / 60;
  assert.equal(state.projectiles.length, 2);
  expectVelocity(state.projectiles[0], heading - POWERUP_SPREAD_HALF_ANGLE);
  expectVelocity(state.projectiles[1], heading + POWERUP_SPREAD_HALF_ANGLE);
});

test('one tap costs exactly one normal recoil: the ship speed drops by 30, never 60 (FR-008, FS-3)', () => {
  const state = firingState(0);

  update(state, DT_MS, FIRE);

  assert.equal(state.ship.speed, -LIMITS.recoil, 'one recoil step of 30, clamped path intact');
});

test('held fire keeps the 160 ms cadence: one pair per tick (FR-008, FS-4)', () => {
  const state = firingState(0);

  steps(state, 10, FIRE);
  assert.equal(state.projectiles.length, 2, 'no second pair before the interval elapses');

  update(state, DT_MS, FIRE);
  assert.equal(state.projectiles.length, 4, 'the 11th frame triggers the next pair');

  steps(state, 10, FIRE);
  assert.equal(state.projectiles.length, 6, 'the cadence stays one pair per interval');

  const ship = state.ship;
  assert.equal(ship.speed, -LIMITS.back, 'three shots clamp the backward speed at -60');
});

function dummyProjectiles(state, count) {
  for (let i = 0; i < count; i += 1) {
    state.projectiles.push({
      x: 40 + i * 70,
      y: 500,
      vx: 0,
      vy: -300,
      radius: 3.5,
      dead: false,
    });
  }
}

test('while the effect lasts the pair is never refused for space, and the excess reabsorbs naturally (FR-009, CP-1/CP-2)', () => {
  const state = firingState(0);
  dummyProjectiles(state, 10);

  update(state, DT_MS, FIRE);

  assert.equal(state.projectiles.length, 12, 'a full pair fires even past the doubled limit');

  steps(state, 200, FIRE);

  assert.ok(
    state.projectiles.length >= 10,
    'held fire settles above the nominal doubled limit without any refusal',
  );

  steps(state, 200, NONE);

  assert.equal(state.projectiles.length, 0, 'the exceedance reabsorbs once firing stops');
});

test('the single-shot path is untouched while the flag is off: 1 shot, refusal at 5, same recoil (FS-1 single)', () => {
  const state = createGame();
  state.phase = 'PLAYING';
  state.spawnT = 1e9;
  state.ship.x = 400;
  state.ship.y = 300;
  dummyProjectiles(state, 4);

  update(state, DT_MS, FIRE);

  assert.equal(state.projectiles.length, 5, 'one projectile added up to the normal cap');

  update(state, DT_MS, FIRE);

  assert.equal(state.projectiles.length, 5, 'the normal refusal applies at 5');
  assert.equal(state.ship.speed, -LIMITS.recoil, 'one recoil step');
  assert.equal(state.doubleShot, false);
});

test('after the flag clears the normal refusal resumes while in-flight projectiles stay (FR-011, CP-3)', () => {
  const state = firingState(0);
  dummyProjectiles(state, 9);

  update(state, DT_MS, FIRE);
  assert.equal(state.projectiles.length, 11, 'the pair always fires while the effect is active');

  state.doubleShot = false;
  steps(state, 5, FIRE);

  assert.equal(state.projectiles.length, 11, 'no new shot is accepted at/above the normal cap');
  assert.equal(
    state.projectiles.every((p) => !p.dead),
    true,
    'in-flight projectiles are never removed by the transition',
  );
});

function livingState(score) {
  const state = createGame();
  state.phase = 'PLAYING';
  state.spawnT = 1e9;
  state.score = score;
  state.doubleShot = true;
  state.ship.x = 400;
  state.ship.y = 300;
  return state;
}

test('the effect ends exactly when the life is counted at death-sequence completion, never during the 500 ms window (FR-010, TR-1a/TR-2)', () => {
  const state = livingState(0);
  state.asteroids.push(createAsteroid('SMALL', 400, 300, 0, tierFor(0)));

  update(state, DT_MS, NONE);

  assert.equal(state.phase, 'DYING', 'the hit starts the death sequence');
  const halfway = Math.round(TIMINGS.deathDelay / DT_MS / 2);
  steps(state, halfway);
  assert.equal(state.doubleShot, true, 'the flag survives the whole DYING window');

  steps(state, halfway + 10);
  assert.equal(state.lives, 2, 'the life is lost at sequence completion');
  assert.equal(state.doubleShot, false, 'the effect ends exactly at the life loss');
  assert.equal(state.phase, 'PLAYING', 'the ship has respawned');

  update(state, DT_MS, FIRE);
  assert.equal(state.projectiles.length, 1, 'the first post-respawn tap yields a single projectile');
});

test('the final life lost ends the effect in the game-over branch (FR-010, TR-1b)', () => {
  const state = livingState(0);
  state.lives = 1;
  state.asteroids.push(createAsteroid('SMALL', 400, 300, 0, tierFor(0)));

  update(state, DT_MS, NONE);

  assert.equal(state.phase, 'GAME_OVER');
  assert.equal(state.ship, null);
  assert.equal(state.doubleShot, false, 'the effect ends with the final life');
});

test('projectiles in flight are never removed by the death of the player (FR-011)', () => {
  const state = livingState(0);
  state.projectiles.push({ x: 400, y: 500, vx: 0, vy: -300, radius: 3.5, dead: false });
  state.asteroids.push(createAsteroid('SMALL', 400, 300, 0, tierFor(0)));

  update(state, DT_MS, NONE);
  steps(state, 40);

  assert.equal(state.lives, 2, 'the death completed');
  assert.ok(
    state.projectiles.some((p) => !p.dead && p.y < 500),
    'the in-flight projectile from before the death is still on its course right after the respawn',
  );

  steps(state, 200);
  assert.equal(state.projectiles.length, 0, 'it then expires naturally at the border');
});

test('nothing but a life loss ends the effect: time, freezes and extra time pass keep the flag (FR-015, TR-3)', () => {
  const state = livingState(0);

  steps(state, 1200);
  assert.equal(state.doubleShot, true, '20 simulated seconds do not end the effect');

  steps(state, 1200);
  assert.equal(state.doubleShot, true, 'a long freeze/resume gap does not end the effect either');
});

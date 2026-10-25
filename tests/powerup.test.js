import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame, tierFor } from '../src/state.js';
import { createAsteroid, createProjectile } from '../src/entities.js';
import { resolveCollisions } from '../src/collision.js';
import { update } from '../src/update.js';
import { DT_MS, WORLD } from '../src/config.js';

const NONE = { left: false, right: false, up: false, down: false, fire: false };

function powerup(x, y, vx, vy) {
  return {
    kind: 'POWERUP',
    x,
    y,
    heading: Math.atan2(vy, vx),
    vx,
    vy,
    radius: 14,
    rot: 0,
    spin: 0.5,
    seed: 7,
    dead: false,
  };
}

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

function regulars(state) {
  return state.asteroids.filter(
    (asteroid) => asteroid.kind !== 'SPECIAL' && asteroid.kind !== 'POWERUP',
  );
}

test('a POWERUP does not count toward the tier cap: edge spawns continue while the screen holds it (FR-012)', () => {
  const state = playingState(0);
  state.asteroids.push(powerup(400, 300, 200, 0));
  state.asteroids.push(
    createAsteroid('SMALL', 100, 100, 0, tierFor(0)),
    createAsteroid('SMALL', 600, 100, Math.PI, tierFor(0)),
  );

  state.spawnT = 5;
  update(state, DT_MS, NONE);

  assert.equal(regulars(state).length, 3, 'edge spawn is gated by regular count only');
  assert.ok(
    state.asteroids.some((a) => a.kind === 'POWERUP' && !a.dead),
    'the POWERUP survives the step',
  );
});

test('a POWERUP overlapping a regular asteroid destroys nothing: no split, no score, both ignored (FR-012)', () => {
  const state = playingState(500);
  state.asteroids.push(powerup(400, 300, 200, 0));
  state.asteroids.push(createAsteroid('SMALL', 405, 300, 0, tierFor(500)));

  update(state, DT_MS, NONE);

  const power = state.asteroids.find((a) => a.kind === 'POWERUP');
  const small = state.asteroids.find((a) => a.kind === 'SMALL');
  assert.ok(power && !power.dead, 'the POWERUP is ignored by the regular pair pass');
  assert.ok(small && !small.dead, 'the regular asteroid is untouched by the POWERUP');
  assert.equal(state.score, 500, 'no points flow in any direction');
});

test('the ship touching a POWERUP is never harmed (FR-012)', () => {
  const state = playingState(0);
  state.ship.x = 400;
  state.ship.y = 300;
  state.asteroids.push(powerup(400, 300, 200, 0));

  update(state, DT_MS, NONE);

  assert.equal(state.phase, 'PLAYING', 'no death sequence is started by a POWERUP');
  assert.equal(state.lives, 3, 'no life is lost to a POWERUP');
  assert.ok(state.ship.alive, 'the ship is alive');
});

test('a POWERUP disappears at any border crossing (FR-013)', () => {
  const state = playingState(0);
  state.asteroids.push(powerup(-1, 300, -100, 0));

  steps(state, 2);

  assert.ok(
    !state.asteroids.some((a) => a.kind === 'POWERUP'),
    'the POWERUP is removed at the border',
  );
});

function projectileState(score, x, y, vx, vy) {
  const state = playingState(score);
  const ship = state.ship;
  const projectile = createProjectile(ship);
  projectile.x = x;
  projectile.y = y;
  projectile.vx = vx;
  projectile.vy = vy;
  state.projectiles.push(projectile);
  return state;
}

test('a destroyed small drops a POWERUP exactly when random() < 0.1, on the award path (FR-001, DR-1)', () => {
  const state = projectileState(0, 400, 300, 300, 0);
  const small = createAsteroid('SMALL', 400, 300, 0, tierFor(0));
  state.asteroids.push(small);

  resolveCollisions(state, () => 0);

  const power = state.asteroids.find((a) => a.kind === 'POWERUP');
  assert.ok(power, 'the drop happens when the roll is 0');
  assert.equal(power.x, 400, 'the drop is born at the destroyed asteroid position');
  assert.equal(power.y, 300);
  assert.ok(Math.abs(power.vx - small.vx) < 1e-9, 'the POWERUP inherits the exact parent velocity');
  assert.ok(Math.abs(power.vy - small.vy) < 1e-9);
  assert.equal(power.birthStep, undefined, 'the POWERUP is never tagged as a fragment');
});

test('no drop happens when the roll is >= 0.1 (FR-001, DR-1)', () => {
  const state = projectileState(0, 400, 300, 300, 0);
  state.asteroids.push(createAsteroid('SMALL', 400, 300, 0, tierFor(0)));

  resolveCollisions(state, () => 0.2);

  assert.ok(!state.asteroids.some((a) => a.kind === 'POWERUP'), 'no drop in the 90% branch');
});

test('100 uniform rolls over destroyed smalls yield exactly 10 drops (SC-001, RNG-2)', () => {
  let drops = 0;
  for (let i = 0; i < 100; i += 1) {
    const state = projectileState(0, 400, 300, 300, 0);
    state.asteroids.push(createAsteroid('SMALL', 400, 300, 0, tierFor(0)));
    resolveCollisions(state, () => i / 100);
    if (state.asteroids.some((a) => a.kind === 'POWERUP')) drops += 1;
  }
  assert.equal(drops, 10);
});

test('the no-award path rolls the drop too: two smalls destroyed together, two independent rolls (DR-1, DR-4)', () => {
  const state = playingState(1500);
  state.asteroids.push(
    createAsteroid('SMALL', 400, 300, 0, tierFor(1500)),
    createAsteroid('SMALL', 410, 300, Math.PI, tierFor(1500)),
  );

  resolveCollisions(state, () => 0);

  assert.equal(
    state.asteroids.filter((a) => a.kind === 'POWERUP').length,
    2,
    'every destroyed small rolled for itself',
  );
  assert.equal(state.score, 1500, 'the no-award path never scores');
});

test('a projectile touching a POWERUP activates the double shot: both consumed, no score (FR-005, CR-1)', () => {
  const state = playingState(500);
  state.projectiles.push(
    Object.assign(createProjectile(state.ship), { x: 400, y: 300, vx: 0, vy: 0 }),
  );
  state.asteroids.push(powerup(400, 300, 200, 0));

  update(state, DT_MS, NONE);

  assert.ok(
    !state.projectiles.some((p) => !p.dead),
    'the collecting projectile is consumed',
  );
  assert.ok(
    !state.asteroids.some((a) => a.kind === 'POWERUP' && !a.dead),
    'the POWERUP is consumed',
  );
  assert.equal(state.doubleShot, true, 'the double shot activates');
  assert.equal(state.score, 500, 'collection never scores');
  assert.equal(state.lives, 3, 'collection never touches lives');
});

test('the ship collects a POWERUP with and without immunity: no harm, no score, effect on (FR-004, CR-2)', () => {
  for (const shieldT of [0, 2000]) {
    const state = playingState(500);
    state.ship.x = 400;
    state.ship.y = 300;
    state.shieldT = shieldT;
    state.asteroids.push(powerup(400, 300, 200, 0));

    update(state, DT_MS, NONE);

    assert.equal(state.doubleShot, true, `collection works with shieldT = ${shieldT}`);
    assert.equal(state.phase, 'PLAYING', 'the ship is never harmed by a POWERUP');
    assert.equal(state.lives, 3, 'collection never touches lives');
    assert.equal(state.score, 500, 'collection never scores');
    assert.ok(
      !state.asteroids.some((a) => a.kind === 'POWERUP' && !a.dead),
      'the POWERUP is consumed',
    );
  }
});

test('collecting a duplicate while the effect is active keeps the effect and consumes the object (FR-014, CR-3)', () => {
  const state = playingState(500);
  state.doubleShot = true;
  state.ship.x = 400;
  state.ship.y = 300;
  state.asteroids.push(powerup(400, 300, 200, 0));

  update(state, DT_MS, NONE);

  assert.equal(state.doubleShot, true, 'no stacking happens either way');
  assert.ok(
    !state.asteroids.some((a) => a.kind === 'POWERUP' && !a.dead),
    'the duplicate is simply consumed',
  );
});

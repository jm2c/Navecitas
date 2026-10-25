import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../src/state.js';
import { update } from '../src/update.js';
import { DT_MS, LIMITS, TIMINGS, WORLD } from '../src/config.js';

const NONE = { left: false, right: false, up: false, down: false, fire: false };

function input(overrides = {}) {
  return { ...NONE, ...overrides };
}

function startGame() {
  const state = createGame();
  update(state, DT_MS, input({ fire: true }));
  let guard = 0;
  while (state.phase === 'COUNTDOWN' && guard < 10000) {
    update(state, DT_MS, input());
    guard += 1;
  }
  assert.equal(state.phase, 'PLAYING');
  state.asteroids.length = 0;
  state.spawnT = 1e9;
  return state;
}

function steps(state, count, overrides = {}) {
  for (let i = 0; i < count; i += 1) {
    update(state, DT_MS, input(overrides));
  }
}

function fireShot(state) {
  state.shotT = 0;
  update(state, DT_MS, input({ fire: true }));
  update(state, DT_MS, input());
}

test('rotation changes the angle without touching the speed magnitude', () => {
  const state = startGame();
  state.ship.speed = 120;
  state.ship.angle = 0;

  update(state, DT_MS, input({ left: true }));
  assert.equal(state.ship.speed, 120);
  assert.ok(Math.abs(state.ship.angle - -Math.PI * (DT_MS / 1000)) < 1e-9);

  const afterLeft = state.ship.angle;
  update(state, DT_MS, input({ right: true }));
  assert.equal(state.ship.speed, 120);
  assert.ok(Math.abs(state.ship.angle - (afterLeft + Math.PI * (DT_MS / 1000))) < 1e-9);
});

test('thrust reaches the 1.3x base cap of 260 and never exceeds it (SC-011)', () => {
  const state = startGame();
  state.ship.angle = 0;
  steps(state, 200, { up: true });
  assert.equal(state.ship.speed, LIMITS.fwd);
  steps(state, 120, { up: true });
  assert.equal(state.ship.speed, LIMITS.fwd);
});

test('braking decelerates toward zero and never reverses the ship', () => {
  const state = startGame();
  state.ship.speed = 100;
  steps(state, 10, { down: true });
  assert.ok(state.ship.speed < 100 && state.ship.speed > 0);
  steps(state, 600, { down: true });
  assert.equal(state.ship.speed, 0);

  state.ship.speed = -40;
  steps(state, 1, { down: true });
  assert.ok(state.ship.speed >= 0);
});

test('no input means no friction: speed and direction survive 10 simulated seconds (SC-002)', () => {
  const state = startGame();
  state.ship.speed = 137;
  state.ship.angle = 0.7;
  steps(state, 600);
  assert.equal(state.ship.speed, 137);
  assert.equal(state.ship.angle, 0.7);
});

test('wrap-around preserves the untouched axis, angle and speed (SC-003)', () => {
  const right = startGame();
  right.ship.angle = 0;
  right.ship.speed = 260;
  right.ship.x = WORLD.W - 2;
  right.ship.y = 123.5;
  steps(right, 1);
  assert.ok(right.ship.x >= 0 && right.ship.x < WORLD.W);
  assert.equal(right.ship.y, 123.5);
  assert.equal(right.ship.angle, 0);
  assert.equal(right.ship.speed, 260);

  const left = startGame();
  left.ship.angle = Math.PI;
  left.ship.speed = 260;
  left.ship.x = 2;
  left.ship.y = 234.5;
  steps(left, 1);
  assert.ok(left.ship.x >= 0 && left.ship.x < WORLD.W);
  assert.ok(Math.abs(left.ship.y - 234.5) < 1e-9);
  assert.equal(left.ship.speed, 260);

  const down = startGame();
  down.ship.angle = Math.PI / 2;
  down.ship.speed = 260;
  down.ship.x = 321.5;
  down.ship.y = WORLD.H - 2;
  steps(down, 1);
  assert.ok(down.ship.y >= 0 && down.ship.y < WORLD.H);
  assert.ok(Math.abs(down.ship.x - 321.5) < 1e-9);

  const up = startGame();
  up.ship.angle = -Math.PI / 2;
  up.ship.speed = 260;
  up.ship.x = 432.5;
  up.ship.y = 2;
  steps(up, 1);
  assert.ok(up.ship.y >= 0 && up.ship.y < WORLD.H);
  assert.ok(Math.abs(up.ship.x - 432.5) < 1e-9);
});

test('each shot removes exactly 0.15x base speed with a backward cap of 0.3x base (SC-012)', () => {
  const state = startGame();
  state.ship.angle = 0;
  state.ship.speed = 260;

  const expected = [230, 200, 170, 140, 110, 80, 50, 20, -10, -40, -60, -60];
  for (const want of expected) {
    state.projectiles.length = 0;
    fireShot(state);
    assert.ok(
      Math.abs(state.ship.speed - want) < 1e-9,
      `expected ${want}, got ${state.ship.speed}`,
    );
  }
});

test('a projectile leaves from the ship position at exactly 1.5x base speed (FR-005)', () => {
  const state = startGame();
  state.ship.angle = 0;
  state.ship.x = 400;
  state.ship.y = 300;
  update(state, DT_MS, input({ fire: true }));
  assert.equal(state.projectiles.length, 1);
  const projectile = state.projectiles[0];
  const travelled = LIMITS.projSpeed * (DT_MS / 1000);
  assert.ok(Math.abs(projectile.x - (400 + travelled)) < 1e-9);
  assert.ok(Math.abs(projectile.y - 300) < 1e-9);
  assert.ok(Math.abs(Math.hypot(projectile.vx, projectile.vy) - LIMITS.projSpeed) < 1e-9);
});

test('a single tap fires exactly one projectile', () => {
  const state = startGame();
  state.ship.angle = 0;
  update(state, DT_MS, input({ fire: true }));
  assert.equal(state.projectiles.length, 1);
  steps(state, 8);
  assert.equal(state.projectiles.length, 1);
});

test('holding space fires a burst at the 160 ms interval', () => {
  const state = startGame();
  state.ship.angle = 0;
  state.ship.x = 10;
  state.ship.y = 300;

  update(state, DT_MS, input({ fire: true }));
  assert.equal(state.projectiles.length, 1);
  assert.ok(state.shotT > 0 && state.shotT <= TIMINGS.shotInterval);

  steps(state, 6, { fire: true });
  assert.equal(state.projectiles.length, 1);
  steps(state, 9, { fire: true });
  assert.equal(state.projectiles.length, 2);
});

test('the 6th projectile is refused while 5 are on screen and resumes when one is gone (FR-007)', () => {
  const state = startGame();
  state.ship.angle = 0;
  state.ship.x = 400;
  state.ship.y = 300;
  for (let i = 0; i < 6; i += 1) {
    fireShot(state);
  }
  assert.equal(state.projectiles.length, LIMITS.maxProjectiles);

  steps(state, 30, { fire: true });
  assert.equal(state.projectiles.length, LIMITS.maxProjectiles);

  state.projectiles.shift();
  state.shotT = 0;
  update(state, DT_MS, input({ fire: true }));
  assert.equal(state.projectiles.length, LIMITS.maxProjectiles);
});

test('projectiles vanish at the border without wrapping (FR-015)', () => {
  const state = startGame();
  state.ship.angle = 0;
  fireShot(state);
  assert.equal(state.projectiles.length, 1);
  state.projectiles[0].x = WORLD.W - 1;
  update(state, DT_MS, input());
  assert.equal(state.projectiles.length, 0);
});

test('stepCount starts at 0 and advances exactly once per update (birth-instant clock, data-model.md 1)', () => {
  const state = createGame();
  assert.equal(state.stepCount, 0);
  update(state, DT_MS, input());
  assert.equal(state.stepCount, 1);
  update(state, DT_MS, input());
  assert.equal(state.stepCount, 2);

  const played = startGame();
  assert.ok(played.stepCount > 2);
});

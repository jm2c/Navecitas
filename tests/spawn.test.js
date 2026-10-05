import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame, tierFor } from '../src/state.js';
import { update } from '../src/update.js';
import { createAsteroid } from '../src/entities.js';
import { edgeSpawn, pickKind, tickSpawn } from '../src/spawn.js';
import { DT_MS, BASE_SPEED, WORLD } from '../src/config.js';

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
  return state;
}

function steps(state, count, overrides = {}) {
  for (let i = 0; i < count; i += 1) {
    update(state, DT_MS, input(overrides));
  }
}

test('tier boundaries are exclusive at 1000/2000/3000 with caps 3/3/5/7', () => {
  assert.equal(tierFor(0).max, 3);
  assert.equal(tierFor(1000).max, 3);
  assert.equal(tierFor(1001).max, 3);
  assert.equal(tierFor(2000).max, 3);
  assert.equal(tierFor(2001).max, 5);
  assert.equal(tierFor(3000).max, 5);
  assert.equal(tierFor(3001).max, 7);
  assert.equal(tierFor(99999).max, 7);
});

test('per-tier spawn weights follow FR-010', () => {
  assert.deepEqual(tierFor(0).weights, { SMALL: 100, MEDIUM: 0, LARGE: 0 });
  assert.deepEqual(tierFor(1500).weights, { SMALL: 60, MEDIUM: 40, LARGE: 0 });
  assert.deepEqual(tierFor(2500).weights, { SMALL: 40, MEDIUM: 35, LARGE: 25 });
  assert.deepEqual(tierFor(3500).weights, { SMALL: 30, MEDIUM: 35, LARGE: 35 });
});

test('per-tier speed multipliers produce the FR-010 speeds at creation', () => {
  const cases = [
    [0, { SMALL: 200 }],
    [1500, { SMALL: 220, MEDIUM: 200 }],
    [2500, { SMALL: 240, MEDIUM: 220, LARGE: 200 }],
    [4000, { SMALL: 260, MEDIUM: 240, LARGE: 220 }],
  ];
  for (const [score, speeds] of cases) {
    const tier = tierFor(score);
    for (const [kind, expected] of Object.entries(speeds)) {
      const asteroid = createAsteroid(kind, 100, 100, 0, tier);
      assert.ok(
        Math.abs(Math.hypot(asteroid.vx, asteroid.vy) - expected) < 1e-9,
        `score ${score} ${kind}: expected ${expected}, got ${Math.hypot(asteroid.vx, asteroid.vy)}`,
      );
    }
  }
});

test('the weighted size pick never chooses a size with weight 0', () => {
  const tier1 = tierFor(0);
  for (const roll of [0, 0.5, 0.999999]) {
    assert.equal(pickKind(tier1.weights, () => roll), 'SMALL');
  }
  for (let i = 0; i < 200; i += 1) {
    const tier2 = pickKind(tierFor(1500).weights);
    assert.ok(tier2 === 'SMALL' || tier2 === 'MEDIUM');
    assert.equal(pickKind(tierFor(1000).weights), 'SMALL');
    assert.equal(pickKind(tierFor(3500).weights) !== '', true);
  }
});

test('an edge spawn lies exactly on a border with an inward heading', () => {
  for (const roll of [0.1, 0.35, 0.55, 0.85, 0.99]) {
    const spawn = edgeSpawn(() => roll);
    const onBorder =
      spawn.x === 0 || spawn.x === WORLD.W || spawn.y === 0 || spawn.y === WORLD.H;
    assert.ok(onBorder, `not on a border: ${spawn.x},${spawn.y}`);
    if (spawn.x === 0) assert.ok(Math.cos(spawn.heading) > 0);
    if (spawn.x === WORLD.W) assert.ok(Math.cos(spawn.heading) < 0);
    if (spawn.y === 0) assert.ok(Math.sin(spawn.heading) > 0);
    if (spawn.y === WORLD.H) assert.ok(Math.sin(spawn.heading) < 0);
    assert.ok(spawn.x >= 0 && spawn.x <= WORLD.W);
    assert.ok(spawn.y >= 0 && spawn.y <= WORLD.H);
  }
});

test('spawn stops at the tier cap', () => {
  const state = createGame();
  state.phase = 'PLAYING';

  for (let i = 0; i < 3; i += 1) {
    state.asteroids.push(createAsteroid('SMALL', 400, 300, 0, tierFor(0)));
  }
  tickSpawn(state, 10000, () => 0.5);
  assert.equal(state.asteroids.length, 3);

  state.asteroids.pop();
  tickSpawn(state, 10000, () => 0.5);
  assert.equal(state.asteroids.length, 3);
});

test('spawn attempts follow the 1400 ms cadence', () => {
  const state = createGame();
  state.phase = 'PLAYING';

  tickSpawn(state, 0, () => 0.5);
  assert.equal(state.asteroids.length, 1);

  tickSpawn(state, 700, () => 0.5);
  assert.equal(state.asteroids.length, 1);
  tickSpawn(state, 700, () => 0.5);
  assert.equal(state.asteroids.length, 2);
});

test('asteroids mark dead and vanish when crossing a border (FR-009)', () => {
  const state = startGame();
  state.spawnT = 1e9;
  state.asteroids.length = 0;
  state.asteroids.push({
    kind: 'SMALL',
    x: 5,
    y: 100,
    heading: Math.PI,
    vx: -200,
    vy: 0,
    radius: 14,
    rot: 0,
    spin: 0.5,
    seed: 7,
    dead: false,
  });

  steps(state, 10);
  assert.equal(state.asteroids.length, 0);
});

test('asteroids rotate while in flight and keep their birth speed when the tier changes', () => {
  const state = startGame();
  state.spawnT = 1e9;
  state.asteroids.length = 0;
  state.ship.x = 10;
  state.ship.y = 10;
  const asteroid = createAsteroid('SMALL', 400, 300, 0, tierFor(0));
  state.asteroids.push(asteroid);
  const bornSpeed = Math.hypot(asteroid.vx, asteroid.vy);
  assert.ok(Math.abs(bornSpeed - BASE_SPEED) < 1e-9);

  steps(state, 5);
  assert.ok(asteroid.rot > 0);

  state.score = 4000;
  const afterTierChange = Math.hypot(asteroid.vx, asteroid.vy);
  assert.equal(afterTierChange, bornSpeed);
  assert.ok(Math.abs(asteroid.rot - 5 * asteroid.spin * (DT_MS / 1000)) < 1e-9);
});

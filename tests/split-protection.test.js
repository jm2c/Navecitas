import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame, tierFor } from '../src/state.js';
import { createAsteroid } from '../src/entities.js';
import { update } from '../src/update.js';
import { DT_MS } from '../src/config.js';

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

function track(state, asteroid) {
  state.projectiles.push({
    x: asteroid.x,
    y: asteroid.y,
    vx: asteroid.vx,
    vy: asteroid.vy,
    radius: 3.5,
    dead: false,
  });
  update(state, DT_MS, NONE, NO_DROP);
}

test('fragments of two different destruction events born in the same instant protect each other (FR-005, clarification Q1)', () => {
  const state = playingState(1500);
  const target = createAsteroid('MEDIUM', 400, 300, 0, tierFor(state.score));
  const brawler = createAsteroid('MEDIUM', 408, 300, 0, tierFor(state.score));
  const mate = createAsteroid('MEDIUM', 416, 300, Math.PI, tierFor(state.score));
  state.asteroids.push(target, brawler, mate);

  track(state, target);

  assert.equal(state.score, 1550, 'only the projectile hit scores');
  assert.equal(state.asteroids.length, 6, 'three mediums split into six smalls in one instant');

  steps(state, 5);

  assert.equal(
    state.asteroids.filter((a) => a.kind === 'SMALL').length,
    6,
    'fragments of different events in the same instant never destroy each other',
  );
  assert.equal(state.score, 1550);
});

test('a fragment and an asteroid that existed before its birth instant follow normal collision rules (FR-005)', () => {
  const state = playingState(1500);
  const target = createAsteroid('MEDIUM', 400, 300, 0, tierFor(state.score));
  const older = createAsteroid('LARGE', 100, 500, 0, tierFor(state.score));
  state.asteroids.push(target, older);

  track(state, target);
  const fragments = state.asteroids.filter((a) => a.kind === 'SMALL');
  assert.equal(fragments.length, 2);

  fragments[1].x = -5;
  update(state, DT_MS, NONE, NO_DROP);
  assert.equal(state.asteroids.filter((a) => a.kind === 'SMALL').length, 1);

  older.x = fragments[0].x;
  older.y = fragments[0].y;
  update(state, DT_MS, NONE, NO_DROP);

  assert.equal(
    state.asteroids.filter((a) => a.kind === 'SMALL').length,
    0,
    'the newborn fragment was destroyed by the asteroid that existed before it',
  );
  assert.equal(state.asteroids.filter((a) => a.kind === 'MEDIUM').length, 2, 'the older large split normally, exactly once');
  assert.equal(state.score, 1550, 'mutual rules award no points');
});

test('fragments born in consecutive steps follow normal collision rules (FR-005)', () => {
  const state = playingState(1500);
  const first = createAsteroid('MEDIUM', 400, 300, 0, tierFor(state.score));
  const second = createAsteroid('MEDIUM', 150, 150, 0, tierFor(state.score));
  state.asteroids.push(first, second);

  track(state, first);
  assert.equal(state.asteroids.filter((a) => a.kind === 'SMALL').length, 2);

  track(state, second);
  const bornLater = state.asteroids.filter((a) => a.kind === 'SMALL');
  assert.equal(bornLater.length, 4);

  const fromFirstBirth = state.asteroids.filter((a) => a.kind === 'SMALL')[0];
  const fromSecondBirth = bornLater[2];
  fromSecondBirth.x = fromFirstBirth.x;
  fromSecondBirth.y = fromFirstBirth.y;
  update(state, DT_MS, NONE, NO_DROP);

  assert.equal(
    state.asteroids.filter((a) => a.kind === 'SMALL').length,
    2,
    'overlapping fragments of different steps destroy each other normally',
  );
  assert.equal(state.score, 1600, 'two projectile medium hits at 50 each, mutual rules add nothing');
});

test('a fragment is an ordinary asteroid: shot for its own points and removed at a border (FR-006, FR-008)', () => {
  const state = playingState(1500);
  const target = createAsteroid('MEDIUM', 400, 300, 0, tierFor(state.score));
  state.asteroids.push(target);

  track(state, target);
  assert.equal(state.score, 1550);

  const fragments = state.asteroids.filter((a) => a.kind === 'SMALL');
  assert.equal(fragments.length, 2);

  track(state, fragments[0]);
  assert.equal(state.score, 1750, 'a small fragment destroyed by a projectile is worth 200');
  assert.equal(state.asteroids.filter((a) => a.kind === 'SMALL').length, 1);

  const survivor = state.asteroids.filter((a) => a.kind === 'SMALL')[0];
  survivor.x = -5;
  update(state, DT_MS, NONE, NO_DROP);
  assert.equal(state.asteroids.filter((a) => a.kind === 'SMALL').length, 0, 'a fragment crossing the border disappears');
  assert.equal(state.score, 1750, 'borders never change the score');
});

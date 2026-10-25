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

function regulars(state) {
  return state.asteroids.filter((a) => a.kind !== 'SPECIAL' && a.kind !== 'POWERUP');
}

test('the tier cap gates edge spawns only: fragments are always kept and spawning resumes below the cap (FR-009, FR-006, SC-007)', () => {
  const state = playingState(1500);
  state.asteroids.push(
    createAsteroid('MEDIUM', 100, 100, Math.PI / 2, tierFor(state.score)),
    createAsteroid('MEDIUM', 400, 300, -Math.PI / 2, tierFor(state.score)),
    createAsteroid('MEDIUM', 700, 500, -Math.PI / 2, tierFor(state.score)),
  );
  assert.equal(regulars(state).length, 3);

  state.spawnT = 0;
  update(state, DT_MS, NONE, NO_DROP);
  assert.equal(regulars(state).length, 3, 'at the cap (3) no edge spawn happens');

  track(state, state.asteroids[0]);
  assert.equal(regulars(state).length, 4, 'the destruction event kept all of its fragments above the cap');

  state.spawnT = 0;
  update(state, DT_MS, NONE, NO_DROP);
  assert.equal(regulars(state).length, 4, 'still above the cap: edge spawns stay blocked');

  for (let i = 0; i < 2; i += 1) {
    const smallest = state.asteroids.find((a) => a.kind === 'SMALL');
    track(state, smallest);
  }
  assert.equal(regulars(state).length, 2, 'below the cap after two more kills');

  state.spawnT = 0;
  update(state, DT_MS, NONE, NO_DROP);
  assert.equal(regulars(state).length, 3, 'below the cap: edge spawning resumes');
});

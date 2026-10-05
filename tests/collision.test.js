import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame, tierFor } from '../src/state.js';
import { resolveCollisions } from '../src/collision.js';
import { createAsteroid } from '../src/entities.js';

function playingState() {
  const state = createGame();
  state.phase = 'PLAYING';
  state.spawnT = 1e9;
  state.ship.x = 10;
  state.ship.y = 10;
  return state;
}

function projectileAt(x, y) {
  return { x, y, vx: 0, vy: 300, radius: 3.5, dead: false };
}

test('a projectile consumes the asteroid and awards the size-rule score', () => {
  const state = playingState();
  const small = createAsteroid('SMALL', 400, 300, 0, tierFor(0));
  const projectile = projectileAt(400, 300);
  state.asteroids.push(small);
  state.projectiles.push(projectile);

  resolveCollisions(state);

  assert.equal(projectile.dead, true);
  assert.equal(small.dead, true);
  assert.equal(state.score, 200);
  assert.equal(state.asteroids.filter((a) => a !== small).length, 0);
});

test('a projectile hit on a medium applies the split with score (FR-012)', () => {
  const state = playingState();
  const medium = createAsteroid('MEDIUM', 400, 300, 0.5, tierFor(0));
  const projectile = projectileAt(400, 300);
  state.asteroids.push(medium);
  state.projectiles.push(projectile);

  resolveCollisions(state);

  assert.equal(state.score, 50);
  assert.equal(medium.dead, true);
  assert.equal(projectile.dead, true);
  const children = state.asteroids.filter((a) => a !== medium);
  assert.equal(children.length, 2);
  assert.ok(children.every((child) => child.kind === 'SMALL'));
});

test('regular versus regular applies the size rule with no score, each pair once (FR-014)', () => {
  const state = playingState();
  const first = createAsteroid('MEDIUM', 400, 300, 0, tierFor(0));
  const second = createAsteroid('MEDIUM', 410, 305, Math.PI, tierFor(0));
  state.asteroids.push(first, second);

  resolveCollisions(state);

  assert.equal(state.score, 0);
  assert.equal(first.dead, true);
  assert.equal(second.dead, true);
  const children = state.asteroids.filter((a) => a !== first && a !== second);
  assert.equal(children.length, 4);

  const scoreBefore = state.score;
  resolveCollisions(state);
  assert.equal(state.score, scoreBefore);
});

test('a projectile resolves an asteroid before the ship does (R8 order)', () => {
  const state = playingState();
  state.ship.x = 400;
  state.ship.y = 300;
  const small = createAsteroid('SMALL', 400, 300, 0, tierFor(0));
  const projectile = projectileAt(400, 300);
  state.asteroids.push(small);
  state.projectiles.push(projectile);

  resolveCollisions(state);

  assert.equal(small.dead, true);
  assert.equal(projectile.dead, true);
  assert.equal(state.score, 200);
});

test('ship versus regular only resolves while alive, playing and outside immunity', () => {
  const active = playingState();
  const activeSmall = createAsteroid('SMALL', 10, 10, 0, tierFor(0));
  active.asteroids.push(activeSmall);
  resolveCollisions(active);
  assert.equal(activeSmall.dead, true);
  assert.equal(active.score, 0);

  const immune = playingState();
  immune.shieldT = 1500;
  const immuneSmall = createAsteroid('SMALL', 10, 10, 0, tierFor(0));
  immune.asteroids.push(immuneSmall);
  resolveCollisions(immune);
  assert.equal(immuneSmall.dead, false);

  const dying = playingState();
  dying.phase = 'DYING';
  const dyingSmall = createAsteroid('SMALL', 10, 10, 0, tierFor(0));
  dying.asteroids.push(dyingSmall);
  resolveCollisions(dying);
  assert.equal(dyingSmall.dead, false);
});

test('a non-overlapping pair is never resolved', () => {
  const state = playingState();
  const far = createAsteroid('SMALL', 700, 500, 0, tierFor(0));
  const other = createAsteroid('SMALL', 100, 100, Math.PI, tierFor(0));
  state.asteroids.push(far, other);

  resolveCollisions(state);

  assert.equal(far.dead, false);
  assert.equal(other.dead, false);
  assert.equal(state.score, 0);
});

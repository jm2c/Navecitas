import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  GAME_EVENTS,
  emitEvent,
  drainEvents,
  clearEvents,
} from '../src/events.js';
import { createGame, tierFor } from '../src/state.js';
import { update } from '../src/update.js';
import { resolveCollisions } from '../src/collision.js';
import { createAsteroid, createPowerup, createSpecial } from '../src/entities.js';
import { DT_MS, MAX_LIVES } from '../src/config.js';

const NONE = { left: false, right: false, up: false, down: false, fire: false };
const FIRE = { ...NONE, fire: true };
const NO_DROP = () => 1;

function playingState() {
  const state = createGame();
  state.phase = 'PLAYING';
  state.spawnT = 1e9;
  state.ship.x = 10;
  state.ship.y = 10;
  return state;
}

function count(state, id) {
  return state.events.filter((event) => event === id).length;
}

function projectileAt(x, y) {
  return { x, y, vx: 0, vy: 300, radius: 3.5, dead: false };
}

function addTarget(state, kind, x = 400, y = 300) {
  const asteroid = createAsteroid(kind, x, y, 0, tierFor(0));
  state.asteroids.push(asteroid);
  state.projectiles.push(projectileAt(x, y));
  return asteroid;
}

const EXPECTED_IDS = [
  'countdown:3',
  'countdown:2',
  'countdown:1',
  'countdown:go',
  'shot',
  'asteroid:destroyed',
  'asteroid:split',
  'life:lost',
  'life:gained',
  'powerup:collected',
  'game:over',
];

test('the semantic event ids are exact and frozen', () => {
  assert.deepEqual(Object.values(GAME_EVENTS).sort(), [...EXPECTED_IDS].sort());
  assert.equal(Object.keys(GAME_EVENTS).length, EXPECTED_IDS.length);
  assert.equal(Object.isFrozen(GAME_EVENTS), true);
});

test('the event queue appends, drains in order and clears', () => {
  const state = createGame();

  emitEvent(state, GAME_EVENTS.SHOT);
  emitEvent(state, GAME_EVENTS.ASTEROID_DESTROYED);
  assert.deepEqual(state.events, ['shot', 'asteroid:destroyed']);

  const drained = drainEvents(state);
  assert.deepEqual(drained, ['shot', 'asteroid:destroyed']);
  assert.deepEqual(state.events, []);
  assert.notEqual(drained, state.events);

  emitEvent(state, GAME_EVENTS.LIFE_LOST);
  clearEvents(state);
  assert.deepEqual(state.events, []);
  assert.deepEqual(drainEvents(state), []);
});

test('a new game starts with an empty event queue', () => {
  assert.deepEqual(createGame().events, []);
});

test('a successful shot emits exactly one shot event', () => {
  const state = playingState();

  update(state, DT_MS, FIRE);

  assert.equal(state.projectiles.length, 1);
  assert.equal(count(state, GAME_EVENTS.SHOT), 1);
});

test('a shot blocked by the cooldown emits nothing', () => {
  const state = playingState();

  update(state, DT_MS, FIRE);
  state.events = [];
  update(state, DT_MS, FIRE);

  assert.equal(state.projectiles.length, 1);
  assert.equal(count(state, GAME_EVENTS.SHOT), 0);
});

test('a shot blocked by the projectile limit emits nothing', () => {
  const state = playingState();
  for (let index = 0; index < 5; index += 1) {
    state.projectiles.push(projectileAt(100 + index * 20, 100));
  }

  update(state, DT_MS, FIRE);

  assert.equal(state.projectiles.length, 5);
  assert.equal(count(state, GAME_EVENTS.SHOT), 0);
});

test('a double-shot trigger pull emits one shot event for two projectiles', () => {
  const state = playingState();
  state.doubleShot = true;

  update(state, DT_MS, FIRE);

  assert.equal(state.projectiles.length, 2);
  assert.equal(count(state, GAME_EVENTS.SHOT), 1);
});

test('destroying a small asteroid emits one destruction event', () => {
  const state = playingState();
  addTarget(state, 'SMALL');

  resolveCollisions(state, NO_DROP);

  assert.equal(count(state, GAME_EVENTS.ASTEROID_DESTROYED), 1);
  assert.equal(count(state, GAME_EVENTS.ASTEROID_SPLIT), 0);
});

test('splitting a medium or large asteroid emits one split event each', () => {
  const mediumState = playingState();
  addTarget(mediumState, 'MEDIUM');
  resolveCollisions(mediumState, NO_DROP);
  assert.equal(count(mediumState, GAME_EVENTS.ASTEROID_SPLIT), 1);
  assert.equal(count(mediumState, GAME_EVENTS.ASTEROID_DESTROYED), 0);

  const largeState = playingState();
  addTarget(largeState, 'LARGE');
  resolveCollisions(largeState, NO_DROP);
  assert.equal(count(largeState, GAME_EVENTS.ASTEROID_SPLIT), 1);
  assert.equal(count(largeState, GAME_EVENTS.ASTEROID_DESTROYED), 0);
});

test('several asteroids resolved in one update emit one event each', () => {
  const state = playingState();
  const first = createAsteroid('SMALL', 400, 300, 0, tierFor(0));
  const second = createAsteroid('SMALL', 600, 300, 0, tierFor(0));
  state.asteroids.push(first, second);
  state.projectiles.push(projectileAt(400, 300), projectileAt(600, 300));

  resolveCollisions(state, NO_DROP);

  assert.equal(count(state, GAME_EVENTS.ASTEROID_DESTROYED), 2);
});

test('a ship collision and an asteroid collision still emit their size event', () => {
  const shipState = playingState();
  shipState.asteroids.push(createAsteroid('SMALL', 10, 10, 0, tierFor(0)));

  resolveCollisions(shipState, NO_DROP);

  assert.equal(count(shipState, GAME_EVENTS.ASTEROID_DESTROYED), 1);

  const rockState = playingState();
  rockState.asteroids.push(
    createAsteroid('MEDIUM', 400, 300, 0, tierFor(0)),
    createAsteroid('MEDIUM', 410, 305, Math.PI, tierFor(0)),
  );

  resolveCollisions(rockState, NO_DROP);

  assert.equal(count(rockState, GAME_EVENTS.ASTEROID_SPLIT), 2);
});

test('an overlap that does not resolve emits no combat event', () => {
  const state = playingState();
  state.asteroids.push(createAsteroid('SMALL', 700, 500, 0, tierFor(0)));
  state.projectiles.push(projectileAt(100, 100));

  resolveCollisions(state, NO_DROP);

  assert.equal(state.events.length, 0);
});

test('a confirmed hit emits one life-loss event and a shielded hit emits none', () => {
  const state = playingState();
  state.asteroids.push(createAsteroid('SMALL', 10, 10, 0, tierFor(0)));

  resolveCollisions(state, NO_DROP);

  assert.equal(count(state, GAME_EVENTS.LIFE_LOST), 1);
  assert.equal(count(state, GAME_EVENTS.GAME_OVER), 0);

  const shielded = playingState();
  shielded.shieldT = 1000;
  shielded.asteroids.push(createAsteroid('SMALL', 10, 10, 0, tierFor(0)));

  resolveCollisions(shielded, NO_DROP);

  assert.equal(count(shielded, GAME_EVENTS.LIFE_LOST), 0);
});

test('the final hit still emits one life-loss event', () => {
  const state = playingState();
  state.lives = 1;
  state.asteroids.push(createAsteroid('SMALL', 10, 10, 0, tierFor(0)));

  resolveCollisions(state, NO_DROP);

  assert.equal(state.phase, 'GAME_OVER');
  assert.equal(count(state, GAME_EVENTS.LIFE_LOST), 1);
});

test('a life pickup emits one life-gain event by projectile and by ship contact', () => {
  const shotState = playingState();
  const special = createSpecial(400, 300, 0);
  shotState.asteroids.push(special);
  shotState.projectiles.push(projectileAt(400, 300));

  resolveCollisions(shotState, NO_DROP);

  assert.equal(count(shotState, GAME_EVENTS.LIFE_GAINED), 1);
  assert.equal(shotState.lives, 4);

  const contactState = playingState();
  contactState.asteroids.push(createSpecial(10, 10, 0));

  resolveCollisions(contactState, NO_DROP);

  assert.equal(count(contactState, GAME_EVENTS.LIFE_GAINED), 1);
  assert.equal(contactState.lives, 4);
});

test('a life pickup at the maximum still emits one life-gain event', () => {
  const state = playingState();
  state.lives = MAX_LIVES;
  state.asteroids.push(createSpecial(400, 300, 0));
  state.projectiles.push(projectileAt(400, 300));

  resolveCollisions(state, NO_DROP);

  assert.equal(count(state, GAME_EVENTS.LIFE_GAINED), 1);
  assert.equal(state.lives, MAX_LIVES);
});

test('a power-up emits one collection event by projectile and by ship contact', () => {
  const shotState = playingState();
  shotState.asteroids.push(createPowerup(400, 300, 0, 200));
  shotState.projectiles.push(projectileAt(400, 300));

  resolveCollisions(shotState, NO_DROP);

  assert.equal(count(shotState, GAME_EVENTS.POWERUP_COLLECTED), 1);
  assert.equal(shotState.doubleShot, true);

  const contactState = playingState();
  contactState.asteroids.push(createPowerup(10, 10, 0, 200));

  resolveCollisions(contactState, NO_DROP);

  assert.equal(count(contactState, GAME_EVENTS.POWERUP_COLLECTED), 1);
  assert.equal(contactState.doubleShot, true);
});

test('an unresolved collectible overlap emits no collection event', () => {
  const state = playingState();
  state.asteroids.push(createPowerup(700, 500, 0, 200));
  state.projectiles.push(projectileAt(100, 100));

  resolveCollisions(state, NO_DROP);

  assert.equal(count(state, GAME_EVENTS.POWERUP_COLLECTED), 0);
  assert.equal(count(state, GAME_EVENTS.LIFE_GAINED), 0);
});

test('the countdown emits each step exactly once in order', () => {
  const state = createGame();

  update(state, DT_MS, NONE);
  assert.deepEqual(state.events, []);

  update(state, DT_MS, FIRE);
  assert.equal(state.phase, 'COUNTDOWN');
  assert.deepEqual(state.events, [GAME_EVENTS.COUNTDOWN_3]);

  update(state, DT_MS, NONE);
  assert.deepEqual(state.events, [GAME_EVENTS.COUNTDOWN_3]);

  update(state, 850, NONE);
  assert.deepEqual(state.events, [
    GAME_EVENTS.COUNTDOWN_3,
    GAME_EVENTS.COUNTDOWN_2,
  ]);

  update(state, 850, NONE);
  assert.deepEqual(state.events, [
    GAME_EVENTS.COUNTDOWN_3,
    GAME_EVENTS.COUNTDOWN_2,
    GAME_EVENTS.COUNTDOWN_1,
  ]);

  update(state, 850, NONE);
  assert.deepEqual(state.events, [
    GAME_EVENTS.COUNTDOWN_3,
    GAME_EVENTS.COUNTDOWN_2,
    GAME_EVENTS.COUNTDOWN_1,
    GAME_EVENTS.COUNTDOWN_GO,
  ]);

  update(state, 100, NONE);
  assert.equal(count(state, GAME_EVENTS.COUNTDOWN_GO), 1);

  state.spawnT = 1e9;
  update(state, 1300, NONE);
  assert.equal(state.phase, 'PLAYING');
  assert.deepEqual(state.events, [
    GAME_EVENTS.COUNTDOWN_3,
    GAME_EVENTS.COUNTDOWN_2,
    GAME_EVENTS.COUNTDOWN_1,
    GAME_EVENTS.COUNTDOWN_GO,
  ]);
});

test('the final hit emits one game-over event after the life-loss event', () => {
  const state = playingState();
  state.lives = 1;
  state.asteroids.push(createAsteroid('SMALL', 10, 10, 0, tierFor(0)));

  resolveCollisions(state, NO_DROP);

  assert.equal(state.phase, 'GAME_OVER');
  assert.equal(count(state, GAME_EVENTS.LIFE_LOST), 1);
  assert.equal(count(state, GAME_EVENTS.GAME_OVER), 1);
  assert.ok(
    state.events.indexOf(GAME_EVENTS.LIFE_LOST) <
      state.events.indexOf(GAME_EVENTS.GAME_OVER),
  );

  resolveCollisions(state, NO_DROP);
  update(state, DT_MS, NONE);

  assert.equal(count(state, GAME_EVENTS.GAME_OVER), 1);
});

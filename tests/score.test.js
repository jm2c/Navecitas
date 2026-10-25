import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createGame, tierFor } from '../src/state.js';
import { addScore, applySizeRule, reserveIcons } from '../src/score.js';
import { createAsteroid } from '../src/entities.js';
import { V_HALF_ANGLE, MAX_LIVES, MAX_RESERVE_ICONS } from '../src/config.js';

test('addScore is monotonic and only adds 50 or 200 (SC-004)', () => {
  const state = createGame();
  const increments = [200, 50, 200, 200, 50, 200];
  let expected = 0;
  for (const pts of increments) {
    addScore(state, pts);
    expected += pts;
    assert.equal(state.score, expected);
    assert.ok(state.score >= 0);
  }
  addScore(state, 0);
  assert.equal(state.score, expected);
});

const NO_DROP = () => 1;

test('five small asteroids destroyed yield exactly 1000 points (SC-004)', () => {
  const state = createGame();
  for (let i = 0; i < 5; i += 1) {
    const small = createAsteroid('SMALL', 400, 300, 0, tierFor(state.score));
    applySizeRule(state, small, true, NO_DROP);
  }
  assert.equal(state.score, 1000);
});

test('reserveIcons equals max(0, lives - 1)', () => {
  assert.equal(reserveIcons(3), 2);
  assert.equal(reserveIcons(1), 0);
  assert.equal(reserveIcons(0), 0);
  assert.equal(reserveIcons(MAX_LIVES), MAX_RESERVE_ICONS);
  assert.equal(reserveIcons(MAX_LIVES + 2), MAX_LIVES + 1);
});

test('a small destroyed with award gains 200 and creates no children (FR-011)', () => {
  const state = createGame();
  const small = createAsteroid('SMALL', 400, 300, 1, tierFor(0));
  const children = applySizeRule(state, small, true, NO_DROP);
  assert.equal(state.score, 200);
  assert.equal(children.length, 0);
  assert.equal(small.dead, true);
});

test('a medium destroyed with award gains 50 and splits into two smalls in a V (FR-012)', () => {
  const state = createGame();
  const heading = 1.2;
  const medium = createAsteroid('MEDIUM', 400, 300, heading, tierFor(0));
  const children = applySizeRule(state, medium, true);
  assert.equal(state.score, 50);
  assert.equal(children.length, 2);
  for (const child of children) {
    assert.equal(child.kind, 'SMALL');
    assert.equal(child.x, 400);
    assert.equal(child.y, 300);
    assert.ok(Math.abs(Math.abs(child.heading - heading) - V_HALF_ANGLE) < 1e-9);
    assert.ok(Math.abs(Math.hypot(child.vx, child.vy) - 200) < 1e-9);
  }
  assert.ok(Math.abs((children[1].heading - heading) - V_HALF_ANGLE) < 1e-9);
  assert.ok(Math.abs((children[0].heading - heading) + V_HALF_ANGLE) < 1e-9);
});

test('a large destroyed with award gains 50 and splits into two mediums in a V (FR-013)', () => {
  const state = createGame();
  const heading = -0.4;
  const large = createAsteroid('LARGE', 400, 300, heading, tierFor(0));
  const children = applySizeRule(state, large, true);
  assert.equal(state.score, 50);
  assert.equal(children.length, 2);
  for (const child of children) {
    assert.equal(child.kind, 'MEDIUM');
    assert.equal(child.x, 400);
    assert.equal(child.y, 300);
    assert.ok(Math.abs(Math.abs(child.heading - heading) - V_HALF_ANGLE) < 1e-9);
  }
});

test('asteroid-vs-asteroid and ship hits award no points (FR-014)', () => {
  const state = createGame();
  const small = createAsteroid('SMALL', 400, 300, 0, tierFor(0));
  applySizeRule(state, small, false, NO_DROP);
  assert.equal(state.score, 0);

  const medium = createAsteroid('MEDIUM', 400, 300, 0, tierFor(0));
  const children = applySizeRule(state, medium, false);
  assert.equal(state.score, 0);
  assert.equal(children.length, 2);
});

test('the special asteroid awards no points and never splits (FR-022)', () => {
  const state = createGame();
  const special = {
    kind: 'SPECIAL',
    x: 400,
    y: 300,
    heading: 0,
    vx: -200,
    vy: 0,
    radius: 14,
    rot: 0,
    spin: 0,
    seed: 3,
    dead: false,
  };
  const children = applySizeRule(state, special, true);
  assert.equal(state.score, 0);
  assert.equal(children.length, 0);
});

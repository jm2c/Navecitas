import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GAME_EVENTS } from '../src/events.js';
import { CUE_CATALOG, CUE_DURATION_LIMIT_MS } from '../src/audio/cues.js';

const EXPECTED_IDS = Object.values(GAME_EVENTS);

test('the catalog covers every semantic event exactly once', () => {
  assert.deepEqual(Object.keys(CUE_CATALOG).sort(), [...EXPECTED_IDS].sort());
  assert.equal(Object.keys(CUE_CATALOG).length, EXPECTED_IDS.length);
});

test('every cue recipe is unique', () => {
  const signatures = Object.values(CUE_CATALOG).map((recipe) => JSON.stringify(recipe));
  assert.equal(new Set(signatures).size, signatures.length);
  assert.equal(CUE_CATALOG['countdown:go'].layers.length >= 1, true);

  for (const digit of ['countdown:3', 'countdown:2', 'countdown:1']) {
    assert.notDeepEqual(CUE_CATALOG['countdown:go'], CUE_CATALOG[digit]);
  }
});

test('durations respect the cue limit and the game-over limit', () => {
  assert.equal(CUE_DURATION_LIMIT_MS, 1500);

  for (const [id, recipe] of Object.entries(CUE_CATALOG)) {
    assert.ok(recipe.durationMs > 0, `${id} duration is positive`);
    assert.ok(recipe.durationMs <= CUE_DURATION_LIMIT_MS, `${id} stays within the limit`);
    assert.ok(recipe.layers.length >= 1, `${id} has at least one layer`);
  }

  assert.ok(CUE_CATALOG['game:over'].durationMs <= 1000);
});

test('every layer gain stays in the safe range', () => {
  for (const [id, recipe] of Object.entries(CUE_CATALOG)) {
    for (const layer of recipe.layers) {
      assert.ok(layer.gain >= 0.02 && layer.gain <= 0.1, `${id} gain is safe`);
      assert.ok(layer.durationMs > 0, `${id} layer duration is positive`);
      const end = (layer.delayMs ?? 0) + layer.durationMs;
      assert.ok(end <= recipe.durationMs, `${id} layer fits inside the cue`);
    }
  }
});

test('the catalog contains no audio asset or network reference', () => {
  const serialized = JSON.stringify(CUE_CATALOG);
  assert.doesNotMatch(serialized, /https?:\/\//);
  assert.doesNotMatch(serialized, /\.(wav|mp3|ogg|m4a|flac|aac|opus)\b/i);
  assert.doesNotMatch(serialized, /"src"\s*:/);

  for (const recipe of Object.values(CUE_CATALOG)) {
    for (const layer of recipe.layers) {
      assert.ok(layer.kind === 'tone' || layer.kind === 'noise');
      assert.equal(Object.hasOwn(layer, 'src'), false);
    }
  }
});

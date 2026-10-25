import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ASSETS,
  ASSET_KEYS,
  ENTITY_ASSET_KEYS,
  REQUIRED_LICENSE_FILES,
  assetKeyForAsteroid,
} from '../src/render/asset-manifest.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const EXPECTED_KEYS = [
  'rocket',
  'bolt',
  'heart',
  'asteroidSmall',
  'asteroidMedium',
  'asteroidLarge',
  'background',
  'font',
];
const EXPECTED_LICENSES = ['CC0-1.0', 'CC-BY-4.0', 'OFL-1.1'];

test('the manifest exposes exactly the required asset keys', () => {
  assert.deepEqual([...ASSET_KEYS].sort(), [...EXPECTED_KEYS].sort());
  assert.deepEqual(Object.keys(ASSETS).sort(), [...EXPECTED_KEYS].sort());
});

test('the entity mapping is exhaustive and unambiguous', () => {
  assert.equal(ENTITY_ASSET_KEYS.ship, 'rocket');
  assert.equal(ENTITY_ASSET_KEYS.POWERUP, 'bolt');
  assert.equal(ENTITY_ASSET_KEYS.SPECIAL, 'heart');
  assert.equal(ENTITY_ASSET_KEYS.life, 'heart');
  assert.equal(ENTITY_ASSET_KEYS.SMALL, 'asteroidSmall');
  assert.equal(ENTITY_ASSET_KEYS.MEDIUM, 'asteroidMedium');
  assert.equal(ENTITY_ASSET_KEYS.LARGE, 'asteroidLarge');
  assert.equal(assetKeyForAsteroid('SMALL'), 'asteroidSmall');
  assert.equal(assetKeyForAsteroid('MEDIUM'), 'asteroidMedium');
  assert.equal(assetKeyForAsteroid('LARGE'), 'asteroidLarge');
  assert.notEqual(ENTITY_ASSET_KEYS.POWERUP, ENTITY_ASSET_KEYS.SPECIAL);
});

test('every asset has local paths and complete provenance', () => {
  for (const [key, asset] of Object.entries(ASSETS)) {
    assert.equal(asset.key, key, `${key}: key field must match the manifest key`);
    assert.equal(typeof asset.path, 'string', `${key}: path must be a string`);
    assert.ok(asset.path.startsWith('assets/'), `${key}: path must be under assets/`);
    assert.ok(!/^https?:\/\//.test(asset.path), `${key}: runtime path must be local`);
    assert.ok(existsSync(join(ROOT, asset.path)), `${key}: missing ${asset.path}`);
    assert.ok(['image', 'font'].includes(asset.type), `${key}: invalid type`);
    assert.equal(typeof asset.source, 'string', `${key}: source must be a string`);
    assert.ok(asset.source.length > 0, `${key}: source must not be empty`);
    assert.equal(typeof asset.author, 'string', `${key}: author must be a string`);
    assert.ok(asset.author.length > 0, `${key}: author must not be empty`);
    assert.ok(EXPECTED_LICENSES.includes(asset.license), `${key}: invalid license`);
    assert.equal(typeof asset.fallback, 'string', `${key}: fallback must be a string`);
    assert.ok(asset.fallback.length > 0, `${key}: fallback must not be empty`);
    if (asset.type === 'image') {
      assert.ok(Number.isInteger(asset.width) && asset.width > 0, `${key}: width`);
      assert.ok(Number.isInteger(asset.height) && asset.height > 0, `${key}: height`);
    }
    if (asset.license === 'CC-BY-4.0') {
      assert.equal(typeof asset.attribution, 'string', `${key}: attribution required`);
      assert.ok(asset.attribution.length > 0, `${key}: attribution must not be empty`);
    }
  }
});

test('the license files and credits record exist', () => {
  for (const relativePath of REQUIRED_LICENSE_FILES) {
    assert.ok(existsSync(join(ROOT, relativePath)), `missing ${relativePath}`);
  }
  assert.ok(existsSync(join(ROOT, 'assets/CREDITS.md')), 'missing assets/CREDITS.md');
});

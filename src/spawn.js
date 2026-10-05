import { TIMINGS, WORLD, SPECIAL_SPAWN_INTERVAL, MAX_RESERVE_ICONS } from './config.js';
import { createAsteroid, createSpecial } from './entities.js';
import { tierFor } from './state.js';

const EDGE_INSET = 0.1;

export function pickKind(weights, random = Math.random) {
  const entries = [
    ['SMALL', weights.SMALL],
    ['MEDIUM', weights.MEDIUM],
    ['LARGE', weights.LARGE],
  ].filter(([, weight]) => weight > 0);

  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [kind, weight] of entries) {
    roll -= weight;
    if (roll < 0) return kind;
  }
  return entries[entries.length - 1][0];
}

export function edgeSpawn(random = Math.random) {
  const edge = Math.floor(random() * 4);
  const along = random();
  const swing = random();

  if (edge === 0) {
    return { x: 0, y: along * WORLD.H, heading: -Math.PI / 2 + EDGE_INSET + swing * (Math.PI - 2 * EDGE_INSET) };
  }
  if (edge === 1) {
    return { x: WORLD.W, y: along * WORLD.H, heading: Math.PI / 2 + EDGE_INSET + swing * (Math.PI - 2 * EDGE_INSET) };
  }
  if (edge === 2) {
    return { x: along * WORLD.W, y: WORLD.H, heading: -EDGE_INSET - swing * (Math.PI - 2 * EDGE_INSET) };
  }
  return { x: along * WORLD.W, y: 0, heading: EDGE_INSET + swing * (Math.PI - 2 * EDGE_INSET) };
}

function resetSpawnTimer(state, random) {
  const jitter = (random() * 2 - 1) * TIMINGS.spawnJitter;
  state.spawnT = TIMINGS.spawnCadence + jitter;
}

export function tickSpawn(state, dtMs, random = Math.random) {
  state.spawnT -= dtMs;
  if (state.spawnT > 0) return;

  const tier = tierFor(state.score);
  const regular = state.asteroids.filter((asteroid) => asteroid.kind !== 'SPECIAL');
  if (regular.length < tier.max) {
    const kind = pickKind(tier.weights, random);
    const { x, y, heading } = edgeSpawn(random);
    state.asteroids.push(createAsteroid(kind, x, y, heading, tier));
  }
  resetSpawnTimer(state, random);
}

export function spawnSpecialIfCrossed(state, prevScore, nextScore) {
  if (Math.floor(prevScore / SPECIAL_SPAWN_INTERVAL) >= Math.floor(nextScore / SPECIAL_SPAWN_INTERVAL)) {
    return;
  }
  const reserve = Math.max(0, state.lives - 1);
  if (reserve >= MAX_RESERVE_ICONS) return;
  const { x, y, heading } = edgeSpawn();
  state.asteroids.push(createSpecial(x, y, heading));
}

import { MAX_LIVES, POWERUP_DROP_CHANCE, V_HALF_ANGLE } from './config.js';
import { createAsteroid, createPowerup } from './entities.js';
import { tierFor } from './state.js';
import { spawnSpecialIfCrossed } from './spawn.js';

export function reserveIcons(lives) {
  return Math.max(0, lives - 1);
}

export function addScore(state, pts) {
  if (pts !== 50 && pts !== 200) return;
  const prevScore = state.score;
  state.score += pts;
  spawnSpecialIfCrossed(state, prevScore, state.score);
}

export function grantLife(state) {
  state.lives = Math.min(state.lives + 1, MAX_LIVES);
}

export function applySizeRule(state, asteroid, awardPoints, random = Math.random) {
  asteroid.dead = true;

  if (asteroid.kind === 'SMALL') {
    if (awardPoints) addScore(state, 200);
    if (random() < POWERUP_DROP_CHANCE) {
      const speed = Math.hypot(asteroid.vx, asteroid.vy);
      const heading = Math.atan2(asteroid.vy, asteroid.vx);
      return [createPowerup(asteroid.x, asteroid.y, heading, speed)];
    }
    return [];
  }

  if (asteroid.kind === 'MEDIUM' || asteroid.kind === 'LARGE') {
    if (awardPoints) addScore(state, 50);
    const childKind = asteroid.kind === 'MEDIUM' ? 'SMALL' : 'MEDIUM';
    const tier = tierFor(state.score);
    const children = [
      createAsteroid(childKind, asteroid.x, asteroid.y, asteroid.heading - V_HALF_ANGLE, tier),
      createAsteroid(childKind, asteroid.x, asteroid.y, asteroid.heading + V_HALF_ANGLE, tier),
    ];
    for (const child of children) {
      child.birthStep = state.stepCount;
    }
    return children;
  }

  return [];
}

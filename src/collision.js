import { TIMINGS } from './config.js';
import { applySizeRule, grantLife, reserveIcons } from './score.js';

function hits(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const radius = a.radius + b.radius;
  return dx * dx + dy * dy <= radius * radius;
}

function hitShip(state) {
  if (reserveIcons(state.lives) >= 1) {
    state.phase = 'DYING';
    state.ship.alive = false;
    state.explosionT = TIMINGS.deathDelay;
  } else {
    state.phase = 'GAME_OVER';
    state.ship = null;
  }
}

export function resolveCollisions(state) {
  const asteroids = state.asteroids;
  const newChildren = [];

  for (const projectile of state.projectiles) {
    if (projectile.dead) continue;
    for (const asteroid of asteroids) {
      if (asteroid.dead) continue;
      if (!hits(projectile, asteroid)) continue;
      projectile.dead = true;
      if (asteroid.kind === 'SPECIAL') {
        asteroid.dead = true;
        grantLife(state);
      } else {
        newChildren.push(...applySizeRule(state, asteroid, true));
      }
      break;
    }
  }

  const ship = state.ship;
  if (ship && ship.alive && state.phase === 'PLAYING') {
    for (const asteroid of asteroids) {
      if (asteroid.dead || asteroid.kind !== 'SPECIAL') continue;
      if (!hits(ship, asteroid)) continue;
      asteroid.dead = true;
      grantLife(state);
    }

    if (state.shieldT <= 0) {
      for (const asteroid of asteroids) {
        if (asteroid.dead || asteroid.kind === 'SPECIAL') continue;
        if (!hits(ship, asteroid)) continue;
        newChildren.push(...applySizeRule(state, asteroid, false));
        hitShip(state);
        break;
      }
    }
  }

  for (let i = 0; i < asteroids.length; i += 1) {
    const first = asteroids[i];
    if (first.dead || first.kind === 'SPECIAL') continue;
    for (let j = i + 1; j < asteroids.length; j += 1) {
      const second = asteroids[j];
      if (second.dead || second.kind === 'SPECIAL') continue;
      if (
        first.birthStep !== undefined &&
        second.birthStep !== undefined &&
        first.birthStep === second.birthStep
      ) {
        continue;
      }
      if (!hits(first, second)) continue;
      newChildren.push(...applySizeRule(state, first, false));
      newChildren.push(...applySizeRule(state, second, false));
    }
  }

  if (newChildren.length > 0) {
    asteroids.push(...newChildren);
  }
}

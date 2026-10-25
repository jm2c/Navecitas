import { createShip } from './entities.js';
import { TIERS } from './config.js';

export function tierFor(score) {
  for (const tier of TIERS) {
    if (score <= tier.upper) return tier;
  }
  return TIERS[TIERS.length - 1];
}

export function createGame() {
  return {
    phase: 'START',
    countdownStep: null,
    countdownT: 0,
    score: 0,
    lives: 3,
    ship: createShip(),
    projectiles: [],
    asteroids: [],
    spawnT: 0,
    stepCount: 0,
    doubleShot: false,
    explosionT: 0,
    shieldT: 0,
    blinkT: 0,
    shotT: 0,
    events: [],
  };
}

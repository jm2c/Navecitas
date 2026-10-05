import { WORLD, PALETTE, TIMINGS, RADII } from '../config.js';
import {
  drawShip,
  drawProjectile,
  drawAsteroid,
  drawSpecial,
  drawExplosion,
} from './shapes.js';
import {
  drawStartPrompt,
  drawCountdown,
  drawGameOver,
  drawScore,
  drawLifeIcons,
} from './overlays.js';

function blinkHidden(state) {
  if (state.shieldT <= 0) return false;
  return state.shieldT % TIMINGS.blinkPeriod >= TIMINGS.blinkPeriod / 2;
}

export function render(ctx, state, now) {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, WORLD.W, WORLD.H);

  for (const projectile of state.projectiles) {
    drawProjectile(ctx, projectile);
  }

  for (const asteroid of state.asteroids) {
    if (asteroid.kind === 'SPECIAL') drawSpecial(ctx, asteroid);
    else drawAsteroid(ctx, asteroid);
  }

  if (state.phase === 'DYING' && state.ship) {
    const progress = 1 - state.explosionT / TIMINGS.deathDelay;
    drawExplosion(ctx, state.ship.x, state.ship.y, progress);
  }

  if (state.ship && state.ship.alive && !blinkHidden(state)) {
    drawShip(ctx, state.ship.x, state.ship.y, state.ship.angle, RADII.ship, PALETTE.fg);
  }

  drawScore(ctx, state.score);
  drawLifeIcons(ctx, state.lives);

  if (state.phase === 'START') drawStartPrompt(ctx, state);
  if (state.phase === 'COUNTDOWN') drawCountdown(ctx, state);
  if (state.phase === 'GAME_OVER') drawGameOver(ctx);
}

import { ACCEL, LIMITS, TIMINGS, WORLD } from './config.js';
import { createProjectile, createShip } from './entities.js';
import { tickSpawn } from './spawn.js';
import { resolveCollisions } from './collision.js';

const COUNTDOWN_STEPS = ['3', '2', '1', 'GO'];

const NO_INPUT = { left: false, right: false, up: false, down: false, fire: false };

function stepDuration(step) {
  const base = TIMINGS.countdownShrink + TIMINGS.countdownHold;
  return step === 'GO' ? base + TIMINGS.goExit : base;
}

function phaseMachine(state, dtMs, input) {
  if (state.phase === 'START') {
    if (input.fire) {
      state.phase = 'COUNTDOWN';
      state.countdownStep = '3';
      state.countdownT = 0;
    }
    return;
  }

  if (state.phase === 'COUNTDOWN') {
    state.countdownT += dtMs;
    if (state.countdownT >= stepDuration(state.countdownStep)) {
      const index = COUNTDOWN_STEPS.indexOf(state.countdownStep);
      if (index < COUNTDOWN_STEPS.length - 1) {
        state.countdownStep = COUNTDOWN_STEPS[index + 1];
        state.countdownT = 0;
      } else {
        state.phase = 'PLAYING';
        state.countdownStep = null;
        state.countdownT = 0;
      }
    }
  }
}

function updateShip(state, dtMs, input) {
  const ship = state.ship;
  if (!ship || !ship.alive) return;
  const dt = dtMs / 1000;

  if (input.left) ship.angle -= ACCEL.rotate * dt;
  if (input.right) ship.angle += ACCEL.rotate * dt;

  if (input.up) ship.speed = Math.min(ship.speed + ACCEL.thrust * dt, LIMITS.fwd);
  if (input.down) ship.speed = Math.max(ship.speed - ACCEL.brake * dt, 0);

  ship.x += Math.cos(ship.angle) * ship.speed * dt;
  ship.y += Math.sin(ship.angle) * ship.speed * dt;

  if (ship.x < 0) ship.x += WORLD.W;
  else if (ship.x > WORLD.W) ship.x -= WORLD.W;
  if (ship.y < 0) ship.y += WORLD.H;
  else if (ship.y > WORLD.H) ship.y -= WORLD.H;
}

function fire(state, input) {
  const ship = state.ship;
  if (!input.fire || state.shotT > 0) return;
  if (state.projectiles.length >= LIMITS.maxProjectiles) return;

  state.projectiles.push(createProjectile(ship));
  ship.speed = Math.max(ship.speed - LIMITS.recoil, -LIMITS.back);
  state.shotT = TIMINGS.shotInterval;
}

function moveProjectiles(state, dtMs) {
  const dt = dtMs / 1000;
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    if (
      projectile.x < 0 ||
      projectile.x > WORLD.W ||
      projectile.y < 0 ||
      projectile.y > WORLD.H
    ) {
      projectile.dead = true;
    }
  }
}

function moveAsteroids(state, dtMs) {
  const dt = dtMs / 1000;
  for (const asteroid of state.asteroids) {
    asteroid.x += asteroid.vx * dt;
    asteroid.y += asteroid.vy * dt;
    asteroid.rot += asteroid.spin * dt;
    if (
      asteroid.x < 0 ||
      asteroid.x > WORLD.W ||
      asteroid.y < 0 ||
      asteroid.y > WORLD.H
    ) {
      asteroid.dead = true;
    }
  }
}

const SPAWN_PHASES = new Set(['PLAYING', 'DYING', 'GAME_OVER']);

export function update(state, dtMs, input = NO_INPUT) {
  const phaseBefore = state.phase;
  const shieldBefore = state.shieldT;

  state.blinkT += dtMs;

  phaseMachine(state, dtMs, input);

  if (state.phase === 'PLAYING') {
    updateShip(state, dtMs, input);
    fire(state, input);
  }

  moveProjectiles(state, dtMs);
  moveAsteroids(state, dtMs);

  if (SPAWN_PHASES.has(state.phase)) {
    tickSpawn(state, dtMs);
  }

  if (SPAWN_PHASES.has(state.phase)) {
    resolveCollisions(state);
  }

  state.projectiles = state.projectiles.filter((projectile) => !projectile.dead);
  state.asteroids = state.asteroids.filter((asteroid) => !asteroid.dead);

  if (phaseBefore === 'DYING' && state.phase === 'DYING') {
    state.explosionT = Math.max(0, state.explosionT - dtMs);
    if (state.explosionT <= 0) {
      state.lives -= 1;
      state.ship = createShip();
      state.shieldT = TIMINGS.immunity;
      state.phase = 'PLAYING';
    }
  }

  if (shieldBefore > 0) {
    state.shieldT = Math.max(0, shieldBefore - dtMs);
  }

  if (state.shotT > 0) {
    state.shotT = Math.max(0, state.shotT - dtMs);
  }
}

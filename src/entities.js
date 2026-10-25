import {
  BASE_SPEED,
  LIMITS,
  RADII,
  SPECIAL_SPEED,
  SPIN_MIN,
  SPIN_MAX,
} from './config.js';

export function createShip() {
  return {
    x: 400,
    y: 300,
    angle: -Math.PI / 2,
    speed: 0,
    alive: true,
    radius: RADII.ship,
  };
}

export function createProjectile(ship, headingOffset = 0) {
  const heading = ship.angle + headingOffset;
  return {
    x: ship.x,
    y: ship.y,
    vx: Math.cos(heading) * LIMITS.projSpeed,
    vy: Math.sin(heading) * LIMITS.projSpeed,
    radius: RADII.projectile,
    dead: false,
  };
}

function speedFor(kind, tier) {
  if (kind === 'SMALL') return BASE_SPEED * tier.smallMul;
  if (kind === 'MEDIUM') return BASE_SPEED * tier.mediumMul;
  return BASE_SPEED * tier.largeMul;
}

function randomSeed() {
  return Math.floor(Math.random() * 0x7fffffff) || 1;
}

export function createAsteroid(kind, x, y, heading, tier) {
  const speed = speedFor(kind, tier);
  return {
    kind,
    x,
    y,
    heading,
    vx: Math.cos(heading) * speed,
    vy: Math.sin(heading) * speed,
    radius: RADII[kind],
    rot: 0,
    spin: SPIN_MIN + Math.random() * (SPIN_MAX - SPIN_MIN),
    seed: randomSeed(),
    dead: false,
  };
}

export function createSpecial(x, y, heading) {
  return {
    kind: 'SPECIAL',
    x,
    y,
    heading,
    vx: Math.cos(heading) * SPECIAL_SPEED,
    vy: Math.sin(heading) * SPECIAL_SPEED,
    radius: RADII.SPECIAL,
    rot: heading,
    spin: 0,
    seed: randomSeed(),
    dead: false,
  };
}

export function createPowerup(x, y, heading, speed) {
  return {
    kind: 'POWERUP',
    x,
    y,
    heading,
    vx: Math.cos(heading) * speed,
    vy: Math.sin(heading) * speed,
    radius: RADII.POWERUP,
    rot: heading,
    spin: SPIN_MIN + Math.random() * (SPIN_MAX - SPIN_MIN),
    seed: randomSeed(),
    dead: false,
  };
}

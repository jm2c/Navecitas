export const BASE_SPEED = 200;

export const WORLD = { W: 800, H: 600 };

export const DT_MS = 1000 / 60;

export const LIMITS = {
  fwd: 260,
  back: 60,
  recoil: 30,
  projSpeed: 300,
  maxProjectiles: 5,
};

export const ACCEL = {
  thrust: 180,
  brake: 260,
  rotate: Math.PI,
};

export const PALETTE = {
  bg: '#000000',
  fg: '#FFFFFF',
  special: '#7ED9A0',
  specialHighlight: '#A8EBC4',
};

export const TIMINGS = {
  shotInterval: 160,
  spawnCadence: 1400,
  spawnJitter: 300,
  deathDelay: 500,
  immunity: 2000,
  countdownHold: 500,
  countdownShrink: 350,
  goExit: 450,
  startBlink: 600,
  blinkPeriod: 160,
};

export const COUNTDOWN_FONT_START = 1400;
export const COUNTDOWN_FONT_END = 64;
export const GO_FONT_END = 2400;
export const COUNTDOWN_Y = 380;
export const GAME_OVER_FONT = 140;

export const SPECIAL_SPEED = 200;
export const SPECIAL_SPAWN_INTERVAL = 500;
export const V_HALF_ANGLE = (25 * Math.PI) / 180;

export const RADII = {
  ship: 16,
  projectile: 3.5,
  SMALL: 14,
  MEDIUM: 26,
  LARGE: 44,
  SPECIAL: 14,
};

export const SPIN_MIN = 0.4;
export const SPIN_MAX = 1.2;

export const MAX_LIVES = 6;
export const MAX_RESERVE_ICONS = 5;

export const TIERS = [
  {
    upper: 1000,
    smallMul: 1,
    mediumMul: 0,
    largeMul: 0,
    weights: { SMALL: 100, MEDIUM: 0, LARGE: 0 },
    max: 3,
  },
  {
    upper: 2000,
    smallMul: 1.1,
    mediumMul: 1,
    largeMul: 0,
    weights: { SMALL: 60, MEDIUM: 40, LARGE: 0 },
    max: 3,
  },
  {
    upper: 3000,
    smallMul: 1.2,
    mediumMul: 1.1,
    largeMul: 1,
    weights: { SMALL: 40, MEDIUM: 35, LARGE: 25 },
    max: 5,
  },
  {
    upper: Infinity,
    smallMul: 1.3,
    mediumMul: 1.2,
    largeMul: 1.1,
    weights: { SMALL: 30, MEDIUM: 35, LARGE: 35 },
    max: 7,
  },
];

export const HUD = {
  scoreX: 784,
  scoreY: 36,
  livesX: 16,
  livesY: 16,
  lifeGlyph: 12,
};

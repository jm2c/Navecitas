import { PALETTE } from '../config.js';

function makeRandom(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function drawShip(ctx, x, y, angle, radius = 16, color = PALETTE.fg) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(-radius * 0.7, -radius * 0.6);
  ctx.lineTo(-radius * 0.7, radius * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawProjectile(ctx, projectile) {
  const angle = Math.atan2(projectile.vy, projectile.vx);
  ctx.save();
  ctx.translate(projectile.x, projectile.y);
  ctx.rotate(angle);
  ctx.fillStyle = PALETTE.fg;
  ctx.fillRect(-3.5, -1.5, 7, 3);
  ctx.restore();
}

export function drawAsteroid(ctx, asteroid) {
  const rnd = makeRandom(asteroid.seed);
  const vertices = 10;
  ctx.save();
  ctx.translate(asteroid.x, asteroid.y);
  ctx.rotate(asteroid.rot);
  ctx.fillStyle = PALETTE.fg;
  ctx.beginPath();
  for (let i = 0; i < vertices; i += 1) {
    const a = (i / vertices) * Math.PI * 2;
    const r = asteroid.radius * (0.75 + 0.25 * rnd());
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawSpecial(ctx, asteroid) {
  const r = asteroid.radius;
  ctx.save();
  ctx.translate(asteroid.x, asteroid.y);
  ctx.rotate(asteroid.heading);
  ctx.fillStyle = PALETTE.special;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(-r * 0.7, -r * 0.6);
  ctx.lineTo(-r * 0.7, r * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.specialHighlight;
  ctx.beginPath();
  ctx.moveTo(r * 0.5, 0);
  ctx.lineTo(-r * 0.3, -r * 0.25);
  ctx.lineTo(-r * 0.3, r * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawLifeIcon(ctx, x, y, size = 12) {
  const r = size / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = PALETTE.fg;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(-r * 0.7, -r * 0.6);
  ctx.lineTo(-r * 0.7, r * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawExplosion(ctx, x, y, progress) {
  const alpha = Math.max(0, 1 - progress);
  const inner = 6 + 20 * progress;
  const outer = 18 + 46 * progress;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = PALETTE.fg;
  for (let i = 0; i < 8; i += 1) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 4);
    ctx.beginPath();
    ctx.moveTo(inner, -3);
    ctx.lineTo(outer, 0);
    ctx.lineTo(inner, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

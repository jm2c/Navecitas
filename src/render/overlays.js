import {
  WORLD,
  HUD,
  PALETTE,
  TIMINGS,
  COUNTDOWN_FONT_START,
  COUNTDOWN_FONT_END,
  GO_FONT_END,
  COUNTDOWN_Y,
  GAME_OVER_FONT,
} from '../config.js';
import { drawLifeIcon } from './shapes.js';
import { reserveIcons } from '../score.js';

const STEP_LABEL = { '3': '3', '2': '2', '1': '1', GO: 'Go' };

export function drawStartPrompt(ctx, state) {
  const on = TIMINGS.startBlink;
  const visible = state.blinkT % (on * 2) < on;
  if (!visible) return;
  ctx.save();
  ctx.fillStyle = PALETTE.fg;
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Press spacebar to start', WORLD.W / 2, WORLD.H - 40);
  ctx.restore();
}

export function drawCountdown(ctx, state) {
  const step = state.countdownStep;
  if (!step) return;
  const t = state.countdownT;
  const shrinkEnd = TIMINGS.countdownShrink;
  const holdEnd = shrinkEnd + TIMINGS.countdownHold;
  let font;
  let alpha = 1;

  if (t < shrinkEnd) {
    const x = t / shrinkEnd;
    const eased = 1 - Math.pow(1 - x, 3);
    font = COUNTDOWN_FONT_START + (COUNTDOWN_FONT_END - COUNTDOWN_FONT_START) * eased;
  } else if (step === 'GO' && t > holdEnd) {
    const x = Math.min(1, (t - holdEnd) / TIMINGS.goExit);
    font = COUNTDOWN_FONT_END + (GO_FONT_END - COUNTDOWN_FONT_END) * x;
    alpha = 1 - x;
  } else {
    font = COUNTDOWN_FONT_END;
  }

  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle = PALETTE.fg;
  ctx.font = `bold ${font}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(STEP_LABEL[step], WORLD.W / 2, COUNTDOWN_Y);
  ctx.restore();
}

export function drawGameOver(ctx) {
  ctx.save();
  ctx.fillStyle = PALETTE.fg;
  ctx.font = `bold ${GAME_OVER_FONT}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Game Over', WORLD.W / 2, WORLD.H / 2);
  ctx.restore();
}

export function drawScore(ctx, score) {
  ctx.save();
  ctx.fillStyle = PALETTE.fg;
  ctx.font = '28px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(String(score), HUD.scoreX, HUD.scoreY);
  ctx.restore();
}

export function drawLifeIcons(ctx, lives) {
  const icons = reserveIcons(lives);
  for (let i = 0; i < icons; i += 1) {
    drawLifeIcon(ctx, HUD.livesX + 6 + i * 20, HUD.livesY + 6, HUD.lifeGlyph);
  }
}

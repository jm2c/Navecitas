import { WORLD } from './config.js';
import { createGame } from './state.js';
import { update } from './update.js';
import { render } from './render/index.js';
import { attachInput, getInput, onStartKey } from './input.js';
import { startLoop } from './loop.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const dpr = window.devicePixelRatio || 1;
canvas.width = WORLD.W * dpr;
canvas.height = WORLD.H * dpr;
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

function resize() {
  const s = Math.max(
    1,
    Math.min(window.innerWidth / WORLD.W, window.innerHeight / WORLD.H),
  );
  canvas.style.width = `${WORLD.W * s}px`;
  canvas.style.height = `${WORLD.H * s}px`;
}

window.addEventListener('resize', resize);
resize();

const state = createGame();

attachInput();
onStartKey(() => {
  window.scrollTo(0, 0);
});

startLoop({
  update,
  render: () => render(ctx, state, performance.now()),
  getState: () => state,
  getInput,
});

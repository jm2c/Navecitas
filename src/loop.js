import { DT_MS } from './config.js';

export function startLoop({ update, render, getState, getInput }) {
  let last = 0;
  let acc = 0;
  let running = false;
  let handle = null;

  function frame(now) {
    if (!running) return;
    const delta = Math.min(now - last, 250);
    last = now;
    acc += delta;

    let ran = 0;
    while (acc >= DT_MS) {
      update(getState(), DT_MS, getInput());
      acc -= DT_MS;
      ran += 1;
    }
    if (ran > 0) render();

    handle = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    acc = 0;
    handle = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (handle !== null) {
      cancelAnimationFrame(handle);
      handle = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  start();
  return { start, stop };
}

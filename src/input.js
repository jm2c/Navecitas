const GAME_CODES = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'];

const pressed = new Set();
const startCallbacks = [];
let attached = false;

export function attachInput() {
  if (attached) return;
  attached = true;

  window.addEventListener('keydown', (event) => {
    if (!GAME_CODES.includes(event.code)) return;
    event.preventDefault();
    if (event.code === 'Space' && !event.repeat) {
      for (const callback of startCallbacks) callback();
    }
    pressed.add(event.code);
  });

  window.addEventListener('keyup', (event) => {
    if (!GAME_CODES.includes(event.code)) return;
    event.preventDefault();
    pressed.delete(event.code);
  });

  const clear = () => pressed.clear();
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', clear);
}

export function getInput() {
  return {
    left: pressed.has('ArrowLeft'),
    right: pressed.has('ArrowRight'),
    up: pressed.has('ArrowUp'),
    down: pressed.has('ArrowDown'),
    fire: pressed.has('Space'),
  };
}

export function onStartKey(callback) {
  startCallbacks.push(callback);
}

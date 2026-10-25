export const GAME_EVENTS = Object.freeze({
  COUNTDOWN_3: 'countdown:3',
  COUNTDOWN_2: 'countdown:2',
  COUNTDOWN_1: 'countdown:1',
  COUNTDOWN_GO: 'countdown:go',
  SHOT: 'shot',
  ASTEROID_DESTROYED: 'asteroid:destroyed',
  ASTEROID_SPLIT: 'asteroid:split',
  LIFE_LOST: 'life:lost',
  LIFE_GAINED: 'life:gained',
  POWERUP_COLLECTED: 'powerup:collected',
  GAME_OVER: 'game:over',
});

export function emitEvent(state, id) {
  state.events.push(id);
}

export function drainEvents(state) {
  const events = state.events;
  state.events = [];
  return events;
}

export function clearEvents(state) {
  state.events = [];
}

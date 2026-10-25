import { CUE_CATALOG } from './cues.js';

const PENDING_LIMIT = 32;
const PENDING_MAX_AGE_MS = 300;
const SCHEDULE_LEAD_S = 0.005;
const MASTER_GAIN = 0.8;

function clampFrequency(value) {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function createAudioEngine() {
  let context = null;
  let master = null;
  let compressor = null;
  let noiseBuffer = null;
  let unavailable = false;
  let unlocked = false;
  let hidden = typeof document !== 'undefined' ? document.hidden === true : false;
  const activeSources = new Set();
  let pending = [];

  function audioContextCtor() {
    return globalThis.AudioContext || globalThis.webkitAudioContext || null;
  }

  function buildNoiseBuffer(audio) {
    const length = Math.max(1, Math.floor(audio.sampleRate));
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function ensureContext() {
    if (context) return context;
    if (unavailable) return null;

    const Ctor = audioContextCtor();
    if (!Ctor) {
      unavailable = true;
      return null;
    }

    try {
      const audio = new Ctor();
      const masterGain = audio.createGain();
      masterGain.gain.value = MASTER_GAIN;
      const dynamics = audio.createDynamicsCompressor();
      dynamics.threshold.value = -18;
      dynamics.knee.value = 12;
      dynamics.ratio.value = 4;
      dynamics.attack.value = 0.003;
      dynamics.release.value = 0.25;

      masterGain.connect(dynamics);
      dynamics.connect(audio.destination);

      context = audio;
      master = masterGain;
      compressor = dynamics;
      noiseBuffer = buildNoiseBuffer(audio);
    } catch {
      context = null;
      master = null;
      compressor = null;
      noiseBuffer = null;
      return null;
    }

    return context;
  }

  function track(source) {
    activeSources.add(source);
    source.onended = () => {
      activeSources.delete(source);
    };
  }

  function applyEnvelope(param, start, layer) {
    const duration = Math.max(0.001, layer.durationMs / 1000);
    const attack = Math.min(
      duration / 2,
      Math.max(0.001, (layer.attackMs ?? 5) / 1000),
    );
    const release = Math.min(
      duration / 2,
      Math.max(0.001, (layer.releaseMs ?? 20) / 1000),
    );
    const peak = Math.max(0.0001, layer.gain);
    const end = start + duration;
    const releaseStart = Math.max(start + attack, end - release);

    param.setValueAtTime(0.0001, start);
    param.linearRampToValueAtTime(peak, start + attack);
    param.setValueAtTime(peak, releaseStart);
    param.exponentialRampToValueAtTime(0.0001, end);
  }

  function scheduleTone(layer, start) {
    const duration = Math.max(0.001, layer.durationMs / 1000);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const { wave } = layer;

    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(clampFrequency(layer.freq), start);
    if (layer.endFreq !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(
        clampFrequency(layer.endFreq),
        start + duration,
      );
    }

    applyEnvelope(gain.gain, start, layer);
    oscillator.connect(gain);
    gain.connect(master);
    track(oscillator);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  function scheduleNoise(layer, start) {
    if (!noiseBuffer) return;

    const duration = Math.max(0.001, layer.durationMs / 1000);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = noiseBuffer;
    filter.type = layer.filter;
    filter.frequency.setValueAtTime(clampFrequency(layer.freq), start);
    if (layer.endFreq !== undefined) {
      filter.frequency.exponentialRampToValueAtTime(
        clampFrequency(layer.endFreq),
        start + duration,
      );
    }
    if (layer.q !== undefined) {
      filter.Q.value = layer.q;
    }

    applyEnvelope(gain.gain, start, layer);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    track(source);
    source.start(start);
    source.stop(start + duration + 0.03);
  }

  function scheduleCue(id) {
    const recipe = CUE_CATALOG[id];
    if (!recipe || !context || !master) return;

    try {
      const base = context.currentTime + SCHEDULE_LEAD_S;
      for (const layer of recipe.layers) {
        const start = base + (layer.delayMs ?? 0) / 1000;
        if (layer.kind === 'tone') {
          scheduleTone(layer, start);
        } else if (layer.kind === 'noise') {
          scheduleNoise(layer, start);
        }
      }
    } catch {}
  }

  function flushPending() {
    if (!context || context.state !== 'running' || hidden) return;

    const at = nowMs();
    const fresh = pending.filter((entry) => at - entry.at <= PENDING_MAX_AGE_MS);
    pending = [];
    for (const entry of fresh) {
      scheduleCue(entry.id);
    }
  }

  function playEvents(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    if (unavailable || hidden) return;

    if (context && context.state === 'running') {
      for (const id of ids) {
        scheduleCue(id);
      }
      return;
    }

    const at = nowMs();
    for (const id of ids) {
      pending.push({ id, at });
    }
    pending = pending
      .filter((entry) => at - entry.at <= PENDING_MAX_AGE_MS)
      .slice(-PENDING_LIMIT);
  }

  function unlock() {
    if (unavailable) return;

    const audio = ensureContext();
    if (!audio) return;
    unlocked = true;

    if (audio.state === 'running') {
      flushPending();
      return;
    }

    try {
      const resumed = audio.resume();
      if (resumed && typeof resumed.then === 'function') {
        resumed.then(() => flushPending()).catch(() => {});
      } else {
        flushPending();
      }
    } catch {}
  }

  function suspend() {
    hidden = true;
    pending = [];

    for (const source of activeSources) {
      try {
        source.stop();
      } catch {}
    }
    activeSources.clear();

    if (context && context.state === 'running') {
      try {
        const suspended = context.suspend();
        if (suspended && typeof suspended.catch === 'function') {
          suspended.catch(() => {});
        }
      } catch {}
    }
  }

  function resume() {
    hidden = false;
    if (!unlocked || !context || unavailable) return;

    if (context.state === 'running') {
      flushPending();
      return;
    }

    try {
      const resumed = context.resume();
      if (resumed && typeof resumed.then === 'function') {
        resumed.then(() => flushPending()).catch(() => {});
      }
    } catch {}
  }

  function isRunning() {
    return Boolean(context && context.state === 'running' && !hidden);
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        suspend();
      } else {
        resume();
      }
    });
  }

  return { playEvents, unlock, suspend, resume, isRunning };
}

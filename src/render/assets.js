import { ASSETS } from './asset-manifest.js';

const images = new Map();
const missing = new Set();
let fontLoaded = false;
let started = false;
let settled = false;
let loadPromise = null;

function imageUrl(entry) {
  return new URL(`../../${entry.path}`, import.meta.url).href;
}

function loadImage(entry) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      images.set(entry.key, img);
      resolve(true);
    };
    img.onerror = () => {
      missing.add(entry.key);
      resolve(false);
    };
    img.src = imageUrl(entry);
  });
}

async function loadFont(entry) {
  if (!document.fonts || typeof document.fonts.load !== 'function') {
    fontLoaded = false;
    missing.add(entry.key);
    return false;
  }

  try {
    const faces = await document.fonts.load('16px Audiowide');
    await document.fonts.ready;
    fontLoaded = faces.length > 0 && document.fonts.check('16px Audiowide');
    if (!fontLoaded) missing.add(entry.key);
    return fontLoaded;
  } catch {
    fontLoaded = false;
    missing.add(entry.key);
    return false;
  }
}

function withTimeout(promise, timeoutMs) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function doLoad({ timeoutMs }) {
  const imageEntries = Object.values(ASSETS).filter((entry) => entry.type === 'image');
  const fontEntry = ASSETS.font;
  const jobs = [
    ...imageEntries.map((entry) => loadImage(entry)),
    loadFont(fontEntry),
  ];

  await withTimeout(Promise.allSettled(jobs), timeoutMs);

  for (const entry of imageEntries) {
    if (!images.has(entry.key)) missing.add(entry.key);
  }
  if (!fontLoaded) missing.add(fontEntry.key);

  settled = true;
  return {
    images: images.size,
    missing: [...missing],
    fontLoaded,
  };
}

export function loadAssets({ timeoutMs = 1500 } = {}) {
  if (loadPromise) return loadPromise;
  started = true;
  loadPromise = doLoad({ timeoutMs });
  return loadPromise;
}

export function getAsset(key) {
  return images.get(key) ?? null;
}

export function assetsReady() {
  return started && settled;
}

export function missingAssets() {
  return [...missing];
}

export function isFontLoaded() {
  return fontLoaded;
}

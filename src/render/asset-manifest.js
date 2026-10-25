const TWEMOJI_AUTHOR = 'Twemoji contributors (Twitter, Inc.)';
const TWEMOJI_ATTRIBUTION =
  'Twemoji — Copyright 2020 Twitter, Inc and other contributors; licensed under CC-BY 4.0';
const KENNEY_SOURCE = 'https://opengameart.org/content/space-shooter-redux';
const TWEMOJI_SOURCE = 'https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72';

export const ASSETS = Object.freeze({
  rocket: Object.freeze({
    key: 'rocket',
    type: 'image',
    path: 'assets/emoji/rocket.png',
    source: `${TWEMOJI_SOURCE}/1f680.png`,
    author: TWEMOJI_AUTHOR,
    license: 'CC-BY-4.0',
    attribution: TWEMOJI_ATTRIBUTION,
    width: 72,
    height: 72,
    fallback: 'white triangle vector path',
  }),
  bolt: Object.freeze({
    key: 'bolt',
    type: 'image',
    path: 'assets/emoji/bolt.png',
    source: `${TWEMOJI_SOURCE}/26a1.png`,
    author: TWEMOJI_AUTHOR,
    license: 'CC-BY-4.0',
    attribution: TWEMOJI_ATTRIBUTION,
    width: 72,
    height: 72,
    fallback: 'gold diamond vector path',
  }),
  heart: Object.freeze({
    key: 'heart',
    type: 'image',
    path: 'assets/emoji/heart.png',
    source: `${TWEMOJI_SOURCE}/2764.png`,
    author: TWEMOJI_AUTHOR,
    license: 'CC-BY-4.0',
    attribution: TWEMOJI_ATTRIBUTION,
    width: 72,
    height: 72,
    fallback: 'green ship silhouette vector path',
  }),
  asteroidSmall: Object.freeze({
    key: 'asteroidSmall',
    type: 'image',
    path: 'assets/asteroids/small.png',
    source: KENNEY_SOURCE,
    author: 'Kenney Vleugels (kenney.nl)',
    license: 'CC0-1.0',
    width: 28,
    height: 28,
    fallback: 'seeded polygon vector path',
  }),
  asteroidMedium: Object.freeze({
    key: 'asteroidMedium',
    type: 'image',
    path: 'assets/asteroids/medium.png',
    source: KENNEY_SOURCE,
    author: 'Kenney Vleugels (kenney.nl)',
    license: 'CC0-1.0',
    width: 43,
    height: 43,
    fallback: 'seeded polygon vector path',
  }),
  asteroidLarge: Object.freeze({
    key: 'asteroidLarge',
    type: 'image',
    path: 'assets/asteroids/large.png',
    source: KENNEY_SOURCE,
    author: 'Kenney Vleugels (kenney.nl)',
    license: 'CC0-1.0',
    width: 89,
    height: 82,
    fallback: 'seeded polygon vector path',
  }),
  background: Object.freeze({
    key: 'background',
    type: 'image',
    path: 'assets/background/starfield.png',
    source: 'https://opengameart.org/content/starfield-background',
    author: 'Sauer2',
    license: 'CC0-1.0',
    width: 800,
    height: 600,
    fallback: 'plain dark PALETTE.bg fill',
  }),
  font: Object.freeze({
    key: 'font',
    type: 'font',
    path: 'assets/fonts/audiowide-latin.woff2',
    source: 'https://fonts.google.com/specimen/Audiowide',
    author: 'Brian J. Bonislawsky DBA Astigmatic (AOETI)',
    license: 'OFL-1.1',
    fallback: "'Trebuchet MS', sans-serif",
  }),
});

export const ASSET_KEYS = Object.freeze(Object.keys(ASSETS));

export const ENTITY_ASSET_KEYS = Object.freeze({
  ship: 'rocket',
  POWERUP: 'bolt',
  SPECIAL: 'heart',
  life: 'heart',
  SMALL: 'asteroidSmall',
  MEDIUM: 'asteroidMedium',
  LARGE: 'asteroidLarge',
  background: 'background',
  font: 'font',
});

export function assetKeyForAsteroid(kind) {
  if (kind !== 'SMALL' && kind !== 'MEDIUM' && kind !== 'LARGE') return null;
  return ENTITY_ASSET_KEYS[kind];
}

export const REQUIRED_LICENSE_FILES = Object.freeze([
  'assets/licenses/Kenney-CC0.txt',
  'assets/licenses/Twemoji-CC-BY-4.0.txt',
  'assets/licenses/Audiowide-OFL-1.1.txt',
]);

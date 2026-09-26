// icons.js — the game's icon set: about 60 inline SVG symbols (24×24, currentColor), drawn in
// code so they are crisp at any size and take the era's ink. `icon(name)` returns an <svg>;
// `iconify(text)` turns the emoji the UI used to show into icons, so screen code can keep
// writing '📜 +40' and get a scroll icon. The data files keep their emoji fields as the
// last fallback for a character with no portrait and no look.
const SVG = 'http://www.w3.org/2000/svg';

export const ICONS = {
  home: 'M12 3 2 11h3v9h6v-6h2v6h6v-9h3z',
  map: 'M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z',
  team: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 19c0-3 2.7-5 6-5s6 2 6 5v1H3zm13 1v-1c0-1.6-.6-3-1.6-4.1 2.7-.6 6.6.7 6.6 4.1v1z',
  roster: 'M5 3h13v18H7a2 2 0 0 1-2-2zm2 2v13h9V5zm2 2h5v2H9zm0 4h5v2H9z',
  scroll: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H4zm0 3h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm3 2v2h10v-2zm0 4v2h7v-2z',
  wiki: 'M2 5h7a3 3 0 0 1 3 2 3 3 0 0 1 3-2h7v14h-7a3 3 0 0 0-3 2 3 3 0 0 0-3-2H2zm2 2v10h5a5 5 0 0 1 2 .5V8a1 1 0 0 0-1-1zm9 1v9.5a5 5 0 0 1 2-.5h5V7h-6a1 1 0 0 0-1 1z',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9.4 5.5-2-.6a7.6 7.6 0 0 0 0-1.8l2-.6-1-2.6-2 .7a7.6 7.6 0 0 0-1.3-1.3l.7-2-2.6-1-.6 2a7.6 7.6 0 0 0-1.8 0l-.6-2-2.6 1 .7 2a7.6 7.6 0 0 0-1.3 1.3l-2-.7-1 2.6 2 .6a7.6 7.6 0 0 0 0 1.8l-2 .6 1 2.6 2-.7a7.6 7.6 0 0 0 1.3 1.3l-.7 2 2.6 1 .6-2a7.6 7.6 0 0 0 1.8 0l.6 2 2.6-1-.7-2a7.6 7.6 0 0 0 1.3-1.3l2 .7z',
  ryo: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm-1 3h2v8h-2z',
  trophy: 'M6 3h12v2h3v3a5 5 0 0 1-4.5 5 6 6 0 0 1-3.5 3.2V18h3v3H8v-3h3v-1.8A6 6 0 0 1 7.5 13 5 5 0 0 1 3 8V5h3zm-1 4v1a3 3 0 0 0 2 2.8V7zm14 0h-2v3.8a3 3 0 0 0 2-2.8z',
  sound: 'M4 9v6h4l5 4V5L8 9zm11 .5a3.5 3.5 0 0 1 0 5v-5zm0-4a7 7 0 0 1 0 13v-2a5 5 0 0 0 0-9z',
  mute: 'M4 9v6h4l5 4V5L8 9zm11 1.5 2 2 2-2 1.4 1.4-2 2 2 2L19 17.3l-2-2-2 2-1.4-1.4 2-2-2-2z',
  fire: 'M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-10z',
  wind: 'M2 7h11.5a2.5 2.5 0 1 0-2.4-3.2l1.9.6a.5.5 0 1 1 .5.6H2zm0 5h16.5a2.5 2.5 0 1 1-2.4 3.2l1.9-.6a.5.5 0 1 0 .5-.6H2zm0 5h8.5a2 2 0 1 1-1.9 2.6l1.9-.6a0 0 0 0 0 0 0H2z',
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6z',
  earth: 'M2 20 8 8l3 5 2-3 3 4 2-2 4 8z',
  water: 'M12 2s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12z',
  neutral: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10z',
  shield: 'M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5z',
  sword: 'M19.5 3 9 13.5l1.5 1.5L21 4.5zM7.5 15l-4 4 1.5 1.5 4-4zm2 2 1.5 1.5-1 1L8.5 18z',
  target: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  plus: 'M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z',
  crown: 'M3 8l4 4 5-7 5 7 4-4-2 12H5z',
  skull: 'M12 2a8 8 0 0 0-8 8c0 3 1.5 5 4 6.5V20h8v-3.5c2.5-1.5 4-3.5 4-6.5a8 8 0 0 0-8-8zm-3 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  calendar: 'M7 2h2v2h6V2h2v2h3v18H4V4h3zm-1 7v11h12V9z',
  cloud: 'M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4 4 0 0 1 0 9z',
  ticket: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z',
  star: 'M12 2l3 7 7 .6-5.3 4.7 1.7 7L12 17.5 5.6 21.3l1.7-7L2 9.6 9 9z',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3h2v12H5V10zm2 0h6V7a3 3 0 0 0-6 0z',
  check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  skip: 'M4 5l10 7-10 7zM16 5h3v14h-3z',
  play: 'M6 4l14 8-14 8z',
  pause: 'M6 4h4v16H6zm8 0h4v16h-4z',
  auto: 'M4 8h16v10H4zm2 2v6h12v-6zm2 1h3v4H8zm5 0h3v4h-3zM11 4h2v3h-2z',
  back: 'M15 4l-8 8 8 8 1.5-1.5L10 12l6.5-6.5z',
  kunai: 'M12 2 9 9l3 9 3-9zm0 16 2 2-2 2-2-2z',
  sparkle: 'M12 2l2.2 6.3L20.5 10l-6.3 1.7L12 18l-2.2-6.3L3.5 10l6.3-1.7zM19 15l1 3 3 1-3 1-1 3-1-3-3-1 3-1z',
  graduate: 'M12 3 1 8l11 5 9-4.1V15h2V8zM5 12.5V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-4.5l-7 3.2z',
  tap: 'M9 2a2 2 0 0 1 2 2v7h1V9a2 2 0 0 1 4 0v2h1a2 2 0 0 1 2 2v2.5c0 3.6-2.4 6.5-6 6.5H11a5 5 0 0 1-5-5v-3l-2.3-2.3a1.5 1.5 0 0 1 2.1-2.1L7 11.5V4a2 2 0 0 1 2-2z',
  warning: 'M12 2 1 21h22zm-1 7h2v6h-2zm0 8h2v2h-2z',
  flag: 'M5 3h2v18H5zm4 0h10l-2 4 2 4H9z',
  help: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 15.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 6a4 4 0 0 1 4 4c0 2-1.5 2.6-2.5 3.3-.5.4-.5.7-.5 1.7h-2c0-1.7.3-2.4 1.3-3.1.8-.6 1.7-1 1.7-1.9a2 2 0 0 0-4 0H8a4 4 0 0 1 4-4z',
  bulb: 'M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2zM9 19h6v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z',
  ninja: 'M12 3a9 9 0 0 0-9 9v1h18v-1a9 9 0 0 0-9-9zm-9 12c1 3 4.5 6 9 6s8-3 9-6zm5-3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm8 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
  spiral: 'M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7v2a5 5 0 1 0 5 5h-2a3 3 0 1 1-3-3v2a1 1 0 1 0 1 1h2a3 3 0 1 1-3-3z',
  wheel: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5.7 4.1a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-11.4 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm2.2 6.7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
  oni: 'M12 5c-4 0-7 3-7 7v2c0 3.3 3 6 7 6s7-2.7 7-6v-2c0-4-3-7-7-7zm-3 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM4 2l3 4-2 1zm16 0-3 4 2 1z',
  cards: 'M4 5h10v14H4zm2 2v10h6V7zm9-1 6 1.5-3.5 13.5-5-1.2V6z',
  moneybag: 'M9 2h6l-1 3h-4zm3 4c-5 0-8 5-8 9a8 8 0 0 0 16 0c0-4-3-9-8-9zm-1 4h2v1h2v2h-3v1h1a2 2 0 0 1 0 4h-1v1h-2v-1H8v-2h3v-1h-1a2 2 0 0 1 0-4h1z',
  'arrow-up': 'M12 3l8 8h-5v10H9V11H4z',
  'arrow-down': 'M12 21l-8-8h5V3h6v10h5z',
  save: 'M4 3h13l3 3v15H4zm3 2v5h8V5zm1 1h2v3H8zm-1 9v4h10v-4z',
  gift: 'M4 9h16v3H4zm1 4h6v8H5zm8 0h6v8h-6zM9 3a3 3 0 0 1 3 4 3 3 0 0 1 3-4 2 2 0 0 1 0 4h-6a2 2 0 0 1 0-4z',
  install: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 3v13h10V5zm4 2h2v4h2l-3 3.5L9 11h2z',
  copy: 'M8 2h10v13H8zm-4 5h2v12h10v2H4z',
  export: 'M12 3l5 5h-3v7h-4V8H7zM4 17h16v4H4z',
  import: 'M12 15l-5-5h3V3h4v7h3zM4 17h16v4H4z',
  trash: 'M9 2h6l1 2h4v2H4V4h4zM6 7h12l-1 14H7z',
  link: 'M10 13a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.4 1.4 1.4 1.4 1.4-1.4a2 2 0 0 1 2.9 2.9l-3 3a2 2 0 0 1-2.9 0zm4-2a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.4-1.4-1.4-1.4-1.4 1.4a2 2 0 0 1-2.9-2.9l3-3a2 2 0 0 1 2.9 0z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.9 9h-3a15 15 0 0 0-1.4-6A8 8 0 0 1 19.9 11zM12 4c1.2 1.6 2.3 4 2.7 7H9.3c.4-3 1.5-5.4 2.7-7zM4.1 11a8 8 0 0 1 4.4-6 15 15 0 0 0-1.4 6zm0 2h3a15 15 0 0 0 1.4 6A8 8 0 0 1 4.1 13zm5.2 0h5.4c-.4 3-1.5 5.4-2.7 7-1.2-1.6-2.3-4-2.7-7zm6.2 6a15 15 0 0 0 1.4-6h3a8 8 0 0 1-4.4 6z',
  medal: 'M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-8a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm-4 8.5 2 .8V22l-2-1.5L6 22v-6.7zm8 0 2 .8V22l-2-1.5L14 22v-6.7z',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9c0-4 3.6-6 8-6s8 2 8 6v1H4z',
  ban: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a7 7 0 0 1 5.6 11.2L7.8 6.4A7 7 0 0 1 12 5zm-5.6 2.8 9.8 9.8A7 7 0 0 1 6.4 7.8z',
  thumbs: 'M2 10h4v11H2zm6 0 4-8c1.5 0 2.5 1 2.5 2.5L14 9h6a2 2 0 0 1 2 2.4l-1.6 7.2A3 3 0 0 1 17.5 21H8z',
  film: 'M3 4h18v16H3zm2 2v2h2V6zm0 4v2h2v-2zm0 4v2h2v-2zm12-8v2h2V6zm0 4v2h2v-2zm0 4v2h2v-2zM9 6v12h6V6z',
  search: 'M10 2a8 8 0 1 0 4.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10z',
  wrench: 'M21 6.5a5.5 5.5 0 0 1-7.4 5.2L6 19.3a2 2 0 0 1-2.8-2.8l7.6-7.6A5.5 5.5 0 0 1 17.5 2l-3 3 1.5 3 3 1.5 3-3c.3.6.5 1.3.5 2z',
  close: 'M6 5 5 6l6 6-6 6 1 1 6-6 6 6 1-1-6-6 6-6-1-1-6 6z',
  timer: 'M6 2h12v2l-4 6 4 6v2H6v-2l4-6-4-6zm2 2 3 5h2l3-5zm3 9-3 5h8l-3-5z',
  hand: 'M9 2a2 2 0 0 1 2 2v7h1V9a2 2 0 0 1 4 0v2h1a2 2 0 0 1 2 2v2.5c0 3.6-2.4 6.5-6 6.5H11a5 5 0 0 1-5-5v-3l-2.3-2.3a1.5 1.5 0 0 1 2.1-2.1L7 11.5V4a2 2 0 0 1 2-2z',
  swords: 'M3 4l6 6-1 1 2 2-1.5 1.5L6.5 12.5 4 15l-1-1 2.5-2.5L3.5 9.5 5 8 3 6zm18 0-6 6 1 1-2 2 1.5 1.5 2-2 2.5 2.5 1-1-2.5-2.5 2-2L19 8l2-2z',
};

/** The emoji the interface used to show, and the icon that replaces each. */
export const EMOJI_ICON = {
  '🏯': 'home', '🗺️': 'map', '🗺': 'map', '👥': 'team', '📖': 'roster', '📜': 'scroll', '📚': 'wiki', '⚙️': 'settings', '⚙': 'settings',
  '🪙': 'ryo', '🏆': 'trophy', '🔊': 'sound', '🔇': 'mute', '🎟️': 'ticket', '🎟': 'ticket', '🎫': 'ticket', '📅': 'calendar', '💀': 'skull',
  '☁️': 'cloud', '☁': 'cloud', '🎯': 'target', '🚫': 'ban', '⚔️': 'sword', '⚔': 'sword', '⬇️': 'arrow-down', '⬇': 'arrow-down', '⬆': 'arrow-up',
  '👑': 'crown', '⚡': 'bolt', '✨': 'sparkle', '🎓': 'graduate', '🤖': 'auto', '👆': 'tap', '⏸': 'pause', '▶': 'play', '⏭': 'skip',
  '🔒': 'lock', '✓': 'check', '⚠': 'warning', '⚠️': 'warning', '🏳️': 'flag', '🏳': 'flag', '❓': 'help', '💡': 'bulb', '🥷': 'ninja', '🌀': 'spiral',
  '☯️': 'wheel', '☯': 'wheel', '👹': 'oni', '🎴': 'cards', '✚': 'plus', '🛡️': 'shield', '🛡': 'shield', '💰': 'moneybag', '💾': 'save',
  '🎁': 'gift', '🔥': 'fire', '📲': 'install', '📋': 'copy', '📤': 'export', '📥': 'import', '🗑️': 'trash', '🗑': 'trash', '🔗': 'link',
  '🌐': 'globe', '🍥': 'spiral', '🎉': 'sparkle', '🆕': 'sparkle', '🏅': 'medal', '👤': 'person', '⛔': 'ban', '👍': 'thumbs', '🎬': 'film',
  '🔎': 'search', '🛠': 'wrench', '✕': 'close', '🌟': 'star', '⏳': 'timer', '💨': 'wind', '🪨': 'earth', '💧': 'water', '🥋': 'hand',
};
const EMOJI_RE = new RegExp(Object.keys(EMOJI_ICON).sort((a, b) => b.length - a.length).map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gu');
const QUICK = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{23E9}-\u{23FF}\u{2713}\u{25B6}]/u;

let sprite = null;
/** Put the symbol sprite in the document once (idempotent, safe before <body> has content). */
export function ensureSprite(doc = document) {
  if (sprite && sprite.isConnected) return sprite;
  sprite = doc.createElementNS(SVG, 'svg');
  sprite.setAttribute('aria-hidden', 'true'); sprite.style.display = 'none'; sprite.id = 'icon-sprite';
  for (const [name, d] of Object.entries(ICONS)) {
    const sym = doc.createElementNS(SVG, 'symbol'); sym.setAttribute('id', 'i-' + name); sym.setAttribute('viewBox', '0 0 24 24');
    const p = doc.createElementNS(SVG, 'path'); p.setAttribute('d', d); sym.appendChild(p); sprite.appendChild(sym);
  }
  (doc.body || doc.documentElement).prepend(sprite);
  return sprite;
}

/** An inline icon element. Unknown names draw a star so a typo is visible, not invisible. */
export function icon(name, cls = '') {
  ensureSprite();
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'ico' + (cls ? ' ' + cls : '')); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG, 'use'); use.setAttribute('href', '#i-' + (ICONS[name] ? name : 'star'));
  svg.appendChild(use);
  return svg;
}

export const NATURE_ICON = { Fire: 'fire', Wind: 'wind', Lightning: 'bolt', Earth: 'earth', Water: 'water' };
export const ROLE_ICON = { Tank: 'shield', Striker: 'sword', Ranged: 'target', Support: 'plus' };

/** Might this string contain an emoji the interface replaces? (a cheap pre-check) */
export function hasEmoji(text) { return QUICK.test(text); }

/** Split a string into text and icon nodes: '📜 +40' → [<svg scroll>, ' +40']. */
export function iconify(text) {
  if (!hasEmoji(text)) return [text];
  const out = []; let last = 0;
  for (const m of text.matchAll(EMOJI_RE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(icon(EMOJI_ICON[m[0]]));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : [text];
}

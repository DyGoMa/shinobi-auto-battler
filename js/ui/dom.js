// dom.js — tiny DOM helpers and shared UI components (no framework). Strings that contain
// an emoji the interface used to show ('📜 +40') are turned into icon + text as they are
// appended (js/render/icons.js), so screen code keeps reading naturally.
import { TIER_LABEL, RARITY_LABEL } from '../core/formulas.js';
import { icon, iconify, hasEmoji, NATURE_ICON, ROLE_ICON } from '../render/icons.js';
import { lookFor, bustCanvas } from '../render/Figure.js';
import * as Assets from '../render/Assets.js';

/** h('div.card#id', { onclick, style, ... }, ...children) */
export function h(sel, props = {}, ...kids) {
  const m = sel.match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i);
  const el = document.createElement((m && m[1]) || 'div');
  if (m && m[2]) for (const part of m[2].match(/[.#][\w-]+/g) || []) {
    if (part[0] === '.') el.classList.add(part.slice(1)); else el.id = part.slice(1);
  }
  if (props && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) { kids.unshift(props); props = {}; }
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'class') el.className += ' ' + v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, kids);
  return el;
}
function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    if (k instanceof Node) { el.appendChild(k); continue; }
    const s = String(k);
    if (hasEmoji(s)) for (const part of iconify(s)) el.appendChild(part instanceof Node ? part : document.createTextNode(part));
    else el.appendChild(document.createTextNode(s));
  }
}
export { icon };

export const fmt = (n) => Math.round(n).toLocaleString('en-US');
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
/** 7 -> "seven" ("Seven" with cap); numbers above twelve stay digits. For counts that come from content. */
export function countWord(n, cap = false) { const w = WORDS[n] ?? fmt(n); return cap ? w.charAt(0).toUpperCase() + w.slice(1) : w; }
/** "Episode 4" or "Episodes 4–5" / "Episodes 215–222, 243–256". */
export const episodesLabel = (eps) => `${/[–,-]/.test(String(eps)) ? 'Episodes' : 'Episode'} ${eps}`;
export const pctStr = (x, d = 0) => `${(x * 100).toFixed(d)}%`;

/** The pixel size a portrait slot is drawn at (CSS px × a retina factor), by size class. */
const SLOT_PX = { '': 128, sm: 96, lg: 256, xl: 512 };
/** The story era whose outfit a portrait shows; the screens set it (UIManager.setEra). */
export function currentEra() { return document.documentElement.dataset.era === 'p2' ? 'p2' : 'p1'; }

/**
 * A character or enemy portrait in a circle: the image from assets/ when it exists, else the
 * code-drawn bust. `facing` left for enemies. When the image arrives later the slot swaps in place.
 *   size: '' (56 px) | 'sm' (40) | 'lg' (84) | 'xl'   unknown: a "?" silhouette (not yet met)
 */
export function avatar(def, { size = '', unknown = false, facing = 1, era = null, ring = null, expression = null } = {}) {
  const el = document.createElement('div');
  el.className = ['avatar', size, `ring-${ring || def?.tier || 'genin'}`, unknown ? 'unknown' : ''].filter(Boolean).join(' ');
  el.title = unknown ? 'Not yet recruited' : def?.name || '';
  if (unknown || !def) { el.appendChild(h('span.q', '?')); return el; }
  const e = era || currentEra();
  const path = Assets.portraitPath(def.id, e);
  const draw = (img) => {
    el.replaceChildren();
    if (img) { const im = new Image(); im.src = img.src; im.alt = ''; im.draggable = false; if (facing < 0) im.classList.add('flip'); el.appendChild(im); return; }
    const px = SLOT_PX[size] || 128;
    const c = bustCanvas(lookFor(def), px, { facing, expression: expression || (def.side === 'enemy' ? 'menace' : 'set') });
    const view = document.createElement('canvas'); view.width = px; view.height = px; view.getContext('2d').drawImage(c, 0, 0);
    el.appendChild(view);
  };
  const img = path ? Assets.image(path) : null;
  draw(img);
  if (path && !img) Assets.onLoad(path, (loaded) => { if (loaded && el.isConnected) draw(loaded); });
  return el;
}

export function natureChip(n, extra = '') { return h(`span.nat.${n || 'none'}`, n ? icon(NATURE_ICON[n]) : icon('neutral'), (n ? `${n} Style` : 'Neutral') + extra); }
export function natureChips(def) {
  if (def.taijutsu) return [h('span.nat.taijutsu', icon('hand'), 'Taijutsu')];
  if (!def.natures?.length) return [h('span.nat.none', icon('neutral'), 'No nature')];
  return def.natures.map(n => natureChip(n));
}
export function stars(n, cap = 5) { return h('span.stars', '★'.repeat(n), h('span.off', '★'.repeat(Math.max(0, cap - n)))); }
export function tierTag(tier) { return h(`span.tier.${tier}`, `${TIER_LABEL[tier]} · ${RARITY_LABEL[tier]}`); }
export function roleTag(role) { return h('span.role', icon(ROLE_ICON[role] || 'neutral'), ` ${role}`); }
export function btn(label, onClick, cls = '', props = {}) { return h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), { onclick: onClick, type: 'button', ...props }, label); }
export function toggle(on, onChange, label = '', { disabled = false } = {}) {
  const t = h('button.toggle' + (on ? '.on' : ''), { type: 'button', role: 'switch', 'aria-checked': String(!!on), 'aria-label': label, disabled });
  if (!disabled) t.addEventListener('click', () => { const v = !t.classList.contains('on'); t.classList.toggle('on', v); t.setAttribute('aria-checked', String(v)); onChange(v); });
  return t;
}
export function describeMechanic(m) {
  const tgt = { all: 'your whole team', front: 'your front line', back: 'your back line', random: 'one random ninja' }[m.target || 'all'];
  const nat = m.nature ? ` (${m.nature} Style)` : m.nature === null ? ' (no nature)' : '';
  switch (m.type) {
    case 'telegraphAoE': return `Telegraphed jutsu${nat} that hits ${tgt}${m.stun ? ' and stuns' : ''} — you can Jutsu Clash it.`;
    case 'summonAdds': return `Summons reinforcements${m.atHp ? ` at ${m.atHp.map(x => Math.round(x * 100) + '%').join(' / ')} HP` : ' periodically'}.`;
    case 'shieldPhase': return `Raises an absorb shield at ${m.atHp.map(x => Math.round(x * 100) + '%').join(' / ')} HP — burst it down.`;
    case 'enrage': return m.atHp ? `Enrages at ${Math.round(m.atHp[0] * 100)}% HP (more ATK and speed).` : 'Enrages if the fight drags on.';
    case 'elementSwap': return `Switches nature: ${(m.sequence || []).join(' → ')} Style.`;
    case 'reflect': return 'Takes a stance that reflects damage — watch the warning.';
    case 'lifesteal': return 'Heals from the damage it deals.';
    case 'reviveOnce': return 'Comes back once after being defeated.';
    case 'regen': return 'Slowly regenerates HP.';
    case 'rally': return 'Periodically boosts its allies\' ATK.';
    default: return '';
  }
}
export function objectiveText(o, C) {
  switch (o?.type) {
    case 'survive': return `Survive ${o.seconds}s (or defeat every enemy)`;
    case 'protect': return `Protect ${C.enemy[o.protect]?.name || 'the escort'}${o.seconds ? ` for ${o.seconds}s` : ''} and defeat every enemy`;
    case 'defeatBoss': return 'Defeat the boss (other enemies don\'t matter)';
    default: return 'Defeat every enemy';
  }
}

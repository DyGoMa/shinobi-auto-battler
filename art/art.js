// art/art.js — the art studio (art.html, docs/ART_BIBLE.md §11): every portrait and sprite the
// game wants, by arc, with its prompt (editable, kept in assets/art-overrides.json), a drop zone
// that keys the background out in the browser (tools/key-lib.mjs, the same code the ingest tool
// runs), the leftover check over black / white / red / a checkerboard with a click-to-erase wand,
// the image where it will be used (the game's own tokens, Roster card, Team slot, dialogue box,
// boss card; the battlefield for a sprite), and one-click Save through the local server
// (tools/serve.mjs → /incoming → tools/ingest.mjs). Nothing leaves this computer.
import { CONTENT as C } from '../js/content/index.js';
import * as Assets from '../js/render/Assets.js';
import { h, avatar } from '../js/ui/dom.js';
import { drawFigure, lookFor } from '../js/render/Figure.js';
import { keyBackground, leftovers, wandRemove, backgroundColor, DEFAULTS } from '../tools/key-lib.mjs';

const $ = (s, r = document) => r.querySelector(s);
const MAX_SIDE = 1536;         // work at most this big in the browser (a 1024² generation is used as is)
const state = { manifest: null, index: new Set(), overrides: { prompts: {}, status: {} }, originals: {}, entries: [], groups: [], key: null, work: null, history: [], wand: false, bg: null };

// ------------------------------------------------------------------ data
async function getJSON(url, fallback) { try { const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) return fallback; return await r.json(); } catch { return fallback; } }
async function loadAll() {
  state.manifest = await getJSON('assets/manifest.json', null);
  if (!state.manifest) { $('#main').replaceChildren(h('div.card', h('h2', 'No manifest'), h('p', 'Run node tools/manifest.mjs first.'))); return false; }
  state.index = new Set((await getJSON('assets/index.json', { files: [] })).files || []);
  state.overrides = await getJSON('assets/art-overrides.json', { prompts: {}, status: {} });
  state.overrides.prompts = state.overrides.prompts || {}; state.overrides.status = state.overrides.status || {};
  state.originals = (await getJSON('/api/art/originals', { files: {} })).files || {};
  Assets.setIndex([...state.index]);
  const reuse = new Map(); for (const r of state.manifest.reuse || []) { if (!reuse.has(r.uses)) reuse.set(r.uses, []); reuse.get(r.uses).push(r.id); }
  state.entries = [];
  for (const kind of ['portrait', 'sprite']) for (const e of state.manifest[kind === 'portrait' ? 'portraits' : 'sprites']) {
    const def = defOf(e.id);
    state.entries.push({ ...e, kind, key: `${kind}:${e.id}`, def, arc: arcOf(e.id, def, reuse), search: `${e.name} ${e.id} ${def?.short || ''}`.toLowerCase() });
  }
  groupEntries();
  return true;
}
/** The roster or enemy definition behind a manifest id (naruto_p1 → naruto, e_aoi_boss → the enemy). */
function defOf(id) {
  if (C.char[id]) return C.char[id];
  if (C.enemy[id]) return { ...C.enemy[id], side: 'enemy' };
  const base = id.replace(/_p[12]$/, '');
  if (C.char[base]) return C.char[base];
  return null;
}
/** The arc an image is first needed in: a character's unlock arc, an enemy's first battle. */
function arcOf(id, def, reuse) {
  if (def && !def.side) {
    if (def.starter) return { order: -1, name: 'Starters', id: 'starters' };
    if (def.unlock?.achievement) return { order: 9999, name: 'Achievements', id: 'achievements' };
    const a = C.arc[def.unlock?.arcCleared || def.unlock?.arcReached];
    if (a) return { order: a.arcIndex, name: a.name, id: a.id };
    return { order: 9998, name: 'Other', id: 'other' };
  }
  const ids = new Set([id, ...(reuse.get(id) || [])]);
  for (const n of C.nodes) if ((n.enemies || []).some(e => ids.has(e.id))) { const a = C.arc[n.arcId]; return { order: a.arcIndex, name: a.name, id: a.id }; }
  if (C.tutorial?.nodes?.some(n => (n.enemies || []).some(e => ids.has(e.id)))) return { order: -2, name: 'The Academy', id: 'tutorial' };
  return { order: 9998, name: 'Other', id: 'other' };
}
function groupEntries() {
  const map = new Map();
  for (const e of state.entries) { if (!map.has(e.arc.id)) map.set(e.arc.id, { ...e.arc, entries: [] }); map.get(e.arc.id).entries.push(e); }
  state.groups = [...map.values()].sort((a, b) => a.order - b.order);
  for (const g of state.groups) g.entries.sort((a, b) => a.name.localeCompare(b.name) || a.kind.localeCompare(b.kind));
}
const isDone = (e) => state.index.has(e.file);
const statusOf = (e) => state.overrides.status[e.key] || null;
const isFlagged = (e) => (statusOf(e)?.leftover || 0) > 0;
const hasOwnPrompt = (e) => !!state.overrides.prompts[e.key];
const originalOf = (e) => state.originals[e.incoming] || null;

// ------------------------------------------------------------------ the list
function renderList() {
  const q = $('#search').value.trim().toLowerCase(); const onlyMissing = $('#onlyMissing').checked, onlyFlagged = $('#onlyFlagged').checked;
  const list = $('#list'); list.replaceChildren();
  let shown = 0;
  for (const g of state.groups) {
    const rows = g.entries.filter(e => (!q || e.search.includes(q) || g.name.toLowerCase().includes(q)) && (!onlyMissing || !isDone(e)) && (!onlyFlagged || isFlagged(e)));
    if (!rows.length) continue;
    const done = g.entries.filter(isDone).length;
    list.appendChild(h('h3', h('span', g.name), h('span', `${done}/${g.entries.length}`)));
    for (const e of rows) {
      shown++;
      const dot = h('span.dot' + (isDone(e) ? (isFlagged(e) ? '.flag' : '.done') : '') + (hasOwnPrompt(e) ? '.own' : ''), { title: isDone(e) ? (isFlagged(e) ? 'done, saved with leftovers' : 'done') : 'missing' });
      const thumb = h('div.thumb', isDone(e) ? h('img', { src: e.file + '?t=' + Date.now(), alt: '' }) : h('span', e.kind === 'portrait' ? 'P' : 'S'));
      const row = h('button.row' + (state.key === e.key ? '.active' : ''), { type: 'button', onclick: () => select(e.key) }, thumb, h('div.who', e.name.replace(/ — .*/, ''), h('small', `${e.kind === 'portrait' ? 'Portrait' : 'Sprite'} · ${e.era === 'p1' ? 'Part I' : 'Shippuden'}${e.facing === 'left' ? ' · faces left' : ''}`)), dot);
      list.appendChild(row);
    }
  }
  if (!shown) list.appendChild(h('p.small.muted', { style: { padding: '12px' } }, 'Nothing matches.'));
  const P = state.entries.filter(e => e.kind === 'portrait'), S = state.entries.filter(e => e.kind === 'sprite');
  $('#stats').textContent = `portraits ${P.filter(isDone).length}/${P.length} · sprites ${S.filter(isDone).length}/${S.length}${state.entries.some(isFlagged) ? ` · flagged ${state.entries.filter(isFlagged).length}` : ''}`;
}

// ------------------------------------------------------------------ the entry
function select(key) {
  state.key = key; state.work = null; state.history = []; state.wand = false; state.bg = null;
  const e = state.entries.find(x => x.key === key);
  document.documentElement.dataset.era = e.era;
  renderList();
  renderEntry(e);
  if (isDone(e)) loadCurrent(e);
}
function renderEntry(e) {
  const other = state.entries.find(x => x.id === e.id && x.kind !== e.kind);
  const prompt = state.overrides.prompts[e.key] || e.prompt;
  const ta = h('textarea' + (hasOwnPrompt(e) ? '.own' : ''), { spellcheck: 'false' }); ta.value = prompt;
  const promptNote = h('span.small.muted', hasOwnPrompt(e) ? 'your wording (kept in assets/art-overrides.json)' : 'the manifest\'s prompt');
  const main = $('#main'); main.replaceChildren(
    h('div.card', h('div.art-entry-head', h('h2', e.name), h('span.pill', e.kind === 'portrait' ? `Portrait · ${e.px} px` : `Sprite · ${e.px} px`), h('span.pill', e.era === 'p1' ? 'Part I' : 'Shippuden'), h('span.pill', `faces ${e.facing}`),
      isDone(e) ? h('span.pill.good', '✓ in the game') : h('span.pill', 'missing'), isFlagged(e) ? h('span.pill.bad', `saved with ${statusOf(e).leftover} leftover px`) : null,
      other ? h('button.ghost.small', { type: 'button', onclick: () => select(other.key) }, other.kind === 'portrait' ? '→ the portrait' : '→ the sprite') : null),
      h('div.art-kv', { style: { marginTop: '8px' } }, h('b', 'Used for'), h('span', e.usage), h('b', 'File'), h('span', e.file), h('b', 'Generate at'), h('span', `${e.generate} × ${e.generate}, ${e.aspect}; drop it here as PNG, JPG or WebP`), e.note ? h('b', 'Note') : null, e.note ? h('span', e.note) : null)),
    h('div.art-two',
      h('div.card.art-prompt', h('h3', 'Prompt'), ta,
        h('div.art-actions', btn('Copy', () => navigator.clipboard.writeText(ta.value).then(() => flash(promptNote, 'copied')), 'primary'),
          btn('Save prompt', () => savePrompt(e, ta.value, promptNote, ta)), hasOwnPrompt(e) ? btn('Back to the manifest\'s', () => savePrompt(e, null, promptNote, ta), 'ghost') : null, promptNote)),
      h('div.card', h('h3', 'The picture'),
        dropZone(e),
        h('div.art-actions', { id: 'loaders' },
          isDone(e) ? btn('Load the game\'s file', () => loadCurrent(e), 'ghost') : null,
          originalOf(e) ? btn('Reprocess the original', () => loadFromUrl(e, originalOf(e)), 'ghost') : null),
        h('div', { id: 'workWrap' }))),
    h('div.card', { id: 'bgCard' }, h('h3', 'Over black, white, red and a checkerboard'), h('p.small.muted', 'Leftover background shows up here at once. Anything white that should not be there: switch the wand on and click it.'), h('div.art-bgs', { id: 'bgs' })),
    h('div.card', { id: 'ctxCard' }, h('h3', 'Where it will be used'), h('div.art-ctx', { id: 'ctx' })),
  );
  renderPreviews(e);
}
function btn(label, onclick, cls = '') { return h('button' + (cls ? '.' + cls.split(' ').join('.') : ''), { type: 'button', onclick }, label); }
function flash(el, text) { const old = el.textContent; el.textContent = text; setTimeout(() => { el.textContent = old; }, 1400); }
function dropZone(e) {
  const input = h('input', { type: 'file', accept: 'image/*', onchange: (ev) => { const f = ev.target.files?.[0]; if (f) loadFile(e, f); ev.target.value = ''; } });
  const zone = h('div.art-drop', h('div', h('b', 'Drop the picture here'), h('div.small.muted', 'or click to choose a file · the background is keyed out on load')), input);
  zone.addEventListener('dragover', (ev) => { ev.preventDefault(); zone.classList.add('over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop', (ev) => { ev.preventDefault(); zone.classList.remove('over'); const f = ev.dataTransfer.files?.[0]; if (f) loadFile(e, f); });
  return zone;
}

// ------------------------------------------------------------------ loading and keying
function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }
async function loadFile(e, file) { const url = URL.createObjectURL(file); try { await loadFromUrl(e, url, { keyed: false }); } finally { URL.revokeObjectURL(url); } }
async function loadCurrent(e) { await loadFromUrl(e, e.file + '?t=' + Date.now(), { keyed: true }); }
/** Put an image on the work canvas. keyed: it is already transparent (the game's file): only check it. */
async function loadFromUrl(e, url, { keyed = false } = {}) {
  let img; try { img = await loadImage(url); } catch { setWarn('Could not read that image.', 'bad'); return; }
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height);
  let info;
  if (keyed) { state.bg = null; info = { keyed: 0, holes: 0, already: true }; }
  else { const r = keyBackground(d.data, c.width, c.height); state.bg = r.bg; info = r; g.putImageData(d, 0, 0); }
  state.work = { canvas: c, ctx: g, source: keyed ? 'game' : 'file', flip: false, info };
  state.history = [];
  renderWork(e);
}
function snapshot() { const { canvas, ctx } = state.work; state.history.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); if (state.history.length > 8) state.history.shift(); }
function undo(e) { const im = state.history.pop(); if (!im) return; state.work.ctx.putImageData(im, 0, 0); renderWork(e); }

/** The leftover check: opaque patches coloured like the background (or, for the game's own file, like white or magenta). */
function checkLeftovers() {
  const { canvas, ctx } = state.work; const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const minHole = Math.max(DEFAULTS.minHole, Math.round(DEFAULTS.warnHoleFrac * canvas.width * canvas.height));
  const bgs = state.bg ? [state.bg] : [[255, 255, 255], [255, 0, 255]];
  let patches = [];
  for (const bg of bgs) patches = patches.concat(leftovers(d.data, canvas.width, canvas.height, bg, { holeTol: DEFAULTS.holeTol, minHole }));
  patches.sort((a, b) => b.size - a.size);
  return { patches, pixels: patches.reduce((s, p) => s + p.size, 0) };
}

// ------------------------------------------------------------------ the work canvas, the tools and the previews
function renderWork(e) {
  const wrap = $('#workWrap'); if (!wrap) return;
  const w = state.work; if (!w) { wrap.replaceChildren(); return; }
  const check = checkLeftovers();
  const view = h('canvas.view' + (state.wand ? '.wand' : ''), { width: w.canvas.width, height: w.canvas.height, title: state.wand ? 'Click a leftover patch to remove it' : '' });
  const vg = view.getContext('2d'); vg.drawImage(w.canvas, 0, 0);
  // highlight the flagged patches
  const hl = h('canvas.hl', { width: w.canvas.width, height: w.canvas.height }); const hg = hl.getContext('2d');
  if (check.patches.length) { const im = hg.createImageData(w.canvas.width, w.canvas.height); for (const p of check.patches) for (const k of p.pixels) { im.data[k * 4] = 255; im.data[k * 4 + 1] = 40; im.data[k * 4 + 2] = 40; im.data[k * 4 + 3] = 150; } hg.putImageData(im, 0, 0); hg.strokeStyle = '#ff5a5a'; hg.lineWidth = Math.max(2, w.canvas.width / 400); for (const p of check.patches) hg.strokeRect(p.x0 - 4, p.y0 - 4, p.x1 - p.x0 + 9, p.y1 - p.y0 + 9); }
  view.addEventListener('click', (ev) => {
    if (!state.wand) return;
    const r = view.getBoundingClientRect(); const x = Math.floor((ev.clientX - r.left) * view.width / r.width), y = Math.floor((ev.clientY - r.top) * view.height / r.height);
    snapshot();
    const d = w.ctx.getImageData(0, 0, w.canvas.width, w.canvas.height);
    const n = wandRemove(d.data, w.canvas.width, w.canvas.height, x, y);
    if (n) { w.ctx.putImageData(d, 0, 0); renderWork(e); } else state.history.pop();
  });
  const work = h('div.art-work', view, hl);
  const flipBtn = btn(w.flip ? 'Flip back' : 'Flip', () => { snapshot(); flipCanvas(); w.flip = !w.flip; renderWork(e); }, 'ghost');
  const wandBtn = btn('🪄 Wand' + (state.wand ? ' on' : ''), () => { state.wand = !state.wand; renderWork(e); }, state.wand ? 'wandon' : 'ghost');
  const rekey = w.source === 'file' && state.bg ? btn('Key again (auto)', () => { snapshot(); const d = w.ctx.getImageData(0, 0, w.canvas.width, w.canvas.height); const r = keyBackground(d.data, w.canvas.width, w.canvas.height, { bg: state.bg }); w.ctx.putImageData(d, 0, 0); w.info = r; renderWork(e); }, 'ghost') : null;
  const undoBtn = btn('Undo', () => undo(e), 'ghost'); undoBtn.disabled = !state.history.length;
  // the game's file is 256 / 512 px: too small to re-ingest, so a fix starts from the original or a new picture
  const saveBtn = w.source === 'game' ? h('span.small.muted', 'To change it, reprocess the original or drop a new picture, then save.') : btn('💾 Save to the game', () => save(e, check), 'primary');
  const size = `${w.canvas.width} × ${w.canvas.height}`;
  const info = w.info.already ? `the game's file (${size}); checked for white and magenta leftovers` : `${size} · background ${state.bg ? `rgb(${state.bg.join(', ')})` : '?'} · ${Math.round(w.info.keyed * 100)}% keyed${w.info.holes ? ` · ${w.info.holes} enclosed patch${w.info.holes === 1 ? '' : 'es'} removed` : ''}`;
  wrap.replaceChildren(
    h('div.art-actions', flipBtn, rekey, wandBtn, undoBtn, saveBtn),
    h('p.tiny.muted', info),
    work,
    setWarnEl(check),
    h('div', { id: 'saveLog' }),
  );
  renderPreviews(e, w.canvas);
}
function setWarnEl(check) {
  if (!check.patches.length) return h('div.art-warn.good', '✓ No leftover background found. Look at the four backgrounds below to be sure.');
  const big = check.patches[0];
  return h('div.art-warn.bad', `⚠ ${check.patches.length} patch${check.patches.length === 1 ? '' : 'es'} of background colour still opaque (${check.pixels.toLocaleString('en-US')} px; the biggest ${big.size.toLocaleString('en-US')} px at ${big.x0}–${big.x1}, ${big.y0}–${big.y1}), outlined in red. The whites of the eyes trigger this on a white background: if it is art, leave it; if it is background, switch the wand on and click it.`);
}
function setWarn(text, cls) { const wrap = $('#workWrap'); if (wrap) wrap.replaceChildren(h('div.art-warn.' + cls, text)); }
function flipCanvas() { const { canvas, ctx } = state.work; const copy = document.createElement('canvas'); copy.width = canvas.width; copy.height = canvas.height; copy.getContext('2d').drawImage(canvas, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(copy, 0, 0); ctx.restore(); }

/** The four backgrounds and the in-game contexts, from the work canvas (or the game's file when there is none). */
function renderPreviews(e, canvas = null) {
  const bgs = $('#bgs'), ctx = $('#ctx'); if (!bgs || !ctx) return;
  const src = canvas ? canvas.toDataURL('image/png') : (isDone(e) ? e.file + '?t=' + Date.now() : null);
  bgs.replaceChildren(...['black', 'white', 'red', 'checker'].map(k => h('div.bg.' + k, src ? h('img', { src, alt: '' }) : h('span', 'nothing loaded'), h('span', k))));
  if (!src) { ctx.replaceChildren(h('p.small.muted', 'Load a picture (or save one) to see it in the game\'s frames.')); return; }
  const img = new Image(); img.src = src;
  img.onload = () => {
    // The previews read the image through the game's own asset registry, so they are the real tokens.
    Assets._registry.files.add(e.file); Assets._registry.images.set(e.file, img);
    ctx.replaceChildren(...(e.kind === 'portrait' ? portraitContexts(e) : spriteContexts(e, img)));
  };
}
function portraitContexts(e) {
  const def = e.def || { id: e.id, name: e.name, tier: 'genin' }; const era = e.era; const enemy = !!def.side;
  const av = (opts = {}) => avatar(def, { era, facing: enemy ? -1 : 1, expression: enemy ? 'menace' : 'set', ...opts });
  const tokens = h('div.ctx', h('div.tiny', 'Tokens (small, normal)'), h('div.row', av({ size: 'sm' }), av()));
  // the battle's ult bar card, as BattleScreen builds it (.ult .avatar is 46 px)
  const ultCard = h('div.ctx', h('div.tiny', 'The ult bar in battle'), h('div', { style: { padding: '10px', background: '#0b1016', borderRadius: '14px', width: '200px' } }, h('div.ult.ready', av(), h('div.info', h('div.nm', def.short || def.name), h('div.ultname', def.ult?.name || 'Ultimate'), h('div.hp', h('i', { style: { width: '72%' } })), h('div.ck', h('i', { style: { width: '100%' } }))))));
  const card = h('div.ctx', h('div.tiny', 'Roster card'), h('div.char-card', h('span.lvl', 'Lv 30'), av(), h('div.name', def.name), h('div.meta', h('span.tier.' + (def.tier || 'genin'), (def.tier || 'genin').replace(/^\w/, c => c.toUpperCase())))));
  const slot = h('div.ctx', h('div.tiny', 'Team slot'), h('div.slot.filled', h('span.slot-label', 'Slot 1'), av()));
  const dlg = h('div.ctx', h('div.tiny', 'Dialogue box'), h('div.art-frame', h('div.dlg' + (enemy ? '.right' : ''), av({ size: 'lg', facing: enemy ? -1 : 1 }), h('div.box', h('div.name', def.short || def.name), h('div.text', enemy ? 'You should not have come here.' : 'Believe it! Let\'s go!')))));
  const boss = h('div.ctx', h('div.tiny', 'Boss card'), h('div.art-frame', h('div.bosscard', av({ size: 'lg', facing: -1 }), h('div.txt', h('div.tag', 'BOSS'), h('div.name', def.name), h('div.title', def.title || 'Title on the intro card')))));
  return [tokens, ultCard, card, slot, dlg, boss];
}
function spriteContexts(e, img) {
  const def = e.def || { id: e.id, name: e.name, tier: 'genin' }; const look = lookFor(def, C); const enemy = !!def.side;
  const c = h('canvas.art-field', { width: 760, height: 260 }); const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 260); sky.addColorStop(0, e.era === 'p1' ? '#7fb2e5' : '#1b2230'); sky.addColorStop(1, e.era === 'p1' ? '#c9e3f6' : '#2a3140'); g.fillStyle = sky; g.fillRect(0, 0, 760, 260);
  g.fillStyle = e.era === 'p1' ? '#6f9a4a' : '#3a3f4a'; g.fillRect(0, 200, 760, 60); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 200, 760, 3);
  const y = 200;
  // the sprite at 1×, the code figure for scale, the sprite as a boss (×1.25) and mirrored as an enemy
  drawFigure(g, look, { x: 110, y, facing: 1, scale: 1, t: 0, sprite: img, expression: 'set' });
  drawFigure(g, look, { x: 230, y, facing: 1, scale: 1, t: 0, sprite: null, expression: 'set' });
  drawFigure(g, look, { x: 390, y, facing: 1, scale: 1, boss: true, t: 0, sprite: img, expression: 'set' });
  drawFigure(g, look, { x: 600, y, facing: -1, scale: 1, t: 0, sprite: img, expression: 'menace' });
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.font = '12px system-ui, sans-serif'; g.textAlign = 'center';
  for (const [x, t] of [[110, 'the sprite (110 units)'], [230, 'code figure (96)'], [390, 'as a boss ×1.25'], [600, enemy ? 'enemy side' : 'mirrored (enemy side)']]) g.fillText(t, x, 240);
  const token = h('div.ctx', h('div.tiny', 'The battlefield, at the game\'s size'), c);
  const note = h('p.small.muted', 'The ingest crops to the figure and stands it bottom-centred in the square, so a little empty space around the figure is fine; the feet should be the lowest thing in the picture.');
  return [token, note];
}

// The local endpoints answer JSON; anything else (a 404 page) means an older server started before the studio existed.
async function post(url, body) {
  let r; try { r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); } catch (err) { return { ok: false, error: 'No answer from the local server. Is it running (npm run serve)?' }; }
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { ok: false, error: r.status === 404 ? 'This server does not know the art studio: it was started before art.html was added. Stop it and run npm run serve again (or restart the preview in the app), then reload this page.' : `The server answered with something that is not JSON (HTTP ${r.status}).`, log: text.slice(0, 300) }; }
}

// ------------------------------------------------------------------ saving
async function savePrompt(e, prompt, noteEl, ta) {
  noteEl.textContent = 'saving…';
  const r = await post('/api/art/prompt', { id: e.id, kind: e.kind, prompt });
  if (!r.ok) { noteEl.textContent = 'could not save: ' + (r.error || r.log || 'is the local server running?'); return; }
  if (prompt) state.overrides.prompts[e.key] = prompt; else delete state.overrides.prompts[e.key];
  state.manifest = await getJSON('assets/manifest.json', state.manifest);
  const fresh = (e.kind === 'portrait' ? state.manifest.portraits : state.manifest.sprites).find(x => x.id === e.id);
  if (fresh) { e.prompt = fresh.prompt; if (!prompt) ta.value = fresh.prompt; }
  ta.classList.toggle('own', !!prompt);
  noteEl.textContent = prompt ? (/#FF00FF/.test(prompt) ? 'saved: your wording (kept in assets/art-overrides.json)' : 'saved: your wording. It no longer asks for the flat magenta background; any flat colour keys out, but keep it flat and avoid white (the whites of the eyes)') : 'back to the manifest\'s prompt';
  renderList();
}
async function save(e, check) {
  const log = $('#saveLog'); if (log) log.replaceChildren(h('p.small.muted', 'Saving and ingesting…'));
  const png = state.work.canvas.toDataURL('image/png');
  const r = await post('/api/art/save', { id: e.id, kind: e.kind, incoming: e.incoming, flip: false, leftover: check.pixels, png });
  if (!r.ok) { if (log) log.replaceChildren(h('div.art-warn.bad', 'Not saved: ' + (r.error || 'the ingest failed')), r.log ? h('pre.art-log', r.log) : null); return; }
  state.index.add(e.file); Assets.setIndex([...state.index]); Assets._registry.images.delete(e.file);
  state.overrides.status[e.key] = { savedAt: new Date().toISOString(), leftover: check.pixels };
  state.originals = (await getJSON('/api/art/originals', { files: {} })).files || {};
  if (log) log.replaceChildren(h('div.art-warn.good', `✓ Saved: ${r.file}. The previews now show the file the game will load.`), h('pre.art-log', r.log));
  renderList();
  // show the ingested file (the truth) in the previews, keeping the work canvas for further edits
  const img = await loadImage(e.file + '?t=' + Date.now()).catch(() => null);
  if (img) { Assets._registry.images.set(e.file, img); renderPreviews(e, null); }
}

// ------------------------------------------------------------------ boot
async function boot() {
  if (!(await loadAll())) return;
  for (const id of ['search', 'onlyMissing', 'onlyFlagged']) $('#' + id).addEventListener('input', renderList);
  renderList();
  const first = location.hash.slice(1); if (first && state.entries.some(e => e.key === first)) select(first);
  const cur = () => state.entries.find(x => x.key === state.key);
  window.__art = { state, select, loadFromUrl: (url, opts) => loadFromUrl(cur(), url, opts), check: checkLeftovers, save: () => save(cur(), checkLeftovers()), undo: () => undo(cur()),
    // the wand as a call (the click on the canvas needs a visible pane)
    wandAt: (x, y) => { const w = state.work; snapshot(); const d = w.ctx.getImageData(0, 0, w.canvas.width, w.canvas.height); const n = wandRemove(d.data, w.canvas.width, w.canvas.height, x, y); if (n) { w.ctx.putImageData(d, 0, 0); renderWork(cur()); } else state.history.pop(); return n; } };
}
boot();

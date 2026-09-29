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
import { keyBackground as keyBackgroundRaw, inkLines, matchOutline, outlineRatioOf, leftovers, wandRemove, backgroundColor, bounds, DEFAULTS } from '../tools/key-lib.mjs';
import { REF_CM, REF_HEADS, GIANT_SCALE } from '../js/core/stature.js';

const $ = (s, r = document) => r.querySelector(s);
const MAX_SIDE = 1536;         // work at most this big in the browser (a 1024² generation is used as is)
const state = { manifest: null, index: new Set(), reuse: {}, figures: {}, strength: 1, inkLines: true, matchOutline: true, overrides: { prompts: {}, status: {} }, originals: {}, entries: [], groups: [], key: null, work: null, history: [], wand: false, bg: null, marks: null };
const HEADS_TOL = 0.10;
/** Every key in the studio: the background out, then (the Black lines box, on by default) the outlines to the ink. */
function keyBackground(data, W, H, opts = {}) {
  // A picture that is already transparent (a studio save, reprocessed) is not keyed again: its see-through
  // pixels would read as a black background and the keyer would eat the black outlines. The line steps
  // below still run.
  let clear = 0, n = 0; for (let k = 0; k < W * H; k += 7) { n++; if (data[k * 4 + 3] < 8) clear++; }
  const r = clear / n > 0.01 ? { bg: null, keyed: 0, holes: 0, preKeyed: true } : keyBackgroundRaw(data, W, H, opts);
  r.inked = state.inkLines ? inkLines(data, W, H) : 0;
  // a sprite's outer outline to Part I Naruto's weight (the Match outline box, on by default; sprites only)
  // a sprite's outline to the reference's weight (Part I Naruto's own page sets that weight, so it is left as drawn)
  const isSprite = String(state.key || '').startsWith('sprite:'), isRef = state.key === 'sprite:naruto_p1';
  r.outline = state.matchOutline && isSprite && !isRef ? matchOutline(data, W, H, state.refRatio ? { ratio: state.refRatio } : {}) : null;
  r.checker = r.preKeyed ? false : paintedChecker(data, W, H);
  return r;
}        // a sprite within 6% of its target height in heads passes the head check

// ------------------------------------------------------------------ data
async function getJSON(url, fallback) { try { const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) return fallback; return await r.json(); } catch { return fallback; } }
async function loadAll() {
  state.manifest = await getJSON('assets/manifest.json', null);
  if (!state.manifest) { $('#main').replaceChildren(h('div.card', h('h2', 'No manifest'), h('p', 'Run node tools/manifest.mjs first.'))); return false; }
  await loadIndex();
  state.overrides = await getJSON('assets/art-overrides.json', { prompts: {}, status: {} });
  state.overrides.prompts = state.overrides.prompts || {}; state.overrides.status = state.overrides.status || {};
  state.originals = (await getJSON('/api/art/originals', { files: {} })).files || {};
  state.animeRefs = (await getJSON('/api/art/references', { files: {} })).files || {};
  const reuse = new Map(); for (const r of state.manifest.reuse || []) { if (!reuse.has(r.uses)) reuse.set(r.uses, []); reuse.get(r.uses).push(r.id); }
  state.entries = [];
  for (const kind of ['portrait', 'sprite']) for (const e of state.manifest[kind === 'portrait' ? 'portraits' : 'sprites']) {
    const def = defOf(e.id);
    state.entries.push({ ...e, kind, key: `${kind}:${e.id}`, def, arc: arcOf(e.id, def, reuse), search: `${e.name} ${e.id} ${def?.short || ''}`.toLowerCase() });
  }
  groupEntries();
  return true;
}
/** assets/index.json: the files, the reuse map and the sprites' figure records, into the game's registry. */
async function loadIndex() {
  const idx = await getJSON('assets/index.json', { files: [] });
  state.index = new Set(idx.files || []); state.reuse = idx.reuse || {}; state.figures = idx.figures || {};
  Assets.setIndex([...state.index], state.reuse, state.figures);
  Assets.setQuality('high');   // the studio judges the sharpest version: the hd copy wherever it exists
  // the outline weight every sprite is matched to: the reference sprite's own (Part I Naruto), measured from its file
  const ref = state.index.has('assets/sprites/hd/naruto_p1.webp') ? 'assets/sprites/hd/naruto_p1.webp' : state.index.has('assets/sprites/naruto_p1.webp') ? 'assets/sprites/naruto_p1.webp' : null;
  state.refRatio = null;
  if (ref) { try { const im = await loadImage(ref + '?t=' + Date.now()); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); state.refRatio = outlineRatioOf(g.getImageData(0, 0, c.width, c.height).data, c.width, c.height); } catch { /* no reference yet */ } }
}
/**
 * A checkerboard painted in (ChatGPT sometimes draws the "transparent" pattern instead of real alpha): the
 * border is opaque, grey-white, and alternates between two light tones.
 */
function paintedChecker(data, W, H) {
  const tones = []; let opaque = 0, n = 0;
  for (let x = 0; x < W; x += 3) for (const y of [0, 1, H - 2, H - 1]) { const i = (y * W + x) * 4; n++; if (data[i + 3] > 250) opaque++; const r = data[i], g = data[i + 1], b = data[i + 2]; if (Math.max(r, g, b) - Math.min(r, g, b) < 14 && r > 150) tones.push(r); }
  if (opaque / n < 0.95 || tones.length / n < 0.9) return false;
  tones.sort((a, b) => a - b);
  const lo = tones[Math.floor(tones.length * 0.2)], hi = tones[Math.floor(tones.length * 0.8)];
  return hi - lo >= 12;   // two distinct light greys along the edge: a painted checkerboard, not a flat colour
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
// The first group: everyone who teaches a system or a mechanic (the tutorial, the coach tips, the first-visit
// scenes in js/content/story/teach.js), in the order a new player meets them, so their art is made first.
// A priority entry leaves its arc's group, so each picture is listed once.
const PRIORITY = [
  ['naruto_p1', 'the reference, the tutorial'],
  ['iruka_p1', 'teaches the tutorial and the Team Builder'],
  ['e_mizuki', 'the tutorial fights'],
  ['kakashi_p1', 'teaches Ultimates, the Nature Wheel, Jutsu Clash, Hard mode'],
  ['sasuke_p1', 'the tutorial team'],
  ['sakura_p1', 'the tutorial team'],
  ['shikamaru_p1', 'teaches the Story map, Skip, teams, Auto-ult'],
  ['jiraiya_p1', 'teaches Summon, banners, the Boss Rush'],
  ['tsunade_p1', 'teaches the Roster, duplicate summons'],
  ['guy_p1', 'teaches the Daily challenge'],
  ['lee_p1', 'teaches the Daily challenge'],
  ['konohamaru', 'teaches Achievements'],
];
const PRIORITY_WHY = new Map(PRIORITY);
function groupEntries() {
  const map = new Map();
  const prio = { order: -100, name: 'Priority: teaches a system or mechanic', id: 'priority', entries: [] };
  for (const e of state.entries) {
    if (PRIORITY_WHY.has(e.id)) { prio.entries.push(e); continue; }
    if (!map.has(e.arc.id)) map.set(e.arc.id, { ...e.arc, entries: [] }); map.get(e.arc.id).entries.push(e);
  }
  state.groups = [prio, ...[...map.values()].sort((a, b) => a.order - b.order)];
  for (const g of state.groups.slice(1)) g.entries.sort((a, b) => a.name.localeCompare(b.name) || a.kind.localeCompare(b.kind));
  const rank = new Map(PRIORITY.map(([id], i) => [id, i]));
  prio.entries.sort((a, b) => rank.get(a.id) - rank.get(b.id) || b.kind.localeCompare(a.kind));
}
const isDone = (e) => state.index.has(e.file);
const statusOf = (e) => state.overrides.status[e.key] || null;
const isFlagged = (e) => (statusOf(e)?.leftover || 0) > 0;
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
      const row = h('button.row' + (state.key === e.key ? '.active' : ''), { type: 'button', onclick: () => select(e.key) }, thumb, h('div.who', e.name.replace(/ — .*/, ''), h('small', `${e.kind === 'portrait' ? 'Portrait' : 'Sprite'} · ${e.era === 'p1' ? 'Part I' : 'Shippuden'}${e.facing === 'left' ? ' · faces left' : ''}${g.id === 'priority' ? ' · ' + PRIORITY_WHY.get(e.id) : ''}`)), dot);
      list.appendChild(row);
    }
  }
  if (!shown) list.appendChild(h('p.small.muted', { style: { padding: '12px' } }, 'Nothing matches.'));
  const P = state.entries.filter(e => e.kind === 'portrait'), S = state.entries.filter(e => e.kind === 'sprite');
  $('#stats').textContent = `portraits ${P.filter(isDone).length}/${P.length} · sprites ${S.filter(isDone).length}/${S.length}${state.entries.some(isFlagged) ? ` · flagged ${state.entries.filter(isFlagged).length}` : ''}`;
}

// ------------------------------------------------------------------ the entry
function select(key) {
  state.key = key; state.work = null; state.history = []; state.wand = false; state.bg = null; state.marks = null;
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
      promptCard(e),
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
// ------------------------------------------------------------------ the prompt card
// Two tabs, Gemini and ChatGPT (the choice is remembered). Each: the app's own "before you generate"
// checklist (how to reach its best image model), the files to attach in order with a download button for
// each, then the prompt. Your own wording for a tab is kept apart from the generated prompt (which follows
// design changes); when the generated one changed since you saved yours, the changes are highlighted.
// The ChatGPT tab has a background switch: transparent (try it first) or the flat key colour.
const GENERATORS = [['', '(not recorded)'], ['gemini', 'Gemini'], ['chatgpt', 'ChatGPT'], ['other', 'Other']];
const store = { get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } } };
state.tab = store.get('art.tab', 'chatgpt');
state.bgMode = store.get('art.bg', 'transparent');
const ovKey = (e, tab = state.tab) => tab === 'chatgpt' ? `${e.key}@chatgpt` : e.key;
const ownOf = (e, tab = state.tab) => state.overrides.prompts[ovKey(e, tab)] || null;
const hasOwnPrompt = (e) => !!(state.overrides.prompts[e.key] || state.overrides.prompts[`${e.key}@chatgpt`]);
/** The generated prompt for a tab (ChatGPT: by the background switch). */
const generatedOf = (e, tab = state.tab) => {
  const P = e.prompts || { gemini: e.prompt, chatgpt: e.prompt, chatgptTransparent: e.prompt };
  const text = tab === 'gemini' ? P.gemini : (state.bgMode === 'transparent' ? P.chatgptTransparent : P.chatgpt);
  return usesAnimeRef(e) ? withAnimeRef(text, (e.refs || []).length + 1) : text;
};
// ---- the anime reference (references/<entry id>_<n>.png, found by the local server): official art or an
// anime frame of the character, attached after the Naruto references, for the design only (a generator copies
// whatever it is shown, so the prompt limits it to face, hair, outfit and colours). Sprites only: a portrait is
// built from the character's own sprite.
state.animeRefOn = store.get('art.animeRef', '1') === '1';
const animeRefsOf = (e) => (state.animeRefs || {})[e.id] || [];
const usesAnimeRef = (e) => e.kind === 'sprite' && state.animeRefOn && animeRefsOf(e).length > 0;
const ANIME_REF_ROLE = 'the character design reference ONLY, from the anime: match the face, hair, outfit, accessories and colours exactly. Do NOT copy its pose, framing, camera angle, art style, line weight or proportions';
function withAnimeRef(text, n) {
  const line = `Image ${n} (the anime reference of this character): ${ANIME_REF_ROLE}.`;
  const at = text.indexOf('\n\nSTYLE:');
  if (text.includes('REFERENCES:\n')) return text.slice(0, at) + '\n' + line + text.slice(at);
  return text.slice(0, at) + '\n\nREFERENCES:\n' + line + text.slice(at);
}
const KEY_LABEL = { magenta: 'magenta', green: 'green', cyan: 'cyan', yellow: 'yellow' };

const CHECKLIST = {
  gemini: [
    'Start a new chat for this image (an old chat carries its pictures and drifts).',
    'Set the model picker to Pro, then choose Create images (or Images in the sidebar). Flash-Lite makes lower-quality images; avoid it.',
    'If Settings has Media Watermark, turn it off, so the sparkle mark does not land on the background.',
    'Attach the files below in the order listed (Image 1 first), then paste the prompt and send.',
    'On a picture you like, open More and choose Redo with Pro: that redraws it with Nano Banana Pro, Gemini\'s best image model. Download the Pro version at full size (2K on your plan).',
    'To fix one detail, reply in the same chat: "Change only [the detail]. Keep the pose, proportions, line weight, colours and background exactly the same." For proportions, start a new chat instead.',
    'Gemini cannot zoom out a picture it made (it says it did, and changes nothing). If a portrait is framed too close, shrink it onto a bigger canvas of the same background colour and ask Gemini, in a new chat, to complete the cut-off body into the empty area.',
  ],
  chatgpt: [
    'Start a new chat for this image (an old chat carries its pictures and drifts).',
    'In the model picker choose a Thinking model, so the picture is made "with thinking" (ChatGPT Images 2.5 plans and checks the image first; best quality).',
    'Attach the files below in the order listed (Image 1 first), then paste the prompt and send.',
    'Download the picture (not a screenshot). With the transparent background, the studio checks the file: if ChatGPT painted a grey checkerboard instead of real transparency, switch the background to the key colour and generate again.',
    'To fix one detail, reply in the same chat: "Change only [the detail]. Keep identical: pose, proportions, head size, line weight, colours, background." For proportions, start a new chat instead.',
  ],
};
/** Where this image sits in the reference set (Naruto's four pictures come first, in this order). */
const REF_SET = ['sprite:naruto_p1', 'portrait:naruto_p1', 'sprite:naruto_p2', 'portrait:naruto_p2'];

function promptCard(e) {
  const tab = state.tab;
  const own = ownOf(e);
  const generated = generatedOf(e);
  const note = h('span.small.muted', own ? 'your wording for this tab, kept in assets/art-overrides.json' : 'the generated prompt');
  const mine = h('textarea' + (own ? '.own' : ''), { spellcheck: 'false' }); mine.value = own || generated;
  const redraw = () => { const card = $('#promptCard'); if (card) card.replaceWith(promptCard(e)); renderSideBySide(e, state.lastPreview || null); };
  const tabs = h('div.art-tabs', { role: 'tablist' }, ...[['gemini', 'Gemini'], ['chatgpt', 'ChatGPT']].map(([t, label]) =>
    h('button' + (t === tab ? '.on' : ''), { type: 'button', role: 'tab', 'aria-selected': String(t === tab), onclick: () => { state.tab = t; store.set('art.tab', t); redraw(); } }, label)));
  const step = REF_SET.indexOf(e.key);
  const refBanner = step >= 0
    ? h('div.art-warn.info', `Reference set, step ${step + 1} of 4. ` + ['Part I Naruto\'s sprite is the ruler for every sprite: its head size, proportions and outline weight are what everyone is measured against. Make it first.', 'Part I Naruto\'s portrait sets the framing for every portrait. Make it with his new sprite attached.', 'Shippuden Naruto\'s sprite: the same style and head size, three years older and 166 cm.', 'Shippuden Naruto\'s portrait: framed like the Part I portrait, looking like the Shippuden sprite.'][step])
    : null;
  const bgSwitch = tab === 'chatgpt'
    ? h('div.art-bgswitch', h('span.small', 'Background:'),
      ...[['transparent', 'Transparent (try first)'], ['key', `Flat ${KEY_LABEL[e.keyColour || 'magenta']}`]].map(([v, label]) =>
        h('button' + (state.bgMode === v ? '.on' : ''), { type: 'button', onclick: () => { state.bgMode = v; store.set('art.bg', v); redraw(); } }, label)))
    : h('p.tiny.muted', `Background: flat ${KEY_LABEL[e.keyColour || 'magenta']} (Gemini cannot make a transparent picture).`);
  const parts = [
    h('div.art-prompt-head', h('h3', 'Prompt'), tabs),
    refBanner,
    h('details.art-check', { open: true }, h('summary', h('b', `Before you generate in ${tab === 'gemini' ? 'Gemini' : 'ChatGPT'}`)), h('ol', ...CHECKLIST[tab].map(t => h('li', t)))),
    attachments(e),
    bgSwitch,
    mine,
    h('div.art-actions',
      btn('Copy', () => navigator.clipboard.writeText(mine.value).then(() => flash(note, 'copied')), 'primary'),
      btn(own ? 'Save my prompt' : 'Save as my prompt', () => savePrompt(e, mine.value, note)),
      own ? btn('Back to the generated prompt', () => savePrompt(e, null, note), 'ghost') : null, note),
  ];
  if (own) {
    const base = state.overrides.base?.[ovKey(e)];
    const changed = base != null && base !== generated;
    const header = changed
      ? h('div.art-warn.info', 'The generated prompt has changed since you saved yours (a design change). The changes are highlighted: green was added, red was removed. Carry over what you want, then save yours again.')
      : base == null
        ? h('div.art-warn.info', 'Your prompt was saved before changes were tracked, so the highlights show how the generated prompt differs from yours: green is only in the generated one, red only in yours.')
        : h('p.small.muted', 'Unchanged since you saved yours.');
    parts.push(h('details.art-gen', { open: changed || base == null },
      h('summary', h('b', 'The generated prompt'), h('span.small.muted', ' follows design changes; yours is never touched')),
      header,
      h('div.art-diff', ...diffWords(changed ? base : base == null ? own : generated, generated)),
      h('div.art-actions', btn('Copy the generated prompt', () => navigator.clipboard.writeText(generated).then(() => flash(note, 'copied the generated prompt')), 'ghost'))));
  }
  parts.push(generatorPicker(e), h('div.art-side', { id: 'sideBySide' }, h('p.small.muted', 'Load a picture to see it beside the reference.')));
  return h('div.card.art-prompt', { id: 'promptCard' }, ...parts);
}

/** The files to attach, numbered, each with what it controls and a download button (the hd copy when there is one). */
function attachments(e) {
  const refs = e.refs || [];
  const anime = e.kind === 'sprite' ? animeRefsOf(e) : [];
  const redraw = () => { const card = $('#promptCard'); if (card) card.replaceWith(promptCard(e)); };
  const tick = h('input', { type: 'checkbox', checked: state.animeRefOn });
  tick.addEventListener('change', () => { state.animeRefOn = tick.checked; store.set('art.animeRef', tick.checked ? '1' : '0'); redraw(); });
  const animeBlock = e.kind !== 'sprite' ? null : anime.length
    ? h('div.art-anime', h('label.small', tick, h('b', ` Attach an anime reference as Image ${refs.length + 1}`), h('span.muted', ' (adds the "design only" line to the prompt; pick one, a full-body one is best for the outfit)')),
      h('div.art-anime-row', ...anime.map((src) => h('div.art-anime-pick', h('img', { src, alt: '' }), h('a.dl.tiny', { href: src, download: src.split('/').pop() }, '⬇ ' + src.split('/').pop())))))
    : h('p.tiny.muted', `No anime reference for this character yet (put one in references/ as ${e.id}_1.png).`);
  if (!refs.length && !usesAnimeRef(e)) return h('div', h('p.small', h('b', 'Attach: nothing. '), 'This is the first picture of the reference set; it is made from the prompt alone.'), animeBlock);
  return h('div.art-attach', h('b.small', 'Attach, in this order:'),
    h('ol', ...refs.map((r) => {
      const have = state.index.has(r.file) || state.index.has(Assets.hdOf(r.file));
      const src = state.index.has(Assets.hdOf(r.file)) ? Assets.hdOf(r.file) : r.file;
      const name = src.split('/').pop().replace('.webp', '');
      return h('li', h('div.art-attach-row',
        have ? h('img', { src, alt: '' }) : h('span.art-attach-missing', '?'),
        h('div', h('b', r.label), h('div.tiny.muted', r.role.split(':')[0])),
        have ? h('a.dl.small', { href: src, download: `ref_${name}.webp` }, '⬇ Download') : h('span.tiny.muted', 'not made yet: make it first')));
    })), animeBlock);
}

/** Word-level differences from a to b: [spans]; ins = only in b (green), del = only in a (red). */
function diffWords(a, b) {
  const A = String(a).split(/(\s+)/), B = String(b).split(/(\s+)/);
  if (a === b) return [h('span', b)];
  const n = A.length, m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0;
  const push = (cls, t) => { const last = out[out.length - 1]; if (last && last.cls === cls) last.t += t; else out.push({ cls, t }); };
  while (i < n && j < m) {
    if (A[i] === B[j]) { push('', B[j]); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) { push('del', A[i]); i++; }
    else { push('ins', B[j]); j++; }
  }
  while (i < n) push('del', A[i++]);
  while (j < m) push('ins', B[j++]);
  return out.map(p => p.cls ? h('span.' + p.cls, p.t) : h('span', p.t));
}

function generatorPicker(e) {
  const cur = state.overrides.meta?.[e.key]?.generator || '';
  const sel = h('select', { 'aria-label': 'Generator used' }, ...GENERATORS.map(([v, t]) => h('option', { value: v, selected: v === cur }, t)));
  const note = h('span.small.muted', '');
  sel.addEventListener('change', async () => {
    const r = await post('/api/art/meta', { id: e.id, kind: e.kind, generator: sel.value });
    if (!r.ok) { note.textContent = 'not saved: ' + (r.error || 'is the local server running?'); return; }
    state.overrides.meta = state.overrides.meta || {}; state.overrides.meta[e.key] = { ...(state.overrides.meta[e.key] || {}), generator: sel.value };
    flash(note, 'saved'); renderList();
  });
  return h('div.art-generator', h('label', 'This picture was made with ', sel), note);
}

// ------------------------------------------------------------------ side by side with the reference
// Under the prompt: the reference (Part I Naruto) and this picture at the same scale. A sprite: both at
// canon height, feet on one line, with Naruto's skull and chin marked and a ±10 % band around each (a
// head inside the bands is within the head check's allowance). A portrait: Naruto's portrait and this
// one side by side, for framing and line weight.
function renderSideBySide(e, img) {
  const box = $('#sideBySide'); if (!box) return;
  if (!img) { box.replaceChildren(h('p.small.muted', 'Load a picture to see it beside the reference.')); return; }
  if (e.kind === 'portrait') {
    const refPath = Assets.portraitPath('naruto', 'p1');
    const tile = (src, label) => h('figure.art-sbs-tile', src ? h('img', { src, alt: label }) : h('span.small.muted', 'no reference yet'), h('figcaption.tiny', label));
    box.replaceChildren(h('div.art-sbs', tile(refPath, 'Part I Naruto (reference)'), tile(img.src, 'this portrait')));
    return;
  }
  const def = e.def || { id: e.id, name: e.name, tier: 'genin' }; const look = lookFor(def, C);
  const st = e.stature || {};
  const stature = st.kind === 'giant' ? GIANT_SCALE : (st.cm || REF_CM) / REF_CM;
  const fig = (state.marks && state.work && img.width === state.work.canvas.width) ? state.marks : (state.figures[e.file] || null);
  const REF = 'assets/sprites/naruto_p1.webp';
  const refPath = Assets.spritePath('naruto', 'p1');
  const refFig = state.figures[REF] || null;
  const CW = 480, CH = 420, gy = CH - 34, SK = 86;
  const cv = sharpCanvas(CW, CH, 'canvas.art-compare');
  const draw = () => {
    const g = cv.g;
    g.fillStyle = '#e9eef5'; g.fillRect(0, 0, CW, CH);
    g.fillStyle = '#c9d3df'; g.fillRect(0, gy, CW, CH - gy);
    const scale = (gy - 16) / (SK * Math.max(1, stature) * 1.35);
    const ref = refPath ? Assets.image(refPath) : null;
    drawFigure(g, lookFor(C.char.naruto, C), { x: CW * 0.28, y: gy, facing: 1, scale, stature: 1, t: 0, sprite: ref, fig: refFig, expression: 'set' });
    drawFigure(g, look, { x: CW * 0.72, y: gy, facing: 1, scale, stature, t: 0, sprite: img, fig, expression: 'set' });
    const rf = refFig && refFig.chin != null ? refFig : null;
    if (rf) {
      const hh = SK / (rf.feet - rf.top) * scale;
      const skullY = gy - SK * scale, chinY = gy - (rf.feet - rf.chin) * hh, band = (chinY - skullY) * HEADS_TOL;
      g.fillStyle = 'rgba(0,150,200,0.12)'; g.fillRect(0, skullY - band, CW, band * 2);
      g.fillStyle = 'rgba(210,150,0,0.14)'; g.fillRect(0, chinY - band, CW, band * 2);
      g.save(); g.setLineDash([7, 5]); g.lineWidth = 1.5;
      g.strokeStyle = 'rgba(0,150,200,0.9)'; g.beginPath(); g.moveTo(0, skullY); g.lineTo(CW, skullY); g.stroke();
      g.strokeStyle = 'rgba(200,140,0,0.95)'; g.beginPath(); g.moveTo(0, chinY); g.lineTo(CW, chinY); g.stroke();
      g.restore();
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.font = '11px system-ui, sans-serif'; g.textAlign = 'right';
      g.fillText('Naruto\'s skull ±10 %', CW - 6, skullY - band - 3); g.fillText('Naruto\'s chin ±10 %', CW - 6, chinY - band - 3);
    }
    g.fillStyle = 'rgba(0,0,0,0.7)'; g.font = '12px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText(`Part I Naruto (reference, ${Math.round(REF_CM)} cm)`, CW * 0.28, gy + 21);
    g.fillText(`this sprite (${st.kind === 'giant' ? 'giant size' : `${st.cm ?? '?'} cm`})`, CW * 0.72, gy + 21);
  };
  cv.onDraw(draw);
  if (refPath && !Assets.image(refPath)) Assets.onLoad(refPath, () => { if (cv.c.isConnected) draw(); });
  box.replaceChildren(cv.c, h('p.tiny.muted', 'Both at canon height, feet on one line. A head whose skull and chin sit inside the shaded bands is within the ±10 % allowance.'));
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
/** The game's file to show for an entry: its hd copy when there is one, else the standard file. */
const bestFile = (e) => state.index.has(Assets.hdOf(e.file)) ? Assets.hdOf(e.file) : e.file;
/** Put a picture in the game's registry under both of the entry's paths, so the game's own frames show it. */
const showInGame = (e, img) => { for (const f of [e.file, Assets.hdOf(e.file)]) { Assets._registry.files.add(f); Assets._registry.images.set(f, img); } };
async function loadCurrent(e) { await loadFromUrl(e, bestFile(e) + '?t=' + Date.now(), { keyed: true }); }
/** Put an image on the work canvas. keyed: it is already transparent (the game's file): only check it. */
async function loadFromUrl(e, url, { keyed = false } = {}) {
  let img; try { img = await loadImage(url); } catch { setWarn('Could not read that image.', 'bad'); return; }
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height);
  let info;
  // the untouched pixels, so the key-strength slider can key again from the original
  const orig = keyed ? null : new ImageData(new Uint8ClampedArray(d.data), c.width, c.height);
  if (keyed) { state.bg = null; info = { keyed: 0, holes: 0, already: true, checkedFor: KEY_RGB[e.keyColour] ? e.keyColour : 'magenta' }; }
  else { const r = keyBackground(d.data, c.width, c.height, { strength: state.strength }); state.bg = r.bg; info = r; g.putImageData(d, 0, 0); }
  state.work = { canvas: c, ctx: g, source: keyed ? 'game' : 'file', flip: false, info, orig };
  state.history = [];
  state.marks = e.kind === 'sprite' ? initialMarks(e, d.data, c.width, c.height, keyed) : null;
  renderWork(e);
}

// ------------------------------------------------------------------ head marks (sprites)
// Two lines on the work canvas: the top of the skull (not the hair) and the chin. The soles are the
// lowest opaque pixel. Soles-to-skull over chin-to-skull is the height in heads, checked against the
// sprite's target (its canon height over the shared head size); the game scales soles-to-skull to the
// canon height. Fractions of the picture's height throughout.
function targetHeads(e) { return e.stature?.heads || null; }
function initialMarks(e, data, W, H, keyed) {
  const b = bounds(data, W, H);
  const feet = b ? (b.y1 + 1) / H : 0.98;
  const saved = keyed ? state.figures[e.file] : null;
  if (saved && !saved.auto && saved.chin != null) return { top: saved.top, chin: saved.chin, feet, guessed: false };
  const top = b ? (b.y0 + 0.17 * (b.y1 - b.y0 + 1)) / H : 0.2;
  const heads = targetHeads(e) || REF_HEADS;
  return { top, chin: top + (feet - top) / heads, feet, guessed: true };
}
function headCheck(e) {
  const m = state.marks; if (!m) return null;
  const heads = (m.feet - m.top) / Math.max(0.01, m.chin - m.top);
  const target = targetHeads(e);
  const off = target ? (heads - target) / target : 0;
  return { heads, target, off, ok: !target || Math.abs(off) <= HEADS_TOL };
}
function marksLayer(e) {
  const m = state.marks;
  const layer = h('div.art-marks');
  const line = (key, label, cls) => {
    const el = h('div.mark.' + cls, { style: { top: `${m[key] * 100}%` } }, h('span', label));
    el.addEventListener('pointerdown', (ev) => {
      ev.preventDefault(); el.setPointerCapture(ev.pointerId);
      const move = (mv) => {
        const r = layer.getBoundingClientRect();
        let y = (mv.clientY - r.top) / r.height;
        y = key === 'top' ? Math.min(Math.max(0, y), m.chin - 0.02) : Math.min(Math.max(m.top + 0.02, y), m.feet - 0.05);
        m[key] = y; m.guessed = false; el.style.top = `${y * 100}%`; updateHeadReadout(e);
      };
      const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); renderPreviews(e, state.work.canvas); };
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up);
    });
    return el;
  };
  layer.append(line('top', 'top of the skull', 'skull'), line('chin', 'chin', 'chin'), h('div.mark.feet', { style: { top: `${m.feet * 100}%` } }, h('span', 'soles')));
  return layer;
}
function headReadoutEl(e) { return h('div', { id: 'headCheck' }, headReadoutContent(e)); }
function updateHeadReadout(e) { const el = $('#headCheck'); if (el) el.replaceChildren(headReadoutContent(e)); }
function headReadoutContent(e) {
  const c = headCheck(e); if (!c) return h('span');
  const st = e.stature || {};
  if (st.kind === 'giant') return h('div.art-warn.info', 'A giant: drawn at one fixed size, so there is no head check. Put the soles line on the lowest point it stands on.');
  const what = st.cm ? `${st.cm} cm${st.estimated ? ' (estimated)' : ''}` : 'no height yet';
  const target = c.target ? `the target is ${c.target.toFixed(2)} heads (${what})` : `no target (${what})`;
  if (state.marks.guessed) return h('div.art-warn.info', `Drag the cyan line to the top of the skull and the yellow one to the chin. With tall hair, a hat or anything on the head, put the skull line where the skull would be without it: a little above the headband, below where the hair starts to rise. Guessed now: ${c.heads.toFixed(2)} heads tall; ${target}.`);
  if (c.ok) return h('div.art-warn.good', `✓ ${c.heads.toFixed(2)} heads tall; ${target}. Same head size as Part I Naruto.`);
  return h('div.art-warn.bad', `⚠ ${c.heads.toFixed(2)} heads tall, but ${target}: the head is about ${Math.round(Math.abs(c.target / c.heads - 1) * 100)}% too ${c.off < 0 ? 'big' : 'small'}. Regenerate it (attach Part I Naruto's sprite as the reference), or save it anyway: the game still draws it at the right height.`);
}
async function saveMarks(e) {
  const log = $('#saveLog'); const m = state.marks;
  const r3 = (n) => Math.round(n * 1000) / 1000;
  const r = await post('/api/art/marks', { id: e.id, top: r3(m.top), chin: r3(m.chin) });
  if (!r.ok) { if (log) log.replaceChildren(h('div.art-warn.bad', 'Marks not saved: ' + (r.error || 'the index update failed')), r.log ? h('pre.art-log', r.log) : null); return; }
  await loadIndex();
  if (log) log.replaceChildren(h('div.art-warn.good', `✓ Head marks saved for ${e.file}. The game draws it at ${e.stature?.cm ?? '?'} cm now.`));
  renderList(); renderPreviews(e, state.work.canvas);
}
function snapshot() { const { canvas, ctx } = state.work; state.history.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); if (state.history.length > 8) state.history.shift(); }
function undo(e) { const im = state.history.pop(); if (!im) return; state.work.ctx.putImageData(im, 0, 0); renderWork(e); }

// a key colour's name (the manifest's keyColour) as rgb
const KEY_RGB = { magenta: [255, 0, 255], green: [0, 255, 0], cyan: [0, 255, 255], yellow: [255, 255, 0] };
/**
 * The leftover check: opaque patches coloured like the background. For the game's own file (already
 * keyed) the background is gone, so it looks for the image's key colour only: checking white too
 * flagged white clothing (Naruto's fur collar) as background.
 */
function checkLeftovers() {
  const { canvas, ctx } = state.work; const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const minHole = Math.max(DEFAULTS.minHole, Math.round(DEFAULTS.warnHoleFrac * canvas.width * canvas.height));
  const e = state.entries.find(x => x.key === state.key);
  const bgs = state.bg ? [state.bg] : [KEY_RGB[e?.keyColour] || KEY_RGB.magenta];
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
  const work = h('div.art-work', view, hl, state.marks ? marksLayer(e) : null);
  const flipBtn = btn(w.flip ? 'Flip back' : 'Flip', () => { snapshot(); flipCanvas(); w.flip = !w.flip; renderWork(e); }, 'ghost');
  const wandBtn = btn('🪄 Wand' + (state.wand ? ' on' : ''), () => { state.wand = !state.wand; renderWork(e); }, state.wand ? 'wandon' : 'ghost');
  const rekey = w.source === 'file' && state.bg ? btn('Key again (auto)', () => { snapshot(); const d = w.ctx.getImageData(0, 0, w.canvas.width, w.canvas.height); const r = keyBackground(d.data, w.canvas.width, w.canvas.height, { bg: state.bg, strength: state.strength }); w.ctx.putImageData(d, 0, 0); w.info = r; renderWork(e); }, 'ghost') : null;
  const slider = w.orig ? strengthSlider(e) : null;
  const undoBtn = btn('Undo', () => undo(e), 'ghost'); undoBtn.disabled = !state.history.length;
  // the game's file is 256 / 512 px: too small to re-ingest, so a fix starts from the original or a new picture
  const saveBtn = w.source === 'game'
    ? (state.marks ? btn('📏 Save head marks', () => saveMarks(e), 'primary') : h('span.small.muted', 'To change it, reprocess the original or drop a new picture, then save.'))
    : btn('💾 Save to the game', () => save(e, check), 'primary');
  const size = `${w.canvas.width} × ${w.canvas.height}`;
  const info = w.info.already ? `the game's file (${size}); checked for ${w.info.checkedFor || 'key colour'} leftovers` : `${size} · background ${state.bg ? `rgb(${state.bg.join(', ')})` : '?'} · ${Math.round(w.info.keyed * 100)}% keyed${w.info.holes ? ` · ${w.info.holes} enclosed patch${w.info.holes === 1 ? '' : 'es'} removed` : ''}${w.info.inked ? ` · lines to black (${w.info.inked.toLocaleString('en-US')} px)` : ''}${w.info.outline?.added ? ` · outline ${w.info.outline.measured} → ${w.info.outline.target} px` : w.info.outline?.target ? ` · outline ${w.info.outline.measured} px, already at weight` : ''}`;
  wrap.replaceChildren(...[
    h('div.art-actions', flipBtn, rekey, wandBtn, undoBtn, saveBtn),
    slider,
    h('p.tiny.muted', info),
    w.info?.checker ? h('div.art-warn.bad', 'This picture has a grey checkerboard painted in, not real transparency. In the ChatGPT tab, switch the background to the key colour and generate again.') : null,
    w.canvas.width !== w.canvas.height && w.source === 'file'
      ? h('div.art-warn.info', `Gemini made this ${w.canvas.width} × ${w.canvas.height}, not square. Saving ${e.kind === 'portrait' ? 'crops it to a square around the character' : 'pads it to a square'}, which works, but for the best framing reply in Gemini: “Make it a square 1:1 image, 1024 × 1024.”`)
      : null,
    work,
    state.marks ? headReadoutEl(e) : null,
    setWarnEl(check),
    h('div', { id: 'saveLog' }),
  ].filter(Boolean));   // replaceChildren would print a null as the text "null"
  renderPreviews(e, w.canvas);
}

/**
 * Key strength: every colour tolerance of the keyer at once (100 % = the defaults). Lower keeps
 * more of a character whose colours are close to the background (pink hair on magenta); higher
 * takes more of a background with noise or a soft gradient. Moving it keys again from the
 * original picture (Flip is kept; wand edits start over).
 */
function strengthSlider(e) {
  const MIN = 30, MAX = 200;
  const pct = Math.round(state.strength * 100);
  const clampPct = (v) => Math.max(MIN, Math.min(MAX, Math.round(Number(v))));
  // the slider, − and +, and the number box all set the same value; the key runs again when it settles
  const input = h('input', { type: 'range', min: String(MIN), max: String(MAX), step: '1', value: String(pct), 'aria-label': 'Key strength' });
  const num = h('input.art-num', { type: 'number', min: String(MIN), max: String(MAX), step: '1', value: String(pct), 'aria-label': 'Key strength in percent' });
  const apply = (v) => { const p = clampPct(v); if (!Number.isFinite(p)) return; input.value = num.value = String(p); if (p !== Math.round(state.strength * 100)) rekeyFromOriginal(e, p / 100); };
  input.addEventListener('input', () => { num.value = input.value; });
  input.addEventListener('change', () => apply(input.value));
  num.addEventListener('change', () => apply(num.value));
  num.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') apply(num.value); });
  const minus = btn('−', () => apply(clampPct(num.value) - 1), 'ghost small'); minus.setAttribute('aria-label', 'Key strength down 1');
  const plus = btn('+', () => apply(clampPct(num.value) + 1), 'ghost small'); plus.setAttribute('aria-label', 'Key strength up 1');
  const reset = btn('Reset', () => apply(100), 'ghost small');
  const ink = h('input', { type: 'checkbox', checked: state.inkLines, onchange: (ev) => { state.inkLines = ev.target.checked; rekeyFromOriginal(e, state.strength); } });
  const inkBox = h('label.art-ink', { title: 'Recolour the outlines to near-black when the generator drew them dark red or brown, or tinted them toward the background. Dark fills (shadows) are left alone.' }, ink, ' Black lines');
  const isSprite = String(state.key || '').startsWith('sprite:');
  const outlineBox = isSprite && state.key !== 'sprite:naruto_p1' ? h('label.art-ink', { title: 'Thicken the outer outline to the weight of Part I Naruto for the height of the figure, so every sprite reads the same in battle. The drawing inside is untouched.' }, h('input', { type: 'checkbox', checked: state.matchOutline, onchange: (ev) => { state.matchOutline = ev.target.checked; rekeyFromOriginal(e, state.strength); } }), ' Match outline') : null;
  return h('div.art-strength', h('label', 'Key strength'), input, minus, h('span.art-numwrap', num, h('span', '%')), plus, reset, inkBox, outlineBox,
    h('span.tiny.muted', 'Lower keeps colours close to the background; higher removes more background.'));
}
function rekeyFromOriginal(e, strength) {
  const w = state.work; if (!w?.orig) return;
  state.strength = strength;
  const d = new ImageData(new Uint8ClampedArray(w.orig.data), w.orig.width, w.orig.height);
  const r = keyBackground(d.data, d.width, d.height, { bg: state.bg, strength });
  w.ctx.putImageData(d, 0, 0); w.info = r;
  if (w.flip) flipCanvas();
  state.history = [];
  renderWork(e);
}
function setWarnEl(check) {
  if (!check.patches.length) return h('div.art-warn.good', '✓ No leftover background found. Look at the four backgrounds below to be sure.');
  const big = check.patches[0];
  return h('div.art-warn.bad', `⚠ ${check.patches.length} patch${check.patches.length === 1 ? '' : 'es'} of background colour still opaque (${check.pixels.toLocaleString('en-US')} px; the biggest ${big.size.toLocaleString('en-US')} px at ${big.x0}–${big.x1}, ${big.y0}–${big.y1}), outlined in red. Clothing or eyes in a colour close to the background can trigger this: if it is art, leave it; if it is background, switch the wand on and click it.`);
}
function setWarn(text, cls) { const wrap = $('#workWrap'); if (wrap) wrap.replaceChildren(h('div.art-warn.' + cls, text)); }
function flipCanvas() { const { canvas, ctx } = state.work; const copy = document.createElement('canvas'); copy.width = canvas.width; copy.height = canvas.height; copy.getContext('2d').drawImage(canvas, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(copy, 0, 0); ctx.restore(); }

/** The four backgrounds and the in-game contexts, from the work canvas (or the game's file when there is none). */
function renderPreviews(e, canvas = null) {
  const bgs = $('#bgs'), ctx = $('#ctx'); if (!bgs || !ctx) return;
  const src = canvas ? canvas.toDataURL('image/png') : (isDone(e) ? bestFile(e) + '?t=' + Date.now() : null);
  bgs.replaceChildren(...['black', 'white', 'red', 'checker'].map(k => h('div.bg.' + k, src ? h('img', { src, alt: '' }) : h('span', 'nothing loaded'), h('span', k))));
  if (!src) { ctx.replaceChildren(h('p.small.muted', 'Load a picture (or save one) to see it in the frames of the game.')); state.lastPreview = null; renderSideBySide(e, null); return; }
  const img = new Image(); img.src = src;
  img.onload = () => {
    // The previews read the image through the game's own asset registry, so they are the real tokens.
    showInGame(e, img);
    state.lastPreview = img; renderSideBySide(e, img);
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
/** A canvas drawn at the screen's real resolution (a 1× canvas is stretched by the browser on a sharp screen and looks soft). */
/**
 * A canvas drawn at exactly the size it is shown, in real screen pixels. Drawing at a fixed size and
 * letting the page shrink it to fit (or the screen scale it up) resamples the finished picture, and that
 * is what made the previews soft. Here the drawing is laid out in cssW × cssH units, and the backing
 * store follows the displayed width × devicePixelRatio; it redraws when that changes.
 */
function sharpCanvas(cssW, cssH, cls = 'canvas.art-field') {
  const c = h(cls); c.style.width = '100%'; c.style.maxWidth = cssW + 'px'; c.style.aspectRatio = `${cssW} / ${cssH}`; c.style.height = 'auto';
  const g = c.getContext('2d');
  const out = { c, g, draw: null };
  const fit = () => {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const shown = c.clientWidth || cssW, k = (shown / cssW) * dpr;
    const bw = Math.max(1, Math.round(cssW * k)), bh = Math.max(1, Math.round(cssH * k));
    if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; }
    g.setTransform(k, 0, 0, k, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    if (out.draw) out.draw();
  };
  out.onDraw = (fn) => { out.draw = fn; fit(); };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => fit()).observe(c);
  return out;
}
function spriteContexts(e, img) {
  const def = e.def || { id: e.id, name: e.name, tier: 'genin' }; const look = lookFor(def, C); const enemy = !!def.side;
  // the sprite at its canon height (from the marks being set, else the saved ones), beside Part I Naruto, the reference
  const st = e.stature || {};
  const stature = st.kind === 'giant' ? GIANT_SCALE : (st.cm || REF_CM) / REF_CM;
  const fig = (state.marks && state.work && img.width === state.work.canvas.width) ? state.marks : (state.figures[e.file] || null);
  const REF = 'assets/sprites/naruto_p1.webp';
  const refPath = Assets.spritePath('naruto', 'p1');           // the hd copy in the studio when there is one
  const refFig = state.figures[REF] || null;
  const isRef = e.file === REF;
  const nar = C.char.naruto, narLook = lookFor(nar, C);
  const size = st.kind === 'giant' ? 'giant size' : `${st.cm ?? '?'} cm`;

  // 2. The battlefield at the game's size, drawn at the screen's resolution.
  const W = 760, H = 330, y = 290;
  const field = sharpCanvas(W, H);
  const drawField = () => {
    const g = field.g;
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, e.era === 'p1' ? '#7fb2e5' : '#1b2230'); sky.addColorStop(1, e.era === 'p1' ? '#c9e3f6' : '#2a3140'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = e.era === 'p1' ? '#6f9a4a' : '#3a3f4a'; g.fillRect(0, y, W, H - y); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, y, W, 3);
    const ref = refPath ? Assets.image(refPath) : null;
    if (!isRef) drawFigure(g, narLook, { x: 100, y, facing: 1, scale: 1, stature: 1, t: 0, sprite: ref, fig: refFig, expression: 'set' });
    drawFigure(g, look, { x: 260, y, facing: 1, scale: 1, stature, t: 0, sprite: img, fig, expression: 'set' });
    drawFigure(g, look, { x: 420, y, facing: 1, scale: 1, stature, t: 0, sprite: null, expression: 'set' });
    drawFigure(g, look, { x: 620, y, facing: -1, scale: 1, stature, t: 0, sprite: img, fig, expression: 'menace' });
    g.fillStyle = 'rgba(0,0,0,0.65)'; g.font = '12px system-ui, sans-serif'; g.textAlign = 'center';
    for (const [x, t] of [[100, isRef ? '' : `Part I Naruto (${Math.round(REF_CM)} cm)`], [260, `this sprite (${size})`], [420, 'code figure'], [620, enemy ? 'enemy side' : 'mirrored (enemy side)']]) if (t) g.fillText(t, x, y + 24);
  };
  const drawAll = () => { drawField(); };
  field.onDraw(drawAll);
  if (refPath && !Assets.image(refPath)) Assets.onLoad(refPath, () => { if (field.c.isConnected) drawAll(); });

  const token = h('div.ctx', h('div.tiny', 'The battlefield, at the game\'s size and canon heights'), field.c);
  const note = h('p.small.muted', 'The game stands the soles on the ground and scales soles-to-skull to the canon height, so hair never makes anyone shorter.');
  return [token, note];
}

// The local endpoints answer JSON; anything else (a 404 page) means an older server started before the studio existed.
async function post(url, body) {
  let r; try { r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); } catch (err) { return { ok: false, error: 'No answer from the local server. Is it running (npm run serve)?' }; }
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { ok: false, error: r.status === 404 ? 'This server does not know the art studio: it was started before art.html was added. Stop it and run npm run serve again (or restart the preview in the app), then reload this page.' : `The server answered with something that is not JSON (HTTP ${r.status}).`, log: text.slice(0, 300) }; }
}

// ------------------------------------------------------------------ saving
async function savePrompt(e, prompt, noteEl) {
  noteEl.textContent = 'saving…';
  // base: the generated prompt this wording was made from, so a later design change shows up as a difference
  const r = await post('/api/art/prompt', { id: e.id, kind: e.kind, tab: state.tab, prompt, base: generatedOf(e) });
  if (!r.ok) { noteEl.textContent = 'could not save: ' + (r.error || r.log || 'is the local server running?'); return; }
  state.overrides = await getJSON('assets/art-overrides.json', state.overrides);
  state.overrides.prompts = state.overrides.prompts || {}; state.overrides.base = state.overrides.base || {};
  state.manifest = await getJSON('assets/manifest.json', state.manifest);
  const fresh = (e.kind === 'portrait' ? state.manifest.portraits : state.manifest.sprites).find(x => x.id === e.id);
  if (fresh) { e.prompt = fresh.prompt; e.prompts = fresh.prompts; e.refs = fresh.refs; e.keyColour = fresh.keyColour; e.promptOverride = fresh.promptOverride; }
  // redraw just the prompt card (the picture being worked on stays)
  const card = $('#promptCard'); if (card) card.replaceWith(promptCard(e));
  renderSideBySide(e, state.lastPreview || null);
  const n2 = $('#promptCard .art-actions span.small.muted');
  if (n2) n2.textContent = prompt ? 'saved: your wording for this tab' : 'back to the generated prompt';
  renderList();
}
/**
 * The ingest takes square pictures only, and Gemini sometimes answers wide (1024 × 559). A portrait
 * is cropped to a square around the character (same height, so the head keeps its share and the
 * chest still reaches the bottom; a tall one keeps its top); a sprite is padded to a square with the
 * feet on the bottom edge (the ingest crops to the figure anyway). mapY moves a head mark (a fraction
 * of the old height) into the square.
 */
function squared(e, c) {
  const W = c.width, H = c.height;
  if (W === H) return { canvas: c, mapY: (y) => y };
  const out = document.createElement('canvas');
  if (e.kind === 'portrait') {
    const side = Math.min(W, H); out.width = out.height = side;
    const b = bounds(c.getContext('2d').getImageData(0, 0, W, H).data, W, H);
    const cx = b ? (b.x0 + b.x1) / 2 : W / 2;
    const sx = W > H ? Math.round(Math.max(0, Math.min(W - side, cx - side / 2))) : 0;
    out.getContext('2d').drawImage(c, sx, 0, side, side, 0, 0, side, side);
    return { canvas: out, mapY: (y) => (y * H) / side };
  }
  const side = Math.max(W, H); out.width = out.height = side;
  out.getContext('2d').drawImage(c, Math.round((side - W) / 2), side - H);
  return { canvas: out, mapY: (y) => (y * H + (side - H)) / side };
}
async function save(e, check) {
  const log = $('#saveLog'); if (log) log.replaceChildren(h('p.small.muted', 'Saving and ingesting…'));
  const sq = squared(e, state.work.canvas);
  const png = sq.canvas.toDataURL('image/png');
  const head = state.marks && !state.marks.guessed ? [state.marks.top, state.marks.chin].map(n => Math.round(sq.mapY(n) * 10000) / 10000) : null;
  const r = await post('/api/art/save', { id: e.id, kind: e.kind, incoming: e.incoming, flip: false, leftover: check.pixels, png, head });
  if (!r.ok) { if (log) log.replaceChildren(h('div.art-warn.bad', 'Not saved: ' + (r.error || 'the ingest failed')), r.log ? h('pre.art-log', r.log) : null); return; }
  await loadIndex(); for (const f of [e.file, Assets.hdOf(e.file)]) Assets._registry.images.delete(f);
  state.overrides.status[e.key] = { savedAt: new Date().toISOString(), leftover: check.pixels };
  state.originals = (await getJSON('/api/art/originals', { files: {} })).files || {};
  state.animeRefs = (await getJSON('/api/art/references', { files: {} })).files || {};
  if (log) log.replaceChildren(h('div.art-warn.good', `✓ Saved: ${r.file}. The previews now show the file the game will load.`), h('pre.art-log', r.log));
  renderList();
  // show the ingested file (the truth) in the previews, keeping the work canvas for further edits
  const img = await loadImage(bestFile(e) + '?t=' + Date.now()).catch(() => null);
  if (img) { showInGame(e, img); renderPreviews(e, null); }
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

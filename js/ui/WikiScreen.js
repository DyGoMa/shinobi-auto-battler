// WikiScreen.js — the in-game Wiki: search, hand-written guides (wiki/guides/*.md,
// rendered from markdown) and reference pages generated from the same content and
// balance data the game loads. Page ids: see js/wiki/WikiData.js.
import { h, btn, fmt, avatar, natureChip, natureChips, stars, roleTag, tierTag, describeMechanic, objectiveText, episodesLabel, countWord } from './dom.js';
import { enemyToken } from './StoryMapScreen.js';
import { tipCard } from './tips.js';
import { helpButton } from './chrome.js';
import { buildWikiIndex, GUIDES, REFERENCE, parentOf, jutsuCatalog, enemyAppearances, obtainInfo, searchWiki, WIKI_ACTIONS, guideSources } from '../wiki/WikiData.js';
import { fillPlaceholders, parseMarkdown, slugify } from '../wiki/markdown.js';
import { ultEffectText, enemyJutsuText, ROLE_TEXT, RANGE_TEXT } from '../wiki/text.js';
import { characterStats, powerRating, leaderBuffText } from '../core/Ninja.js';
import { TIERS, TIER_LABEL, RARITY_LABEL, beatsNature, beatenBy, natureRelation, nodeRewards, arcClearRewards, bossRushRewards } from '../core/formulas.js';
import { bossRushRound, nodeEnemyLevel } from '../core/Progression.js';
import { ACHIEVEMENT_CATEGORIES } from '../content/achievements.js';
import { achievementProgress, achievementConfig, achievementText, isUnlocked, isClaimed } from '../core/Achievements.js';
import { rewardChips } from './AchievementsScreen.js';

let INDEX = null;
let JUTSU = null;
let APPEAR = null;
const guides = new Map();   // slug -> { status: 'loading' | 'ok' | 'error', text }
let query = '';
let charFilter = { tier: 'All', role: 'All', nature: 'All' };
let jutsuFilter = 'All';
let wheelSel = null;

const TITLE_OF = { home: 'Home', story: 'Story', team: 'Team', roster: 'Roster', summon: 'Summon', rush: 'Boss Rush', settings: 'Settings', tutorial: 'Tutorial', achievements: 'Achievements', daily: 'Daily challenge' };

function ensureIndex(game) {
  if (!INDEX) {
    INDEX = buildWikiIndex(game.C, game.B);
    JUTSU = new Map(jutsuCatalog(game.C).map(j => [j.slug, j]));
    APPEAR = enemyAppearances(game.C);
  }
  return INDEX;
}

export function wikiTitle(game, id) { return ensureIndex(game).byId.get(id)?.title || 'Wiki'; }

export function render(game, ui, params) {
  const index = ensureIndex(game);
  const id = index.byId.has(params.page) ? params.page : 'home';
  const page = index.byId.get(id);
  const from = params.from || null;
  const go = (pid, extra = {}) => ui.openWiki(pid, { from, ...extra });

  // Breadcrumbs: Wiki › Section › Page
  const trail = [];
  for (let p = id; p; p = parentOf(p)) trail.unshift(p);
  const ancestors = trail.slice(0, -1);
  const crumbs = ancestors.length < 2 ? null : h('nav.crumbs', { 'aria-label': 'Breadcrumbs' }, ...ancestors.flatMap((p, i) => {
    const t = index.byId.get(p)?.title || 'Wiki';
    return [i ? h('span.sep', { 'aria-hidden': 'true' }, '›') : null, h('a', { href: `#wiki/${p}`, onclick: (e) => { e.preventDefault(); go(p); } }, t)];
  }));

  const head = h('div.screen-head',
    from ? btn(`‹ ${TITLE_OF[from.id] || 'Back'}`, () => ui.go(from.id, from.params || {}), 'ghost small back-btn', { 'aria-label': `Back to ${TITLE_OF[from.id] || 'the previous screen'}` })
      : id !== 'home' ? btn(`‹ ${index.byId.get(parentOf(id))?.title || 'Wiki'}`, () => go(parentOf(id)), 'ghost small back-btn', { 'aria-label': `Back to ${index.byId.get(parentOf(id))?.title || 'the Wiki'}` }) : null,
    h('h1', id === 'home' ? 'Wiki' : page.title),
    h('div.grow'),
    id === 'home' ? null : h('button.icon-btn', { type: 'button', 'aria-label': 'Search the Wiki', title: 'Search the Wiki', onclick: () => go('home') }, '🔎'),
    id === 'guide/how-to-play' ? null : helpButton(ui, 'guide/how-to-play'));

  let body;
  try { body = renderPage(game, ui, id, go, params); }
  catch (e) { console.error(e); body = h('div.card', h('p', 'This page could not be shown.'), btn('Wiki home', () => go('home'), 'primary')); }
  const el = h('div.screen.wiki', head, crumbs, id === 'home' ? tipCard(game, 'wiki') : null, body);
  if (params.anchor) setTimeout(() => el.querySelector(`#${CSS.escape(params.anchor)}`)?.scrollIntoView({ block: 'start' }), 60);
  return el;
}

function renderPage(game, ui, id, go, params) {
  const [kind, key] = id.includes('/') ? [id.slice(0, id.indexOf('/')), id.slice(id.indexOf('/') + 1)] : [id, null];
  switch (kind) {
    case 'home': return homePage(game, ui, go);
    case 'guide': return guidePage(game, ui, key, go);
    case 'characters': return charactersPage(game, ui, go);
    case 'character': return characterPage(game, ui, game.C.char[key], go);
    case 'jutsu': return key ? jutsuPage(game, JUTSU.get(key), go) : jutsuListPage(game, ui, go);
    case 'nature-wheel': return naturePage(game, ui, go);
    case 'enemies': return enemiesPage(game, go);
    case 'enemy': return enemyPage(game, game.C.enemy[key], go);
    case 'arcs': return arcsPage(game, go);
    case 'arc': return arcPage(game, ui, key === game.C.tutorial?.id ? game.C.tutorial : game.C.arc[key], go);
    case 'banners': return bannersPage(game, go);
    case 'banner': return bannerPage(game, game.C.banner[key], go);
    case 'boss-rush': return bossRushPage(game, go);
    case 'achievements': return achievementsPage(game, ui, go);
    case 'achievement': return achievementPage(game, ui, game.C.achievement[key], go);
    default: return h('div.card', h('p', 'Page not found.'));
  }
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
const link = (go, pid, text) => h('a.wlink', { href: `#wiki/${pid}`, onclick: (e) => { e.preventDefault(); go(pid); } }, text);
const section = (title, ...kids) => h('section.wsec', h('h2', title), ...kids);
const facts = (...pairs) => h('dl.kv', ...pairs.filter(Boolean).flatMap(([k, v]) => [h('dt', k), h('dd', v)]));
const chips = (list) => list?.length ? list.map(n => natureChip(n)) : [h('span.nat.none', 'No nature')];
const rowCard = (onclick, ...kids) => h('button.wrow', { type: 'button', onclick }, ...kids);
const arcName = (game, arcId) => arcId === game.C.tutorial?.id ? game.C.tutorial.name : game.C.arc[arcId]?.name || arcId;

// ---------------------------------------------------------------------------
// Home + search
// ---------------------------------------------------------------------------
function homePage(game, ui, go) {
  const index = ensureIndex(game);
  const results = h('div.wresults');
  const draw = () => {
    const hits = searchWiki(index, query);
    const q = query.trim();
    results.replaceChildren(...(q.length < 2 ? [] : hits.length
      ? [h('div.tiny.muted', `${hits.length} result${hits.length === 1 ? '' : 's'}`), h('div.wlist', ...hits.map(p => rowCard(() => go(p.id), h('div.grow', h('b', p.title), h('div.tiny.muted', p.sub || '')), h('span.muted', '›'))))]
      : [h('p.muted', `Nothing matches “${q}”. Try a ninja, jutsu, enemy or battle name.`)]));
  };
  const input = h('input.wsearch', { type: 'search', placeholder: 'Search ninja, jutsu, enemies, battles…', value: query, 'aria-label': 'Search the Wiki', oninput: (e) => { query = e.target.value; draw(); } });
  draw();
  return h('div',
    input, results,
    h('div.section-title', h('h2', 'Guides')),
    h('div.grid.two', ...GUIDES.map(g => h('button.card.hover.wcard', { type: 'button', onclick: () => go(g.id) }, h('div.wcard-ico', { 'aria-hidden': 'true' }, g.icon), h('div', h('h3', g.title), h('p.small', g.blurb))))),
    h('div.section-title', h('h2', 'Reference')),
    h('div.grid.two', ...[...REFERENCE, ...(index.byId.has('achievements') ? [{ id: 'achievements', title: 'Achievements', icon: '🏆', blurb: 'Every achievement, how to earn it and its reward.' }] : [])]
      .map(r => h('button.card.hover.wcard', { type: 'button', onclick: () => go(r.id) }, h('div.wcard-ico', { 'aria-hidden': 'true' }, r.icon), h('div', h('h3', r.title), h('p.small', r.blurb))))),
    h('div.card', { style: { marginTop: '14px' } },
      h('h3', '🎓 The Academy tutorial'),
      h('p.small', 'Three short lessons: team building, the Nature Wheel, and Ultimates with Jutsu Clash.'),
      btn('Replay the tutorial', () => ui.openTutorial({ replay: true }), 'primary')),
  );
}

// ---------------------------------------------------------------------------
// Guides (markdown)
// ---------------------------------------------------------------------------
function loadGuide(slug, ui) {
  const g = GUIDES.find(x => x.slug === slug);
  if (!g) return { status: 'error' };
  let rec = guides.get(slug);
  if (!rec || rec.status === 'error' && rec.retry) {
    rec = { status: 'loading' };
    guides.set(slug, rec);
    fetch(g.file, { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
      .then(text => { rec.status = 'ok'; rec.text = text; })
      .catch(err => { console.warn('[wiki] guide load failed', err); rec.status = 'error'; })
      .finally(() => { if (ui.current === 'wiki' && ui.params.page === g.id) ui.refresh(); rec.onDone?.(); });
  }
  return rec;
}

/** Guide body for a slug (also used by the in-battle help). */
export function guideBody(game, ui, slug, go = (pid, extra) => ui.openWiki(pid, extra)) {
  const rec = loadGuide(slug, ui);
  if (rec.status === 'loading') return h('div.card.center', h('p', 'Loading the guide…'), h('div.spinner', { 'aria-hidden': 'true' }));
  if (rec.status === 'error') {
    return h('div.card.center', h('p', 'This guide could not be loaded. Check your connection and try again.'),
      btn('↻ Try again', () => { rec.retry = true; guides.delete(slug); loadGuide(slug, ui); ui.refresh(); }, 'primary'));
  }
  const { text } = fillPlaceholders(rec.text, guideSources(game.B, game.C));
  const blocks = parseMarkdown(text);
  // The guide's own # title is the screen title already.
  if (blocks[0]?.t === 'h' && blocks[0].level === 1) blocks.shift();
  return h('article.guide', ...renderBlocks(blocks, game, ui, go));
}

/** Load a guide and call back once (for the battle help modal). */
export function whenGuideReady(slug, ui, cb) {
  const rec = loadGuide(slug, ui);
  if (rec.status !== 'loading') cb(); else rec.onDone = cb;
}

function guidePage(game, ui, slug, go) {
  const i = GUIDES.findIndex(g => g.slug === slug);
  const prev = GUIDES[i - 1], next = GUIDES[i + 1];
  return h('div',
    guideBody(game, ui, slug, go),
    h('div.guide-nav',
      prev ? btn(`‹ ${prev.title}`, () => go(prev.id), 'ghost') : h('span'),
      next ? btn(`${next.title} ›`, () => go(next.id), 'ghost') : h('span')));
}

function renderInline(nodes, game, ui, go) {
  return nodes.map(n => {
    switch (n.t) {
      case 'text': return n.v;
      case 'code': return h('code', n.v);
      case 'b': return h('b', ...renderInline(n.c, game, ui, go));
      case 'i': return h('i', ...renderInline(n.c, game, ui, go));
      case 'a': {
        const kids = renderInline(n.c, game, ui, go);
        if (n.href.startsWith('wiki:')) {
          const [pid, anchor] = n.href.slice(5).split('#');
          return h('a.wlink', { href: `#wiki/${pid}`, onclick: (e) => { e.preventDefault(); go(pid, anchor ? { anchor } : {}); } }, ...kids);
        }
        if (n.href.startsWith('action:')) {
          const act = n.href.slice(7);
          return h('button.btn.small.inline-btn', { type: 'button', onclick: () => { if (act === 'replay-tutorial' && WIKI_ACTIONS.includes(act)) ui.openTutorial({ replay: true }); } }, ...kids);
        }
        return h('a', { href: n.href, target: '_blank', rel: 'noopener noreferrer' }, ...kids);
      }
      default: return '';
    }
  });
}

function renderBlocks(blocks, game, ui, go) {
  return blocks.map(b => {
    const inl = (c) => renderInline(c, game, ui, go);
    switch (b.t) {
      case 'h': return h(`h${Math.min(3, b.level + 1)}`, { id: b.id }, ...inl(b.c));
      case 'p': return h('p', ...inl(b.c));
      case 'hr': return h('hr');
      case 'quote': return h('div.callout', ...renderBlocks(b.c, game, ui, go));
      case 'ul': case 'ol': return h(b.t, ...b.items.map(it => h('li', ...inl(it.c), it.sub.length ? h('ul', ...it.sub.map(s => h('li', ...inl(s)))) : null)));
      case 'table': return h('div.table-wrap', h('table.wtable', b.head ? h('thead', h('tr', ...b.head.map(c => h('th', ...inl(c))))) : null, h('tbody', ...b.rows.map(r => h('tr', ...r.map(c => h('td', ...inl(c))))))));
      default: return null;
    }
  });
}

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------
function charactersPage(game, ui, go) {
  const { C, state } = game;
  const f = charFilter;
  const chipRow = (key, values, label = (v) => v) => h('div.filters', { role: 'group', 'aria-label': key },
    ...values.map(v => h('button.chip' + (f[key] === v ? '.on' : ''), { type: 'button', 'aria-pressed': String(f[key] === v), onclick: () => { f[key] = v; ui.refresh(); } }, label(v))));
  const list = C.roster
    .filter(d => (f.tier === 'All' || d.tier === f.tier) && (f.role === 'All' || d.role === f.role) && (f.nature === 'All' || (f.nature === 'None' ? !d.natures.length : d.natures.includes(f.nature))))
    .sort((a, b) => TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier) || a.name.localeCompare(b.name));
  return h('div',
    h('p', `All ${C.roster.length} ninja and alternate forms. Tap one for stats, natures, jutsu and how to recruit them.`),
    chipRow('tier', ['All', ...TIERS], v => v === 'All' ? 'All tiers' : TIER_LABEL[v]),
    chipRow('role', ['All', 'Tank', 'Striker', 'Ranged', 'Support'], v => v === 'All' ? 'All roles' : v),
    chipRow('nature', ['All', ...game.B.natureWheel.cycle, 'None'], v => v === 'All' ? 'All natures' : v === 'None' ? 'No nature' : v),
    list.length ? h('div.wlist', ...list.map(d => rowCard(() => go(`character/${d.id}`), avatar(d, { size: 'sm' }),
      h('div.grow', h('b', d.name), h('div.row.tight', tierTag(d.tier), roleTag(d.role), ...natureChips(d))),
      state.roster[d.id] ? h('span.pill.good', { title: 'You own this ninja' }, '✓') : null)))
      : h('p.muted', 'No ninja match these filters.'),
  );
}

function characterPage(game, ui, d, go) {
  const { C, B, state } = game;
  if (!d) return h('p', 'Unknown ninja.');
  const lo = characterStats(d, 1, 1, B), hi = characterStats(d, B.stats.levelCap, B.stats.starCap, B);
  const ob = obtainInfo(d, C);
  const baseId = d.formOf || d.id;
  const family = C.roster.filter(c => c.id === baseId || c.formOf === baseId);
  const first = d.taijutsu ? null : d.natures[0];
  const weakTo = first ? beatenBy(first, B) : null;
  const strong = d.taijutsu ? [] : [...new Set(d.natures.map(n => beatsNature(n, B)))];
  const how = [];
  if (ob.starter) how.push('Starter: you have them from the beginning.');
  if (ob.achievement) how.push(h('span', '🏆 Achievement reward only: never in any banner. Earn it with ', link(go, `achievement/${ob.achievement}`, `“${C.achievement[ob.achievement].name}”`), `: ${C.achievement[ob.achievement].description}`));
  if (ob.pullable && !ob.starter) how.push(ob.unlockArc ? `Joins the summon pools after you ${ob.unlockKind === 'cleared' ? 'clear' : 'reach'} ${arcName(game, ob.unlockArc)}.` : 'In the summon pools from the start.');
  if (ob.pullable && ob.starter) how.push('Duplicates can also be summoned for stars.');
  const own = state.roster[d.id];
  return h('div',
    h('div.card.whero',
      avatar(d, { size: 'lg' }),
      h('div.col', { style: { gap: '6px' } },
        h('div.row.tight', tierTag(d.tier), roleTag(d.role)),
        h('div.row.tight', ...natureChips(d), ob.achievement ? h('span.pill.accent', '🏆 Exclusive') : null),
        own ? h('div.small', 'You own this ninja: Lv ', h('b', own.level), ' ', stars(own.stars)) : h('div.small.muted', 'Not recruited yet.'))),
    section('How to get',
      h('ul', ...how.map(x => h('li', x))),
      ob.banners.length ? h('p.small', 'Featured on: ', ...ob.banners.flatMap((b, i) => [i ? ', ' : '', link(go, `banner/${b}`, C.banner[b].name)])) : null),
    section('Role and range',
      h('p', ROLE_TEXT[d.role]),
      facts(['Range', RANGE_TEXT[d.range || B.stats.roles[d.role].range]], ['Attack every', `${lo.attackInterval.toFixed(2)} s`], ['Crit chance', `${Math.round(lo.critChance * 100)}%`])),
    section('Stats',
      h('div.table-wrap', h('table.wtable',
        h('thead', h('tr', h('th', ''), h('th', 'Lv 1 · 1★'), h('th', `Lv ${B.stats.levelCap} · ${B.stats.starCap}★`))),
        h('tbody', ...[['HP', 'maxHp'], ['ATK', 'atk'], ['DEF', 'def']].map(([k, f]) => h('tr', h('td', k), h('td', fmt(lo[f])), h('td', fmt(hi[f])))),
          h('tr', h('td', 'Power'), h('td', fmt(powerRating(lo))), h('td', fmt(powerRating(hi)))))))),
    section('Ultimate',
      h('p', link(go, `jutsu/${slugify(d.ult.name)}`, d.ult.name), d.ult.nature ? h('span', ' ', natureChip(d.ult.nature)) : null),
      h('p.small', ultEffectText(d.ult, B))),
    section('Leader buff', h('p', leaderBuffText(d, B))),
    section('Natures',
      d.taijutsu ? h('p', `Taijutsu specialist: neutral on the Nature Wheel, never resisted, and ignores ${Math.round(B.combat.taijutsuDefIgnore * 100)}% of enemy DEF. Can never be Overwhelmed in a Jutsu Clash.`)
        : !d.natures.length ? h('p', 'No nature: neutral against everything.')
          : h('div',
            h('p.small', d.natures.length > 1 ? `Attacks with whichever of its natures is best against the target, and defends with its first nature (${first}).` : `Attacks and defends with ${first} Style.`),
            facts(['Strong against', h('span.row.tight', ...strong.map(n => natureChip(n)))], ['Weak to', natureChip(weakTo)])),
      h('p.small', link(go, 'nature-wheel', 'Open the Nature Wheel chart ›'))),
    family.length > 1 ? section('Forms',
      h('p.small', 'Alternate forms level separately, and only one of them can be in a team.'),
      h('div.wlist', ...family.map(f => rowCard(() => go(`character/${f.id}`), avatar(f, { size: 'sm' }), h('div.grow', h('b', f.name), h('div.row.tight', tierTag(f.tier), roleTag(f.role))), f.id === d.id ? h('span.pill', 'this page') : h('span.muted', '›'))))) : null,
  );
}

// ---------------------------------------------------------------------------
// Jutsu
// ---------------------------------------------------------------------------
const USE_LABEL = { ult: 'Ultimate', jutsu: 'Enemy jutsu', mechanic: 'Boss technique' };
function jutsuListPage(game, ui, go) {
  const all = [...JUTSU.values()];
  const kinds = ['All', 'ult', 'jutsu', 'mechanic'];
  const list = all.filter(j => jutsuFilter === 'All' || j.uses.some(u => u.kind === jutsuFilter));
  return h('div',
    h('p', `${all.length} jutsu: every Ultimate, every telegraphed enemy jutsu and every named boss technique.`),
    h('div.filters', { role: 'group', 'aria-label': 'Jutsu type' }, ...kinds.map(k => h('button.chip' + (jutsuFilter === k ? '.on' : ''), { type: 'button', 'aria-pressed': String(jutsuFilter === k), onclick: () => { jutsuFilter = k; ui.refresh(); } }, k === 'All' ? 'All' : USE_LABEL[k] + 's'))),
    h('div.wlist', ...list.map(j => {
      const nat = j.uses.map(u => u.nature ?? u.mechanic?.nature).find(Boolean);
      return rowCard(() => go(`jutsu/${j.slug}`), h('div.grow', h('b', j.name), h('div.tiny.muted', [...new Set(j.uses.map(u => USE_LABEL[u.kind]))].join(' · '))), nat ? natureChip(nat) : null, h('span.muted', '›'));
    })));
}

function jutsuPage(game, j, go) {
  const { C, B } = game;
  if (!j) return h('p', 'Unknown jutsu.');
  return h('div',
    ...j.uses.map(u => {
      const who = u.owner === 'character' ? C.char[u.id] : C.enemy[u.id];
      const whoLink = link(go, `${u.owner === 'character' ? 'character' : 'enemy'}/${u.id}`, who.name);
      let what;
      if (u.kind === 'ult') what = [h('p.small', ultEffectText({ type: u.type, stun: u.stun }, B)), h('p.small.muted', 'Fire it into an enemy wind-up to Jutsu Clash.')];
      else if (u.kind === 'jutsu') what = [h('p.small', enemyJutsuText({ type: u.type }, B))];
      else what = [h('p.small', describeMechanic(u.mechanic) || 'A passive boss technique.')];
      const nature = u.kind === 'mechanic' ? (u.mechanic.nature !== undefined ? u.mechanic.nature : null) : u.nature;
      return h('div.card.wuse',
        h('div.row.tight', h('span.pill', USE_LABEL[u.kind]), nature ? natureChip(nature) : h('span.nat.none', 'No nature'), u.stun || u.mechanic?.stun ? h('span.pill.warn', 'Stuns') : null),
        h('p', { style: { marginTop: '8px' } }, u.owner === 'character' ? 'Used by ' : 'Enemy: ', whoLink),
        ...what);
    }));
}

// ---------------------------------------------------------------------------
// Nature Wheel (interactive chart)
// ---------------------------------------------------------------------------
function naturePage(game, ui, go) {
  const { B } = game;
  const cyc = B.natureWheel.cycle;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-120 -120 240 240'); svg.setAttribute('class', 'wheel-svg'); svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Nature Wheel: ${cyc.join(' beats ')} beats ${cyc[0]}`);
  const pos = cyc.map((_, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / cyc.length; return [Math.cos(a) * 82, Math.sin(a) * 82]; });
  const el = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
  const defs = el('defs', {});
  for (const [id, col] of [['arrow', '#7c8ea3'], ['arrow-win', '#3ddc84'], ['arrow-lose', '#ff5d5d']]) {
    const m = el('marker', { id: `wm-${id}`, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' });
    m.appendChild(el('path', { d: 'M0,0 L10,5 L0,10 z', fill: col })); defs.appendChild(m);
  }
  svg.appendChild(defs);
  cyc.forEach((n, i) => {
    const [x1, y1] = pos[i], [x2, y2] = pos[(i + 1) % cyc.length];
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const state = !wheelSel ? '' : n === wheelSel ? 'win' : cyc[(i + 1) % cyc.length] === wheelSel ? 'lose' : 'dim';
    svg.appendChild(el('line', { x1: x1 + ux * 29, y1: y1 + uy * 29, x2: x2 - ux * 31, y2: y2 - uy * 31, class: `wheel-edge ${state}`, 'marker-end': `url(#wm-${state === 'win' ? 'arrow-win' : state === 'lose' ? 'arrow-lose' : 'arrow'})` }));
  });
  const COL = { Fire: '#ff5a36', Wind: '#5fd38a', Lightning: '#ffd43b', Earth: '#c08a52', Water: '#3fa9f5' };
  cyc.forEach((n, i) => {
    const [x, y] = pos[i];
    const g = el('g', { class: 'wheel-node' + (wheelSel === n ? ' on' : '') });
    g.appendChild(el('circle', { cx: x, cy: y, r: 27, fill: COL[n] || '#ccc' }));
    const t = el('text', { x, y: y + 3.5, 'text-anchor': 'middle', class: 'wheel-label', 'font-size': n.length > 6 ? 8.5 : 10 }); t.textContent = n; g.appendChild(t);
    svg.appendChild(g);
  });
  const pick = h('div.filters.center-row', { role: 'group', 'aria-label': 'Pick a nature' },
    ...cyc.map(n => h('button.chip.nat-pick' + (wheelSel === n ? '.on' : ''), { type: 'button', 'aria-pressed': String(wheelSel === n), onclick: () => { wheelSel = wheelSel === n ? null : n; ui.refresh(); } }, natureChip(n))));
  const sel = wheelSel;
  const explain = sel ? h('div.card', h('p', h('b', `${sel} Style`), ` beats ${beatsNature(sel, B)} (×${B.natureWheel.advantage} damage dealt) and is beaten by ${beatenBy(sel, B)} (×${B.natureWheel.disadvantage}).`),
    h('p.small', `Facing ${/^[AEIOU]/.test(sel) ? 'an' : 'a'} ${sel} enemy? Bring ${beatenBy(sel, B)} Style ninja: they deal more damage to it and take less from it.`),
    h('p.small', link(go, 'characters', 'Find ninja by nature ›')))
    : h('p.small.muted.center', 'Tap a nature to see what it beats and what beats it.');
  const cell = (a, d) => { const r = natureRelation(a, d, B); return h('td.' + (r > 0 ? 'win' : r < 0 ? 'lose' : 'even'), r > 0 ? `×${B.natureWheel.advantage}` : r < 0 ? `×${B.natureWheel.disadvantage}` : '×1'); };
  return h('div',
    h('p', `${cyc.join(' › ')} › ${cyc[0]}: each nature beats the next one. Effective hits deal ×${B.natureWheel.advantage}; resisted hits deal ×${B.natureWheel.disadvantage}.`),
    h('div.wheel-wrap', svg), pick, explain,
    section('Damage chart',
      h('p.small', 'Rows attack, columns defend.'),
      h('div.table-wrap', h('table.wtable.matrix', h('thead', h('tr', h('th', 'Attacker'), ...cyc.map(n => h('th', n)))), h('tbody', ...cyc.map(a => h('tr', h('th', a), ...cyc.map(d => cell(a, d)))))))),
    section('Special cases',
      h('ul',
        h('li', 'Ninja with several natures attack with their best one and defend with their first.'),
        h('li', `Taijutsu specialists are never resisted and ignore ${Math.round(B.combat.taijutsuDefIgnore * 100)}% of enemy DEF.`),
        h('li', 'Ninja and enemies with no nature are neutral against everything.'),
        h('li', 'Some bosses switch nature mid-fight: the battle panel shows their current one.')),
      h('p.small', link(go, 'guide/nature-wheel', 'Read the Nature Wheel guide ›'))),
  );
}

// ---------------------------------------------------------------------------
// Enemies
// ---------------------------------------------------------------------------
function enemiesPage(game, go) {
  const { C } = game;
  const groups = [];
  const inNodes = new Set();
  for (const arc of [C.tutorial, ...C.arcs].filter(Boolean)) {
    const ids = [];
    const boss = new Set();
    for (const n of arc.nodes) for (const e of n.enemies) { if (!ids.includes(e.id)) ids.push(e.id); if (e.boss) boss.add(e.id); inNodes.add(e.id); }
    groups.push({ title: arc.name, sub: arc === C.tutorial ? 'Tutorial' : `Part ${arc.part === 1 ? 'I' : 'II'} · ${episodesLabel(arc.episodes)}`, ids, boss });
  }
  groups.push({ title: C.bossRush.name, sub: 'Challenge', ids: [...C.bossRush.order], boss: new Set(C.bossRush.order) });
  C.bossRush.order.forEach(id => inNodes.add(id));
  const extra = C.enemies.filter(e => !inNodes.has(e.id));
  groups.push({ title: 'Summoned reinforcements and escorts', sub: 'Appear during battles', ids: extra.map(e => e.id), boss: new Set() });
  return h('div',
    h('p', 'Every enemy, grouped by where you meet them. Their natures tell you which of your ninja will hit them harder.'),
    ...groups.map(g => h('section.wsec', h('h2', g.title), h('div.tiny.muted', g.sub),
      h('div.wlist', ...g.ids.map(id => { const d = C.enemy[id]; return rowCard(() => go(`enemy/${id}`), enemyToken(d), h('div.grow', h('b', d.name + (g.boss.has(id) ? ' 👑' : '')), h('div.row.tight', ...chips(d.natures))), h('span.muted', '›')); })))),
  );
}

function enemyPage(game, d, go) {
  const { C, B } = game;
  if (!d) return h('p', 'Unknown enemy.');
  const active = d.natures?.[0] || null;
  const counter = active ? beatenBy(active, B) : null;
  const swap = (d.mechanics || []).find(m => m.type === 'elementSwap');
  const answers = active ? C.roster.filter(c => !c.formOf && c.natures.includes(counter) && !c.notPullable).slice(0, 10) : [];
  const apps = APPEAR.get(d.id) || [];
  const appRows = apps.map(a => {
    if (a.where === 'story' || a.where === 'tutorial' || a.where === 'escort') {
      const arc = a.arcId === C.tutorial?.id ? C.tutorial : C.arc[a.arcId];
      const node = arc.nodes.find(n => n.id === a.node);
      return h('li', link(go, `arc/${arc.id}`, arc.name), ` — ${node.name}`, a.boss ? ' (boss)' : '', a.where === 'escort' ? ' (escort)' : '');
    }
    if (a.where === 'rush') return h('li', link(go, 'boss-rush', C.bossRush.name), ` — round ${a.round}`);
    if (a.where === 'summon') return h('li', 'Summoned by ', link(go, `enemy/${a.by}`, C.enemy[a.by].name), ` (${a.name})`);
    return null;
  });
  return h('div',
    h('div.card.whero', enemyToken(d),
      h('div.col', { style: { gap: '6px' } }, h('div.row.tight', roleTag(d.role), ...chips(d.natures)), d.basedOn ? h('div.small', 'Playable version: ', link(go, `character/${d.basedOn}`, C.char[d.basedOn].name)) : null)),
    d.role === 'Civilian' ? section('Escort', h('p', ROLE_TEXT.Civilian), h('p.small', 'If this ninja falls, you lose the battle. Enemies marked "Diver" slip past your line to reach them.'))
      : section('How to counter',
        active ? facts(['Fights with', natureChip(active)], ['Countered by', natureChip(counter)], ['Hits hard against', natureChip(beatsNature(active, B))]) : h('p', 'No nature: every ninja is neutral against it. Bring raw power and good Jutsu Clash timing.'),
        swap ? h('p.small', `Switches nature mid-fight: ${swap.sequence.join(' → ')} Style. Bring more than one counter.`) : null,
        answers.length ? h('p.small', `${counter} Style ninja: `, ...answers.flatMap((c, i) => [i ? ', ' : '', link(go, `character/${c.id}`, c.name)])) : null),
    d.jutsu ? section('Jutsu', h('p', link(go, `jutsu/${slugify(d.jutsu.name)}`, d.jutsu.name), d.jutsu.nature ? h('span', ' ', natureChip(d.jutsu.nature)) : null), h('p.small', enemyJutsuText(d.jutsu, B))) : null,
    (d.mechanics || []).length ? section('Special techniques', h('ul', ...d.mechanics.map(m => h('li', m.name ? link(go, `jutsu/${slugify(m.name)}`, m.name) : h('b', m.type), ' — ', describeMechanic(m))))) : null,
    d.targeting === 'protected' ? section('Behaviour', h('p', 'Diver: slips past your line to go straight for the escort. Keep ranged ninja ready to turn and chase it.'))
      : d.targeting === 'backline' ? section('Behaviour', h('p', 'Sniper: targets your back row first. A Tank\'s taunt pulls it off your healers.')) : null,
    appRows.length ? section('Where you meet it', h('ul', ...appRows)) : null,
  );
}

// ---------------------------------------------------------------------------
// Arcs and battles
// ---------------------------------------------------------------------------
function arcsPage(game, go) {
  const { C } = game;
  const card = (a, sub) => rowCard(() => go(`arc/${a.id}`), h('div.grow', h('b', a.name), h('div.tiny.muted', sub)), h('span.muted', '›'));
  const part = (p) => C.arcs.filter(a => a.part === p);
  const bossOf = (a) => { const n = a.nodes[a.nodes.length - 1]; const b = n.enemies.find(e => e.boss); return b ? C.enemy[b.id].name : ''; };
  return h('div',
    h('p', 'Every arc in anime order. Each arc page lists its battles with objectives, enemies, team rules and rewards.'),
    C.tutorial ? h('section.wsec', h('h2', 'Tutorial'), h('div.wlist', card(C.tutorial, `${episodesLabel(C.tutorial.episodes)} · ${C.tutorial.nodes.length} lessons`))) : null,
    ...[1, 2].map(p => h('section.wsec', h('h2', p === 1 ? 'Part I' : 'Part II (Shippuden)'),
      h('div.wlist', ...part(p).map(a => card(a, `${episodesLabel(a.episodes)} · ${a.nodes.length} battles · boss: ${bossOf(a)}`))))),
  );
}

function teamRules(game, n, go) {
  const { C } = game;
  const t = n.team || {};
  const names = (ids) => ids.flatMap((id, i) => [i ? ', ' : '', link(go, `character/${id}`, C.char[id].name)]);
  const rows = [];
  if (t.forced?.length) rows.push(h('li', '🔒 Must field: ', ...names(t.forced), ' (guests at the battle\'s level if you don\'t own them)'));
  if (t.leader === 'none') rows.push(h('li', '★ No Leader in this battle'));
  else if (t.leader) rows.push(h('li', '★ Fixed Leader: ', link(go, `character/${t.leader}`, C.char[t.leader].name)));
  if (t.banned?.length) rows.push(h('li', '⛔ Sitting out: ', ...names(t.banned)));
  if (t.recommended?.length) rows.push(h('li', '👍 Canon team: ', ...names(t.recommended)));
  return rows.length ? h('ul.small', ...rows) : null;
}

function arcPage(game, ui, arc, go) {
  const { C, B } = game;
  if (!arc) return h('p', 'Unknown arc.');
  const tut = arc === C.tutorial;
  const bonus = tut ? null : arcClearRewards(arc.arcIndex, B);
  return h('div',
    h('p', arc.blurb),
    h('div.row', h('span.pill', episodesLabel(arc.episodes)), arc.banner ? h('span.pill', '🎴 ', link(go, `banner/${arc.banner}`, C.banner[arc.banner].name)) : null,
      bonus ? h('span.pill.accent', `Arc clear bonus 📜 ${fmt(bonus.scrolls)} 🪙 ${fmt(bonus.ryo)}`) : null),
    tut ? h('p.small', 'The tutorial pays one reward when you finish or skip it: ', `📜 ${fmt(B.tutorial.rewards.scrolls)} and 🪙 ${fmt(B.tutorial.rewards.ryo)}.`, ' ', btn('Replay the tutorial', () => ui.openTutorial({ replay: true }), 'small')) : null,
    ...arc.nodes.map((n, i) => {
      const level = nodeEnemyLevel(n, B);
      const first = tut ? null : nodeRewards(n.globalIndex, { firstClear: true, isBossNode: n.isBossNode }, B);
      const replay = tut ? null : nodeRewards(n.globalIndex, { firstClear: false, isBossNode: n.isBossNode }, B);
      const seen = new Set();
      const foes = n.enemies.filter(e => { const k = e.id + (e.boss ? '!' : ''); if (seen.has(k)) return false; seen.add(k); return true; });
      const count = (id) => n.enemies.filter(e => e.id === id).length;
      return h('section.card.wnode', { id: n.id },
        h('div.row.between', h('h3', { style: { margin: 0 } }, `${i + 1}. ${n.isBossNode ? '👑 ' : ''}${n.name}`), h('span.tiny.muted', `${episodesLabel(n.episodes)} · enemy Lv ${level}`)),
        tut ? h('div.tiny.muted', `Lesson: ${n.learn}`) : null,
        h('p.small', n.blurb),
        h('div.row', h('span.pill.warn', '🎯 ' + objectiveText(n.objective, C))),
        h('div.wlist.compact', ...foes.map(e => { const d = C.enemy[e.id]; return rowCard(() => go(`enemy/${e.id}`), enemyToken(d), h('div.grow', h('b', `${d.name}${count(e.id) > 1 ? ` ×${count(e.id)}` : ''}${e.boss ? ' 👑' : ''}`), h('div.row.tight', ...chips(d.natures), e.delay ? h('span.tiny.muted', `arrives at ${e.delay} s`) : null)), h('span.muted', '›')); })),
        teamRules(game, n, go),
        first ? h('div.row.small', h('span.pill.good', `First clear 📜 ${fmt(first.scrolls)} 🪙 ${fmt(first.ryo)}`), h('span.pill', `Replay 📜 ${fmt(replay.scrolls)} 🪙 ${fmt(replay.ryo)}`)) : null,
      );
    }),
  );
}

// ---------------------------------------------------------------------------
// Banners and rates
// ---------------------------------------------------------------------------
function bannersPage(game, go) {
  const { C, B } = game;
  const G = B.gacha;
  return h('div',
    h('p', 'Summon rates are the same on every banner; arc banners give their featured ninja a bigger share of their tier.'),
    ratesTable(game),
    h('p.small', `Every 10× summon has at least one ${TIER_LABEL[G.tenPullGuaranteeTier]} or better. A ${TIER_LABEL[G.pityTier]} is guaranteed within ${G.pity} summons, and that counter is shared by every banner.`),
    h('div.wlist', ...C.banners.map(b => rowCard(() => go(`banner/${b.id}`), h('div.grow', h('b', b.name), h('div.tiny.muted', b.type === 'standard' ? 'Always open' : `Opens when you reach ${C.arc[b.arc].name}`)), h('span.muted', '›')))),
  );
}

function ratesTable(game, banner = null) {
  const { C, B } = game;
  const G = B.gacha;
  const pool = (t) => C.roster.filter(c => c.tier === t && !c.notPullable);
  return h('div.table-wrap', h('table.wtable',
    h('thead', h('tr', h('th', 'Tier'), h('th', 'Rate'), banner ? h('th', 'Featured (each)') : h('th', 'Ninja in tier'))),
    h('tbody', ...TIERS.map(t => {
      const feat = banner ? (banner.featured || []).filter(id => C.char[id]?.tier === t) : [];
      const share = feat.length && pool(t).length > feat.length ? G.rateUpShare : feat.length ? 1 : 0;
      return h('tr', h('td', h('span.tier.' + t, `${TIER_LABEL[t]} (${RARITY_LABEL[t]})`)), h('td', `${(G.rates[t] * 100).toFixed(G.rates[t] < 0.1 ? 1 : 0)}%`),
        banner ? h('td.small', feat.length ? feat.map(id => `${C.char[id].short} ${(G.rates[t] * share / feat.length * 100).toFixed(2)}%`).join(', ') : '—') : h('td', String(pool(t).length)));
    }))));
}

function bannerPage(game, b, go) {
  const { C, B } = game;
  if (!b) return h('p', 'Unknown banner.');
  const E = B.economy;
  return h('div',
    h('p', b.blurb),
    h('div.row', h('span.pill', b.type === 'standard' ? 'Always open' : 'Opens when you reach ', b.type === 'arc' ? link(go, `arc/${b.arc}`, C.arc[b.arc].name) : null),
      h('span.pill', `📜 ${fmt(E.pullCost.single)} per summon · ${fmt(E.pullCost.ten)} for 10`)),
    (b.featured || []).length ? section('Featured ninja',
      h('p.small', `Featured ninja share ${Math.round(B.gacha.rateUpShare * 100)}% of their tier's rate, once they have joined the pools.`),
      h('div.wlist', ...b.featured.map(id => { const d = C.char[id]; const ob = obtainInfo(d, C); return rowCard(() => go(`character/${id}`), avatar(d, { size: 'sm' }), h('div.grow', h('b', d.name), h('div.tiny.muted', ob.unlockArc ? `Joins after you ${ob.unlockKind === 'cleared' ? 'clear' : 'reach'} ${arcName(game, ob.unlockArc)}` : 'Available from the start')), tierTag(d.tier)); }))) : null,
    section('Rates', ratesTable(game, b.type === 'arc' ? b : null)),
  );
}

// ---------------------------------------------------------------------------
// Boss Rush
// ---------------------------------------------------------------------------
function bossRushPage(game, go) {
  const { C, B } = game;
  const R = C.bossRush;
  return h('div',
    h('p', `The ${countWord(R.order.length)} Akatsuki back to back. HP and chakra carry over between rounds and nobody heals. After round ${R.order.length} the rotation loops, and every loop multiplies the bosses' stats by ×${B.bossRush.loopMult}.`),
    h('p.small', 'Unlocks after you clear ', link(go, `arc/${R.unlockArc}`, C.arc[R.unlockArc].name), '.'),
    h('div.wlist', ...R.order.map((id, i) => {
      const d = C.enemy[id]; const r = bossRushRound(i + 1, C, B); const rw = bossRushRewards(i + 1, B);
      const special = (d.mechanics || []).find(m => m.type === 'telegraphAoE');
      return rowCard(() => go(`enemy/${id}`), enemyToken(d),
        h('div.grow', h('b', `Round ${i + 1}: ${d.name}`), h('div.row.tight', ...chips(d.natures), h('span.tiny.muted', `Lv ${r.level}`)),
          special ? h('div.tiny.muted', `Special: ${special.name}${special.nature ? ` (${special.nature} Style)` : ''}`) : null,
          h('div.tiny', `Reward 📜 ${fmt(rw.scrolls)} 🪙 ${fmt(rw.ryo)}`)), h('span.muted', '›'));
    })),
  );
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------
const ACH_HOW = {
  tutorial: 'Win all three lessons. You can replay the tutorial from the Wiki home or Settings.',
  partClear: 'Clear every battle of the part on the Story map.',
  hardClears: 'Hard mode opens for each part once you clear it.',
  hardPartClear: 'Hard mode opens for each part once you clear it; clear every battle again on Hard.',
  ownCount: 'Summon new ninja: first clears pay the scrolls, and villains join the pools as you clear their arcs.',
  natures: 'Summon until you have a ninja whose main (first) nature is each of the five.',
  forms: 'Alternate forms join the pools as the story goes on. Their arc banners feature them.',
  levelMax: 'Level one ninja all the way on the Roster.',
  stat: 'Counts battles from now on.',
  rushRound: 'The Boss Rush opens on Home once you clear the Sasuke Retrieval Squad.',
  summons: 'Open the Summon screen.',
  googleLinked: 'Open Settings and link a Google account.',
  dailies: 'A new Daily challenge appears on Home every day.',
};

function achievementsPage(game, ui, go) {
  const { C, B, state } = game;
  return h('div',
    h('p', `${C.achievements.length} achievements. They unlock by themselves as you play, including for things you did before they existed, and you claim their rewards on the Achievements screen.`),
    btn('🏆 Open the Achievements screen', () => ui.go('achievements'), 'primary'),
    ...ACHIEVEMENT_CATEGORIES.map(cat => h('section.wsec', h('h2', `${cat.icon} ${cat.name}`),
      h('div.wlist', ...C.achievements.filter(a => a.category === cat.id).map(a => rowCard(() => go(`achievement/${a.id}`),
        h('div.grow', h('b', (isClaimed(state, a.id) ? '✓ ' : isUnlocked(state, a.id) ? '🏆 ' : '') + a.name), h('div.tiny.muted', achievementText(a, B))),
        h('span.muted', '›')))))),
  );
}

function achievementPage(game, ui, a, go) {
  const { C, B, state } = game;
  if (!a) return h('p', 'Unknown achievement.');
  const p = achievementProgress(a, state, C, B);
  const reward = achievementConfig(a, B).reward;
  const how = a.type === 'stat' ? ({ flawlessWins: 'Any story or Hard mode battle counts, as long as every ninja who started it is still standing.', counteredWins: 'The nature matchup on the Team screen must say Poor or Bad when the battle starts.', clashWins: 'Fire an Ultimate into an enemy ⚠ wind-up with a ninja whose nature beats the jutsu.', underdogBossWins: "Compare your team's average level with the boss's level on the Story map.", daysPlayed: 'Open the game on different days.' })[a.stat] : ACH_HOW[a.type];
  return h('div',
    h('div.row', h('span.pill', ACHIEVEMENT_CATEGORIES.find(c => c.id === a.category)?.name || a.category),
      isClaimed(state, a.id) ? h('span.pill.good', '✓ Claimed') : isUnlocked(state, a.id) ? h('span.pill.accent', '🏆 Unlocked: claim it on the Achievements screen') : null),
    section('Goal', h('p', achievementText(a, B))),
    section('Reward', h('div.row.tight', ...rewardChips(reward, a, C)),
      a.rewardCharacter ? h('p.small', link(go, `character/${a.rewardCharacter}`, C.char[a.rewardCharacter].name), ' is exclusive to this achievement: it never appears in any banner.') : null,
      reward?.tickets ? h('p.small.muted', 'A summon ticket is one free summon on any open banner.') : null,
      reward?.rareTickets ? h('p.small.muted', `A Rare+ summon ticket is one summon that is guaranteed to be ${TIER_LABEL[B.achievements.rareTicketMinTier]} or better.`) : null),
    section('Your progress',
      h('div.bar', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(p.target), 'aria-valuenow': String(p.value) }, h('i', { style: { width: `${(p.value / p.target) * 100}%` } })),
      h('p.small', `${fmt(p.value)} / ${fmt(p.target)}`)),
    how ? section('How to get it', h('p', how)) : null,
    h('p.small', link(go, 'guide/achievements', 'Read the Achievements guide ›')),
  );
}

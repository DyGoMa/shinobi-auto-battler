// WikiData.js — the in-game Wiki's page index. Pure (no DOM): every generated page
// comes from the same content and balance data the game loads, so the Wiki can't go
// stale. tools/validate.mjs checks that every character, jutsu, enemy, arc, banner and
// achievement has a page, and that every guide link resolves (tools/wiki-check.mjs).
//
// Page ids:  home · guide/<slug> · characters · character/<id> · jutsu · jutsu/<slug>
//            nature-wheel · enemies · enemy/<id> · arcs · arc/<id> · banners · banner/<id>
//            boss-rush · achievements · achievement/<id>
import { slugify } from './markdown.js';
import { TIER_LABEL } from '../core/formulas.js';
import { GAME_VERSION } from '../config/version.js';

/** What the guides' {{fmt:path}} placeholders can read: balance.js, the version, and
 *  arc names (for {{arc:…}}, which shows an arc id from balance.js by name). */
export function guideSources(B, C = null) {
  return { balance: B, version: { current: GAME_VERSION }, rush: { unlockArc: C?.bossRush?.unlockArc, count: C?.bossRush?.order?.length }, arcNames: C ? Object.fromEntries(C.arcs.map(a => [a.id, a.name])) : {} };
}

/** Hand-written guides: wiki/guides/<slug>.md (markdown, rendered in game). */
export const GUIDES = [
  { slug: 'how-to-play', title: 'How to play', icon: '🍥', blurb: 'Battles, screens and rewards: everything for your first hour.' },
  { slug: 'team-composition', title: 'Team composition', icon: '👥', blurb: 'Roles, the Leader slot, and sample teams for common boss types.' },
  { slug: 'nature-wheel', title: 'Nature Wheel and counters', icon: '🔥', blurb: 'How natures beat each other, and how to bring the right counter.' },
  { slug: 'jutsu-clash', title: 'Jutsu Clash explained', icon: '⚡', blurb: 'Meet an enemy jutsu head-on: Overpower, Standoff and Overwhelmed.' },
  { slug: 'summoning', title: 'Summoning and pity', icon: '📜', blurb: 'Rates, banners, the Kage guarantee and duplicates.' },
  { slug: 'levelling', title: 'Levelling and economy', icon: '🪙', blurb: 'Where Ryo and scrolls come from, and how to spend them.' },
  { slug: 'endgame', title: 'Hard mode and Daily challenge', icon: '💀', blurb: 'What to do once a part is cleared: Hard mode, the Daily challenge and the Boss Rush.' },
  { slug: 'achievements', title: 'Achievements', icon: '🏆', blurb: 'Goals across the whole game, their rewards, and an exclusive Naruto.' },
  { slug: 'whats-new', title: "What's new", icon: '✨', blurb: 'What changed in each version of the game.' },
].map(g => ({ ...g, id: `guide/${g.slug}`, file: `wiki/guides/${g.slug}.md` }));

/** Generated reference sections shown on the Wiki home. */
export const REFERENCE = [
  { id: 'characters', title: 'Characters', icon: '🥷', blurb: 'Every ninja: stats, natures, jutsu, forms and how to get them.' },
  { id: 'jutsu', title: 'Jutsu', icon: '🌀', blurb: 'Every Ultimate, enemy jutsu and boss technique, and who uses it.' },
  { id: 'nature-wheel', title: 'Nature Wheel chart', icon: '☯️', blurb: 'Tap a nature to see what it beats and what beats it.' },
  { id: 'enemies', title: 'Enemies and bosses', icon: '👹', blurb: 'Every foe by arc, with natures so you can plan your counters.' },
  { id: 'arcs', title: 'Arcs and battles', icon: '🗺️', blurb: 'Every battle: objective, enemies, team rules and rewards.' },
  { id: 'banners', title: 'Banners and rates', icon: '🎴', blurb: 'Every summon banner, its featured ninja and exact rates.' },
  { id: 'boss-rush', title: 'Boss Rush', icon: '☁️', blurb: 'The Akatsuki rotation, their specials and round rewards.' },
];

/** Where each screen's ? button points. `story` uses the arc on screen when there is one. */
export const HELP_PAGES = {
  home: 'guide/how-to-play', story: 'arcs', team: 'guide/team-composition', roster: 'guide/levelling',
  summon: 'guide/summoning', rush: 'boss-rush', settings: 'guide/how-to-play', tutorial: 'guide/how-to-play',
  wiki: 'guide/how-to-play', battle: 'guide/jutsu-clash', achievements: 'guide/achievements', daily: 'guide/endgame', hard: 'guide/endgame',
};

/** Link targets a guide may use besides wiki pages (handled by the Wiki screen). */
export const WIKI_ACTIONS = ['replay-tutorial'];

/** Parent of a page (for the back button and breadcrumbs). */
export function parentOf(id) {
  if (!id || id === 'home') return null;
  if (!id.includes('/')) return 'home'; // guides' and sections' parent (note: the section "jutsu" is also a page kind)
  const kind = id.slice(0, id.indexOf('/'));
  return { character: 'characters', jutsu: 'jutsu', enemy: 'enemies', arc: 'arcs', banner: 'banners', achievement: 'achievements' }[kind] || 'home';
}

/** Every distinct jutsu name (Ultimates, enemy jutsu, named boss mechanics) and who uses it. */
export function jutsuCatalog(C) {
  const map = new Map();
  const add = (name, use) => {
    if (!name) return;
    const slug = slugify(name);
    if (!map.has(slug)) map.set(slug, { slug, name, uses: [], collisions: [] });
    const e = map.get(slug);
    if (e.name !== name && !e.collisions.includes(name)) e.collisions.push(name);
    e.uses.push(use);
  };
  for (const c of C.roster) add(c.ult.name, { kind: 'ult', owner: 'character', id: c.id, type: c.ult.type, nature: c.ult.nature || null, stun: !!c.ult.stun });
  for (const e of C.enemies) {
    if (e.jutsu) add(e.jutsu.name, { kind: 'jutsu', owner: 'enemy', id: e.id, type: e.jutsu.type || 'single', nature: e.jutsu.nature ?? null });
    for (const m of e.mechanics || []) add(m.name, { kind: 'mechanic', owner: 'enemy', id: e.id, mechanic: m });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Where every enemy shows up: story battles (and whether it's the boss), the tutorial,
 *  the Boss Rush, summons and escorts. Map enemyId -> [{ where, node?, arcId?, boss?, by? }]. */
export function enemyAppearances(C) {
  const out = new Map(C.enemies.map(e => [e.id, []]));
  const push = (id, x) => { if (out.has(id)) out.get(id).push(x); };
  for (const arc of [C.tutorial, ...C.arcs].filter(Boolean)) {
    for (const n of arc.nodes || []) {
      const seen = new Set();
      for (const e of n.enemies) { const k = e.id + (e.boss ? '!' : ''); if (seen.has(k)) continue; seen.add(k); push(e.id, { where: arc === C.tutorial ? 'tutorial' : 'story', node: n.id, arcId: arc.id, boss: !!e.boss }); }
      if (n.objective?.protect) push(n.objective.protect, { where: 'escort', node: n.id, arcId: arc.id });
    }
  }
  (C.bossRush?.order || []).forEach((id, i) => push(id, { where: 'rush', round: i + 1 }));
  for (const e of C.enemies) for (const m of e.mechanics || []) if (m.type === 'summonAdds') push(m.enemy, { where: 'summon', by: e.id, name: m.name });
  return out;
}

/** How a character is obtained: starter, unlock, banners featuring them, exclusivity. */
export function obtainInfo(def, C) {
  const banners = C.banners.filter(b => (b.featured || []).includes(def.id)).map(b => b.id);
  const unlockArc = def.unlock?.arcCleared || def.unlock?.arcReached || null;
  return {
    starter: !!def.starter,
    unlockArc, unlockKind: def.unlock?.arcCleared ? 'cleared' : def.unlock?.arcReached ? 'reached' : null,
    achievement: def.unlock?.achievement || null,
    pullable: !def.notPullable,
    banners,
  };
}

const ENEMY_KIND = (e) => e.role === 'Civilian' ? 'Escort' : 'Enemy';

/** The full page index. `extras.achievements` = achievement definitions (optional). */
export function buildWikiIndex(C, B, extras = {}) {
  const achievements = extras.achievements ?? C.achievements ?? [];
  const pages = [];
  const add = (p) => pages.push({ keywords: [], ...p });
  add({ id: 'home', kind: 'home', title: 'Wiki' });
  for (const g of GUIDES) add({ id: g.id, kind: 'guide', title: g.title, sub: 'Guide', keywords: [g.blurb] });
  for (const r of REFERENCE) add({ id: r.id, kind: 'section', title: r.title, sub: 'Reference', keywords: [r.blurb] });
  if (achievements.length) add({ id: 'achievements', kind: 'section', title: 'Achievements', sub: 'Reference', keywords: ['rewards', 'goals'] });
  for (const c of C.roster) {
    add({ id: `character/${c.id}`, kind: 'character', title: c.name, sub: `${TIER_LABEL[c.tier]} · ${c.role}${c.formOf ? ' · form' : ''}`,
      keywords: [c.short, c.role, c.tier, c.ult.name, ...(c.natures || []), c.taijutsu ? 'Taijutsu' : ''] });
  }
  for (const j of jutsuCatalog(C)) {
    const who = j.uses.map(u => (u.owner === 'character' ? C.char[u.id] : C.enemy[u.id])?.name).filter(Boolean);
    add({ id: `jutsu/${j.slug}`, kind: 'jutsu', title: j.name, sub: `Jutsu · ${[...new Set(who)].slice(0, 2).join(', ')}${new Set(who).size > 2 ? '…' : ''}`, keywords: who });
  }
  const app = enemyAppearances(C);
  for (const e of C.enemies) {
    const first = app.get(e.id)?.[0];
    const arcName = first?.arcId ? (first.arcId === C.tutorial?.id ? C.tutorial.name : C.arc[first.arcId]?.name) : first?.where === 'rush' ? C.bossRush.name : first?.where === 'summon' ? `summoned by ${C.enemy[first.by]?.name}` : '';
    add({ id: `enemy/${e.id}`, kind: 'enemy', title: e.name, sub: `${ENEMY_KIND(e)}${arcName ? ` · ${arcName}` : ''}`, keywords: [...(e.natures || []), e.jutsu?.name, ...(e.mechanics || []).map(m => m.name)].filter(Boolean) });
  }
  for (const a of [C.tutorial, ...C.arcs].filter(Boolean)) {
    add({ id: `arc/${a.id}`, kind: 'arc', title: a.name, sub: a === C.tutorial ? 'Tutorial' : `Part ${a.part === 1 ? 'I' : 'II'} · arc`, keywords: (a.nodes || []).map(n => n.name) });
  }
  for (const b of C.banners) add({ id: `banner/${b.id}`, kind: 'banner', title: b.name, sub: b.type === 'standard' ? 'Banner · always open' : `Banner · ${C.arc[b.arc]?.name}`, keywords: (b.featured || []).map(id => C.char[id]?.name).filter(Boolean) });
  for (const a of achievements) add({ id: `achievement/${a.id}`, kind: 'achievement', title: a.name, sub: `Achievement · ${a.category}`, keywords: [a.description].filter(Boolean) });
  return { pages, byId: new Map(pages.map(p => [p.id, p])) };
}

/** Case-insensitive search over titles, subtitles and keywords. Titles rank first. */
export function searchWiki(index, query, limit = 40) {
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 2) return [];
  const scored = [];
  for (const p of index.pages) {
    if (p.kind === 'home') continue;
    const t = p.title.toLowerCase();
    let s = t === q ? 100 : t.startsWith(q) ? 80 : t.includes(q) ? 60 : 0;
    if (!s && (p.sub || '').toLowerCase().includes(q)) s = 30;
    if (!s && p.keywords.some(k => String(k || '').toLowerCase().includes(q))) s = 20;
    if (s) scored.push({ p, s });
  }
  return scored.sort((a, b) => b.s - a.s || a.p.title.localeCompare(b.p.title)).slice(0, limit).map(x => x.p);
}

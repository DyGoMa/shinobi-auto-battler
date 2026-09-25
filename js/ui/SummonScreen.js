// SummonScreen.js — banners, rates, pity counter, and the pull animation.
import { h, btn, fmt, avatar, tierTag, toggle } from './dom.js';
import { pull, pullCost, canAfford, bannerRates, ticketPull } from '../core/GachaSystem.js';
import { isBannerUnlocked, isCharacterAvailable } from '../core/Progression.js';
import { TIER_LABEL, RARITY_LABEL } from '../core/formulas.js';
import { TIER_COLORS } from '../render/Renderer.js';
import { tipCard } from './tips.js';
import { screenHead } from './chrome.js';

let selected = null;
let archiveOpen = false;   // "Past banners" expanded
let archivePart = null;    // story part shown in the archive
const PART_NAME = { 1: 'Part I', 2: 'Part II' };
const TIER_RANK = { genin: 0, chunin: 1, jonin: 2, kage: 3 };

export function render(game, ui, params) {
  const { C, B, state } = game;
  const banners = C.banners;
  if (params.bannerId) selected = params.bannerId;
  if (!selected || !C.banner[selected] || !isBannerUnlocked(state, C.banner[selected], C)) {
    // default: newest unlocked arc banner, else standard
    const arcs = banners.filter(b => b.type === 'arc' && isBannerUnlocked(state, b, C));
    selected = arcs.length ? arcs[arcs.length - 1].id : 'standard';
  }
  const banner = C.banner[selected];
  const rates = bannerRates(banner, state, C, B);
  const pityLeft = Math.max(0, B.gacha.pity - state.gacha.pity);

  // Banner picker: the current banners (Standard + newest open arc) always sit in one
  // row; every other banner is in a collapsible archive, grouped by story part.
  const partOf = (b) => b.type === 'arc' ? C.arc[b.arc].part : 0;
  const openArcs = banners.filter(b => b.type === 'arc' && isBannerUnlocked(state, b, C));
  const current = [C.banner.standard, openArcs[openArcs.length - 1]].filter(Boolean);
  const archived = banners.filter(b => !current.includes(b));
  const parts = [...new Set(archived.map(partOf))].filter(p => p > 0);
  if (!current.includes(banner)) archivePart = partOf(banner);
  if (!parts.includes(archivePart)) archivePart = parts.includes(partOf(current[current.length - 1])) ? partOf(current[current.length - 1]) : parts[0];
  const tab = (b, sub) => {
    const open = isBannerUnlocked(state, b, C);
    return h('button.banner-tab' + (b.id === selected ? '.on' : '') + (open ? '' : '.locked'), {
      type: 'button', onclick: () => { if (!open) { ui.toast(`Reach ${C.arc[b.arc].name} to open this banner.`); return; } selected = b.id; ui.refresh(); },
    }, (open ? '' : '🔒 ') + b.name, sub ? h('span.sub', sub) : null);
  };
  const openIn = (p) => archived.filter(b => partOf(b) === p && isBannerUnlocked(state, b, C)).length;
  const tabs = h('div.banner-picker',
    h('div.banner-current', ...current.map(b => tab(b, b.type === 'standard' ? 'Always available' : 'Current arc'))),
    parts.length ? h('button.banner-archive-toggle', { type: 'button', 'aria-expanded': String(archiveOpen), onclick: () => { archiveOpen = !archiveOpen; ui.refresh(); } },
      `${archiveOpen ? '▾' : '▸'} Past banners`, h('span.tiny.muted', parts.map(p => `${PART_NAME[p] || 'Part ' + p}: ${openIn(p)} open`).join(' · '))) : null,
    archiveOpen && parts.length ? h('div.banner-archive',
      parts.length > 1 ? h('div.seg', ...parts.map(p => h('button' + (p === archivePart ? '.on' : ''), { type: 'button', onclick: () => { archivePart = p; ui.refresh(); } }, PART_NAME[p] || `Part ${p}`))) : null,
      h('div.banner-grid', ...archived.filter(b => partOf(b) === archivePart).map(b => tab(b)))) : null,
  );

  const featured = (banner.featured || []).map(id => {
    const d = C.char[id]; const avail = isCharacterAvailable(state, d, C);
    return h('div.feat' + (avail ? '' : '.locked'), avatar(d, { size: 'sm' }), h('div.n', d.short), h('div.tiny', { style: { color: TIER_COLORS[d.tier] } }, TIER_LABEL[d.tier]),
      avail ? null : h('div.tiny.dim', `joins after ${C.arc[d.unlock.arcCleared || d.unlock.arcReached]?.name}`));
  });

  const doPull = (count) => {
    if (!canAfford(state, count, B)) { ui.toast(`Not enough scrolls — you need ${fmt(pullCost(count, B) - state.currencies.scrolls)} more.`, 'bad'); return; }
    const res = pull(state, banner.id, count, C, game.rng, B);
    if (!res.ok) { ui.toast(res.error, 'bad'); return; }
    game.commit('pull');
    playAnimation(game, ui, res.results);
  };
  const doTicket = (kind) => {
    const res = ticketPull(state, banner.id, kind, C, game.rng, B);
    if (!res.ok) { ui.toast(res.error, 'bad'); return; }
    game.commit('pull');
    playAnimation(game, ui, res.results);
  };
  const tickets = state.currencies.tickets || 0, rare = state.currencies.rareTickets || 0;
  const single = pullCost(1, B), ten = pullCost(10, B);
  const hero = h('div.banner-hero',
    h('div.row.between', h('div', h('div.tiny.muted', banner.type === 'standard' ? 'Always available' : `Arc banner · ${C.arc[banner.arc].name}`), h('h2', banner.name)), banner.type === 'arc' ? h('span.pill.accent', `Rate-up ×${Math.round(B.gacha.rateUpShare * 100)}% of tier`) : null),
    h('p', banner.blurb),
    featured.length ? h('div.featured', ...featured) : null,
    h('div.pity', h('div.grow', h('div.small', 'Kage guaranteed in ', h('b', pityLeft), ' summon' + (pityLeft === 1 ? '' : 's')), h('div.bar', h('i', { style: { width: `${(state.gacha.pity / B.gacha.pity) * 100}%`, background: 'linear-gradient(90deg,#b388ff,#ffc53d)' } }))),
      h('span.pill', `Every 10× has a ${TIER_LABEL[B.gacha.tenPullGuaranteeTier]}+`)),
    h('div.pull-buttons',
      pullBtn('Summon ×1', single, state, () => doPull(1)),
      pullBtn('Summon ×10', ten, state, () => doPull(10), true)),
    h('div.row.skip-anim', h('span.small.muted.grow', `×10 = ${fmt(ten)} scrolls (${fmt(single * 10)} for ten singles), a ${TIER_LABEL[B.gacha.tenPullGuaranteeTier]} or better guaranteed, 10 toward the Kage counter.`),
      h('label.small.row.tight', 'Skip animation', toggle(!!state.settings.skipPullAnim, (on) => { state.settings.skipPullAnim = on; game.commit('settings'); }, 'Skip the summon animation'))),
    tickets || rare ? h('div.pull-buttons.tickets',
      tickets ? h('button.btn', { type: 'button', onclick: () => doTicket('tickets') }, h('span', `🎟️ Use a summon ticket`), h('span.sub', `${tickets} left`)) : null,
      rare ? h('button.btn.primary', { type: 'button', onclick: () => doTicket('rareTickets') }, h('span', `🎫 Rare+ summon`), h('span.sub', `${rare} left · ${TIER_LABEL[B.achievements.rareTicketMinTier]} or better`)) : null) : null,
    !canAfford(state, 1, B) ? h('p.small', { style: { marginTop: '10px', color: 'var(--warn)' } }, `You need ${fmt(single - state.currencies.scrolls)} more scrolls for a summon. Story first clears pay the most; Hard mode, the Daily challenge and the Boss Rush pay scrolls too, and achievements give free summon tickets.`) : null,
  );

  const rateTable = h('table.rates', h('tbody', ...rates.map(r => h('tr',
    h('td', h('span.tier.' + r.tier, `${TIER_LABEL[r.tier]} (${RARITY_LABEL[r.tier]})`)),
    h('td', `${(r.rate * 100).toFixed(r.rate < 0.1 ? 1 : 0)}%`),
    h('td.muted', `${r.count} in pool`),
    h('td.small', r.featured.length ? r.featured.map(f => `${C.char[f.id].short} ${(f.rate * 100).toFixed(2)}%`).join(', ') : ''),
  ))));

  const hist = (state.gacha.history || []).slice(0, 20);
  return h('div.screen',
    screenHead(ui, { title: 'Summon', help: 'guide/summoning', right: [h('span.pill', `📜 ${fmt(state.currencies.scrolls)} scrolls`)] }),
    tipCard(game, 'summon'),
    tabs,
    hero,
    h('div.section-title', h('h2', 'Rates')),
    h('div.card', rateTable, h('p.tiny.dim', { style: { marginTop: '8px' } }, `Ninja only drop once they have joined (villains join after their arc is cleared). Pity counts across all banners. Duplicates: +1★ up to ${B.stats.starCap}★, then Ryo.`)),
    hist.length ? h('div.section-title', h('h2', 'Recent summons')) : null,
    hist.length ? h('div.row', ...hist.map(x => { const d = C.char[x.id]; return d ? avatar(d, { size: 'sm' }) : null; })) : null,
  );
}

function pullBtn(label, cost, state, onClick, primary = false) {
  const ok = state.currencies.scrolls >= cost;
  return h('button.btn.big' + (primary ? '.primary' : ''), { type: 'button', onclick: onClick, disabled: !ok, title: ok ? '' : `Need ${cost} scrolls` },
    h('span', label), h('span.sub', `📜 ${cost}`));
}

function playAnimation(game, ui, results) {
  const { C } = game;
  const instant = !!game.state.settings.skipPullAnim;   // Settings or the banner's "Skip animation"
  const top = results.reduce((m, r) => TIER_RANK[r.tier] > TIER_RANK[m] ? r.tier : m, 'genin');
  const overlay = h('div.pull-overlay');
  const stage = h('div.col', { style: { alignItems: 'center', gap: '18px' } });
  const scroll = h('div.scroll-unroll', h('div.scroll-paper', 'SUMMONING JUTSU'), h('div.scroll-rod.l'), h('div.scroll-rod.r'));
  stage.appendChild(scroll);
  // Particles live in their own fixed layer so they never make the overlay scroll.
  const fx = h('div.burst-layer');
  overlay.append(stage, fx);
  document.body.appendChild(overlay);
  if (!game.state.settings.skipPullAnim) game.audio.scroll();
  let skipped = false, finished = false;
  const grid = h('div.reveal-grid' + (results.length === 1 ? '.single' : ''));
  const cards = results.map(r => {
    const d = C.char[r.id];
    const tag = r.isNew ? h('span.tag', 'NEW!') : r.refund ? h('span.tag.refund', `+${fmt(r.refund)} Ryo`) : h('span.tag.up', `${r.stars}★`);
    return h('div.reveal-card.' + r.tier, tag, avatar(d, { size: r.tier === 'kage' ? 'lg' : '' }), h('div.nm', d.name), tierTag(r.tier), r.featured ? h('span.pill.accent', 'Rate-up') : null);
  });
  const done = btn('Continue', () => { overlay.remove(); ui.refresh(); ui.refreshTop(); }, 'primary big');
  done.style.visibility = 'hidden';

  const flash = (tier) => {
    const f = h('div.flash' + (tier === 'kage' ? '.big' : ''));
    f.style.background = `radial-gradient(circle at 50% 45%, ${TIER_COLORS[tier]}, transparent 70%)`;
    document.body.appendChild(f); setTimeout(() => f.remove(), 1500);
    if (tier === 'kage' || tier === 'jonin') burst(fx, TIER_COLORS[tier], tier === 'kage' ? 60 : 24);
  };
  const reveal = () => {
    scroll.remove();
    stage.append(grid, done);
    flash(top);
    cards.forEach((c, i) => {
      grid.appendChild(c);
      const delay = skipped ? 0 : 160 + i * 170;
      setTimeout(() => { c.classList.add('show'); if (!skipped || i === cards.length - 1) game.audio.pullReveal(results[i].tier); if (results[i].tier === 'kage') flash('kage'); if (i === cards.length - 1) { done.style.visibility = 'visible'; finished = true; } }, delay);
    });
  };
  if (instant) { skipped = true; reveal(); cards.forEach(c => c.classList.add('show')); done.style.visibility = 'visible'; finished = true; return; }
  const t = setTimeout(reveal, 900);
  overlay.addEventListener('click', (e) => {
    if (e.target === done) return;
    if (!grid.isConnected) { clearTimeout(t); skipped = true; reveal(); }
    else if (!finished) { skipped = true; cards.forEach(c => c.classList.add('show')); done.style.visibility = 'visible'; finished = true; }
  });
}

function burst(parent, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = 200 + Math.random() * 400;
    const p = h('div.burst', { style: { left: '50%', top: '45%', background: color } });
    p.style.setProperty('--dx', `${Math.cos(a) * d}px`); p.style.setProperty('--dy', `${Math.sin(a) * d}px`);
    parent.appendChild(p); setTimeout(() => p.remove(), 1200);
  }
}

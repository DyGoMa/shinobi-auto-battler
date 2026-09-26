// SummonScreen.js — banners, rates, pity counter, and the pull animation.
import { h, btn, fmt, avatar, tierTag, toggle } from './dom.js';
import { pull, pullCost, canAfford, bannerRates, ticketPull } from '../core/GachaSystem.js';
import { isBannerUnlocked, isCharacterAvailable } from '../core/Progression.js';
import { TIER_LABEL, RARITY_LABEL } from '../core/formulas.js';
import { TIER_COLORS } from '../render/Renderer.js';
import { eraOfPart } from '../render/Assets.js';
import { Effects, FONT_DISPLAY } from '../render/Effects.js';
import { drawFigure, lookFor } from '../render/Figure.js';
import { prefersReducedMotion } from './Intro.js';
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
  // The screen wears the era of the banner's arc (the Standard banner follows the story).
  ui.setEra(banner.type === 'arc' && C.arc[banner.arc] ? eraOfPart(C.arc[banner.arc].part) : ui.storyEra());
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

/**
 * The summon ceremony (docs/ART_BIBLE.md §10): the summoner forms the seal, the summoning
 * circle draws itself with a rotating kanji ring, light rises, a smoke burst and a flash, then
 * the cards fan out from the circle (a Kage first whites the screen out and lands on the full
 * portrait with a gold plate). Under 3 s for one summon, under 6 s for ten; a tap skips to the
 * cards; the "Skip animation" switch shows them at once.
 */
function playAnimation(game, ui, results) {
  const { C } = game;
  const instant = !!game.state.settings.skipPullAnim || prefersReducedMotion();   // Settings or the banner's "Skip animation"
  const top = results.reduce((m, r) => TIER_RANK[r.tier] > TIER_RANK[m] ? r.tier : m, 'genin');
  const kage = results.find(r => r.tier === 'kage') || null;
  const overlay = h('div.pull-overlay');
  const stage = h('div.col', { style: { alignItems: 'center', gap: '18px' } });
  const canvas = h('canvas', { 'aria-hidden': 'true' });
  const kageCard = h('div.kage-card');
  const ceremony = h('div.ceremony', { role: 'img', 'aria-label': 'Summoning' }, canvas, kageCard);
  stage.appendChild(ceremony);
  const fx = h('div.burst-layer');   // the DOM sparks of a rare reveal, in their own fixed layer
  overlay.append(stage, fx);
  document.body.appendChild(overlay);
  if (!instant) game.audio.scroll();
  let skipped = false, finished = false, raf = 0, stopped = false;
  const timers = [];
  const later = (s, fn) => timers.push(setTimeout(fn, s * 1000));
  const grid = h('div.reveal-grid' + (results.length === 1 ? '.single' : ''));
  const cards = results.map(r => {
    const d = C.char[r.id];
    const tag = r.isNew ? h('span.tag', 'NEW!') : r.refund ? h('span.tag.refund', `+${fmt(r.refund)} Ryo`) : h('span.tag.up', `${r.stars}★`);
    return h('div.reveal-card.' + r.tier, tag, avatar(d, { size: r.tier === 'kage' ? 'lg' : '' }), h('div.nm', d.name), tierTag(r.tier), r.featured ? h('span.pill.accent', 'Rate-up') : null);
  });
  const done = btn('Continue', () => { stopped = true; cancelAnimationFrame(raf); for (const t of timers) clearTimeout(t); overlay.remove(); ui.refresh(); ui.refreshTop(); }, 'primary big');
  done.style.visibility = 'hidden';

  const flash = (tier) => {
    const f = h('div.flash' + (tier === 'kage' ? '.big' : ''));
    f.style.background = `radial-gradient(circle at 50% 45%, ${TIER_COLORS[tier]}, transparent 70%)`;
    document.body.appendChild(f); setTimeout(() => f.remove(), 1500);
    if (tier === 'kage' || tier === 'jonin') burst(fx, TIER_COLORS[tier], tier === 'kage' ? 60 : 24);
  };
  const showCards = () => {
    if (grid.isConnected) return;
    stopped = true; cancelAnimationFrame(raf);
    ceremony.remove();
    stage.append(grid, done);
    flash(top);
    cards.forEach((c, i) => {
      grid.appendChild(c);
      const delay = skipped ? 0 : 160 + i * 170;
      setTimeout(() => { c.classList.add('show'); if (!skipped || i === cards.length - 1) game.audio.pullReveal(results[i].tier); if (results[i].tier === 'kage') flash('kage'); if (i === cards.length - 1) { done.style.visibility = 'visible'; finished = true; } }, delay);
    });
  };
  if (instant) { skipped = true; showCards(); cards.forEach(c => c.classList.add('show')); done.style.visibility = 'visible'; finished = true; return; }

  // ---- the ceremony on the canvas (logical 900 × 1300, scaled to fit)
  const LW = 900, LH = 1300, cx = LW / 2, cy = 980;
  const g = canvas.getContext('2d');
  const effects = new Effects(null, { level: game.state.settings.vfx === 'low' ? 'low' : 'medium' });
  const summoner = lookFor(C.char[ui.era === 'p2' && C.char.naruto_p2 ? 'naruto_p2' : 'naruto'] || Object.values(C.char)[0], C);
  const tierColor = TIER_COLORS[top];
  const resize = () => { const r = ceremony.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1); canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr)); };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(ceremony);
  let t = 0, last = performance.now();
  const kageIn = () => {
    const d = C.char[kage.id];
    kageCard.replaceChildren(avatar(d, { size: 'xl', era: ui.era }), h('div.plate', h('div.nm', d.name), h('div.ti', `${TIER_LABEL.kage} · ${RARITY_LABEL.kage}${d.village ? ` · ${d.village}` : ''}`)));
    kageCard.classList.add('show');
  };
  const draw = () => {
    const sc = Math.min(canvas.width / LW, canvas.height / LH);
    g.setTransform(sc, 0, 0, sc, (canvas.width - LW * sc) / 2, (canvas.height - LH * sc) / 2);
    g.clearRect(-50, -50, LW + 100, LH + 100);
    // the summoning circle, from 0.9 s
    if (t > 0.9) {
      const k = Math.min(1, (t - 0.9) / 0.5); const R = 300 * k;
      g.save(); g.globalAlpha = t > 6.5 ? Math.max(0, 1 - (t - 6.5) / 1.5) : 1;
      const gl = g.createRadialGradient(cx, cy, 0, cx, cy, R); gl.addColorStop(0, 'rgba(255,197,61,0.35)'); gl.addColorStop(1, 'rgba(255,197,61,0)'); g.fillStyle = gl; g.beginPath(); g.ellipse(cx, cy, R, R * 0.36, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ffd66b'; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, cy, R, R * 0.36, 0, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy, R * 0.72, R * 0.36 * 0.72, 0, 0, Math.PI * 2); g.stroke();
      g.font = '26px "Yuji Syuku", serif'; g.fillStyle = '#ffe9a8'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const txt = '口寄せの術・';
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + t * 0.8; const px = cx + Math.cos(a) * R * 0.86, py = cy + Math.sin(a) * R * 0.36 * 0.86; g.save(); g.translate(px, py); g.scale(1, 0.55); g.rotate(a + Math.PI / 2); g.fillText(txt[i % txt.length], 0, 0); g.restore(); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - t * 0.5; g.fillStyle = '#ffd66b'; g.beginPath(); g.arc(cx + Math.cos(a) * R * 0.72, cy + Math.sin(a) * R * 0.36 * 0.72, 6, 0, Math.PI * 2); g.fill(); }
      // rising light in the top tier's colour
      if (t > 1.6) { const kk = Math.min(1, (t - 1.6) / 0.6); const lg = g.createLinearGradient(0, cy, 0, cy - 700 * kk); lg.addColorStop(0, hexA(tierColor, 0.5)); lg.addColorStop(1, hexA(tierColor, 0)); g.fillStyle = lg; g.beginPath(); g.moveTo(cx - R * 0.7, cy); g.lineTo(cx - R * 0.3, cy - 700 * kk); g.lineTo(cx + R * 0.3, cy - 700 * kk); g.lineTo(cx + R * 0.7, cy); g.closePath(); g.fill(); }
      g.restore();
    }
    // the summoner: a silhouette forming the seal until the circle lights, then lit from below
    if (t < 2.3) { const sil = t < 1.0; const k = Math.min(1, t / 0.5); g.save(); g.globalAlpha = t > 1.9 ? Math.max(0, 1 - (t - 1.9) / 0.4) : 1; drawFigure(g, summoner, { x: cx, y: 1000, facing: 1, scale: 3.2, t, cast: k, silhouette: sil, aura: sil ? null : '#ffd66b' }); g.restore(); }
    effects.draw(g);
    effects.drawScreen(g);
    if (t < 1.2) { g.font = `28px ${FONT_DISPLAY}`; g.fillStyle = 'rgba(255,233,168,0.9)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SUMMONING JUTSU', cx, 150); }
  };
  const fired = new Set();
  const beats = [
    [0.15, () => { for (let i = 0; i < 20; i++) effects.emit({ x: cx + (Math.random() * 120 - 60), y: 900, vx: Math.random() * 80 - 40, vy: -(120 + Math.random() * 120), life: 0.8, size: 4, shape: 'circle', color: '#9be3ff', add: true }); }],
    [0.9, () => effects.ring(cx, cy, '#ffd66b', { r1: 320, width: 10, dur: 0.6, ellipse: 0.36 })],
    [1.9, () => { effects.smoke(cx, 940, 40, '#e6dccb', 0.75); effects.flash('#fff6d8', 0.5, 0.25); }],
    [2.3, () => {
      effects.flash(kage ? '#ffffff' : hexA(tierColor, 1), kage ? 1 : 0.7, kage ? 0.5 : 0.3);
      effects.ring(cx, 620, tierColor, { r1: 700, width: 14, dur: 0.9 });
      for (let i = 0; i < (kage ? 60 : 30); i++) { const a = Math.random() * Math.PI * 2, sp = 200 + Math.random() * 500; effects.emit({ x: cx, y: 620, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 300, life: 0.9 + Math.random() * 0.6, size: 4 + Math.random() * 5, shape: 'star', color: Math.random() < 0.5 ? tierColor : '#fff5cc', add: true }); }
      if (kage) { game.audio.pullReveal('kage'); kageIn(); later(1.9, showCards); } else showCards();
    }],
  ];
  const frame = (now) => {
    if (stopped) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    for (const [at, fn] of beats) if (!fired.has(fn) && t >= at) { fired.add(fn); fn(); }
    effects.update(dt);
    try { draw(); } catch (e) { console.error('[summon]', e); showCards(); }
  };
  raf = requestAnimationFrame(frame);
  overlay._frame = frame;   // for the layout audit and debugging: one frame by hand
  // A hidden tab never runs the frames: the cards come up by the clock instead.
  later(kage ? 4.6 : 2.8, () => { if (!grid.isConnected) { skipped = true; showCards(); } });
  overlay.addEventListener('click', (e) => {
    if (e.target === done) return;
    if (!grid.isConnected) { skipped = true; showCards(); }
    else if (!finished) { skipped = true; cards.forEach(c => c.classList.add('show')); done.style.visibility = 'visible'; finished = true; }
  });
  done.addEventListener('click', () => ro.disconnect(), { once: true });
}

function hexA(hex, a) { const c = hex.replace('#', ''); return `rgba(${parseInt(c.slice(0, 2), 16)},${parseInt(c.slice(2, 4), 16)},${parseInt(c.slice(4, 6), 16)},${a})`; }

function burst(parent, color, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = 200 + Math.random() * 400;
    const p = h('div.burst', { style: { left: '50%', top: '45%', background: color } });
    p.style.setProperty('--dx', `${Math.cos(a) * d}px`); p.style.setProperty('--dy', `${Math.sin(a) * d}px`);
    parent.appendChild(p); setTimeout(() => p.remove(), 1200);
  }
}

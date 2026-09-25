// tools/ui-audit.mjs — in-browser layout audit for QA.md (not part of the game).
// Visits every screen at the current viewport size and reports:
//   * overflow  elements sticking out past the viewport (horizontal scroll)
//   * targets   buttons, links, inputs and chips smaller than 44×44 px
//   * clipped   text cut off inside its box (overflow hidden, no ellipsis on purpose)
//   * copy      placeholder-looking text (TODO, lorem, undefined, NaN, [object ...])
// Usage (local server, browser console or the preview tools):
//   const a = await import('/tools/ui-audit.mjs'); await a.auditAll(window.__game)
// Resize the window between runs: 390×844, 360×780, 844×390 (phone landscape), 1280×800.
const MIN = 44;
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const closeModals = () => document.querySelectorAll('#modal-root .veil, .pull-overlay').forEach(v => v.remove());
const PLACEHOLDER = /\b(TODO|TBD|FIXME|lorem|ipsum|undefined|NaN)\b|\[object \w+\]|\{\{[^}]*\}\}/;

function visible(el) {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
}
function label(el) {
  const t = (el.getAttribute('aria-label') || el.innerText || el.value || el.placeholder || '').replace(/\s+/g, ' ').trim();
  const cls = typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
  return `${el.tagName.toLowerCase()}${cls} "${t.slice(0, 40)}"`;
}
/** Inside a horizontally scrolling strip (a carousel is allowed to extend past the edge). */
function inScroller(el) {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const ox = getComputedStyle(p).overflowX;
    if ((ox === 'auto' || ox === 'scroll') && p.scrollWidth > p.clientWidth) return true;
  }
  return false;
}
/** Inline text links inside a paragraph are exempt from the target size (WCAG 2.5.8). */
function inlineLink(el) { return el.tagName === 'A' && getComputedStyle(el).display === 'inline' && !!el.closest('p, li, td'); }

export function auditScreen(name) {
  const vw = document.documentElement.clientWidth;
  const out = { screen: name, overflow: [], targets: [], clipped: [], copy: [] };
  if (document.documentElement.scrollWidth > vw + 1) out.overflow.push(`page is ${document.documentElement.scrollWidth}px wide (viewport ${vw}px)`);
  const all = [...document.querySelectorAll('#app *, #battle *, #modal-root *, .pull-overlay *')];
  for (const el of all) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !inScroller(el) && !el.closest('canvas')) {
      // report the outermost offender only
      if (!out.overflow.some(o => o.el && o.el.contains(el))) out.overflow.push({ el, what: `${label(el)} spans ${Math.round(r.left)}–${Math.round(r.right)}px` });
    }
  }
  // controls in the fixed layers (battle, summon reveal, modals) must be on screen or scrollable to
  const vh = document.documentElement.clientHeight;
  for (const el of document.querySelectorAll('#battle button, .pull-overlay button, #modal-root button')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom <= vh + 1 && r.top >= -1) continue;
    let scrolls = false;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const oy = getComputedStyle(p).overflowY; if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) { scrolls = true; break; } }
    if (!scrolls) out.overflow.push(`${label(el)} is off screen (${Math.round(r.top)}–${Math.round(r.bottom)}px, window ${vh}px) and nothing scrolls to it`);
  }
  const interactive = [...document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [tabindex="0"], .chip')];
  for (const el of interactive) {
    if (!visible(el) || el.disabled || inlineLink(el) || el.closest('[aria-hidden="true"]')) continue;
    // layout size: entrance animations (scale) don't count, and they stall in background tabs
    const r = el.getBoundingClientRect();
    const w = el.offsetWidth || r.width, ht = el.offsetHeight || r.height;
    if (w < MIN - 0.5 || ht < MIN - 0.5) out.targets.push(`${label(el)} ${Math.round(w)}×${Math.round(ht)}`);
  }
  for (const el of all) {
    if (!visible(el) || !el.childNodes.length || el.children.length > 2) continue;
    const cs = getComputedStyle(el);
    const hidden = cs.overflow === 'hidden' || cs.overflowX === 'hidden';
    if (hidden && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 2 && (el.innerText || '').trim()) out.clipped.push(`${label(el)} needs ${el.scrollWidth}px, has ${el.clientWidth}px`);
  }
  const text = [...['app', 'battle', 'modal-root'].map(id => document.getElementById(id)), document.querySelector('.pull-overlay')].map(el => el?.innerText || '').join('\n');
  for (const line of text.split('\n')) if (PLACEHOLDER.test(line)) out.copy.push(line.trim().slice(0, 80));
  out.overflow = out.overflow.map(o => (typeof o === 'string' ? o : o.what));
  return out;
}

/** Stop this tab from writing to the cloud save (QA saves stay local). Reload to undo. */
export function offline(game) {
  const cb = game.save.cloud;
  if (cb) { cb.save = async () => true; cb.saveToCloud = async () => true; }
}

/**
 * Replace the save with a QA save (keeps a copy in window.__qaBackup; restore it with
 * game.save.replaceState(window.__qaBackup, { skipCloud: true })). kinds:
 *   'fresh'  a new player: the tutorial not started
 *   'mid'    Part I and the start of Part II cleared, 20 ninja at Lv 40 3★, Hard and Daily open
 */
export function qaSave(game, kind = 'mid') {
  offline(game);
  const { C } = game;
  window.__qaBackup ??= JSON.parse(JSON.stringify(game.state));
  const s = JSON.parse(JSON.stringify(window.__qaBackup));
  if (kind === 'mid') {
    for (const n of C.nodes.filter(n => n.part === 1)) s.progress.cleared[n.id] = { clears: 1, best: 40 };
    for (const n of C.nodes.filter(n => n.part === 2).slice(0, 6)) s.progress.cleared[n.id] = { clears: 1, best: 50 };
    for (const id of ['naruto', 'sakura', 'sasuke', 'kakashi', 'gaara', 'lee', 'neji', 'shikamaru', 'choji', 'kurenai', 'tsunade', 'temari', 'hinata', 'shino', 'kankuro', 'jiraiya', 'guy', 'haku', 'zabuza', 'orochimaru'])
      if (C.char[id]) s.roster[id] = { ...(s.roster[id] || {}), level: 40, stars: 3 };
    s.tutorial.status = 'done'; s.tutorial.rewarded = true;
    Object.assign(s.currencies, { scrolls: 12345, ryo: 98765, tickets: 2 });
  }
  game.save.replaceState(s, { skipCloud: true });
  game.ui.onStateReplaced?.();
  document.querySelectorAll('#modal-root .veil').forEach(v => v.remove());
}

/** Every screen (and a few modals) for the current save. Returns issues per screen. */
export async function auditAll(game, { extra = [] } = {}) {
  const ui = game.ui;
  const { buildWikiIndex } = await import('../js/wiki/WikiData.js');
  const pages = buildWikiIndex(game.C, game.B).pages;
  const firstOf = (kind) => pages.find(p => p.id.startsWith(kind + '/'))?.id;
  const wikiPages = ['guide/how-to-play', 'guide/endgame', 'characters', 'jutsu', 'nature-wheel', 'enemies', 'arcs', 'banners', 'boss-rush', 'achievements',
    ...['character', 'jutsu', 'enemy', 'arc', 'banner', 'achievement'].map(firstOf).filter(Boolean)];
  const routes = [
    ['home'], ['story', { part: 1 }], ['story', { part: 1, hard: true }], ['story', { part: 2 }],
    ['team'], ['team', { daily: true }], ['roster'], ['summon'], ['achievements'], ['daily'], ['rush'], ['settings'],
    ['wiki'], ...wikiPages.map(p => ['wiki', { page: p }]),
    ...extra,
  ];
  const report = [];
  const run = async (name, fn) => { closeModals(); await fn(); await wait(450); report.push(auditScreen(name)); };
  for (const [id, params = {}] of routes) await run(`${id}${Object.keys(params).length ? ' ' + JSON.stringify(params) : ''}`, () => ui.go(id, params));
  // the Wiki search with no results
  await run('wiki search (no results)', async () => {
    ui.go('wiki', {}); await wait(300);
    const input = document.querySelector('input[type=search]');
    if (input) { input.value = 'zzzz'; input.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  // modals: a character from the roster
  await run('roster › character modal', async () => { ui.go('roster'); await wait(400); document.querySelector('.char-card')?.click(); });
  closeModals();
  return report.filter(r => r.overflow.length || r.targets.length || r.clipped.length || r.copy.length);
}

/** Battles, summons and a new player's first screens. Changes the save: run it on a qaSave. */
export async function auditFlows(game) {
  const { ui, C } = game;
  const report = [];
  const snap = async (name, ms = 450) => { await wait(ms); report.push(auditScreen(name)); };
  // a story battle: HUD, pause menu, results
  closeModals();
  const node = C.nodes.find(n => !game.state.progress.cleared[n.id]) || C.nodes[0];
  ui.startBattle({ node });
  await snap('battle HUD', 700);
  ui.battle?.togglePause(true); await snap('battle paused');
  ui.battle?.togglePause(false);
  if (ui.battle) { const st = ui.battle.sim.runToEnd({ ultMode: 'smart' }); ui.battle._onEnd(st); }
  await snap('battle results', 1200);
  document.querySelector('#modal-root .veil .actions button')?.click();
  closeModals(); ui.battle?.close?.({ id: 'home' }); await wait(400);
  // a 10-summon
  ui.go('summon'); await wait(400);
  [...document.querySelectorAll('#screen button')].find(b => /×\s?10|10×|Summon ×10|10-pull/i.test(b.innerText) && !b.disabled)?.click();
  await wait(900); document.querySelector('.pull-overlay')?.click();   // skip to the full reveal
  await snap('summon reveal', 600);
  const overlay = document.querySelector('.pull-overlay');
  if (overlay && overlay.scrollHeight > overlay.clientHeight + 1 && getComputedStyle(overlay).overflowY !== 'auto' && getComputedStyle(overlay).overflowY !== 'scroll') report.push({ screen: 'summon reveal', overflow: [`cards need ${overlay.scrollHeight}px of height, the overlay shows ${overlay.clientHeight}px and does not scroll`], targets: [], clipped: [], copy: [] });
  closeModals(); await wait(300);
  // a new player: welcome, Home, the tutorial screen
  qaSave(game, 'fresh'); await snap('fresh save: welcome');
  closeModals(); ui.go('home'); await snap('fresh save: home');
  ui.go('daily'); await snap('fresh save: daily (locked)');
  ui.go('rush'); await snap('fresh save: boss rush (locked)');
  ui.go('story', { part: 2 }); await snap('fresh save: story Part II (locked)');
  ui.go('achievements'); await snap('fresh save: achievements');
  ui.openTutorial(); await snap('fresh save: tutorial');
  ui.go('team', { tutorialLesson: 0 }); await snap('fresh save: tutorial lesson 1 team');
  return report.filter(r => r.overflow.length || r.targets.length || r.clipped.length || r.copy.length);
}

/**
 * 0.11.2: the install suggestions, forced visible (the pane is not a phone): the start-menu
 * notice, the one-time popup on Home, the reminder banner above the tab bar (Home and the
 * Story map), and the three step dialogs. Leaves the device flags and the record as it found them.
 */
export async function auditInstall(game) {
  const { ui } = game; const inst = game.install;
  const report = [];
  const snap = async (name, ms = 450) => { await wait(ms); report.push(auditScreen(name)); };
  const { showSteps } = await import('../js/ui/install.js');
  const before = { phone: inst.debugPhone, nudge: JSON.parse(JSON.stringify(inst.nudge)) };
  inst.debugPhone = true; inst.debug.reset();
  // the start menu with the notice
  closeModals();
  ui.startPending = true; ui.go('start'); await snap('start menu: install notice');
  ui.startPending = false; document.body.classList.remove('start-mode', 'start-sub');
  // the popup on Home (needs the tutorial done: qaSave 'mid')
  ui.go('home'); await wait(300); closeModals(); inst.debug.reset(); inst.offerPopup(); await snap('home: install popup');
  closeModals();
  // the banner, as at a launch 4 days after "Not now"
  const t = Date.now() - 4 * 24 * 3600 * 1000;
  inst.nudge = { popupAt: t, dismissals: [t], installedAt: 0 }; inst.debug.relaunch();
  ui.go('home'); await snap('home: install banner');
  ui.go('story', { part: 1 }); await snap('story: install banner');
  // the steps
  for (const plan of ['android', 'ios', 'safari']) { closeModals(); ui.go('settings'); await wait(200); showSteps(game, ui, plan); await snap(`install steps: ${plan}`); }
  closeModals();
  inst.debugPhone = before.phone; inst.nudge = before.nudge; inst.save(); inst.debug.relaunch(); ui.go('home');
  return report.filter(r => r.overflow.length || r.targets.length || r.clipped.length || r.copy.length);
}

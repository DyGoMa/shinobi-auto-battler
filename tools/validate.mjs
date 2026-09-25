// tools/validate.mjs — content schema check. `npm run validate`
// Checks every roster/enemy/arc/node/banner/boss-rush entry (required fields,
// valid natures/roles/types, valid references, no duplicate ids) plus a few
// balance.js sanity checks. Exits 1 on any error.
import { CONTENT, validateContent } from '../js/content/index.js';
import { BALANCE } from '../js/config/balance.js';
import { curve, TIERS } from '../js/core/formulas.js';
import { missingNames } from './naming.mjs';
import { checkWiki } from './wiki-check.mjs';
import { GAME_VERSION } from '../js/config/version.js';
import { readFileSync } from 'node:fs';

const errors = validateContent(CONTENT);

// ---- balance.js sanity ----------------------------------------------------
const B = BALANCE;
const rateSum = TIERS.reduce((s, t) => s + (B.gacha.rates[t] || 0), 0);
if (Math.abs(rateSum - 1) > 1e-9) errors.push(`balance.gacha.rates must sum to 1 (got ${rateSum})`);
for (const t of TIERS) {
  if (!(B.stats.rarityMult[t] > 0)) errors.push(`balance.stats.rarityMult.${t} missing`);
  if (!(B.leader.tierMult[t] > 0)) errors.push(`balance.leader.tierMult.${t} missing`);
  if (!(B.stats.dupeRefundRyo[t] >= 0)) errors.push(`balance.stats.dupeRefundRyo.${t} missing`);
}
const curveSpecs = [];
(function walk(obj, path) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (typeof v.type === 'string' && ['linear', 'poly', 'exp', 'step'].includes(v.type)) curveSpecs.push([path + k, v]);
      else walk(v, path + k + '.');
    }
  }
})(B, '');
for (const [p, spec] of curveSpecs) {
  for (const x of [0, 1, 10, 50, 90]) {
    const v = curve(spec, x);
    if (!Number.isFinite(v)) errors.push(`balance.${p}: curve gives ${v} at x=${x}`);
  }
}
const lastNode = CONTENT.nodes[CONTENT.nodes.length - 1];
const lastLevel = curve(B.enemyScaling.levelByNode, lastNode.globalIndex);
if (lastLevel > B.stats.levelCap) errors.push(`enemy level at the last node (${lastLevel}) exceeds levelCap ${B.stats.levelCap}`);
const headroom = curve(B.enemyScaling.levelByNode, 89);
if (headroom > B.stats.levelCap) errors.push(`enemy level at node 90 (${headroom}) exceeds levelCap — no headroom for ~90 nodes`);

// ---- tutorial --------------------------------------------------------------
for (const n of CONTENT.tutorial?.nodes || []) {
  if (n.startChakra != null && !(typeof B.tutorial?.[n.startChakra] === 'number')) errors.push(`tutorial ${n.id}: startChakra "${n.startChakra}" is not a number in balance.tutorial`);
}
if (!(B.tutorial?.enemyLevel >= 1)) errors.push('balance.tutorial.enemyLevel must be at least 1');

// ---- achievements (numbers in balance.achievements) ---------------------------
const NEEDS_TARGET = ['hardClears', 'ownCount', 'stat', 'rushRound', 'summons', 'dailies'];
for (const a of CONTENT.achievements || []) {
  const cfg = B.achievements?.list?.[a.id];
  if (!cfg) { errors.push(`balance.achievements.list.${a.id} is missing (every achievement needs its target and reward there)`); continue; }
  if (NEEDS_TARGET.includes(a.type) && !(Number.isInteger(cfg.target) && cfg.target > 0)) errors.push(`balance.achievements.list.${a.id}.target must be a positive whole number`);
  const r = cfg.reward || {};
  if (!Object.keys(r).length && !a.rewardCharacter) errors.push(`balance.achievements.list.${a.id} has no reward`);
  for (const [k, v] of Object.entries(r)) {
    if (!['ryo', 'scrolls', 'tickets', 'rareTickets'].includes(k)) errors.push(`balance.achievements.list.${a.id}.reward.${k} is not a reward type (ryo, scrolls, tickets, rareTickets)`);
    else if (!(Number.isInteger(v) && v > 0)) errors.push(`balance.achievements.list.${a.id}.reward.${k} must be a positive whole number`);
  }
}
for (const id of Object.keys(B.achievements?.list || {})) if (!CONTENT.achievement[id]) errors.push(`balance.achievements.list.${id} has no achievement in js/content/achievements.js`);
if (!TIERS.includes(B.achievements?.rareTicketMinTier)) errors.push('balance.achievements.rareTicketMinTier must be a tier');

// ---- version ----------------------------------------------------------------
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
if (pkg.version !== GAME_VERSION) errors.push(`package.json version ${pkg.version} does not match js/config/version.js GAME_VERSION ${GAME_VERSION}`);

// ---- the installable app: manifest, icons, service worker, index.html tags -------
{
  const root = new URL('../', import.meta.url);
  const read = (p) => readFileSync(new URL(p, root));
  let manifest = null;
  try { manifest = JSON.parse(read('manifest.webmanifest').toString('utf8')); } catch (e) { errors.push(`manifest.webmanifest: ${e.message}`); }
  if (manifest) {
    for (const k of ['name', 'short_name', 'start_url', 'scope', 'display', 'background_color', 'theme_color', 'icons']) if (!manifest[k]) errors.push(`manifest.webmanifest: missing "${k}"`);
    if (manifest.short_name && manifest.short_name.length > 12) errors.push(`manifest.webmanifest: short_name "${manifest.short_name}" is longer than 12 characters (it sits under the home-screen icon)`);
    if (manifest.display !== 'standalone') errors.push('manifest.webmanifest: display must be "standalone" (no browser bars once installed)');
    if (manifest.start_url && /^[/h]/.test(manifest.start_url)) errors.push(`manifest.webmanifest: start_url "${manifest.start_url}" must be relative (the game lives under /shinobi-auto-battler/ on Pages and / locally)`);
    if (manifest.scope && /^[/h]/.test(manifest.scope)) errors.push(`manifest.webmanifest: scope "${manifest.scope}" must be relative`);
    if (manifest.orientation && /portrait|landscape/.test(manifest.orientation)) errors.push('manifest.webmanifest: do not lock the orientation (the game has a landscape layout)');
    const html = read('index.html').toString('utf8');
    const theme = html.match(/<meta name="theme-color" content="([^"]+)"/)?.[1];
    if (theme !== manifest.theme_color) errors.push(`index.html theme-color ${theme} does not match manifest theme_color ${manifest.theme_color}`);
    if (!/<link rel="manifest" href="manifest.webmanifest">/.test(html)) errors.push('index.html does not link manifest.webmanifest');
    if (!/<link rel="apple-touch-icon" href="icons\/apple-touch-icon.png">/.test(html)) errors.push('index.html has no apple-touch-icon');
    // Every icon exists, is a PNG, and is the size it claims (IHDR).
    const pngSize = (buf) => (buf.length > 24 && buf.toString('latin1', 1, 4) === 'PNG') ? `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}` : null;
    const have = new Set();
    for (const ic of manifest.icons || []) {
      let buf = null;
      try { buf = read(ic.src); } catch { errors.push(`manifest icon ${ic.src} is missing`); continue; }
      const size = pngSize(buf);
      if (!size) errors.push(`manifest icon ${ic.src} is not a PNG`);
      else if (size !== ic.sizes) errors.push(`manifest icon ${ic.src} is ${size}, manifest says ${ic.sizes}`);
      have.add(`${ic.sizes}:${ic.purpose || 'any'}`);
    }
    for (const need of ['192x192:any', '512x512:any', '512x512:maskable']) if (!have.has(need)) errors.push(`manifest.webmanifest: no ${need.replace(':', ' ')} icon`);
    try { if (pngSize(read('icons/apple-touch-icon.png')) !== '180x180') errors.push('icons/apple-touch-icon.png is not 180x180'); } catch { errors.push('icons/apple-touch-icon.png is missing'); }
    try { const sw = read('sw.js').toString('utf8'); if (!/skipWaiting/.test(sw) || !/clients\.claim/.test(sw)) errors.push('sw.js must skipWaiting and clients.claim (updates must never get stuck)'); } catch { errors.push('sw.js is missing'); }
  }
}

// ---- wiki (pages, guide links, config placeholders) ---------------------------
const wiki = checkWiki();
errors.push(...wiki.errors);

// ---- report ----------------------------------------------------------------
const C = CONTENT;
const byTier = Object.fromEntries(TIERS.map(t => [t, C.roster.filter(c => c.tier === t).length]));
console.log('Shinobi Auto-Battler — content validation');
console.log(`  characters: ${C.roster.length} (${TIERS.map(t => `${t} ${byTier[t]}`).join(', ')}), forms: ${C.roster.filter(c => c.formOf).length}`);
console.log(`  achievements: ${C.achievements.length}   tutorial lessons: ${C.tutorial?.nodes.length || 0}`);
console.log(`  enemies: ${C.enemies.length}   arcs: ${C.arcs.filter(a => !a.placeholder).length} (+${C.arcs.filter(a => a.placeholder).length} placeholders)   nodes: ${C.nodes.length}   banners: ${C.banners.length}`);
console.log(`  balance curves checked: ${curveSpecs.length}   last node enemy level: ${lastLevel} / cap ${B.stats.levelCap} (node 90 → ${headroom})`);
const unsourced = missingNames();
if (unsourced.length) console.log(`  ⚠ ${unsourced.length} name(s) have no source in tools/naming-sources.mjs (NAMING.md): ${unsourced.join(', ')}`);
else console.log('  names: every in-game name has a recorded source (NAMING.md)');
console.log('  app: manifest.webmanifest, icons (192, 512, 512 maskable, 180 Apple) and sw.js check out');
console.log(`  wiki: ${wiki.pages} pages, ${wiki.guides} guides, ${wiki.links} guide links${wiki.errors.length ? ` — ${wiki.errors.length} problem(s)` : ': every page, link and config value checks out'}`);
if (errors.length) {
  console.log(`\nFAIL — ${errors.length} problem(s):`);
  for (const e of errors) console.log('  ✗ ' + e);
  process.exit(1);
}
console.log('\nPASS — all content entries valid.');

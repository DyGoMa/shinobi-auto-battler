// tools/validate.mjs — content schema check. `npm run validate`
// Checks every roster/enemy/arc/node/banner/boss-rush entry (required fields,
// valid natures/roles/types, valid references, no duplicate ids) plus a few
// balance.js sanity checks. Exits 1 on any error.
import { CONTENT, validateContent } from '../js/content/index.js';
import { BALANCE } from '../js/config/balance.js';
import { curve, TIERS } from '../js/core/formulas.js';
import { missingNames } from './naming.mjs';

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

// ---- report ----------------------------------------------------------------
const C = CONTENT;
const byTier = Object.fromEntries(TIERS.map(t => [t, C.roster.filter(c => c.tier === t).length]));
console.log('Shinobi Auto-Battler — content validation');
console.log(`  characters: ${C.roster.length} (${TIERS.map(t => `${t} ${byTier[t]}`).join(', ')}), forms: ${C.roster.filter(c => c.formOf).length}`);
console.log(`  enemies: ${C.enemies.length}   arcs: ${C.arcs.filter(a => !a.placeholder).length} (+${C.arcs.filter(a => a.placeholder).length} placeholders)   nodes: ${C.nodes.length}   banners: ${C.banners.length}`);
console.log(`  balance curves checked: ${curveSpecs.length}   last node enemy level: ${lastLevel} / cap ${B.stats.levelCap} (node 90 → ${headroom})`);
const unsourced = missingNames();
if (unsourced.length) console.log(`  ⚠ ${unsourced.length} name(s) have no source in tools/naming-sources.mjs (NAMING.md): ${unsourced.join(', ')}`);
else console.log('  names: every in-game name has a recorded source (NAMING.md)');
if (errors.length) {
  console.log(`\nFAIL — ${errors.length} problem(s):`);
  for (const e of errors) console.log('  ✗ ' + e);
  process.exit(1);
}
console.log('\nPASS — all content entries valid.');

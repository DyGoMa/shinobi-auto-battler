// tools/roster-audit.mjs — what each ninja adds to a team. `node tools/roster-audit.mjs`
// A fixed quartet (a Striker, a Tank, a Ranged and a second Striker) fights six story bosses
// across the game; every pullable ninja (forms included) takes the quartet slot of its own role
// (Supports take the second Striker's), at the same level and stars, no Leader. Natures are
// neutralised on everyone (the Nature Wheel is the player's choice per fight; this measures the
// kit: stats, role and Ultimate). Reported per role: win rate, the ninja's share of the team's
// damage, how often it fell, and the win rate against its tier's median, so a weak or an
// overpowered kit stands out. AUDIT_N battles per boss (default 60); AUDIT_LEVEL_OFFSET levels
// above the boss (default 2); AUDIT_ONLY=id,id for a few ninja.
import { C, B, runNode, playerSpecs, seedFor, pct, median } from './common.mjs';
import { nodeEnemyLevel } from '../js/core/Progression.js';

const N = Number(process.env.AUDIT_N) || 60;
const OFFSET = Number(process.env.AUDIT_LEVEL_OFFSET ?? 2);
const STARS = 2;
const QUARTET = { Striker: 'kakashi', Tank: 'gaara', Ranged: 'shikamaru', Support: 'naruto' };   // a Support takes the second Striker's place
const NODES = ['n_waves_5', 'n_chunin_5', 'n_kaz_5', 'n_hidan_4', 'n_pain_5', 'n_kaguya_2'];
const only = process.env.AUDIT_ONLY ? new Set(process.env.AUDIT_ONLY.split(',')) : null;

const neutral = (specs) => specs.map(s => ({ ...s, natures: [] }));
function measure(id) {
  let wins = 0, share = 0, died = 0, n = 0;
  const members = Object.values(QUARTET).map(m => (id && m === QUARTET[C.char[id].role]) ? id : m);
  for (const nid of NODES) {
    const node = C.node[nid];
    if ((node.team?.forced || []).length) continue;
    const level = nodeEnemyLevel(node, B) + OFFSET;
    const team = { members, leader: null };
    const owned = Object.fromEntries(members.map(m => [m, { level, stars: STARS }]));
    const specs = neutral(playerSpecs(team, owned, node));
    for (let i = 0; i < N; i++) {
      const r = runNode(node, team, owned, seedFor('audit:' + nid, i), { specsOverride: specs });
      n++;
      if (r.state === 'won') wins++;
      const u = r.sim.units.find(x => x.key === (id || QUARTET.Support));
      const total = Object.values(r.sim.stats.damageByUnit).reduce((a, b) => a + b, 0) || 1;
      share += (r.sim.stats.damageByUnit[u.uid] || 0) / total;
      if (!u.alive) died++;
    }
  }
  return { win: wins / n, share: share / n, died: died / n };
}

console.log(`Roster audit: quartet ${Object.values(QUARTET).map(t => C.char[t].short).join(' + ')}; each ninja takes its role's slot (a Support takes ${C.char[QUARTET.Support].short}'s), no Leader, Lv boss+${OFFSET}, ${STARS}★, natures neutral; ${N} battles × ${NODES.length} bosses`);
const base = measure(null);
console.log(`The quartet as it is: ${pct(base.win)}\n`);
const rows = [];
for (const c of C.roster) { if (only && !only.has(c.id)) continue; rows.push({ c, ...measure(c.id) }); }
const TIERS = ['genin', 'chunin', 'jonin', 'kage'];
const byTier = {}; for (const r of rows) (byTier[r.c.tier] ||= []).push(r.win);
const tierMed = Object.fromEntries(Object.entries(byTier).map(([t, v]) => [t, median(v)]));
const roleMed = {}; for (const r of rows) (roleMed[r.c.role] ||= []).push(r.win);
console.log('Tier medians: ' + TIERS.filter(t => tierMed[t] != null).map(t => `${t} ${pct(tierMed[t])}`).join('  ') + '   Role medians: ' + Object.entries(roleMed).map(([t, v]) => `${t} ${pct(median(v))}`).join('  '));
for (const role of ['Tank', 'Striker', 'Ranged', 'Support']) {
  const list = rows.filter(x => x.c.role === role);
  if (!list.length) continue;
  console.log(`\n${role} (in ${C.char[QUARTET[role]].short}'s slot)`);
  console.log('  ' + 'ninja'.padEnd(20) + 'tier'.padEnd(8) + 'win'.padEnd(7) + 'vs tier'.padEnd(9) + 'dmg share'.padEnd(11) + 'fell'.padEnd(7) + 'ult');
  for (const r of list.sort((a, b) => (a.c.tier === b.c.tier ? b.win - a.win : TIERS.indexOf(a.c.tier) - TIERS.indexOf(b.c.tier)))) {
    const d = r.win - tierMed[r.c.tier];
    const flag = Math.abs(d) >= 0.08 ? (d > 0 ? ' ▲' : ' ▼') : '';
    console.log('  ' + r.c.id.padEnd(20) + r.c.tier.padEnd(8) + pct(r.win).padEnd(7) + ((d >= 0 ? '+' : '') + (100 * d).toFixed(0) + flag).padEnd(9) + pct(r.share).padEnd(11) + pct(r.died).padEnd(7) + `${r.c.ult.type}${r.c.ult.stun ? '+stun' : ''} ${r.c.ult.name}`);
  }
}

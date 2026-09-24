// tools/test-core.mjs — fast regression checks for saves, gacha and objectives.
// `npm run test:core` (also part of `npm test`).
import { C, B } from './common.mjs';
import { migrate, defaultState, encodeSave, decodeSave, SAVE_VERSION } from '../js/core/SaveManager.js';
import { pull } from '../js/core/GachaSystem.js';
import { makeRng, curve } from '../js/core/formulas.js';
import { completeNode, resolveTeam, levelUp, canLevelUp, nodeBattleConfig } from '../js/core/Progression.js';
import { BattleSim } from '../js/core/BattleSim.js';

let fails = 0, passes = 0;
const ok = (cond, name) => { if (cond) passes++; else { fails++; console.log('  ✗ ' + name); } };

// ---- saves -----------------------------------------------------------------
const fresh = defaultState(C, B);
ok(fresh.saveVersion === SAVE_VERSION, 'fresh save has current version');
ok(fresh.currencies.scrolls === B.economy.start.scrolls && fresh.currencies.ryo === B.economy.start.ryo, 'starting currencies from balance.js');
ok(['naruto', 'sakura', 'sasuke', 'kakashi'].every(id => fresh.roster[id]), 'starter roster: Naruto, Sakura, Sasuke, Kakashi');
ok(fresh.team.leader === 'kakashi' && fresh.team.members.length === 3, 'Kakashi starts as Leader');
ok(migrate(null, C, B).saveVersion === SAVE_VERSION, 'missing save -> fresh');
ok(migrate('garbage', C, B).currencies.scrolls === B.economy.start.scrolls, 'corrupted (string) save -> fresh');
ok(migrate([1, 2, 3], C, B).roster.naruto, 'corrupted (array) save -> fresh');
const old = migrate({ currencies: { scrolls: '12x', ryo: -5 }, roster: { naruto: { level: 999, stars: 9 }, bogus: 3 }, team: { members: ['nope'] } }, C, B);
ok(old.saveVersion === SAVE_VERSION, 'v0 save migrated to current version');
ok(old.currencies.scrolls === B.economy.start.scrolls && old.currencies.ryo === 0, 'bad currency values sanitized');
ok(old.roster.naruto.level === B.stats.levelCap && old.roster.naruto.stars === B.stats.starCap, 'levels/stars clamped');
ok(!old.roster.bogus && old.roster.sakura, 'junk roster entries dropped, starters restored');
ok(old.team.members.length > 0, 'invalid team replaced with starter team');
const round = decodeSave(encodeSave(fresh));
ok(JSON.stringify(round) === JSON.stringify(fresh), 'export/import base64 round-trip');
const uni = defaultState(C, B); uni.note = '忍者 ⚡ ü';
ok(decodeSave(encodeSave(uni)).note === uni.note, 'unicode survives export/import');

// ---- gacha -----------------------------------------------------------------
{
  const s = defaultState(C, B); s.currencies.scrolls = 1e9;
  const rng = makeRng(42);
  let sinceKage = 0, maxGap = 0, tenOk = true, kages = 0;
  for (let i = 0; i < 300; i++) {
    const r = pull(s, 'standard', 10, C, rng, B);
    if (!r.results.some(x => ['jonin', 'kage'].includes(x.tier))) tenOk = false;
    for (const x of r.results) { if (x.tier === 'kage') { kages++; maxGap = Math.max(maxGap, sinceKage + 1); sinceKage = 0; } else sinceKage++; }
  }
  ok(tenOk, 'every 10-pull has a Jonin or better');
  ok(maxGap <= B.gacha.pity, `pity: Kage at least every ${B.gacha.pity} pulls (max gap ${maxGap})`);
  const rate = kages / 3000;
  ok(rate > 0.02 && rate < 0.06, `Kage rate incl. pity is sane (${(rate * 100).toFixed(1)}%)`);
  const poor = defaultState(C, B); poor.currencies.scrolls = 50;
  ok(!pull(poor, 'standard', 1, C, rng, B).ok && poor.currencies.scrolls === 50, 'cannot pull without scrolls');
  const locked = pull(defaultState(C, B), 'banner_sasuke', 1, C, rng, B);
  ok(!locked.ok, 'locked arc banner refuses pulls');
  const s2 = defaultState(C, B); s2.currencies.scrolls = 1e7;
  for (let i = 0; i < 400; i++) pull(s2, 'standard', 10, C, rng, B);
  ok(Object.values(s2.roster).every(o => o.stars <= B.stats.starCap), 'stars never exceed the cap');
  ok(s2.currencies.ryo > B.economy.start.ryo, 'duplicates past 5★ refund Ryo');
  ok(!s2.roster.zabuza, 'villains do not drop before their arc is cleared');
}

// ---- progression / objectives ------------------------------------------------
{
  const s = defaultState(C, B);
  const r = completeNode(s, C.node.n_bell_1, true, C, B, { time: 30 });
  ok(r.firstClear && r.scrolls > 0 && r.ryo > 0, 'first clear pays scrolls + Ryo');
  const r2 = completeNode(s, C.node.n_bell_1, true, C, B, { time: 30 });
  ok(!r2.firstClear && r2.ryo > 0 && r2.scrolls < r.scrolls, 'replay pays less');
  completeNode(s, C.node.n_bell_2, true, C, B); const r3 = completeNode(s, C.node.n_bell_3, true, C, B);
  ok(r3.arcCleared === 'arc_belltest', 'arc clear bonus fires on the last node');
  const t = resolveTeam(s, C.node.n_bell_1, C);
  ok(t.leader === null && !t.members.includes('kakashi') && ['naruto', 'sakura', 'sasuke'].every(id => t.members.includes(id)), 'Bell Test: forced Team 7, no leader, Kakashi benched');
  const hz = resolveTeam(s, C.node.n_crush_3, C);
  ok(hz.members.includes('hiruzen') && hz.leader === 'hiruzen', 'forced loaner Leader (Third Hokage) joins even if not owned');
  const before = s.currencies.ryo; const lu = levelUp(s, 'naruto', B);
  ok(lu.ok && s.currencies.ryo === before - lu.cost && s.roster.naruto.level === 2, 'level-up spends Ryo');
  s.roster.kakashi.level = 30; s.currencies.ryo = 1e6;
  ok(canLevelUp(s, 'sakura', B).discounted, 'catch-up discount applies to far-behind ninja');
  // survive objective: a team that cannot win still "wins" by surviving
  const node = { ...C.node.n_bell_1, objective: { type: 'survive', seconds: 5 } };
  const cfg = nodeBattleConfig(defaultState(C, B), node, C, B, { seed: 7 });
  const sim = new BattleSim({ ...cfg, recordEvents: false });
  ok(sim.runToEnd({ ultMode: 'none' }) === 'won' && sim.endReason === 'survived', 'survive objective wins on the timer');
  // protect objective: losing the civilian loses the battle
  const pn = C.node.n_waves_1;
  const pc = nodeBattleConfig(defaultState(C, B), pn, C, B, { seed: 3 });
  const psim = new BattleSim({ ...pc, recordEvents: false });
  psim.units.find(u => u.protected).hp = 0;
  psim._tick(psim.tick);
  ok(psim.state === 'lost' && psim.endReason === 'protectFailed', 'protect objective fails when the escort falls');
  // curves
  ok(curve({ type: 'step', base: 1, table: [[10, 2], [20, 3]] }, 15) === 2, 'step curve');
  ok(curve({ type: 'exp', base: 2, growth: 2 }, 3) === 16, 'exp curve');
  ok(curve({ type: 'poly', base: 3, growth: 2 }, 4) === 48, 'poly curve');
  ok(curve({ type: 'linear', base: 1, growth: 2, cap: 5 }, 10) === 5, 'curve cap');
}

console.log(`${fails ? 'FAIL' : 'PASS'} — core tests: ${passes} passed, ${fails} failed.`);
process.exit(fails ? 1 : 0);

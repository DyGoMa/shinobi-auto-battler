// tools/sim.mjs — per-node battle win-rate tests. `npm run sim`
// 200 seeded battles per scenario (balance.targets.battlesPerScenario) with a
// bot that fires every Ultimate the moment it is ready. Prints a PASS/FAIL table.
//   1. Survival Test (n_bell_1) — starter team, level 1, NO ults: win >= targets.bellTestMinWin
//   2. Every arc boss (Part I and Part II; SIM_PARTS) — "on-curve" team: win within targets.bossWinRange
//   3. Boss Rush — Jonin-heavy team at the unlock level: median round in targets.bossRushRoundRange
//   4. Nature check — a countering team clearly beats a badly-countered one
// Extra (info only): fight length, seconds between ults, Jutsu Clash smart-bot gain.
import { C, B, runNode, onCurveTeam, runBossRush, availableBeforeArc, playerSpecs, pct, median, seedFor, SIM_PARTS } from './common.mjs';
import { autoPickTeam } from '../js/core/TeamPicker.js';

const N = Number(process.env.SIM_N) || B.targets.battlesPerScenario;
const T = B.targets;
const rows = [];
const info = [];
const natureInfo = [];
let allUltIntervals = [];
let bossTimes = [];

function add(name, value, target, pass, note = '') { rows.push({ name, value, target, pass, note }); }

// ---------------------------------------------------------------- 1. Survival Test
{
  const node = C.node['n_bell_1'];
  const team = { members: ['naruto', 'sakura', 'sasuke'], leader: null };
  const owned = { naruto: { level: 1, stars: 1 }, sakura: { level: 1, stars: 1 }, sasuke: { level: 1, stars: 1 } };
  let w = 0; const times = [];
  for (let i = 0; i < N; i++) { const r = runNode(node, team, owned, seedFor('bell', i), { ultsEnabled: false }); if (r.state === 'won') { w++; times.push(r.time); } }
  add('Survival Test (starter, Lv1, no ults)', pct(w / N), `>= ${pct(T.bellTestMinWin)}`, w / N >= T.bellTestMinWin, `median ${median(times).toFixed(0)}s`);
}

// ---------------------------------------------------------------- 2. Arc bosses
for (const arc of C.arcs.filter(a => !a.placeholder && SIM_PARTS.includes(a.part))) {
  const node = arc.nodes[arc.nodes.length - 1];
  const { team, owned, level } = onCurveTeam(node);
  let w = 0; const times = []; let smartW = 0;
  for (let i = 0; i < N; i++) {
    const r = runNode(node, team, owned, seedFor(node.id, i));
    if (r.state === 'won') { w++; times.push(r.time); }
    const n = r.sim.units.filter(u => u.side === 'player' && !u.protected).length;
    if (r.sim.stats.ults > 0) allUltIntervals.push((r.time * n) / r.sim.stats.ults);
    if (i < Math.min(N, 100)) { const s = runNode(node, team, owned, seedFor(node.id, i), { ultMode: 'smart' }); if (s.state === 'won') smartW++; }
  }
  const rate = w / N;
  bossTimes.push(...times);
  const [lo, hi] = T.bossWinRange;
  add(`Boss: ${arc.name} — ${node.name}`, pct(rate), `${pct(lo)}–${pct(hi)}`, rate >= lo && rate <= hi,
    `Lv${level} [${team.members.map(id => C.char[id].short + (id === team.leader ? '*' : '')).join(', ')}] med ${median(times).toFixed(0)}s`);
  info.push(`  ${arc.name.padEnd(40)} ASAP bot ${pct(rate)}  →  clash-aware bot ${pct(smartW / Math.min(N, 100))}`);
}

// ---------------------------------------------------------------- 3. Boss Rush
{
  const unlockArc = C.arc[C.bossRush.unlockArc];
  const avail = availableBeforeArc(unlockArc.arcIndex + 1);
  const BR = T.bossRushTeam;
  const cands = avail.map(c => ({ id: c.id, level: BR.level, stars: BR.stars }));
  const fakeNode = { enemies: C.bossRush.order.map(id => ({ id })), team: {} };
  const pick = autoPickTeam(cands, fakeNode, C, B, { tierMix: BR.tierMix });
  const team = { members: pick.all, leader: pick.leader };
  const owned = Object.fromEntries(cands.map(c => [c.id, { level: c.level, stars: c.stars }]));
  const rounds = [];
  const n = Math.min(N, 200);
  for (let i = 0; i < n; i++) rounds.push(runBossRush(team, owned, seedFor('rush', i)));
  const med = median(rounds);
  const [lo, hi] = T.bossRushRoundRange;
  const dist = {}; for (const r of rounds) dist[r] = (dist[r] || 0) + 1;
  add('Boss Rush (Jonin-heavy team)', `round ${med}`, `${lo}–${hi}`, med >= lo && med <= hi,
    `Lv${BR.level} [${team.members.map(id => C.char[id].short + (id === team.leader ? '*' : '')).join(', ')}] dist ${Object.entries(dist).map(([k, v]) => `${k}:${v}`).join(' ')}`);
}

// ---------------------------------------------------------------- 4. Nature check
{
  // Same on-curve team vs the Land of Waves boss (Water). One copy is re-typed
  // to Earth (beats Water), the other to Fire (beaten by Water).
  const node = C.node['n_waves_5'];
  const { team, owned } = onCurveTeam(node);
  const base = playerSpecs(team, owned, node);
  // keep >= 0: that slot stays neutral (Lightning), so 3 of 4 units are countered.
  const retype = (nat, keep = -1) => base.map((s, k) => ({ ...s, natures: [k === keep ? 'Lightning' : nat], taijutsu: false }));
  let good = 0, bad = 0;
  for (let i = 0; i < N; i++) {
    if (runNode(node, team, owned, seedFor('nat', i), { specsOverride: retype('Earth') }).state === 'won') good++;
    if (runNode(node, team, owned, seedFor('nat', i), { specsOverride: retype('Fire') }).state === 'won') bad++;
  }
  const gap = (good - bad) / N;
  add('Nature check (Earth vs Fire team, Water boss)', `${pct(good / N)} vs ${pct(bad / N)}`, `gap >= ${pct(T.natureCheckMinGap)}`, gap >= T.natureCheckMinGap, `gap ${pct(gap)}`);
  // Info (BALANCE.md §6): the same check with a neutral re-type (Lightning) and with the
  // clash-aware bot, which holds ults it would lose in a Jutsu Clash (like a player
  // reading the ▼ badge).
  // "3 of 4" rotates the neutral slot by seed so no single unit decides it.
  const rate = (nat, ultMode, partial = false) => { let w = 0; for (let i = 0; i < N; i++) if (runNode(node, team, owned, seedFor('nat', i), { specsOverride: retype(nat, partial ? i % 4 : -1), ultMode }).state === 'won') w++; return pct(w / N); };
  natureInfo.push(`  Nature check detail (targets: 3 of 4 countered 25–30%, fully countered 10–15%):`);
  natureInfo.push(`    fire-when-ready bot: counter ${pct(good / N)}  neutral ${rate('Lightning', 'asap')}  3 of 4 countered ${rate('Fire', 'asap', true)}  fully countered ${pct(bad / N)}`);
  natureInfo.push(`    clash-aware bot:     counter ${rate('Earth', 'smart')}  neutral ${rate('Lightning', 'smart')}  3 of 4 countered ${rate('Fire', 'smart', true)}  fully countered ${rate('Fire', 'smart')}`);
}

// ---------------------------------------------------------------- 5. Fight length
const ultInt = median(allUltIntervals);
const fight = median(bossTimes);
add('Boss fight length (median of wins)', fight.toFixed(1) + 's', T.fightLengthRange[0] + '–' + T.fightLengthRange[1] + 's', fight >= T.fightLengthRange[0] && fight <= T.fightLengthRange[1], 'all arc bosses');

// ---------------------------------------------------------------- report
console.log(`\nShinobi Auto-Battler — battle sims (${N} seeded battles per scenario, ult bot = fire when ready)\n`);
const w1 = Math.max(...rows.map(r => r.name.length)) + 2;
console.log('  ' + 'Scenario'.padEnd(w1) + 'Result'.padEnd(16) + 'Target'.padEnd(14) + 'Status  Notes');
console.log('  ' + '-'.repeat(w1 + 16 + 14 + 14));
for (const r of rows) console.log('  ' + r.name.padEnd(w1) + String(r.value).padEnd(16) + String(r.target).padEnd(14) + (r.pass ? 'PASS  ' : 'FAIL  ') + '  ' + r.note);
console.log('\nInfo:');
console.log(`  Median seconds between ults per unit: ${ultInt.toFixed(1)}s   (target ~10–15s)`);
for (const l of natureInfo) console.log(l);
console.log('  Jutsu Clash — same teams, bot that clashes on purpose:');
for (const l of info) console.log(l);
const failed = rows.filter(r => !r.pass).length;
console.log(`\n${failed ? 'FAIL' : 'PASS'} — ${rows.length - failed}/${rows.length} scenarios on target.`);
process.exit(failed ? 1 : 0);

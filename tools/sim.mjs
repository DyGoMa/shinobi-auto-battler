// tools/sim.mjs — per-node battle win-rate tests. `npm run sim`
// 200 seeded battles per scenario (balance.targets.battlesPerScenario) with the
// clash-aware bot (same one the in-game 🤖 Auto-ult uses: it fires counter-nature
// units into wind-ups and holds units that would be Overwhelmed). SIM_BOT=asap
// switches every scenario to the fire-when-ready bot instead, for comparison
// only. Prints a PASS/FAIL table.
//   1. Survival Test (n_bell_1) — starter team, level 1, NO ults: win >= targets.bellTestMinWin
//   2. Every arc boss (Part I and Part II; SIM_PARTS) — "on-curve" team: win within targets.bossWinRange
//   3. Boss Rush — Jonin-heavy team at the unlock level: median round in targets.bossRushRoundRange
//   4. Nature check — a countering team clearly beats a badly-countered one
//   5. Counter-gap scenario (targets.counterGapNode) — 3-of-4 / fully countered win rates
// Extra (info only): fight length, seconds between ults.
import { C, B, DEFAULT_BOT, runNode, onCurveTeam, runBossRush, availableBeforeArc, playerSpecs, pct, median, seedFor, SIM_PARTS } from './common.mjs';
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
  let w = 0; const times = []; let asapW = 0;
  for (let i = 0; i < N; i++) {
    const r = runNode(node, team, owned, seedFor(node.id, i));
    if (r.state === 'won') { w++; times.push(r.time); }
    const n = r.sim.units.filter(u => u.side === 'player' && !u.protected).length;
    if (r.sim.stats.ults > 0) allUltIntervals.push((r.time * n) / r.sim.stats.ults);
    if (i < Math.min(N, 100)) { const s = runNode(node, team, owned, seedFor(node.id, i), { ultMode: 'asap' }); if (s.state === 'won') asapW++; }
  }
  const rate = w / N;
  bossTimes.push(...times);
  const [lo, hi] = T.bossWinRange;
  add(`Boss: ${arc.name} — ${node.name}`, pct(rate), `${pct(lo)}–${pct(hi)}`, rate >= lo && rate <= hi,
    `Lv${level} [${team.members.map(id => C.char[id].short + (id === team.leader ? '*' : '')).join(', ')}] med ${median(times).toFixed(0)}s`);
  info.push(`  ${arc.name.padEnd(40)} clash-aware bot ${pct(rate)}  →  ASAP bot ${pct(asapW / Math.min(N, 100))}`);
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

// ---------------------------------------------------------------- 4. Nature check / Counter-gap scenario
// The counter-gap fight (targets.counterGapNode, at targets.counterGapLevelOffset):
// a neutral on-curve team wins ~60% here, so "countered" and "counters" numbers
// mean something (Session 3 measured at a node where a neutral team already won
// ~25%, which made the bands meaningless). Same on-curve team, re-typed: Earth
// beats the boss's Water, Fire is beaten by it, Lightning is neutral.
{
  const node = C.node[T.counterGapNode];
  const { team, owned } = onCurveTeam(node, { levelOffset: T.counterGapLevelOffset });
  const base = playerSpecs(team, owned, node);
  // keep >= 0: that slot stays neutral (Lightning), so 3 of 4 units are countered.
  const retype = (nat, keep = -1) => base.map((s, k) => ({ ...s, natures: [k === keep ? 'Lightning' : nat], taijutsu: false }));
  // The 3-of-4/fully bands are narrow (5 points), so this scenario needs more
  // samples than the default N to avoid flaky pass/fail.
  const NG = Math.max(N, 600);
  const rate = (nat, ultMode, partial = false) => { let w = 0; for (let i = 0; i < NG; i++) if (runNode(node, team, owned, seedFor('nat', i), { specsOverride: retype(nat, partial ? i % 4 : -1), ultMode }).state === 'won') w++; return w / NG; };

  const good = rate('Earth', DEFAULT_BOT);
  const bad = rate('Fire', DEFAULT_BOT);
  const gap = good - bad;
  add('Nature check (Earth vs Fire team, Water boss)', `${pct(good)} vs ${pct(bad)}`, `gap >= ${pct(T.natureCheckMinGap)}`, gap >= T.natureCheckMinGap, `gap ${pct(gap)}`);

  const neutral = rate('Lightning', DEFAULT_BOT);
  const of4 = rate('Fire', DEFAULT_BOT, true);
  const [of4Lo, of4Hi] = T.counterGap3of4Range;
  const [fullyLo, fullyHi] = T.counterGapFullyRange;
  add('Counter-gap: 3 of 4 countered', pct(of4), `${pct(of4Lo)}–${pct(of4Hi)}`, of4 >= of4Lo && of4 <= of4Hi, `neutral baseline ${pct(neutral)}`);
  add('Counter-gap: fully countered', pct(bad), `${pct(fullyLo)}–${pct(fullyHi)}`, bad >= fullyLo && bad <= fullyHi, `counter team ${pct(good)}`);

  // Info: the same check with the fire-when-ready bot, for comparison.
  natureInfo.push(`  Counter-gap scenario: ${node.name} (${node.id}), on-curve +${T.counterGapLevelOffset} levels (neutral ~60% baseline)`);
  natureInfo.push(`    clash-aware bot:     counter ${pct(good)}  neutral ${pct(neutral)}  3 of 4 countered ${pct(of4)}  fully countered ${pct(bad)}`);
  natureInfo.push(`    fire-when-ready bot: counter ${pct(rate('Earth', 'asap'))}  neutral ${pct(rate('Lightning', 'asap'))}  3 of 4 countered ${pct(rate('Fire', 'asap', true))}  fully countered ${pct(rate('Fire', 'asap'))}`);
}

// ---------------------------------------------------------------- 5. Fight length
const ultInt = median(allUltIntervals);
const fight = median(bossTimes);
add('Boss fight length (median of wins)', fight.toFixed(1) + 's', T.fightLengthRange[0] + '–' + T.fightLengthRange[1] + 's', fight >= T.fightLengthRange[0] && fight <= T.fightLengthRange[1], 'all arc bosses');

// ---------------------------------------------------------------- report
console.log(`\nShinobi Auto-Battler — battle sims (${N} seeded battles per scenario, ult bot = ${DEFAULT_BOT === 'asap' ? 'fire when ready (SIM_BOT=asap)' : 'clash-aware, same as in-game 🤖 Auto-ult'})\n`);
const w1 = Math.max(...rows.map(r => r.name.length)) + 2;
console.log('  ' + 'Scenario'.padEnd(w1) + 'Result'.padEnd(16) + 'Target'.padEnd(14) + 'Status  Notes');
console.log('  ' + '-'.repeat(w1 + 16 + 14 + 14));
for (const r of rows) console.log('  ' + r.name.padEnd(w1) + String(r.value).padEnd(16) + String(r.target).padEnd(14) + (r.pass ? 'PASS  ' : 'FAIL  ') + '  ' + r.note);
console.log('\nInfo:');
console.log(`  Median seconds between ults per unit: ${ultInt.toFixed(1)}s   (target ~10–15s)`);
for (const l of natureInfo) console.log(l);
console.log('  Jutsu Clash — same teams, fire-when-ready bot for comparison:');
for (const l of info) console.log(l);
const failed = rows.filter(r => !r.pass).length;
console.log(`\n${failed ? 'FAIL' : 'PASS'} — ${rows.length - failed}/${rows.length} scenarios on target.`);
process.exit(failed ? 1 : 0);

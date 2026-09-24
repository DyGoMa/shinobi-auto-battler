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
//   5. Counter-gap scenario (targets.counterGapNode) — neutral / 3-of-4 / fully countered win rates
//   6. Hard mode — every arc boss on Hard (Hard on-curve team) in targets.bossWinRange,
//      and the counter-gap scenario on Hard in the same three bands
// Extra (info only): fight length, seconds between ults, and the Daily challenge:
// each twist's chance to be cleared within daily.attemptsPerDay tries.
import { C, B, DEFAULT_BOT, runNode, onCurveTeam, runBossRush, availableBeforeArc, playerSpecs, pct, median, seedFor, SIM_PARTS } from './common.mjs';
import { autoPickTeam } from '../js/core/TeamPicker.js';
import { nodeEnemyLevel } from '../js/core/Progression.js';
import { dailyFor, dailyBattleConfig, dailyContent, dailyTeamNode, TWIST_TEXT } from '../js/core/Daily.js';
import { BattleSim } from '../js/core/BattleSim.js';

const N = Number(process.env.SIM_N) || B.targets.battlesPerScenario;
const T = B.targets;
const rows = [];
const info = [];
const natureInfo = [];
const hardInfo = [];
const dailyInfo = [];
let allUltIntervals = [];
let bossTimes = [];
const hardTimes = [];

function add(name, value, target, pass, note = '') { rows.push({ name, value, target, pass, note }); }
const teamLabel = (team) => team.members.map(id => C.char[id].short + (id === team.leader ? '*' : '')).join(', ');

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
// hard: the same fights on Hard mode, with the Hard on-curve team (everyone unlocked
// by the end of the part, starred up, at the Hard level; targets.hardMode.onCurve).
function bossRows({ hard = false } = {}) {
  for (const arc of C.arcs.filter(a => !a.placeholder && SIM_PARTS.includes(a.part))) {
    const node = arc.nodes[arc.nodes.length - 1];
    const { team, owned, level } = onCurveTeam(node, { hard });
    let w = 0; const times = []; let asapW = 0;
    for (let i = 0; i < N; i++) {
      const r = runNode(node, team, owned, seedFor(node.id, i), { hard });
      if (r.state === 'won') { w++; times.push(r.time); }
      if (hard) continue;
      const n = r.sim.units.filter(u => u.side === 'player' && !u.protected).length;
      if (r.sim.stats.ults > 0) allUltIntervals.push((r.time * n) / r.sim.stats.ults);
      if (i < Math.min(N, 100)) { const s = runNode(node, team, owned, seedFor(node.id, i), { ultMode: 'asap' }); if (s.state === 'won') asapW++; }
    }
    const rate = w / N;
    (hard ? hardTimes : bossTimes).push(...times);
    const [lo, hi] = T.bossWinRange;
    add(`${hard ? 'Hard boss' : 'Boss'}: ${arc.name} — ${node.name}`, pct(rate), `${pct(lo)}–${pct(hi)}`, rate >= lo && rate <= hi,
      `Lv${level} [${teamLabel(team)}] med ${median(times).toFixed(0)}s`);
    if (!hard) info.push(`  ${arc.name.padEnd(40)} clash-aware bot ${pct(rate)}  →  ASAP bot ${pct(asapW / Math.min(N, 100))}`);
  }
}
bossRows();

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
    `Lv${BR.level} [${teamLabel(team)}] dist ${Object.entries(dist).map(([k, v]) => `${k}:${v}`).join(' ')}`);
}

// ---------------------------------------------------------------- 4. Nature check / Counter-gap scenario
// The counter-gap fight (targets.counterGapNode, at targets.counterGapLevelOffset):
// a neutral on-curve team wins ~60% here, so "countered" and "counters" numbers
// mean something (Session 3 measured at a node where a neutral team already won
// ~25%, which made the bands meaningless). Same on-curve team, re-typed: Earth
// beats the boss's Water, Fire is beaten by it, Lightning is neutral.
//
// Hard runs the same fight on Hard (targets.hardMode.counterGapNode) with the SAME
// team, same members and Leader, starred up like a player who cleared the part
// (targets.hardMode.onCurve.stars), at the Hard level + targets.hardMode.counterGapLevelOffset.
// Holding the team fixed measures what Hard mode itself changes. The counter-gap
// depends on the team far more than on the mode: a healer-led team (the Hard on-curve
// pick, Tsunade leading) fights long, steady battles where being countered costs
// more, in the story as much as on Hard (BALANCE.md §6).
function counterGap({ hard = false } = {}) {
  const storyPick = onCurveTeam(C.node[T.counterGapNode], { levelOffset: T.counterGapLevelOffset });
  const node = C.node[hard ? T.hardMode.counterGapNode : T.counterGapNode];
  const team = storyPick.team;
  let { owned, level } = storyPick;
  if (hard) {
    level = nodeEnemyLevel(node, B, { hard: true }) + T.hardMode.counterGapLevelOffset;
    owned = Object.fromEntries(team.members.map(id => [id, { level, stars: T.hardMode.onCurve.stars[C.char[id].tier] ?? 1 }]));
  }
  const base = playerSpecs(team, owned, node, { hard });
  // keep >= 0: that slot stays neutral (Lightning), so 3 of 4 units are countered.
  const retype = (nat, keep = -1) => base.map((s, k) => ({ ...s, natures: [k === keep ? 'Lightning' : nat], taijutsu: false }));
  // The 3-of-4/fully bands are narrow (5 points), so this scenario needs more
  // samples than the default N to avoid flaky pass/fail.
  const NG = Math.max(N, 600);
  const rate = (nat, ultMode, partial = false) => { let w = 0; for (let i = 0; i < NG; i++) if (runNode(node, team, owned, seedFor('nat', i), { specsOverride: retype(nat, partial ? i % 4 : -1), ultMode, hard }).state === 'won') w++; return w / NG; };

  const label = hard ? 'Hard counter-gap' : 'Counter-gap';
  const good = rate('Earth', DEFAULT_BOT);
  const bad = rate('Fire', DEFAULT_BOT);
  const gap = good - bad;
  add(`${hard ? 'Hard nature check' : 'Nature check'} (Earth vs Fire team, Water boss)`, `${pct(good)} vs ${pct(bad)}`, `gap >= ${pct(T.natureCheckMinGap)}`, gap >= T.natureCheckMinGap, `gap ${pct(gap)}`);

  const neutral = rate('Lightning', DEFAULT_BOT);
  const of4 = rate('Fire', DEFAULT_BOT, true);
  const [nLo, nHi] = T.counterGapNeutralRange;
  const [of4Lo, of4Hi] = T.counterGap3of4Range;
  const [fullyLo, fullyHi] = T.counterGapFullyRange;
  add(`${label}: neutral baseline`, pct(neutral), `${pct(nLo)}–${pct(nHi)}`, neutral >= nLo && neutral <= nHi, `Lv${+level.toFixed(1)} [${teamLabel(team)}]`);
  add(`${label}: 3 of 4 countered`, pct(of4), `${pct(of4Lo)}–${pct(of4Hi)}`, of4 >= of4Lo && of4 <= of4Hi, `neutral baseline ${pct(neutral)}`);
  add(`${label}: fully countered`, pct(bad), `${pct(fullyLo)}–${pct(fullyHi)}`, bad >= fullyLo && bad <= fullyHi, `counter team ${pct(good)}`);

  const offset = hard ? T.hardMode.counterGapLevelOffset : T.counterGapLevelOffset;
  natureInfo.push(`  ${label} scenario: ${node.name} (${node.id})${hard ? ' on Hard, story scenario team starred up,' : ', on-curve'} +${offset} levels (neutral ~60% baseline)`);
  natureInfo.push(`    clash-aware bot:     counter ${pct(good)}  neutral ${pct(neutral)}  3 of 4 countered ${pct(of4)}  fully countered ${pct(bad)}`);
  // Info: the same check with the fire-when-ready bot, for comparison (story only).
  if (!hard) natureInfo.push(`    fire-when-ready bot: counter ${pct(rate('Earth', 'asap'))}  neutral ${pct(rate('Lightning', 'asap'))}  3 of 4 countered ${pct(rate('Fire', 'asap', true))}  fully countered ${pct(rate('Fire', 'asap'))}`);
}
counterGap();

// ---------------------------------------------------------------- 5. Fight length
const ultInt = median(allUltIntervals);
const fight = median(bossTimes);
add('Boss fight length (median of wins)', fight.toFixed(1) + 's', T.fightLengthRange[0] + '–' + T.fightLengthRange[1] + 's', fight >= T.fightLengthRange[0] && fight <= T.fightLengthRange[1], 'all arc bosses');

// ---------------------------------------------------------------- 6. Hard mode
bossRows({ hard: true });
counterGap({ hard: true });
hardInfo.push(`  Hard boss fight length (median of wins): ${median(hardTimes).toFixed(1)}s   (story ${fight.toFixed(1)}s)`);

// ---------------------------------------------------------------- 7. Daily challenge (info only)
// Same harness as the counter-gap scenario: the clash-aware bot (no Ultimates on a
// No Ultimates day). One player per arc from the Daily's unlock on: everything
// before that arc cleared, every ninja available by then at their story level (the
// on-curve stars and tier mix), and a team auto-picked for the day's fight the way
// the Team screen's ✨ Auto does it (by power only on a Countered day). For each
// twist, the first 2026 dates that roll it give the fights.
// Clear chance = 1 - (1 - win rate)^attemptsPerDay; ⚠ below targets.dailyMinClearChance.
{
  const DN = Math.min(N, 40);
  const tries = B.daily.attemptsPerDay;
  const unlock = C.arc[B.daily.unlockArc];
  const points = C.arcs.filter(a => !a.placeholder && SIM_PARTS.includes(a.part) && a.arcIndex > unlock.arcIndex).map(a => a.nodes[0]);
  const dateKey = (k) => new Date(Date.UTC(2026, 0, 1 + k)).toISOString().slice(0, 10);
  const byTwist = Object.fromEntries(B.daily.twists.map(t => [t.id, []]));
  const OC = T.onCurve;
  for (const at of points) {
    const level = nodeEnemyLevel(at, B);
    const cands = availableBeforeArc(at.arcIndex).map(c => ({ id: c.id, level, stars: OC.stars[c.tier] ?? 1 }));
    const owned = Object.fromEntries(cands.map(c => [c.id, { level: c.level, stars: c.stars }]));
    const cleared = Object.fromEntries(C.nodes.filter(n => n.globalIndex < at.globalIndex).map(n => [n.id, true]));
    const state = { roster: owned, team: { members: [], leader: null }, progress: { cleared, hard: {} } };
    const days = [];
    for (let k = 0; k < 366 && days.length < 2 * B.daily.twists.length; k++) {
      const d = dailyFor(state, C, B, dateKey(k));
      if (days.filter(x => x.twist.id === d.twist.id).length < 2) days.push(d);
    }
    for (const daily of days) {
      const tw = daily.twist;
      const pick = autoPickTeam(cands, dailyTeamNode(daily), dailyContent(daily, [], C, B), B, { tierMix: OC.tierMix, ...(tw.id === 'counteredOnly' ? { matchupWeight: 0 } : {}) });
      const team = { members: pick.all, leader: pick.leader };
      let w = 0;
      for (let i = 0; i < DN; i++) {
        let carry = null; let won = true;
        for (let r = 0; r < daily.rounds.length && won; r++) {
          const cfg = dailyBattleConfig(state, daily, r, C, B, { seed: seedFor(`daily:${at.id}:${daily.dateKey}`, i) + r, team, carry });
          const sim = new BattleSim({ ...cfg, recordEvents: false });
          won = sim.runToEnd({ ultMode: cfg.ultsEnabled ? DEFAULT_BOT : 'none' }) === 'won';
          carry = sim.playerCarry();
        }
        if (won) w++;
      }
      const p = w / DN;
      byTwist[tw.id].push({ at, daily, p, clear: 1 - Math.pow(1 - p, tries) });
    }
  }
  dailyInfo.push(`  Daily challenge: clear chance within ${tries} attempts (${DN} battles per fight; one player per arc from ${unlock.name} on, 2 days per twist)`);
  for (const [id, list] of Object.entries(byTwist)) {
    if (!list.length) continue;
    const worst = list.reduce((a, b) => (b.clear < a.clear ? b : a));
    const low = list.filter(x => x.clear < T.dailyMinClearChance).length;
    const tw = TWIST_TEXT[id];
    const bosses = worst.daily.rounds.map(n => C.enemy[(n.enemies.find(e => e.boss) || n.enemies[0]).id].name).join(' + ');
    const power = B.daily.twists.find(t => t.id === id).power ?? 1;
    dailyInfo.push(`    ${low ? '⚠' : ' '} ${(tw.icon + ' ' + tw.name).padEnd(18)} ×${power.toFixed(2)} power  median ${pct(median(list.map(x => x.clear)))}  win/attempt ${pct(median(list.map(x => x.p)))}  below ${pct(T.dailyMinClearChance)}: ${low}/${list.length}  worst ${pct(worst.clear)} (${C.arc[worst.at.arcId].name}: ${bosses}, Lv${worst.daily.level})`);
  }
}

// ---------------------------------------------------------------- report
console.log(`\nShinobi Auto-Battler — battle sims (${N} seeded battles per scenario, ult bot = ${DEFAULT_BOT === 'asap' ? 'fire when ready (SIM_BOT=asap)' : 'clash-aware, same as in-game 🤖 Auto-ult'})\n`);
const w1 = Math.max(...rows.map(r => r.name.length)) + 2;
console.log('  ' + 'Scenario'.padEnd(w1) + 'Result'.padEnd(16) + 'Target'.padEnd(14) + 'Status  Notes');
console.log('  ' + '-'.repeat(w1 + 16 + 14 + 14));
for (const r of rows) console.log('  ' + r.name.padEnd(w1) + String(r.value).padEnd(16) + String(r.target).padEnd(14) + (r.pass ? 'PASS  ' : 'FAIL  ') + '  ' + r.note);
console.log('\nInfo:');
console.log(`  Median seconds between ults per unit: ${ultInt.toFixed(1)}s   (target ~10–15s)`);
for (const l of natureInfo) console.log(l);
for (const l of hardInfo) console.log(l);
for (const l of dailyInfo) console.log(l);
console.log('  Jutsu Clash — same teams, fire-when-ready bot for comparison:');
for (const l of info) console.log(l);
const failed = rows.filter(r => !r.pass).length;
console.log(`\n${failed ? 'FAIL' : 'PASS'} — ${rows.length - failed}/${rows.length} scenarios on target.`);
process.exit(failed ? 1 : 0);

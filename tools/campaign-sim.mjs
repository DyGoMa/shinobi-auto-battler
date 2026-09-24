// tools/campaign-sim.mjs — a free-to-play player plays Part 1 in order. `npm run campaign`
// The bot:
//   * pulls whenever it can afford it (10-pulls first) on the current arc banner
//     (or Standard), exactly like a player would;
//   * picks its team for each node by power + Nature Wheel matchup (TeamPicker);
//   * spends all Ryo levelling that team (lowest level first);
//   * fires ults as soon as they're ready;
//   * when it loses, it REPLAYS the most recent cleared node for Ryo (max
//     balance.targets.campaignMaxReplaysPerNode replays per stuck node), then retries.
// Report: team level at each arc, pulls, stuck points, scroll/Ryo balance over time.
// Target: all of Part 1 cleared, no node needing more than the max replays.
// Runs CAMPAIGN_PLAYERS (default 10) seeds; prints the first in detail.
import { C, B, runNode, teamForNode, median, seedFor } from './common.mjs';
import { defaultState } from '../js/core/SaveManager.js';
import { pull, canAfford } from '../js/core/GachaSystem.js';
import { completeNode, canLevelUp, levelUp, isBannerUnlocked, ownedOrLoaner } from '../js/core/Progression.js';
import { autoPickTeam } from '../js/core/TeamPicker.js';
import { makeRng, enemyLevelForNode } from '../js/core/formulas.js';

const PLAYERS = Number(process.env.CAMPAIGN_PLAYERS) || 10;
const MAX_REPLAYS = B.targets.campaignMaxReplaysPerNode;
const HARD_CAP = 12; // give up on a node after this many replays (reported as FAIL)

function playCampaign(playerSeed, verbose) {
  const state = defaultState(C, B);
  const rng = makeRng(playerSeed);
  const nodes = C.nodes.filter(n => n.part === 1);
  const log = { arcs: [], stuck: [], fails: [], timeline: [], battles: 0, replays: 0 };
  let battleSeed = playerSeed * 7919;

  const spendScrolls = (node) => {
    const arcBanner = C.banners.find(b => b.type === 'arc' && b.arc === node.arcId && isBannerUnlocked(state, b, C));
    const banner = arcBanner || C.banner.standard;
    let guard = 0;
    while (guard++ < 50 && canAfford(state, 10, B)) pull(state, banner.id, 10, C, rng, B);
    while (guard++ < 100 && canAfford(state, 1, B)) pull(state, banner.id, 1, C, rng, B);
  };
  const pickTeam = (node) => {
    const cands = Object.entries(state.roster).map(([id, o]) => ({ id, level: o.level, stars: o.stars }));
    const pick = autoPickTeam(cands, node, C, B);
    return teamForNode(node, pick);
  };
  const levelTeam = (team) => {
    let guard = 0;
    while (guard++ < 5000) {
      const ownedMembers = team.members.filter(id => state.roster[id]);
      if (!ownedMembers.length) break;
      ownedMembers.sort((a, b) => state.roster[a].level - state.roster[b].level);
      const id = ownedMembers[0];
      if (!canLevelUp(state, id, B).ok) break;
      levelUp(state, id, B);
    }
  };
  const ownedMap = (team, node) => Object.fromEntries(team.members.map(id => [id, ownedOrLoaner(state, id, node, B)]));
  const battle = (node, team) => { log.battles++; return runNode(node, team, ownedMap(team, node), battleSeed++); };
  const teamLevel = (team) => {
    const owned = team.members.filter(id => state.roster[id]);
    return owned.length ? owned.reduce((s, id) => s + state.roster[id].level, 0) / owned.length : 0;
  };

  let lastCleared = null;
  for (const node of nodes) {
    let replays = 0, attempts = 0, cleared = false;
    while (!cleared) {
      spendScrolls(node);
      const team = pickTeam(node);
      levelTeam(team);
      attempts++;
      const r = battle(node, team);
      if (r.state === 'won') {
        completeNode(state, node, true, C, B, { time: r.time });
        cleared = true; lastCleared = node;
        log.timeline.push({ node: node.id, level: teamLevel(team), enemy: enemyLevelForNode(node.globalIndex, B), scrolls: state.currencies.scrolls, ryo: state.currencies.ryo, attempts, replays, pulls: state.gacha.totalPulls, team: team.members });
        break;
      }
      completeNode(state, node, false, C, B);
      if (process.env.CAMPAIGN_DEBUG) console.log('   [debug] player', playerSeed, 'lost', node.id, team.members.map(id => (C.char[id].short) + ' L' + (state.roster[id]?.level ?? 'loan') + ' ' + (state.roster[id]?.stars ?? 1) + '*').join(', '), 'leader', team.leader);
      if (replays >= HARD_CAP || !lastCleared) {
        log.fails.push({ node: node.id, replays, reason: 'gave up' });
        completeNode(state, node, true, C, B); // force progress so the report covers every arc
        break;
      }
      // Farm: replay the most recent cleared node (it is winnable by definition).
      const farmNode = lastCleared;
      const farmTeam = pickTeam(farmNode);
      levelTeam(farmTeam);
      const fr = battle(farmNode, farmTeam);
      if (fr.state === 'won') completeNode(state, farmNode, true, C, B, { time: fr.time });
      replays++; log.replays++;
    }
    if (replays > 0) log.stuck.push({ node: node.id, replays, attempts });
    if (replays > MAX_REPLAYS && !log.fails.some(f => f.node === node.id)) log.fails.push({ node: node.id, replays, reason: `needed ${replays} replays` });
    const arc = C.arc[node.arcId];
    if (node === arc.nodes[arc.nodes.length - 1]) {
      const last = log.timeline[log.timeline.length - 1];
      const tiers = { genin: 0, chunin: 0, jonin: 0, kage: 0 };
      for (const id of Object.keys(state.roster)) tiers[C.char[id].tier]++;
      log.arcs.push({ arc: arc.name, teamLevel: last?.level ?? 0, enemyLevel: enemyLevelForNode(node.globalIndex, B), pulls: state.gacha.totalPulls, scrolls: state.currencies.scrolls, ryo: state.currencies.ryo, owned: Object.keys(state.roster).length, tiers, team: last?.team || [] });
    }
  }
  if (verbose) print(log, state);
  return log;
}

function print(log, state) {
  console.log('\nArc-by-arc (player #1):');
  console.log('  ' + 'Arc'.padEnd(40) + 'Team Lv'.padEnd(9) + 'Enemy Lv'.padEnd(10) + 'Pulls'.padEnd(7) + 'Scrolls'.padEnd(9) + 'Ryo'.padEnd(9) + 'Owned (G/C/J/K)'.padEnd(18) + 'Team');
  for (const a of log.arcs) {
    console.log('  ' + a.arc.padEnd(40) + a.teamLevel.toFixed(1).padEnd(9) + String(a.enemyLevel).padEnd(10) + String(a.pulls).padEnd(7) + String(a.scrolls).padEnd(9) + String(a.ryo).padEnd(9)
      + `${a.owned} (${a.tiers.genin}/${a.tiers.chunin}/${a.tiers.jonin}/${a.tiers.kage})`.padEnd(18) + a.team.map(id => C.char[id].short).join(', '));
  }
  console.log('\nScroll / Ryo balance over time (after each first clear):');
  const line = log.timeline.map(t => `${t.node.replace(/^n_/, '')}: ${t.scrolls}s/${t.ryo}r`).join('  ');
  for (let i = 0; i < line.length; i += 118) console.log('  ' + line.slice(i, i + 118));
  console.log(`\nStuck points (needed replays): ${log.stuck.length ? log.stuck.map(s => `${s.node} (${s.replays} replay${s.replays > 1 ? 's' : ''})`).join(', ') : 'none'}`);
  console.log(`Total pulls: ${state.gacha.totalPulls}   battles: ${log.battles}   farm replays: ${log.replays}`);
}

console.log(`Shinobi Auto-Battler — free-to-play campaign sim, Part 1 (${PLAYERS} players, max ${MAX_REPLAYS} replays per stuck node)`);
const logs = [];
const VERBOSE = Number(process.env.CAMPAIGN_VERBOSE || 1);
for (let p = 0; p < PLAYERS; p++) logs.push(playCampaign(seedFor('campaign', p + 1), p + 1 === VERBOSE));

console.log('\nAll players:');
let failed = 0;
logs.forEach((l, i) => {
  const worst = l.stuck.reduce((m, s) => Math.max(m, s.replays), 0);
  const ok = l.fails.length === 0;
  if (!ok) failed++;
  console.log(`  player ${String(i + 1).padStart(2)}: ${ok ? 'PASS' : 'FAIL'}  worst node ${worst} replays, stuck at ${l.stuck.length} node(s), final team Lv ${l.arcs[l.arcs.length - 1]?.teamLevel.toFixed(1)}, pulls ${l.arcs[l.arcs.length - 1]?.pulls}${ok ? '' : '  ✗ ' + l.fails.map(f => `${f.node}: ${f.reason}`).join('; ')}`);
});
const allStuck = logs.flatMap(l => l.stuck.map(s => s.node));
const freq = {}; for (const n of allStuck) freq[n] = (freq[n] || 0) + 1;
const hot = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6);
console.log(`\nMost common stuck points: ${hot.length ? hot.map(([n, c]) => `${n} (${c}/${PLAYERS})`).join(', ') : 'none'}`);
console.log(`Median final team level: ${median(logs.map(l => l.arcs[l.arcs.length - 1]?.teamLevel || 0)).toFixed(1)}  (last enemy level ${enemyLevelForNode(C.nodes.filter(n => n.part === 1).slice(-1)[0].globalIndex, B)})`);
console.log(`\n${failed ? 'FAIL' : 'PASS'} — ${PLAYERS - failed}/${PLAYERS} free-to-play players cleared Part 1 with no node needing more than ${MAX_REPLAYS} replays.`);
process.exit(failed ? 1 : 0);

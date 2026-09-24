// tools/campaign-sim.mjs — a free-to-play player plays the story in order (Part I, then Part II). `npm run campaign`
// The bot:
//   * pulls whenever it can afford it (10-pulls first) on the current arc banner
//     (or Standard), exactly like a player would;
//   * picks its team for each node by power + Nature Wheel matchup (TeamPicker);
//     after a loss it weighs matchup harder and rotates in counters from its bench
//     (up to 12 levels behind), raising them with the catch-up discount;
//   * spends all Ryo levelling that team (lowest level first);
//   * fires ults as soon as they're ready;
//   * when it loses, it REPLAYS the most recent cleared node for Ryo (max
//     balance.targets.campaignMaxReplaysPerNode replays per stuck node), then retries.
// Report: team level at each arc, pulls, stuck points, scroll/Ryo balance over time.
// Target: every part in SIM_PARTS cleared, no node needing more than the max replays.
// Runs CAMPAIGN_PLAYERS (default 10) seeds; prints the first in detail.
import { C, B, runNode, teamForNode, median, seedFor, SIM_PARTS, PART_LABEL, DEFAULT_BOT } from './common.mjs';
import { defaultState } from '../js/core/SaveManager.js';
import { pull, canAfford, ticketPull } from '../js/core/GachaSystem.js';
import { completeNode, canLevelUp, levelUp, isBannerUnlocked, ownedOrLoaner, nodeBattleConfig, resolveTeam } from '../js/core/Progression.js';
import { autoPickTeam, teamMatchupRating, nodeEnemyNatures } from '../js/core/TeamPicker.js';
import { checkAchievements, claimAll, recordBattle } from '../js/core/Achievements.js';
import { makeRng, enemyLevelForNode } from '../js/core/formulas.js';
import { BattleSim } from '../js/core/BattleSim.js';
import { startTutorial, completeLesson, skipTutorial, tutorialLessons } from '../js/core/Tutorial.js';

const PLAYERS = Number(process.env.CAMPAIGN_PLAYERS) || 10;
const MAX_REPLAYS = B.targets.campaignMaxReplaysPerNode;
const HARD_CAP = 12; // give up on a node after this many replays (reported as FAIL)
// The "new player" run plays the Academy tutorial first (CAMPAIGN_TUTORIAL=0 to leave
// it out). Its lessons never count toward the difficulty stats below.
const TUTORIAL = process.env.CAMPAIGN_TUTORIAL !== '0';
// Achievements are unlocked and claimed as the bot plays (CAMPAIGN_ACHIEVEMENTS=0 to leave
// them out and compare): Ryo is spent on levels, tickets on summons.
const ACHIEVEMENTS = process.env.CAMPAIGN_ACHIEVEMENTS !== '0';

/** The three tutorial lessons with the starter team, through the game's own battle
 *  config (nodeBattleConfig). A lesson lost three times is skipped: same reward. */
function playTutorial(state, seed) {
  startTutorial(state);
  const out = { won: 0, battles: 0, reward: null };
  for (const [i, node] of tutorialLessons(C).entries()) {
    let won = false;
    for (let t = 0; t < 3 && !won; t++) {
      const sim = new BattleSim({ ...nodeBattleConfig(state, node, C, B, { seed: seed + i * 31 + t, team: resolveTeam(state, node, C) }), recordEvents: false });
      won = sim.runToEnd({ ultMode: DEFAULT_BOT }) === 'won'; out.battles++;
    }
    if (!won) { out.reward = skipTutorial(state, B); break; }
    out.won++;
    const r = completeLesson(state, i, C, B);
    if (r.reward) out.reward = r.reward;
  }
  return out;
}

function playCampaign(playerSeed, verbose) {
  const state = defaultState(C, B);
  const rng = makeRng(playerSeed);
  const nodes = C.nodes.filter(n => SIM_PARTS.includes(n.part));
  const log = { arcs: [], stuck: [], fails: [], timeline: [], battles: 0, replays: 0, tutorial: null, ach: { claimed: [], ryo: 0, tickets: 0, rareTickets: 0 } };
  let battleSeed = playerSeed * 7919;
  if (TUTORIAL) log.tutorial = playTutorial(state, battleSeed + 500000);
  const claimReady = () => {
    if (!ACHIEVEMENTS) return;
    checkAchievements(state, C, B);
    for (const r of claimAll(state, C, B)) { log.ach.claimed.push(r.id); for (const k of ['ryo', 'tickets', 'rareTickets']) log.ach[k] += r.reward?.[k] || 0; }
  };
  claimReady();

  const spendScrolls = (node) => {
    const arcBanner = C.banners.find(b => b.type === 'arc' && b.arc === node.arcId && isBannerUnlocked(state, b, C));
    const banner = arcBanner || C.banner.standard;
    let guard = 0;
    while (guard++ < 50 && canAfford(state, 10, B)) pull(state, banner.id, 10, C, rng, B);
    while (guard++ < 100 && canAfford(state, 1, B)) pull(state, banner.id, 1, C, rng, B);
    for (const kind of ['rareTickets', 'tickets']) while (guard++ < 200 && state.currencies[kind] > 0) ticketPull(state, banner.id, kind, C, rng, B);
    claimReady();
  };
  // counterMode (after a loss): judge the bench as if it were levelled up to the
  // current team's level — the bot then spends its farmed Ryo (with the catch-up
  // discount) raising the counters it picked, like a player swapping in answers
  // to the boss's nature.
  const pickTeam = (node, counterMode = false) => {
    const levels = Object.values(state.roster).map(o => o.level).sort((a, b) => b - a);
    const top4 = levels.slice(0, 4);
    const teamLvl = top4.reduce((s, l) => s + l, 0) / Math.max(1, top4.length);
    const cands = Object.entries(state.roster).map(([id, o]) => ({ id, level: counterMode && o.level >= teamLvl - 12 ? Math.max(o.level, Math.floor(teamLvl) - 2) : o.level, stars: o.stars }));
    const pick = autoPickTeam(cands, node, C, B, { matchupWeight: counterMode ? 0.8 : 0.32 });
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
  const battle = (node, team) => {
    log.battles++;
    const r = runNode(node, team, ownedMap(team, node), battleSeed++);
    if (ACHIEVEMENTS) recordBattle(state, { won: r.state === 'won', mode: 'story', sim: r.sim, matchup: teamMatchupRating(team.members.map(id => C.char[id]), nodeEnemyNatures(node, C), B) }, B);
    return r;
  };
  const teamLevel = (team) => {
    const owned = team.members.filter(id => state.roster[id]);
    return owned.length ? owned.reduce((s, id) => s + state.roster[id].level, 0) / owned.length : 0;
  };

  let lastCleared = null;
  for (const node of nodes) {
    let replays = 0, attempts = 0, cleared = false;
    while (!cleared) {
      spendScrolls(node);
      const team = pickTeam(node, attempts > 0);
      levelTeam(team);
      attempts++;
      const r = battle(node, team);
      if (r.state === 'won') {
        completeNode(state, node, true, C, B, { time: r.time });
        claimReady();
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
      if (fr.state === 'won') { completeNode(state, farmNode, true, C, B, { time: fr.time }); claimReady(); }
      replays++; log.replays++;
    }
    if (replays > 0) log.stuck.push({ node: node.id, replays, attempts });
    if (replays > MAX_REPLAYS && !log.fails.some(f => f.node === node.id)) log.fails.push({ node: node.id, replays, reason: `needed ${replays} replays` });
    const arc = C.arc[node.arcId];
    if (node === arc.nodes[arc.nodes.length - 1]) {
      const last = log.timeline[log.timeline.length - 1];
      const tiers = { genin: 0, chunin: 0, jonin: 0, kage: 0 };
      for (const id of Object.keys(state.roster)) tiers[C.char[id].tier]++;
      if (ACHIEVEMENTS) claimReady();
      log.arcs.push({ arc: arc.name, part: arc.part, teamLevel: last?.level ?? 0, enemyLevel: enemyLevelForNode(node.globalIndex, B), pulls: state.gacha.totalPulls, scrolls: state.currencies.scrolls, ryo: state.currencies.ryo, owned: Object.keys(state.roster).length, tiers, team: last?.team || [], achievements: log.ach.claimed.length });
    }
  }
  if (verbose) print(log, state);
  return log;
}

function print(log, state) {
  if (log.tutorial) console.log(`\nTutorial (player #1): won ${log.tutorial.won}/${tutorialLessons(C).length} lessons in ${log.tutorial.battles} battle(s), reward 📜 +${log.tutorial.reward?.scrolls ?? 0} 🪙 +${log.tutorial.reward?.ryo ?? 0} (not counted in the stats below)`);
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
  if (ACHIEVEMENTS) console.log(`Achievements claimed (player #1): ${log.ach.claimed.length}/${C.achievements.length} — ${log.ach.claimed.join(', ')}; paid 🪙 ${log.ach.ryo}, 🎟️ ${log.ach.tickets}, 🎫 ${log.ach.rareTickets}`);
}

console.log(`Shinobi Auto-Battler — free-to-play campaign sim, ${PART_LABEL()} (${PLAYERS} players, max ${MAX_REPLAYS} replays per stuck node${TUTORIAL ? ', new players play the tutorial first' : ', no tutorial'}${ACHIEVEMENTS ? ', achievements claimed' : ', no achievements'})`);
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
console.log(`Median final team level: ${median(logs.map(l => l.arcs[l.arcs.length - 1]?.teamLevel || 0)).toFixed(1)}  (last enemy level ${enemyLevelForNode(C.nodes.filter(n => SIM_PARTS.includes(n.part)).slice(-1)[0].globalIndex, B)})`);
for (const part of SIM_PARTS) {
  const ends = logs.map(l => l.arcs.filter(a => a.part === part).slice(-1)[0]).filter(Boolean);
  if (!ends.length) continue;
  console.log(`End of ${PART_LABEL([part])}: median team Lv ${median(ends.map(a => a.teamLevel)).toFixed(1)} vs enemy Lv ${ends[0].enemyLevel}, median Ryo ${median(ends.map(a => a.ryo))} (range ${Math.min(...ends.map(a => a.ryo))}–${Math.max(...ends.map(a => a.ryo))})${ACHIEVEMENTS ? `, median achievements claimed ${median(ends.map(a => a.achievements))}` : ''}`);
}
console.log(`\n${failed ? 'FAIL' : 'PASS'} — ${PLAYERS - failed}/${PLAYERS} free-to-play players cleared ${PART_LABEL()} with no node needing more than ${MAX_REPLAYS} replays.`);
process.exit(failed ? 1 : 0);

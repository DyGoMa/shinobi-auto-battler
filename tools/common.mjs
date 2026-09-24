// tools/common.mjs — shared helpers for sim.mjs and campaign-sim.mjs.
import { CONTENT } from '../js/content/index.js';
import { BALANCE } from '../js/config/balance.js';
import { BattleSim } from '../js/core/BattleSim.js';
import { enemyLevelForNode, hashString } from '../js/core/formulas.js';
import { buildPlayerUnit } from '../js/core/Ninja.js';
import { buildNodeEnemies, bossRushRound, isArcCleared } from '../js/core/Progression.js';
import { autoPickTeam } from '../js/core/TeamPicker.js';

export const C = CONTENT;
export const B = BALANCE;

/** Story parts the sims cover (default: every part with content). SIM_PARTS=1 for a quick Part I run. */
export const SIM_PARTS = (process.env.SIM_PARTS || [...new Set(CONTENT.arcs.map(a => a.part))].join(',')).split(',').map(Number);
export const PART_LABEL = (parts = SIM_PARTS) => parts.length > 1 ? `Parts ${parts.map(roman).join('–')}` : `Part ${roman(parts[0])}`;
function roman(n) { return ['0', 'I', 'II', 'III', 'IV'][n] || String(n); }

/** Characters whose unlock is satisfied once every arc BEFORE `arcIndex` is cleared. */
export function availableBeforeArc(arcIndex) {
  const cleared = new Set(C.arcs.filter(a => !a.placeholder && a.arcIndex < arcIndex).map(a => a.id));
  return C.roster.filter(c => !c.unlock || (c.unlock.arcCleared && cleared.has(c.unlock.arcCleared)) || (c.unlock.arcReached && C.arc[c.unlock.arcReached].arcIndex <= arcIndex));
}

/** Resolve a node team from explicit picks (applies forced/leader rules). */
export function teamForNode(node, pick) {
  const t = node.team || {};
  const all = [...new Set([...(t.forced || []), ...pick.all])].slice(0, 4);
  let leader = t.leader === 'none' ? null : (t.leader || pick.leader);
  // Same rule as Progression.resolveTeam: forced ninja always play; if they fill
  // every slot, the first forced ninja leads.
  if (leader && !all.includes(leader)) {
    if ((t.forced || []).length >= 4) leader = t.forced[0];
    else { all.pop(); all.push(leader); }
  }
  return { members: all, leader };
}

/** Build player unit specs from { id: {level, stars} } for a team. */
export function playerSpecs(team, owned, node) {
  const leaderDef = team.leader ? C.char[team.leader] : null;
  return team.members.map(id => {
    const o = owned[id] || { level: enemyLevelForNode(node?.globalIndex ?? 0, B), stars: 1 };
    return buildPlayerUnit(C.char[id], o, leaderDef, B);
  });
}

/** Run one story-node battle. Returns { state, time, sim }. */
export function runNode(node, team, owned, seed, { ultMode = 'asap', ultsEnabled = true, specsOverride = null } = {}) {
  const { enemies, civilians, enemyFactory } = buildNodeEnemies(node, C, B);
  const player = specsOverride || playerSpecs(team, owned, node);
  const sim = new BattleSim({ player, enemies, civilians, enemyFactory, objective: node.objective, seed, balance: B, recordEvents: false, ultsEnabled });
  const state = sim.runToEnd({ ultMode: ultsEnabled ? ultMode : 'none' });
  return { state, time: sim.time, sim };
}

/** On-curve team for a node: level = node enemy level (+offset), stars by tier, and the
 *  strongest lineup per tier slot among characters available by then. Nature-NEUTRAL
 *  (matchup ignored) so bosses are tuned for a typical team; counters then add an edge. */
export function onCurveTeam(node, { levelOffset = B.targets.onCurve.levelOffset, stars = B.targets.onCurve.stars, tierMix = B.targets.onCurve.tierMix } = {}) {
  const level = enemyLevelForNode(node.globalIndex, B) + levelOffset;
  const avail = availableBeforeArc(node.arcIndex);
  const cands = avail.map(c => ({ id: c.id, level, stars: typeof stars === 'number' ? stars : (stars[c.tier] ?? 1) }));
  // A forced ninja whose tier isn't in the mix (e.g. a forced Kage) takes the lowest
  // slot; otherwise no lineup can match the mix and the forced ninja fights alone.
  const mix = [...tierMix];
  for (const id of node.team?.forced || []) {
    const tier = C.char[id]?.tier;
    if (tier && !mix.includes(tier)) mix[mix.length - 1] = tier;
  }
  const pick = autoPickTeam(cands, node, C, B, { tierMix: mix, matchupWeight: 0 });
  const team = teamForNode(node, pick);
  const owned = Object.fromEntries(cands.map(c => [c.id, { level: c.level, stars: c.stars }]));
  for (const id of team.members) if (!owned[id]) owned[id] = { level, stars: 1 };
  return { team, owned, level };
}

/** Run a full Boss Rush with a team (no healing between rounds). Returns highest round cleared. */
export function runBossRush(team, owned, seed, { ultMode = 'asap', maxRounds = 30 } = {}) {
  let carry = null;
  let cleared = 0;
  for (let round = 1; round <= maxRounds; round++) {
    const R = bossRushRound(round, C, B);
    let player = playerSpecs(team, owned, null);
    if (carry) {
      player = player.map(p => {
        const c = carry.find(x => x.key === p.key);
        if (!c) return p;
        return { ...p, startHp: c.alive ? c.hp : 0, startChakraOverride: c.chakra * B.bossRush.chakraCarry };
      }).filter(p => p.startHp == null || p.startHp > 0);
    }
    if (!player.length) break;
    const sim = new BattleSim({ player, enemies: [{ spec: R.spec }], enemyFactory: R.enemyFactory, objective: { type: 'defeatBoss' }, seed: seed * 1009 + round, balance: B, recordEvents: false });
    const st = sim.runToEnd({ ultMode });
    if (st !== 'won') break;
    cleared = round;
    carry = sim.playerCarry();
  }
  return cleared;
}

export function pct(x) { return `${(x * 100).toFixed(0)}%`.padStart(4); }
export function median(arr) { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; }
export function seedFor(name, i) { return (hashString(name) ^ (i * 2654435761)) >>> 0; }
export { isArcCleared, hashString };

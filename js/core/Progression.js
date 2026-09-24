// Progression.js — unlocks, rewards, levelling and team assembly.
// Pure functions over (state, content, balance). No DOM.
import { BALANCE } from '../config/balance.js';
import { levelUpCost, nodeRewards, arcClearRewards, enemyLevelForNode, bossRushRewards, curve } from './formulas.js';
import { buildPlayerUnit, buildEnemyUnit, characterStats, powerRating } from './Ninja.js';

// ---------------------------------------------------------------------------
// Unlocks
// ---------------------------------------------------------------------------
export function isNodeCleared(state, nodeId) { return !!state.progress.cleared[nodeId]; }

export function isNodeUnlocked(state, node, C) {
  if (!node) return false;
  if (node.globalIndex === 0) return true;
  const prev = C.nodes[node.globalIndex - 1];
  return !prev || isNodeCleared(state, prev.id);
}

export function isArcReached(state, arc, C) {
  if (!arc || arc.placeholder || !arc.nodes?.length) return false;
  return isNodeUnlocked(state, arc.nodes[0], C);
}
export function isArcCleared(state, arc) {
  if (!arc || arc.placeholder || !arc.nodes?.length) return false;
  return arc.nodes.every(n => isNodeCleared(state, n.id));
}

export function unlockSatisfied(state, unlock, C) {
  if (!unlock) return true;
  if (unlock.arcCleared) return isArcCleared(state, C.arc[unlock.arcCleared]);
  if (unlock.arcReached) return isArcReached(state, C.arc[unlock.arcReached], C);
  return false;
}

export function isCharacterAvailable(state, def, C) { return unlockSatisfied(state, def.unlock, C); }

export function isBannerUnlocked(state, banner, C) {
  if (banner.type === 'standard') return true;
  return isArcReached(state, C.arc[banner.arc], C);
}

export function isBossRushUnlocked(state, C) { return isArcCleared(state, C.arc[C.bossRush.unlockArc]); }

/** The next node the player should play (first uncleared), or null when done. */
export function currentNode(state, C) { return C.nodes.find(n => !isNodeCleared(state, n.id)) || null; }

// ---------------------------------------------------------------------------
// Levelling
// ---------------------------------------------------------------------------
export function canLevelUp(state, id, B = BALANCE) {
  const o = state.roster[id]; if (!o) return { ok: false, reason: 'Not owned' };
  if (o.level >= B.stats.levelCap) return { ok: false, reason: 'Max level' };
  const cost = levelUpCost(o.level, B);
  if (state.currencies.ryo < cost) return { ok: false, reason: `Need ${cost} Ryo`, cost };
  return { ok: true, cost };
}
export function levelUp(state, id, B = BALANCE) {
  const c = canLevelUp(state, id, B); if (!c.ok) return c;
  state.currencies.ryo -= c.cost; state.roster[id].level++;
  return { ok: true, cost: c.cost, level: state.roster[id].level };
}

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------
/** Records a node result and grants rewards. Returns a rewards summary. */
export function completeNode(state, node, won, C, B = BALANCE, battleStats = {}) {
  const out = { won, scrolls: 0, ryo: 0, firstClear: false, arcCleared: null, unlocked: [] };
  state.stats.battles = (state.stats.battles || 0) + 1;
  if (!won) { state.stats.losses = (state.stats.losses || 0) + 1; return out; }
  const first = !isNodeCleared(state, node.id);
  const arc = C.arc[node.arcId];
  const wasArcCleared = isArcCleared(state, arc);
  const before = new Set(C.roster.filter(c => isCharacterAvailable(state, c, C)).map(c => c.id));
  const r = nodeRewards(node.globalIndex, { firstClear: first, isBossNode: node.isBossNode }, B);
  out.scrolls += r.scrolls; out.ryo += r.ryo; out.firstClear = first;
  const rec = state.progress.cleared[node.id] || { clears: 0, best: null };
  rec.clears++; if (battleStats.time && (!rec.best || battleStats.time < rec.best)) rec.best = Math.round(battleStats.time * 10) / 10;
  state.progress.cleared[node.id] = rec;
  if (!wasArcCleared && isArcCleared(state, arc)) {
    const b = arcClearRewards(arc.arcIndex, B);
    out.scrolls += b.scrolls; out.ryo += b.ryo; out.arcCleared = arc.id;
  }
  out.unlocked = C.roster.filter(c => !before.has(c.id) && isCharacterAvailable(state, c, C)).map(c => c.id);
  state.currencies.scrolls += out.scrolls; state.currencies.ryo += out.ryo;
  state.stats.wins = (state.stats.wins || 0) + 1;
  return out;
}

export function completeBossRushRound(state, round, B = BALANCE) {
  const r = bossRushRewards(round, B);
  state.currencies.scrolls += r.scrolls; state.currencies.ryo += r.ryo;
  if (round > (state.bossRush.highestRound || 0)) state.bossRush.highestRound = round;
  return r;
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------
/** Owned progress for a character, or a loaner for forced units. */
export function ownedOrLoaner(state, id, node, B = BALANCE) {
  const o = state.roster[id];
  if (o) return { ...o, loaner: false };
  const lvl = node ? enemyLevelForNode(node.globalIndex, B) : 1;
  return { level: lvl, stars: 1, loaner: true };
}

/**
 * Resolve the team for a node: forced members first, then the player's
 * chosen members (skipping banned / duplicate forms). Returns ids and leader.
 */
export function resolveTeam(state, node, C, chosen = state.team) {
  const t = node?.team || {};
  const banned = new Set(t.banned || []);
  const members = [];
  const baseOf = (id) => C.char[id]?.formOf || id;
  const bases = new Set();
  const add = (id) => {
    if (!id || !C.char[id] || banned.has(id) || members.includes(id) || bases.has(baseOf(id))) return;
    members.push(id); bases.add(baseOf(id));
  };
  for (const id of t.forced || []) add(id);
  let leader = null;
  if (t.leader === 'none') leader = null;
  else if (t.leader) { leader = t.leader; }
  else if (chosen.leader && state.roster[chosen.leader] && !banned.has(chosen.leader) && (members.includes(chosen.leader) || !bases.has(baseOf(chosen.leader)))) leader = chosen.leader;
  const size = 4;
  const leaderPending = leader && !members.includes(leader);
  if (leaderPending) bases.add(baseOf(leader));
  const cap = leaderPending ? size - 1 : size;
  for (const id of chosen.members || []) { if (members.length >= cap) break; if (state.roster[id] && id !== leader) add(id); }
  if (leaderPending) { if (members.length >= size) members.pop(); members.push(leader); }
  return { members: members.slice(0, size), leader, forced: t.forced || [], locked: !!(t.forced?.length >= 3 || t.leader) };
}

/** Build BattleSim player specs for a resolved team. */
export function buildTeamUnits(state, node, C, team, B = BALANCE, overrides = {}) {
  const leaderDef = team.leader ? C.char[team.leader] : null;
  return team.members.map(id => {
    const def = C.char[id];
    const own = overrides[id] || ownedOrLoaner(state, id, node, B);
    return buildPlayerUnit(def, own, leaderDef, B, { loaner: !!own.loaner });
  });
}

/** Enemy + civilian specs for a node. */
export function buildNodeEnemies(node, C, B = BALANCE) {
  const level = enemyLevelForNode(node.globalIndex, B);
  const nm = B.enemyScaling.nodeMult?.[node.id] || {};
  const tune = (s) => { s.maxHp = Math.round(s.maxHp * (nm.hp ?? 1)); s.atk = Math.round(s.atk * (nm.atk ?? 1)); return s; };
  const nonBoss = node.enemies.filter(e => !e.boss).length;
  const gm = nonBoss > 0 ? curve(B.enemyScaling.groupMult, nonBoss) : 1;
  const group = (s, isBoss) => { if (!isBoss) { s.maxHp = Math.round(s.maxHp * gm); s.atk = Math.round(s.atk * gm); } return s; };
  const enemies = node.enemies.map(e => ({
    delay: e.delay || 0,
    spec: tune(group(buildEnemyUnit(C.enemy[e.id], { level, globalIndex: node.globalIndex, part: node.part, isBoss: !!e.boss }, B), !!e.boss)),
  }));
  const civilians = node.objective?.type === 'protect' && node.objective.protect
    ? [buildEnemyUnit(C.enemy[node.objective.protect], { level, globalIndex: node.globalIndex, part: node.part }, B)] : [];
  const enemyFactory = (enemyId, { isAdd, bossUnit }) => {
    const d = C.enemy[enemyId]; if (!d) return null;
    return tune(buildEnemyUnit(d, { level: bossUnit?.level ?? level, globalIndex: node.globalIndex, part: node.part, isAdd }, B));
  };
  return { level, enemies, civilians, enemyFactory };
}

/** Everything needed to construct a BattleSim for a story node. */
export function nodeBattleConfig(state, node, C, B = BALANCE, { seed = 1, team = null, overrides = {} } = {}) {
  const t = team || resolveTeam(state, node, C);
  const player = buildTeamUnits(state, node, C, t, B, overrides);
  const { enemies, civilians, enemyFactory, level } = buildNodeEnemies(node, C, B);
  return { player, enemies, civilians, enemyFactory, objective: node.objective, seed, balance: B, enemyLevel: level, team: t };
}

// ---------------------------------------------------------------------------
// Boss Rush
// ---------------------------------------------------------------------------
export function bossRushRound(round, C, B = BALANCE) {
  const order = C.bossRush.order;
  const idx = (round - 1) % order.length;
  const loop = Math.floor((round - 1) / order.length);
  const level = Math.min(B.stats.levelCap, Math.round(curve(B.bossRush.levelByRound, round)));
  const mult = curve(B.bossRush.statMultByRound, round) * Math.pow(B.bossRush.loopMult, loop);
  const def = C.enemy[order[idx]];
  // Boss rush uses a virtual node index matching its level for boss multipliers.
  const spec = buildEnemyUnit(def, { level, globalIndex: 0, part: 1, isBoss: true, extraMult: mult }, B);
  const enemyFactory = (enemyId, { isAdd }) => {
    const d = C.enemy[enemyId]; if (!d) return null;
    return buildEnemyUnit(d, { level, part: 1, isAdd, extraMult: mult }, B);
  };
  return { def, spec, level, loop, mult, enemyFactory };
}

// ---------------------------------------------------------------------------
// Auto team (used by the Team Builder "Auto" button and the sim bots)
// ---------------------------------------------------------------------------
export function unitPower(def, own, B = BALANCE) { return powerRating(characterStats(def, own.level, own.stars, B)); }

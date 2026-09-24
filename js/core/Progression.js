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
  if (unlock.achievement) return !!state.achievements?.claimed?.[unlock.achievement]; // exclusive forms
  return false;
}

export function isCharacterAvailable(state, def, C) { return unlockSatisfied(state, def.unlock, C); }

export function isBannerUnlocked(state, banner, C) {
  if (banner.type === 'standard') return true;
  return isArcReached(state, C.arc[banner.arc], C);
}

export function isBossRushUnlocked(state, C) { return isArcCleared(state, C.arc[C.bossRush.unlockArc]); }

// ---- Hard mode: opens per part once every story battle of that part is cleared;
// its battles then unlock one after another, like the story.
export function isPartCleared(state, part, C) { const ns = C.nodes.filter(n => n.part === part); return ns.length > 0 && ns.every(n => isNodeCleared(state, n.id)); }
export function isHardUnlocked(state, part, C) { return isPartCleared(state, part, C); }
export function isHardNodeCleared(state, nodeId) { return !!state.progress.hard?.[nodeId]; }
export function isHardNodeUnlocked(state, node, C) {
  if (!node || node.tutorial || !isHardUnlocked(state, node.part, C)) return false;
  const prev = C.nodes[node.globalIndex - 1];
  return !prev || prev.part !== node.part || isHardNodeCleared(state, prev.id);
}
export function isArcHardCleared(state, arc) { return !!arc?.nodes?.length && arc.nodes.every(n => isHardNodeCleared(state, n.id)); }
/** The next Hard battle of a part (first not cleared), or null. */
export function currentHardNode(state, part, C) { return isHardUnlocked(state, part, C) ? C.nodes.find(n => n.part === part && !isHardNodeCleared(state, n.id)) || null : null; }

/** The next node the player should play (first uncleared), or null when done. */
export function currentNode(state, C) { return C.nodes.find(n => !isNodeCleared(state, n.id)) || null; }

// ---------------------------------------------------------------------------
// Levelling
// ---------------------------------------------------------------------------
/** Highest level among owned ninja (for the catch-up discount). */
export function highestLevel(state) {
  let m = 1; for (const o of Object.values(state.roster)) if (o.level > m) m = o.level; return m;
}

/** Ryo to go from the character's level to +1, including the catch-up discount. */
export function levelCostFor(state, id, B = BALANCE) {
  const o = state.roster[id]; if (!o) return { cost: Infinity, discounted: false };
  const base = levelUpCost(o.level, B);
  const cu = B.economy.catchUp;
  const discounted = cu && o.level <= highestLevel(state) - cu.gap;
  return { cost: Math.max(1, Math.round(base * (discounted ? 1 - cu.discount : 1))), discounted: !!discounted };
}

export function canLevelUp(state, id, B = BALANCE) {
  const o = state.roster[id]; if (!o) return { ok: false, reason: 'Not owned' };
  if (o.level >= B.stats.levelCap) return { ok: false, reason: 'Max level' };
  const { cost, discounted } = levelCostFor(state, id, B);
  if (state.currencies.ryo < cost) return { ok: false, reason: `Need ${cost} Ryo`, cost, discounted };
  return { ok: true, cost, discounted };
}
export function levelUp(state, id, B = BALANCE) {
  const c = canLevelUp(state, id, B); if (!c.ok) return c;
  state.currencies.ryo -= c.cost; state.roster[id].level++;
  return { ok: true, cost: c.cost, level: state.roster[id].level };
}

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------
/** Rewards for a battle on Hard: the story curves at the node's index × hardMode.rewards. */
export function hardNodeRewards(node, firstClear, B = BALANCE) {
  const r = nodeRewards(node.globalIndex, { firstClear, isBossNode: node.isBossNode }, B);
  const m = B.hardMode.rewards[firstClear ? 'firstClear' : 'replay'];
  return { scrolls: Math.round(r.scrolls * m.scrolls), ryo: Math.round(r.ryo * m.ryo) };
}
export function hardArcClearRewards(arc, B = BALANCE) {
  const r = arcClearRewards(arc.arcIndex, B), m = B.hardMode.rewards.arcClear;
  return { scrolls: Math.round(r.scrolls * m.scrolls), ryo: Math.round(r.ryo * m.ryo) };
}

/** Records a node result and grants rewards (Hard mode: pass { hard: true }). Returns a rewards summary. */
export function completeNode(state, node, won, C, B = BALANCE, battleStats = {}, { hard = false } = {}) {
  const out = { won, scrolls: 0, ryo: 0, firstClear: false, arcCleared: null, unlocked: [], hard };
  state.stats.battles = (state.stats.battles || 0) + 1;
  if (!won) { state.stats.losses = (state.stats.losses || 0) + 1; return out; }
  if (hard) return completeHardNode(state, node, C, B, battleStats, out);
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

function completeHardNode(state, node, C, B, battleStats, out) {
  if (!state.progress.hard) state.progress.hard = {};
  const first = !isHardNodeCleared(state, node.id);
  const arc = C.arc[node.arcId];
  const wasCleared = isArcHardCleared(state, arc);
  const r = hardNodeRewards(node, first, B);
  out.scrolls += r.scrolls; out.ryo += r.ryo; out.firstClear = first;
  const rec = state.progress.hard[node.id] || { clears: 0, best: null };
  rec.clears++; if (battleStats.time && (!rec.best || battleStats.time < rec.best)) rec.best = Math.round(battleStats.time * 10) / 10;
  state.progress.hard[node.id] = rec;
  if (!wasCleared && isArcHardCleared(state, arc)) { const b = hardArcClearRewards(arc, B); out.scrolls += b.scrolls; out.ryo += b.ryo; out.arcCleared = arc.id; }
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
/** Enemy level of a node: the story curve by global index (+ hardMode.levelOffset on
 *  Hard, capped at the level cap); tutorial nodes use balance.tutorial.enemyLevel. */
export function nodeEnemyLevel(node, B = BALANCE, { hard = false } = {}) {
  if (!node) return 1;
  if (node.tutorial) return B.tutorial.enemyLevel;
  const base = enemyLevelForNode(node.globalIndex, B);
  return hard ? Math.min(B.stats.levelCap, base + B.hardMode.levelOffset) : base;
}

/**
 * Owned progress for a character, or a loaner for forced units. A forced ninja
 * (or fixed Leader) never fights below the loaner level: owning an unlevelled
 * copy must not be worse than not owning it. Stars stay the player's own.
 */
export function ownedOrLoaner(state, id, node, B = BALANCE, { hard = false } = {}) {
  const o = state.roster[id];
  const lvl = node ? nodeEnemyLevel(node, B, { hard }) : 1;
  const forced = !!node && ((node.team?.forced || []).includes(id) || node.team?.leader === id);
  if (o) return forced && o.level < lvl ? { ...o, level: lvl, loaner: false, synced: true } : { ...o, loaner: false };
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
  // Forced ninja always play. If they fill every slot, the Leader slot yields:
  // the first forced ninja leads unless the player's Leader is one of them.
  if (members.length >= size && t.leader !== 'none' && !members.includes(leader)) leader = members[0];
  const leaderPending = leader && !members.includes(leader);
  if (leaderPending) bases.add(baseOf(leader));
  const cap = leaderPending ? size - 1 : size;
  for (const id of chosen.members || []) { if (members.length >= cap) break; if (state.roster[id] && id !== leader) add(id); }
  if (leaderPending) { if (members.length >= size) members.pop(); members.push(leader); }
  return { members: members.slice(0, size), leader, forced: t.forced || [], locked: !!(t.forced?.length >= 3 || t.leader) };
}

/** Build BattleSim player specs for a resolved team. */
export function buildTeamUnits(state, node, C, team, B = BALANCE, overrides = {}, { hard = false } = {}) {
  const leaderDef = team.leader ? C.char[team.leader] : null;
  return team.members.map(id => {
    const def = C.char[id];
    const own = overrides[id] || ownedOrLoaner(state, id, node, B, { hard });
    return buildPlayerUnit(def, own, leaderDef, B, { loaner: !!own.loaner });
  });
}

/** Enemy + civilian specs for a node. Hard: + level offset, bosses × hardMode.bossMult,
 *  and hardMode.nodeMult (falling back to the story's nodeMult). `level` overrides
 *  the level (the Daily challenge fights at the player's story level). */
export function buildNodeEnemies(node, C, B = BALANCE, { hard = false, level: forcedLevel = null } = {}) {
  const level = forcedLevel ?? nodeEnemyLevel(node, B, { hard });
  const nm = (hard ? B.hardMode.nodeMult?.[node.id] : null) || B.enemyScaling.nodeMult?.[node.id] || {};
  const tune = (s) => { s.maxHp = Math.round(s.maxHp * (nm.hp ?? 1)); s.atk = Math.round(s.atk * (nm.atk ?? 1)); return s; };
  const hardBoss = (s, isBoss) => { if (hard && isBoss) { s.maxHp = Math.round(s.maxHp * B.hardMode.bossMult); s.atk = Math.round(s.atk * B.hardMode.bossMult); } return s; };
  const nonBoss = node.enemies.filter(e => !e.boss).length;
  const gm = nonBoss > 0 ? curve(B.enemyScaling.groupMult, nonBoss) : 1;
  const group = (s, isBoss) => { if (!isBoss) { s.maxHp = Math.round(s.maxHp * gm); s.atk = Math.round(s.atk * gm); } return s; };
  const enemies = node.enemies.map(e => ({
    delay: e.delay || 0,
    spec: hardBoss(tune(group(buildEnemyUnit(C.enemy[e.id], { level, globalIndex: node.globalIndex, part: node.part, isBoss: !!e.boss }, B), !!e.boss)), !!e.boss),
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
export function nodeBattleConfig(state, node, C, B = BALANCE, { seed = 1, team = null, overrides = {}, hard = false } = {}) {
  const t = team || resolveTeam(state, node, C);
  const player = buildTeamUnits(state, node, C, t, B, overrides, { hard });
  // Tutorial lesson 3 starts the team with full chakra (the number is in balance.tutorial).
  const startChakra = node.startChakra != null ? B.tutorial?.[node.startChakra] : null;
  if (startChakra != null) for (const p of player) p.startChakraOverride = startChakra;
  const { enemies, civilians, enemyFactory, level } = buildNodeEnemies(node, C, B, { hard });
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

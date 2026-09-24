// TeamPicker.js — "Auto" team selection by power and Nature Wheel matchup.
// Used by the Team Builder's Auto button, the sim bots and the campaign sim.
import { BALANCE } from '../config/balance.js';
import { bestNature, natureRelation } from './formulas.js';
import { characterStats, powerRating, leaderBuffValue, scopeMatches } from './Ninja.js';

/** Natures the player will face in a node (active natures + boss specials). */
export function nodeEnemyNatures(node, C) {
  const out = [];
  for (const e of node?.enemies || []) {
    const d = C.enemy[e.id]; if (!d) continue;
    if (d.natures?.[0]) out.push(d.natures[0]);
    for (const m of d.mechanics || []) {
      if (m.type === 'telegraphAoE' && m.nature) out.push(m.nature);
      if (m.type === 'elementSwap') out.push(...(m.sequence || []));
    }
  }
  return out;
}

/** −1..+1 matchup of one character vs a list of enemy natures (offense + defense). */
export function characterMatchup(def, enemyNatures, B = BALANCE) {
  if (!enemyNatures.length) return 0;
  let off = 0, dfn = 0;
  for (const en of enemyNatures) {
    off += def.taijutsu ? 0.25 : bestNature(def.natures, en, {}, B).relation;
    const mine = def.taijutsu ? null : def.natures?.[0];
    dfn += mine ? -natureRelation(en, mine, B) : 0;
  }
  return (0.65 * off + 0.35 * dfn) / enemyNatures.length;
}

/** Team rating shown in the Team Builder: {score −1..1, label, stars 1..5}. */
export function teamMatchupRating(defs, enemyNatures, B = BALANCE) {
  if (!defs.length || !enemyNatures.length) return { score: 0, label: 'Neutral', stars: 3 };
  const s = defs.reduce((a, d) => a + characterMatchup(d, enemyNatures, B), 0) / defs.length;
  const stars = Math.max(1, Math.min(5, Math.round(3 + s * 4)));
  const label = s >= 0.35 ? 'Great' : s >= 0.1 ? 'Good' : s > -0.1 ? 'Neutral' : s > -0.35 ? 'Poor' : 'Bad';
  return { score: s, label, stars };
}

/**
 * Heuristic value of a 4-unit lineup. Mirrors the lane rules in BattleSim:
 * units queue melee-first, allySpacing apart, and only those whose range covers
 * their queue slot can hit (a third melee body mostly waits). A Tank in front
 * and one healer/buffer are worth extra.
 */
export function lineupScore(lineup, B = BALANCE) {
  const R = B.stats.ranges, L = B.combat.lane;
  const ordered = lineup
    .map(m => ({ m, range: R[m.def.range || B.stats.roles[m.def.role].range] }))
    .sort((a, b) => a.range - b.range);
  let s = 0;
  ordered.forEach(({ m, range }, k) => {
    const reaches = range + 0.5 >= L.contactGap + k * L.allySpacing;
    s += (m.score || 0) * (reaches ? 1 : 0.35);
  });
  if (ordered[0]?.m.def.role === 'Tank') s *= 1.15;
  const supports = lineup.filter(m => m.def.role === 'Support').length;
  if (supports >= 1) s *= 1.08;
  if (supports >= 2) s *= 0.9;
  return s;
}

/**
 * Pick 4 characters (+ leader) for a node.
 * candidates: [{ id, level, stars }] — what the player owns (or a hypothetical pool)
 * opts.tierMix: ['jonin','chunin',...] pick the best per tier slot (sims)
 * opts.matchupWeight: how much Nature Wheel matchup counts vs raw power (default 0.32; 0 = ignore)
 * Returns { members: [ids], leader }.
 */
export function autoPickTeam(candidates, node, C, B = BALANCE, opts = {}) {
  const t = node?.team || {};
  const banned = new Set(t.banned || []);
  const enemyNatures = nodeEnemyNatures(node, C);
  const baseOf = (id) => C.char[id]?.formOf || id;
  const scored = candidates
    .filter(c => C.char[c.id] && !banned.has(c.id))
    .map(c => {
      const def = C.char[c.id];
      const power = powerRating(characterStats(def, c.level, c.stars, B));
      const match = characterMatchup(def, enemyNatures, B);
      const rec = (t.recommended || []).includes(c.id) ? 1.03 : 1;
      const mw = opts.matchupWeight ?? 0.32;
      return { ...c, def, power, match, score: power * (1 + mw * match) * rec };
    })
    .sort((a, b) => b.score - a.score);

  const size = 4;
  const forced = [];
  for (const id of t.forced || []) {
    const c = scored.find(s => s.id === id) || (C.char[id] ? { id, level: 1, stars: 1, def: C.char[id], score: 0, power: 0, match: 0 } : null);
    if (c && !forced.some(f => baseOf(f.id) === baseOf(id))) forced.push(c);
  }
  // Candidate pool: top scorers overall plus the best few of each role (keeps the
  // brute-force search small: at most ~24 candidates -> ~10k lineups).
  const free = scored.filter(c => !forced.some(f => f.id === c.id || baseOf(f.id) === baseOf(c.id)));
  const pool = [];
  const addPool = (c) => { if (!pool.includes(c)) pool.push(c); };
  free.slice(0, 12).forEach(addPool);
  for (const role of ['Tank', 'Striker', 'Ranged', 'Support']) free.filter(c => c.def.role === role).slice(0, 3).forEach(addPool);
  if (opts.tierMix) for (const tier of new Set(opts.tierMix)) free.filter(c => c.def.tier === tier).slice(0, 6).forEach(addPool);

  const need = Math.max(0, size - forced.length);
  let best = null, bestScore = -1;
  const tierOk = (lineup) => {
    if (!opts.tierMix) return true;
    const want = {}; for (const tr of opts.tierMix.slice(0, size)) want[tr] = (want[tr] || 0) + 1;
    const have = {}; for (const m of lineup) have[m.def.tier] = (have[m.def.tier] || 0) + 1;
    return Object.entries(want).every(([tr, n]) => (have[tr] || 0) >= Math.min(n, forced.filter(f => f.def.tier === tr).length + free.filter(c => c.def.tier === tr).length));
  };
  const choose = (start, picked) => {
    if (picked.length === need || start >= pool.length) {
      if (picked.length !== Math.min(need, pool.length)) return;
      const lineup = [...forced, ...picked];
      const bs = new Set(lineup.map(m => baseOf(m.id)));
      if (bs.size !== lineup.length || !tierOk(lineup)) return;
      const s = lineupScore(lineup, B);
      if (s > bestScore) { bestScore = s; best = lineup; }
      return;
    }
    for (let i = start; i < pool.length; i++) { picked.push(pool[i]); choose(i + 1, picked); picked.pop(); }
  };
  choose(0, []);
  const members = best || forced;

  // Leader: node-forced, 'none', or the member whose buff helps the team most.
  let leader = null;
  if (t.leader === 'none') leader = null;
  else if (t.leader) leader = t.leader;
  else {
    let bestV = -1;
    for (const m of members) {
      const v = leaderBuffValue(m.def, B);
      const covered = members.filter(o => scopeMatches(m.def.leader?.scope, o.def)).length;
      const weight = { atk: 1.0, hp: 0.8, def: 0.6, speed: 0.9, crit: 0.9, chakra: 0.7, startChakra: 0.006, nature: 0.5 }[m.def.leader?.stat] ?? 0.5;
      const val = v * weight * covered;
      if (val > bestV) { bestV = val; leader = m.id; }
    }
  }
  if (leader && !members.some(m => m.id === leader)) {
    if (members.length >= size) members.pop();
    members.push({ id: leader, def: C.char[leader] });
  }
  const ids = members.map(m => m.id);
  // members = non-leader ids (3 with a leader, up to 4 without); all = full lineup.
  return { members: ids.filter(id => id !== leader), leader, all: ids };
}

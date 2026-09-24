// formulas.js — pure math helpers. No DOM, no state. Every number comes from
// the balance object passed in (defaults to js/config/balance.js).
import { BALANCE } from '../config/balance.js';

export const NATURES = ['Fire', 'Wind', 'Lightning', 'Earth', 'Water'];
export const TIERS = ['genin', 'chunin', 'jonin', 'kage'];
export const TIER_LABEL = { genin: 'Genin', chunin: 'Chunin', jonin: 'Jonin', kage: 'Kage' };
export const RARITY_LABEL = { genin: 'Common', chunin: 'Rare', jonin: 'Epic', kage: 'Legendary' };
export const ROLES = ['Tank', 'Striker', 'Ranged', 'Support'];

/**
 * Generic curve evaluator used for every scaling value in balance.js.
 * spec = { type: 'linear'|'poly'|'exp'|'step', base, growth, table?, cap?, min?, round? }
 * A plain number is returned as-is (constant).
 */
export function curve(spec, x) {
  if (typeof spec === 'number') return spec;
  if (!spec || typeof spec !== 'object') return 0;
  const base = Number(spec.base ?? 0);
  const growth = Number(spec.growth ?? 0);
  let v;
  switch (spec.type) {
    case 'linear': v = base + growth * x; break;
    case 'poly': v = base * Math.pow(Math.max(0, x), growth); break;
    case 'exp': v = base * Math.pow(growth, x); break;
    case 'step': {
      v = base;
      const table = Array.isArray(spec.table) ? spec.table : [];
      for (const row of table) { if (x >= row[0]) v = row[1]; }
      break;
    }
    default: v = base;
  }
  if (spec.cap != null) v = Math.min(v, spec.cap);
  if (spec.min != null) v = Math.max(v, spec.min);
  if (spec.round) v = Math.round(v);
  return Number.isFinite(v) ? v : 0;
}

/** Deterministic seeded RNG (mulberry32). Returns a function -> [0,1). */
export function makeRng(seed) {
  let a = (seed >>> 0) || 0x9e3779b9;
  return function rng() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** String -> 32-bit hash, for turning ids into seeds. */
export function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Nature wheel
// ---------------------------------------------------------------------------

/** Returns 1 if a beats d, -1 if d beats a, 0 otherwise. */
export function natureRelation(a, d, B = BALANCE) {
  if (!a || !d || a === d) return 0;
  const cyc = B.natureWheel.cycle;
  const ia = cyc.indexOf(a), id = cyc.indexOf(d);
  if (ia < 0 || id < 0) return 0;
  if (cyc[(ia + 1) % cyc.length] === d) return 1;
  if (cyc[(id + 1) % cyc.length] === a) return -1;
  return 0;
}

/** Which nature a given nature beats (Fire -> Wind). */
export function beatsNature(n, B = BALANCE) {
  const cyc = B.natureWheel.cycle; const i = cyc.indexOf(n);
  return i < 0 ? null : cyc[(i + 1) % cyc.length];
}
/** Which nature beats the given one (Wind -> Fire). */
export function beatenBy(n, B = BALANCE) {
  const cyc = B.natureWheel.cycle; const i = cyc.indexOf(n);
  return i < 0 ? null : cyc[(i - 1 + cyc.length) % cyc.length];
}

/**
 * Best nature matchup of an attacker against a defender's active nature.
 * Multi-nature attackers use whichever of their natures is best.
 * Taijutsu specialists are neutral but are never resisted.
 * Returns { mult, relation: 1|0|-1, nature }.
 */
export function bestNature(attackerNatures, defenderNature, { taijutsu = false } = {}, B = BALANCE) {
  const W = B.natureWheel;
  if (taijutsu || !attackerNatures || attackerNatures.length === 0 || !defenderNature) {
    return { mult: 1, relation: 0, nature: attackerNatures?.[0] || null };
  }
  let best = null;
  for (const n of attackerNatures) {
    const rel = natureRelation(n, defenderNature, B);
    const mult = rel > 0 ? W.advantage : rel < 0 ? W.disadvantage : 1;
    if (!best || mult > best.mult) best = { mult, relation: rel, nature: n };
  }
  return best;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function levelMult(level, B = BALANCE) {
  return curve(B.stats.levelMult, Math.max(0, level - 1));
}
export function starMult(stars, B = BALANCE) {
  const s = Math.max(1, Math.min(stars || 1, B.stats.starCap));
  return 1 + B.stats.starBonus * (s - 1);
}
export function levelUpCost(level, B = BALANCE) {
  return Math.max(0, Math.round(curve(B.economy.levelUpCost, level)));
}
/** Total Ryo to go from level a to level b. */
export function levelRangeCost(a, b, B = BALANCE) {
  let t = 0; for (let l = a; l < b; l++) t += levelUpCost(l, B); return t;
}

/**
 * Raw damage of one hit (before shields).
 * atk/def already include buffs; level is the attacker's level.
 */
export function computeHit({ atk, def, level, power = 1, critChance = 0, natureMult = 1, defIgnore = 0, dr = 0 }, rng, B = BALANCE) {
  const C = B.combat;
  const K = curve(C.defenseK, Math.max(0, level - 1));
  const effDef = Math.max(0, def * (1 - defIgnore));
  const variance = 1 + (rng() * 2 - 1) * C.variance;
  const crit = rng() < critChance;
  let dmg = atk * power * (K / (K + effDef)) * variance * (crit ? C.critMult : 1) * natureMult;
  dmg *= Math.max(0, 1 - dr);
  return { dmg: Math.max(1, Math.round(dmg)), crit };
}

/** Enemy level for a global node index. */
export function enemyLevelForNode(globalIndex, B = BALANCE) {
  return Math.max(1, Math.min(B.stats.levelCap, Math.round(curve(B.enemyScaling.levelByNode, globalIndex))));
}

/** Rewards for a story node clear. */
export function nodeRewards(globalIndex, { firstClear, isBossNode }, B = BALANCE) {
  const E = B.economy;
  if (firstClear) {
    const m = isBossNode ? E.bossNodeBonusMult : 1;
    return {
      scrolls: Math.round(curve(E.nodeFirstClear.scrolls, globalIndex) * m),
      ryo: Math.round(curve(E.nodeFirstClear.ryo, globalIndex) * m),
    };
  }
  return {
    scrolls: Math.round(curve(E.nodeReplay.scrolls, globalIndex)),
    ryo: Math.round(curve(E.nodeReplay.ryo, globalIndex)),
  };
}
export function arcClearRewards(arcIndex, B = BALANCE) {
  return {
    scrolls: Math.round(curve(B.economy.arcClearBonus.scrolls, arcIndex)),
    ryo: Math.round(curve(B.economy.arcClearBonus.ryo, arcIndex)),
  };
}
export function bossRushRewards(round, B = BALANCE) {
  return {
    scrolls: Math.round(curve(B.economy.bossRush.scrolls, round)),
    ryo: Math.round(curve(B.economy.bossRush.ryo, round)),
  };
}

export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

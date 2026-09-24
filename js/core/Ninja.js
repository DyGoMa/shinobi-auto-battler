// Ninja.js — turns content entries (roster / enemies) + progress (level, stars)
// + balance.js into concrete unit specs that BattleSim consumes. Pure, no DOM.
import { BALANCE } from '../config/balance.js';
import { curve, levelMult, starMult, bestNature, TIER_LABEL } from './formulas.js';

const STAT_LABEL = {
  atk: 'ATK', hp: 'HP', def: 'DEF', speed: 'attack speed', crit: 'crit chance',
  chakra: 'chakra gain', startChakra: 'starting chakra', nature: 'EFFECTIVE-hit damage',
};

/** Stats of a pullable character at a given level/stars (before leader buffs). */
export function characterStats(def, level = 1, stars = 1, B = BALANCE) {
  const role = B.stats.roles[def.role];
  const w = def.stats || {};
  const mult = (B.stats.rarityMult[def.tier] ?? 1) * levelMult(level, B) * starMult(stars, B);
  return {
    maxHp: Math.round(role.hp * (w.hp ?? 1) * mult),
    atk: Math.round(role.atk * (w.atk ?? 1) * mult),
    def: Math.round(role.def * (w.def ?? 1) * mult),
    attackInterval: role.attackInterval * (w.interval ?? 1),
    range: B.stats.ranges[def.range || role.range],
    moveSpeed: role.moveSpeed * (w.speed ?? 1),
    critChance: role.critChance * (w.crit ?? 1),
  };
}

/** A single "power" number for UI and auto team picking. */
export function powerRating(stats) {
  const dps = stats.atk / Math.max(0.3, stats.attackInterval);
  return Math.round(Math.sqrt(stats.maxHp * (1 + stats.def / 100) * dps) / 2);
}

/** Resolved value of a leader buff (number) for a leader character. */
export function leaderBuffValue(leaderDef, B = BALANCE) {
  const L = leaderDef?.leader; if (!L) return 0;
  const base = B.leader.values[L.stat] ?? 0;
  const scoped = L.scope && Object.keys(L.scope).length > 0;
  return base * (scoped ? B.leader.scopedMult : 1) * (B.leader.tierMult[leaderDef.tier] ?? 1);
}

function scopeText(scope) {
  if (!scope) return 'the whole team';
  if (scope.nature) return `${scope.nature} Style users`;
  if (scope.role) return `${scope.role}s`;
  if (scope.tier) return `${TIER_LABEL[scope.tier]}-tier ninja`;
  if (scope.tag) return scope.tagLabel || scope.tag;
  return 'allies';
}

/** Human text for a leader buff, e.g. "+18% ATK to Team 7". */
export function leaderBuffText(leaderDef, B = BALANCE) {
  const L = leaderDef?.leader; if (!L) return 'No leader buff';
  const v = leaderBuffValue(leaderDef, B);
  const val = (L.stat === 'startChakra') ? `+${Math.round(v)}` : (L.stat === 'crit') ? `+${Math.round(v * 100)}%` : `+${Math.round(v * 100)}%`;
  return `${L.name ? L.name + ': ' : ''}${val} ${STAT_LABEL[L.stat] || L.stat} to ${scopeText(L.scope)}`;
}

export function scopeMatches(scope, def) {
  if (!scope) return true;
  if (scope.nature && !(def.natures || []).includes(scope.nature)) return false;
  if (scope.role && def.role !== scope.role) return false;
  if (scope.tier && def.tier !== scope.tier) return false;
  if (scope.tag && !(def.tags || []).includes(scope.tag)) return false;
  return true;
}

/**
 * Build a player unit spec for BattleSim.
 * owned = { level, stars }. leaderDef = roster entry of the team leader (or null).
 */
export function buildPlayerUnit(def, owned, leaderDef, B = BALANCE, extra = {}) {
  const level = owned?.level ?? 1, stars = owned?.stars ?? 1;
  const s = characterStats(def, level, stars, B);
  const u = {
    key: def.id, name: def.name, short: def.short || def.name.split(' ')[0],
    side: 'player', role: def.role, tier: def.tier, level, stars,
    natures: [...(def.natures || [])], taijutsu: !!def.taijutsu,
    ...s, chakraGainMult: 1, startChakra: B.combat.chakra.start, natureBonus: 0,
    ult: { ...def.ult }, color: def.color, initials: def.initials, emoji: def.emoji,
    isLeader: !!(leaderDef && leaderDef.id === def.id), mechanics: [],
  };
  if (leaderDef?.leader && scopeMatches(leaderDef.leader.scope, def)) applyBuff(u, leaderDef.leader.stat, leaderBuffValue(leaderDef, B));
  return Object.assign(u, extra);
}

function applyBuff(u, stat, v) {
  switch (stat) {
    case 'atk': u.atk = Math.round(u.atk * (1 + v)); break;
    case 'hp': u.maxHp = Math.round(u.maxHp * (1 + v)); break;
    case 'def': u.def = Math.round(u.def * (1 + v)); break;
    case 'speed': u.attackInterval = u.attackInterval / (1 + v); break;
    case 'crit': u.critChance += v; break;
    case 'chakra': u.chakraGainMult *= (1 + v); break;
    case 'startChakra': u.startChakra += v; break;
    case 'nature': u.natureBonus += v; break;
    default: break;
  }
}

/** Resolve a content mechanic entry into absolute numbers using balance defaults. */
export function resolveMechanic(m, B = BALANCE) {
  const d = B.bossMechanics[m.type] || {};
  const r = { ...d, ...m };
  const iw = m.interval ?? 1; // relative timing weight (0.8 = 20% more often)
  const pw = m.power ?? 1;    // relative power weight
  switch (m.type) {
    case 'telegraphAoE':
      r.power = d.power * pw; r.every = d.every * iw; r.firstAt = d.firstAt * iw;
      r.windup = d.windup * (m.windup ?? 1); r.stun = m.stun ? d.stun : 0; r.target = m.target || 'all';
      break;
    case 'summonAdds':
      r.every = m.atHp ? null : d.every * iw; r.firstAt = d.firstAt * iw;
      r.count = m.count ?? d.count; r.maxAlive = d.maxAlive;
      break;
    case 'shieldPhase': r.shieldPctMaxHp = d.shieldPctMaxHp * pw; r.duration = d.duration; r.atHp = m.atHp || [0.5]; break;
    case 'enrage': r.after = m.atHp ? null : d.after * iw; r.atkMult = 1 + (d.atkMult - 1) * pw; r.speedMult = 1 + (d.speedMult - 1) * pw; break;
    case 'elementSwap': r.every = m.atHp ? null : d.every * iw; break;
    case 'reflect': r.pct = d.pct * pw; r.every = d.every * iw; r.firstAt = d.firstAt * iw; break;
    case 'lifesteal': r.pct = d.pct * pw; break;
    case 'reviveOnce': r.hpPct = d.hpPct * pw; break;
    case 'regen': r.pctPerSec = d.pctPerSec * pw; break;
    case 'rally': r.atk = d.atk * pw; r.every = d.every * iw; r.firstAt = d.firstAt * iw; break;
    default: break;
  }
  return r;
}

/**
 * Build an enemy unit spec.
 * opts = { level, globalIndex, part, isBoss, isAdd, extraMult, activeNature }
 */
export function buildEnemyUnit(def, opts, B = BALANCE) {
  const { level = 1, globalIndex = 0, part = 1, isBoss = false, isAdd = false, extraMult = 1 } = opts || {};
  const role = B.stats.roles[def.role] || B.stats.roles.Striker;
  const w = def.stats || {};
  const ES = B.enemyScaling;
  const lm = levelMult(level, B);
  const pm = ES.partMult[part] ?? 1;
  const bh = isBoss ? curve(ES.bossMult.hp, globalIndex) : 1;
  const ba = isBoss ? curve(ES.bossMult.atk, globalIndex) : 1;
  const bd = isBoss ? curve(ES.bossMult.def, globalIndex) : 1;
  const am = isAdd ? ES.addMult : 1;
  return {
    key: def.id, name: def.name, short: def.short || def.name.split(' ')[0],
    side: def.role === 'Civilian' ? 'player' : 'enemy', role: def.role, tier: null, level,
    natures: [...(def.natures || [])], taijutsu: !!def.taijutsu,
    maxHp: Math.round(role.hp * (w.hp ?? 1) * lm * ES.statMult.hp * pm * bh * am * extraMult),
    atk: Math.round(role.atk * (w.atk ?? 1) * lm * ES.statMult.atk * pm * ba * am * extraMult),
    def: Math.round(role.def * (w.def ?? 1) * lm * ES.statMult.def * bd),
    attackInterval: role.attackInterval * (w.interval ?? 1),
    range: B.stats.ranges[def.range || role.range],
    moveSpeed: role.moveSpeed * (w.speed ?? 1),
    critChance: role.critChance * (w.crit ?? 1),
    chakraGainMult: ES.enemyJutsu.chakraRate, startChakra: 0, natureBonus: 0,
    jutsu: def.jutsu ? { ...def.jutsu } : null,
    targeting: def.targeting || 'nearest',
    mechanics: (def.mechanics || []).map(m => resolveMechanic(m, B)),
    isBoss, isAdd, protected: def.role === 'Civilian',
    color: def.color, initials: def.initials, emoji: def.emoji,
  };
}

/** Matchup score of a team's natures vs a list of enemy natures: −1..+1. */
export function matchupScore(teamDefs, enemyNatures, B = BALANCE) {
  if (!teamDefs.length || !enemyNatures.length) return 0;
  let total = 0, n = 0;
  for (const d of teamDefs) {
    for (const en of enemyNatures) {
      const r = bestNature(d.natures, en, { taijutsu: d.taijutsu }, B);
      // Taijutsu specialists are never resisted: count as a small plus.
      total += d.taijutsu ? 0.25 : r.relation; n++;
    }
  }
  return n ? total / n : 0;
}

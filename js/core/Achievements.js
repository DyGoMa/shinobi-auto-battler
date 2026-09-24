// Achievements.js — progress, unlocks and rewards for js/content/achievements.js.
// Pure functions over (state, content, balance); every number is in
// balance.achievements. Achievements unlock by themselves (checkAchievements runs
// after every save and on load, so existing saves unlock retroactively) and pay out
// when the player claims them on the Achievements screen.
import { BALANCE } from '../config/balance.js';
import { localDateKey } from './formulas.js';

export const REWARD_LABEL = { ryo: 'Ryo', scrolls: 'scrolls', tickets: 'summon ticket', rareTickets: 'Rare+ summon ticket' };

export function achievementConfig(a, B = BALANCE) { return B.achievements.list[a.id] || {}; }

/** Description with {target} / {levels} filled in from balance.js. */
export function achievementText(a, B = BALANCE) {
  const cfg = achievementConfig(a, B);
  return a.description.replace('{target}', String(cfg.target ?? '')).replace('{levels}', String(B.achievements.underdogLevels));
}

const partNodes = (C, parts) => C.nodes.filter(n => parts.includes(n.part));
const owned = (s, C) => Object.keys(s.roster || {}).filter(id => C.char[id]);

/** Every pullable form family (base + forms), for "Every Form". */
export function formFamilies(C) {
  const fam = new Map();
  for (const c of C.roster) {
    if (c.notPullable) continue;
    const base = c.formOf || c.id;
    if (!fam.has(base)) fam.set(base, []);
    fam.get(base).push(c.id);
  }
  return [...fam.entries()].filter(([, ids]) => ids.length > 1).map(([base, ids]) => ({ base, ids }));
}

// [value, target] for each achievement type.
const PROGRESS = {
  tutorial: (s) => [s.tutorial?.completed ? 1 : 0, 1],
  partClear: (s, a, C) => { const ns = partNodes(C, a.parts); return [ns.filter(n => s.progress.cleared[n.id]).length, ns.length]; },
  hardClears: (s, a, C, B) => [Object.keys(s.progress.hard || {}).length, achievementConfig(a, B).target ?? 1],
  hardPartClear: (s, a, C) => { const ns = partNodes(C, a.parts); return [ns.filter(n => s.progress.hard?.[n.id]).length, ns.length]; },
  ownCount: (s, a, C, B) => [owned(s, C).length, achievementConfig(a, B).target],
  natures: (s, a, C, B) => { const got = new Set(owned(s, C).map(id => C.char[id].natures?.[0]).filter(Boolean)); return [B.natureWheel.cycle.filter(n => got.has(n)).length, B.natureWheel.cycle.length]; },
  forms: (s, a, C) => {
    let best = [0, 2];
    for (const f of formFamilies(C)) {
      const have = f.ids.filter(id => s.roster[id]).length;
      if (have / f.ids.length > best[0] / best[1]) best = [have, f.ids.length];
    }
    return best;
  },
  levelMax: (s, a, C, B) => [Math.max(1, ...Object.values(s.roster || {}).map(o => o.level || 1)), B.stats.levelCap],
  stat: (s, a, C, B) => [s.stats?.[a.stat] || 0, achievementConfig(a, B).target ?? 1],
  rushRound: (s, a, C, B) => [s.bossRush?.highestRound || 0, achievementConfig(a, B).target],
  summons: (s, a, C, B) => [s.gacha?.totalPulls || 0, achievementConfig(a, B).target ?? 1],
  googleLinked: (s) => [s.account?.googleLinked ? 1 : 0, 1],
  dailies: (s, a, C, B) => [s.daily?.totalCleared || 0, achievementConfig(a, B).target],
};

/** { value, target, done } for one achievement. */
export function achievementProgress(a, state, C, B = BALANCE) {
  const [v, t] = PROGRESS[a.type](state, a, C, B);
  return { value: Math.min(v, t), target: t, done: v >= t };
}

/** The best form family (for the "Every Form" progress label). */
export function bestFormFamily(state, C) {
  let best = null;
  for (const f of formFamilies(C)) {
    const have = f.ids.filter(id => state.roster[id]).length;
    if (!best || have / f.ids.length > best.have / best.ids.length) best = { ...f, have };
  }
  return best;
}

/** Unlock every achievement whose goal is met. Returns the newly unlocked ones. */
export function checkAchievements(state, C, B = BALANCE) {
  const fresh = [];
  for (const a of C.achievements || []) {
    if (state.achievements.unlocked[a.id]) continue;
    if (achievementProgress(a, state, C, B).done) { state.achievements.unlocked[a.id] = Date.now(); fresh.push(a); }
  }
  return fresh;
}

export function isUnlocked(state, id) { return !!state.achievements?.unlocked?.[id]; }
export function isClaimed(state, id) { return !!state.achievements?.claimed?.[id]; }
export function claimableAchievements(state, C) { return (C.achievements || []).filter(a => isUnlocked(state, a.id) && !isClaimed(state, a.id)); }

/**
 * Pay out an unlocked achievement. The exclusive form joins at the level of the
 * best-levelled form of the same ninja you own (balance.achievements), 1★.
 * Returns { ok, reward, character } (character = id given, if any).
 */
export function claimAchievement(state, id, C, B = BALANCE) {
  const a = C.achievement?.[id];
  if (!a || !isUnlocked(state, id) || isClaimed(state, id)) return { ok: false, reward: null, character: null };
  const reward = { ...(achievementConfig(a, B).reward || {}) };
  const cur = state.currencies;
  for (const k of ['ryo', 'scrolls', 'tickets', 'rareTickets']) if (reward[k]) cur[k] = (cur[k] || 0) + reward[k];
  let character = null;
  if (a.rewardCharacter && C.char[a.rewardCharacter] && !state.roster[a.rewardCharacter]) {
    const def = C.char[a.rewardCharacter];
    const base = def.formOf || def.id;
    const family = C.roster.filter(c => c.id === base || c.formOf === base).map(c => state.roster[c.id]?.level || 0);
    const level = B.achievements.exclusiveJoinsAtBestFormLevel ? Math.max(1, ...family) : 1;
    state.roster[def.id] = { level: Math.min(B.stats.levelCap, level), stars: 1 };
    character = def.id;
  }
  state.achievements.claimed[id] = Date.now();
  return { ok: true, reward, character };
}

/** Claim everything that's ready. Returns the list of claim results. */
export function claimAll(state, C, B = BALANCE) {
  return claimableAchievements(state, C).map(a => ({ id: a.id, ...claimAchievement(state, a.id, C, B) }));
}

/**
 * Combat records behind the Combat achievements, after a battle.
 * info = { won, mode: 'story'|'hard'|'daily'|'rush'|'tutorial', sim, matchup? } — matchup is the
 * Team screen's rating at the start ({ label }); "Poor" or "Bad" counts for Against the Odds.
 */
export function recordBattle(state, info, B = BALANCE) {
  const st = state.stats;
  const sim = info.sim;
  if (!sim || info.mode === 'tutorial') return;
  st.clashWins = (st.clashWins || 0) + (sim.stats?.clashes?.overpower || 0);
  if (!info.won) return;
  const fighters = sim.units.filter(u => u.side === 'player' && !u.protected);
  if (['story', 'hard'].includes(info.mode) && fighters.length && fighters.every(u => u.alive)) st.flawlessWins = (st.flawlessWins || 0) + 1;
  if (['story', 'hard', 'daily'].includes(info.mode) && ['Poor', 'Bad'].includes(info.matchup?.label)) st.counteredWins = (st.counteredWins || 0) + 1;
  const boss = sim.units.find(u => u.side === 'enemy' && u.isBoss);
  if (boss && fighters.length) {
    const teamLevel = fighters.reduce((s, u) => s + (u.level || 1), 0) / fighters.length;
    if (boss.level - teamLevel >= B.achievements.underdogLevels) st.underdogBossWins = (st.underdogBossWins || 0) + 1;
  }
}

/** Count a new calendar day played ("Daily Training"). Returns true if it was new. */
export function recordDayPlayed(state, dateKey = localDateKey()) {
  const st = state.stats;
  if (st.lastDay === dateKey) return false;
  st.lastDay = dateKey;
  st.daysPlayed = (st.daysPlayed || 0) + 1;
  return true;
}

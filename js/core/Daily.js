// Daily.js — the Daily challenges: balance.daily.challengesPerDay rotating fights a
// day, chosen from the date alone (no server): each an arc boss the player has already
// beaten, at their story level, with a twist from balance.daily.twists (which also sets
// the enemies' power). Each challenge (a "slot") has its own attempts and its own
// first-clear reward. Pure functions; every number is in balance.daily.
//
// state.daily = { date: 'YYYY-MM-DD', slots: [{ attempts, cleared }, …], totalCleared }
// (0.12.1, save v5; the one-challenge shape { date, attempts, cleared } is migrated)
import { BALANCE } from '../config/balance.js';
import { hashString, localDateKey, beatenBy, enemyLevelForNode, nodeRewards } from './formulas.js';
import { isArcCleared, currentNode, buildNodeEnemies, buildTeamUnits, resolveTeam } from './Progression.js';

export const TWIST_TEXT = {
  lockedNature: { icon: '🎯', name: 'Locked nature', text: (d) => `Every enemy fights with ${d.nature} Style today. Bring the nature that beats it.` },
  noUlts: { icon: '🚫', name: 'No Ultimates', text: () => 'Ultimates are sealed: your ninja fight with their normal attacks only. Enemies still use their jutsu.' },
  // Shown as "Boss gauntlet" so it isn't mistaken for the Akatsuki Boss Rush mode.
  bossRush: { icon: '⚔️', name: 'Boss gauntlet', text: (d) => `${d.rounds.length} bosses back to back. HP and chakra carry over, and nobody heals.` },
  counteredOnly: { icon: '⬇️', name: 'Countered', text: () => "Every enemy takes the nature that beats your team's main nature. Win anyway." },
};

export function isDailyUnlocked(state, C, B = BALANCE) { return isArcCleared(state, C.arc[B.daily.unlockArc]); }

/** The bosses a daily can pick: the final battle of each arc the player has cleared
 *  (the most recent daily.recentArcs of them; 0 = all). */
export function dailyPool(state, C, B = BALANCE) {
  const arcs = C.arcs.filter(a => isArcCleared(state, a));
  const n = B.daily.recentArcs || arcs.length;
  return arcs.slice(-n).map(a => a.nodes[a.nodes.length - 1]);
}

/** The player's story level: the enemy level of their next story battle (or the last one). */
export function storyLevel(state, C, B = BALANCE) {
  const n = currentNode(state, C) || C.nodes[C.nodes.length - 1];
  return enemyLevelForNode(n.globalIndex, B);
}

/** How many challenges a day (balance.daily.challengesPerDay, at least 1). */
export function slotsPerDay(B = BALANCE) { return Math.max(1, Math.floor(B.daily.challengesPerDay || 1)); }

/**
 * Today's challenge in `slot` (0-based), or null while the Daily is locked. Same date,
 * same progress and same slot = same challenge. The day's seed picks the first twist and
 * the slots take the next ones in turn (so a day's challenges all differ); the slots'
 * bosses are spread across the pool; the slot's own seed picks its nature.
 */
export function dailyFor(state, C, B = BALANCE, dateKey = localDateKey(), slot = 0) {
  if (!isDailyUnlocked(state, C, B)) return null;
  const pool = dailyPool(state, C, B);
  if (!pool.length) return null;
  const daySeed = hashString(`daily:${dateKey}`);
  const seed = hashString(`daily:${dateKey}:${slot}`);
  const twist = B.daily.twists[((daySeed >>> 8) + slot) % B.daily.twists.length];
  const stride = Math.max(1, Math.floor(pool.length / slotsPerDay(B)));
  const start = (daySeed + slot * stride) % pool.length;
  const count = twist.id === 'bossRush' ? Math.min(twist.rounds || 3, pool.length) : 1;
  const rounds = Array.from({ length: count }, (_, k) => pool[(start + k) % pool.length]);
  const cyc = B.natureWheel.cycle;
  return {
    dateKey, seed, slot, twist, node: rounds[0], rounds,
    nature: cyc[(seed >>> 16) % cyc.length],   // the locked nature (and the countered fallback)
    level: storyLevel(state, C, B),
  };
}

/** Every challenge of the day (one per slot), or null while the Daily is locked. */
export function dailiesFor(state, C, B = BALANCE, dateKey = localDateKey()) {
  const first = dailyFor(state, C, B, dateKey, 0);
  if (!first) return null;
  return [first, ...Array.from({ length: slotsPerDay(B) - 1 }, (_, k) => dailyFor(state, C, B, dateKey, k + 1))];
}

const freshSlot = () => ({ attempts: 0, cleared: false });

/** Today's record (one entry per slot), reset when the date changes. */
export function dailyRecord(state, dateKey = localDateKey(), B = BALANCE) {
  const d = state.daily;
  if (!Array.isArray(d.slots)) d.slots = [];
  if (d.date !== dateKey) { d.date = dateKey; d.slots = []; }
  for (let k = 0; k < slotsPerDay(B); k++) if (!d.slots[k] || typeof d.slots[k] !== 'object') d.slots[k] = freshSlot();
  return d;
}

/** The record of one slot today. */
export function slotRecord(state, slot = 0, dateKey = localDateKey(), B = BALANCE) {
  return dailyRecord(state, dateKey, B).slots[slot] || freshSlot();
}

export function attemptsLeft(state, B = BALANCE, dateKey = localDateKey(), slot = 0) {
  return Math.max(0, B.daily.attemptsPerDay - slotRecord(state, slot, dateKey, B).attempts);
}

/** The slots still open today: not cleared, with attempts left. */
export function openSlots(state, B = BALANCE, dateKey = localDateKey()) {
  return dailyRecord(state, dateKey, B).slots.map((r, k) => (!r.cleared && r.attempts < B.daily.attemptsPerDay ? k : -1)).filter(k => k >= 0);
}

/** How many of today's challenges are cleared. */
export function clearedToday(state, B = BALANCE, dateKey = localDateKey()) {
  return dailyRecord(state, dateKey, B).slots.filter(r => r.cleared).length;
}

/** Spend an attempt (at the start of a daily battle). */
export function startDailyAttempt(state, daily, B = BALANCE) {
  const rec = slotRecord(state, daily.slot || 0, daily.dateKey, B);
  if (rec.cleared) return { ok: false, error: 'This challenge is already cleared. New ones arrive tomorrow.' };
  if (rec.attempts >= B.daily.attemptsPerDay) return { ok: false, error: 'No attempts left on this challenge today. New ones arrive tomorrow.' };
  rec.attempts++;
  return { ok: true };
}

/** The first-clear reward: fixed scrolls, plus Ryo scaled to the player's place in the story. */
export function dailyReward(state, C, B = BALANCE) {
  const n = currentNode(state, C) || C.nodes[C.nodes.length - 1];
  const replay = nodeRewards(n.globalIndex, { firstClear: false, isBossNode: false }, B);
  return { scrolls: B.daily.rewards.scrolls, ryo: Math.round(replay.ryo * B.daily.rewards.ryoMult) };
}

/** Record a won daily. Pays the reward on that challenge's first clear of the day. */
export function completeDaily(state, daily, C, B = BALANCE) {
  const rec = slotRecord(state, daily.slot || 0, daily.dateKey, B);
  if (rec.cleared) return null;
  rec.cleared = true;
  state.daily.totalCleared = (state.daily.totalCleared || 0) + 1;
  const r = dailyReward(state, C, B);
  state.currencies.scrolls += r.scrolls;
  state.currencies.ryo += r.ryo;
  return r;
}

/** The nature the enemies take today (null = unchanged), given the team (for Countered). */
export function dailyEnemyNature(daily, teamDefs, B = BALANCE) {
  if (daily.twist.id === 'lockedNature') return daily.nature;
  if (daily.twist.id !== 'counteredOnly') return null;
  const count = new Map();
  for (const d of teamDefs) { const n = d.taijutsu ? null : d.natures?.[0]; if (n) count.set(n, (count.get(n) || 0) + 1); }
  const main = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || daily.nature;
  return beatenBy(main, B);
}

/** A copy of the content where a node's enemies (and their summons) fight with `nature`. */
function withNature(C, node, nature) {
  const enemy = { ...C.enemy };
  const ids = new Set(node.enemies.map(e => e.id));
  for (const id of [...ids]) for (const m of C.enemy[id].mechanics || []) if (m.type === 'summonAdds') ids.add(m.enemy);
  for (const id of ids) {
    const d = C.enemy[id];
    enemy[id] = {
      ...d, natures: [nature],
      jutsu: d.jutsu ? { ...d.jutsu, nature: d.jutsu.nature ? nature : d.jutsu.nature } : d.jutsu,
      mechanics: (d.mechanics || []).filter(m => m.type !== 'elementSwap').map(m => (m.type === 'telegraphAoE' && m.nature ? { ...m, nature } : m)),
    };
  }
  return { ...C, enemy };
}

/** The content the day's fights use for this team: every enemy of every round takes
 *  the twist's nature (Locked nature, Countered), or the plain content. */
export function dailyContent(daily, teamDefs, C, B = BALANCE) {
  const nature = dailyEnemyNature(daily, teamDefs, B);
  return nature ? daily.rounds.reduce((c, n) => withNature(c, n, nature), C) : C;
}

/** A node standing for the whole day (every round's enemies, no story team rules):
 *  what the Team screen and its Auto-pick build against. */
export function dailyTeamNode(daily) {
  const rush = daily.twist.id === 'bossRush';
  return {
    ...daily.node, team: {},
    enemies: rush ? daily.rounds.map(n => n.enemies.find(e => e.boss) || n.enemies[0]) : daily.node.enemies,
  };
}

/** The enemies' HP and ATK multiplier on this twist (daily.twists[].power). */
function powerUp(spec, p) { if (spec && p !== 1) { spec.maxHp = Math.round(spec.maxHp * p); spec.atk = Math.round(spec.atk * p); } return spec; }

/**
 * Everything to build a BattleSim for round `round` of a daily. The player's own team
 * (no story team rules); the boss node's enemies at the daily level; the twist applied.
 * carry = player HP/chakra from the previous round (Boss gauntlet).
 */
export function dailyBattleConfig(state, daily, round, C, B = BALANCE, { seed = 1, team = null, carry = null } = {}) {
  const t = team || resolveTeam(state, null, C);
  let player = buildTeamUnits(state, null, C, t, B);
  if (carry) player = player.map(p => { const c = carry.find(x => x.key === p.key); return c ? { ...p, startHp: c.alive ? c.hp : 0, startChakraOverride: c.chakra } : p; }).filter(p => p.startHp == null || p.startHp > 0);
  const node = daily.rounds[Math.min(round, daily.rounds.length - 1)];
  const nature = dailyEnemyNature(daily, t.members.map(id => C.char[id]), B);
  const content = nature ? withNature(C, node, nature) : C;
  const built = buildNodeEnemies(node, content, B, { level: daily.level });
  const rush = daily.twist.id === 'bossRush';
  const p = daily.twist.power ?? 1;
  const enemies = (rush ? built.enemies.filter(e => e.spec.isBoss) : built.enemies).map(e => ({ ...e, spec: powerUp(e.spec, p) }));
  return {
    player,
    enemies,
    civilians: rush ? [] : built.civilians,
    enemyFactory: (...args) => powerUp(built.enemyFactory(...args), p),
    objective: rush ? { type: 'defeatBoss' } : node.objective,
    seed, balance: B, team: t, node, enemyNature: nature,
    ultsEnabled: daily.twist.id !== 'noUlts',
  };
}

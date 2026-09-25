// Skip.js — ⏭ Skip: play a story or Hard battle you have already won, instantly.
// It is a real battle: the same BattleSim, the same team and enemies as ⚔️ Fight!,
// played headless with the clash-aware Ultimate bot (the in-game 🤖 Auto-ult and the
// sims' default bot). It can be lost, and it pays exactly what the battle pays.
// Not for the Daily challenge, the tutorial or battles never won. Pure, no DOM.
import { BALANCE } from '../config/balance.js';
import { BattleSim } from './BattleSim.js';
import { nodeBattleConfig, completeNode, isNodeCleared, isHardNodeCleared, isNodeUnlocked, isHardNodeUnlocked } from './Progression.js';
import { recordBattle } from './Achievements.js';
import { nodeEnemyNatures, teamMatchupRating } from './TeamPicker.js';

/** The Ultimate bot a skipped battle plays with: clash-aware (BattleSim.botUlts('smart')). */
export const SKIP_BOT = 'smart';

/** Can this battle be skipped? { ok, reason } */
export function canSkip(state, node, C, { hard = false, daily = false } = {}) {
  if (daily) return { ok: false, reason: 'The Daily challenge can\'t be skipped.' };
  if (!node || node.tutorial || node.placeholder) return { ok: false, reason: 'This battle can\'t be skipped.' };
  const unlocked = hard ? isHardNodeUnlocked(state, node, C) : isNodeUnlocked(state, node, C);
  const won = hard ? isHardNodeCleared(state, node.id) : isNodeCleared(state, node.id);
  if (!unlocked || !won) return { ok: false, reason: `Win this battle${hard ? ' on Hard' : ''} once to unlock Skip.` };
  return { ok: true };
}

/**
 * Play the battle headless and record it like a normal one (rewards, clears, battle
 * stats for the achievements). Returns { ok, won, result, sim, matchup } or { ok: false, reason }.
 */
export function skipBattle(state, node, C, B = BALANCE, { hard = false, seed = 1, daily = false } = {}) {
  const chk = canSkip(state, node, C, { hard, daily });
  if (!chk.ok) return chk;
  const cfg = nodeBattleConfig(state, node, C, B, { seed, hard });
  const matchup = teamMatchupRating(cfg.team.members.map(id => C.char[id]), nodeEnemyNatures(node, C), B);
  const sim = new BattleSim({ ...cfg, recordEvents: false });
  const won = sim.runToEnd({ ultMode: SKIP_BOT }) === 'won';
  const result = completeNode(state, node, won, C, B, { time: sim.time }, { hard });
  recordBattle(state, { won, mode: hard ? 'hard' : 'story', sim, matchup }, B);
  return { ok: true, won, result, sim, matchup };
}

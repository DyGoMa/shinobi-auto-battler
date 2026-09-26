// Badges.js — which bottom tabs show a red dot. Pure, no DOM, never changes the save.
//   Home    an achievement reward to claim, today's Daily challenge not done yet (and
//           attempts left), or the Boss Rush open and never tried
//   Summon  a free summon: a summon ticket or a Rare+ ticket
import { BALANCE } from '../config/balance.js';
import { localDateKey } from './formulas.js';
import { claimableAchievements } from './Achievements.js';
import { isDailyUnlocked, openSlots } from './Daily.js';
import { isBossRushUnlocked } from './Progression.js';

/** A Daily challenge is open today: not cleared, with attempts left. Never changes the save. */
export function dailyWaiting(state, C, B = BALANCE, dateKey = localDateKey()) {
  if (!isDailyUnlocked(state, C, B)) return false;
  const d = state.daily || {};
  if (d.date !== dateKey) return true;
  return openSlots({ daily: { date: d.date, slots: (d.slots || []).map(r => ({ ...r })), totalCleared: 0 } }, B, dateKey).length > 0;
}

export function freePullAvailable(state) { return (state.currencies?.tickets || 0) + (state.currencies?.rareTickets || 0) > 0; }

/** { home, summon, reasons } for the tab bar. */
export function tabBadges(state, C, B = BALANCE, dateKey = localDateKey()) {
  const reasons = {
    claimable: claimableAchievements(state, C).length > 0,
    daily: dailyWaiting(state, C, B, dateKey),
    rushNew: isBossRushUnlocked(state, C) && !state.bossRush?.runs,
    freePull: freePullAvailable(state),
  };
  return { home: reasons.claimable || reasons.daily || reasons.rushNew, summon: reasons.freePull, reasons };
}

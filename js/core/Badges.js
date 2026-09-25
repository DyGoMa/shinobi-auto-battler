// Badges.js — which bottom tabs show a red dot. Pure, no DOM, never changes the save.
//   Home    an achievement reward to claim, today's Daily challenge not done yet (and
//           attempts left), or the Boss Rush open and never tried
//   Summon  a free summon: a summon ticket or a Rare+ ticket
import { BALANCE } from '../config/balance.js';
import { localDateKey } from './formulas.js';
import { claimableAchievements } from './Achievements.js';
import { isDailyUnlocked } from './Daily.js';
import { isBossRushUnlocked } from './Progression.js';

/** Today's Daily challenge is open, not cleared, and has attempts left. */
export function dailyWaiting(state, C, B = BALANCE, dateKey = localDateKey()) {
  if (!isDailyUnlocked(state, C, B)) return false;
  const d = state.daily || {};
  const today = d.date === dateKey;
  return !(today && d.cleared) && (today ? d.attempts || 0 : 0) < B.daily.attemptsPerDay;
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

// Power.js — team power and the recommended power of a fight. Pure, no DOM.
//
// Recommended power = the power of the "on-curve" team the boss sims are tuned for
// (balance.targets.onCurve, or targets.hardMode.onCurve on Hard): its tier mix at the
// fight's enemy level (+ levelOffset) and stars, each slot worth the median ninja of
// that tier. An arc boss is tuned so that team wins about half to two thirds of the
// time (targets.bossWinRange); other battles are easier. Nothing here is typed by hand.
import { BALANCE } from '../config/balance.js';
import { characterStats, powerRating } from './Ninja.js';
import { nodeEnemyLevel, ownedOrLoaner, resolveTeam, unitPower } from './Progression.js';

/** The on-curve team definition for Story or Hard. */
export function onCurveSpec(B = BALANCE, hard = false) { return hard ? B.targets.hardMode.onCurve : B.targets.onCurve; }

/** Median power of the pullable ninja of a tier at a level and star count. */
export function tierMedianPower(tier, level, stars, C, B = BALANCE) {
  const p = C.roster.filter(c => c.tier === tier && !c.notPullable).map(c => powerRating(characterStats(c, level, stars, B))).sort((a, b) => a - b);
  return p.length ? p[Math.floor(p.length / 2)] : 0;
}

/** Recommended team power for a fight (story or Hard). */
export function recommendedPower(node, C, B = BALANCE, { hard = false } = {}) {
  if (!node) return 0;
  const oc = onCurveSpec(B, hard && !node.tutorial);
  const level = Math.max(1, Math.min(B.stats.levelCap, nodeEnemyLevel(node, B, { hard }) + (oc.levelOffset || 0)));
  let total = 0;
  for (const tier of oc.tierMix) {
    const stars = typeof oc.stars === 'number' ? oc.stars : (oc.stars?.[tier] ?? 1);
    total += tierMedianPower(tier, level, stars, C, B);
  }
  return Math.round(total);
}

/** Power of the team that would fight `node` (forced ninja and loaners included, at their
 *  battle level). node = null: the saved team as it is. */
export function teamPower(state, node, C, B = BALANCE, { hard = false, team = null } = {}) {
  const t = team || resolveTeam(state, node, C);
  return t.members.reduce((s, id) => s + (C.char[id] ? unitPower(C.char[id], ownedOrLoaner(state, id, node, B, { hard }), B) : 0), 0);
}

/** "1.2k" style short power for tight labels (node dots). */
export function shortPower(n) {
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(Math.round(n));
}

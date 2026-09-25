// AutoLevel.js — the Roster's convenience buttons. They only choose WHICH level-ups to
// buy; every level still goes through Progression.levelUp, so costs (and the catch-up
// discount) are exactly what the +1 button charges. Pure, no DOM.
//
//   planToRecommended  level the team for a fight until it reaches that fight's
//                      recommended power (Power.js), then stop.
//   planSmartSpend     spend Ryo where each Ryo adds the most team power, never going
//                      below the player's reserve (state.settings.ryoReserve).
//
// A plan is computed on a copy of the save, then `applyPlan` replays the same level-ups
// on the real save in the same order (so it costs exactly what the plan showed).
import { BALANCE } from '../config/balance.js';
import { levelCostFor, levelUp, resolveTeam, ownedOrLoaner, unitPower } from './Progression.js';
import { teamPower, recommendedPower } from './Power.js';

/** The Ryo reserve Smart spend keeps (the player's setting, or the default). */
export function ryoReserve(state, B = BALANCE) {
  const v = Number(state.settings?.ryoReserve);
  return Number.isFinite(v) && v >= 0 ? Math.floor(v) : B.qol.ryoReserve;
}

/** A throwaway copy of what levelling touches (roster levels, Ryo, the team). */
function scratch(state) {
  return { ...state, roster: structuredClone(state.roster), currencies: { ...state.currencies } };
}

/**
 * Greedy planner. Each step buys the +1 with the best team-power gain per Ryo among the
 * team's owned ninja (a forced ninja raised to the battle's level gains nothing until
 * they pass it, so they are skipped). Stops when `done(power)` is true, when nothing
 * affordable adds power, or at the level cap.
 */
function greedy(state, node, C, B, { hard, budget, done }) {
  const s = scratch(state);
  const team = resolveTeam(s, node, C);
  const ids = team.members.filter(id => s.roster[id]);
  const steps = [];
  let spent = 0;
  let power = teamPower(s, node, C, B, { hard, team });
  const gainOf = (id) => {
    const def = C.char[id];
    const before = unitPower(def, ownedOrLoaner(s, id, node, B, { hard }), B);
    s.roster[id].level++;
    const after = unitPower(def, ownedOrLoaner(s, id, node, B, { hard }), B);
    s.roster[id].level--;
    return after - before;
  };
  for (let guard = 0; guard < ids.length * B.stats.levelCap + 5 && !done(power); guard++) {
    let best = null;
    for (const id of ids) {
      if (s.roster[id].level >= B.stats.levelCap) continue;
      const cost = levelCostFor(s, id, B).cost;
      if (spent + cost > budget) continue;
      const gain = gainOf(id);
      if (gain <= 0) continue;
      const ratio = gain / cost;
      if (!best || ratio > best.ratio) best = { id, cost, gain, ratio };
    }
    if (!best) break;
    s.currencies.ryo = Infinity;   // the budget is checked above; levelUp only needs to succeed
    const r = levelUp(s, best.id, B);
    if (!r.ok) break;
    spent += r.cost;
    power += best.gain;
    steps.push({ id: best.id, level: r.level, cost: r.cost });
  }
  const levels = {};
  for (const st of steps) levels[st.id] = (levels[st.id] || 0) + 1;
  return { steps, cost: spent, power, levels, team };
}

/**
 * Level the team for `node` up to its recommended power.
 * Returns { target, before, power, cost, steps, levels, reached, affordable, full }:
 *   the affordable plan (what the button buys), and `full` = the whole way there
 *   ignoring Ryo (so the dialog can say how much is missing).
 */
export function planToRecommended(state, node, C, B = BALANCE, { hard = false } = {}) {
  const target = recommendedPower(node, C, B, { hard });
  const before = teamPower(state, node, C, B, { hard });
  const done = (p) => p >= target;
  const full = greedy(state, node, C, B, { hard, budget: Infinity, done });
  const plan = greedy(state, node, C, B, { hard, budget: state.currencies.ryo, done });
  return { ...plan, target, before, reached: plan.power >= target, affordable: full.cost <= state.currencies.ryo, full };
}

/** Spend everything above the reserve on the team for `node` (null: the saved team). */
export function planSmartSpend(state, node, C, B = BALANCE, { hard = false, reserve = ryoReserve(state, B) } = {}) {
  const before = teamPower(state, node, C, B, { hard });
  const budget = Math.max(0, state.currencies.ryo - Math.max(0, reserve));
  const plan = greedy(state, node, C, B, { hard, budget, done: () => false });
  return { ...plan, before, reserve, budget };
}

/** Buy a plan's level-ups on the real save. Returns { levels, cost }. */
export function applyPlan(state, plan, B = BALANCE) {
  let cost = 0, count = 0;
  for (const st of plan.steps) {
    const r = levelUp(state, st.id, B);
    if (!r.ok) break;
    cost += r.cost; count++;
  }
  return { levels: count, cost };
}

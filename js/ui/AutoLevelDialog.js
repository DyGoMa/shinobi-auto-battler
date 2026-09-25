// AutoLevelDialog.js — the confirm dialogs for the Roster's two convenience buttons
// (js/core/AutoLevel.js). Both show exactly what will be bought and what it costs before
// anything is spent; the level-ups themselves are the normal ones (same Ryo costs).
import { h, btn, fmt } from './dom.js';
import { planToRecommended, planSmartSpend, applyPlan, ryoReserve } from '../core/AutoLevel.js';
import { currentNode } from '../core/Progression.js';

/** The fight the Roster levels for: the chosen one, else the next story battle. */
export function targetNode(game, node = null) {
  const { C, state } = game;
  return node || currentNode(state, C) || C.nodes[C.nodes.length - 1];
}

function levelList(game, plan) {
  const { C, state } = game;
  const ids = Object.keys(plan.levels);
  if (!ids.length) return null;
  return h('ul.plan-list', ...ids.map(id => h('li', h('b', C.char[id].short), ` Lv ${state.roster[id].level} → ${state.roster[id].level + plan.levels[id]}`)));
}

function buy(game, ui, plan, close, what) {
  const { state, B } = game;
  const r = applyPlan(state, plan, B);
  close();
  if (!r.levels) { ui.toast('Nothing to level up.'); return; }
  game.audio.levelUp();
  game.commit('levelup');
  ui.toast(`${what}: ${r.levels} level${r.levels === 1 ? '' : 's'} for 🪙 ${fmt(r.cost)}.`, 'good');
  ui.refresh();
}

/** ⬆ Level to recommended: the team for `node` (default: the next story battle). */
export function openLevelToRecommended(game, ui, { node = null, hard = false } = {}) {
  const { C, B, state } = game;
  const n = targetNode(game, node);
  const plan = planToRecommended(state, n, C, B, { hard });
  const title = h('h2', '⬆ Level to recommended');
  const forWhat = h('p.small.muted', `For ${hard ? '💀 ' : ''}${n.name} (${C.arc[n.arcId]?.name || C.tutorial?.name}). It levels the team that fights it and stops at the recommended power.`);
  const nums = h('dl.kv',
    h('dt', 'Recommended power'), h('dd', fmt(plan.target)),
    h('dt', 'Your team now'), h('dd', fmt(plan.before)),
    plan.steps.length ? [h('dt', 'After levelling'), h('dd', { class: plan.reached ? 'good-text' : 'warn-text' }, fmt(plan.power))] : null,
    plan.steps.length ? [h('dt', 'Cost'), h('dd', `🪙 ${fmt(plan.cost)} of ${fmt(state.currencies.ryo)}`)] : null);
  let body, actions;
  if (plan.before >= plan.target) {
    body = [h('p.good-text', '✓ Your team is already at the recommended power for this battle.')];
    actions = [btn('OK', () => close(), 'primary')];
  } else if (!plan.steps.length) {
    body = [h('p.warn-text', plan.full.steps.length ? `Getting there costs 🪙 ${fmt(plan.full.cost)}; you have 🪙 ${fmt(state.currencies.ryo)}. Replay cleared battles for Ryo.` : 'Levelling your own ninja can\'t raise this team further (forced ninja already fight at the battle\'s level).')];
    actions = [btn('Close', () => close(), 'primary')];
  } else {
    body = [levelList(game, plan),
      plan.reached ? null : h('p.small.warn-text', `Not enough Ryo for the whole way (🪙 ${fmt(plan.full.cost)}): this buys what you can afford.`)];
    actions = [btn('Cancel', () => close(), 'ghost'), btn(`Level up · 🪙 ${fmt(plan.cost)}`, () => buy(game, ui, plan, close, 'Levelled to recommended'), 'primary')];
  }
  const close = ui.modal(h('div', title, forWhat, nums, ...body, h('div.actions', ...actions)), { label: 'Level to recommended' });
}

/** 💰 Smart spend: every Ryo above the reserve, where it adds the most team power. */
export function openSmartSpend(game, ui, { node = null, hard = false } = {}) {
  const { C, B, state } = game;
  const holder = h('div');
  const input = h('input', { type: 'number', min: '0', step: '100', inputmode: 'numeric', value: String(ryoReserve(state, B)), 'aria-label': 'Ryo to keep in reserve' });
  let close = null;
  const draw = () => {
    const reserve = Math.max(0, Math.floor(Number(input.value) || 0));
    const plan = planSmartSpend(state, node, C, B, { hard, reserve });
    const save = () => { if (state.settings.ryoReserve !== reserve) { state.settings.ryoReserve = reserve; game.commit('settings'); } };
    holder.replaceChildren(
      h('dl.kv',
        h('dt', 'Ryo'), h('dd', `🪙 ${fmt(state.currencies.ryo)}`),
        h('dt', 'To spend'), h('dd', `🪙 ${fmt(plan.cost)}`),
        h('dt', 'Team power'), h('dd', `${fmt(plan.before)}${plan.steps.length ? ` → ${fmt(plan.power)}` : ''}`)),
      plan.steps.length ? levelList(game, plan) : h('p.small.muted', state.currencies.ryo <= reserve ? 'Your Ryo is at or below the reserve: nothing to spend.' : 'Nothing affordable adds power right now.'),
      h('div.actions', btn('Cancel', () => { save(); close(); }, 'ghost'),
        btn(plan.steps.length ? `Spend · 🪙 ${fmt(plan.cost)}` : 'Save reserve', () => { save(); plan.steps.length ? buy(game, ui, plan, close, 'Smart spend') : close(); }, 'primary')));
  };
  input.addEventListener('input', draw);
  draw();
  close = ui.modal(h('div',
    h('h2', '💰 Smart spend'),
    h('p.small.muted', `Levels your team${node ? ` for ${node.name}` : ''} where each Ryo adds the most power, and never spends below your reserve. Same costs as levelling by hand.`),
    h('label.small.reserve-field', 'Keep in reserve (Ryo) ', input),
    holder), { label: 'Smart spend' });
}

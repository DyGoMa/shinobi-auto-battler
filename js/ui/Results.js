// Results.js — the story / Hard results dialog, shared by a played battle (BattleScreen)
// and ⏭ Skip (UIManager.skipBattle). Buttons: Map · Change team · Retry · Next fight.
import { h, btn, fmt } from './dom.js';
import { isNodeUnlocked, isHardNodeUnlocked } from '../core/Progression.js';

/** Damage dealt per ninja (a finished BattleSim). */
export function statsTable(sim) {
  const players = sim.units.filter(u => u.side === 'player' && !u.protected);
  const max = Math.max(1, ...players.map(u => sim.stats.damageByUnit[u.uid] || 0));
  return h('table.dmg-table', h('tbody', ...players.map(u => h('tr',
    h('td', u.short + (u.isLeader ? ' ★' : '')),
    h('td.barcell', h('div.bar', h('i', { style: { width: `${((sim.stats.damageByUnit[u.uid] || 0) / max) * 100}%` } }))),
    h('td', { style: { textAlign: 'right' } }, fmt(sim.stats.damageByUnit[u.uid] || 0)),
  ))));
}

/** The battle after `node` if it is open (story or Hard), else null. */
export function nextOpenNode(game, node, hard) {
  const { C, state } = game;
  const next = C.nodes[node.globalIndex + 1];
  if (!next || next.placeholder) return null;
  return (hard ? isHardNodeUnlocked(state, next, C) : isNodeUnlocked(state, next, C)) ? next : null;
}

/**
 * Show the results. opts = { node, hard, won, result, sim, skipped,
 *   onMap, onTeam, onRetry, onNext(next) } — each callback gets the dialog already closed.
 */
export function showStoryResults(game, ui, { node, hard = false, won, result, sim, skipped = false, onMap, onTeam, onRetry, onNext }) {
  const { C } = game;
  const next = nextOpenNode(game, node, hard);
  const cl = sim.stats.clashes;
  const reasons = { defeated: 'Your team was defeated.', protectFailed: `${C.enemy[node.objective?.protect]?.name || 'The escort'} fell.`, timeout: 'Time ran out.', retreat: 'You retreated.' };
  const content = h('div',
    h('div.result-hero', h('div.big.' + (won ? 'win' : 'lose'), won ? 'VICTORY' : 'DEFEAT'),
      h('div.muted', `${hard ? '💀 ' : ''}${node.name} · ${sim.time.toFixed(1)}s${skipped ? ' · ⏭ skipped' : ''}`),
      !won ? h('p.small', reasons[sim.endReason] || '') : null),
    won ? h('div.reward-row',
      h('div.reward', `📜 +${fmt(result.scrolls)}`), h('div.reward', `🪙 +${fmt(result.ryo)}`),
      result.firstClear ? h('div.reward', '🏅 First clear') : h('div.reward', '↻ Replay')) : null,
    result.arcCleared ? h('div.warnbox.center', { style: { marginBottom: '10px' } }, `🎉 Arc cleared: ${C.arc[result.arcCleared].name}! Bonus included.`) : null,
    result.unlocked?.length ? h('div.warnbox.center', { style: { marginBottom: '10px' } }, '🆕 Now in the summon pools: ', h('b', result.unlocked.map(id => C.char[id].name).join(', '))) : null,
    skipped ? h('p.small.muted.center', 'Skipped: the real battle, played instantly with 🤖 clash-aware Auto-ult.') : null,
    h('h3', 'Damage dealt'), statsTable(sim),
    h('p.small', { style: { marginTop: '8px' } }, `Ultimates fired: ${sim.stats.ults} · Jutsu Clashes: ${cl.overpower} overpower, ${cl.standoff} standoff, ${cl.overwhelmed} overwhelmed · Effective hits: ${sim.stats.effective}`),
    !won ? h('p.small', '💡 Try a team whose natures beat the enemy (see the Team Builder rating), save Ultimates to clash the boss\'s ⚠ wind-ups, or level up to the recommended power (Roster).') : null,
  );
  const actions = h('div.actions.result-actions');
  const close = ui.modal(h('div', content, actions), { dismissable: false, wide: true, label: 'Battle results' });
  const then = (fn) => () => { close(); fn(); };
  actions.append(
    btn('🗺️ Map', then(onMap), 'ghost'),
    btn('👥 Change team', then(onTeam)),
    btn(skipped ? '⏭ Retry' : '↻ Retry', then(onRetry), won && next ? '' : 'primary'),
    next ? btn(`Next fight ▶`, then(() => onNext(next)), won ? 'primary' : '', { title: next.name, 'aria-label': `Next fight: ${next.name}` }) : null,
  );
  return close;
}

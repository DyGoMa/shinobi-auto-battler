// BossRushScreen.js — Akatsuki back-to-back bosses, no healing between rounds.
import { h, btn, fmt, avatar, natureChip, describeMechanic } from './dom.js';
import { isBossRushUnlocked, resolveTeam, bossRushRound } from '../core/Progression.js';
import { bossRushRewards } from '../core/formulas.js';
import { enemyToken } from './StoryMapScreen.js';
import { teamMatchupRating } from '../core/TeamPicker.js';
import { tipCard } from './tips.js';
import { screenHead } from './chrome.js';

export function render(game, ui) {
  const { C, B, state } = game;
  const R = C.bossRush;
  const unlocked = isBossRushUnlocked(state, C);
  const team = resolveTeam(state, null, C);
  const natures = R.order.flatMap(id => [C.enemy[id].natures?.[0], ...(C.enemy[id].mechanics || []).filter(m => m.type === 'telegraphAoE' && m.nature).map(m => m.nature)]).filter(Boolean);
  const rating = teamMatchupRating(team.members.map(id => C.char[id]), natures, B);

  return h('div.screen',
    screenHead(ui, { title: R.name, back: { label: 'Home', id: 'home' }, help: 'boss-rush', right: [unlocked ? h('span.pill.accent', `Best: round ${state.bossRush.highestRound || 0}`) : h('span.pill', '🔒 Locked')] }),
    unlocked ? tipCard(game, 'rush') : null,
    h('p', 'Seven Akatsuki members back to back. Your team keeps its HP and chakra between rounds — nobody heals. After Pain the rotation loops and every boss gets stronger. How far can you go?'),
    !unlocked ? h('div.warnbox', `Unlocks after clearing “${C.arc[R.unlockArc].name}”.`) : null,
    h('div.section-title', h('h2', 'Rotation')),
    h('div.grid.two', ...R.order.map((id, i) => {
      const d = C.enemy[id];
      const special = (d.mechanics || []).find(m => m.type === 'telegraphAoE');
      const lvl = bossRushRound(i + 1, C, B).level;
      return h('div.card',
        h('div.row', enemyToken(d), h('div.grow', h('b', `${i + 1}. ${d.name}`), h('div.tiny.muted', `Level ${lvl}`)), ...(d.natures?.length ? [natureChip(d.natures[0])] : [h('span.nat.none', 'No nature')])),
        special ? h('div.mech', { style: { marginTop: '8px' } }, '⚠ Special: ', h('b', special.name), special.nature ? ` (${special.nature} Style)` : ' (no nature)') : null,
        ...(d.mechanics || []).filter(m => m !== special).map(m => h('div.mech', h('b', m.name || m.type), ' — ', describeMechanic(m))),
      );
    })),
    h('div.section-title', h('h2', 'Rewards per round')),
    h('div.row', ...[1, 2, 3, 4, 5, 6, 7].map(r => { const rw = bossRushRewards(r, B); return h('span.pill', `R${r}: 📜${fmt(rw.scrolls)} 🪙${fmt(rw.ryo)}`); }), h('span.tiny.dim', `Paid for every round you clear. Loop ×${B.bossRush.loopMult} stats after round ${R.order.length}.`)),
    h('div.section-title', h('h2', 'Your team'), btn('👥 Edit', () => ui.go('team'))),
    h('div.card',
      h('div.row', ...team.members.map(id => h('div.col', { style: { alignItems: 'center', gap: '4px' } }, avatar(C.char[id]), h('span.tiny.muted', `${C.char[id].short}${id === team.leader ? ' ★' : ''} · Lv ${state.roster[id]?.level}`))),
        h('div.grow'),
        h('div', h('div.tiny.muted', 'Matchup vs Akatsuki'), h('span.matchup-stars', '★'.repeat(rating.stars) + '☆'.repeat(5 - rating.stars)), ' ', h('b', rating.label))),
    ),
    h('div.row', { style: { marginTop: '16px', justifyContent: 'flex-end' } },
      btn(unlocked ? '☁️ Start Boss Rush' : '🔒 Locked', () => unlocked ? ui.startBattle({ bossRush: true }) : ui.toast('Clear the Sasuke Retrieval Squad arc first.'), unlocked ? 'primary big' : 'big', { disabled: !unlocked })),
  );
}

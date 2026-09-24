// HomeScreen.js — landing page: continue the story, quick stats, shortcuts.
import { h, btn, fmt, avatar } from './dom.js';
import { currentNode, isBossRushUnlocked, isArcCleared, resolveTeam, unitPower } from '../core/Progression.js';

export function render(game, ui) {
  const { C, state } = game;
  const node = currentNode(state, C);
  const arc = node ? C.arc[node.arcId] : null;
  const part1 = C.nodes.filter(n => n.part === 1);
  const cleared = part1.filter(n => state.progress.cleared[n.id]).length;
  const team = resolveTeam(state, null, C);
  const power = team.members.reduce((s, id) => s + (state.roster[id] ? unitPower(C.char[id], state.roster[id], game.B) : 0), 0);
  const rush = isBossRushUnlocked(state, C);
  const owned = Object.keys(state.roster).length;

  return h('div.screen',
    h('div.hero',
      h('div.kanji', { 'aria-hidden': 'true' }, '忍'),
      h('div.pill.accent', 'Part I — The Hidden Leaf Village'),
      h('h1', { style: { marginTop: '10px' } }, 'Shinobi Auto-Battler'),
      h('p', { style: { maxWidth: '620px' } }, 'Your ninja fight on their own — you choose the team, read the Nature Wheel, and decide when to unleash each Ultimate. Fire one into an enemy\'s wind-up to trigger a ', h('b', 'Jutsu Clash'), '.'),
      h('div.cta',
        node
          ? btn(h('span', '▶ Continue: ', h('b', node.name), h('span.sub', ` · ${arc.name}`)), () => ui.go('story', { arcId: node.arcId, nodeId: node.id }), 'primary big')
          : btn('✓ Part I complete — replay any node', () => ui.go('story'), 'good big'),
        btn('👥 Team', () => ui.go('team', { nodeId: node?.id }), 'big'),
        btn('📜 Summon', () => ui.go('summon'), 'big'),
      ),
    ),
    h('div.stat-tiles',
      tile('Story progress', `${cleared} / ${part1.length}`, arc ? arc.name : 'All arcs cleared'),
      tile('Team power', fmt(power), team.members.map(id => C.char[id]?.short).join(' · ')),
      tile('Ninja recruited', `${owned} / ${C.roster.length}`, `${state.gacha.totalPulls} summons`),
      tile('Kage pity', `${Math.max(0, game.B.gacha.pity - state.gacha.pity)}`, 'summons to a guaranteed Kage'),
      tile('Boss Rush', rush ? `Round ${state.bossRush.highestRound || 0}` : '🔒', rush ? 'highest round reached' : 'clear the Sasuke Retrieval Squad'),
    ),
    h('div.section-title', h('h2', 'Your team')),
    h('div.card.hover', { onclick: () => ui.go('team', { nodeId: node?.id }) },
      h('div.row', ...team.members.map(id => h('div.col', { style: { alignItems: 'center', gap: '4px' } }, avatar(C.char[id]), h('span.tiny.muted', C.char[id].short + (id === team.leader ? ' ★' : '')))),
        h('div.grow'), h('span.muted.small', 'Edit team ›'))),
    h('div.section-title', h('h2', 'How to play')),
    h('div.grid.three',
      how('🗺️', 'Story', 'Fight through Part I in anime order. Each arc ends with a boss that has its own special mechanics.'),
      how('🔥', 'Nature Wheel', 'Fire > Wind > Lightning > Earth > Water > Fire. Effective hits deal ×1.3, resisted ones ×0.8. Check the enemy natures before each fight.'),
      how('⚡', 'Jutsu Clash', 'When an enemy telegraphs a jutsu (⚠ bar), fire a ready Ultimate into it. Beat its nature to OVERPOWER it; lose and you only blunt it.'),
      how('📜', 'Summon & level', 'Scrolls summon ninja (Genin → Kage). Ryo levels them up. Duplicates add stars; every tier stays useful.'),
    ),
    rush || isArcCleared(state, C.arc.arc_tea) ? null : h('p.small.dim', { style: { marginTop: '14px' } }, 'Tip: Replaying cleared nodes pays Ryo — handy when a boss is a wall. Ninja 5+ levels behind your best one level up at a discount.'),
    h('p.tiny.dim', { style: { marginTop: '20px' } }, 'Fan-made, non-commercial project. Naruto is © Masashi Kishimoto / Shueisha / Studio Pierrot. No official artwork is used — characters are shown as coloured tokens with initials.'),
  );
}

function tile(k, v, sub) { return h('div.tile', h('div.k', k), h('div.v', v), h('div.tiny.dim', sub)); }
function how(icon, title, text) { return h('div.card', h('h3', `${icon} ${title}`), h('p.small', text)); }

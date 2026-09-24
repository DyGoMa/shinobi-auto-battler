// HomeScreen.js — landing page: continue the story (or the tutorial), quick
// stats, shortcuts.
import { h, btn, fmt, avatar } from './dom.js';
import { currentNode, isBossRushUnlocked, isArcCleared, resolveTeam, unitPower } from '../core/Progression.js';
import { tutorialPending, nextLessonIndex, tutorialLessons } from '../core/Tutorial.js';
import { LESSON_TITLE } from './TutorialScreen.js';

export function render(game, ui) {
  const { C, B, state } = game;
  const node = currentNode(state, C);
  const arc = node ? C.arc[node.arcId] : null;
  const cleared = C.nodes.filter(n => state.progress.cleared[n.id]).length;
  const team = resolveTeam(state, null, C);
  const power = team.members.reduce((s, id) => s + (state.roster[id] ? unitPower(C.char[id], state.roster[id], B) : 0), 0);
  const rush = isBossRushUnlocked(state, C);
  const owned = Object.keys(state.roster).length;
  const tut = tutorialPending(state);
  const lessons = tutorialLessons(C);
  const W = B.natureWheel;

  const primary = tut
    ? btn(h('span', state.tutorial.status === 'new' ? '🎓 Start the tutorial' : `🎓 Continue the tutorial: `, state.tutorial.status === 'new' ? null : h('b', `Lesson ${nextLessonIndex(state) + 1} of ${lessons.length}`),
      h('span.sub', ` · ${LESSON_TITLE[lessons[nextLessonIndex(state)].lesson]}`)), () => ui.openTutorial(), 'primary big')
    : node
      ? btn(h('span', '▶ Continue: ', h('b', node.name), h('span.sub', ` · ${arc.name}`)), () => ui.go('story', { arcId: node.arcId, nodeId: node.id }), 'primary big')
      : btn('✓ Story complete — replay any battle', () => ui.go('story'), 'good big');

  return h('div.screen',
    h('div.hero',
      h('div.kanji', { 'aria-hidden': 'true' }, '忍'),
      h('div.pill.accent', tut ? 'Tutorial — The Academy' : (node?.part ?? 2) === 1 ? 'Part I — The Hidden Leaf Village' : 'Part II — Shippuden'),
      h('h1', { style: { marginTop: '10px' } }, 'Shinobi Auto-Battler'),
      h('p', { style: { maxWidth: '620px' } }, 'Your ninja fight on their own. You choose the team, read the Nature Wheel, and decide when to unleash each Ultimate. Fire one into an enemy\'s wind-up to trigger a ', h('b', 'Jutsu Clash'), '.'),
      h('div.cta',
        primary,
        tut ? btn('Skip tutorial', () => ui.skipTutorial(), 'ghost big') : null,
        btn('👥 Team', () => ui.go('team', { nodeId: node?.id }), 'big'),
        btn('📜 Summon', () => ui.go('summon'), 'big'),
      ),
    ),
    h('div.stat-tiles',
      tile('Story progress', `${cleared} / ${C.nodes.length}`, arc ? arc.name : 'All arcs cleared'),
      tile('Team power', fmt(power), team.members.map(id => C.char[id]?.short).join(' · ')),
      tile('Ninja recruited', `${owned} / ${C.roster.length}`, `${fmt(state.gacha.totalPulls)} summons`),
      tile('Kage pity', `${Math.max(0, B.gacha.pity - state.gacha.pity)}`, 'summons to a guaranteed Kage'),
      tile('Boss Rush', rush ? `Round ${state.bossRush.highestRound || 0}` : '🔒', rush ? 'highest round reached' : `clear ${C.arc[C.bossRush.unlockArc].name}`),
    ),
    h('div.section-title', h('h2', 'Your team')),
    h('div.card.hover', { onclick: () => ui.go('team', { nodeId: node?.id }), role: 'button', tabindex: '0', 'aria-label': 'Edit your team' },
      h('div.row', ...team.members.map(id => h('div.col', { style: { alignItems: 'center', gap: '4px' } }, avatar(C.char[id]), h('span.tiny.muted', C.char[id].short + (id === team.leader ? ' ★' : '')))),
        h('div.grow'), h('span.muted.small', 'Edit team ›'))),
    h('div.section-title', h('h2', 'How to play')),
    h('div.grid.three',
      how('🗺️', 'Story', 'Fight through Part I and Part II (Shippuden) in anime order. Each arc ends with a boss that has its own special mechanics.'),
      how('🔥', 'Nature Wheel', `${W.cycle.join(' › ')} › ${W.cycle[0]}. Effective hits deal ×${W.advantage}, resisted ones ×${W.disadvantage}. Check the enemy natures before each fight.`),
      how('⚡', 'Jutsu Clash', 'When an enemy shows a ⚠ wind-up bar, fire a ready Ultimate into it. Beat its nature to OVERPOWER it; a neutral clash still cancels both jutsu.'),
      how('📜', 'Summon and level', 'Scrolls summon ninja (Genin to Kage). Ryo levels them up. Duplicates add stars, and every tier stays useful.'),
    ),
    rush || isArcCleared(state, C.arc.arc_tea) ? null : h('p.small.dim', { style: { marginTop: '14px' } }, `Tip: replaying a cleared battle pays Ryo, which helps when a boss is a wall. Ninja ${B.economy.catchUp.gap}+ levels behind your best one level up at a discount.`),
    h('p.tiny.dim', { style: { marginTop: '20px' } }, 'Fan-made, non-commercial project. Naruto is © Masashi Kishimoto / Shueisha / Studio Pierrot. No official artwork is used: characters are shown as coloured tokens with initials.'),
  );
}

function tile(k, v, sub) { return h('div.tile', h('div.k', k), h('div.v', v), h('div.tiny.dim', sub)); }
function how(icon, title, text) { return h('div.card', h('h3', `${icon} ${title}`), h('p.small', text)); }

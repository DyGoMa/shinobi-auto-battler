// TutorialScreen.js — the Academy tutorial's lesson cards. Three very easy
// battles, one idea each: team building and roles, the Nature Wheel, then
// Ultimates / Jutsu Clash / Auto-ult. "Skip tutorial" is on every tutorial screen
// and pays the same reward as finishing.
import { h, btn, fmt, avatar, natureChip, episodesLabel } from './dom.js';
import { tutorialLessons, nextLessonIndex, startTutorial } from '../core/Tutorial.js';
import { resolveTeam } from '../core/Progression.js';
import { beatenBy } from '../core/formulas.js';
import { leaderBuffText } from '../core/Ninja.js';

const LESSON_TITLE = { team: 'Team building and roles', nature: 'The Nature Wheel', clash: 'Ultimates and Jutsu Clash' };
export { LESSON_TITLE };

const ROLE_INFO = [
  ['Tank', '🛡️', 'Holds the front line and soaks hits. Its Ultimate taunts enemies.'],
  ['Striker', '⚔️', 'Hits hard up close, even from right behind a Tank.'],
  ['Ranged', '🎯', 'Attacks from the back row, far behind the front line.'],
  ['Support', '✚', 'Stays back and heals or powers up the whole team.'],
];

let quiz = { lesson: null, picked: null };

export function render(game, ui, params) {
  const { C, B, state } = game;
  const lessons = tutorialLessons(C);
  const replay = !!params.replay;
  const T = state.tutorial;
  const done = !replay && T.status === 'done';
  const index = Math.max(0, Math.min(lessons.length - 1, params.lesson ?? (replay ? 0 : nextLessonIndex(state))));
  const node = lessons[index];
  const R = B.tutorial.rewards;

  const header = h('div.screen-head',
    btn('‹ Home', () => ui.go('home'), 'ghost small back-btn'),
    h('h1', 'Tutorial'),
    h('div.grow'),
    done || replay ? null : btn('Skip tutorial', () => ui.skipTutorial(), 'ghost small'));

  const steps = h('ol.lesson-steps', ...lessons.map((n, i) => {
    const cls = i < index || done ? 'done' : i === index ? 'current' : 'next';
    return h('li.' + cls, h('span.num', cls === 'done' ? '✓' : String(i + 1)), h('span', LESSON_TITLE[n.lesson]));
  }));

  if (done) {
    return h('div.screen',
      header,
      h('div.card.center',
        h('div.big-emoji', { 'aria-hidden': 'true' }, '🎓'),
        h('h2', T.completed ? 'Tutorial complete' : 'Tutorial skipped'),
        h('p', 'The Survival Test is next: Kakashi gives Team 7 until noon to take his bells.'),
        h('div.row', { style: { justifyContent: 'center' } },
          btn('📜 Summon ninja', () => ui.go('summon')),
          btn('🗺️ Go to the Survival Test ▶', () => ui.go('story', { arcId: C.arcs[0].id, nodeId: C.nodes[0].id }), 'primary')),
        h('p.small.muted', { style: { marginTop: '12px' } }, 'You can replay the lessons any time from the Wiki or Settings.'),
        btn('↻ Replay the tutorial', () => ui.go('tutorial', { replay: true, lesson: 0 }), 'ghost')),
    );
  }

  const enemies = [...new Map(node.enemies.map(e => [e.id, C.enemy[e.id]])).values()];
  const team = resolveTeam(state, node, C);
  const fightLabel = node.lesson === 'team' ? '👥 Build your team ▶' : '⚔️ Start the lesson ▶';
  const start = () => {
    if (!replay) { startTutorial(state); game.commit('tutorial'); }
    if (node.lesson === 'team') ui.go('team', { tutorialLesson: index, replay });
    else ui.startBattle({ node, tutorial: { index, replay } });
  };
  const needsQuiz = node.lesson === 'nature' && quiz.lesson !== node.id;

  return h('div.screen',
    header,
    h('p', C.tutorial.blurb),
    steps,
    h('div.card.lesson-card',
      h('div.tiny.muted', `Lesson ${index + 1} of ${lessons.length}${replay ? ' · replay' : ''}`),
      h('h2', LESSON_TITLE[node.lesson]),
      h('div.row', h('span.pill', `“${node.name}”`), h('span.tiny.muted', episodesLabel(node.episodes))),
      h('p', { style: { marginTop: '10px' } }, node.blurb),
      h('div.learn', '🎓 ', h('b', 'You\'ll learn: '), node.learn),
      concept(game, ui, node, team, enemies),
      h('div.divider'),
      h('div.row.between',
        h('div', h('div.tiny.muted', 'Enemy'), h('div.row', ...enemies.map(d => h('span.row', { style: { gap: '6px' } }, h('b', d.name), ...(d.natures.length ? d.natures.map(n => natureChip(n)) : [h('span.nat.none', 'No nature')]))))),
        h('div', h('div.tiny.muted', node.team?.forced ? 'Team for this lesson' : 'Your team'),
          h('div.row', ...team.members.map(id => h('div.col', { style: { alignItems: 'center', gap: '2px' } }, avatar(C.char[id], { size: 'sm' }), h('span.tiny', C.char[id].short + (id === team.leader ? ' ★' : ''))))))),
      h('div.row', { style: { marginTop: '16px', justifyContent: 'flex-end' } },
        btn(fightLabel, start, 'primary big', { disabled: needsQuiz, title: needsQuiz ? 'Answer the question above first' : '' })),
    ),
    replay ? null : h('p.small.muted.center', { style: { marginTop: '12px' } }, `Finish the tutorial (or skip it) for 📜 ${fmt(R.scrolls)} scrolls and 🪙 ${fmt(R.ryo)} Ryo.`),
  );
}

/** The lesson's teaching panel: roles, a Nature Wheel question, or the clash outcomes. */
function concept(game, ui, node, team, enemies) {
  const { C, B } = game;
  if (node.lesson === 'team') {
    const leader = team.leader ? C.char[team.leader] : null;
    return h('div.concept',
      h('h3', 'Three members and a Leader'),
      h('p.small', 'Your team has four slots. Three are members; the fourth is your ★ Leader, who fights too and gives the team a passive buff.'),
      leader ? h('p.small', `Right now ${leader.name} leads: ${leaderBuffText(leader, B)}.`) : null,
      h('h3', 'Roles decide where ninja fight'),
      h('ul.role-list', ...ROLE_INFO.map(([role, icon, text]) => h('li', h('span.role-ico', { 'aria-hidden': 'true' }, icon), h('div', h('b', role), h('div.small.muted', text))))),
      h('div.lane-demo', { 'aria-label': 'Lane order' },
        h('span', '✚ / 🎯'), h('span.arrow', '→'), h('span', '⚔️'), h('span.arrow', '→'), h('span', '🛡️'), h('span.arrow', '→'), h('span.foe', 'Enemy')),
      h('p.small.muted', 'Front to back: Tanks first, then Strikers, then Ranged and Support ninja.'
        + (Object.keys(game.state.roster).some(id => C.char[id]?.role === 'Tank') ? '' : ' You don\'t have a Tank yet: summon one after the tutorial.')),
    );
  }
  if (node.lesson === 'nature') {
    const enemyNature = enemies[0]?.natures?.[0];
    const answer = beatenBy(enemyNature, B);
    const cycle = B.natureWheel.cycle;
    const picked = quiz.lesson === node.id ? quiz.picked : null;
    const wheel = h('div.wheel-row', ...cycle.flatMap((n, i) => [natureChip(n), h('span.gt', '›')]), natureChip(cycle[0]));
    const counters = C.roster.filter(c => (node.team?.forced || []).concat(node.team?.leader || []).includes(c.id) && c.natures.includes(answer));
    return h('div.concept',
      h('h3', 'Every nature beats the next one'),
      wheel,
      h('p.small', `An effective hit deals ×${B.natureWheel.advantage}; a resisted one deals ×${B.natureWheel.disadvantage}. Ninja with several natures always attack with their best one.`),
      h('div.quiz',
        h('b', `${enemies[0].name} fights with ${enemyNature} Style. Which nature beats ${enemyNature}?`),
        h('div.quiz-options', ...cycle.map(n => h('button.quiz-opt' + (picked === n ? (n === answer ? '.right' : '.wrong') : ''), {
          type: 'button', onclick: () => { quiz = { lesson: node.id, picked: n }; ui.refresh(); },
        }, natureChip(n)))),
        picked ? h('p.small', { class: picked === answer ? 'quiz-ok' : 'quiz-no' },
          picked === answer ? `Right! ${answer} beats ${enemyNature}. ` : `Not quite: ${answer} beats ${enemyNature} (${picked} ${relationWord(picked, enemyNature, B)}). `,
          counters.length ? `${counters.map(c => c.short).join(' and ')} use ${answer} Style, so their hits will be EFFECTIVE.` : '') : null),
    );
  }
  // clash
  const J = B.jutsuClash;
  const row = (label, cls, when, effect) => h('tr', h('td', h('span.clash.' + cls, label)), h('td.small', when), h('td.small', effect));
  return h('div.concept',
    h('h3', 'Ultimates'),
    h('p.small', 'Chakra fills while your ninja fight. When a portrait glows, that ninja\'s Ultimate is ready: tap it (or press 1–4) to fire.'),
    h('h3', 'Jutsu Clash'),
    h('p.small', 'Enemy jutsu show a ⚠ wind-up bar before they land. Fire an Ultimate during the wind-up to meet it head-on. Your ninja\'s best nature against the jutsu\'s nature decides the result:'),
    h('table.clash-table', h('tbody',
      row('▲ OVERPOWER', 'overpower', 'your nature beats theirs', `their jutsu is cancelled, your Ultimate hits ×${J.overpowerUltMult}, the caster is stunned and you get chakra back`),
      row('= STANDOFF', 'standoff', 'neutral', `both jutsu fizzle; your Ultimate still hits at ×${J.standoffUltMult}`),
      row('▼ WEAK', 'overwhelmed', 'their nature beats yours', 'you are Overwhelmed: no damage, but their jutsu is still blocked and most of your chakra comes back'))),
    h('h3', 'Auto-ult'),
    h('p.small', 'The 🤖 button in battle fires Ultimates for you. It clashes when your nature wins and holds any ninja that would be Overwhelmed.'),
  );
}

/** How a wrong quiz answer relates to the enemy's nature (the right one beats it). */
function relationWord(a, d, B) {
  const cyc = B.natureWheel.cycle;
  if (cyc[(cyc.indexOf(d) + 1) % cyc.length] === a) return `is beaten by ${d}`;
  return a === d ? 'is the same nature, so it\'s neutral' : `is neutral against ${d}`;
}

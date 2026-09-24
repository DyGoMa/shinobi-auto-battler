// DailyScreen.js — today's Daily challenge: the fight, its twist, attempts left,
// the reward and a countdown to tomorrow's. Picked from the date (js/core/Daily.js).
import { h, btn, fmt, avatar, natureChip, objectiveText } from './dom.js';
import { screenHead } from './chrome.js';
import { tipCard } from './tips.js';
import { enemyToken } from './StoryMapScreen.js';
import { dailyFor, dailyRecord, attemptsLeft, dailyReward, dailyEnemyNature, isDailyUnlocked, TWIST_TEXT } from '../core/Daily.js';
import { resolveTeam } from '../core/Progression.js';
import { beatenBy } from '../core/formulas.js';

/** "5 h 12 min" until local midnight. */
export function timeToTomorrow(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const mins = Math.max(1, Math.ceil((next - now) / 60000));
  const hrs = Math.floor(mins / 60);
  return hrs ? `${hrs} h ${mins % 60} min` : `${mins} min`;
}

export function render(game, ui) {
  const { C, B, state } = game;
  const head = screenHead(ui, { title: 'Daily challenge', back: { label: 'Home', id: 'home' }, help: 'guide/endgame' });
  if (!isDailyUnlocked(state, C, B)) {
    return h('div.screen', head,
      h('div.card.center',
        h('div.big-emoji', { 'aria-hidden': 'true' }, '📅'),
        h('h2', 'Not open yet'),
        h('p', `Clear ${C.arc[B.daily.unlockArc].name} to unlock the Daily challenge: a new fight with a twist every day.`),
        btn('🗺️ Go to the story', () => ui.go('story'), 'primary')));
  }
  const daily = dailyFor(state, C, B);
  const rec = dailyRecord(state, daily.dateKey);
  const left = attemptsLeft(state, B, daily.dateKey);
  const tw = TWIST_TEXT[daily.twist.id];
  const team = resolveTeam(state, null, C);
  const teamDefs = team.members.map(id => C.char[id]);
  const nature = dailyEnemyNature(daily, teamDefs, B);
  const reward = dailyReward(state, C, B);
  const canFight = !rec.cleared && left > 0;
  const power = daily.twist.power ?? 1;
  const bosses = daily.rounds.map(n => { const e = n.enemies.find(x => x.boss) || n.enemies[0]; return { node: n, def: C.enemy[e.id] }; });

  return h('div.screen', head,
    tipCard(game, 'daily'),
    h('div.card.daily-hero',
      h('div.row.between', h('div.tiny.muted', new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })),
        rec.cleared ? h('span.pill.good', '✓ Cleared today') : h('span.pill', `${left} of ${B.daily.attemptsPerDay} attempts left`)),
      h('h2', `${tw.icon} ${tw.name}`),
      h('p', tw.text(daily)),
      power < 1 ? h('p.small.muted', `To make up for it, the enemies have ${Math.round(power * 100)}% of their usual HP and ATK.`) : null,
      nature ? h('div.row', h('span.small.muted', daily.twist.id === 'counteredOnly' ? 'With your current team, enemies fight with' : 'Enemies fight with'), natureChip(nature),
        h('span.small.muted', '· beaten by'), natureChip(beatenBy(nature, B))) : null,
      h('div.divider'),
      h('h3', daily.rounds.length > 1 ? 'Your opponents' : 'Your opponent'),
      h('div.enemy-list', ...bosses.map(({ node, def }, i) => h('div.enemy-row', enemyToken(def),
        h('div.grow', h('div.row', h('span.en', `${daily.rounds.length > 1 ? `${i + 1}. ` : ''}${def.name}`), h('span.pill', `Lv ${daily.level}`)),
          h('div.mech', `${C.arc[node.arcId].name} — ${node.name}`),
          h('div.mech', '🎯 ', daily.twist.id === 'bossRush' ? 'Defeat the boss' : objectiveText(node.objective, C)))))),
      h('div.divider'),
      h('div.row.between',
        h('div.row', h('span.small.muted', 'First clear today:'), h('span.pill', `📜 +${fmt(reward.scrolls)}`), h('span.pill', `🪙 +${fmt(reward.ryo)}`)),
        h('span.small.muted', `Lifetime clears: ${state.daily.totalCleared || 0}`)),
      h('div.row', { style: { marginTop: '14px', justifyContent: 'flex-end' } },
        h('div.row.grow', ...team.members.map(id => avatar(C.char[id], { size: 'sm' }))),
        btn('👥 Edit team', () => ui.go('team', { daily: true })),
        btn(rec.cleared ? '✓ Cleared' : left ? '⚔️ Fight!' : 'No attempts left', () => ui.startBattle({ daily }), canFight ? 'primary big' : 'big', { disabled: !canFight })),
    ),
    h('p.small.muted.center', { style: { marginTop: '12px' } }, `A new challenge in ${timeToTomorrow()}. Everyone at the same point of the story gets the same challenge on the same day.`),
  );
}

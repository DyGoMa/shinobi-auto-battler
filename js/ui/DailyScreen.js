// DailyScreen.js — today's Daily challenges: a card per challenge (the fight, its
// twist, attempts left, the reward), the team, and a countdown to tomorrow's.
// Picked from the date (js/core/Daily.js); balance.daily.challengesPerDay a day.
import { h, btn, fmt, avatar, natureChip, objectiveText } from './dom.js';
import { screenHead } from './chrome.js';
import { tipUnlessScene } from './tips.js';
import { enemyToken } from './StoryMapScreen.js';
import { dailiesFor, slotRecord, attemptsLeft, clearedToday, dailyReward, dailyEnemyNature, isDailyUnlocked, TWIST_TEXT } from '../core/Daily.js';
import { resolveTeam } from '../core/Progression.js';
import { beatenBy } from '../core/formulas.js';
import { eraOfPart } from '../render/Assets.js';

/** "5 h 12 min" until local midnight. */
export function timeToTomorrow(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const mins = Math.max(1, Math.ceil((next - now) / 60000));
  const hrs = Math.floor(mins / 60);
  return hrs ? `${hrs} h ${mins % 60} min` : `${mins} min`;
}

/** The first visit once it is open: Might Guy on the Daily (docs/STORY_PLAN.md §4). */
export function afterRender(el, game, ui) {
  if (isDailyUnlocked(game.state, game.C, game.B)) ui.teach('dailyFirst');
}

export function render(game, ui) {
  const { C, B, state } = game;
  const head = screenHead(ui, { title: 'Daily challenges', back: { label: 'Home', id: 'home' }, help: 'guide/endgame' });
  if (!isDailyUnlocked(state, C, B)) {
    return h('div.screen', head,
      h('div.card.center',
        h('div.big-emoji', { 'aria-hidden': 'true' }, '📅'),
        h('h2', 'Not open yet'),
        h('p', `Clear ${C.arc[B.daily.unlockArc].name} to unlock the Daily challenges: new fights with a twist every day.`),
        btn('🗺️ Go to the story', () => ui.go('story'), 'primary')));
  }
  const dailies = dailiesFor(state, C, B);
  const team = resolveTeam(state, null, C);
  const teamDefs = team.members.map(id => C.char[id]);
  const reward = dailyReward(state, C, B);
  const done = clearedToday(state, B, dailies[0].dateKey);
  if (dailies[0].rounds[0]?.part) ui.setEra(eraOfPart(dailies[0].rounds[0].part));   // the Daily wears its first boss's era

  return h('div.screen', head,
    tipUnlessScene(game, 'daily'),
    h('div.card',
      h('div.row.between',
        h('div', h('div.tiny.muted', new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })),
          h('b', `${dailies.length} challenge${dailies.length === 1 ? '' : 's'} today`)),
        h('span.pill' + (done === dailies.length ? '.good' : ''), `${done} of ${dailies.length} cleared`)),
      h('div.row', { style: { marginTop: '10px' } },
        h('div.row.grow', h('span.small.muted', 'Your team:'), ...team.members.map(id => avatar(C.char[id], { size: 'sm' }))),
        h('span.small.muted', `Lifetime clears: ${state.daily.totalCleared || 0}`))),
    ...dailies.map(daily => challengeCard(game, ui, daily, teamDefs, reward)),
    h('p.small.muted.center', { style: { marginTop: '12px' } }, `New challenges in ${timeToTomorrow()}. Everyone at the same point of the story gets the same challenges on the same day.`),
  );
}

function challengeCard(game, ui, daily, teamDefs, reward) {
  const { C, B, state } = game;
  const rec = slotRecord(state, daily.slot, daily.dateKey, B);
  const left = attemptsLeft(state, B, daily.dateKey, daily.slot);
  const tw = TWIST_TEXT[daily.twist.id];
  const nature = dailyEnemyNature(daily, teamDefs, B);
  const canFight = !rec.cleared && left > 0;
  const power = daily.twist.power ?? 1;
  const bosses = daily.rounds.map(n => { const e = n.enemies.find(x => x.boss) || n.enemies[0]; return { node: n, def: C.enemy[e.id] }; });
  return h('div.card.daily-hero', { 'data-slot': String(daily.slot) },
    h('div.row.between', h('div.tiny.muted', `Challenge ${daily.slot + 1}`),
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
      h('div.row', h('span.small.muted', 'First clear:'), h('span.pill', `📜 +${fmt(reward.scrolls)}`), h('span.pill', `🪙 +${fmt(reward.ryo)}`)),
      h('div.row',
        btn('👥 Edit team', () => ui.go('team', { daily: true, slot: daily.slot })),
        btn(rec.cleared ? '✓ Cleared' : left ? '⚔️ Fight!' : 'No attempts left', () => ui.startBattle({ daily }), canFight ? 'primary' : '', { disabled: !canFight }))),
  );
}

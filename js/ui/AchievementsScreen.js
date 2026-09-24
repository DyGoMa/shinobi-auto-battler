// AchievementsScreen.js — every achievement by category, with progress bars and
// claimable rewards. Achievements unlock by themselves (js/core/Achievements.js);
// rewards are paid here.
import { h, btn, fmt, avatar } from './dom.js';
import { screenHead } from './chrome.js';
import { tipCard } from './tips.js';
import { ACHIEVEMENT_CATEGORIES } from '../content/achievements.js';
import { achievementProgress, achievementConfig, achievementText, claimAchievement, claimAll, claimableAchievements, isUnlocked, isClaimed, bestFormFamily } from '../core/Achievements.js';

/** "🪙 1,500 · 🎟️ ×2" for a reward object (plus the exclusive ninja, if any). */
export function rewardChips(reward, a, C) {
  const out = [];
  if (reward?.ryo) out.push(h('span.pill', `🪙 ${fmt(reward.ryo)}`));
  if (reward?.scrolls) out.push(h('span.pill', `📜 ${fmt(reward.scrolls)}`));
  if (reward?.tickets) out.push(h('span.pill', { title: 'Summon tickets: one free summon each' }, `🎟️ ×${reward.tickets}`));
  if (reward?.rareTickets) out.push(h('span.pill.accent', { title: 'Rare+ summon tickets: a summon guaranteed Rare or better' }, `🎫 Rare+ ×${reward.rareTickets}`));
  if (a?.rewardCharacter) out.push(h('span.pill.accent', `🌟 ${C.char[a.rewardCharacter].name}`));
  return out;
}

export function render(game, ui) {
  const { C, B, state } = game;
  const all = C.achievements;
  const unlocked = all.filter(a => isUnlocked(state, a.id)).length;
  const ready = claimableAchievements(state, C);
  const claim = (id) => {
    const r = claimAchievement(state, id, C, B);
    if (!r.ok) return;
    game.audio.achievement?.();
    game.commit('claim');
    if (r.character) announceCharacter(game, ui, r.character);
    else ui.toast('Reward claimed!', 'good');
    ui.refresh();
  };
  return h('div.screen',
    screenHead(ui, { title: 'Achievements', back: { label: 'Home', id: 'home' }, help: 'guide/achievements' }),
    tipCard(game, 'achievements'),
    h('div.card.ach-summary',
      h('div', h('div.tiny.muted', 'Unlocked'), h('div.big-num', `${unlocked} / ${all.length}`)),
      h('div.grow', h('div.bar', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(all.length), 'aria-valuenow': String(unlocked), 'aria-label': 'Achievements unlocked' }, h('i', { style: { width: `${(unlocked / all.length) * 100}%` } }))),
      ready.length ? btn(`🎁 Claim all (${ready.length})`, () => {
        const res = claimAll(state, C, B);
        game.audio.achievement?.();
        game.commit('claim');
        const ch = res.find(r => r.character);
        if (ch) announceCharacter(game, ui, ch.character);
        else ui.toast(`Claimed ${res.length} reward${res.length === 1 ? '' : 's'}!`, 'good');
        ui.refresh();
      }, 'primary') : h('span.small.muted', 'No rewards waiting')),
    ...ACHIEVEMENT_CATEGORIES.map(cat => h('section.wsec',
      h('h2', `${cat.icon} ${cat.name}`),
      h('div.ach-list', ...all.filter(a => a.category === cat.id).map(a => card(game, ui, a, claim))))),
  );
}

function card(game, ui, a, claim) {
  const { C, B, state } = game;
  const p = achievementProgress(a, state, C, B);
  const done = isUnlocked(state, a.id), got = isClaimed(state, a.id);
  const reward = achievementConfig(a, B).reward;
  let label = `${fmt(p.value)} / ${fmt(p.target)}`;
  if (a.type === 'forms') { const f = bestFormFamily(state, C); if (f) label = `${f.have} / ${f.ids.length} forms of ${C.char[f.base].name}`; }
  return h('div.card.ach' + (got ? '.claimed' : done ? '.ready' : ''),
    h('div.row.between', h('h3', { style: { margin: 0 } }, (got ? '✓ ' : done ? '🏆 ' : '') + a.name),
      got ? h('span.pill.good', 'Claimed') : done ? btn('Claim', () => claim(a.id), 'primary small') : h('span.tiny.muted', label)),
    h('p.small', achievementText(a, B)),
    got || done ? null : h('div.bar', { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(p.target), 'aria-valuenow': String(p.value), 'aria-label': `${a.name} progress` }, h('i', { style: { width: `${(p.value / p.target) * 100}%` } })),
    h('div.row.tight', { style: { marginTop: '8px' } }, h('span.tiny.muted', 'Reward'), ...rewardChips(reward, a, C)));
}

/** The exclusive form's reveal. */
function announceCharacter(game, ui, id) {
  const d = game.C.char[id];
  const close = ui.modal(h('div.center',
    h('div.big-emoji', { 'aria-hidden': 'true' }, '🌟'),
    h('h2', `${d.name} joins your team!`),
    h('div', { style: { display: 'grid', placeItems: 'center', margin: '10px 0' } }, avatar(d, { size: 'lg' })),
    h('p', `An achievement-exclusive form: it never appears in any banner.${game.B.achievements.exclusiveJoinsAtBestFormLevel && d.formOf ? ` It joins at the level of your best-levelled ${game.C.char[d.formOf].short} form.` : ''}`),
    h('div.actions', { style: { justifyContent: 'center' } },
      btn('View in the Wiki', () => { close(); ui.openWiki(`character/${id}`); }),
      btn('Great!', () => close(), 'primary'))), { label: 'New ninja' });
}

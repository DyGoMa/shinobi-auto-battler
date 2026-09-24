// tips.js — one-time screen tips. Each screen shows its tip the first time the
// player reaches it; "Got it" stores it in the save (state.tips.seen) so it never
// repeats. Settings → "Show tips again" turns them back on (and resets them).
// Every number comes from balance.js so a tip can never go stale.
import { h, btn, pctStr } from './dom.js';

export const SCREEN_TIPS = {
  story: {
    icon: '🗺️', title: 'The story map',
    text: () => 'Each arc ends with a 👑 boss. Tap a battle to see its enemies and their natures, then build a team that counters them. Cleared battles can be replayed for Ryo.',
  },
  team: {
    icon: '👥', title: 'Building a team',
    text: () => 'Tap a slot, then a ninja. Three members fight alongside a ★ Leader, who fights too and gives a team buff. ▲ marks ninja that are effective against this battle\'s enemies, ▼ marks ninja they counter.',
  },
  roster: {
    icon: '📖', title: 'Your roster',
    text: (g) => `Spend Ryo to level up. A ninja ${g.B.economy.catchUp.gap} or more levels behind your best one levels up ${pctStr(g.B.economy.catchUp.discount)} cheaper, so a nature counter from the bench catches up fast.`,
  },
  character: {
    icon: '🥷', title: 'Ninja details',
    text: (g) => `Level up with +1, +5 or Max. Duplicate summons add a star (+${pctStr(g.B.stats.starBonus)} stats each, up to ${g.B.stats.starCap}★). Alternate forms of the same ninja can't share a team.`,
  },
  summon: {
    icon: '📜', title: 'Summoning',
    text: (g) => `A Kage is guaranteed within ${g.B.gacha.pity} summons, and the counter carries across every banner. Arc banners boost their featured ninja, and villains join the pools once their arc is cleared.`,
  },
  rush: {
    icon: '☁️', title: 'Boss Rush',
    text: () => 'Seven Akatsuki back to back. HP and chakra carry over and nobody heals between rounds, so bring a healer and save Ultimates for Jutsu Clashes.',
  },
  wiki: {
    icon: '📚', title: 'The Wiki',
    text: () => 'Search any ninja, jutsu, enemy or battle. Every screen has a ? button that opens its page here, and the guides explain each system step by step.',
  },
  settings: {
    icon: '⚙️', title: 'Settings',
    text: () => 'Link a Google account to keep your save on every device. Tips like this one can be switched back on here.',
  },
};

export function tipsEnabled(state) { return state.settings?.tips !== false; }
export function tipSeen(state, id) { return !!state.tips?.seen?.[id]; }

export function markTipSeen(game, id) {
  if (tipSeen(game.state, id)) return;
  game.state.tips.seen[id] = Date.now();
  game.commit('tip');
}

/** Turn tips on and forget which ones were seen, so each shows once more. */
export function resetTips(game) {
  game.state.settings.tips = true;
  game.state.tips.seen = {};
  game.commit('tips');
}

/** The one-time tip card for a screen, or null if it was already seen / tips are off. */
export function tipCard(game, id) {
  const t = SCREEN_TIPS[id];
  if (!t || !tipsEnabled(game.state) || tipSeen(game.state, id)) return null;
  const el = h('div.tip-card', { role: 'note', 'aria-label': `Tip: ${t.title}` },
    h('span.tip-ico', { 'aria-hidden': 'true' }, t.icon || '💡'),
    h('div.tip-body', h('b', t.title), h('p', typeof t.text === 'function' ? t.text(game) : t.text)),
    btn('Got it', () => { markTipSeen(game, id); el.remove(); }, 'small'));
  return el;
}

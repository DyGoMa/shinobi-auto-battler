// RosterScreen.js — every character (owned or not), details and level-ups.
import { h, btn, fmt, avatar, natureChips, stars, roleTag, tierTag } from './dom.js';
import { characterStats, powerRating, leaderBuffText } from '../core/Ninja.js';
import { canLevelUp, levelUp, isCharacterAvailable, levelCostFor } from '../core/Progression.js';
import { TIERS, TIER_LABEL } from '../core/formulas.js';
import { tipCard } from './tips.js';

let filter = { show: 'all', role: 'All', tier: 'All' };

const ULT_DESC = {
  single: 'Big single-target hit',
  aoe: 'Area hit on every enemy near the target',
  taunt: 'Taunt: enemies must attack this ninja, who takes reduced damage',
  heal: 'Heals the whole team',
  buff: 'Raises the whole team\'s ATK for a while',
};
const RANGE_NAME = { melee: 'Melee (front line)', reach: 'Reach (can hit from behind a Tank)', mid: 'Mid range', long: 'Long range' };

export function render(game, ui) {
  const { C, B, state } = game;
  const roles = ['All', 'Tank', 'Striker', 'Ranged', 'Support'];
  const tiers = ['All', ...TIERS];
  const rows = C.roster
    .filter(d => filter.show === 'all' || (filter.show === 'owned' ? state.roster[d.id] : !state.roster[d.id]))
    .filter(d => filter.role === 'All' || d.role === filter.role)
    .filter(d => filter.tier === 'All' || d.tier === filter.tier)
    .sort((a, b) => (!!state.roster[b.id] - !!state.roster[a.id]) || (TIERS.indexOf(b.tier) - TIERS.indexOf(a.tier)) || a.name.localeCompare(b.name));
  const ownedCount = C.roster.filter(d => state.roster[d.id]).length;

  const chipset = (key, values, label = (v) => v) => h('div.filters', ...values.map(v => h('button.chip' + (filter[key] === v ? '.on' : ''), { type: 'button', onclick: () => { filter[key] = v; ui.refresh(); } }, label(v))));

  return h('div.screen',
    h('div.row.between', h('h1', 'Roster'), h('span.pill', `${ownedCount} / ${C.roster.length} recruited`)),
    tipCard(game, 'roster'),
    h('p.small', 'Level up with Ryo. Duplicate summons add a star (+10% stats each, up to 5★); duplicates past 5★ refund Ryo. Ninja 5+ levels behind your highest level up at a catch-up discount.'),
    chipset('show', ['all', 'owned', 'missing'], v => ({ all: 'All', owned: 'Owned', missing: 'Missing' })[v]),
    chipset('role', roles),
    chipset('tier', tiers, v => v === 'All' ? 'All tiers' : TIER_LABEL[v]),
    h('div.char-grid', ...rows.map(d => card(game, ui, d))),
  );
}

function card(game, ui, d) {
  const { C, B, state } = game;
  const own = state.roster[d.id];
  const avail = isCharacterAvailable(state, d, C);
  if (!own) {
    return h('div.char-card.locked', { onclick: () => openDetail(game, ui, d) },
      avatar(d, { unknown: !avail }),
      h('div.name', avail ? d.name : '???'),
      h('div.meta', tierTag(d.tier)),
      h('div.tiny.dim', avail ? 'Not recruited — summon to unlock' : `Joins after ${C.arc[d.unlock.arcCleared || d.unlock.arcReached]?.name}`),
    );
  }
  const s = characterStats(d, own.level, own.stars, B);
  const lu = canLevelUp(state, d.id, B);
  return h('div.char-card', { onclick: () => openDetail(game, ui, d) },
    h('span.lvl', `Lv ${own.level}`),
    lu.ok ? h('span.badge-tl.pill.good', { style: { padding: '1px 6px' } }, '▲') : null,
    avatar(d),
    h('div.name', d.name),
    h('div.meta', stars(own.stars)),
    h('div.meta', roleTag(d.role), ...natureChips(d)),
    h('div.power', `Power ${fmt(powerRating(s))}`),
  );
}

export function openDetail(game, ui, d) {
  const { C, B, state } = game;
  let close;
  const body = () => {
    const own = state.roster[d.id];
    const lvl = own?.level ?? 1, st = own?.stars ?? 1;
    const s = characterStats(d, lvl, st, B);
    const n = own ? characterStats(d, lvl + 1, st, B) : null;
    const lu = own ? canLevelUp(state, d.id, B) : { ok: false };
    const cost = own ? levelCostFor(state, d.id, B) : { cost: 0 };
    const diff = (a, b) => (b != null && b > a ? h('span.match-up.small', ` +${fmt(b - a)}`) : null);
    const doLevel = (times) => {
      let done = 0, spent = 0;
      for (let i = 0; i < times; i++) { const r = levelUp(state, d.id, B); if (!r.ok) break; done++; spent += r.cost; }
      if (done) { game.audio.levelUp(); game.commit('levelup'); ui.toast(`${d.short} reached Lv ${state.roster[d.id].level} (−${fmt(spent)} Ryo)`, 'good'); }
      rerender();
    };
    return h('div',
      tipCard(game, 'character'),
      h('div.row', avatar(d, { size: 'lg' }),
        h('div.col', { style: { gap: '4px' } },
          h('h2', { style: { margin: 0 } }, d.name),
          h('div.row', tierTag(d.tier), roleTag(d.role)),
          h('div.row', ...natureChips(d), own ? stars(st) : h('span.pill', 'Not recruited')),
          d.formOf ? h('div.tiny.muted', `Alternate form of ${C.char[d.formOf].name} — only one of them can be in a team.`) : null,
        )),
      h('div.divider'),
      h('dl.kv',
        h('dt', 'Level'), h('dd', own ? `${lvl} / ${B.stats.levelCap}` : '—'),
        h('dt', 'HP'), h('dd', fmt(s.maxHp), diff(s.maxHp, n?.maxHp)),
        h('dt', 'ATK'), h('dd', fmt(s.atk), diff(s.atk, n?.atk)),
        h('dt', 'DEF'), h('dd', fmt(s.def), diff(s.def, n?.def)),
        h('dt', 'Attack every'), h('dd', `${s.attackInterval.toFixed(2)}s`),
        h('dt', 'Range'), h('dd', RANGE_NAME[d.range || B.stats.roles[d.role].range]),
        h('dt', 'Crit chance'), h('dd', `${Math.round(s.critChance * 100)}%`),
        h('dt', 'Power'), h('dd', fmt(powerRating(s))),
      ),
      h('div.divider'),
      h('h3', `Ultimate: ${d.ult.name}`),
      h('p.small', ULT_DESC[d.ult.type] + (d.ult.stun ? ', and stuns' : '') + '. Fires when chakra is full — tap the glowing portrait. Fire it into an enemy wind-up to Jutsu Clash.'),
      h('h3', 'Leader buff'),
      h('p.small', leaderBuffText(d, B)),
      d.taijutsu ? h('p.small', '🥋 Taijutsu specialist: neutral on the Nature Wheel, never resisted, ignores part of enemy DEF, and can never be Overwhelmed in a Jutsu Clash.') : null,
      h('div.actions',
        own ? h('span.small.muted.grow', lu.ok ? `Next level: ${fmt(cost.cost)} Ryo${cost.discounted ? ' (catch-up −' + Math.round(B.economy.catchUp.discount * 100) + '%)' : ''}` : (lu.reason || '')) : h('span.small.muted.grow', 'Summon this ninja to level them.'),
        own ? btn('+1', () => doLevel(1), 'primary', { disabled: !lu.ok }) : null,
        own ? btn('+5', () => doLevel(5), '', { disabled: !lu.ok }) : null,
        own ? btn('Max', () => doLevel(B.stats.levelCap), '', { disabled: !lu.ok }) : null,
        btn('Close', () => close(), 'ghost'),
      ),
    );
  };
  const holder = h('div', body());
  const rerender = () => { holder.replaceChildren(body()); ui.refreshTop(); };
  close = ui.modal(holder, { onClose: () => ui.refresh() });
}

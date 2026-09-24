// TeamBuilderScreen.js — pick 3 members + 1 Leader, with a live Nature Wheel
// matchup rating against the selected node and lane-reach warnings.
import { h, btn, fmt, avatar, natureChips, natureChip, stars, roleTag } from './dom.js';
import { currentNode, resolveTeam, isNodeUnlocked, unitPower, nodeEnemyLevel } from '../core/Progression.js';
import { nodeEnemyNatures, teamMatchupRating, characterMatchup, autoPickTeam } from '../core/TeamPicker.js';
import { leaderBuffText } from '../core/Ninja.js';
import { tutorialLessons } from '../core/Tutorial.js';
import { tipCard } from './tips.js';

let selectedSlot = 0;          // 0..2 members, 3 = leader
let roleFilter = 'All';

export function render(game, ui, params) {
  const { C, B, state } = game;
  // Tutorial lesson 1 builds the team here: params.tutorialLesson = lesson index.
  const lessonNode = params.tutorialLesson != null ? tutorialLessons(C)[params.tutorialLesson] : null;
  const node = lessonNode || (params.nodeId && C.node[params.nodeId]) || currentNode(state, C) || C.nodes[C.nodes.length - 1];
  const enemyN = nodeEnemyNatures(node, C);
  const t = node.team || {};
  const resolved = resolveTeam(state, node, C);
  const baseOf = (id) => C.char[id]?.formOf || id;

  const slotIds = [state.team.members[0] || null, state.team.members[1] || null, state.team.members[2] || null, state.team.leader || null];
  const assign = (id) => {
    const cur = slotIds.slice();
    const existing = cur.indexOf(id);
    if (existing >= 0) { cur[existing] = cur[selectedSlot]; }
    // one form per character
    cur.forEach((x, i) => { if (x && i !== selectedSlot && baseOf(x) === baseOf(id) && x !== id) cur[i] = null; });
    cur[selectedSlot] = id;
    state.team.members = cur.slice(0, 3).filter(Boolean);
    state.team.leader = cur[3] || null;
    // next empty slot
    const empty = cur.findIndex(x => !x);
    selectedSlot = empty >= 0 ? empty : selectedSlot;
    game.commit('team');
    ui.refresh();
  };
  const clearSlot = (i) => {
    const cur = slotIds.slice(); cur[i] = null;
    state.team.members = cur.slice(0, 3).filter(Boolean); state.team.leader = cur[3] || null;
    selectedSlot = i; game.commit('team'); ui.refresh();
  };

  const slotEl = (i) => {
    const id = slotIds[i];
    const def = id ? C.char[id] : null;
    const isLeader = i === 3;
    const benched = id && (t.banned || []).includes(id);
    const el = h('div.slot' + (def ? '.filled' : '') + (isLeader ? '.leader' : ''), {
      onclick: () => { if (def && selectedSlot === i) clearSlot(i); else { selectedSlot = i; ui.refresh(); } },
      style: selectedSlot === i ? { borderColor: 'var(--accent)' } : {},
      role: 'button', tabindex: '0', 'aria-label': isLeader ? 'Leader slot' : `Member slot ${i + 1}`,
    },
      h('span.slot-label', isLeader ? '★ Leader' : `Slot ${i + 1}`),
      def ? avatar(def) : h('div.muted', { style: { fontSize: '1.6rem' } }, '+'),
      def ? h('div.name', def.short) : h('div.tiny.muted', selectedSlot === i ? 'Pick below' : 'Empty'),
      def ? h('div.tiny.muted', `Lv ${state.roster[id]?.level ?? '?'}`) : null,
      benched ? h('div.pill.bad', 'sits out here') : null,
      def && selectedSlot === i ? h('div.tiny.dim', 'tap again to remove') : null,
    );
    return el;
  };

  const leaderDef = state.team.leader ? C.char[state.team.leader] : null;
  const effectiveLeader = t.leader === 'none' ? null : t.leader ? C.char[t.leader] : (resolved.leader ? C.char[resolved.leader] : null);
  const rating = teamMatchupRating(resolved.members.map(id => C.char[id]), enemyN, B);
  const power = resolved.members.reduce((s, id) => s + unitPower(C.char[id], state.roster[id] || { level: 1, stars: 1 }, B), 0);

  // Lane reach warnings
  const defs = resolved.members.map(id => C.char[id]);
  const melee = defs.filter(d => d.role === 'Tank' || d.role === 'Striker');
  const tanks = defs.filter(d => d.role === 'Tank');
  const warnings = [];
  if (tanks.length > 1) warnings.push(`Two Tanks: only the front one can reach the enemy — ${tanks[1].short} waits in line.`);
  else if (melee.length > 2) warnings.push(`Only the front fighter and one Striker right behind it can reach melee range — ${melee.slice(2).map(d => d.short).join(', ')} will mostly wait in line.`);
  if (!defs.some(d => d.role === 'Tank')) warnings.push('No Tank: your front line will take the boss\'s hits directly.');
  const unowned = (t.forced || []).filter(id => !state.roster[id]);
  const syncLv = nodeEnemyLevel(node, B);
  const synced = (t.forced || []).filter(id => state.roster[id] && state.roster[id].level < syncLv);

  const owned = Object.keys(state.roster).filter(id => C.char[id]);
  const roles = ['All', 'Tank', 'Striker', 'Ranged', 'Support'];
  const list = owned
    .map(id => ({ id, def: C.char[id], own: state.roster[id] }))
    .filter(x => roleFilter === 'All' || x.def.role === roleFilter)
    .map(x => ({ ...x, power: unitPower(x.def, x.own, B), match: characterMatchup(x.def, enemyN, B) }))
    .sort((a, b) => b.power * (1 + 0.3 * b.match) - a.power * (1 + 0.3 * a.match));

  const unlocked = lessonNode ? true : isNodeUnlocked(state, node, C);
  const fight = () => {
    if (!resolved.members.length) { ui.toast('Add at least one ninja to your team first.', 'bad'); return; }
    if (lessonNode) ui.startBattle({ node, tutorial: { index: params.tutorialLesson, replay: !!params.replay } });
    else if (unlocked) ui.startBattle({ node });
    else ui.toast('That battle is still locked: clear the one before it first.');
  };
  const coach = lessonNode ? h('div.coach',
    h('div.row.between', h('b', `🎓 Lesson ${params.tutorialLesson + 1}: team building`), params.replay ? null : btn('Skip tutorial', () => ui.skipTutorial(), 'ghost small')),
    h('p.small', 'Tap a slot, then tap a ninja to put them there (tap a filled slot twice to empty it). The ★ Leader slot is your fourth fighter and gives the whole team a buff: try different Leaders and watch "Leader buff" change.'),
    h('p.small', 'When you\'re happy with your team, press ', h('b', '⚔️ Fight!'), '.')) : null;

  return h('div.screen',
    h('div.row.between', h('h1', 'Team Builder'),
      h('div.row',
        lessonNode ? null : btn('✨ Auto', () => {
          const cands = owned.map(id => ({ id, level: state.roster[id].level, stars: state.roster[id].stars }));
          const pick = autoPickTeam(cands, node, C, B);
          const members = pick.members.filter(id => state.roster[id] && !(t.forced || []).includes(id)).slice(0, 3);
          for (const id of pick.all) if (members.length < 3 && state.roster[id] && id !== pick.leader && !members.includes(id)) members.push(id);
          state.team.members = members;
          if (pick.leader && state.roster[pick.leader]) state.team.leader = pick.leader;
          game.commit('team'); ui.toast('Team picked by power and nature matchup.'); ui.refresh();
        }),
        btn(unlocked ? '⚔️ Fight!' : '🔒 Locked', fight, 'primary', { disabled: !unlocked }))),
    coach,
    lessonNode ? null : tipCard(game, 'team'),
    h('div.card',
      h('div.row.between',
        h('div', h('div.tiny.muted', 'Building for'), h('b', node.name), h('span.muted.small', ` · ${lessonNode ? C.tutorial.name : C.arc[node.arcId].name}`)),
        h('div.row', h('span.small.muted', 'Enemy natures'), ...[...new Set(enemyN)].map(n => natureChip(n)), enemyN.length ? null : h('span.nat.none', 'None'))),
      h('div.divider'),
      h('div.matchup-box',
        h('div', h('div.tiny.muted', 'Nature matchup'), h('div.row', h('span.matchup-stars', '★'.repeat(rating.stars) + '☆'.repeat(5 - rating.stars)), h('b', rating.label))),
        h('div', h('div.tiny.muted', 'Team power'), h('b', fmt(power))),
        h('div.grow', h('div.tiny.muted', 'Leader buff'), h('div.small', effectiveLeader ? leaderBuffText(effectiveLeader, B) : (t.leader === 'none' ? 'No leader in this battle' : 'No leader chosen'))),
      ),
    ),
    h('div.slots', { style: { marginTop: '12px' } }, slotEl(0), slotEl(1), slotEl(2), slotEl(3)),
    (t.forced?.length || t.leader || t.banned?.length) ? h('div.warnbox', { style: { marginTop: '10px' } },
      t.forced?.length ? h('div', '🔒 This battle fields ', h('b', t.forced.map(id => C.char[id].short).join(', ')), unowned.length ? ` (${unowned.map(id => C.char[id].short).join(', ')} join as level-matched guests)` : '', '. They take slots first.', synced.length ? ` ${synced.map(id => C.char[id].short).join(', ')} fight at Lv ${syncLv} here (forced ninja are raised to the battle's level).` : '') : null,
      t.leader === 'none' ? h('div', '★ No Leader buff in this battle.') : t.leader ? h('div', '★ Leader is fixed: ', h('b', C.char[t.leader].name)) : null,
      t.banned?.length ? h('div', '⛔ Sitting out: ', t.banned.map(id => C.char[id].short).join(', ')) : null,
      h('div.tiny', { style: { marginTop: '4px' } }, 'Fighting as: ', resolved.members.map(id => C.char[id].short + (id === resolved.leader ? '★' : '')).join(', ')),
    ) : null,
    ...warnings.map(w => h('div.warnbox', { style: { marginTop: '8px' } }, '⚠ ' + w)),
    h('div.filters', ...roles.map(r => h('button.chip' + (roleFilter === r ? '.on' : ''), { type: 'button', onclick: () => { roleFilter = r; ui.refresh(); } }, r))),
    h('p.tiny.dim', `Tap a slot, then a ninja. Sorted by power × matchup vs this node. ▲ = effective against these enemies, ▼ = countered.`),
    h('div.char-grid', ...list.map(x => {
      const inTeam = slotIds.includes(x.id);
      const banned = (t.banned || []).includes(x.id);
      return h('div.char-card' + (inTeam ? '.selected' : '') + (banned ? '.disabled' : ''), { onclick: () => banned ? ui.toast(`${x.def.short} sits out this battle.`) : assign(x.id), role: 'button', tabindex: '0' },
        h('span.lvl', `Lv ${x.own.level}`),
        h('span.badge-tl', x.match > 0.15 ? h('span.match-up', '▲') : x.match < -0.15 ? h('span.match-down', '▼') : null),
        avatar(x.def),
        h('div.name', x.def.name),
        h('div.meta', stars(x.own.stars)),
        h('div.meta', roleTag(x.def.role), ...natureChips(x.def)),
        h('div.power', `Power ${fmt(x.power)}`),
      );
    })),
  );
}

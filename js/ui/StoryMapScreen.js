// StoryMapScreen.js — arc select (Part I / Part II, Story / Hard) and the node map
// for an arc. Hard mode opens per part once every story battle of that part is cleared.
import { h, btn, fmt, natureChip, describeMechanic, objectiveText, avatar, episodesLabel } from './dom.js';
import { isNodeUnlocked, isNodeCleared, isArcReached, isArcCleared, currentNode, resolveTeam, nodeEnemyLevel,
  isHardUnlocked, isHardNodeUnlocked, isHardNodeCleared, isArcHardCleared, currentHardNode, hardNodeRewards, hardArcClearRewards } from '../core/Progression.js';
import { nodeRewards, arcClearRewards } from '../core/formulas.js';
import { nodeEnemyNatures, teamMatchupRating } from '../core/TeamPicker.js';
import { inkFor } from '../render/Renderer.js';
import { tutorialPending, tutorialLessons, nextLessonIndex } from '../core/Tutorial.js';
import { tipCard } from './tips.js';
import { screenHead } from './chrome.js';

const PART_NAME = { 1: 'Part I', 2: 'Part II' };

/** Story or Hard view of the node states. */
function view(game, hard) {
  const { C, state } = game;
  return hard ? {
    cleared: (n) => isHardNodeCleared(state, n.id),
    unlocked: (n) => isHardNodeUnlocked(state, n, C),
    arcCleared: (a) => isArcHardCleared(state, a),
    arcReached: (a) => isHardNodeUnlocked(state, a.nodes[0], C),
    current: (part) => currentHardNode(state, part, C),
    clears: (n) => state.progress.hard?.[n.id]?.clears || 0,
  } : {
    cleared: (n) => isNodeCleared(state, n.id),
    unlocked: (n) => isNodeUnlocked(state, n, C),
    arcCleared: (a) => isArcCleared(state, a),
    arcReached: (a) => isArcReached(state, a, C),
    current: () => currentNode(state, C),
    clears: (n) => state.progress.cleared[n.id]?.clears || 0,
  };
}

export function render(game, ui, params) {
  const { C, state } = game;
  const storyCur = currentNode(state, C);
  const part = params.part || (params.arcId ? C.arc[params.arcId]?.part : storyCur?.part) || 1;
  const hardOpen = isHardUnlocked(state, part, C);
  const hard = !!params.hard && hardOpen;
  const V = view(game, hard);
  const cur = V.current(part);
  const arcs = C.arcs.filter(a => a.part === part);
  const arcId = params.arcId && C.arc[params.arcId]?.part === part ? params.arcId
    : (cur && cur.part === part ? cur.arcId : arcs[arcs.length - 1]?.id);
  const arc = arcId ? C.arc[arcId] : null;

  const partSeg = h('div.seg', { role: 'group', 'aria-label': 'Story part' },
    ...[1, 2].map(p => h('button' + (part === p ? '.on' : ''), { type: 'button', 'aria-pressed': String(part === p), onclick: () => ui.go('story', { part: p, hard: hard && isHardUnlocked(state, p, C) }) }, PART_NAME[p])));
  const modeSeg = h('div.seg.mode-seg', { role: 'group', 'aria-label': 'Difficulty' },
    h('button' + (!hard ? '.on' : ''), { type: 'button', 'aria-pressed': String(!hard), onclick: () => ui.go('story', { part, arcId }) }, 'Story'),
    h('button' + (hard ? '.on.hard' : '') + (hardOpen ? '' : '.locked'), {
      type: 'button', 'aria-pressed': String(hard), 'aria-disabled': hardOpen ? null : 'true',
      onclick: () => hardOpen ? ui.go('story', { part, arcId, hard: true }) : ui.toast(`Clear every battle of ${PART_NAME[part]} to open Hard mode for it.`),
    }, hardOpen ? '💀 Hard' : '🔒 Hard'));

  const list = h('div.arc-list', part === 1 && !hard && tutorialPending(state) ? tutorialCard(game, ui) : null, ...arcs.map(a => arcCard(game, ui, a, a.id === arcId, cur, hard, V)));

  return h('div.screen' + (hard ? '.hard-mode' : ''),
    screenHead(ui, { title: hard ? 'Hard mode' : 'Story', right: [partSeg], help: hard ? 'guide/endgame' : arc ? `arc/${arc.id}` : 'arcs' }),
    h('div.row', { style: { marginBottom: '10px' } }, modeSeg,
      hard ? h('span.small.muted', `Enemies +${game.B.hardMode.levelOffset} levels, tougher bosses, more scrolls.`) : hardOpen ? h('span.small.muted', `Hard mode is open for ${PART_NAME[part]}.`) : null),
    hard ? tipCard(game, 'hard') : tipCard(game, 'story'),
    part === 2 && !hard ? h('p.small.muted', 'Part II — Naruto: Shippuden. The story and enemy levels continue from Part I.') : null,
    list,
    arc && !arc.placeholder ? arcDetail(game, ui, arc, params.nodeId, hard, V) : null,
  );
}

/** Part I's first card while the tutorial is still to do. */
function tutorialCard(game, ui) {
  const { C, state } = game;
  const lessons = tutorialLessons(C);
  const done = state.tutorial.status === 'active' ? nextLessonIndex(state) : 0;
  const card = h('div.arc-card.current', { onclick: () => ui.openTutorial(), role: 'button', tabindex: '0', 'aria-label': `${C.tutorial.name}: ${done} of ${lessons.length} lessons done` },
    h('span.lock', { 'aria-hidden': 'true' }, '🎓'),
    h('h3', C.tutorial.name),
    h('div.eps', `${episodesLabel(C.tutorial.episodes)} · ${lessons.length} short lessons`),
    h('div.prog', h('div.bar', h('i', { style: { width: `${(done / lessons.length) * 100}%` } })), h('div.tiny.muted', { style: { marginTop: '4px' } }, done ? `${done} / ${lessons.length} lessons done` : 'Start here: about three minutes')),
  );
  card.style.setProperty('--a1', C.tutorial.theme.accent);
  return card;
}

function arcCard(game, ui, a, selected, cur, hard, V) {
  const reached = V.arcReached(a);
  const done = a.nodes.filter(n => V.cleared(n)).length;
  const card = h('div.arc-card' + (reached ? '' : '.locked') + (cur && cur.arcId === a.id ? '.current' : ''),
    { onclick: () => reached ? ui.go('story', { arcId: a.id, hard }) : ui.toast(hard ? `Clear ${a.name}'s previous arc on Hard first.` : `Clear the previous arc to reach ${a.name}.`), role: 'button', tabindex: '0', 'aria-label': `${a.name}: ${done} of ${a.nodes.length} cleared${hard ? ' on Hard' : ''}${reached ? '' : ', locked'}` },
    reached ? null : h('span.lock', { 'aria-hidden': 'true' }, '🔒'),
    h('h3', a.name),
    h('div.eps', `${episodesLabel(a.episodes)} · ${a.nodes.length} battles`),
    h('div.prog', h('div.bar', h('i', { style: { width: `${(done / a.nodes.length) * 100}%` } })), h('div.tiny.muted', { style: { marginTop: '4px' } }, V.arcCleared(a) ? (hard ? '✓ Cleared on Hard' : '✓ Arc cleared') : `${done} / ${a.nodes.length} cleared${hard ? ' on Hard' : ''}`)),
  );
  card.style.setProperty('--a1', a.theme?.accent || '#555');
  if (selected) card.style.outline = '2px solid var(--accent)';
  return card;
}

function arcDetail(game, ui, arc, nodeId, hard, V) {
  const { C } = game;
  const cur = V.current(arc.part);
  const sel = (nodeId && C.node[nodeId]?.arcId === arc.id) ? C.node[nodeId]
    : (cur && cur.arcId === arc.id ? cur : arc.nodes[arc.nodes.length - 1]);

  const map = h('div.node-map');
  map.style.setProperty('--m1', arc.theme?.far || '#1b2633');
  const row = h('div.node-row', { style: { gridTemplateColumns: `repeat(${arc.nodes.length}, 1fr)` } });
  arc.nodes.forEach((n, i) => {
    const cleared = V.cleared(n);
    const unlocked = V.unlocked(n);
    const isCur = cur && cur.id === n.id;
    const cls = ['node', n.isBossNode ? 'boss' : '', cleared ? 'cleared' : '', isCur ? 'current' : '', !unlocked ? 'locked' : '', sel.id === n.id ? 'selected' : ''].filter(Boolean).join('.');
    const b = h('button.' + cls, { type: 'button', style: { marginTop: i % 2 ? '26px' : '0' }, onclick: () => ui.go('story', { arcId: arc.id, nodeId: n.id, hard }), 'aria-label': `${n.name}${cleared ? ', cleared' : unlocked ? '' : ', locked'}`, 'aria-current': sel.id === n.id ? 'true' : null },
      h('div.dot', cleared ? '✓' : !unlocked ? '🔒' : n.isBossNode ? '👑' : String(i + 1)),
      h('div.lbl', n.name));
    row.appendChild(b);
  });
  // connecting path
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'path'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('aria-hidden', 'true');
  const pts = arc.nodes.map((_, i) => `${((i + 0.5) / arc.nodes.length) * 100},${i % 2 ? 46 : 30}`).join(' ');
  const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  pl.setAttribute('points', pts); pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', 'rgba(255,255,255,0.22)'); pl.setAttribute('stroke-width', '1.2'); pl.setAttribute('stroke-dasharray', '2 2'); pl.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.appendChild(pl);
  map.append(svg, row);

  return h('div',
    h('div.section-title', h('h2', arc.name), h('span.pill', episodesLabel(arc.episodes))),
    h('p', arc.blurb),
    map,
    nodeDetail(game, ui, sel, hard, V),
  );
}

export function enemyToken(def) {
  const el = h('div.avatar.sm', { 'aria-hidden': 'true' }, def.initials);
  el.style.background = def.color; el.style.color = inkFor(def.color); el.style.setProperty('--ring', '#ff6b6b');
  return el;
}

function nodeDetail(game, ui, node, hard, V) {
  const { C, B, state } = game;
  const unlocked = V.unlocked(node);
  const cleared = V.cleared(node);
  const level = nodeEnemyLevel(node, B, { hard });
  const rewards = hard ? hardNodeRewards(node, !cleared, B) : nodeRewards(node.globalIndex, { firstClear: !cleared, isBossNode: node.isBossNode }, B);
  const arc = C.arc[node.arcId];
  const lastOfArc = arc.nodes[arc.nodes.length - 1] === node && !V.arcCleared(arc);
  const bonus = hard ? hardArcClearRewards(arc, B) : arcClearRewards(arc.arcIndex, B);
  const natures = [...new Set(nodeEnemyNatures(node, C))];
  const team = resolveTeam(state, node, C);
  const rating = teamMatchupRating(team.members.map(id => C.char[id]), nodeEnemyNatures(node, C), B);
  const seen = new Set();
  const enemies = node.enemies.filter(e => { const k = e.id + (e.boss ? 'b' : ''); if (seen.has(k)) return false; seen.add(k); return true; });
  const count = (id) => node.enemies.filter(e => e.id === id).length;
  const t = node.team || {};

  return h('div.card', { style: { marginTop: '4px' } },
    h('div.row.between',
      h('div', h('h2', { style: { marginBottom: '2px' } }, (node.isBossNode ? '👑 ' : '') + node.name), h('div.tiny.muted', `${episodesLabel(node.episodes)} · Enemy level ${level}${hard ? ' (Hard)' : ''}`)),
      cleared ? h('span.pill.good', `✓ Cleared ×${V.clears(node)}`) : unlocked ? h('span.pill.accent', hard ? 'Next Hard battle' : 'Next battle') : h('span.pill', '🔒 Locked')),
    h('p', { style: { marginTop: '10px' } }, node.blurb),
    h('div.row', h('span.pill.warn', '🎯 ' + objectiveText(node.objective, C)), hard && node.isBossNode ? h('span.pill.bad', `💀 Boss ×${B.hardMode.bossMult} HP and ATK`) : null),
    h('div.divider'),
    h('div.row.between', h('h3', { style: { margin: 0 } }, 'Enemy natures'), h('div.row', ...(natures.length ? natures.map(n => natureChip(n)) : [h('span.nat.none', 'None')]))),
    h('div.enemy-list', { style: { marginTop: '10px' } }, ...enemies.map(e => {
      const d = C.enemy[e.id];
      return h('div.enemy-row',
        enemyToken(d),
        h('div.grow',
          h('div.row', h('span.en', d.name + (count(e.id) > 1 ? ` ×${count(e.id)}` : '')), e.boss ? h('span.pill.bad', 'BOSS') : null, e.delay ? h('span.pill', `arrives at ${e.delay}s`) : null,
            ...(d.natures?.length ? [natureChip(d.natures[0])] : [h('span.nat.none', 'No nature')])),
          d.jutsu ? h('div.mech', 'Jutsu: ', h('b', d.jutsu.name), d.jutsu.nature ? ` (${d.jutsu.nature} Style)` : '', ' — telegraphed, clashable') : null,
          ...(d.mechanics || []).map(m => h('div.mech', h('b', m.name || m.type), ' — ', describeMechanic(m))),
          d.targeting === 'protected' ? h('div.mech', h('b', 'Diver'), ' — slips past your line to reach the escort.') : d.targeting === 'backline' ? h('div.mech', h('b', 'Sniper'), ' — targets your back line.') : null,
        ));
    })),
    (t.forced?.length || t.leader || t.banned?.length || t.recommended?.length) ? h('div', { style: { marginTop: '12px' } },
      t.forced?.length ? h('div.small', '🔒 Must field: ', h('b', t.forced.map(id => C.char[id].name).join(', ')), t.forced.every(id => state.roster[id]) ? '' : ' (guests at the battle\'s level if you don\'t own them)') : null,
      t.leader ? h('div.small', '★ Leader: ', h('b', t.leader === 'none' ? 'none for this fight' : C.char[t.leader].name)) : null,
      t.banned?.length ? h('div.small', '⛔ Unavailable: ', t.banned.map(id => C.char[id].name).join(', ')) : null,
      t.recommended?.length ? h('div.small', '👍 Canon team: ', t.recommended.map(id => C.char[id].short).join(', ')) : null,
    ) : null,
    h('div.divider'),
    h('div.row.between',
      h('div.row',
        h('span.pill', `📜 +${fmt(rewards.scrolls)}`), h('span.pill', `🪙 +${fmt(rewards.ryo)}`),
        cleared ? h('span.pill', 'Replay rewards') : h('span.pill.good', 'First clear'),
        lastOfArc ? h('span.pill.accent', `Arc bonus 📜${fmt(bonus.scrolls)} 🪙${fmt(bonus.ryo)}`) : null),
      h('div.row', h('span.small.muted', 'Your matchup:'), h('span.matchup-stars', { 'aria-label': `${rating.stars} of 5 stars` }, '★'.repeat(rating.stars) + '☆'.repeat(5 - rating.stars)), h('b', rating.label))),
    h('div.row', { style: { marginTop: '14px', justifyContent: 'flex-end' } },
      h('div.row.grow', ...team.members.map(id => avatar(C.char[id], { size: 'sm' }))),
      btn('👥 Edit team', () => ui.go('team', { nodeId: node.id, hard })),
      btn(unlocked ? (cleared ? '↻ Replay' : '⚔️ Fight!') : '🔒 Locked', () => {
        if (!unlocked) { ui.toast('Clear the previous battle first.'); return; }
        ui.startBattle({ node, hard });
      }, unlocked ? 'primary big' : 'big', { disabled: !unlocked })),
  );
}

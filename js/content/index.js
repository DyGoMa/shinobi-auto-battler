// content/index.js — merges every content file into one CONTENT object,
// computes derived data (global node indices, lookups) and validates it.
// A new part = one more arcs/*.js file in ARC_FILES. No engine changes needed.
import { ROSTER, TAGS } from './roster.js';
import { ENEMIES, BOSS_RUSH } from './enemies.js';
import { PART1_ARCS } from './arcs/part1.js';
import { SHIPPUDEN_ARCS } from './arcs/shippuden.js';
import { BANNERS } from './banners.js';
import { TUTORIAL_ARC } from './tutorial.js';
import { NATURES, TIERS, ROLES } from '../core/formulas.js';

const ARC_FILES = [PART1_ARCS, SHIPPUDEN_ARCS];

export const OBJECTIVE_TYPES = ['defeatAll', 'survive', 'protect', 'defeatBoss'];
export const LESSON_TYPES = ['team', 'nature', 'clash'];
export const MECHANIC_TYPES = ['telegraphAoE', 'summonAdds', 'shieldPhase', 'enrage', 'elementSwap', 'reflect', 'lifesteal', 'reviveOnce', 'regen', 'rally'];
export const ULT_TYPES = ['single', 'aoe', 'taunt', 'heal', 'buff'];
export const LEADER_STATS = ['atk', 'hp', 'def', 'speed', 'crit', 'chakra', 'startChakra', 'nature'];
export const ENEMY_ROLES = [...ROLES, 'Civilian'];
export const TARGET_MODES = ['all', 'front', 'back', 'random'];
export const TARGETING = ['nearest', 'backline', 'protected'];

export function buildContent({ roster, enemies, arcs, banners, bossRush, tutorial = null, tags = TAGS }) {
  for (const c of roster) if (c.leader?.scope?.tag && !c.leader.scope.tagLabel) c.leader.scope.tagLabel = tags[c.leader.scope.tag] || c.leader.scope.tag;
  const sortedArcs = arcs.slice().sort((a, b) => (a.part - b.part) || (a.order - b.order));
  let g = 0;
  sortedArcs.forEach((arc, arcIndex) => {
    arc.arcIndex = arcIndex;
    (arc.nodes || []).forEach((n, i) => {
      n.arcId = arc.id; n.part = arc.part; n.indexInArc = i; n.arcIndex = arcIndex;
      n.globalIndex = g++;
      n.isBossNode = (n.enemies || []).some(e => e.boss);
    });
  });
  const nodes = sortedArcs.flatMap(a => a.nodes || []);
  // The tutorial sits outside the story: its nodes have no global index (-1) and are
  // not in `nodes`/`node`, so no curve, sim, autotune or reward table ever sees them.
  if (tutorial) {
    tutorial.part = 1; tutorial.arcIndex = -1;
    (tutorial.nodes || []).forEach((n, i) => {
      n.arcId = tutorial.id; n.part = 1; n.indexInArc = i; n.arcIndex = -1; n.globalIndex = -1;
      n.tutorial = true; n.isBossNode = (n.enemies || []).some(e => e.boss);
    });
  }
  const byId = (arr) => Object.fromEntries(arr.map(x => [x.id, x]));
  return {
    roster, enemies, arcs: sortedArcs, banners, bossRush, nodes, tutorial,
    char: byId(roster), enemy: byId(enemies), arc: byId(sortedArcs), node: byId(nodes), banner: byId(banners),
  };
}

/** The arc a node belongs to (story arc, or the tutorial arc for tutorial nodes). */
export function arcOf(node, C) { return node?.tutorial ? C.tutorial : C.arc[node?.arcId] || null; }

/** Returns an array of error strings (empty = valid). */
export function validateContent(C) {
  const errs = [];
  const err = (where, msg) => errs.push(`${where}: ${msg}`);
  const seen = new Map();
  const uniq = (id, kind) => {
    if (!id || typeof id !== 'string') return err(kind, `missing id`);
    if (seen.has(id)) err(`${kind} ${id}`, `duplicate id (also a ${seen.get(id)})`);
    seen.set(id, kind);
  };
  const isColor = (c) => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c);
  const checkNatures = (where, list) => {
    if (!Array.isArray(list)) return err(where, 'natures must be an array');
    for (const n of list) if (!NATURES.includes(n)) err(where, `invalid nature "${n}"`);
  };
  const checkWeights = (where, s) => {
    if (s == null) return;
    for (const [k, v] of Object.entries(s)) {
      if (!['hp', 'atk', 'def', 'interval', 'speed', 'crit'].includes(k)) err(where, `unknown stat weight "${k}"`);
      if (typeof v !== 'number' || v <= 0 || v > 5) err(where, `stat weight ${k}=${v} must be a relative number in (0, 5]`);
    }
  };
  const arcIds = new Set(C.arcs.map(a => a.id));
  const checkUnlock = (where, u) => {
    if (u == null) return;
    const key = Object.keys(u)[0];
    if (!['arcCleared', 'arcReached'].includes(key)) err(where, `unlock must be {arcCleared|arcReached: arcId}`);
    else if (!arcIds.has(u[key])) err(where, `unlock references unknown arc "${u[key]}"`);
  };

  // Roster
  const forms = new Set();
  for (const c of C.roster) {
    const w = `character ${c.id}`;
    uniq(c.id, 'character');
    for (const f of ['name', 'tier', 'role', 'natures', 'ult', 'leader', 'color', 'initials']) if (c[f] == null) err(w, `missing required field "${f}"`);
    if (c.tier && !TIERS.includes(c.tier)) err(w, `invalid tier "${c.tier}"`);
    if (c.role && !ROLES.includes(c.role)) err(w, `invalid role "${c.role}"`);
    if (c.natures) checkNatures(w, c.natures);
    if (c.color && !isColor(c.color)) err(w, `color must be #rrggbb`);
    checkWeights(w, c.stats);
    if (c.ult) {
      if (!c.ult.name) err(w, 'ult.name missing');
      if (!ULT_TYPES.includes(c.ult.type)) err(w, `invalid ult.type "${c.ult.type}"`);
      if (c.ult.nature != null && !NATURES.includes(c.ult.nature)) err(w, `invalid ult.nature "${c.ult.nature}"`);
      const roleUlt = { Striker: ['single', 'aoe'], Ranged: ['single', 'aoe'], Tank: ['taunt'], Support: ['heal', 'buff'] }[c.role];
      if (roleUlt && !roleUlt.includes(c.ult.type)) err(w, `ult.type "${c.ult.type}" not allowed for role ${c.role} (${roleUlt.join('/')})`);
    }
    if (c.leader) {
      if (!LEADER_STATS.includes(c.leader.stat)) err(w, `invalid leader.stat "${c.leader.stat}"`);
      const s = c.leader.scope;
      if (s) {
        if (s.nature && !NATURES.includes(s.nature)) err(w, `leader scope nature "${s.nature}" invalid`);
        if (s.role && !ROLES.includes(s.role)) err(w, `leader scope role invalid`);
        if (s.tier && !TIERS.includes(s.tier)) err(w, `leader scope tier invalid`);
        if (s.tag && !C.roster.some(o => (o.tags || []).includes(s.tag))) err(w, `leader scope tag "${s.tag}" matches no character`);
      }
    }
    checkUnlock(w, c.unlock);
    if (c.formOf) { forms.add(c.id); if (!C.char[c.formOf]) err(w, `formOf references unknown character "${c.formOf}"`); }
    if (c.taijutsu && c.natures?.length) err(w, 'taijutsu specialists should have natures: [] (they are neutral)');
  }
  const colors = new Map();
  for (const c of C.roster) {
    if (colors.has(c.color)) err(`character ${c.id}`, `color ${c.color} already used by ${colors.get(c.color)} (each character needs a unique color)`);
    colors.set(c.color, c.id);
  }
  const starters = C.roster.filter(c => c.starter);
  if (starters.length < 4) err('roster', `need at least 4 starter characters (found ${starters.length})`);

  // Enemies
  for (const e of C.enemies) {
    const w = `enemy ${e.id}`;
    uniq(e.id, 'enemy');
    for (const f of ['name', 'role', 'natures', 'color', 'initials']) if (e[f] == null) err(w, `missing required field "${f}"`);
    if (e.role && !ENEMY_ROLES.includes(e.role)) err(w, `invalid role "${e.role}"`);
    if (e.natures) checkNatures(w, e.natures);
    if (e.color && !isColor(e.color)) err(w, 'color must be #rrggbb');
    checkWeights(w, e.stats);
    if (e.basedOn && !C.char[e.basedOn]) err(w, `basedOn references unknown character "${e.basedOn}"`);
    if (e.targeting && !TARGETING.includes(e.targeting)) err(w, `invalid targeting "${e.targeting}"`);
    if (e.jutsu) {
      if (!e.jutsu.name) err(w, 'jutsu.name missing');
      if (!['single', 'aoe'].includes(e.jutsu.type || 'single')) err(w, 'jutsu.type must be single|aoe');
      if (e.jutsu.nature != null && !NATURES.includes(e.jutsu.nature)) err(w, `invalid jutsu.nature "${e.jutsu.nature}"`);
    }
    for (const m of e.mechanics || []) {
      const mw = `${w} mechanic ${m.type}`;
      if (!MECHANIC_TYPES.includes(m.type)) { err(mw, `unknown mechanic type (valid: ${MECHANIC_TYPES.join(', ')})`); continue; }
      if (!m.name && !['lifesteal', 'regen'].includes(m.type)) err(mw, 'missing name (shown to the player)');
      if (m.nature != null && !NATURES.includes(m.nature)) err(mw, `invalid nature "${m.nature}"`);
      if (m.type === 'summonAdds' && !C.enemy[m.enemy]) err(mw, `summons unknown enemy "${m.enemy}"`);
      if (m.type === 'elementSwap') { if (!Array.isArray(m.sequence) || m.sequence.length < 2) err(mw, 'sequence needs 2+ natures'); else checkNatures(mw, m.sequence); }
      if (m.type === 'telegraphAoE' && m.target && !TARGET_MODES.includes(m.target)) err(mw, `invalid target "${m.target}"`);
      if (['shieldPhase'].includes(m.type) && m.atHp == null) err(mw, 'shieldPhase needs atHp: [fractions]');
      if (m.atHp) for (const t of m.atHp) if (!(t > 0 && t < 1)) err(mw, `atHp values must be fractions between 0 and 1`);
      for (const k of ['power', 'interval', 'windup']) if (m[k] != null && (typeof m[k] !== 'number' || m[k] <= 0 || m[k] > 5)) err(mw, `${k} is a relative weight in (0, 5]`);
    }
  }

  // Arcs & nodes
  const checkNode = (n) => {
    const nw = `node ${n.id}`;
    uniq(n.id, 'node');
    for (const f of ['name', 'enemies', 'objective']) if (n[f] == null) err(nw, `missing required field "${f}"`);
    if (!Array.isArray(n.enemies) || !n.enemies.length) err(nw, 'needs at least one enemy');
    for (const e of n.enemies || []) {
      if (!C.enemy[e.id]) err(nw, `unknown enemy "${e.id}"`);
      else if (C.enemy[e.id].role === 'Civilian') err(nw, `civilian "${e.id}" belongs in objective.protect, not enemies`);
    }
    const o = n.objective || {};
    if (!OBJECTIVE_TYPES.includes(o.type)) err(nw, `invalid objective.type "${o.type}"`);
    if (o.type === 'survive' && !(o.seconds > 0)) err(nw, 'survive objective needs seconds');
    if (o.type === 'protect') {
      if (!o.protect || !C.enemy[o.protect]) err(nw, `protect objective needs a valid civilian id (got "${o.protect}")`);
      else if (C.enemy[o.protect].role !== 'Civilian') err(nw, `protect target "${o.protect}" must have role Civilian`);
    }
    if (o.type === 'defeatBoss' && !n.isBossNode) err(nw, 'defeatBoss objective needs an enemy with boss: true');
    const t = n.team || {};
    for (const k of ['forced', 'recommended', 'banned']) for (const id of t[k] || []) if (!C.char[id]) err(nw, `team.${k} references unknown character "${id}"`);
    if (t.leader && t.leader !== 'none' && !C.char[t.leader]) err(nw, `team.leader references unknown character "${t.leader}"`);
    if ((t.forced || []).length > 4) err(nw, 'team.forced can hold at most 4 characters');
  };
  for (const a of C.arcs) {
    const w = `arc ${a.id}`;
    uniq(a.id, 'arc');
    for (const f of ['name', 'part', 'order']) if (a[f] == null) err(w, `missing required field "${f}"`);
    if (a.placeholder) continue;
    if (!Array.isArray(a.nodes) || a.nodes.length < 3 || a.nodes.length > 5) err(w, `must have 3–5 nodes (has ${a.nodes?.length || 0})`);
    const last = a.nodes?.[a.nodes.length - 1];
    if (last && !last.isBossNode) err(w, 'last node must be a boss node (an enemy with boss: true)');
    if (a.banner && !C.banner[a.banner]) err(w, `banner "${a.banner}" not found`);
    for (const n of a.nodes || []) checkNode(n);
  }

  // Tutorial (outside the story; one lesson of each type, in order)
  if (C.tutorial) {
    const T = C.tutorial;
    uniq(T.id, 'arc');
    if (!T.name) err(`tutorial ${T.id}`, 'missing name');
    const lessons = (T.nodes || []).map(n => n.lesson);
    if (JSON.stringify(lessons) !== JSON.stringify(LESSON_TYPES)) err(`tutorial ${T.id}`, `needs exactly one lesson of each type, in order: ${LESSON_TYPES.join(', ')} (got ${lessons.join(', ') || 'none'})`);
    for (const n of T.nodes || []) {
      checkNode(n);
      if (!n.learn) err(`node ${n.id}`, 'tutorial lesson needs a "learn" line');
    }
  }

  // Banners
  for (const b of C.banners) {
    const w = `banner ${b.id}`;
    uniq(b.id, 'banner');
    if (!b.name) err(w, 'missing name');
    if (!['standard', 'arc'].includes(b.type)) err(w, `type must be standard|arc`);
    for (const id of b.featured || []) if (!C.char[id]) err(w, `featured references unknown character "${id}"`);
    if (b.type === 'arc' && !arcIds.has(b.arc)) err(w, `arc "${b.arc}" not found`);
  }
  if (!C.banners.some(b => b.type === 'standard')) err('banners', 'need one standard banner');

  // Boss rush
  const R = C.bossRush;
  if (!R) err('bossRush', 'missing BOSS_RUSH');
  else {
    if (!arcIds.has(R.unlockArc)) err('bossRush', `unlockArc "${R.unlockArc}" not found`);
    for (const id of R.order || []) {
      const e = C.enemy[id];
      if (!e) err('bossRush', `unknown boss "${id}"`);
      else if (!(e.mechanics || []).some(m => m.type === 'telegraphAoE')) err('bossRush', `boss "${id}" needs one telegraphAoE special`);
    }
  }
  return errs;
}

export const CONTENT = buildContent({
  roster: ROSTER, enemies: ENEMIES,
  arcs: ARC_FILES.flat(), banners: BANNERS, bossRush: BOSS_RUSH, tutorial: TUTORIAL_ARC,
});

export default CONTENT;

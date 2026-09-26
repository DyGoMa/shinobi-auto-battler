// Story.js — the story scenes' rules (docs/STORY_PLAN.md): which scene a battle or a screen
// plays, once per save or always or never (Settings → Story scenes), the speaker's name plate
// and side, the numbers the teaching lines show, the spoiler-safe story log, and the checks
// the tools run on the data. Pure functions over (state, content, balance); no DOM.
//
// Scene keys: opener:<arc> · closer:<arc> · intro:<node> · boss:<node> · outro:<node> ·
// teach:<id> · rush:<boss>. Seen keys live in the save (state.story.seen, v4).
import { BALANCE } from '../config/balance.js';
import { STORY, TEACH, RUSH_BARKS, TEACH_PLACEHOLDERS } from '../content/story/index.js';
import { STORY_SCENE_MODES } from './SaveManager.js';
import { TIER_LABEL } from './formulas.js';
import { isNodeCleared, isNodeUnlocked, isArcReached, isArcCleared } from './Progression.js';
import { ryoReserve } from './AutoLevel.js';

export const SCENE_KINDS = ['opener', 'closer', 'intro', 'boss', 'outro', 'teach', 'rush'];
export const LINE_MAX = 90;            // characters per line (docs/STORY_PLAN.md §2)
export const TEACH_MAX_LINES = 5;
export const AUTO_ADVANCE_SECONDS = 2.5;
export const TYPE_CPS = 32;            // typewriter speed

export function storyMode(state) { const m = state?.settings?.storyScenes; return STORY_SCENE_MODES.includes(m) ? m : 'first'; }
export function sceneKey(kind, id) { return `${kind}:${id}`; }
export function sceneSeen(state, key) { return !!state?.story?.seen?.[key]; }

/** Whether a scene plays now: never / always / the first time (and never on a replayed battle). */
export function shouldPlay(state, key, { replay = false } = {}) {
  const mode = storyMode(state);
  if (mode === 'never') return false;
  if (mode === 'always') return true;
  return !replay && !sceneSeen(state, key);
}
export function markSeen(state, key, now = Date.now()) {
  if (!state.story || typeof state.story !== 'object') state.story = { seen: {} };
  if (!state.story.seen || typeof state.story.seen !== 'object') state.story.seen = {};
  if (!state.story.seen[key]) state.story.seen[key] = now;
}
export function resetSeen(state) { state.story = { seen: {} }; }

const nodeArc = new Map();
function arcOfNode(story, nodeId) {
  if (!nodeArc.has(nodeId)) { nodeArc.set(nodeId, Object.keys(story).find(a => story[a]?.nodes?.[nodeId]) || null); }
  return nodeArc.get(nodeId);
}

/**
 * The lines of a scene, or null when there are none. kind: opener | closer (id = an arc id),
 * intro | boss | outro (id = a node id), teach (id = a TEACH key, or an arc's own teach key),
 * rush (id = a Boss Rush boss id).
 */
export function sceneLines(kind, id, { story = STORY, teach = TEACH, barks = RUSH_BARKS } = {}) {
  let lines = null;
  if (kind === 'opener' || kind === 'closer') lines = story[id]?.[kind];
  else if (kind === 'intro' || kind === 'boss' || kind === 'outro') { const arcId = arcOfNode(story, id); lines = arcId ? story[arcId].nodes[id]?.[kind] : null; }
  else if (kind === 'teach') lines = teach[id] || Object.values(story).map(a => a.teach?.[id]).find(Boolean);
  else if (kind === 'rush') lines = barks[id];
  return Array.isArray(lines) && lines.length ? lines : null;
}

/** Who a line's `who` is: the roster or enemy entry, the name on the plate and the side it stands on. */
export function speakerOf(who, C) {
  if (!who || who === 'narrator') return { def: null, name: '', side: 'left', kind: 'narrator' };
  const ch = C.char?.[who];
  if (ch) return { def: ch, name: ch.short || ch.name, side: 'left', kind: 'char' };
  const en = C.enemy?.[who];
  if (en) { const npc = en.role === 'Civilian'; return { def: en, name: en.name.replace(/\s*\(.*\)\s*$/, ''), side: npc ? 'left' : 'right', kind: npc ? 'npc' : 'enemy' }; }
  return { def: null, name: String(who), side: 'left', kind: 'unknown' };
}
/** A line's side: its own `side`, else the speaker's (enemies on the right). */
export function lineSide(line, C) { return line.side === 'right' || line.side === 'left' ? line.side : speakerOf(line.who, C).side; }

/** Replace {{key}} placeholders (the teaching scenes' numbers). Unknown keys are left as they are. */
export function fill(text, values) { return values ? String(text).replace(/\{\{(\w+)\}\}/g, (m, k) => (values[k] != null ? String(values[k]) : m)) : String(text); }

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const num = (n) => Math.round(n).toLocaleString('en-US');
const word = (n) => { const w = WORDS[n] ?? num(n); return w.charAt(0).toUpperCase() + w.slice(1); };

/** The values the teaching scenes show, all from balance.js (and the Boss Rush rotation), so a line can never go stale. */
export function teachValues(C, B = BALANCE, state = null) {
  return {
    single: num(B.economy.pullCost.single), ten: num(B.economy.pullCost.ten), tenTier: TIER_LABEL[B.gacha.tenPullGuaranteeTier] || 'Rare',
    pity: String(B.gacha.pity), reserve: num(state ? ryoReserve(state, B) : B.qol.ryoReserve), gap: String(B.economy.catchUp.gap),
    rushCount: word(C.bossRush?.order?.length || 0), hardOffset: String(B.hardMode.levelOffset), dailyAttempts: word(B.daily.attemptsPerDay), dailyCount: word(B.daily.challengesPerDay || 1),
    starBonus: `${Math.round(B.stats.starBonus * 100)}%`, starCap: String(B.stats.starCap),
  };
}

function checkLines(lines, where, C, errs, { placeholders = false } = {}) {
  if (!Array.isArray(lines)) { errs.push(`${where}: not a list of lines`); return; }
  lines.forEach((l, i) => {
    const at = `${where} line ${i + 1}`;
    if (!l || typeof l !== 'object') { errs.push(`${at}: not a line`); return; }
    const text = l.caption ?? l.text;
    if (typeof text !== 'string' || !text.trim()) { errs.push(`${at}: no text`); return; }
    if (text.length > LINE_MAX) errs.push(`${at}: ${text.length} characters (max ${LINE_MAX}): "${text.slice(0, 40)}…"`);
    if (l.caption != null) { if (l.who) errs.push(`${at}: a caption has no speaker`); return; }
    if (!l.who || typeof l.who !== 'string') errs.push(`${at}: no speaker`);
    else if (l.who !== 'narrator' && !C.char?.[l.who] && !C.enemy?.[l.who]) errs.push(`${at}: unknown speaker "${l.who}"`);
    if (l.side != null && l.side !== 'left' && l.side !== 'right') errs.push(`${at}: side must be left or right`);
    for (const m of text.matchAll(/\{\{(\w+)\}\}/g)) if (!placeholders) errs.push(`${at}: a placeholder outside a teaching scene ({{${m[1]}}})`); else if (!TEACH_PLACEHOLDERS.includes(m[1])) errs.push(`${at}: unknown placeholder {{${m[1]}}}`);
  });
}

/**
 * The data checks (docs/STORY_PLAN.md §3): every arc has an opener and a closer, every node an
 * intro, every boss node its boss lines and an outro, every speaker exists, every line is under
 * LINE_MAX, the teaching scenes are short and use known placeholders, every Boss Rush boss barks.
 */
export function validateStory(C, { story = STORY, teach = TEACH, barks = RUSH_BARKS } = {}) {
  const errs = [];
  const arcs = [C.tutorial, ...(C.arcs || [])].filter(a => a && !a.placeholder);
  const arcIds = new Set(arcs.map(a => a.id));
  for (const id of Object.keys(story)) if (!arcIds.has(id)) errs.push(`story: "${id}" is not an arc`);
  for (const arc of arcs) {
    const s = story[arc.id];
    if (!s) { errs.push(`story: arc ${arc.id} has no scenes`); continue; }
    if (!s.opener?.length) errs.push(`story: arc ${arc.id} has no opener`); else checkLines(s.opener, `${arc.id} opener`, C, errs);
    if (!s.closer?.length) errs.push(`story: arc ${arc.id} has no closer`); else checkLines(s.closer, `${arc.id} closer`, C, errs);
    const nodeIds = new Set((arc.nodes || []).map(n => n.id));
    for (const id of Object.keys(s.nodes || {})) if (!nodeIds.has(id)) errs.push(`story: ${arc.id} has scenes for "${id}", which is not one of its battles`);
    for (const n of arc.nodes || []) {
      const ns = s.nodes?.[n.id];
      if (!ns?.intro?.length) errs.push(`story: battle ${n.id} has no intro`); else checkLines(ns.intro, `${n.id} intro`, C, errs);
      if (n.isBossNode) {
        if (!ns?.boss?.length) errs.push(`story: boss battle ${n.id} has no boss lines`);
        if (!ns?.outro?.length) errs.push(`story: boss battle ${n.id} has no outro`);
      }
      if (ns?.boss) checkLines(ns.boss, `${n.id} boss`, C, errs);
      if (ns?.outro) checkLines(ns.outro, `${n.id} outro`, C, errs);
      for (const k of Object.keys(ns || {})) if (!['intro', 'boss', 'outro'].includes(k)) errs.push(`story: ${n.id} has an unknown scene "${k}"`);
    }
    for (const [k, lines] of Object.entries(s.teach || {})) { checkLines(lines, `${arc.id} teach ${k}`, C, errs, { placeholders: true }); if (lines.length > TEACH_MAX_LINES) errs.push(`story: ${arc.id} teach ${k} has ${lines.length} lines (max ${TEACH_MAX_LINES})`); }
  }
  for (const [k, lines] of Object.entries(teach)) {
    checkLines(lines, `teach ${k}`, C, errs, { placeholders: true });
    if (Array.isArray(lines) && lines.length > TEACH_MAX_LINES) errs.push(`story: teach ${k} has ${lines.length} lines (max ${TEACH_MAX_LINES})`);
  }
  for (const id of C.bossRush?.order || []) { if (!barks[id]?.length) errs.push(`story: Boss Rush boss ${id} has no bark`); else checkLines(barks[id], `rush ${id}`, C, errs); }
  for (const id of Object.keys(barks)) if (!(C.bossRush?.order || []).includes(id)) errs.push(`story: rush bark for "${id}", which is not in the rotation`);
  return errs;
}

/** How many lines the whole story has (the size line in validate). */
export function countLines(story = STORY, teach = TEACH, barks = RUSH_BARKS) {
  let n = 0;
  for (const s of Object.values(story)) { n += (s.opener?.length || 0) + (s.closer?.length || 0); for (const ns of Object.values(s.nodes || {})) n += (ns.intro?.length || 0) + (ns.boss?.length || 0) + (ns.outro?.length || 0); for (const t of Object.values(s.teach || {})) n += t.length; }
  for (const t of Object.values(teach)) n += t.length;
  for (const b of Object.values(barks)) n += b.length;
  return n;
}

/**
 * The story log for the Wiki: an arc's scenes as far as the player has got (spoiler-safe by
 * progress, not by what was watched): the opener once the arc is reached, a battle's intro
 * once it is open, its boss lines and outro once it is won, the closer once the arc is cleared.
 * Returns null for an arc not yet reached.
 */
export function storyLog(state, C, arcId, story = STORY) {
  const tut = arcId === C.tutorial?.id;
  const arc = tut ? C.tutorial : C.arc[arcId];
  const s = story[arcId];
  if (!arc || !s) return null;
  const tutDone = state.tutorial?.status === 'done';
  if (!tut && !isArcReached(state, arc, C)) return null;
  const scenes = [];
  const push = (title, kind, id, lines) => { if (lines?.length) scenes.push({ title, kind, key: sceneKey(kind, id), lines, seen: sceneSeen(state, sceneKey(kind, id)) }); };
  push('Opening', 'opener', arc.id, s.opener);
  for (const n of arc.nodes || []) {
    const ns = s.nodes?.[n.id]; if (!ns) continue;
    const open = tut || isNodeUnlocked(state, n, C);
    const won = tut ? tutDone : isNodeCleared(state, n.id);
    if (open) push(n.name, 'intro', n.id, ns.intro);
    if (won) { push(`${n.name}: the boss`, 'boss', n.id, ns.boss); push(`${n.name}: afterwards`, 'outro', n.id, ns.outro); }
  }
  if (tut ? tutDone : isArcCleared(state, arc)) push('Ending', 'closer', arc.id, s.closer);
  return { arc, scenes };
}

/** The arcs the story log lists: every arc, with whether it is reached (the tutorial always is). */
export function storyLogArcs(state, C, story = STORY) {
  return [C.tutorial, ...(C.arcs || [])].filter(a => a && !a.placeholder && story[a.id]).map(a => ({ arc: a, reached: a === C.tutorial || isArcReached(state, a, C), tutorial: a === C.tutorial }));
}

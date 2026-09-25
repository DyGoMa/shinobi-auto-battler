// Teams.js — Team Builder and Roster conveniences: team presets, counter hints and
// the Roster's sort and filters. Pure, no DOM; what the player picks lives in the save.
import { BALANCE } from '../config/balance.js';
import { characterMatchup, autoPickTeam } from './TeamPicker.js';
import { unitPower } from './Progression.js';
import { TIERS } from './formulas.js';

// ---------------------------------------------------------------- presets
/** The three team presets (state.teamPresets, same order). */
export const PRESETS = [
  { id: 'story', name: 'Story', icon: '🗺️' },
  { id: 'boss', name: 'Boss', icon: '👑' },
  { id: 'daily', name: 'Daily', icon: '📅' },
];
export function defaultPresets() { return PRESETS.map(p => ({ id: p.id, members: [], leader: null })); }

/** Keep only owned, known ninja, one form each; always the three presets in order. */
export function sanitizePresets(list, state, C) {
  const byId = Object.fromEntries((Array.isArray(list) ? list : []).filter(p => p && typeof p === 'object').map(p => [p.id, p]));
  const baseOf = (id) => C.char[id]?.formOf || id;
  return PRESETS.map(({ id }) => {
    const p = byId[id] || {};
    const ok = (x) => typeof x === 'string' && C.char[x] && state.roster[x];
    const seen = new Set();
    const leader = ok(p.leader) ? p.leader : null;
    if (leader) seen.add(baseOf(leader));
    const members = (Array.isArray(p.members) ? p.members : []).filter(ok).filter(x => { const b = baseOf(x); if (seen.has(b)) return false; seen.add(b); return true; }).slice(0, 3);
    return { id, members, leader };
  });
}

export function presetEmpty(p) { return !p || (!p.members?.length && !p.leader); }

/** Store the current team in preset `id`. */
export function savePreset(state, id) {
  const i = PRESETS.findIndex(p => p.id === id);
  if (i < 0) return false;
  state.teamPresets[i] = { id, members: [...state.team.members], leader: state.team.leader || null };
  return true;
}

/** Make preset `id` the current team. { ok, error? } */
export function loadPreset(state, id, C) {
  const p = sanitizePresets(state.teamPresets, state, C).find(x => x.id === id);
  if (presetEmpty(p)) return { ok: false, error: 'That preset is empty: build a team, then save it there.' };
  if (!p.members.length) return { ok: false, error: 'That preset has no members.' };
  state.team = { members: [...p.members], leader: p.leader };
  return { ok: true };
}

// ---------------------------------------------------------------- counter hints
/** 'counters' | 'countered' | 'neutral' for one ninja against a fight's enemy natures. */
export function counterLabel(def, enemyNatures, B = BALANCE) {
  if (!enemyNatures?.length) return 'neutral';
  const m = characterMatchup(def, enemyNatures, B);
  const t = B.qol.counterThreshold;
  return m > t ? 'counters' : m < -t ? 'countered' : 'neutral';
}

// ---------------------------------------------------------------- roster sort / filter
export const ROSTER_SORTS = [
  { id: 'rarity', label: 'Rarity' },
  { id: 'power', label: 'Power' },
  { id: 'level', label: 'Level' },
  { id: 'nature', label: 'Nature' },
];
export const ROSTER_VIEW_DEFAULT = { show: 'all', role: 'All', tier: 'All', nature: 'All', sort: 'rarity' };

export function sanitizeRosterView(v, B = BALANCE) {
  const o = { ...ROSTER_VIEW_DEFAULT, ...(v && typeof v === 'object' ? v : {}) };
  if (!['all', 'owned', 'missing'].includes(o.show)) o.show = 'all';
  if (!['All', 'Tank', 'Striker', 'Ranged', 'Support'].includes(o.role)) o.role = 'All';
  if (!['All', ...TIERS].includes(o.tier)) o.tier = 'All';
  if (!['All', 'Taijutsu', ...B.natureWheel.cycle].includes(o.nature)) o.nature = 'All';
  if (!ROSTER_SORTS.some(s => s.id === o.sort)) o.sort = 'rarity';
  return { show: o.show, role: o.role, tier: o.tier, nature: o.nature, sort: o.sort };
}

/** Does a character have this nature filter? ('Taijutsu' = the taijutsu specialists.) */
function natureMatch(d, nature) {
  if (nature === 'All') return true;
  if (nature === 'Taijutsu') return !!d.taijutsu;
  return !d.taijutsu && (d.natures || []).includes(nature);
}

/** The Roster's list: filtered and sorted. Owned ninja always come before missing ones. */
export function rosterList(state, C, B = BALANCE, view = ROSTER_VIEW_DEFAULT) {
  const v = sanitizeRosterView(view, B);
  const own = (d) => state.roster[d.id];
  const power = (d) => own(d) ? unitPower(d, own(d), B) : 0;
  const natIdx = (d) => d.taijutsu ? B.natureWheel.cycle.length : Math.max(0, B.natureWheel.cycle.indexOf(d.natures?.[0]));
  const tier = (d) => TIERS.indexOf(d.tier);
  const keys = {
    rarity: (a, b) => tier(b) - tier(a),
    power: (a, b) => power(b) - power(a),
    level: (a, b) => (own(b)?.level || 0) - (own(a)?.level || 0) || power(b) - power(a),
    nature: (a, b) => natIdx(a) - natIdx(b) || tier(b) - tier(a),
  };
  return C.roster
    .filter(d => v.show === 'all' || (v.show === 'owned' ? own(d) : !own(d)))
    .filter(d => v.role === 'All' || d.role === v.role)
    .filter(d => v.tier === 'All' || d.tier === v.tier)
    .filter(d => natureMatch(d, v.nature))
    .sort((a, b) => (!!own(b) - !!own(a)) || keys[v.sort](a, b) || a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------- auto-build
/**
 * ✨ Auto: the best team for a fight from the ninja you own, by power and Nature Wheel
 * counters against that fight's enemies (TeamPicker.autoPickTeam: a lineup heuristic,
 * no battles simulated, so it is instant on a phone). Sets state.team; forced ninja
 * stay out of the saved team (the battle adds them). opts.content: the Daily's content
 * (its natures); opts.byPower: ignore natures (Countered days re-type the enemies).
 */
export function autoBuildTeam(state, node, C, B = BALANCE, { content = C, byPower = false } = {}) {
  const forced = node?.team?.forced || [];
  const cands = Object.keys(state.roster).filter(id => C.char[id]).map(id => ({ id, level: state.roster[id].level, stars: state.roster[id].stars }));
  const pick = autoPickTeam(cands, node, content, B, byPower ? { matchupWeight: 0 } : {});
  const members = pick.members.filter(id => state.roster[id] && !forced.includes(id)).slice(0, 3);
  for (const id of pick.all) if (members.length < 3 && state.roster[id] && id !== pick.leader && !members.includes(id)) members.push(id);
  state.team.members = members;
  if (pick.leader && state.roster[pick.leader]) state.team.leader = pick.leader;
  return state.team;
}

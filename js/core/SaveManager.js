// SaveManager.js — versioned save state with pluggable backends.
// Backends implement: { name, isAvailable(), async load() -> {data, updatedAt}|null, async save(data) }.
// Local saves are written immediately; cloud saves are debounced.
import { BALANCE } from '../config/balance.js';

export const SAVE_VERSION = 2;

/** Ids of the in-battle tips the first story battle shows (the tutorial teaches them too). */
export const BATTLE_TIP_IDS = ['battle.start', 'battle.ult', 'battle.clash'];

/** A brand-new save. */
export function defaultState(C, B = BALANCE) {
  const starters = C.roster.filter(c => c.starter);
  const leader = starters.find(c => c.starterLeader) || starters[3] || null;
  const roster = {};
  for (const c of starters) roster[c.id] = { level: 1, stars: 1 };
  return {
    saveVersion: SAVE_VERSION,
    createdAt: Date.now(),
    updatedAt: 0,
    // tickets: free single summons; rareTickets: summons guaranteed Rare or better (achievement rewards)
    currencies: { scrolls: B.economy.start.scrolls, ryo: B.economy.start.ryo, tickets: 0, rareTickets: 0 },
    roster,
    team: { members: starters.filter(c => c !== leader).map(c => c.id).slice(0, 3), leader: leader ? leader.id : null },
    progress: { cleared: {}, hard: {} },   // hard: Hard mode clears, same shape as cleared
    gacha: { pity: 0, totalPulls: 0, history: [] },
    bossRush: { highestRound: 0, runs: 0 },
    // autoUltMode: 'smart' = clash-aware (fires counter-nature ninja into wind-ups, holds
    // any that would be Overwhelmed); 'asap' = fire when ready. tips: one-time screen tips.
    // music / sfx / vfx: placeholders the audio and effects update will wire up (Settings shows them disabled).
    settings: { muted: false, autoUlt: false, autoUltMode: 'smart', speed: 1, tips: true, music: true, sfx: true, vfx: true },
    // Combat and day records behind the achievements (js/core/Achievements.js).
    stats: { battles: 0, wins: 0, losses: 0, clashWins: 0, flawlessWins: 0, counteredWins: 0, underdogBossWins: 0, daysPlayed: 0, lastDay: '' },
    // status: 'new' (never started) | 'active' (lesson = next lesson index) | 'done'.
    // completed = every lesson won at least once; rewarded = the one-time reward is paid.
    tutorial: { status: 'new', lesson: 0, completed: false, rewarded: false },
    tips: { seen: {} },
    achievements: { unlocked: {}, claimed: {} },   // id -> timestamp
    account: { googleLinked: false },
    // The Daily challenge: today's date key, attempts used, cleared today, lifetime clears.
    daily: { date: '', attempts: 0, cleared: false, totalCleared: 0 },
  };
}

/**
 * Step-by-step migrations. MIGRATIONS[n] upgrades a version-n save to n+1.
 * Version 0 = anything without an integer saveVersion (pre-release / corrupted).
 * Each migration gets (save, content, balance); missing keys are filled from
 * defaultState afterwards, so a migration only has to handle what needs logic.
 */
export const MIGRATIONS = {
  0: (s) => s, // defaults are filled below
  // v1 -> v2 (Session 4): the Academy tutorial and one-time tips. A save that already
  // cleared the Prologue skips the tutorial automatically and gets the tutorial reward
  // (the same as skipping it by hand); the old first-battle "onboardingDone" flag
  // becomes the battle tips' seen marks.
  1: (s, C, B) => {
    const cleared = isObj(s.progress?.cleared) ? s.progress.cleared : {};
    const prologue = C.arcs[0];
    const prologueDone = !!prologue && prologue.nodes.every(n => cleared[n.id]);
    if (!isObj(s.tutorial)) {
      s.tutorial = prologueDone
        ? { status: 'done', lesson: 0, completed: false, rewarded: false, autoSkipped: true }
        : { status: 'new', lesson: 0, completed: false, rewarded: false };
      if (prologueDone) grantTutorialReward(s, B);
    }
    if (!isObj(s.tips)) s.tips = { seen: {} };
    if (isObj(s.settings) && s.settings.onboardingDone) for (const id of BATTLE_TIP_IDS) s.tips.seen[id] = 1;
    if (isObj(s.settings)) delete s.settings.onboardingDone;
    return s;
  },
};

/** Pays the tutorial reward once (finishing and skipping pay the same). Returns what was paid. */
export function grantTutorialReward(s, B = BALANCE) {
  if (!isObj(s.tutorial) || s.tutorial.rewarded) return null;
  const r = B.tutorial.rewards;
  if (!isObj(s.currencies)) s.currencies = {};
  s.currencies.scrolls = (Number(s.currencies.scrolls) || 0) + r.scrolls;
  s.currencies.ryo = (Number(s.currencies.ryo) || 0) + r.ryo;
  s.tutorial.rewarded = true;
  return { scrolls: r.scrolls, ryo: r.ryo };
}

function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

/** Fill any missing keys in `target` from `defaults` (deep, objects only). */
function fillDefaults(target, defaults) {
  for (const [k, v] of Object.entries(defaults)) {
    if (target[k] === undefined || target[k] === null || (isObj(v) && !isObj(target[k])) || (Array.isArray(v) && !Array.isArray(target[k]))) {
      target[k] = structuredClone(v);
    } else if (isObj(v) && isObj(target[k]) && !['roster', 'cleared', 'hard', 'seen', 'unlocked', 'claimed'].includes(k)) {
      fillDefaults(target[k], v);
    }
  }
  return target;
}

/** Upgrade any raw save to the current version. Never throws. */
export function migrate(raw, C, B = BALANCE) {
  const fresh = defaultState(C, B);
  try {
    if (!isObj(raw)) return fresh;
    let s = structuredClone(raw);
    let v = Number.isInteger(s.saveVersion) ? s.saveVersion : 0;
    let guard = 0;
    while (v < SAVE_VERSION && guard++ < 100) {
      const m = MIGRATIONS[v];
      if (m) s = m(s, C, B) || s;
      v++; s.saveVersion = v;
    }
    s = fillDefaults(s, fresh);
    // Sanitize numbers
    for (const k of ['scrolls', 'ryo', 'tickets', 'rareTickets']) { const n = Number(s.currencies[k]); s.currencies[k] = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fresh.currencies[k]; }
    for (const [id, o] of Object.entries(s.roster)) {
      if (!isObj(o)) { delete s.roster[id]; continue; }
      o.level = Math.max(1, Math.min(B.stats.levelCap, Math.floor(Number(o.level) || 1)));
      o.stars = Math.max(1, Math.min(B.stats.starCap, Math.floor(Number(o.stars) || 1)));
    }
    // Starters are always owned (protects against a corrupted roster)
    for (const id of Object.keys(fresh.roster)) if (!s.roster[id]) s.roster[id] = { level: 1, stars: 1 };
    // Team must reference owned, known characters
    const known = (id) => !!C.char[id] && !!s.roster[id];
    s.team.members = (Array.isArray(s.team.members) ? s.team.members : []).filter(known).slice(0, 3);
    if (s.team.leader && !known(s.team.leader)) s.team.leader = null;
    if (!s.team.members.length) s.team = structuredClone(fresh.team);
    if (!isObj(s.progress.cleared)) s.progress.cleared = {};
    if (!isObj(s.progress.hard)) s.progress.hard = {};
    for (const k of ['unlocked', 'claimed']) if (!isObj(s.achievements[k])) s.achievements[k] = {};
    const T = s.tutorial;
    if (!['new', 'active', 'done'].includes(T.status)) T.status = 'new';
    T.lesson = Math.max(0, Math.min((C.tutorial?.nodes?.length || 1) - 1, Math.floor(Number(T.lesson) || 0)));
    if (!isObj(s.tips.seen)) s.tips.seen = {};
    s.gacha.pity = Math.max(0, Math.floor(Number(s.gacha.pity) || 0));
    s.updatedAt = Number(s.updatedAt) || 0;
    return s;
  } catch (e) {
    console.warn('[save] migrate failed, starting fresh', e);
    return fresh;
  }
}

// base64 that survives unicode
export function encodeSave(obj) {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = ''; for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
export function decodeSave(str) {
  const bin = atob(String(str).trim());
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export class SaveManager {
  /**
   * opts = { local, cloud, content, balance, cloudDebounceMs, onCloudNewer(cloudState) -> Promise<boolean> }
   */
  constructor({ local, cloud = null, content, balance = BALANCE, cloudDebounceMs = 3000, onCloudNewer = null }) {
    this.local = local; this.cloud = cloud; this.C = content; this.B = balance;
    this.cloudDebounceMs = cloudDebounceMs; this.onCloudNewer = onCloudNewer;
    this.cloudRetryMs = 30000; this.cloudError = null; this._retryTimer = null;
    this.state = null; this._cloudTimer = null; this.lastCloudSave = 0; this.cloudStatus = 'not configured';
    this.listeners = new Set();
  }

  async init() {
    let raw = null;
    try { const r = await this.local.load(); raw = r?.data ?? null; } catch (e) { console.warn('[save] local load failed', e); }
    this.state = migrate(raw, this.C, this.B);
    return this.state;
  }

  /** Connect the cloud backend and, with a session, offer a newer cloud save then upload (never throws). */
  async initCloud() {
    const ok = await this.connectCloud();
    if (ok) await this.afterSignIn();
  }

  /**
   * Load the SDK and restore the session this browser already has. Never creates
   * one (the start menu does that) and never throws. Resolves true with a session.
   */
  async connectCloud() {
    if (!this.cloud) { this.cloudStatus = 'not configured'; return false; }
    let ok = false;
    try { ok = await this.cloud.init(); this.cloudStatus = this.cloud.status; }
    catch (e) { console.warn('[save] cloud init failed', e); this.cloudStatus = 'error'; }
    this._notify();
    return ok;
  }

  async checkCloudNewer() {
    try {
      const r = await this.cloud.load();
      if (!r || !r.data) { this.saveCloudNow(); return false; }
      const localT = this.state.updatedAt || 0;
      if ((r.updatedAt || 0) > localT + 1000) {
        const accept = this.onCloudNewer ? await this.onCloudNewer(r) : false;
        if (accept) { this.replaceState(migrate(r.data, this.C, this.B), { skipCloud: true }); return true; }
      }
      return false;
    } catch (e) { console.warn('[save] cloud compare failed', e); return false; }
  }

  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  _notify() { for (const fn of this.listeners) { try { fn(this.state); } catch (e) { console.warn(e); } } }

  /** Persist now (local) and schedule a debounced cloud write. */
  save(reason = '') {
    if (!this.state) return;
    this.state.updatedAt = Date.now();
    try { this.local.save(this.state); } catch (e) { console.warn('[save] local save failed', e); }
    this._scheduleCloud();
    this._notify();
  }

  _scheduleCloud() {
    if (!this.cloud || !this.cloud.ready) return;
    clearTimeout(this._cloudTimer);
    this._cloudTimer = setTimeout(() => this.saveCloudNow(), this.cloudDebounceMs);
  }

  async saveCloudNow() {
    if (!this.cloud || !this.cloud.ready) return false;
    clearTimeout(this._retryTimer);
    try {
      await this.cloud.save(this.state);
      this.lastCloudSave = Date.now(); this.cloudError = null; this.cloudStatus = this.cloud.status;
      this._notify();
      return true;
    } catch (e) {
      console.warn('[save] cloud save failed', e);
      this.cloudError = e?.code || e?.message || 'unknown';
      this.cloudStatus = 'error (will retry)';
      // Try again in a while; every local save also schedules another upload.
      this._retryTimer = setTimeout(() => this.saveCloudNow(), this.cloudRetryMs);
      this._notify();
      return false;
    }
  }

  /** One summary of the cloud save for the UI (Settings). */
  cloudState() {
    const c = this.cloud;
    if (!c) return { kind: 'off' };
    if (c.phase === 'connecting') return { kind: 'connecting' };
    if (c.phase === 'error') return { kind: 'error', error: c.error };
    if (c.phase === 'signedOut' || !c.ready) return { kind: 'signedOut' };
    return { kind: c.isAnonymous ? 'guest' : 'google', account: c.accountLabel, name: c.displayName || null, lastSync: this.lastCloudSave, syncError: this.cloudError };
  }

  /** After signing in (Google or guest): offer a newer cloud save, then upload this one. */
  async afterSignIn() {
    const loaded = await this.checkCloudNewer();
    if (!loaded) await this.saveCloudNow();
    this._notify();
  }

  replaceState(s, { skipCloud = false } = {}) {
    this.state = s;
    this.state.updatedAt = Date.now();
    try { this.local.save(this.state); } catch (e) { console.warn(e); }
    if (!skipCloud) this._scheduleCloud();
    this._notify();
  }

  exportString() { return encodeSave(this.state); }
  importString(str) {
    try {
      const raw = decodeSave(str);
      if (!isObj(raw) || !raw.currencies) return { ok: false, error: 'That does not look like a save.' };
      this.replaceState(migrate(raw, this.C, this.B));
      return { ok: true };
    } catch (e) { return { ok: false, error: 'Could not read that save string.' }; }
  }
  reset() { this.replaceState(defaultState(this.C, this.B)); }
}

// SaveManager.js — versioned save state with pluggable backends.
// Backends implement: { name, isAvailable(), async load() -> {data, updatedAt}|null, async save(data) }.
// Local saves are written immediately; cloud saves are debounced.
import { BALANCE } from '../config/balance.js';

export const SAVE_VERSION = 1;

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
    currencies: { scrolls: B.economy.start.scrolls, ryo: B.economy.start.ryo },
    roster,
    team: { members: starters.filter(c => c !== leader).map(c => c.id).slice(0, 3), leader: leader ? leader.id : null },
    progress: { cleared: {} },
    gacha: { pity: 0, totalPulls: 0, history: [] },
    bossRush: { highestRound: 0, runs: 0 },
    settings: { muted: false, onboardingDone: false, autoUlt: false, speed: 1 },
    stats: { battles: 0, wins: 0, losses: 0 },
  };
}

/**
 * Step-by-step migrations. MIGRATIONS[n] upgrades a version-n save to n+1.
 * Version 0 = anything without an integer saveVersion (pre-release / corrupted).
 * Session 2+: add MIGRATIONS[1] = (s) => { ...; return s; } and bump SAVE_VERSION.
 */
export const MIGRATIONS = {
  0: (s) => s, // defaults are filled below
};

function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }

/** Fill any missing keys in `target` from `defaults` (deep, objects only). */
function fillDefaults(target, defaults) {
  for (const [k, v] of Object.entries(defaults)) {
    if (target[k] === undefined || target[k] === null || (isObj(v) && !isObj(target[k])) || (Array.isArray(v) && !Array.isArray(target[k]))) {
      target[k] = structuredClone(v);
    } else if (isObj(v) && isObj(target[k]) && k !== 'roster' && k !== 'cleared') {
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
      if (m) s = m(s) || s;
      v++; s.saveVersion = v;
    }
    s = fillDefaults(s, fresh);
    // Sanitize numbers
    for (const k of ['scrolls', 'ryo']) { const n = Number(s.currencies[k]); s.currencies[k] = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fresh.currencies[k]; }
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
    this.state = null; this._cloudTimer = null; this.lastCloudSave = 0; this.cloudStatus = 'not configured';
    this.listeners = new Set();
  }

  async init() {
    let raw = null;
    try { const r = await this.local.load(); raw = r?.data ?? null; } catch (e) { console.warn('[save] local load failed', e); }
    this.state = migrate(raw, this.C, this.B);
    return this.state;
  }

  /** Connect the cloud backend (never throws). Offers the cloud save if newer. */
  async initCloud() {
    if (!this.cloud) { this.cloudStatus = 'not configured'; return; }
    try {
      const ok = await this.cloud.init();
      this.cloudStatus = this.cloud.status;
      if (!ok) return;
      await this.checkCloudNewer();
    } catch (e) {
      console.warn('[save] cloud init failed', e);
      this.cloudStatus = 'error';
    }
    this._notify();
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
    if (!this.cloud || !this.cloud.ready) return;
    try { await this.cloud.save(this.state); this.lastCloudSave = Date.now(); this.cloudStatus = this.cloud.status; }
    catch (e) { console.warn('[save] cloud save failed', e); this.cloudStatus = 'error (will retry)'; }
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

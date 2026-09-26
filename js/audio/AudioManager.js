// AudioManager.js — the game's audio (docs/AUDIO_PLAN.md): everything synthesised with Web Audio,
// no files. The context is created and unlocked on the first user gesture (browser policy); a
// music start asked for before that waits in a one-slot queue. Three buses under the master:
// music (ducked under dialogue, pauses and cut-ins), sfx (through a soft limiter) and ui.
// The old surface (hit(), clash(), victory(), setMuted() …) is kept for the screens that call it.
import { Synth } from './Synth.js';
import { MusicPlayer, playStinger, TRACKS } from './Music.js';
import { Sfx } from './Sfx.js';

const DEFAULTS = { muted: false, music: true, sfx: true, musicVol: 0.6, sfxVol: 0.8 };
const MASTER = 0.8;

export class AudioManager {
  /** win: the window (null in tests); AudioCtx: a context class (the fake in tests). */
  constructor({ win = (typeof window !== 'undefined' ? window : null), AudioCtx = null } = {}) {
    this.win = win; this.AudioCtx = AudioCtx;
    this.ctx = null; this.master = null; this.buses = null; this.synth = null; this.music = null; this.sfx = null;
    this.settings = { ...DEFAULTS }; this.muted = false; this.era = 'p1';
    this.pendingMusic = null;   // { id, opts } asked for before the unlock
    this.duckCount = 0; this.suspendedByVisibility = false; this.contexts = 0;
    this._unlock = this._unlock.bind(this);
    if (win) {
      for (const ev of ['pointerdown', 'keydown', 'touchstart']) win.addEventListener(ev, this._unlock, { passive: true });
      win.document?.addEventListener?.('visibilitychange', () => this._visibility());
    }
  }

  // ---------------------------------------------------------------- the context and the buses
  _unlock() {
    try {
      if (!this.ctx) {
        const AC = this.AudioCtx || this.win?.AudioContext || this.win?.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC(); this.contexts++;
        this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
        const mk = () => { const g = this.ctx.createGain(); return g; };
        this.buses = { music: mk(), sfx: mk(), ui: mk() };
        this.synth = new Synth(this.ctx);
        const lim = this.synth.limiter(1.4);
        this.buses.music.connect(this.master); this.buses.sfx.connect(lim); lim.connect(this.master); this.buses.ui.connect(this.master);
        this.duck = this.ctx.createGain(); this.buses.music.disconnect(); this.buses.music.connect(this.duck); this.duck.connect(this.master);
        this.music = new MusicPlayer(this.synth, this.buses.music);
        this.sfx = new Sfx(this.synth, { sfx: this.buses.sfx, ui: this.buses.ui });
        this.sfx.enabled = () => this.ready && this.settings.sfx;
        this.sfx.era = this.era;
        this._applyGains(0);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume?.().catch?.(() => {});
      if (this.pendingMusic) { const p = this.pendingMusic; this.pendingMusic = null; this.playMusic(p.id, p.opts); }
    } catch (e) { console.warn('[audio] unlock failed', e); }
  }
  get ready() { return !!(this.ctx && this.ctx.state === 'running' && !this.muted); }
  get unlocked() { return !!this.ctx; }
  _visibility() {
    const hidden = this.win?.document?.hidden;
    if (!this.ctx) return;
    if (hidden) { this.suspendedByVisibility = true; try { this.ctx.suspend?.(); } catch { /* ignore */ } }
    else if (this.suspendedByVisibility) { this.suspendedByVisibility = false; try { this.ctx.resume?.(); } catch { /* ignore */ } }
  }

  // ---------------------------------------------------------------- settings
  /** Read the save's settings: muted, music, sfx, musicVol, sfxVol. */
  apply(settings = {}) {
    const s = settings || {};
    this.settings = {
      muted: !!s.muted, music: s.music !== false, sfx: s.sfx !== false,
      musicVol: clamp01(s.musicVol, DEFAULTS.musicVol), sfxVol: clamp01(s.sfxVol, DEFAULTS.sfxVol),
    };
    this.muted = this.settings.muted;
    this._applyGains(0.2);
  }
  setMuted(m) { this.settings.muted = !!m; this.muted = !!m; this._applyGains(0.02); }
  setEra(era) { this.era = era === 'p2' ? 'p2' : 'p1'; if (this.sfx) this.sfx.era = this.era; }
  setSpeed(x) { if (this.sfx) this.sfx.speed = x; }
  /** The bus gains as the settings say (music, sfx, ui, master). */
  _applyGains(ramp = 0.2) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime; const set = (g, v) => { try { g.gain.cancelScheduledValues?.(t); g.gain.setTargetAtTime(v, t, Math.max(0.005, ramp / 3)); } catch { g.gain.value = v; } };
    set(this.master, this.settings.muted ? 0 : MASTER);
    set(this.buses.music, this.settings.music ? this.settings.musicVol : 0);
    set(this.buses.sfx, this.settings.sfx ? this.settings.sfxVol : 0);
    set(this.buses.ui, this.settings.sfx ? this.settings.sfxVol * 0.8 : 0);
  }
  /** The current levels, for tests and the debug panel. */
  levels() { return { master: this.master?.gain.value ?? 0, music: this.buses?.music.gain.value ?? 0, sfx: this.buses?.sfx.gain.value ?? 0, ui: this.buses?.ui.gain.value ?? 0 }; }

  // ---------------------------------------------------------------- music
  /** Start (or switch to) a loop. Before the unlock the request waits for the first gesture. */
  playMusic(id, opts = {}) {
    if (!TRACKS[id]) return false;
    if (!this.ctx) { this.pendingMusic = { id, opts }; return false; }
    return this.music.play(id, opts);
  }
  stopMusic(fade = 0.6) { this.pendingMusic = null; if (this.music) this.music.stop(fade); }
  get playing() { return this.music?.playing || (this.pendingMusic ? this.pendingMusic.id : null); }
  setLayer(name, on) { if (this.music) this.music.setLayer(name, on); }
  /** Duck the music (dialogue, pause, cut-ins): counted, so nested ducks release together. */
  duckMusic(on, db = 9) {
    this.duckCount = Math.max(0, this.duckCount + (on ? 1 : -1));
    if (!this.ctx || !this.duck) return;
    const t = this.ctx.currentTime; const target = this.duckCount > 0 ? Math.pow(10, -db / 20) : 1;
    try { this.duck.gain.cancelScheduledValues?.(t); this.duck.gain.setTargetAtTime(target, t, this.duckCount > 0 ? 0.03 : 0.1); } catch { /* fake */ }
  }
  /** A stinger over the loop (ducked 6 dB while it plays). Returns its length. */
  stinger(id) {
    if (!this.ready || !this.settings.music) return 0;
    const len = playStinger(this.synth, this.buses.music, id, this.ctx.currentTime);
    if (len > 0 && this.music?.playing) { this.duckMusic(true, 6); const st = this.win?.setTimeout || setTimeout; st(() => this.duckMusic(false), len * 1000); }
    return len;
  }

  // ---------------------------------------------------------------- sound effects (the old surface, plus the new cues)
  cue(name, ...args) { if (this.sfx && this.ready && this.settings.sfx) { const fn = this.sfx[name]; if (typeof fn === 'function') return fn.apply(this.sfx, args); } return undefined; }
  hit() { this.cue('hit'); }
  crit() { this.cue('crit'); }
  effective() { this.cue('effective'); }
  resisted() { this.cue('resisted'); }
  ultReady() { this.cue('ultReady'); }
  ultFire(nature = null, name = null) { this.cue('ultFire', nature, name); }
  clash(outcome) { this.cue('clash', outcome); }
  telegraph(nature = null, name = null, windup = 2, special = false) { this.cue('telegraph', nature, name, windup, special); }
  impact(nature, power, name) { this.cue('impact', nature, power, name); }
  mechanic(kind, name) { this.cue('mechanic', kind, name); }
  ko(kind) { this.cue('ko', kind); }
  pullReveal(tier) { this.cue('pullReveal', tier); }
  scroll() { this.ui('circle'); }
  victory() { this.stinger('victory'); }
  defeat() { this.stinger('defeat'); }
  click() { this.ui('tap'); }
  levelUp(kind = 'one') { this.ui(kind === 'max' ? 'fanfare' : kind === 'five' ? 'riseLong' : 'rise'); }
  achievement() { this.cue('achievement'); }
  ui(kind) { this.cue('ui', kind, { era: this.era }); }
  blip() { this.ui('blip'); }
}
function clamp01(v, d) { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : d; }

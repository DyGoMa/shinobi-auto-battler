// Sfx.js — the sound effects (docs/AUDIO_PLAN.md §6): a cue table over the synth voices, with a
// priority per cue and a throttle so thirty hits in a frame become a few. Battle cues are
// keyed by nature (a cast and an impact each) with signature sounds over them for the named
// techniques; the interface cues carry the era's flavour (paper and wood, or metal).
import { midiToFreq } from './Synth.js';

const f = (m) => midiToFreq(m);
const rnd = (a, b) => a + Math.random() * (b - a);
// priority: high wins when the mixer is busy (a cue below the busy level is dropped)
export const PRIORITY = { blip: 0, ui: 1, hit: 2, effective: 3, crit: 3, heal: 4, status: 4, telegraph: 5, mechanic: 6, ko: 7, ult: 8, clash: 9, boss: 10, stinger: 11 };
const THROTTLE = { hit: 55, crit: 90, effective: 110, resisted: 140, ultReady: 200, telegraph: 400, impact: 45, cast: 300, ui: 40, heal: 120, stun: 250, blip: 30, tick: 900, ko: 120 };

const SIGS = [
  { re: /rasen.?shuriken/i, cast: 'whirl', impact: 'dome' }, { re: /rasengan/i, cast: 'whirl', impact: 'drill' },
  { re: /chidori|lightning blade|thunder spirit|lightning fangs|false darkness/i, cast: 'birds', impact: 'crack' },
  { re: /water dragon/i, cast: null, impact: 'rush' }, { re: /amaterasu|inferno/i, cast: null, impact: 'sizzle' },
  { re: /susanoo/i, cast: 'choirpad', impact: null }, { re: /kamui/i, cast: 'spiral', impact: 'spiral' }, { re: /sand|shukaku|iron sand/i, cast: 'grains', impact: 'hiss' },
  { re: /eight trigrams|gentle fist/i, cast: null, impact: 'taps' }, { re: /shadow/i, cast: 'lowsweep', impact: null }, { re: /summoning|super beast/i, cast: null, impact: 'poof' },
  { re: /tailed beast bomb|truth-seeking|expansive/i, cast: 'subcharge', impact: 'boom' }, { re: /almighty push|universal pull|planetary|tengai/i, cast: null, impact: 'whoomp' },
  { re: /flying raijin/i, cast: null, impact: 'flashtone' }, { re: /substitution/i, cast: null, impact: 'pop' }, { re: /curse/i, cast: 'drone', impact: null },
];
export function soundSignature(name) { if (!name) return null; return SIGS.find(s => s.re.test(name)) || null; }

export class Sfx {
  /** synth: a Synth; buses: { sfx, ui } gain nodes. */
  constructor(synth, buses) {
    this.s = synth; this.ctx = synth.ctx; this.sfx = buses.sfx; this.ui = buses.ui;
    this.last = new Map(); this.era = 'p1'; this.speed = 1; this.enabled = () => true;
    this.count = 0;
  }
  get now() { return this.ctx.currentTime; }
  _ok(key, ms) {
    if (!this.enabled()) return false;
    if (!ms) return true;
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const widened = ms * (this.speed > 1 ? Math.min(2.5, 1 + (this.speed - 1) * 0.4) : 1);
    const last = this.last.get(key) || -1e9; if (now - last < widened) return false;
    this.last.set(key, now); this.count++; return true;
  }

  // ---------------------------------------------------------------- battle: natures
  /** The cast of a wind-up or an Ultimate charge. dur in seconds. */
  cast(nature, dur = 0.6, name = null) {
    if (!this._ok('cast', THROTTLE.cast)) return;
    const o = this.sfx, t0 = this.now, s = this.s; const sig = soundSignature(name);
    if (sig?.cast) { this._sigCast(sig.cast, t0, dur); return; }
    switch (nature) {
      case 'Fire': s.noise(o, { t0, dur, vol: 0.18, type: 'lowpass', freq: 200, to: 1600, attack: 0.1, release: 0.15 }); break;
      case 'Wind': s.noise(o, { t0, dur, vol: 0.14, type: 'bandpass', freq: 600, to: 2600, q: 2, attack: 0.08, release: 0.1 }); break;
      case 'Lightning': for (let i = 0; i < 10; i++) s.tone(o, { t0: t0 + rnd(0, dur), freq: rnd(1800, 4200), to: rnd(900, 2600), type: 'sawtooth', dur: 0.04, vol: 0.06, release: 0.03 }); break;
      case 'Earth': s.tone(o, { t0, freq: 40, dur, vol: 0.2, type: 'sine', attack: 0.1, release: 0.2 }); s.noise(o, { t0, dur, vol: 0.12, type: 'lowpass', freq: 120, attack: 0.1, release: 0.2 }); break;
      case 'Water': { s.noise(o, { t0, dur, vol: 0.14, type: 'bandpass', freq: 500, to: 900, q: 3, attack: 0.1, release: 0.15 }); for (let i = 0; i < 6; i++) s.tone(o, { t0: t0 + rnd(0, dur), freq: rnd(600, 1400), to: rnd(1200, 2400), type: 'sine', dur: 0.06, vol: 0.05 }); break; }
      default: s.noise(o, { t0, dur: Math.min(dur, 0.4), vol: 0.12, type: 'bandpass', freq: 400, to: 2000, q: 1, attack: 0.05, release: 0.1 });
    }
  }
  /** An impact at power (0.4 an auto attack, 1 a special, 1.5 an Ultimate). */
  impact(nature, power = 1, name = null) {
    if (!this._ok('impact', THROTTLE.impact)) return;
    const o = this.sfx, t0 = this.now, s = this.s; const v = Math.min(1.6, power); const sig = soundSignature(name);
    if (sig?.impact) { this._sigImpact(sig.impact, t0, v); return; }
    switch (nature) {
      case 'Fire': s.noise(o, { t0, dur: 0.08 * v, vol: 0.22 * v, type: 'lowpass', freq: 700, release: 0.1 }); for (let i = 0; i < 4; i++) s.click(o, { t0: t0 + rnd(0.02, 0.2), freq: rnd(2000, 4000), vol: 0.05 * v }); break;
      case 'Wind': s.noise(o, { t0, dur: 0.12 * v, vol: 0.2 * v, type: 'bandpass', freq: 3200, to: 700, q: 1.5, release: 0.08 }); break;
      case 'Lightning': s.click(o, { t0, freq: 4000, vol: 0.3 * v, dur: 0.02 }); s.noise(o, { t0: t0 + 0.02, dur: 0.25 * v, vol: 0.16 * v, type: 'lowpass', freq: 500, to: 120, release: 0.2 }); break;
      case 'Earth': s.tone(o, { t0, freq: 70, to: 35, type: 'sine', dur: 0.09 * v, vol: 0.32 * v, attack: 0.002, release: 0.1 }); for (let i = 0; i < 3; i++) s.click(o, { t0: t0 + rnd(0.05, 0.3), freq: rnd(900, 1800), vol: 0.06 * v }); break;
      case 'Water': s.noise(o, { t0, dur: 0.2 * v, vol: 0.2 * v, type: 'highpass', freq: 3000, to: 300, release: 0.12 }); break;
      default: this._hit(power);
    }
  }
  _hit(power) {
    const o = this.sfx, t0 = this.now, s = this.s;
    if (power >= 1.2) { s.noise(o, { t0, dur: 0.12, vol: 0.26, type: 'lowpass', freq: 900 }); s.tone(o, { t0, freq: 120, to: 50, type: 'sine', dur: 0.14, vol: 0.3, attack: 0.002 }); }
    else { s.noise(o, { t0, dur: 0.06, vol: 0.12, type: 'lowpass', freq: 1800 }); s.tone(o, { t0, freq: 180, to: 90, type: 'square', dur: 0.06, vol: 0.06 }); }
  }
  _sigCast(kind, t0, dur) {
    const o = this.sfx, s = this.s;
    switch (kind) {
      case 'whirl': { const g = s._gain(0); s.env(g.gain, t0, { attack: 0.1, release: 0.1, peak: 0.12, dur }); g.connect(o); const a = s._osc('sine', 300, t0), b = s._osc('sine', 305, t0); a.frequency.exponentialRampToValueAtTime(900, t0 + dur); b.frequency.exponentialRampToValueAtTime(915, t0 + dur); const lfo = s._osc('sine', 18, t0); const lg = s._gain(0.5); lfo.connect(lg); lg.connect(g.gain); a.connect(g); b.connect(g); a.start(t0); b.start(t0); lfo.start(t0); a.stop(t0 + dur + 0.2); b.stop(t0 + dur + 0.2); lfo.stop(t0 + dur + 0.2); break; }
      case 'birds': for (let i = 0; i < 18; i++) s.tone(o, { t0: t0 + rnd(0, dur), freq: rnd(2200, 5200), to: rnd(1200, 3000), type: 'sawtooth', dur: 0.03, vol: 0.05, release: 0.02 }); break;
      case 'choirpad': s.choir(o, { t0, freqs: [f(45), f(52), f(57)], dur: Math.max(1.2, dur), vol: 0.14, attack: 0.3 }); break;
      case 'spiral': s.tone(o, { t0, freq: 200, to: 2400, type: 'sine', dur, vol: 0.12, attack: 0.05, release: 0.1 }); break;
      case 'grains': for (let i = 0; i < 24; i++) s.click(o, { t0: t0 + (i / 24) * dur, freq: rnd(1500, 3500), vol: 0.04 + 0.08 * (i / 24), dur: 0.012 }); s.noise(o, { t0: t0 + dur * 0.5, dur: dur * 0.5, vol: 0.12, type: 'highpass', freq: 2500, attack: 0.2 }); break;
      case 'lowsweep': s.noise(o, { t0, dur, vol: 0.14, type: 'lowpass', freq: 90, to: 260, attack: 0.15, release: 0.2 }); break;
      case 'subcharge': s.tone(o, { t0, freq: 30, to: 60, type: 'sine', dur, vol: 0.32, attack: 0.2, release: 0.15 }); s.noise(o, { t0, dur, vol: 0.08, type: 'lowpass', freq: 200, attack: 0.3 }); break;
      case 'drone': s.tone(o, { t0, freq: 110, to: 190, type: 'sawtooth', dur, vol: 0.09, attack: 0.2, release: 0.2 }); s.tone(o, { t0, freq: 113, to: 195, type: 'sawtooth', dur, vol: 0.07, attack: 0.2, release: 0.2 }); break;
      default: break;
    }
  }
  _sigImpact(kind, t0, v) {
    const o = this.sfx, s = this.s;
    switch (kind) {
      case 'drill': s.tone(o, { t0, freq: 900, to: 200, type: 'sine', dur: 0.25, vol: 0.2 * v }); s.noise(o, { t0: t0 + 0.05, dur: 0.3, vol: 0.28 * v, type: 'lowpass', freq: 1200, to: 200 }); s.tone(o, { t0: t0 + 0.05, freq: 90, to: 40, type: 'sine', dur: 0.3, vol: 0.3 * v }); break;
      case 'dome': s.noise(o, { t0, dur: 0.5, vol: 0.3 * v, type: 'bandpass', freq: 2500, to: 300, q: 1 }); s.tone(o, { t0, freq: 70, to: 35, type: 'sine', dur: 0.5, vol: 0.32 * v }); break;
      case 'crack': s.click(o, { t0, freq: 5000, vol: 0.35 * v, dur: 0.03 }); s.noise(o, { t0, dur: 0.18, vol: 0.28 * v, type: 'highpass', freq: 1500, to: 200 }); s.noise(o, { t0: t0 + 0.05, dur: 0.4, vol: 0.14 * v, type: 'lowpass', freq: 400, to: 100 }); break;
      case 'rush': s.noise(o, { t0, dur: 0.4, vol: 0.24 * v, type: 'bandpass', freq: 700, to: 2200, q: 1.5, attack: 0.05 }); s.noise(o, { t0: t0 + 0.35, dur: 0.3, vol: 0.26 * v, type: 'highpass', freq: 2500, to: 300 }); break;
      case 'sizzle': s.noise(o, { t0, dur: 1.2, vol: 0.14 * v, type: 'bandpass', freq: 1800, q: 1, attack: 0.05, release: 0.6 }); s.tone(o, { t0, freq: 60, dur: 1, vol: 0.14 * v, type: 'sine', attack: 0.1, release: 0.5 }); break;
      case 'spiral': s.tone(o, { t0, freq: 2400, to: 200, type: 'sine', dur: 0.4, vol: 0.14 * v }); break;
      case 'hiss': s.noise(o, { t0, dur: 0.35, vol: 0.2 * v, type: 'highpass', freq: 3500, to: 900, release: 0.2 }); s.tone(o, { t0, freq: 70, to: 35, type: 'sine', dur: 0.12, vol: 0.2 * v }); break;
      case 'taps': for (let i = 0; i < 8; i++) s.click(o, { t0: t0 + i * 0.045, freq: 1400 + (i % 2) * 400, vol: 0.14 * v, dur: 0.015 }); break;
      case 'poof': s.noise(o, { t0, dur: 0.3, vol: 0.22 * v, type: 'lowpass', freq: 1500, to: 300, release: 0.2 }); s.tone(o, { t0, freq: 300, to: 90, type: 'sine', dur: 0.2, vol: 0.14 * v }); break;
      case 'boom': s.tone(o, { t0, freq: 60, to: 25, type: 'sine', dur: 0.6, vol: 0.4 * v, attack: 0.002, release: 0.5 }); s.noise(o, { t0, dur: 0.7, vol: 0.26 * v, type: 'lowpass', freq: 600, to: 80, release: 0.5 }); break;
      case 'whoomp': s.noise(o, { t0, dur: 0.5, vol: 0.24 * v, type: 'lowpass', freq: 300, to: 60, release: 0.6 }); s.tone(o, { t0, freq: 50, to: 30, type: 'sine', dur: 0.5, vol: 0.3 * v, release: 0.5 }); break;
      case 'flashtone': s.tone(o, { t0, freq: 1800, to: 3600, type: 'sine', dur: 0.12, vol: 0.14 * v }); s.click(o, { t0, freq: 6000, vol: 0.2 * v }); break;
      case 'pop': s.tone(o, { t0, freq: 500, to: 250, type: 'sine', dur: 0.08, vol: 0.18 * v }); s.woodblock(o, { t0: t0 + 0.06, vol: 0.18 * v }); break;
      default: this._hit(v);
    }
  }

  // ---------------------------------------------------------------- battle: events and mechanics
  hit() { if (this._ok('hit', THROTTLE.hit)) this._hit(0.6); }
  crit() { if (this._ok('crit', THROTTLE.crit)) { const o = this.sfx, t0 = this.now; this.s.noise(o, { t0, dur: 0.1, vol: 0.2, type: 'lowpass', freq: 3000 }); this.s.tone(o, { t0, freq: 520, to: 260, type: 'sawtooth', dur: 0.12, vol: 0.12 }); } }
  effective() { if (this._ok('effective', THROTTLE.effective)) { const o = this.sfx, t0 = this.now; this.s.tone(o, { t0, freq: 660, to: 990, type: 'triangle', dur: 0.12, vol: 0.16 }); this.s.tone(o, { t0: t0 + 0.05, freq: 990, type: 'sine', dur: 0.1, vol: 0.08 }); } }
  resisted() { if (this._ok('resisted', THROTTLE.resisted)) this.s.tone(this.sfx, { t0: this.now, freq: 220, to: 160, type: 'triangle', dur: 0.1, vol: 0.08 }); }
  ultReady() { if (this._ok('ultReady', THROTTLE.ultReady)) { const o = this.sfx, t0 = this.now; this.s.tone(o, { t0, freq: 880, type: 'sine', dur: 0.09, vol: 0.12 }); this.s.tone(o, { t0: t0 + 0.07, freq: 1320, type: 'sine', dur: 0.12, vol: 0.1 }); } }
  ultFire(nature = null, name = null) { if (!this._ok('ult', 0)) return; const o = this.sfx, t0 = this.now; this.s.noise(o, { t0, dur: 0.3, vol: 0.22, type: 'lowpass', freq: 900 }); this.s.tone(o, { t0, freq: 140, to: 520, type: 'sawtooth', dur: 0.3, vol: 0.14 }); this.s.tone(o, { t0, freq: 70, to: 40, type: 'sine', dur: 0.4, vol: 0.28 }); this.last.set('cast', -1e9); this.cast(nature, 0.45, name); }
  clash(outcome) {
    if (!this._ok('clash', 0)) return; const o = this.sfx, t0 = this.now, s = this.s;
    s.noise(o, { t0, dur: 0.5, vol: 0.2, type: 'bandpass', freq: 1200, q: 0.8, attack: 0.05, release: 0.3 });
    for (let i = 0; i < 12; i++) s.tone(o, { t0: t0 + rnd(0, 0.45), freq: rnd(1500, 3800), to: rnd(800, 2000), type: 'sawtooth', dur: 0.03, vol: 0.05 });
    const chord = outcome === 'overpower' ? [72, 79, 84] : outcome === 'standoff' ? [69, 69] : [64, 59];
    chord.forEach((m, i) => s.tone(o, { t0: t0 + 0.45 + i * 0.07, freq: f(m), type: 'square', dur: 0.16, vol: 0.12 }));
    s.tone(o, { t0: t0 + 0.45, freq: 80, to: 35, type: 'sine', dur: 0.4, vol: 0.34, attack: 0.002, release: 0.3 });
  }
  telegraph(nature = null, name = null, windup = 2, special = false) {
    if (!this._ok('telegraph', THROTTLE.telegraph)) return; const o = this.sfx, t0 = this.now, s = this.s;
    if (special) { s.tone(o, { t0, freq: 440, dur: 0.14, vol: 0.12, type: 'square' }); s.tone(o, { t0: t0 + 0.16, freq: 330, dur: 0.22, vol: 0.12, type: 'square' }); }
    else s.tone(o, { t0, freq: 300, to: 600, type: 'triangle', dur: 0.4, vol: 0.08 });
    this.last.set('cast', -1e9); this.cast(nature, Math.min(2.5, windup), name);
  }
  mechanic(kind, name = null) {
    if (!this._ok('mechanic', 120)) return; const o = this.sfx, t0 = this.now, s = this.s;
    switch (kind) {
      case 'reflectWarn': for (let i = 0; i < 6; i++) s.tone(o, { t0: t0 + i * 0.07, freq: f(84 + [0, 4, 7, 11, 7, 4][i]), type: 'sine', dur: 0.12, vol: 0.09 }); break;
      case 'reflect': s.tone(o, { t0, freq: 1200, to: 2400, type: 'sine', dur: 0.2, vol: 0.1 }); break;
      case 'shield': s.tone(o, { t0, freq: 600, to: 1200, type: 'sine', dur: 0.5, vol: 0.12, attack: 0.15, release: 0.2 }); s.tone(o, { t0, freq: 900, to: 1800, type: 'triangle', dur: 0.5, vol: 0.06, attack: 0.15 }); break;
      case 'shieldBreak': s.noise(o, { t0, dur: 0.3, vol: 0.24, type: 'highpass', freq: 2500, to: 600 }); for (let i = 0; i < 6; i++) s.click(o, { t0: t0 + rnd(0, 0.25), freq: rnd(3000, 7000), vol: 0.08 }); break;
      case 'enrage': s.tone(o, { t0, freq: 90, to: 60, type: 'sawtooth', dur: 0.6, vol: 0.2, attack: 0.02, release: 0.3 }); s.noise(o, { t0, dur: 0.5, vol: 0.2, type: 'bandpass', freq: 800, q: 0.6, release: 0.3 }); s.snare(o, { t0, vol: 0.3 }); break;
      case 'revive': [60, 64, 67, 72].forEach((m, i) => s.bell(o, { t0: t0 + i * 0.1, freq: f(m + 12), dur: 1.2, vol: 0.12 })); break;
      case 'swap': s.noise(o, { t0, dur: 0.3, vol: 0.14, type: 'bandpass', freq: 500, to: 2500, q: 1 }); break;
      case 'summon': this._sigImpact('poof', t0, 1); break;
      case 'rally': s.taiko(o, { t0, vol: 0.45 }); break;
      case 'stun': for (let i = 0; i < 3; i++) s.tone(o, { t0: t0 + i * 0.09, freq: f(88 + i * 3), type: 'sine', dur: 0.08, vol: 0.09 }); break;
      case 'heal': if (this._ok('heal', THROTTLE.heal)) { s.tone(o, { t0, freq: f(76), to: f(83), type: 'sine', dur: 0.25, vol: 0.09, attack: 0.03 }); s.tone(o, { t0: t0 + 0.08, freq: f(88), type: 'sine', dur: 0.2, vol: 0.06 }); } break;
      case 'immune': s.tone(o, { t0, freq: 2400, type: 'sine', dur: 0.05, vol: 0.08 }); break;
      case 'buff': [67, 71, 74].forEach((m, i) => s.tone(o, { t0: t0 + i * 0.06, freq: f(m + 12), type: 'triangle', dur: 0.1, vol: 0.08 })); break;
      default: break;
    }
    void name;
  }
  ko(kind = 'enemy') {
    if (!this._ok('ko', THROTTLE.ko)) return; const o = this.sfx, t0 = this.now, s = this.s;
    s.tone(o, { t0, freq: 110, to: 40, type: 'sine', dur: 0.18, vol: 0.28, attack: 0.002, release: 0.15 }); s.noise(o, { t0, dur: 0.12, vol: 0.14, type: 'lowpass', freq: 600 });
    if (kind === 'enemy') s.noise(o, { t0: t0 + 0.05, dur: 0.25, vol: 0.12, type: 'lowpass', freq: 1200, to: 300 });
    else if (kind === 'ally') s.bell(o, { t0: t0 + 0.05, freq: f(52), dur: 1.4, vol: 0.14 });
    else if (kind === 'boss') { s.noise(o, { t0, dur: 0.9, vol: 0.28, type: 'lowpass', freq: 1400, to: 100, release: 0.6 }); s.tone(o, { t0, freq: 60, to: 25, type: 'sine', dur: 0.8, vol: 0.34, release: 0.6 }); }
    else if (kind === 'escort') for (let i = 0; i < 3; i++) s.tone(o, { t0: t0 + i * 0.14, freq: 880, type: 'square', dur: 0.1, vol: 0.12 });
  }
  timerTick() { if (this._ok('tick', THROTTLE.tick)) this.s.tone(this.sfx, { t0: this.now, freq: 1200, type: 'square', dur: 0.04, vol: 0.08 }); }
  fight() { if (this._ok('fight', 0)) { this.s.taiko(this.sfx, { t0: this.now, vol: 0.6, size: 1.1 }); this.s.click(this.sfx, { t0: this.now, freq: 1200, vol: 0.18 }); } }

  // ---------------------------------------------------------------- interface
  /** kind: tap | toggleOn | toggleOff | back | tab | open | close | error | ping | paper | coins | rise | riseLong | fanfare | chime | pin | drum | poof | circle | blip */
  ui(kind, { era = this.era } = {}) {
    const key = kind === 'blip' ? 'blip' : 'ui'; if (!this._ok(key, THROTTLE[key])) return;
    const o = this.ui, t0 = this.now, s = this.s;
    switch (kind) {
      case 'tap': s.tick(o, { t0, era, vol: 0.09 }); break;
      case 'toggleOn': s.tick(o, { t0, era, vol: 0.09, pitch: 1.25 }); break;
      case 'toggleOff': s.tick(o, { t0, era, vol: 0.09, pitch: 0.8 }); break;
      case 'back': s.tick(o, { t0, era, vol: 0.08, pitch: 0.7 }); break;
      case 'tab': s.tick(o, { t0, era, vol: 0.09 }); s.noise(o, { t0: t0 + 0.02, dur: 0.08, vol: 0.05, type: era === 'p2' ? 'highpass' : 'bandpass', freq: era === 'p2' ? 5000 : 1800, to: era === 'p2' ? 8000 : 600, q: 1 }); break;
      case 'open': s.noise(o, { t0, dur: 0.12, vol: 0.06, type: 'bandpass', freq: 800, to: 2400, q: 1 }); s.tick(o, { t0: t0 + 0.05, era, vol: 0.07 }); break;
      case 'close': s.noise(o, { t0, dur: 0.1, vol: 0.05, type: 'bandpass', freq: 2000, to: 600, q: 1 }); break;
      case 'error': s.tone(o, { t0, freq: 180, to: 140, type: 'square', dur: 0.09, vol: 0.09 }); s.woodblock(o, { t0, vol: 0.1, freq: 400 }); break;
      case 'ping': s.tone(o, { t0, freq: f(88), type: 'sine', dur: 0.12, vol: 0.07, release: 0.1 }); s.tone(o, { t0: t0 + 0.06, freq: f(95), type: 'sine', dur: 0.14, vol: 0.05, release: 0.12 }); break;
      case 'paper': s.noise(o, { t0, dur: 0.14, vol: 0.07, type: 'bandpass', freq: 1500, to: 900, q: 0.8 }); break;
      case 'coins': for (let i = 0; i < 7; i++) s.tone(o, { t0: t0 + i * 0.05, freq: f(84 + [0, 4, 7, 12, 7, 4, 0][i] + (i % 2)), type: 'triangle', dur: 0.08, vol: 0.07 }); break;
      case 'rise': s.tone(o, { t0, freq: 660, to: 990, type: 'triangle', dur: 0.14, vol: 0.12 }); s.tone(o, { t0: t0 + 0.12, freq: f(88), type: 'sine', dur: 0.1, vol: 0.06 }); break;
      case 'riseLong': [72, 76, 79, 84].forEach((m, i) => s.tone(o, { t0: t0 + i * 0.07, freq: f(m), type: 'triangle', dur: 0.12, vol: 0.1 })); break;
      case 'fanfare': [72, 76, 79, 84, 79, 84].forEach((m, i) => s.flute(o, { t0: t0 + i * 0.12, freq: f(m), dur: i === 5 ? 0.6 : 0.14, vol: 0.14, breath: 0.2, attack: 0.01 })); break;
      case 'chime': s.bell(o, { t0, freq: f(91), dur: 1, vol: 0.1 }); break;
      case 'pin': s.woodblock(o, { t0, vol: 0.12, freq: 700 }); break;
      case 'drum': s.taiko(o, { t0, vol: 0.4 }); break;
      case 'poof': this._sigImpact('poof', t0, 0.8); break;
      case 'circle': [64, 68, 71, 76, 80, 83, 88].forEach((m, i) => s.pluck(o, { t0: t0 + i * 0.09, freq: f(m), dur: 1, vol: 0.14, decay: 0.997 })); break;
      case 'blip': s.tone(o, { t0, freq: era === 'p2' ? 1400 : 900, to: era === 'p2' ? 1700 : 1000, type: era === 'p2' ? 'square' : 'triangle', dur: 0.03, vol: 0.05 }); break;
      case 'pageTurn': s.noise(o, { t0, dur: 0.18, vol: 0.07, type: 'bandpass', freq: 1200, to: 2000, q: 0.7 }); break;
      case 'whoosh': s.noise(o, { t0, dur: 0.2, vol: 0.08, type: 'bandpass', freq: 600, to: 3000, q: 1 }); break;
      default: s.tick(o, { t0, era, vol: 0.08 });
    }
  }
  pullReveal(tier) {
    if (!this._ok('reveal', 0)) return; const o = this.sfx, t0 = this.now, s = this.s;
    const base = 392 * Math.pow(2, ({ genin: 0, chunin: 3, jonin: 7, kage: 12 }[tier] || 0) / 12);
    s.tone(o, { t0, freq: base, type: 'triangle', dur: 0.25, vol: 0.18 }); s.tone(o, { t0: t0 + 0.06, freq: base * 1.5, type: 'sine', dur: 0.3, vol: 0.1 });
    if (tier === 'kage') { s.tone(o, { t0: t0 + 0.14, freq: base * 2, type: 'sine', dur: 0.6, vol: 0.14 }); s.noise(o, { t0: t0 + 0.1, dur: 0.5, vol: 0.12, type: 'lowpass', freq: 5000 }); }
  }
  achievement() { if (!this._ok('achievement', 300)) return; [784, 988, 1175, 1568].forEach((fr, i) => this.s.tone(this.ui, { t0: this.now + i * 0.08, freq: fr, type: 'triangle', dur: 0.16, vol: 0.12 })); }
}

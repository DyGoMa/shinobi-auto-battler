// AudioManager.js — tiny Web Audio synth. No audio files.
// The AudioContext is created/unlocked on the first user tap (browser policy).
const TIER_PITCH = { genin: 0, chunin: 3, jonin: 7, kage: 12 };

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.lastPlay = {};
    this._unlock = this._unlock.bind(this);
    for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, this._unlock, { passive: true });
  }

  _unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.5;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    } catch (e) { console.warn('[audio] unlock failed', e); }
  }

  setMuted(m) {
    this.muted = !!m;
    try { if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.5, this.ctx.currentTime, 0.02); } catch { /* ignore */ }
  }

  get ready() { return !!(this.ctx && this.ctx.state === 'running' && !this.muted); }

  /** Rate-limit so 30 hits in a frame don't clip. */
  _throttle(key, ms) {
    const now = performance.now();
    if (this.lastPlay[key] && now - this.lastPlay[key] < ms) return false;
    this.lastPlay[key] = now; return true;
  }

  _tone({ freq = 440, to = null, type = 'sine', dur = 0.12, vol = 0.3, attack = 0.005, delay = 0 }) {
    if (!this.ready) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + dur + 0.02);
    } catch { /* ignore */ }
  }

  _noise({ dur = 0.12, vol = 0.2, filter = 1200, delay = 0 }) {
    if (!this.ready) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource(); src.buffer = buf;
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter;
      const g = this.ctx.createGain(); g.gain.value = vol;
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t0);
    } catch { /* ignore */ }
  }

  hit() { if (this._throttle('hit', 55)) { this._noise({ dur: 0.06, vol: 0.12, filter: 1800 }); this._tone({ freq: 180, to: 90, type: 'square', dur: 0.06, vol: 0.06 }); } }
  crit() { if (this._throttle('crit', 90)) { this._noise({ dur: 0.1, vol: 0.2, filter: 3000 }); this._tone({ freq: 520, to: 260, type: 'sawtooth', dur: 0.12, vol: 0.12 }); } }
  effective() { if (this._throttle('eff', 110)) { this._tone({ freq: 660, to: 990, type: 'triangle', dur: 0.12, vol: 0.16 }); this._tone({ freq: 990, type: 'sine', dur: 0.1, vol: 0.08, delay: 0.05 }); } }
  resisted() { if (this._throttle('res', 140)) this._tone({ freq: 220, to: 160, type: 'triangle', dur: 0.1, vol: 0.08 }); }
  ultReady() { if (this._throttle('ready', 200)) { this._tone({ freq: 880, type: 'sine', dur: 0.09, vol: 0.12 }); this._tone({ freq: 1320, type: 'sine', dur: 0.12, vol: 0.1, delay: 0.07 }); } }
  ultFire() { this._noise({ dur: 0.35, vol: 0.28, filter: 900 }); this._tone({ freq: 140, to: 520, type: 'sawtooth', dur: 0.3, vol: 0.16 }); this._tone({ freq: 70, to: 40, type: 'sine', dur: 0.4, vol: 0.3 }); }
  clash(outcome) {
    const f = outcome === 'overpower' ? [523, 784, 1047] : outcome === 'standoff' ? [440, 440] : [330, 247];
    f.forEach((fr, i) => this._tone({ freq: fr, type: 'square', dur: 0.14, vol: 0.12, delay: i * 0.07 }));
    this._noise({ dur: 0.25, vol: 0.2, filter: 2400 });
  }
  telegraph() { if (this._throttle('tele', 400)) this._tone({ freq: 300, to: 600, type: 'triangle', dur: 0.4, vol: 0.08 }); }
  pullReveal(tier) {
    const base = 392 * Math.pow(2, (TIER_PITCH[tier] || 0) / 12);
    this._tone({ freq: base, type: 'triangle', dur: 0.25, vol: 0.18 });
    this._tone({ freq: base * 1.5, type: 'sine', dur: 0.3, vol: 0.1, delay: 0.06 });
    if (tier === 'kage') { this._tone({ freq: base * 2, type: 'sine', dur: 0.6, vol: 0.14, delay: 0.14 }); this._noise({ dur: 0.5, vol: 0.12, filter: 5000, delay: 0.1 }); }
  }
  scroll() { this._noise({ dur: 0.5, vol: 0.12, filter: 700 }); }
  victory() { [523, 659, 784, 1047].forEach((f, i) => this._tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.16, delay: i * 0.12 })); }
  defeat() { [392, 330, 262, 196].forEach((f, i) => this._tone({ freq: f, type: 'sine', dur: 0.3, vol: 0.14, delay: i * 0.16 })); }
  click() { if (this._throttle('click', 40)) this._tone({ freq: 700, type: 'sine', dur: 0.04, vol: 0.05 }); }
  levelUp() { this._tone({ freq: 660, to: 990, type: 'triangle', dur: 0.14, vol: 0.12 }); }
  achievement() { [784, 988, 1175, 1568].forEach((f, i) => this._tone({ freq: f, type: 'triangle', dur: 0.16, vol: 0.12, delay: i * 0.08 })); }
}

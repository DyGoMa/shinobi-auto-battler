// Synth.js — the instrument voices and effects of the game's audio, all synthesised with Web
// Audio at play time (docs/AUDIO_PLAN.md §3): no files, no samples. Every voice schedules its
// nodes at an absolute context time `t0` into an output node and returns nothing; the music
// scheduler and the SFX cues call them a little ahead of time. Works against the fake context
// in tools/fake-audio.mjs, so the tests can count what was scheduled.

export const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  minorPent: [0, 3, 5, 7, 10], majorPent: [0, 2, 4, 7, 9],
  in: [0, 1, 5, 7, 8],          // the Japanese "in" scale: D E♭ G A B♭ (shakuhachi lines)
  yo: [0, 2, 5, 7, 9],          // the "yo" scale: bright, no semitones (fue, koto)
};
/** A scale degree (any integer, octaves wrap) to a MIDI note above `root`. */
export function degreeToMidi(root, scale, degree) {
  const s = typeof scale === 'string' ? SCALES[scale] : scale; const n = s.length;
  const oct = Math.floor(degree / n); const idx = ((degree % n) + n) % n;
  return root + oct * 12 + s[idx];
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Synth {
  constructor(ctx) {
    this.ctx = ctx;
    this._noise = null; this._impulses = new Map(); this._shapers = new Map();
  }
  get now() { return this.ctx.currentTime; }

  // ---------------------------------------------------------------- shared buffers and effects
  /** Two seconds of white noise, made once. */
  noiseBuffer() {
    if (this._noise) return this._noise;
    const sr = this.ctx.sampleRate, len = Math.floor(sr * 2);
    const buf = this.ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._noise = buf; return buf;
  }
  /** A reverb impulse: stereo decaying noise, `seconds` long. */
  impulse(seconds = 1.6, decay = 3) {
    const key = `${seconds}|${decay}`; if (this._impulses.has(key)) return this._impulses.get(key);
    const sr = this.ctx.sampleRate, len = Math.max(1, Math.floor(sr * seconds));
    const buf = this.ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    this._impulses.set(key, buf); return buf;
  }
  reverb(seconds = 1.6, decay = 3) { const c = this.ctx.createConvolver(); c.buffer = this.impulse(seconds, decay); return c; }
  /** A soft clipper (tanh) used as the SFX limiter and the guitar's drive. */
  shaper(drive = 1) {
    const key = String(drive); if (this._shapers.has(key)) return this._shapers.get(key);
    const n = 1024, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; curve[i] = Math.tanh(x * drive) / Math.tanh(drive); }
    this._shapers.set(key, curve); return curve;
  }
  limiter(drive = 1.4) { const w = this.ctx.createWaveShaper(); w.curve = this.shaper(drive); w.oversample = '2x'; return w; }
  delay(seconds = 0.3, feedback = 0.3, wet = 0.25) {
    const input = this.ctx.createGain(); const d = this.ctx.createDelay(1.5); d.delayTime.value = clamp(seconds, 0.01, 1.4);
    const fb = this.ctx.createGain(); fb.gain.value = feedback; const w = this.ctx.createGain(); w.gain.value = wet;
    input.connect(d); d.connect(fb); fb.connect(d); d.connect(w);
    return { input, output: w, delay: d };
  }

  // ---------------------------------------------------------------- envelopes
  /** Attack / hold / release on a gain param, from silence to `peak`, ending at t0 + dur. */
  env(param, t0, { attack = 0.005, release = 0.08, peak = 0.3, dur = 0.2, curve = 'exp' } = {}) {
    const a = Math.max(0.001, attack), r = Math.max(0.01, release);
    const tEnd = t0 + Math.max(dur, a + 0.01);
    param.cancelScheduledValues?.(t0);
    param.setValueAtTime(0.0001, t0);
    if (curve === 'lin') param.linearRampToValueAtTime(peak, t0 + a); else param.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a);
    param.setValueAtTime(Math.max(0.0002, peak), Math.max(t0 + a, tEnd - r));
    param.exponentialRampToValueAtTime(0.0001, tEnd + r);
    return tEnd + r;
  }
  _osc(type, freq, t0) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(Math.max(20, freq), t0); return o; }
  _gain(v = 1) { const g = this.ctx.createGain(); g.gain.value = v; return g; }
  _filter(type, freq, q = 1) { const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; }

  // ---------------------------------------------------------------- generic voices (SFX)
  tone(out, { t0 = this.now, freq = 440, to = null, type = 'sine', dur = 0.12, vol = 0.3, attack = 0.005, release = 0.05, detune = 0 } = {}) {
    const o = this._osc(type, freq, t0); if (detune) o.detune.value = detune;
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    const g = this._gain(0); const end = this.env(g.gain, t0, { attack, release, peak: vol, dur });
    o.connect(g); g.connect(out); o.start(t0); o.stop(end + 0.02);
  }
  noise(out, { t0 = this.now, dur = 0.12, vol = 0.2, type = 'lowpass', freq = 1200, to = null, q = 0.8, attack = 0.003, release = 0.04 } = {}) {
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuffer(); src.loop = true;
    const f = this._filter(type, freq, q); if (to) f.frequency.exponentialRampToValueAtTime(Math.max(30, to), t0 + dur);
    const g = this._gain(0); const end = this.env(g.gain, t0, { attack, release, peak: vol, dur });
    src.connect(f); f.connect(g); g.connect(out); src.start(t0); src.stop(end + 0.02);
  }
  /** A short click (UI ticks, debris). */
  click(out, { t0 = this.now, freq = 2400, vol = 0.12, dur = 0.02 } = {}) { this.tone(out, { t0, freq, to: freq * 0.6, type: 'sine', dur, vol, release: 0.02 }); this.noise(out, { t0, dur: dur * 0.8, vol: vol * 0.5, type: 'highpass', freq: 3000 }); }

  // ---------------------------------------------------------------- instruments
  /** Karplus–Strong pluck (shamisen, koto, bass): a noise burst through a feedback comb, rendered to a buffer. */
  pluck(out, { t0 = this.now, freq = 220, dur = 1.2, vol = 0.3, decay = 0.996, bright = 0.5, bend = 0 } = {}) {
    const sr = this.ctx.sampleRate; const len = Math.max(64, Math.floor(sr * Math.min(dur, 3)));
    const N = Math.max(2, Math.round(sr / Math.max(30, freq)));
    const buf = this.ctx.createBuffer(1, len, sr); const d = buf.getChannelData(0);
    for (let i = 0; i < N; i++) d[i] = (Math.random() * 2 - 1) * (i < N * bright ? 1 : 0.35);
    const k = decay;
    for (let i = N; i < len; i++) d[i] = k * (0.5 * d[i - N] + 0.5 * d[i - N + 1 > i ? i - N : i - N + 1]);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    if (bend) { src.playbackRate.setValueAtTime(1 + bend, t0); src.playbackRate.exponentialRampToValueAtTime(1, t0 + 0.06); }
    const g = this._gain(vol); const f = this._filter('lowpass', 2500 + bright * 4000, 0.5);
    src.connect(f); f.connect(g); g.connect(out); src.start(t0); src.stop(t0 + Math.min(dur, 3) + 0.05);
  }
  /** Shakuhachi / fue: breath noise band-passed at the note plus a sine, vibrato, portamento. */
  flute(out, { t0 = this.now, freq = 440, from = null, dur = 0.5, vol = 0.25, breath = 0.5, vibrato = 5, depth = 6, attack = 0.06 } = {}) {
    const g = this._gain(0); const end = this.env(g.gain, t0, { attack, release: 0.12, peak: vol, dur, curve: 'lin' });
    const o = this._osc('sine', from || freq, t0); if (from) o.frequency.exponentialRampToValueAtTime(freq, t0 + 0.08);
    const o2 = this._osc('triangle', (from || freq) * 2, t0); if (from) o2.frequency.exponentialRampToValueAtTime(freq * 2, t0 + 0.08);
    const g2 = this._gain(0.18);
    const lfo = this._osc('sine', vibrato, t0); const lg = this._gain(depth); lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    const n = this.ctx.createBufferSource(); n.buffer = this.noiseBuffer(); n.loop = true;
    const bp = this._filter('bandpass', freq, 12); const ng = this._gain(breath * 0.35);
    o.connect(g); o2.connect(g2); g2.connect(g); n.connect(bp); bp.connect(ng); ng.connect(g); g.connect(out);
    o.start(t0); o2.start(t0); lfo.start(t0); n.start(t0);
    o.stop(end + 0.02); o2.stop(end + 0.02); lfo.stop(end + 0.02); n.stop(end + 0.02);
  }
  /** Taiko: a sine pitch drop plus a low noise burst. size 1 = the big drum. */
  taiko(out, { t0 = this.now, vol = 0.5, size = 1 } = {}) {
    this.tone(out, { t0, freq: 90 / size, to: 40 / size, type: 'sine', dur: 0.12 + 0.1 * size, vol: vol * 0.9, attack: 0.002, release: 0.25 * size });
    this.noise(out, { t0, dur: 0.08, vol: vol * 0.5, type: 'lowpass', freq: 400, release: 0.1 });
  }
  kick(out, { t0 = this.now, vol = 0.5 } = {}) { this.tone(out, { t0, freq: 120, to: 45, type: 'sine', dur: 0.1, vol, attack: 0.001, release: 0.12 }); this.click(out, { t0, freq: 900, vol: vol * 0.25, dur: 0.01 }); }
  snare(out, { t0 = this.now, vol = 0.35 } = {}) { this.noise(out, { t0, dur: 0.1, vol, type: 'bandpass', freq: 1800, q: 0.7, release: 0.12 }); this.tone(out, { t0, freq: 180, to: 120, type: 'triangle', dur: 0.08, vol: vol * 0.6, release: 0.06 }); }
  hat(out, { t0 = this.now, vol = 0.12, open = false } = {}) { this.noise(out, { t0, dur: open ? 0.14 : 0.03, vol, type: 'highpass', freq: 7000, release: open ? 0.12 : 0.03 }); }
  tom(out, { t0 = this.now, vol = 0.35, freq = 140 } = {}) { this.tone(out, { t0, freq, to: freq * 0.55, type: 'sine', dur: 0.16, vol, attack: 0.002, release: 0.12 }); }
  woodblock(out, { t0 = this.now, vol = 0.2, freq = 900 } = {}) { this.tone(out, { t0, freq, to: freq * 0.9, type: 'sine', dur: 0.03, vol, release: 0.03 }); }
  /** Distorted guitar: two detuned saws through a tanh drive and a band-pass (the shared drive chain per out). */
  guitar(out, { t0 = this.now, freq = 110, dur = 0.4, vol = 0.22, drive = 4, chord = null } = {}) {
    const g = this._gain(0); const end = this.env(g.gain, t0, { attack: 0.01, release: 0.1, peak: vol, dur });
    const ws = this.ctx.createWaveShaper(); ws.curve = this.shaper(drive); ws.oversample = '2x';
    const bp = this._filter('bandpass', 1200, 0.6);
    const freqs = chord || [freq]; const pre = this._gain(0.6 / freqs.length);
    for (const f of freqs) for (const det of [-6, 6]) { const o = this._osc('sawtooth', f, t0); o.detune.value = det; o.connect(pre); o.start(t0); o.stop(end + 0.02); }
    pre.connect(ws); ws.connect(bp); bp.connect(g); g.connect(out);
  }
  bass(out, { t0 = this.now, freq = 55, dur = 0.5, vol = 0.35 } = {}) { this.pluck(out, { t0, freq, dur: Math.max(0.3, dur), vol, decay: 0.998, bright: 0.25 }); }
  /** Strings: four detuned saws, a slow attack and a low-pass sweep; `freqs` for a chord. */
  strings(out, { t0 = this.now, freqs = [220], dur = 2, vol = 0.12, attack = 0.4 } = {}) {
    const g = this._gain(0); const end = this.env(g.gain, t0, { attack, release: 0.5, peak: vol, dur, curve: 'lin' });
    const lp = this._filter('lowpass', 900, 0.7); lp.frequency.setValueAtTime(500, t0); lp.frequency.linearRampToValueAtTime(1800, t0 + Math.min(dur, 2));
    const pre = this._gain(0.25 / Math.max(1, freqs.length));
    for (const f of freqs) for (const det of [-8, -3, 3, 8]) { const o = this._osc('sawtooth', f, t0); o.detune.value = det; o.connect(pre); o.start(t0); o.stop(end + 0.02); }
    pre.connect(lp); lp.connect(g); g.connect(out);
  }
  /** Brass: two-operator FM, the index falling over the note. */
  brass(out, { t0 = this.now, freq = 220, dur = 0.4, vol = 0.25 } = {}) {
    const g = this._gain(0); const end = this.env(g.gain, t0, { attack: 0.03, release: 0.12, peak: vol, dur });
    const car = this._osc('sine', freq, t0); const mod = this._osc('sine', freq, t0); const mg = this._gain(freq * 3);
    mg.gain.setValueAtTime(freq * 3, t0); mg.gain.exponentialRampToValueAtTime(freq * 0.5, t0 + Math.max(0.05, dur));
    mod.connect(mg); mg.connect(car.frequency); car.connect(g); g.connect(out);
    car.start(t0); mod.start(t0); car.stop(end + 0.02); mod.stop(end + 0.02);
  }
  /** Choir: saws through two formant band-passes, a slow attack. */
  choir(out, { t0 = this.now, freqs = [220], dur = 2, vol = 0.14, attack = 0.5 } = {}) {
    const g = this._gain(0); const end = this.env(g.gain, t0, { attack, release: 0.6, peak: vol, dur, curve: 'lin' });
    const f1 = this._filter('bandpass', 700, 6), f2 = this._filter('bandpass', 1100, 6); const pre = this._gain(0.3 / Math.max(1, freqs.length));
    for (const f of freqs) for (const det of [-5, 5]) { const o = this._osc('sawtooth', f, t0); o.detune.value = det; o.connect(pre); o.start(t0); o.stop(end + 0.02); }
    pre.connect(f1); pre.connect(f2); f1.connect(g); f2.connect(g); g.connect(out);
  }
  /** Bell: FM with an inharmonic ratio, long decay (stingers, reveals). */
  bell(out, { t0 = this.now, freq = 880, dur = 1.5, vol = 0.2 } = {}) {
    const g = this._gain(0); const end = this.env(g.gain, t0, { attack: 0.003, release: dur * 0.8, peak: vol, dur: dur * 0.2 });
    const car = this._osc('sine', freq, t0); const mod = this._osc('sine', freq * 2.76, t0); const mg = this._gain(freq * 1.2);
    mg.gain.setValueAtTime(freq * 1.2, t0); mg.gain.exponentialRampToValueAtTime(freq * 0.05, t0 + dur);
    mod.connect(mg); mg.connect(car.frequency); car.connect(g); g.connect(out);
    car.start(t0); mod.start(t0); car.stop(end + 0.02); mod.stop(end + 0.02);
  }
  /** A UI tick in the era's flavour: wood and paper (Part I) or metal (Shippuden). */
  tick(out, { t0 = this.now, era = 'p1', vol = 0.1, pitch = 1 } = {}) {
    if (era === 'p2') { this.tone(out, { t0, freq: 2400 * pitch, to: 1900 * pitch, type: 'sine', dur: 0.03, vol, release: 0.04 }); this.click(out, { t0, freq: 5000, vol: vol * 0.4, dur: 0.01 }); }
    else { this.woodblock(out, { t0, freq: 1100 * pitch, vol }); this.noise(out, { t0, dur: 0.03, vol: vol * 0.3, type: 'bandpass', freq: 2500, q: 1 }); }
  }
}

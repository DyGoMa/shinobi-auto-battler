// tools/fake-audio.mjs — a stand-in AudioContext for the audio tests: enough of the Web Audio
// surface for the synth, the scheduler and the manager, recording every source start so the
// tests can check that nothing is ever scheduled in the past.
class Param {
  constructor(v = 1) { this.value = v; this.log = []; }
  setValueAtTime(v, t) { this.log.push(['set', v, t]); this.value = v; return this; }
  linearRampToValueAtTime(v, t) { this.log.push(['lin', v, t]); this.value = v; return this; }
  exponentialRampToValueAtTime(v, t) { this.log.push(['exp', v, t]); this.value = v; return this; }
  setTargetAtTime(v, t, k) { this.log.push(['tgt', v, t, k]); this.value = v; return this; }
  cancelScheduledValues() { return this; }
}
class Node {
  constructor(ctx, kind) { this.ctx = ctx; this.kind = kind; this.connections = []; ctx.nodes.push(this); }
  connect(n) { this.connections.push(n); return n; }
  disconnect() { this.connections = []; }
}
class Source extends Node {
  start(t = 0) { this.ctx.starts.push({ kind: this.kind, t }); if (t < this.ctx.currentTime - 1e-6) this.ctx.late++; }
  stop(t) { this.stopAt = t; }
}
export class FakeAudioContext {
  constructor() { this.currentTime = 0; this.sampleRate = 48000; this.state = 'running'; this.nodes = []; this.starts = []; this.late = 0; this.suspended = 0; this.resumed = 0; this.destination = new Node(this, 'destination'); }
  createGain() { const n = new Node(this, 'gain'); n.gain = new Param(1); return n; }
  createOscillator() { const n = new Source(this, 'osc'); n.type = 'sine'; n.frequency = new Param(440); n.detune = new Param(0); return n; }
  createBufferSource() { const n = new Source(this, 'buffer'); n.buffer = null; n.loop = false; n.playbackRate = new Param(1); return n; }
  createBuffer(channels, length, sampleRate) { const data = Array.from({ length: channels }, () => new Float32Array(length)); return { numberOfChannels: channels, length, sampleRate, getChannelData: (i) => data[i] }; }
  createBiquadFilter() { const n = new Node(this, 'filter'); n.type = 'lowpass'; n.frequency = new Param(350); n.Q = new Param(1); return n; }
  createWaveShaper() { const n = new Node(this, 'shaper'); n.curve = null; n.oversample = 'none'; return n; }
  createConvolver() { const n = new Node(this, 'convolver'); n.buffer = null; return n; }
  createDelay() { const n = new Node(this, 'delay'); n.delayTime = new Param(0); return n; }
  resume() { this.state = 'running'; this.resumed++; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; this.suspended++; return Promise.resolve(); }
}
/** A window stand-in: records the gesture listeners the manager installs and the visibility handler. */
export function fakeWindow() {
  const w = { listeners: {}, vis: null, document: { hidden: false } };
  w.addEventListener = (ev, fn) => { (w.listeners[ev] ||= []).push(fn); };
  w.document.addEventListener = (ev, fn) => { if (ev === 'visibilitychange') w.vis = fn; };
  w.setTimeout = () => 0;
  w.gesture = () => { for (const fn of w.listeners.pointerdown || []) fn(); };
  return w;
}
/** Drive a MusicPlayer built with injected timers for `seconds` of fake time; returns the context. */
export function drive(player, ctx, clock, seconds, step = 0.025) {
  while (clock.t < seconds) { clock.t += step; ctx.currentTime = clock.t; const fn = clock.timers.pop(); clock.timers.length = 0; if (fn) fn(); }
}
export function fakeClock() { const c = { t: 0, timers: [] }; c.now = () => c.t; c.setTimeout = (fn) => { c.timers.push(fn); return c.timers.length; }; c.clearTimeout = () => {}; return c; }

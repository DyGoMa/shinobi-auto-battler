// Music.js — the soundtrack (docs/AUDIO_PLAN.md §4–§5): thirteen 16-bar loops and the stingers,
// all as data played by the scheduler through the synth voices. A loop is built from a phrase
// pool: every two bars each part picks a phrase with a seeded sequence, so a pass is never the
// same twice but always ends on its resolving phrase. Layers are gain nodes the game switches
// (the boss appearing, an enrage, Hard mode). `trackFor()` is the state machine: which loop a
// screen or a battle wants. Everything but the player is pure, for the tests.
import { Scheduler } from './Scheduler.js';
import { midiToFreq, degreeToMidi } from './Synth.js';

// ---------------------------------------------------------------- notation
// Melody and bass phrases: 16 tokens = two bars of eighth notes. A token is a scale degree
// (melody: relative to the track root; bass: relative to the bar's chord), '.' a rest, '-' a hold.
// Percussion: 16 tokens per bar of sixteenths, 'k' kick / low taiko, 'K' an accent, 's' snare /
// high taiko, 'h' hat or tick, 'o' open hat, 't' tom, 'w' woodblock, '.' a rest.
export function parsePhrase(str, { steps = 16 } = {}) {
  const toks = str.trim().split(/\s+/); const notes = [];
  for (let i = 0; i < Math.min(steps, toks.length); i++) {
    const t = toks[i];
    if (t === '.') continue;
    if (t === '-') { if (notes.length) notes[notes.length - 1].len++; continue; }
    notes.push({ step: i, deg: parseInt(t, 10), len: 1 });
  }
  return notes;
}
export function parseDrums(str) {
  const out = []; const toks = str.replace(/\s+/g, '');
  for (let i = 0; i < toks.length; i++) if (toks[i] !== '.') out.push({ step: i, hit: toks[i] });
  return out;
}
/** A small deterministic generator (mulberry32) so a track's phrase order repeats for a seed. */
export function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function hashId(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
/** The phrase index each two-bar slot of a pass uses: seeded by the track and the pass; the last slot is always phrase 0 (the cadence). */
export function phraseSequence(trackId, pass, poolSize, slots = 8) {
  const rnd = seeded(hashId(trackId) ^ Math.imul(pass + 1, 2654435761));
  const seq = [];
  for (let i = 0; i < slots; i++) seq.push(i === slots - 1 ? 0 : (i === 0 ? 0 : Math.floor(rnd() * poolSize)));
  return seq;
}

// ---------------------------------------------------------------- the tracks
// parts: { inst, scale?, pool | drums | chords, layer, vol, oct }  chords: scale degrees per bar (16)
const P = {   // shared percussion patterns
  taikoSlow: 'K...k...K...k.k.', taikoWalk: 'K.h.k.h.K.h.k.hh', taikoDrive: 'K.k.s.k.K.k.s.kk', taikoWar: 'K..k..K.s.k.K.ss',
  rockA: 'k.h.s.h.k.h.s.h.', rockB: 'k.hhs.h.k.k.s.hh', rockDrive: 'khhhshhhkhhhshho', kitFill: 'k.h.s.h.k.tts.tt',
  handEasy: '.h..w..h.h..w...', handWalk: 'w.h.h.w.w.h.h.w.', ticks: 'h.h.h.h.h.h.h.h.',
};
const CH = {   // chord progressions as scale degrees per bar (16 bars)
  minorLoop: [0, 0, 5, 5, 3, 3, 4, 4, 0, 0, 5, 5, 3, 4, 0, 0],
  minorDrive: [0, 0, 0, 0, 5, 5, 6, 6, 0, 0, 0, 0, 3, 3, 4, 4],
  majorEasy: [0, 0, 3, 3, 4, 4, 0, 0, 5, 5, 3, 3, 4, 4, 0, 0],
  ominous: [0, 0, 0, 0, 1, 1, 0, 0, 5, 5, 0, 0, 1, 1, 0, 0],
};
export const TRACKS = {
  title: { tempo: 84, root: 62, scale: 'minor', chords: CH.minorLoop, parts: {
    mel: { inst: 'shakuhachi', scale: 'in', layer: 'base', vol: 0.3, oct: 1, pool: ['0 - 1 - 4 - - - 3 - 1 - 0 - - -', '. . 4 - 3 - 1 0 - - . . 1 - 0 -', '4 - 3 - 1 - - - 0 - -1 - 0 - - -', '0 - - - . . 1 - 4 - - - 3 - 1 -', '. 0 1 - 4 - 3 - 4 - - - . . . .'] },
    koto: { inst: 'koto', layer: 'base', vol: 0.16, oct: 0, pool: ['0 2 4 2 0 2 4 2 0 2 4 7 4 2 0 .', '0 . 4 . 2 . 4 . 0 . 4 . 2 . . .', '0 4 7 4 0 4 7 4 0 4 7 4 2 0 . .'] },
    taiko: { inst: 'taiko', layer: 'base', vol: 0.4, drums: [P.taikoSlow, P.taikoSlow] },
  } },
  village: { tempo: 96, root: 67, scale: 'major', chords: CH.majorEasy, parts: {
    koto: { inst: 'koto', scale: 'majorPent', layer: 'base', vol: 0.2, oct: 1, pool: ['0 2 4 - 2 0 . . 4 - 2 - 0 - . .', '4 - 2 4 5 - 4 2 0 - . . 2 - 0 -', '. 0 2 4 - - 2 . 5 4 2 - 0 - - -', '2 - 0 - 2 4 - - 5 - 4 2 - 0 . .'] },
    fue: { inst: 'fue', scale: 'majorPent', layer: 'base', vol: 0.14, oct: 2, pool: ['. . . . 0 - 2 - . . . . 4 - 2 -', '. . . . . . . . 0 - - - . . . .', '. . 4 - . . 2 - . . 0 - - - . .', '. . . . . . . . . . . . . . . .'] },
    hand: { inst: 'hand', layer: 'base', vol: 0.2, drums: [P.handEasy, P.handEasy] },
  } },
  village2: { tempo: 96, root: 67, scale: 'major', chords: CH.majorEasy, parts: {
    pad: { inst: 'strings', layer: 'base', vol: 0.09, chords: true },
    koto: { inst: 'koto', scale: 'majorPent', layer: 'base', vol: 0.18, oct: 1, pool: ['0 2 4 - 2 0 . . 4 - 2 - 0 - . .', '4 - 2 4 5 - 4 2 0 - . . 2 - 0 -', '. 0 2 4 - - 2 . 5 4 2 - 0 - - -'] },
    bass: { inst: 'bass', layer: 'base', vol: 0.22, oct: -1, pool: ['0 - - - 0 - 4 - 0 - - - 0 - 4 -', '0 - - - . . 0 . 0 - - - 4 - 2 -'] },
    hand: { inst: 'hand', layer: 'base', vol: 0.12, drums: [P.handWalk, P.handWalk] },
  } },
  map1: { tempo: 100, root: 57, scale: 'minor', chords: CH.minorLoop, parts: {
    shamisen: { inst: 'shamisen', scale: 'minorPent', layer: 'base', vol: 0.2, oct: 1, pool: ['0 0 2 0 3 - 2 0 . 0 2 0 -1 - 0 -', '3 - 2 0 3 - 2 0 4 - 3 2 0 - . .', '0 . 0 . 2 3 - - 2 0 -1 - 0 - . .', '. 0 2 3 4 - 3 2 3 - 2 0 - - . .'] },
    shak: { inst: 'shakuhachi', scale: 'in', layer: 'base', vol: 0.22, oct: 1, pool: ['. . . . 4 - - - 3 - 1 - 0 - - -', '. . . . . . . . 1 - 0 - . . . .', '. . 4 - 3 - - - . . . . . . . .', '. . . . . . . . . . . . . . . .'] },
    taiko: { inst: 'taiko', layer: 'base', vol: 0.32, drums: [P.taikoWalk, P.taikoWalk] },
    taiko2: { inst: 'taiko', layer: 'percussion', vol: 0.3, drums: [P.taikoDrive, P.taikoDrive] },
  } },
  map2: { tempo: 100, root: 57, scale: 'minor', chords: CH.minorDrive, parts: {
    pad: { inst: 'strings', layer: 'base', vol: 0.1, chords: true },
    bass: { inst: 'bass', layer: 'base', vol: 0.26, oct: -1, pool: ['0 - 0 - 0 - 2 - 0 - 0 - 0 - -1 -', '0 - - - 0 - 0 - 0 - - - 2 - 4 -'] },
    shamisen: { inst: 'shamisen', scale: 'minorPent', layer: 'base', vol: 0.16, oct: 1, pool: ['0 0 2 0 3 - 2 0 . 0 2 0 -1 - 0 -', '3 - 2 0 3 - 2 0 4 - 3 2 0 - . .', '. . . . . . . . . . . . . . . .'] },
    kit: { inst: 'kit', layer: 'percussion', vol: 0.3, drums: [P.rockA, P.rockB] },
    hats: { inst: 'kit', layer: 'base', vol: 0.12, drums: [P.ticks, P.ticks] },
  } },
  academy: { tempo: 110, root: 60, scale: 'major', chords: CH.majorEasy, parts: {
    fue: { inst: 'fue', scale: 'majorPent', layer: 'base', vol: 0.2, oct: 2, pool: ['0 2 4 2 0 . 2 . 4 - 2 - 0 - . .', '4 4 2 - 0 . 2 . 5 - 4 2 0 - . .', '. 0 . 2 . 4 . 2 5 - 4 - 2 - 0 -', '0 - 4 - 2 - 0 - . 2 . 4 5 - - -'] },
    koto: { inst: 'koto', scale: 'majorPent', layer: 'base', vol: 0.14, oct: 0, pool: ['0 . 2 . 4 . 2 . 0 . 2 . 4 . 2 .', '0 2 4 2 0 2 4 2 0 2 4 2 0 2 4 2'] },
    wood: { inst: 'hand', layer: 'base', vol: 0.2, drums: ['w.h.w.h.w.h.w.hh', 'w.h.w.h.w.hw.h.h'] },
  } },
  battle1: { tempo: 128, root: 64, scale: 'minor', chords: CH.minorDrive, parts: {
    taiko: { inst: 'taiko', layer: 'base', vol: 0.4, drums: [P.taikoDrive, P.taikoWar] },
    shamisen: { inst: 'shamisen', scale: 'minorPent', layer: 'base', vol: 0.2, oct: 1, pool: ['0 0 . 0 2 . 0 . 3 - 2 0 . 0 -1 0', '0 . 0 2 3 . 2 0 . 0 . 2 -1 - 0 .', '3 3 . 2 0 . 2 . 3 - 4 - 3 2 0 .', '0 . 2 . 3 - 2 0 -1 . 0 . 2 - 0 .'] },
    fue: { inst: 'fue', scale: 'minorPent', layer: 'lead', vol: 0.18, oct: 2, pool: ['. . 0 - 2 - 3 - 4 - - - 3 - 2 -', '. . . . 3 - 2 - 0 - - - . . . .', '4 - 3 - 2 - 0 - . . 2 - 3 - - -', '. . . . . . . . 0 - 2 - 3 - - -'] },
    taiko2: { inst: 'taiko', layer: 'taiko', vol: 0.32, drums: ['K.K.K.K.s.s.s.ss', 'K.K.K.K.s.s.K.ss'] },
  } },
  battle1tense: { tempo: 140, root: 64, scale: 'minor', chords: CH.minorDrive, parts: {
    kit: { inst: 'kit', layer: 'base', vol: 0.34, drums: [P.rockA, P.rockDrive] },
    taiko: { inst: 'taiko', layer: 'base', vol: 0.3, drums: [P.taikoDrive, P.taikoDrive] },
    gtr: { inst: 'guitar', scale: 'minorPent', layer: 'guitar', vol: 0.2, oct: 0, pool: ['0 0 . 0 0 . 3 . 0 0 . 0 2 . 3 .', '0 . 0 . 3 - 2 . 0 . 0 . -1 - 0 .', '4 - 3 - 0 . 0 . 4 - 3 - 2 - 0 .'] },
    shamisen: { inst: 'shamisen', scale: 'minorPent', layer: 'base', vol: 0.16, oct: 1, pool: ['0 0 . 0 2 . 0 . 3 - 2 0 . 0 -1 0', '3 3 . 2 0 . 2 . 3 - 4 - 3 2 0 .'] },
  } },
  battle2: { tempo: 132, root: 59, scale: 'minor', chords: CH.minorDrive, parts: {
    bass: { inst: 'bass', layer: 'base', vol: 0.3, oct: -1, pool: ['0 . 0 . 0 . 2 . 0 . 0 . 0 -1 - .', '0 - 0 . 0 - 4 . 0 - 0 . 2 . 4 .'] },
    kit: { inst: 'kit', layer: 'kit', vol: 0.34, drums: [P.rockA, P.rockB] },
    pad: { inst: 'strings', layer: 'base', vol: 0.09, chords: true },
    lead: { inst: 'guitar', scale: 'minorPent', layer: 'lead', vol: 0.16, oct: 1, pool: ['. . 0 - 2 - 3 - 4 - - - 3 - 2 -', '. . . . 3 - 2 - 0 - - - . . . .', '4 - 3 - 2 - 0 - . . 2 - 3 - - -', '. . . . . . . . . . . . . . . .'] },
  } },
  battle2tense: { tempo: 144, root: 59, scale: 'minor', chords: CH.minorDrive, parts: {
    bass: { inst: 'bass', layer: 'base', vol: 0.3, oct: -1, pool: ['0 . 0 . 0 . 2 . 0 . 0 . 0 -1 - .', '0 0 . 0 0 . 3 . 0 0 . 0 2 . 3 .'] },
    kit: { inst: 'kit', layer: 'base', vol: 0.36, drums: [P.rockDrive, P.kitFill] },
    gtr: { inst: 'guitar', scale: 'minorPent', layer: 'guitar', vol: 0.22, oct: 0, pool: ['0 0 . 0 0 . 3 . 0 0 . 0 2 . 3 .', '0 . 0 . 3 - 2 . 0 . 0 . -1 - 0 .', '4 - 3 - 0 . 0 . 4 - 3 - 2 - 0 .', '0 0 0 . 3 3 3 . 2 2 2 . 0 - - .'] },
    brs: { inst: 'brass', scale: 'minor', layer: 'brass', vol: 0.18, oct: 1, pool: ['0 - - - . . . . 0 - - - . . 2 -', '. . . . 4 - - - . . . . 3 - 4 -', '. . . . . . . . . . . . . . . .'] },
  } },
  boss: { tempo: 150, root: 66, scale: 'minor', chords: CH.ominous, parts: {
    kit: { inst: 'kit', layer: 'base', vol: 0.38, drums: [P.rockDrive, P.kitFill] },
    taiko: { inst: 'taiko', layer: 'base', vol: 0.3, drums: [P.taikoWar, P.taikoWar] },
    gtr: { inst: 'guitar', scale: 'minorPent', layer: 'base', vol: 0.22, oct: 0, pool: ['0 0 . 0 0 . -1 . 0 0 . 0 -1 . 0 .', '0 . 0 . 3 - 2 . 0 . 0 . 2 - 0 .', '4 4 . 4 3 . 2 . 0 0 . 0 -1 - 0 .'] },
    brs: { inst: 'brass', scale: 'minor', layer: 'brass', vol: 0.2, oct: 1, pool: ['0 - - - . . . . 1 - 0 - . . . .', '. . 4 - . . 3 - . . 1 - 0 - - -', '. . . . . . . . . . . . . . . .'] },
    cho: { inst: 'choir', layer: 'choir', vol: 0.14, chords: true },
  } },
  rush: { tempo: 120, root: 60, scale: 'minor', chords: CH.ominous, parts: {
    cho: { inst: 'choir', layer: 'base', vol: 0.14, chords: true },
    pad: { inst: 'strings', layer: 'base', vol: 0.08, chords: true, oct: -1 },
    taiko: { inst: 'taiko', layer: 'base', vol: 0.34, drums: ['K.......K...k...', 'K.......K.k.k.k.'] },
    bass: { inst: 'bass', layer: 'base', vol: 0.26, oct: -1, pool: ['0 - - - 0 - -1 - 0 - - - 0 - 1 -', '0 - - - . . 0 . 0 - - - -1 - - -'] },
    kit: { inst: 'kit', layer: 'kit', vol: 0.3, drums: [P.rockA, P.rockA] },
    cho2: { inst: 'choir', layer: 'choir', vol: 0.12, chords: true, oct: 1 },
  } },
  summon: { tempo: 76, root: 64, scale: 'major', chords: CH.majorEasy, parts: {
    koto: { inst: 'koto', scale: 'majorPent', layer: 'base', vol: 0.18, oct: 1, pool: ['0 2 4 7 4 2 0 . 2 4 7 9 7 4 2 .', '0 . 4 . 7 . 4 . 0 . 4 . 7 - - -', '7 - 4 - 2 - 0 - . 2 4 - 7 - - -'] },
    pad: { inst: 'strings', layer: 'base', vol: 0.1, chords: true },
    bell: { inst: 'bell', scale: 'majorPent', layer: 'shimmer', vol: 0.12, oct: 2, pool: ['0 . . . 4 . . . 7 . . . 4 . . .', '. . 2 . . . 7 . . . 4 . . . 9 .'] },
  } },
};
export const TRACK_IDS = Object.keys(TRACKS);

// ---------------------------------------------------------------- the state machine
/** Which loop a screen wants. part: the story part on show (1 or 2); hard adds the drum layer. */
export function trackFor({ screen, part = 1, hard = false, arcPart = null, bossPart = null } = {}) {
  switch (screen) {
    case 'start': case 'intro': return { id: 'title', layers: [] };
    case 'story': return { id: part === 2 ? 'map2' : 'map1', layers: hard ? ['percussion'] : [] };
    case 'summon': return { id: 'summon', layers: [] };
    case 'tutorial': return { id: 'academy', layers: [] };
    case 'rush': return { id: 'rush', layers: [] };
    case 'daily': return { id: (bossPart || part) === 2 ? 'map2' : 'map1', layers: ['percussion'] };
    default: return { id: (arcPart || part) === 2 ? 'village2' : 'village', layers: [] };
  }
}
/** Which loop a battle starts with. kind: 'story' | 'lesson' | 'rush' | 'daily'; boss: a boss in the fight. */
export function battleTrack({ kind = 'story', part = 1, boss = false, hard = false } = {}) {
  if (kind === 'lesson') return { id: 'academy', layers: [] };
  if (kind === 'rush') return { id: 'rush', layers: ['kit'] };
  if (hard && boss) return { id: 'boss', layers: ['brass'] };
  if (part === 2) return boss ? { id: 'battle2tense', layers: ['guitar', 'brass'] } : { id: 'battle2', layers: ['kit', 'lead'] };
  return boss ? { id: 'battle1tense', layers: ['guitar'] } : { id: 'battle1', layers: ['taiko', 'lead'] };
}

// ---------------------------------------------------------------- the player
const STEPS_PER_BEAT = 2;   // melody and bass in eighths
export class MusicPlayer {
  /** synth: a Synth; out: the music bus (a GainNode); clock/timers for the scheduler. */
  constructor(synth, out, { now = null, setTimeout: st, clearTimeout: ct } = {}) {
    this.synth = synth; this.ctx = synth.ctx; this.out = out;
    this.sched = new Scheduler({ now: now || (() => this.ctx.currentTime), setTimeout: st, clearTimeout: ct });
    this.current = null;   // { id, track, bus, layers: Map<name, GainNode>, pass, seq, notes: Map<part, notes>, wanted: Set }
    this.fading = [];
    this.reverb = null; this.delay = null; this.scheduled = 0;
    this._wire();
  }
  _wire() {
    try {
      this.reverb = this.synth.reverb(1.8, 3); const rg = this.synth._gain(0.22); this.reverb.connect(rg); rg.connect(this.out);
      this.delay = this.synth.delay(0.3, 0.28, 0.2); this.delay.output.connect(this.out);
    } catch { this.reverb = null; this.delay = null; }
  }
  get playing() { return this.current?.id || null; }
  /** Play a loop (crossfading from the current one). layers: names switched on besides 'base'. */
  play(id, { layers = [], fade = 0.6 } = {}) {
    const track = TRACKS[id]; if (!track) return false;
    if (this.current && this.current.id === id) { for (const name of this.current.layers.keys()) this.setLayer(name, name === 'base' || layers.includes(name)); return true; }
    this.stop(fade);
    const bus = this.synth._gain(0); bus.connect(this.out);
    if (this.reverb) { const send = this.synth._gain(0.5); bus.connect(send); send.connect(this.reverb); }
    if (this.delay) { this.delay.delay.delayTime.value = Math.min(1.4, 60 / track.tempo); }
    const t = this.ctx.currentTime;
    bus.gain.setValueAtTime(0.0001, t); bus.gain.exponentialRampToValueAtTime(1, t + fade);
    const layerNodes = new Map();
    for (const part of Object.values(track.parts)) {
      if (layerNodes.has(part.layer)) continue;
      const g = this.synth._gain(part.layer === 'base' || layers.includes(part.layer) ? 1 : 0.0001); g.connect(bus); layerNodes.set(part.layer, g);
    }
    this.current = { id, track, bus, layers: layerNodes, pass: 0, seq: null, notes: new Map(), ducked: false };
    this._prepare(0);
    this.sched.start(track.tempo, (beat, time, spb) => this._beat(beat, time, spb));
    return true;
  }
  /** Stop the current loop, fading it out over `fade` seconds. */
  stop(fade = 0.6) {
    if (!this.current) return;
    const c = this.current; this.current = null; this.sched.stop();
    const t = this.ctx.currentTime;
    try { c.bus.gain.cancelScheduledValues?.(t); c.bus.gain.setValueAtTime(Math.max(0.0001, c.bus.gain.value), t); c.bus.gain.exponentialRampToValueAtTime(0.0001, t + fade); } catch { /* fake ctx */ }
    this.fading.push(c);
    const st = this.sched._st; st(() => { try { c.bus.disconnect(); } catch { /* ignore */ } this.fading = this.fading.filter(x => x !== c); }, (fade + 0.3) * 1000);
  }
  setLayer(name, on, ramp = 0.4) {
    const g = this.current?.layers.get(name); if (!g) return;
    const t = this.ctx.currentTime;
    try { g.gain.cancelScheduledValues?.(t); g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t); g.gain.exponentialRampToValueAtTime(on ? 1 : 0.0001, t + ramp); } catch { /* fake */ }
  }
  /** Pick the phrases of a pass (two-bar slots) with the seeded sequence. */
  _prepare(pass) {
    const c = this.current; const parts = Object.entries(c.track.parts);
    c.pass = pass; c.seq = new Map();
    for (const [name, part] of parts) {
      const size = (part.pool || part.drums || [1]).length;
      c.seq.set(name, phraseSequence(`${c.id}:${name}`, pass, size));
    }
  }
  _beat(beat, time, spb) {
    const c = this.current; if (!c) return;
    const track = c.track; const bar = Math.floor(beat / 4) % 16; const beatInBar = beat % 4; const slot = Math.floor(bar / 2); const barInSlot = bar % 2;
    if (beat > 0 && bar === 0 && beatInBar === 0 && beat % 64 === 0) this._prepare(c.pass + 1);
    const chordDeg = track.chords[bar];
    const stepLen = spb / STEPS_PER_BEAT;
    for (const [name, part] of Object.entries(track.parts)) {
      const out = c.layers.get(part.layer);
      const idx = c.seq.get(name)[slot];
      if (part.drums) {
        const pat = parseDrums(part.drums[Math.min(barInSlot, part.drums.length - 1)] || part.drums[0]);
        for (const h of pat) { const b = Math.floor(h.step / 4); if (b !== beatInBar) continue; const t = time + (h.step % 4) * (spb / 4); this._drum(part, out, h.hit, t); }
        continue;
      }
      if (part.chords) {
        if (beatInBar !== 0) continue;
        const degs = [chordDeg, chordDeg + 2, chordDeg + 4]; const oct = part.oct || 0;
        const freqs = degs.map(d => midiToFreq(degreeToMidi(track.root + oct * 12, track.scale, d)));
        this._inst(part, out, { t0: time, freqs, freq: freqs[0], dur: spb * 4 * 0.98 });
        continue;
      }
      const notes = this._notesOf(part, idx);
      for (const n of notes) {
        const stepInBar = n.step - barInSlot * 8; if (stepInBar < 0 || stepInBar >= 8) continue;
        const b = Math.floor(stepInBar / STEPS_PER_BEAT); if (b !== beatInBar) continue;
        const t = time + (stepInBar % STEPS_PER_BEAT) * stepLen;
        const scale = part.scale || track.scale; const oct = part.oct || 0;
        const deg = part.inst === 'bass' ? degreeToMidi(track.root + oct * 12, track.scale, chordDeg + n.deg) : degreeToMidi(track.root + oct * 12, scale, n.deg);
        this._inst(part, out, { t0: t, freq: midiToFreq(deg), dur: n.len * stepLen * 0.95 });
      }
    }
    this.scheduled++;
  }
  _notesOf(part, idx) { if (!part._parsed) part._parsed = part.pool.map(p => parsePhrase(p)); return part._parsed[Math.min(idx, part._parsed.length - 1)] || []; }
  _drum(part, out, hit, t0) {
    const s = this.synth; const v = part.vol || 0.3;
    if (part.inst === 'taiko') { if (hit === 'K') s.taiko(out, { t0, vol: v, size: 1 }); else if (hit === 'k') s.taiko(out, { t0, vol: v * 0.7, size: 1 }); else if (hit === 's') s.taiko(out, { t0, vol: v * 0.6, size: 0.55 }); else if (hit === 'h') s.click(out, { t0, freq: 1800, vol: v * 0.25 }); return; }
    if (part.inst === 'kit') { if (hit === 'k' || hit === 'K') s.kick(out, { t0, vol: v * (hit === 'K' ? 1.1 : 0.9) }); else if (hit === 's') s.snare(out, { t0, vol: v * 0.8 }); else if (hit === 'h') s.hat(out, { t0, vol: v * 0.35 }); else if (hit === 'o') s.hat(out, { t0, vol: v * 0.4, open: true }); else if (hit === 't') s.tom(out, { t0, vol: v * 0.8 }); return; }
    if (hit === 'w') s.woodblock(out, { t0, vol: v }); else s.click(out, { t0, freq: 2600, vol: v * 0.4 });
  }
  _inst(part, out, { t0, freq, freqs, dur }) {
    const s = this.synth; const v = part.vol || 0.2;
    switch (part.inst) {
      case 'shakuhachi': s.flute(out, { t0, freq, dur, vol: v, breath: 0.7, vibrato: 4.5, depth: 5, attack: 0.08 }); break;
      case 'fue': s.flute(out, { t0, freq, dur, vol: v, breath: 0.25, vibrato: 6, depth: 3, attack: 0.02 }); break;
      case 'shamisen': s.pluck(out, { t0, freq, dur: Math.max(0.25, dur), vol: v, decay: 0.994, bright: 0.8, bend: 0.03 }); break;
      case 'koto': s.pluck(out, { t0, freq, dur: Math.max(0.6, dur * 1.5), vol: v, decay: 0.997, bright: 0.5 }); break;
      case 'bass': s.bass(out, { t0, freq, dur, vol: v }); break;
      case 'guitar': s.guitar(out, { t0, freq, dur, vol: v, chord: freqs && freqs.length > 1 ? freqs : [freq, freq * 1.5] }); if (this.delay) { /* the guitar's delay send is the bus reverb */ } break;
      case 'strings': s.strings(out, { t0, freqs: freqs || [freq], dur, vol: v }); break;
      case 'brass': s.brass(out, { t0, freq, dur, vol: v }); break;
      case 'choir': s.choir(out, { t0, freqs: freqs || [freq], dur, vol: v }); break;
      case 'bell': s.bell(out, { t0, freq, dur: Math.max(0.8, dur), vol: v }); break;
      default: s.tone(out, { t0, freq, dur, vol: v, type: 'triangle' });
    }
  }
}

// ---------------------------------------------------------------- stingers (no loop)
/** Play a stinger on `out` at time t0. Returns its length in seconds. */
export function playStinger(synth, out, id, t0 = synth.now) {
  const s = synth; const f = (m) => midiToFreq(m);
  switch (id) {
    case 'intro': { for (let i = 0; i < 8; i++) s.taiko(out, { t0: t0 + i * 0.09, vol: 0.25 + i * 0.05, size: 1 }); s.taiko(out, { t0: t0 + 0.8, vol: 0.7 }); s.flute(out, { t0: t0 + 0.9, freq: f(74), from: f(69), dur: 1.6, vol: 0.3, breath: 0.7, attack: 0.1 }); s.flute(out, { t0: t0 + 2.4, freq: f(70), dur: 1.2, vol: 0.25, breath: 0.7 }); return 4; }
    case 'victory': { [64, 67, 71, 76].forEach((m, i) => s.pluck(out, { t0: t0 + i * 0.12, freq: f(m), dur: 1.4, vol: 0.28, decay: 0.997 })); s.bell(out, { t0: t0 + 0.5, freq: f(88), dur: 2, vol: 0.16 }); s.bell(out, { t0: t0 + 0.9, freq: f(83), dur: 2.2, vol: 0.12 }); return 3; }
    case 'defeat': { s.flute(out, { t0, freq: f(67), from: f(70), dur: 0.7, vol: 0.28, breath: 0.8 }); s.flute(out, { t0: t0 + 0.8, freq: f(62), from: f(65), dur: 0.9, vol: 0.26, breath: 0.8 }); s.flute(out, { t0: t0 + 1.8, freq: f(57), from: f(60), dur: 1.2, vol: 0.24, breath: 0.9 }); s.taiko(out, { t0: t0 + 2.6, vol: 0.5, size: 1.3 }); return 3; }
    case 'retreat': { s.flute(out, { t0, freq: f(62), from: f(65), dur: 0.8, vol: 0.18, breath: 0.8 }); s.taiko(out, { t0: t0 + 0.9, vol: 0.3, size: 1.2 }); return 1.5; }
    case 'kage': { s.choir(out, { t0, freqs: [f(52), f(59), f(64), f(67)], dur: 2.2, vol: 0.2, attack: 0.3 }); s.bell(out, { t0: t0 + 0.3, freq: f(88), dur: 2.2, vol: 0.2 }); s.bell(out, { t0: t0 + 0.6, freq: f(95), dur: 2, vol: 0.14 }); return 2.5; }
    case 'arcClear': { [72, 76, 79, 84, 79, 84].forEach((m, i) => s.flute(out, { t0: t0 + i * 0.16, freq: f(m), dur: i === 5 ? 1.2 : 0.18, vol: 0.24, breath: 0.25, attack: 0.02 })); s.taiko(out, { t0: t0 + 0.96, vol: 0.5 }); return 3; }
    case 'bossIntro': { s.taiko(out, { t0, vol: 0.7, size: 1.2 }); s.brass(out, { t0: t0 + 0.15, freq: f(45), dur: 0.7, vol: 0.28 }); s.brass(out, { t0: t0 + 0.15, freq: f(52), dur: 0.7, vol: 0.2 }); s.noise(out, { t0, dur: 0.6, vol: 0.12, type: 'lowpass', freq: 300 }); return 1.5; }
    case 'roundClear': { s.bell(out, { t0, freq: f(84), dur: 1.4, vol: 0.16 }); s.bell(out, { t0: t0 + 0.18, freq: f(91), dur: 1.4, vol: 0.12 }); return 1.5; }
    case 'fight': { s.taiko(out, { t0, vol: 0.65, size: 1.1 }); s.click(out, { t0, freq: 1200, vol: 0.2 }); return 0.5; }
    default: return 0;
  }
}

// Effects.js — the battle's visual language (docs/ART_BIBLE.md §9): a particle preset per
// nature, the signature techniques keyed by name, floating numbers, the wind-up plate and the
// target zones, flashes and screen shake, all driven by BattleSim events. Purely cosmetic:
// nothing here changes the sim. Positions are logical canvas units; the Renderer supplies a
// unit's hand, chest and head (js/render/Renderer.js).
import { W, H, GROUND_Y, rgba } from './Stage.js';

export const FONT_DISPLAY = '"Anton", Impact, "Arial Narrow Bold", sans-serif';
export const NATURE = {
  Fire:      { color: '#ff5a36', light: '#ffd166', core: '#fff3b0', dark: '#b3261e' },
  Wind:      { color: '#5fd38a', light: '#c7ffd8', core: '#ffffff', dark: '#1f8a4c' },
  Lightning: { color: '#ffd43b', light: '#fff5b8', core: '#ffffff', dark: '#b8860b' },
  Earth:     { color: '#c08a52', light: '#e8c39a', core: '#f5e6d0', dark: '#6b4423' },
  Water:     { color: '#3fa9f5', light: '#9ed8ff', core: '#ffffff', dark: '#1a5fa3' },
  None:      { color: '#d7dde5', light: '#ffffff', core: '#ffffff', dark: '#7a8590' },
};
const N_OF = (n) => NATURE[n] || NATURE.None;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
// Effect detail (Settings → Effect detail; save v4 settings.vfx). Low draws rings, stars, numbers
// and the plates only; Medium is the art bible's counts; High doubles them.
const LEVELS = {
  low: { k: 0, max: 60, particles: false, flashes: false, casts: false, weather: false },
  medium: { k: 1, max: 280, particles: true, flashes: true, casts: true, weather: true },
  high: { k: 2, max: 560, particles: true, flashes: true, casts: true, weather: true },
};
export function levelSpec(level) { return LEVELS[level] || LEVELS.medium; }

// ---------------------------------------------------------------- the signature techniques
// Matched by name against a unit's Ultimate, an enemy's jutsu or a boss special. Each entry may
// give: cast(fx, pos, dur) → an item drawn at the hand while the wind-up lasts; delay → seconds
// between the cast and the hit (the dash or the throw); impact(fx, x, y, power) at the target;
// travel(fx, from, to) → a projectile from the caster to a target, returning its flight time.
const SIG = [
  { re: /rasen.?shuriken/i, delay: 0.42, cast: (fx, p) => fx.rasengan(p, { r: 18, color: '#9ed8ff', blades: true }), travel: (fx, a, b) => fx.throwHalo(a, b, 0.32), impact: (fx, x, y, pw) => { fx.windDome(x, y, pw); fx.rasenganImpact(x, y, pw * 0.8); } },
  { re: /rasengan/i, delay: 0.32, cast: (fx, p) => fx.rasengan(p), impact: (fx, x, y, pw) => fx.rasenganImpact(x, y, pw), dash: true },
  { re: /chidori stream/i, delay: 0.1, cast: (fx, p) => fx.lightningHand(p, { size: 26 }), land: (fx, x, y) => fx.chidoriStream(x, y, 0.7) },
  { re: /chidori|lightning blade|thunder spirit|lightning fangs|false darkness|lightning ball|lightning armour|liger bomb|lariat/i, delay: 0.28, cast: (fx, p) => fx.lightningHand(p), impact: (fx, x, y, pw) => { fx.burst('Lightning', x, y, pw * 1.3); fx.flash('#ffffff', 0.4, 0.1); }, dash: true },
  { re: /water dragon/i, delay: 0.5, travel: (fx, a, b) => fx.waterDragon(a.x, a.y, b.x, b.y, 0.5) },
  { re: /shark|water prison|great water arm|hungry|water style|sticky water|black rain|exploding water/i, delay: 0.3, travel: (fx, a, b) => fx.waterOrb(a, b, 0.3), impact: (fx, x, y, pw) => fx.burst('Water', x, y, pw * 1.2) },
  { re: /amaterasu|inferno style|flame control/i, delay: 0.2, impact: (fx, x, y, pw) => fx.blackFlames(x, y, pw) },
  { re: /fireball|fire style|phoenix flower|burning ash|searing migraine|majestic destroyer|exploding flame|lava style|quicklime/i, delay: 0.3, travel: (fx, a, b) => fx.fireball(a, b, 0.3), impact: (fx, x, y, pw) => fx.burst('Fire', x, y, pw * 1.3) },
  { re: /sand|shukaku|iron sand/i, delay: 0.3, cast: (fx, p, dur) => fx.sandGather(p, dur), impact: (fx, x, y, pw) => { fx.burst('Earth', x, y, pw); fx.sandDome(x, y, pw); } },
  { re: /eight trigrams|gentle fist|sixty-four/i, delay: 0.25, cast: (fx, p, dur) => fx.trigramCircle(p, dur), impact: (fx, x, y, pw) => { fx.burst('None', x, y, pw); fx.bluePalms(x, y); }, dash: true },
  { re: /shadow possession|shadow sewing|shadow strangle/i, delay: 0.35, travel: (fx, a, b) => fx.shadowSnake(a, b, 0.35), impact: (fx, x, y) => fx.burst('None', x, y, 0.6) },
  { re: /lotus|night guy|dynamic entry|leaf fan|heaven kick|fang over fang|multiple fists|human boulder|crescent moon|iaido|silent killing|flying swallow|beast wave|hiramekarei|resonating|drill/i, delay: 0.22, dash: true, impact: (fx, x, y, pw) => fx.burst('None', x, y, pw * 1.4) },
  { re: /snake|kusanagi|coiling/i, delay: 0.3, travel: (fx, a, b) => fx.snakes(a, b, 0.3), impact: (fx, x, y, pw) => fx.burst('None', x, y, pw) },
  { re: /reaper death seal/i, delay: 0.5, cast: (fx, p, dur) => fx.reaper(p, dur), impact: (fx, x, y, pw) => { fx.burst('None', x, y, pw); fx.flash('#c8b6ff', 0.4, 0.2); } },
  { re: /summoning|super beast|ink creation/i, delay: 0.4, impact: (fx, x, y, pw) => { fx.smoke(x, y, 12 + pw * 6, '#e6dccb'); fx.burst('None', x, y, pw); } },
  { re: /mitotic|healing|heal bite|hundred healings/i, delay: 0, aura: '#5fd38a' },
  { re: /\bc[0-9]\b|karura|clay|exploding|detonat/i, delay: 0.35, travel: (fx, a, b) => fx.clayBird(a, b, 0.35), impact: (fx, x, y, pw) => { fx.flash('#ffffff', 0.55, 0.12); fx.burst('Fire', x, y, pw * 1.5); fx.shockwave(x, y, pw); } },
  { re: /puppet|chikamatsu/i, delay: 0.3, cast: (fx, p, dur) => fx.strings(p, dur), impact: (fx, x, y, pw) => fx.burst('None', x, y, pw) },
  { re: /almighty push|universal pull|planetary|tengai|chibaku|earthquake|world order/i, delay: 0.15, impact: (fx, x, y, pw) => { fx.shockwave(x, y, pw * 1.4); fx.rubble(x, y, pw); } },
  { re: /paper/i, delay: 0.3, travel: (fx, a, b) => fx.paperSheets(a, b, 0.3), impact: (fx, x, y, pw) => fx.burst('None', x, y, pw) },
  { re: /tailed beast bomb|truth-seeking|expansive/i, delay: 0.45, cast: (fx, p, dur) => fx.darkSphere(p, dur), travel: (fx, a, b) => fx.darkShot(a, b, 0.28), impact: (fx, x, y, pw) => { fx.flash('#d8b4ff', 0.6, 0.2); fx.shockwave(x, y, pw * 1.5, '#b07cff'); fx.burst('None', x, y, pw * 1.5); } },
  { re: /flying raijin/i, delay: 0.12, cast: (fx, p) => fx.flash('#fff3a8', 0.5, 0.15), impact: (fx, x, y, pw) => { fx.flash('#fff3a8', 0.5, 0.1); fx.burst('Lightning', x, y, pw); }, dash: true },
  { re: /wood style|tree bind|deep forest|four pillar/i, delay: 0.35, impact: (fx, x, y, pw) => fx.growth(x, y, pw) },
  { re: /particle style|atomic/i, delay: 0.3, travel: (fx, a, b) => fx.cubeBeam(a, b, 0.3), impact: (fx, x, y, pw) => { fx.flash('#ffffff', 0.5, 0.15); fx.burst('None', x, y, pw * 1.4); } },
  { re: /kamui/i, delay: 0.3, impact: (fx, x, y, pw) => fx.warp(x, y, pw) },
  { re: /susanoo/i, delay: 0.2, aura: '#7c4dff', impact: (fx, x, y, pw) => fx.burst('Fire', x, y, pw) },
  { re: /crystal|ice mirror|amber/i, delay: 0.3, impact: (fx, x, y, pw) => fx.crystals(x, y, pw) },
  { re: /tsukuyomi|genjutsu|illusion|mirage|chains of fantasia|word bind|mind transfer|demon flute/i, delay: 0.25, impact: (fx, x, y, pw) => fx.eyeRipple(x, y, pw) },
  { re: /curse jutsu|curse mark/i, delay: 0.25, impact: (fx, x, y, pw) => fx.cursePattern(x, y, pw) },
  { re: /bones|clematis|bracken|ten-finger|camellia|larch/i, delay: 0.25, impact: (fx, x, y, pw) => fx.boneSpikes(x, y, pw) },
  { re: /insect|parasitic/i, delay: 0.35, travel: (fx, a, b) => fx.swarm(a, b, 0.35), impact: (fx, x, y, pw) => fx.burst('None', x, y, pw * 0.8) },
  { re: /poison fog|ash|black tornado/i, delay: 0.3, impact: (fx, x, y, pw) => fx.smoke(x, y, 10 + pw * 6, '#7a4d9a', 0.5) },
  { re: /scalpel/i, delay: 0.2, cast: (fx, p) => fx.lightningHand(p, { color: '#8fd3ff', size: 14 }), dash: true, impact: (fx, x, y, pw) => fx.burst('None', x, y, pw) },
  { re: /senbon|shuriken|kunai|windmill|showers/i, delay: 0.24, travel: (fx, a, b) => fx.volley(a, b, 0.24), impact: (fx, x, y, pw) => fx.burst('None', x, y, pw * 0.8) },
  { re: /laser circus|gale style|white extreme/i, delay: 0.25, travel: (fx, a, b) => fx.lightBeams(a, b, 0.25), impact: (fx, x, y, pw) => fx.burst('Lightning', x, y, pw) },
  { re: /wind scythe|great breakthrough|pressure damage|air bullet|vacuum|eighty gods|supersonic/i, delay: 0.28, travel: (fx, a, b) => fx.windSlash(a, b, 0.28), impact: (fx, x, y, pw) => fx.burst('Wind', x, y, pw * 1.3) },
  { re: /headhunter|underground|hidden in stones|earth dome|iron skin|earth style/i, delay: 0.3, impact: (fx, x, y, pw) => { fx.burst('Earth', x, y, pw * 1.2); fx.rubble(x, y, pw * 0.7); } },
  { re: /scythe|ritual|hidan/i, delay: 0.25, dash: true, impact: (fx, x, y, pw) => { fx.burst('None', x, y, pw); fx.ritualCircle(x, y); } },
  { re: /threads|hearts|masks|kakuzu/i, delay: 0.3, travel: (fx, a, b) => fx.threads(a, b, 0.3), impact: (fx, x, y, pw) => fx.burst('None', x, y, pw) },
  { re: /substitution/i, delay: 0.1, impact: (fx, x, y) => fx.smoke(x, y, 8, '#e6dccb') },
];
export function signatureFor(name) { if (!name) return null; return SIG.find(s => s.re.test(name)) || null; }
export const SIGNATURE_COUNT = SIG.length;

export class Effects {
  /** renderer: js/render/Renderer.js (unit positions). level: 'low' | 'medium' | 'high'. reduced: prefers-reduced-motion. */
  constructor(renderer, { level = 'medium', reduced = false } = {}) {
    this.r = renderer;
    this.spec = levelSpec(level); this.level = level; this.reduced = !!reduced;
    this.parts = []; this.items = []; this.timers = [];
    this.shakeT = 0; this.shakeMag = 0; this.time = 0;
    this.announce = null;
    this.lastTag = new Map();     // throttle EFFECTIVE!/resisted tags per unit
    this.casts = new Map();       // caster uid → the cast items to end at telegraphEnd
    this.auras = new Map();       // uid → { color, until }
    this._ultCtx = null;          // the Ultimate being resolved in this batch of events
    this._attackDelay = null;     // a ranged auto-attack's flight time, for its damage number
  }

  // ---------------------------------------------------------------- primitives
  emit(p) { if (!this.spec.particles || this.parts.length >= this.spec.max) return; this.parts.push({ age: 0, life: 0.5, size: 6, shape: 'circle', color: '#fff', vx: 0, vy: 0, grav: 0, drag: 0, rot: null, vrot: 0, add: false, alpha: 1, fade: 'linear', grow: 0, delay: 0, ...p }); }
  add(item) { if (item.t == null) item.t = 0; this.items.push(item); return item; }
  later(delay, fn) { if (delay <= 0) { fn(); return; } this.timers.push({ t: delay, fn }); }
  shake(mag = 8, dur = 0.3) { if (this.reduced) return; this.shakeMag = Math.max(this.shakeMag, mag); this.shakeT = Math.max(this.shakeT, dur); }
  shakeOffset() { if (this.shakeT <= 0) return { x: 0, y: 0 }; const m = this.shakeMag * Math.min(1, this.shakeT / 0.3); return { x: (Math.random() * 2 - 1) * m, y: (Math.random() * 2 - 1) * m * 0.6 }; }
  /** A count scaled by the detail level (0 on Low). */
  n(k) { return Math.round(k * this.spec.k); }

  ring(x, y, color, { r0 = 8, r1 = 120, dur = 0.5, width = 6, ellipse = 1, delay = 0 } = {}) {
    return this.add({ kind: 'ring', x, y, color, r0, r1, dur, width, ellipse, t: -delay, update(dt) { this.t += dt; this.done = this.t >= this.dur; }, draw(g) { if (this.t < 0) return; const p = this.t / this.dur; g.globalAlpha = 1 - p; g.strokeStyle = this.color; g.lineWidth = this.width * (1 - p * 0.6); const rr2 = this.r0 + (this.r1 - this.r0) * Math.sqrt(p); g.beginPath(); g.ellipse(this.x, this.y, rr2, rr2 * this.ellipse, 0, 0, TAU); g.stroke(); g.globalAlpha = 1; } });
  }
  /** A full-screen flash; reduced motion and Low turn it into a short, dim fade. */
  flash(color = '#ffffff', a = 0.8, dur = 0.12) {
    const A = this.spec.flashes && !this.reduced ? a : Math.min(a, 0.25), D = this.spec.flashes && !this.reduced ? dur : 0.04;
    return this.add({ kind: 'flash', t: 0, dur: D, update(dt) { this.t += dt; this.done = this.t >= D; }, draw(g) { g.globalAlpha = A * (1 - this.t / D); g.fillStyle = color; g.fillRect(-300, -300, W + 600, H + 600); g.globalAlpha = 1; } });
  }
  /** A floating number or word: Anton, a dark stroke, rising and fading; `tag` sits above it. */
  number(x, y, text, { color = '#ffffff', size = 26, dur = 1.0, tag = null, tagColor = null, delay = 0 } = {}) {
    const us = this.r ? 1 + (this.r.unitScale - 1) * 0.5 : 1;
    return this.add({ kind: 'num', x, y, text, color, size: size * Math.min(1.8, us), dur, tag, tagColor, t: -delay, update(dt) { this.t += dt; this.done = this.t >= dur; }, draw(g) {
      if (this.t < 0) return;
      const p = this.t / this.dur; const sc = p < 0.12 ? 0.5 + (p / 0.12) * 0.6 : 1.1 - Math.min(0.1, (p - 0.12) * 0.4);
      const yy = this.y - 70 * p * (1.4 - p);
      g.globalAlpha = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
      g.font = `${Math.round(this.size * sc)}px ${FONT_DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 6; g.lineJoin = 'round'; g.strokeStyle = 'rgba(10,8,6,0.85)'; g.strokeText(this.text, this.x, yy); g.fillStyle = this.color; g.fillText(this.text, this.x, yy);
      if (this.tag) { g.font = `${Math.round(this.size * 0.55)}px ${FONT_DISPLAY}`; g.lineWidth = 4; g.strokeText(this.tag, this.x, yy - this.size * 0.75); g.fillStyle = this.tagColor || this.color; g.fillText(this.tag, this.x, yy - this.size * 0.75); }
      g.globalAlpha = 1;
    } });
  }
  /** The old floating-text call (BattleScreen: "Chakra not full"). */
  text(x, y, str, { color = '#fff', size = 22, dur = 0.9 } = {}) { return this.number(x, y, str, { color, size, dur }); }
  /** A short announcement plate at the top of the canvas (mechanics, rounds). */
  say(text, color = '#ffffff', dur = 1.6) { this.announce = { text, color, t: 0, dur }; }

  // ---------------------------------------------------------------- nature presets
  /** Impact burst at (x, y); power scales counts and reach. Low draws the ring and the star only. */
  burst(nature, x, y, power = 1) {
    const N = N_OF(nature); const n = (k) => this.n(k * power);
    if (nature === 'Fire') {
      for (let i = 0; i < n(18); i++) { const a = rnd(-Math.PI * 0.95, -Math.PI * 0.05), sp = rnd(110, 260); this.emit({ x, y, vx: Math.cos(a) * sp * 0.8, vy: Math.sin(a) * sp, grav: -90, life: rnd(0.35, 0.7), size: rnd(7, 13), shape: 'flame', color: pick([N.color, '#ff8a3d', N.light]), add: true, fade: 'late' }); }
      for (let i = 0; i < n(10); i++) { const a = rnd(0, TAU), sp = rnd(60, 160); this.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, grav: -40, life: rnd(0.5, 0.9), size: rnd(2, 3.5), shape: 'circle', color: pick([N.light, N.core]), add: true }); }
      for (let i = 0; i < n(5); i++) this.emit({ x: x + rnd(-14, 14), y: y - 6, vx: rnd(-20, 20), vy: rnd(-70, -30), life: rnd(0.6, 0.9), size: rnd(10, 16), shape: 'puff', color: '#5b524d', alpha: 0.4, grow: 1.6 });
      this.ring(x, y, N.color, { r1: 90 * power, width: 7, dur: 0.35 });
    } else if (nature === 'Wind') {
      for (let i = 0; i < n(14); i++) { const a = rnd(0, TAU), sp = rnd(200, 360); this.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 2.2, life: rnd(0.3, 0.55), size: rnd(10, 18), shape: 'arc', color: pick([N.color, N.light, N.core]), add: true }); }
      for (let i = 0; i < n(6); i++) { const a = rnd(0, TAU), sp = rnd(120, 220); this.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, grav: 120, rot: rnd(0, TAU), vrot: rnd(-8, 8), life: rnd(0.5, 0.8), size: 7, shape: 'leaf', color: pick(['#7cc36a', '#d9c24a']) }); }
      this.ring(x, y, N.light, { r1: 110 * power, width: 5, dur: 0.4 });
    } else if (nature === 'Lightning') {
      this.flash('#fff8d0', 0.35 * Math.min(1, power), 0.08);
      for (let i = 0; i < n(7); i++) this.emit({ x, y, rot: rnd(0, TAU), life: rnd(0.1, 0.2), size: rnd(12, 20), shape: 'bolt', color: pick([N.color, N.core]), add: true });
      for (let i = 0; i < n(18); i++) { const a = rnd(0, TAU), sp = rnd(240, 440); this.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 320, life: rnd(0.25, 0.4), size: rnd(2, 3.5), shape: 'circle', color: pick([N.color, N.core]), add: true }); }
      this.star(x, y, 40 * power, N.core, 0.16);
    } else if (nature === 'Earth') {
      for (let i = 0; i < n(16); i++) { const a = rnd(-Math.PI * 0.9, -Math.PI * 0.1), sp = rnd(140, 320); this.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 760, rot: rnd(0, TAU), vrot: rnd(-6, 6), life: rnd(0.6, 0.95), size: rnd(5, 10), shape: 'rock', color: pick([N.color, '#8a5a2b', '#5a3a1a']), fade: 'late' }); }
      for (let i = 0; i < n(7); i++) this.emit({ x: x + rnd(-20, 20), y: y + 6, vx: rnd(-60, 60), vy: rnd(-40, -10), life: rnd(0.5, 0.8), size: rnd(12, 18), shape: 'puff', color: '#a08060', alpha: 0.45, grow: 2 });
      this.ring(x, y + 30, N.dark, { r1: 80 * power, width: 6, dur: 0.35, ellipse: 0.35 });
    } else if (nature === 'Water') {
      for (let i = 0; i < n(22); i++) { const a = rnd(-Math.PI * 0.95, -Math.PI * 0.05), sp = rnd(150, 330); this.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 640, life: rnd(0.45, 0.8), size: rnd(3.5, 6.5), shape: 'drop', color: pick([N.color, N.light, N.core]) }); }
      for (let i = 0; i < n(5); i++) this.emit({ x: x + rnd(-16, 16), y, vx: rnd(-30, 30), vy: rnd(-50, -20), life: rnd(0.5, 0.8), size: rnd(12, 18), shape: 'puff', color: '#bfe4ff', alpha: 0.35, grow: 1.6 });
      this.ring(x, y + 26, N.light, { r1: 90 * power, width: 5, dur: 0.4, ellipse: 0.32 });
    } else {
      for (let i = 0; i < n(10); i++) { const a = rnd(0, TAU), sp = rnd(260, 420); this.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 3, life: rnd(0.15, 0.25), size: rnd(8, 14), shape: 'line', color: N.core, add: true }); }
      for (let i = 0; i < n(5); i++) this.emit({ x: x + rnd(-14, 14), y: y + 10, vx: rnd(-40, 40), vy: rnd(-30, -10), life: rnd(0.4, 0.6), size: rnd(10, 14), shape: 'puff', color: '#c9c0b4', alpha: 0.35, grow: 1.5 });
      this.star(x, y, 34 * power, N.core, 0.14);
    }
  }
  /** A white impact star (drawn even on Low). */
  star(x, y, size, color = '#ffffff', dur = 0.15) { return this.add({ kind: 'star', t: 0, dur, update(dt) { this.t += dt; this.done = this.t >= dur; }, draw(g) { const k = this.t / dur; g.globalAlpha = 1 - k; g.fillStyle = color; g.beginPath(); for (let i = 0; i < 8; i++) { const aa = (i / 8) * TAU, rr2 = (i % 2 ? size * 0.35 : size) * (1 + k * 0.4); g.lineTo(x + Math.cos(aa) * rr2, y + Math.sin(aa) * rr2); } g.closePath(); g.fill(); g.globalAlpha = 1; } }); }
  /** A charge-up around a point for `dur` seconds (the caster's hand). Returns the item (end it early with .done = true). */
  cast(nature, getPos, dur = 1.2) {
    const N = N_OF(nature); const fx = this; const on = this.spec.casts;
    return this.add({ kind: 'cast', t: 0, dur, acc: 0, update(dt) {
      this.t += dt; this.done = this.done || this.t >= dur; if (!on) return; this.acc += dt; const { x, y } = getPos();
      while (this.acc > 0.03) {
        this.acc -= 0.03; const a = rnd(0, TAU), r = rnd(22, 40);
        if (nature === 'Fire') fx.emit({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.6 + 10, vx: -Math.cos(a) * 30, vy: rnd(-110, -60), life: rnd(0.4, 0.7), size: rnd(2, 4), shape: 'circle', color: pick([N.color, N.light]), add: true });
        else if (nature === 'Wind') fx.emit({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, vx: -Math.sin(a) * 160, vy: Math.cos(a) * 160, drag: 1, life: 0.35, size: rnd(8, 12), shape: 'arc', color: pick([N.color, N.light]), add: true });
        else if (nature === 'Lightning') { fx.emit({ x: x + rnd(-14, 14), y: y + rnd(-14, 14), rot: rnd(0, TAU), life: rnd(0.06, 0.12), size: rnd(8, 14), shape: 'bolt', color: pick([N.color, N.core]), add: true }); if (Math.random() < 0.4) fx.emit({ x, y, vx: rnd(-160, 160), vy: rnd(-160, 60), grav: 300, life: 0.25, size: 2, shape: 'circle', color: N.core, add: true }); }
        else if (nature === 'Earth') fx.emit({ x: x + rnd(-30, 30), y: y + 40, vx: 0, vy: rnd(-90, -40), grav: -30, rot: rnd(0, TAU), vrot: rnd(-4, 4), life: rnd(0.5, 0.8), size: rnd(3, 6), shape: 'rock', color: pick([N.color, '#8a5a2b']) });
        else if (nature === 'Water') fx.emit({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.7, vx: -Math.sin(a) * 120, vy: Math.cos(a) * 80, life: 0.4, size: rnd(3, 5), shape: 'drop', color: pick([N.color, N.light]) });
        else fx.emit({ x: x + rnd(-20, 20), y: y + rnd(-20, 20), vx: rnd(-40, 40), vy: rnd(-80, -30), life: 0.3, size: 6, shape: 'line', color: N.core, add: true });
      }
    }, draw(g) { const { x, y } = getPos(); const p = 0.5 + 0.5 * Math.sin(this.t * 14); g.globalAlpha = 0.25 + 0.25 * p; g.strokeStyle = N.color; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y + 48, 40 + p * 6, 12 + p * 2, 0, 0, TAU); g.stroke(); g.globalAlpha = 1; } });
  }
  smoke(x, y, count = 10, color = '#e6dccb', alpha = 0.7) { for (let i = 0; i < this.n(count); i++) this.emit({ x: x + rnd(-30, 30), y: y + rnd(-10, 30), vx: rnd(-70, 70), vy: rnd(-90, -20), drag: 1.4, life: rnd(0.6, 1.1), size: rnd(18, 34), shape: 'puff', color, alpha, grow: 1.5 }); if (!this.spec.particles) this.ring(x, y, color, { r1: 70, width: 6, dur: 0.4 }); }
  shockwave(x, y, power = 1, color = '#ffffff') { this.ring(x, y + 20, color, { r1: 170 * power, width: 10, dur: 0.5, ellipse: 0.4 }); this.ring(x, y + 20, color, { r1: 120 * power, width: 5, dur: 0.35, ellipse: 0.4, delay: 0.08 }); for (let i = 0; i < this.n(14 * power); i++) { const a = rnd(0, TAU), sp = rnd(120, 360); this.emit({ x, y: y + 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.35 - 60, grav: 500, life: rnd(0.4, 0.7), size: rnd(2, 4), shape: 'circle', color: '#ffffff', add: true }); } }
  rubble(x, y, power = 1) { for (let i = 0; i < this.n(14 * power); i++) this.emit({ x: x + rnd(-120, 120) * power, y: GROUND_Y + rnd(-6, 20), vx: rnd(-20, 20), vy: rnd(-260, -120), grav: 520, rot: rnd(0, TAU), vrot: rnd(-5, 5), life: rnd(0.7, 1.1), size: rnd(5, 12), shape: 'rock', color: pick(['#8a7a66', '#5a4a3a', '#a09080']), fade: 'late' }); }

  // ---------------------------------------------------------------- signature pieces
  rasengan(getPos, { r = 14, charge = 0.35, color = '#3fa9f5', blades = false } = {}) {
    const fx = this; const N = NATURE.Water; const spec = this.spec;
    return this.add({ kind: 'rasengan', t: 0, spin: 0, acc: 0, update(dt) { this.t += dt; this.spin += dt * 14; if (!spec.casts) return; this.acc += dt; const { x, y } = getPos(); while (this.acc > 0.04) { this.acc -= 0.04; const a = rnd(0, TAU); fx.emit({ x: x + Math.cos(a) * 26, y: y + Math.sin(a) * 26, vx: -Math.cos(a) * 90, vy: -Math.sin(a) * 90, life: 0.28, size: 6, shape: 'arc', color: pick([N.light, N.core]), add: true }); } }, draw(g) {
      const { x, y } = getPos(); const k = Math.min(1, this.t / charge); const rr2 = r * (0.3 + 0.7 * k);
      g.save(); g.globalCompositeOperation = 'lighter';
      const gl = g.createRadialGradient(x, y, rr2 * 0.5, x, y, rr2 * 3); gl.addColorStop(0, rgba(color, 0.55)); gl.addColorStop(1, rgba(color, 0)); g.fillStyle = gl; g.beginPath(); g.arc(x, y, rr2 * 3, 0, TAU); g.fill();
      g.restore();
      if (blades) { g.save(); g.translate(x, y); g.rotate(this.spin * 0.6); g.fillStyle = rgba('#c7ffd8', 0.85); for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(rr2 * 1.2, 0); g.quadraticCurveTo(rr2 * 2.6, -rr2 * 0.9, rr2 * 3.4, 0); g.quadraticCurveTo(rr2 * 2.6, rr2 * 0.3, rr2 * 1.2, 0); g.fill(); } g.restore(); }
      const sp = g.createRadialGradient(x - rr2 * 0.3, y - rr2 * 0.3, rr2 * 0.1, x, y, rr2); sp.addColorStop(0, '#ffffff'); sp.addColorStop(0.5, N.light); sp.addColorStop(1, color); g.fillStyle = sp; g.beginPath(); g.arc(x, y, rr2, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x, y, rr2 * 0.95, rr2 * 0.35, this.spin + i * 1.05, 0, TAU); g.stroke(); }
      g.strokeStyle = rgba(N.dark, 0.7); g.lineWidth = 2; g.beginPath(); g.arc(x, y, rr2, 0, TAU); g.stroke();
    } });
  }
  rasenganImpact(x, y, power = 1) {
    const N = NATURE.Water;
    this.add({ kind: 'spiral', t: 0, dur: 0.5, update(dt) { this.t += dt; this.done = this.t >= this.dur; }, draw(g) { const p = this.t / this.dur; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - p; g.strokeStyle = N.light; g.lineWidth = 6 * (1 - p * 0.5); for (let i = 0; i < 3; i++) { g.beginPath(); for (let k = 0; k < 40; k++) { const a = k * 0.25 + i * 2.1 + p * 6, rr2 = (k * 4 + 10) * (0.4 + p * 1.6) * power; const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2; if (k === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke(); } g.restore(); } });
    this.burst('Wind', x, y, power); this.ring(x, y, '#ffffff', { r1: 150 * power, width: 8, dur: 0.45 }); this.flash('#dff4ff', 0.35, 0.1);
    for (let i = 0; i < this.n(14); i++) { const a = rnd(0, TAU), sp = rnd(180, 340); this.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 2, life: rnd(0.3, 0.5), size: rnd(4, 8), shape: 'circle', color: pick([N.color, N.light]), add: true }); }
  }
  windDome(x, y, power = 1) { this.ring(x, y, '#c7ffd8', { r1: 220 * power, width: 12, dur: 0.6 }); this.ring(x, y, '#ffffff', { r1: 160 * power, width: 4, dur: 0.5, delay: 0.1 }); for (let i = 0; i < this.n(24); i++) { const a = rnd(0, TAU), sp = rnd(200, 420); this.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 1.5, life: rnd(0.4, 0.7), size: rnd(10, 18), shape: 'arc', color: pick(['#5fd38a', '#c7ffd8', '#ffffff']), add: true }); } }
  lightningHand(getPos, { color = '#dff6ff', size = 22 } = {}) {
    const fx = this; const spec = this.spec;
    return this.add({ kind: 'lhand', t: 0, acc: 0, update(dt) { this.t += dt; if (!spec.casts) return; this.acc += dt; const { x, y } = getPos(); while (this.acc > 0.05) { this.acc -= 0.05; fx.emit({ x, y, vx: rnd(-140, 140), vy: rnd(-140, 100), grav: 260, life: 0.22, size: 2, shape: 'circle', color: '#ffffff', add: true }); } }, draw(g) {
      const { x, y } = getPos(); g.save(); g.globalCompositeOperation = 'lighter';
      const gl = g.createRadialGradient(x, y, 2, x, y, size * 1.8); gl.addColorStop(0, rgba(color, 0.7)); gl.addColorStop(1, rgba(color, 0)); g.fillStyle = gl; g.beginPath(); g.arc(x, y, size * 1.8, 0, TAU); g.fill();
      g.strokeStyle = color; g.lineWidth = 2.2; for (let i = 0; i < 5; i++) { let px = x, py = y; const a = rnd(0, TAU); g.beginPath(); g.moveTo(px, py); for (let k = 0; k < 4; k++) { px += Math.cos(a + rnd(-0.7, 0.7)) * size * 0.45; py += Math.sin(a + rnd(-0.7, 0.7)) * size * 0.45; g.lineTo(px, py); } g.stroke(); }
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, size * 0.28, 0, TAU); g.fill(); g.restore();
    } });
  }
  chidoriStream(x, y, dur = 0.7) {
    const fx = this;
    return this.add({ kind: 'stream', t: 0, dur, update(dt) { this.t += dt; this.done = this.t >= dur; if (Math.random() < 0.6) fx.emit({ x: x + rnd(-200, 200), y: GROUND_Y + rnd(-10, 30), vx: rnd(-60, 60), vy: rnd(-200, -80), grav: 400, life: 0.3, size: 2, shape: 'circle', color: '#fff', add: true }); }, draw(g) {
      const p = this.t / this.dur; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = p < 0.8 ? 1 : 1 - (p - 0.8) / 0.2;
      g.strokeStyle = '#cfefff'; g.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + Math.sin(this.t * 30 + i) * 0.1; const len = (140 + (i % 3) * 60) * Math.min(1, p * 3); let px = x, py = y; g.beginPath(); g.moveTo(px, py); for (let k = 1; k <= 5; k++) { px = x + Math.cos(a) * len * (k / 5) + rnd(-10, 10); py = y + Math.sin(a) * len * (k / 5) * 0.45 + rnd(-8, 8); g.lineTo(px, py); } g.stroke(); }
      const gl = g.createRadialGradient(x, y, 10, x, y, 90); gl.addColorStop(0, 'rgba(220,245,255,0.6)'); gl.addColorStop(1, 'rgba(220,245,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, 90, 0, TAU); g.fill(); g.restore();
    } });
  }
  /** Water Dragon from (x0,y0) to (x1,y1) over `dur` s, then a splash. Returns the flight time. */
  waterDragon(x0, y0, x1, y1, dur = 0.5) {
    const fx = this; const N = NATURE.Water;
    const cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - 200;
    const at = (t) => ({ x: (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, y: (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1 });
    this.add({ kind: 'dragon', t: 0, dur, hit: false, update(dt) { this.t += dt; const p = this.t / dur; if (p >= 1 && !this.hit) { this.hit = true; fx.burst('Water', x1, y1 - 10, 1.6); fx.shake(9, 0.35); } this.done = p >= 1.35; const h = at(Math.min(1, p)); if (p < 1 && Math.random() < 0.7) fx.emit({ x: h.x, y: h.y, vx: rnd(-40, 40), vy: rnd(-60, 20), grav: 300, life: 0.4, size: rnd(2, 4), shape: 'drop', color: pick([N.light, N.core]) }); }, draw(g) {
      const p = Math.min(1, this.t / dur); const fade = this.t > dur ? 1 - (this.t - dur) / (dur * 0.35) : 1; if (fade <= 0) return;
      const tail = Math.max(0, p - 0.42); g.save(); g.globalAlpha = fade; g.lineCap = 'round'; g.lineJoin = 'round';
      const pts = []; for (let k = 0; k <= 24; k++) { const tt = tail + (p - tail) * (k / 24); const q = at(tt); const wob = Math.sin(tt * 26 - this.t * 18) * 14 * (k / 24); pts.push([q.x, q.y + wob]); }
      const stroke = (w, c) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); };
      stroke(34, N.dark); stroke(26, N.color); stroke(12, N.light); stroke(4, N.core);
      const h = pts[pts.length - 1], h2 = pts[pts.length - 3] || h; const ang = Math.atan2(h[1] - h2[1], h[0] - h2[0]);
      g.translate(h[0], h[1]); g.rotate(ang); g.fillStyle = N.color; g.beginPath(); g.moveTo(-10, -22); g.lineTo(34, -6); g.lineTo(40, 4); g.lineTo(30, 14); g.lineTo(-10, 22); g.closePath(); g.fill(); g.strokeStyle = N.dark; g.lineWidth = 3; g.stroke();
      g.fillStyle = N.light; g.beginPath(); g.moveTo(-14, -26); g.lineTo(-2, -44); g.lineTo(6, -24); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(14, -6, 4, 0, TAU); g.fill(); g.fillStyle = '#112'; g.beginPath(); g.arc(15, -6, 2, 0, TAU); g.fill();
      g.restore();
    } });
    return dur;
  }
  /** A generic thrown thing from a to b over dur; `draw(g, x, y, k, ang)` paints it. Returns dur. */
  projectile(a, b, dur, draw, { arc = 40, trail = null } = {}) {
    const fx = this;
    this.add({ kind: 'proj', t: 0, dur, update(dt) { this.t += dt; this.done = this.t >= dur; if (trail && Math.random() < 0.8) { const k = clamp(this.t / dur, 0, 1); fx.emit({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * arc, vx: rnd(-30, 30), vy: rnd(-30, 30), life: 0.25, size: rnd(2, 5), shape: trail.shape || 'circle', color: trail.color, add: trail.add !== false }); } }, draw(g) { const k = clamp(this.t / dur, 0, 1); const x = lerp(a.x, b.x, k), y = lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * arc; const ang = Math.atan2(b.y - a.y, b.x - a.x); g.save(); draw(g, x, y, k, ang); g.restore(); } });
    return dur;
  }
  kunai(a, b, dur = 0.22) { return this.projectile(a, b, dur, (g, x, y, k, ang) => { g.translate(x, y); g.rotate(ang); g.fillStyle = '#d7dde5'; g.beginPath(); g.moveTo(-14, 0); g.lineTo(6, -4); g.lineTo(14, 0); g.lineTo(6, 4); g.closePath(); g.fill(); g.strokeStyle = '#1a1410'; g.lineWidth = 1.5; g.stroke(); }, { arc: 30 }); }
  natureBolt(a, b, nature, dur = 0.22) { const N = N_OF(nature); return this.projectile(a, b, dur, (g, x, y) => { g.fillStyle = N.light; g.shadowColor = N.color; g.shadowBlur = 12; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); }, { arc: 26, trail: { color: N.color } }); }
  volley(a, b, dur = 0.24) { for (let i = 0; i < 3; i++) this.later(i * 0.05, () => this.kunai({ x: a.x, y: a.y + rnd(-10, 10) }, { x: b.x + rnd(-14, 14), y: b.y + rnd(-14, 14) }, dur)); return dur + 0.1; }
  fireball(a, b, dur = 0.3) { const N = NATURE.Fire; return this.projectile(a, b, dur, (g, x, y, k) => { const r = 16 + k * 22; const gl = g.createRadialGradient(x, y, r * 0.2, x, y, r); gl.addColorStop(0, N.core); gl.addColorStop(0.5, N.light); gl.addColorStop(1, rgba(N.color, 0)); g.globalCompositeOperation = 'lighter'; g.fillStyle = gl; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }, { arc: 20, trail: { color: N.color, shape: 'flame' } }); }
  waterOrb(a, b, dur = 0.3) { const N = NATURE.Water; return this.projectile(a, b, dur, (g, x, y, k) => { const r = 14 + k * 14; g.fillStyle = rgba(N.color, 0.8); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = N.light; g.lineWidth = 3; g.stroke(); g.fillStyle = N.core; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.25, 0, TAU); g.fill(); }, { arc: 30, trail: { color: N.light, shape: 'drop', add: false } }); }
  throwHalo(a, b, dur = 0.32) { return this.projectile(a, b, dur, (g, x, y, k) => { g.translate(x, y); g.rotate(this.time * 30); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(199,255,216,0.9)'; for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(14, 0); g.quadraticCurveTo(34, -14, 48, 0); g.quadraticCurveTo(34, 5, 14, 0); g.fill(); } g.fillStyle = '#9ed8ff'; g.beginPath(); g.arc(0, 0, 14, 0, TAU); g.fill(); }, { arc: 10, trail: { color: '#c7ffd8', shape: 'arc' } }); }
  clayBird(a, b, dur = 0.35) { return this.projectile(a, b, dur, (g, x, y, k) => { g.translate(x, y); g.fillStyle = '#f4f1ea'; g.strokeStyle = '#2a2420'; g.lineWidth = 2; const flap = Math.sin(k * 40) * 8; g.beginPath(); g.moveTo(-16, 0); g.lineTo(-4, -4 - flap); g.lineTo(6, -6 - flap); g.lineTo(16, 0); g.lineTo(6, 4 + flap * 0.5); g.lineTo(-4, 3); g.closePath(); g.fill(); g.stroke(); }, { arc: 70 }); }
  darkShot(a, b, dur = 0.28) { return this.projectile(a, b, dur, (g, x, y) => { const gl = g.createRadialGradient(x, y, 4, x, y, 26); gl.addColorStop(0, '#2a0a3a'); gl.addColorStop(0.7, '#12051a'); gl.addColorStop(1, 'rgba(176,124,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, 26, 0, TAU); g.fill(); g.strokeStyle = '#b07cff'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 18, 0, TAU); g.stroke(); }, { arc: 8, trail: { color: '#b07cff' } }); }
  darkSphere(getPos, dur) { const fx = this; return this.add({ kind: 'dsphere', t: 0, dur, update(dt) { this.t += dt; this.done = this.done || this.t >= dur; if (Math.random() < 0.5) { const { x, y } = getPos(); const a = rnd(0, TAU); fx.emit({ x: x + Math.cos(a) * 60, y: y + Math.sin(a) * 60, vx: -Math.cos(a) * 120, vy: -Math.sin(a) * 120, life: 0.4, size: 3, shape: 'circle', color: pick(['#b07cff', '#ff5d5d', '#2a0a3a']), add: true }); } }, draw(g) { const { x, y } = getPos(); const r = 8 + Math.min(1, this.t / Math.max(0.2, dur)) * 20; g.fillStyle = '#12051a'; g.beginPath(); g.arc(x, y - 10, r, 0, TAU); g.fill(); g.strokeStyle = '#b07cff'; g.lineWidth = 2 + Math.sin(this.t * 20); g.stroke(); } }); }
  paperSheets(a, b, dur = 0.3) { for (let i = 0; i < 4; i++) this.later(i * 0.04, () => this.projectile({ x: a.x, y: a.y + rnd(-16, 16) }, { x: b.x + rnd(-16, 16), y: b.y + rnd(-16, 16) }, dur, (g, x, y, k) => { g.translate(x, y); g.rotate(k * 9 + i); g.fillStyle = '#f4f1ea'; g.fillRect(-9, -6, 18, 12); g.strokeStyle = '#8a8580'; g.lineWidth = 1; g.strokeRect(-9, -6, 18, 12); }, { arc: 30 + i * 10 })); return dur + 0.12; }
  windSlash(a, b, dur = 0.28) { return this.projectile(a, b, dur, (g, x, y, k, ang) => { g.translate(x, y); g.rotate(ang); g.globalCompositeOperation = 'lighter'; g.strokeStyle = '#c7ffd8'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, 34, -1.2, 1.2); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 22, -1.1, 1.1); g.stroke(); }, { arc: 6, trail: { color: '#5fd38a', shape: 'arc' } }); }
  shadowSnake(a, b, dur = 0.35) { const fx = this; this.add({ kind: 'shadow', t: 0, dur, update(dt) { this.t += dt; this.done = this.t >= dur + 0.5; }, draw(g) { const k = clamp(this.t / dur, 0, 1); const fade = this.t > dur ? 1 - (this.t - dur) / 0.5 : 1; g.globalAlpha = 0.85 * fade; g.fillStyle = '#0b0b10'; g.beginPath(); const y = GROUND_Y + 6; g.moveTo(a.x, y - 10); for (let i = 0; i <= 12; i++) { const t = i / 12 * k; const x = lerp(a.x, b.x, t); g.lineTo(x, y - 10 + Math.sin(t * 20 + fx.time * 10) * 6); } const xe = lerp(a.x, b.x, k); g.lineTo(xe, y + 10); g.lineTo(a.x, y + 10); g.closePath(); g.fill(); g.globalAlpha = 1; } }); return dur; }
  snakes(a, b, dur = 0.3) { for (let i = 0; i < 3; i++) this.later(i * 0.04, () => this.projectile({ x: a.x, y: a.y + i * 6 }, { x: b.x + rnd(-10, 10), y: b.y + rnd(-14, 14) }, dur, (g, x, y, k, ang) => { g.translate(x, y); g.rotate(ang); g.strokeStyle = '#8b5cf6'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); for (let j = 0; j < 6; j++) g.lineTo(-j * 9, Math.sin(k * 30 + j) * 5); g.stroke(); g.fillStyle = '#c4b5fd'; g.beginPath(); g.arc(2, 0, 4, 0, TAU); g.fill(); }, { arc: 14 + i * 8 })); return dur + 0.1; }
  swarm(a, b, dur = 0.35) { for (let i = 0; i < this.n(18); i++) this.emit({ x: a.x + rnd(-20, 20), y: a.y + rnd(-20, 20), vx: (b.x - a.x) / dur + rnd(-60, 60), vy: (b.y - a.y) / dur + rnd(-80, 80), life: dur + rnd(0.1, 0.3), size: 2.5, shape: 'circle', color: '#1a1a1a', alpha: 0.9 }); return dur; }
  threads(a, b, dur = 0.3) { this.add({ kind: 'threads', t: 0, dur, update(dt) { this.t += dt; this.done = this.t >= dur + 0.3; }, draw(g) { const k = clamp(this.t / dur, 0, 1); g.globalAlpha = this.t > dur ? 1 - (this.t - dur) / 0.3 : 1; g.strokeStyle = '#2b2b2b'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(a.x, a.y + i * 6 - 12); g.quadraticCurveTo(lerp(a.x, b.x, 0.5), a.y + Math.sin(i * 2 + this.t * 20) * 40, lerp(a.x, b.x, k), lerp(a.y, b.y, k) + i * 5 - 10); g.stroke(); } g.globalAlpha = 1; } }); return dur; }
  strings(getPos, dur) { return this.add({ kind: 'strings', t: 0, dur, update(dt) { this.t += dt; this.done = this.done || this.t >= dur; }, draw(g) { const { x, y } = getPos(); g.strokeStyle = 'rgba(155,227,255,0.8)'; g.lineWidth = 1.5; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(x + (i - 2) * 6, y); g.lineTo(x + (i - 2) * 40 + Math.sin(this.t * 6 + i) * 10, y - 140); g.stroke(); } } }); }
  lightBeams(a, b, dur = 0.25) { this.add({ kind: 'beams', t: 0, dur, update(dt) { this.t += dt; this.done = this.t >= dur + 0.2; }, draw(g) { const k = clamp(this.t / dur, 0, 1); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = this.t > dur ? 1 - (this.t - dur) / 0.2 : 1; g.lineCap = 'round'; for (let i = 0; i < 4; i++) { g.strokeStyle = i % 2 ? '#fff5b8' : '#ffffff'; g.lineWidth = 5 - i; g.beginPath(); g.moveTo(a.x, a.y + (i - 1.5) * 8); g.lineTo(lerp(a.x, b.x, k), lerp(a.y, b.y, k) + (i - 1.5) * 12); g.stroke(); } g.restore(); } }); return dur; }
  cubeBeam(a, b, dur = 0.3) { this.add({ kind: 'cube', t: 0, dur, update(dt) { this.t += dt; this.done = this.t >= dur + 0.25; }, draw(g) { const k = clamp(this.t / dur, 0, 1); g.save(); g.globalAlpha = this.t > dur ? 1 - (this.t - dur) / 0.25 : 1; g.strokeStyle = '#ffffff'; g.lineWidth = 10; g.lineCap = 'butt'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(lerp(a.x, b.x, k), lerp(a.y, b.y, k)); g.stroke(); g.fillStyle = '#ffffff'; const x = lerp(a.x, b.x, k), y = lerp(a.y, b.y, k); g.translate(x, y); g.rotate(this.t * 8); g.fillRect(-12, -12, 24, 24); g.strokeStyle = '#9ed8ff'; g.lineWidth = 2; g.strokeRect(-12, -12, 24, 24); g.restore(); } }); return dur; }
  blackFlames(x, y, power = 1) { const fx = this; this.add({ kind: 'amaterasu', t: 0, dur: 1.4, acc: 0, update(dt) { this.t += dt; this.done = this.t >= this.dur; this.acc += dt; while (this.acc > 0.03) { this.acc -= 0.03; fx.emit({ x: x + rnd(-26, 26) * power, y: y + rnd(-10, 26), vx: rnd(-20, 20), vy: rnd(-120, -60), life: rnd(0.4, 0.8), size: rnd(8, 16) * power, shape: 'flame', color: pick(['#0b0710', '#1a0f24', '#241633']), alpha: 0.95, fade: 'late' }); if (Math.random() < 0.4) fx.emit({ x: x + rnd(-26, 26) * power, y: y + rnd(-10, 26), vx: rnd(-20, 20), vy: rnd(-100, -50), life: 0.4, size: rnd(4, 8), shape: 'flame', color: '#7c3aed', add: true }); } }, draw() {} }); this.ring(x, y, '#7c3aed', { r1: 80 * power, width: 5, dur: 0.4 }); }
  sandGather(getPos, dur) { const fx = this; return this.add({ kind: 'sand', t: 0, dur, acc: 0, update(dt) { this.t += dt; this.done = this.done || this.t >= dur; this.acc += dt; while (this.acc > 0.025) { this.acc -= 0.025; const { x, y } = getPos(); const a = rnd(0, TAU), r = rnd(60, 110); fx.emit({ x: x + Math.cos(a) * r, y: GROUND_Y + rnd(-4, 12), vx: -Math.cos(a) * r * 1.6, vy: (y - GROUND_Y) * 1.4 + rnd(-40, 40), life: 0.6, size: rnd(2, 3.5), shape: 'circle', color: pick(['#e8c39a', '#c08a52', '#f5e6d0']) }); } }, draw() {} }); }
  sandDome(x, y, power = 1) { const fx = this; this.add({ kind: 'dome', t: 0, dur: 0.6, update(dt) { this.t += dt; this.done = this.t >= this.dur; }, draw(g) { const p = this.t / this.dur; const r = 70 * power * (0.6 + 0.4 * Math.min(1, p * 3)); g.globalAlpha = 1 - p; g.fillStyle = 'rgba(200,150,90,0.75)'; g.beginPath(); g.arc(x, y + 10, r, Math.PI, TAU); g.fill(); g.strokeStyle = '#6b4423'; g.lineWidth = 3; g.stroke(); g.globalAlpha = 1; } }); for (let i = 0; i < this.n(20 * power); i++) this.emit({ x: x + rnd(-60, 60), y: y + 10, vx: rnd(-60, 60), vy: rnd(-160, -40), grav: 500, life: rnd(0.4, 0.8), size: rnd(2, 4), shape: 'circle', color: pick(['#e8c39a', '#c08a52']) }); void fx; }
  trigramCircle(getPos, dur) { return this.add({ kind: 'trigram', t: 0, dur, update(dt) { this.t += dt; this.done = this.done || this.t >= dur; }, draw(g) { const { x } = getPos(); const y = GROUND_Y + 6; const k = Math.min(1, this.t / 0.3); g.save(); g.globalAlpha = 0.85; g.strokeStyle = '#9ed8ff'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, 90 * k, 28 * k, 0, 0, TAU); g.stroke(); g.beginPath(); g.ellipse(x, y, 60 * k, 19 * k, 0, 0, TAU); g.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + this.t * 0.8; g.fillStyle = '#dff4ff'; g.fillRect(x + Math.cos(a) * 75 * k - 5, y + Math.sin(a) * 23 * k - 2, 10, 4); } g.restore(); } }); }
  bluePalms(x, y) { for (let i = 0; i < 8; i++) this.later(i * 0.04, () => { this.ring(x + rnd(-30, 30), y + rnd(-30, 30), '#9ed8ff', { r1: 36, width: 4, dur: 0.25 }); }); }
  reaper(getPos, dur) { return this.add({ kind: 'reaper', t: 0, dur, update(dt) { this.t += dt; this.done = this.done || this.t >= dur; }, draw(g) { const { x, y } = getPos(); const k = Math.min(1, this.t / 0.5); g.save(); g.globalAlpha = 0.55 * k; g.fillStyle = '#e8e6f0'; g.beginPath(); g.ellipse(x - 30, y - 120, 60, 90 * k, 0, 0, TAU); g.fill(); g.fillStyle = '#2a1a3a'; g.beginPath(); g.arc(x - 30, y - 170, 22, 0, TAU); g.fill(); g.fillStyle = '#c8b6ff'; g.beginPath(); g.arc(x - 40, y - 174, 4, 0, TAU); g.arc(x - 20, y - 174, 4, 0, TAU); g.fill(); g.restore(); } }); }
  growth(x, y, power = 1) { const fx = this; this.add({ kind: 'wood', t: 0, dur: 0.9, update(dt) { this.t += dt; this.done = this.t >= this.dur; if (this.t < 0.4 && Math.random() < 0.6) fx.emit({ x: x + rnd(-50, 50) * power, y: GROUND_Y + 4, vx: rnd(-20, 20), vy: rnd(-120, -40), grav: 300, life: 0.5, size: rnd(2, 4), shape: 'rock', color: '#6b4423' }); }, draw(g) { const k = Math.min(1, this.t / 0.35); const fade = this.t > 0.6 ? 1 - (this.t - 0.6) / 0.3 : 1; g.globalAlpha = fade; g.strokeStyle = '#7a5230'; g.lineCap = 'round'; for (let i = 0; i < 5; i++) { const bx = x + (i - 2) * 22 * power; g.lineWidth = 8 - Math.abs(i - 2) * 2; g.beginPath(); g.moveTo(bx, GROUND_Y + 4); g.quadraticCurveTo(bx + (i - 2) * 10, y, bx + (i - 2) * 24, y - 60 * k - Math.abs(i - 2) * -10); g.stroke(); g.fillStyle = '#3f7d3a'; g.beginPath(); g.arc(bx + (i - 2) * 24, y - 60 * k, 10 * k, 0, TAU); g.fill(); } g.globalAlpha = 1; } }); this.burst('Earth', x, y, power * 0.6); }
  warp(x, y, power = 1) { this.add({ kind: 'warp', t: 0, dur: 0.6, update(dt) { this.t += dt; this.done = this.t >= this.dur; }, draw(g) { const p = this.t / this.dur; g.save(); g.globalAlpha = 1 - p; g.strokeStyle = '#ff5d5d'; g.lineWidth = 4; for (let i = 0; i < 3; i++) { g.beginPath(); for (let k = 0; k < 50; k++) { const a = k * 0.28 + i * 2.1 - p * 10, rr2 = (k * 2.4 + 6) * (1.2 - p) * power; g.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } g.stroke(); } g.fillStyle = 'rgba(10,6,14,0.8)'; g.beginPath(); g.arc(x, y, 28 * (1 - p) * power, 0, TAU); g.fill(); g.restore(); } }); }
  crystals(x, y, power = 1) { for (let i = 0; i < this.n(12 * power); i++) this.emit({ x: x + rnd(-30, 30), y: y + rnd(-10, 20), vx: rnd(-160, 160), vy: rnd(-260, -60), grav: 600, rot: rnd(0, TAU), vrot: rnd(-6, 6), life: rnd(0.5, 0.9), size: rnd(5, 10), shape: 'rock', color: pick(['#bfe4ff', '#e6f4ff', '#a8d8ff']), fade: 'late' }); this.ring(x, y, '#bfe4ff', { r1: 90 * power, width: 5, dur: 0.4 }); this.star(x, y, 30 * power, '#ffffff', 0.15); }
  eyeRipple(x, y, power = 1) { this.add({ kind: 'eye', t: 0, dur: 0.8, update(dt) { this.t += dt; this.done = this.t >= this.dur; }, draw(g) { const p = this.t / this.dur; g.save(); g.globalAlpha = 1 - p; g.strokeStyle = '#ff2d2d'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y - 20, 50 * (0.5 + p) * power, 22 * (0.5 + p) * power, 0, 0, TAU); g.stroke(); g.fillStyle = '#ff2d2d'; g.beginPath(); g.arc(x, y - 20, 9 * (1 - p * 0.5), 0, TAU); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(x, y - 20, 4, 0, TAU); g.fill(); g.restore(); } }); this.ring(x, y, '#ff2d2d', { r1: 120 * power, width: 4, dur: 0.6 }); }
  cursePattern(x, y, power = 1) { this.add({ kind: 'curse', t: 0, dur: 0.9, update(dt) { this.t += dt; this.done = this.t >= this.dur; }, draw(g) { const p = this.t / this.dur; g.save(); g.globalAlpha = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3; g.fillStyle = '#12061a'; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = 50 * Math.min(1, p * 2) * power; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3); g.lineTo(x + Math.cos(a + 0.3) * r, y + Math.sin(a + 0.3) * r); g.lineTo(x + Math.cos(a - 0.2) * r * 0.8, y + Math.sin(a - 0.2) * r * 0.8); g.closePath(); g.fill(); } g.restore(); } }); this.ring(x, y, '#7c3aed', { r1: 90 * power, width: 5, dur: 0.4 }); }
  boneSpikes(x, y, power = 1) { this.add({ kind: 'bones', t: 0, dur: 0.7, update(dt) { this.t += dt; this.done = this.t >= this.dur; }, draw(g) { const k = Math.min(1, this.t / 0.2); const fade = this.t > 0.45 ? 1 - (this.t - 0.45) / 0.25 : 1; g.save(); g.globalAlpha = fade; g.fillStyle = '#f1efe6'; g.strokeStyle = '#8a8580'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { const bx = x + (i - 2.5) * 26 * power, h = (50 + (i % 3) * 30) * k * power; g.beginPath(); g.moveTo(bx - 8, GROUND_Y + 6); g.lineTo(bx + (i % 2 ? 6 : -6), GROUND_Y - h); g.lineTo(bx + 8, GROUND_Y + 6); g.closePath(); g.fill(); g.stroke(); } g.restore(); } }); this.burst('None', x, y, power * 0.7); }
  ritualCircle(x, y) { this.add({ kind: 'ritual', t: 0, dur: 1.2, update(dt) { this.t += dt; this.done = this.t >= this.dur; }, draw(g) { const p = this.t / this.dur; g.save(); g.globalAlpha = p < 0.8 ? 0.9 : 1 - (p - 0.8) / 0.2; g.strokeStyle = '#b91c1c'; g.lineWidth = 4; g.beginPath(); g.ellipse(x, GROUND_Y + 8, 80, 26, 0, 0, TAU); g.stroke(); g.beginPath(); for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3; g.lineTo(x + Math.cos(a) * 70, GROUND_Y + 8 + Math.sin(a) * 22); } g.closePath(); g.stroke(); g.restore(); } }); }
  /** The Jutsu Clash beam between two jutsu; `bias()` in −1..1 moves the meeting point toward B (positive) or A. */
  clashBeam(a, b, bias = () => 0, dur = 0.5) {
    const fx = this;
    return this.add({ kind: 'clash', t: 0, dur, update(dt) { this.t += dt; this.done = this.t >= dur; const k = 0.5 + bias() * 0.32; const px = a.x + (b.x - a.x) * k, py = a.y + (b.y - a.y) * k; for (let i = 0; i < fx.n(3); i++) { const ang = rnd(0, TAU), sp = rnd(120, 300); fx.emit({ x: px, y: py, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, grav: 200, life: rnd(0.2, 0.45), size: rnd(2, 4), shape: 'circle', color: pick([a.color, b.color, '#ffffff']), add: true }); } }, draw(g) {
      const k = 0.5 + bias() * 0.32; const px = a.x + (b.x - a.x) * k, py = a.y + (b.y - a.y) * k;
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      const beam = (from, to, color) => { const w = 16 + Math.sin(this.t * 40) * 3; for (let i = 0; i < 3; i++) { const off = Math.sin(this.t * 25 + i * 2) * 5; g.strokeStyle = i === 2 ? '#ffffff' : color; g.lineWidth = i === 2 ? w * 0.3 : w * (1 - i * 0.25); g.globalAlpha = i === 0 ? 0.55 : 0.9; g.beginPath(); g.moveTo(from.x, from.y + off); g.quadraticCurveTo((from.x + to.x) / 2, (from.y + to.y) / 2 + off * 2, to.x, to.y); g.stroke(); } };
      beam(a, { x: px, y: py }, a.color); beam(b, { x: px, y: py }, b.color);
      g.globalAlpha = 1; const gl = g.createRadialGradient(px, py, 4, px, py, 60); gl.addColorStop(0, 'rgba(255,255,255,0.95)'); gl.addColorStop(0.4, 'rgba(255,255,255,0.4)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(px, py, 60, 0, TAU); g.fill();
      g.restore();
    } });
  }
  /** Speed lines behind a dash from (x, y) in direction dir (±1). */
  dashLines(x, y, dir, color = '#ffffff') { for (let i = 0; i < 6; i++) this.emit({ x: x - dir * 20 * i, y: y + (i % 2) * 14 - 7, vx: -dir * 320, vy: 0, life: 0.2, size: 10, shape: 'line', color, add: true }); }
  /** A glow around a unit for `dur` seconds (heals, buffs, Susanoo); the Renderer reads it. */
  aura(uid, color, dur) { this.auras.set(uid, { color, until: this.time + dur }); }
  auraOf(uid) { const a = this.auras.get(uid); return a && a.until > this.time ? a.color : null; }

  // ---------------------------------------------------------------- HUD drawn on the canvas
  /** The wind-up plate: a dark plate with a nature edge, the glyph, the jutsu name and a progress line. */
  drawTelegraph(g, { x, y, name, nature, p, scale = 1, clashable = true }) {
    const N = N_OF(nature); const us = scale;
    g.save(); g.font = `${Math.round(17 * us)}px ${FONT_DISPLAY}`; g.textBaseline = 'middle';
    const need = g.measureText(name).width + 40 * us + (clashable ? 52 * us : 12 * us);
    const tw = Math.min(W - 16, Math.max(150 * us, need)), bh = 36 * us;
    const bx = Math.max(8, Math.min(W - tw - 8, x - tw / 2)), by = y - bh;
    g.fillStyle = 'rgba(12,12,16,0.88)'; rr(g, bx, by, tw, bh, 6 * us); g.fill();
    g.fillStyle = N.color; g.fillRect(bx, by, 6 * us, bh);
    drawGlyph(g, nature, bx + 20 * us, by + bh / 2, 8 * us);
    g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.fillText(name, bx + 34 * us, by + bh / 2 - 1, tw - (clashable ? 90 : 46) * us);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(bx + 6 * us, by + bh - 4 * us, tw - 6 * us, 4 * us);
    g.fillStyle = N.color; g.fillRect(bx + 6 * us, by + bh - 4 * us, (tw - 6 * us) * p, 4 * us);
    if (clashable) { g.fillStyle = N.light; g.font = `${Math.round(11 * us)}px ${FONT_DISPLAY}`; g.textAlign = 'right'; g.fillText('CLASH', bx + tw - 8 * us, by + bh / 2 - 1); }
    g.restore();
  }
  /** Target zone on the ground under a threatened unit (y = the unit's feet, us = the unit scale). */
  drawZone(g, x, y, nature, p, t, us = 1) {
    const N = N_OF(nature); const pulse = 0.5 + 0.5 * Math.sin(t * 12); const rx = 30 * us, ry = 9 * us;
    g.save(); g.globalAlpha = 0.16 + 0.2 * p * pulse; g.fillStyle = N.color; g.beginPath(); g.ellipse(x, y + 4, rx, ry, 0, 0, TAU); g.fill();
    g.globalAlpha = 0.9; g.strokeStyle = N.color; g.lineWidth = 2 * us; g.setLineDash([8 * us, 5 * us]); g.lineDashOffset = -t * 40; g.beginPath(); g.ellipse(x, y + 4, rx * (1.25 - p * 0.25), ry * (1.25 - p * 0.25), 0, 0, TAU); g.stroke();
    g.restore();
  }

  // ---------------------------------------------------------------- the game bridge
  /** Translate BattleSim events into visuals (the screen handles sounds, readouts and cut-ins). */
  onEvents(events, sim) {
    const r = this.r;
    for (const e of events) {
      const u = e.uid != null ? sim.unit(e.uid) : null;
      switch (e.type) {
        case 'attack': {
          const src = sim.unit(e.uid), tgt = sim.unit(e.target);
          if (!src || !tgt) break;
          r.onAttack(src, 1);
          if (src.range > 150) {
            const nat = src.activeNature || src.natures?.[0] || null;
            const dur = nat ? this.natureBolt(r.handOf(src), r.chestOf(tgt), nat) : this.kunai(r.handOf(src), r.chestOf(tgt));
            this._attackDelay = { src: src.uid, tgt: tgt.uid, delay: dur };
          } else this._attackDelay = null;
          break;
        }
        case 'damage': {
          if (!u) break;
          const kind = e.kind;
          let delay = 0;
          if (this._ultCtx && e.src === this._ultCtx.uid && kind === 'ult') delay = this._ultCtx.delay;
          else if (this._attackDelay && this._attackDelay.src === e.src && this._attackDelay.tgt === u.uid) delay = this._attackDelay.delay;
          const c = r.chestOf(u);
          const size = kind === 'ult' || kind === 'special' ? 32 : e.crit ? 27 : 20;
          const N = e.relation > 0 ? N_OF(e.nature) : null;
          let color = u.side === 'player' ? '#ffb4b4' : '#ffffff';
          if (N) color = N.light; else if (e.relation < 0) color = '#b8c0c8';
          if (kind === 'reflect') color = '#e5b3ff';
          let tag = null, tagColor = null;
          const now = sim.time; const last = this.lastTag.get(u.uid) || -9;
          if (e.relation !== 0 && now - last > 0.7) { this.lastTag.set(u.uid, now); tag = e.relation > 0 ? 'EFFECTIVE!' : 'resisted'; tagColor = e.relation > 0 ? N.color : '#9aa4ae'; }
          this.number(c.x + (Math.random() * 30 - 15), c.y - 10 * r.unitScale, (e.crit ? '✦' : '') + e.amount.toLocaleString('en-US'), { color, size, tag, tagColor, delay });
          if (e.absorbed > 0) this.number(c.x + 20, c.y + 12, `(${e.absorbed.toLocaleString('en-US')} absorbed)`, { color: '#9ed8ff', size: 13, dur: 0.7, delay });
          const nature = e.nature || (sim.unit(e.src)?.activeNature) || null;
          const power = kind === 'ult' || kind === 'special' ? 1.5 : e.crit ? 0.9 : kind === 'auto' ? 0.45 : 0.6;
          const sigCtx = this._ultCtx && e.src === this._ultCtx.uid && kind === 'ult' ? this._ultCtx : null;
          this.later(delay, () => {
            r.onHit(u, kind === 'ult' || kind === 'special' ? 12 : 7);
            if (sigCtx?.sig?.impact) sigCtx.sig.impact(this, c.x, c.y, power); else this.burst(nature, c.x, c.y, power);
            if (kind === 'ult' || kind === 'special') this.shake(kind === 'ult' ? 10 : 8, 0.3);
            else if (e.crit) this.shake(6, 0.2);
          });
          if (sigCtx && !sigCtx.first) { sigCtx.first = true; if (sigCtx.sig?.dash || (!sigCtx.sig && sim.unit(e.src)?.range <= 150)) this.later(Math.max(0, delay - 0.12), () => { const s = sim.unit(e.src); if (s) { r.onAttack(s, 2.2); this.dashLines(s.x, r.chestOf(s).y, s.side === 'player' ? 1 : -1); } }); }
          break;
        }
        case 'heal': if (u) { const c = r.chestOf(u); this.number(u.x, c.y - 20, '+' + e.amount.toLocaleString('en-US'), { color: '#6dff9f', size: 20 }); for (let i = 0; i < this.n(8); i++) this.emit({ x: u.x + rnd(-24, 24), y: r.unitY(u) - rnd(0, 40), vx: 0, vy: rnd(-70, -30), life: rnd(0.6, 1), size: rnd(2, 4), shape: 'circle', color: pick(['#6dff9f', '#c7ffd8']), add: true }); this.aura(u.uid, '#5fd38a', 0.6); } break;
        case 'miss': if (u) this.number(u.x, r.chestOf(u).y - 20, 'miss', { color: '#c8cdd3', size: 14, dur: 0.6 }); break;
        case 'ult': {
          if (!u) break;
          const sig = signatureFor(e.name);
          const nat = e.nature;
          const delay = sig ? sig.delay : (u.range > 150 ? 0.3 : 0.24);
          this._ultCtx = { uid: u.uid, sig, delay, first: false };
          r.onCast(u, Math.max(0.2, delay));
          const hand = () => r.handOf(u);
          if (sig?.cast) { const item = sig.cast(this, hand, delay + 0.05); if (item) this.later(delay, () => { item.done = true; }); }
          else this.cast(nat, hand, delay + 0.05);
          if (sig?.aura) this.aura(u.uid, sig.aura, 1.2);
          this.ring(u.x, r.chestOf(u).y, N_OF(nat).color, { r1: 90 * r.unitScale, width: 5, dur: 0.35 });
          if (e.ultType === 'heal' || e.ultType === 'buff') for (const a of sim.units) if (a.alive && a.side === u.side) this.later(0.2, () => this.aura(a.uid, e.ultType === 'heal' ? '#5fd38a' : '#ffaa3c', 0.8));
          break;
        }
        case 'shake': this.shake(9 * (e.amount || 1), e.seconds || 0.35); break;
        case 'aoe': this.later(this._ultCtx?.delay || 0, () => this.shockwave(e.x, GROUND_Y - 20, Math.min(1.6, (e.radius || 300) / 240), '#ffffff')); break;
        case 'clash': {
          const caster = sim.unit(e.caster);
          if (u && caster) {
            const a = { get x() { return r.handOf(u).x; }, get y() { return r.handOf(u).y; }, color: N_OF(u.activeNature || u.natures?.[0]).color };
            const b = { get x() { return r.handOf(caster).x; }, get y() { return r.handOf(caster).y; }, color: N_OF(e.nature).color };
            const toward = e.outcome === 'overpower' ? 1 : e.outcome === 'overwhelmed' ? -1 : 0;
            const t0 = this.time; const beam = this.clashBeam(a, b, () => toward * Math.min(0.95, (this.time - t0) * 2), 0.45);
            r.onCast(caster, 0.5);
            this.later(0.45, () => {
              beam.done = true;
              const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
              const col = e.outcome === 'overpower' ? a.color : e.outcome === 'overwhelmed' ? b.color : '#ffffff';
              this.ring(mx, my, col, { r1: 170 * r.unitScale, width: 10, dur: 0.6 }); this.star(mx, my, 60, '#ffffff', 0.2);
              this.burst(e.outcome === 'overpower' ? (u.activeNature || 'None') : e.nature || 'None', mx, my, 1.4);
              this.shake(14, 0.45); this.flash('#ffffff', 0.4, 0.12);
            });
          }
          break;
        }
        case 'jutsuLand': {
          const sig = signatureFor(e.name);
          const caster = sim.unit(e.uid);
          const targets = (e.targets || []).map(id => sim.unit(id)).filter(Boolean);
          r.onCast(caster, 0);
          this._endCast(e.uid);
          if (sig?.land && caster) sig.land(this, caster.x, r.chestOf(caster).y);
          for (const [i, g] of targets.entries()) {
            const c = r.chestOf(g);
            let d = 0;
            if (sig?.travel && caster) d = sig.travel(this, r.handOf(caster), c) + i * 0.02;
            this.later(d, () => { if (sig?.impact) sig.impact(this, c.x, c.y, 1.1); else this.burst(e.nature, c.x, c.y, 1.1); r.onHit(g, 9); });
          }
          this.shake(6, 0.25);
          break;
        }
        case 'telegraph': {
          if (!u) break;
          const sig = signatureFor(e.name);
          r.onCast(u, e.windup || 2);
          const hand = () => r.handOf(u);
          const item = sig?.cast ? sig.cast(this, hand, e.windup || 2) : this.cast(e.nature, hand, e.windup || 2);
          if (item) this.casts.set(u.uid, item);
          if (e.special) this.say(`${u.short || u.name}: ${e.name}`, N_OF(e.nature).color, 1.4);
          break;
        }
        case 'telegraphEnd': { r.onCast(u, 0); this._endCast(e.uid); break; }
        case 'death': if (u) { if (u.isAdd) { this.smoke(u.x, r.unitY(u) - 30, 10); r.vanish(u); } else { r.onKO(u); this.smoke(u.x, r.unitY(u) - 10, 5, '#c9c0b4', 0.4); } } break;
        case 'revive': if (u) { r.onRevive(u); this.ring(u.x, r.chestOf(u).y, '#ffd43b', { r1: 140, width: 7, dur: 0.7 }); this.aura(u.uid, '#ffd43b', 1); this.say(`${u.short || u.name}: ${e.name}!`, '#ffd43b'); } break;
        case 'spawn': if (u && u.isAdd) this.smoke(u.x, r.unitY(u) - 30, 8); break;
        case 'shield': if (u) { this.ring(u.x, r.chestOf(u).y, '#9ed8ff', { r1: 110 }); this.say(`${u.short || u.name}: ${e.name}`, '#9ed8ff'); } break;
        case 'shieldBreak': if (u) { this.number(u.x, r.chestOf(u).y - 30, 'SHIELD BROKEN', { color: '#9ed8ff', size: 18 }); this.crystals(u.x, r.chestOf(u).y, 0.8); } break;
        case 'enrage': if (u) { this.ring(u.x, r.chestOf(u).y, '#ff4d4d', { r1: 160, width: 8 }); this.burst('Fire', u.x, r.chestOf(u).y, 0.8); this.say(`${u.short || u.name}: ${e.name}!`, '#ff6b6b'); this.shake(8, 0.4); } break;
        case 'swap': if (u) { this.ring(u.x, r.chestOf(u).y, N_OF(e.nature).color, { r1: 140, width: 8 }); this.burst(e.nature, u.x, r.chestOf(u).y, 0.7); this.say(`${u.short || u.name} → ${e.nature} Style (${e.name})`, N_OF(e.nature).color); } break;
        case 'reflectWarn': if (u) { this.say(`${u.short || u.name}: ${e.name} — hold your attacks!`, '#e5b3ff', 1.4); this.aura(u.uid, '#e5b3ff', e.windup || 1); } break;
        case 'reflect': if (u) { this.ring(u.x, r.chestOf(u).y, '#ffffff', { r1: 120, width: 5 }); this.aura(u.uid, '#ffffff', e.seconds || 2); } break;
        case 'summon': if (u) { this.smoke(u.x + (u.side === 'enemy' ? 90 : -90), r.unitY(u) - 30, 12); this.say(`${u.short || u.name}: ${e.name}`, '#ffb86b'); } break;
        case 'rally': if (u) { this.say(e.name, '#ffb86b', 1.2); for (const a of sim.units) if (a.alive && a.side === u.side) this.aura(a.uid, '#ffaa3c', 0.8); } break;
        case 'buff': if (u) for (const a of sim.units) if (a.alive && a.side === u.side) { this.aura(a.uid, '#ffaa3c', 0.9); for (let i = 0; i < this.n(6); i++) this.emit({ x: a.x + rnd(-20, 20), y: r.unitY(a) - rnd(0, 50), vy: rnd(-80, -40), life: 0.7, size: 3, shape: 'star', color: '#ffd166', add: true }); } break;
        case 'stun': if (u) { this.number(u.x, r.headOf(u).y - 18, 'STUNNED', { color: '#ffe066', size: 15, dur: 0.8 }); r.onStun(u, e.seconds || 1); } break;
        case 'immune': if (u) this.number(u.x, r.chestOf(u).y - 20, 'immune', { color: '#ffd43b', size: 14, dur: 0.5 }); break;
        default: break;
      }
    }
    this._ultCtx = null; this._attackDelay = null;
  }
  _endCast(uid) { const it = this.casts.get(uid); if (it) { it.done = true; this.casts.delete(uid); } }

  // ---------------------------------------------------------------- loop
  update(dt) {
    this.time += dt;
    this.shakeT = Math.max(0, this.shakeT - dt); if (this.shakeT <= 0) this.shakeMag = 0;
    if (this.timers.length) { const due = []; for (const t of this.timers) { t.t -= dt; if (t.t <= 0) due.push(t); } if (due.length) { this.timers = this.timers.filter(t => t.t > 0); for (const t of due) t.fn(); } }
    for (const p of this.parts) { if (p.delay > 0) { p.delay -= dt; continue; } p.age += dt; p.vy += p.grav * dt; if (p.drag) { p.vx -= p.vx * p.drag * dt; p.vy -= p.vy * p.drag * dt; } p.x += p.vx * dt; p.y += p.vy * dt; if (p.rot != null) p.rot += p.vrot * dt; }
    this.parts = this.parts.filter(p => p.age < p.life);
    for (const it of this.items) it.update(dt);
    this.items = this.items.filter(it => !it.done);
    if (this.announce) { this.announce.t += dt; if (this.announce.t > this.announce.dur) this.announce = null; }
    if (this.auras.size > 40) for (const [k, a] of this.auras) if (a.until < this.time) this.auras.delete(k);
  }
  /** Draw the world-space effects (called inside the camera transform). */
  draw(g) {
    for (const it of this.items) if (it.kind !== 'num' && it.kind !== 'flash') { g.save(); it.draw(g); g.restore(); }
    for (const p of this.parts) if (p.delay <= 0) { g.save(); drawParticle(g, p); g.restore(); }
    for (const it of this.items) if (it.kind === 'num') { g.save(); it.draw(g); g.restore(); }
  }
  /** Draw the screen-space effects (flashes, the announcement plate), outside the camera transform. */
  drawScreen(g) {
    for (const it of this.items) if (it.kind === 'flash') { g.save(); it.draw(g); g.restore(); }
    if (this.announce) {
      const a = this.announce; const p = a.t / a.dur;
      g.save();
      g.globalAlpha = p < 0.1 ? p / 0.1 : p > 0.8 ? (1 - p) / 0.2 : 1;
      const us = Math.min(this.r?.unitScale || 1, 1.8);
      g.font = `${Math.round(26 * us)}px ${FONT_DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const tw = Math.min(W - 40, g.measureText(a.text).width + 50);
      const top = 58, bh = 44 * us;
      g.fillStyle = 'rgba(6,8,12,0.78)'; rr(g, W / 2 - tw / 2, top, tw, bh, 6); g.fill();
      g.fillStyle = a.color; g.fillRect(W / 2 - tw / 2, top, 6, bh);
      g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,0.8)'; g.strokeText(a.text, W / 2 + 3, top + bh / 2, W - 60);
      g.fillStyle = '#ffffff'; g.fillText(a.text, W / 2 + 3, top + bh / 2, W - 60);
      g.restore();
    }
  }
}

export function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/** The nature glyphs used on the plates and pips, drawn in code (mirrors the SVG icon set). */
export function drawGlyph(g, nature, x, y, r) {
  const N = N_OF(nature); g.save(); g.translate(x, y); g.fillStyle = N.color; g.strokeStyle = N.color; g.lineWidth = r * 0.28; g.lineCap = 'round';
  if (nature === 'Fire') { g.beginPath(); g.moveTo(0, -r * 1.1); g.quadraticCurveTo(r * 0.9, -r * 0.2, r * 0.55, r * 0.5); g.quadraticCurveTo(r * 0.3, r * 1.05, 0, r * 1.05); g.quadraticCurveTo(-r * 0.85, r * 0.9, -r * 0.7, r * 0.1); g.quadraticCurveTo(-r * 0.55, -r * 0.4, -r * 0.15, -r * 0.3); g.quadraticCurveTo(-r * 0.25, -r * 0.7, 0, -r * 1.1); g.fill(); }
  else if (nature === 'Wind') { g.beginPath(); g.arc(0, 0, r * 0.95, Math.PI * 0.2, Math.PI * 1.5); g.stroke(); g.beginPath(); g.arc(r * 0.1, 0, r * 0.5, Math.PI * 1.2, Math.PI * 2.4); g.stroke(); }
  else if (nature === 'Lightning') { g.beginPath(); g.moveTo(r * 0.25, -r * 1.05); g.lineTo(-r * 0.6, r * 0.1); g.lineTo(r * 0.05, r * 0.1); g.lineTo(-r * 0.25, r * 1.05); g.lineTo(r * 0.6, -r * 0.15); g.lineTo(-r * 0.05, -r * 0.15); g.closePath(); g.fill(); }
  else if (nature === 'Earth') { g.beginPath(); g.moveTo(-r, r * 0.8); g.lineTo(-r * 0.4, -r * 0.5); g.lineTo(0, r * 0.1); g.lineTo(r * 0.4, -r * 0.9); g.lineTo(r, r * 0.8); g.closePath(); g.fill(); }
  else if (nature === 'Water') { g.beginPath(); g.moveTo(0, -r * 1.05); g.quadraticCurveTo(r * 1.05, r * 0.2, r * 0.05, r * 1.0); g.quadraticCurveTo(-r * 1.05, r * 0.2, 0, -r * 1.05); g.fill(); }
  else { g.beginPath(); g.arc(0, 0, r * 0.75, 0, TAU); g.stroke(); }
  g.restore();
}

function drawParticle(g, p) {
  const k = p.age / p.life;
  const a = p.fade === 'late' ? (k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4) : 1 - k;
  const sz = p.size * (p.grow ? 1 + k * p.grow : 1 - k * 0.35);
  g.globalAlpha = Math.max(0, a) * p.alpha;
  if (p.add) g.globalCompositeOperation = 'lighter';
  g.fillStyle = p.color; g.strokeStyle = p.color;
  const ang = p.rot != null ? p.rot : Math.atan2(p.vy, p.vx);
  switch (p.shape) {
    case 'flame': g.beginPath(); g.moveTo(p.x, p.y - sz * 1.7); g.quadraticCurveTo(p.x + sz * 0.9, p.y - sz * 0.2, p.x, p.y + sz * 0.6); g.quadraticCurveTo(p.x - sz * 0.9, p.y - sz * 0.2, p.x, p.y - sz * 1.7); g.fill(); break;
    case 'arc': g.save(); g.translate(p.x, p.y); g.rotate(ang); g.lineWidth = sz * 0.32; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, sz, -1.1, 1.1); g.stroke(); g.restore(); break;
    case 'bolt': { g.save(); g.translate(p.x, p.y); g.rotate(ang); g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); let px = 0, py = 0; for (let i = 0; i < 4; i++) { px += sz * 0.8; py = (i % 2 ? 1 : -1) * sz * 0.45 * Math.random(); g.lineTo(px, py); } g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 1; g.stroke(); g.restore(); break; }
    case 'rock': { g.save(); g.translate(p.x, p.y); g.rotate(ang); g.beginPath(); for (let i = 0; i < 6; i++) { const aa = (i / 6) * TAU, rr2 = sz * (0.7 + 0.3 * ((i * 7 + 3) % 5) / 5); g.lineTo(Math.cos(aa) * rr2, Math.sin(aa) * rr2 * 0.8); } g.closePath(); g.fill(); g.strokeStyle = 'rgba(20,12,6,0.7)'; g.lineWidth = 1.5; g.stroke(); g.restore(); break; }
    case 'drop': g.save(); g.translate(p.x, p.y); g.rotate(ang); g.beginPath(); g.ellipse(0, 0, sz * 1.6, sz * 0.75, 0, 0, TAU); g.fill(); g.restore(); break;
    case 'line': g.save(); g.translate(p.x, p.y); g.rotate(ang); g.lineWidth = 2; g.beginPath(); g.moveTo(-sz * 2, 0); g.lineTo(sz * 2, 0); g.stroke(); g.restore(); break;
    case 'leaf': g.save(); g.translate(p.x, p.y); g.rotate(ang); g.beginPath(); g.ellipse(0, 0, sz, sz * 0.5, 0, 0, TAU); g.fill(); g.restore(); break;
    case 'star': { g.save(); g.translate(p.x, p.y); g.beginPath(); for (let i = 0; i < 8; i++) { const aa = (i / 8) * TAU, rr2 = i % 2 ? sz * 0.35 : sz; g.lineTo(Math.cos(aa) * rr2, Math.sin(aa) * rr2); } g.closePath(); g.fill(); g.restore(); break; }
    case 'puff': { const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz); gr.addColorStop(0, p.color); gr.addColorStop(1, rgba('#000000', 0)); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, sz, 0, TAU); g.fill(); break; }
    default: g.beginPath(); g.arc(p.x, p.y, Math.max(0.5, sz), 0, TAU); g.fill();
  }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

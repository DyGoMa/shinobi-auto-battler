// mockup/vfx.js — the effects language of the art bible (§5): particle presets per nature,
// the signature techniques shown in the mockup (Rasengan, Chidori, Lightning Blade, Water
// Dragon), the Jutsu Clash beam, floating numbers, rings, flashes and screen shake, and the
// restyled wind-up banner and target zones. Drawn in logical canvas coordinates.
import { W, H, GROUND_Y, rgba, shade } from './stage.js';

export const FONT_DISPLAY = '"Anton", Impact, "Arial Narrow Bold", sans-serif';
export const NATURE = {
  Fire:      { color: '#ff5a36', light: '#ffd166', core: '#fff3b0', dark: '#b3261e' },
  Wind:      { color: '#5fd38a', light: '#c7ffd8', core: '#ffffff', dark: '#1f8a4c' },
  Lightning: { color: '#ffd43b', light: '#fff5b8', core: '#ffffff', dark: '#b8860b' },
  Earth:     { color: '#c08a52', light: '#e8c39a', core: '#f5e6d0', dark: '#6b4423' },
  Water:     { color: '#3fa9f5', light: '#9ed8ff', core: '#ffffff', dark: '#1a5fa3' },
  None:      { color: '#d7dde5', light: '#ffffff', core: '#ffffff', dark: '#7a8590' },
};
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const TAU = Math.PI * 2;

const MAX_PARTS = 420;

export class VFX {
  constructor() { this.parts = []; this.items = []; this.shakeT = 0; this.shakeMag = 0; this.time = 0; }

  // ---------------------------------------------------------------- primitives
  emit(p) { if (this.parts.length < MAX_PARTS) this.parts.push({ age: 0, life: 0.5, size: 6, shape: 'circle', color: '#fff', vx: 0, vy: 0, grav: 0, drag: 0, rot: null, vrot: 0, add: false, alpha: 1, fade: 'linear', grow: 0, ...p }); }
  add(item) { this.items.push(item); return item; }
  shake(mag = 8, dur = 0.3) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeT = Math.max(this.shakeT, dur); }
  shakeOffset() { if (this.shakeT <= 0) return { x: 0, y: 0 }; const m = this.shakeMag * Math.min(1, this.shakeT / 0.3); return { x: (Math.random() * 2 - 1) * m, y: (Math.random() * 2 - 1) * m * 0.6 }; }
  ring(x, y, color, { r0 = 8, r1 = 120, dur = 0.5, width = 6, ellipse = 1 } = {}) { return this.add({ kind: 'ring', x, y, color, r0, r1, dur, width, ellipse, t: 0, update(dt) { this.t += dt; this.done = this.t >= this.dur; }, draw(g) { const p = this.t / this.dur; g.globalAlpha = 1 - p; g.strokeStyle = this.color; g.lineWidth = this.width * (1 - p * 0.6); g.beginPath(); g.ellipse(this.x, this.y, this.r0 + (this.r1 - this.r0) * Math.sqrt(p), (this.r0 + (this.r1 - this.r0) * Math.sqrt(p)) * this.ellipse, 0, 0, TAU); g.stroke(); g.globalAlpha = 1; } }); }
  flash(color = '#ffffff', a = 0.8, dur = 0.12) { return this.add({ kind: 'flash', t: 0, dur, update(dt) { this.t += dt; this.done = this.t >= dur; }, draw(g) { g.globalAlpha = a * (1 - this.t / dur); g.fillStyle = color; g.fillRect(-200, -200, W + 400, H + 400); g.globalAlpha = 1; } }); }
  number(x, y, text, { color = '#ffffff', size = 26, dur = 1.0, tag = null, tagColor = null } = {}) {
    return this.add({ kind: 'num', x, y, text, color, size, dur, tag, tagColor, t: 0, update(dt) { this.t += dt; this.done = this.t >= dur; }, draw(g) {
      const p = this.t / this.dur; const sc = p < 0.12 ? 0.5 + (p / 0.12) * 0.6 : 1.1 - Math.min(0.1, (p - 0.12) * 0.4);
      const yy = this.y - 70 * p * (1.4 - p);
      g.globalAlpha = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
      g.font = `${Math.round(this.size * sc)}px ${FONT_DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 6; g.lineJoin = 'round'; g.strokeStyle = 'rgba(10,8,6,0.85)'; g.strokeText(this.text, this.x, yy); g.fillStyle = this.color; g.fillText(this.text, this.x, yy);
      if (this.tag) { g.font = `${Math.round(this.size * 0.55)}px ${FONT_DISPLAY}`; g.lineWidth = 4; g.strokeText(this.tag, this.x, yy - this.size * 0.75); g.fillStyle = this.tagColor || this.color; g.fillText(this.tag, this.x, yy - this.size * 0.75); }
      g.globalAlpha = 1;
    } });
  }

  // ---------------------------------------------------------------- nature presets
  /** Impact burst at (x, y). power scales the count and reach. */
  burst(nature, x, y, power = 1) {
    const N = NATURE[nature] || NATURE.None;
    const n = (k) => Math.round(k * power);
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
      this.flash('#fff8d0', 0.35 * power, 0.08);
      for (let i = 0; i < n(7); i++) this.emit({ x, y, rot: rnd(0, TAU), life: rnd(0.1, 0.2), size: rnd(12, 20), shape: 'bolt', color: pick([N.color, N.core]), add: true });
      for (let i = 0; i < n(18); i++) { const a = rnd(0, TAU), sp = rnd(240, 440); this.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 320, life: rnd(0.25, 0.4), size: rnd(2, 3.5), shape: 'circle', color: pick([N.color, N.core]), add: true }); }
      this.emit({ x, y, life: 0.16, size: 40 * power, shape: 'star', color: N.core, add: true });
    } else if (nature === 'Earth') {
      for (let i = 0; i < n(16); i++) { const a = rnd(-Math.PI * 0.9, -Math.PI * 0.1), sp = rnd(140, 320); this.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 760, rot: rnd(0, TAU), vrot: rnd(-6, 6), life: rnd(0.6, 0.95), size: rnd(5, 10), shape: 'rock', color: pick([N.color, '#8a5a2b', '#5a3a1a']), fade: 'late' }); }
      for (let i = 0; i < n(7); i++) this.emit({ x: x + rnd(-20, 20), y: y + 6, vx: rnd(-60, 60), vy: rnd(-40, -10), life: rnd(0.5, 0.8), size: rnd(12, 18), shape: 'puff', color: '#a08060', alpha: 0.45, grow: 2 });
      this.ring(x, y + 30, N.dark, { r1: 80 * power, width: 6, dur: 0.35, ellipse: 0.35 });
    } else if (nature === 'Water') {
      for (let i = 0; i < n(22); i++) { const a = rnd(-Math.PI * 0.95, -Math.PI * 0.05), sp = rnd(150, 330); this.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 640, life: rnd(0.45, 0.8), size: rnd(3.5, 6.5), shape: 'drop', color: pick([N.color, N.light, N.core]) }); }
      for (let i = 0; i < n(5); i++) this.emit({ x: x + rnd(-16, 16), y: y, vx: rnd(-30, 30), vy: rnd(-50, -20), life: rnd(0.5, 0.8), size: rnd(12, 18), shape: 'puff', color: '#bfe4ff', alpha: 0.35, grow: 1.6 });
      this.ring(x, y + 26, N.light, { r1: 90 * power, width: 5, dur: 0.4, ellipse: 0.32 });
    } else {
      for (let i = 0; i < n(10); i++) { const a = rnd(0, TAU), sp = rnd(260, 420); this.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 3, life: rnd(0.15, 0.25), size: rnd(8, 14), shape: 'line', color: N.core, add: true }); }
      for (let i = 0; i < n(5); i++) this.emit({ x: x + rnd(-14, 14), y: y + 10, vx: rnd(-40, 40), vy: rnd(-30, -10), life: rnd(0.4, 0.6), size: rnd(10, 14), shape: 'puff', color: '#c9c0b4', alpha: 0.35, grow: 1.5 });
      this.emit({ x, y, life: 0.14, size: 34 * power, shape: 'star', color: N.core, add: true });
    }
  }

  /** A charge-up around a point for `dur` seconds (the caster's hand or chest). Returns the emitter item. */
  cast(nature, getPos, dur = 1.2) {
    const N = NATURE[nature] || NATURE.None; const vfx = this;
    return this.add({ kind: 'cast', t: 0, dur, acc: 0, update(dt) {
      this.t += dt; this.done = this.t >= dur; this.acc += dt; const { x, y } = getPos();
      while (this.acc > 0.03) {
        this.acc -= 0.03; const a = rnd(0, TAU), r = rnd(22, 40);
        if (nature === 'Fire') vfx.emit({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.6 + 10, vx: -Math.cos(a) * 30, vy: rnd(-110, -60), life: rnd(0.4, 0.7), size: rnd(2, 4), shape: 'circle', color: pick([N.color, N.light]), add: true });
        else if (nature === 'Wind') vfx.emit({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, vx: -Math.sin(a) * 160, vy: Math.cos(a) * 160, drag: 1, life: 0.35, size: rnd(8, 12), shape: 'arc', color: pick([N.color, N.light]), add: true });
        else if (nature === 'Lightning') { vfx.emit({ x: x + rnd(-14, 14), y: y + rnd(-14, 14), rot: rnd(0, TAU), life: rnd(0.06, 0.12), size: rnd(8, 14), shape: 'bolt', color: pick([N.color, N.core]), add: true }); if (Math.random() < 0.4) vfx.emit({ x, y, vx: rnd(-160, 160), vy: rnd(-160, 60), grav: 300, life: 0.25, size: 2, shape: 'circle', color: N.core, add: true }); }
        else if (nature === 'Earth') vfx.emit({ x: x + rnd(-30, 30), y: y + 40, vx: 0, vy: rnd(-90, -40), grav: -30, rot: rnd(0, TAU), vrot: rnd(-4, 4), life: rnd(0.5, 0.8), size: rnd(3, 6), shape: 'rock', color: pick([N.color, '#8a5a2b']) });
        else if (nature === 'Water') vfx.emit({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.7, vx: -Math.sin(a) * 120, vy: Math.cos(a) * 80, life: 0.4, size: rnd(3, 5), shape: 'drop', color: pick([N.color, N.light]) });
        else vfx.emit({ x: x + rnd(-20, 20), y: y + rnd(-20, 20), vx: rnd(-40, 40), vy: rnd(-80, -30), life: 0.3, size: 6, shape: 'line', color: N.core, add: true });
      }
    }, draw(g) { const { x, y } = getPos(); const p = 0.5 + 0.5 * Math.sin(this.t * 14); g.globalAlpha = 0.25 + 0.25 * p; g.strokeStyle = N.color; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y + 48, 40 + p * 6, 12 + p * 2, 0, 0, TAU); g.stroke(); g.globalAlpha = 1; } });
  }

  // ---------------------------------------------------------------- signature techniques
  /** A Rasengan orb at a hand: `getPos()` → {x, y}. r grows over `charge` seconds. */
  rasengan(getPos, { r = 14, charge = 0.5, color = '#3fa9f5' } = {}) {
    const vfx = this; const N = NATURE.Water;
    return this.add({ kind: 'rasengan', t: 0, spin: 0, acc: 0, update(dt) { this.t += dt; this.spin += dt * 14; this.acc += dt; const { x, y } = getPos(); while (this.acc > 0.04) { this.acc -= 0.04; const a = rnd(0, TAU); vfx.emit({ x: x + Math.cos(a) * 26, y: y + Math.sin(a) * 26, vx: -Math.cos(a) * 90, vy: -Math.sin(a) * 90, life: 0.28, size: 6, shape: 'arc', color: pick([N.light, N.core]), add: true }); } }, draw(g) {
      const { x, y } = getPos(); const k = Math.min(1, this.t / charge); const rr = r * (0.3 + 0.7 * k);
      g.save(); g.globalCompositeOperation = 'lighter';
      const gl = g.createRadialGradient(x, y, rr * 0.5, x, y, rr * 3); gl.addColorStop(0, rgba(color, 0.55)); gl.addColorStop(1, rgba(color, 0)); g.fillStyle = gl; g.beginPath(); g.arc(x, y, rr * 3, 0, TAU); g.fill();
      g.restore();
      const sp = g.createRadialGradient(x - rr * 0.3, y - rr * 0.3, rr * 0.1, x, y, rr); sp.addColorStop(0, '#ffffff'); sp.addColorStop(0.5, N.light); sp.addColorStop(1, color); g.fillStyle = sp; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x, y, rr * 0.95, rr * 0.35, this.spin + i * 1.05, 0, TAU); g.stroke(); }
      g.strokeStyle = rgba(N.dark, 0.7); g.lineWidth = 2; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.stroke();
    } });
  }
  /** Rasengan impact: the spiral drill and a wind burst. */
  rasenganImpact(x, y, power = 1) {
    const N = NATURE.Water; const vfx = this;
    this.add({ kind: 'spiral', t: 0, dur: 0.5, update(dt) { this.t += dt; this.done = this.t >= this.dur; }, draw(g) { const p = this.t / this.dur; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - p; g.strokeStyle = N.light; g.lineWidth = 6 * (1 - p * 0.5); for (let i = 0; i < 3; i++) { g.beginPath(); for (let k = 0; k < 40; k++) { const a = k * 0.25 + i * 2.1 + p * 6, rr = (k * 4 + 10) * (0.4 + p * 1.6) * power; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; if (k === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke(); } g.restore(); } });
    this.burst('Wind', x, y, power); this.ring(x, y, '#ffffff', { r1: 150 * power, width: 8, dur: 0.45 }); this.flash('#dff4ff', 0.35, 0.1);
    for (let i = 0; i < 14; i++) { const a = rnd(0, TAU), sp = rnd(180, 340); vfx.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 2, life: rnd(0.3, 0.5), size: rnd(4, 8), shape: 'circle', color: pick([N.color, N.light]), add: true }); }
  }
  /** Crackling lightning in a hand (Chidori, Lightning Blade). */
  lightningHand(getPos, { color = '#dff6ff', size = 22 } = {}) {
    const vfx = this;
    return this.add({ kind: 'lhand', t: 0, acc: 0, update(dt) { this.t += dt; this.acc += dt; const { x, y } = getPos(); while (this.acc > 0.05) { this.acc -= 0.05; vfx.emit({ x, y, vx: rnd(-140, 140), vy: rnd(-140, 100), grav: 260, life: 0.22, size: 2, shape: 'circle', color: '#ffffff', add: true }); } }, draw(g) {
      const { x, y } = getPos(); g.save(); g.globalCompositeOperation = 'lighter';
      const gl = g.createRadialGradient(x, y, 2, x, y, size * 1.8); gl.addColorStop(0, rgba(color, 0.7)); gl.addColorStop(1, rgba(color, 0)); g.fillStyle = gl; g.beginPath(); g.arc(x, y, size * 1.8, 0, TAU); g.fill();
      g.strokeStyle = color; g.lineWidth = 2.2; for (let i = 0; i < 5; i++) { let px = x, py = y; const a = rnd(0, TAU); g.beginPath(); g.moveTo(px, py); for (let k = 0; k < 4; k++) { px += Math.cos(a + rnd(-0.7, 0.7)) * size * 0.45; py += Math.sin(a + rnd(-0.7, 0.7)) * size * 0.45; g.lineTo(px, py); } g.stroke(); }
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, size * 0.28, 0, TAU); g.fill(); g.restore();
    } });
  }
  /** Chidori Stream: bolts radiating from the caster across the ground. */
  chidoriStream(x, y, dur = 0.7) {
    const vfx = this;
    return this.add({ kind: 'stream', t: 0, dur, update(dt) { this.t += dt; this.done = this.t >= dur; if (Math.random() < 0.6) vfx.emit({ x: x + rnd(-200, 200), y: GROUND_Y + rnd(-10, 30), vx: rnd(-60, 60), vy: rnd(-200, -80), grav: 400, life: 0.3, size: 2, shape: 'circle', color: '#fff', add: true }); }, draw(g) {
      const p = this.t / this.dur; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = p < 0.8 ? 1 : 1 - (p - 0.8) / 0.2;
      g.strokeStyle = '#cfefff'; g.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + Math.sin(this.t * 30 + i) * 0.1; const len = (140 + (i % 3) * 60) * Math.min(1, p * 3); let px = x, py = y; g.beginPath(); g.moveTo(px, py); for (let k = 1; k <= 5; k++) { px = x + Math.cos(a) * len * (k / 5) + rnd(-10, 10); py = y + Math.sin(a) * len * (k / 5) * 0.45 + rnd(-8, 8); g.lineTo(px, py); } g.stroke(); }
      const gl = g.createRadialGradient(x, y, 10, x, y, 90); gl.addColorStop(0, 'rgba(220,245,255,0.6)'); gl.addColorStop(1, 'rgba(220,245,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, 90, 0, TAU); g.fill(); g.restore();
    } });
  }
  /** Water Style: Water Dragon Jutsu from (x0,y0) to (x1,y1) over `dur` s, then a splash. */
  waterDragon(x0, y0, x1, y1, dur = 0.9) {
    const vfx = this; const N = NATURE.Water;
    const cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - 220;
    const at = (t) => ({ x: (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, y: (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1 });
    return this.add({ kind: 'dragon', t: 0, dur, hit: false, update(dt) { this.t += dt; const p = this.t / dur; if (p >= 1 && !this.hit) { this.hit = true; vfx.burst('Water', x1, y1 - 10, 1.6); vfx.shake(9, 0.35); } this.done = p >= 1.35; const h = at(Math.min(1, p)); if (p < 1 && Math.random() < 0.7) vfx.emit({ x: h.x, y: h.y, vx: rnd(-40, 40), vy: rnd(-60, 20), grav: 300, life: 0.4, size: rnd(2, 4), shape: 'drop', color: pick([N.light, N.core]) }); }, draw(g) {
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
  }
  /** The Jutsu Clash beam between two jutsu; `bias()` in −1..1 moves the meeting point toward B (positive) or A. */
  clashBeam(a, b, bias = () => 0) {
    const vfx = this;
    return this.add({ kind: 'clash', t: 0, update(dt) { this.t += dt; const k = 0.5 + bias() * 0.32; const px = a.x + (b.x - a.x) * k, py = a.y + (b.y - a.y) * k; for (let i = 0; i < 3; i++) { const ang = rnd(0, TAU), sp = rnd(120, 300); vfx.emit({ x: px, y: py, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, grav: 200, life: rnd(0.2, 0.45), size: rnd(2, 4), shape: 'circle', color: pick([a.color, b.color, '#ffffff']), add: true }); } }, draw(g) {
      const k = 0.5 + bias() * 0.32; const px = a.x + (b.x - a.x) * k, py = a.y + (b.y - a.y) * k;
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      const beam = (from, to, color) => { const w = 16 + Math.sin(this.t * 40) * 3; for (let i = 0; i < 3; i++) { const off = Math.sin(this.t * 25 + i * 2) * 5; g.strokeStyle = i === 2 ? '#ffffff' : color; g.lineWidth = i === 2 ? w * 0.3 : w * (1 - i * 0.25); g.globalAlpha = i === 0 ? 0.55 : 0.9; g.beginPath(); g.moveTo(from.x, from.y + off); g.quadraticCurveTo((from.x + to.x) / 2, (from.y + to.y) / 2 + off * 2, to.x, to.y); g.stroke(); } };
      beam(a, { x: px, y: py }, a.color); beam(b, { x: px, y: py }, b.color);
      g.globalAlpha = 1; const gl = g.createRadialGradient(px, py, 4, px, py, 60); gl.addColorStop(0, 'rgba(255,255,255,0.95)'); gl.addColorStop(0.4, 'rgba(255,255,255,0.4)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(px, py, 60, 0, TAU); g.fill();
      g.restore();
    } });
  }

  // ---------------------------------------------------------------- HUD drawn on the canvas
  /** The wind-up banner: a dark plate with a nature edge, a glyph, the jutsu name and a progress line. */
  drawTelegraph(g, { x, y, name, nature, p, scale = 1, clashable = true }) {
    const N = NATURE[nature] || NATURE.None; const us = scale;
    g.save(); g.font = `${Math.round(17 * us)}px ${FONT_DISPLAY}`; g.textBaseline = 'middle';
    const need = g.measureText(name).width + 40 * us + (clashable ? 52 * us : 12 * us);
    const tw = Math.min(W - 16, Math.max(150 * us, need)), bh = 36 * us;
    const bx = Math.max(8, Math.min(W - tw - 8, x - tw / 2)), by = y - bh;
    g.fillStyle = 'rgba(12,12,16,0.88)'; rr(g, bx, by, tw, bh, 6 * us); g.fill();
    g.fillStyle = N.color; g.fillRect(bx, by, 6 * us, bh);
    drawGlyph(g, nature, bx + 20 * us, by + bh / 2, 8 * us);
    g.fillStyle = '#ffffff'; g.textAlign = 'left'; g.fillText((clashable ? '' : '') + name, bx + 34 * us, by + bh / 2 - 1);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(bx + 6 * us, by + bh - 4 * us, tw - 6 * us, 4 * us);
    g.fillStyle = N.color; g.fillRect(bx + 6 * us, by + bh - 4 * us, (tw - 6 * us) * p, 4 * us);
    if (clashable) { g.fillStyle = N.light; g.font = `${Math.round(11 * us)}px ${FONT_DISPLAY}`; g.textAlign = 'right'; g.fillText('CLASH', bx + tw - 8 * us, by + bh / 2 - 1); }
    g.restore();
  }
  /** Target zone on the ground under a threatened unit (y = the unit's feet, us = the unit scale). */
  drawZone(g, x, y, nature, p, t, us = 1) {
    const N = NATURE[nature] || NATURE.None; const pulse = 0.5 + 0.5 * Math.sin(t * 12); const rx = 30 * us, ry = 9 * us;
    g.save(); g.globalAlpha = 0.16 + 0.2 * p * pulse; g.fillStyle = N.color; g.beginPath(); g.ellipse(x, y + 4, rx, ry, 0, 0, TAU); g.fill();
    g.globalAlpha = 0.9; g.strokeStyle = N.color; g.lineWidth = 2 * us; g.setLineDash([8 * us, 5 * us]); g.lineDashOffset = -t * 40; g.beginPath(); g.ellipse(x, y + 4, rx * (1.25 - p * 0.25), ry * (1.25 - p * 0.25), 0, 0, TAU); g.stroke();
    g.restore();
  }

  // ---------------------------------------------------------------- loop
  update(dt) {
    this.time += dt;
    this.shakeT = Math.max(0, this.shakeT - dt); if (this.shakeT <= 0) this.shakeMag = 0;
    for (const p of this.parts) { p.age += dt; p.vy += p.grav * dt; if (p.drag) { p.vx -= p.vx * p.drag * dt; p.vy -= p.vy * p.drag * dt; } p.x += p.vx * dt; p.y += p.vy * dt; if (p.rot != null) p.rot += p.vrot * dt; }
    this.parts = this.parts.filter(p => p.age < p.life);
    for (const it of this.items) it.update(dt);
    this.items = this.items.filter(it => !it.done);
  }
  draw(g) {
    for (const it of this.items) if (it.kind !== 'num' && it.kind !== 'flash') { g.save(); it.draw(g); g.restore(); }
    for (const p of this.parts) { g.save(); drawParticle(g, p); g.restore(); }
    for (const it of this.items) if (it.kind === 'num' || it.kind === 'flash') { g.save(); it.draw(g); g.restore(); }
  }
}

export function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/** The nature glyphs used on chips, pips and banners, drawn in code (mirrors the SVG icon set). */
export function drawGlyph(g, nature, x, y, r) {
  const N = NATURE[nature] || NATURE.None; g.save(); g.translate(x, y); g.fillStyle = N.color; g.strokeStyle = N.color; g.lineWidth = r * 0.28; g.lineCap = 'round';
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

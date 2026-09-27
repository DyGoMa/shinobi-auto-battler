// Renderer.js — draws a BattleSim on a 1280×720 logical canvas, scaled by devicePixelRatio and
// letterboxed into its container: the arc's parallax stage (js/render/Stage.js), the units as
// code-drawn figures or sprite images (js/render/Figure.js, js/render/Assets.js), the unit bars,
// the wind-up plates and target zones, and the effects on top (js/render/Effects.js). It keeps
// a little visual state per unit (lunge, flash, cast, KO) that the effects module drives from
// the sim's events; the sim itself is never touched.
import { W as SW, H as SH, GROUND_Y as SGY, Stage, stageFromTheme, rgba } from './Stage.js';
import { drawFigure, lookFor } from './Figure.js';
import * as Assets from './Assets.js';
import { statureOf } from '../core/stature.js';
import { NATURE, FONT_DISPLAY, drawGlyph, rr } from './Effects.js';

export const W = SW, H = SH, GROUND_Y = SGY;
export const NATURE_COLORS = { Fire: '#ff5a36', Wind: '#5fd38a', Lightning: '#ffd43b', Earth: '#c08a52', Water: '#3fa9f5' };
export const NEUTRAL_COLOR = '#d7dde5';
export const TIER_COLORS = { genin: '#a3aebb', chunin: '#4dabf7', jonin: '#b388ff', kage: '#ffc53d' };
// Fighters are drawn 40% bigger than the lane's own scale, and each side alternates between two
// rows so a 4-person team does not pile up (the lane spacing, which is gameplay, is unchanged).
// Phone portrait: the whole 1280-wide lane must stay visible, so it renders at ~0.3x; units (and
// their bars and numbers) grow further there, so a head stays about PHONE_HEAD_PX CSS px wide, up
// to MAX_UNIT_SCALE (a 40% boost on top of the phone's own 2.6 put a boss's head off the stage).
// MAX_BIG keeps the tallest figure (a giant) inside the stage.
const UNIT_BOOST = 1.4;
const PHONE_HEAD_PX = 35, PHONE_MAX_CANVAS_PX = 700, MAX_UNIT_SCALE = 3.0, HEAD_D = 34, MAX_BIG = 5.4;
const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function natureColor(n) { return NATURE_COLORS[n] || NEUTRAL_COLOR; }
/** Pick black/white text for a background colour. */
export function inkFor(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#141a22' : '#f5f8fb';
}
export function shade(hex, amt) {
  const c = hex.replace('#', '');
  const f = (i) => Math.max(0, Math.min(255, Math.round(parseInt(c.slice(i, i + 2), 16) * (1 + amt))));
  return `rgb(${f(0)},${f(2)},${f(4)})`;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1; this.cssScale = 1;
    this.stage = null; this.C = null; this.era = 'p1'; this.level = 'medium'; this.reduced = false;
    this.vis = new Map();   // uid -> visual state
    this.looks = new Map(); // unit key -> look
    this.t = 0;
    this.unitScale = 1;     // UNIT_BOOST, more on phone portrait (see resize)
    this.statures = new Map();   // unit key|era → its canon height (statureOf)
    this.cam = { x: 0, zoom: 1 }; this.camTarget = { x: 0, zoom: 1 }; this.camX = 0;
    this.dim = 0;
  }

  /** The battle's stage, era and content (for looks and sprites), and the effect settings. */
  setup({ stage = null, theme = null, C = null, era = 'p1', level = 'medium', reduced = false } = {}) {
    this.stage = new Stage(stage || stageFromTheme(theme, era));
    this.C = C; this.era = era; this.level = level; this.reduced = !!reduced;
    this.reset();
  }
  /** The old call: a generic stage from an arc theme. */
  setTheme(theme) { this.stage = new Stage(stageFromTheme(theme, this.era)); }
  /** A new sim on the same canvas: forget the unit states, reset the camera. */
  reset() { this.vis.clear(); this.cam = { x: 0, zoom: 1 }; this.camTarget = { x: 0, zoom: 1 }; this.camX = 0; }

  /** Fit a 16:9 canvas inside (cw × ch) CSS pixels, crisp at devicePixelRatio. */
  resize(cw, ch) {
    const s = Math.max(0.1, Math.min(cw / W, ch / H));
    const cssW = Math.floor(W * s), cssH = Math.floor(H * s);
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    const pw = Math.max(1, Math.round(cssW * dpr)), ph = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width !== pw || this.canvas.height !== ph) { this.canvas.width = pw; this.canvas.height = ph; }
    this.scale = pw / W;
    this.cssScale = s;
    const phonePortrait = window.innerHeight > window.innerWidth && cssW < PHONE_MAX_CANVAS_PX;
    this.unitScale = phonePortrait ? clamp(PHONE_HEAD_PX / (HEAD_D * s), UNIT_BOOST, MAX_UNIT_SCALE) : UNIT_BOOST;
  }

  // ---------------------------------------------------------------- unit geometry (for Effects)
  /** Vertical offset of a unit from the ground line: each side alternates between two rows,
   *  and each side's front unit starts on a different row. */
  depthOf(u) {
    const v = this._vis(u);
    if (this.unitScale <= 1) return v.depth;
    const front = (v.slot % 2 === 0) === (u.side === 'player');
    return (front ? 1 : -1) * 22 * this.unitScale;
  }
  unitY(u) { return GROUND_Y + this.depthOf(u); }
  big(u) { return Math.min(MAX_BIG, this.unitScale * this.statureOf(u).scale); }
  /** The unit's canon height (js/core/stature.js): its own row, the art it reuses, or the ninja it is based on. */
  statureOf(u) {
    const k = u.key + '|' + this.era;
    let st = this.statures.get(k);
    if (!st) { st = statureOf(u.key, this.era || 'p1', { reuse: Assets.reusedId, basedOn: this.C?.enemy?.[u.key]?.basedOn || null }); this.statures.set(k, st); }
    return st;
  }
  facing(u) { return u.side === 'player' ? 1 : -1; }
  handOf(u) { const v = this._vis(u); return { x: u.x + v.knock + this.facing(u) * (30 + v.lunge * 14) * this.big(u), y: this.unitY(u) - 50 * this.big(u) }; }
  chestOf(u) { return { x: u.x + this._vis(u).knock, y: this.unitY(u) - 44 * this.big(u) }; }
  headOf(u) { return { x: u.x + this._vis(u).knock, y: this.unitY(u) - 76 * this.big(u) }; }

  _vis(u) {
    let v = this.vis.get(u.uid);
    if (!v) {
      let slot = 0; for (const o of this.vis.values()) if (o.side === u.side) slot++;   // order of appearance on its side
      v = { lunge: 0, lungeAmp: 1, flash: 0, cast: 0, castUntil: 0, ko: 0, dying: false, gone: false, hidden: false, knock: 0, lean: 0, walk: 0, walking: false, lastX: u.x, stun: 0, hpShown: null, depth: ((u.uid * 37) % 3 - 1) * 7, phase: Math.random() * 6.28, side: u.side, slot };
      this.vis.set(u.uid, v);
    }
    return v;
  }
  lookOf(u) {
    let look = this.looks.get(u.key);
    if (!look) {
      const def = this.C?.enemy?.[u.key] || this.C?.char?.[u.key] || { id: u.key, name: u.name, color: u.color, initials: u.initials, role: u.role };
      look = lookFor(def, this.C);
      this.looks.set(u.key, look);
    }
    return look;
  }
  spriteOf(u) { const p = Assets.spritePath(u.key, this.era); return p ? Assets.image(p) : null; }
  figOf(u) { return Assets.figureOf(Assets.spritePath(u.key, this.era)); }

  // ---------------------------------------------------------------- visual reactions (called by Effects)
  onAttack(u, amp = 1) { const v = this._vis(u); v.lunge = 1; v.lungeAmp = amp; }
  onHit(u, knock = 7) { const v = this._vis(u); v.flash = 1; v.knock -= this.facing(u) * knock * (0.5 + this.unitScale * 0.5); }
  onCast(u, seconds) { if (!u) return; const v = this._vis(u); v.castUntil = seconds > 0 ? this.t + seconds : 0; }
  onKO(u) { const v = this._vis(u); v.dying = true; }
  vanish(u) { const v = this._vis(u); v.gone = true; v.ko = 1; }
  onRevive(u) { const v = this._vis(u); v.dying = false; v.gone = false; v.ko = 0; v.flash = 1; }
  onStun(u, seconds) { this._vis(u).stun = Math.max(this._vis(u).stun, seconds); }
  hide(u, hidden) { this._vis(u).hidden = hidden; }
  /** Camera: zoom around the fight, and a pan (logical px). Smoothed in draw(). */
  camPush(zoom = 1, x = 0) { this.camTarget = { zoom, x }; }

  // ---------------------------------------------------------------- draw
  /** dt: the (time-scaled) seconds since the last frame; opts.dim darkens the stage (dialogue). */
  draw(sim, effects, dt, { dim = 0 } = {}) {
    const g = this.ctx;
    this.t += dt;
    if (!this.stage) this.stage = new Stage(stageFromTheme(null, this.era));
    // camera
    this.cam.zoom = lerp(this.cam.zoom, this.camTarget.zoom, Math.min(1, dt * 3.5));
    this.camX = lerp(this.camX, this.camTarget.x, Math.min(1, dt * 3));
    this.cam.x = (this.reduced ? 0 : Math.sin(this.t * 0.35) * 8) + this.camX;
    const sh = effects && !this.reduced ? effects.shakeOffset() : { x: 0, y: 0 };
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    g.setTransform(this.scale, 0, 0, this.scale, sh.x * this.scale, sh.y * this.scale);
    this.stage.draw(g, dt, this.cam, dim, this.level !== 'low');
    if (!sim) { if (effects) effects.drawScreen(g); return; }
    g.save();
    const fx = W / 2, fy = GROUND_Y - 130;
    g.translate(fx, fy); g.scale(this.cam.zoom, this.cam.zoom); g.translate(-fx - this.cam.x, -fy);
    const us = this.unitScale;
    // per-unit visual state
    for (const u of sim.units) {
      const v = this._vis(u);
      v.lunge = Math.max(0, v.lunge - dt * 3.2); v.flash = Math.max(0, v.flash - dt * 7); v.stun = Math.max(0, v.stun - dt);
      v.knock = Math.abs(v.knock) < 0.3 ? 0 : v.knock * Math.max(0, 1 - dt * 9);
      const casting = v.castUntil > this.t || (u.casting && sim.telegraphs.some(t => t.caster === u.uid));
      v.cast = casting ? Math.min(1, v.cast + dt * 6) : Math.max(0, v.cast - dt * 6);
      const moved = Math.abs(u.x - v.lastX) > 0.05; v.lastX = u.x;
      if (moved) { v.walk += dt * 15; v.walking = true; } else v.walking = false;
      v.lean = lerp(v.lean, v.lunge > 0.5 ? 12 * v.lungeAmp : 0, Math.min(1, dt * 10));
      if (!u.alive && !v.gone) { if (!v.dying) v.dying = true; v.ko = Math.min(1, v.ko + dt * 2.2); }
      if (u.alive && v.dying) { v.dying = false; v.ko = 0; v.gone = false; }
    }
    // target zones under the threatened units
    for (const t of sim.telegraphs) {
      const caster = sim.unit(t.caster); if (!caster || !caster.alive) continue;
      const p = clamp((sim.time - t.startedAt) / Math.max(0.01, t.endsAt - t.startedAt), 0, 1);
      for (const tg of this._threatened(sim, t, caster)) if (tg.alive) effects.drawZone(g, tg.x, this.unitY(tg), t.nature, p, this.t, us);
    }
    // units back to front
    const units = sim.units.filter(u => { const v = this._vis(u); return !v.hidden && !(v.gone || v.ko >= 1); }).sort((a, b) => this.unitY(a) - this.unitY(b));
    for (const u of units) this._drawUnit(u, sim, effects);
    for (const u of units) if (u.alive) this._drawHud(u, sim);
    for (const t of sim.telegraphs) {
      const c = sim.unit(t.caster); if (!c || !c.alive) continue;
      const p = clamp((sim.time - t.startedAt) / Math.max(0.01, t.endsAt - t.startedAt), 0, 1);
      effects.drawTelegraph(g, { x: c.x, y: this.headOf(c).y - 30 * us, name: t.name, nature: t.nature, p, scale: Math.min(us, 1.8), clashable: !!(t.clashable && sim.clashEnabled) });
    }
    if (effects) effects.draw(g);
    g.restore();
    if (effects) effects.drawScreen(g);
  }

  /** The units a telegraph will hit (mirrors the sim's targeting for the zones only). */
  _threatened(sim, t, caster) {
    const foes = sim.units.filter(o => o.alive && o.side !== caster.side);
    if (t.forceTarget) { const gu = sim.unit(t.forceTarget); return gu ? [gu] : []; }
    if (t.kind === 'jutsu' && t.type === 'single') { const gu = sim.unit(t.target); return gu ? [gu] : []; }
    if (t.kind === 'jutsu') { const gu = sim.unit(t.target); if (!gu) return []; const r = sim.B.combat.ult.aoeRadius; return foes.filter(o => Math.abs(o.x - gu.x) <= r); }
    const sorted = foes.slice().sort((a, b) => (caster.side === 'enemy' ? b.x - a.x : a.x - b.x));
    if (t.targetMode === 'front') return sorted.slice(0, 2);
    if (t.targetMode === 'back') return sorted.slice(-2);
    return sorted;
  }

  _drawUnit(u, sim, effects) {
    const g = this.ctx;
    const v = this._vis(u);
    const look = this.lookOf(u);
    const us = this.unitScale;
    const y = this.unitY(u);
    const enraged = u.permAtk > 1.01;
    const aura = (effects && effects.auraOf(u.uid)) || (enraged ? '#ff4d4d' : u.statuses?.some(s => s.type === 'atkBuff' && s.until > sim.time) ? '#ffaa3c' : null);
    const nat = u.activeNature;
    g.save();
    if (sim.time < u.invulnUntil) g.globalAlpha *= 0.55 + 0.3 * Math.sin(this.t * 30);
    const geo = drawFigure(g, look, {
      x: u.x + v.knock, y, facing: this.facing(u), scale: us, boss: u.isBoss, add: u.isAdd, t: this.t, phase: v.phase,
      walking: v.walking, walk: v.walk, lunge: v.lunge * v.lungeAmp, lean: v.lean, flash: v.flash, cast: v.cast, ko: v.ko,
      aura, scarf: nat ? NATURE[nat].color : (u.taijutsu ? '#f1f3f5' : null), expression: u.side === 'enemy' ? 'menace' : 'set',
      sprite: this.spriteOf(u), fig: this.figOf(u), stature: this.statureOf(u).scale,
    });
    g.restore();
    v.geo = geo;
    if (!u.alive) return;
    const big = this.big(u); const headY = this.headOf(u).y; const x = u.x + v.knock;
    // protect marker
    if (u.protected) { g.save(); g.strokeStyle = '#3ddc84'; g.lineWidth = 3; g.setLineDash([6, 5]); g.beginPath(); g.arc(x, headY, 20 * big + 8, 0, TAU); g.stroke(); g.restore(); }
    // stun stars
    if (v.stun > 0 || u.statuses?.some(s => s.type === 'stun' && s.until > sim.time)) {
      g.save(); g.fillStyle = '#ffe066';
      for (let i = 0; i < 3; i++) { const a = this.t * 5 + i * 2.1; star(g, x + Math.cos(a) * 24 * us, headY - 14 * big + Math.sin(a) * 5 * us, 5 * us); }
      g.restore();
    }
    // taunt ring
    if (u.statuses?.some(s => s.type === 'taunt' && s.until > sim.time)) { g.save(); g.strokeStyle = 'rgba(255,90,90,0.9)'; g.lineWidth = 3; g.beginPath(); g.arc(x, headY + 30 * big, 44 * big + Math.sin(this.t * 10) * 3, 0, TAU); g.stroke(); g.restore(); }
    // reflect hexagon
    if (u.reflectUntil > sim.time) { g.save(); g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 6; i++) { const a = this.t * 6 + i * Math.PI / 3; const px = x + Math.cos(a) * 52 * big, py = headY + 30 * big + Math.sin(a) * 52 * big; if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke(); g.restore(); }
    // absorb shield bubble
    if (u.shield > 0) { g.save(); g.fillStyle = 'rgba(120,200,255,0.16)'; g.strokeStyle = 'rgba(150,220,255,0.85)'; g.lineWidth = 2; g.beginPath(); g.arc(x, headY + 28 * big, 50 * big, 0, TAU); g.fill(); g.stroke(); g.restore(); }
  }

  _drawHud(u, sim) {
    const g = this.ctx;
    const us = this.unitScale, big = this.big(u), y = this.unitY(u), v = this._vis(u);
    // The front row's bars go under its feet so they don't cover the back row.
    const frontRow = us > 1 && this.depthOf(u) > 0;
    const top = frontRow ? y + 12 * us : y - 34 * big - 50 * big - 20 * us;
    // Bars grow with the unit, but not past the gap to the next ally on the same row.
    const w = Math.min((u.isBoss ? 120 : 60) * us, u.isBoss ? 240 : 104), h = (u.isBoss ? 9 : 7) * us;
    const x = u.x - w / 2;
    const pct = Math.max(0, u.hp / u.maxHp);
    // A boss's bar fills in over its intro (visual only).
    if (v.hpShown == null) v.hpShown = pct; else v.hpShown = pct < v.hpShown ? pct : Math.min(pct, v.hpShown + 0.016);
    const shown = v.hpReveal != null ? Math.min(pct, v.hpReveal) : pct;
    g.fillStyle = 'rgba(8,8,10,0.75)'; rr(g, x - 2 * us, top - 2 * us, w + 4 * us, h + 4 * us, 3 * us); g.fill();
    g.fillStyle = u.side === 'player' ? (u.protected ? '#3ddc84' : '#5fd38a') : (u.isBoss ? '#ff4d4d' : '#ff7a59');
    g.fillRect(x, top, w * shown, h);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x, top, w * shown, h * 0.35);
    if (u.shield > 0) { g.fillStyle = 'rgba(160,220,255,0.9)'; g.fillRect(x, top, Math.min(w, w * u.shield / u.maxHp), 3 * us); }
    if (u.activeNature) { g.fillStyle = 'rgba(8,8,10,0.85)'; g.beginPath(); g.arc(x - 9 * us, top + h / 2, 6.5 * us, 0, TAU); g.fill(); drawGlyph(g, u.activeNature, x - 9 * us, top + h / 2, 4.2 * us); }
    if (u.side === 'player' && !u.protected) {
      g.fillStyle = 'rgba(8,8,10,0.75)'; g.fillRect(x - 1, top + h + 2 * us, w + 2, 4 * us);
      const full = u.chakra >= sim.B.combat.chakra.max;
      g.fillStyle = full ? `rgba(155,227,255,${0.7 + 0.3 * Math.sin(this.t * 10)})` : '#4dabf7';
      g.fillRect(x, top + h + 2.5 * us, w * Math.min(1, u.chakra / sim.B.combat.chakra.max), 3 * us);
    }
    if (u.isBoss || u.protected) {
      g.font = `${Math.round(15 * us)}px ${FONT_DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'bottom';
      const label = u.protected ? `Protect: ${u.short || u.name}` : u.name;
      const half = g.measureText(label).width / 2 + 6;
      const lx = Math.max(half, Math.min(W - half, u.x));
      g.lineWidth = 4 * us; g.lineJoin = 'round'; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.strokeText(label, lx, top - 4 * us);
      g.fillStyle = u.protected ? '#baffd6' : '#ffe1e1'; g.fillText(label, lx, top - 4 * us);
    }
  }
}

function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2; const rr2 = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } g.closePath(); g.fill(); }
void rgba;

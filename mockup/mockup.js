// mockup/mockup.js — the six scenes of the art mockup, the portrait slots and pickers, the
// Gemini prompts and the language swatches. Standalone: it does not import the game.
import { W, H, GROUND_Y, Stage, STAGES, rgba, shade } from './stage.js';
import { LOOKS, drawFigure, drawBust } from './figure.js';
import { VFX, NATURE, FONT_DISPLAY, drawGlyph, rr } from './vfx.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================================ portraits: slots, pickers, keying
const PORTRAIT_IDS = ['naruto', 'zabuza', 'naruto_p2', 'sprite_naruto'];
const store = { img: {} };

function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }
/** Key out a flat magenta background (what the ingest tool will do), with a soft edge and fringe clean-up. */
function keyMagenta(c) {
  const g = c.getContext('2d'); const d = g.getImageData(0, 0, c.width, c.height); const p = d.data; let keyed = 0;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], gg = p[i + 1], b = p[i + 2];
    const dist = Math.sqrt((255 - r) ** 2 + gg ** 2 + (255 - b) ** 2);
    if (dist < 110) { p[i + 3] = 0; keyed++; }
    else if (dist < 170) { const a = (dist - 110) / 60; p[i + 3] = Math.round(p[i + 3] * a); const m = Math.min(r, b); p[i] = Math.round(lerp(m, r, a)); p[i + 2] = Math.round(lerp(m, b, a)); }
  }
  if (keyed > p.length / 4 * 0.02) g.putImageData(d, 0, 0);
  return keyed > p.length / 4 * 0.02;
}
function renderSlot(el) {
  const id = el.dataset.portrait; const look = LOOKS[el.dataset.look || id] || LOOKS.thug; const face = el.dataset.face === 'left' ? -1 : 1;
  el.replaceChildren();
  const img = store.img[id];
  if (img) { const im = new Image(); im.src = img.src; im.alt = ''; if (el.dataset.flip) im.classList.add('flip'); el.appendChild(im); return; }
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  drawBust(c.getContext('2d'), look, 256, { facing: face, expression: el.dataset.expr || 'set' });
  el.appendChild(c);
}
function refreshSlots(id) { for (const el of $$('.slot[data-portrait]')) if (!id || el.dataset.portrait === id) renderSlot(el); for (const pk of $$('#pickers .picker')) if (!id || pk.dataset.id === id) $('.st', pk).textContent = store.img[pk.dataset.id] ? 'your image, keyed and downscaled to 512 px' : (pk.dataset.id === 'sprite_naruto' ? 'no image loaded · code-drawn figure' : 'no image loaded · code-drawn bust'); }
function setPortrait(id, img, persist) { store.img[id] = img; if (persist) { try { localStorage.setItem('mockup:portrait:' + id, img.src); } catch { /* full */ } } refreshSlots(id); }
function clearPortrait(id) { delete store.img[id]; try { localStorage.removeItem('mockup:portrait:' + id); } catch { /* ignore */ } refreshSlots(id); }
async function pickFile(id, file) {
  const url = URL.createObjectURL(file);
  try {
    const raw = await loadImage(url);
    const c = document.createElement('canvas'); const S = 512; c.width = S; c.height = Math.round(S * raw.height / raw.width) || S;
    c.getContext('2d').drawImage(raw, 0, 0, c.width, c.height);
    keyMagenta(c);
    let data; try { data = c.toDataURL('image/webp', 0.9); if (!data.startsWith('data:image/webp')) data = c.toDataURL('image/png'); } catch { data = c.toDataURL('image/png'); }
    setPortrait(id, await loadImage(data), true);
  } finally { URL.revokeObjectURL(url); }
}
function setupPortraits() {
  for (const id of PORTRAIT_IDS) {
    let stored = null; try { stored = localStorage.getItem('mockup:portrait:' + id); } catch { /* ignore */ }
    if (stored) loadImage(stored).then(img => setPortrait(id, img, false)).catch(() => {});
    else for (const ext of ['webp', 'png']) loadImage(`assets/portraits/${id}.${ext}`).then(img => { if (!store.img[id]) setPortrait(id, img, false); }).catch(() => {});
  }
  for (const pk of $$('#pickers .picker')) {
    const id = pk.dataset.id;
    $('input', pk).addEventListener('change', (e) => { const f = e.target.files?.[0]; if (f) pickFile(id, f).catch(err => { console.warn(err); $('.st', pk).textContent = 'could not read that image'; }); e.target.value = ''; });
    $('.clear', pk).addEventListener('click', () => clearPortrait(id));
  }
  refreshSlots();
}

// ============================================================ a scene: stage + units + effects + timeline
const MAX_UNIT_SCALE = 2.6, HEAD_CSS_PX = 30;
class Scene {
  constructor(shot, opts) {
    this.shot = shot; this.opts = opts;
    this.canvas = $('canvas.field', shot); this.g = this.canvas.getContext('2d');
    this.stage = new Stage(STAGES[opts.stage]); this.vfx = new VFX();
    this.units = []; this.events = []; this.fired = new Set();
    this.time = 0; this.timeScale = 1; this.slowUntil = 0; this.loopLen = opts.loop || 8;
    this.cam = { x: 0, zoom: 1 }; this.camTarget = { x: 0, zoom: 1 }; this.dim = opts.dim || 0;
    this.cover = !!opts.cover; this.focusX = opts.focusX || W / 2;
    this.telegraph = null; this.active = false; this.tick = null; this.bossHp = null; this.el = shot; this.camX = 0;
    new ResizeObserver(() => this.resize()).observe(this.canvas.parentElement);
    this.resize();
    this.canvas.parentElement.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; this.reset(); });
  }
  resize() {
    const box = this.canvas.parentElement.getBoundingClientRect(); const cw = Math.max(1, box.width), ch = Math.max(1, box.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const s = this.cover ? Math.max(cw / W, ch / H) : Math.min(cw / W, ch / H);
    const cssW = this.cover ? cw : Math.floor(W * s), cssH = this.cover ? ch : Math.floor(H * s);
    this.canvas.style.width = cssW + 'px'; this.canvas.style.height = cssH + 'px';
    const pw = Math.max(1, Math.round(cssW * dpr)), ph = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width !== pw || this.canvas.height !== ph) { this.canvas.width = pw; this.canvas.height = ph; }
    this.dpr = dpr; this.cssScale = s;
    this.offX = this.cover ? cw / 2 - this.focusX * s : 0; this.offY = this.cover ? (ch - H * s) / 2 : 0;
    this.unitScale = this.cover ? (this.opts.unitScale || 1.5) : clamp(HEAD_CSS_PX / (34 * s), 1, MAX_UNIT_SCALE);
  }
  addUnit(id, x, side, extra = {}) {
    const { look: lookId, ...rest } = extra;
    const u = { id, look: LOOKS[lookId || id] || LOOKS.thug, x, homeX: x, side, facing: side === 'player' ? 1 : -1, slot: this.units.filter(v => v.side === side).length, boss: false, nature: null, hp: 1, hpHome: 1, aura: null, auraHome: null, move: null, casting: false, ko: false, anim: { lunge: 0, flash: 0, cast: 0, ko: 0, lean: 0, walk: 0, walking: false, stun: 0 }, ...rest };
    u.auraHome = u.aura; u.hpHome = u.hp; this.units.push(u); return u;
  }
  unit(id) { return this.units.find(u => u.id === id); }
  unitY(u) { return this.cover ? GROUND_Y : GROUND_Y + ((u.slot % 2 === 0) ? 1 : -1) * 22 * this.unitScale; }
  big(u) { return this.unitScale * (u.boss ? 1.25 : 1); }
  handOf(u) { return { x: u.x + u.facing * 30 * this.big(u), y: this.unitY(u) - 50 * this.big(u) }; }
  chestOf(u) { return { x: u.x, y: this.unitY(u) - 44 * this.big(u) }; }
  headOf(u) { return { x: u.x, y: this.unitY(u) - 76 * this.big(u) }; }
  at(t, fn) { this.events.push({ t, fn }); return this; }
  moveTo(u, x, dur, { walk = false, done = null } = {}) { u.move = { from: u.x, to: x, t: 0, dur, walk, done }; }
  /** Where `attacker` stands to hit `target` (the figures' reach grows with the unit scale). `extra` adds distance. */
  contactX(target, attacker, extra = 0) { return target.x - attacker.facing * (38 * this.big(target) + 38 * this.big(attacker) + extra * this.unitScale); }
  hit(u, { flash = 1, knock = 8, nature = null, text = null, tag = null, crit = false, size = 26 } = {}) {
    u.anim.flash = flash; u.x -= u.facing * knock * (this.unitScale * 0.5);
    const N = nature ? NATURE[nature] : null; const c = this.chestOf(u);
    if (text) this.vfx.number(c.x + (Math.random() * 30 - 15), c.y - 10 * this.unitScale, (crit ? '' : '') + text, { color: N ? N.light : (u.side === 'player' ? '#ffb4b4' : '#ffffff'), size: size * Math.min(1.8, 1 + (this.unitScale - 1) * 0.5), tag, tagColor: N ? N.color : '#9aa4ae' });
  }
  slow(scale, wallSeconds) { if (reduced || window.__mock?.noSlow) return; this.timeScale = scale; this.slowUntil = performance.now() + wallSeconds * 1000; }
  reset() {
    this.time = 0; this.fired.clear(); this.vfx = new VFX(); this.telegraph = null; this.cam = { x: 0, zoom: 1 }; this.camTarget = { x: 0, zoom: 1 }; this.camX = 0; this.timeScale = 1; this.slowUntil = 0;
    for (const u of this.units) { u.x = u.homeX; u.hp = u.hpHome; u.aura = u.auraHome; u.move = null; u.casting = false; u.ko = false; u.hidden = false; Object.assign(u.anim, { lunge: 0, flash: 0, cast: 0, ko: 0, lean: 0, walk: 0, walking: false, stun: 0 }); }
    for (const e of $$('.namecard, .readout, .bosscard, .speedlines, .kage-card', this.shot)) e.classList.remove('show');
    for (const e of $$('.bars', this.shot)) e.classList.remove('in');
    this.opts.onReset?.(this);
  }
  step(dtWall) {
    if (this.slowUntil && performance.now() > this.slowUntil) { this.timeScale = 1; this.slowUntil = 0; }
    const dt = dtWall * this.timeScale;
    this.time += dt;
    for (const e of this.events) if (!this.fired.has(e) && this.time >= e.t) { this.fired.add(e); e.fn(this); }
    for (const u of this.units) {
      const a = u.anim;
      a.lunge = Math.max(0, a.lunge - dt * 3.2); a.flash = Math.max(0, a.flash - dt * 7); a.stun = Math.max(0, a.stun - dt);
      a.cast = u.casting ? Math.min(1, a.cast + dt * 6) : Math.max(0, a.cast - dt * 6);
      a.lean = lerp(a.lean, u.leanTarget || 0, Math.min(1, dt * 10));
      if (u.move) { u.move.t += dt; const k = clamp(u.move.t / u.move.dur, 0, 1); u.x = lerp(u.move.from, u.move.to, u.move.walk ? k : ease(k)); a.walking = k < 1 && u.move.walk; a.walk += dt * 15; if (k >= 1) { const d = u.move.done; u.move = null; a.walking = false; d?.(); } }
      if (u.ko) a.ko = Math.min(1, a.ko + dt * 2.2);
    }
    this.cam.zoom = lerp(this.cam.zoom, this.camTarget.zoom, Math.min(1, dt * 3.5));
    this.camX = lerp(this.camX, this.camTarget.x, Math.min(1, dt * 3));
    this.cam.x = (reduced ? 0 : Math.sin(this.time * 0.35) * 8) + this.camX;
    this.vfx.update(dt);
    this.tick?.(this, dt);
    if (this.time >= this.loopLen) this.reset();
  }
  draw(dtWall) {
    const g = this.g; const sh = this.vfx.shakeOffset();
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const sc = this.cssScale * this.dpr;
    g.setTransform(sc, 0, 0, sc, (this.offX + (reduced ? 0 : sh.x) * this.cssScale) * this.dpr, (this.offY + (reduced ? 0 : sh.y) * this.cssScale) * this.dpr);
    this.stage.draw(g, dtWall * this.timeScale, this.cam, this.dim);
    g.save();
    const fx = W / 2, fy = GROUND_Y - 130; g.translate(fx, fy); g.scale(this.cam.zoom, this.cam.zoom); g.translate(-fx - this.cam.x, -fy);
    const us = this.unitScale;
    // target zones under threatened units
    if (this.telegraph) { const T = this.telegraph; const p = clamp((this.time - T.t0) / T.dur, 0, 1); for (const id of T.targets) { const u = this.unit(id); if (u && !u.ko) this.vfx.drawZone(g, u.x, this.unitY(u), T.nature, p, this.time, us); } }
    // units back to front
    const units = this.units.filter(u => !u.hidden).slice().sort((a, b) => this.unitY(a) - this.unitY(b));
    for (const u of units) {
      const y = this.unitY(u);
      drawFigure(g, u.look, { x: u.x, y, facing: u.facing, scale: us, boss: u.boss, t: this.time, phase: u.slot * 1.7, walking: u.anim.walking, walk: u.anim.walk, lunge: u.anim.lunge, lean: u.anim.lean, flash: u.anim.flash, cast: u.anim.cast, ko: u.anim.ko, aura: u.aura, scarf: u.nature ? NATURE[u.nature].color : (u.tai ? '#f1f3f5' : null), expression: u.expression, sprite: u.spriteId ? store.img[u.spriteId] : null, silhouette: u.silhouette });
      if (u.anim.stun > 0) { g.fillStyle = '#ffe066'; const hy = this.headOf(u).y - 8 * us; for (let i = 0; i < 3; i++) { const a = this.time * 5 + i * 2.1; star(g, u.x + Math.cos(a) * 24 * us, hy + Math.sin(a) * 5 * us, 5 * us); } }
    }
    // unit bars (the restyled HUD): a dark plate, a nature glyph, the boss name in the display face
    for (const u of units) if (!u.ko && !u.silhouette && this.opts.bars !== false) {
      const big = this.big(u), y = this.unitY(u); const front = this.cover ? false : u.slot % 2 === 0;
      const top = front ? y + 12 * us : y - 34 * big - 50 * big - 20 * us;
      const w = Math.min((u.boss ? 120 : 60) * us, u.boss ? 240 : 104), h = (u.boss ? 9 : 7) * us; const x = u.x - w / 2;
      g.fillStyle = 'rgba(8,8,10,0.75)'; rr(g, x - 2 * us, top - 2 * us, w + 4 * us, h + 4 * us, 3 * us); g.fill();
      g.fillStyle = u.side === 'player' ? '#5fd38a' : (u.boss ? '#ff4d4d' : '#ff7a59'); g.fillRect(x, top, w * clamp(u.hp, 0, 1), h);
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x, top, w * clamp(u.hp, 0, 1), h * 0.35);
      if (u.nature) { g.fillStyle = 'rgba(8,8,10,0.85)'; g.beginPath(); g.arc(x - 9 * us, top + h / 2, 6.5 * us, 0, Math.PI * 2); g.fill(); drawGlyph(g, u.nature, x - 9 * us, top + h / 2, 4.2 * us); }
      if (u.side === 'player') { g.fillStyle = 'rgba(8,8,10,0.75)'; g.fillRect(x - 1, top + h + 2 * us, w + 2, 4 * us); g.fillStyle = u.chakra >= 1 ? `rgba(155,227,255,${0.7 + 0.3 * Math.sin(this.time * 10)})` : '#4dabf7'; g.fillRect(x, top + h + 2.5 * us, w * clamp(u.chakra ?? 0.5, 0, 1), 3 * us); }
      if (u.boss) { g.font = `${Math.round(15 * us)}px ${FONT_DISPLAY}`; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.lineWidth = 4 * us; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.strokeText(u.name || u.id, u.x, top - 4 * us); g.fillStyle = '#ffe1e1'; g.fillText(u.name || u.id, u.x, top - 4 * us); }
    }
    // the wind-up plate above the caster
    if (this.telegraph) { const T = this.telegraph; const c = this.unit(T.caster); if (c) { const p = clamp((this.time - T.t0) / T.dur, 0, 1); this.vfx.drawTelegraph(g, { x: c.x, y: this.headOf(c).y - 30 * us, name: T.name, nature: T.nature, p, scale: Math.min(us, 1.8), clashable: true }); } }
    this.vfx.draw(g);
    g.restore();
  }
}
function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2; const rr2 = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } g.closePath(); g.fill(); }

// DOM helpers for the overlays
function replay(el, cls = 'show') { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function nameCard(shot, who, what) { const nc = $('.namecard', shot); if (!nc) return; $('.who', nc).textContent = who; $('.what', nc).textContent = what; replay(nc); }
function readout(shot, l1, l2, color) { const r = $('.readout', shot); if (!r) return; $('.l1', r).textContent = l1; $('.l2', r).textContent = l2; $('.l2', r).style.color = color; replay(r); }
/** badge: undefined = leave it, null = remove it, { cls, text } = set it. */
function setUlt(shot, unit, { ready = null, chakra = null, hp = null, badge = undefined } = {}) { const el = $(`.ult[data-unit="${unit}"]`, shot); if (!el) return; if (ready != null) el.classList.toggle('ready', ready); if (chakra != null) $('.ck i', el).style.width = Math.round(chakra * 100) + '%'; if (hp != null) $('.hp i', el).style.width = Math.round(hp * 100) + '%'; if (badge !== undefined) { $('.badge', el)?.remove(); if (badge) { const b = document.createElement('span'); b.className = 'badge ' + badge.cls; b.textContent = badge.text; el.appendChild(b); } } }
/** Typewriter into a dialogue box. Returns a promise that resolves when the line is complete. */
function typeLine(dlg, name, text, { cps = 32 } = {}) {
  const t = $('.text', dlg), n = $('.name', dlg); n.textContent = name; t.textContent = ''; dlg.style.opacity = '1';
  let i = 0; return new Promise((res) => { const id = setInterval(() => { i++; t.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(id); res(); } }, 1000 / cps); dlg._stop = () => { clearInterval(id); t.textContent = text; res(); }; });
}

// ============================================================ scene 1: Part I battle, Lightning Blade into a Water Dragon wind-up
function scene1() {
  const shot = $('#shot-p1'); const sc = new Scene(shot, { stage: 'waves_bridge', loop: 8.2 });
  const kak = sc.addUnit('kakashi', 440, 'player', { nature: 'Lightning', chakra: 1 });
  const nar = sc.addUnit('naruto', 372, 'player', { nature: 'Wind', chakra: 0.7, spriteId: 'sprite_naruto' });
  const sas = sc.addUnit('sasuke', 304, 'player', { nature: 'Fire', chakra: 0.4 });
  const sak = sc.addUnit('sakura', 236, 'player', { nature: 'Earth', chakra: 0.55 });
  const zab = sc.addUnit('zabuza', 850, 'enemy', { nature: 'Water', boss: true, name: 'Zabuza Momochi', hp: 0.62, expression: 'menace' });
  sc.addUnit('thug1', 934, 'enemy', { look: 'thug', hp: 0.9, expression: 'menace' }); sc.addUnit('thug2', 1004, 'enemy', { look: 'thug', hp: 1, expression: 'menace' });
  const timer = $('.timer', shot);
  sc.opts.onReset = () => { setUlt(shot, 'kakashi', { ready: true, chakra: 1, badge: { cls: 'stand', text: '= STANDOFF' } }); setUlt(shot, 'naruto', { badge: { cls: 'stand', text: '= STANDOFF' } }); setUlt(shot, 'sasuke', { badge: null }); zab.hp = 0.62; };
  sc.tick = (s) => { timer.textContent = '0:' + String(24 + Math.floor(s.time)).padStart(2, '0'); };
  sc.at(0.05, (s) => { s.telegraph = { caster: 'zabuza', name: 'Water Style: Water Dragon Jutsu', nature: 'Water', t0: s.time, dur: 3.2, targets: ['kakashi', 'naruto', 'sasuke', 'sakura'] }; zab.casting = true; })
    .at(0.4, (s) => { s.vfx.cast('Water', () => s.handOf(zab), 2.8); })
    .at(1.2, (s) => { nameCard(shot, 'Kakashi Hatake', 'Lightning Blade'); s.vfx.flash('#ffffff', 0.25, 0.1); kak.casting = true; kak.lightning = s.vfx.lightningHand(() => s.handOf(kak)); s.vfx.cast('Lightning', () => s.handOf(kak), 0.6); setUlt(shot, 'kakashi', { ready: false, chakra: 0, badge: null }); })
    .at(1.75, (s) => { kak.casting = false; kak.anim.lunge = 1; kak.leanTarget = 16; s.moveTo(kak, s.contactX(zab, kak), 0.22, { done: () => { kak.leanTarget = 0; } }); for (let i = 0; i < 6; i++) s.vfx.emit({ x: kak.x - 20 * i, y: s.chestOf(kak).y + (i % 2) * 14, vx: -320, vy: 0, life: 0.2, size: 10, shape: 'line', color: '#ffffff', add: true }); })
    .at(1.97, (s) => { kak.lightning.done = true; const c = s.chestOf(zab); s.vfx.burst('Lightning', c.x - 10, c.y, 1.7); s.vfx.shake(11, 0.35); s.hit(zab, { knock: 14, nature: 'Lightning', text: '1,204', size: 34 }); zab.hp = 0.44; s.slow(0.15, 0.09); })
    .at(2.7, (s) => { s.moveTo(kak, 440, 0.55, { walk: true }); })
    .at(3.25, (s) => { s.telegraph = null; zab.casting = false; const h = s.handOf(zab); s.vfx.waterDragon(h.x, h.y, 360, s.chestOf(nar).y + 10, 0.85); s.vfx.number(zab.x, s.headOf(zab).y - 40 * s.unitScale, 'WATER DRAGON JUTSU', { color: NATURE.Water.light, size: 16, dur: 1.2 }); })
    .at(4.1, (s) => { s.hit(kak, { knock: 6, text: '288' }); s.hit(nar, { knock: 6, text: '301' }); s.hit(sas, { knock: 8, nature: 'Water', text: '402', tag: 'EFFECTIVE!' }); s.hit(sak, { knock: 4, text: '144', tag: 'resisted' }); setUlt(shot, 'sasuke', { hp: 0.42 }); setUlt(shot, 'kakashi', { hp: 0.74 }); setUlt(shot, 'naruto', { hp: 0.62 }); setUlt(shot, 'sakura', { hp: 0.7 }); for (const u of [kak, nar, sas, sak]) s.vfx.burst('Water', u.x, s.chestOf(u).y, 0.7); })
    .at(5.2, (s) => { sak.anim.lunge = 0.6; const from = s.handOf(sak), to = s.chestOf(zab); s.vfx.add({ t: 0, update(dt) { this.t += dt; this.done = this.t > 0.3; }, draw(g) { const k = this.t / 0.3; const x = lerp(from.x, to.x, k), y = lerp(from.y, to.y, k) - Math.sin(k * Math.PI) * 40; g.save(); g.translate(x, y); g.rotate(Math.atan2(to.y - from.y, to.x - from.x)); g.fillStyle = '#d7dde5'; g.beginPath(); g.moveTo(-14, 0); g.lineTo(6, -4); g.lineTo(14, 0); g.lineTo(6, 4); g.closePath(); g.fill(); g.strokeStyle = '#1a1410'; g.lineWidth = 1.5; g.stroke(); g.restore(); } }); })
    .at(5.5, (s) => { s.vfx.burst('None', zab.x - 20, s.chestOf(zab).y, 0.6); s.hit(zab, { knock: 2, text: '86', size: 20 }); zab.hp = 0.42; })
    .at(6.2, (s) => { setUlt(shot, 'naruto', { ready: true, chakra: 1, badge: null }); s.vfx.ring(nar.x, s.chestOf(nar).y, '#9be3ff', { r1: 60 * s.unitScale, width: 4, dur: 0.5 }); })
    .at(6.8, (s) => { nar.anim.lunge = 1; s.moveTo(nar, s.contactX(zab, nar), 0.22, { done: () => s.moveTo(nar, 372, 0.6, { walk: true }) }); })
    .at(7.02, (s) => { s.vfx.burst('None', zab.x - 16, s.chestOf(zab).y + 10, 1); s.hit(zab, { knock: 8, text: '212', size: 24 }); zab.hp = 0.37; s.vfx.shake(5, 0.2); });
  sc.reset(); return sc;
}

// ============================================================ scene 2: Shippuden clash, Rasengan vs Chidori Stream → OVERPOWER
function scene2() {
  const shot = $('#shot-p2'); const sc = new Scene(shot, { stage: 'hideout_crater', loop: 8.6 });
  const nar = sc.addUnit('naruto_p2', 440, 'player', { nature: 'Wind', chakra: 1, aura: '#ff4d2a' });
  const yam = sc.addUnit('yamato', 372, 'player', { nature: 'Earth', chakra: 0.2 });
  const sak = sc.addUnit('sakura_p2', 304, 'player', { nature: 'Earth', chakra: 0.35 });
  const sai = sc.addUnit('sai', 236, 'player', { nature: 'Earth', chakra: 0.62 });
  const sas = sc.addUnit('sasuke_p2', 840, 'enemy', { nature: 'Lightning', boss: true, name: 'Sasuke Uchiha', hp: 0.7, expression: 'menace' });
  const timer = $('.timer', shot);
  sc.opts.onReset = () => { setUlt(shot, 'naruto_p2', { ready: true, chakra: 1, badge: { cls: 'over', text: '▲ OVERPOWER' } }); setUlt(shot, 'sakura_p2', { badge: null }); };
  let beam = null, orb = null, bias = 0, clashing = false;
  sc.tick = (s, dt) => { timer.textContent = '0:' + String(41 + Math.floor(s.time)).padStart(2, '0'); if (clashing) bias = Math.min(0.95, bias + dt * 1.6); };
  const baseReset = sc.opts.onReset; sc.opts.onReset = (s) => { baseReset(s); clashing = false; bias = 0; beam = null; orb = null; };
  sc.at(0.05, (s) => { s.telegraph = { caster: 'sasuke_p2', name: 'Chidori Stream', nature: 'Lightning', t0: s.time, dur: 3.0, targets: ['naruto_p2', 'yamato', 'sakura_p2', 'sai'] }; sas.casting = true; sas.lightning = s.vfx.lightningHand(() => s.handOf(sas), { size: 26 }); setUlt(shot, 'sakura_p2', { badge: { cls: 'weak', text: '▼ WEAK' } }); })
    .at(1.3, (s) => { nameCard(shot, 'Naruto Uzumaki', 'Rasengan'); nar.casting = true; orb = s.vfx.rasengan(() => s.handOf(nar), { charge: 0.45 }); s.vfx.cast('Wind', () => s.handOf(nar), 0.6); setUlt(shot, 'naruto_p2', { ready: false, chakra: 0, badge: null }); })
    .at(1.95, (s) => { nar.casting = false; nar.anim.lunge = 1; nar.leanTarget = 14; s.moveTo(nar, s.contactX(sas, nar, 70), 0.24, { done: () => { nar.leanTarget = 6; } }); for (let i = 0; i < 6; i++) s.vfx.emit({ x: nar.x - 22 * i, y: s.chestOf(nar).y + (i % 2) * 14, vx: -340, vy: 0, life: 0.2, size: 10, shape: 'line', color: '#ffffff', add: true }); })
    .at(2.2, (s) => { s.telegraph = null; sas.casting = true; bias = 0; beam = s.vfx.clashBeam({ get x() { return s.handOf(nar).x; }, get y() { return s.handOf(nar).y; }, color: '#3fa9f5' }, { get x() { return s.handOf(sas).x; }, get y() { return s.handOf(sas).y; }, color: '#fff2a8' }, () => bias); readout(shot, 'JUTSU CLASH', '', '#fff'); s.camTarget.zoom = 1.08; s.slow(0.35, 0.55); s.vfx.shake(6, 0.6); })
    .at(2.36, () => { clashing = true; })
    .at(2.62, (s) => { clashing = false; if (beam) beam.done = true; if (orb) orb.done = true; if (sas.lightning) sas.lightning.done = true; sas.casting = false; nar.anim.lunge = 1; s.moveTo(nar, s.contactX(sas, nar), 0.12); const c = s.chestOf(sas); s.vfx.rasenganImpact(c.x - 6, c.y, 1.6); s.vfx.shake(14, 0.45); s.hit(sas, { knock: 22, nature: 'Wind', text: '3,860', tag: 'EFFECTIVE!', size: 36 }); sas.hp = 0.38; sas.anim.stun = 2; readout(shot, 'JUTSU CLASH', 'OVERPOWER!', '#5fd38a'); s.slow(0.2, 0.1); s.vfx.number(nar.x, s.headOf(nar).y - 30 * s.unitScale, '+25 chakra', { color: '#9be3ff', size: 16, dur: 1.1 }); setUlt(shot, 'naruto_p2', { chakra: 0.25 }); })
    .at(3.2, (s) => { s.camTarget.zoom = 1; nar.leanTarget = 0; s.moveTo(nar, 440, 0.6, { walk: true }); })
    .at(4.4, (s) => { sai.anim.lunge = 0.6; const from = s.handOf(sai), to = s.chestOf(sas); s.vfx.add({ t: 0, update(dt) { this.t += dt; this.done = this.t > 0.32; }, draw(g) { const k = this.t / 0.32; const x = lerp(from.x, to.x, k), y = lerp(from.y, to.y, k) - Math.sin(k * Math.PI) * 60; g.save(); g.translate(x, y); g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse(0, 0, 16, 7, Math.sin(k * 12) * 0.4, 0, Math.PI * 2); g.fill(); g.restore(); } }); })
    .at(4.75, (s) => { s.vfx.burst('Earth', sas.x - 14, s.chestOf(sas).y, 0.8); s.hit(sas, { knock: 3, text: '512', size: 22, tag: 'resisted' }); sas.hp = 0.35; })
    .at(5.4, (s) => { sas.anim.stun = 0; sas.anim.lunge = 1; sas.leanTarget = 14; s.moveTo(sas, s.contactX(nar, sas), 0.22, { done: () => { sas.leanTarget = 0; } }); })
    .at(5.63, (s) => { s.vfx.burst('Fire', nar.x + 14, s.chestOf(nar).y, 1.1); s.hit(nar, { knock: 12, nature: 'Fire', text: '744', tag: 'EFFECTIVE!', size: 28 }); s.vfx.shake(7, 0.25); setUlt(shot, 'naruto_p2', { hp: 0.52 }); })
    .at(6.3, (s) => { s.moveTo(sas, 840, 0.7, { walk: true }); })
    .at(7.2, (s) => { yam.casting = true; s.vfx.cast('Earth', () => s.handOf(yam), 1.0); s.vfx.number(yam.x, s.headOf(yam).y - 20, 'WOOD STYLE', { color: NATURE.Earth.light, size: 14, dur: 1 }); })
    .at(8.2, () => { yam.casting = false; });
  sc.reset(); return sc;
}

// ============================================================ scene 3: the map backdrop (the stage, dimmed, with drifting mist)
function scene3() {
  const box = $('#map-stage'); const canvas = $('canvas.field', box); const g = canvas.getContext('2d'); const stage = new Stage(STAGES.waves_bridge);
  const s = { active: false, t: 0, resize() { const r = box.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }, step(dt) { s.t += dt; }, draw(dt) { const sc = Math.max(canvas.width / W, canvas.height / (GROUND_Y + 100)); g.setTransform(sc, 0, 0, sc, (canvas.width - W * sc) / 2, 0); stage.draw(g, dt, { x: Math.sin(s.t * 0.2) * 20, zoom: 1.0 }, 0.12); } };
  s.el = box; new ResizeObserver(() => s.resize()).observe(box); s.resize(); return s;
}

// ============================================================ scene 4: the summon ceremony
function scene4() {
  const shot = $('#shot-gacha'); const box = $('.gacha', shot); const canvas = $('canvas.field', box); const g = canvas.getContext('2d');
  const vfx = new VFX(); const LW = 900, LH = 1300; let t = 0;
  const kage = $('.kage-card', shot);
  const s = { active: false, t: 0, fired: new Set(), events: [],
    at(tt, fn) { s.events.push({ t: tt, fn }); return s; },
    resize() { const r = box.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); },
    reset() { s.t = 0; s.fired.clear(); vfx.parts = []; vfx.items = []; kage.classList.remove('show'); },
    step(dt) { s.t += dt; for (const e of s.events) if (!s.fired.has(e) && s.t >= e.t) { s.fired.add(e); e.fn(); } vfx.update(dt); if (s.t > 8.5) s.reset(); },
    draw() {
      const sc = Math.min(canvas.width / LW, canvas.height / LH); g.setTransform(sc, 0, 0, sc, (canvas.width - LW * sc) / 2, (canvas.height - LH * sc) / 2);
      g.clearRect(-50, -50, LW + 100, LH + 100);
      const tt = s.t;
      // the summoning circle on the ground, from 0.9 s
      if (tt > 0.9) {
        const k = Math.min(1, (tt - 0.9) / 0.5); const cx = LW / 2, cy = 980; const R = 300 * k;
        g.save(); g.globalAlpha = tt > 6.5 ? Math.max(0, 1 - (tt - 6.5) / 1.5) : 1;
        const gl = g.createRadialGradient(cx, cy, 0, cx, cy, R); gl.addColorStop(0, 'rgba(255,197,61,0.35)'); gl.addColorStop(1, 'rgba(255,197,61,0)'); g.fillStyle = gl; g.beginPath(); g.ellipse(cx, cy, R, R * 0.36, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#ffd66b'; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, cy, R, R * 0.36, 0, 0, Math.PI * 2); g.stroke();
        g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy, R * 0.72, R * 0.36 * 0.72, 0, 0, Math.PI * 2); g.stroke();
        g.font = `26px "Yuji Syuku", serif`; g.fillStyle = '#ffe9a8'; g.textAlign = 'center'; g.textBaseline = 'middle';
        const txt = '口寄せの術・'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + tt * 0.8; const px = cx + Math.cos(a) * R * 0.86, py = cy + Math.sin(a) * R * 0.36 * 0.86; g.save(); g.translate(px, py); g.scale(1, 0.55); g.rotate(a + Math.PI / 2); g.fillText(txt[i % txt.length], 0, 0); g.restore(); }
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 - tt * 0.5; g.fillStyle = '#ffd66b'; g.beginPath(); g.arc(cx + Math.cos(a) * R * 0.72, cy + Math.sin(a) * R * 0.36 * 0.72, 6, 0, Math.PI * 2); g.fill(); }
        // rising light
        if (tt > 1.6) { const kk = Math.min(1, (tt - 1.6) / 0.6); const lg = g.createLinearGradient(0, cy, 0, cy - 700 * kk); lg.addColorStop(0, 'rgba(255,220,120,0.45)'); lg.addColorStop(1, 'rgba(255,220,120,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(cx - R * 0.7, cy); g.lineTo(cx - R * 0.3, cy - 700 * kk); g.lineTo(cx + R * 0.3, cy - 700 * kk); g.lineTo(cx + R * 0.7, cy); g.closePath(); g.fill(); }
        g.restore();
      }
      // the ninja making the seal: a silhouette until the circle lights, then lit from below
      if (tt < 2.3) { const sil = tt < 1.0; const x = LW / 2, y = 1000; const k = clamp(tt / 0.5, 0, 1); g.save(); g.globalAlpha = tt > 1.9 ? 1 - (tt - 1.9) / 0.4 : 1; drawFigure(g, LOOKS.naruto, { x, y, facing: 1, scale: 3.2, t: tt, cast: k, silhouette: sil, aura: sil ? null : '#ffd66b' }); g.restore(); }
      vfx.draw(g);
    } };
  s.at(0.15, () => { for (let i = 0; i < 20; i++) vfx.emit({ x: LW / 2 + (Math.random() * 120 - 60), y: 900, vx: Math.random() * 80 - 40, vy: -(120 + Math.random() * 120), life: 0.8, size: 4, shape: 'circle', color: '#9be3ff', add: true }); })
    .at(0.9, () => { vfx.ring(LW / 2, 980, '#ffd66b', { r1: 320, width: 10, dur: 0.6, ellipse: 0.36 }); })
    .at(1.9, () => { for (let i = 0; i < 40; i++) vfx.emit({ x: LW / 2 + (Math.random() * 200 - 100), y: 900 + Math.random() * 80, vx: Math.random() * 260 - 130, vy: -(60 + Math.random() * 260), drag: 1.5, life: 1.1 + Math.random() * 0.6, size: 40 + Math.random() * 50, shape: 'puff', color: '#e6dccb', alpha: 0.75, grow: 1.4 }); vfx.flash('#fff6d8', 0.5, 0.25); })
    .at(2.3, () => { vfx.flash('#ffffff', 1, 0.5); vfx.ring(LW / 2, 620, '#ffd66b', { r1: 700, width: 14, dur: 0.9 }); for (let i = 0; i < 60; i++) { const a = Math.random() * Math.PI * 2, sp = 200 + Math.random() * 500; vfx.emit({ x: LW / 2, y: 620, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, grav: 300, life: 0.9 + Math.random() * 0.6, size: 4 + Math.random() * 5, shape: 'star', color: Math.random() < 0.5 ? '#ffd66b' : '#fff5cc', add: true }); } replay(kage); })
    .at(5.5, () => { for (let i = 0; i < 12; i++) vfx.emit({ x: 100 + Math.random() * 700, y: 300 + Math.random() * 700, vx: 0, vy: -40, life: 1.5, size: 3, shape: 'star', color: '#ffe9a8', add: true }); });
  s.el = box; new ResizeObserver(() => s.resize()).observe(box); s.resize(); box.addEventListener('pointerdown', () => s.reset()); s.reset(); return s;
}

// ============================================================ scene 5: dialogue
function scene5() {
  const shot = $('#shot-dlg'); const sc = new Scene(shot, { stage: 'training_ground', loop: 14, cover: true, focusX: 730, dim: 0.42, unitScale: 1.6, bars: false });
  const kak = sc.addUnit('kakashi', 800, 'player', {});
  const nar = sc.addUnit('naruto', 610, 'player', { spriteId: 'sprite_naruto' });
  kak.facing = -1;
  const dlg = $('#dlg', shot); const slot = $('.slot', dlg);
  const LINES = [
    ['Kakashi', 'kakashi', 'left', 'Two bells, three of you. Anyone without one by noon goes back to the Academy.'],
    ['Naruto', 'naruto', 'right', 'Back to the Academy?! No way. I’m taking both of them, believe it!'],
    ['Kakashi', 'kakashi', 'left', 'Then come at me like you mean it. And Naruto… try not to get sent flying.'],
    ['Naruto', 'naruto', 'right', 'Hey! What’s that supposed to mean?!'],
  ];
  let idx = 0, typing = false;
  const speak = (i) => { const [name, id, side, text] = LINES[i]; dlg.classList.toggle('right', side === 'right'); slot.dataset.portrait = id; slot.dataset.look = id; slot.dataset.face = side === 'right' ? 'left' : 'right'; if (side === 'right') slot.dataset.flip = '1'; else delete slot.dataset.flip; renderSlot(slot); kak.anim.lunge = 0; typing = true; typeLine(dlg, name, text).then(() => { typing = false; }); const sp = id === 'kakashi' ? kak : nar; sp.leanTarget = 4; setTimeout(() => { sp.leanTarget = 0; }, 400); };
  sc.opts.onReset = () => { idx = 0; speak(0); };
  sc.at(3.2, () => speak(1)).at(6.4, () => speak(2)).at(10.2, () => speak(3));
  dlg.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (typing) dlg._stop?.(); });
  sc.reset(); return sc;
}

// ============================================================ scene 6: boss intro
function scene6() {
  const shot = $('#shot-boss'); const sc = new Scene(shot, { stage: 'waves_bridge', loop: 7.4 });
  sc.addUnit('kakashi', 440, 'player', { nature: 'Lightning', chakra: 0 });
  sc.addUnit('naruto', 372, 'player', { nature: 'Wind', chakra: 0, spriteId: 'sprite_naruto' });
  sc.addUnit('sasuke', 304, 'player', { nature: 'Fire', chakra: 0 });
  sc.addUnit('sakura', 236, 'player', { nature: 'Earth', chakra: 0 });
  const zab = sc.addUnit('zabuza', 850, 'enemy', { nature: 'Water', boss: true, name: 'Zabuza Momochi', hp: 0, expression: 'menace' });
  const stage = $('.stage', shot), dlg = $('#dlg-boss', shot);
  sc.opts.onReset = () => { dlg.style.opacity = '0'; zab.hp = 0; zab.hidden = true; };
  sc.tick = (s, dt) => { if (s.time > 0.6 && zab.hp < 1) zab.hp = Math.min(1, zab.hp + dt * 0.9); };
  sc.at(0.05, (s) => { stage.classList.add('in'); s.camTarget.zoom = 1.07; s.camTarget.x = 120; replay($('.speedlines', shot)); for (let i = 0; i < 10; i++) s.vfx.emit({ x: 850 + (Math.random() * 120 - 60), y: 500 + Math.random() * 60, vx: Math.random() * 60 - 30, vy: -(30 + Math.random() * 40), life: 1.2, size: 40, shape: 'puff', color: '#dfe7ec', alpha: 0.6, grow: 1.5 }); })
    .at(0.35, (s) => { zab.hidden = false; zab.anim.flash = 0; s.vfx.ring(zab.x, s.chestOf(zab).y, '#3fa9f5', { r1: 160, width: 8, dur: 0.6 }); s.vfx.shake(6, 0.3); replay($('.bosscard', shot)); })
    .at(1.9, () => { typeLine(dlg, 'Zabuza', 'Sharingan Kakashi… I’ve heard the stories. Let’s see if any of them are true.'); })
    .at(4.6, (s) => { dlg.style.opacity = '0'; stage.classList.remove('in'); s.camTarget.zoom = 1; s.camTarget.x = 0; })
    .at(5.1, (s) => { readout(shot, 'SHOWDOWN ON THE BRIDGE', 'FIGHT!', '#ffb86b'); s.vfx.flash('#ffffff', 0.35, 0.15); })
    .at(5.3, (s) => { for (const u of s.units) if (u.side === 'player') s.moveTo(u, u.homeX + 60, 0.9, { walk: true }); s.moveTo(zab, 790, 0.9, { walk: true }); });
  sc.reset(); return sc;
}

// ============================================================ spec: prompts, swatches, nature demos, icons
const STYLE_ANCHOR = `STYLE ANCHOR (keep this block identical in every prompt):
Original fan-art character portrait in the look of a late-2000s Japanese shonen TV anime: clean cel shading with exactly two tones (base colour and one darker shadow), medium-thick dark brown outlines of even weight, flat saturated colours, no gradients, no painterly texture, no 3D render, no photo realism. Bust crop from the top of the hair to mid-chest, three-quarter view, eyes on the upper third of the frame, mouth closed, determined expression, looking slightly past the viewer. Square image, 1024 x 1024. Plain flat magenta background, hex #FF00FF, filling every pixel behind the character. No props, no text, no logo, no watermark, no border, no signature.`;
const PROMPTS = {
  a: `${STYLE_ANCHOR}

CHARACTER: Naruto Uzumaki as a 12-year-old genin from the first part of the series. Spiky bright golden-blond hair, big blue eyes, three thin whisker-like marks on each cheek, a wide confident grin held closed. He wears an orange tracksuit jacket with blue shoulders and a white fluffy collar, zipped up. A blue cloth forehead protector tied across his forehead with a PLAIN polished metal plate (no symbol engraved on it). Facing the viewer's RIGHT (his body turned toward the right edge of the image). Warm daylight lighting from the upper left.`,
  b: `${STYLE_ANCHOR}

CHARACTER: Zabuza Momochi, a tall adult rogue ninja from the Hidden Mist. Short spiky black hair, no eyebrows, small sharp menacing eyes, the lower half of his face wrapped in white bandages like a mask. His forehead protector is tied sideways at an angle on his head with a PLAIN metal plate (no symbol). Bare muscular arms, a sleeveless dark grey top, grey and white camouflage arm warmers, the wrapped hilt of a giant cleaver sword rising behind his shoulder. Facing the viewer's LEFT (his body turned toward the left edge of the image). Cool misty grey-blue lighting.`,
  c: `${STYLE_ANCHOR}

CHARACTER: Naruto Uzumaki as a 16-year-old from the second part of the series (Shippuden). Taller and leaner face, spiky golden-blond hair, blue eyes, three whisker-like marks on each cheek, a confident half-smile held closed. He wears an orange and black tracksuit jacket with a high collar, zipped up, and a BLACK cloth forehead protector with a long black band and a PLAIN polished metal plate (no symbol). Facing the viewer's RIGHT. Cooler, higher-contrast lighting from the upper left with a faint cool rim light on the hair.`,
  d: `STYLE ANCHOR (keep this block identical in every prompt):
Original fan-art character sprite in the look of a late-2000s Japanese shonen TV anime, redrawn in a stylised chibi-adjacent proportion of about three and a half heads tall (large head, short body, simple hands and feet), clean cel shading with exactly two tones, medium-thick dark brown outlines of even weight, flat saturated colours, no gradients, no painterly texture, no 3D render. FULL BODY, standing in a relaxed ready stance, feet apart, arms at the sides, the whole figure visible with a small margin, feet at the bottom centre. Three-quarter view facing the viewer's RIGHT. Square image, 1024 x 1024. Plain flat magenta background, hex #FF00FF, filling every pixel behind the character. No props, no text, no logo, no watermark, no border, no shadow on the ground.

CHARACTER: Naruto Uzumaki as a 12-year-old genin: spiky golden-blond hair, blue eyes, three whisker-like marks on each cheek, an orange tracksuit with blue shoulders and a white collar, blue sandals, a blue cloth forehead protector with a PLAIN metal plate (no symbol).`,
};
function setupPrompts() {
  for (const k of ['a', 'b', 'c', 'd']) $('#prompt-' + k).textContent = PROMPTS[k];
  for (const b of $$('.prompt .copy')) b.addEventListener('click', async () => { const txt = $('pre', b.parentElement).textContent; try { await navigator.clipboard.writeText(txt); b.textContent = 'Copied'; } catch { b.textContent = 'Select and copy'; } setTimeout(() => { b.textContent = 'Copy'; }, 1500); });
}
function swatches(el, list) { for (const [name, c] of list) { const d = document.createElement('div'); d.className = 'sw'; d.style.background = c; d.textContent = name; el.appendChild(d); } }
function setupLanguage() {
  swatches($('#sw-p1'), [['bg', '#17120e'], ['surface', '#261e16'], ['wood', '#7a5230'], ['paper', '#f1e3c4'], ['steel', '#b3bcc6'], ['accent', '#ff8a3d'], ['text', '#f5ecdc'], ['good', '#6fd68f']]);
  swatches($('#sw-p2'), [['bg', '#0a0b0f'], ['surface', '#141923'], ['cloth', '#2a313d'], ['steel', '#97a6b8'], ['paper', '#dfe4ec'], ['accent', '#e63946'], ['text', '#eef2f7'], ['bad', '#ff5d5d']]);
  swatches($('#sw-nat'), [['Fire', '#ff5a36'], ['Wind', '#5fd38a'], ['Lightning', '#ffd43b'], ['Earth', '#c08a52'], ['Water', '#3fa9f5'], ['Neutral', '#d7dde5'], ['Genin', '#a3aebb'], ['Chunin', '#4dabf7'], ['Jonin', '#b388ff'], ['Kage', '#ffc53d']]);
  const grid = $('#icon-grid');
  for (const id of ['home', 'map', 'team', 'roster', 'scroll', 'wiki', 'settings', 'ryo', 'trophy', 'sound', 'fire', 'wind', 'bolt', 'earth', 'water', 'shield', 'sword', 'target', 'plus', 'crown', 'skull', 'calendar', 'cloud', 'ticket', 'star', 'lock', 'check', 'skip', 'play', 'pause', 'auto', 'back', 'kunai']) {
    const f = document.createElement('figure'); f.innerHTML = `<svg class="ico"><use href="#i-${id}"/></svg><figcaption>${id}</figcaption>`; grid.appendChild(f);
  }
}
function natureDemos() {
  const row = $('#vfx-row'); const demos = [];
  for (const [nature, label] of [['Fire', 'Fire Style'], ['Wind', 'Wind Style'], ['Lightning', 'Lightning Style'], ['Earth', 'Earth Style'], ['Water', 'Water Style'], ['None', 'Taijutsu / neutral']]) {
    const f = document.createElement('figure'); const c = document.createElement('canvas'); c.width = 300; c.height = 300; f.append(c, Object.assign(document.createElement('figcaption'), { textContent: label })); row.appendChild(f);
    const g = c.getContext('2d'); const vfx = new VFX(); let t = 0, phase = -1;
    demos.push({ active: false, step(dt) { t += dt; const ph = Math.floor((t % 2.4) / 1.2); if (ph !== phase) { phase = ph; if (ph === 0) vfx.cast(nature, () => ({ x: 150, y: 150 }), 1.0); else vfx.burst(nature, 150, 150, 1.1); } vfx.update(dt); }, draw() { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 300, 300); g.fillStyle = '#0b0f14'; g.fillRect(0, 0, 300, 300); g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, 210, 300, 90); vfx.draw(g); }, el: f });
  }
  return demos;
}

// ============================================================ boot
async function boot() {
  try { await document.fonts.load(`20px ${FONT_DISPLAY}`); await document.fonts.load('20px "Yuji Syuku"'); } catch { /* offline: system fonts */ }
  setupPortraits(); setupPrompts(); setupLanguage();
  const scenes = [scene1(), scene2(), scene3(), scene4(), scene5(), scene6(), ...natureDemos()];
  const io = new IntersectionObserver((entries) => { for (const e of entries) { const s = scenes.find(x => x.el === e.target); if (s) s.active = e.isIntersecting; } }, { rootMargin: '80px' });
  for (const s of scenes) io.observe(s.el);
  let last = performance.now();
  const errors = new Map();
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    for (const s of scenes) if (s.active) {
      try { s.step(dt); s.draw(dt); }
      catch (err) { if (!errors.has(s)) { errors.set(s, err); console.error('[mockup] scene failed', s.el?.id || s.el?.className, err); } }
    }
  };
  requestAnimationFrame(frame);
  // For debugging in the console: window.__mock.step(0.033) advances every scene by hand.
  window.__mock = { scenes, errors, step(dt = 1 / 30) { for (const s of scenes) { s.step(dt); s.draw(dt); } } };
}
boot().catch(err => { console.error(err); document.body.insertAdjacentHTML('afterbegin', `<p style="color:#ff5d5d;padding:12px">Mockup error: ${String(err.message || err)}</p>`); });

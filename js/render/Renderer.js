// Renderer.js — draws a BattleSim on a 1280×720 logical canvas, scaled by
// devicePixelRatio and letterboxed into its container. Shapes + initials only.
export const W = 1280, H = 720;
export const GROUND_Y = 560;
export const NATURE_COLORS = { Fire: '#ff5a36', Wind: '#5fd38a', Lightning: '#ffd43b', Earth: '#c08a52', Water: '#3fa9f5' };
export const NEUTRAL_COLOR = '#d7dde5';
export const TIER_COLORS = { genin: '#a3aebb', chunin: '#4dabf7', jonin: '#b388ff', kage: '#ffc53d' };

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
    this.scale = 1;
    this.theme = null;
    this.bg = null;
    this.vis = new Map(); // uid -> visual state
    this.t = 0;
  }

  setTheme(theme) { this.theme = theme; this.bg = null; }

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
  }

  _vis(u) {
    let v = this.vis.get(u.uid);
    if (!v) { v = { lunge: 0, flash: 0, fade: 1, bob: Math.random() * 6.28, dir: u.side === 'player' ? 1 : -1, depth: ((u.uid * 37) % 3 - 1) * 7, lastX: u.x, walk: 0 }; this.vis.set(u.uid, v); }
    return v;
  }

  /** Visual reactions to sim events (called by Effects). */
  onAttack(u) { const v = this._vis(u); v.lunge = 0.16; }
  onHit(u) { const v = this._vis(u); v.flash = 0.12; }

  _buildBackground() {
    const th = this.theme || { sky: ['#9bd4ff', '#e8f6ff'], ground: '#5fa04e', far: '#3f7d3a', accent: '#f97316' };
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, th.sky[0]); sky.addColorStop(1, th.sky[1]);
    g.fillStyle = sky; g.fillRect(0, 0, W, GROUND_Y + 10);
    // sun / moon
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.beginPath(); g.arc(1030, 120, 54, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.beginPath(); g.arc(1030, 120, 84, 0, Math.PI * 2); g.fill();
    // far mountains
    const layer = (color, base, amp, freq, phase) => {
      g.fillStyle = color; g.beginPath(); g.moveTo(0, GROUND_Y);
      for (let x = 0; x <= W; x += 16) g.lineTo(x, base - Math.abs(Math.sin(x * freq + phase)) * amp - Math.sin(x * freq * 2.7 + phase) * amp * 0.25);
      g.lineTo(W, GROUND_Y); g.closePath(); g.fill();
    };
    layer(shade(th.far, 0.35) + '', 430, 110, 0.004, 1.2);
    layer(th.far, 480, 70, 0.007, 0.3);
    // trees (simple triangles)
    g.fillStyle = shade(th.far, -0.25);
    for (let i = 0; i < 26; i++) {
      const x = (i * 97 + 31) % W, h = 40 + ((i * 53) % 50);
      g.beginPath(); g.moveTo(x, GROUND_Y - 6); g.lineTo(x - 16, GROUND_Y - 6); g.lineTo(x - 8, GROUND_Y - 6 - h); g.closePath(); g.fill();
    }
    // ground
    const gr = g.createLinearGradient(0, GROUND_Y - 20, 0, H);
    gr.addColorStop(0, th.ground); gr.addColorStop(1, shade(th.ground, -0.45));
    g.fillStyle = gr; g.fillRect(0, GROUND_Y - 20, W, H - GROUND_Y + 20);
    // lane stripe
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, GROUND_Y + 18, W, 3);
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x = 0; x < W; x += 64) g.fillRect(x + ((x / 64) % 2) * 20, GROUND_Y + 40 + ((x / 64) % 3) * 22, 30, 3);
    this.bg = c;
  }

  draw(sim, effects, dt) {
    const ctx = this.ctx;
    this.t += dt;
    if (!this.bg) this._buildBackground();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const sh = effects ? effects.shakeOffset() : { x: 0, y: 0 };
    ctx.setTransform(this.scale, 0, 0, this.scale, sh.x * this.scale, sh.y * this.scale);
    ctx.drawImage(this.bg, -20, -20, W + 40, H + 40);
    if (!sim) return;
    this._drawZones(sim);
    // Units sorted back-to-front by depth
    const units = sim.units.slice().sort((a, b) => this._vis(a).depth - this._vis(b).depth);
    for (const u of units) this._drawUnit(u, sim, dt);
    for (const u of units) if (u.alive) this._drawHud(u, sim);
    this._drawTelegraphBars(sim);
    if (effects) effects.draw(ctx, this);
  }

  unitY(u) { const v = this._vis(u); return GROUND_Y + v.depth; }

  _drawZones(sim) {
    const ctx = this.ctx;
    for (const t of sim.telegraphs) {
      const caster = sim.unit(t.caster); if (!caster) continue;
      const p = Math.min(1, (sim.time - t.startedAt) / Math.max(0.01, t.endsAt - t.startedAt));
      const col = natureColor(t.nature);
      const foes = sim.units.filter(o => o.alive && o.side !== caster.side);
      let xs = [];
      if (t.forceTarget) { const g = sim.unit(t.forceTarget); if (g) xs = [g.x]; }
      else if (t.kind === 'jutsu' && t.type === 'single') { const g = sim.unit(t.target); if (g) xs = [g.x]; }
      else if (t.kind === 'jutsu') { const g = sim.unit(t.target); if (g) { const r = sim.B.combat.ult.aoeRadius; xs = foes.filter(o => Math.abs(o.x - g.x) <= r).map(o => o.x); } }
      else {
        const sorted = foes.slice().sort((a, b) => (caster.side === 'enemy' ? b.x - a.x : a.x - b.x));
        if (t.targetMode === 'front') xs = sorted.slice(0, 2).map(o => o.x);
        else if (t.targetMode === 'back') xs = sorted.slice(-2).map(o => o.x);
        else xs = sorted.map(o => o.x);
      }
      ctx.save();
      for (const x of xs) {
        const pulse = 0.55 + 0.45 * Math.sin(this.t * 14);
        ctx.globalAlpha = 0.18 + 0.25 * p * pulse;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(x, GROUND_Y + 8, 44, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = col; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(x, GROUND_Y + 8, 44 * (1.2 - p * 0.2), 14 * (1.2 - p * 0.2), 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawUnit(u, sim, dt) {
    const ctx = this.ctx;
    const v = this._vis(u);
    if (!u.alive) { v.fade = Math.max(0, v.fade - dt * 1.6); if (v.fade <= 0) return; }
    v.lunge = Math.max(0, v.lunge - dt); v.flash = Math.max(0, v.flash - dt);
    const moved = Math.abs(u.x - v.lastX) > 0.05; v.lastX = u.x;
    if (moved) v.walk += dt * 10; else v.walk *= 0.9;
    const facing = u.side === 'player' ? 1 : -1;
    const lunge = v.lunge > 0 ? Math.sin((v.lunge / 0.16) * Math.PI) * 12 * facing : 0;
    const big = u.isBoss ? 1.3 : u.isAdd ? 0.85 : 1;
    const x = u.x + lunge;
    const baseY = GROUND_Y + v.depth;
    const bob = Math.abs(Math.sin(v.walk)) * 5 + Math.sin(this.t * 2 + v.bob) * 1.2;
    const sink = u.alive ? 0 : (1 - v.fade) * 20;
    ctx.save();
    ctx.globalAlpha = u.alive ? 1 : v.fade;
    if (sim.time < u.invulnUntil) ctx.globalAlpha *= 0.55 + 0.3 * Math.sin(this.t * 30);
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(u.x, baseY + 4, 28 * big, 8 * big, 0, 0, Math.PI * 2); ctx.fill();
    const color = u.color || '#999999';
    const headR = 24 * big;
    const bodyTop = baseY - 34 * big - bob + sink;
    const headY = bodyTop - headR + 6 * big;
    // aura for enrage / buff
    const enraged = u.permAtk > 1.01;
    if (enraged || u.statuses.some(s => s.type === 'atkBuff')) {
      ctx.fillStyle = enraged ? 'rgba(255,60,60,0.22)' : 'rgba(255,170,60,0.2)';
      ctx.beginPath(); ctx.ellipse(u.x, headY + 20 * big, 42 * big, 56 * big, 0, 0, Math.PI * 2); ctx.fill();
    }
    // body (tunic)
    ctx.fillStyle = shade(color, -0.35);
    ctx.beginPath();
    ctx.moveTo(x - 18 * big, baseY - bob * 0.3 + sink);
    ctx.lineTo(x + 18 * big, baseY - bob * 0.3 + sink);
    ctx.lineTo(x + 12 * big, bodyTop + 4);
    ctx.lineTo(x - 12 * big, bodyTop + 4);
    ctx.closePath(); ctx.fill();
    // scarf / sash in nature colour
    const nat = u.activeNature;
    ctx.fillStyle = nat ? natureColor(nat) : (u.taijutsu ? '#f1f3f5' : '#9aa6b2');
    ctx.fillRect(x - 13 * big, bodyTop + 10 * big, 26 * big, 5 * big);
    // head
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, headY, headR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = u.side === 'player' ? 'rgba(255,255,255,0.85)' : 'rgba(20,20,26,0.85)';
    ctx.lineWidth = u.isBoss ? 4 : 2.5;
    ctx.stroke();
    // generic headband plate (no symbol)
    ctx.fillStyle = '#3b4652';
    ctx.fillRect(x - headR * 0.95, headY - headR * 0.55, headR * 1.9, headR * 0.28);
    ctx.fillStyle = '#c9d2dc';
    ctx.fillRect(x - headR * 0.35 + facing * headR * 0.1, headY - headR * 0.58, headR * 0.7, headR * 0.34);
    // initials
    ctx.fillStyle = inkFor(color);
    ctx.font = `900 ${Math.round(15 * big)}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(u.initials || u.name.slice(0, 2).toUpperCase(), x, headY + headR * 0.28);
    // hit flash
    if (v.flash > 0) {
      ctx.globalAlpha *= v.flash / 0.12 * 0.7;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x, headY, headR + 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // protect marker
    if (u.protected && u.alive) {
      ctx.save();
      ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.arc(u.x, headY, headR + 8, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    // stun stars
    if (u.alive && u.statuses.some(s => s.type === 'stun' && s.until > sim.time)) {
      ctx.save(); ctx.fillStyle = '#ffe066';
      for (let i = 0; i < 3; i++) {
        const a = this.t * 5 + i * 2.1;
        this._star(x + Math.cos(a) * 22 * big, headY - headR - 6 + Math.sin(a) * 5, 5);
      }
      ctx.restore();
    }
    // taunt ring / dr shield
    if (u.alive && u.statuses.some(s => s.type === 'taunt' && s.until > sim.time)) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,90,90,0.9)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, headY + 16 * big, 40 * big + Math.sin(this.t * 10) * 3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    // reflect hexagon
    if (u.alive && u.reflectUntil > sim.time) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) { const a = this.t * 6 + i * Math.PI / 3; const px = x + Math.cos(a) * 50 * big, py = headY + 16 * big + Math.sin(a) * 50 * big; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.stroke(); ctx.restore();
    }
    // absorb shield bubble
    if (u.alive && u.shield > 0) {
      ctx.save(); ctx.fillStyle = 'rgba(120,200,255,0.16)'; ctx.strokeStyle = 'rgba(150,220,255,0.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, headY + 14 * big, 46 * big, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  }

  _star(x, y, r) {
    const ctx = this.ctx; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
  }

  _drawHud(u, sim) {
    const ctx = this.ctx;
    const v = this._vis(u);
    const big = u.isBoss ? 1.3 : u.isAdd ? 0.85 : 1;
    const top = GROUND_Y + v.depth - 34 * big - 48 * big - 22;
    const w = u.isBoss ? 120 : 60, h = u.isBoss ? 9 : 7;
    const x = u.x - w / 2;
    // HP
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - 1, top - 1, w + 2, h + 2);
    const pct = Math.max(0, u.hp / u.maxHp);
    ctx.fillStyle = u.side === 'player' ? (u.protected ? '#3ddc84' : '#48d17a') : (u.isBoss ? '#ff4d4d' : '#ff7a59');
    ctx.fillRect(x, top, w * pct, h);
    if (u.shield > 0) { ctx.fillStyle = 'rgba(160,220,255,0.9)'; ctx.fillRect(x, top, Math.min(w, w * u.shield / u.maxHp), 3); }
    // nature pip
    if (u.activeNature) {
      ctx.fillStyle = natureColor(u.activeNature);
      ctx.beginPath(); ctx.arc(x - 8, top + h / 2, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // chakra (player + enemies with jutsu)
    if (u.side === 'player' && !u.protected) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - 1, top + h + 2, w + 2, 5);
      const full = u.chakra >= sim.B.combat.chakra.max;
      ctx.fillStyle = full ? `rgba(155,227,255,${0.7 + 0.3 * Math.sin(this.t * 10)})` : '#4dabf7';
      ctx.fillRect(x, top + h + 3, w * Math.min(1, u.chakra / sim.B.combat.chakra.max), 3);
    }
    // boss name / protect label
    if (u.isBoss || u.protected) {
      ctx.font = '800 15px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillText(u.protected ? `Protect: ${u.short || u.name}` : u.name, u.x + 1, top - 3 + 1);
      ctx.fillStyle = u.protected ? '#baffd6' : '#ffe1e1'; ctx.fillText(u.protected ? `Protect: ${u.short || u.name}` : u.name, u.x, top - 3);
    }
  }

  _drawTelegraphBars(sim) {
    const ctx = this.ctx;
    for (const t of sim.telegraphs) {
      const c = sim.unit(t.caster); if (!c || !c.alive) continue;
      const v = this._vis(c);
      const big = c.isBoss ? 1.3 : 1;
      const y = GROUND_Y + v.depth - 34 * big - 48 * big - (c.isBoss ? 78 : 66);
      const p = Math.min(1, (sim.time - t.startedAt) / Math.max(0.01, t.endsAt - t.startedAt));
      const col = natureColor(t.nature);
      ctx.font = '900 16px system-ui, sans-serif';
      const label = t.name;
      const tw = Math.min(360, Math.max(140, ctx.measureText(label).width + 30));
      const x = Math.max(8, Math.min(W - tw - 8, c.x - tw / 2));
      ctx.fillStyle = 'rgba(8,10,14,0.85)';
      this._round(x, y - 26, tw, 34, 8); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 2; this._round(x, y - 26, tw, 34, 8); ctx.stroke();
      ctx.fillStyle = col; ctx.fillRect(x + 4, y + 2, (tw - 8) * p, 3);
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((t.clashable && sim.clashEnabled ? '⚠ ' : '') + label, x + tw / 2, y - 10);
    }
  }

  _round(x, y, w, h, r) {
    const ctx = this.ctx; ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
}

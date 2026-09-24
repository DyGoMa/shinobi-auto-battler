// Effects.js — short-lived visuals driven by BattleSim events: floating
// damage numbers ("EFFECTIVE!" / "resisted"), element-coloured bursts,
// projectiles, clash banners and screen shake. Purely cosmetic.
import { W, GROUND_Y, natureColor } from './Renderer.js';

const MAX_ITEMS = 260;

export class Effects {
  constructor(renderer) {
    this.r = renderer;
    this.items = [];
    this.shakeT = 0; this.shakeMag = 0;
    this.announce = null; // { text, color, t, dur }
    this.lastTag = new Map(); // throttle EFFECTIVE!/resisted popups per unit
  }

  shake(mag = 8, dur = 0.3) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeT = Math.max(this.shakeT, dur); }
  shakeOffset() {
    if (this.shakeT <= 0) return { x: 0, y: 0 };
    const m = this.shakeMag * Math.min(1, this.shakeT / 0.3);
    return { x: (Math.random() * 2 - 1) * m, y: (Math.random() * 2 - 1) * m * 0.6 };
  }

  _push(it) { if (this.items.length < MAX_ITEMS) this.items.push(it); }

  text(x, y, str, { color = '#fff', size = 22, dur = 0.9, vy = -60, weight = 900, stroke = true } = {}) {
    this._push({ kind: 'text', x, y, str, color, size, t: 0, dur, vy, weight, stroke });
  }
  ring(x, y, color, { r0 = 10, r1 = 120, dur = 0.5, width = 6 } = {}) { this._push({ kind: 'ring', x, y, color, r0, r1, t: 0, dur, width }); }
  sparks(x, y, color, n = 8, speed = 220) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.8);
      this._push({ kind: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, color, t: 0, dur: 0.45 + Math.random() * 0.3, size: 3 + Math.random() * 3 });
    }
  }
  projectile(x0, y0, x1, y1, color) { this._push({ kind: 'proj', x0, y0, x1, y1, color, t: 0, dur: 0.22 }); }
  beam(x0, y0, x1, y1, c0, c1) { this._push({ kind: 'beam', x0, y0, x1, y1, c0, c1, t: 0, dur: 0.7 }); }
  say(text, color = '#fff', dur = 1.6) { this.announce = { text, color, t: 0, dur }; }

  headY(u) { return this.r.unitY(u) - (34 * (u.isBoss ? 1.3 : 1) + 60) * this.r.unitScale; }

  /** Translate sim events into visuals. Returns nothing; audio is handled by the caller. */
  onEvents(events, sim) {
    for (const e of events) {
      const u = e.uid != null ? sim.unit(e.uid) : null;
      switch (e.type) {
        case 'attack': {
          const src = sim.unit(e.uid), tgt = sim.unit(e.target);
          if (!src || !tgt) break;
          this.r.onAttack(src);
          if (src.range > 150) this.projectile(src.x, this.headY(src) + 30, tgt.x, this.headY(tgt) + 30, natureColor(src.activeNature || src.natures?.[0]));
          break;
        }
        case 'damage': {
          if (!u) break;
          this.r.onHit(u);
          const y = this.headY(u) - 6;
          const x = u.x + (Math.random() * 30 - 15);
          const kind = e.kind;
          const size = kind === 'ult' || kind === 'special' ? 30 : e.crit ? 27 : 20;
          let color = u.side === 'player' ? '#ffb4b4' : '#ffffff';
          if (e.relation > 0) color = natureColor(e.nature);
          else if (e.relation < 0) color = '#9aa4ae';
          if (kind === 'reflect') color = '#e5b3ff';
          this.text(x, y, (e.crit ? '✦' : '') + e.amount.toLocaleString(), { color, size });
          const now = sim.time; const last = this.lastTag.get(u.uid) || -9;
          if (e.relation !== 0 && now - last > 0.7) {
            this.lastTag.set(u.uid, now);
            this.text(x, y - 26, e.relation > 0 ? 'EFFECTIVE!' : 'resisted', { color: e.relation > 0 ? natureColor(e.nature) : '#9aa4ae', size: e.relation > 0 ? 17 : 14, dur: 0.8, vy: -40 });
          }
          if (kind === 'ult' || kind === 'special' || e.crit) this.sparks(u.x, y + 40, e.relation > 0 ? natureColor(e.nature) : '#fff3c4', kind === 'auto' ? 5 : 12);
          if (e.absorbed > 0) this.text(x + 20, y + 12, `(${e.absorbed} absorbed)`, { color: '#9ed8ff', size: 13, dur: 0.7 });
          break;
        }
        case 'heal': if (u) this.text(u.x, this.headY(u), '+' + e.amount.toLocaleString(), { color: '#6dff9f', size: 20 }); break;
        case 'miss': if (u) this.text(u.x, this.headY(u), 'miss', { color: '#c8cdd3', size: 14, dur: 0.6 }); break;
        case 'ult': {
          if (!u) break;
          const col = natureColor(e.nature);
          this.ring(u.x, this.headY(u) + 40, col, { r1: 150, width: 8 });
          this.ring(u.x, this.headY(u) + 40, '#ffffff', { r1: 90, width: 3, dur: 0.35 });
          this.sparks(u.x, this.headY(u) + 40, col, 18, 320);
          this.say(`${u.short}: ${e.name}!`, col, 1.4);
          break;
        }
        case 'shake': this.shake(9 * (e.amount || 1), e.seconds || 0.35); break;
        case 'aoe': this.ring(e.x, GROUND_Y - 30, '#ffffff', { r1: e.radius, width: 5, dur: 0.45 }); break;
        case 'clash': {
          const caster = sim.unit(e.caster);
          if (u && caster) {
            const c0 = natureColor(u.natures?.[0]), c1 = natureColor(e.nature);
            this.beam(u.x, this.headY(u) + 40, caster.x, this.headY(caster) + 40, c0, c1);
            const mid = (u.x + caster.x) / 2;
            this.ring(mid, this.headY(caster) + 40, e.outcome === 'overpower' ? c0 : e.outcome === 'overwhelmed' ? c1 : '#ffffff', { r1: 170, width: 10, dur: 0.6 });
            this.sparks(mid, this.headY(caster) + 40, c0, 16, 380);
            this.sparks(mid, this.headY(caster) + 40, c1, 16, 380);
          }
          const label = { overpower: 'OVERPOWER!', standoff: 'STANDOFF', overwhelmed: 'OVERWHELMED' }[e.outcome];
          const col = { overpower: '#3ddc84', standoff: '#ffcc4d', overwhelmed: '#ff5d5d' }[e.outcome];
          this.say(`JUTSU CLASH — ${label}`, col, 1.8);
          this.shake(12, 0.45);
          break;
        }
        case 'jutsuLand': {
          for (const id of e.targets || []) { const g = sim.unit(id); if (g) this.sparks(g.x, this.headY(g) + 40, natureColor(e.nature), 10, 260); }
          this.shake(6, 0.25);
          break;
        }
        case 'telegraph': if (u && e.special) this.say(`${u.short || u.name}: ${e.name}`, natureColor(e.nature), 1.4); break;
        case 'death': if (u) { this.sparks(u.x, this.headY(u) + 40, '#cfd6de', 14, 200); this.ring(u.x, GROUND_Y - 20, 'rgba(255,255,255,0.6)', { r1: 70, width: 3 }); } break;
        case 'revive': if (u) { this.ring(u.x, this.headY(u) + 40, '#ffd43b', { r1: 140, width: 7, dur: 0.7 }); this.say(`${u.short || u.name}: ${e.name}!`, '#ffd43b'); } break;
        case 'shield': if (u) { this.ring(u.x, this.headY(u) + 40, '#9ed8ff', { r1: 110 }); this.say(`${u.short || u.name}: ${e.name}`, '#9ed8ff'); } break;
        case 'shieldBreak': if (u) { this.text(u.x, this.headY(u) - 20, 'SHIELD BROKEN', { color: '#9ed8ff', size: 18 }); this.sparks(u.x, this.headY(u) + 40, '#9ed8ff', 14); } break;
        case 'enrage': if (u) { this.ring(u.x, this.headY(u) + 40, '#ff4d4d', { r1: 160, width: 8 }); this.say(`${u.short || u.name}: ${e.name}!`, '#ff6b6b'); this.shake(8, 0.4); } break;
        case 'swap': if (u) { this.ring(u.x, this.headY(u) + 40, natureColor(e.nature), { r1: 140, width: 8 }); this.say(`${u.short || u.name} → ${e.nature} Style (${e.name})`, natureColor(e.nature)); } break;
        case 'reflectWarn': if (u) this.say(`${u.short || u.name}: ${e.name} — hold your attacks!`, '#e5b3ff', 1.4); break;
        case 'reflect': if (u) this.ring(u.x, this.headY(u) + 40, '#ffffff', { r1: 120, width: 5 }); break;
        case 'summon': if (u) this.say(`${u.short || u.name}: ${e.name}`, '#ffb86b'); break;
        case 'rally': if (u) this.say(e.name, '#ffb86b', 1.2); break;
        case 'stun': if (u) this.text(u.x, this.headY(u) - 18, 'STUNNED', { color: '#ffe066', size: 15, dur: 0.8 }); break;
        case 'immune': if (u) this.text(u.x, this.headY(u), 'immune', { color: '#ffd43b', size: 14, dur: 0.5 }); break;
        default: break;
      }
    }
  }

  update(dt) {
    this.shakeT = Math.max(0, this.shakeT - dt);
    if (this.shakeT <= 0) this.shakeMag = 0;
    for (const it of this.items) {
      it.t += dt;
      if (it.kind === 'text') it.y += it.vy * dt * (1 - it.t / it.dur);
      if (it.kind === 'spark') { it.x += it.vx * dt; it.y += it.vy * dt; it.vy += 600 * dt; }
    }
    this.items = this.items.filter(it => it.t < it.dur);
    if (this.announce) { this.announce.t += dt; if (this.announce.t > this.announce.dur) this.announce = null; }
  }

  draw(ctx) {
    for (const it of this.items) {
      const p = it.t / it.dur;
      ctx.save();
      switch (it.kind) {
        case 'text': {
          ctx.globalAlpha = p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3;
          const sc = p < 0.12 ? 0.6 + p / 0.12 * 0.5 : 1.1 - Math.min(0.1, (p - 0.12));
          // Floating text grows half as much as the units on phone portrait (readable, less clutter).
          ctx.font = `${it.weight} ${Math.round(it.size * sc * (1 + (this.r.unitScale - 1) * 0.5))}px system-ui, sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          if (it.stroke) { ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.strokeText(it.str, it.x, it.y); }
          ctx.fillStyle = it.color; ctx.fillText(it.str, it.x, it.y);
          break;
        }
        case 'ring': {
          ctx.globalAlpha = 1 - p;
          ctx.strokeStyle = it.color; ctx.lineWidth = it.width * (1 - p * 0.6);
          ctx.beginPath(); ctx.arc(it.x, it.y, it.r0 + (it.r1 - it.r0) * Math.sqrt(p), 0, Math.PI * 2); ctx.stroke();
          break;
        }
        case 'spark': {
          ctx.globalAlpha = 1 - p; ctx.fillStyle = it.color;
          ctx.beginPath(); ctx.arc(it.x, it.y, it.size * (1 - p * 0.5), 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'proj': {
          const x = it.x0 + (it.x1 - it.x0) * p, y = it.y0 + (it.y1 - it.y0) * p - Math.sin(p * Math.PI) * 30;
          ctx.fillStyle = it.color; ctx.shadowColor = it.color; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
          break;
        }
        case 'beam': {
          ctx.globalAlpha = 1 - p;
          const mx = (it.x0 + it.x1) / 2, my = (it.y0 + it.y1) / 2;
          const reach = Math.min(1, p * 4);
          ctx.lineCap = 'round';
          ctx.lineWidth = 14 * (1 - p * 0.7);
          ctx.strokeStyle = it.c0; ctx.beginPath(); ctx.moveTo(it.x0, it.y0); ctx.lineTo(it.x0 + (mx - it.x0) * reach, it.y0 + (my - it.y0) * reach); ctx.stroke();
          ctx.strokeStyle = it.c1; ctx.beginPath(); ctx.moveTo(it.x1, it.y1); ctx.lineTo(it.x1 + (mx - it.x1) * reach, it.y1 + (my - it.y1) * reach); ctx.stroke();
          break;
        }
        default: break;
      }
      ctx.restore();
    }
    if (this.announce) {
      const a = this.announce; const p = a.t / a.dur;
      ctx.save();
      ctx.globalAlpha = p < 0.1 ? p / 0.1 : p > 0.8 ? (1 - p) / 0.2 : 1;
      const us = Math.min(this.r.unitScale, 1.8);
      ctx.font = `900 ${Math.round(30 * us)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tw = Math.min(W - 40, ctx.measureText(a.text).width + 50);
      const top = 58, bh = 50 * us;
      ctx.fillStyle = 'rgba(6,8,12,0.72)';
      ctx.fillRect(W / 2 - tw / 2, top, tw, bh);
      ctx.fillStyle = a.color; ctx.fillRect(W / 2 - tw / 2, top + bh - 2, tw, 3);
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(a.text, W / 2, top + bh / 2, W - 60);
      ctx.fillStyle = '#ffffff'; ctx.fillText(a.text, W / 2, top + bh / 2, W - 60);
      ctx.restore();
    }
  }
}

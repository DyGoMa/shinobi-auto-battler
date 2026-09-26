// mockup/stage.js — code-drawn parallax stages with weather (the shipping stage renderer's
// first cut, see docs/ART_BIBLE.md §4). Logical 1280×720, the ground line at y = 560, the
// units stand on y 520–600. Every layer is drawn once into an offscreen canvas that is
// PAD wider than the screen on each side, so the camera can pan (parallax) and push in
// (zoom) without ever showing an edge. Weather is drawn live over the layers.
export const W = 1280, H = 720, GROUND_Y = 560, PAD = 96;

export function hexToRgb(hex) { const c = hex.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
export function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
export function shade(hex, amt) { const [r, g, b] = hexToRgb(hex); const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + amt)))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
export function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; }

// ---------------------------------------------------------------- shape helpers (world coords)
export function poly(g, pts, fill, stroke, lw = 3) {
  g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); }
}
/** A rolling silhouette (hills, a forest line, a sea swell) from x0 to x1, filled down to `bottom`. */
export function ridge(g, base, amp, freq, phase, fill, x0 = -PAD, x1 = W + PAD, bottom = GROUND_Y + 60) {
  g.fillStyle = fill; g.beginPath(); g.moveTo(x0, bottom);
  for (let x = x0; x <= x1; x += 12) g.lineTo(x, base - Math.abs(Math.sin(x * freq + phase)) * amp - Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.3);
  g.lineTo(x1, bottom); g.closePath(); g.fill();
}
export function canopy(g, x, y, r, fill) {
  g.fillStyle = fill; g.beginPath();
  g.arc(x - r * 0.55, y + r * 0.05, r * 0.7, 0, Math.PI * 2); g.arc(x + r * 0.5, y + r * 0.08, r * 0.75, 0, Math.PI * 2); g.arc(x, y - r * 0.4, r * 0.82, 0, Math.PI * 2);
  g.fill();
}
export function tree(g, x, baseY, h, fill, trunk) {
  g.fillStyle = trunk; g.fillRect(x - h * 0.045, baseY - h * 0.5, h * 0.09, h * 0.5);
  canopy(g, x, baseY - h * 0.66, h * 0.3, fill);
}
export function cloudShape(g, x, y, w, fill) {
  g.fillStyle = fill; g.beginPath();
  g.ellipse(x, y, w * 0.5, w * 0.15, 0, 0, Math.PI * 2);
  g.ellipse(x - w * 0.22, y - w * 0.05, w * 0.24, w * 0.13, 0, 0, Math.PI * 2);
  g.ellipse(x + w * 0.16, y - w * 0.08, w * 0.3, w * 0.16, 0, 0, Math.PI * 2);
  g.fill();
}
/** An irregular rock: n points around (x, y) with radius r, seeded by `seed` so it never jitters. */
export function rock(g, x, y, r, fill, seed = 1, stroke = null) {
  const pts = []; const n = 6 + (seed % 3);
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const rr = r * (0.7 + 0.3 * Math.abs(Math.sin(seed * 7.3 + i * 2.1))); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7]); }
  poly(g, pts, fill, stroke);
}
export function crack(g, x, y, len, seed, color = 'rgba(0,0,0,0.35)') {
  g.strokeStyle = color; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y);
  let px = x, py = y; for (let i = 0; i < 5; i++) { px += len / 5 * (0.6 + Math.abs(Math.sin(seed + i)) * 0.8) * (seed % 2 ? 1 : -1); py += (Math.sin(seed * 3 + i * 1.7)) * 6; g.lineTo(px, py); }
  g.stroke();
}

// ---------------------------------------------------------------- weather
function makeWeather(kind) {
  if (!kind) return null;
  const rnd = (a, b) => a + Math.random() * (b - a);
  if (kind === 'mist') {
    const bands = Array.from({ length: 7 }, (_, i) => ({ x: rnd(-200, W), y: 300 + i * 48 + rnd(-20, 20), w: rnd(420, 760), h: rnd(40, 70), a: rnd(0.10, 0.22), vx: rnd(-18, 18) || 9 }));
    return { draw(g, dt) { for (const b of bands) { b.x += b.vx * dt; if (b.x > W + 500) b.x = -500; if (b.x < -500) b.x = W + 500; const gr = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.w / 2); gr.addColorStop(0, `rgba(255,255,255,${b.a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(b.x, b.y, b.w / 2, b.h / 2, 0, 0, Math.PI * 2); g.fill(); } } };
  }
  if (kind === 'embers' || kind === 'ash') {
    const ash = kind === 'ash';
    const ps = Array.from({ length: 42 }, () => ({ x: rnd(-PAD, W + PAD), y: rnd(0, H), vy: ash ? rnd(8, 22) : rnd(-38, -14), sway: rnd(0, 6.3), r: rnd(1.5, 3.5), a: rnd(0.4, 0.9) }));
    return { draw(g, dt, t) { for (const p of ps) { p.y += p.vy * dt; p.x += Math.sin(t * 1.3 + p.sway) * 14 * dt; if (p.y < -10) { p.y = H + 10; p.x = rnd(-PAD, W + PAD); } if (p.y > H + 10) { p.y = -10; p.x = rnd(-PAD, W + PAD); } const tw = 0.6 + 0.4 * Math.sin(t * 6 + p.sway); g.globalAlpha = p.a * tw; g.fillStyle = ash ? '#c9c4bb' : (p.r > 2.6 ? '#ffb347' : '#ff6a2a'); g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1; } };
  }
  if (kind === 'leaves') {
    const ps = Array.from({ length: 14 }, () => ({ x: rnd(-PAD, W + PAD), y: rnd(0, H), vx: rnd(26, 60), vy: rnd(14, 34), rot: rnd(0, 6.3), vr: rnd(-3, 3), c: Math.random() < 0.7 ? '#7cc36a' : '#d9c24a' }));
    return { draw(g, dt, t) { for (const p of ps) { p.x += p.vx * dt; p.y += (p.vy + Math.sin(t * 2 + p.rot) * 12) * dt; p.rot += p.vr * dt; if (p.x > W + PAD || p.y > H + 10) { p.x = -PAD - 10; p.y = rnd(-20, H * 0.6); } g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI * 2); g.fill(); g.restore(); } } };
  }
  if (kind === 'rain' || kind === 'snow' || kind === 'sand') {
    const n = kind === 'rain' ? 90 : kind === 'snow' ? 70 : 60;
    const ps = Array.from({ length: n }, () => ({ x: rnd(-PAD, W + PAD), y: rnd(-H, H), s: rnd(0.6, 1.4) }));
    return { draw(g, dt, t) {
      g.strokeStyle = kind === 'rain' ? 'rgba(200,220,240,0.55)' : 'rgba(230,214,170,0.55)'; g.lineWidth = 2; g.fillStyle = 'rgba(255,255,255,0.9)';
      for (const p of ps) {
        if (kind === 'rain') { p.y += 620 * p.s * dt; p.x -= 120 * p.s * dt; if (p.y > H + 20) { p.y = -20; p.x = rnd(-PAD, W + PAD * 2); } g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - 4, p.y + 18 * p.s); g.stroke(); }
        else if (kind === 'snow') { p.y += 40 * p.s * dt; p.x += Math.sin(t + p.s * 9) * 18 * dt; if (p.y > H + 10) { p.y = -10; p.x = rnd(-PAD, W + PAD); } g.beginPath(); g.arc(p.x, p.y, 2.2 * p.s, 0, Math.PI * 2); g.fill(); }
        else { p.x += 420 * p.s * dt; p.y += Math.sin(t * 3 + p.s * 5) * 30 * dt; if (p.x > W + PAD) { p.x = -PAD - 10; p.y = rnd(GROUND_Y - 240, H); } g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - 26 * p.s, p.y + 1); g.stroke(); }
      }
    } };
  }
  return null;
}

// ---------------------------------------------------------------- the stages
// Each stage: sky (top, mid, horizon), optional sun/moon, palette, layers (depth 0 = the far
// horizon, 1 = the ground plane; a layer moves by cam.x × depth), ground, weather.
export const STAGES = {
  // Part I · Land of Waves · "Showdown on the Bridge": the unfinished bridge in the mist.
  waves_bridge: {
    name: 'The Great Naruto Bridge', era: 'p1', arc: 'Land of Waves', time: 'Overcast morning', weather: 'mist',
    sky: ['#9fb3c2', '#cfdbe3', '#eef2f5'],
    palette: { far: '#8ea4b1', mid: '#6d8391', near: '#4a5c68', ground: '#a3adb4', ground2: '#5d676e', water: '#7f97a8', accent: '#38bdf8' },
    layers: [
      { depth: 0.08, draw(g, p) { // the sea and distant islands
        const sea = g.createLinearGradient(0, 430, 0, GROUND_Y + 20); sea.addColorStop(0, shade(p.water, 0.18)); sea.addColorStop(1, shade(p.water, -0.25));
        g.fillStyle = sea; g.fillRect(-PAD, 430, W + PAD * 2, GROUND_Y - 400);
        ridge(g, 436, 26, 0.006, 0.4, rgba(p.far, 0.75), -PAD, 520, 470);
        ridge(g, 440, 34, 0.005, 2.1, rgba(p.far, 0.7), 760, W + PAD, 470);
        g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; for (let i = 0; i < 18; i++) { const y = 452 + i * 6.5, x = ((i * 233) % (W + PAD * 2)) - PAD; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40 + (i % 4) * 22, y); g.stroke(); }
      } },
      { depth: 0.28, draw(g, p) { // the bridge's concrete pylons and the far span
        const pylon = (x) => { poly(g, [[x - 34, GROUND_Y - 10], [x + 34, GROUND_Y - 10], [x + 26, 150], [x - 26, 150]], p.mid, 'rgba(20,28,34,0.5)'); g.fillStyle = shade(p.mid, 0.16); g.fillRect(x - 26, 150, 22, GROUND_Y - 160); g.fillStyle = shade(p.mid, -0.2); g.fillRect(x - 40, 140, 80, 22); g.fillRect(x - 30, 300, 60, 12); };
        pylon(228); pylon(1052);
        // the far span behind the units: a long beam and its shadow line
        g.fillStyle = shade(p.mid, -0.1); g.fillRect(-PAD, 470, W + PAD * 2, 14); g.fillStyle = shade(p.mid, -0.35); g.fillRect(-PAD, 484, W + PAD * 2, 5);
      } },
      { depth: 0.6, draw(g, p) { // the railing along the far edge, crates of construction stone
        g.fillStyle = p.near; g.fillRect(-PAD, 508, W + PAD * 2, 6); g.fillRect(-PAD, 530, W + PAD * 2, 4);
        for (let x = -PAD + 20; x < W + PAD; x += 88) { g.fillStyle = shade(p.near, -0.15); g.fillRect(x, 500, 10, 60); g.fillStyle = shade(p.near, 0.2); g.fillRect(x, 500, 4, 60); }
        rock(g, 96, 548, 36, shade(p.ground, -0.3), 3, 'rgba(20,28,34,0.5)'); rock(g, 150, 552, 24, shade(p.ground, -0.22), 5, 'rgba(20,28,34,0.5)');
        rock(g, 1180, 550, 30, shade(p.ground, -0.3), 8, 'rgba(20,28,34,0.5)');
      } },
    ],
    ground(g, p) {
      const gr = g.createLinearGradient(0, GROUND_Y - 30, 0, H); gr.addColorStop(0, p.ground); gr.addColorStop(1, p.ground2);
      g.fillStyle = gr; g.fillRect(-PAD, GROUND_Y - 24, W + PAD * 2, H - GROUND_Y + 24);
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-PAD, GROUND_Y - 24, W + PAD * 2, 6);
      g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 2;
      for (let x = -PAD; x < W + PAD; x += 96) { g.beginPath(); g.moveTo(x, GROUND_Y - 18); g.lineTo(x - 30, H); g.stroke(); }
      g.beginPath(); g.moveTo(-PAD, GROUND_Y + 44); g.lineTo(W + PAD, GROUND_Y + 44); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(-PAD, GROUND_Y + 18, W + PAD * 2, 3);
    },
  },

  // Part II · Tenchi Bridge arc · "The Power of Uchiha": the roof of Orochimaru's hideout, blown open.
  hideout_crater: {
    name: "Orochimaru's hideout", era: 'p2', arc: 'Tenchi Bridge Reconnaissance Mission', time: 'Overcast noon', weather: 'ash',
    sky: ['#4a5262', '#8d95a3', '#c4c8cf'],
    palette: { far: '#6a7382', mid: '#555c68', near: '#3b414b', ground: '#6e727a', ground2: '#33363d', accent: '#e63946' },
    layers: [
      { depth: 0.08, draw(g, p) { ridge(g, 470, 90, 0.0035, 0.8, rgba(p.far, 0.6)); ridge(g, 500, 60, 0.006, 2.7, rgba(p.far, 0.85)); } },
      { depth: 0.3, draw(g, p) { // the collapsed dome and its broken slabs
        poly(g, [[300, GROUND_Y - 20], [980, GROUND_Y - 20], [900, 300], [720, 250], [560, 265], [380, 320]], p.mid, 'rgba(15,17,22,0.55)');
        poly(g, [[560, 265], [720, 250], [700, 200], [600, 205]], shade(p.mid, 0.15), 'rgba(15,17,22,0.55)');
        poly(g, [[420, 330], [520, 300], [520, 380], [440, 420]], shade(p.mid, -0.35), 'rgba(15,17,22,0.55)');
        poly(g, [[760, 300], [860, 330], [830, 420], [740, 400]], shade(p.mid, -0.4), 'rgba(15,17,22,0.55)');
        g.fillStyle = 'rgba(10,12,16,0.7)'; g.fillRect(610, 330, 70, 90); g.fillRect(700, 340, 40, 60);
        poly(g, [[1060, GROUND_Y - 10], [1140, GROUND_Y - 10], [1110, 380], [1080, 372]], shade(p.mid, -0.1), 'rgba(15,17,22,0.55)');
        poly(g, [[140, GROUND_Y - 10], [230, GROUND_Y - 10], [250, 430], [170, 440]], shade(p.mid, -0.15), 'rgba(15,17,22,0.55)');
      } },
      { depth: 0.6, draw(g, p) { // the crater rim and rubble
        for (let i = 0; i < 16; i++) { const x = -PAD + i * 92 + (i % 3) * 20; rock(g, x, 548 - (i % 4) * 6, 26 + (i % 5) * 6, shade(p.near, (i % 2) * 0.12), i + 2, 'rgba(10,12,16,0.5)'); }
        poly(g, [[1150, GROUND_Y], [1230, GROUND_Y], [1300, 380], [1270, 372]], shade(p.near, 0.1), 'rgba(10,12,16,0.5)');
      } },
    ],
    ground(g, p) {
      const gr = g.createLinearGradient(0, GROUND_Y - 30, 0, H); gr.addColorStop(0, p.ground); gr.addColorStop(1, p.ground2);
      g.fillStyle = gr; g.fillRect(-PAD, GROUND_Y - 24, W + PAD * 2, H - GROUND_Y + 24);
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(-PAD, GROUND_Y - 24, W + PAD * 2, 6);
      for (let i = 0; i < 14; i++) crack(g, -PAD + i * 100, GROUND_Y + 20 + (i % 3) * 40, 120, i + 1);
      for (let i = 0; i < 10; i++) rock(g, -PAD + i * 140 + 40, GROUND_Y + 60 + (i % 3) * 30, 8 + (i % 3) * 4, shade(p.ground, -0.25), i + 4);
    },
  },

  // Part I · Prologue · Training Ground 3: the three posts and the memorial stone, first thing in the morning.
  training_ground: {
    name: 'Training Ground 3', era: 'p1', arc: 'Prologue: Survival Test', time: 'Early morning', weather: 'leaves',
    sky: ['#6fb2f5', '#b8dbff', '#eaf4ff'], sun: { x: 1010, y: 130, r: 46, color: '#fff6d0' },
    palette: { far: '#4f8a44', mid: '#3d7a36', near: '#2f5f2a', ground: '#63a352', ground2: '#2c5326', trunk: '#5b3d1e', accent: '#f97316' },
    layers: [
      { depth: 0.08, draw(g, p) { cloudShape(g, 240, 150, 260, 'rgba(255,255,255,0.85)'); cloudShape(g, 720, 110, 200, 'rgba(255,255,255,0.75)'); ridge(g, 480, 50, 0.004, 1.1, rgba(p.far, 0.75)); ridge(g, 500, 30, 0.009, 0.2, rgba(p.far, 0.9)); } },
      { depth: 0.3, draw(g, p) { for (let i = 0; i < 12; i++) { const x = -PAD + i * 128 + (i % 2) * 40; tree(g, x, GROUND_Y - 30 + (i % 3) * 8, 190 + (i % 4) * 30, shade(p.mid, (i % 2) * 0.12), p.trunk); } } },
      { depth: 0.6, draw(g, p) { // the memorial stone (left) and the three posts (right)
        poly(g, [[150, GROUND_Y - 4], [246, GROUND_Y - 4], [240, 470], [220, 440], [176, 440], [156, 470]], '#4a4f57', 'rgba(20,20,26,0.7)');
        g.fillStyle = '#343941'; g.fillRect(140, GROUND_Y - 12, 116, 12);
        g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(172, 470 + i * 12); g.lineTo(224, 470 + i * 12); g.stroke(); }
        const post = (x) => { poly(g, [[x - 13, GROUND_Y - 2], [x + 13, GROUND_Y - 2], [x + 11, 436], [x - 11, 436]], '#9a6633', 'rgba(30,20,10,0.75)'); g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x + 2, 438, 9, GROUND_Y - 442); g.fillStyle = '#c28a4a'; g.fillRect(x - 11, 436, 22, 6); };
        post(900); post(986); post(1072);
        for (let i = 0; i < 20; i++) { const x = -PAD + i * 72; g.fillStyle = shade(p.near, 0.25); g.beginPath(); g.moveTo(x, GROUND_Y - 2); g.lineTo(x + 5, GROUND_Y - 16 - (i % 3) * 4); g.lineTo(x + 10, GROUND_Y - 2); g.fill(); }
      } },
    ],
    ground(g, p) {
      const gr = g.createLinearGradient(0, GROUND_Y - 30, 0, H); gr.addColorStop(0, p.ground); gr.addColorStop(1, p.ground2);
      g.fillStyle = gr; g.fillRect(-PAD, GROUND_Y - 24, W + PAD * 2, H - GROUND_Y + 24);
      g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(-PAD, GROUND_Y - 24, W + PAD * 2, 5);
      g.fillStyle = 'rgba(120,80,40,0.35)'; g.beginPath(); g.ellipse(W / 2, GROUND_Y + 60, 700, 34, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.07)'; for (let i = 0; i < 30; i++) g.fillRect(-PAD + i * 60, GROUND_Y + 10 + (i % 4) * 26, 18, 3);
    },
  },
};

export class Stage {
  constructor(def) { this.def = def; this.layers = null; this.groundCanvas = null; this.t = 0; this.weather = makeWeather(def.weather); }
  _build() {
    const make = (draw) => { const c = document.createElement('canvas'); c.width = W + PAD * 2; c.height = H; const g = c.getContext('2d'); g.translate(PAD, 0); draw(g, this.def.palette); return c; };
    this.layers = this.def.layers.map(L => ({ depth: L.depth, canvas: make(L.draw) }));
    this.groundCanvas = make(this.def.ground);
  }
  /** cam: { x (pan), zoom }; dim: 0–1 darkening for dialogue. */
  draw(g, dt, cam = { x: 0, zoom: 1 }, dim = 0) {
    if (!this.layers) this._build();
    this.t += dt;
    const zoom = cam.zoom || 1, cx = cam.x || 0;
    g.save();
    const fx = W / 2, fy = GROUND_Y - 130;
    g.translate(fx, fy); g.scale(zoom, zoom); g.translate(-fx, -fy);
    const s = this.def.sky; const sky = g.createLinearGradient(0, -PAD, 0, GROUND_Y);
    sky.addColorStop(0, s[0]); sky.addColorStop(0.62, s[1]); sky.addColorStop(1, s[2]);
    g.fillStyle = sky; g.fillRect(-PAD, -PAD, W + PAD * 2, GROUND_Y + PAD);
    if (this.def.sun) { const S = this.def.sun; const gl = g.createRadialGradient(S.x, S.y, S.r * 0.6, S.x, S.y, S.r * 3); gl.addColorStop(0, rgba('#ffffff', 0.55)); gl.addColorStop(1, rgba('#ffffff', 0)); g.fillStyle = gl; g.beginPath(); g.arc(S.x, S.y, S.r * 3, 0, Math.PI * 2); g.fill(); g.fillStyle = S.color; g.beginPath(); g.arc(S.x, S.y, S.r, 0, Math.PI * 2); g.fill(); }
    for (const L of this.layers) g.drawImage(L.canvas, -PAD - cx * L.depth, 0);
    g.drawImage(this.groundCanvas, -PAD - cx, 0);
    if (this.weather) this.weather.draw(g, dt, this.t);
    if (dim) { g.fillStyle = `rgba(6,8,12,${dim})`; g.fillRect(-PAD * 2, -PAD * 2, W + PAD * 4, H + PAD * 4); }
    g.restore();
  }
}

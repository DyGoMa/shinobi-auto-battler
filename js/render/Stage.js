// Stage.js — the battle backgrounds, drawn in code: one landmark stage per arc (docs/ART_BIBLE.md
// §8), the Academy, the Boss Rush, and a few per-node variants. Logical 1280×720, the ground line
// at y = 560 (units stand on y 520–600). Each layer is drawn once into an offscreen canvas PAD
// wider than the screen on each side, so the camera can pan (parallax by depth) and push in
// (zoom) without showing an edge; the weather is drawn live over it.
export const W = 1280, H = 720, GROUND_Y = 560, PAD = 96;

export function hexToRgb(hex) { const c = String(hex).replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
export function rgba(hex, a) { if (!hex || hex[0] !== '#') return hex; const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
export function shade(hex, amt) { if (!hex || hex[0] !== '#') return hex; const [r, g, b] = hexToRgb(hex); const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 + amt)))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
export function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; }

// ---------------------------------------------------------------- shape helpers (world coords)
const TAU = Math.PI * 2;
const X0 = -PAD, X1 = W + PAD;
export function poly(g, pts, fill, stroke, lw = 3) {
  g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); }
}
/** A rolling silhouette (hills, a forest line, a swell) from x0 to x1, filled down to `bottom`. */
export function ridge(g, base, amp, freq, phase, fill, x0 = X0, x1 = X1, bottom = GROUND_Y + 60) {
  g.fillStyle = fill; g.beginPath(); g.moveTo(x0, bottom);
  for (let x = x0; x <= x1; x += 12) g.lineTo(x, base - Math.abs(Math.sin(x * freq + phase)) * amp - Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.3);
  g.lineTo(x1, bottom); g.closePath(); g.fill();
}
/** Jagged peaks (mountains, cliffs). */
export function peaks(g, base, amp, n, fill, seed = 1, x0 = X0, x1 = X1, bottom = GROUND_Y + 60) {
  g.fillStyle = fill; g.beginPath(); g.moveTo(x0, bottom);
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; const h = amp * (0.35 + 0.65 * Math.abs(Math.sin(seed * 3.1 + i * 2.7))); g.lineTo(x, base - h); }
  g.lineTo(x1, bottom); g.closePath(); g.fill();
}
export function canopy(g, x, y, r, fill) {
  g.fillStyle = fill; g.beginPath();
  g.arc(x - r * 0.55, y + r * 0.05, r * 0.7, 0, TAU); g.arc(x + r * 0.5, y + r * 0.08, r * 0.75, 0, TAU); g.arc(x, y - r * 0.4, r * 0.82, 0, TAU);
  g.fill();
}
export function tree(g, x, baseY, h, fill, trunk) { g.fillStyle = trunk; g.fillRect(x - h * 0.045, baseY - h * 0.5, h * 0.09, h * 0.5); canopy(g, x, baseY - h * 0.66, h * 0.3, fill); }
export function pine(g, x, baseY, h, fill, trunk) { g.fillStyle = trunk; g.fillRect(x - h * 0.03, baseY - h * 0.3, h * 0.06, h * 0.3); for (let i = 0; i < 3; i++) { const w = h * (0.34 - i * 0.08), y = baseY - h * (0.3 + i * 0.22); poly(g, [[x - w, y], [x + w, y], [x, y - h * 0.32]], fill); } }
export function forest(g, n, baseY, h, fill, trunk, seed = 1, kind = 'round') { for (let i = 0; i < n; i++) { const x = X0 + ((i * 131 + seed * 53) % (W + PAD * 2)); const hh = h * (0.75 + 0.5 * Math.abs(Math.sin(seed + i * 1.3))); (kind === 'pine' ? pine : tree)(g, x, baseY + (i % 3) * 6, hh, fill, trunk); } }
export function cloudShape(g, x, y, w, fill) {
  g.fillStyle = fill; g.beginPath();
  g.ellipse(x, y, w * 0.5, w * 0.15, 0, 0, TAU); g.ellipse(x - w * 0.22, y - w * 0.05, w * 0.24, w * 0.13, 0, 0, TAU); g.ellipse(x + w * 0.16, y - w * 0.08, w * 0.3, w * 0.16, 0, 0, TAU);
  g.fill();
}
export function rock(g, x, y, r, fill, seed = 1, stroke = null) {
  const pts = []; const n = 6 + (seed % 3);
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU; const rr = r * (0.7 + 0.3 * Math.abs(Math.sin(seed * 7.3 + i * 2.1))); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7]); }
  poly(g, pts, fill, stroke);
}
export function crack(g, x, y, len, seed, color = 'rgba(0,0,0,0.35)') {
  g.strokeStyle = color; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y);
  let px = x, py = y; for (let i = 0; i < 5; i++) { px += len / 5 * (0.6 + Math.abs(Math.sin(seed + i)) * 0.8) * (seed % 2 ? 1 : -1); py += Math.sin(seed * 3 + i * 1.7) * 6; g.lineTo(px, py); }
  g.stroke();
}
/** Water: a gradient from y0 to y1 with shimmer lines. */
export function water(g, y0, y1, color, shimmer = 'rgba(255,255,255,0.25)') {
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, shade(color, 0.18)); gr.addColorStop(1, shade(color, -0.25));
  g.fillStyle = gr; g.fillRect(X0, y0, W + PAD * 2, y1 - y0);
  g.strokeStyle = shimmer; g.lineWidth = 2; for (let i = 0; i < 22; i++) { const y = y0 + 12 + i * ((y1 - y0 - 20) / 22), x = ((i * 233) % (W + PAD * 2)) + X0; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40 + (i % 4) * 22, y); g.stroke(); }
}
/** A row of village houses: `roof` 'gable' (Leaf), 'dome' (Sand), 'flat' (Rain towers). */
export function houses(g, x0, x1, base, w, hMin, hMax, wall, roof, roofKind = 'gable', seed = 1) {
  for (let x = x0, i = 0; x < x1; x += w * (1.05 + (i % 3) * 0.15), i++) {
    const h = hMin + (hMax - hMin) * Math.abs(Math.sin(seed + i * 1.7)); const ww = w * (0.8 + 0.3 * Math.abs(Math.cos(i)));
    g.fillStyle = wall; g.fillRect(x, base - h, ww, h);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x + ww * 0.7, base - h, ww * 0.3, h);
    if (roofKind === 'gable') poly(g, [[x - ww * 0.1, base - h], [x + ww * 1.1, base - h], [x + ww * 0.5, base - h - ww * 0.45]], roof);
    else if (roofKind === 'dome') { g.fillStyle = roof; g.beginPath(); g.ellipse(x + ww / 2, base - h, ww * 0.55, ww * 0.35, 0, Math.PI, TAU); g.fill(); }
    else { g.fillStyle = roof; g.fillRect(x - 2, base - h - 6, ww + 4, 6); }
    g.fillStyle = 'rgba(255,230,160,0.55)'; for (let k = 0; k < Math.floor(h / 34); k++) if ((i + k) % 3 !== 1) g.fillRect(x + ww * 0.25, base - h + 10 + k * 34, ww * 0.18, 12);
  }
}
/** A statue: a tall totem silhouette (the Final Valley's founders). */
export function statue(g, x, base, h, fill, facing = 1) {
  g.fillStyle = fill;
  g.fillRect(x - h * 0.09, base - h * 0.62, h * 0.18, h * 0.62);
  poly(g, [[x - h * 0.16, base - h * 0.62], [x + h * 0.16, base - h * 0.62], [x + h * 0.12, base - h * 0.78], [x - h * 0.12, base - h * 0.78]], fill);
  g.beginPath(); g.arc(x, base - h * 0.86, h * 0.09, 0, TAU); g.fill();
  g.fillRect(x + facing * h * 0.1, base - h * 0.76, facing * h * 0.14, h * 0.05);
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x - h * 0.09, base - h * 0.62, h * 0.05, h * 0.62);
  g.fillStyle = shade(fill, -0.3); g.fillRect(x - h * 0.2, base - h * 0.04, h * 0.4, h * 0.04);
}
export function torii(g, x, base, h, color) { g.fillStyle = color; g.fillRect(x - h * 0.32, base - h, h * 0.64, h * 0.07); g.fillRect(x - h * 0.26, base - h * 0.82, h * 0.52, h * 0.05); g.fillRect(x - h * 0.22, base - h * 0.95, h * 0.05, h * 0.95); g.fillRect(x + h * 0.17, base - h * 0.95, h * 0.05, h * 0.95); }
export function lantern(g, x, y, color = '#ffb347') { const gl = g.createRadialGradient(x, y, 2, x, y, 40); gl.addColorStop(0, rgba(color, 0.55)); gl.addColorStop(1, rgba(color, 0)); g.fillStyle = gl; g.beginPath(); g.arc(x, y, 40, 0, TAU); g.fill(); g.fillStyle = color; g.fillRect(x - 5, y - 8, 10, 16); g.fillStyle = '#2b2118'; g.fillRect(x - 6, y - 10, 12, 3); g.fillRect(x - 6, y + 7, 12, 3); }
export function smokeColumn(g, x, base, h, color = 'rgba(80,80,90,0.55)') { for (let i = 0; i < 7; i++) { const y = base - i * (h / 7), r = 18 + i * 9; g.fillStyle = color; g.beginPath(); g.arc(x + Math.sin(i * 1.4) * 22, y, r, 0, TAU); g.fill(); } }
export function cliffFace(g, x0, x1, top, bottom, fill, seed = 1) { const pts = [[x0, bottom]]; const n = 8; for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, top + Math.abs(Math.sin(seed + i * 1.9)) * 18]); pts.push([x1, bottom]); poly(g, pts, fill); g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 2; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(x0 + (x1 - x0) * i / 6, top + 10); g.lineTo(x0 + (x1 - x0) * i / 6 + 12, bottom); g.stroke(); } }
function groundPlane(g, p, { top = GROUND_Y - 24, stripe = true, marks = 30, cracks = 0, edge = 'rgba(0,0,0,0.18)' } = {}) {
  const gr = g.createLinearGradient(0, top, 0, H); gr.addColorStop(0, p.ground); gr.addColorStop(1, p.ground2 || shade(p.ground, -0.45));
  g.fillStyle = gr; g.fillRect(X0, top, W + PAD * 2, H - top);
  g.fillStyle = edge; g.fillRect(X0, top, W + PAD * 2, 6);
  if (stripe) { g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(X0, GROUND_Y + 18, W + PAD * 2, 3); }
  g.fillStyle = 'rgba(0,0,0,0.14)'; for (let i = 0; i < marks; i++) g.fillRect(X0 + i * 64 + ((i % 2) * 20), GROUND_Y + 40 + (i % 3) * 22, 30, 3);
  for (let i = 0; i < cracks; i++) crack(g, X0 + i * 110, GROUND_Y + 20 + (i % 3) * 40, 120, i + 1);
}

// ---------------------------------------------------------------- weather
function makeWeather(kind) {
  if (!kind) return null;
  const rnd = (a, b) => a + Math.random() * (b - a);
  if (kind === 'mist' || kind === 'mist-thin') {
    const n = kind === 'mist' ? 7 : 4;
    const bands = Array.from({ length: n }, (_, i) => ({ x: rnd(-200, W), y: 300 + i * 48 + rnd(-20, 20), w: rnd(420, 760), h: rnd(40, 70), a: rnd(0.10, 0.22), vx: rnd(-18, 18) || 9 }));
    return { draw(g, dt) { for (const b of bands) { b.x += b.vx * dt; if (b.x > W + 500) b.x = -500; if (b.x < -500) b.x = W + 500; const gr = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.w / 2); gr.addColorStop(0, `rgba(255,255,255,${b.a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(b.x, b.y, b.w / 2, b.h / 2, 0, 0, TAU); g.fill(); } } };
  }
  if (kind === 'embers' || kind === 'ash' || kind === 'fireflies' || kind === 'motes') {
    const down = kind === 'ash', slow = kind === 'fireflies' || kind === 'motes';
    const ps = Array.from({ length: slow ? 24 : 42 }, () => ({ x: rnd(-PAD, W + PAD), y: rnd(0, H), vy: down ? rnd(8, 22) : slow ? rnd(-10, -3) : rnd(-38, -14), sway: rnd(0, 6.3), r: rnd(1.5, 3.5), a: rnd(0.4, 0.9) }));
    const col = kind === 'ash' ? '#c9c4bb' : kind === 'fireflies' ? '#d9f26b' : kind === 'motes' ? '#cfd6ff' : null;
    return { draw(g, dt, t) { for (const p of ps) { p.y += p.vy * dt; p.x += Math.sin(t * 1.3 + p.sway) * 14 * dt; if (p.y < -10) { p.y = H + 10; p.x = rnd(-PAD, W + PAD); } if (p.y > H + 10) { p.y = -10; p.x = rnd(-PAD, W + PAD); } const tw = 0.6 + 0.4 * Math.sin(t * 6 + p.sway); g.globalAlpha = p.a * tw; g.fillStyle = col || (p.r > 2.6 ? '#ffb347' : '#ff6a2a'); g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill(); } g.globalAlpha = 1; } };
  }
  if (kind === 'leaves') {
    const ps = Array.from({ length: 14 }, () => ({ x: rnd(-PAD, W + PAD), y: rnd(0, H), vx: rnd(26, 60), vy: rnd(14, 34), rot: rnd(0, 6.3), vr: rnd(-3, 3), c: Math.random() < 0.7 ? '#7cc36a' : '#d9c24a' }));
    return { draw(g, dt, t) { for (const p of ps) { p.x += p.vx * dt; p.y += (p.vy + Math.sin(t * 2 + p.rot) * 12) * dt; p.rot += p.vr * dt; if (p.x > W + PAD || p.y > H + 10) { p.x = -PAD - 10; p.y = rnd(-20, H * 0.6); } g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.c; g.beginPath(); g.ellipse(0, 0, 7, 3.5, 0, 0, TAU); g.fill(); g.restore(); } } };
  }
  if (kind === 'rain' || kind === 'snow' || kind === 'sand') {
    const n = kind === 'rain' ? 90 : kind === 'snow' ? 70 : 60;
    const ps = Array.from({ length: n }, () => ({ x: rnd(-PAD, W + PAD), y: rnd(-H, H), s: rnd(0.6, 1.4) }));
    return { draw(g, dt, t) {
      g.strokeStyle = kind === 'rain' ? 'rgba(200,220,240,0.55)' : 'rgba(230,214,170,0.55)'; g.lineWidth = 2; g.fillStyle = 'rgba(255,255,255,0.9)';
      for (const p of ps) {
        if (kind === 'rain') { p.y += 620 * p.s * dt; p.x -= 120 * p.s * dt; if (p.y > H + 20) { p.y = -20; p.x = rnd(-PAD, W + PAD * 2); } g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - 4, p.y + 18 * p.s); g.stroke(); }
        else if (kind === 'snow') { p.y += 40 * p.s * dt; p.x += Math.sin(t + p.s * 9) * 18 * dt; if (p.y > H + 10) { p.y = -10; p.x = rnd(-PAD, W + PAD); } g.beginPath(); g.arc(p.x, p.y, 2.2 * p.s, 0, TAU); g.fill(); }
        else { p.x += 420 * p.s * dt; p.y += Math.sin(t * 3 + p.s * 5) * 30 * dt; if (p.x > W + PAD) { p.x = -PAD - 10; p.y = rnd(GROUND_Y - 240, H); } g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - 26 * p.s, p.y + 1); g.stroke(); }
      }
    } };
  }
  return null;
}

// ---------------------------------------------------------------- the stages
// { name, era, time, weather, sky [top, mid, horizon], sun?, moon?, palette, layers [{depth, draw(g, p)}], ground(g, p) }
const G = (p, opts) => (g) => groundPlane(g, p, opts);
export const STAGES = {
  academy_night: {
    name: 'The Academy', era: 'p1', time: 'Graduation night', weather: 'fireflies', sky: ['#0d1730', '#233a6b', '#3f5a8f'], moon: { x: 1040, y: 130, r: 44, color: '#fff4cf' },
    palette: { far: '#1a2a4a', mid: '#2b3d63', near: '#1c2a45', ground: '#3a5a40', ground2: '#1d2e22', wood: '#5a3f24', accent: '#fbbf24' },
    layers: [
      { depth: 0.08, draw(g, p) { ridge(g, 470, 40, 0.005, 1.4, p.far); houses(g, X0, X1, 480, 70, 30, 60, shade(p.far, 0.25), shade(p.far, -0.1), 'gable', 2); } },
      { depth: 0.3, draw(g, p) { g.fillStyle = p.mid; g.fillRect(330, 330, 560, 230); poly(g, [[300, 330], [920, 330], [880, 270], [340, 270]], shade(p.mid, 0.2)); g.fillStyle = shade(p.mid, 0.35); g.fillRect(560, 250, 100, 90); poly(g, [[540, 250], [680, 250], [610, 205]], shade(p.mid, 0.1)); g.fillStyle = 'rgba(255,220,140,0.6)'; for (let i = 0; i < 7; i++) g.fillRect(360 + i * 76, 380, 30, 40); g.fillStyle = '#4a3320'; g.fillRect(150, 300, 30, 260); canopy(g, 165, 260, 120, '#243d2a'); } },
      { depth: 0.6, draw(g, p) { g.fillStyle = p.wood; for (let x = X0; x < X1; x += 60) g.fillRect(x, 522, 8, 38); g.fillRect(X0, 526, W + PAD * 2, 5); lantern(g, 280, 470, p.accent); lantern(g, 1010, 470, p.accent); } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 20 }); },
  },
  training_ground: {
    name: 'Training Ground 3', era: 'p1', time: 'Early morning', weather: 'leaves', sky: ['#6fb2f5', '#b8dbff', '#eaf4ff'], sun: { x: 1010, y: 130, r: 46, color: '#fff6d0' },
    palette: { far: '#4f8a44', mid: '#3d7a36', near: '#2f5f2a', ground: '#63a352', ground2: '#2c5326', trunk: '#5b3d1e', accent: '#f97316' },
    layers: [
      { depth: 0.08, draw(g, p) { cloudShape(g, 240, 150, 260, 'rgba(255,255,255,0.85)'); cloudShape(g, 720, 110, 200, 'rgba(255,255,255,0.75)'); ridge(g, 480, 50, 0.004, 1.1, rgba(p.far, 0.75)); ridge(g, 500, 30, 0.009, 0.2, rgba(p.far, 0.9)); } },
      { depth: 0.3, draw(g, p) { forest(g, 12, GROUND_Y - 30, 200, p.mid, p.trunk, 3); } },
      { depth: 0.6, draw(g, p) { poly(g, [[150, GROUND_Y - 4], [246, GROUND_Y - 4], [240, 470], [220, 440], [176, 440], [156, 470]], '#4a4f57', 'rgba(20,20,26,0.7)'); g.fillStyle = '#343941'; g.fillRect(140, GROUND_Y - 12, 116, 12); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(172, 470 + i * 12); g.lineTo(224, 470 + i * 12); g.stroke(); } const post = (x) => { poly(g, [[x - 13, GROUND_Y - 2], [x + 13, GROUND_Y - 2], [x + 11, 436], [x - 11, 436]], '#9a6633', 'rgba(30,20,10,0.75)'); g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x + 2, 438, 9, GROUND_Y - 442); g.fillStyle = '#c28a4a'; g.fillRect(x - 11, 436, 22, 6); }; post(900); post(986); post(1072); } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 0 }); g.fillStyle = 'rgba(120,80,40,0.35)'; g.beginPath(); g.ellipse(W / 2, GROUND_Y + 60, 700, 34, 0, 0, TAU); g.fill(); },
  },
  waves_bridge: {
    name: 'The Great Naruto Bridge', era: 'p1', time: 'Overcast morning', weather: 'mist', sky: ['#9fb3c2', '#cfdbe3', '#eef2f5'],
    palette: { far: '#8ea4b1', mid: '#6d8391', near: '#4a5c68', ground: '#a3adb4', ground2: '#5d676e', water: '#7f97a8', accent: '#38bdf8' },
    layers: [
      { depth: 0.08, draw(g, p) { water(g, 430, GROUND_Y + 20, p.water); ridge(g, 436, 26, 0.006, 0.4, rgba(p.far, 0.75), X0, 520, 470); ridge(g, 440, 34, 0.005, 2.1, rgba(p.far, 0.7), 760, X1, 470); } },
      { depth: 0.28, draw(g, p) { const pylon = (x) => { poly(g, [[x - 34, GROUND_Y - 10], [x + 34, GROUND_Y - 10], [x + 26, 150], [x - 26, 150]], p.mid, 'rgba(20,28,34,0.5)'); g.fillStyle = shade(p.mid, 0.16); g.fillRect(x - 26, 150, 22, GROUND_Y - 160); g.fillStyle = shade(p.mid, -0.2); g.fillRect(x - 40, 140, 80, 22); g.fillRect(x - 30, 300, 60, 12); }; pylon(228); pylon(1052); g.fillStyle = shade(p.mid, -0.1); g.fillRect(X0, 470, W + PAD * 2, 14); g.fillStyle = shade(p.mid, -0.35); g.fillRect(X0, 484, W + PAD * 2, 5); } },
      { depth: 0.6, draw(g, p) { g.fillStyle = p.near; g.fillRect(X0, 508, W + PAD * 2, 6); g.fillRect(X0, 530, W + PAD * 2, 4); for (let x = X0 + 20; x < X1; x += 88) { g.fillStyle = shade(p.near, -0.15); g.fillRect(x, 500, 10, 60); g.fillStyle = shade(p.near, 0.2); g.fillRect(x, 500, 4, 60); } rock(g, 96, 548, 36, shade(p.ground, -0.3), 3, 'rgba(20,28,34,0.5)'); rock(g, 1180, 550, 30, shade(p.ground, -0.3), 8, 'rgba(20,28,34,0.5)'); } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 0 }); g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 2; for (let x = X0; x < X1; x += 96) { g.beginPath(); g.moveTo(x, GROUND_Y - 18); g.lineTo(x - 30, H); g.stroke(); } g.beginPath(); g.moveTo(X0, GROUND_Y + 44); g.lineTo(X1, GROUND_Y + 44); g.stroke(); },
  },
  forest_of_death: {
    name: 'The Forest of Death', era: 'p1', time: 'Dim daylight', weather: 'leaves', sky: ['#3f5f34', '#6f9a5c', '#9fc48a'],
    palette: { far: '#2c4a26', mid: '#243f22', near: '#1a2f19', ground: '#3d5e2e', ground2: '#1f3018', trunk: '#3a2a1a', accent: '#a3e635' },
    layers: [
      { depth: 0.1, draw(g, p) { g.fillStyle = p.far; g.fillRect(X0, -PAD, W + PAD * 2, 200); for (let i = 0; i < 9; i++) { const x = X0 + i * 170; g.fillStyle = shade(p.far, 0.15 * (i % 2)); g.fillRect(x, 120, 70 + (i % 3) * 20, GROUND_Y - 110); } } },
      { depth: 0.32, draw(g, p) { for (let i = 0; i < 5; i++) { const x = 60 + i * 300, w = 110 + (i % 2) * 40; poly(g, [[x - w / 2 - 60, GROUND_Y + 10], [x + w / 2 + 60, GROUND_Y + 10], [x + w / 2, 60], [x - w / 2, 60]], shade(p.trunk, 0.25 + (i % 2) * 0.15)); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x + w / 4, 60, w / 4, GROUND_Y); } g.fillStyle = rgba(p.mid, 0.9); g.fillRect(X0, -PAD, W + PAD * 2, 150); } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 12; i++) { const x = X0 + i * 120; poly(g, [[x, GROUND_Y - 2], [x + 30, GROUND_Y - 60 - (i % 3) * 20], [x + 60, GROUND_Y - 2]], shade(p.near, 0.3)); } g.fillStyle = p.trunk; g.beginPath(); g.ellipse(1000, GROUND_Y - 14, 150, 22, 0, 0, TAU); g.fill(); } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 24 }); },
  },
  exam_arena: {
    name: 'The Chunin Exam arena', era: 'p1', time: 'Bright afternoon', weather: null, sky: ['#6fb2f5', '#b8dbff', '#eaf4ff'], sun: { x: 200, y: 110, r: 40, color: '#fff6d0' },
    palette: { far: '#8a7a66', mid: '#a08a70', near: '#7a6650', ground: '#c9a97a', ground2: '#7a6446', accent: '#a3e635' },
    layers: [
      { depth: 0.12, draw(g, p) { for (let i = 0; i < 5; i++) { g.fillStyle = shade(p.far, i * 0.08); g.fillRect(X0, 250 + i * 34, W + PAD * 2, 30); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = X0; x < X1; x += 22) g.fillRect(x + (i % 2) * 11, 256 + i * 34, 8, 12); } } },
      { depth: 0.35, draw(g, p) { g.fillStyle = p.mid; g.fillRect(X0, 420, W + PAD * 2, 140); g.fillStyle = shade(p.mid, 0.2); g.fillRect(X0, 420, W + PAD * 2, 10); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 3; for (let x = X0; x < X1; x += 100) { g.beginPath(); g.moveTo(x, 430); g.lineTo(x, 560); g.stroke(); } tree(g, 1080, GROUND_Y - 10, 240, '#3f7d3a', '#5b3d1e'); } },
      { depth: 0.6, draw(g, p) { g.fillStyle = shade(p.near, 0.1); g.fillRect(X0, 540, W + PAD * 2, 20); } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 0 }); },
  },
  leaf_invasion: {
    name: 'The Hidden Leaf under attack', era: 'p1', time: 'Afternoon, smoke', weather: 'embers', sky: ['#e59866', '#f6d7b0', '#fbe8d0'],
    palette: { far: '#9c6b3f', mid: '#7a4f2c', near: '#5a3a20', ground: '#9c6b3f', ground2: '#5a3a20', accent: '#ef4444' },
    layers: [
      { depth: 0.08, draw(g, p) { cliffFace(g, 500, 1360, 150, 420, shade(p.far, -0.2), 4); g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 4; i++) g.fillRect(620 + i * 160, 220, 90, 130); ridge(g, 440, 40, 0.006, 0.7, rgba(p.far, 0.8)); } },
      { depth: 0.3, draw(g, p) { houses(g, X0, X1, GROUND_Y - 40, 90, 60, 120, shade(p.mid, 0.3), '#7f1d1d', 'gable', 5); smokeColumn(g, 300, 470, 380); smokeColumn(g, 900, 440, 420, 'rgba(60,50,50,0.5)'); } },
      { depth: 0.6, draw(g, p) { poly(g, [[X0, GROUND_Y - 4], [200, GROUND_Y - 4], [190, 480], [120, 470], [60, 500], [X0, 490]], shade(p.near, 0.2)); for (let i = 0; i < 6; i++) rock(g, 1000 + i * 40, 550, 14, shade(p.near, 0.2), i + 3); } },
    ],
    ground(g, p) { groundPlane(g, p, { cracks: 6 }); },
  },
  tanzaku_town: {
    name: 'Tanzaku Town', era: 'p1', time: 'Dusk', weather: null, sky: ['#5b4b8a', '#a89ccc', '#e2d8f0'], sun: { x: 1120, y: 240, r: 60, color: '#ffd9a8' },
    palette: { far: '#3f3c58', mid: '#5b5877', near: '#3a3750', ground: '#5b5877', ground2: '#2c2a3c', accent: '#a78bfa' },
    layers: [
      { depth: 0.08, draw(g, p) { ridge(g, 430, 60, 0.004, 0.9, p.far); const x = 980; for (let i = 0; i < 3; i++) { const w = 220 - i * 50, y = 300 - i * 70; g.fillStyle = shade(p.far, 0.25); g.fillRect(x - w / 2, y, w, 70); poly(g, [[x - w / 2 - 24, y], [x + w / 2 + 24, y], [x, y - 40]], shade(p.far, -0.15)); } g.fillStyle = shade(p.far, -0.1); g.beginPath(); g.moveTo(80, 420); g.quadraticCurveTo(200, 300, 340, 400); g.quadraticCurveTo(420, 460, 520, 400); g.lineTo(520, 440); g.quadraticCurveTo(420, 500, 340, 440); g.quadraticCurveTo(200, 340, 80, 460); g.closePath(); g.fill(); } },
      { depth: 0.3, draw(g, p) { houses(g, X0, X1, GROUND_Y - 30, 100, 70, 130, shade(p.mid, 0.2), shade(p.mid, -0.3), 'gable', 7); } },
      { depth: 0.6, draw(g, p) { for (let x = 120; x < X1; x += 260) lantern(g, x, 470, '#ff9f43'); g.fillStyle = p.near; g.fillRect(X0, 526, W + PAD * 2, 6); } },
    ],
    ground(g, p) { groundPlane(g, p, {}); },
  },
  tea_coast: {
    name: 'The Land of Tea coast', era: 'p1', time: 'Bright day', weather: 'mist-thin', sky: ['#86b6a0', '#c6e6d4', '#eef7f1'], sun: { x: 260, y: 120, r: 44, color: '#fff9e0' },
    palette: { far: '#356b53', mid: '#4f8a6e', near: '#2f5c45', ground: '#8aa286', ground2: '#4a5e48', water: '#5aa5a0', accent: '#34d399' },
    layers: [
      { depth: 0.08, draw(g, p) { water(g, 420, 540, p.water); ridge(g, 424, 30, 0.006, 1.1, rgba(p.far, 0.6), 700, X1, 460); } },
      { depth: 0.3, draw(g, p) { cliffFace(g, 780, 1400, 330, 560, p.mid, 2); torii(g, 1080, 335, 110, '#c0392b'); g.fillStyle = shade(p.mid, 0.2); g.fillRect(1010, 330, 200, 8); forest(g, 5, 336, 90, shade(p.mid, 0.2), '#5b3d1e', 6, 'pine'); } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 8; i++) rock(g, 40 + i * 90, 552, 22 + (i % 3) * 8, shade(p.near, 0.1), i + 2, 'rgba(0,0,0,0.3)'); } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 12 }); },
  },
  final_valley: {
    name: 'The Final Valley', era: 'p1', time: 'Grey day', weather: 'rain', sky: ['#4b5a7a', '#8f9db8', '#c3ccdc'],
    palette: { far: '#2f374a', mid: '#465066', near: '#2f374a', ground: '#4a5468', ground2: '#242a38', water: '#5b7f9c', accent: '#60a5fa' },
    layers: [
      { depth: 0.08, draw(g, p) { cliffFace(g, X0, 460, 120, 560, shade(p.far, 0.1), 1); cliffFace(g, 820, X1, 120, 560, shade(p.far, 0.1), 3); const fg = g.createLinearGradient(0, 120, 0, 480); fg.addColorStop(0, 'rgba(230,240,250,0.95)'); fg.addColorStop(1, 'rgba(200,220,235,0.6)'); g.fillStyle = fg; g.fillRect(500, 120, 280, 360); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(520 + i * 30, 130); g.lineTo(510 + i * 30, 470); g.stroke(); } } },
      { depth: 0.3, draw(g, p) { statue(g, 300, 520, 420, shade(p.mid, 0.2), 1); statue(g, 980, 520, 420, shade(p.mid, 0.2), -1); } },
      { depth: 0.6, draw(g, p) { water(g, 500, 560, p.water, 'rgba(255,255,255,0.35)'); g.fillStyle = 'rgba(255,255,255,0.45)'; for (let i = 0; i < 12; i++) g.beginPath(), g.ellipse(560 + i * 20, 500 + (i % 3) * 8, 26, 6, 0, 0, TAU), g.fill(); } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 0 }); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(X0, GROUND_Y + 30, W + PAD * 2, 2); },
  },
  katabami_graveyard: {
    name: 'The Katabami Gold Mine', era: 'p1', time: 'Storm', weather: 'rain', sky: ['#2c3440', '#5a6472', '#8b95a3'],
    palette: { far: '#1e293b', mid: '#334155', near: '#252d3a', ground: '#334155', ground2: '#171d28', accent: '#facc15' },
    layers: [
      { depth: 0.08, draw(g, p) { peaks(g, 440, 200, 7, p.far, 2); g.fillStyle = '#0b0f14'; g.beginPath(); g.ellipse(960, 470, 90, 110, 0, Math.PI, TAU); g.fill(); g.fillStyle = shade(p.far, 0.3); g.fillRect(860, 470, 200, 12); } },
      { depth: 0.3, draw(g, p) { for (let i = 0; i < 9; i++) { const x = 80 + i * 130 + (i % 2) * 30, h = 40 + (i % 3) * 14; g.fillStyle = shade(p.mid, 0.2); g.fillRect(x, GROUND_Y - 10 - h, 16, h); g.fillRect(x - 6, GROUND_Y - 10 - h + 8, 28, 6); } } },
      { depth: 0.6, draw(g, p) { g.fillStyle = shade(p.near, -0.2); g.fillRect(X0, 540, W + PAD * 2, 22); for (let i = 0; i < 6; i++) rock(g, 60 + i * 230, 552, 18, shade(p.near, 0.15), i + 4); } },
    ],
    ground(g, p) { groundPlane(g, p, { cracks: 4 }); g.fillStyle = 'rgba(200,220,240,0.12)'; for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(X0 + i * 180, GROUND_Y + 50 + (i % 2) * 40, 70, 9, 0, 0, TAU); g.fill(); } },
  },
  sand_canyon: {
    name: 'The Hidden Sand', era: 'p2', time: 'Noon', weather: 'sand', sky: ['#f2b56b', '#fbe7c6', '#fff3e0'], sun: { x: 640, y: 90, r: 50, color: '#fff9e6' },
    palette: { far: '#b98a4a', mid: '#d4a55f', near: '#a37a3f', ground: '#d4a55f', ground2: '#8a6533', accent: '#f59e0b' },
    layers: [
      { depth: 0.08, draw(g, p) { cliffFace(g, X0, 420, 160, 560, shade(p.far, 0.05), 5); cliffFace(g, 860, X1, 130, 560, shade(p.far, 0.05), 8); } },
      { depth: 0.3, draw(g, p) { houses(g, 60, 420, 470, 80, 40, 90, shade(p.mid, 0.05), shade(p.mid, -0.15), 'dome', 1); houses(g, 880, X1, 470, 80, 40, 100, shade(p.mid, 0.05), shade(p.mid, -0.15), 'dome', 9); houses(g, 420, 880, 520, 70, 30, 60, shade(p.mid, 0.1), shade(p.mid, -0.1), 'dome', 4); } },
      { depth: 0.6, draw(g, p) { ridge(g, 552, 24, 0.004, 0.3, shade(p.near, 0.25)); } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 10 }); },
  },
  tenchi_bridge: {
    name: 'The Tenchi Bridge', era: 'p2', time: 'Overcast noon', weather: 'mist', sky: ['#8aa7b8', '#c8d9e2', '#e8f0f4'],
    palette: { far: '#3e5a48', mid: '#5b7a5e', near: '#3a4f3e', ground: '#7a6a55', ground2: '#3a3226', accent: '#22d3ee' },
    layers: [
      { depth: 0.08, draw(g, p) { peaks(g, 480, 220, 8, shade(p.far, 0.2), 3); forest(g, 10, 490, 90, p.far, '#3a2a1a', 4, 'pine'); } },
      { depth: 0.3, draw(g, p) { cliffFace(g, X0, 300, 360, 720, p.mid, 2); cliffFace(g, 980, X1, 340, 720, p.mid, 6); g.strokeStyle = '#5a3f24'; g.lineWidth = 6; g.beginPath(); g.moveTo(300, 380); g.quadraticCurveTo(640, 470, 980, 370); g.stroke(); g.lineWidth = 3; g.beginPath(); g.moveTo(300, 330); g.quadraticCurveTo(640, 420, 980, 320); g.stroke(); for (let x = 320; x < 980; x += 40) { const k = (x - 300) / 680; const y = 380 + Math.sin(k * Math.PI) * 88; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 50); g.stroke(); } g.fillStyle = '#5a3f24'; g.fillRect(292, 300, 10, 100); g.fillRect(976, 290, 10, 100); } },
      { depth: 0.6, draw(g, p) { g.fillStyle = shade(p.near, 0.25); for (let x = X0; x < X1; x += 70) g.fillRect(x, 520, 8, 40); g.fillRect(X0, 522, W + PAD * 2, 5); } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 0 }); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 2; for (let x = X0; x < X1; x += 44) { g.beginPath(); g.moveTo(x, GROUND_Y - 18); g.lineTo(x - 12, H); g.stroke(); } },
  },
  hideout_crater: {
    name: "Orochimaru's hideout", era: 'p2', time: 'Overcast noon', weather: 'ash', sky: ['#4a5262', '#8d95a3', '#c4c8cf'],
    palette: { far: '#6a7382', mid: '#555c68', near: '#3b414b', ground: '#6e727a', ground2: '#33363d', accent: '#e63946' },
    layers: [
      { depth: 0.08, draw(g, p) { ridge(g, 470, 90, 0.0035, 0.8, rgba(p.far, 0.6)); ridge(g, 500, 60, 0.006, 2.7, rgba(p.far, 0.85)); } },
      { depth: 0.3, draw(g, p) { poly(g, [[300, GROUND_Y - 20], [980, GROUND_Y - 20], [900, 300], [720, 250], [560, 265], [380, 320]], p.mid, 'rgba(15,17,22,0.55)'); poly(g, [[560, 265], [720, 250], [700, 200], [600, 205]], shade(p.mid, 0.15), 'rgba(15,17,22,0.55)'); poly(g, [[420, 330], [520, 300], [520, 380], [440, 420]], shade(p.mid, -0.35), 'rgba(15,17,22,0.55)'); poly(g, [[760, 300], [860, 330], [830, 420], [740, 400]], shade(p.mid, -0.4), 'rgba(15,17,22,0.55)'); g.fillStyle = 'rgba(10,12,16,0.7)'; g.fillRect(610, 330, 70, 90); g.fillRect(700, 340, 40, 60); poly(g, [[1060, GROUND_Y - 10], [1140, GROUND_Y - 10], [1110, 380], [1080, 372]], shade(p.mid, -0.1), 'rgba(15,17,22,0.55)'); poly(g, [[140, GROUND_Y - 10], [230, GROUND_Y - 10], [250, 430], [170, 440]], shade(p.mid, -0.15), 'rgba(15,17,22,0.55)'); } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 16; i++) { const x = X0 + i * 92 + (i % 3) * 20; rock(g, x, 548 - (i % 4) * 6, 26 + (i % 5) * 6, shade(p.near, (i % 2) * 0.12), i + 2, 'rgba(10,12,16,0.5)'); } } },
    ],
    ground(g, p) { groundPlane(g, p, { cracks: 14, marks: 0 }); },
  },
  fire_temple: {
    name: 'The Fire Temple', era: 'p2', time: 'Dusk', weather: 'embers', sky: ['#2c2a52', '#6f66a3', '#b9b0d8'], moon: { x: 220, y: 120, r: 36, color: '#fff2c9' },
    palette: { far: '#2c2f3d', mid: '#4a4f5c', near: '#2c2f3d', ground: '#4a4f5c', ground2: '#25282f', accent: '#f472b6' },
    layers: [
      { depth: 0.08, draw(g, p) { peaks(g, 460, 170, 6, p.far, 5); } },
      { depth: 0.3, draw(g, p) { g.fillStyle = shade(p.mid, 0.2); g.fillRect(420, 360, 440, 200); poly(g, [[380, 360], [900, 360], [840, 300], [440, 300]], '#7f1d1d'); poly(g, [[400, 300], [880, 300], [640, 230]], '#991b1b'); g.fillStyle = '#5a3f24'; for (let i = 0; i < 5; i++) g.fillRect(450 + i * 100, 370, 16, 190); g.fillStyle = 'rgba(255,190,90,0.5)'; g.fillRect(600, 420, 80, 140); torii(g, 200, 560, 150, '#b91c1c'); torii(g, 1090, 560, 150, '#b91c1c'); } },
      { depth: 0.6, draw(g, p) { for (const x of [110, 300, 980, 1170]) { g.fillStyle = shade(p.near, 0.4); g.fillRect(x - 8, 480, 16, 80); g.fillRect(x - 18, 470, 36, 12); g.fillRect(x - 14, 440, 28, 30); lantern(g, x, 455, '#ffb347'); } } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 16 }); g.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 6; i++) g.fillRect(X0, GROUND_Y + 20 + i * 24, W + PAD * 2, 2); },
  },
  nara_forest: {
    name: 'The Nara forest', era: 'p2', time: 'Evening', weather: 'leaves', sky: ['#5c6f7c', '#a9b8c2', '#dbe3e8'],
    palette: { far: '#34422e', mid: '#4f5f45', near: '#2c3a28', ground: '#4f5f45', ground2: '#243020', trunk: '#3a2a1a', accent: '#e11d48' },
    layers: [
      { depth: 0.08, draw(g, p) { ridge(g, 460, 60, 0.004, 0.4, rgba(p.far, 0.85)); forest(g, 16, 480, 120, shade(p.far, 0.1), p.trunk, 7); } },
      { depth: 0.3, draw(g, p) { g.fillStyle = '#5a4630'; g.fillRect(120, 400, 220, 160); poly(g, [[100, 400], [360, 400], [230, 340]], '#3f2b17'); g.fillStyle = 'rgba(255,200,120,0.55)'; g.fillRect(180, 440, 40, 50); lantern(g, 300, 430, '#ffb347'); forest(g, 8, GROUND_Y - 20, 230, p.mid, p.trunk, 2); } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 20; i++) { const x = X0 + i * 72; poly(g, [[x, GROUND_Y - 2], [x + 5, GROUND_Y - 16 - (i % 3) * 4], [x + 10, GROUND_Y - 2]], shade(p.near, 0.35)); } } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 20 }); },
  },
  three_tails_lake: {
    name: 'The Three-Tails lake', era: 'p2', time: 'Mist over water', weather: 'mist', sky: ['#6d8b9a', '#b6cfd8', '#e2edf1'],
    palette: { far: '#2f4d4f', mid: '#4a6b6b', near: '#2f4d4f', ground: '#5a7070', ground2: '#2c3a3a', water: '#5e9aa8', accent: '#a78bfa' },
    layers: [
      { depth: 0.08, draw(g, p) { peaks(g, 440, 180, 7, rgba(p.far, 0.8), 4); water(g, 440, 545, p.water); } },
      { depth: 0.3, draw(g, p) { for (let i = 0; i < 6; i++) { const x = 160 + i * 190, h = 120 + (i % 3) * 60; poly(g, [[x - 26, 540], [x + 26, 540], [x + 8, 540 - h], [x - 12, 540 - h * 0.8]], 'rgba(190,220,255,0.7)', 'rgba(120,170,220,0.9)', 2); } } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 9; i++) rock(g, 30 + i * 150, 552, 20 + (i % 3) * 6, shade(p.near, 0.2), i + 1, 'rgba(0,0,0,0.3)'); } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 8 }); },
  },
  uchiha_hideout: {
    name: 'The Uchiha hideout', era: 'p2', time: 'Grey day', weather: 'ash', sky: ['#6b5a4d', '#b8a595', '#e3d2c3'],
    palette: { far: '#4a3b31', mid: '#6b5647', near: '#3f3128', ground: '#6b5647', ground2: '#352a22', accent: '#f97316' },
    layers: [
      { depth: 0.08, draw(g, p) { ridge(g, 460, 60, 0.005, 2.2, rgba(p.far, 0.8)); } },
      { depth: 0.3, draw(g, p) { g.fillStyle = shade(p.mid, 0.2); g.fillRect(200, 330, 880, 230); for (let i = 0; i < 6; i++) { g.fillStyle = shade(p.mid, 0.35); g.fillRect(240 + i * 150, 300, 40, 260); } poly(g, [[180, 330], [1100, 330], [1000, 280], [280, 280]], shade(p.mid, -0.2)); g.fillStyle = 'rgba(10,8,6,0.7)'; g.fillRect(500, 380, 120, 180); g.fillRect(760, 400, 80, 160); poly(g, [[640, 280], [760, 280], [700, 200]], shade(p.mid, 0.1)); } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 10; i++) rock(g, X0 + i * 140 + 30, 550, 18 + (i % 4) * 8, shade(p.near, 0.2), i + 6, 'rgba(0,0,0,0.35)'); } },
    ],
    ground(g, p) { groundPlane(g, p, { cracks: 8 }); },
  },
  rain_village: {
    name: 'The Village Hidden in the Rain', era: 'p2', time: 'Rain', weather: 'rain', sky: ['#2f3540', '#5a6472', '#8b95a3'],
    palette: { far: '#1f2937', mid: '#374151', near: '#1f2937', ground: '#374151', ground2: '#1a202b', accent: '#fb923c' },
    layers: [
      { depth: 0.08, draw(g, p) { for (let i = 0; i < 9; i++) { const x = X0 + i * 150, h = 220 + (i % 4) * 90; g.fillStyle = shade(p.far, 0.15 * (i % 3)); g.fillRect(x, GROUND_Y - h, 90, h); g.fillStyle = 'rgba(255,220,150,0.35)'; for (let k = 0; k < h / 40; k++) if ((i + k) % 2) g.fillRect(x + 20, GROUND_Y - h + 12 + k * 40, 14, 10); } } },
      { depth: 0.3, draw(g, p) { for (let i = 0; i < 5; i++) { const x = 60 + i * 290, h = 300 + (i % 2) * 120; g.fillStyle = p.mid; g.fillRect(x, GROUND_Y - h, 120, h); g.fillStyle = shade(p.mid, 0.3); g.fillRect(x + 20, GROUND_Y - h - 60, 30, 60); g.strokeStyle = shade(p.mid, 0.5); g.lineWidth = 8; g.beginPath(); g.moveTo(x - 40, GROUND_Y - h + 60); g.lineTo(x + 160, GROUND_Y - h + 80); g.stroke(); g.fillStyle = 'rgba(255,220,150,0.45)'; for (let k = 0; k < 5; k++) g.fillRect(x + 40, GROUND_Y - h + 40 + k * 50, 24, 14); } g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(X0, 260); g.quadraticCurveTo(640, 340, X1, 250); g.stroke(); } },
      { depth: 0.6, draw(g, p) { g.strokeStyle = shade(p.near, 0.5); g.lineWidth = 10; g.beginPath(); g.moveTo(X0, 500); g.lineTo(X1, 500); g.stroke(); for (let x = X0; x < X1; x += 200) { g.fillStyle = shade(p.near, 0.4); g.fillRect(x, 470, 14, 90); } } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 0 }); g.fillStyle = 'rgba(200,220,240,0.14)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(X0 + i * 160, GROUND_Y + 40 + (i % 3) * 36, 90, 10, 0, 0, TAU); g.fill(); } },
  },
  unraikyo: {
    name: 'Unraikyo', era: 'p2', time: 'Storm', weather: 'rain', sky: ['#2b1622', '#6b3f4d', '#9b5c6e'],
    palette: { far: '#2a1a25', mid: '#4a3040', near: '#2a1a25', ground: '#4a3040', ground2: '#241620', accent: '#dc2626' },
    layers: [
      { depth: 0.08, draw(g, p) { peaks(g, 420, 260, 6, p.far, 7); g.strokeStyle = 'rgba(255,230,120,0.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(860, 0); g.lineTo(840, 120); g.lineTo(880, 140); g.lineTo(850, 260); g.stroke(); } },
      { depth: 0.3, draw(g, p) { cliffFace(g, X0, 380, 200, 560, p.mid, 2); cliffFace(g, 900, X1, 180, 560, p.mid, 9); rock(g, 640, 500, 140, shade(p.mid, 0.15), 3, 'rgba(0,0,0,0.4)'); g.strokeStyle = 'rgba(255,230,120,0.35)'; g.lineWidth = 2; for (let i = 0; i < 5; i++) crack(g, 560 + i * 40, 440, 60, i + 2, 'rgba(255,230,120,0.4)'); } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 8; i++) rock(g, 40 + i * 170, 550, 24 + (i % 3) * 8, shade(p.near, 0.25), i + 5, 'rgba(0,0,0,0.4)'); } },
    ],
    ground(g, p) { groundPlane(g, p, { cracks: 6 }); },
  },
  tsuchigumo_village: {
    name: 'The Tsuchigumo village', era: 'p2', time: 'Day', weather: 'leaves', sky: ['#6b8f71', '#bcdcc3', '#e8f4ea'], sun: { x: 1060, y: 120, r: 40, color: '#fff9e0' },
    palette: { far: '#2f4a34', mid: '#4b6b4f', near: '#2f4a34', ground: '#6b8f5e', ground2: '#2f4a34', trunk: '#4a3320', accent: '#34d399' },
    layers: [
      { depth: 0.08, draw(g, p) { ridge(g, 380, 70, 0.004, 0.2, rgba(p.far, 0.7)); for (let i = 0; i < 5; i++) { g.fillStyle = shade(p.far, 0.1 + i * 0.06); g.fillRect(X0, 400 + i * 28, W + PAD * 2, 26); } } },
      { depth: 0.3, draw(g, p) { houses(g, 100, 700, 500, 90, 50, 90, '#c9b48a', '#6b4a2a', 'gable', 3); houses(g, 800, X1, 480, 90, 50, 100, '#c9b48a', '#6b4a2a', 'gable', 8); g.fillStyle = '#7a6a55'; g.fillRect(730, 470, 60, 60); g.fillStyle = '#5a3f24'; g.fillRect(724, 430, 8, 50); g.fillRect(788, 430, 8, 50); g.fillRect(720, 426, 80, 8); forest(g, 6, 520, 120, p.mid, p.trunk, 5); } },
      { depth: 0.6, draw(g, p) { g.fillStyle = shade(p.near, 0.4); for (let x = X0; x < X1; x += 56) g.fillRect(x, 526, 6, 34); g.fillRect(X0, 530, W + PAD * 2, 4); } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 10 }); },
  },
  leaf_crater: {
    name: 'The crater of the Hidden Leaf', era: 'p2', time: 'Overcast', weather: 'ash', sky: ['#5b6372', '#a9b1bd', '#d6dbe2'],
    palette: { far: '#57534e', mid: '#78716c', near: '#4a4541', ground: '#78716c', ground2: '#3a3532', accent: '#fb923c' },
    layers: [
      { depth: 0.08, draw(g, p) { cliffFace(g, 300, 1160, 130, 420, shade(p.far, 0.05), 6); g.fillStyle = 'rgba(0,0,0,0.1)'; for (let i = 0; i < 5; i++) g.fillRect(400 + i * 150, 200, 80, 140); ridge(g, 430, 30, 0.006, 0.7, rgba(p.far, 0.8)); } },
      { depth: 0.3, draw(g, p) { for (let i = 0; i < 7; i++) { const x = 80 + i * 180, h = 40 + (i % 3) * 50; poly(g, [[x, GROUND_Y - 10], [x + 70, GROUND_Y - 10], [x + 60, GROUND_Y - 10 - h], [x + 10, GROUND_Y - 10 - h + 20]], shade(p.mid, -0.15)); } smokeColumn(g, 260, 480, 300, 'rgba(90,90,100,0.5)'); smokeColumn(g, 1020, 460, 340, 'rgba(90,90,100,0.45)'); g.fillStyle = shade(p.mid, 0.25); g.fillRect(560, 440, 14, 120); } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 14; i++) rock(g, X0 + i * 100 + 20, 552, 16 + (i % 4) * 8, shade(p.near, 0.2), i + 3, 'rgba(0,0,0,0.35)'); } },
    ],
    ground(g, p) { groundPlane(g, p, { cracks: 12 }); },
  },
  iron_summit: {
    name: 'The Land of Iron', era: 'p2', time: 'Snow', weather: 'snow', sky: ['#9fb0c0', '#d9e1e8', '#f1f5f9'],
    palette: { far: '#94a3b8', mid: '#64748b', near: '#cbd5e1', ground: '#e2e8f0', ground2: '#94a3b8', accent: '#38bdf8' },
    layers: [
      { depth: 0.08, draw(g, p) { peaks(g, 430, 240, 6, '#e8eef4', 3); peaks(g, 470, 160, 9, rgba(p.far, 0.9), 8); } },
      { depth: 0.3, draw(g, p) { g.fillStyle = p.mid; g.fillRect(420, 380, 440, 180); for (const x of [400, 620, 840]) { g.fillStyle = shade(p.mid, -0.1); g.fillRect(x, 320, 60, 240); poly(g, [[x - 10, 320], [x + 70, 320], [x + 30, 270]], shade(p.mid, -0.3)); } g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(420, 380, 440, 6); ridge(g, 540, 30, 0.006, 0.9, '#f1f5f9'); } },
      { depth: 0.6, draw(g, p) { g.fillStyle = p.near; for (let x = X0; x < X1; x += 90) g.fillRect(x, 528, 10, 32); g.fillRect(X0, 532, W + PAD * 2, 4); } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 0, edge: 'rgba(0,0,0,0.08)' }); g.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 10; i++) { g.beginPath(); g.ellipse(X0 + i * 150, GROUND_Y + 60 + (i % 3) * 30, 60, 8, 0, 0, TAU); g.fill(); } },
  },
  island_turtle: {
    name: 'The Island Turtle', era: 'p2', time: 'Bright day', weather: 'mist-thin', sky: ['#4fb3c8', '#bfeef2', '#eefcfa'], sun: { x: 1080, y: 110, r: 46, color: '#fffbe6' },
    palette: { far: '#2c6b46', mid: '#3f8f5f', near: '#2c6b46', ground: '#6da36e', ground2: '#2f5a37', trunk: '#4a3320', water: '#3a9cae', accent: '#fbbf24' },
    layers: [
      { depth: 0.08, draw(g, p) { water(g, 440, 545, p.water); ridge(g, 380, 140, 0.003, 0.3, shade(p.far, 0.1), 200, 1100, 470); } },
      { depth: 0.3, draw(g, p) { forest(g, 14, 470, 150, p.mid, p.trunk, 9); const fg = g.createLinearGradient(0, 300, 0, 470); fg.addColorStop(0, 'rgba(235,250,255,0.95)'); fg.addColorStop(1, 'rgba(200,235,245,0.5)'); g.fillStyle = fg; g.fillRect(560, 300, 60, 170); } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 8; i++) rock(g, 40 + i * 170, 552, 20 + (i % 3) * 8, '#7a8a7a', i + 2, 'rgba(0,0,0,0.3)'); } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 8 }); },
  },
  war_front: {
    name: 'The war front', era: 'p2', time: 'Dust', weather: 'sand', sky: ['#8c7d6b', '#cdbfae', '#e6ddd0'],
    palette: { far: '#5a4c3b', mid: '#7a6a55', near: '#4a3f33', ground: '#7a6a55', ground2: '#3d352b', accent: '#eab308' },
    layers: [
      { depth: 0.08, draw(g, p) { peaks(g, 450, 180, 9, rgba(p.far, 0.8), 6); } },
      { depth: 0.3, draw(g, p) { for (let i = 0; i < 6; i++) { const x = 90 + i * 220; g.fillStyle = '#3a2a1a'; g.fillRect(x, 300 + (i % 2) * 40, 6, 260); poly(g, [[x + 6, 300 + (i % 2) * 40], [x + 80, 320 + (i % 2) * 40], [x + 6, 360 + (i % 2) * 40]], i % 2 ? '#b91c1c' : '#1d4ed8'); } for (let i = 0; i < 4; i++) { g.fillStyle = shade(p.mid, -0.2); g.beginPath(); g.ellipse(200 + i * 300, 540, 90, 18, 0, 0, TAU); g.fill(); } } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 14; i++) rock(g, X0 + i * 100 + 20, 552, 14 + (i % 4) * 8, shade(p.near, 0.2), i + 7, 'rgba(0,0,0,0.35)'); } },
    ],
    ground(g, p) { groundPlane(g, p, { cracks: 10 }); },
  },
  kamui_dimension: {
    name: 'The Kamui dimension', era: 'p2', time: 'No time', weather: 'motes', sky: ['#07070d', '#101024', '#1b1b34'],
    palette: { far: '#1e1e3a', mid: '#2a2a4e', near: '#1a1a30', ground: '#2a2a4e', ground2: '#0d0d1a', accent: '#f43f5e' },
    layers: [
      { depth: 0.08, draw(g, p) { for (let i = 0; i < 14; i++) { const x = X0 + ((i * 197) % (W + PAD * 2)), y = 40 + ((i * 131) % 380), s = 30 + (i % 4) * 22; g.fillStyle = shade(p.far, 0.2 * (i % 3)); g.fillRect(x, y, s, s); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x, y, s, 6); } } },
      { depth: 0.3, draw(g, p) { for (let i = 0; i < 7; i++) { const x = 40 + i * 190, y = 260 + (i % 3) * 70, s = 70 + (i % 2) * 50; g.fillStyle = shade(p.mid, 0.1 * (i % 2)); g.fillRect(x, y, s, s); g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(x, y, s, 8); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + s - 10, y, 10, s); } } },
      { depth: 0.6, draw(g, p) { g.fillStyle = shade(p.near, 0.3); for (let x = X0; x < X1; x += 160) g.fillRect(x, 470, 120, 90); } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 0, stripe: false }); g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 2; for (let x = X0; x < X1; x += 160) { g.beginPath(); g.moveTo(x, GROUND_Y - 24); g.lineTo(x - 60, H); g.stroke(); } },
  },
  anbu_forest: {
    name: 'A forest at night', era: 'p2', time: 'Moonlit night', weather: 'mist', sky: ['#0f172a', '#273449', '#475569'], moon: { x: 300, y: 120, r: 40, color: '#f1f5f9' },
    palette: { far: '#0f172a', mid: '#1e293b', near: '#0b1220', ground: '#334155', ground2: '#111827', trunk: '#0b1220', accent: '#94a3b8' },
    layers: [
      { depth: 0.08, draw(g, p) { forest(g, 18, 500, 220, shade(p.far, 0.4), p.trunk, 2, 'pine'); } },
      { depth: 0.3, draw(g, p) { forest(g, 9, GROUND_Y - 10, 300, p.mid, p.trunk, 11, 'pine'); g.fillStyle = '#4a5568'; g.fillRect(560, 480, 160, 80); g.fillStyle = '#64748b'; g.fillRect(540, 470, 200, 14); } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 16; i++) { const x = X0 + i * 90; poly(g, [[x, GROUND_Y - 2], [x + 8, GROUND_Y - 30 - (i % 3) * 8], [x + 16, GROUND_Y - 2]], shade(p.near, 0.6)); } } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 16 }); },
  },
  dead_tree_field: {
    name: 'The battlefield of the Ten-Tails', era: 'p2', time: 'Ash', weather: 'ash', sky: ['#27272a', '#52525b', '#a1a1aa'],
    palette: { far: '#27272a', mid: '#3f3f46', near: '#27272a', ground: '#52525b', ground2: '#27272a', accent: '#e4e4e7' },
    layers: [
      { depth: 0.08, draw(g, p) { peaks(g, 480, 120, 8, rgba(p.far, 0.9), 4); const x = 1000; g.fillStyle = shade(p.far, 0.3); g.fillRect(x - 40, 120, 80, 440); for (let i = 0; i < 6; i++) { g.strokeStyle = shade(p.far, 0.3); g.lineWidth = 12 - i; g.beginPath(); g.moveTo(x, 200 + i * 30); g.lineTo(x + (i % 2 ? 1 : -1) * (120 + i * 30), 120 + i * 20); g.stroke(); } } },
      { depth: 0.3, draw(g, p) { for (let i = 0; i < 8; i++) { const x = 60 + i * 160; g.fillStyle = shade(p.mid, 0.1); g.fillRect(x, 460, 10, 100); g.strokeStyle = shade(p.mid, 0.1); g.lineWidth = 5; g.beginPath(); g.moveTo(x + 5, 470); g.lineTo(x + 5 + (i % 2 ? 40 : -40), 430); g.stroke(); } } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 12; i++) rock(g, X0 + i * 120 + 30, 552, 16 + (i % 3) * 10, shade(p.near, 0.3), i + 8, 'rgba(0,0,0,0.35)'); } },
    ],
    ground(g, p) { groundPlane(g, p, { cracks: 12 }); },
  },
  lava_dimension: {
    name: "Kaguya's lava dimension", era: 'p2', time: 'Firelight', weather: 'embers', sky: ['#1a0507', '#4a1010', '#7f1d1d'],
    palette: { far: '#2a0a0a', mid: '#3f1414', near: '#1f0a0a', ground: '#2b1616', ground2: '#0f0707', accent: '#e9d5ff' },
    layers: [
      { depth: 0.08, draw(g, p) { peaks(g, 420, 260, 7, p.far, 9); const lg = g.createLinearGradient(0, 440, 0, 560); lg.addColorStop(0, '#ff7a1a'); lg.addColorStop(1, '#ffd166'); g.fillStyle = lg; g.fillRect(X0, 440, W + PAD * 2, 120); g.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 12; i++) g.fillRect(X0 + i * 120, 470 + (i % 3) * 20, 60, 3); } },
      { depth: 0.3, draw(g, p) { for (let i = 0; i < 6; i++) rock(g, 120 + i * 210, 520, 60 + (i % 2) * 30, p.mid, i + 1, 'rgba(255,120,40,0.6)'); } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 10; i++) rock(g, X0 + i * 140 + 40, 552, 18 + (i % 3) * 10, p.near, i + 2, 'rgba(255,120,40,0.5)'); } },
    ],
    ground(g, p) { groundPlane(g, p, { cracks: 10 }); g.strokeStyle = 'rgba(255,140,40,0.5)'; g.lineWidth = 2; for (let i = 0; i < 8; i++) crack(g, X0 + i * 160, GROUND_Y + 30 + (i % 3) * 40, 100, i + 3, 'rgba(255,140,40,0.55)'); },
  },
  akatsuki_cave: {
    name: 'The Akatsuki hideout', era: 'p2', time: 'Torchlight', weather: 'embers', sky: ['#05050a', '#12101a', '#1f1a1f'],
    palette: { far: '#1a1416', mid: '#2a2124', near: '#17121a', ground: '#2b2226', ground2: '#0f0b0d', accent: '#ff4d4d' },
    layers: [
      { depth: 0.08, draw(g, p) { g.fillStyle = shade(p.far, 0.3); g.fillRect(X0, -PAD, W + PAD * 2, 200); peaks(g, 300, -200, 10, shade(p.far, 0.3), 3); for (const [x, f] of [[420, 1], [860, -1]]) { g.fillStyle = shade(p.far, 0.6); g.fillRect(x - 40, 240, 80, 320); for (let i = 0; i < 4; i++) g.fillRect(x - 40 + f * 30 + i * f * 22, 200 - i * 10, 18, 80); } } },
      { depth: 0.3, draw(g, p) { for (let i = 0; i < 7; i++) { const x = 90 + i * 190, h = 120 + (i % 3) * 60; poly(g, [[x - 40, 560], [x + 40, 560], [x + 12, 560 - h], [x - 8, 560 - h * 0.9]], shade(p.mid, 0.1 * (i % 2))); } for (const x of [180, 640, 1100]) lantern(g, x, 420, '#ff8a3d'); } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 10; i++) rock(g, X0 + i * 140 + 30, 552, 16 + (i % 3) * 10, shade(p.near, 0.3), i + 9, 'rgba(0,0,0,0.4)'); } },
    ],
    ground(g, p) { groundPlane(g, p, { cracks: 6, stripe: false }); },
  },
  leaf_forest: {
    name: 'The forest outside the Leaf', era: 'p1', time: 'Day', weather: 'leaves', sky: ['#5b8fd6', '#b9d6f5', '#e6f0fb'], sun: { x: 980, y: 120, r: 42, color: '#fff9e0' },
    palette: { far: '#2f4a34', mid: '#3d7a36', near: '#2f5f2a', ground: '#5fa04e', ground2: '#2c5326', trunk: '#4a3320', accent: '#60a5fa' },
    layers: [
      { depth: 0.08, draw(g, p) { ridge(g, 470, 60, 0.004, 1.5, rgba(p.far, 0.8)); forest(g, 16, 490, 130, shade(p.far, 0.15), p.trunk, 12); } },
      { depth: 0.3, draw(g, p) { forest(g, 9, GROUND_Y - 10, 260, p.mid, p.trunk, 8); } },
      { depth: 0.6, draw(g, p) { for (let i = 0; i < 18; i++) { const x = X0 + i * 80; poly(g, [[x, GROUND_Y - 2], [x + 6, GROUND_Y - 18 - (i % 3) * 5], [x + 12, GROUND_Y - 2]], shade(p.near, 0.35)); } } },
    ],
    ground(g, p) { groundPlane(g, p, { marks: 14 }); },
  },
};
STAGES.final_valley_night = { ...STAGES.final_valley, name: 'The Final Valley at night', era: 'p2', time: 'Night', weather: null, sky: ['#0b1020', '#1e2a4a', '#3b4a6b'], moon: { x: 640, y: 110, r: 46, color: '#f1f5f9' }, palette: { ...STAGES.final_valley.palette, water: '#2f4c66' } };

/** Which stage a battle uses: per-node variants first, then the arc's stage, then a generic one built from the arc theme. */
const ARC_STAGE = {
  arc_tutorial: 'academy_night', arc_belltest: 'training_ground', arc_waves: 'waves_bridge', arc_chunin: 'forest_of_death', arc_konoha_crush: 'leaf_invasion',
  arc_tsunade: 'tanzaku_town', arc_tea: 'tea_coast', arc_sasuke_recovery: 'leaf_forest', arc_kurosuki: 'katabami_graveyard',
  arc_kazekage: 'sand_canyon', arc_tenchi: 'hideout_crater', arc_twelve: 'fire_temple', arc_hidan: 'nara_forest', arc_threetails: 'three_tails_lake',
  arc_itachi: 'uchiha_hideout', arc_jiraiya: 'rain_village', arc_brothers: 'unraikyo', arc_sixtails: 'tsuchigumo_village', arc_pain: 'leaf_crater',
  arc_summit: 'iron_summit', arc_countdown: 'island_turtle', arc_confront: 'war_front', arc_climax: 'kamui_dimension', arc_anbu: 'anbu_forest',
  arc_birth: 'dead_tree_field', arc_kaguya: 'lava_dimension',
};
const NODE_STAGE = {
  n_chunin_4: 'exam_arena', n_chunin_5: 'exam_arena', n_sr_5: 'final_valley', n_tenchi_2: 'tenchi_bridge', n_kaz_3: 'leaf_forest', n_kaz_5: 'leaf_forest',
  n_pain_1: 'leaf_invasion', n_pain_2: 'leaf_invasion', n_brothers_2: 'uchiha_hideout', n_confront_1: 'war_front', n_climax_1: 'war_front', n_climax_2: 'war_front', n_climax_3: 'war_front',
  n_kaguya_3: 'final_valley_night', n_kaguya_4: 'final_valley_night', n_tsunade_1: 'leaf_forest',
};
export function stageIdFor({ node = null, arcId = null, rush = false } = {}) {
  if (rush) return 'akatsuki_cave';
  if (node && NODE_STAGE[node.id]) return NODE_STAGE[node.id];
  const a = arcId || node?.arcId;
  return ARC_STAGE[a] || null;
}
/** A generic stage from an arc's five-colour theme (custom content, or a stage that is not drawn yet). */
export function stageFromTheme(theme, era = 'p1') {
  const th = theme || { sky: ['#9bd4ff', '#e8f6ff'], ground: '#5fa04e', far: '#3f7d3a', accent: '#f97316' };
  return {
    name: 'Stage', era, time: '', weather: null, sky: [th.sky[0], mix(th.sky[0], th.sky[1], 0.5), th.sky[1]], sun: { x: 1030, y: 120, r: 54, color: 'rgba(255,255,255,0.7)' },
    palette: { far: th.far, mid: shade(th.far, 0.2), near: shade(th.far, -0.25), ground: th.ground, ground2: shade(th.ground, -0.45), accent: th.accent },
    layers: [
      { depth: 0.1, draw(g, p) { ridge(g, 430, 110, 0.004, 1.2, shade(p.far, 0.35)); ridge(g, 480, 70, 0.007, 0.3, p.far); } },
      { depth: 0.4, draw(g, p) { forest(g, 12, GROUND_Y - 6, 180, shade(p.far, -0.25), shade(p.far, -0.5), 4, 'pine'); } },
    ],
    ground(g, p) { groundPlane(g, p, {}); },
  };
}
export function stageDefFor(opts, theme = null) { const id = stageIdFor(opts); return (id && STAGES[id]) || stageFromTheme(theme, opts.node?.part === 1 ? 'p1' : 'p2'); }

export class Stage {
  constructor(def) { this.def = def; this.layers = null; this.groundCanvas = null; this.t = 0; this.weather = makeWeather(def.weather); }
  _build() {
    const make = (draw) => { const c = document.createElement('canvas'); c.width = W + PAD * 2; c.height = H; const g = c.getContext('2d'); g.translate(PAD, 0); draw(g, this.def.palette); return c; };
    this.layers = this.def.layers.map(L => ({ depth: L.depth, canvas: make(L.draw) }));
    this.groundCanvas = make(this.def.ground);
  }
  /** cam: { x (pan), zoom }; dim: 0–1 darkening (dialogue, pause). weatherOn: false skips the live particles (Low VFX). */
  draw(g, dt, cam = { x: 0, zoom: 1 }, dim = 0, weatherOn = true) {
    if (!this.layers) this._build();
    this.t += dt;
    const zoom = cam.zoom || 1, cx = cam.x || 0;
    g.save();
    const fx = W / 2, fy = GROUND_Y - 130;
    g.translate(fx, fy); g.scale(zoom, zoom); g.translate(-fx, -fy);
    const s = this.def.sky; const sky = g.createLinearGradient(0, -PAD, 0, GROUND_Y);
    sky.addColorStop(0, s[0]); sky.addColorStop(0.62, s[1]); sky.addColorStop(1, s[2]);
    g.fillStyle = sky; g.fillRect(-PAD, -PAD, W + PAD * 2, GROUND_Y + PAD);
    const orb = this.def.sun || this.def.moon;
    if (orb) { const gl = g.createRadialGradient(orb.x, orb.y, orb.r * 0.6, orb.x, orb.y, orb.r * 3); gl.addColorStop(0, 'rgba(255,255,255,0.45)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.beginPath(); g.arc(orb.x, orb.y, orb.r * 3, 0, TAU); g.fill(); g.fillStyle = orb.color; g.beginPath(); g.arc(orb.x, orb.y, orb.r, 0, TAU); g.fill(); }
    for (const L of this.layers) g.drawImage(L.canvas, -PAD - cx * L.depth, 0);
    g.drawImage(this.groundCanvas, -PAD - cx, 0);
    if (this.weather && weatherOn) this.weather.draw(g, dt, this.t);
    if (dim) { g.fillStyle = `rgba(6,8,12,${dim})`; g.fillRect(-PAD * 2, -PAD * 2, W + PAD * 4, H + PAD * 4); }
    g.restore();
  }
}

// mockup/figure.js — the code-drawn ninja: the fallback that ships when a sprite or portrait
// is missing, drawn to the art bible (stylised 3½-head figure, medium-thick ink line,
// two-tone cel shading, flat colours). Also draws the bust used in portrait slots.
// Everything is in "unit space": the feet at (0, 0), +x facing forward, one unit = 1 logical
// canvas px at scale 1. A normal unit is about 96 px tall; bosses ×1.25.
import { shade, rgba } from './stage.js';

const INK = 'rgba(24,19,15,0.92)';
const HEAD_R = 17, SH_W = 34, HIP_W = 26, BODY_H = 34, LEG_H = 26;

/** Looks for the mockup's cast: colours, hair and headgear. A real character list keys this by id. */
export const LOOKS = {
  naruto:    { color: '#f97316', color2: '#1e3a8a', skin: '#f2c49a', hair: 'spiky', hairColor: '#f5d24b', headband: true, whiskers: true },
  naruto_p2: { color: '#ff7a1a', color2: '#1a1a1f', skin: '#f2c49a', hair: 'spiky', hairColor: '#f5d24b', headband: true, whiskers: true, band: '#111' },
  sasuke:    { color: '#3b82f6', color2: '#eaeaea', skin: '#f6d6bd', hair: 'sweep', hairColor: '#1b1b2e', headband: true },
  sasuke_p2: { color: '#eee6d6', color2: '#2a2a44', skin: '#f6d6bd', hair: 'sweep', hairColor: '#15151f', headband: false },
  sakura:    { color: '#e0457b', color2: '#3d8f5f', skin: '#f8dcc6', hair: 'long', hairColor: '#f8a7c8', headband: true, band: '#b91c1c' },
  sakura_p2: { color: '#e0457b', color2: '#f2e7d5', skin: '#f8dcc6', hair: 'bob', hairColor: '#f8a7c8', headband: true, band: '#b91c1c' },
  kakashi:   { color: '#4f6b5c', color2: '#2b3a4a', skin: '#f2d2b6', hair: 'spiky', hairColor: '#d7dce3', headband: true, mask: '#31405a', eyepatch: true },
  sai:       { color: '#1f2937', color2: '#111827', skin: '#f5efe6', hair: 'short', hairColor: '#111', headband: true, band: '#111' },
  yamato:    { color: '#6b4a2a', color2: '#2b3a4a', skin: '#efcfb2', hair: 'short', hairColor: '#3a2716', headband: 'happuri' },
  zabuza:    { color: '#3f4b57', color2: '#2a2f35', skin: '#e9cdb0', hair: 'short', hairColor: '#1c1c1c', headband: 'tilted', mask: '#d9d3c7', bandaged: true, sword: true },
  haku:      { color: '#7dd3fc', color2: '#245a6b', skin: '#f6e3d3', hair: 'long', hairColor: '#2b2b2b', headband: false, band: null },
  jiraiya:   { color: '#991b1b', color2: '#3f5f3a', skin: '#efcfb2', hair: 'mane', hairColor: '#f4f4f4', headband: 'horned' },
  thug:      { color: '#78716c', color2: '#44403c', skin: '#e3bfa0', hair: 'bald', hairColor: '#222', headband: false },
};

const cel = (g, shape, x0, x1) => { // the darker back half of a shape (light from the front and above): fill x0..x1 inside it
  g.save(); g.beginPath(); shape(); g.clip();
  g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x0, -2000, x1 - x0, 4000); g.restore();
};
const outline = (g, lw = 3) => { g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = INK; g.stroke(); };
/** An outlined capsule limb from (x0,y0) to (x1,y1). */
function limb(g, x0, y0, x1, y1, w, color, sil) {
  g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1);
  g.lineWidth = w; g.strokeStyle = sil ? '#05070a' : INK; g.stroke();
  if (!sil) { g.lineWidth = w - 5; g.strokeStyle = color; g.stroke(); }
}

/** The head with hair, headband, mask and face. Drawn around (cx, cy) with radius r, facing +x. */
export function drawHead(g, look, cx, cy, r, { sil = false, expression = 'set' } = {}) {
  const skin = sil ? '#05070a' : look.skin || '#f2c49a', hair = sil ? '#05070a' : look.hairColor || '#333';
  const k = r / HEAD_R; // scale of details
  // hair behind the head
  if (look.hair === 'long') { g.beginPath(); g.moveTo(cx - r * 0.95, cy - r * 0.2); g.quadraticCurveTo(cx - r * 1.35, cy + r * 1.1, cx - r * 0.6, cy + r * 1.9); g.lineTo(cx + r * 0.75, cy + r * 1.7); g.quadraticCurveTo(cx + r * 1.05, cy + r * 0.6, cx + r * 0.9, cy - r * 0.2); g.closePath(); g.fillStyle = hair; g.fill(); if (!sil) outline(g, 3 * k); }
  if (look.hair === 'mane') { g.beginPath(); g.moveTo(cx - r * 1.1, cy - r * 0.6); g.lineTo(cx - r * 1.5, cy + r * 2.2); g.lineTo(cx - r * 0.4, cy + r * 1.6); g.lineTo(cx + r * 0.2, cy + r * 2.2); g.lineTo(cx + r * 0.9, cy + r * 1.2); g.lineTo(cx + r * 1.05, cy - r * 0.4); g.closePath(); g.fillStyle = hair; g.fill(); if (!sil) outline(g, 3 * k); }
  // the head
  const headPath = () => { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); };
  headPath(); g.fillStyle = skin; g.fill(); if (!sil) { cel(g, headPath, cx - r * 2, cx - r * 0.15); headPath(); outline(g, 3 * k); }
  // mask (Kakashi cloth, Zabuza bandages)
  if (look.mask) { g.save(); headPath(); g.clip(); g.fillStyle = sil ? '#05070a' : look.mask; g.fillRect(cx - r - 2, cy + r * 0.05, r * 2 + 4, r); if (look.bandaged && !sil) { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1.5 * k; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx - r, cy + r * (0.2 + i * 0.2)); g.lineTo(cx + r, cy + r * (0.28 + i * 0.2)); g.stroke(); } } g.restore(); headPath(); if (!sil) outline(g, 3 * k); }
  // hair on top
  if (look.hair === 'spiky') {
    const pts = []; const n = 9;
    for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; const tip = i % 2 === 1; const rr = tip ? r * (1.45 + (i % 3) * 0.12) : r * 0.98; const lean = tip ? -0.12 : 0; pts.push([cx + Math.cos(a + lean) * rr, cy + Math.sin(a + lean) * rr * (tip ? 1.05 : 1)]); }
    pts.push([cx + r * 0.9, cy + r * 0.1]); pts.push([cx - r * 0.95, cy + r * 0.15]);
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fillStyle = hair; g.fill(); if (!sil) { cel(g, () => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); }, cx - r * 2, cx - r * 0.2); g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); outline(g, 3 * k); }
  } else if (look.hair === 'sweep') { // Sasuke: flat fringe, spikes swept back
    g.beginPath(); g.moveTo(cx + r * 0.95, cy - r * 0.15); g.quadraticCurveTo(cx + r * 0.6, cy - r * 1.05, cx, cy - r * 1.02); g.lineTo(cx - r * 0.5, cy - r * 1.35); g.lineTo(cx - r * 0.7, cy - r * 0.9); g.lineTo(cx - r * 1.35, cy - r * 0.95); g.lineTo(cx - r * 1.0, cy - r * 0.4); g.lineTo(cx - r * 1.45, cy - r * 0.1); g.lineTo(cx - r * 0.98, cy + r * 0.2); g.closePath(); g.fillStyle = hair; g.fill(); if (!sil) outline(g, 3 * k);
  } else if (look.hair === 'short' || look.hair === 'bob') {
    g.beginPath(); g.arc(cx, cy - r * 0.05, r * 1.06, Math.PI * 0.98, Math.PI * 2.02); if (look.hair === 'bob') { g.lineTo(cx + r * 1.02, cy + r * 0.55); g.lineTo(cx - r * 1.06, cy + r * 0.7); } else { g.lineTo(cx + r * 0.9, cy - r * 0.25); g.lineTo(cx - r * 1.02, cy - r * 0.15); } g.closePath(); g.fillStyle = hair; g.fill(); if (!sil) outline(g, 3 * k);
  } else if (look.hair === 'long') { // fringe over the forehead
    g.beginPath(); g.arc(cx, cy - r * 0.05, r * 1.04, Math.PI * 1.02, Math.PI * 1.98); g.lineTo(cx + r * 0.8, cy - r * 0.2); g.lineTo(cx + r * 0.3, cy - r * 0.45); g.lineTo(cx - r * 0.2, cy - r * 0.25); g.lineTo(cx - r * 0.7, cy - r * 0.5); g.lineTo(cx - r * 1.0, cy - r * 0.1); g.closePath(); g.fillStyle = hair; g.fill(); if (!sil) outline(g, 3 * k);
  } else if (look.hair === 'mane') {
    g.beginPath(); g.arc(cx, cy - r * 0.1, r * 1.1, Math.PI * 0.95, Math.PI * 2.05); g.lineTo(cx + r * 1.0, cy - r * 0.3); g.lineTo(cx - r * 1.1, cy - r * 0.2); g.closePath(); g.fillStyle = hair; g.fill(); if (!sil) outline(g, 3 * k);
  }
  // headband: a band with a plain plate (no village symbol, by rule)
  if (look.headband && !sil) {
    const band = look.band || '#2f3b4a';
    g.save(); g.translate(cx, cy);
    if (look.headband === 'tilted') g.rotate(-0.35);
    if (look.headband === 'horned') { g.fillStyle = '#c9d2dc'; g.beginPath(); g.moveTo(-r * 0.9, -r * 0.45); g.lineTo(-r * 0.6, -r * 1.25); g.lineTo(-r * 0.35, -r * 0.5); g.moveTo(r * 0.9, -r * 0.45); g.lineTo(r * 0.6, -r * 1.25); g.lineTo(r * 0.35, -r * 0.5); g.fill(); }
    const y = look.headband === 'happuri' ? -r * 0.2 : -r * 0.5, h = look.headband === 'happuri' ? r * 0.9 : r * 0.34;
    g.fillStyle = band; g.beginPath(); g.rect(-r * 1.02, y - h / 2, r * 2.04, h); g.fill(); outline(g, 2.5 * k);
    if (look.headband !== 'happuri') { g.fillStyle = '#cfd7e0'; g.beginPath(); g.rect(-r * 0.32, y - h / 2 - 1.5 * k, r * 0.78, h + 3 * k); g.fill(); outline(g, 2.5 * k); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(-r * 0.28, y - h / 2 + 1, r * 0.3, 2 * k); }
    if (look.eyepatch) { g.fillStyle = band; g.beginPath(); g.moveTo(-r * 0.05, y + h / 2 - 1); g.lineTo(-r * 0.62, y + h / 2 - 1); g.lineTo(-r * 0.55, r * 0.22); g.lineTo(-r * 0.12, r * 0.18); g.closePath(); g.fill(); outline(g, 2.2 * k); }
    g.restore();
  }
  // face: brow and eyes on the front, whiskers
  if (!sil) {
    const ink = '#1a1410';
    const eye = (ex, w, tall) => { g.fillStyle = ink; g.beginPath(); g.ellipse(ex, cy + r * 0.02, w, tall, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + w * 0.35, cy - r * 0.08, w * 0.35, 0, Math.PI * 2); g.fill(); };
    const narrow = expression === 'menace';
    if (!look.eyepatch) eye(cx + r * 0.12, r * 0.13, narrow ? r * 0.1 : r * 0.2);
    eye(cx + r * 0.58, r * 0.15, narrow ? r * 0.1 : r * 0.22);
    g.strokeStyle = ink; g.lineWidth = 2.6 * k; g.lineCap = 'round';
    const browY = cy - r * 0.3;
    g.beginPath(); g.moveTo(cx + r * 0.36, browY + (narrow ? r * 0.02 : -r * 0.04)); g.lineTo(cx + r * 0.8, browY + r * 0.12); g.stroke();
    if (!look.eyepatch) { g.beginPath(); g.moveTo(cx - r * 0.06, browY - r * 0.02); g.lineTo(cx + r * 0.26, browY + r * 0.02); g.stroke(); }
    if (!look.mask) { g.lineWidth = 2 * k; g.beginPath(); g.moveTo(cx + r * 0.42, cy + r * 0.52); g.lineTo(cx + r * 0.7, cy + r * 0.48); g.stroke(); }
    if (look.whiskers) { g.lineWidth = 1.8 * k; g.strokeStyle = 'rgba(40,20,10,0.75)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cx + r * 0.62, cy + r * (0.2 + i * 0.16)); g.lineTo(cx + r * 0.95, cy + r * (0.14 + i * 0.16)); g.stroke(); g.beginPath(); g.moveTo(cx - r * 0.2, cy + r * (0.24 + i * 0.16)); g.lineTo(cx - r * 0.55, cy + r * (0.18 + i * 0.16)); g.stroke(); } }
  }
}

/**
 * The full figure. o: { x, y (feet), facing, scale, boss, t, walking, walk, lunge (0–1), lean (deg),
 * flash (0–1), cast (0–1), ko (0–1), silhouette, aura, scarf, expression, sprite (Image|null) }
 */
export function drawFigure(g, look, o) {
  const s = (o.scale || 1) * (o.boss ? 1.25 : 1), f = o.facing || 1, sil = !!o.silhouette, t = o.t || 0;
  g.save();
  g.translate(o.x, o.y);
  // shadow stays on the ground, unrotated
  g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(0, 3 * s, 26 * s, 8 * s, 0, 0, Math.PI * 2); g.fill();
  if (o.ko) { g.rotate(-f * o.ko * 1.45); g.globalAlpha *= Math.max(0, 1 - o.ko * 0.85); }
  g.rotate(-f * ((o.lean || 0) * Math.PI / 180));
  g.scale(f * s, s);
  if (o.aura && !sil) { const ag = g.createRadialGradient(0, -48, 8, 0, -48, 78); ag.addColorStop(0, rgba(o.aura, 0.5)); ag.addColorStop(1, rgba(o.aura, 0)); g.fillStyle = ag; g.beginPath(); g.ellipse(0, -46, 58, 82, 0, 0, Math.PI * 2); g.fill(); }
  if (o.sprite) { // a full-body still, feet at the bottom centre, 100 units tall
    const img = o.sprite, hh = 100, ww = hh * (img.width / img.height);
    if (o.flash) { g.save(); g.globalAlpha *= o.flash * 0.8; g.filter = 'brightness(3)'; g.drawImage(img, -ww / 2, -hh, ww, hh); g.restore(); }
    g.drawImage(img, -ww / 2, -hh, ww, hh);
    g.restore(); return;
  }
  const breathe = Math.sin(t * 2.4 + (o.phase || 0)) * 1.3;
  const lungeK = o.lunge || 0, castK = o.cast || 0;
  const hipY = -LEG_H, shY = hipY - BODY_H + breathe, headY = shY - HEAD_R + 4 + breathe * 0.4;
  const color = sil ? '#05070a' : look.color, legColor = sil ? '#05070a' : (look.color2 || shade(look.color, -0.45));
  // legs
  const swing = o.walking ? Math.sin(o.walk || 0) * 10 : 0;
  const stance = lungeK * 14;
  limb(g, -6, hipY + 3, -8 - swing - stance * 0.6, 0, 11, legColor, sil);
  limb(g, 6, hipY + 3, 8 + swing + stance, 0, 11, legColor, sil);
  // back arm
  const backHand = castK ? [SH_W * 0.2, shY - 14 * castK + 20] : lungeK ? [-SH_W * 0.7 - 10 * lungeK, shY + 18] : [-SH_W * 0.45, hipY - 2];
  limb(g, -SH_W * 0.42, shY + 5, backHand[0], backHand[1], 9.5, color, sil);
  if (!sil) { g.fillStyle = look.skin || '#f2c49a'; g.beginPath(); g.arc(backHand[0], backHand[1], 4.2, 0, Math.PI * 2); g.fill(); outline(g, 2.2); }
  // body (a vest over a shirt: main colour, a darker collar)
  const body = () => { g.beginPath(); g.moveTo(-SH_W / 2, shY); g.lineTo(SH_W / 2, shY); g.lineTo(HIP_W / 2, hipY + 4); g.lineTo(-HIP_W / 2, hipY + 4); g.closePath(); };
  body(); g.fillStyle = color; g.fill(); if (!sil) { cel(g, body, -200, -3); body(); outline(g, 3); }
  if (!sil) { g.fillStyle = shade(look.color, -0.3); g.beginPath(); g.moveTo(-SH_W / 2 + 3, shY + 2); g.lineTo(-2, shY + 12); g.lineTo(SH_W * 0.28, shY + 2); g.closePath(); g.fill(); }
  // scarf / sash in the active nature colour
  if (o.scarf && !sil) { g.fillStyle = o.scarf; g.beginPath(); g.rect(-11, shY - 4, 24, 7); g.fill(); outline(g, 2.2); }
  // the big sword on Zabuza's back
  if (look.sword && !sil) { g.save(); g.translate(-8, shY - 6); g.rotate(-0.55); g.fillStyle = '#9aa5b1'; g.beginPath(); g.moveTo(-9, 20); g.lineTo(-11, -58); g.lineTo(-2, -76); g.lineTo(9, -64); g.lineTo(9, 20); g.closePath(); g.fill(); outline(g, 2.5); g.fillStyle = '#6b7885'; g.fillRect(-5, -40, 4, 40); g.fillStyle = '#3b3b3b'; g.beginPath(); g.rect(-4, 20, 6, 24); g.fill(); outline(g, 2); g.restore(); }
  // head
  drawHead(g, look, 2 + lungeK * 6, headY, HEAD_R, { sil, expression: o.expression });
  // front arm: hanging, punching (lunge) or held out (cast)
  const frontHand = castK ? [SH_W / 2 + 22 + 6 * castK, shY + 2 - 6 * castK] : lungeK ? [SH_W / 2 + 26 + 8 * lungeK, shY + 10] : [SH_W / 2 + 2, hipY - 1];
  limb(g, SH_W * 0.42, shY + 5, frontHand[0], frontHand[1], 9.5, color, sil);
  if (!sil) { g.fillStyle = look.skin || '#f2c49a'; g.beginPath(); g.arc(frontHand[0], frontHand[1], 4.4, 0, Math.PI * 2); g.fill(); outline(g, 2.2); }
  // hit flash: white over the head and body
  if (o.flash && !sil) { g.globalAlpha *= o.flash * 0.85; g.fillStyle = '#ffffff'; body(); g.fill(); g.beginPath(); g.arc(2, headY, HEAD_R + 2, 0, Math.PI * 2); g.fill(); }
  g.restore();
  return { handX: o.x + f * frontHand[0] * s, handY: o.y + frontHand[1] * s, headY: o.y + headY * s, shY: o.y + shY * s };
}

/** A bust in a size×size square (the portrait fallback): head and shoulders, facing +x unless flipped. */
export function drawBust(g, look, size, { facing = 1, sil = false, bg = null, expression = 'set' } = {}) {
  g.save();
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, size, size); }
  g.translate(size / 2, 0); g.scale(facing, 1); g.translate(-size / 2, 0);
  const r = size * 0.24, cx = size * 0.5, cy = size * 0.42;
  const shY = cy + r * 1.35;
  const body = () => { g.beginPath(); g.moveTo(cx - r * 2.1, size * 1.05); g.lineTo(cx - r * 1.9, shY + r * 0.2); g.quadraticCurveTo(cx - r * 1.2, shY - r * 0.2, cx - r * 0.5, shY - r * 0.05); g.lineTo(cx + r * 0.5, shY - r * 0.05); g.quadraticCurveTo(cx + r * 1.2, shY - r * 0.2, cx + r * 1.9, shY + r * 0.2); g.lineTo(cx + r * 2.1, size * 1.05); g.closePath(); };
  body(); g.fillStyle = sil ? '#05070a' : look.color; g.fill(); if (!sil) { cel(g, body, cx - r * 3, cx - r * 0.2); body(); outline(g, 4); }
  if (!sil) { g.fillStyle = shade(look.color, -0.3); g.beginPath(); g.moveTo(cx - r * 0.55, shY); g.lineTo(cx, shY + r * 0.5); g.lineTo(cx + r * 0.55, shY); g.closePath(); g.fill(); }
  // neck
  if (!sil) { g.fillStyle = shade(look.skin || '#f2c49a', -0.12); g.fillRect(cx - r * 0.3, cy + r * 0.8, r * 0.6, r * 0.6); }
  drawHead(g, look, cx, cy, r, { sil, expression });
  g.restore();
}

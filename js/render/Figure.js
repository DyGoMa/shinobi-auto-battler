// Figure.js — the code-drawn ninja and bust: the fallback that ships when a sprite or a
// portrait is missing (docs/ART_BIBLE.md §3). Stylised 3½-head figure, medium-thick ink
// line, two-tone cel shading, flat colours. `lookFor(def)` turns a roster or enemy entry
// into a look: its `color` from the data, a hair silhouette and headgear from the table
// below (keyed by id or `basedOn`), the village symbol from tags and ids.
// Unit space: feet at (0, 0), +x forward, one unit = one logical canvas px at scale 1.
import { shade, rgba } from './Stage.js';

const INK = 'rgba(24,19,15,0.92)';
export const HEAD_R = 17, SH_W = 34, HIP_W = 26, BODY_H = 34, LEG_H = 26, FIGURE_H = 96;

// Hair, headgear and face details per character. Anything not listed gets a short cut in a
// dark colour and its village's plate; enemies keyed by `basedOn` share their base look.
const LOOK = {
  naruto: { hair: 'spiky', hairColor: '#f5d24b', whiskers: true },
  naruto_ninetails: { hair: 'spiky', hairColor: '#f5d24b', whiskers: true, aura: '#ff4d2a' },
  naruto_sage: { hair: 'spiky', hairColor: '#f5d24b', whiskers: true, band: '#111' },
  naruto_sixpaths: { hair: 'spiky', hairColor: '#ffe27a', whiskers: true, band: '#111', aura: '#ffd166' },
  naruto_chakramode: { hair: 'spiky', hairColor: '#ffe27a', whiskers: true, band: '#111', aura: '#ffb347' },
  sasuke: { hair: 'sweep', hairColor: '#1b1b2e' }, sasuke_cursemark: { hair: 'sweep', hairColor: '#1b1b2e', aura: '#7c3aed' }, sasuke_ems: { hair: 'sweep', hairColor: '#15151f', headband: false },
  sakura: { hair: 'long', hairColor: '#f8a7c8', band: '#b91c1c' }, sakura_hundred: { hair: 'bob', hairColor: '#f8a7c8', band: '#b91c1c' },
  kakashi: { hair: 'spiky', hairColor: '#d7dce3', mask: '#31405a', eyepatch: true }, kakashi_mangekyo: { hair: 'spiky', hairColor: '#d7dce3', mask: '#31405a', eyepatch: true, aura: '#a78bfa' },
  ino: { hair: 'long', hairColor: '#f1e18a' }, choji: { hair: 'mane', hairColor: '#8a5a2b', skin: '#f6d2b0' }, kiba: { hair: 'short', hairColor: '#5a3a1a', whiskers: true },
  shino: { hair: 'spiky', hairColor: '#4a3a2a', hood: true }, hinata: { hair: 'long', hairColor: '#2c2a5a', band: '#111' }, tenten: { hair: 'buns', hairColor: '#4a2e14' },
  iruka: { hair: 'tail', hairColor: '#4a2e14', scar: true }, jirobo: { hair: 'mohawk', hairColor: '#f97316', headband: false },
  lee: { hair: 'bowl', hairColor: '#111', headband: 'waist' }, neji: { hair: 'long', hairColor: '#3b2a24' }, shikamaru: { hair: 'tail', hairColor: '#2b2b2b' },
  temari: { hair: 'buns', hairColor: '#e8d27a' }, kankuro: { hair: 'hood', hairColor: '#111', paint: true }, haku: { hair: 'long', hairColor: '#2b2b2b', headband: false },
  shizune: { hair: 'short', hairColor: '#1b1b1b', headband: false }, tayuya: { hair: 'long', hairColor: '#e0457b', hat: true }, kidomaru: { hair: 'tail', hairColor: '#2b2b2b', headband: false },
  sakon: { hair: 'sweep', hairColor: '#8fa3b8', headband: false }, guy: { hair: 'bowl', hairColor: '#111', headband: 'waist' }, asuma: { hair: 'short', hairColor: '#2b2b2b', beard: true },
  kurenai: { hair: 'long', hairColor: '#1b1b1b' }, zabuza: { hair: 'short', hairColor: '#1c1c1c', headband: 'tilted', mask: '#d9d3c7', bandaged: true, sword: true },
  gaara: { hair: 'spiky', hairColor: '#b91c1c', headband: false, gourd: true }, gaara_kazekage: { hair: 'spiky', hairColor: '#b91c1c', headband: false, gourd: true, hat: true },
  kabuto: { hair: 'tail', hairColor: '#c9ccd6', glasses: true }, kimimaro: { hair: 'long', hairColor: '#e7e5e4', headband: false },
  hiruzen: { hair: 'short', hairColor: '#8a8a8a', hat: true, beard: true }, jiraiya: { hair: 'mane', hairColor: '#f4f4f4', headband: 'horned', village: 'oil' },
  tsunade: { hair: 'long', hairColor: '#f1e18a', headband: false }, orochimaru: { hair: 'long', hairColor: '#1b1b2e', headband: false, skin: '#efe9e1' },
  konohamaru: { hair: 'spiky', hairColor: '#4a2e14', scarf: '#3b82f6' }, karin: { hair: 'long', hairColor: '#e0457b', glasses: true, headband: false },
  jugo: { hair: 'spiky', hairColor: '#f59e0b', headband: false }, omoi: { hair: 'short', hairColor: '#f4f4f4' }, chojuro: { hair: 'short', hairColor: '#3b82f6', glasses: true },
  sai: { hair: 'short', hairColor: '#111', band: '#111', skin: '#f5efe6' }, suigetsu: { hair: 'short', hairColor: '#cfe9f5', headband: false },
  kurotsuchi: { hair: 'short', hairColor: '#111' }, yamato: { hair: 'short', hairColor: '#3a2716', headband: 'happuri' }, chiyo: { hair: 'bun', hairColor: '#e5e5e5', headband: false },
  deidara: { hair: 'long', hairColor: '#f1e18a', headband: true, village: 'scratched' }, sasori: { hair: 'short', hairColor: '#b91c1c', headband: false },
  hidan: { hair: 'sweep', hairColor: '#d1d5db', headband: true, village: 'scratched' }, kakuzu: { hair: 'hood', hairColor: '#111', mask: '#2b2b2b', headband: true, village: 'scratched' },
  kisame: { hair: 'spiky', hairColor: '#1e3a8a', skin: '#6aa6b8', headband: true, village: 'scratched', sword: true }, konan: { hair: 'bun', hairColor: '#93c5fd', headband: true, village: 'scratched' },
  darui: { hair: 'short', hairColor: '#f4f4f4' }, killer_bee: { hair: 'short', hairColor: '#f4f4f4', glasses: true }, itachi: { hair: 'tail', hairColor: '#1b1b2e', headband: true, village: 'scratched' },
  pain: { hair: 'spiky', hairColor: '#f97316', headband: true, village: 'scratched', piercings: true }, ay: { hair: 'short', hairColor: '#f4f4f4' },
  onoki: { hair: 'bald', hairColor: '#e5e5e5', beard: true, hat: true }, mei: { hair: 'long', hairColor: '#b91c1c', headband: false },
  minato: { hair: 'spiky', hairColor: '#f5d24b' }, hashirama: { hair: 'long', hairColor: '#2b2b2b' }, madara: { hair: 'long', hairColor: '#1b1b2e', headband: false },
  obito: { hair: 'spiky', hairColor: '#1b1b2e', mask: '#f97316', headband: false }, guy_eightgates: { hair: 'bowl', hairColor: '#111', headband: 'waist', aura: '#ff4d4d' },
  // enemies without a roster base
  e_mizuki: { hair: 'long', hairColor: '#d7dce3', band: '#2f3b4a' }, e_mizuki_clash: { hair: 'long', hairColor: '#d7dce3' },
  e_gozu: { hair: 'short', hairColor: '#1b1b1b', mask: '#2b3a4a', headband: 'tilted', village: 'mist', clawed: true }, e_meizu: { hair: 'short', hairColor: '#1b1b1b', mask: '#2b3a4a', headband: 'tilted', village: 'mist' },
  e_zori: { hair: 'tail', hairColor: '#2b2b2b', headband: false, sword: true }, e_waraji: { hair: 'bald', hairColor: '#2b2b2b', headband: false, sword: true, eyepatch: true },
  e_orochimaru_forest: { hair: 'long', hairColor: '#1b1b2e', headband: true, village: 'grass', skin: '#efe9e1' }, e_dosu: { hair: 'hood', hairColor: '#2b2b2b', bandaged: true, mask: '#d9d3c7', village: 'sound' },
  e_zaku: { hair: 'spiky', hairColor: '#1b1b2e', village: 'sound' }, e_kin: { hair: 'long', hairColor: '#1b1b1b', village: 'sound' },
  e_oboro: { hair: 'spiky', hairColor: '#2b2b2b', village: 'rain', mask: '#2b3a4a' }, e_mubi: { hair: 'spiky', hairColor: '#2b2b2b', village: 'rain', mask: '#2b3a4a' }, e_kagari: { hair: 'spiky', hairColor: '#2b2b2b', village: 'rain', mask: '#2b3a4a' },
  e_yoroi: { hair: 'hood', hairColor: '#2b2b2b', glasses: true, mask: '#2b3a4a' }, e_misumi: { hair: 'hood', hairColor: '#2b2b2b', glasses: true, mask: '#2b3a4a' },
  e_hashirama: { hair: 'long', hairColor: '#2b2b2b', reanimated: true }, e_tobirama: { hair: 'spiky', hairColor: '#f4f4f4', reanimated: true, happuri: true },
  e_kisame: { hair: 'spiky', hairColor: '#1e3a8a', skin: '#6aa6b8', headband: true, village: 'scratched', sword: true }, e_itachi: { hair: 'tail', hairColor: '#1b1b2e', headband: true, village: 'scratched' },
  e_manda: { beast: 'snake' }, e_aoi: { hair: 'spiky', hairColor: '#3b8f5f', village: 'rain', umbrella: true }, e_aoi_boss: { hair: 'spiky', hairColor: '#3b8f5f', village: 'rain', sword: true },
  e_ukon: { hair: 'sweep', hairColor: '#8fa3b8', headband: false }, e_doki: { beast: 'ogre' }, e_kurosuki: { hair: 'hood', hairColor: '#111', headband: false },
  e_raiga: { hair: 'long', hairColor: '#3b8f5f', headband: 'tilted', village: 'mist', swords: true }, e_ranmaru: { hair: 'long', hairColor: '#7c3aed', headband: false },
  e_raiga_boss: { hair: 'long', hairColor: '#3b8f5f', headband: 'tilted', village: 'mist', swords: true, aura: '#ffd43b' },
  e_deidara_sand: { hair: 'long', hairColor: '#f1e18a', headband: true, village: 'scratched' }, e_clay_bird: { beast: 'bird' },
  e_fuka: { hair: 'long', hairColor: '#f8a7c8', headband: false }, e_fudo: { hair: 'bald', hairColor: '#2b2b2b', headband: false }, e_sora: { hair: 'spiky', hairColor: '#93c5fd', headband: false, monk: true },
  e_revived_soul: { hair: 'bald', hairColor: '#2b2b2b', headband: false, reanimated: true }, e_kazuma_boss: { hair: 'long', hairColor: '#8a8a8a', headband: false, monk: true },
  e_masked_beast: { beast: 'mask' }, e_kigiri: { hair: 'spiky', hairColor: '#2b2b2b', headband: false }, e_nurari: { hair: 'long', hairColor: '#2b2b2b', headband: false },
  e_guren_boss: { hair: 'long', hairColor: '#93c5fd', headband: false }, e_three_tails: { beast: 'turtle' }, e_c2_dragon: { beast: 'dragon' }, e_tobi: { hair: 'spiky', hairColor: '#1b1b2e', mask: '#f97316', headband: false },
  e_rain_ninja: { hair: 'hood', hairColor: '#2b2b2b', village: 'rain', mask: '#2b3a4a' }, e_summoned_beast: { beast: 'beast' },
  e_pain_animal: { hair: 'spiky', hairColor: '#f97316', headband: true, village: 'scratched', piercings: true }, e_pain_asura: { hair: 'bald', hairColor: '#f97316', headband: true, village: 'scratched', piercings: true },
  e_pain_deva: { hair: 'spiky', hairColor: '#f97316', headband: true, village: 'scratched', piercings: true }, e_pain_naraka: { hair: 'tail', hairColor: '#f97316', headband: true, village: 'scratched', piercings: true },
  e_pain_preta: { hair: 'spiky', hairColor: '#f97316', headband: true, village: 'scratched', piercings: true }, e_crow_clone: { beast: 'bird' },
  e_bee: { hair: 'short', hairColor: '#f4f4f4', glasses: true, village: 'cloud' }, e_eight_tails: { beast: 'beast' }, e_tracker_ninja: { hair: 'hood', hairColor: '#2b2b2b', mask: '#e5e5e5', village: 'mist' },
  e_bandit_ninja: { hair: 'short', hairColor: '#2b2b2b', headband: false }, e_shiranami_boss: { hair: 'long', hairColor: '#2b2b2b', headband: false },
  e_giant_squid: { beast: 'beast' }, e_nine_tails: { beast: 'fox' }, e_kinkaku: { hair: 'spiky', hairColor: '#f1e18a', headband: false, reanimated: true }, e_ginkaku: { hair: 'long', hairColor: '#e5e5e5', headband: false, reanimated: true },
  e_mu_fragment: { hair: 'bald', hairColor: '#e5e5e5', mask: '#e5e5e5', reanimated: true }, e_mu_boss: { hair: 'bald', hairColor: '#e5e5e5', mask: '#e5e5e5', reanimated: true },
  e_four_tails: { beast: 'beast' }, e_ten_tails_clone: { beast: 'clone' }, e_foundation_op: { hair: 'short', hairColor: '#111', mask: '#e5e5e5' }, e_foundation_sniper: { hair: 'short', hairColor: '#111', mask: '#e5e5e5' },
  e_gotta: { hair: 'short', hairColor: '#8a8a8a', headband: false }, e_kaguya: { hair: 'long', hairColor: '#f4f4f4', horns: true, headband: false, skin: '#f7f2ec' }, e_kaguya_boss: { hair: 'long', hairColor: '#f4f4f4', horns: true, headband: false, skin: '#f7f2ec' },
  e_danzo_boss: { hair: 'short', hairColor: '#2b2b2b', bandaged: true, headband: false }, e_puppet: { beast: 'puppet' }, e_itachi_clone: { hair: 'tail', hairColor: '#1b1b2e', headband: true, village: 'scratched' },
  npc_tazuna: { hair: 'short', hairColor: '#8a8a8a', glasses: true, headband: false, beard: true }, npc_tsunami: { hair: 'long', hairColor: '#2b2b4a', headband: false }, npc_idate: { hair: 'spiky', hairColor: '#2b2b2b', headband: false },
  npc_rokusuke: { hair: 'short', hairColor: '#2b2b2b', headband: false }, npc_hotaru: { hair: 'long', hairColor: '#f1e18a', headband: false }, npc_leaf_villager: { hair: 'short', hairColor: '#4a2e14', headband: false }, npc_motoi: { hair: 'short', hairColor: '#2b2b2b', headband: false },
};
const TAG_VILLAGE = { leaf: 'leaf', sand: 'sand', sound: 'sound', mist: 'mist', cloud: 'cloud', stone: 'stone', akatsuki: 'scratched' };
const ID_VILLAGE = [[/sand/, 'sand'], [/sound/, 'sound'], [/rain/, 'rain'], [/mist|tracker/, 'mist'], [/foundation|anbu|leaf|kinoe/, 'leaf'], [/cloud|_bee$/, 'cloud'], [/stone|_mu_/, 'stone'], [/_br_|akatsuki/, 'scratched']];

/** Turn a roster or enemy entry into a look for drawFigure / drawBust. */
export function lookFor(def, C = null) {
  if (!def) return { color: '#78716c', color2: '#44403c', skin: '#e3bfa0', hair: 'short', hairColor: '#222', headband: false };
  const base = LOOK[def.id] || (def.basedOn && LOOK[def.basedOn]) || {};
  let village = base.village;
  if (!village && def.tags) for (const t of def.tags) if (TAG_VILLAGE[t]) { village = TAG_VILLAGE[t]; break; }
  if (!village) for (const [re, v] of ID_VILLAGE) if (re.test(def.id)) { village = v; break; }
  if (!village && def.basedOn && C?.char?.[def.basedOn]) village = lookFor(C.char[def.basedOn], C).village;
  const headband = base.headband !== undefined ? base.headband : (def.role === 'Civilian' ? false : true);
  return {
    color: def.color || '#78716c', color2: base.color2 || shade(def.color || '#78716c', -0.45), skin: base.skin || '#f2c49a',
    hair: base.hair || (def.role === 'Civilian' ? 'short' : 'short'), hairColor: base.hairColor || '#2b2b2b',
    headband, village: headband ? (village || (def.role === 'Civilian' ? null : 'leaf')) : null,
    ...base, name: def.name, initials: def.initials, emoji: def.emoji, reanimated: !!base.reanimated || /Reanimated/.test(def.name || ''),
  };
}

const cel = (g, shape, x0, x1) => { g.save(); g.beginPath(); shape(); g.clip(); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x0, -2000, x1 - x0, 4000); g.restore(); };
const outline = (g, lw = 3) => { g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = INK; g.stroke(); };
function limb(g, x0, y0, x1, y1, w, color, sil) {
  g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1);
  g.lineWidth = w; g.strokeStyle = sil ? '#05070a' : INK; g.stroke();
  if (!sil) { g.lineWidth = w - 5; g.strokeStyle = color; g.stroke(); }
}

/** The village symbol engraved on a headband plate: a simplified mark in a box `s` half-high around (x, y). */
export function drawVillageSymbol(g, village, x, y, s, k = 1) {
  if (!village) return;
  g.save(); g.translate(x, y); g.strokeStyle = '#2b3440'; g.fillStyle = '#2b3440'; g.lineWidth = Math.max(1, 1.4 * k); g.lineCap = 'round'; g.lineJoin = 'round';
  if (village === 'leaf') {
    g.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 3.6; const rr = s * 0.08 + (i / 40) * s * 0.8; const px = Math.cos(a) * rr, py = Math.sin(a) * rr; if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke();
    g.beginPath(); g.moveTo(s * 0.85, s * 0.05); g.lineTo(s * 1.25, -s * 0.35); g.lineTo(s * 1.15, s * 0.45); g.closePath(); g.fill();
  } else if (village === 'mist') {
    for (let i = 0; i < 4; i++) { const yy = -s * 0.75 + i * s * 0.5; g.beginPath(); g.moveTo(-s * 0.9, yy); g.quadraticCurveTo(-s * 0.45, yy - s * 0.35, 0, yy); g.quadraticCurveTo(s * 0.45, yy + s * 0.35, s * 0.9, yy); g.stroke(); }
  } else if (village === 'sand') {
    g.beginPath(); g.moveTo(-s * 0.7, -s * 0.9); g.lineTo(s * 0.7, -s * 0.9); g.quadraticCurveTo(0, 0, s * 0.7, s * 0.9); g.lineTo(-s * 0.7, s * 0.9); g.quadraticCurveTo(0, 0, -s * 0.7, -s * 0.9); g.stroke();
  } else if (village === 'sound') {
    g.beginPath(); g.ellipse(-s * 0.3, s * 0.55, s * 0.45, s * 0.32, -0.4, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(s * 0.1, s * 0.5); g.lineTo(s * 0.1, -s * 0.9); g.quadraticCurveTo(s * 0.7, -s * 0.8, s * 0.7, -s * 0.2); g.stroke();
  } else if (village === 'rain') {
    for (let i = 0; i < 4; i++) { const xx = -s * 0.75 + i * s * 0.5; g.beginPath(); g.moveTo(xx, -s * 0.8); g.lineTo(xx, s * 0.8); g.stroke(); }
  } else if (village === 'cloud') {
    g.beginPath(); g.arc(-s * 0.45, s * 0.2, s * 0.4, Math.PI * 0.5, Math.PI * 1.5); g.arc(-s * 0.05, -s * 0.25, s * 0.5, Math.PI * 1.1, Math.PI * 1.9); g.arc(s * 0.5, s * 0.15, s * 0.42, Math.PI * 1.5, Math.PI * 0.5); g.closePath(); g.stroke();
  } else if (village === 'stone') {
    g.beginPath(); g.moveTo(-s * 0.9, s * 0.8); g.lineTo(-s * 0.6, -s * 0.5); g.lineTo(0, -s * 0.2); g.lineTo(s * 0.1, s * 0.8); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(s * 0.05, s * 0.8); g.lineTo(s * 0.35, -s * 0.9); g.lineTo(s * 0.95, s * 0.3); g.lineTo(s * 0.9, s * 0.8); g.closePath(); g.stroke();
  } else if (village === 'grass') {
    for (let i = 0; i < 3; i++) { const xx = -s * 0.6 + i * s * 0.6; g.beginPath(); g.moveTo(xx, s * 0.9); g.quadraticCurveTo(xx + s * 0.2, 0, xx + s * 0.05, -s * 0.9); g.stroke(); }
  } else if (village === 'oil') {
    g.font = `${Math.round(s * 2.2)}px "Yuji Syuku", serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('油', 0, s * 0.1);
  } else if (village === 'scratched') {
    g.lineWidth = Math.max(1, 2 * k); g.beginPath(); g.moveTo(-s * 1.1, -s * 0.7); g.lineTo(s * 1.1, s * 0.7); g.stroke(); g.lineWidth = Math.max(1, 1.2 * k);
    g.beginPath(); for (let i = 0; i <= 30; i++) { const a = i / 30 * Math.PI * 3; const rr = s * 0.06 + (i / 30) * s * 0.6; const px = Math.cos(a) * rr, py = Math.sin(a) * rr; if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); } g.stroke();
  }
  g.restore();
}

/** The head with hair, headband, mask and face, around (cx, cy) with radius r, facing +x. */
export function drawHead(g, look, cx, cy, r, { sil = false, expression = 'set' } = {}) {
  const skin = sil ? '#05070a' : (look.reanimated ? '#cfd6d4' : look.skin || '#f2c49a'), hair = sil ? '#05070a' : look.hairColor || '#333';
  const k = r / HEAD_R;
  const path = (fn) => { g.beginPath(); fn(); g.closePath(); };
  // hair behind the head
  if (look.hair === 'long') { path(() => { g.moveTo(cx - r * 0.95, cy - r * 0.2); g.quadraticCurveTo(cx - r * 1.35, cy + r * 1.1, cx - r * 0.6, cy + r * 1.9); g.lineTo(cx + r * 0.75, cy + r * 1.7); g.quadraticCurveTo(cx + r * 1.05, cy + r * 0.6, cx + r * 0.9, cy - r * 0.2); }); g.fillStyle = hair; g.fill(); if (!sil) outline(g, 3 * k); }
  if (look.hair === 'mane') { path(() => { g.moveTo(cx - r * 1.1, cy - r * 0.6); g.lineTo(cx - r * 1.5, cy + r * 2.2); g.lineTo(cx - r * 0.4, cy + r * 1.6); g.lineTo(cx + r * 0.2, cy + r * 2.2); g.lineTo(cx + r * 0.9, cy + r * 1.2); g.lineTo(cx + r * 1.05, cy - r * 0.4); }); g.fillStyle = hair; g.fill(); if (!sil) outline(g, 3 * k); }
  if (look.hair === 'tail') { path(() => { g.moveTo(cx - r * 0.9, cy - r * 0.5); g.lineTo(cx - r * 1.5, cy - r * 1.2); g.lineTo(cx - r * 1.9, cy - r * 0.2); g.lineTo(cx - r * 1.1, cy + r * 0.1); }); g.fillStyle = hair; g.fill(); if (!sil) outline(g, 3 * k); }
  if (look.hair === 'buns') { for (const sx of [-0.85, 0.85]) { g.beginPath(); g.arc(cx + sx * r, cy - r * 0.95, r * 0.42, 0, Math.PI * 2); g.fillStyle = hair; g.fill(); if (!sil) outline(g, 3 * k); } }
  if (look.hair === 'bun') { g.beginPath(); g.arc(cx - r * 0.2, cy - r * 1.15, r * 0.4, 0, Math.PI * 2); g.fillStyle = hair; g.fill(); if (!sil) outline(g, 3 * k); }
  if (look.horns && !sil) { g.fillStyle = '#f7f2ec'; for (const sx of [-0.55, 0.45]) { path(() => { g.moveTo(cx + sx * r, cy - r * 0.8); g.lineTo(cx + sx * r - r * 0.25, cy - r * 1.7); g.lineTo(cx + sx * r + r * 0.25, cy - r * 0.9); }); g.fill(); outline(g, 2.5 * k); } }
  // the head
  const headPath = () => { g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); };
  headPath(); g.fillStyle = skin; g.fill(); if (!sil) { cel(g, headPath, cx - r * 2, cx - r * 0.15); headPath(); outline(g, 3 * k); }
  if (look.mask) { g.save(); headPath(); g.clip(); g.fillStyle = sil ? '#05070a' : look.mask; g.fillRect(cx - r - 2, cy + r * 0.05, r * 2 + 4, r); if (look.bandaged && !sil) { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1.5 * k; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx - r, cy + r * (0.2 + i * 0.2)); g.lineTo(cx + r, cy + r * (0.28 + i * 0.2)); g.stroke(); } } g.restore(); headPath(); if (!sil) outline(g, 3 * k); }
  else if (look.bandaged && !sil) { g.save(); headPath(); g.clip(); g.fillStyle = '#e8e2d6'; g.fillRect(cx - r - 2, cy - r * 0.95, r * 2 + 4, r * 0.5); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 1.5 * k; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cx - r, cy - r * (0.9 - i * 0.16)); g.lineTo(cx + r, cy - r * (0.84 - i * 0.16)); g.stroke(); } g.restore(); }
  // hair on top
  const hairFill = () => { g.fillStyle = hair; g.fill(); };
  if (look.hair === 'spiky') {
    const pts = []; const n = 9;
    for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; const tip = i % 2 === 1; const rr = tip ? r * (1.45 + (i % 3) * 0.12) : r * 0.98; const lean = tip ? -0.12 : 0; pts.push([cx + Math.cos(a + lean) * rr, cy + Math.sin(a + lean) * rr * (tip ? 1.05 : 1)]); }
    pts.push([cx + r * 0.9, cy + r * 0.1]); pts.push([cx - r * 0.95, cy + r * 0.15]);
    const shape = () => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
    shape(); hairFill(); if (!sil) { cel(g, shape, cx - r * 2, cx - r * 0.2); shape(); outline(g, 3 * k); }
  } else if (look.hair === 'sweep') {
    path(() => { g.moveTo(cx + r * 0.95, cy - r * 0.15); g.quadraticCurveTo(cx + r * 0.6, cy - r * 1.05, cx, cy - r * 1.02); g.lineTo(cx - r * 0.5, cy - r * 1.35); g.lineTo(cx - r * 0.7, cy - r * 0.9); g.lineTo(cx - r * 1.35, cy - r * 0.95); g.lineTo(cx - r * 1.0, cy - r * 0.4); g.lineTo(cx - r * 1.45, cy - r * 0.1); g.lineTo(cx - r * 0.98, cy + r * 0.2); }); hairFill(); if (!sil) outline(g, 3 * k);
  } else if (look.hair === 'short' || look.hair === 'bob' || look.hair === 'tail' || look.hair === 'buns' || look.hair === 'bun') {
    path(() => { g.arc(cx, cy - r * 0.05, r * 1.06, Math.PI * 0.98, Math.PI * 2.02); if (look.hair === 'bob') { g.lineTo(cx + r * 1.02, cy + r * 0.55); g.lineTo(cx - r * 1.06, cy + r * 0.7); } else { g.lineTo(cx + r * 0.9, cy - r * 0.25); g.lineTo(cx - r * 1.02, cy - r * 0.15); } }); hairFill(); if (!sil) outline(g, 3 * k);
  } else if (look.hair === 'bowl') {
    path(() => { g.arc(cx, cy - r * 0.05, r * 1.08, Math.PI, Math.PI * 2); g.lineTo(cx + r * 1.08, cy + r * 0.05); g.lineTo(cx - r * 1.08, cy + r * 0.05); }); hairFill(); if (!sil) outline(g, 3 * k);
  } else if (look.hair === 'long') {
    path(() => { g.arc(cx, cy - r * 0.05, r * 1.04, Math.PI * 1.02, Math.PI * 1.98); g.lineTo(cx + r * 0.8, cy - r * 0.2); g.lineTo(cx + r * 0.3, cy - r * 0.45); g.lineTo(cx - r * 0.2, cy - r * 0.25); g.lineTo(cx - r * 0.7, cy - r * 0.5); g.lineTo(cx - r * 1.0, cy - r * 0.1); }); hairFill(); if (!sil) outline(g, 3 * k);
  } else if (look.hair === 'mane') {
    path(() => { g.arc(cx, cy - r * 0.1, r * 1.1, Math.PI * 0.95, Math.PI * 2.05); g.lineTo(cx + r * 1.0, cy - r * 0.3); g.lineTo(cx - r * 1.1, cy - r * 0.2); }); hairFill(); if (!sil) outline(g, 3 * k);
  } else if (look.hair === 'mohawk') {
    path(() => { g.moveTo(cx - r * 0.35, cy - r * 0.7); g.lineTo(cx - r * 0.1, cy - r * 1.7); g.lineTo(cx + r * 0.2, cy - r * 0.75); }); hairFill(); if (!sil) outline(g, 3 * k);
  } else if (look.hair === 'hood') {
    path(() => { g.arc(cx, cy, r * 1.15, Math.PI * 0.9, Math.PI * 2.1); g.lineTo(cx + r * 1.0, cy + r * 1.0); g.lineTo(cx - r * 1.0, cy + r * 1.0); }); g.fillStyle = sil ? '#05070a' : shade(look.color, -0.2); g.fill(); if (!sil) outline(g, 3 * k);
  }
  if (look.hat && !sil) { g.fillStyle = look.hatColor || '#efe4c8'; path(() => { g.moveTo(cx - r * 1.35, cy - r * 0.55); g.lineTo(cx + r * 1.35, cy - r * 0.55); g.lineTo(cx, cy - r * 1.95); }); g.fill(); outline(g, 2.5 * k); }
  // headband with the village symbol
  if (look.headband && look.headband !== 'waist' && !sil) {
    const band = look.band || '#2f3b4a';
    g.save(); g.translate(cx, cy);
    if (look.headband === 'tilted') g.rotate(-0.35);
    if (look.headband === 'horned') { g.fillStyle = '#c9d2dc'; g.beginPath(); g.moveTo(-r * 0.9, -r * 0.45); g.lineTo(-r * 0.6, -r * 1.25); g.lineTo(-r * 0.35, -r * 0.5); g.moveTo(r * 0.9, -r * 0.45); g.lineTo(r * 0.6, -r * 1.25); g.lineTo(r * 0.35, -r * 0.5); g.fill(); }
    const y = look.headband === 'happuri' ? -r * 0.2 : -r * 0.5, h = look.headband === 'happuri' ? r * 0.9 : r * 0.34;
    g.fillStyle = band; g.beginPath(); g.rect(-r * 1.02, y - h / 2, r * 2.04, h); g.fill(); outline(g, 2.5 * k);
    if (look.headband !== 'happuri') {
      const pw = r * 0.78, ph = h + 3 * k, px = -r * 0.32, py = y - h / 2 - 1.5 * k;
      g.fillStyle = '#cfd7e0'; g.beginPath(); g.rect(px, py, pw, ph); g.fill(); outline(g, 2.5 * k); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(px + 2 * k, py + 1, r * 0.3, 2 * k);
      drawVillageSymbol(g, look.village, px + pw / 2, py + ph / 2, ph * 0.36, k);
    }
    if (look.eyepatch) { g.fillStyle = band; g.beginPath(); g.moveTo(-r * 0.05, y + h / 2 - 1); g.lineTo(-r * 0.62, y + h / 2 - 1); g.lineTo(-r * 0.55, r * 0.22); g.lineTo(-r * 0.12, r * 0.18); g.closePath(); g.fill(); outline(g, 2.2 * k); }
    g.restore();
  }
  // face
  if (!sil) {
    const ink = '#1a1410';
    const eye = (ex, w, tall) => { g.fillStyle = look.reanimated ? '#2a2a2a' : ink; g.beginPath(); g.ellipse(ex, cy + r * 0.02, w, tall, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + w * 0.35, cy - r * 0.08, w * 0.35, 0, Math.PI * 2); g.fill(); };
    const narrow = expression === 'menace';
    if (!look.eyepatch) eye(cx + r * 0.12, r * 0.13, narrow ? r * 0.1 : r * 0.2);
    eye(cx + r * 0.58, r * 0.15, narrow ? r * 0.1 : r * 0.22);
    if (look.glasses) { g.strokeStyle = ink; g.lineWidth = 1.6 * k; g.beginPath(); g.arc(cx + r * 0.12, cy + r * 0.02, r * 0.24, 0, Math.PI * 2); g.moveTo(cx + r * 0.82, cy + r * 0.02); g.arc(cx + r * 0.58, cy + r * 0.02, r * 0.24, 0, Math.PI * 2); g.stroke(); }
    g.strokeStyle = ink; g.lineWidth = 2.6 * k; g.lineCap = 'round';
    const browY = cy - r * 0.3;
    g.beginPath(); g.moveTo(cx + r * 0.36, browY + (narrow ? r * 0.02 : -r * 0.04)); g.lineTo(cx + r * 0.8, browY + r * 0.12); g.stroke();
    if (!look.eyepatch) { g.beginPath(); g.moveTo(cx - r * 0.06, browY - r * 0.02); g.lineTo(cx + r * 0.26, browY + r * 0.02); g.stroke(); }
    if (!look.mask) { g.lineWidth = 2 * k; g.beginPath(); g.moveTo(cx + r * 0.42, cy + r * 0.52); g.lineTo(cx + r * 0.7, cy + r * 0.48); g.stroke(); }
    if (look.beard && !look.mask) { g.fillStyle = look.hairColor || '#333'; g.beginPath(); g.moveTo(cx - r * 0.2, cy + r * 0.62); g.quadraticCurveTo(cx + r * 0.3, cy + r * 1.15, cx + r * 0.85, cy + r * 0.55); g.quadraticCurveTo(cx + r * 0.4, cy + r * 0.85, cx - r * 0.2, cy + r * 0.62); g.fill(); }
    if (look.scar) { g.strokeStyle = 'rgba(120,60,40,0.8)'; g.lineWidth = 2 * k; g.beginPath(); g.moveTo(cx - r * 0.1, cy + r * 0.32); g.lineTo(cx + r * 0.85, cy + r * 0.32); g.stroke(); }
    if (look.whiskers) { g.lineWidth = 1.8 * k; g.strokeStyle = 'rgba(40,20,10,0.75)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cx + r * 0.62, cy + r * (0.2 + i * 0.16)); g.lineTo(cx + r * 0.95, cy + r * (0.14 + i * 0.16)); g.stroke(); g.beginPath(); g.moveTo(cx - r * 0.2, cy + r * (0.24 + i * 0.16)); g.lineTo(cx - r * 0.55, cy + r * (0.18 + i * 0.16)); g.stroke(); } }
    if (look.paint) { g.strokeStyle = '#6d28d9'; g.lineWidth = 2.2 * k; g.beginPath(); g.moveTo(cx - r * 0.4, cy - r * 0.2); g.lineTo(cx + r * 0.9, cy - r * 0.2); g.moveTo(cx - r * 0.2, cy + r * 0.55); g.lineTo(cx + r * 0.9, cy + r * 0.5); g.stroke(); }
    if (look.piercings) { g.fillStyle = '#c9d2dc'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx + r * (0.5 + i * 0.16), cy + r * 0.62 - i * r * 0.05, r * 0.05, 0, Math.PI * 2); g.fill(); } }
  }
}

/** A beast (tailed beast, summon, puppet, clone): a big silhouette shape instead of a ninja. */
function drawBeast(g, look, o, s, f) {
  const t = o.t || 0, color = o.silhouette ? '#05070a' : look.color, kind = look.beast;
  const br = Math.sin(t * 2) * 1.5;
  g.fillStyle = color;
  if (kind === 'snake') { g.beginPath(); g.moveTo(-40, 0); g.quadraticCurveTo(-30, -60 + br, 0, -50); g.quadraticCurveTo(30, -40, 24, -80 + br); g.quadraticCurveTo(50, -84, 44, -60); g.lineTo(30, -56); g.quadraticCurveTo(36, -30, 4, -32); g.quadraticCurveTo(-24, -30, -10, 0); g.closePath(); g.fill(); outline(g, 3); g.fillStyle = '#fff'; g.beginPath(); g.arc(38, -70, 3, 0, Math.PI * 2); g.fill(); }
  else if (kind === 'bird') { g.beginPath(); g.ellipse(0, -46 + br, 26, 14, 0, 0, Math.PI * 2); g.fill(); outline(g, 3); g.beginPath(); g.moveTo(-10, -50); g.lineTo(-44, -80 + br * 2); g.lineTo(-6, -58); g.moveTo(10, -50); g.lineTo(44, -80 + br * 2); g.lineTo(6, -58); g.closePath(); g.fillStyle = color; g.fill(); outline(g, 3); g.fillStyle = '#ffd43b'; g.beginPath(); g.moveTo(24, -46); g.lineTo(36, -42); g.lineTo(24, -38); g.closePath(); g.fill(); }
  else if (kind === 'turtle' || kind === 'beast' || kind === 'fox') { g.beginPath(); g.ellipse(0, -40 + br, 46, 34, 0, 0, Math.PI * 2); g.fill(); outline(g, 3); g.beginPath(); g.arc(30, -66 + br, 18, 0, Math.PI * 2); g.fill(); outline(g, 3); if (kind === 'fox') { g.beginPath(); g.moveTo(20, -78); g.lineTo(24, -98); g.lineTo(32, -80); g.moveTo(36, -78); g.lineTo(44, -96); g.lineTo(46, -76); g.closePath(); g.fillStyle = color; g.fill(); outline(g, 2.5); for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-40, -40 + i * 6); g.quadraticCurveTo(-80 - i * 6, -60 - i * 18 + br, -60 - i * 8, -90 - i * 12); g.lineWidth = 7; g.strokeStyle = INK; g.stroke(); g.lineWidth = 3; g.strokeStyle = color; g.stroke(); } } if (!o.silhouette) { g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(36, -70 + br, 3.5, 0, Math.PI * 2); g.fill(); } }
  else if (kind === 'dragon') { g.beginPath(); g.moveTo(-50, -20); g.quadraticCurveTo(-20, -70 + br, 10, -50); g.quadraticCurveTo(40, -30, 50, -70); g.lineTo(54, -60); g.quadraticCurveTo(36, -18, 6, -34); g.quadraticCurveTo(-14, -46, -40, -6); g.closePath(); g.fill(); outline(g, 3); }
  else if (kind === 'mask') { g.beginPath(); g.ellipse(0, -50 + br, 24, 30, 0, 0, Math.PI * 2); g.fill(); outline(g, 3); g.fillStyle = '#fff'; g.beginPath(); g.arc(-8, -56, 4, 0, Math.PI * 2); g.arc(8, -56, 4, 0, Math.PI * 2); g.fill(); }
  else if (kind === 'puppet') { g.beginPath(); g.rect(-14, -60 + br, 28, 40); g.fill(); outline(g, 3); g.beginPath(); g.arc(0, -70 + br, 12, 0, Math.PI * 2); g.fill(); outline(g, 3); limb(g, -14, -50, -30, -20, 8, color, o.silhouette); limb(g, 14, -50, 30, -20, 8, color, o.silhouette); }
  else if (kind === 'ogre') { g.beginPath(); g.ellipse(0, -46 + br, 30, 40, 0, 0, Math.PI * 2); g.fill(); outline(g, 3); g.beginPath(); g.moveTo(-14, -80); g.lineTo(-18, -100); g.lineTo(-6, -84); g.moveTo(14, -80); g.lineTo(18, -100); g.lineTo(6, -84); g.closePath(); g.fill(); outline(g, 2.5); }
  else { g.beginPath(); g.ellipse(0, -40 + br, 30, 36, 0, 0, Math.PI * 2); g.fill(); outline(g, 3); }
}

/**
 * The full figure. o: { x, y (feet), facing, scale, boss, add, t, walking, walk, lunge (0–1), lean (deg),
 * flash (0–1), cast (0–1), ko (0–1), silhouette, aura, scarf, expression, sprite (Image|null), phase }
 * Returns the hand and chest positions (world coords) for effects.
 */
export function drawFigure(g, look, o) {
  const s = (o.scale || 1) * (o.boss ? 1.25 : o.add ? 0.85 : 1), f = o.facing || 1, sil = !!o.silhouette, t = o.t || 0;
  g.save();
  g.translate(o.x, o.y);
  g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(0, 3 * s, 26 * s, 8 * s, 0, 0, Math.PI * 2); g.fill();
  if (o.ko) { g.rotate(-f * o.ko * 1.45); g.globalAlpha *= Math.max(0, 1 - o.ko * 0.85); }
  g.rotate(-f * ((o.lean || 0) * Math.PI / 180));
  g.scale(f * s, s);
  const aura = o.aura || look.aura;
  if (aura && !sil) { const ag = g.createRadialGradient(0, -48, 8, 0, -48, 78); ag.addColorStop(0, rgba(aura, 0.5)); ag.addColorStop(1, rgba(aura, 0)); g.fillStyle = ag; g.beginPath(); g.ellipse(0, -46, 58, 82, 0, 0, Math.PI * 2); g.fill(); }
  if (o.sprite) {
    const img = o.sprite, hh = 100, ww = hh * (img.width / img.height);
    if (o.flash) { g.save(); g.globalAlpha *= o.flash * 0.8; g.filter = 'brightness(3)'; g.drawImage(img, -ww / 2, -hh, ww, hh); g.restore(); }
    g.drawImage(img, -ww / 2, -hh, ww, hh);
    g.restore();
    return { handX: o.x + f * 30 * s, handY: o.y - 50 * s, chestX: o.x, chestY: o.y - 44 * s, headY: o.y - 76 * s };
  }
  if (look.beast) { drawBeast(g, look, o, s, f); if (o.flash && !sil) { g.globalAlpha *= o.flash * 0.85; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, -44, 46, 40, 0, 0, Math.PI * 2); g.fill(); } g.restore(); return { handX: o.x + f * 30 * s, handY: o.y - 50 * s, chestX: o.x, chestY: o.y - 44 * s, headY: o.y - 70 * s }; }
  const breathe = Math.sin(t * 2.4 + (o.phase || 0)) * 1.3;
  const lungeK = o.lunge || 0, castK = o.cast || 0;
  const hipY = -LEG_H, shY = hipY - BODY_H + breathe, headY = shY - HEAD_R + 4 + breathe * 0.4;
  const color = sil ? '#05070a' : look.color, legColor = sil ? '#05070a' : (look.color2 || shade(look.color, -0.45));
  const swing = o.walking ? Math.sin(o.walk || 0) * 10 : 0;
  const stance = lungeK * 14;
  limb(g, -6, hipY + 3, -8 - swing - stance * 0.6, 0, 11, legColor, sil);
  limb(g, 6, hipY + 3, 8 + swing + stance, 0, 11, legColor, sil);
  const backHand = castK ? [SH_W * 0.2, shY - 14 * castK + 20] : lungeK ? [-SH_W * 0.7 - 10 * lungeK, shY + 18] : [-SH_W * 0.45, hipY - 2];
  limb(g, -SH_W * 0.42, shY + 5, backHand[0], backHand[1], 9.5, color, sil);
  if (!sil) { g.fillStyle = look.skin || '#f2c49a'; g.beginPath(); g.arc(backHand[0], backHand[1], 4.2, 0, Math.PI * 2); g.fill(); outline(g, 2.2); }
  if (look.gourd && !sil) { g.save(); g.translate(-16, shY + 8); g.rotate(0.35); g.fillStyle = '#c9a26b'; g.beginPath(); g.ellipse(0, 0, 11, 22, 0, 0, Math.PI * 2); g.fill(); outline(g, 2.5); g.restore(); }
  const body = () => { g.beginPath(); g.moveTo(-SH_W / 2, shY); g.lineTo(SH_W / 2, shY); g.lineTo(HIP_W / 2, hipY + 4); g.lineTo(-HIP_W / 2, hipY + 4); g.closePath(); };
  body(); g.fillStyle = color; g.fill(); if (!sil) { cel(g, body, -200, -3); body(); outline(g, 3); }
  if (!sil) { g.fillStyle = shade(look.color, -0.3); g.beginPath(); g.moveTo(-SH_W / 2 + 3, shY + 2); g.lineTo(-2, shY + 12); g.lineTo(SH_W * 0.28, shY + 2); g.closePath(); g.fill(); }
  if (look.headband === 'waist' && !sil) { g.fillStyle = look.band || '#b91c1c'; g.fillRect(-HIP_W / 2 - 1, hipY - 2, HIP_W + 2, 5); }
  if (o.scarf && !sil) { g.fillStyle = o.scarf; g.beginPath(); g.rect(-11, shY - 4, 24, 7); g.fill(); outline(g, 2.2); }
  if ((look.sword || look.swords) && !sil) { g.save(); g.translate(-8, shY - 6); g.rotate(-0.55); g.fillStyle = '#9aa5b1'; g.beginPath(); if (look.swords) { g.rect(-6, -60, 8, 76); } else { g.moveTo(-9, 20); g.lineTo(-11, -58); g.lineTo(-2, -76); g.lineTo(9, -64); g.lineTo(9, 20); g.closePath(); } g.fill(); outline(g, 2.5); g.fillStyle = '#3b3b3b'; g.beginPath(); g.rect(-4, 20, 6, 24); g.fill(); outline(g, 2); g.restore(); }
  drawHead(g, look, 2 + lungeK * 6, headY, HEAD_R, { sil, expression: o.expression });
  const frontHand = castK ? [SH_W / 2 + 22 + 6 * castK, shY + 2 - 6 * castK] : lungeK ? [SH_W / 2 + 26 + 8 * lungeK, shY + 10] : [SH_W / 2 + 2, hipY - 1];
  limb(g, SH_W * 0.42, shY + 5, frontHand[0], frontHand[1], 9.5, color, sil);
  if (!sil) { g.fillStyle = look.skin || '#f2c49a'; g.beginPath(); g.arc(frontHand[0], frontHand[1], 4.4, 0, Math.PI * 2); g.fill(); outline(g, 2.2); }
  if (o.flash && !sil) { g.globalAlpha *= o.flash * 0.85; g.fillStyle = '#ffffff'; body(); g.fill(); g.beginPath(); g.arc(2, headY, HEAD_R + 2, 0, Math.PI * 2); g.fill(); }
  g.restore();
  return { handX: o.x + f * frontHand[0] * s, handY: o.y + frontHand[1] * s, chestX: o.x, chestY: o.y + (shY + 14) * s, headY: o.y + headY * s };
}

/** A bust in a size×size square (the portrait fallback): head and shoulders, facing +x unless flipped. */
export function drawBust(g, look, size, { facing = 1, sil = false, bg = null, expression = 'set' } = {}) {
  g.save();
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, size, size); }
  g.translate(size / 2, 0); g.scale(facing, 1); g.translate(-size / 2, 0);
  if (look.beast) { g.translate(size / 2, size * 0.98); g.scale(size / 130, size / 130); drawBeast(g, look, { t: 0, silhouette: sil }, 1, 1); g.restore(); return; }
  const r = size * 0.24, cx = size * 0.5, cy = size * 0.42;
  const shY = cy + r * 1.35;
  const body = () => { g.beginPath(); g.moveTo(cx - r * 2.1, size * 1.05); g.lineTo(cx - r * 1.9, shY + r * 0.2); g.quadraticCurveTo(cx - r * 1.2, shY - r * 0.2, cx - r * 0.5, shY - r * 0.05); g.lineTo(cx + r * 0.5, shY - r * 0.05); g.quadraticCurveTo(cx + r * 1.2, shY - r * 0.2, cx + r * 1.9, shY + r * 0.2); g.lineTo(cx + r * 2.1, size * 1.05); g.closePath(); };
  body(); g.fillStyle = sil ? '#05070a' : look.color; g.fill(); if (!sil) { cel(g, body, cx - r * 3, cx - r * 0.2); body(); outline(g, 4); }
  if (!sil) { g.fillStyle = shade(look.color, -0.3); g.beginPath(); g.moveTo(cx - r * 0.55, shY); g.lineTo(cx, shY + r * 0.5); g.lineTo(cx + r * 0.55, shY); g.closePath(); g.fill(); }
  if (!sil) { g.fillStyle = shade(look.reanimated ? '#cfd6d4' : look.skin || '#f2c49a', -0.12); g.fillRect(cx - r * 0.3, cy + r * 0.8, r * 0.6, r * 0.6); }
  drawHead(g, look, cx, cy, r, { sil, expression });
  g.restore();
}

/** A cached bust canvas per look id and size (busts are drawn hundreds of times on the Roster). */
const bustCache = new Map();
export function bustCanvas(look, size, opts = {}) {
  const key = `${look.id || look.name}|${size}|${opts.facing || 1}|${opts.expression || ''}`;
  let c = bustCache.get(key);
  if (!c) {
    c = document.createElement('canvas'); c.width = size; c.height = size;
    drawBust(c.getContext('2d'), look, size, opts);
    if (bustCache.size > 400) bustCache.clear();
    bustCache.set(key, c);
  }
  return c;
}

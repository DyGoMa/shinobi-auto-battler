// tools/key-lib.mjs — keying a flat background out of a generated picture. Pure functions on
// an RGBA buffer (Uint8ClampedArray or Uint8Array, row-major, 4 bytes a pixel), shared by
// tools/ingest.mjs (Node, through sharp) and art.html (the browser, through a canvas).
//
//   backgroundColor(p, W, H)                 the flat background: the median of the border pixels
//   keyBackground(p, W, H, opts)             removes it: a flood fill from the border, then every
//                                            enclosed patch of the same flat colour (the white under
//                                            a headband that the border fill cannot reach), a soft
//                                            edge, and a fringe pass so no halo is left
//   leftovers(p, W, H, bg, opts)             the opaque patches still coloured like the background
//                                            (for the art page's warning and highlight)
//   wandRemove(p, W, H, x, y, opts)          removes the patch under a click, keyed on that pixel's
//                                            own colour (the hand fix), with the same soft edge
//   defringe(p, W, H), bounds(p, W, H)       helpers the ingest tool uses
//
// Numbers: tol is the colour distance (0–441) inside which a pixel is background; soft widens the
// edge where alpha fades; holeTol (tighter) and minHole (pixels) decide which enclosed patches are
// background rather than a white collar with shading.

// Enclosed patches are removed by themselves only when they are big (autoHoleFrac of the image, 0.2 %:
// the background between an arm and the body, under a headband); smaller ones (the whites of the
// eyes on a white background are the same colour) are only reported, for the wand.
export const DEFAULTS = { tol: 58, soft: 46, holeTol: 26, minHole: 12, autoHoleFrac: 0.002, warnHoleFrac: 0.0005 };

const dist3 = (p, i, bg) => Math.sqrt((p[i] - bg[0]) ** 2 + (p[i + 1] - bg[1]) ** 2 + (p[i + 2] - bg[2]) ** 2);
const median = (arr) => { arr.sort((a, b) => a - b); return arr[arr.length >> 1]; };

/** The flat background colour [r, g, b]: the median of the border pixels (every third one). */
export function backgroundColor(p, W, H) {
  const idx = [];
  for (let x = 0; x < W; x += 3) idx.push(x * 4, ((H - 1) * W + x) * 4);
  for (let y = 0; y < H; y += 3) idx.push(y * W * 4, (y * W + W - 1) * 4);
  return [median(idx.map(i => p[i])), median(idx.map(i => p[i + 1])), median(idx.map(i => p[i + 2]))];
}

/**
 * Fade out the pixels reachable from `seeds` through background-coloured pixels. Alpha goes to 0
 * inside `tol`, and fades over the next `soft` of colour distance; the fading fringe is pulled
 * toward grey so a magenta or white tint does not survive in the edge. Returns pixels touched.
 */
function fadeFrom(p, W, H, bg, seeds, { tol, soft }) {
  const seen = new Uint8Array(W * H); const stack = []; let n = 0;
  const push = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const k = y * W + x; if (seen[k]) return; seen[k] = 1; if (dist3(p, k * 4, bg) < tol + soft) stack.push(k); };
  for (const [x, y] of seeds) push(x, y);
  while (stack.length) {
    const k = stack.pop(); const i = k * 4; const dd = dist3(p, i, bg); const a = dd < tol ? 0 : (dd - tol) / soft;
    p[i + 3] = Math.round(p[i + 3] * a); n++;
    if (a > 0 && a < 1) { const grey = (p[i] + p[i + 1] + p[i + 2]) / 3; p[i] = Math.round(grey + (p[i] - grey) * a); p[i + 1] = Math.round(grey + (p[i + 1] - grey) * a); p[i + 2] = Math.round(grey + (p[i + 2] - grey) * a); }
    if (dd < tol) { const x = k % W, y = (k / W) | 0; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
  }
  return n;
}

/**
 * The connected patches of still-opaque pixels (alpha ≥ 250) within `holeTol` of `bg`, at least
 * `minHole` pixels each: [{ size, x0, y0, x1, y1, pixels: [k, ...] }], biggest first.
 */
export function leftovers(p, W, H, bg, { holeTol = DEFAULTS.holeTol, minHole = DEFAULTS.minHole } = {}) {
  const seen = new Uint8Array(W * H); const out = [];
  for (let s = 0; s < W * H; s++) {
    if (seen[s] || p[s * 4 + 3] < 250 || dist3(p, s * 4, bg) >= holeTol) continue;
    const pixels = []; const stack = [s]; seen[s] = 1;
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    while (stack.length) {
      const k = stack.pop(); pixels.push(k);
      const x = k % W, y = (k / W) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const kk = yy * W + xx; if (seen[kk]) continue; seen[kk] = 1;
        if (p[kk * 4 + 3] >= 250 && dist3(p, kk * 4, bg) < holeTol) stack.push(kk);
      }
    }
    if (pixels.length >= minHole) out.push({ size: pixels.length, x0, y0, x1, y1, pixels });
  }
  return out.sort((a, b) => b.size - a.size);
}

/**
 * Key the flat background out in place. Returns { bg, keyed (fraction of pixels), holes (enclosed
 * patches removed: those at least autoHoleFrac of the image) }. With holes: false only the
 * border-connected background goes (the old rule). Smaller enclosed patches: see leftovers().
 */
export function keyBackground(p, W, H, { tol = DEFAULTS.tol, soft = DEFAULTS.soft, holeTol = DEFAULTS.holeTol, autoHoleFrac = DEFAULTS.autoHoleFrac, holes = true, bg = null, strength = 1 } = {}) {
  bg = bg || backgroundColor(p, W, H);
  // strength (the art studio's slider, 1 = the defaults) widens or narrows every colour tolerance at once
  tol *= strength; soft *= strength; holeTol *= strength;
  const seeds = [];
  for (let x = 0; x < W; x++) { seeds.push([x, 0], [x, H - 1]); }
  for (let y = 0; y < H; y++) { seeds.push([0, y], [W - 1, y]); }
  // A vivid background (magenta) is cut hard at tol and every blended pixel is left to the spill un-mix,
  // which gets both its colour and its alpha right: the soft fade would pull a thin outline toward grey
  // and the fringe pass would repaint it with the hair beside it (a pale halo). White or grey keeps the old way.
  const vividBg = saturated(bg);
  let n = fadeFrom(p, W, H, bg, seeds, { tol, soft: vividBg ? 0 : soft });
  let holeCount = 0;
  if (holes) {
    // Enclosed background: patches the border fill could not reach. They are keyed on a tighter
    // tolerance (a flat generated background is uniform; a shaded white collar is not). A strongly
    // coloured background (magenta, blue) never appears in the art, so any real-sized pocket of it
    // goes; a white or grey one could be the whites of the eyes, so only big pockets go.
    const vivid = vividBg;
    const minHole = vivid ? Math.max(DEFAULTS.minHole, Math.round(VIVID_HOLE_FRAC * W * H)) : Math.max(DEFAULTS.minHole, Math.round(autoHoleFrac * W * H));
    for (const h of leftovers(p, W, H, bg, { holeTol, minHole })) {
      holeCount++;
      const k = h.pixels[0];
      n += fadeFrom(p, W, H, bg, [[k % W, (k / W) | 0]], { tol: holeTol, soft: vividBg ? 0 : Math.min(soft, 24) });
    }
  }
  if (vividBg) unmixEdge(p, W, H, bg); else defringe(p, W, H);
  return { bg, keyed: n / (W * H), holes: holeCount };
}

/** A strongly coloured background (magenta, blue, green): max − min channel of at least 120. */
export function saturated(bg) { return Math.max(...bg) - Math.min(...bg) >= 120; }
const VIVID_HOLE_FRAC = 0.00004;   // a vivid pocket of at least 0.004 % of the picture (about 40 px at 1024²) is background

/**
 * Take the background's colour out of the picture (spill). An anti-aliased outline pixel is ink
 * blended with the background (dark + magenta = purple): too far from the background colour for the
 * fade to catch, so it stays opaque and tinted. The spill is measured on the background's own axis:
 * its strong channels (red and blue for magenta) rising above its weak ones (green), which the
 * character's colours hardly do. That excess over the background's gives t, the background's share;
 * the pixel is un-mixed, (P − t·bg) / (1 − t), and t comes off its alpha.
 *   Within SPILL_BAND steps of a keyed pixel, any spill is taken out (t ≥ 10 %: red cloth and pink hair carry up to about 8 % of their own).
 *   Anywhere else, only a strongly tinted pixel (t ≥ 50 %: a speck of background trapped between two
 *   lines); a purple detail (a seal, a sash) sits well below that and is left alone.
 */
const SPILL_BAND = 3;
export function unmixEdge(p, W, H, bg) {
  const hi = [0, 1, 2].filter(c => bg[c] >= 128), lo = [0, 1, 2].filter(c => bg[c] < 128);
  if (!hi.length || !lo.length) return;
  const spill = (r, g, b) => { const v = [r, g, b]; return Math.min(...hi.map(c => v[c])) - Math.max(...lo.map(c => v[c])); };
  const full = spill(bg[0], bg[1], bg[2]); if (full < 100) return;
  const N = W * H, depth = new Uint8Array(N).fill(255), queue = [];
  for (let k = 0; k < N; k++) if (p[k * 4 + 3] < 128) { depth[k] = 0; queue.push(k); }
  for (let qi = 0; qi < queue.length; qi++) {
    const k = queue[qi], d = depth[k]; if (d >= SPILL_BAND) continue;
    const x = k % W, y = (k / W) | 0;
    for (const [xx, yy] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const kk = yy * W + xx; if (depth[kk] <= d + 1) continue; depth[kk] = d + 1; queue.push(kk);
    }
  }
  // Seeds: spill in the edge band, or a strong tint anywhere. Then the cleanup grows from them through
  // touching pixels with at least 20 % spill, so the tinted tip of a narrow wedge between two strands
  // is reached too, while a purple detail surrounded by skin never is.
  const T = new Float32Array(N), mark = new Uint8Array(N), grow = [];
  for (let k = 0; k < N; k++) {
    if (p[k * 4 + 3] === 0) continue;
    T[k] = Math.min(1, spill(p[k * 4], p[k * 4 + 1], p[k * 4 + 2]) / full);
    if (T[k] >= (depth[k] <= SPILL_BAND ? 0.1 : 0.5)) { mark[k] = 1; grow.push(k); }
  }
  for (let gi = 0; gi < grow.length; gi++) {
    const k = grow[gi], x = k % W, y = (k / W) | 0;
    for (const [xx, yy] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const kk = yy * W + xx; if (mark[kk] || p[kk * 4 + 3] === 0 || T[kk] < 0.2) continue;
      mark[kk] = 1; grow.push(kk);
    }
  }
  for (let k = 0; k < N; k++) {
    if (!mark[k]) continue;
    const i = k * 4, a = p[i + 3], t = T[k];
    if (t >= 0.97) { p[i + 3] = 0; continue; }
    for (let c = 0; c < 3; c++) p[i + c] = Math.max(0, Math.min(255, Math.round((p[i + c] - t * bg[c]) / (1 - t))));
    p[i + 3] = Math.round(a * (1 - t));
  }
}

/** Remove the patch under (x, y) by hand: keyed on that pixel's own colour, a soft edge, no fringe. */
export function wandRemove(p, W, H, x, y, { tol = 30, soft = 20 } = {}) {
  if (x < 0 || y < 0 || x >= W || y >= H) return 0;
  const i = (y * W + x) * 4;
  if (p[i + 3] === 0) return 0;
  const bg = [p[i], p[i + 1], p[i + 2]];
  const n = fadeFrom(p, W, H, bg, [[x, y]], { tol, soft });
  defringe(p, W, H);
  return n;
}

/**
 * The fringe pass: a JPEG (or an anti-aliased edge) blends the outline with the background, so
 * the semi-transparent edge pixels carry a pale tint. Each edge pixel takes the average colour of
 * the solid pixels within two steps of it, keeping its own alpha, so the outline's ink runs to
 * the very edge and no halo is left.
 */
export function defringe(p, W, H) {
  const src = new Uint8ClampedArray(p);   // read from the copy, write into p
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4; const a = src[i + 3];
    if (a === 0 || a >= 250) continue;
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const j = (yy * W + xx) * 4; if (src[j + 3] < 250) continue;
      r += src[j]; g += src[j + 1]; b += src[j + 2]; n++;
    }
    if (n) { p[i] = Math.round(r / n); p[i + 1] = Math.round(g / n); p[i + 2] = Math.round(b / n); }
  }
}

/** The opaque bounding box of an RGBA buffer (alpha > 8), or null when empty. */
export function bounds(p, W, H) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (p[(y * W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

/**
 * Black lines: recolour the picture's outlines to the ink (docs/ART_BIBLE.md §3.2, #181310) when the
 * generator drew them dark red or brown, or tinted the outer ones toward the background. A line is
 * told from a dark fill (a shadow on red cloth is as dark as the line) by its shape: a line pixel is
 * dark and has something clearly lighter within LINE_REACH steps on BOTH sides along some direction
 * (a stroke is thin; a shadow is wide). Transparent pixels count as light, so the outer outline
 * qualifies. The line's own colour is the median of those core pixels; each pixel near a line is
 * then moved by a × (ink − line colour), a being how much line it holds (by its brightness between
 * the lighter surroundings and the line), so anti-aliased edges stay smooth. Returns pixels changed.
 */
export const INK = [24, 19, 16];
const LINE_REACH = 6;   // at 768 px; scaled with the picture (lines are thicker on a bigger one: 13 px at 1536)
export function inkLines(p, W, H, { ink = INK } = {}) {
  const N = W * H, L = new Float32Array(N);
  for (let k = 0; k < N; k++) { const i = k * 4; L[k] = p[i + 3] < 128 ? 255 : 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]; }
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 255 : L[y * W + x];
  const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
  const reach = Math.max(LINE_REACH, Math.round(Math.min(W, H) / 128));
  // The picture's line colour, read where it is certain: the dark pixels of the outer rim (within two
  // steps of the see-through background). Gemini: dark red or purple; ChatGPT: near-black.
  const rimR = [], rimG = [], rimB = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    const k = y * W + x; if (p[k * 4 + 3] < 250 || L[k] >= 90) continue;
    let edge = false; for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H || p[(yy * W + xx) * 4 + 3] < 128) { edge = true; break; } }
    if (edge) { rimR.push(p[k * 4]); rimG.push(p[k * 4 + 1]); rimB.push(p[k * 4 + 2]); }
  }
  const median = (a) => { a.sort((u, v) => u - v); return a[a.length >> 1]; };
  const rim = rimR.length > 20 ? [median(rimR), median(rimG), median(rimB)] : ink;
  const cdist = (i, c) => Math.abs(p[i] - c[0]) + Math.abs(p[i + 1] - c[1]) + Math.abs(p[i + 2] - c[2]);
  // core: a thin dark stroke OF THE LINE COLOUR. The colour check keeps the dark greens of an iris and the
  // navy of a shading band out. A pixel close to the ink itself counts with less contrast around it (a
  // black line inside dark cloth); one that only matches the picture's own line colour needs clearly
  // lighter surroundings on both sides (so a dark red shadow on red cloth is not taken for a line).
  const core = new Uint8Array(N); const coreCols = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x; const l = L[k]; if (l > 110 || p[k * 4 + 3] < 128) continue;
    const i = k * 4, nearInk = cdist(i, ink) <= 45, nearRim = cdist(i, rim) <= 60;   // near-black only: the dark navy of a boot's shading (about 60 off the ink) is not a line
    if (!nearInk && !nearRim) continue;
    const need = nearInk ? 22 : 45;
    let thin = false;
    for (const [dx, dy] of DIRS) {
      let a = 0, b = 0;
      for (let s = 1; s <= reach; s++) { a = Math.max(a, at(x + dx * s, y + dy * s)); b = Math.max(b, at(x - dx * s, y - dy * s)); }
      if (a - l > need && b - l > need) { thin = true; break; }
    }
    if (thin) { core[k] = 1; if ((k & 7) === 0) coreCols.push(k); }
  }
  // The outer outline: a dark pixel within OUTER_BAND steps of the see-through background is the
  // silhouette's outline, whatever lies further in (a thick outline is too wide for the thin-stroke test
  // near its outer edge, and that rim is the line the game shows against every stage).
  const OUTER_BAND = 3; const near = new Uint8Array(N); const q = [];
  for (let k = 0; k < N; k++) if (p[k * 4 + 3] < 128) { near[k] = 1; q.push(k); }
  for (let step = 0; step < OUTER_BAND; step++) { const next = []; for (const k of q) { const x = k % W, y = (k / W) | 0; for (const [xx, yy] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const kk = yy * W + xx; if (near[kk]) continue; near[kk] = step + 2; next.push(kk); } } q.length = 0; q.push(...next); }
  for (let k = 0; k < N; k++) if (near[k] > 1 && !core[k] && p[k * 4 + 3] > 0) { const i = k * 4; const lr = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]; if (lr < 90 && (cdist(i, ink) <= 45 || cdist(i, rim) <= 60 || p[i + 3] < 250)) { core[k] = 1; if ((k & 7) === 0) coreCols.push(k); } }
  // The rest of a thick outer outline: grow inward from the rim through pixels of the rim's own colour
  // (within 28), up to the outline's measured thickness. A shading band of a different colour just inside
  // the outline (the navy shadow on Naruto's shoulder) is not the line and stays.
  const ow = outlineWeight(p, W, H); const maxDepth = ow ? Math.ceil(ow.measured) + 2 : 6;
  const seed = new Int32Array(N).fill(-1), depthIn = new Uint8Array(N), grow = [];
  for (let k = 0; k < N; k++) if (near[k] > 1 && core[k]) { seed[k] = k; grow.push(k); }
  for (let gi = 0; gi < grow.length; gi++) {
    const k = grow[gi]; if (depthIn[k] >= maxDepth) continue;
    const x = k % W, y = (k / W) | 0, sI = seed[k] * 4;
    for (const [xx, yy] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const kk = yy * W + xx; if (core[kk] || p[kk * 4 + 3] < 250) continue;
      const i = kk * 4; const lr = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
      if (lr >= 70) continue;
      const dc = Math.abs(p[i] - p[sI]) + Math.abs(p[i + 1] - p[sI + 1]) + Math.abs(p[i + 2] - p[sI + 2]);
      if (dc > 28 * 3 / 2) continue;
      core[kk] = 1; seed[kk] = seed[k]; depthIn[kk] = depthIn[k] + 1; grow.push(kk);
    }
  }
  if (coreCols.length < 20) return 0;
  // the line colour: the median of the darkest half of the core (the stroke's middle, not its edges)
  coreCols.sort((u, v) => L[u] - L[v]);
  const mid = coreCols.slice(0, Math.max(10, coreCols.length >> 1));
  const med = (c) => { const a = mid.map(k => p[k * 4 + c]).sort((u, v) => u - v); return a[a.length >> 1]; };
  const line = [med(0), med(1), med(2)], lineL = 0.299 * line[0] + 0.587 * line[1] + 0.114 * line[2];
  const shift = [ink[0] - line[0], ink[1] - line[1], ink[2] - line[2]];
  // already ink: every line pixel (not just the darkest) within a small distance of the ink on average
  let off = 0, total = 0;
  for (let k = 0; k < N; k += 3) if (core[k]) { total++; if (Math.abs(p[k * 4] - ink[0]) + Math.abs(p[k * 4 + 1] - ink[1]) + Math.abs(p[k * 4 + 2] - ink[2]) > 30) off++; }
  if (!total || off / total < 0.01) return 0;   // under 1 % of the line pixels are off the ink
  // the zone: the core and two steps around it (the anti-aliased edge)
  const zone = new Uint8Array(N);
  for (let k = 0; k < N; k++) if (core[k]) { const x = k % W, y = (k / W) | 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) zone[yy * W + xx] = 1; } }
  const src = new Uint8ClampedArray(p); let n = 0;
  for (let k = 0; k < N; k++) {
    if (!zone[k] || src[k * 4 + 3] === 0) continue;
    let a;
    if (core[k]) a = 1;
    else {
      // how much line this edge pixel holds: its brightness between the line and its lightest opaque neighbour
      const x = k % W, y = (k / W) | 0; let hi = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const kk = yy * W + xx; if (src[kk * 4 + 3] >= 128 && !core[kk]) hi = Math.max(hi, L[kk]); }
      if (hi <= lineL + 10 && src[k * 4 + 3] >= 250) continue;
      a = hi > lineL + 10 ? Math.max(0, Math.min(1, (hi - L[k]) / (hi - lineL))) : 0;
      if (src[k * 4 + 3] < 250) { const lr = 0.299 * src[k * 4] + 0.587 * src[k * 4 + 1] + 0.114 * src[k * 4 + 2]; a = Math.max(a, Math.max(0, Math.min(1, (255 - lr) / (255 - lineL)))); }   // a soft outer edge is line over nothing: its own colour says how much
    }
    if (a < 0.05) continue;
    const i = k * 4;
    // The line's own colour here: a core pixel is the line itself; an edge pixel takes the darkest core
    // pixel within two steps. Generators vary the line colour across one picture (Gemini's Naruto: purple
    // outside, brown inside), so each pixel is moved from ITS line's colour to the ink, not by one shift.
    let lc = null;
    if (core[k]) lc = [src[i], src[i + 1], src[i + 2]];
    else {
      const x = k % W, y = (k / W) | 0; let best = 1e9;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const kk = yy * W + xx; if (core[kk] && L[kk] < best) { best = L[kk]; lc = [src[kk * 4], src[kk * 4 + 1], src[kk * 4 + 2]]; } }
      if (!lc) lc = line;
    }
    for (let c = 0; c < 3; c++) p[i + c] = Math.max(0, Math.min(255, Math.round(src[i + c] + a * (ink[c] - lc[c]))));
    n++;
  }
  return n;
}

/**
 * Outline weight: the outer outline of a sprite, thickened to Part I Naruto's weight relative to the
 * figure's height (OUTLINE_RATIO: his outer outline is about 9.3 px on a 1004-px-tall figure). The
 * game draws every sprite at its canon height, so a generator that draws fine lines (ChatGPT draws
 * about half his weight) would look thin beside him. Only the silhouette's outline grows: an ink
 * stroke is added OUTSIDE the figure (the drawing itself is untouched), with an anti-aliased edge.
 * Inner lines (face, folds) stay as drawn. Returns { measured, target, added } in pixels.
 */
export const OUTLINE_RATIO = 0.0093;
export function outlineWeight(p, W, H) {
  const b = bounds(p, W, H); if (!b) return null;
  const figH = b.y1 - b.y0 + 1;
  const runs = [];
  const lum = (i) => 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
  for (let y = b.y0; y <= b.y1; y += 2) for (const dir of [1, -1]) {
    let x = dir > 0 ? 0 : W - 1;
    while (x >= 0 && x < W && p[(y * W + x) * 4 + 3] < 128) x += dir;
    let n = 0;
    while (x >= 0 && x < W && p[(y * W + x) * 4 + 3] >= 128 && lum((y * W + x) * 4) < 80) { n++; x += dir; }
    if (n > 0 && n < figH / 20) runs.push(n);
  }
  if (runs.length < 20) return null;
  runs.sort((u, v) => u - v);
  return { measured: runs[runs.length >> 1], figH };
}
export function matchOutline(p, W, H, { ratio = OUTLINE_RATIO, ink = INK } = {}) {
  const m = outlineWeight(p, W, H); if (!m) return { measured: 0, target: 0, added: 0 };
  const target = ratio * m.figH, add = target - m.measured;
  if (add < 1) return { measured: m.measured, target: Math.round(target * 10) / 10, added: 0 };
  // distance from every see-through pixel to the figure (a two-pass chamfer transform, 1 / √2 steps)
  const N = W * H, INF = 1e9, d = new Float32Array(N);
  for (let k = 0; k < N; k++) d[k] = p[k * 4 + 3] >= 128 ? 0 : INF;
  // Where the stroke goes: the outside (see-through pixels reachable from the picture's border), and every
  // enclosed gap (between an arm and the hip, between the legs) wide enough to take it; a gap narrower than
  // about twice the outline (between fingers, a strap and the body) is left as drawn, so it stays open.
  const outside = new Uint8Array(N); const st = [];
  for (let x = 0; x < W; x++) st.push(x, (H - 1) * W + x); for (let y = 0; y < H; y++) st.push(y * W, y * W + W - 1);
  while (st.length) { const k = st.pop(); if (outside[k] || p[k * 4 + 3] >= 128) continue; outside[k] = 1; const x = k % W, y = (k / W) | 0; if (x > 0) st.push(k - 1); if (x < W - 1) st.push(k + 1); if (y > 0) st.push(k - W); if (y < H - 1) st.push(k + W); }
  const D = Math.SQRT2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x; let v = d[k]; if (v === 0) continue;
    if (x > 0) v = Math.min(v, d[k - 1] + 1);
    if (y > 0) { v = Math.min(v, d[k - W] + 1); if (x > 0) v = Math.min(v, d[k - W - 1] + D); if (x < W - 1) v = Math.min(v, d[k - W + 1] + D); }
    d[k] = v;
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const k = y * W + x; let v = d[k]; if (v === 0) continue;
    if (x < W - 1) v = Math.min(v, d[k + 1] + 1);
    if (y < H - 1) { v = Math.min(v, d[k + W] + 1); if (x < W - 1) v = Math.min(v, d[k + W + 1] + D); if (x > 0) v = Math.min(v, d[k + W - 1] + D); }
    d[k] = v;
  }
  // enclosed gaps: each one's widest point (twice its largest distance to the figure) against twice the outline
  const seen = new Uint8Array(N);
  for (let s0 = 0; s0 < N; s0++) {
    if (seen[s0] || outside[s0] || p[s0 * 4 + 3] >= 128) continue;
    const comp = [s0]; seen[s0] = 1; let maxD = 0;
    for (let ci = 0; ci < comp.length; ci++) {
      const k = comp[ci]; if (d[k] > maxD) maxD = d[k];
      const x = k % W, y = (k / W) | 0;
      for (const kk of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1]) {
        if (kk < 0 || seen[kk] || p[kk * 4 + 3] >= 128) continue; seen[kk] = 1; comp.push(kk);
      }
    }
    if (maxD >= target) for (const k of comp) outside[k] = 1;
  }
  let n = 0;
  for (let k = 0; k < N; k++) {
    const dist = d[k]; if (dist === 0 || dist > add + 1 || !outside[k]) continue;
    const cover = Math.max(0, Math.min(1, add + 0.5 - dist));   // soft last pixel
    const i = k * 4, a0 = p[i + 3] / 255, a = Math.max(a0, cover);
    if (a <= a0) continue;
    // ink under whatever was there (a soft edge pixel keeps its own share)
    for (let c = 0; c < 3; c++) p[i + c] = Math.round((p[i + c] * a0 + ink[c] * (a - a0)) / a);
    p[i + 3] = Math.round(a * 255); n++;
  }
  // The figure's own soft edge, now sealed in by the stroke: back it with ink so it is solid (a partly
  // see-through pixel between the old outline and the new stroke would show the stage as a pale ring).
  for (let k = 0; k < N; k++) {
    const i = k * 4, a0 = p[i + 3]; if (a0 === 0 || a0 === 255 || d[k] !== 0) continue;
    const x = k % W, y = (k / W) | 0; let sealed = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && d[yy * W + xx] > 0 && outside[yy * W + xx] && p[(yy * W + xx) * 4 + 3] > 0) { sealed = true; break; } }
    if (!sealed) continue;
    const f = a0 / 255;
    for (let c = 0; c < 3; c++) p[i + c] = Math.round(p[i + c] * f + ink[c] * (1 - f));
    p[i + 3] = 255; n++;
  }
  return { measured: m.measured, target: Math.round(target * 10) / 10, added: Math.round(add * 10) / 10, pixels: n };
}

/** The outer outline's weight for its figure height (the reference sprite's ratio is every sprite's target). */
export function outlineRatioOf(p, W, H) { const m = outlineWeight(p, W, H); return m ? m.measured / m.figH : null; }

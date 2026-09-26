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
export function keyBackground(p, W, H, { tol = DEFAULTS.tol, soft = DEFAULTS.soft, holeTol = DEFAULTS.holeTol, autoHoleFrac = DEFAULTS.autoHoleFrac, holes = true, bg = null } = {}) {
  bg = bg || backgroundColor(p, W, H);
  const seeds = [];
  for (let x = 0; x < W; x++) { seeds.push([x, 0], [x, H - 1]); }
  for (let y = 0; y < H; y++) { seeds.push([0, y], [W - 1, y]); }
  let n = fadeFrom(p, W, H, bg, seeds, { tol, soft });
  let holeCount = 0;
  if (holes) {
    // Enclosed background: patches the border fill could not reach. They are keyed on a tighter
    // tolerance (a flat generated background is uniform; a shaded white collar is not).
    for (const h of leftovers(p, W, H, bg, { holeTol, minHole: Math.max(DEFAULTS.minHole, Math.round(autoHoleFrac * W * H)) })) {
      holeCount++;
      const k = h.pixels[0];
      n += fadeFrom(p, W, H, bg, [[k % W, (k / W) | 0]], { tol: holeTol, soft: Math.min(soft, 24) });
    }
  }
  defringe(p, W, H);
  return { bg, keyed: n / (W * H), holes: holeCount };
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

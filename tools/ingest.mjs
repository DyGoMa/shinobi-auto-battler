// tools/ingest.mjs — turns the images dropped in /incoming into game assets (docs/ART_BIBLE.md §11).
//   node tools/ingest.mjs [--dry] [--flip id,id] [--only id] [--keep]
// For each /incoming/<name>.(png|jpg|jpeg|webp) whose name matches a manifest entry's `incoming`
// (`naruto_p1`, `sprite_naruto_p1`): validate the size and aspect, key the flat background out
// (any colour: the median of the border, removed by flood fill from the border with a soft edge
// and a grey pull on the fringe so no halo is left), mirror it when asked, crop and resize
// (portraits 256², sprites 512² with the figure bottom-centred), write the WebP to assets/, then
// rewrite assets/index.json and docs/ASSET_CHECKLIST.md and report what is still missing.
// Processed files move to /incoming/done (--keep leaves them). Needs `npm install` (sharp).
import { readdirSync, existsSync, mkdirSync, renameSync, writeFileSync, readFileSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';
import { CONTENT } from '../js/content/index.js';
import { buildManifest, checklistMarkdown, PORTRAIT_PX, SPRITE_PX } from './manifest-lib.mjs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const DRY = flag('--dry'), KEEP = flag('--keep');
const FLIP = new Set((opt('--flip') || '').split(',').filter(Boolean));
const ONLY = opt('--only');
const IN = 'incoming', DONE = join(IN, 'done');
const MIN_SIDE = 512, ASPECT_TOL = 0.12, QUALITY = 82;

const manifest = existsSync('assets/manifest.json') ? JSON.parse(readFileSync('assets/manifest.json', 'utf8')) : buildManifest(CONTENT);
const byIncoming = new Map([...manifest.portraits.map(e => [e.incoming, { ...e, kind: 'portrait' }]), ...manifest.sprites.map(e => [e.incoming, { ...e, kind: 'sprite' }])]);

/** Key out the flat background in place (RGBA buffer). Returns the fraction of pixels removed. */
export function keyBackground(data, W, H, { tol = 58, soft = 46 } = {}) {
  const p = data;
  const border = [];
  for (let x = 0; x < W; x += 3) border.push(x * 4, ((H - 1) * W + x) * 4);
  for (let y = 0; y < H; y += 3) border.push(y * W * 4, (y * W + W - 1) * 4);
  const med = (arr) => { arr.sort((a, b) => a - b); return arr[arr.length >> 1]; };
  const bg = [med(border.map(i => p[i])), med(border.map(i => p[i + 1])), med(border.map(i => p[i + 2]))];
  const dist = (i) => Math.sqrt((p[i] - bg[0]) ** 2 + (p[i + 1] - bg[1]) ** 2 + (p[i + 2] - bg[2]) ** 2);
  const seen = new Uint8Array(W * H); const stack = []; let n = 0;
  const push = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const k = y * W + x; if (seen[k]) return; seen[k] = 1; if (dist(k * 4) < tol + soft) stack.push(k); };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) {
    const k = stack.pop(); const i = k * 4; const dd = dist(i); const a = dd < tol ? 0 : (dd - tol) / soft;
    p[i + 3] = Math.round(p[i + 3] * a); n++;
    if (a > 0 && a < 1) { const grey = (p[i] + p[i + 1] + p[i + 2]) / 3; p[i] = Math.round(grey + (p[i] - grey) * a); p[i + 1] = Math.round(grey + (p[i + 1] - grey) * a); p[i + 2] = Math.round(grey + (p[i + 2] - grey) * a); }
    if (dd < tol) { const x = k % W, y = (k / W) | 0; push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
  }
  return n / (W * H);
}
/** The opaque bounding box of an RGBA buffer (alpha > 8), or null when empty. */
function bounds(data, W, H) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

async function ingestOne(file) {
  const stem = basename(file, extname(file));
  const entry = byIncoming.get(stem);
  if (!entry) return { file, skip: `no manifest entry is called "${stem}" (portraits: <id>, sprites: sprite_<id>)` };
  if (ONLY && entry.id !== ONLY) return null;
  const img = sharp(join(IN, file)).rotate();
  const meta = await img.metadata();
  const w = meta.width, h = meta.height;
  if (!w || !h) return { file, skip: 'unreadable image' };
  if (Math.min(w, h) < MIN_SIDE) return { file, skip: `too small (${w}×${h}; at least ${MIN_SIDE} px on the short side)` };
  if (Math.abs(w / h - 1) > ASPECT_TOL) return { file, skip: `not square (${w}×${h}); generate at 1024 × 1024` };
  // raw RGBA, keyed
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const keyed = keyBackground(data, info.width, info.height);
  const flip = entry.flip || FLIP.has(entry.id);
  let stage = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
  if (flip) stage = stage.flop();
  let out;
  if (entry.kind === 'portrait') {
    const side = Math.min(info.width, info.height);
    out = stage.extract({ left: Math.floor((info.width - side) / 2), top: Math.floor((info.height - side) / 2), width: side, height: side }).resize(PORTRAIT_PX, PORTRAIT_PX, { kernel: 'lanczos3' });
  } else {
    // the figure's opaque box, bottom-centred in a square with a small margin (feet at the bottom)
    const b = bounds(flip ? await stage.raw().toBuffer() : data, info.width, info.height) || { x0: 0, y0: 0, x1: info.width - 1, y1: info.height - 1 };
    const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
    const side = Math.round(Math.max(bw, bh) * 1.06);
    const cut = await stage.extract({ left: b.x0, top: b.y0, width: bw, height: bh }).png().toBuffer();
    // sharp resizes before it composites, so the square is built first and resized in a second pass
    const square = await sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: cut, left: Math.round((side - bw) / 2), top: side - bh - Math.round(side * 0.02) }]).png().toBuffer();
    out = sharp(square).resize(SPRITE_PX, SPRITE_PX, { kernel: 'lanczos3' });
  }
  const target = entry.file;
  if (!DRY) {
    mkdirSync(target.split('/').slice(0, -1).join('/'), { recursive: true });
    await out.webp({ quality: QUALITY, alphaQuality: 90 }).toFile(target);
    if (!KEEP) { mkdirSync(DONE, { recursive: true }); renameSync(join(IN, file), join(DONE, file)); }
  }
  return { file, id: entry.id, kind: entry.kind, target, keyed: Math.round(keyed * 100), flip, size: `${w}×${h}` };
}

async function main() {
  if (!existsSync(IN)) mkdirSync(IN, { recursive: true });
  const files = readdirSync(IN).filter(f => /\.(png|jpe?g|webp)$/i.test(f));
  const results = [];
  for (const f of files) { try { const r = await ingestOne(f); if (r) results.push(r); } catch (e) { results.push({ file: f, skip: `failed: ${e.message}` }); } }
  for (const r of results) console.log(r.skip ? `  ✗ ${r.file}: ${r.skip}` : `  ✓ ${r.file} → ${r.target} (${r.kind}, ${r.size}, ${r.keyed}% keyed${r.flip ? ', mirrored' : ''})${DRY ? ' [dry run]' : ''}`);
  // the index of what exists, and the checklist
  const present = new Set();
  for (const dir of ['assets/portraits', 'assets/sprites']) if (existsSync(dir)) for (const f of readdirSync(dir)) if (f.endsWith('.webp')) present.add(`${dir}/${f}`);
  if (!DRY) {
    writeFileSync('assets/index.json', JSON.stringify({ files: [...present].sort() }, null, 2) + '\n');
    writeFileSync('docs/ASSET_CHECKLIST.md', checklistMarkdown(manifest, present));
  }
  const missingP = manifest.portraits.filter(e => !present.has(e.file)).length, missingS = manifest.sprites.filter(e => !present.has(e.file)).length;
  console.log(`\n${results.filter(r => !r.skip).length} ingested, ${results.filter(r => r.skip).length} skipped. assets/: ${present.size} files. Still missing: ${missingP} of ${manifest.portraits.length} portraits, ${missingS} of ${manifest.sprites.length} sprites (docs/ASSET_CHECKLIST.md).`);
}
main().catch(e => { console.error(e); process.exit(1); });

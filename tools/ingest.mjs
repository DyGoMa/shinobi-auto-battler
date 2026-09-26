// tools/ingest.mjs — turns the images dropped in /incoming into game assets (docs/ART_BIBLE.md §11).
//   node tools/ingest.mjs [--dry] [--flip id,id] [--only id] [--kind portrait|sprite] [--file name.png] [--keep]
// For each /incoming/<name>.(png|jpg|jpeg|webp) whose name matches a manifest entry's `incoming`
// (`naruto_p1`, `sprite_naruto_p1`): validate the size and aspect, key the flat background out
// (any colour: the median of the border, removed by flood fill from the border and then every
// enclosed patch of the same flat colour, with a soft edge and a fringe pass so no halo is left;
// tools/key-lib.mjs, shared with art.html), mirror it when asked, crop and resize
// (portraits 256², sprites 512² with the figure bottom-centred), write the WebP to assets/, then
// rewrite assets/index.json and docs/ASSET_CHECKLIST.md and report what is still missing.
// Processed files move to /incoming/done (--keep leaves them). Needs `npm install` (sharp).
import { readdirSync, existsSync, mkdirSync, renameSync, writeFileSync, readFileSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';
import { CONTENT } from '../js/content/index.js';
import { buildManifest, checklistMarkdown, PORTRAIT_PX, SPRITE_PX } from './manifest-lib.mjs';
import { keyBackground, bounds } from './key-lib.mjs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const DRY = flag('--dry'), KEEP = flag('--keep');
const FLIP = new Set((opt('--flip') || '').split(',').filter(Boolean));
const ONLY = opt('--only');
const KIND = opt('--kind');   // with --only: just that kind (the portrait and the sprite share an id)
const FILE = opt('--file');   // just this file in /incoming (the art page's save)
const IN = 'incoming', DONE = join(IN, 'done');
const MIN_SIDE = 512, ASPECT_TOL = 0.12, QUALITY = 82;

const manifest = existsSync('assets/manifest.json') ? JSON.parse(readFileSync('assets/manifest.json', 'utf8')) : buildManifest(CONTENT);
const byIncoming = new Map([...manifest.portraits.map(e => [e.incoming, { ...e, kind: 'portrait' }]), ...manifest.sprites.map(e => [e.incoming, { ...e, kind: 'sprite' }])]);

async function ingestOne(file) {
  const stem = basename(file, extname(file));
  const entry = byIncoming.get(stem);
  if (!entry) return { file, skip: `no manifest entry is called "${stem}" (portraits: <id>, sprites: sprite_<id>)` };
  if (ONLY && entry.id !== ONLY) return null;
  if (KIND && entry.kind !== KIND) return null;
  const img = sharp(join(IN, file)).rotate();
  const meta = await img.metadata();
  const w = meta.width, h = meta.height;
  if (!w || !h) return { file, skip: 'unreadable image' };
  if (Math.min(w, h) < MIN_SIDE) return { file, skip: `too small (${w}×${h}; at least ${MIN_SIDE} px on the short side)` };
  if (Math.abs(w / h - 1) > ASPECT_TOL) return { file, skip: `not square (${w}×${h}); generate at 1024 × 1024` };
  // raw RGBA, keyed
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { keyed, holes } = keyBackground(data, info.width, info.height);
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
  return { file, id: entry.id, kind: entry.kind, target, keyed: Math.round(keyed * 100), holes, flip, size: `${w}×${h}` };
}

async function main() {
  if (!existsSync(IN)) mkdirSync(IN, { recursive: true });
  const files = readdirSync(IN).filter(f => /\.(png|jpe?g|webp)$/i.test(f) && (!FILE || f === FILE));
  const results = [];
  for (const f of files) { try { const r = await ingestOne(f); if (r) results.push(r); } catch (e) { results.push({ file: f, skip: `failed: ${e.message}` }); } }
  for (const r of results) console.log(r.skip ? `  ✗ ${r.file}: ${r.skip}` : `  ✓ ${r.file} → ${r.target} (${r.kind}, ${r.size}, ${r.keyed}% keyed${r.holes ? `, ${r.holes} enclosed patch${r.holes === 1 ? '' : 'es'} removed` : ''}${r.flip ? ', mirrored' : ''})${DRY ? ' [dry run]' : ''}`);
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

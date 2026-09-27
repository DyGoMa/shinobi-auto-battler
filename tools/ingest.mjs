// tools/ingest.mjs — turns the images dropped in /incoming into game assets (docs/ART_BIBLE.md §11).
//   node tools/ingest.mjs [--dry] [--flip id,id] [--only id] [--kind portrait|sprite] [--file name.png] [--keep]
//                         [--head top,chin]  the head marks for the one sprite being ingested (fractions of its height)
//                         [--index-only] [--mark id:top,chin]  rewrite the index only; --mark sets a saved sprite's marks
//   Sprites: assets/index.json keeps `figures` (path → { top, chin, feet }, fractions of the 512² square): the top of
//   the skull, the chin and the soles. The game scales soles-to-skull to the canon height (js/core/stature.js); a sprite
//   nobody marked gets a guess from its opaque box (auto: true), which the art studio shows until the marks are set.
// For each /incoming/<name>.(png|jpg|jpeg|webp) whose name matches a manifest entry's `incoming`
// (`naruto_p1`, `sprite_naruto_p1`): validate the size and aspect, key the flat background out
// (any colour: the median of the border, removed by flood fill from the border and then every
// enclosed patch of the same flat colour, with a soft edge and a fringe pass so no halo is left;
// tools/key-lib.mjs, shared with art.html), mirror it when asked, crop and resize
// (portraits 256², sprites 512² with the figure bottom-centred), write the WebP to assets/, then
// rewrite assets/index.json and docs/ASSET_CHECKLIST.md and report what is still missing.
// Processed files move to /incoming/done (--keep leaves them). Needs `npm install` (sharp).
import { readdirSync, existsSync, mkdirSync, renameSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { hdOf, PORTRAIT_HD_PX, SPRITE_HD_PX } from '../js/render/Assets.js';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';
import { CONTENT } from '../js/content/index.js';
import { buildManifest, checklistMarkdown, reuseMap, PORTRAIT_PX, SPRITE_PX } from './manifest-lib.mjs';
import { keyBackground, inkLines, matchOutline, outlineRatioOf, bounds } from './key-lib.mjs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const DRY = flag('--dry'), KEEP = flag('--keep');
const FLIP = new Set((opt('--flip') || '').split(',').filter(Boolean));
const ONLY = opt('--only');
const KIND = opt('--kind');   // with --only: just that kind (the portrait and the sprite share an id)
const FILE = opt('--file');   // just this file in /incoming (the art page's save)
const INDEX_ONLY = flag('--index-only');
const HEAD = (opt('--head') || '').split(',').map(Number).filter(n => Number.isFinite(n));   // [top, chin] of the input image
const MARK = (() => { const m = /^([a-z0-9_]+):([\d.]+),([\d.]+)$/.exec(opt('--mark') || ''); return m ? { id: m[1], top: +m[2], chin: +m[3] } : null; })();
const HAIR_GUESS = 0.17;   // unmarked: the top of the skull guessed 17% of the opaque height below its top (Part I Naruto measures that)
const figures = {};        // this run's new figure records, by file
const IN = 'incoming', DONE = join(IN, 'done');
const MIN_SIDE = 512, ASPECT_TOL = 0.12, QUALITY = 82;

const manifest = existsSync('assets/manifest.json') ? JSON.parse(readFileSync('assets/manifest.json', 'utf8')) : buildManifest(CONTENT);
const byIncoming = new Map([...manifest.portraits.map(e => [e.incoming, { ...e, kind: 'portrait' }]), ...manifest.sprites.map(e => [e.incoming, { ...e, kind: 'sprite' }])]);

let refRatioMemo;
/** The reference sprite's outline weight for its height (hd copy first), or null before it exists. */
async function refRatio() {
  if (refRatioMemo !== undefined) return refRatioMemo;
  const f = ['assets/sprites/hd/naruto_p1.webp', 'assets/sprites/naruto_p1.webp'].find(existsSync);
  if (!f) return (refRatioMemo = null);
  const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return (refRatioMemo = outlineRatioOf(new Uint8ClampedArray(data), info.width, info.height));
}

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
  // A picture that arrives already transparent (the art studio keyed it) is not keyed again: its
  // transparent pixels would read as a black background and the keyer would eat the (black) outlines.
  // A generated picture is fully opaque, so any real share of transparency means it was keyed. (The
  // border alone is not enough: a portrait's chest runs off the bottom edge, so part of it is opaque.)
  let clear = 0, sampled = 0;
  for (let k = 0; k < info.width * info.height; k += 7) { sampled++; if (data[k * 4 + 3] < 8) clear++; }
  const preKeyed = clear / sampled > 0.01;
  const { keyed, holes } = preKeyed ? { keyed: 0, holes: 0 } : keyBackground(data, info.width, info.height);
  // outlines to the ink, as the art studio does by default (a studio save arrives already done)
  if (!preKeyed && !flag('--keep-line-colour')) inkLines(data, info.width, info.height);
  // a sprite's outer outline to Part I Naruto's weight, as the art studio does by default
  // (the target weight is the reference sprite's own; Part I Naruto himself sets it and is left as drawn)
  if (!preKeyed && entry.kind === 'sprite' && entry.id !== 'naruto_p1' && !flag('--keep-outline')) matchOutline(data, info.width, info.height, (await refRatio()) ? { ratio: await refRatio() } : {});
  const flip = entry.flip || FLIP.has(entry.id);
  let stage = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
  if (flip) stage = stage.flop();
  let squareBuf, squareSide;   // the finished square at full size: both sizes are made from it
  if (entry.kind === 'portrait') {
    const side = Math.min(info.width, info.height);
    squareBuf = await stage.extract({ left: Math.floor((info.width - side) / 2), top: Math.floor((info.height - side) / 2), width: side, height: side }).png().toBuffer(); squareSide = side;
  } else {
    // the figure's opaque box, bottom-centred in a square with a small margin (feet at the bottom)
    const b = bounds(flip ? await stage.raw().toBuffer() : data, info.width, info.height) || { x0: 0, y0: 0, x1: info.width - 1, y1: info.height - 1 };
    const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
    const side = Math.round(Math.max(bw, bh) * 1.06);
    const cut = await stage.extract({ left: b.x0, top: b.y0, width: bw, height: bh }).png().toBuffer();
    // where the head marks and the soles land in the square (fractions of its side)
    const placeTop = side - bh - Math.round(side * 0.02);
    const inSquare = (yIn) => (placeTop + (yIn - b.y0)) / side;
    const r3 = (n) => Math.round(n * 1000) / 1000;
    const feet = r3(inSquare(b.y1 + 1));
    figures[entry.file] = HEAD.length === 2
      ? { top: r3(inSquare(HEAD[0] * info.height)), chin: r3(inSquare(HEAD[1] * info.height)), feet }
      : { top: r3(inSquare(b.y0 + HAIR_GUESS * bh)), chin: null, feet, auto: true };
    // sharp resizes before it composites, so the square is built first and resized in a second pass
    const square = await sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: cut, left: Math.round((side - bw) / 2), top: side - bh - Math.round(side * 0.02) }]).png().toBuffer();
    squareBuf = square; squareSide = side;
  }
  // Two sizes (js/render/Assets.js): the standard file (256 / 512) and the hd copy (768 / 1024) in an hd/
  // folder beside it. The hd copy is only made when the picture has the detail for it (no upscaling).
  const px = entry.kind === 'portrait' ? PORTRAIT_PX : SPRITE_PX, hdPx = entry.kind === 'portrait' ? PORTRAIT_HD_PX : SPRITE_HD_PX;
  const out = sharp(squareBuf).resize(px, px, { kernel: 'lanczos3' });
  const outHd = squareSide >= hdPx * 0.9 ? sharp(squareBuf).resize(hdPx, hdPx, { kernel: 'lanczos3' }) : null;
  const target = entry.file;
  if (!DRY) {
    mkdirSync(target.split('/').slice(0, -1).join('/'), { recursive: true });
    await out.webp({ quality: QUALITY, alphaQuality: 90 }).toFile(target);
    const hdTarget = hdOf(target);
    if (outHd) { mkdirSync(hdTarget.split('/').slice(0, -1).join('/'), { recursive: true }); await outHd.webp({ quality: QUALITY, alphaQuality: 90 }).toFile(hdTarget); }
    else if (existsSync(hdTarget)) unlinkSync(hdTarget);   // an older hd copy of a replaced picture would show the old art
    if (!KEEP) { mkdirSync(DONE, { recursive: true }); renameSync(join(IN, file), join(DONE, file)); }
  }
  return { file, id: entry.id, kind: entry.kind, target, hd: !!outHd, keyed: Math.round(keyed * 100), holes, flip, size: `${w}×${h}` };
}

async function main() {
  if (!existsSync(IN)) mkdirSync(IN, { recursive: true });
  const files = INDEX_ONLY ? [] : readdirSync(IN).filter(f => /\.(png|jpe?g|webp)$/i.test(f) && (!FILE || f === FILE));
  const results = [];
  for (const f of files) { try { const r = await ingestOne(f); if (r) results.push(r); } catch (e) { results.push({ file: f, skip: `failed: ${e.message}` }); } }
  for (const r of results) console.log(r.skip ? `  ✗ ${r.file}: ${r.skip}` : `  ✓ ${r.file} → ${r.target} (${r.kind}, ${r.size}, ${r.keyed}% keyed${r.holes ? `, ${r.holes} enclosed patch${r.holes === 1 ? '' : 'es'} removed` : ''}${r.flip ? ', mirrored' : ''}${r.hd ? ', + hd copy' : ', no hd copy (under ' + (r.kind === 'portrait' ? PORTRAIT_HD_PX : SPRITE_HD_PX) * 0.9 + ' px of detail)'})${DRY ? ' [dry run]' : ''}`);
  // the index of what exists, and the checklist
  const present = new Set();
  for (const dir of ['assets/portraits', 'assets/sprites', 'assets/portraits/hd', 'assets/sprites/hd']) if (existsSync(dir)) for (const f of readdirSync(dir)) if (f.endsWith('.webp')) present.add(`${dir}/${f}`);
  if (!DRY) {
    // figures: this run's, else the ones already in the index, else a guess from the file's opaque box
    const old = existsSync('assets/index.json') ? (JSON.parse(readFileSync('assets/index.json', 'utf8')).figures || {}) : {};
    const figs = {};
    for (const f of [...present].sort()) if (f.startsWith('assets/sprites/') && !f.startsWith('assets/sprites/hd/')) figs[f] = figures[f] || (old[f] && !old[f].auto ? old[f] : await guessFigure(f));
    if (MARK) {
      const f = `assets/sprites/${MARK.id}.webp`;
      if (!figs[f]) throw new Error(`no sprite ${f} to mark`);
      figs[f] = { top: MARK.top, chin: MARK.chin, feet: figs[f].feet };
      console.log(`  ✓ head marks for ${f}: top of the skull ${MARK.top}, chin ${MARK.chin}`);
    }
    writeFileSync('assets/index.json', JSON.stringify({ files: [...present].sort(), reuse: reuseMap(manifest), figures: figs }, null, 2) + '\n');
    writeFileSync('docs/ASSET_CHECKLIST.md', checklistMarkdown(manifest, present));
  }
  const missingP = manifest.portraits.filter(e => !present.has(e.file)).length, missingS = manifest.sprites.filter(e => !present.has(e.file)).length;
  console.log(`\n${results.filter(r => !r.skip).length} ingested, ${results.filter(r => r.skip).length} skipped. assets/: ${present.size} files. Still missing: ${missingP} of ${manifest.portraits.length} portraits, ${missingS} of ${manifest.sprites.length} sprites (docs/ASSET_CHECKLIST.md).`);
}
/** An unmarked sprite's figure record from its opaque box: the soles at the bottom, the skull guessed below the hair. */
async function guessFigure(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const b = bounds(data, info.width, info.height);
  const r3 = (n) => Math.round(n * 1000) / 1000;
  if (!b) return { top: 0.16, chin: null, feet: 0.98, auto: true };
  const bh = b.y1 - b.y0 + 1;
  return { top: r3((b.y0 + HAIR_GUESS * bh) / info.height), chin: null, feet: r3((b.y1 + 1) / info.height), auto: true };
}

main().catch(e => { console.error(e); process.exit(1); });

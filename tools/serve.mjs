// tools/serve.mjs — zero-dependency static file server for local testing, plus the art page's
// three local endpoints (art.html; docs/ART_BIBLE.md §11). Never deployed: Pages serves the tree.
//   npm run serve            -> http://localhost:8080   (the game; art.html is the art studio)
//   PORT=5173 npm run serve
//
//   POST /api/art/save    { id, kind, incoming, flip, leftover, png }  the page's keyed PNG (a data
//                         URL) is written to /incoming/<incoming>.png and `node tools/ingest.mjs
//                         --only <id>` turns it into the game's WebP; the ingest log comes back.
//   POST /api/art/prompt  { id, kind, prompt }  keeps the user's wording for that image in
//                         assets/art-overrides.json (prompt null = back to the generated one) and
//                         regenerates assets/manifest.json through tools/manifest.mjs.
//   GET  /api/art/originals   the files in /incoming and /incoming/done (to reprocess an original).
//   GET  /api/art/references  the anime reference pictures in /references, per studio entry id
import { createServer } from 'node:http';
import { readFile, stat, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const OVERRIDES = join(ROOT, 'assets', 'art-overrides.json');
const SAFE_ID = /^[a-z0-9_]+$/;

const json = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
const readBody = (req, limit = 40 * 1024 * 1024) => new Promise((resolve, reject) => {
  const chunks = []; let n = 0;
  req.on('data', (c) => { n += c.length; if (n > limit) { reject(new Error('body too large')); req.destroy(); return; } chunks.push(c); });
  req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(e); } });
  req.on('error', reject);
});
const run = (args) => new Promise((resolve) => execFile(process.execPath, args, { cwd: ROOT, windowsHide: true, maxBuffer: 8 * 1024 * 1024 }, (err, stdout, stderr) => resolve({ ok: !err, log: String(stdout || '') + String(stderr || '') })));
async function loadOverrides() { try { return JSON.parse(await readFile(OVERRIDES, 'utf8')); } catch { return { prompts: {}, status: {} }; } }
async function saveOverrides(o) { await writeFile(OVERRIDES, JSON.stringify(o, null, 2) + '\n'); }

async function api(req, res, path) {
  if (req.method === 'GET' && path === '/api/art/originals') {
    const out = {};
    for (const dir of ['incoming', 'incoming/done']) { try { for (const f of await readdir(join(ROOT, dir))) if (/\.(png|jpe?g|webp)$/i.test(f)) out[f.replace(/\.[^.]+$/, '')] = `${dir}/${f}`; } catch { /* no folder yet */ } }
    return json(res, 200, { ok: true, files: out });
  }
  // the anime reference pictures (references/<entry id>_<n>.png, kept out of git): { files: { entryId: [paths] } }
  if (req.method === 'GET' && path === '/api/art/references') {
    const out = {};
    try { for (const f of (await readdir(join(ROOT, 'references'))).sort()) { const m = f.match(/^(.+)_(\d+)\.(png|jpe?g|webp)$/i); if (m) (out[m[1]] ||= []).push(`references/${f}`); } } catch { /* no folder yet */ }
    return json(res, 200, { ok: true, files: out });
  }
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
  const body = await readBody(req);
  if (path === '/api/art/meta') {
    // per-image notes: which generator made it (gemini | chatgpt | other | '')
    const { id, kind, generator } = body;
    if (!SAFE_ID.test(String(id)) || !['portrait', 'sprite'].includes(kind) || !['', 'gemini', 'chatgpt', 'other'].includes(String(generator ?? ''))) return json(res, 400, { ok: false, error: 'bad id, kind or generator' });
    const o = await loadOverrides(); o.meta = o.meta || {};
    const k = `${kind}:${id}`; o.meta[k] = { ...(o.meta[k] || {}), generator: generator || '' };
    await saveOverrides(o);
    return json(res, 200, { ok: true });
  }
  if (path === '/api/art/prompt') {
    const { id, kind, prompt, base, tab } = body;
    const pk = `${kind}:${id}` + (tab === 'chatgpt' ? '@chatgpt' : '');   // each prompt tab keeps its own wording
    if (!SAFE_ID.test(String(id)) || !['portrait', 'sprite'].includes(kind)) return json(res, 400, { ok: false, error: 'bad id or kind' });
    const o = await loadOverrides(); o.prompts = o.prompts || {};
    // base: the generated prompt the user's wording was made from, so the page can show what the generator changed since
    o.base = o.base || {};
    if (prompt && String(prompt).trim()) { o.prompts[pk] = String(prompt); if (typeof base === 'string') o.base[pk] = base; }
    else { delete o.prompts[pk]; delete o.base[pk]; }
    await saveOverrides(o);
    const r = await run(['tools/manifest.mjs']);
    return json(res, 200, { ok: r.ok, log: r.log, override: !!o.prompts[pk] });
  }
  if (path === '/api/art/save') {
    const { id, kind, incoming, flip, leftover, png, head } = body;
    if (!SAFE_ID.test(String(id)) || !SAFE_ID.test(String(incoming)) || !['portrait', 'sprite'].includes(kind)) return json(res, 400, { ok: false, error: 'bad id, kind or incoming name' });
    const m = /^data:image\/png;base64,(.+)$/.exec(String(png || ''));
    if (!m) return json(res, 400, { ok: false, error: 'png must be a PNG data URL' });
    await mkdir(join(ROOT, 'incoming'), { recursive: true });
    const file = join(ROOT, 'incoming', `${incoming}.png`);
    await writeFile(file, Buffer.from(m[1], 'base64'));
    const args = ['tools/ingest.mjs', '--only', id, '--kind', kind, '--file', `${incoming}.png`]; if (flip) args.push('--flip', id);
    // a sprite's head marks (the top of the skull and the chin, fractions of the picture's height)
    const frac = (n) => Number.isFinite(+n) && +n >= 0 && +n <= 1;
    if (kind === 'sprite' && Array.isArray(head) && head.length === 2 && head.every(frac) && +head[0] < +head[1]) args.push('--head', `${+head[0]},${+head[1]}`);
    const r = await run(args);
    const o = await loadOverrides(); o.status = o.status || {};
    o.status[`${kind}:${id}`] = { savedAt: new Date().toISOString(), leftover: Number(leftover) || 0, flip: !!flip };
    await saveOverrides(o);
    const target = `assets/${kind === 'portrait' ? 'portraits' : 'sprites'}/${id}.webp`;
    return json(res, 200, { ok: r.ok && existsSync(join(ROOT, target)), log: r.log, file: target });
  }
  if (path === '/api/art/marks') {
    // head marks for a sprite already in the game: only the index changes (tools/ingest.mjs --index-only --mark)
    const { id, top, chin } = body;
    const frac = (n) => Number.isFinite(+n) && +n >= 0 && +n <= 1;
    if (!SAFE_ID.test(String(id)) || !frac(top) || !frac(chin) || +top >= +chin) return json(res, 400, { ok: false, error: 'bad id or marks' });
    const r = await run(['tools/ingest.mjs', '--index-only', '--mark', `${id}:${+top},${+chin}`]);
    return json(res, 200, { ok: r.ok, log: r.log });
  }
  return json(res, 404, { ok: false, error: 'no such endpoint' });
}

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.startsWith('/api/')) { try { await api(req, res, path); } catch (e) { json(res, 500, { ok: false, error: String(e.message || e) }); } return; }
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(normalize(ROOT))) { res.writeHead(403); res.end('Forbidden'); return; }
    const s = await stat(file).catch(() => null);
    if (!s || !s.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found: ' + path); return; }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(file));
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}).listen(PORT, () => console.log(`Serving ${ROOT} at http://localhost:${PORT}  (art studio: /art.html)`));

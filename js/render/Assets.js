// Assets.js — the image registry. The game asks for a portrait or a sprite by character id
// and era; the registry answers with an Image once one is loaded, or null, and the caller
// draws the code-drawn fallback (Figure.js) meanwhile or forever. Nothing here ever throws
// or blocks a battle: a missing file is remembered for the session and never requested again.
//
// Which files exist is read once from assets/index.json (written by tools/ingest.mjs), so
// the game never fires hundreds of 404s: only listed files are fetched. No index → nothing
// is loaded and every slot stays code-drawn, which is how the game ships before the art.
//
// The index also carries `reuse`: enemy id → the id whose art it wears (the art manifest's
// reuse list, e.g. every Survival Test Kakashi → kakashi). An id with no file of its own
// resolves through it, so a roster ninja fought as an enemy shows their full art, mirrored
// by the side they stand on.
//
// Naming (tools/manifest.mjs is the source of truth):
//   assets/portraits/<id>.webp        the character's default era (the era it is unlocked in)
//   assets/portraits/<id>_p1.webp     the Part I outfit of a character who fights in both parts
//   assets/portraits/<id>_p2.webp     the Shippuden outfit, likewise
//   assets/sprites/<id>.webp          the full-body still (same era rules with _p1 / _p2)
export const ERAS = ['p1', 'p2'];

const registry = {
  ready: false,           // the index has been read (or failed)
  files: new Set(),       // paths that exist, from assets/index.json
  reuse: new Map(),       // enemy id → the id whose art it wears, from assets/index.json
  images: new Map(),      // path → Image (loaded) | null (failed)
  loading: new Map(),     // path → Promise
  listeners: new Map(),   // path → Set<fn>
  base: '',               // resolved from the page (the game lives under /shinobi-auto-battler/ on Pages)
};

/** Read assets/index.json once. Resolves to the number of known files (0 when there is none). */
export async function loadIndex({ fetchFn = globalThis.fetch, base = null } = {}) {
  registry.base = base ?? (typeof location !== 'undefined' ? new URL('./', location.href).href : '');
  if (registry.ready) return registry.files.size;
  try {
    const res = await fetchFn(registry.base + 'assets/index.json', { cache: 'no-cache' });
    if (res.ok) {
      const j = await res.json();
      for (const f of j.files || []) registry.files.add(String(f));
      for (const [id, uses] of Object.entries(j.reuse || {})) registry.reuse.set(String(id), String(uses));
    }
  } catch { /* offline, or no art yet */ }
  registry.ready = true;
  return registry.files.size;
}
/** For tests and tools: seed the index without a fetch. */
export function setIndex(files, reuse = {}) { registry.files = new Set(files); registry.reuse = new Map(Object.entries(reuse)); registry.ready = true; }
/** The id whose art `id` wears when it has none of its own (or null). */
export function reusedId(id) { return registry.reuse.get(id) || null; }
export function known(path) { return registry.files.has(path); }

/** The candidate files for a portrait, best first: the era's outfit, then the default. */
export function portraitCandidates(id, era = null) {
  const c = [];
  if (era) c.push(`assets/portraits/${id}_${era}.webp`);
  c.push(`assets/portraits/${id}.webp`);
  for (const e of ERAS) if (e !== era) c.push(`assets/portraits/${id}_${e}.webp`);
  return c;
}
export function spriteCandidates(id, era = null) {
  const c = [];
  if (era) c.push(`assets/sprites/${id}_${era}.webp`);
  c.push(`assets/sprites/${id}.webp`);
  for (const e of ERAS) if (e !== era) c.push(`assets/sprites/${id}_${e}.webp`);
  return c;
}
/** The first candidate that exists in the index, or null. */
// An id's own files win; with none, the art it reuses (its roster twin or an earlier fight's enemy).
export function portraitPath(id, era = null) { const r = reusedId(id); return portraitCandidates(id, era).find(known) || (r && portraitCandidates(r, era).find(known)) || null; }
export function spritePath(id, era = null) { const r = reusedId(id); return spriteCandidates(id, era).find(known) || (r && spriteCandidates(r, era).find(known)) || null; }

/** The loaded image for a path (or null), starting the download if it has not started. */
export function image(path) {
  if (!path) return null;
  if (registry.images.has(path)) return registry.images.get(path);
  load(path);
  return null;
}
/** Load a known path. Resolves to the Image, or null when it fails; never rejects. */
export function load(path) {
  if (!path || !known(path)) return Promise.resolve(null);
  if (registry.images.has(path)) return Promise.resolve(registry.images.get(path));
  if (registry.loading.has(path)) return registry.loading.get(path);
  const p = new Promise((resolve) => {
    if (typeof Image === 'undefined') { resolve(null); return; }
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => { registry.images.set(path, img); registry.loading.delete(path); notify(path, img); resolve(img); };
    img.onerror = () => { registry.images.set(path, null); registry.loading.delete(path); notify(path, null); resolve(null); };
    img.src = registry.base + path;
  });
  registry.loading.set(path, p);
  return p;
}
function notify(path, img) { const set = registry.listeners.get(path); if (!set) return; registry.listeners.delete(path); for (const fn of set) { try { fn(img); } catch (e) { console.warn('[assets]', e); } } }
/** Call `fn(image)` once when `path` finishes loading (at once if it already has). */
export function onLoad(path, fn) {
  if (!path) return;
  if (registry.images.has(path)) { fn(registry.images.get(path)); return; }
  if (!registry.listeners.has(path)) registry.listeners.set(path, new Set());
  registry.listeners.get(path).add(fn);
  load(path);
}
/** Warm the images a battle or a screen needs. Resolves when they are all settled. */
export function preload(paths) { return Promise.all(paths.filter(Boolean).map(load)); }

/** The portrait Image for a character id in an era, or null (and it starts loading). */
export function portrait(id, era = null) { return image(portraitPath(id, era)); }
export function sprite(id, era = null) { return image(spritePath(id, era)); }

/** Every asset a set of unit keys needs in an era (portraits and sprites), for preloading. */
export function pathsFor(ids, era = null) {
  const out = [];
  for (const id of ids) { const p = portraitPath(id, era), s = spritePath(id, era); if (p) out.push(p); if (s) out.push(s); }
  return out;
}

/** The era ('p1' or 'p2') of a story part number; anything else is Part II's look. */
export function eraOfPart(part) { return part === 1 ? 'p1' : 'p2'; }

export const _registry = registry;   // tests

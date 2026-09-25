// sw.js — the service worker that makes the game installable (with manifest.webmanifest).
// Deliberately minimal, so an update can never get stuck:
//   * NETWORK FIRST for every same-origin GET (index.html, version.json, JS, CSS,
//     icons). The response is cached as it passes through; the cache is only used
//     when the network fails (offline). There is no cache-first path for code, and every
//     fetch revalidates with the server (cache: no-cache), so a new deploy is picked up
//     on the next launch as long as the phone is online.
//   * A new sw.js installs at once (skipWaiting) and takes over every open page
//     (clients.claim); old caches are deleted on activate.
//   * Cross-origin requests (the Firebase SDK on gstatic, Google sign-in, Firestore)
//     are never touched.
// Registered by js/ui/pwa.js from index.html's directory, so its scope is the game's
// own path (/shinobi-auto-battler/ on GitHub Pages, / on a local server).
const CACHE = 'shinobi-auto-battler-v1';

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => { if (e.data?.type === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(networkFirst(req, url));
});

/** The cache key: the URL without its query (version.json?t=… and index.html?debug=1 share one entry). */
const keyFor = (url) => url.origin + url.pathname;

async function networkFirst(req, url) {
  const cache = await caches.open(CACHE);
  try {
    // Revalidate with the server every time (GitHub Pages sends max-age=600): a reload after
    // a deploy never mixes old and new files. Pages answers unchanged files with a 304.
    // (A navigate-mode Request cannot take an init, so it is refetched by URL.)
    const res = req.mode === 'navigate' ? await fetch(req.url, { cache: 'no-cache' }) : await fetch(req, { cache: 'no-cache' });
    if (res && res.ok && res.type === 'basic') cache.put(keyFor(url), res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const hit = await cache.match(keyFor(url));
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const shell = await cache.match(new URL('./index.html', self.registration.scope).href) || await cache.match(self.registration.scope);
      if (shell) return shell;
    }
    return new Response('Offline, and this file is not cached yet.', { status: 503, statusText: 'Offline', headers: { 'Content-Type': 'text/plain' } });
  }
}

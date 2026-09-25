// pwa.js — the browser side of the installable app: registers sw.js, keeps the
// install prompt (beforeinstallprompt) for Settings, and watches for a new build.
// The decisions live in js/core/Pwa.js (tested); this file only talks to the browser.
//
// Updates: sw.js is network-first, so a new deploy is used on the next launch by
// itself. While the app is open, every return to the front (and Settings' "Check for
// updates") re-reads version.json; a different commit shows a sticky
// "Update ready — tap to reload" toast. The player is never left on an old build
// without being told.
import { isStandalone, updateAvailable, shouldCheckForUpdate, UPDATE_CHECK_MIN_MS } from '../core/Pwa.js';
import { loadBuildInfo } from '../core/Version.js';

export const UPDATE_READY_TEXT = 'Update ready — tap to reload';

/** Sets up game.pwa. `ui()` returns the UIManager once it exists. */
export function setupPwa(game, ui) {
  const pwa = {
    standalone: isStandalone(),
    ua: navigator.userAgent || '',
    maxTouchPoints: navigator.maxTouchPoints || 0,
    prompt: null,            // the saved beforeinstallprompt event, while an install is possible
    registration: null,
    updateReady: false,
    lastCheckedAt: 0,
    get canPrompt() { return !!this.prompt; },
    /** Settings → Install app. Resolves 'accepted' | 'dismissed' | null (no prompt). */
    async install() {
      const e = this.prompt; if (!e) return null;
      this.prompt = null;
      try { e.prompt(); const r = await e.userChoice; return r?.outcome || null; }
      catch (err) { console.warn('[pwa] install prompt failed', err); return null; }
      finally { refreshSettings(); }
    },
    /** The same page in the browser (Android: shares the app's sign-in). */
    openInBrowser() { try { window.open(location.href, '_blank', 'noopener'); } catch { location.href = location.href; } },
    /** Re-read version.json now. Resolves true when a newer build is live (and the toast is up). */
    async checkForUpdate({ force = false } = {}) {
      if (this.updateReady) { offerUpdate(); return true; }
      if (!force && !shouldCheckForUpdate(this.lastCheckedAt, Date.now(), UPDATE_CHECK_MIN_MS)) return false;
      this.lastCheckedAt = Date.now();
      try { await this.registration?.update(); } catch { /* offline, or no SW */ }
      const latest = await loadBuildInfo();
      if (!updateAvailable(game.build, latest)) return false;
      this.updateReady = true; this.latest = latest;
      offerUpdate();
      return true;
    },
  };
  game.pwa = pwa;

  const refreshSettings = () => { const u = ui(); if (u && u.current === 'settings' && !u.battle) u.refresh(); };
  const offerUpdate = () => {
    const u = ui(); if (!u) return;
    u.toast(UPDATE_READY_TEXT, 'good', () => location.reload(), { sticky: true });
  };

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); pwa.prompt = e; refreshSettings(); });
  window.addEventListener('appinstalled', () => { pwa.prompt = null; ui()?.toast('Installed. Open the game from your home screen for the full-screen version.', 'good'); refreshSettings(); });
  try { window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => { pwa.standalone = e.matches || isStandalone(); refreshSettings(); }); } catch { /* old browser */ }

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    // Registered from index.html's directory: the scope is the game's own path.
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .then((reg) => { pwa.registration = reg; })
      .catch((e) => console.warn('[pwa] service worker registration failed', e));
  }
  // Back to the front (the phone's app switcher, the screen turning on): look for a new build.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pwa.checkForUpdate().catch(() => {}); });
  return pwa;
}

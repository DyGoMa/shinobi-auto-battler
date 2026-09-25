// Pwa.js — the installable-app logic with no DOM: which install option Settings
// offers, when a new build counts as an update, and when to look for one. The
// browser glue (service worker, beforeinstallprompt, the update toast) is
// js/ui/pwa.js; tools/test-core.mjs tests this file.

/** True inside an installed app (Android/desktop Chrome's standalone window, or iOS's home-screen web app). */
export function isStandalone({ matchMedia = globalThis.matchMedia, navigator = globalThis.navigator } = {}) {
  try { if (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) return true; } catch { /* no matchMedia */ }
  return navigator?.standalone === true;
}

/** iPhone, iPad or iPod (an iPad on iPadOS 13+ says "Macintosh" but has a touch screen). */
export function isIOS(ua = '', maxTouchPoints = 0) {
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
}

/**
 * What the Settings "App" card shows.
 *   installed  running as an installed app: no button
 *   prompt     Chrome/Edge (Android, desktop) gave us beforeinstallprompt: an Install button
 *   ios        Safari has no prompt: "Share > Add to Home Screen"
 *   manual     everything else: the browser's own menu
 */
export function installModel({ standalone = false, canPrompt = false, ua = '', maxTouchPoints = 0 } = {}) {
  if (standalone) return { kind: 'installed', title: 'Installed as an app', text: 'The game runs full screen from your home screen. Updates arrive on their own: each time the app opens or comes back to the front it checks for a new build, and shows "Update ready" when there is one.' };
  if (canPrompt) return { kind: 'prompt', title: 'Install the app', text: 'Runs full screen from your home screen, with no browser bars, and keeps working offline for the screens you have opened.', button: '📲 Install app' };
  if (isIOS(ua, maxTouchPoints)) return { kind: 'ios', title: 'Add to your Home Screen', text: 'In Safari, tap Share (the square with an arrow), then "Add to Home Screen". The game then opens full screen, like an app.' };
  return { kind: 'manual', title: 'Install the app', text: 'In Chrome, open the ⋮ menu and choose "Add to Home screen" or "Install app". Samsung Internet, Edge and Firefox have the same option in their menu. The game then runs full screen, with no browser bars.' };
}

/** A newer build is live: both stamps are real (not "dev") and the commit differs. */
export function updateAvailable(current, latest) {
  if (!current || !latest || current.dev || latest.dev) return false;
  return !!current.sha && !!latest.sha && current.sha !== latest.sha;
}

/** How often at most the app re-reads version.json when it comes back to the front. */
export const UPDATE_CHECK_MIN_MS = 60 * 1000;

/** True when enough time has passed since the last check (or there was none). */
export function shouldCheckForUpdate(lastCheckedAt, now, minMs = UPDATE_CHECK_MIN_MS) {
  return !lastCheckedAt || now - lastCheckedAt >= minMs;
}

/**
 * Google sign-in inside the installed app can fail where a browser tab would succeed
 * (the sign-in window opens outside the app). On Android the installed app shares its
 * storage with Chrome, so signing in there signs the app in too: offer that. iOS
 * home-screen apps have their own storage, so there is nothing to offer.
 */
export function signInFallback({ standalone = false, ua = '', maxTouchPoints = 0 } = {}) {
  if (!standalone || isIOS(ua, maxTouchPoints)) return null;
  return { label: '🌐 Open in the browser to sign in', text: 'Sign in there, then come back to the app: they share the same sign-in on Android.' };
}

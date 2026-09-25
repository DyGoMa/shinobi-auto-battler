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
 *   safari     an iOS in-app or non-Safari browser: open the page in Safari (a Copy link button)
 *   ios        Safari has no prompt: "Share > Add to Home Screen"
 *   manual     everything else: the browser's own menu
 */
export function installModel({ standalone = false, canPrompt = false, ua = '', maxTouchPoints = 0 } = {}) {
  if (standalone) return { kind: 'installed', title: 'Installed as an app', text: 'The game runs full screen from your home screen. Updates arrive on their own: each time the app opens or comes back to the front it checks for a new build, and shows "Update ready" when there is one.' };
  if (canPrompt) return { kind: 'prompt', title: 'Install the app', text: 'Runs full screen from your home screen, with no browser bars, and keeps working offline for the screens you have opened.', button: '📲 Install app' };
  if (iosNeedsSafari(ua, maxTouchPoints)) return { kind: 'safari', title: 'Open in Safari to install', text: 'This browser can\'t add the game to your Home Screen. Open this page in Safari, then tap Share and "Add to Home Screen".', button: '📋 Copy link' };
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

// ---------------------------------------------------------------------------
// 0.11.2: suggesting the install to phone players (js/ui/install.js draws it)
// ---------------------------------------------------------------------------

/** A phone or tablet: a touch screen, and either a mobile user agent or a narrow window. Never a desktop. */
export function isPhone({ ua = '', maxTouchPoints = 0, width = 1280 } = {}) {
  const touch = maxTouchPoints > 0;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile|Silk|Tablet/i.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
  return touch && (mobileUa || width <= 820);
}

/** iOS browsers that can't add the page to the Home Screen themselves: in-app browsers (Instagram, Facebook, …) and non-Safari browsers. */
export function iosNeedsSafari(ua = '', maxTouchPoints = 0) {
  if (!isIOS(ua, maxTouchPoints)) return false;
  if (!/Safari\//.test(ua)) return true;   // an in-app web view: no "Safari/" token
  return /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|MicroMessenger|Snapchat|TikTok|BytedanceWebview|GSA\/|DuckDuckGo|YaBrowser|Brave/i.test(ua);
}

/**
 * What an Install tap does on this browser.
 *   installed  already an app: nothing to do
 *   prompt     Chrome/Edge on Android gave us beforeinstallprompt: the real install dialog, one tap
 *   android    Android without the event (Samsung Internet, Firefox, or not fired yet): illustrated menu steps
 *   ios        Safari on an iPhone/iPad: Share → Add to Home Screen → Add
 *   safari     an iOS in-app browser or a non-Safari iOS browser: open the page in Safari (copy the link)
 */
export function installPlan({ standalone = false, canPrompt = false, ua = '', maxTouchPoints = 0 } = {}) {
  if (standalone) return 'installed';
  if (canPrompt) return 'prompt';
  if (iosNeedsSafari(ua, maxTouchPoints)) return 'safari';
  if (isIOS(ua, maxTouchPoints)) return 'ios';
  return 'android';
}

/** The reminder banners after "Not now": the first at least 3 days later, the next at least 7 days after that, then never. */
export const REMINDER_DAYS = [3, 7];
export const DAY_MS = 24 * 60 * 60 * 1000;

/** The per-device install-prompt record (localStorage, never the cloud save). */
export function emptyNudge() { return { popupAt: 0, dismissals: [], installedAt: 0 }; }

/** A record read back from storage, with anything odd replaced. */
export function sanitizeNudge(raw) {
  const n = emptyNudge();
  if (!raw || typeof raw !== 'object') return n;
  const num = (v) => (Number.isFinite(v) && v > 0 ? v : 0);
  n.popupAt = num(raw.popupAt);
  n.installedAt = num(raw.installedAt);
  n.dismissals = Array.isArray(raw.dismissals) ? raw.dismissals.map(num).filter(Boolean).slice(0, REMINDER_DAYS.length + 1) : [];
  return n;
}

/**
 * Which install suggestions to show, from the device, the app state, the save and the record.
 *   notice  the start-menu card: any phone that hasn't installed (it stays until then)
 *   popup   the one-time benefits dialog: once the tutorial is done, never twice
 *   banner  the slim reminder above the tab bar: after "Not now", at REMINDER_DAYS intervals, then never
 * Nothing on a desktop, nothing inside the installed app (standalone, or an install recorded).
 * The caller keeps the popup off a battle, another dialog and the intro.
 */
export function installPrompts({ phone = false, standalone = false, tutorialDone = false, nudge = emptyNudge(), now = Date.now() } = {}) {
  const none = { notice: false, popup: false, banner: false };
  if (!phone || standalone || nudge.installedAt) return none;
  const popup = tutorialDone && !nudge.popupAt;
  const d = nudge.dismissals;
  const step = d.length;   // 1 after Not now, 2 after the first banner, …
  const banner = !!nudge.popupAt && step >= 1 && step <= REMINDER_DAYS.length && now - d[step - 1] >= REMINDER_DAYS[step - 1] * DAY_MS;
  return { notice: true, popup, banner: banner && !popup };
}

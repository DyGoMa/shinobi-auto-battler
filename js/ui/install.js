// install.js — suggesting the installed app to phone players (0.11.2): the
// start-menu notice, the one-time popup after the tutorial, the slim reminder
// banner above the tab bar, and the Install flow itself (the real prompt where
// the browser has one, illustrated steps everywhere else). The decisions are in
// js/core/Pwa.js (isPhone, installPlan, installPrompts: tested); this file draws
// them. Everything is per device, in localStorage (LocalBackend prefs), never in
// the cloud save: installing is something a phone does, not an account.
import { h, btn } from './dom.js';
import { LocalBackend } from '../save/LocalBackend.js';
import { isPhone, installPlan, installPrompts, sanitizeNudge, emptyNudge, DAY_MS } from '../core/Pwa.js';

const PREF = 'installNudge';
export const INSTALLED_TEXT = 'Installed! Open it from your home screen.';

const readNudge = () => sanitizeNudge(LocalBackend.getPref(PREF, null));
const writeNudge = (n) => LocalBackend.setPref(PREF, n);

// ---------------------------------------------------------------------------
// Inline SVG icons for the steps (no image files: the app draws everything itself)
// ---------------------------------------------------------------------------
const svg = (inner, label) => h('span.ins-ico', { role: 'img', 'aria-label': label, html: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>` });
/** iOS Share: a square with an arrow rising out of it. */
const shareIcon = () => svg('<path d="M12 15V4"/><path d="M8.5 7.5 12 4l3.5 3.5"/><path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v6A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H16"/>', 'the Share button');
/** "Add to Home Screen": a rounded square with a plus. */
const addIcon = () => svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8.5v7M8.5 12h7"/>', 'Add to Home Screen');
/** Chrome's ⋮ menu. */
const menuIcon = () => svg('<circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"/>', 'the browser menu');
/** A home screen: a phone with a grid of app icons. */
const homeIcon = () => svg('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><rect x="8.5" y="6" width="2.6" height="2.6" rx=".6" fill="currentColor" stroke="none"/><rect x="12.9" y="6" width="2.6" height="2.6" rx=".6" fill="currentColor" stroke="none"/><rect x="8.5" y="10.4" width="2.6" height="2.6" rx=".6" fill="currentColor" stroke="none"/><rect x="12.9" y="10.4" width="2.6" height="2.6" rx=".6" fill="currentColor" stroke="none"/><path d="M10.5 18.5h3"/>', 'your home screen');
/** Safari's compass. */
const safariIcon = () => svg('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z" fill="currentColor" stroke="none"/>', 'Safari');

const step = (icon, ...text) => h('li.ins-step', icon, h('div', ...text));

/** Sets up game.install: the state, the flows and the three surfaces. `ui()` returns the UIManager once it exists. */
export function setupInstall(game, ui) {
  const pwa = game.pwa;
  const install = {
    nudge: readNudge(),
    /** Computed once per launch (enterGame): the banner shows for the session or not at all. */
    launch: null,
    debugPhone: false,   // ?debug=1 panel: pretend this is a phone
    flags() {
      return { phone: this.debugPhone || isPhone({ ua: pwa.ua, maxTouchPoints: pwa.maxTouchPoints, width: Math.min(window.innerWidth, window.innerHeight) }), standalone: pwa.standalone };
    },
    prompts({ now = Date.now() } = {}) {
      return installPrompts({ ...this.flags(), tutorialDone: game.state?.tutorial?.status === 'done', nudge: this.nudge, now });
    },
    plan() { return installPlan({ standalone: pwa.standalone, canPrompt: pwa.canPrompt, ua: pwa.ua, maxTouchPoints: pwa.maxTouchPoints }); },
    save() { writeNudge(this.nudge); },
    /** "Not now", the banner's ✕, a declined prompt: one more dismissal, which schedules the next reminder. */
    dismiss(now = Date.now()) { this.nudge.dismissals.push(now); this.save(); },
    /** The popup has been shown on this device: never again. */
    markPopup(now = Date.now()) { if (!this.nudge.popupAt) { this.nudge.popupAt = now; this.save(); } },
    /** appinstalled, or the app running standalone: hide every suggestion and say so once. */
    onInstalled({ toast = true } = {}) {
      if (!this.nudge.installedAt) { this.nudge.installedAt = Date.now(); this.save(); }
      this.launch = null;
      hideBanner();
      if (this._closeDialog) this._closeDialog();
      const u = ui(); if (!u) return;
      if (toast) u.toast(INSTALLED_TEXT, 'good');
      if ((u.current === 'start' || u.current === 'settings') && !u.battle) u.refresh();
    },
    /** beforeinstallprompt fired: the browser says the app is not installed (it was removed, say). */
    onInstallable() {
      if (this.nudge.installedAt) { this.nudge.installedAt = 0; this.save(); }
      const u = ui(); if (u && u.current === 'start' && !u.battle) u.refresh();
    },
    /** The game has been entered: decide the banner for this launch and mount it. */
    onLaunch() {
      this.launch = this.prompts();
      if (this.launch.banner) mountBanner(game, ui());
    },
    /** The one-time popup, when it is safe: Home, no battle, no other dialog, no intro. */
    offerPopup() {
      const u = ui(); if (!u || u.startPending || u.current !== 'home' || u.battle || u._modals.length || document.getElementById('intro')) return false;
      if (!this.prompts().popup) return false;
      showPopup(game, u);
      return true;
    },
    /** The Install tap: the real prompt, or the steps for this browser. `track`: closing without installing counts as a dismissal (popup and banner only). */
    async start({ track = false } = {}) {
      const u = ui(); if (!u) return;
      const plan = this.plan();
      if (plan === 'installed') { this.onInstalled({ toast: false }); return; }
      if (plan === 'prompt') {
        const r = await pwa.install();
        if (r === 'accepted') { u.toast('Installing… Open the game from your home screen when it is done.', 'good'); return; }
        if (track) this.dismiss();
        if (r === 'dismissed') u.toast('Install cancelled. The option stays in Settings → App.');
        else if (r === null) showSteps(game, u, this.plan(), { track: false });   // the prompt was lost: show the steps instead
        return;
      }
      showSteps(game, u, plan, { track });
    },
    /** ?debug=1: fake the reminder timers and the device. */
    debug: {
      rewind(days) { const n = install.nudge; n.popupAt = n.popupAt ? n.popupAt - days * DAY_MS : 0; n.dismissals = n.dismissals.map(t => t - days * DAY_MS); install.save(); },
      reset() { install.nudge = emptyNudge(); install.save(); install.launch = null; hideBanner(); },
      relaunch() { hideBanner(); install.onLaunch(); const u = ui(); if (u && !u.battle) u.refresh(); },
    },
  };
  game.install = install;
  return install;
}

// ---------------------------------------------------------------------------
// 1. The start-menu notice: visible, not blocking, stays until the app is installed
// ---------------------------------------------------------------------------
export function installNotice(game, ui) {
  const inst = game.install;
  if (!inst || !inst.prompts().notice) return null;
  return h('div.install-notice', { role: 'note' },
    h('span.ins-emoji', { 'aria-hidden': 'true' }, '📲'),
    h('div.ins-text', h('b', 'Play full screen'), h('span.tiny.muted', 'Install the app: no browser bars, same save.')),
    btn('Install', () => inst.start(), 'primary small'));
}

// ---------------------------------------------------------------------------
// 2. The popup: once, in plain words, Install or Not now
// ---------------------------------------------------------------------------
function showPopup(game, ui) {
  const inst = game.install;
  inst.markPopup();
  let acted = false;
  const close = ui.modal(h('div.center.install-popup',
    h('div.big-emoji', { 'aria-hidden': 'true' }, '📲'),
    h('h2', 'Play it as an app'),
    h('p', 'Install Shinobi Auto-Battler on this phone. It takes a moment and changes nothing about your save.'),
    h('ul.install-perks',
      h('li', h('b', 'Full screen.'), ' No browser bars around the battle.'),
      h('li', h('b', 'One tap away.'), ' Opens from your home screen like any app.'),
      h('li', h('b', 'Same save.'), ' Your progress and your account carry over.')),
    h('div.actions', { style: { justifyContent: 'center' } },
      btn('Not now', () => { acted = true; inst.dismiss(); close(); }, 'ghost'),
      btn('📲 Install', () => { acted = true; close(); inst.start({ track: true }); }, 'primary big')),
  ), { label: 'Install the app', onClose: () => { inst._closeDialog = null; if (!acted) { acted = true; inst.dismiss(); } } });
  inst._closeDialog = close;
}

// ---------------------------------------------------------------------------
// 3. The reminder banner above the tab bar (Install / ✕)
// ---------------------------------------------------------------------------
function bannerRoot() { return document.getElementById('install-banner'); }
function hideBanner() { const b = bannerRoot(); if (b) { b.hidden = true; b.replaceChildren(); } }
function mountBanner(game, ui) {
  const inst = game.install, b = bannerRoot();
  if (!b || !ui) return;
  b.replaceChildren(
    h('span.ins-emoji', { 'aria-hidden': 'true' }, '📲'),
    h('span.ins-text', 'Play full screen: install the app'),
    btn('Install', () => { hideBanner(); inst.start({ track: true }); }, 'primary small'),
    btn('✕', () => { inst.dismiss(); hideBanner(); }, 'ghost small ins-close', { 'aria-label': 'Not now' }));
  b.hidden = false;
}

// ---------------------------------------------------------------------------
// 4. The steps, per browser
// ---------------------------------------------------------------------------
/** The illustrated steps for `plan` ('android' | 'ios' | 'safari'). Exported for Settings → App → "Show me how". */
export function showSteps(game, ui, plan, { track = false } = {}) {
  const inst = game.install;
  // Closing the steps without installing, from the popup or the banner (track), is a "not now": the reminders continue.
  const done = () => close();
  let closed = false, title, body, extra = null;
  if (plan === 'ios') {
    title = 'Add to your Home Screen';
    body = h('ol.ins-steps',
      step(shareIcon(), 'Tap ', h('b', 'Share'), ' in Safari\'s toolbar (the square with an arrow, at the bottom of the screen; on an iPad, at the top).'),
      step(addIcon(), 'Scroll down the sheet and tap ', h('b', 'Add to Home Screen'), '.'),
      step(homeIcon(), 'Tap ', h('b', 'Add'), ' (top right). The game is now on your Home Screen: open it from there.'));
  } else if (plan === 'safari') {
    title = 'Open in Safari to install';
    body = h('div',
      h('p', 'This browser can\'t add the game to your Home Screen, but Safari can.'),
      h('ol.ins-steps',
        step(safariIcon(), 'Copy the link below, open ', h('b', 'Safari'), ' and paste it in the address bar.'),
        step(shareIcon(), 'Tap ', h('b', 'Share'), ', then ', h('b', 'Add to Home Screen'), ', then ', h('b', 'Add'), '.')));
    const link = pageLink();
    const field = h('input.ins-link', { type: 'text', readonly: true, value: link, 'aria-label': 'The game\'s link' });
    extra = h('div.ins-copy', field, btn('📋 Copy link', () => copyLink(ui, link, field), 'primary small'));
  } else {
    title = 'Install from the browser menu';
    body = h('ol.ins-steps',
      step(menuIcon(), 'Open the browser ', h('b', 'menu'), ': ⋮ at the top right in Chrome and Edge, ≡ at the bottom right in Samsung Internet.'),
      step(addIcon(), 'Tap ', h('b', 'Install app'), ' or ', h('b', 'Add to Home screen'), ' (Firefox: ', h('b', 'Add to Home screen'), ').'),
      step(homeIcon(), 'Confirm with ', h('b', 'Install'), ' or ', h('b', 'Add'), ', then open the game from your home screen.'));
  }
  const close = ui.modal(h('div.install-steps',
    h('h2', title), body, extra,
    h('p.small.muted', 'Installed, the game runs full screen, with no browser bars, and keeps your save.'),
    h('div.actions', btn('Got it', done, 'primary'))),
  { label: title, onClose: () => { if (closed) return; closed = true; if (track && inst && !inst.nudge.installedAt) inst.dismiss(); if (inst) inst._closeDialog = null; } });
  if (inst) inst._closeDialog = close;
  return close;
}

/** The page's own link, without a hash or query. */
export function pageLink() { try { return location.href.split('#')[0].split('?')[0]; } catch { return ''; } }

async function copyLink(ui, link, field) {
  try { await navigator.clipboard.writeText(link); ui.toast('Link copied. Paste it into Safari.', 'good'); }
  catch { try { field.focus(); field.select(); } catch { /* ignore */ } ui.toast('Select the link and copy it yourself.'); }
}

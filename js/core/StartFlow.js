// StartFlow.js — the decisions behind the start of the game, kept pure so
// tools/test-core.mjs can check them: how long the splash and the intro scene
// run, whether the intro has been seen on this device, and (the start menu)
// which buttons the menu offers for a given cloud-save state.
import { LocalBackend } from '../save/LocalBackend.js';

/** Intro timings in ms. The whole intro (splash + scene) stays under maxMs. */
export const INTRO = {
  splashFirst: 800,    // the splash on the first visit
  splashAgain: 500,    // the splash once the intro has been seen (no scene)
  run: 1100,           // silhouettes run across the screen
  slam: 900,           // the title slams in, shake and flash, then a short hold
  reducedTitle: 700,   // prefers-reduced-motion: the title fades in instead
  fadeOut: 300,        // the overlay fading away
  maxMs: 3000,
};

const INTRO_SEEN_PREF = 'introSeen';
export function introSeen() { return !!LocalBackend.getPref(INTRO_SEEN_PREF, false); }
export function setIntroSeen(v = true) { LocalBackend.setPref(INTRO_SEEN_PREF, !!v); }

/**
 * What the intro shows. seen: the device has seen it (short splash only, unless
 * full: Settings → Replay intro). reducedMotion: no run, shake or flash, just fades.
 * Returns { splashMs, scene, effects, totalMs }.
 */
export function introPlan({ seen = false, reducedMotion = false, full = false } = {}) {
  if (seen && !full) return { splashMs: INTRO.splashAgain, scene: false, effects: false, totalMs: INTRO.splashAgain };
  const effects = !reducedMotion;
  const sceneMs = effects ? INTRO.run + INTRO.slam : INTRO.reducedTitle;
  return { splashMs: INTRO.splashFirst, scene: true, effects, totalMs: INTRO.splashFirst + sceneMs };
}

/**
 * What the start menu offers for a cloud-save state (SaveManager.cloudState()).
 *   primary   one Continue/Play button: { label, sub }, or null
 *   guest     offer "Continue as guest" (creates the anonymous session)
 *   google    'signIn' (no session yet) | 'link' (a guest can link) | null
 *   retry     offer "Try again" (cloud save could not be reached)
 *   busy      a status line while the session is being checked (buttons wait)
 *   message   a line under the buttons (an error, say)
 * Nothing is created until the player picks guest or Google: a browser with no
 * session gets those two and no Continue.
 */
export function menuModel(cs, { hasProgress = false, redirectError = null } = {}) {
  const m = { primary: null, guest: false, google: null, retry: false, busy: null, message: redirectError || null };
  switch (cs.kind) {
    case 'off':        // cloud save not configured: local saves only
      m.primary = { label: hasProgress ? '▶ Continue' : '▶ Play', sub: hasProgress ? 'Saved on this device' : 'A new game, saved on this device' };
      break;
    case 'connecting':
      m.busy = 'Checking your account…';
      break;
    case 'error':
      m.primary = { label: '▶ Play offline', sub: 'Saved on this device only' };
      m.retry = true;
      m.message = m.message || 'Couldn’t reach cloud save. You can play now; your progress uploads once you sign in.';
      break;
    case 'guest':
      m.primary = { label: '▶ Continue', sub: 'Guest save' };
      m.google = 'link';
      break;
    case 'google':
      m.primary = { label: '▶ Continue', sub: `Signed in as ${cs.name || cs.account}` };
      break;
    default:           // signedOut: no session on this browser yet
      m.guest = true;
      m.google = 'signIn';
  }
  return m;
}

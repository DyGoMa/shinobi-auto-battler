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

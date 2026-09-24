// Intro.js — the splash and intro scene on load, as a fixed overlay above the
// whole app (the game loads and renders behind it). StartFlow.introPlan decides
// how long it runs and with which effects:
//   splash   the brand mark and the title fade in and out
//   scene    ninja silhouettes (the battle token shape, in CSS) run across the
//            screen, then the title slams in with a screen shake and a flash
//   reduced  prefers-reduced-motion: no run, shake or flash, the title fades in
// Tap anywhere, the Skip button or the Android back button ends it early.
import { h, btn } from './dom.js';
import { INTRO } from '../core/StartFlow.js';

export function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/** Plays the intro. Returns { skip(), done: Promise } (done resolves when it ends or is skipped). */
export function playIntro(plan, { onDone = null } = {}) {
  const root = h('div#intro', { role: 'dialog', 'aria-label': 'Intro' });
  const splash = h('div.intro-splash', h('div.brand-mark.big', { 'aria-hidden': 'true' }, '忍'), h('div.intro-name', 'Shinobi Auto-Battler'));
  const skip = btn('Skip', () => finish(), 'ghost small intro-skip', { 'aria-label': 'Skip the intro' });
  root.append(splash, skip);
  document.body.appendChild(root);

  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  let finished = false, resolve;
  const done = new Promise((r) => { resolve = r; });
  // Android back (and the browser's back button) skips: one history entry to pop.
  const onPop = () => finish();
  try { history.pushState({ intro: true }, ''); window.addEventListener('popstate', onPop); } catch { /* file:// */ }
  const finish = () => {
    if (finished) return; finished = true;
    for (const t of timers) clearTimeout(t);
    window.removeEventListener('popstate', onPop);
    root.classList.add('out');
    setTimeout(() => root.remove(), INTRO.fadeOut);
    if (onDone) onDone();
    resolve();
  };
  root.addEventListener('pointerdown', (e) => { if (!skip.contains(e.target)) finish(); });

  // Timeline
  const t0 = plan.splashMs;
  at(Math.max(0, t0 - 200), () => splash.classList.add('out'));
  if (!plan.scene) { at(t0, finish); return { skip: finish, done }; }
  at(t0, () => {
    splash.remove();
    const title = h('div.intro-title', h('div.brand-mark.big', { 'aria-hidden': 'true' }, '忍'), h('h1', 'Shinobi Auto-Battler'), h('p', 'A fan-made Naruto auto-battler'));
    const scene = h('div.intro-scene', h('div.intro-ground', { 'aria-hidden': 'true' }), title);
    if (plan.effects) {
      // Five silhouettes: staggered starts, three depths (scale and lane), a walk bob.
      const lanes = [[0, 1.7, 0], [110, 1.45, 14], [240, 1.9, -12], [380, 1.55, 6], [520, 1.7, -5]];
      for (const [delay, scale, dy] of lanes) {
        const runner = h('div.runner', { 'aria-hidden': 'true' }, h('div.bob', h('div.head'), h('div.body')));
        // Custom properties need setProperty (h()'s style object can't set them).
        runner.style.setProperty('--d', `${delay}ms`); runner.style.setProperty('--s', String(scale)); runner.style.setProperty('--dy', `${dy}px`);
        scene.appendChild(runner);
      }
      at(t0 + INTRO.run, () => {
        title.classList.add('slam');
        root.classList.add('shake');
        scene.appendChild(h('div.intro-flash', { 'aria-hidden': 'true' }));
      });
      at(t0 + INTRO.run + INTRO.slam, finish);
    } else {
      title.classList.add('fade');
      at(t0 + INTRO.reducedTitle, finish);
    }
    root.appendChild(scene);
  });
  return { skip: finish, done };
}

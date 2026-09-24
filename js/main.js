// main.js — boots the game: content validation, saves (local + optional
// Firebase cloud), audio, UI and the ?debug=1 panel.
import { BALANCE } from './config/balance.js';
import { CONTENT, validateContent } from './content/index.js';
import { SaveManager } from './core/SaveManager.js';
import { LocalBackend } from './save/LocalBackend.js';
import { FirebaseBackend } from './save/FirebaseBackend.js';
import { AudioManager } from './audio/AudioManager.js';
import { UIManager } from './ui/UIManager.js';
import { DebugPanel } from './ui/DebugPanel.js';
import { makeRng } from './core/formulas.js';
import { checkAchievements, recordDayPlayed } from './core/Achievements.js';
import { h } from './ui/dom.js';
import { playIntro, prefersReducedMotion } from './ui/Intro.js';
import { introPlan, introSeen, setIntroSeen } from './core/StartFlow.js';
import { loadBuildInfo, formatBuild } from './core/Version.js';

async function boot() {
  // The intro starts first, so the splash is up while the game loads behind it.
  const intro = playIntro(introPlan({ seen: introSeen(), reducedMotion: prefersReducedMotion() }));
  setIntroSeen();
  const errs = validateContent(CONTENT);
  if (errs.length) console.warn(`[content] ${errs.length} validation problem(s):\n` + errs.join('\n'));

  const audio = new AudioManager();
  const local = new LocalBackend();
  const cloud = new FirebaseBackend();
  const debug = new URLSearchParams(location.search).get('debug') === '1';

  const game = { C: CONTENT, B: BALANCE, audio, cloud, debug, rng: makeRng((Date.now() ^ (Math.random() * 1e9)) >>> 0) };
  let ui = null;

  const save = new SaveManager({
    local, cloud: cloud.configured ? cloud : null, content: CONTENT, balance: BALANCE,
    onCloudNewer: async (remote) => {
      if (!ui) return false;
      const when = (t) => (t ? new Date(t).toLocaleString() : 'unknown');
      const progress = (s) => `${Object.keys(s?.progress?.cleared || {}).length} battles cleared, ${Object.keys(s?.roster || {}).length} ninja`;
      return ui.confirm('Cloud save is newer — load it?', h('div',
        h('p', 'A newer save was found in the cloud for this account.'),
        h('dl.kv', h('dt', 'Cloud save'), h('dd', `${progress(remote.data)} · ${when(remote.updatedAt)}`),
          h('dt', 'This device'), h('dd', `${progress(save.state)} · ${when(save.state?.updatedAt)}`)),
        h('p.small.muted', 'The save you don\'t pick is replaced by the one you do.')),
      { okText: 'Load cloud save', cancelText: 'Keep this device\'s save' });
    },
  });
  await save.init();
  game.save = save;
  Object.defineProperty(game, 'state', { get: () => save.state });
  // Cloud save: restore the session this browser already has, while the intro plays.
  // Nothing is created here; the start menu asks the player (guest or Google).
  const connecting = save.connectCloud();
  // Achievements unlock by themselves: on load (so existing saves unlock what they already
  // qualify for) and after every change. Claiming happens on the Achievements screen.
  const unlockNow = (s) => { recordDayPlayed(s); return checkAchievements(s, CONTENT, BALANCE); };
  const retro = unlockNow(save.state);
  if (retro.length) save.save('achievements');
  game.commit = (reason) => {
    const fresh = unlockNow(save.state);
    save.save(reason);
    if (ui) { ui.refreshTop(); if (fresh.length) ui.achievementsUnlocked(fresh); }
  };
  audio.setMuted(!!save.state.settings.muted);

  // The build stamp on the menu and in Settings: version.json is written by the Pages
  // deploy; a local checkout has none and shows "dev".
  game.build = formatBuild(null);
  loadBuildInfo().then((b) => { game.build = b; if (['start', 'settings'].includes(ui.current) && !ui.battle) ui.refresh(); });
  ui = new UIManager(game);
  game.ui = ui;
  ui.init();

  let lastState = save.state;
  save.onChange((s) => {
    if (s !== lastState) {
      lastState = s; audio.setMuted(!!s.settings.muted);
      const fresh = unlockNow(s);
      if (fresh.length) save.save('achievements');
      ui.onStateReplaced();
      if (fresh.length) ui.achievementsUnlocked(fresh, { summary: true });
    }
    if (ui.current === 'start' && !ui.battle) ui.refresh();   // the menu follows the cloud state
    ui.refreshTop();
  });

  // Leaving the start menu: Continue, "Continue as guest" or "Sign in with Google" all end here.
  let entered = false;
  game.enterGame = async ({ signedIn = false, switched = false } = {}) => {
    if (entered) return; entered = true;
    ui.enterGame();
    if (retro.length) ui.achievementsUnlocked(retro, { summary: true });
    if (debug) new DebugPanel(game, ui).mount();
    if (cloud.ready) {
      // A Google account (linked now or on another device) counts for "Linked Up".
      if (!cloud.isAnonymous && !game.state.account.googleLinked) { game.state.account.googleLinked = true; game.commit('account'); }
      // A newer cloud save is offered first, then this one uploads (Settings uses the same flow after a sign-in).
      await save.afterSignIn();
      if (signedIn) ui.toast(switched ? 'Signed in to your existing Google save.' : cloud.displayName ? `Signed in as ${cloud.displayName}.` : 'Cloud save is on (guest).', 'good');
      if (ui.current === 'settings' && !ui.battle) ui.refresh();
    }
  };
  // Back from a Google redirect (phones): straight into the game. An error stays on the menu, which shows it.
  connecting.then(() => {
    const r = cloud.redirectResult;
    if (r?.ok) { intro.skip(); game.enterGame({ signedIn: true, switched: !!r.switched }); }
  }).catch((e) => console.warn('[cloud]', e));
  // Couldn't reach cloud save (offline at start, say): try again when the connection comes back.
  window.addEventListener('online', () => {
    if (save.cloudState().kind !== 'error') return;
    save.initCloud().then(() => { if (ui.current === 'settings' && !ui.battle) ui.refresh(); }).catch((e) => console.warn('[cloud]', e));
  });

  window.__game = game; // handy for debugging in the console
}

window.addEventListener('error', (e) => console.error('[error]', e.error || e.message));
window.addEventListener('unhandledrejection', (e) => console.error('[unhandled promise]', e.reason));

boot().catch((e) => {
  console.error('[boot] failed', e);
  window.showBootError?.(String(e && e.message || e));   // index.html
});

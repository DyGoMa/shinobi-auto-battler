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
import { h } from './ui/dom.js';

async function boot() {
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
      const r = remote.data || {};
      const cleared = Object.keys(r.progress?.cleared || {}).length;
      return ui.confirm('Cloud save is newer — load it?', h('div',
        h('p', 'A newer save was found in the cloud for this account.'),
        h('dl.kv', h('dt', 'Cloud save'), h('dd', when(remote.updatedAt)), h('dt', 'This device'), h('dd', when(save.state?.updatedAt)),
          h('dt', 'Cloud progress'), h('dd', `${cleared} battles cleared, ${Object.keys(r.roster || {}).length} ninja`))),
      { okText: 'Load cloud save', cancelText: 'Keep this device\'s save' });
    },
  });
  await save.init();
  game.save = save;
  Object.defineProperty(game, 'state', { get: () => save.state });
  game.commit = (reason) => { save.save(reason); if (ui) ui.refreshTop(); };
  audio.setMuted(!!save.state.settings.muted);

  ui = new UIManager(game);
  game.ui = ui;
  ui.init();

  let lastState = save.state;
  save.onChange((s) => {
    if (s !== lastState) { lastState = s; audio.setMuted(!!s.settings.muted); ui.onStateReplaced(); }
    ui.refreshTop();
  });

  if (debug) new DebugPanel(game, ui).mount();

  // Cloud save connects in the background; never blocks or crashes the game.
  save.initCloud().then(() => { if (ui.current === 'settings' && !ui.battle) ui.refresh(); }).catch((e) => console.warn('[cloud]', e));

  window.__game = game; // handy for debugging in the console
}

window.addEventListener('error', (e) => console.error('[error]', e.error || e.message));
window.addEventListener('unhandledrejection', (e) => console.error('[unhandled promise]', e.reason));

boot().catch((e) => {
  console.error('[boot] failed', e);
  const el = document.getElementById('screen');
  if (el) el.innerHTML = `<div class="screen"><div class="card"><h2>Could not start the game</h2><p>${String(e && e.message || e)}</p><p class="small">Try reloading. If it keeps happening, reset your save from the browser's site settings.</p></div></div>`;
});
